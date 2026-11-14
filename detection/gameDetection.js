import { trackLiveShapes } from "./detectionManager.js";

// The camera game rewards the first clearly labeled target frame. The
// removal gate below still prevents a held object from being counted twice.
// Run the next inference immediately after the previous one so the tracking
// box follows a moving object without an added polling delay.
const TRACKING_OPTIONS = { intervalMs: 0, minVotes: 1 };
const REMOVAL_CONFIRMATION_FRAMES = 5;
const DISTANCE_CUE_AUDIO = Object.freeze({
    "move-farther": "assets/Audios/Voice over/Lumayo.mp3",
    "move-closer": "assets/Audios/Voice over/Lumapit.mp3"
});
const DISTANCE_CUE_REPLAY_DELAY_MS = 2800;
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

function cameraCurtainIsClosed(page) {
    const curtains = page?.querySelector(".camera-processing-curtains");
    return Boolean(
        page?.classList.contains("is-camera-processing")
        || curtains?.getAttribute("aria-hidden") === "false"
    );
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
    // Keep coaching outside the viewfinder so the feed and detection box stay
    // unobstructed. Move a cue created by an earlier build when this page is
    // still alive during in-app navigation.
    let distanceCue = page.querySelector(".camera-detection-distance-cue");
    if (!distanceCue) {
        distanceCue = document.createElement("p");
        distanceCue.className = "camera-detection-distance-cue";
        distanceCue.setAttribute("role", "status");
        distanceCue.setAttribute("aria-live", "polite");
        distanceCue.hidden = true;
    }
    if (distanceCue.parentElement !== page) page.append(distanceCue);

    let distanceCueCharacter = page.querySelector(".camera-detection-distance-character");
    if (!distanceCueCharacter) {
        distanceCueCharacter = document.createElement("img");
        distanceCueCharacter.className = "camera-detection-distance-character";
        distanceCueCharacter.src = "assets/Character/ch6.webp";
        distanceCueCharacter.alt = "";
        distanceCueCharacter.setAttribute("aria-hidden", "true");
        distanceCueCharacter.hidden = true;
    }
    if (distanceCueCharacter.parentElement !== page) page.append(distanceCueCharacter);
    return {
        viewfinder,
        canvas,
        context: canvas.getContext("2d"),
        distanceCue,
        distanceCueCharacter
    };
}

function clearOverlay(page) {
    const canvas = page?.querySelector(".camera-detection-overlay");
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    const distanceCue = page.querySelector(".camera-detection-distance-cue");
    if (distanceCue) {
        distanceCue.hidden = true;
        distanceCue.textContent = "";
        delete distanceCue.dataset.guidance;
    }
    const distanceCueCharacter = page.querySelector(".camera-detection-distance-character");
    if (distanceCueCharacter) distanceCueCharacter.hidden = true;
}

function setCameraStatus(page) {
    // The camera feed stays text-free. Remove the legacy live-status label in
    // case it was created by an earlier script version.
    page?.querySelector(".camera-detection-status")?.remove();
}

export function getDistanceCueCopy(guidance = "") {
    // A larger-than-allowed box means the object is too close to the camera,
    // so the player must move it farther away. A small box needs the inverse.
    if (guidance === "move-farther") return "Subukang Lumayo";
    if (guidance === "move-closer") return "Subukang Lumapit";
    return "";
}

function stopDistanceCueAudio(session) {
    const audio = session?.distanceCueAudio;
    if (!audio) return;
    audio.onended = null;
    audio.onerror = null;
    audio.pause();
    session.distanceCueAudio = null;
}

function hideDistanceCue(session) {
    const cue = session?.overlay?.distanceCue;
    if (cue) {
        cue.hidden = true;
        cue.textContent = "";
        delete cue.dataset.guidance;
    }
    const character = session?.overlay?.distanceCueCharacter;
    if (character) character.hidden = true;
    if (session) {
        session.visibleDistanceCueGuidance = "";
        session.pendingDistanceCueClear = false;
    }
}

