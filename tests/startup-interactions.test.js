import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = readFileSync(new URL('../script.js', import.meta.url), 'utf8');

function excerpt(source, startMarker, endMarker) {
    const start = source.indexOf(startMarker);
    const end = source.indexOf(endMarker, start);
    assert.ok(start >= 0 && end > start, `${startMarker} must be present`);
    return source.slice(start, end);
}

test('Circle lesson starts only after its route is visible and loading fades', () => {
    const callbacks = [];
    const lessonClasses = new Set();
    const lesson = { hidden: true, classList: { contains: (name) => lessonClasses.has(name) } };
    const events = [];
    const context = {
        currentRoute: 'shapeCircle', currentRouteKey: 'shapeCircle', isNavigating: false,
        pages: { circleIllustration: lesson },
        parseTarget: () => ({ routeName: 'circleIllustration', params: {} }),
        getRouteKey: (route) => route,
        showLoading: () => events.push('loading'),
        setRoute: () => { context.currentRoute = 'circleIllustration'; lesson.hidden = false; events.push('route'); },
        hideLoading: (callback) => { events.push('fade'); callbacks.push(callback); },
        window: {
            setTimeout: (callback) => { callbacks.push(callback); return 1; },
            __learnscapePlayCircleIllustrationVideo: () => events.push('play'),
        },
        loadingTimer: null,
    };
    vm.runInNewContext(excerpt(html, '            const navigateWithLoading =', '            window.__learnscapeNavigate =') + '\nglobalThis.navigate = navigateWithLoading;', context);
    context.navigate('circleIllustration');
    assert.deepEqual(events, ['loading']);
    callbacks.shift()();
    assert.deepEqual(events, ['loading', 'route', 'fade']);
    callbacks.shift()();
    assert.deepEqual(events, ['loading', 'route', 'fade', 'play']);

    events.length = 0;
    context.currentRoute = 'shapeCircle';
    context.navigate('circleIllustration');
    callbacks.shift()();
    lessonClasses.add('is-lesson-complete');
    callbacks.shift()();
    assert.deepEqual(events, ['loading', 'route', 'fade'], 'mission replay must not restart the lesson');
});

function cameraGuideHarness() {
    const listeners = new Map();
    const stored = new Map([['learnscape-camera-how-to-seen:circle', 'true']]);
    const timers = [];
    const classList = () => {
        const values = new Set();
        return { add: (value) => values.add(value), remove: (value) => values.delete(value), contains: (value) => values.has(value) };
    };
    const button = { hidden: true, classList: classList(), offsetWidth: 10, focus() {}, addEventListener: (name, handler) => listeners.set(`help:${name}`, handler) };
    const start = { isConnected: true, focus() {} };
    const page = { hidden: false, dataset: { cameraShape: 'circle' }, querySelector: () => start };
    const blocker = { hidden: false };
    const mission = { textContent: '' };
    const steps = { replaceChildren(...children) { this.children = children; } };
    const scroll = { scrollTo() {} };
    const next = { isConnected: true, focus() {}, addEventListener: (name, handler) => listeners.set(`continue:${name}`, handler) };
    const overlay = {
        hidden: true, classList: classList(),
        querySelector: (selector) => ({ '.shape-how-to-mission': mission, '.shape-how-to-steps': steps, '.shape-how-to-continue': next, '.shape-how-to-scroll': scroll })[selector],
    };
    const body = { classList: classList() };
    const context = {
        document: {
            body, activeElement: null,
            querySelector: (selector) => selector === '.camera-how-to-overlay' ? overlay : button,
            querySelectorAll: (selector) => selector === '.circle-camera-page[data-camera-shape]' ? [page] : [blocker],
            createElement: () => ({ textContent: '' }),
            addEventListener() {},
        },
        window: {
            localStorage: { getItem: (key) => stored.get(key) || null, setItem: (key, value) => stored.set(key, value) },
            setTimeout: (callback) => { timers.push(callback); return timers.length; },
            clearTimeout() {}, requestAnimationFrame: (callback) => callback(),
            addEventListener: (name, handler) => listeners.set(name, handler),
        },
        HTMLElement: class HTMLElement {},
        MutationObserver: class MutationObserver { constructor(callback) { this.callback = callback; } observe() {} },
        isShapeHowToElementVisible: (element) => Boolean(element && !element.hidden),
    };
    const code = excerpt(script, '    const cameraHowToOverlay =', '    syncFullscreenClass();');
    vm.runInNewContext(code + '\nglobalThis.syncGuide = syncCameraHowToGuide;', context);
    return { overlay, page, blocker, button, stored, timers, listeners, sync: context.syncGuide };
}

