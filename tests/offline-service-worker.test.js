import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function createCacheStorage() {
    const stores = new Map();
    const requestKey = (request) => String(request instanceof Request ? request.url : request?.url || request);
    const withoutSearch = (request) => {
        const url = new URL(requestKey(request));
        return `${url.origin}${url.pathname}`;
    };

    return {
        async open(name) {
            if (!stores.has(name)) stores.set(name, new Map());
            const entries = stores.get(name);
            return {
                async match(request, options = {}) {
                    const exact = entries.get(requestKey(request));
                    if (exact) return exact.clone();
                    if (!options.ignoreSearch) return undefined;
                    const key = withoutSearch(request);
                    for (const [entryUrl, response] of entries) {
                        if (withoutSearch(entryUrl) === key) return response.clone();
                    }
                    return undefined;
                },
                async put(request, response) {
                    entries.set(requestKey(request), response.clone());
                },
            };
        },
    };
}

function createWorkerHarness({ fetchImpl = async () => { throw new Error('offline'); } } = {}) {
    const listeners = new Map();
    const caches = createCacheStorage();
    const scope = 'https://game.test/Learnscape-Adventure/';
    const context = {
        caches,
        fetch: fetchImpl,
        Request,
        Response,
        URL,
        self: {
            registration: { scope },
            addEventListener: (type, listener) => listeners.set(type, listener),
            skipWaiting: async () => {},
            clients: { claim: async () => {} },
        },
    };
    const worker = readFileSync(new URL('../service-worker.js', import.meta.url), 'utf8');
    vm.runInNewContext(worker, context);

    return {
        caches,
        dispatchFetch(request) {
            let response;
            listeners.get('fetch')({
                request,
                respondWith: (value) => { response = Promise.resolve(value); },
            });
            return response;
        },
    };
}

async function seedRuntimeCache(caches) {
    const runtime = await caches.open('learnscape-runtime-offline-ready');
    await runtime.put('https://game.test/Learnscape-Adventure/index.html', new Response('game shell'));
    await runtime.put('https://game.test/Learnscape-Adventure/assets/Backgrounds/Area5.webp', new Response('area five'));
    const meta = await caches.open('learnscape-meta-v2');
    await meta.put(
        'https://game.test/Learnscape-Adventure/__learnscape_active_cache__',
        new Response('learnscape-runtime-offline-ready'),
    );
}

test('offline worker serves the verified asset cache even when asset URLs include a revision', async () => {
    const worker = createWorkerHarness();
    await seedRuntimeCache(worker.caches);

    const response = await worker.dispatchFetch(new Request(
        'https://game.test/Learnscape-Adventure/assets/Backgrounds/Area5.webp?rev=new-release',
    ));
    assert.equal(await response.text(), 'area five');
});

test('offline worker lets the startup loader revalidate a newer asset online', async () => {
    const worker = createWorkerHarness({
        fetchImpl: async () => new Response('updated area five'),
    });
    await seedRuntimeCache(worker.caches);

    const response = await worker.dispatchFetch(new Request(
        'https://game.test/Learnscape-Adventure/assets/Backgrounds/Area5.webp',
        { cache: 'no-cache' },
    ));
    assert.equal(await response.text(), 'updated area five');
});

test('offline worker falls back to the cached app shell for navigation', async () => {
    const worker = createWorkerHarness();
    await seedRuntimeCache(worker.caches);

    const request = {
        url: 'https://game.test/Learnscape-Adventure/',
        method: 'GET',
        mode: 'navigate',
    };
    const response = await worker.dispatchFetch(request);
    assert.equal(await response.text(), 'game shell');
});
