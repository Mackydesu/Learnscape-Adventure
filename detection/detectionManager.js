import { detectShapes } from "./yolo.js";
import { verifyShape } from "./shapeVerifier.js";

const DEFAULT_FRAME_COUNT = 5;
const DEFAULT_MIN_VOTES = 4;
const COMPLEX_SHAPE_CONFIDENCE = 0.75;
const TRACK_IOU_THRESHOLD = 0.20;
const CROSS_CLASS_CONFLICT_IOU = 0.65;
const SIZE_GUIDANCE_THRESHOLD = 0.65;

/** Returns the detected object's largest frame-relative dimension (0–1+). */
export function getRelativeObjectSize(detection, video) {
    if (!detection || !video?.videoWidth || !video?.videoHeight) return null;
    const objectWidth = Math.max(0, detection.x2 - detection.x1);
    const objectHeight = Math.max(0, detection.y2 - detection.y1);
    return Math.max(objectWidth / video.videoWidth, objectHeight / video.videoHeight);
}

function delayFrame() {
    return new Promise(resolve => requestAnimationFrame(resolve));
}

function boxIoU(a, b) {
    const x1 = Math.max(a.x1, b.x1), y1 = Math.max(a.y1, b.y1);
    const x2 = Math.min(a.x2, b.x2), y2 = Math.min(a.y2, b.y2);
    const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    const areaA = Math.max(0, a.x2 - a.x1) * Math.max(0, a.y2 - a.y1);
    const areaB = Math.max(0, b.x2 - b.x1) * Math.max(0, b.y2 - b.y1);
    return intersection / Math.max(1, areaA + areaB - intersection);
}

function averageConfidence(track) {
    return track.detections.reduce((sum, item) => sum + item.confidence, 0) / track.detections.length;
}

function sleepUntilNextInference(ms, signal) {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) return reject(new DOMException("Live detection stopped.", "AbortError"));
        const timer = setTimeout(resolve, ms);
        signal?.addEventListener("abort", () => {
            clearTimeout(timer);
            reject(new DOMException("Live detection stopped.", "AbortError"));
        }, { once: true });
    });
}

/** Continuous YOLO box tracking with geometric checks on each YOLO crop. */
export async function trackLiveShapes(video, onFrame, options = {}) {
    const signal = options.signal;
    const intervalMs = Math.max(0, options.intervalMs ?? 90);
    const stableVotes = Math.max(2, options.minVotes ?? DEFAULT_MIN_VOTES);
    const tracks = [];
    let frame = 0;

    while (!signal?.aborted) {
        const predictions = await detectShapes(video);
        if (signal?.aborted) break;
        const claimed = new Set();
        for (const track of tracks) track.seen = false;

        const detections = predictions.map(item => {
            const relativeSize = getRelativeObjectSize(item, video);
            const lowConfidenceComplexShape = ["heart", "star"].includes(item.label) && item.confidence < COMPLEX_SHAPE_CONFIDENCE;
            const geometry = lowConfidenceComplexShape
                ? { verified: false, yoloLabel: item.label, geometricShape: null, reason: "Confidence is below the heart/star verification threshold." }
                : verifyShape(video, item);
            return {
                ...item,
                label: geometry.verified && geometry.label ? geometry.label : item.label,
                relativeSize,
                moveFartherAway: relativeSize !== null && relativeSize > SIZE_GUIDANCE_THRESHOLD,
                geometry,
                frame
            };
        }).sort((a, b) => b.confidence - a.confidence);

        for (const detection of detections) {
            let matched = null, bestIou = 0;
            for (const track of tracks) {
                if (claimed.has(track)) continue;
                const overlap = boxIoU(track.box, detection);
                if (overlap >= TRACK_IOU_THRESHOLD && overlap > bestIou) {
                    matched = track;
                    bestIou = overlap;
                }
            }
            if (!matched) {
                matched = { id: tracks.length ? Math.max(...tracks.map(track => track.id)) + 1 : 1,
                    box: { ...detection }, history: [], missed: 0 };
                tracks.push(matched);
            }
            const alpha = 0.65;
            for (const key of ["x1", "y1", "x2", "y2"]) matched.box[key] = matched.box[key] * (1 - alpha) + detection[key] * alpha;
            matched.label = detection.label;
            matched.confidence = detection.confidence;
            matched.relativeSize = detection.relativeSize;
            matched.moveFartherAway = detection.moveFartherAway;
            matched.geometry = detection.geometry;
            matched.seen = true;
            matched.missed = 0;
            matched.history.push({ label: detection.label, verified: detection.geometry.verified, frame });
            matched.history = matched.history.slice(-stableVotes);
            claimed.add(matched);
        }

        for (const track of tracks) if (!track.seen) track.missed++;
        for (let i = tracks.length - 1; i >= 0; i--) if (tracks[i].missed > 2) tracks.splice(i, 1);

        const visible = tracks.filter(track => track.missed <= 2).map(track => {
            const votes = track.history.filter(item => item.label === track.label && item.verified).length;
            return {
                ...track.box,
                trackId: track.id,
                label: track.label,
                confidence: track.confidence,
                relativeSize: track.relativeSize,
                moveFartherAway: track.moveFartherAway,
                geometry: track.geometry,
                stable: votes >= stableVotes,
                verified: votes >= stableVotes,
                verifiedFrames: votes,
                stale: track.missed > 0
            };
        });
        await onFrame?.({ frame, predictions, detections, tracks: visible });
        frame++;
        await sleepUntilNextInference(intervalMs, signal);
    }
}

