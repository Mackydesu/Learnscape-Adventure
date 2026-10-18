import { trackLiveShapes } from "./detectionManager.js";

// The camera game rewards the first clearly labeled target frame. The
// removal gate below still prevents a held object from being counted twice.
const TRACKING_OPTIONS = { intervalMs: 90, minVotes: 1 };
const REMOVAL_CONFIRMATION_FRAMES = 5;
const SHAPE_NAMES = Object.freeze({
    circle: "circle",
    square: "square",
    triangle: "triangle",
    rectangle: "rectangle",
    oval: "oval",
    heart: "heart",
    star: "star",
    diamond: "diamond"
});

let activeSession = null;
let activeTask = Promise.resolve();
let nextScanAttemptId = 0;

function cameraPageVisible(page) {
    return Boolean(page?.isConnected && !page.hidden && page.getClientRects().length &&
        getComputedStyle(page).display !== "none" && getComputedStyle(page).visibility !== "hidden");
}

function getOverlay(page) {
    const viewfinder = page?.querySelector(".circle-camera-viewfinder");
    if (!viewfinder) return null;
    let canvas = viewfinder.querySelector(".camera-detection-overlay");
    if (!canvas) {
        canvas = document.createElement("canvas");
        canvas.className = "camera-detection-overlay";
        canvas.setAttribute("aria-hidden", "true");
        const video = viewfinder.querySelector(".circle-camera-video");
        viewfinder.insertBefore(canvas, video?.nextSibling ?? viewfinder.firstChild);
    }
    return { viewfinder, canvas, context: canvas.getContext("2d") };
}

function clearOverlay(page) {
    const canvas = page?.querySelector(".camera-detection-overlay");
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
}

function setCameraStatus(page, message) {
    const viewfinder = page?.querySelector(".circle-camera-viewfinder");
    if (!viewfinder) return;
    let status = viewfinder.querySelector(".camera-detection-status");
    if (!status) {
        status = document.createElement("p");
        status.className = "camera-detection-status";
        status.setAttribute("role", "status");
        status.setAttribute("aria-live", "polite");
        viewfinder.append(status);
    }
    status.textContent = message;
}

function notifyDetectionReady(session) {
    if (session.readyNotified || activeSession !== session || session.controller.signal.aborted) return;
    session.readyNotified = true;
    window.dispatchEvent(new CustomEvent("learnscape:cameradetectionready", {
        detail: { page: session.page, video: session.video, shape: session.shape }
    }));
}

function trackHasTargetLabel(track, targetShape) {
    return String(track?.label || "").trim().toLowerCase() === targetShape;
}

function shapeName(shape, capitalized = false) {
    const label = SHAPE_NAMES[String(shape || "").trim().toLowerCase()] || String(shape || "shape");
    return capitalized ? `${label[0].toUpperCase()}${label.slice(1)}` : label;
}

function targetCameraPrompt(shape) {
    return `Magpakita ng bagay na hugis ${shapeName(shape, true)} sa Kamera`;
}

function drawTrackedObjects(session, tracks) {
    const { viewfinder, canvas, context } = session.overlay;
    const width = viewfinder.clientWidth;
    const height = viewfinder.clientHeight;
    if (!width || !height || !context) return;

    const pixelRatio = window.devicePixelRatio || 1;
    const pixelWidth = Math.round(width * pixelRatio);
    const pixelHeight = Math.round(height * pixelRatio);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
    }
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, width, height);

    const { video } = session;
    if (!video.videoWidth || !video.videoHeight) return;
    // Match object-fit: cover so tracked boxes stay aligned with the visible feed.
    const scale = Math.max(width / video.videoWidth, height / video.videoHeight);
    const offsetX = (width - video.videoWidth * scale) / 2;
    const offsetY = (height - video.videoHeight * scale) / 2;

    // The camera game follows one object at a time, like a mobile camera's
    // focus frame. Prefer the target label if it is present.
    const track = [...tracks].sort((a, b) => {
        const targetDifference = Number(trackHasTargetLabel(b, session.shape)) - Number(trackHasTargetLabel(a, session.shape));
        return targetDifference || Number(b.labelStable) - Number(a.labelStable) || b.confidence - a.confidence;
    })[0];
    if (!track) return;

    {
        const sourceX = track.x1 * scale + offsetX;
        const sourceRight = track.x2 * scale + offsetX;
        const x = session.video.dataset.cameraFeedFlipped === "true"
            ? width - sourceRight
            : sourceX;
        const y = track.y1 * scale + offsetY;
        const boxWidth = (track.x2 - track.x1) * scale;
        const boxHeight = (track.y2 - track.y1) * scale;
        const targetLabelMatched = trackHasTargetLabel(track, session.shape) && track.labelStable === true;
        const color = targetLabelMatched ? "#35f178" : "#ffffff";
        context.globalAlpha = track.stale ? 0.55 : 1;
        context.strokeStyle = color;
        context.lineWidth = 3;
        context.strokeRect(x, y, boxWidth, boxHeight);

        // Show the same tracked label (including contour corrections) used
        // to determine whether this is the target.
        const displayLabel = track.label || "";
        const text = String(displayLabel).toUpperCase();
        if (text) {
            context.font = "bold 16px Arial";
            const labelWidth = context.measureText(text).width + 14;
            const labelY = Math.max(3, y - 28);
            context.fillStyle = color;
            context.fillRect(x, labelY, labelWidth, 25);
            context.fillStyle = "#173026";
            context.fillText(text, x + 7, labelY + 18);
        }
    }
    context.globalAlpha = 1;
}

