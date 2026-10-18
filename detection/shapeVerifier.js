// Shape checks operate on a foreground component's ordered image contour.
// Douglas-Peucker simplification supplies polygon vertices; box ratios alone
// never assign a class.
const SAMPLE_SIZE = 160;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const NEIGHBORS = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];

function sampleRegion(video, box) {
    const paddingX = (box.x2 - box.x1) * 0.12;
    const paddingY = (box.y2 - box.y1) * 0.12;
    const left = clamp(Math.floor(box.x1 - paddingX), 0, video.videoWidth - 1);
    const top = clamp(Math.floor(box.y1 - paddingY), 0, video.videoHeight - 1);
    const right = clamp(Math.ceil(box.x2 + paddingX), left + 1, video.videoWidth);
    const bottom = clamp(Math.ceil(box.y2 + paddingY), top + 1, video.videoHeight);
    const width = right - left, height = bottom - top;
    const scale = Math.min(1, SAMPLE_SIZE / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(video, left, top, width, height, 0, 0, canvas.width, canvas.height);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function makeForegroundMask(image) {
    const { data, width, height } = image;
    const margin = Math.max(2, Math.round(Math.min(width, height) * 0.10));
    const border = [];
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        if (x < margin || x >= width - margin || y < margin || y >= height - margin) border.push((y * width + x) * 4);
    }
    const channelMedian = channel => {
        const values = border.map(i => data[i + channel]).sort((a, b) => a - b);
        return values[Math.floor(values.length / 2)] ?? 0;
    };
    const background = [channelMedian(0), channelMedian(1), channelMedian(2)];
    const borderDistances = border.map(i => Math.hypot(data[i] - background[0], data[i + 1] - background[1], data[i + 2] - background[2])).sort((a, b) => a - b);
    const medianDistance = borderDistances[Math.floor(borderDistances.length / 2)] ?? 0;
    const deviations = borderDistances.map(value => Math.abs(value - medianDistance)).sort((a, b) => a - b);
    const mad = deviations[Math.floor(deviations.length / 2)] ?? 0;
    const threshold = clamp(medianDistance + Math.max(18, mad * 3), 28, 96);
    const mask = new Uint8Array(width * height);
    let foregroundCount = 0;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        if (Math.hypot(data[i] - background[0], data[i + 1] - background[1], data[i + 2] - background[2]) > threshold) {
            mask[y * width + x] = 1;
            foregroundCount++;
        }
    }
    const fraction = foregroundCount / mask.length;
    if (fraction < 0.08 || fraction > 0.88) return { valid: false, reason: "Object boundary is unclear against this background." };

    // Close single-pixel gaps and holes before component selection.
    const dilated = new Uint8Array(mask.length);
    for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
        for (let dy = -1; dy <= 1 && !dilated[y * width + x]; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (mask[(y + dy) * width + x + dx]) { dilated[y * width + x] = 1; break; }
        }
    }
    const closed = new Uint8Array(mask.length);
    for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
        let filled = true;
        for (let dy = -1; dy <= 1 && filled; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dilated[(y + dy) * width + x + dx]) { filled = false; break; }
        }
        if (filled) closed[y * width + x] = 1;
    }
    // Ignore small disconnected texture/background regions; analyze only the
    // largest 8-connected foreground component.
    const visited = new Uint8Array(mask.length);
    const queue = new Int32Array(mask.length);
    let largest = null;
    for (let seed = 0; seed < mask.length; seed++) {
        if (!closed[seed] || visited[seed]) continue;
        let head = 0, tail = 0;
        queue[tail++] = seed;
        visited[seed] = 1;
        while (head < tail) {
            const index = queue[head++], x = index % width, y = Math.floor(index / width);
            for (const [dx, dy] of NEIGHBORS) {
                const nx = x + dx, ny = y + dy;
                if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
                const next = ny * width + nx;
                if (closed[next] && !visited[next]) { visited[next] = 1; queue[tail++] = next; }
            }
        }
        if (!largest || tail > largest.length) largest = queue.slice(0, tail);
    }
    if (!largest || largest.length < 24) return { valid: false, reason: "The detected object contour is too small." };
    let minComponentX = width, minComponentY = height, maxComponentX = -1, maxComponentY = -1;
    let cropEdgePixels = 0;
    for (const index of largest) {
        const x = index % width, y = Math.floor(index / width);
        minComponentX = Math.min(minComponentX, x); maxComponentX = Math.max(maxComponentX, x);
        minComponentY = Math.min(minComponentY, y); maxComponentY = Math.max(maxComponentY, y);
        if (mask[index] && (x <= 3 || x >= width - 4 || y <= 3 || y >= height - 4)) cropEdgePixels++;
    }
    const touchesCrop = minComponentX <= 2 || minComponentY <= 2 || maxComponentX >= width - 3 || maxComponentY >= height - 3;
    if (touchesCrop || cropEdgePixels / largest.length > 0.025) return { valid: false, reason: "Contour is clipped by the crop boundary." };
    const component = new Uint8Array(mask.length);
    for (const index of largest) component[index] = 1;
    return { valid: true, component, width, height, foregroundCount: largest.length };
}

