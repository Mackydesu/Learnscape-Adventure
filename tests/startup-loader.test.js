import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

// Run the actual inline startup code with controllable images and game events.
function createHarness({ images = [], gameInitialized = true } = {}) {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    const start = html.indexOf('const trackInitialImages =');
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
        document: { images },
        window: {
            __learnscapeGameInitialized: gameInitialized,
            setTimeout: (callback, delay) => setTimeout(callback, Math.ceil(delay / 100)),
            clearTimeout,
            addEventListener: (name, callback) => listeners.set(name, callback),
            removeEventListener: (name, callback) => {
                if (listeners.get(name) === callback) listeners.delete(name);
            },
            requestAnimationFrame: (callback) => setImmediate(callback),
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
        // A request for the runtime manifest or camera is a test failure.
        fetch: () => { throw new Error('Startup must not fetch the runtime manifest'); },
    };
    vm.runInNewContext(html.slice(start, end) + '\nglobalThis.runBoot = completeInitialBoot;', context);
    return {
        run: context.runBoot,
        signalGameReady: () => listeners.get('learnscape:gameinitialized')?.(),
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

test('game opens without downloading the asset manifest or waiting for camera detection', async () => {
    const app = createHarness();
    await app.run();
    assert.equal(app.hidden, true);
    assert.equal(app.classes.has('is-initial-loading'), false);
    assert.equal(app.dispatched, 'learnscape:appready');
    assert.equal(app.retry.hidden, true);
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
