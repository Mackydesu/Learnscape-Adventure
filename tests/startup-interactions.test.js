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
        document: { documentElement: { classList: { contains: () => false } } },
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
    context.document.documentElement.classList.contains = (name) => name === 'is-phone';
    context.navigate('circleIllustration');
    callbacks.shift()();
    callbacks.shift()();
    assert.deepEqual(events, ['loading', 'route', 'fade'], 'phones must wait for an explicit lesson Play action');

    events.length = 0;
    context.currentRoute = 'shapeCircle';
    context.document.documentElement.classList.contains = () => false;
    context.navigate('circleIllustration');
    callbacks.shift()();
    lessonClasses.add('is-lesson-complete');
    callbacks.shift()();
    assert.deepEqual(events, ['loading', 'route', 'fade'], 'mission replay must not restart the lesson');
});

function circlePlayerHarness() {
    const classes = new Set();
    const pending = [];
    const warnings = [];
    const controls = {};
    const lesson = {
        hidden: false,
        classList: {
            add: (...names) => names.forEach((name) => classes.add(name)),
            remove: (...names) => names.forEach((name) => classes.delete(name)),
            contains: (name) => classes.has(name),
        },
    };
    const video = {
        hidden: false, currentTime: 0,
        play: () => new Promise((resolve, reject) => pending.push({ resolve, reject })),
        pause() {},
    };
    const context = {
        circleIllustrationPage: lesson, circleIllustrationVideo: video,
        circleTvLessonImage: { hidden: true }, circleTvMascot: null, circleTvQuestionPanel: null,
        isPageVisible: (page) => !page.hidden,
        resetCircleMissionGuide() {}, hideCircleIllustrationProgress() {}, resetCircleSortActivity() {},
        resetCircleHunt() {}, setCircleIllustrationEarnedStars() {}, resetShapeTvChoices() {},
        setCircleIllustrationPlayButtonVisible: (visible) => { controls.play = visible; },
        setCircleIllustrationSkipButtonVisible: (visible) => { controls.skip = visible; },
        console: { warn: (...args) => warnings.push(args) }, window: {},
    };
    const code = excerpt(script, '    let circleIllustrationPlayRequestId =', '    const isInShell =');
    vm.runInNewContext(code + '\nglobalThis.showLessonImage = showCircleTvLessonImage;', context);
    return { ...context, lesson, video, controls, pending, warnings };
}

test('interrupted Circle playback cannot restore controls after skipping or resetting', async () => {
    const player = circlePlayerHarness();
    let playing = player.window.__learnscapePlayCircleIllustrationVideo();
    player.showLessonImage();
    player.pending.shift().reject({ name: 'AbortError' });
    await playing;
    assert.equal(player.controls.play, false);
    assert.equal(player.controls.skip, false);
    assert.equal(player.circleTvLessonImage.hidden, false);

    playing = player.window.__learnscapePlayCircleIllustrationVideo();
    player.window.__learnscapeResetCircleIllustrationVideo();
    player.pending.shift().reject({ name: 'AbortError' });
    await playing;
    assert.equal(player.controls.play, true);
    assert.equal(player.controls.skip, true);
    assert.equal(player.warnings.length, 0);
});

test('only the current Circle play request can change retry controls', async () => {
    const player = circlePlayerHarness();
    const first = player.window.__learnscapePlayCircleIllustrationVideo();
    const second = player.window.__learnscapePlayCircleIllustrationVideo();
    player.pending.shift().reject({ name: 'AbortError' });
    await first;
    assert.equal(player.controls.play, false);
    player.pending.shift().reject({ name: 'NotAllowedError' });
    await second;
    assert.equal(player.controls.play, true);
    assert.equal(player.controls.skip, true);
    assert.equal(player.warnings.length, 1);

    const interrupted = player.window.__learnscapePlayCircleIllustrationVideo();
    player.pending.shift().reject({ name: 'AbortError' });
    await interrupted;
    assert.equal(player.controls.play, true, 'a still-visible interrupted lesson can be retried');
    assert.equal(player.warnings.length, 1);
});

