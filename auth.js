// Zaman Fitness — account handling.
//
// Everyone starts signed in anonymously so the app is usable immediately. When
// a user creates a real account we LINK it to that anonymous user rather than
// signing in fresh, which keeps the same uid — and therefore the same Firestore
// document, so no history is lost on upgrade.
const Auth = (function () {
  let sdk = null;      // the firebase-auth module, once loaded
  let auth = null;     // the Auth instance
  let user = null;
  const listeners = [];

  function notify() { listeners.forEach(fn => { try { fn(user); } catch (e) {} }); }

  function attach(sdkModule, authInstance, initialUser) {
    sdk = sdkModule;
    auth = authInstance;
    user = initialUser;
    sdk.onAuthStateChanged(auth, u => { user = u; notify(); });
  }

  function available() { return Boolean(sdk && auth); }
  function current() { return user; }
  function isAnonymous() { return Boolean(user && user.isAnonymous); }
  function label() {
    if (!user) return 'Not signed in';
    if (user.isAnonymous) return 'Guest — not backed up';
    return user.email || user.displayName || 'Signed in';
  }
  function onChange(fn) { listeners.push(fn); }

  // Turn a friendly message out of Firebase's error codes.
  function readable(err) {
    const code = (err && err.code) || '';
    if (code.includes('email-already-in-use')) return 'That email already has an account — sign in instead.';
    if (code.includes('credential-already-in-use')) return 'That account already exists. Signing you into it will start a separate history.';
    if (code.includes('invalid-email')) return 'That email address does not look right.';
    if (code.includes('weak-password')) return 'Use at least 6 characters for the password.';
    if (code.includes('wrong-password') || code.includes('invalid-credential')) return 'Email or password is incorrect.';
    if (code.includes('user-not-found')) return 'No account with that email.';
    if (code.includes('popup-blocked')) return 'Your browser blocked the popup — allow popups and try again.';
    if (code.includes('popup-closed')) return 'Sign-in was cancelled.';
    if (code.includes('operation-not-allowed')) return 'That sign-in method is not enabled in Firebase yet.';
    if (code.includes('network')) return 'No connection — try again when you are back online.';
    return (err && err.message) || 'Something went wrong.';
  }

  async function upgradeWithGoogle() {
    if (!available()) throw new Error('Accounts need a Firebase connection.');
    const provider = new sdk.GoogleAuthProvider();
    // Link keeps the anonymous uid (and its data). If that Google account is
    // already a user, fall back to signing into it.
    if (isAnonymous()) {
      try {
        const cred = await sdk.linkWithPopup(auth, provider);
        return cred.user;
      } catch (err) {
        if (!String(err && err.code).includes('credential-already-in-use')) throw err;
      }
    }
    const cred = await sdk.signInWithPopup(auth, provider);
    return cred.user;
  }

  async function upgradeWithEmail(email, password) {
    if (!available()) throw new Error('Accounts need a Firebase connection.');
    if (isAnonymous()) {
      const credential = sdk.EmailAuthProvider.credential(email, password);
      const cred = await sdk.linkWithCredential(auth.currentUser, credential);
      return cred.user;
    }
    const cred = await sdk.createUserWithEmailAndPassword(auth, email, password);
    return cred.user;
  }

  async function signInWithEmail(email, password) {
    if (!available()) throw new Error('Accounts need a Firebase connection.');
    const cred = await sdk.signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  }

  async function signOut() {
    if (!available()) return;
    await sdk.signOut(auth);
    // Drop straight back to a fresh guest session so the app stays usable.
    await sdk.signInAnonymously(auth);
  }

  return { attach, available, current, isAnonymous, label, onChange, readable,
           upgradeWithGoogle, upgradeWithEmail, signInWithEmail, signOut };
})();
