/* Service worker: keeps Math Quest working offline, without ever serving a stale
   app to someone who has a connection.

   Strategy is network-first for the app's own files: if we can reach the network
   we use (and re-cache) the fresh copy, so a plain refresh always picks up a new
   deploy. Cache is the fallback for offline, not the default. */
var CACHE_NAME = 'math-quest-v9';
var APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/visuals.js',
  './js/curriculum.js',
  './js/typing.js',
  './js/squishies.js',
  './js/ui-typing.js',
  './js/storage.js',
  './js/engine.js',
  './js/ui.js',
  './js/main.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) { return cache.addAll(APP_SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === CACHE_NAME ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(req)
      .then(function (resp) {
        if (resp && resp.ok) {
          var copy = resp.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copy); });
        }
        return resp;
      })
      .catch(function () {
        // Offline: fall back to whatever we cached last time.
        return caches.match(req).then(function (cached) {
          if (cached) return cached;
          if (req.mode === 'navigate') return caches.match('./index.html');
          return Response.error();
        });
      })
  );
});
