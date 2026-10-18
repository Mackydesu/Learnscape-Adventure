import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const script = readFileSync(new URL('../script.js', import.meta.url), 'utf8');

function treeMission() {
    const calls = [];
    const timers = [];
    const classes = (initial = []) => {
        const values = new Set(initial);
        return {
            add: (name) => values.add(name),
            remove: (name) => values.delete(name),
            contains: (name) => values.has(name),
            toggle: (name, enabled) => enabled ? values.add(name) : values.delete(name),
        };
    };
    const axe = { style: {}, classList: classes(), getBoundingClientRect() {} };
    const tree = {
        dataset: { treeStage: '0' }, classList: classes(['is-clickable']),
        getBoundingClientRect: () => ({ left: 400, top: 100, width: 200, height: 500 }),
        setAttribute: (name, value) => calls.push([name, value]),
    };
    const group = { classList: classes(['is-active']), getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 600 }) };
    const context = {
        triangleTreeAxe: axe, triangleGameTreeGroup: group, triangleGameTrees: [tree],
        triangleGamePage: { hidden: false }, triangleGameDialogueTimers: timers,
        triangleGameTreeSources: ['cut1', 'cut2', 'cut3', 'fallen'],
        playTriangleWoodChopAudio: () => calls.push('chop'),
        scheduleTriangleTreeCutGuide() {},
        releaseTriangleWoodBlocks: () => calls.push('wood'),
        window: { setTimeout: (callback) => callback },
    };
    const start = script.indexOf('    const swingTriangleTreeAxe =');
    const end = script.indexOf('    const isPointOnTriangleGameTree =', start);
    assert.ok(start >= 0 && end > start);
    vm.runInNewContext(script.slice(start, end) + '\nglobalThis.advance = advanceTriangleGameTree;', context);
    return { ...context, axe, tree, group, calls, timers };
}

test('every tree tap swings the axe and the third hit still releases wood', () => {
    const mission = treeMission();
    mission.advance(mission.tree);
    assert.equal(mission.axe.style.left, '50%');
    assert.equal(mission.axe.classList.contains('is-swinging'), true);
    assert.equal(mission.tree.dataset.treeStage, '1');
    mission.advance(mission.tree);
    assert.equal(mission.tree.dataset.treeStage, '2');
    mission.advance(mission.tree);
    assert.equal(mission.axe.style.left, '53.6%', 'the axe follows the leaning tree trunk');
    assert.equal(mission.tree.dataset.treeStage, '3');
    assert.equal(mission.tree.classList.contains('is-clickable'), false);
    mission.timers[0]();
    assert.equal(mission.tree.dataset.treeStage, '4');
    assert.equal(mission.calls.filter((call) => call === 'chop').length, 3);
    assert.equal(mission.calls.filter((call) => call === 'wood').length, 1);
    mission.advance(mission.tree);
    assert.equal(mission.calls.filter((call) => call === 'chop').length, 3);
});

test('the axe swings in from the left near the right edge and ignores inactive trees', () => {
    const mission = treeMission();
    mission.tree.getBoundingClientRect = () => ({ left: 820, top: 100, width: 200, height: 500 });
    mission.advance(mission.tree);
    assert.equal(mission.axe.classList.contains('is-from-left'), true);
    mission.group.classList.remove('is-active');
    mission.axe.classList.remove('is-swinging');
    mission.advance(mission.tree);
    assert.equal(mission.axe.classList.contains('is-swinging'), false);
    assert.equal(mission.tree.dataset.treeStage, '1');
});
