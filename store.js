/* Zaman Fitness — user data.
 *
 * Two modes, chosen by how the person entered the app:
 *   account — their document in Firestore, available on any device
 *   guest   — localStorage on this device only, no account anywhere
 *
 * A guest who later registers keeps their data: register() in app.js hands the
 * local copy to the new account before clearing it.
 */
const Store = (function () {
  const KEY = 'zaman-fitness-user';
  const MODE_KEY = 'zaman-fitness-mode';
  const VERSION = 1;

  const BLANK = {
    v: VERSION, name: '', goal: 'muscle', equipment: ['Bodyweight & No Equipment'],
    onboarded: false, history: [], lastWeights: {}, weeklyTarget: 5
  };

  let mode = 'none';   // 'none' | 'guest' | 'account'
  let data = clone(BLANK);

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function localRead() {
    try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; }
    catch (e) { return null; }
  }
  function localWrite(d) {
    try { localStorage.setItem(KEY, JSON.stringify(d)); return true; } catch (e) { return false; }
  }
  function localClear() {
    try { localStorage.removeItem(KEY); localStorage.removeItem(MODE_KEY); } catch (e) {}
  }

  function rememberMode(m) { try { localStorage.setItem(MODE_KEY, m); } catch (e) {} }
  function savedMode() { try { return localStorage.getItem(MODE_KEY) || 'none'; } catch (e) { return 'none'; } }

  function merge(loaded) {
    const base = clone(BLANK);
    if (loaded && loaded.v === VERSION) {
      Object.keys(base).forEach(k => { if (loaded[k] !== undefined) base[k] = loaded[k]; });
    }
    return base;
  }

  /* ---- entering a mode ---- */

  async function useAccount() {
    mode = 'account';
    rememberMode('account');
    data = merge(await Backend.loadProfile());
    return data;
  }

  function useGuest() {
    mode = 'guest';
    rememberMode('guest');
    data = merge(localRead());
    return data;
  }

  function leave() { mode = 'none'; rememberMode('none'); data = clone(BLANK); }

  /* ---- reading and writing ---- */

  function get() { return data; }
  function set(patch) { Object.assign(data, patch); return save(); }

  async function save() {
    data.v = VERSION;
    if (mode === 'account') return Backend.saveProfile(data);
    if (mode === 'guest') return localWrite(data);
    return false;
  }

  // Called when a guest registers: carry what they already did into the account.
  async function adoptLocalInto() {
    const local = localRead();
    if (!local) return false;
    const merged = merge(local);
    const remote = merge(await Backend.loadProfile());
    // Keep the longer history; a brand new account has none.
    if (remote.history.length > merged.history.length) return false;
    data = merged;
    mode = 'account';
    rememberMode('account');
    await Backend.saveProfile(data);
    localClear();
    return true;
  }

  async function wipe() {
    if (mode === 'account') await Backend.deleteProfile();
    localClear();
    data = clone(BLANK);
    return data;
  }

  return {
    useAccount, useGuest, leave, get, set, save, adoptLocalInto, wipe,
    localClear, savedMode, hasLocal: () => Boolean(localRead()),
    get mode() { return mode; }
  };
})();
