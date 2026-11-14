import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function worker(online = true, cacheFails = false, networkHangs = false) {
    const handlers = {};
    const stored = new Map();
    const cache = {
        addAll: async urls => { for (const url of urls) stored.set(url, new Response('cached')); },
        put: async (request, response) => { if (cacheFails) throw new Error('Quota'); stored.set(String(request.url || request), response); },
        match: async request => stored.get(String(request.url || request))
    };
    const source = fs.readFileSync(new URL('../scripts/service-worker.js', import.meta.url), 'utf8')
        .replace('__VERSION__', 'test').replace('__PRECACHE__', '["./index.html"]');
    vm.runInNewContext(source, {
        self: { registration: { scope: 'https://example.com/Game/' }, clients: { claim: async () => {} }, addEventListener: (name, handler) => { handlers[name] = handler; } },
        URL, Response, AbortSignal: { timeout(ms) { assert.ok(ms === 4000 || ms === 15000); return AbortSignal.timeout(networkHangs ? 5 : ms); } },
        caches: { open: async () => cache, keys: async () => ['unrelated', 'meyve-bahcesi-old'], delete: async name => removed.push(name) },
        fetch: async (request, options) => {
            if (networkHangs) return new Promise((resolve, reject) => {
                const timer = setTimeout(resolve, 1000);
                options.signal.addEventListener('abort', () => { clearTimeout(timer); reject(new Error('Timeout')); });
            });
            if (!online) throw new Error('offline');
            return new Response('current');
        }
    });
    const removed = [];
    return { handlers, stored, removed };
}

async function request(instance, url, mode = 'navigate') {
    let result;
    instance.handlers.fetch({ request: { url, method: 'GET', mode }, respondWith: promise => { result = promise; } });
    return result;
}

test('PWA serves fresh online content and caches it for offline use', async () => {
    const instance = worker();
    const url = 'https://example.com/Game/src/game.js?v=new';
    const response = await request(instance, url, 'cors');
    assert.equal(await response.text(), 'current');
    assert.equal(await instance.stored.get(url).text(), 'current');
    assert.equal(await request(instance, 'https://example.com/other/'), undefined);
});

test('Offline navigation falls back to app HTML under a GitHub Pages subdirectory', async () => {
    const instance = worker(false);
    instance.stored.set('https://example.com/Game/index.html', new Response('offline game'));
    assert.equal(await (await request(instance, 'https://example.com/Game/')).text(), 'offline game');
    instance.stored.set('https://example.com/Game/src/game.js?v=old', new Response('cached module'));
    assert.equal(await (await request(instance, 'https://example.com/Game/src/game.js?v=old', 'cors')).text(), 'cached module');
});

test('Activation removes only this game’s previous caches', async () => {
    const instance = worker();
    let activation;
    instance.handlers.activate({ waitUntil: promise => { activation = promise; } });
    await activation;
    assert.deepEqual(instance.removed, ['meyve-bahcesi-old']);
});

test('A full cache cannot turn a successful online launch into a blank screen', async () => {
    const instance = worker(true, true);
    assert.equal(await (await request(instance, 'https://example.com/Game/index.html')).text(), 'current');
});

test('A hanging connection falls back to the cached launch page', async () => {
    const instance = worker(true, false, true);
    instance.stored.set('https://example.com/Game/index.html', new Response('ready'));
    assert.equal(await (await request(instance, 'https://example.com/Game/index.html')).text(), 'ready');
});
