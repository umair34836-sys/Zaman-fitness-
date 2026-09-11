// Zaman Fitness — persistence layer.
//
// Presents one small async API (init / load / save / reset) to app.js and picks
// its backend at runtime: Firestore with anonymous auth when firebase-config.js
// has been filled in, otherwise localStorage. Every path is guarded, so a
// missing config, a blocked CDN or a private-mode localStorage all degrade to a
// working (if non-persistent) app rather than a broken one.
const Store = (function () {
  const LOCAL_KEY = 'zaman-fitness-state';
  const SDK = 'https://www.gstatic.com/firebasejs/12.19.0';

  let mode = 'local';   // 'local' | 'firebase'
  let uid = null;
  let status = 'Local storage';
  let remote = null;    // { ref, getDoc, setDoc, deleteDoc }

  function configured() {
    const c = window.firebaseConfig || {};
    return Boolean(c.apiKey && c.projectId && c.appId);
  }

  // Resolves once the backend is chosen. Never rejects — callers get whichever
  // mode we managed to reach.
  async function init() {
    if (!configured()) {
      status = 'Local storage · Firebase not configured';
      return mode;
    }
    try {
      const [app, auth, firestore] = await Promise.all([
        import(`${SDK}/firebase-app.js`),
        import(`${SDK}/firebase-auth.js`),
        import(`${SDK}/firebase-firestore.js`)
      ]);
      const instance = app.initializeApp(window.firebaseConfig);
      const credential = await auth.signInAnonymously(auth.getAuth(instance));
      const db = firestore.getFirestore(instance);

      uid = credential.user.uid;
      remote = {
        ref: firestore.doc(db, 'users', uid),
        getDoc: firestore.getDoc,
        setDoc: firestore.setDoc,
        deleteDoc: firestore.deleteDoc
      };
      mode = 'firebase';
      status = 'Firebase · anonymous ' + uid.slice(0, 6);
    } catch (err) {
      status = 'Local storage · Firebase unreachable';
      console.warn('[Zaman Fitness] Falling back to localStorage:', err && err.message);
    }
    return mode;
  }

  async function load() {
    if (mode === 'firebase') {
      try {
        const snap = await remote.getDoc(remote.ref);
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
    if (mode === 'firebase') {
      try {
        await remote.setDoc(remote.ref, data, { merge: true });
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
    if (mode === 'firebase') {
      try {
        await remote.deleteDoc(remote.ref);
      } catch (err) {
        console.warn('[Zaman Fitness] Reset failed:', err && err.message);
      }
    }
    try {
      localStorage.removeItem(LOCAL_KEY);
    } catch (err) { /* private mode — nothing to clear */ }
  }

  return {
    init, load, save, reset,
    get mode() { return mode; },
    get uid() { return uid; },
    get status() { return status; }
  };
})();
