// build-site.cjs bu iki değeri yayın sürümü ve dosya listesiyle doldurur.
const CACHE_NAME = 'meyve-bahcesi-__VERSION__';
const PRECACHE = __PRECACHE__;
const APP_ROOT = new URL('./', self.registration.scope);

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE)));
    // Yeni sürüm, açık oyun kapanınca devreye girer. Oynarken sayfa yenilenmez.
});

self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        for (const name of await caches.keys()) {
            if (name.startsWith('meyve-bahcesi-') && name !== CACHE_NAME) await caches.delete(name);
        }
        await self.clients.claim();
    })());
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    if (event.request.method !== 'GET' || url.origin !== APP_ROOT.origin || !url.pathname.startsWith(APP_ROOT.pathname)) return;
    event.respondWith((async () => {
        const cache = await caches.open(CACHE_NAME).catch(() => null);
        // Çevrimiçiyken her açılışta güncel yayın; bağlantı yoksa son kayıt.
        try {
            const response = await fetch(event.request, { cache: 'no-store', signal: AbortSignal.timeout(event.request.mode === 'navigate' ? 4000 : 15000) });
            if (!response.ok && event.request.mode === 'navigate') throw new Error('Navigation failed');
            // Depolama doluysa bile çevrimiçi yanıtı kullanabiliriz.
            if (response.ok && cache) await cache.put(event.request, response.clone()).catch(() => {});
            return response;
        } catch {
            const saved = await cache?.match(event.request);
            if (saved) return saved;
            if (event.request.mode === 'navigate') return (await cache?.match(new URL('index.html', APP_ROOT))) || Response.error();
            return Response.error();
        }
    })());
});
