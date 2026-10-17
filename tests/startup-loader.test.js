import assert from 'node:assert/strict';
import { createHash, webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function createStorage() {
    const stores = new Map();
    return {
        async open(name) {
            if (!stores.has(name)) stores.set(name, new Map());
            const entries = stores.get(name);
            return {
                match: async (url) => entries.get(String(url))?.clone(),
                put: async (url, response) => { entries.set(String(url), response.clone()); },
            };
        },
        keys: async () => [...stores.keys()],
        delete: async (name) => stores.delete(name),
    };
}

// Run the actual inline startup code with controllable asset responses and events.
function createHarness({ images = [], gameInitialized = true, assetFetch, storage = createStorage(), persistentStorage = true, requestAnimationFrame = (callback) => setImmediate(callback), baseURI = 'https://game.test/index.html', manifest, timeout = (delay) => Math.ceil(delay / 100) } = {}) {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    const start = html.indexOf('const loadRuntimeAssets =');
    const end = html.indexOf('            syncFullscreenClass();', start);
    assert.ok(start >= 0 && end > start, 'startup implementation must be present');

    const listeners = new Map();
    const messages = [];
    const progressValues = [];
    const classes = new Set(['is-initial-loading']);
    let hidden = false;
    let dispatched = null;
    let focused = false;
    const retry = { hidden: true, focus: () => { focused = true; } };
    const context = {
        document: { images, baseURI },
        window: {
            caches: storage,
            crypto: webcrypto,
            __learnscapeGameInitialized: gameInitialized,
            setTimeout: (callback, delay) => setTimeout(callback, timeout(delay)),
            clearTimeout,
            addEventListener: (name, callback) => listeners.set(name, callback),
            removeEventListener: (name, callback) => {
                if (listeners.get(name) === callback) listeners.delete(name);
            },
            requestAnimationFrame,
            dispatchEvent: (event) => { dispatched = event.type; },
        },
        performance: { now: () => 2000 },
        initialBootStartedAt: 0,
        setInitialLoadingProgress: (value) => progressValues.push(value),
        setInitialLoadingMessage: (message) => messages.push(message),
        loadingOverlay: { querySelector: () => ({ classList: { add: () => {} } }) },
        loadingRetryButton: retry,
        body: { classList: { remove: (name) => classes.delete(name) } },
        hideLoading: () => { hidden = true; },
        fullscreenRestoreButton: null,
        CustomEvent: class CustomEvent { constructor(type) { this.type = type; } },
        console: { log() {}, warn() {}, error() {} },
        navigator: persistentStorage ? { serviceWorker: { register: async () => ({}) } } : {},
        caches: storage,
        URL, Response, AbortController,
        fetch: async (url, options) => {
            url = String(url);
            if (url.endsWith('/runtime-assets.json')) return new Response(JSON.stringify(manifest || {
                version: '0123456789abcdef0123',
                assets: ['assets/background.webp', 'assets/lesson.mp4'],
            }));
            return assetFetch ? assetFetch(url, options) : new Response('asset');
        },
    };
    vm.runInNewContext(html.slice(start, end) + '\nglobalThis.runBoot = completeInitialBoot;', context);
    return {
        run: context.runBoot,
        signalGameReady: () => {
            context.window.__learnscapeGameInitialized = true;
            listeners.get('learnscape:gameinitialized')?.();
        },
        get hidden() { return hidden; },
        get dispatched() { return dispatched; },
        get focused() { return focused; },
        retry,
        classes,
        messages,
        progressValues,
    };
}

function image({ complete = false, naturalWidth = 0, decode } = {}) {
    return {
        complete,
        naturalWidth,
        decode,
        currentSrc: '/assets/example.png',
        getAttribute: () => '/assets/example.png',
        addEventListener() {},
        removeEventListener() {},
    };
}

test('game opens after the packaged assets and game initialization are ready', async () => {
    const app = createHarness();
    await app.run();
    assert.equal(app.hidden, true);
    assert.equal(app.classes.has('is-initial-loading'), false);
    assert.equal(app.dispatched, 'learnscape:appready');
    assert.equal(app.retry.hidden, true);
});

test('a first successful load stores its manifest alongside the active offline assets', async () => {
    const storage = createStorage();
    const app = createHarness({ storage });
    await app.run();
    const cache = await storage.open('learnscape-runtime-0123456789abcdef0123');
    const manifest = await cache.match('https://game.test/runtime-assets.json');
    assert.ok(manifest, 'the asset list must be available even if the first page was not controlled');
    assert.equal((await manifest.json()).version, '0123456789abcdef0123');
    const meta = await storage.open('learnscape-meta-v2');
    assert.equal(await (await meta.match('https://game.test/__learnscape_active_cache__')).text(), 'learnscape-runtime-0123456789abcdef0123');
});

test('initial loading text displays the same percentage as the progress bar', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    assert.match(html, /<p class="page-loading-text">Game Loading\.\.\.\(0%\)<\/p>/);
    const start = html.indexOf('            const setInitialLoadingProgress =');
    const end = html.indexOf('            const setInitialLoadingMessage =', start);
    assert.ok(start >= 0 && end > start);
    const label = { textContent: 'Game Loading...(0%)' };
    const attributes = new Map([['aria-valuenow', '0']]);
    const context = {
        loadingMessage: label,
        loadingOverlay: { style: { setProperty() {} } },
        loadingProgressBar: { setAttribute: (name, value) => attributes.set(name, value) },
    };
    vm.runInNewContext('let initialLoadingProgress = 0;\n' + html.slice(start, end) + '\nglobalThis.setProgress = setInitialLoadingProgress;', context);
    for (const [value, expected] of [[0, 0], [46.5, 47], [84, 84], [100, 100], [20, 100]]) {
        context.setProgress(value);
        assert.equal(label.textContent, `Game Loading...(${expected}%)`);
        assert.equal(attributes.get('aria-valuenow'), String(expected));
    }
});

