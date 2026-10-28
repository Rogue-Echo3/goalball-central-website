const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../backend/AdminAuth.gs'), 'utf8');
const claims = {aud:'goalball-central-app',iss:'https://securetoken.google.com/goalball-central-app',sub:'admin-uid',exp:Math.floor(Date.now()/1000)+300};
const token = value => 'header.'+Buffer.from(JSON.stringify(value)).toString('base64url')+'.signature';
function setup(options={}){
  const calls=[]; let released=false;
  const properties={FIREBASE_WEB_API_KEY:'test-key',GOALBALL_ADMIN_UIDS:'admin-uid',...options.properties};
  const context=vm.createContext({
    PropertiesService:{getScriptProperties:()=>({getProperty:key=>properties[key]})},
    UrlFetchApp:{fetch:(url,request)=>{calls.push({url,request});return {getResponseCode:()=>options.status||200,getContentText:()=>JSON.stringify({users:[options.account||{localId:'admin-uid'}]})};}},
    Utilities:{base64DecodeWebSafe:value=>Buffer.from(value,'base64url'),newBlob:value=>({getDataAsString:()=>value.toString()})},
    ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({setMimeType:()=>JSON.parse(text)})},
    LockService:{getScriptLock:()=>({tryLock:()=>options.lock!==false,releaseLock:()=>{released=true;}})},
    goalballLegacyPost:event=>{calls.push({legacy:JSON.parse(event.postData.contents)});if(options.legacyThrows)throw Error('Write failed');return {success:true};}
  });
  vm.runInContext(source,context);
  const post=body=>context.doPost({postData:{contents:JSON.stringify(body)}});
  return {post,raw:text=>context.doPost({postData:{contents:text}}),calls,released:()=>released};
}
const valid={action:'saveFinalScore',idToken:token(claims),sheetRow:2,teamAScore:0,teamBScore:4};
test('missing token, malformed JSON, unknown action and missing configuration fail closed',()=>{
  const x=setup(); assert.equal(x.post({action:'updatePools'}).success,false);
  assert.equal(x.raw('{broken json').success,false);
  assert.equal(x.post({...valid,action:'deleteEverything'}).success,false);
  assert.equal(setup({properties:{GOALBALL_ADMIN_UIDS:''}}).post(valid).success,false);
  assert.equal(x.calls.length,0);
});
for(const [label,options,overrides] of [
  ['invalid token',{status:400},{}],
  ['disabled account',{account:{localId:'admin-uid',disabled:true}},{}],
  ['non-admin',{account:{localId:'other'}},{}],
  ['wrong project',{}, {aud:'other'}],
  ['expired token',{}, {exp:1}],
  ['wrong issuer',{}, {iss:'other'}]
]) test(label+' cannot write',()=>{
  const x=setup(options); assert.equal(x.post({...valid,idToken:token({...claims,...overrides})}).success,false);
  assert.equal(x.calls.filter(c=>c.legacy).length,0);
});
test('authorize checks administrator without dispatching writes',()=>{
  const x=setup();assert.equal(x.post({action:'authorize',idToken:token(claims)}).success,true);
  assert.equal(x.calls.filter(c=>c.legacy).length,0);
});
test('authorized score writes strip token, validate zero scores, and release lock',()=>{
  const x=setup();assert.equal(x.post({...valid,untrusted:'ignored'}).success,true);
  assert.deepEqual(x.calls.find(c=>c.legacy).legacy,{action:'saveFinalScore',sheetRow:2,teamAScore:0,teamBScore:4});
  assert.equal(x.released(),true);
});
test('invalid score or row cannot reach the legacy handler',()=>{
  for(const changes of [{sheetRow:1},{sheetRow:'2'},{teamAScore:-1},{teamBScore:1.5},{teamBScore:1000}]){
    const x=setup();assert.equal(x.post({...valid,...changes}).success,false);assert.equal(x.calls.filter(c=>c.legacy).length,0);
  }
});
test('pool update dispatch and contention',()=>{
  assert.equal(setup().post({action:'updatePools',idToken:token(claims)}).success,true);
  const x=setup({lock:false});assert.equal(x.post(valid).success,false);assert.equal(x.calls.filter(c=>c.legacy).length,0);
});
test('legacy write failure still releases lock',()=>{
  const x=setup({legacyThrows:true});assert.equal(x.post(valid).success,false);assert.equal(x.released(),true);
});
