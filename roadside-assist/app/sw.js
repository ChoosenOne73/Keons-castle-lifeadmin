// Roadside Warriors service worker
// Bump CACHE_NAME any time you redeploy app.js, interactions.js, or styles.css,
// or returning users may keep seeing a stale cached version.
const CACHE_NAME = 'roadside-warriors-v1';

const PRECACHE_URLS = [
  './index.html',
  './styles.css',
  './app.js',
  './interactions.js',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Network-first for same-origin requests, falling back to cache when offline.
// This keeps the booking/payment flow talking to the real network whenever
// possible, and only serves cached content if the network request fails.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
