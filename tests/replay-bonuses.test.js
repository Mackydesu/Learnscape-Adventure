import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

// Exercise the application's reward code with a small DOM/event harness. This
// keeps the tests independent of the camera, media playback, and animations.
function createHarness({ savedValues = {}, savedNotifications = [] } = {}) {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    const start = html.indexOf('            const progressRewardsByShape =');
    const end = html.indexOf('            const progressRewardObserver =', start);
    assert.ok(start >= 0 && end > start, 'reward implementation must be present');

    const listeners = new Map();
    const values = new Map(Object.entries(savedValues));
    const notifications = [...savedNotifications];
    const timers = new Map();
    const pages = new Map();
    const shownMessages = [];
    let nextTimer = 0;
    let carrots = 0;
    let stars = 0;
    const on = (target, type, handler) => {
        const key = `${target}:${type}`;
        listeners.set(key, [...(listeners.get(key) || []), handler]);
    };
    const emit = (target, type, event) => {
        for (const handler of listeners.get(`${target}:${type}`) || []) handler(event);
    };
    const routes = {
        circleIllustration: { pageId: 'learnscape-circle-illustration-page' },
        circleCamera: { pageId: 'learnscape-circle-camera-page' },
        rectangleDelivery: { pageId: 'learnscape-rectangle-delivery-page' },
        rectangleBakery: { pageId: 'learnscape-rectangle-bakery-page' },
        game3: { pageId: 'learnscape-game3-page' },
    };
    const context = {
        heartMissionCarrotReward: 20,
        learnscapeShapeLabels: { circle: 'Circle', rectangle: 'Rectangle', heart: 'Heart', star: 'Star' },
        learnscapeNotifications: notifications,
        introProfileBadgeUnlockKey: (shape) => `learnscape-profile-badge-unlocked:${shape}`,
        isTutorialSessionActive: false,
        routes,
        readSoundSetting: (key, fallback) => values.get(key) ?? fallback,
        writeSoundSetting: (key, value) => values.set(key, value),
        persistLearnscapeNotifications: () => {},
        persistPendingCarrotClaims: () => {},
        addLearnscapeNotification: (notification) => {
            if (!notifications.some((item) => item.id === notification.id)) notifications.push(notification);
        },
        awardLearnscapeProfileBadge: () => {},
        document: {
            addEventListener: (type, handler) => on('document', type, handler),
            querySelector: () => null,
            getElementById: (id) => pages.get(id),
        },
        window: {
            addEventListener: (type, handler) => on('window', type, handler),
            setTimeout: (handler, delay) => {
                const id = ++nextTimer;
                timers.set(id, { handler, delay });
                return id;
            },
            clearTimeout: (id) => timers.delete(id),
            addLearnscapeResource: (resource, amount) => {
                if (resource === 'carrots') carrots += amount;
                if (resource === 'stars') stars += amount;
            },
        },
    };
    const source = html.slice(start, end) + `
        globalThis.rewardTest = { syncLearnscapeProgressReward, getProgressMissionMessages };
    `;
    vm.runInNewContext(source, context);

    const makeProgress = ({ shape = 'circle', stage = 1, pageId = 'learnscape-circle-illustration-page', progressStage = 'lesson' } = {}) => {
        const page = { id: pageId, hidden: false, dataset: shape === 'circle' && stage === 3 ? { cameraShape: shape } : {}, matches: (selector) => selector === '.circle-camera-page' && stage === 3 };
        page.classList = { add() {}, remove() {}, contains: () => true };
        page.querySelector = () => null;
        const notification = {
            classList: { add() {}, remove() {} },
            set textContent(value) { if (value) shownMessages.push(value); },
            get offsetWidth() { return 0; },
        };
        const actions = { classList: { remove() {} }, querySelector: (selector) => selector === '.circle-lesson-progress-notification' ? notification : null };
        const title = { getAttribute: () => '', setAttribute() {}, querySelector: () => null };
        const starsElement = { dataset: { earnedStars: String(stage) }, setAttribute() {} };
        const progress = {
            dataset: progressStage ? { progressStage } : {},
            hidden: false,
            visible: true,
            getAttribute: () => progress.visible ? 'false' : 'true',
            setAttribute: (name, value) => { if (name === 'aria-hidden') progress.visible = value === 'false'; },
            closest: (selector) => selector === 'section[id]' ? page : null,
            querySelector: (selector) => ({
                '.circle-lesson-progress-actions': actions,
                '.circle-lesson-stars': starsElement,
                '.circle-lesson-progress-title': title,
                '.circle-lesson-progress-notification': notification,
            })[selector] || null,
        };
        page.querySelectorAll = () => [progress];
        pages.set(pageId, page);
        const button = {
            disabled: false,
            getClientRects: () => [{}],
            closest: (selector) => {
                if (selector === '[hidden], [aria-hidden="true"]') return null;
                if (selector === '.circle-lesson-progress') return progress;
                if (selector === 'section[id]') return page;
                return button;
            },
        };
        return { page, progress, button };
    };

    return {
        context,
        makeProgress,
        sync: (progress) => context.rewardTest.syncLearnscapeProgressReward(progress),
        click: (button) => emit('document', 'click', { target: button }),
        start: (detail) => emit('window', 'learnscape:replay-start', { detail }),
        route: (route) => emit('window', 'learnscape:routechange', { detail: { route } }),
        flush: () => [...timers.values()].sort((a, b) => a.delay - b.delay).forEach(({ handler }) => handler()),
        get carrots() { return carrots; },
        get stars() { return stars; },
        notifications,
        values,
        shownMessages,
    };
}

