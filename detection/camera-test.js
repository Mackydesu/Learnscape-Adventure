
import { loadModel } from "./model.js";
import { startWebcam, stopWebcam } from "./webcam.js";
import { detectShapes } from "./yolo.js";

const video = document.getElementById("webcam");
const overlay = document.getElementById("overlay");
const ctx = overlay.getContext("2d");

const status = document.getElementById("status");
const prediction = document.getElementById("prediction");

const startButton = document.getElementById("startButton");
const scanButton = document.getElementById("scanButton");
const stopButton = document.getElementById("stopButton");

let scanning = false;

function drawBoxes(detections) {
    overlay.width = video.videoWidth;
    overlay.height = video.videoHeight;

    ctx.clearRect(0, 0, overlay.width, overlay.height);

    for (const box of detections) {
        ctx.strokeStyle = "#00ff55";
        ctx.lineWidth = 4;

        ctx.strokeRect(
            box.x1,
            box.y1,
            box.x2 - box.x1,
            box.y2 - box.y1
        );

        const text =
            `${box.label.toUpperCase()} ` +
            `${(box.confidence * 100).toFixed(1)}%`;

        ctx.font = "bold 22px Arial";
        const labelWidth = ctx.measureText(text).width + 12;
        const labelY = Math.max(0, box.y1 - 30);

        ctx.fillStyle = "#00aa44";
        ctx.fillRect(box.x1, labelY, labelWidth, 30);

        ctx.fillStyle = "white";
        ctx.fillText(text, box.x1 + 6, labelY + 22);
    }
}

startButton.addEventListener("click", async () => {
    startButton.disabled = true;

    try {
        status.textContent = "Starting camera...";

        await startWebcam(video);

        status.textContent = "Loading ONNX model...";

        const session = await loadModel();

        const outputName = session.outputNames[0];

        console.log(
            "ONNX output metadata:",
            session.outputMetadata[outputName]
        );

        status.textContent = "Camera and model are ready!";
        scanButton.disabled = false;

    } catch (error) {
        console.error(error);
        status.textContent = "Error: " + error.message;
        startButton.disabled = false;
    }
});

scanButton.addEventListener("click", async () => {
    if (scanning || !video.srcObject) return;

    scanning = true;
    scanButton.disabled = true;

    try {
        status.textContent = "Detecting shape...";

        const detections = await detectShapes(video);

        drawBoxes(detections);

        if (detections.length === 0) {
            prediction.textContent = "No shape detected.";
        } else {
            const best = detections[0];

            prediction.textContent =
                `Detected: ${best.label.toUpperCase()} ` +
                `(${(best.confidence * 100).toFixed(1)}%)`;
        }

        status.textContent = "Detection completed!";

    } catch (error) {
        console.error("Detection failed:", error);
        status.textContent = "Error: " + error.message;

    } finally {
        scanning = false;
        scanButton.disabled = false;
    }
});

stopButton.addEventListener("click", () => {
    stopWebcam();

    video.pause();
    video.srcObject = null;

    ctx.clearRect(0, 0, overlay.width, overlay.height);

    scanButton.disabled = true;
    startButton.disabled = false;

    prediction.textContent = "No shape detected yet.";
    status.textContent = "Camera stopped.";
});
