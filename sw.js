/* Service Worker — Sprachkurs
   Strategie: NETWORK-FIRST mit kugelsicherem Offline-Rückfall.
   - Online: immer die neueste Version vom Server, frisch in den Cache.
   - Offline: die zuletzt gespeicherte Version aus dem Cache.
   Updates sind sofort sichtbar UND die App läuft offline. */
const CACHE = 'sprachen-v5';
const FILES = [
  './',
  './index.html',
  './icon.svg',
  './icon.png',
  './icon-180.png',
  './icon-192.png',
  './manifest.webmanifest'
];

/* Installieren: jede Datei EINZELN cachen.
   Wenn eine Datei fehlt/fehlschlägt, kippt das nicht den ganzen Cache. */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.all(FILES.map(f => cache.add(f).catch(() => {})))
    )
  );
  self.skipWaiting();
});

/* Aktivieren: alte Caches löschen, sofort übernehmen */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* Anfragen behandeln */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  /* Navigation (die Seite selbst): Netz zuerst, frisch cachen.
     Offline → gespeicherte index.html zurückgeben. */
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(resp => {
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put('./index.html', copy)).catch(() => {});
          return resp;
        })
        .catch(() =>
          caches.match('./index.html')
            .then(c => c || caches.match('./'))
            .then(c => c || caches.match(e.request))
        )
    );
    return;
  }

  /* Alle anderen Dateien (Icons, Manifest): Netz zuerst, dann Cache */
  e.respondWith(
    fetch(e.request)
      .then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return resp;
      })
      .catch(() => caches.match(e.request))
  );
});