for (const [stage, bonus, pageId, progressStage] of [
    [1, 1, 'learnscape-circle-illustration-page', 'lesson'],
    [2, 2, 'learnscape-circle-illustration-page', 'hunt'],
    [3, 3, 'learnscape-circle-camera-page', null],
]) {
    test(`stage ${stage} retry grants +${bonus} once on completion`, () => {
        const app = createHarness();
        const { progress, button } = app.makeProgress({ stage, pageId, progressStage });
        app.sync(progress);
        assert.equal(app.carrots, 0, 'first completion does not receive a replay bonus');
        assert.equal(app.stars, 1);
        app.click(button);
        app.click(button);
        assert.equal(app.carrots, 0, 'clicks do not grant carrots');
        progress.visible = false;
        app.sync(progress);
        progress.visible = true;
        app.sync(progress);
        app.sync(progress);
        assert.equal(app.carrots, bonus);
        assert.equal(app.stars, 1, 'the first-completion star is not awarded again');
        app.flush();
        const phase = stage === 1 ? 'Lesson' : stage === 2 ? 'Mission' : 'Camera Game';
        assert.deepEqual(app.shownMessages, [`Circle ${phase} Completed!`, `Bonus +${bonus} carrot`]);
    });

    test(`stage ${stage} bonuses remain available for many consecutive retries`, () => {
        const app = createHarness();
        const { progress, button } = app.makeProgress({ stage, pageId, progressStage });
        app.sync(progress);
        for (let attempt = 1; attempt <= 25; attempt += 1) {
            app.click(button);
            progress.visible = false;
            app.sync(progress);
            progress.visible = true;
            app.sync(progress);
            app.sync(progress);
            app.flush();
            assert.equal(app.carrots, attempt * bonus, `retry ${attempt} pays exactly one bonus`);
            assert.equal(app.shownMessages.filter((message) => message === `Bonus +${bonus} carrot`).length, attempt);
        }
        assert.equal(app.stars, 1, 'retries do not repeat the first-completion star');
    });
}

test('a retry bonus is not blocked by an earlier progress notification', () => {
    const app = createHarness();
    const { page, progress } = app.makeProgress({ stage: 2, progressStage: 'hunt' });
    app.sync(progress);
    const retryButton = {
        disabled: false,
        getClientRects: () => [{}],
        closest: (selector) => {
            if (selector === '[hidden], [aria-hidden="true"]' || selector === '.circle-lesson-progress') return null;
            if (selector === 'section[id]') return page;
            return retryButton;
        },
    };
    app.click(retryButton);
    // The hidden and visible updates can be batched before the observer runs.
    progress.visible = false;
    progress.visible = true;
    app.sync(progress);
    app.sync(progress);
    app.flush();
    assert.equal(app.carrots, 2);
    assert.ok(app.shownMessages.includes('Bonus +2 carrot'));
});

test('first completions keep their original progress messages', () => {
    const app = createHarness();
    const messages = app.context.rewardTest.getProgressMissionMessages;
    assert.deepEqual(Array.from(messages('circle', 1, 0)), [
        'Circle Lesson Complete!', 'You earned 1 star in Circle!', 'You earned 3 carrots!',
    ]);
    assert.deepEqual(Array.from(messages('circle', 2, 0)), [
        'Circle Mission Complete!', 'You earned 2 stars in Circle!', 'You earned 5 carrots!',
    ]);
    assert.deepEqual(Array.from(messages('circle', 3, 0)), [
        'Circle Object Detection Complete!', 'You earned 3 stars in Circle!',
        'Circle Badge Earned!', 'You earned 7 carrots!',
    ]);
});

