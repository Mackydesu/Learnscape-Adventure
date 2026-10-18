import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { startWebcam, stopWebcam } from '../detection/webcam.js';

function drawingFunction(file, endMarker, context) {
    const source = readFileSync(new URL(file, import.meta.url), 'utf8');
    const start = source.indexOf('function drawTrackedObjects(');
    const end = source.indexOf(endMarker, start);
    assert.ok(start >= 0 && end > start);
    return vm.runInNewContext(`${source.slice(start, end)}\ndrawTrackedObjects`, context);
}

test('camera detection frames follow the unmirrored video through cover cropping', () => {
    const rectangles = [];
    const context = {
        setTransform() {}, clearRect() {},
        strokeRect: (...bounds) => rectangles.push(bounds),
        measureText: () => ({ width: 20 }), fillRect() {}, fillText() {},
    };
    const video = { videoWidth: 640, videoHeight: 480, dataset: { cameraFeedFlipped: 'true' } };
    const viewfinder = { clientWidth: 360, clientHeight: 240 };
    const canvas = {};
    const window = { devicePixelRatio: 1 };
    const track = { x1: 64, y1: 120, x2: 160, y2: 240, label: 'square', confidence: 0.9, labelStable: true };

    const drawGame = drawingFunction('../detection/gameDetection.js', 'async function handleTrackedFrame', {
        window, trackHasTargetLabel: (item, shape) => item.label === shape,
    });
    drawGame({ video, overlay: { viewfinder, canvas, context }, shape: 'square' }, [track]);

    const drawTest = drawingFunction('../detection/camera-test.js', 'function startLiveFeed', {
        window, video, viewfinder, overlay: canvas, ctx: context,
    });
    drawTest([track]);

    assert.deepEqual(rectangles, [[36, 52.5, 54, 67.5], [36, 52.5, 54, 67.5]]);
});

test('the camera test preview starts without mirroring the stream', async () => {
    const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    const stream = { getTracks: () => [{ stop() {} }] };
    Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        value: { mediaDevices: { getUserMedia: async () => stream } },
    });
    const transforms = [];
    const video = {
        dataset: {}, style: { setProperty: (...args) => transforms.push(args) },
        play: async () => {},
    };
    try {
        await startWebcam(video);
        assert.equal(video.srcObject, stream);
        assert.equal(video.playsInline, true);
        assert.deepEqual(transforms, []);
        assert.notEqual(video.dataset.cameraFeedFlipped, 'true');
    } finally {
        stopWebcam();
        if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator);
        else delete globalThis.navigator;
    }
});
