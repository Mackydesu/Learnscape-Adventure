import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../detection/detectionManager.js', import.meta.url), 'utf8')
    .replace(/^import .*;\r?\n/gm, '')
    .replace(/^export /gm, '');
const context = {};
vm.runInNewContext(`${source}\nglobalThis.sizeHelpers = { MIN_DETECTION_RELATIVE_SIZE, MAX_DETECTION_RELATIVE_SIZE, getDetectionSizeGuidance, getRelativeObjectSize };`, context);
const {
    MIN_DETECTION_RELATIVE_SIZE,
    MAX_DETECTION_RELATIVE_SIZE,
    getDetectionSizeGuidance,
    getRelativeObjectSize
} = context.sizeHelpers;

const gameDetectionSource = readFileSync(new URL('../detection/gameDetection.js', import.meta.url), 'utf8')
    .replace(/^import .*;\r?\n/gm, '')
    .replace(/^export /gm, '');
const gameDetectionContext = {};
vm.runInNewContext(`${gameDetectionSource}\nglobalThis.cueHelpers = { getDistanceCueCopy };`, gameDetectionContext);
const { getDistanceCueCopy } = gameDetectionContext.cueHelpers;

test('bounding-box distance guidance is resolution independent', () => {
    const video = { videoWidth: 1280, videoHeight: 720 };
    assert.equal(getRelativeObjectSize({ x1: 128, y1: 144, x2: 256, y2: 216 }, video), 0.1);
    assert.equal(getDetectionSizeGuidance(0.1), 'move-closer');
    assert.equal(getDetectionSizeGuidance(MIN_DETECTION_RELATIVE_SIZE), 'within-range');
    assert.equal(getDetectionSizeGuidance(MAX_DETECTION_RELATIVE_SIZE), 'within-range');
    assert.equal(getDetectionSizeGuidance(MAX_DETECTION_RELATIVE_SIZE + 0.01), 'move-farther');
});

test('bounding-box distance cues direct the player in the correct direction', () => {
    const tooSmallGuidance = getDetectionSizeGuidance(MIN_DETECTION_RELATIVE_SIZE - 0.01);
    const tooLargeGuidance = getDetectionSizeGuidance(MAX_DETECTION_RELATIVE_SIZE + 0.01);

    assert.equal(getDistanceCueCopy(tooSmallGuidance), 'Subukang Lumapit');
    assert.equal(getDistanceCueCopy(tooLargeGuidance), 'Subukang Lumayo');
});
