// BUDDY Service Worker for PWA Installation & Offline Support
const CACHE_NAME = 'buddy-cache-v191';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './assets/logo.png',
  './assets/icon-adaptive.svg',
  './assets/icon-monochrome.svg',
  './assets/icon-light.svg',
  './assets/icon-dark.svg',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
