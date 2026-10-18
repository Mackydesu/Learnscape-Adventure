import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const script = readFileSync(new URL('../script.js', import.meta.url), 'utf8');
const start = script.indexOf('    const alignRectangleInteriorScene =');
const end = script.indexOf('    let rectangleCounterWrongAudio', start);
assert.ok(start >= 0 && end > start);
const context = {};
vm.runInNewContext(script.slice(start, end) + '\nglobalThis.align = alignRectangleInteriorScene;', context);

function alignScene(width, height) {
    const background = { naturalWidth: 1672, naturalHeight: 941 };
    const counter = { dataset: {}, style: {} };
    const bubble = { dataset: {}, style: {} };
    const page = {
        hidden: false,
        getBoundingClientRect: () => ({ width, height }),
        querySelector: (selector) => ({
            '.shape-area-bg': background,
            '.rectangle-counter-storage': counter,
            '.rectangle-staff-bubble': bubble,
        })[selector],
    };
    context.align(page);
    return { bubble, counter };
}

test('rectangle staff dialogue keeps room above its anchor on a short landscape screen', () => {
    const { bubble } = alignScene(800, 310);
    assert.equal(bubble.style.top, '64px');
    assert.ok(parseFloat(bubble.style.left) > 0);
});

test('rectangle staff dialogue follows its original scene position when there is enough space', () => {
    const { bubble, counter } = alignScene(1366, 768);
    assert.ok(parseFloat(bubble.style.top) > 140);
    assert.ok(parseFloat(counter.style.top) > parseFloat(bubble.style.top));
});
