const CACHE_NAME = 'learnscape-adventure-v12';
const CORE_ASSETS = [
  './',
  './index.html',
  './title-screen.html',
  './game_start.html',
  './game1.html',
  './style.css',
  './script.js',
  './manifest.webmanifest',
  './app-icon-192.png',
  './app-icon-512.png',
  './apple-touch-icon.png',
  './assets/Backgrounds/bgintro.jpeg',
  './assets/Backgrounds/bgintro.mp4',
  './assets/Backgrounds/bg1.png',
  './assets/Backgrounds/Game1.png',
  './assets/Backgrounds/Game1.jpeg',
  './assets/Backgrounds/Game1.mp4',
  './assets/Backgrounds/Game2.png',
  './assets/Backgrounds/abc.png',
  './assets/Backgrounds/123.png',
  './assets/Backgrounds/shape.png',
  './assets/Backgrounds/loadingscreen.png',
  './assets/Character/ch1.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => (key === CACHE_NAME ? null : caches.delete(key)))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return networkResponse;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
