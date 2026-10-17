import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const context = {
    URL, Response, Headers,
    self: {
        registration: { scope: 'https://game.test/' },
        addEventListener() {},
    },
};
vm.runInNewContext(readFileSync(new URL('../sw.js', import.meta.url), 'utf8') +
    '\nglobalThis.getRange = rangeResponse;', context);

test('cached videos support regular, open-ended, and suffix byte ranges', async () => {
    for (const [range, expected, contentRange] of [
        ['bytes=2-4', 'cde', 'bytes 2-4/10'],
        ['bytes=7-', 'hij', 'bytes 7-9/10'],
        ['bytes=-3', 'hij', 'bytes 7-9/10'],
    ]) {
        const response = await context.getRange(new Response('abcdefghij'), range);
        assert.equal(response.status, 206);
        assert.equal(response.headers.get('content-range'), contentRange);
        assert.equal(await response.text(), expected);
    }
});

test('out-of-bounds video ranges return a 416 response', async () => {
    const response = await context.getRange(new Response('abcdefghij'), 'bytes=20-30');
    assert.equal(response.status, 416);
    assert.equal(response.headers.get('content-range'), 'bytes */10');
});
