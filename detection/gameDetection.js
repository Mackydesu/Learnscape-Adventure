import { trackLiveShapes } from "./detectionManager.js?v=20261121-03";

// The camera game rewards a consistently recognised target in the central
// scan area. The removal gate below still prevents a held object from being
// counted twice.
// Run the next inference immediately after the previous one so the tracking
// box follows a moving object without an added polling delay.
const TRACKING_OPTIONS = { intervalMs: 0, minVotes: 3 };
const SCAN_ZONE = Object.freeze({ left: 0.18, top: 0.15, right: 0.82, bottom: 0.85 });
const DISTANCE_CUE_AUDIO = Object.freeze({
    "move-farther": "assets/Audios/Voice over/Lumayo.mp3",
    "move-closer": "assets/Audios/Voice over/Lumapit.mp3"
});
const DISTANCE_CUE_REPLAY_DELAY_MS = 2800;
const SHAPE_NAMES = Object.freeze({
    circle: "Bilog",
    square: "Parisukat",
    triangle: "Tatsulok",
    rectangle: "Parihaba",
    oval: "Bilohaba",
    heart: "Puso",
    star: "Bituin",
    diamond: "Dyamante"
});

let activeSession = null;
let activeTask = Promise.resolve();
let nextScanAttemptId = 0;
const distanceCueAudioPrimes = new WeakMap();

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
    let scanZone = viewfinder.querySelector(".camera-detection-scan-zone");
    if (!scanZone) {
        scanZone = document.createElement("div");
        scanZone.className = "camera-detection-scan-zone";
        scanZone.setAttribute("aria-hidden", "true");
        viewfinder.append(scanZone);
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
        scanZone,
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

function hideDistanceCue(session, { stopAudio = false } = {}) {
    if (stopAudio) stopDistanceCueAudio(session);
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

function primeDistanceCueAudio(page) {
    const soundScale = window.__learnscapeSoundScale?.() ?? 1;
    if (!page || !window.Audio || soundScale <= 0) return;

    const primedAudio = new Map();
    Object.entries(DISTANCE_CUE_AUDIO).forEach(([guidance, source]) => {
        const audio = new window.Audio(source);
        audio.preload = "auto";
        audio.playsInline = true;
        audio.muted = true;
        audio.volume = Math.min(1, Math.max(0, soundScale));
        primedAudio.set(guidance, audio);
        audio.play().then(() => {
            // This begins inside the trusted Kamera/Buksan click. Reusing the
            // same element later keeps the spoken distance instruction audible
            // when automatic processing opens the next scan.
            if (distanceCueAudioPrimes.get(page) !== primedAudio) return;
            audio.pause();
            try {
                audio.currentTime = 0;
            } catch {
                // Metadata may not have loaded yet; playback still starts at
                // the browser's available beginning.
            }
            audio.muted = false;
        }).catch(() => {
            // A later normal playback attempt remains available on browsers
            // that do not allow muted priming.
        });
    });
    distanceCueAudioPrimes.set(page, primedAudio);
}

function playDistanceCueAudio(session, guidance) {
    const source = DISTANCE_CUE_AUDIO[guidance];
    const soundScale = window.__learnscapeSoundScale?.() ?? 1;
    if (!source || !window.Audio || soundScale <= 0) return;

    const now = Date.now();
    if (session.lastDistanceCueGuidance === guidance
        && now - (session.lastDistanceCuePlayedAt || 0) < DISTANCE_CUE_REPLAY_DELAY_MS) return;

    stopDistanceCueAudio(session);
    const audio = distanceCueAudioPrimes.get(session.page)?.get(guidance)
        || new window.Audio(source);
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

function setDistanceCue(session, guidance = "", { clearImmediately = false } = {}) {
    const cue = session.overlay?.distanceCue;
    if (!cue) return;
    const copy = getDistanceCueCopy(guidance);
    if (!copy) {
        // Let the player finish hearing the matching instruction before the
        // coach disappears when the target is still in view and simply moves
        // into range. Wrong shapes clear it immediately instead.
        if (!clearImmediately && session.distanceCueAudio) {
            session.pendingDistanceCueClear = true;
            return;
        }
        hideDistanceCue(session, { stopAudio: clearImmediately });
        return;
    }

    const previousGuidance = session.visibleDistanceCueGuidance || "";
    // Once a distance coach starts speaking, keep that instruction intact.
    // Live detection can briefly switch labels or sizes frame-to-frame, but
    // cutting the voice mid-sentence is more confusing than waiting for the
    // next stable frame after it finishes.
    if (session.distanceCueAudio && guidance !== previousGuidance) return;
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

function trackIsInScanZone(track, video) {
    if (!track || !video?.videoWidth || !video?.videoHeight) return false;
    const centerX = (track.x1 + track.x2) / (2 * video.videoWidth);
    const centerY = (track.y1 + track.y2) / (2 * video.videoHeight);
    return centerX >= SCAN_ZONE.left && centerX <= SCAN_ZONE.right &&
        centerY >= SCAN_ZONE.top && centerY <= SCAN_ZONE.bottom;
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
        const isTargetShape = trackHasTargetLabel(track, session.shape);
        const targetLabelMatched = isTargetShape && track.labelStable === true;
        const needsDistanceAdjustment = isTargetShape && track.sizeAccepted === false;
        // Keep the target's progress colours, but make an identified wrong
        // shape unambiguous: its live box and label are red.
        const color = !isTargetShape ? "#ff4b4b" : needsDistanceAdjustment ? "#ffd23f" : targetLabelMatched ? "#35f178" : "#ffffff";
        context.globalAlpha = track.stale ? 0.55 : 1;
        context.strokeStyle = color;
        context.lineWidth = 3;
        context.strokeRect(x, y, boxWidth, boxHeight);

        // Keep the label attached to the live bounding box so players can
        // immediately see which shape the camera recognised.
        const label = shapeName(track.label, true);
        if (label) {
            context.font = "700 16px Arial, sans-serif";
            const labelPaddingX = 8;
            const labelHeight = 26;
            const labelWidth = Math.ceil(context.measureText(label).width + labelPaddingX * 2);
            const labelY = Math.max(3, y - labelHeight - 4);
            context.fillStyle = color;
            context.fillRect(x, labelY, labelWidth, labelHeight);
            context.fillStyle = "#102235";

            // On desktop the camera canvas is mirrored with the webcam feed.
            // Flip only the text back so the Tagalog label remains readable.
            if (window.matchMedia("(min-width: 901px)").matches) {
                context.save();
                context.scale(-1, 1);
                context.fillText(label, -(x + labelWidth - labelPaddingX), labelY + 18);
                context.restore();
            } else {
                context.fillText(label, x + labelPaddingX, labelY + 18);
            }
        }
    }
    context.globalAlpha = 1;
}

async function handleTrackedFrame(session, { frame, tracks }) {
    if (activeSession !== session || session.controller.signal.aborted) return;
    // Ignore background objects outside the central scan area. The intended
    // object is held in front of the camera there, while scenery commonly
    // appears at the edges of the frame.
    const scanZoneTracks = tracks.filter(track => trackIsInScanZone(track, session.video));
    drawTrackedObjects(session, scanZoneTracks);
    // Detection warms up while the initial curtain is closed, but a closed
    // curtain must never accept a frame. This also blocks any final in-flight
    // frame while the post-detection processing curtain is closing.
    if (cameraCurtainIsClosed(session.page)) return;
    // A correct scan owns the screen until its ordered audio and reward flow
    // finishes. Keep drawing, but do not accept another object meanwhile.
    if (session.page.classList.contains("is-camera-detection-celebrating")) return;
    if (frame % 10 === 0) {
        console.log("[LIVE TRACKS]", scanZoneTracks.map(track => ({
            label: track.label,
            labelStable: track.labelStable,
            labelFrames: track.labelFrames,
            verified: track.verified,
            geometryVerified: track.geometry?.verified,
            votes: track.verifiedFrames
        })));
    }

    // A stable, in-range non-target is a wrong attempt: keep its red box and
    // never apply target-size coaching. Let an already-started distance cue
    // finish instead of interrupting it because another shape appeared.
    const hasLiveTarget = scanZoneTracks.some(track => !track.stale && trackHasTargetLabel(track, session.shape));
    const wrongShape = !hasLiveTarget && scanZoneTracks
        .filter(track => !track.stale && track.sizeAccepted === true && track.labelStable === true && !trackHasTargetLabel(track, session.shape))
        .sort((a, b) => b.confidence - a.confidence)[0];
    if (wrongShape) {
        setDistanceCue(session, "");
        setCameraStatus(session.page, targetCameraPrompt(session.shape));
        return;
    }

    const selected = scanZoneTracks
        .filter(track => !track.stale && track.sizeAccepted === true && track.labelStable === true && trackHasTargetLabel(track, session.shape))
        .sort((a, b) => b.confidence - a.confidence)[0];
    if (selected) {
        setDistanceCue(session, "", { clearImmediately: true });
        if (session.confirming || frame - session.lastConfirmationFrame < 6) return;
        session.confirming = true;
        session.lastConfirmationFrame = frame;
        setCameraStatus(session.page, "Napakahusay!");
        try {
            // The green target frame, check mark, confetti, audio, and reward
            // all begin together as soon as the label becomes stable.
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

    const distanceAdjustment = scanZoneTracks
        .filter(track => !track.stale && track.sizeAccepted === false && trackHasTargetLabel(track, session.shape))
        .sort((a, b) => b.confidence - a.confidence)[0];
    if (distanceAdjustment) {
        setDistanceCue(session, distanceAdjustment.sizeGuidance);
        return;
    }

    // The size cue is reserved for the active mission target. If the target
    // leaves the frame, let any instruction already playing finish first.
    setDistanceCue(session, "");
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
        notifyDetectionReady(session);
        setCameraStatus(page, targetCameraPrompt(session.shape));
        await trackLiveShapes(video, frameResult => handleTrackedFrame(session, frameResult), {
            ...TRACKING_OPTIONS,
            targetShape: session.shape,
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
        readyNotified: false,
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
    window.addEventListener("learnscape:prime-camera-distance-cues", event => {
        primeDistanceCueAudio(event.detail?.page);
    });
    window.addEventListener("learnscape:camerastarted", event => startDetection(event, modelReady));
    window.addEventListener("learnscape:camerastopped", event => stopActiveSession(event.detail?.page ?? null));
    window.addEventListener("learnscape:routechange", event => {
        if (activeSession && event.detail?.route !== `${activeSession.shape}Camera`) {
            stopActiveSession();
        }
    });
}