test('startup completes even when animation frames are paused', async () => {
    const app = createHarness({ requestAnimationFrame: () => {} });
    await app.run();
    assert.equal(app.hidden, true);
    assert.equal(app.dispatched, 'learnscape:appready');
});

test('asset URLs stay inside a GitHub Pages project subdirectory', async () => {
    const requests = [];
    const app = createHarness({
        baseURI: 'https://game.test/Learnscape-Adventure/index.html',
        assetFetch: async (url) => {
            requests.push(url);
            return new Response('asset');
        },
    });
    await app.run();
    assert.equal(app.hidden, true);
    assert.deepEqual(requests.sort(), [
        'https://game.test/Learnscape-Adventure/assets/background.webp',
        'https://game.test/Learnscape-Adventure/assets/lesson.mp4',
    ]);
});

test('startup waits for a complete asset download', async () => {
    let finishDownload;
    const download = new Promise((resolve) => { finishDownload = resolve; });
    const app = createHarness({ assetFetch: async (url) => {
        if (url.endsWith('.mp4')) await download;
        return new Response('asset');
    } });
    const boot = app.run();
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal(app.hidden, false);
    finishDownload();
    await boot;
    assert.equal(app.hidden, true);
});

test('large downloads report byte progress before the file finishes', async () => {
    let stream;
    const app = createHarness({
        manifest: {
            version: '0123456789abcdef0123',
            assets: ['assets/lesson.mp4'],
            sizes: { 'assets/lesson.mp4': 524288 },
        },
        assetFetch: async () => new Response(new ReadableStream({ start(controller) { stream = controller; } })),
    });
    const boot = app.run();
    while (!stream) await new Promise((resolve) => setTimeout(resolve, 1));
    stream.enqueue(new Uint8Array(262144));
    for (let attempt = 0; attempt < 50 && !app.progressValues.some((value) => value >= 46.5); attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 2));
    }
    assert.equal(app.hidden, false);
    assert.ok(app.progressValues.some((value) => value >= 46.5 && value < 85));
    stream.enqueue(new Uint8Array(262144));
    stream.close();
    await boot;
    assert.equal(app.hidden, true);
    assert.ok(app.progressValues.includes(100));
});

