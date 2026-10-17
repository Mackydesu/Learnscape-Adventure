import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const appBase = new URL('https://example.test/Learnscape-Adventure/');
const root = new URL('../', import.meta.url);
const read = (file) => readFileSync(new URL(file, root), 'utf8');

test('page scripts and the install manifest stay within the project path', () => {
    const html = read('index.html');
    const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((match) => match[1]);
    assert.ok(scripts.length > 0);
    for (const src of scripts) {
        assert.ok(new URL(src, appBase).pathname.startsWith(appBase.pathname), src);
    }

    const manifest = JSON.parse(read('manifest.webmanifest'));
    for (const url of [manifest.start_url, ...manifest.icons.map((icon) => icon.src)]) {
        assert.ok(new URL(url, appBase).pathname.startsWith(appBase.pathname), url);
        assert.ok(existsSync(new URL(url, root)), `${url} must exist`);
    }
    assert.ok(existsSync(new URL('.nojekyll', root)), 'GitHub Pages must publish the ONNX runtime');
});

test('Cloudflare serves the installed app start file without redirecting it', () => {
    const config = JSON.parse(read('wrangler.jsonc'));
    assert.equal(config.assets.html_handling, 'none');
    assert.equal(config.assets.not_found_handling, 'single-page-application');
});

test('the static asset list resolves within the project path', () => {
    const manifest = JSON.parse(read('runtime-assets.json'));
    assert.ok(manifest.assets.length > 0);
    for (const asset of manifest.assets) {
        assert.ok(new URL(asset, appBase).pathname.startsWith(appBase.pathname), asset);
        assert.ok(existsSync(new URL(asset, root)), `${asset} must exist`);
        const contents = readFileSync(new URL(asset, root));
        assert.equal(manifest.sizes[asset], contents.byteLength, `${asset} size`);
        const fingerprint = /\.(?:html?|js|mjs|css|svg|webmanifest|json)$/i.test(asset)
            ? Buffer.from(contents.toString('utf8').replace(/\r\n/g, '\n'), 'utf8')
            : contents;
        assert.equal(manifest.hashes[asset], createHash('sha256').update(fingerprint).digest('hex'), `${asset} hash`);
    }
});
