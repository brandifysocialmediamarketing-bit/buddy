// BUDDY Service Worker for PWA Installation & Offline Support
const CACHE_NAME = 'buddy-cache-v198';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './assets/logo.png',
  './assets/logo-icon.png',
  './assets/logo-dark.png',
  './assets/logo-light.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-adaptive.svg',
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