test('a slow large download is not aborted while bytes keep arriving', async () => {
    let stream;
    let attempts = 0;
    const app = createHarness({
        manifest: {
            version: '0123456789abcdef0123',
            assets: ['assets/lesson.mp4'],
            sizes: { 'assets/lesson.mp4': 524288 },
        },
        timeout: (delay) => delay === 120000 ? 100 : Math.ceil(delay / 100),
        assetFetch: async (url, options) => {
            attempts++;
            return new Response(new ReadableStream({ start(controller) {
                stream = controller;
                options.signal.addEventListener('abort', () => controller.error(new Error('download aborted')));
            } }));
        },
    });
    const boot = app.run();
    while (!stream) await new Promise((resolve) => setTimeout(resolve, 1));
    for (let chunk = 0; chunk < 8; chunk++) {
        await new Promise((resolve) => setTimeout(resolve, 25));
        stream.enqueue(new Uint8Array(65536));
    }
    stream.close();
    await boot;
    assert.equal(app.hidden, true);
    assert.equal(attempts, 1);
});

test('a failed asset download offers retry and retains successful downloads', async () => {
    const storage = createStorage();
    const requests = [];
    const app = createHarness({ storage, assetFetch: async (url) => {
        requests.push(url);
        return new Response('error', { status: url.endsWith('.mp4') ? 503 : 200 });
    } });
    await app.run();
    assert.equal(app.hidden, false);
    assert.equal(app.retry.hidden, false);
    assert.equal(requests.filter((url) => url.endsWith('.mp4')).length, 2);

    const resumedRequests = [];
    const resumed = createHarness({ storage, assetFetch: async (url) => {
        resumedRequests.push(url);
        return new Response('asset');
    } });
    await resumed.run();
    assert.equal(resumed.hidden, true);
    assert.deepEqual(resumedRequests, ['https://game.test/assets/lesson.mp4']);
    const offline = createHarness({ storage, assetFetch: () => { throw new Error('offline'); } });
    await offline.run();
    assert.equal(offline.hidden, true);
});

test('a damaged asset in the current cache is verified and downloaded again', async () => {
    const storage = createStorage();
    const version = '0123456789abcdef0123';
    const cache = await storage.open(`learnscape-runtime-${version}`);
    await cache.put('https://game.test/assets/voice.mp3', new Response('wrong'));
    let requests = 0;
    const app = createHarness({
        storage,
        manifest: {
            version, assets: ['assets/voice.mp3'], sizes: { 'assets/voice.mp3': 5 },
            hashes: { 'assets/voice.mp3': createHash('sha256').update('sound').digest('hex') },
        },
        assetFetch: async () => { requests++; return new Response('sound'); },
    });
    await app.run();
    assert.equal(app.hidden, true);
    assert.equal(requests, 1);
    assert.equal(await (await cache.match('https://game.test/assets/voice.mp3')).text(), 'sound');
});

test('a same-size corrupted download is retried before startup reaches 100 percent', async () => {
    let requests = 0;
    const app = createHarness({
        manifest: {
            version: '0123456789abcdef0123', assets: ['assets/voice.mp3'], sizes: { 'assets/voice.mp3': 5 },
            hashes: { 'assets/voice.mp3': createHash('sha256').update('sound').digest('hex') },
        },
        assetFetch: async () => new Response(++requests === 1 ? 'wrong' : 'sound'),
    });
    await app.run();
    assert.equal(requests, 2);
    assert.equal(app.hidden, true);
    assert.ok(app.progressValues.includes(100));
});