function traceOuterContour(mask, width, height) {
    let start = -1;
    for (let y = 0; y < height && start < 0; y++) for (let x = 0; x < width; x++) {
        if (mask[y * width + x]) { start = y * width + x; break; }
    }
    if (start < 0) return [];
    const sx = start % width, sy = Math.floor(start / width);
    let x = sx, y = sy, backX = sx - 1, backY = sy;
    let firstNext = null;
    const contour = [];
    const maxSteps = width * height * 2;
    for (let step = 0; step < maxSteps; step++) {
        contour.push({ x, y });
        let backDirection = NEIGHBORS.findIndex(([dx, dy]) => x + dx === backX && y + dy === backY);
        if (backDirection < 0) backDirection = 6;
        let found = false, nextX = x, nextY = y, nextBackX = backX, nextBackY = backY;
        for (let offset = 0; offset < 8; offset++) {
            const direction = (backDirection + offset) % 8;
            const [dx, dy] = NEIGHBORS[direction];
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height && mask[ny * width + nx]) {
                const [bdx, bdy] = NEIGHBORS[(direction + 7) % 8];
                nextX = nx; nextY = ny; nextBackX = x + bdx; nextBackY = y + bdy;
                found = true;
                break;
            }
        }
        if (!found) return contour;
        if (!firstNext) firstNext = { x: nextX, y: nextY };
        else if (x === sx && y === sy && nextX === firstNext.x && nextY === firstNext.y) {
            contour.pop();
            break;
        }
        x = nextX; y = nextY; backX = nextBackX; backY = nextBackY;
    }
    return contour;
}

function distanceToLine(point, start, end) {
    const dx = end.x - start.x, dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    if (!length) return Math.hypot(point.x - start.x, point.y - start.y);
    return Math.abs(dy * point.x - dx * point.y + end.x * start.y - end.y * start.x) / length;
}

function simplifyOpen(points, epsilon) {
    if (points.length <= 2) return points;
    let maxDistance = 0, split = 0;
    for (let i = 1; i < points.length - 1; i++) {
        const distance = distanceToLine(points[i], points[0], points[points.length - 1]);
        if (distance > maxDistance) { maxDistance = distance; split = i; }
    }
    if (maxDistance <= epsilon) return [points[0], points[points.length - 1]];
    const first = simplifyOpen(points.slice(0, split + 1), epsilon);
    const second = simplifyOpen(points.slice(split), epsilon);
    return first.slice(0, -1).concat(second);
}

function simplifyClosed(contour, epsilon) {
    if (contour.length < 4) return contour;
    let farthest = 1, maxDistance = 0;
    for (let i = 1; i < contour.length; i++) {
        const d = Math.hypot(contour[i].x - contour[0].x, contour[i].y - contour[0].y);
        if (d > maxDistance) { maxDistance = d; farthest = i; }
    }
    const arcA = contour.slice(0, farthest + 1);
    const arcB = contour.slice(farthest).concat(contour.slice(0, 1));
    const a = simplifyOpen(arcA, epsilon), b = simplifyOpen(arcB, epsilon);
    const result = a.slice(0, -1).concat(b.slice(0, -1));
    // Remove consecutive duplicates and collinear remnants from the split.
    return result.filter((point, i) => {
        const prev = result[(i + result.length - 1) % result.length];
        return Math.hypot(point.x - prev.x, point.y - prev.y) > epsilon * 0.35;
    });
}