test('Heart mission awards +20 carrots and records the matching notification', () => {
    const app = createHarness();
    const { progress } = app.makeProgress({
        shape: 'heart',
        stage: 2,
        pageId: 'learnscape-shape-area-6-page',
        progressStage: null,
    });

    app.sync(progress);
    app.flush();

    assert.ok(app.shownMessages.includes('You earned 20 carrots!'));
    const reward = app.notifications.find((item) => item.id === 'carrots:learnscape-shape-area-6-page:complete');
    assert.equal(reward?.rewardAmount, 20);
    assert.equal(reward?.title, 'Heart reward: +20 carrots');
});

test('a saved completion can earn another bonus in a new session', () => {
    const first = createHarness();
    const { progress, button } = first.makeProgress();
    first.sync(progress);
    first.click(button);
    progress.visible = false;
    first.sync(progress);
    progress.visible = true;
    first.sync(progress);
    assert.equal(first.carrots, 1);
    const reloaded = createHarness({ savedValues: Object.fromEntries(first.values), savedNotifications: first.notifications });
    const next = reloaded.makeProgress();
    reloaded.start({ shape: 'circle', starStage: 1, route: 'circleIllustration' });
    reloaded.sync(next.progress);
    assert.equal(reloaded.carrots, 1);
    assert.equal(reloaded.stars, 0);
});

test('phase hub replays grant bonuses, but leaving the activity cancels them', () => {
    const app = createHarness();
    const { progress } = app.makeProgress();
    app.start({ shape: 'circle', starStage: 1, route: 'circleIllustration' });
    app.route('circleIllustration');
    app.sync(progress);
    assert.equal(app.carrots, 1);
    progress.visible = false;
    app.sync(progress);
    app.start({ shape: 'circle', starStage: 1, route: 'circleIllustration' });
    app.route('game3');
    progress.visible = true;
    app.sync(progress);
    assert.equal(app.carrots, 1);
});

test('a failed mission retry also keeps the first-completion rewards', () => {
    const app = createHarness();
    const { page, progress } = app.makeProgress({ stage: 2, progressStage: 'hunt' });
    const retryButton = {
        disabled: false,
        getClientRects: () => [{}],
        closest: (selector) => {
            if (selector === '[hidden], [aria-hidden="true"]' || selector === '.circle-lesson-progress') return null;
            if (selector === 'section[id]') return page;
            return retryButton;
        },
    };
    app.click(retryButton);
    assert.equal(app.carrots, 0);
    app.sync(progress);
    app.flush();
    assert.equal(app.carrots, 2);
    assert.equal(app.stars, 1);
    assert.deepEqual(app.shownMessages, ['Circle Mission Completed!', 'Bonus +2 carrot']);
    assert.ok(app.notifications.some((item) => item.id === 'carrots:learnscape-circle-illustration-page:hunt'
        && item.rewardAmount === 5 && item.claimRequired === true));
});

test('camera replay from the phase hub earns the camera bonus', () => {
    const app = createHarness();
    const { progress } = app.makeProgress({ stage: 3, pageId: 'learnscape-circle-camera-page', progressStage: null });
    app.start({ shape: 'circle', starStage: 3, route: 'circleCamera' });
    app.route('circleCamera');
    app.sync(progress);
    app.sync(progress);
    assert.equal(app.carrots, 3);
});

test('phase hub clears a previous completion notification before a replay', () => {
    const app = createHarness();
    const { progress } = app.makeProgress();
    app.sync(progress);
    app.start({ shape: 'circle', starStage: 1, route: 'circleIllustration' });
    app.sync(progress);
    assert.equal(app.carrots, 1);
});

test('rectangle retry survives transitions between delivery destinations', () => {
    const app = createHarness();
    const { progress } = app.makeProgress({ shape: 'rectangle', stage: 2, pageId: 'learnscape-rectangle-delivery-page', progressStage: null });
    app.start({ shape: 'rectangle', starStage: 2, route: 'rectangleDelivery' });
    app.route('rectangleBakery');
    app.route('rectangleDelivery');
    app.sync(progress);
    assert.equal(app.carrots, 2);
});

test('tutorial replays do not grant or queue a bonus', () => {
    const app = createHarness();
    const { progress, button } = app.makeProgress();
    app.context.isTutorialSessionActive = true;
    app.click(button);
    app.start({ shape: 'circle', starStage: 1, route: 'circleIllustration' });
    app.context.isTutorialSessionActive = false;
    app.sync(progress);
    assert.equal(app.carrots, 0);
});