test('a truncated download cannot activate a cache or report a successful boot', async () => {
    const storage = createStorage();
    const meta = await storage.open('learnscape-meta-v2');
    const activeKey = 'https://game.test/__learnscape_active_cache__';
    await meta.put(activeKey, new Response('learnscape-runtime-11111111111111111111'));
    let requests = 0;
    const app = createHarness({
        storage,
        manifest: {
            version: '0123456789abcdef0123', assets: ['assets/lesson.mp4'], sizes: { 'assets/lesson.mp4': 5 },
            hashes: { 'assets/lesson.mp4': createHash('sha256').update('video').digest('hex') },
        },
        assetFetch: async () => { requests++; return new Response('vid'); },
    });
    await app.run();
    assert.equal(requests, 2);
    assert.equal(app.hidden, false);
    assert.equal(app.retry.hidden, false);
    assert.equal(app.progressValues.includes(100), false);
    assert.equal(await (await meta.match(activeKey)).text(), 'learnscape-runtime-11111111111111111111');
});

test('downloads are verified even when persistent storage is unavailable', async () => {
    let requests = 0;
    const app = createHarness({
        persistentStorage: false,
        manifest: {
            version: '0123456789abcdef0123', assets: ['assets/voice.mp3'], sizes: { 'assets/voice.mp3': 5 },
            hashes: { 'assets/voice.mp3': createHash('sha256').update('sound').digest('hex') },
        },
        assetFetch: async () => new Response(++requests === 1 ? 'bad' : 'sound'),
    });
    await app.run();
    assert.equal(requests, 2);
    assert.equal(app.hidden, true);
});

test('an update reuses verified unchanged assets and downloads changed files', async () => {
    const storage = createStorage();
    const previousName = 'learnscape-runtime-11111111111111111111';
    const previous = await storage.open(previousName);
    await previous.put('https://game.test/assets/background.webp', new Response('unchanged'));
    await previous.put('https://game.test/assets/lesson.mp4', new Response('outdated'));
    const meta = await storage.open('learnscape-meta-v2');
    await meta.put('https://game.test/__learnscape_active_cache__', new Response(previousName));
    const digest = (value) => createHash('sha256').update(value).digest('hex');
    const requests = [];
    const app = createHarness({
        storage,
        manifest: {
            version: '22222222222222222222',
            assets: ['assets/background.webp', 'assets/lesson.mp4'],
            sizes: { 'assets/background.webp': 9, 'assets/lesson.mp4': 7 },
            hashes: { 'assets/background.webp': digest('unchanged'), 'assets/lesson.mp4': digest('updated') },
        },
        assetFetch: async (url) => { requests.push(url); return new Response('updated'); },
    });
    await app.run();
    assert.equal(app.hidden, true);
    assert.deepEqual(requests, ['https://game.test/assets/lesson.mp4']);
    const current = await storage.open('learnscape-runtime-22222222222222222222');
    assert.equal(await (await current.match('https://game.test/assets/background.webp')).text(), 'unchanged');
    assert.equal(await (await current.match('https://game.test/assets/lesson.mp4')).text(), 'updated');
});

test('an update resumes verified files from an incomplete older download', async () => {
    const storage = createStorage();
    const previous = await storage.open('learnscape-runtime-11111111111111111111');
    await previous.put('https://game.test/assets/background.webp', new Response('saved'));
    const requests = [];
    const app = createHarness({
        storage,
        manifest: {
            version: '22222222222222222222',
            assets: ['assets/background.webp', 'assets/lesson.mp4'],
            sizes: { 'assets/background.webp': 5, 'assets/lesson.mp4': 4 },
            hashes: {
                'assets/background.webp': createHash('sha256').update('saved').digest('hex'),
                'assets/lesson.mp4': createHash('sha256').update('new!').digest('hex'),
            },
        },
        assetFetch: async (url) => { requests.push(url); return new Response('new!'); },
    });
    await app.run();
    assert.equal(app.hidden, true);
    assert.deepEqual(requests, ['https://game.test/assets/lesson.mp4']);
});

