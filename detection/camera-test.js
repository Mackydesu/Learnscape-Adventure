import { loadModel } from "./model.js";
import { startWebcam, stopWebcam } from "./webcam.js";
import { trackLiveShapes } from "./detectionManager.js";

const video = document.getElementById("webcam");
const viewfinder = document.querySelector(".circle-camera-viewfinder");
const overlay = document.getElementById("overlay");
const ctx = overlay.getContext("2d");
const status = document.getElementById("status");
const startButton = document.getElementById("startButton");
const buttonLabel = startButton.querySelector("strong");

let cameraStreamActive = false;
let modelReady = false;
let starting = false;
let startRequestId = 0;
let liveController = null;
let liveTask = null;

function drawTrackedObjects(tracks) {
    const width = viewfinder.clientWidth;
    const height = viewfinder.clientHeight;
    const pixelRatio = window.devicePixelRatio || 1;
    if (overlay.width !== Math.round(width * pixelRatio) || overlay.height !== Math.round(height * pixelRatio)) {
        overlay.width = Math.round(width * pixelRatio);
        overlay.height = Math.round(height * pixelRatio);
    }
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, width, height);

    if (!video.videoWidth || !video.videoHeight) return;
    const scale = Math.max(width / video.videoWidth, height / video.videoHeight);
    const offsetX = (width - video.videoWidth * scale) / 2;
    const offsetY = (height - video.videoHeight * scale) / 2;

    for (const track of tracks) {
        const x = track.x1 * scale + offsetX;
        const y = track.y1 * scale + offsetY;
        const boxWidth = (track.x2 - track.x1) * scale;
        const boxHeight = (track.y2 - track.y1) * scale;
        const color = track.verified ? "#35f178" : track.geometry?.verified ? "#ffe36a" : "#ff8a78";
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, boxWidth, boxHeight);

        // YOLO provides the visible candidate label. Prefer the verified
        // contour class; otherwise keep the candidate shown while the red
        // box/status indicates that it is still unverified.
        const contourLabel = track.geometry?.verified === true
            ? track.geometry.label || track.geometry.geometricShape
            : null;
        let displayLabel = contourLabel || track.label || "";
        const shapeVotes = track.geometry?.geometry?.shapeVoteCounts;
        // A three-corner contour vote outranks an unverified diamond proposal
        // for display. The red outline keeps this provisional result distinct
        // from the four-frame geometrically verified classification.
        if (track.geometry?.verified !== true && shapeVotes?.triangle > 0 &&
            ["triangle", "diamond"].includes(track.label)) {
            displayLabel = "triangle";
        }
        const text = displayLabel.toUpperCase();
        if (!text) continue;
        ctx.font = "bold 16px Arial";
        const labelWidth = ctx.measureText(text).width + 14;
        const labelY = Math.max(3, y - 28);
        ctx.fillStyle = color;
        ctx.fillRect(x, labelY, labelWidth, 25);
        ctx.fillStyle = "#173026";
        ctx.fillText(text, x + 7, labelY + 18);
    }
}

function startLiveFeed() {
    if (!modelReady || liveController) return;
    liveController = new AbortController();
    const controller = liveController;
    liveTask = trackLiveShapes(video, ({ tracks }) => {
        if (controller.signal.aborted || liveController !== controller) return;
        drawTrackedObjects(tracks);
        if (tracks.some(track => track.moveFartherAway)) {
            status.textContent = "Move the shape farther away.";
            return;
        }
        const verified = tracks.filter(track => track.verified);
        if (verified.length) {
            const names = [...new Set(verified.map(track => track.label))].join(", ");
            status.textContent = `Object following · ${names} verified`;
        } else if (tracks.length) {
            status.textContent = `Following ${tracks.length} object${tracks.length === 1 ? "" : "s"} · checking outline`;
        } else {
            status.textContent = "Show a shape inside the camera frame.";
        }
    }, { signal: controller.signal }).catch(error => {
        if (error.name !== "AbortError" && liveController === controller) {
            console.error("Camera feed detection failed:", error);
            status.textContent = "The camera feed could not detect shapes.";
        }
    }).finally(() => {
        if (liveController === controller) liveController = null;
    });
}

async function stopLiveFeed() {
    const task = liveTask;
    liveController?.abort();
    liveController = null;
    if (task) await task;
    if (liveTask === task) liveTask = null;
}

function stopCamera() {
    startRequestId++;
    starting = false;
    modelReady = false;
    cameraStreamActive = false;
    void stopLiveFeed();
    stopWebcam();
    video.pause();
    video.srcObject = null;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    buttonLabel.textContent = "Start Camera";
    startButton.disabled = false;
    status.textContent = "Camera stopped. Press Start Camera to begin.";
}

async function startCameraAndModel() {
    if (starting) return;
    starting = true;
    const requestId = ++startRequestId;
    startButton.disabled = false;
    buttonLabel.textContent = "Cancel";
    status.textContent = cameraStreamActive ? "Loading the camera game…" : "Starting camera…";

    try {
        if (!cameraStreamActive) {
            await startWebcam(video);
            if (requestId !== startRequestId) {
                stopWebcam();
                video.pause();
                video.srcObject = null;
                return;
            }
            cameraStreamActive = true;
        }

        status.textContent = "Camera is on · loading shape detection…";
        await loadModel();
        if (requestId !== startRequestId) return;

        modelReady = true;
        starting = false;
        buttonLabel.textContent = "Stop Camera";
        startButton.disabled = false;
        status.textContent = "Show a shape inside the camera frame.";
        startLiveFeed();
    } catch (error) {
        if (requestId !== startRequestId || error.name === "AbortError") return;
        starting = false;
        console.error("Camera game feed could not start:", error);
        status.textContent = cameraStreamActive
            ? "Camera is on, but shape detection could not load. Press Retry."
            : `Camera could not start: ${error.message}`;
        buttonLabel.textContent = cameraStreamActive ? "Retry" : "Start Camera";
        startButton.disabled = false;
    }
}

startButton.addEventListener("click", () => {
    if (starting || modelReady) stopCamera();
    else void startCameraAndModel();
});

window.addEventListener("resize", () => {
    if (modelReady) drawTrackedObjects([]);
});