function polygonMetrics(vertices) {
    const count = vertices.length;
    let twiceArea = 0, perimeter = 0;
    const sideLengths = [], turns = [];
    const edgeAxisDeviations = [];
    for (let i = 0; i < count; i++) {
        const p = vertices[i], q = vertices[(i + 1) % count];
        twiceArea += p.x * q.y - q.x * p.y;
        const length = Math.hypot(q.x - p.x, q.y - p.y);
        sideLengths.push(length); perimeter += length;
        const angle = Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI;
        const normalized = ((angle % 90) + 90) % 90;
        edgeAxisDeviations.push(Math.min(normalized, 90 - normalized));
    }
    const orientation = Math.sign(twiceArea) || 1;
    const angles = [];
    for (let i = 0; i < count; i++) {
        const prev = vertices[(i + count - 1) % count], p = vertices[i], next = vertices[(i + 1) % count];
        const ax = prev.x - p.x, ay = prev.y - p.y, bx = next.x - p.x, by = next.y - p.y;
        const cosine = clamp((ax * bx + ay * by) / Math.max(1e-6, Math.hypot(ax, ay) * Math.hypot(bx, by)), -1, 1);
        let angle = Math.acos(cosine) * 180 / Math.PI;
        const turn = (p.x - prev.x) * (next.y - p.y) - (p.y - prev.y) * (next.x - p.x);
        if (turn * orientation < 0) angle = 360 - angle;
        angles.push(angle);
        turns.push(turn * orientation);
    }
    const concaveVertices = turns.filter(turn => turn < 0).length;
    const minSide = Math.min(...sideLengths), maxSide = Math.max(...sideLengths);
    const equalSides = minSide > 0 && maxSide / minSide <= 1.25;
    const bboxDiagonal = Math.hypot(
        Math.max(...vertices.map(point => point.x)) - Math.min(...vertices.map(point => point.x)),
        Math.max(...vertices.map(point => point.y)) - Math.min(...vertices.map(point => point.y))
    );
    const substantialSides = sideLengths.every(length => length >= bboxDiagonal * 0.16);
    const convex = concaveVertices === 0;
    const rightAngled = count === 4 && angles.every(angle => angle >= 72 && angle <= 108);
    const axisAligned = count === 4 && edgeAxisDeviations.every(deviation => deviation <= 15);
    const oppositeSidesMatch = count === 4 &&
        Math.abs(sideLengths[0] - sideLengths[2]) / Math.max(sideLengths[0], sideLengths[2]) < 0.30 &&
        Math.abs(sideLengths[1] - sideLengths[3]) / Math.max(sideLengths[1], sideLengths[3]) < 0.30;
    const topBottomVertices = count === 4 &&
        vertices.some(point => point.y <= Math.min(...vertices.map(p => p.y)) + 3) &&
        vertices.some(point => point.y >= Math.max(...vertices.map(p => p.y)) - 3);
    const circularity = perimeter > 0 ? 4 * Math.PI * Math.abs(twiceArea / 2) / (perimeter * perimeter) : 0;
    return { count, sideLengths, angles, concaveVertices, equalSides, substantialSides, convex, rightAngled, axisAligned,
        oppositeSidesMatch, topBottomVertices, circularity, area: Math.abs(twiceArea / 2) };
}

