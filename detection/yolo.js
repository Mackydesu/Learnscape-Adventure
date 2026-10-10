
import * as ort from "onnxruntime-web";
import { loadModel } from "./model.js";

// IMPORTANT: These must match the class indices
// in your original Roboflow data.yaml.
export const CLASS_NAMES = [
    "circle",
    "diamond",
    "heart",
    "oval",
    "rectangle",
    "square",
    "star",
    "triangle"
];

const INPUT_SIZE = 640;
const CONF_THRESHOLD = 0.50;
const IOU_THRESHOLD = 0.45;

const canvas = document.createElement("canvas");
canvas.width = INPUT_SIZE;
canvas.height = INPUT_SIZE;

const ctx = canvas.getContext("2d", {
    willReadFrequently: true
});

// Step A: Prepare webcam image for YOLO11n.
function preprocess(video) {
    const originalWidth = video.videoWidth;
    const originalHeight = video.videoHeight;

    if (!originalWidth || !originalHeight) {
        throw new Error("Webcam is not ready.");
    }

    // Preserve aspect ratio to avoid distorting shapes.
    const scale = Math.min(
        INPUT_SIZE / originalWidth,
        INPUT_SIZE / originalHeight
    );

    const newWidth = Math.round(originalWidth * scale);
    const newHeight = Math.round(originalHeight * scale);

    const padX = Math.floor((INPUT_SIZE - newWidth) / 2);
    const padY = Math.floor((INPUT_SIZE - newHeight) / 2);

    ctx.fillStyle = "rgb(114,114,114)";
    ctx.fillRect(0, 0, INPUT_SIZE, INPUT_SIZE);

    ctx.drawImage(
        video,
        0, 0, originalWidth, originalHeight,
        padX, padY, newWidth, newHeight
    );

    const imageData = ctx.getImageData(
        0, 0, INPUT_SIZE, INPUT_SIZE
    ).data;

    const area = INPUT_SIZE * INPUT_SIZE;
    const input = new Float32Array(area * 3);

    // RGBA -> RGB, HWC -> CHW, normalize to 0-1.
    for (let i = 0; i < area; i++) {
        input[i] = imageData[i * 4] / 255;
        input[area + i] = imageData[i * 4 + 1] / 255;
        input[area * 2 + i] = imageData[i * 4 + 2] / 255;
    }

    const tensor = new ort.Tensor(
        "float32",
        input,
        [1, 3, INPUT_SIZE, INPUT_SIZE]
    );

    return {
        tensor,
        scale,
        padX,
        padY,
        originalWidth,
        originalHeight
    };
}

// Step B: Calculate overlap between boxes.
function calculateIoU(a, b) {
    const x1 = Math.max(a.x1, b.x1);
    const y1 = Math.max(a.y1, b.y1);
    const x2 = Math.min(a.x2, b.x2);
    const y2 = Math.min(a.y2, b.y2);

    const intersection =
        Math.max(0, x2 - x1) *
        Math.max(0, y2 - y1);

    const areaA =
        (a.x2 - a.x1) * (a.y2 - a.y1);

    const areaB =
        (b.x2 - b.x1) * (b.y2 - b.y1);

    const union = areaA + areaB - intersection;

    return union > 0 ? intersection / union : 0;
}

// Step C: Remove overlapping duplicate predictions.
function applyNMS(boxes) {
    boxes.sort((a, b) => b.confidence - a.confidence);

    const selected = [];

    for (const box of boxes) {
        if (selected.length >= 20) break;

        const duplicate = selected.some(kept =>
            kept.classId === box.classId &&
            calculateIoU(kept, box) > IOU_THRESHOLD
        );

        if (!duplicate) {
            selected.push(box);
        }
    }

    return selected;
}

// Step D: Decode raw YOLO11n predictions.
function decodeOutput(output, meta) {
    const { data, dims } = output;

    // Expected: [1, 12, 8400]
    // 4 box values + 8 shape classes.
    if (
        dims.length !== 3 ||
        dims[0] !== 1 ||
        dims[1] !== CLASS_NAMES.length + 4
    ) {
        throw new Error(
            "Unexpected model output: " + dims.join("x")
        );
    }

    const predictions = dims[2];
    const boxes = [];

    for (let i = 0; i < predictions; i++) {
        let bestScore = 0;
        let bestClass = -1;

        for (let c = 0; c < CLASS_NAMES.length; c++) {
            const score =
                data[(c + 4) * predictions + i];

            if (score > bestScore) {
                bestScore = score;
                bestClass = c;
            }
        }

        if (bestScore < CONF_THRESHOLD) continue;

        const cx = data[i];
        const cy = data[predictions + i];
        const w = data[predictions * 2 + i];
        const h = data[predictions * 3 + i];

        // Convert letterboxed coordinates
        // back to original webcam coordinates.
        const x1 = Math.max(0, Math.min(
            meta.originalWidth,
            (cx - w / 2 - meta.padX) / meta.scale
        ));

        const y1 = Math.max(0, Math.min(
            meta.originalHeight,
            (cy - h / 2 - meta.padY) / meta.scale
        ));

        const x2 = Math.max(0, Math.min(
            meta.originalWidth,
            (cx + w / 2 - meta.padX) / meta.scale
        ));

        const y2 = Math.max(0, Math.min(
            meta.originalHeight,
            (cy + h / 2 - meta.padY) / meta.scale
        ));

        if (x2 <= x1 || y2 <= y1) continue;

        boxes.push({
            classId: bestClass,
            label: CLASS_NAMES[bestClass],
            confidence: bestScore,
            x1, y1, x2, y2
        });
    }

    return applyNMS(boxes);
}

// Step E: Run YOLO inference.
export async function detectShapes(video) {
    const session = await loadModel();

    const meta = preprocess(video);

    const inputName = session.inputNames[0];
    const outputName = session.outputNames[0];

    const results = await session.run({
        [inputName]: meta.tensor
    });

    return decodeOutput(results[outputName], meta);
}
