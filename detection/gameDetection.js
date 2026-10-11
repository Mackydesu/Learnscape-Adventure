import { detectStableShape, trackLiveShapes } from "./detectionManager.js";

const TRACKING_OPTIONS = { intervalMs: 90, minVotes: 4 };
const REMOVAL_CONFIRMATION_FRAMES = 5;

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

    for (const track of tracks) {
        const x = track.x1 * scale + offsetX;
        const y = track.y1 * scale + offsetY;
        const boxWidth = (track.x2 - track.x1) * scale;
        const boxHeight = (track.y2 - track.y1) * scale;
        const color = track.verified ? "#35f178" : track.geometry?.verified ? "#ffe36a" : "#ff8a78";
        context.globalAlpha = track.stale ? 0.55 : 1;
        context.strokeStyle = color;
        context.lineWidth = 3;
        context.strokeRect(x, y, boxWidth, boxHeight);

        // Keep the live box label to the shape name only, matching camera-test.
        let displayLabel = track.geometry?.verified === true
            ? track.geometry.label || track.geometry.geometricShape
            : track.label || "";
        const shapeVotes = track.geometry?.geometry?.shapeVoteCounts;
        if (track.geometry?.verified !== true && shapeVotes?.triangle > 0 &&
            ["triangle", "diamond"].includes(track.label)) {
            displayLabel = "triangle";
        }
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
    if (frame % 10 === 0) {
        console.log("[LIVE TRACKS]", tracks.map(track => ({
            label: track.label,
            verified: track.verified,
            geometryVerified: track.geometry?.verified,
            votes: track.verifiedFrames
        })));
    }

    if (session.waitingForRemoval) {
        if (tracks.length === 0) session.absentFrames++;
        else session.absentFrames = 0;

        if (session.absentFrames >= REMOVAL_CONFIRMATION_FRAMES) {
            session.waitingForRemoval = false;
            session.absentFrames = 0;
            setCameraStatus(session.page, `Object removed. Show a ${session.shape} to scan again.`);
        } else if (tracks.length) {
            setCameraStatus(session.page, "Remove the object from the camera frame before scanning again.");
        }
        return;
    }

    const verifiedTracks = tracks.filter(track => track.verified === true && track.geometry?.verified === true);
    const selected = verifiedTracks
        .filter(track => track.label === session.shape)
        .sort((a, b) => b.confidence - a.confidence)[0];
    if (selected) {
        if (session.confirming || frame - session.lastConfirmationFrame < 6) return;
        session.confirming = true;
        session.lastConfirmationFrame = frame;
        setCameraStatus(session.page, `Confirming the ${session.shape} scan…`);
        try {
            // The live box is only a candidate. The game progression consumes
            // the stable, multi-frame verifier result for the active level.
            const result = await detectStableShape(session.video, {
                frameCount: 5,
                minVotes: 4,
                targetLabel: session.shape,
                signal: session.controller.signal
            });
            console.log("[FINAL SCAN]", {
                target: session.shape,
                verified: result.verified,
                label: result.label,
                reason: result.reason,
                failureCategory: result.failureCategory,
                diagnostics: result.diagnostics
            });
            if (session.controller.signal.aborted || activeSession !== session) return;
            if (result.verified === true && result.label === session.shape) {
                session.waitingForRemoval = true;
                session.absentFrames = 0;
                window.dispatchEvent(new CustomEvent("learnscape:verified-shape", {
                    detail: { page: session.page, shape: session.shape, result, attemptId: ++nextScanAttemptId }
                }));
            } else if (result.verified === true) {
                setCameraStatus(session.page, `Verified ${result.label}, but this mission needs ${session.shape}.`);
            } else if ((result.diagnostics?.candidateCount ?? 0) === 0) {
                setCameraStatus(session.page, `Show a ${session.shape} inside the camera frame.`);
            } else if (["geometry-mismatch", "unclear-contour"].includes(result.failureCategory)) {
                setCameraStatus(session.page, "Hold the object steady against a plain background.");
            } else {
                setCameraStatus(session.page, `Keep the shape steady while it is checked for ${session.shape}.`);
            }
        } finally {
            session.confirming = false;
        }
        return;
    }

    if (!tracks.length) {
        setCameraStatus(session.page, `Show a ${session.shape} inside the camera frame.`);
    } else if (verifiedTracks.length) {
        setCameraStatus(session.page, `Verified ${verifiedTracks[0].label}. Show a ${session.shape} for this mission.`);
    } else if (tracks.some(track => track.geometry?.verified === true)) {
        setCameraStatus(session.page, `Keep the shape steady while it is checked for ${session.shape}.`);
    } else if (tracks.some(track => track.geometry?.geometry?.valid === false)) {
        setCameraStatus(session.page, "Hold the object steady against a plain background.");
    } else {
        setCameraStatus(session.page, `Following ${tracks.length} object${tracks.length === 1 ? "" : "s"} · checking outline`);
    }
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
        setCameraStatus(page, `Show a ${session.shape} inside the camera frame.`);
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
                setCameraStatus(page, "Camera detection stopped. Restart the camera to continue.");
            }
        }
    }
}

function startDetection(event, modelReady) {
    const { page, video, shape } = event.detail ?? {};
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
        waitingForRemoval: false,
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
