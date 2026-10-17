import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const context = {
    URL, Response, Headers,
    self: {
        registration: { scope: 'https://game.test/' },
        addEventListener() {},
    },
};
vm.runInNewContext(readFileSync(new URL('../sw.js', import.meta.url), 'utf8') +
    '\nglobalThis.getRange = rangeResponse;', context);

test('cached videos support regular, open-ended, and suffix byte ranges', async () => {
    for (const [range, expected, contentRange] of [
        ['bytes=2-4', 'cde', 'bytes 2-4/10'],
        ['bytes=7-', 'hij', 'bytes 7-9/10'],
        ['bytes=-3', 'hij', 'bytes 7-9/10'],
    ]) {
        const response = await context.getRange(new Response('abcdefghij'), range);
        assert.equal(response.status, 206);
        assert.equal(response.headers.get('content-range'), contentRange);
        assert.equal(await response.text(), expected);
    }
});

test('out-of-bounds video ranges return a 416 response', async () => {
    const response = await context.getRange(new Response('abcdefghij'), 'bytes=20-30');
    assert.equal(response.status, 416);
    assert.equal(response.headers.get('content-range'), 'bytes */10');
});

function createWorker({ network, cacheAvailable = true } = {}) {
    const listeners = new Map();
    const stores = new Map();
    const scope = 'https://game.test/Learnscape-Adventure/';
    const caches = {
        async open(name) {
            if (!cacheAvailable) throw new Error('storage unavailable');
            if (!stores.has(name)) stores.set(name, new Map());
            const store = stores.get(name);
            return {
                async match(url) { return store.get(String(url))?.clone(); },
                async put(url, response) { store.set(String(url), response.clone()); },
            };
        },
    };
    const worker = {
        registration: { scope },
        location: { origin: 'https://game.test' },
        addEventListener(name, handler) { listeners.set(name, handler); },
    };
    vm.runInNewContext(readFileSync(new URL('../sw.js', import.meta.url), 'utf8'), {
        URL, Response, Headers, caches, self: worker,
        fetch: network || (async () => { throw new Error('offline'); }),
    });
    return {
        caches,
        async request(path, { mode = 'no-cors', cache = 'default' } = {}) {
            const pending = [];
            let response;
            listeners.get('fetch')({
                request: { url: new URL(path, scope).href, method: 'GET', mode, cache, headers: new Headers() },
                respondWith(promise) { response = promise; },
                waitUntil(promise) { pending.push(promise); },
            });
            const result = await response;
            await Promise.all(pending);
            return result;
        },
    };
}

test('offline project-root navigation falls back to the cached index page', async () => {
    const worker = createWorker();
    const shell = await worker.caches.open('learnscape-shell-v2');
    await shell.put('https://game.test/Learnscape-Adventure/index.html', new Response('cached home'));
    const response = await worker.request('./?launch=installed', { mode: 'navigate' });
    assert.equal(response.status, 200);
    assert.equal(await response.text(), 'cached home');
});

test('offline installed-app reloads use the cached index without serving stale asset reloads', async () => {
    const worker = createWorker();
    const shell = await worker.caches.open('learnscape-shell-v2');
    await shell.put('https://game.test/Learnscape-Adventure/index.html', new Response('cached home'));
    await shell.put('https://game.test/Learnscape-Adventure/script.js', new Response('old script'));
    for (const path of ['./?launch=installed', 'index.html']) {
        const response = await worker.request(path, { mode: 'navigate', cache: 'reload' });
        assert.equal(response.status, 200);
        assert.equal(await response.text(), 'cached home');
    }
    assert.equal((await worker.request('script.js', { cache: 'reload' })).status, 503);
});

test('a failed shell HTTP response falls back to the last cached copy', async () => {
    const worker = createWorker({ network: async () => new Response('unavailable', { status: 503 }) });
    const shell = await worker.caches.open('learnscape-shell-v2');
    await shell.put('https://game.test/Learnscape-Adventure/index.html', new Response('cached home'));
    for (const cache of ['default', 'reload']) {
        const response = await worker.request('./', { mode: 'navigate', cache });
        assert.equal(response.status, 200);
        assert.equal(await response.text(), 'cached home');
    }
});

test('offline startup uses the manifest paired with the active asset cache', async () => {
    const worker = createWorker();
    const base = 'https://game.test/Learnscape-Adventure/';
    const meta = await worker.caches.open('learnscape-meta-v2');
    const activeName = 'learnscape-runtime-0123456789abcdef0123';
    await meta.put(`${base}__learnscape_active_cache__`, new Response(activeName));
    const active = await worker.caches.open(activeName);
    await active.put(`${base}runtime-assets.json`, new Response('verified manifest'));
    const shell = await worker.caches.open('learnscape-shell-v2');
    await shell.put(`${base}runtime-assets.json`, new Response('incomplete update manifest'));
    const response = await worker.request('runtime-assets.json');
    assert.equal(response.status, 200);
    assert.equal(await response.text(), 'verified manifest');
});

test('an uncached failed resource returns an error response, not a rejected fetch', async () => {
    const worker = createWorker();
    for (const cache of ['default', 'reload']) {
        const response = await worker.request('assets/missing.webp', { cache });
        assert.equal(response.status, 503);
    }
    const otherPage = await worker.request('unknown-page', { mode: 'navigate' });
    assert.equal(otherPage.status, 503);
});

test('cache storage failures do not prevent working network responses', async () => {
    const worker = createWorker({ cacheAvailable: false, network: async () => new Response('online') });
    for (const [path, mode] of [['./', 'navigate'], ['assets/icon.png', 'no-cors']]) {
        const response = await worker.request(path, { mode });
        assert.equal(await response.text(), 'online');
    }
});
