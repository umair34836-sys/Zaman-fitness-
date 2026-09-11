// Zaman Fitness — service worker.
//
// Caches the app shell so a workout can be started and completed with no
// connection. Firebase traffic is never cached: store.js already falls back to
// localStorage when the network is gone, and a stale auth or Firestore response
// would be worse than no response.

const VERSION = 'zf-v5';
const SHELL = [
  './',
  'index.html',
  'styles.css',
  'workouts.js',
  'auth.js',
  'store.js',
  'app.js',
  'firebase-config.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
  'icons/favicon-32.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(VERSION)
      // addAll fails the whole install if any single file 404s, so fetch each
      // one independently and keep whatever succeeds.
      .then(cache => Promise.all(SHELL.map(url =>
        cache.add(new Request(url, { cache: 'reload' })).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isAppAsset(url) {
  if (url.origin !== self.location.origin) return false;
  return !url.pathname.endsWith('/test.html');
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Anything cross-origin (Firebase, Google Fonts) goes straight to the network.
  if (!isAppAsset(url)) return;

  // Navigations: try the network so a deploy is picked up promptly, fall back to
  // the cached shell when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put('index.html', copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('index.html').then(r => r || caches.match('./')))
    );
    return;
  }

  // Static assets: serve from cache immediately, refresh in the background.
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      const network = fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => hit);
      return hit || network;
    })
  );
});
