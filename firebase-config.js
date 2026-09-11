// Zaman Fitness — Firebase project configuration.
//
// The app runs fine with this left blank: it falls back to localStorage so the
// prototype still works when served from GitHub Pages with no backend.
//
// To connect a real Firebase project:
//   1. Firebase console → Project settings → Your apps → Web app → Config.
//   2. Paste the values below.
//   3. Authentication → Sign-in method → enable "Anonymous".
//   4. Firestore Database → Create database.
//   5. Apply the security rules from README.md.
//
// These values are public identifiers, not secrets — they identify the project
// to Firebase and are meant to ship in client code. Access is controlled by
// Firestore security rules, not by hiding this file.
window.firebaseConfig = {
  apiKey: 'AIzaSyBKqCUdFII6wbd7YKH8GZm4k6MsPO1suZg',
  authDomain: 'zaman-fitness.firebaseapp.com',
  projectId: 'zaman-fitness',
  storageBucket: 'zaman-fitness.firebasestorage.app',
  messagingSenderId: '658312456328',
  appId: '1:658312456328:web:bf8dfe428cdce2502a973d'
};
