import assert from 'node:assert/strict';
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
function createHarness({ images = [], gameInitialized = true, assetFetch, storage = createStorage(), requestAnimationFrame = (callback) => setImmediate(callback), baseURI = 'https://game.test/index.html' } = {}) {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    const start = html.indexOf('const loadRuntimeAssets =');
    const end = html.indexOf('            syncFullscreenClass();', start);
    assert.ok(start >= 0 && end > start, 'startup implementation must be present');

    const listeners = new Map();
    const messages = [];
    const classes = new Set(['is-initial-loading']);
    let hidden = false;
    let dispatched = null;
    let focused = false;
    const retry = { hidden: true, focus: () => { focused = true; } };
    const context = {
        document: { images, baseURI },
        window: {
            caches: storage,
            __learnscapeGameInitialized: gameInitialized,
            setTimeout: (callback, delay) => setTimeout(callback, Math.ceil(delay / 100)),
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
        setInitialLoadingProgress: () => {},
        setInitialLoadingMessage: (message) => messages.push(message),
        loadingOverlay: { querySelector: () => ({ classList: { add: () => {} } }) },
        loadingRetryButton: retry,
        body: { classList: { remove: (name) => classes.delete(name) } },
        hideLoading: () => { hidden = true; },
        fullscreenRestoreButton: null,
        CustomEvent: class CustomEvent { constructor(type) { this.type = type; } },
        console: { log() {}, warn() {}, error() {} },
        navigator: { serviceWorker: { register: async () => ({}) } },
        caches: storage,
        URL, Response, AbortController,
        fetch: async (url, options) => {
            url = String(url);
            if (url.endsWith('/runtime-assets.json')) return new Response(JSON.stringify({
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
