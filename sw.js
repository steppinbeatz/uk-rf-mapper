const CACHE_NAME = 'rf-mapper-v4';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './repeaterlist_all.csv',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install event: Cache core files and skip waiting so new code takes effect immediately
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate event: Remove earlier app caches (v1, v2) and take control immediately
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch event: Always go to network for /elevation/ API calls; use network-first for index.html
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Never cache local OpenTopoData /elevation/ API requests
  if (url.pathname.startsWith('/elevation/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
