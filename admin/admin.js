import { firebaseConfig, scheduleUrl, protectedAdminUrl } from './config.js';

const $ = id => document.getElementById(id);
let auth, sdk, user, generation = 0, busy = false, games = [], loaded = false;
let scoutOwner = null;
const message = (text, error = false) => {
  $('status').textContent = text;
  $('status').classList.toggle('error', error);
};
const tournament = g => [g.Year, g.Location].filter(Boolean).join(' — ');
const details = g => [g.GameDate || g.Date, g.Time, g.Gym, g.Stage].filter(Boolean).join(' · ');
const chosenGame = () => games.find(g => String(g._sheetRow) === $('game').value);

// The public site's navigation is repeated in static pages; this controller only handles admin UI.
$('mobileMenuButton').addEventListener('click', () => {
  const open = $('mobileNav').classList.toggle('open');
  $('mobileMenuButton').setAttribute('aria-expanded', String(open));
});
$('mobileMenuButton').setAttribute('aria-expanded', 'false');
$('mobileMenuButton').setAttribute('aria-controls', 'mobileNav');
$('showPassword').addEventListener('click', () => {
  const show = $('password').type === 'password';
  $('password').type = show ? 'text' : 'password';
  $('showPassword').textContent = show ? 'Hide' : 'Show';
  $('showPassword').setAttribute('aria-pressed', String(show));
});

async function jsonRequest(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error(`The service returned HTTP ${response.status}.`);
  let data;
  try { data = await response.json(); }
  catch { throw new Error('The service returned an unreadable response. Check the Apps Script deployment and browser access.'); }
  if (!data || typeof data !== 'object' || data.success === false) throw new Error(data?.error || 'The request failed.');
  return data;
}

async function adminRequest(action, fields = {}) {
  if (!user || !protectedAdminUrl) throw new Error('The protected admin service is not configured.');
  const requestUser = user;
  const idToken = await requestUser.getIdToken();
  if (user !== requestUser) throw new Error('Your sign-in changed. Sign in again.');
  // text/plain avoids a preflight unsupported by Apps Script web apps.
  const data = await jsonRequest(protectedAdminUrl, {
    method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify({ ...fields, action, idToken })
  });
  if (data.success !== true) throw new Error('The server did not confirm success. Refresh before trying again.');
  return data;
}

function lockUI(value) {
  busy = value;
  $('signOut').disabled = value;
  $('refresh').disabled = value;
  $('game').disabled = value;
  $('saveScore').disabled = value || !protectedAdminUrl || !chosenGame();
  $('updatePools').disabled = value || !protectedAdminUrl;
  document.querySelectorAll('[data-view]').forEach(button => { button.disabled = value; });
}

function renderGames() {
  const previous = $('game').value;
  const term = $('search').value.trim().toLowerCase();
  const filtered = games.filter(g => (!$('tournamentFilter').value || tournament(g) === $('tournamentFilter').value)
    && (!$('unfinished').checked || !String(g.Result || '').trim())
    && [g['Team A'], g['Team B'], tournament(g), details(g)].join(' ').toLowerCase().includes(term));
  $('game').replaceChildren(new Option('Choose a game', ''));
  for (const game of filtered) {
    $('game').add(new Option(`${game['Team A']} vs ${game['Team B']} · ${details(game)}${game.Result ? ` · Final: ${game.Result}` : ''}`, String(game._sheetRow)));
  }
  $('game').value = filtered.some(g => String(g._sheetRow) === previous) ? previous : '';
  $('gamesStatus').textContent = `${filtered.length} games shown in schedule order.`;
  selectGame();
}

function selectGame() {
  const game = chosenGame();
  $('teamALabel').textContent = game ? `${game['Team A']} score` : 'Team A score';
  $('teamBLabel').textContent = game ? `${game['Team B']} score` : 'Team B score';
  $('gameDetails').textContent = game ? `${tournament(game)} · ${details(game)}${game.Result ? ` · Current result: ${game.Result}` : ''}` : '';
  const score = String(game?.Result || '').match(/^\s*(\d+)\s*[-–:]\s*(\d+)\s*$/);
  $('scoreA').value = score?.[1] || '';
  $('scoreB').value = score?.[2] || '';
  $('saveScore').disabled = busy || !protectedAdminUrl || !game;
}

async function loadGames() {
  const ticket = generation;
  $('refresh').disabled = true;
  $('gamesStatus').textContent = 'Loading scheduled games…';
  try {
    const url = new URL(scheduleUrl); url.searchParams.set('mode', 'schedules');
    const data = await jsonRequest(url);
    if (ticket !== generation || !user) return;
    if (!Array.isArray(data.results)) throw new Error('The service did not return a schedule list.');
    games = data.results.filter(g => Number.isInteger(Number(g._sheetRow)) && Number(g._sheetRow) >= 2 && g['Team A'] && g['Team B']);
    const previous = $('tournamentFilter').value;
    $('tournamentFilter').replaceChildren(new Option('All tournaments', ''));
    [...new Set(games.map(tournament).filter(Boolean))].forEach(t => $('tournamentFilter').add(new Option(t, t)));
    $('tournamentFilter').value = [...$('tournamentFilter').options].some(o => o.value === previous) ? previous : '';
    loaded = true;
    renderGames();
  } catch (error) {
    if (ticket === generation) $('gamesStatus').textContent = `Unable to load games. ${error.message} Use Refresh games to retry.`;
  } finally { if (ticket === generation) $('refresh').disabled = busy; }
}

