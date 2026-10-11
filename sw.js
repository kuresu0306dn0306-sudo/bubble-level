// 離線快取：更新任何檔案時，請把版本號 +1，手機才會抓到新版
const CACHE = 'bubble-level-v1';
const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 先用網路抓最新版；離線或訊號差（超過 3 秒）時改用快取
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const fromCache = () =>
    caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html'));
  const fromNet = fetch(e.request).then(res => {
    if (res.ok) {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
    }
    return res;
  });
  const timeout = new Promise(resolve => setTimeout(resolve, 3000)).then(fromCache);
  e.respondWith(
    Promise.race([fromNet, timeout])
      .then(r => r || fromNet)
      .catch(() => fromCache().then(r => r || Response.error()))
  );
});
