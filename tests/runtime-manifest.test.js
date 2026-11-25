import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('../runtime-assets.json', import.meta.url), 'utf8'));

function digestAsset(path) {
    let contents = readFileSync(new URL(`../${path}`, import.meta.url));
    if (/\.(?:html?|js|mjs|css|svg|webmanifest|json)$/i.test(path)) {
        contents = Buffer.from(contents.toString('utf8').replace(/\r\n/g, '\n'), 'utf8');
    }
    return createHash('sha256').update(contents).digest('hex');
}

test('the published bootstrap assets match their runtime integrity metadata', () => {
    for (const path of ['index.html', 'script.js', 'style.css', 'detection/init.js', 'detection/model.js']) {
        const file = readFileSync(new URL(path, root));
        assert.equal(manifest.sizes[path], file.byteLength, `${path} has an outdated size in runtime-assets.json`);
        assert.equal(manifest.hashes[path], digestAsset(path), `${path} has an outdated hash in runtime-assets.json`);
    }
});
