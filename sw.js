/* Service Worker — Sprachkurs Offline-Cache */
const CACHE = 'sprachen-v3';
const FILES = [
  './',
  './index.html',
  './icon.svg',
  './icon.png',
  './icon-180.png',
  './icon-192.png',
  './manifest.webmanifest'
];

/* Beim Installieren: alle Dateien cachen */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(FILES))
  );
  self.skipWaiting();
});

/* Beim Aktivieren: alte Caches löschen */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* Jede Anfrage: erst aus Cache, dann Netz */
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