test('Star mission win unhides progress and records the +30 reward and notifications', () => {
    const app = createHarness();
    const { page, progress, button } = app.makeProgress({ shape: 'star', stage: 1, pageId: 'learnscape-shape-area-7-page' });
    progress.hidden = true;
    progress.visible = false;
    const script = readFileSync(new URL('../script.js', import.meta.url), 'utf8');
    const start = script.indexOf('    const showShapePreviewProgress =');
    const end = script.indexOf('    const showDiamondMissionRewardProgress =', start);
    assert.ok(start >= 0 && end > start);
    const context = {
        starMissionPage: page,
        starMissionEndSession: 1,
        shapePreviewProgressByPage: new Map([[page, progress]]),
        isPageVisible: (item) => item && !item.hidden,
        stopStarMissionEndFlow: () => {},
        playUiClickSound: () => {},
        window: { syncLearnscapeProgressReward: app.sync, setTimeout: () => 0 },
    };
    vm.runInNewContext(script.slice(start, end) + '\nglobalThis.finishStarMission = showStarMissionRewardProgress;', context);
    context.finishStarMission(1);
    assert.equal(progress.hidden, false);
    assert.equal(progress.visible, true);
    assert.equal(app.stars, 1);
    const identity = 'learnscape-shape-area-7-page:hunt';
    const reward = app.notifications.find((item) => item.id === `carrots:${identity}`);
    assert.equal(reward?.rewardAmount, 30);
    assert.equal(reward?.claimRequired, true);
    assert.equal(reward?.claimed, false);
    assert.ok(app.notifications.some((item) => item.id === `completion:${identity}` && item.type === 'mission'));
    assert.ok(app.notifications.some((item) => item.id === `stars:${identity}` && item.stage === 2));
    app.sync(progress);
    assert.equal(app.stars, 1);
    assert.equal(app.notifications.filter((item) => item.id === `carrots:${identity}`).length, 1);
    app.flush();
    assert.ok(app.shownMessages.includes('You earned 30 carrots!'));
    app.click(button);
    progress.hidden = true;
    progress.visible = false;
    app.sync(progress);
    context.finishStarMission(1);
    app.flush();
    assert.equal(app.carrots, 2, 'retry bonus is credited automatically');
    assert.equal(app.stars, 1);
    assert.ok(app.shownMessages.includes('Bonus +2 carrot'));
});

test('a saved Star badge restores a previously missing mission reward once', () => {
    const identity = 'learnscape-shape-area-7-page:hunt';
    const app = createHarness({ savedValues: { 'learnscape-profile-badge-unlocked:star': 'true' } });
    assert.equal(app.stars, 1);
    assert.equal(app.values.get(`learnscape-progress-reward:${identity}`), 'true');
    assert.equal(app.notifications.find((item) => item.id === `carrots:${identity}`)?.rewardAmount, 30);
    const reloaded = createHarness({ savedValues: Object.fromEntries(app.values), savedNotifications: app.notifications });
    assert.equal(reloaded.stars, 0);
    assert.equal(reloaded.notifications.filter((item) => item.id === `carrots:${identity}`).length, 1);
});

test('saved Star camera scans recover a missing mission reward', () => {
    const identity = 'learnscape-shape-area-7-page:hunt';
    const app = createHarness({ savedValues: { 'learnscape-camera-scan-progress:v1': '{"star":1}' } });
    assert.equal(app.stars, 1);
    assert.equal(app.notifications.find((item) => item.id === `carrots:${identity}`)?.rewardAmount, 30);
});

test('a saved mission notification restores missing records without awarding another star', () => {
    const identity = 'learnscape-shape-area-7-page:hunt';
    const app = createHarness({ savedNotifications: [{ id: `stars:${identity}`, title: 'You earned 2 stars in Star' }] });
    assert.equal(app.stars, 0);
    assert.equal(app.notifications.find((item) => item.id === `carrots:${identity}`)?.rewardAmount, 30);
});

test('recovery preserves an already claimed Star mission reward', () => {
    const identity = 'learnscape-shape-area-7-page:hunt';
    const app = createHarness({ savedValues: {
        [`learnscape-progress-reward:${identity}`]: 'true',
        [`learnscape-carrot-claimed:carrots:${identity}`]: 'true',
    } });
    const reward = app.notifications.find((item) => item.id === `carrots:${identity}`);
    assert.equal(app.stars, 0);
    assert.equal(reward?.claimed, true);
});

test('recovery repairs an inconsistent existing claim notification', () => {
    const identity = 'learnscape-shape-area-7-page:hunt';
    const id = `carrots:${identity}`;
    const app = createHarness({
        savedValues: {
            [`learnscape-progress-reward:${identity}`]: 'true',
            [`learnscape-carrot-claimed:${id}`]: 'true',
        },
        savedNotifications: [{ id, claimed: false, rewardAmount: 30 }],
    });
    assert.equal(app.notifications.find((item) => item.id === id)?.claimed, true);
    assert.equal(app.stars, 0);
});

test('Star mission recovery requires evidence of completion', () => {
    const app = createHarness();
    assert.equal(app.stars, 0);
    assert.ok(!app.notifications.some((item) => item.id.includes('shape-area-7-page:hunt')));
});
