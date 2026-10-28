const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname,'../admin/admin.js'),'utf8').replace(/^import .*;\n/,'').split('\ntry {\n  const [appSdk')[0];
class Element {
  constructor(){this.value='';this.options=[];this.children=[];this.hidden=true;this.disabled=false;this.textContent='';this.handlers={};this.classList={toggle:()=>false};}
  addEventListener(name,fn){this.handlers[name]=fn;}
  setAttribute(name,value){this[name]=value;}
  replaceChildren(...children){this.children=children;this.options=children;}
  add(child){this.options.push(child);}
  focus(){}
}
async function setup(protectedUrl='https://example.test/admin'){
  const elements={}, requests=[];
  const get=id=>elements[id]||=new Element();
  const schedule=[
    {_sheetRow:8,'Team A':'Alpha','Team B':'Bravo',Year:'2026',Location:'New Jersey',Result:''},
    {_sheetRow:3,'Team A':'Charlie','Team B':'Delta',Year:'2026',Location:'Atlanta',Result:'0-2'},
    {_sheetRow:11,'Team A':'Echo','Team B':'Foxtrot',Year:'2026',Location:'New Jersey',Result:''}
  ];
  const ctx=vm.createContext({
    document:{getElementById:get,querySelectorAll:()=>[],createElement:()=>new Element()},
    Option:function(text,value){this.text=text;this.value=value;},
    scheduleUrl:'https://example.test/schedules',protectedAdminUrl:protectedUrl,
    AbortSignal,URL,console,confirm:()=>true,
    fetch:async(url,options={})=>{
      requests.push({url:String(url),options});
      return {ok:true,json:async()=>options.method==='POST'?{success:true}:({results:schedule}),text:async()=>'<html><head></head><body>Scouting</body></html>'};
    }
  });
  vm.runInContext(source,ctx);
  vm.runInContext('sdk={signOut:async()=>{}};auth={};',ctx);
  get('unfinished').checked=true;
  return {ctx,get,requests,run:code=>vm.runInContext(code,ctx)};
}
test('signed-out users see login and no dashboard or scouting frame',async()=>{
  const x=await setup();await x.run('authChanged(null)');
  assert.equal(x.get('dashboard').hidden,true);assert.equal(x.get('loginPanel').hidden,false);assert.equal(x.get('scoutContainer').children.length,0);
});
test('configured endpoint authorizes before showing tools',async()=>{
  const x=await setup();await x.run('authChanged({uid:"one",email:"a@example.test",getIdToken:async()=>"test-token"})');
  assert.equal(x.get('dashboard').hidden,false);
  assert.deepEqual(JSON.parse(x.requests[0].options.body),{action:'authorize',idToken:'test-token'});
});
test('unconfigured backend never enables live writes',async()=>{
  const x=await setup('');await x.run('authChanged({uid:"one"})');
  assert.equal(x.get('updatePools').disabled,true);assert.equal(x.get('saveScore').disabled,true);
  await assert.rejects(x.run('adminRequest("updatePools")'));assert.equal(x.requests.length,0);
});
test('filters retain sheet order and show unfinished and completed games correctly',async()=>{
  const x=await setup();await x.run('authChanged({uid:"one",getIdToken:async()=>"token"})');await x.run('loadGames()');
  assert.deepEqual(x.get('game').options.map(o=>o.value),['','8','11']);
  x.get('unfinished').checked=false;x.run('renderGames()');assert.deepEqual(x.get('game').options.map(o=>o.value),['','8','3','11']);
  x.get('search').value='charlie';x.run('renderGames()');assert.deepEqual(x.get('game').options.map(o=>o.value),['','3']);
  x.get('game').value='3';x.run('selectGame()');assert.equal(x.get('scoreA').value,'0');assert.equal(x.get('scoreB').value,'2');
});
test('writes include fresh ID token and expected row and scores',async()=>{
  const x=await setup();await x.run('authChanged({uid:"one",getIdToken:async()=>"fresh-token"})');
  await x.run('adminRequest("saveFinalScore",{sheetRow:8,teamAScore:0,teamBScore:3})');
  assert.deepEqual(JSON.parse(x.requests.at(-1).options.body),{sheetRow:8,teamAScore:0,teamBScore:3,action:'saveFinalScore',idToken:'fresh-token'});
});
test('scouting frames have account-specific storage and are removed on sign-out',async()=>{
  const x=await setup();await x.run('authChanged({uid:"one",getIdToken:async()=>"t"})');await x.run('openView("scouting")');
  assert.match(x.get('scoutContainer').children[0].srcdoc,/goalballScouting:one/);
  await x.run('authChanged(null)');assert.equal(x.get('scoutContainer').children.length,0);
  await x.run('authChanged({uid:"two",getIdToken:async()=>"t"})');await x.run('openView("scouting")');assert.match(x.get('scoutContainer').children[0].srcdoc,/goalballScouting:two/);
});
test('failed administrator verification keeps dashboard hidden',async()=>{
  const x=await setup();x.ctx.fetch=async()=>({ok:true,json:async()=>({success:false,error:'Not allowed'})});
  await x.run('authChanged({uid:"one",getIdToken:async()=>"t"})');assert.equal(x.get('dashboard').hidden,true);
});