test('camera instructions wait for blockers and remain unseen until dismissed', () => {
    const guide = cameraGuideHarness();
    assert.equal(guide.overlay.hidden, true);
    assert.equal(guide.stored.has('learnscape-camera-how-to-seen-v2:circle'), false);

    guide.blocker.hidden = true;
    guide.sync();
    assert.equal(guide.overlay.hidden, false, 'old seen state must not suppress the repaired guide');
    assert.equal(guide.stored.has('learnscape-camera-how-to-seen-v2:circle'), false);

    guide.page.hidden = true;
    guide.sync();
    assert.equal(guide.overlay.hidden, true);
    guide.page.hidden = false;
    guide.sync();
    assert.equal(guide.overlay.hidden, false, 'leaving without dismissing must not consume the guide');

    guide.listeners.get('continue:click')();
    assert.equal(guide.stored.get('learnscape-camera-how-to-seen-v2:circle'), 'true');
    guide.timers.shift()();
    assert.equal(guide.overlay.hidden, true);
    assert.equal(guide.button.hidden, false);
    guide.listeners.get('help:click')();
    assert.equal(guide.overlay.hidden, false, 'help button must reopen the instructions');
});

test('failed preloaded media is reloaded before the next playback request', () => {
    const start = html.indexOf('                    HTMLMediaElement.prototype.play = function');
    const end = html.indexOf('\n                    };', start) + '\n                    };'.length;
    assert.ok(start >= 0 && end > start);
    const calls = [];
    const context = {
        HTMLMediaElement: function HTMLMediaElement() {},
        baseMediaVolumes: new WeakMap(), activeMedia: new Set(), registeredMedia: new WeakSet(),
        mediaVolumeDescriptor: { get: () => 1, set: () => {} }, soundScale: () => 1,
        nativeMediaPlay() { calls.push('play'); return Promise.resolve(); },
    };
    vm.runInNewContext(html.slice(start, end), context);
    const media = {
        error: { code: 4 }, currentSrc: '/assets/lesson.mp4', srcObject: null,
        getAttribute: () => null, querySelector: () => null, addEventListener() {},
        load() { calls.push('load'); this.error = null; },
    };
    context.HTMLMediaElement.prototype.play.call(media);
    context.HTMLMediaElement.prototype.play.call(media);
    assert.deepEqual(calls, ['load', 'play', 'play']);
});

test('counting audio requests playback inside the original user gesture', async () => {
    let audio;
    const handlers = new Map();
    class MockAudio {
        constructor() { audio = this; this.readyState = 0; this.currentTime = 0; }
        addEventListener(name, callback) { handlers.set(name, callback); }
        play() { this.played = true; return Promise.resolve(); }
        pause() {}
    }
    const context = { window: {
        Audio: MockAudio, __learnscapeSoundScale: () => 1,
        requestAnimationFrame: () => 1, cancelAnimationFrame() {}, setTimeout: () => 1, clearTimeout() {},
    } };
    vm.runInNewContext(excerpt(script, '    const numberChoiceAudioSegments =', '    const numberChoiceSelector ='), context);
    assert.equal(context.window.playLearnscapeCountingNumber(3), true);
    assert.equal(audio.played, true, 'play must be requested before metadata arrives');
    handlers.get('loadedmetadata')();
    assert.equal(audio.currentTime, 1.6);
    await Promise.resolve();
});

test('published and source game scripts stay in sync', () => {
    assert.equal(readFileSync(new URL('../public/script.js', import.meta.url), 'utf8'), script);
});
