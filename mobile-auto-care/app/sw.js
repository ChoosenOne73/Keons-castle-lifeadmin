const CACHE_NAME = 'auto-care-v2';
const ASSETS = ['./', './index.html', './styles.css', './app.js', './interactions.js', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
});

// Only intercept same-origin requests (this app's own files). Cross-origin
// requests -- like the Supabase library and Tabler icons loaded from a CDN --
// are left completely alone and go straight to the network as normal. This
// prevents the service worker from ever failing to handle a CDN request,
// which previously broke Supabase from loading at all on some networks/devices.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) {
    return; // let the browser handle it normally, no caching/interception
  }
  if (e.request.method !== 'GET') {
    return; // never intercept non-GET requests
  }
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