function summarize(item) {
    return {
        frame: item.frame,
        label: item.label,
        confidence: Number(item.confidence.toFixed(3)),
        relativeSize: item.relativeSize === null ? null : Number(item.relativeSize.toFixed(3)),
        passed: item.geometry.verified === true,
        vertices: item.geometry.geometry?.count ?? null,
        angles: item.geometry.geometry?.angles?.map(angle => Math.round(angle)).join(", ") ?? "",
        geometricShape: item.geometry.geometricShape ?? "",
        reason: item.geometry.reason
    };
}

/** Collects five-frame YOLO predictions, accepts geometry-passing candidates,
 * rejects cross-class duplicate boxes, and votes per tracked object. */
export async function detectStableShape(video, options = {}) {
    const frameCount = Math.max(3, options.frameCount ?? DEFAULT_FRAME_COUNT);
    const minVotes = Math.min(frameCount, options.minVotes ?? DEFAULT_MIN_VOTES);
    const tracks = [];
    const diagnostics = { candidateCount: 0, geometricPassCount: 0, mismatchCount: 0, uncertainContourCount: 0, lowConfidenceCount: 0, ambiguousCount: 0,
        largestRelativeSize: 0 };

    const checkCancelled = () => {
        if (options.signal?.aborted) throw new DOMException("Scan cancelled.", "AbortError");
    };

    for (let frame = 0; frame < frameCount; frame++) {
        checkCancelled();
        if (frame > 0) await delayFrame();
        checkCancelled();
        const predictions = await detectShapes(video);
        checkCancelled();
        diagnostics.candidateCount += predictions.length;
        for (const item of predictions) {
            const relativeSize = getRelativeObjectSize(item, video);
            if (relativeSize !== null) diagnostics.largestRelativeSize = Math.max(diagnostics.largestRelativeSize, relativeSize);
        }

        if (options.debug) console.table(predictions.map(item => ({
            frame,
            rawLabel: item.label,
            confidence: Number(item.confidence.toFixed(3)),
            x1: Math.round(item.x1), y1: Math.round(item.y1),
            x2: Math.round(item.x2), y2: Math.round(item.y2)
        })));

        diagnostics.lowConfidenceCount += predictions.filter(item =>
            ["heart", "star"].includes(item.label) && item.confidence < COMPLEX_SHAPE_CONFIDENCE
        ).length;
        const checkedDetections = predictions
            .filter(item => !["heart", "star"].includes(item.label) || item.confidence >= COMPLEX_SHAPE_CONFIDENCE)
            .map((item, index) => {
                const geometry = verifyShape(video, item, { debug: options.debug === true && index === 0 });
                const relativeSize = getRelativeObjectSize(item, video);
                return {
                    ...item,
                    label: geometry.verified && geometry.label ? geometry.label : item.label,
                    relativeSize,
                    moveFartherAway: relativeSize !== null && relativeSize > SIZE_GUIDANCE_THRESHOLD,
                    geometry,
                    frame
                };
            });

        if (options.debug) console.table(checkedDetections.map(summarize));

        const rejected = checkedDetections.filter(item => item.geometry.verified !== true);
        diagnostics.mismatchCount += rejected.filter(item => item.geometry.geometry?.valid && item.geometry.geometry?.consistent !== false && item.geometry.geometricShape).length;
        diagnostics.uncertainContourCount += rejected.filter(item =>
            !item.geometry.geometry?.valid || item.geometry.geometry?.consistent === false
        ).length;
        const frameDetections = checkedDetections
            .filter(item => item.geometry.verified === true)
            .sort((a, b) => b.confidence - a.confidence);
        options.onFrame?.({ frame, predictions, checkedDetections, acceptedDetections: frameDetections });
        diagnostics.geometricPassCount += frameDetections.length;

        // If two verified class labels describe essentially the same region,
        // exclude both as ambiguous instead of allowing competing tracks.
        const conflicted = new Set();
        for (let i = 0; i < frameDetections.length; i++) {
            for (let j = i + 1; j < frameDetections.length; j++) {
                if (frameDetections[i].label !== frameDetections[j].label &&
                    boxIoU(frameDetections[i], frameDetections[j]) >= CROSS_CLASS_CONFLICT_IOU) {
                    conflicted.add(frameDetections[i]);
                    conflicted.add(frameDetections[j]);
                }
            }
        }
        diagnostics.ambiguousCount += conflicted.size;
        const unambiguous = frameDetections.filter(item => !conflicted.has(item));

        const claimed = new Set();
        for (const detection of unambiguous) {
            let match = null, matchScore = 0;
            for (const track of tracks) {
                if (claimed.has(track) || track.label !== detection.label) continue;
                const previous = track.detections[track.detections.length - 1];
                const iou = boxIoU(previous, detection);
                if (iou >= TRACK_IOU_THRESHOLD && iou > matchScore) { match = track; matchScore = iou; }
            }
            if (!match) {
                match = { label: detection.label, detections: [] };
                tracks.push(match);
            }
            match.detections.push(detection);
            claimed.add(match);
        }
    }

    checkCancelled();
    const stableCandidates = tracks.filter(track => track.detections.length >= minVotes)
        .sort((a, b) => b.detections.length - a.detections.length || averageConfidence(b) - averageConfidence(a));
    const targetLabel = String(options.targetLabel ?? "").trim().toLowerCase();
    const stable = stableCandidates.find(track => track.label === targetLabel) ?? stableCandidates[0];

    if (!stable) {
        let failureCategory, reason;
        if (diagnostics.candidateCount === 0) {
            failureCategory = "no-detection";
            reason = "No shape detected.";
        } else if (diagnostics.ambiguousCount > 0 && diagnostics.geometricPassCount === diagnostics.ambiguousCount) {
            failureCategory = "ambiguous-labels";
            reason = "Overlapping predictions disagree about the shape.";
        } else if (diagnostics.mismatchCount > 0) {
            failureCategory = "geometry-mismatch";
            reason = "Predicted shape does not match its outline.";
        } else if (diagnostics.uncertainContourCount > 0) {
            failureCategory = "unclear-contour";
            reason = "Shape outline is unclear. Move it against a plain background.";
        } else if (diagnostics.lowConfidenceCount > 0 && diagnostics.geometricPassCount === 0) {
            failureCategory = "low-confidence";
            reason = "Heart or star prediction confidence was too low for verification.";
        } else if (diagnostics.geometricPassCount > 0) {
            failureCategory = "unstable-track";
            reason = "Valid detections varied between frames. Hold the shape steady.";
        } else {
            failureCategory = "no-verified-detection";
            reason = "No prediction passed shape verification.";
        }
        return {
            verified: false, stable: false, label: null, reason, failureCategory,
            framesChecked: frameCount,
            relativeSize: diagnostics.largestRelativeSize,
            moveFartherAway: diagnostics.largestRelativeSize > SIZE_GUIDANCE_THRESHOLD,
            verifiedFrames: Math.max(0, ...tracks.map(track => track.detections.length)),
            diagnostics
        };
    }

    const best = stable.detections.reduce((a, b) => a.confidence >= b.confidence ? a : b);
    return {
        ...best,
        label: stable.label,
        verified: true,
        stable: true,
        geometricVerified: !["heart", "star"].includes(best.label),
        verificationType: ["heart", "star"].includes(best.label) ? "temporal-plus-contour" : "geometric-and-temporal",
        framesChecked: frameCount,
        verifiedFrames: stable.detections.length,
        diagnostics,
        track: { label: stable.label, detections: stable.detections }
    };
}
