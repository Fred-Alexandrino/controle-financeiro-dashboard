const CACHE_NAME = 'caderneta-v3';
const SHELL_FILES = ['./manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.hostname.includes('google.com') || url.hostname.includes('script.google')) {
    return;
  }
  // HTML: sempre busca da rede, ignorando qualquer cache HTTP (do navegador ou do CDN)
  if (e.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname.endsWith('/')) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' }).then((res) => {
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, res.clone()));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  // demais arquivos: cache primeiro, com atualização em segundo plano
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetchPromise = fetch(e.request, { cache: 'no-store' }).then((res) => {
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, res.clone()));
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