async function handleTrackedFrame(session, { frame, tracks }) {
    if (activeSession !== session || session.controller.signal.aborted) return;
    drawTrackedObjects(session, tracks);
    // A correct scan owns the screen until its ordered audio and reward flow
    // finishes. Keep drawing, but do not accept another object meanwhile.
    if (session.page.classList.contains("is-camera-detection-celebrating")) return;
    if (frame % 10 === 0) {
        console.log("[LIVE TRACKS]", tracks.map(track => ({
            label: track.label,
            labelStable: track.labelStable,
            labelFrames: track.labelFrames,
            verified: track.verified,
            geometryVerified: track.geometry?.verified,
            votes: track.verifiedFrames
        })));
    }

    if (session.waitingForRemoval) {
        const targetStillVisible = tracks.some(track => trackHasTargetLabel(track, session.shape));
        if (!targetStillVisible) session.absentFrames++;
        else session.absentFrames = 0;

        if (session.absentFrames >= REMOVAL_CONFIRMATION_FRAMES) {
            session.waitingForRemoval = false;
            session.absentFrames = 0;
            setCameraStatus(session.page, targetCameraPrompt(session.shape));
            // The curtain listener opens only after the old target has been
            // absent for enough live frames to safely accept another scan.
            notifyDetectionReady(session);
        }
        return;
    }

    const selected = tracks
        .filter(track => !track.stale && track.labelStable === true && trackHasTargetLabel(track, session.shape))
        .sort((a, b) => b.confidence - a.confidence)[0];
    if (selected) {
        if (session.confirming || frame - session.lastConfirmationFrame < 6) return;
        session.confirming = true;
        session.lastConfirmationFrame = frame;
        setCameraStatus(session.page, "Napakahusay!");
        try {
            // The green target frame, check mark, confetti, audio, and reward
            // all begin together as soon as the label becomes stable.
            session.waitingForRemoval = true;
            session.absentFrames = 0;
            window.dispatchEvent(new CustomEvent("learnscape:verified-shape", {
                detail: {
                    page: session.page,
                    shape: session.shape,
                    result: {
                        verified: true,
                        stable: true,
                        label: session.shape,
                        confidence: selected.confidence,
                        verifiedFrames: selected.labelFrames,
                        verificationType: "label-and-temporal",
                        geometry: selected.geometry
                    },
                    attemptId: ++nextScanAttemptId
                }
            }));
        } finally {
            session.confirming = false;
        }
        return;
    }

    setCameraStatus(session.page, targetCameraPrompt(session.shape));
}

function stopActiveSession(page = null) {
    if (!activeSession || (page && activeSession.page !== page)) return;
    const session = activeSession;
    activeSession = null;
    session.controller.abort();
    clearOverlay(session.page);
}

async function runDetection(session, modelReady) {
    const { page, video, controller } = session;
    const { signal } = controller;
    try {
        await modelReady;
        if (signal.aborted || activeSession !== session) return;
        if (!session.waitingForRemoval) notifyDetectionReady(session);
        if (!session.waitingForRemoval) {
            setCameraStatus(page, targetCameraPrompt(session.shape));
        }
        await trackLiveShapes(video, frameResult => handleTrackedFrame(session, frameResult), {
            ...TRACKING_OPTIONS,
            signal
        });
    } catch (error) {
        if (error?.name !== "AbortError" && !signal.aborted && activeSession === session) {
            session.failed = true;
            console.error("Camera shape verification failed:", error);
            setCameraStatus(page, "Shape detection could not run. Return to the mission and reopen the camera.");
        }
    } finally {
        if (activeSession === session) {
            activeSession = null;
            clearOverlay(page);
            if (!signal.aborted && !session.failed && cameraPageVisible(page)) {
                setCameraStatus(page, "Huminto ang pagkilala ng kamera. I-restart ang kamera upang magpatuloy.");
            }
        }
    }
}

function startDetection(event, modelReady) {
    const { page, video, shape, requireRemoval = false } = event.detail ?? {};
    const normalizedShape = String(shape ?? "").trim().toLowerCase();
    if (!page || !video || !normalizedShape || page.dataset.cameraShape !== normalizedShape || !cameraPageVisible(page)) return;

    stopActiveSession();
    const session = {
        page,
        video,
        shape: normalizedShape,
        stream: video.srcObject,
        overlay: getOverlay(page),
        controller: new AbortController(),
        waitingForRemoval: Boolean(requireRemoval),
        readyNotified: false,
        absentFrames: 0,
        confirming: false,
        lastConfirmationFrame: -Infinity
    };
    if (!session.stream?.active || !session.overlay) return;

    activeSession = session;
    const { signal } = session.controller;
    activeTask = activeTask.catch(() => {}).then(() => {
        if (signal.aborted || activeSession !== session) return;
        return runDetection(session, modelReady);
    }).catch(error => {
        if (!signal.aborted) console.error("Camera detection task failed:", error);
    });
}

export function initializeGameCameraDetection(modelReady) {
    window.addEventListener("learnscape:camerastarted", event => startDetection(event, modelReady));
    window.addEventListener("learnscape:camerastopped", event => stopActiveSession(event.detail?.page ?? null));
    window.addEventListener("learnscape:routechange", event => {
        if (activeSession && event.detail?.route !== `${activeSession.shape}Camera`) {
            stopActiveSession();
        }
    });
}