function getGeometry(image, includeMask = false) {
    const foreground = makeForegroundMask(image);
    if (!foreground.valid) return foreground;
    let count = 0, cx = 0, cy = 0;
    for (let index = 0; index < foreground.component.length; index++) if (foreground.component[index]) {
        count++; cx += index % foreground.width; cy += Math.floor(index / foreground.width);
    }
    cx /= count; cy /= count;
    let xx = 0, yy = 0, xy = 0;
    for (let index = 0; index < foreground.component.length; index++) if (foreground.component[index]) {
        const dx = index % foreground.width - cx, dy = Math.floor(index / foreground.width) - cy;
        xx += dx * dx; yy += dy * dy; xy += dx * dy;
    }
    xx /= count; yy /= count; xy /= count;
    const eigenGap = Math.sqrt((xx - yy) ** 2 + 4 * xy * xy);
    const ellipseAspect = Math.sqrt(Math.max(1e-6, (xx + yy + eigenGap) / (xx + yy - eigenGap)));
    const contour = traceOuterContour(foreground.component, foreground.width, foreground.height);
    if (contour.length < 12) return { valid: false, reason: "Could not trace a complete object contour." };
    let perimeter = 0;
    for (let i = 0; i < contour.length; i++) {
        const a = contour[i], b = contour[(i + 1) % contour.length];
        perimeter += Math.hypot(b.x - a.x, b.y - a.y);
    }
    const approximations = [0.015, 0.02, 0.03].map(tolerance => {
        const vertices = simplifyClosed(contour, Math.max(1.5, perimeter * tolerance));
        return { tolerance, vertices, metrics: vertices.length >= 3 && vertices.length <= 24 ? polygonMetrics(vertices) : null };
    });
    if (approximations.some(item => !item.metrics)) return { valid: false, reason: "Contour is too noisy or ambiguous to simplify." };
    const classify = geometry => ["triangle", "square", "rectangle", "diamond", "circle", "oval", "heart", "star"]
        .find(shape => matches(shape, geometry)) ?? null;
    const classifications = approximations.map(item => classify(item.metrics));
    const counts = approximations.map(item => item.metrics.count);
    const sameClass = classifications[0] !== null && classifications.every(shape => shape === classifications[0]);
    const isRound = classifications[0] === "circle" || classifications[0] === "oval";
    const strictConsensus = sameClass && (isRound
        ? Math.max(...counts) - Math.min(...counts) <= 3
        : counts.every(count => count === counts[0]));
    // Webcam segmentation can add a small false corner at finer tolerances.
    // A triangle is accepted by a two-of-three consensus or by the coarsest
    // noise-reduced contour, but every supporting vote must have exactly three
    // corners and pass the side/angle checks. The live tracker then requires
    // the same verified class across multiple webcam frames.
    const triangleVotes = approximations.filter(item => matches("triangle", item.metrics)).length;
    const diamondVotes = approximations.filter(item => matches("diamond", item.metrics)).length;
    const coarseTrianglePass = matches("triangle", approximations[approximations.length - 1].metrics);
    const triangleRulePassed = triangleVotes >= 2 || coarseTrianglePass;
    // Mixed three-/four-corner evidence is ambiguous. A triangle tip can
    // become one apparent fourth corner in a noisy webcam mask.
    const diamondRulePassed = diamondVotes >= 2 && triangleVotes === 0;
    const diamondStrongRulePassed = diamondVotes === approximations.length;
    const consensusShape = triangleRulePassed ? "triangle"
        : diamondRulePassed ? "diamond"
            : strictConsensus ? classifications[0] : null;
    const consistent = consensusShape !== null;
    const representative = (consensusShape === "triangle" || consensusShape === "diamond")
        ? approximations.find(item => matches(consensusShape, item.metrics))
        : approximations[1];
    return {
        valid: true, consistent,
        geometricShape: consensusShape,
        triangleRulePassed,
        diamondRulePassed,
        diamondStrongRulePassed,
        shapeVoteCounts: { triangle: triangleVotes, diamond: diamondVotes },
        vertices: representative.vertices,
        contourVertexCount: representative.metrics.count,
        simplificationCounts: counts,
        simplificationShapes: classifications,
        ellipseAspect,
        ...(includeMask ? { component: foreground.component, maskWidth: foreground.width, maskHeight: foreground.height } : {}),
        ...representative.metrics
    };
}

function matches(label, g) {
    switch (label) {
        case "triangle":
            // Exactly three contour vertices form the three sides, all with
            // meaningful length within the detected image region.
            return g.count === 3 && g.substantialSides && g.convex &&
                g.angles.length === 3 && g.angles.every(angle => angle > 0 && angle < 180) &&
                Math.abs(g.angles.reduce((sum, angle) => sum + angle, 0) - 180) <= 12;
        case "square":
            return g.count === 4 && g.equalSides && g.rightAngled && g.axisAligned;
        case "rectangle":
            return g.count === 4 && g.rightAngled && !g.equalSides && g.oppositeSidesMatch;
        // A diamond is a four-sided rhombus: this includes 60/120-degree
        // rhombi and a square rotated away from the camera's horizontal axes.
        case "diamond":
            return g.count === 4 && g.sideLengths.length === 4 && g.angles.length === 4 &&
                g.substantialSides && g.convex && g.equalSides && !g.axisAligned &&
                g.angles.every(angle => angle >= 50 && angle <= 130) &&
                Math.abs(g.angles.reduce((sum, angle) => sum + angle, 0) - 360) <= 16;
        case "circle":
            return g.count >= 7 && g.count <= 14 && g.circularity >= 0.72 && g.ellipseAspect < 1.18 && g.concaveVertices === 0;
        case "oval":
            return g.count >= 7 && g.count <= 14 && g.circularity >= 0.65 && g.ellipseAspect > 1.18 && g.concaveVertices === 0;
        case "heart":
            return g.count >= 5 && g.count <= 9 && g.concaveVertices === 1 && g.angles.some(angle => angle > 180);
        case "star":
            return g.count >= 9 && g.count <= 12 && g.concaveVertices >= 4 && g.concaveVertices <= 6;
        default:
            return false;
    }
}

