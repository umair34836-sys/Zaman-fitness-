/* Zaman Fitness — Firebase backend.
 *
 * There is deliberately no anonymous sign-in. A visitor is either signed in
 * with a real account, or using the app as a guest with everything kept on
 * their own device (see store.js). Catalogue reads are public so guests still
 * see the workouts an admin publishes.
 */
const Backend = (function () {
  const SDK = 'https://www.gstatic.com/firebasejs/12.19.0';

  let authMod = null, fsMod = null, auth = null, db = null;
  let user = null;
  let admin = false;
  let online = false;          // Firebase reachable and configured
  let reason = 'Not connected';
  const watchers = [];

  function configured() {
    const c = window.firebaseConfig || {};
    return Boolean(c.apiKey && c.projectId && c.appId);
  }

  function emit() { watchers.forEach(fn => { try { fn(user, admin); } catch (e) {} }); }
  function onAuth(fn) { watchers.push(fn); }

  async function refreshAdmin() {
    admin = false;
    if (!user || !db) return false;
    try {
      const snap = await fsMod.getDoc(fsMod.doc(db, 'admins', user.uid));
      admin = snap.exists();
    } catch (e) {
      admin = false;   // rules may forbid the read; treat as "not an admin"
    }
    return admin;
  }

  // Resolves once we know whether Firebase is usable and who (if anyone) is
  // signed in. Never rejects: the app must run regardless.
  async function init() {
    if (!configured()) { reason = 'Firebase is not configured'; return false; }
    try {
      const [appMod, aMod, fMod] = await Promise.all([
        import(`${SDK}/firebase-app.js`),
        import(`${SDK}/firebase-auth.js`),
        import(`${SDK}/firebase-firestore.js`)
      ]);
      const app = appMod.initializeApp(window.firebaseConfig);
      authMod = aMod; fsMod = fMod;
      auth = aMod.getAuth(app);
      db = fMod.getFirestore(app);
      online = true;
      reason = 'Connected';

      // Wait for the first auth state so boot knows where to send the user.
      user = await new Promise(resolve => {
        const stop = aMod.onAuthStateChanged(auth, u => { stop(); resolve(u); });
      });
      await refreshAdmin();

      aMod.onAuthStateChanged(auth, async u => {
        user = u;
        await refreshAdmin();
        emit();
      });
      return true;
    } catch (err) {
      online = false;
      reason = 'Firebase unreachable';
      console.warn('[Zaman Fitness] Backend offline:', err && err.message);
      return false;
    }
  }

  function need() { if (!online) throw new Error('offline'); }

  /* ---- accounts ---- */

  async function register(email, password, name) {
    need();
    const cred = await authMod.createUserWithEmailAndPassword(auth, email, password);
    if (name) { try { await authMod.updateProfile(cred.user, { displayName: name }); } catch (e) {} }
    user = cred.user;
    await refreshAdmin();
    return cred.user;
  }

  async function signIn(email, password) {
    need();
    const cred = await authMod.signInWithEmailAndPassword(auth, email, password);
    user = cred.user;
    await refreshAdmin();
    return cred.user;
  }

  async function signInGoogle() {
    need();
    const cred = await authMod.signInWithPopup(auth, new authMod.GoogleAuthProvider());
    user = cred.user;
    await refreshAdmin();
    return cred.user;
  }

  async function sendReset(email) { need(); await authMod.sendPasswordResetEmail(auth, email); }

  async function signOut() {
    if (!online) return;
    await authMod.signOut(auth);
    user = null; admin = false;
  }

  /* ---- the signed-in user's own document ---- */

  async function loadProfile() {
    if (!online || !user) return null;
    try {
      const snap = await fsMod.getDoc(fsMod.doc(db, 'users', user.uid));
      return snap.exists() ? snap.data() : null;
    } catch (e) { console.warn('[Zaman Fitness] Profile load failed:', e.message); return null; }
  }

  async function saveProfile(data) {
    if (!online || !user) return false;
    try { await fsMod.setDoc(fsMod.doc(db, 'users', user.uid), data, { merge: true }); return true; }
    catch (e) { console.warn('[Zaman Fitness] Profile save failed:', e.message); return false; }
  }

  async function deleteProfile() {
    if (!online || !user) return;
    try { await fsMod.deleteDoc(fsMod.doc(db, 'users', user.uid)); } catch (e) {}
  }

  /* ---- catalogue (public read, admin write) ---- */

  async function loadCollection(name) {
    if (!online) return null;
    try {
      const snap = await fsMod.getDocs(fsMod.collection(db, name));
      const out = [];
      snap.forEach(d => out.push(Object.assign({ id: d.id }, d.data())));
      return out;
    } catch (e) {
      console.warn(`[Zaman Fitness] Could not read ${name}:`, e.message);
      return null;
    }
  }

  const loadExercises = () => loadCollection('exercises');
  const loadWorkouts  = () => loadCollection('workouts');

  async function saveDocument(collection, id, data) {
    need();
    const ref = id ? fsMod.doc(db, collection, id) : fsMod.doc(fsMod.collection(db, collection));
    await fsMod.setDoc(ref, data, { merge: true });
    return ref.id;
  }
  async function removeDocument(collection, id) { need(); await fsMod.deleteDoc(fsMod.doc(db, collection, id)); }

  // Writes the bundled catalogue into Firestore so it becomes editable.
  // Existing documents are left untouched, so this is safe to re-run.
  async function seedCatalogue(exercises, workouts) {
    need();
    const existingEx = (await loadCollection('exercises')) || [];
    const existingWk = (await loadCollection('workouts')) || [];
    const haveEx = new Set(existingEx.map(e => e.id));
    const haveWk = new Set(existingWk.map(w => w.id));
    let added = 0;

    for (const ex of exercises) {
      if (haveEx.has(ex.id)) continue;
      await saveDocument('exercises', ex.id, Object.assign({}, ex, { builtIn: true }));
      added++;
    }
    for (const wk of workouts) {
      if (haveWk.has(wk.id)) continue;
      await saveDocument('workouts', wk.id, Object.assign({}, wk, { builtIn: true }));
      added++;
    }
    return added;
  }

  /* ---- admins ---- */

  async function listAdmins() { return (await loadCollection('admins')) || []; }
  async function addAdmin(uid, email) { return saveDocument('admins', uid, { email: email || '', addedAt: new Date().toISOString() }); }
  async function removeAdmin(uid) { return removeDocument('admins', uid); }

  /* ---- error text ---- */

  function readable(err) {
    const code = String((err && err.code) || (err && err.message) || err || '');
    if (code.includes('email-already-in-use')) return 'That email already has an account. Sign in instead.';
    if (code.includes('invalid-email')) return 'That email address does not look right.';
    if (code.includes('weak-password')) return 'Password must be at least 6 characters.';
    if (code.includes('missing-password')) return 'Enter a password.';
    if (code.includes('wrong-password') || code.includes('invalid-credential')) return 'Email or password is incorrect.';
    if (code.includes('user-not-found')) return 'No account found with that email.';
    if (code.includes('too-many-requests')) return 'Too many attempts. Wait a minute and try again.';
    if (code.includes('popup-blocked')) return 'Your browser blocked the popup. Allow popups and try again.';
    if (code.includes('popup-closed')) return 'Sign-in was cancelled.';
    if (code.includes('operation-not-allowed')) return 'That sign-in method is not enabled in Firebase yet.';
    if (code.includes('permission-denied')) return 'You do not have permission to do that.';
    if (code.includes('offline') || code.includes('network')) return 'No connection to the server.';
    return (err && err.message) || 'Something went wrong.';
  }

  return {
    init, onAuth, readable, refreshAdmin,
    register, signIn, signInGoogle, signOut, sendReset,
    loadProfile, saveProfile, deleteProfile,
    loadExercises, loadWorkouts, saveDocument, removeDocument, seedCatalogue,
    listAdmins, addAdmin, removeAdmin,
    get user() { return user; },
    get isAdmin() { return admin; },
    get online() { return online; },
    get reason() { return reason; },
    get uid() { return user ? user.uid : null; }
  };
})();
