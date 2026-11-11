/* 气色簿离线缓存：打开时先用手机里存好的版本，同时在后台取新版本，下次打开生效。 */
const CACHE = 'qisebu-6154cbf4bd';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png']
  .map((f) => new URL(f, self.location).href);

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('qisebu-') && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // 网址后面的 ?xxx（比如微信分享加的参数）不影响用哪份文件，每个文件只存一份
  const url = new URL(e.request.url);
  url.search = '';
  url.hash = '';
  const key = url.href;
  if (!FILES.includes(key)) return; // 只管气色簿自己的文件，其他请求照常走网络
  const update = fetch(key, { cache: 'no-cache' })
    .then((res) => (res.ok && !res.redirected ? caches.open(CACHE).then((c) => c.put(key, res)) : null))
    .catch(() => null);
  e.waitUntil(update);
  e.respondWith(caches.open(CACHE)
    .then((c) => c.match(key))
    .then((hit) => hit || fetch(e.request))
    .catch(() => caches.open(CACHE).then((c) => c.match(FILES[0]))));
});
