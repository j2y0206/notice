const CACHE_NAME = 'nagoya-family-trip-v14';
const APP_SHELL = ['./', './index.html', './styles.css?v=14', './app.js?v=14', './manifest.webmanifest', './icon.svg', './assets/shopping/donguri.jpg', './assets/shopping/pokemon-center.webp', './assets/shopping/noritake-garden.jpg', './assets/shopping/aquarium-shop.jpg', './assets/shopping/legoland-minifigure.webp', './assets/shopping/railway-stickers.jpg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && new URL(event.request.url).origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
  );
});
