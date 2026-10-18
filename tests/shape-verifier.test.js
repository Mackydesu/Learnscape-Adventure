import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { verifyShape } from '../detection/shapeVerifier.js';

// A small in-memory canvas lets the real crop, mask, contour and polygon
// pipeline run against known shapes without a camera or browser.
function installCanvas() {
    globalThis.document = {
        createElement(name) {
            assert.equal(name, 'canvas');
            const canvas = { width: 0, height: 0 };
            canvas.getContext = () => ({
                drawImage(source, left, top, width, height) {
                    canvas.pixels = new Uint8ClampedArray(canvas.width * canvas.height * 4);
                    for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
                        const sourceX = Math.min(source.videoWidth - 1, Math.floor(left + (x + 0.5) * width / canvas.width));
                        const sourceY = Math.min(source.videoHeight - 1, Math.floor(top + (y + 0.5) * height / canvas.height));
                        const sourceOffset = (sourceY * source.videoWidth + sourceX) * 4;
                        canvas.pixels.set(source.pixels.subarray(sourceOffset, sourceOffset + 4), (y * canvas.width + x) * 4);
                    }
                },
                getImageData() { return { data: canvas.pixels, width: canvas.width, height: canvas.height }; }
            });
            return canvas;
        }
    };
}

function makeRectangle(width, height, degrees = 0) {
    const videoWidth = 240, videoHeight = 240;
    const angle = degrees * Math.PI / 180;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const corners = [[-width / 2, -height / 2], [width / 2, -height / 2], [width / 2, height / 2], [-width / 2, height / 2]]
        .map(([x, y]) => ({ x: 120 + x * cos - y * sin, y: 120 + x * sin + y * cos }));
    const pixels = new Uint8ClampedArray(videoWidth * videoHeight * 4);
    for (let y = 0; y < videoHeight; y++) for (let x = 0; x < videoWidth; x++) {
        const dx = x + 0.5 - 120, dy = y + 0.5 - 120;
        const localX = dx * cos + dy * sin, localY = -dx * sin + dy * cos;
        const foreground = Math.abs(localX) < width / 2 && Math.abs(localY) < height / 2;
        const offset = (y * videoWidth + x) * 4;
        pixels.set(foreground ? [20, 40, 80, 255] : [245, 245, 245, 255], offset);
    }
    const box = {
        x1: Math.min(...corners.map(point => point.x)), y1: Math.min(...corners.map(point => point.y)),
        x2: Math.max(...corners.map(point => point.x)), y2: Math.max(...corners.map(point => point.y)),
    };
    return { video: { videoWidth, videoHeight, pixels }, box };
}

installCanvas();

test('a clear upright or rotated rectangle corrects a square model prediction', () => {
    for (const [width, height, degrees] of [[70, 120, 0], [120, 70, 0], [70, 120, 25], [70, 120, 45]]) {
        const { video, box } = makeRectangle(width, height, degrees);
        const result = verifyShape(video, { ...box, label: 'square' });
        assert.equal(result.geometricShape, 'rectangle', `${width}x${height} at ${degrees}°: ${result.reason}`);
        assert.equal(result.verified, true);
        assert.equal(result.correctedLabel, 'rectangle');
        assert.equal(result.label, 'rectangle');
    }
});

test('a square stays a square and can correct a rectangle model prediction', () => {
    const { video, box } = makeRectangle(90, 90);
    const square = verifyShape(video, { ...box, label: 'square' });
    assert.equal(square.verified, true);
    assert.equal(square.correctedLabel, null);
    assert.equal(square.label, 'square');

    const corrected = verifyShape(video, { ...box, label: 'rectangle' });
    assert.equal(corrected.verified, true);
    assert.equal(corrected.correctedLabel, 'square');
    assert.equal(corrected.label, 'square');
});

test('an unclear contour cannot correct a model prediction from the box alone', () => {
    const { video, box } = makeRectangle(70, 120);
    video.pixels.fill(245);
    const result = verifyShape(video, { ...box, label: 'square' });
    assert.equal(result.verified, false);
    assert.equal(result.correctedLabel, null);
});

test('the live tracker exposes the corrected rectangle as a stable target', async () => {
    const { video, box } = makeRectangle(70, 120);
    const prediction = { ...box, label: 'square', confidence: 0.9 };
    const source = readFileSync(new URL('../detection/detectionManager.js', import.meta.url), 'utf8')
        .replace(/^import .*;\r?\n/gm, '')
        .replace(/^export /gm, '');
    const context = { detectShapes: async () => [prediction], verifyShape, DOMException, setTimeout, clearTimeout, console };
    vm.runInNewContext(`${source}\nglobalThis.trackLiveShapes = trackLiveShapes;`, context);

    const controller = new AbortController();
    let result;
    await context.trackLiveShapes(video, frame => {
        result = frame.tracks[0];
        controller.abort();
    }, { signal: controller.signal, intervalMs: 0, minVotes: 1 }).catch(error => {
        if (error.name !== 'AbortError') throw error;
    });
    assert.equal(result.label, 'rectangle');
    assert.equal(result.labelStable, true);
    assert.equal(result.verified, true);
    assert.equal(result.geometry.yoloLabel, 'square');
});
