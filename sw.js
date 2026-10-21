/* GymTracker — service worker: guarda la app para usarla sin conexión.
   Tus datos de entrenamiento NO pasan por aquí: viven en IndexedDB del dispositivo. */
const CACHE = 'gymtracker-823b1185598c';
const FILES = ["./", "icon-180.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "index.html", "manifest.webmanifest"];

self.addEventListener('install', (ev) => {
  ev.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (ev) => {
  ev.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('gymtracker-') && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Tipografías de Google: se guardan la primera vez que se descargan.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    ev.respondWith(caches.open(CACHE).then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => { c.put(req, res.clone()); return res; }).catch(() => hit))));
    return;
  }
  if (url.origin !== self.location.origin) return;
  // Página: primero la red (para recibir actualizaciones) y, sin conexión, la copia guardada.
  if (req.mode === 'navigate') {
    ev.respondWith(fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put('./', copy)); return res; })
      .catch(() => caches.match('./').then((r) => r || caches.match('index.html'))));
    return;
  }
  ev.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});