test('verified text assets are reused across Windows and GitHub line endings', async () => {
    const storage = createStorage();
    const previous = await storage.open('learnscape-runtime-11111111111111111111');
    await previous.put('https://game.test/assets/code.js', new Response('const x = 1;\r\n'));
    const app = createHarness({
        storage,
        manifest: {
            version: '22222222222222222222',
            assets: ['assets/code.js'],
            sizes: { 'assets/code.js': 13 },
            hashes: { 'assets/code.js': createHash('sha256').update('const x = 1;\n').digest('hex') },
        },
        assetFetch: async () => { throw new Error('unchanged file should not download'); },
    });
    await app.run();
    assert.equal(app.hidden, true);
});

test('an HTML fallback for a missing asset does not count as a successful download', async () => {
    const app = createHarness({ assetFetch: async () => new Response('<html></html>', {
        headers: { 'content-type': 'text/html' },
    }) });
    await app.run();
    assert.equal(app.hidden, false);
    assert.equal(app.retry.hidden, false);
});

test('failed or stalled images and stalled image decoding cannot block startup', async () => {
    const app = createHarness({ images: [
        image({ complete: true }),
        image(),
        image({ complete: true, naturalWidth: 10, decode: () => new Promise(() => {}) }),
    ] });
    await app.run();
    assert.equal(app.hidden, true);
    assert.equal(app.dispatched, 'learnscape:appready');
});

test('an image that failed before caching is retried after the assets are ready', async () => {
    const handlers = new Map();
    let retries = 0;
    const failedImage = {
        complete: true,
        naturalWidth: 0,
        getAttribute: (name) => name === 'src' ? '/assets/example.png' : null,
        setAttribute() {
            retries++;
            this.naturalWidth = 10;
            queueMicrotask(() => handlers.get('load')());
        },
        addEventListener: (name, handler) => handlers.set(name, handler),
        removeEventListener: (name) => handlers.delete(name),
    };
    const app = createHarness({ images: [failedImage] });
    await app.run();
    assert.equal(retries, 1);
    assert.equal(app.hidden, true);
});

test('game initialization can complete after startup begins', async () => {
    const app = createHarness({ gameInitialized: false });
    const boot = app.run();
    app.signalGameReady();
    await boot;
    assert.equal(app.hidden, true);
});

test('a failed core initialization shows an accessible retry instead of hanging', async () => {
    const app = createHarness({ gameInitialized: false });
    await app.run();
    assert.equal(app.hidden, false);
    assert.equal(app.retry.hidden, false);
    assert.equal(app.focused, true);
    assert.match(app.messages.at(-1), /try again/i);
});

test('the retry button remains interactive while other controls are blocked', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    const start = html.indexOf('            const blockInteractionUntilReady =');
    const end = html.indexOf('            const aboutTabs =', start);
    assert.ok(start >= 0 && end > start);
    const handlers = new Map();
    let reloads = 0;
    const retry = {
        contains: (target) => target === retry,
        addEventListener: (name, callback) => handlers.set(`retry:${name}`, callback),
    };
    const context = {
        body: { classList: { contains: () => true } },
        loadingRetryButton: retry,
        document: { addEventListener: (name, callback) => handlers.set(name, callback) },
        window: { location: { reload: () => { reloads += 1; } } },
    };
    vm.runInNewContext(html.slice(start, end), context);

    let blocked = false;
    const event = (target) => ({
        target,
        preventDefault: () => { blocked = true; },
        stopImmediatePropagation() {},
    });
    handlers.get('click')(event({}));
    assert.equal(blocked, true);
    blocked = false;
    handlers.get('click')(event(retry));
    handlers.get('keydown')(event(retry));
    assert.equal(blocked, false);
    handlers.get('retry:click')();
    assert.equal(reloads, 1);
});
