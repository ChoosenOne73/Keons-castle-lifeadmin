const CACHE_NAME = 'leftovers-v2';
const ASSETS = ['./', './index.html', './styles.css', './app.js', './interactions.js', './manifest.json'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    Promise.all([
      caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))),
      self.clients.claim()
    ])
  );
});

// Only intercept same-origin requests (this app's own files). Cross-origin
// requests -- like the Tesseract OCR library and Tabler icons loaded from a
// CDN -- are left completely alone and go straight to the network as normal.
// This prevents the service worker from ever failing to handle a CDN request,
// which is what broke Supabase from loading on Auto Care earlier tonight.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }
  if (e.request.method !== 'GET') {
    return;
  }
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
