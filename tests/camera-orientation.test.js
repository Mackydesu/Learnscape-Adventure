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

function createDrawingContext() {
    const rectangles = [];
    const textTransforms = [];
    const fillTextCalls = [];
    return {
        rectangles,
        textTransforms,
        fillTextCalls,
        context: {
            setTransform() {}, clearRect() {}, save() {}, restore() {},
            scale: (...transform) => textTransforms.push(transform),
            strokeRect: (...bounds) => rectangles.push(bounds),
            measureText: () => ({ width: 20 }), fillRect() {},
            fillText: (...arguments_) => fillTextCalls.push(arguments_),
        },
    };
}

test('camera detection frames follow the unmirrored video through cover cropping', () => {
    const { rectangles, context } = createDrawingContext();
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

test('camera labels counter-mirror their glyphs while boxes follow the preview', () => {
    const gameDrawing = createDrawingContext();
    const testDrawing = createDrawingContext();
    const video = { videoWidth: 640, videoHeight: 480 };
    const viewfinder = { clientWidth: 360, clientHeight: 240 };
    const track = { x1: 64, y1: 120, x2: 160, y2: 240, label: 'square', confidence: 0.9, labelStable: true };
    const window = { devicePixelRatio: 1 };

    const drawGame = drawingFunction('../detection/gameDetection.js', 'async function handleTrackedFrame', {
        window, trackHasTargetLabel: (item, shape) => item.label === shape,
    });
    drawGame({ video, overlay: { viewfinder, canvas: {}, context: gameDrawing.context }, shape: 'square' }, [track]);

    const drawTest = drawingFunction('../detection/camera-test.js', 'function startLiveFeed', {
        window, video, viewfinder, overlay: {}, ctx: testDrawing.context,
    });
    drawTest([track]);

    assert.deepEqual(gameDrawing.textTransforms, [[-1, 1]]);
    assert.deepEqual(testDrawing.textTransforms, [[-1, 1]]);
    assert.equal(gameDrawing.fillTextCalls[0][1], -63);
    assert.equal(testDrawing.fillTextCalls[0][1], -63);
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
