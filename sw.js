// Offline: precache the shell + every unit; network-first (fresh when online), cache when offline.
// Bump VERSION whenever a unit or engine file changes, and add new unit files to SHELL.
const VERSION = 'sq-v1';
const SHELL = ['./', 'index.html', 'styles.css', 'app.js', 'audio.js', 'maps/georgia.js', 'units/index.js',
  'units/2026-11-06-cherokee-creek.js',
  'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-192.png',
  'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon.png'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET') return;
  if (url.origin !== location.origin && !FONT_HOSTS.includes(url.hostname)) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    try {
      const net = await Promise.race([
        fetch(req),
        new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), 3500)),
      ]);
      if (net.ok || net.type === 'opaque') cache.put(req, net.clone());
      return net;
    } catch {
      return (await cache.match(req, { ignoreSearch: true }))
        || (req.mode === 'navigate' ? await cache.match('index.html') : undefined)
        || Response.error();
    }
  })());
});
