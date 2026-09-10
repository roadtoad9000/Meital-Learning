/* Service worker: caches the app shell so Math Quest works offline
   once loaded (no wifi needed on the go). Stale-while-revalidate strategy. */
var CACHE_NAME = 'math-quest-v3';
var APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/curriculum.js',
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
    caches.open(CACHE_NAME).then(function (cache) { return cache.addAll(APP_SHELL); }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE_NAME; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(req).then(function (cached) {
      var fetchPromise = fetch(req).then(function (networkResp) {
        if (networkResp && networkResp.ok) {
          var copy = networkResp.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copy); });
        }
        return networkResp;
      }).catch(function () {
        return cached || (req.mode === 'navigate' ? caches.match('./index.html') : undefined);
      });
      return cached || fetchPromise;
    })
  );
});
