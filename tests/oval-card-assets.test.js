import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

for (const file of ['../script.js', '../public/script.js']) {
    test(`${file} does not request the current page for an image-less challenge`, () => {
        const source = readFileSync(new URL(file, import.meta.url), 'utf8');
        const start = source.indexOf('    const applyOvalHalfPiece =');
        const end = source.indexOf('    const resetOvalBoardGame =', start);
        assert.ok(start >= 0 && end > start);
        const context = {};
        vm.runInNewContext(source.slice(start, end) + '\nglobalThis.apply = applyOvalHalfPiece;', context);

        const image = { src: 'previous-image.webp', removeAttribute(name) { if (name === 'src') delete this.src; } };
        const properties = new Map();
        const card = {
            querySelector: () => ({ querySelector: () => image }),
            style: { setProperty: (name, value) => properties.set(name, value) },
            dataset: {},
            classList: { toggle() {} },
        };
        context.apply(card, { image: '', side: 'left', number: 'bomb-1', challenge: true, challengeType: 'bomb' });
        assert.equal(image.src, undefined);
        assert.equal(image.hidden, true);
        assert.equal(properties.get('--oval-piece-image'), 'none');

        context.apply(card, { image: 'assets/oval.webp', side: 'right', number: 1, challenge: false });
        assert.equal(image.src, 'assets/oval.webp');
        assert.equal(image.hidden, false);
        assert.equal(properties.get('--oval-piece-image'), 'url("assets/oval.webp")');
    });
}

test('initial HTML contains no empty image URLs', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    assert.doesNotMatch(html, /<img\b[^>]*\bsrc\s*=\s*(["'])\s*\1/i);
});