async function openView(view) {
  const ticket = generation;
  for (const id of ['scores', 'scouting', 'pools']) $(id).hidden = id !== view;
  document.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
  $(`${view}Title`).focus();
  if (view === 'scores' && !loaded) await loadGames();
  if (view === 'scouting' && user && scoutOwner !== user.uid) {
    const owner = user.uid;
    scoutOwner = owner;
    $('scoutContainer').textContent = 'Loading scouting program…';
    try {
      const response = await fetch('scouting-program.html');
      if (!response.ok) throw new Error('The scouting file could not be loaded.');
      const html = await response.text();
      if (ticket !== generation || user?.uid !== owner) return;
      const frame = document.createElement('iframe');
      frame.className = 'scouting-frame'; frame.title = 'Goalball scouting program';
      // Source is our bundled HTML, never remote user content. UID keeps device saves separate.
      const key = JSON.stringify(`goalballScouting:${owner}`).replace(/</g, '\\u003c');
      frame.srcdoc = html.replace('<head>', `<head><script>window.GOALBALL_STORAGE_KEY=${key};<\/script>`);
      $('scoutContainer').replaceChildren(frame);
    } catch (error) {
      scoutOwner = null;
      $('scoutContainer').textContent = `${error.message} Select Goalball scouting to retry.`;
    }
  }
}

$('loginForm').addEventListener('submit', async event => {
  event.preventDefault();
  if (!auth || $('signIn').disabled) return;
  $('signIn').disabled = true; message('Signing in…');
  try {
    await sdk.signInWithEmailAndPassword(auth, $('email').value.trim(), $('password').value);
    $('password').value = '';
  } catch (error) {
    const errors = {
      'auth/invalid-credential': 'The email address or password is incorrect.',
      'auth/invalid-email': 'Enter a valid email address.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/too-many-requests': 'Too many unsuccessful attempts. Please wait and try again.',
      'auth/network-request-failed': 'Unable to connect. Check your internet connection.',
      'auth/unauthorized-domain': 'Add this website domain to Firebase Authentication authorized domains.'
    };
    message(errors[error.code] || 'Unable to sign in. Please try again.', true);
  } finally { $('signIn').disabled = false; }
});
$('signOut').addEventListener('click', async () => {
  try { await sdk.signOut(auth); }
  catch { message('Unable to sign out. Please try again.', true); }
});
document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => openView(button.dataset.view)));
for (const id of ['tournamentFilter', 'search', 'unfinished']) $(id).addEventListener('input', renderGames);
$('game').addEventListener('change', selectGame);
$('refresh').addEventListener('click', loadGames);
$('scoreForm').addEventListener('submit', async event => {
  event.preventDefault();
  const game = chosenGame();
  if (!game || busy || !user || !protectedAdminUrl) return;
  const teamAScore = Number($('scoreA').value), teamBScore = Number($('scoreB').value);
  if (![teamAScore, teamBScore].every(n => Number.isInteger(n) && n >= 0 && n <= 999)) return;
  if (!confirm(`Save ${game['Team A']} ${teamAScore} – ${teamBScore} ${game['Team B']} as the final result?${game.Result ? ` This replaces ${game.Result}.` : ''}`)) return;
  lockUI(true); message('Saving final score…');
  try {
    await adminRequest('saveFinalScore', { sheetRow: Number(game._sheetRow), teamAScore, teamBScore });
    message('Final score saved.'); await loadGames();
  } catch (error) { message(`${error.message} Check the schedule before retrying; a connection error may occur after a save.`, true); }
  finally { lockUI(false); }
});
$('updatePools').addEventListener('click', async () => {
  if (busy || !user || !protectedAdminUrl || !confirm('Recalculate pool standings for every AUTO tournament? LOCKED tournaments will be preserved.')) return;
  lockUI(true); message('Updating tournament pools…'); $('poolResult').textContent = '';
  try {
    const data = await adminRequest('updatePools');
    $('poolResult').textContent = [['AUTO tournaments', data.autoEvents], ['LOCKED tournaments', data.lockedEvents], ['Rows updated', data.updatedRows], ['Games processed', data.processedGames], ['Games skipped', data.skippedGames]].map(([label, value]) => `${label}: ${Number(value) || 0}`).join(' · ');
    message('Tournament pools updated.');
  } catch (error) { message(error.message, true); }
  finally { lockUI(false); }
});

async function authChanged(nextUser) {
  const ticket = ++generation;
  user = nextUser; loaded = false; games = []; scoutOwner = null;
  $('scoutContainer').replaceChildren(); $('poolResult').textContent = '';
  $('dashboard').hidden = true; $('loginPanel').hidden = !!user;
  for (const id of ['scores', 'scouting', 'pools']) $(id).hidden = true;
  if (!user) { $('password').value = ''; message('Sign in to access administrator tools.'); return; }
  message('Checking administrator access…');
  try {
    if (protectedAdminUrl) await adminRequest('authorize');
    if (ticket !== generation) return;
    $('dashboard').hidden = false;
    $('signedInAs').textContent = `Signed in as ${user.email || 'Administrator'}`;
    $('setupNotice').hidden = !!protectedAdminUrl;
    lockUI(false);
    message('Choose an administrator tool.');
  } catch (error) {
    if (ticket !== generation) return;
    await sdk.signOut(auth);
    message(`Administrator access could not be verified. ${error.message}`, true);
  }
}

try {
  const [appSdk, authSdk] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js')
  ]);
  sdk = authSdk;
  auth = sdk.getAuth(appSdk.initializeApp(firebaseConfig));
  await sdk.setPersistence(auth, sdk.browserSessionPersistence);
  sdk.onAuthStateChanged(auth, authChanged, () => message('Unable to check login status. Reload to try again.', true));
} catch {
  message('Administrator login could not load. Check your connection and allow access to Firebase, then reload this page.', true);
}
