/**
 * Add to the EXISTING Apps Script project; rename its original doPost(e) to
 * goalballLegacyPost(e). There must be exactly one doPost in the whole project.
 * Set Script Properties FIREBASE_WEB_API_KEY and GOALBALL_ADMIN_UIDS (comma-separated).
 * See ADMIN-SETUP.txt before deploying. Never put a service-account key here.
 */
function doPost(e) {
  try {
    var body = JSON.parse(e && e.postData && e.postData.contents || '{}');
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid request.');
    if (['authorize', 'saveFinalScore', 'updatePools'].indexOf(body.action) < 0) throw new Error('Unsupported action.');
    goalballRequireAdmin_(body.idToken);
    if (body.action === 'authorize') return goalballJson_({ success: true });
    var safeBody = { action: body.action };
    if (body.action === 'saveFinalScore') {
      if (!Number.isInteger(body.sheetRow) || body.sheetRow < 2) throw new Error('Invalid schedule row.');
      if (![body.teamAScore, body.teamBScore].every(function (n) { return Number.isInteger(n) && n >= 0 && n <= 999; })) throw new Error('Scores must be whole numbers from 0 to 999.');
      safeBody.sheetRow = body.sheetRow;
      safeBody.teamAScore = body.teamAScore;
      safeBody.teamBScore = body.teamBScore;
    }
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) throw new Error('Another update is running. Refresh and try again.');
    try {
      // Remove the token before handing off to the existing data-writing code.
      var content = JSON.stringify(safeBody);
      return goalballLegacyPost({ postData: { contents: content, type: 'text/plain', length: content.length }, parameter: {}, parameters: {} });
    } finally { lock.releaseLock(); }
  } catch (error) {
    return goalballJson_({ success: false, error: error.message || 'Request denied.' });
  }
}

function goalballRequireAdmin_(idToken) {
  var props = PropertiesService.getScriptProperties();
  var key = props.getProperty('FIREBASE_WEB_API_KEY');
  var admins = (props.getProperty('GOALBALL_ADMIN_UIDS') || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  if (!key || !admins.length) throw new Error('Administrator access is not configured.');
  if (typeof idToken !== 'string' || idToken.length > 10000 || idToken.split('.').length !== 3) throw new Error('Sign in to continue.');
  var response = UrlFetchApp.fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + encodeURIComponent(key), {
    method: 'post', contentType: 'application/json', payload: JSON.stringify({ idToken: idToken }), muteHttpExceptions: true
  });
  if (response.getResponseCode() !== 200) throw new Error('Your session could not be verified. Sign in again.');
  var account = (JSON.parse(response.getContentText()).users || [])[0];
  // Google validates the token above. Also bind it explicitly to the expected project.
  var claims = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(idToken.split('.')[1])).getDataAsString());
  if (claims.aud !== 'goalball-central-app' || claims.iss !== 'https://securetoken.google.com/goalball-central-app' || claims.exp * 1000 <= Date.now() || !account || account.disabled || account.localId !== claims.sub || admins.indexOf(account.localId) < 0) {
    throw new Error('This account is not authorized as an administrator.');
  }
  return account.localId;
}

function goalballJson_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
