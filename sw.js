const CACHE_NAME = 'learnscape-adventure-v231';
const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.webmanifest',
  './app-icon-192.png',
  './app-icon-512.png',
  './apple-touch-icon.png',
  './assets/Backgrounds/bgintro.jpeg',
  './assets/Backgrounds/title.webp',
  './assets/Shape UI/post.webp',
  './assets/Shape UI/Shop.webp',
  './assets/Shape UI/character.webp',
  './assets/Shape UI/Parking/bakery-star.webp',
  './assets/Shape UI/Parking/bakery-diamond.webp',
  './assets/Shape UI/Parking/bakery-rectangle.webp',
  './assets/Shape UI/Parking/bookstore-circle.webp',
  './assets/Shape UI/Parking/bookstore-rectangle.webp',
  './assets/Shape UI/Parking/bookstore-triangle.webp',
  './assets/Shape UI/Parking/toyshop-rectangle.webp',
  './assets/Shape UI/Parking/toyshop-heart.webp',
  './assets/Shape UI/Parking/toyshop-square.webp',
  './assets/Backgrounds/bakery1.webp',
  './assets/Backgrounds/bookstore1.webp',
  './assets/Backgrounds/toyshop1.webp',
  './assets/Backgrounds/bg1.png',
  './assets/Backgrounds/shape.png',
  './assets/Backgrounds/loadingscreen.png',
  './assets/Character/ch1.png',
  './assets/Character/metal-monster-boss.png',
  './assets/Character/metal-monster-boss-idle.png',
  './assets/Character/metal-monster-boss-blink.png',
  './assets/Character/metal-spinner.svg'
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

  const requestUrl = new URL(event.request.url);
  const isShellAsset =
    event.request.destination === 'document' ||
    requestUrl.pathname.endsWith('.html') ||
    requestUrl.pathname.endsWith('.css') ||
    requestUrl.pathname.endsWith('.js');

  if (isShellAsset) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return networkResponse;
        })
        .catch(() => caches.match(event.request).then((cachedResponse) => cachedResponse || caches.match('./index.html')))
    );

    return;
  }

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