function playDistanceCueAudio(session, guidance) {
    const source = DISTANCE_CUE_AUDIO[guidance];
    const soundScale = window.__learnscapeSoundScale?.() ?? 1;
    if (!source || !window.Audio || soundScale <= 0) return;

    const now = Date.now();
    if (session.lastDistanceCueGuidance === guidance
        && now - (session.lastDistanceCuePlayedAt || 0) < DISTANCE_CUE_REPLAY_DELAY_MS) return;

    stopDistanceCueAudio(session);
    const audio = new window.Audio(source);
    session.distanceCueAudio = audio;
    session.lastDistanceCueGuidance = guidance;
    session.lastDistanceCuePlayedAt = now;
    const release = () => {
        if (session.distanceCueAudio !== audio) return;
        session.distanceCueAudio = null;
        if (session.pendingDistanceCueClear) hideDistanceCue(session);
    };
    audio.preload = "auto";
    audio.playsInline = true;
    audio.volume = Math.min(1, Math.max(0, soundScale));
    audio.onended = release;
    audio.onerror = release;
    audio.play().catch(release);
}

function setDistanceCue(session, guidance = "") {
    const cue = session.overlay?.distanceCue;
    if (!cue) return;
    const copy = getDistanceCueCopy(guidance);
    if (!copy) {
        // Let the player finish hearing the matching instruction before the
        // coach disappears, even if the next live frame is already in range.
        if (session.distanceCueAudio) {
            session.pendingDistanceCueClear = true;
            return;
        }
        hideDistanceCue(session);
        return;
    }

    const previousGuidance = session.visibleDistanceCueGuidance || "";
    session.pendingDistanceCueClear = false;
    cue.hidden = !copy;
    cue.textContent = copy;
    const character = session.overlay?.distanceCueCharacter;
    if (character) character.hidden = !copy;
    if (copy) cue.dataset.guidance = guidance;
    else delete cue.dataset.guidance;
    if (guidance !== previousGuidance) playDistanceCueAudio(session, guidance);
    session.visibleDistanceCueGuidance = guidance;
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
        const x = track.x1 * scale + offsetX;
        const y = track.y1 * scale + offsetY;
        const boxWidth = (track.x2 - track.x1) * scale;
        const boxHeight = (track.y2 - track.y1) * scale;
        const targetLabelMatched = trackHasTargetLabel(track, session.shape) && track.labelStable === true;
        const needsDistanceAdjustment = trackHasTargetLabel(track, session.shape) && track.sizeAccepted === false;
        const color = needsDistanceAdjustment ? "#ffd23f" : targetLabelMatched ? "#35f178" : "#ffffff";
        context.globalAlpha = track.stale ? 0.55 : 1;
        context.strokeStyle = color;
        context.lineWidth = 3;
        context.strokeRect(x, y, boxWidth, boxHeight);
    }
    context.globalAlpha = 1;
}

async function handleTrackedFrame(session, { frame, tracks }) {
    if (activeSession !== session || session.controller.signal.aborted) return;
    drawTrackedObjects(session, tracks);
    // Detection warms up while the initial curtain is closed, but a closed
    // curtain must never accept a frame. This also blocks any final in-flight
    // frame while the post-detection processing curtain is closing.
    if (cameraCurtainIsClosed(session.page)) return;
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
        setDistanceCue(session);
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
        .filter(track => !track.stale && track.sizeAccepted === true && track.labelStable === true && trackHasTargetLabel(track, session.shape))
        .sort((a, b) => b.confidence - a.confidence)[0];
    if (selected) {
        setDistanceCue(session);
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

    const distanceAdjustment = tracks
        .filter(track => !track.stale && track.sizeAccepted === false && trackHasTargetLabel(track, session.shape))
        .sort((a, b) => b.confidence - a.confidence)[0];
    if (distanceAdjustment) {
        setDistanceCue(session, distanceAdjustment.sizeGuidance);
        return;
    }

    setDistanceCue(session);
    setCameraStatus(session.page, targetCameraPrompt(session.shape));
}

function stopActiveSession(page = null) {
    if (!activeSession || (page && activeSession.page !== page)) return;
    const session = activeSession;
    activeSession = null;
    stopDistanceCueAudio(session);
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
            stopDistanceCueAudio(session);
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