test('unsupported landscape locking is harmless but unexpected errors remain visible', async () => {
    const warnings = [];
    const context = { window: { screen: { orientation: {} } }, console: { warn: (...args) => warnings.push(args) } };
    vm.runInNewContext(excerpt(script, '    const lockLandscape =', '    const enterFullscreenFlow =') + '\nglobalThis.lockLandscape = lockLandscape;', context);
    await context.lockLandscape();
    context.window.screen.orientation.lock = async () => { throw { name: 'NotSupportedError' }; };
    await context.lockLandscape();
    assert.equal(warnings.length, 0);
    context.window.screen.orientation.lock = async () => { throw { name: 'SecurityError' }; };
    await context.lockLandscape();
    assert.equal(warnings.length, 1);
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

function shopTutorialHarness({ replay = false, carrots = 10, unlocked = false } = {}) {
    const handlers = new Map();
    const timers = [];
    const calls = [];
    let purchased = false;
    let attached = true;
    const classes = new Set();
    const item = {
        dataset: { shopItem: 'circle' }, offsetWidth: 10,
        classList: {
            contains: (value) => classes.has(value),
            add: (value) => classes.add(value), remove: (value) => classes.delete(value),
            toggle: (value, enabled) => enabled ? classes.add(value) : classes.delete(value),
        },
        setAttribute() {},
    };
    const useButton = { dataset: { shopUseKey: 'circle' } };
    const menu = {
        addEventListener: (name, handler) => handlers.set(name, handler),
        contains: () => true,
        querySelectorAll: () => [item],
        querySelector: (selector) => selector.includes('use-key') ? (purchased ? useButton : null) : item,
    };
    const target = {
        closest: (selector) => {
            if (!attached) return null;
            return selector === '.intro-shop-item' ? item : null;
        },
    };
    const context = {
        introMenuCopy: menu, onboardingStage: 'buy-circle',
        isTutorialCircleShopPurchase: () => replay,
        completeTutorialCircleShopPurchase: () => { purchased = true; },
        isLearnscapeIslandUnlocked: () => unlocked,
        getIntroShopCost: () => 10,
        resourceCounts: { carrots },
        setLearnscapeResourceCount: (_resource, value) => { context.resourceCounts.carrots = value; },
        showIntroCarrotSpendPopout() {}, introShopPurchaseKey: () => 'circle-key',
        writeSoundSetting: (key) => { if (key === 'circle-key') purchased = true; },
        syncLearnscapeIslandLocks() {}, setIntroShopStatus() {}, addLearnscapeNotification() {},
        syncIntroShopItems: () => { attached = false; },
        playIntroShopBuySound() {}, playIntroShopNopeSound() {}, pulseIntroCarrotCount() {},
        hideOnboardingCoach: () => calls.push('hide'),
        setOnboardingStage: (stage) => { context.onboardingStage = stage; },
        showOnboardingCoach: (node, message) => calls.push({ node, message }),
        openIntroMenu: (name) => calls.push(`open:${name}`), closeIntroMenu: () => calls.push('close'),
        window: {
            getLearnscapeResourceCount: () => context.resourceCounts.carrots,
            setTimeout: (callback, delay) => { timers.push({ callback, delay }); },
            playUiClickSound() {}, useLearnscapeIslandKey: () => calls.push('use'),
            __learnscapeNavigate: (route) => calls.push(`navigate:${route}`),
        },
    };
    const normalizedHtml = html.replace(/\r\n/g, '\n');
    const guide = excerpt(normalizedHtml, '            const advanceCircleShopTutorial =', '            const showProfileGuide =');
    const handler = excerpt(normalizedHtml, "            introMenuCopy?.addEventListener('click', (event) => {\n                const useKeyButton", "            introMenuCopy?.addEventListener('keydown', (event) => {\n                const item");
    vm.runInNewContext(guide + handler, context);
    return {
        context, calls, timers, item, useButton,
        click: (eventTarget = target) => handlers.get('click')({ target: eventTarget, preventDefault() {}, stopPropagation() {} }),
        setPurchased: () => { purchased = true; },
    };
}

test('shop tutorial advances even if purchasing removes the clicked cost element', () => {
    const guide = shopTutorialHarness();
    guide.click();
    assert.equal(guide.context.resourceCounts.carrots, 0);
    assert.equal(guide.context.onboardingStage, 'use-key');
    guide.timers.find(({ delay }) => delay === 120).callback();
    assert.ok(guide.calls.includes('open:shop'));
    assert.ok(guide.calls.some((call) => call.node === guide.useButton && call.message.includes('Use')));
});

test('shop tutorial does not advance when the purchase fails', () => {
    const guide = shopTutorialHarness({ carrots: 0 });
    guide.click();
    assert.equal(guide.context.onboardingStage, 'buy-circle');
    assert.equal(guide.timers.length, 0);
});

test('an early Use click repairs a guide left at the purchase step', () => {
    const guide = shopTutorialHarness();
    guide.setPurchased();
    guide.click({ closest: (selector) => selector === '[data-shop-use-key]' ? guide.useButton : null });
    assert.equal(guide.context.onboardingStage, 'use-key');
    assert.equal(guide.calls.includes('use'), false);
    guide.timers.find(({ delay }) => delay === 120).callback();
    assert.ok(guide.calls.some((call) => call.node === guide.useButton));
});

test('tutorial replay and already unlocked islands do not get stuck at the shop', () => {
    const replay = shopTutorialHarness({ replay: true });
    replay.click();
    assert.equal(replay.context.onboardingStage, 'use-key');
    const unlocked = shopTutorialHarness({ unlocked: true });
    unlocked.click();
    assert.equal(unlocked.context.onboardingStage, 'open-profile');
    assert.ok(unlocked.calls.includes('navigate:title'));
});
