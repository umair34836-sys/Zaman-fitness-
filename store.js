// Zaman Fitness — persistence layer.
//
// Presents one small async API (init / load / save / reset) to app.js and picks
// its backend at runtime: Firestore when firebase-config.js is filled in and
// reachable, otherwise localStorage. Every path is guarded, so a missing config,
// a blocked CDN or a private-mode localStorage all degrade to a working (if
// forgetful) app rather than a broken one.
//
// The Firestore document is resolved from the CURRENT user on every call, so
// when an anonymous account is upgraded or a different account signs in, reads
// and writes follow without needing a reload.
const Store = (function () {
  const LOCAL_KEY = 'zaman-fitness-state';
  const SDK = 'https://www.gstatic.com/firebasejs/12.19.0';

  let mode = 'local';   // 'local' | 'firebase'
  let status = 'Local storage';
  let fs = null;        // firebase-firestore module
  let db = null;
  let authInstance = null;

  function configured() {
    const c = window.firebaseConfig || {};
    return Boolean(c.apiKey && c.projectId && c.appId);
  }

  function describe(user) {
    if (!user) return 'Firebase · signed out';
    return user.isAnonymous
      ? 'Firebase · guest ' + user.uid.slice(0, 6)
      : 'Firebase · ' + (user.email || user.displayName || 'account');
  }

  // Resolves once a backend is chosen. Never rejects — callers get whichever
  // mode we managed to reach.
  async function init() {
    if (!configured()) {
      status = 'Local storage · Firebase not configured';
      return mode;
    }
    try {
      const [app, authMod, firestore] = await Promise.all([
        import(`${SDK}/firebase-app.js`),
        import(`${SDK}/firebase-auth.js`),
        import(`${SDK}/firebase-firestore.js`)
      ]);
      const instance = app.initializeApp(window.firebaseConfig);
      authInstance = authMod.getAuth(instance);

      // Wait for any persisted session before creating a guest, otherwise a
      // returning signed-in user would be replaced by a brand new anonymous one.
      const existing = await new Promise(resolve => {
        const stop = authMod.onAuthStateChanged(authInstance, u => { stop(); resolve(u); });
      });
      const user = existing || (await authMod.signInAnonymously(authInstance)).user;

      fs = firestore;
      db = firestore.getFirestore(instance);
      mode = 'firebase';
      status = describe(user);

      if (typeof Auth !== 'undefined') {
        Auth.attach(authMod, authInstance, user);
        Auth.onChange(u => { status = describe(u); });
      }
    } catch (err) {
      status = 'Local storage · Firebase unreachable';
      console.warn('[Zaman Fitness] Falling back to localStorage:', err && err.message);
    }
    return mode;
  }

  function ref() {
    const user = authInstance && authInstance.currentUser;
    if (!user || !fs || !db) return null;
    return fs.doc(db, 'users', user.uid);
  }

  async function load() {
    const r = mode === 'firebase' ? ref() : null;
    if (r) {
      try {
        const snap = await fs.getDoc(r);
        return snap.exists() ? snap.data() : null;
      } catch (err) {
        console.warn('[Zaman Fitness] Load failed:', err && err.message);
        return null;
      }
    }
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  async function save(data) {
    const r = mode === 'firebase' ? ref() : null;
    if (r) {
      try {
        await fs.setDoc(r, data, { merge: true });
        return true;
      } catch (err) {
        console.warn('[Zaman Fitness] Save failed:', err && err.message);
        return false;
      }
    }
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
      return true;
    } catch (err) {
      return false;
    }
  }

  async function reset() {
    const r = mode === 'firebase' ? ref() : null;
    if (r) {
      try { await fs.deleteDoc(r); }
      catch (err) { console.warn('[Zaman Fitness] Reset failed:', err && err.message); }
    }
    try { localStorage.removeItem(LOCAL_KEY); }
    catch (err) { /* private mode — nothing to clear */ }
  }

  return {
    init, load, save, reset,
    get mode() { return mode; },
    get uid() { const u = authInstance && authInstance.currentUser; return u ? u.uid : null; },
    get status() { return status; }
  };
})();