function makeDebugImages(image, geometry) {
    if (!geometry.component) return {};
    const width = geometry.maskWidth, height = geometry.maskHeight;
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = width; maskCanvas.height = height;
    const maskContext = maskCanvas.getContext("2d");
    const maskPixels = maskContext.createImageData(width, height);
    for (let i = 0; i < geometry.component.length; i++) {
        const value = geometry.component[i] ? 245 : 20;
        const offset = i * 4;
        maskPixels.data[offset] = value;
        maskPixels.data[offset + 1] = value;
        maskPixels.data[offset + 2] = value;
        maskPixels.data[offset + 3] = 255;
    }
    maskContext.putImageData(maskPixels, 0, 0);

    const contourCanvas = document.createElement("canvas");
    contourCanvas.width = width; contourCanvas.height = height;
    const contourContext = contourCanvas.getContext("2d");
    contourContext.putImageData(image, 0, 0);
    contourContext.strokeStyle = "#00ff66";
    contourContext.lineWidth = Math.max(1, width / 120);
    contourContext.beginPath();
    geometry.vertices.forEach((point, index) => {
        if (index === 0) contourContext.moveTo(point.x, point.y);
        else contourContext.lineTo(point.x, point.y);
    });
    contourContext.closePath();
    contourContext.stroke();
    for (const point of geometry.vertices) {
        contourContext.fillStyle = "#ff3355";
        contourContext.beginPath();
        contourContext.arc(point.x, point.y, Math.max(2, width / 45), 0, Math.PI * 2);
        contourContext.fill();
    }
    return { maskDataUrl: maskCanvas.toDataURL(), contourDataUrl: contourCanvas.toDataURL() };
}

export function verifyShape(video, detection, options = {}) {
    if (!video || !detection || !video.videoWidth || !video.videoHeight) {
        return { verified: false, yoloLabel: detection?.label ?? null, geometricShape: null,
            correctedLabel: null, reason: "Image region is unavailable." };
    }
    try {
        const image = sampleRegion(video, detection);
        const geometry = getGeometry(image, options.debug === true);
        if (!geometry.valid) return { verified: false, yoloLabel: detection.label,
            geometricShape: null, correctedLabel: null, reason: geometry.reason, geometry };
        const geometricShape = geometry.geometricShape;
        // Clear contours can correct a conflicting YOLO class. Squares and
        // rectangles require agreement at all three simplification scales;
        // a bounding-box ratio alone is not enough to make that correction.
        const triangleRulePassed = geometricShape === "triangle" && geometry.triangleRulePassed;
        const diamondRulePassed = geometricShape === "diamond" && geometry.diamondRulePassed;
        // A two-scale diamond contour may agree with a true diamond despite
        // webcam noise. When YOLO proposed triangle, require all three scales
        // to agree before correcting that label to diamond.
        const diamondCanCorrectTriangle = detection.label !== "triangle" || geometry.diamondStrongRulePassed;
        const squareRectangleCorrection = geometry.consistent &&
            ((detection.label === "square" && geometricShape === "rectangle") ||
             (detection.label === "rectangle" && geometricShape === "square"));
        const contourRulePassed = triangleRulePassed || (diamondRulePassed && diamondCanCorrectTriangle) || squareRectangleCorrection;
        const correctedLabel = contourRulePassed && geometricShape !== detection.label ? geometricShape : null;
        const verified = geometry.consistent && (geometricShape === detection.label || contourRulePassed);
        const reason = !geometry.consistent
            ? "Contour is ambiguous across simplification tolerances."
            : correctedLabel
                ? `Contour verified as ${correctedLabel}; correcting the conflicting YOLO label.`
            : verified
                ? "Simplified contour geometry agrees with the predicted class."
                : "YOLO label conflicts with measured contour geometry.";
        return { verified, verificationType: verified ? (correctedLabel ? "geometric-correction" : "geometric") : null,
            yoloLabel: detection.label, geometricShape, correctedLabel,
            label: verified ? (correctedLabel ?? detection.label) : null, reason,
            ...(options.debug ? makeDebugImages(image, geometry) : {}),
            geometry };
    } catch (error) {
        return { verified: false, yoloLabel: detection.label, geometricShape: null,
            correctedLabel: null, reason: error.message || "Could not inspect image region." };
    }
}
