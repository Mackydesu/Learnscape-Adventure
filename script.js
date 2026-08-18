// Smooth scrolling for anchor links is handled by CSS scroll-behavior: smooth.

document.addEventListener('DOMContentLoaded', () => {
    console.log('Learnscape Adventure loaded!');

    const loadingLinks = document.querySelectorAll('.loading-link');
    let isNavigating = false;
    const loadingDuration = 1000;
    const titlePage = document.getElementById('learnscape-title-page');
    const game1Page = document.getElementById('learnscape-game1-page');
    const game3Page = document.getElementById('learnscape-game3-page');
    const lettertracePage = document.getElementById('learnscape-lettertrace-page');
    const dragtomatchPage = document.getElementById('learnscape-dragtomatch-page');
    const lettertraceBgImage = lettertracePage?.querySelector('.lettertrace-bg-image') || null;
    const dragtomatchBgImage = dragtomatchPage?.querySelector('.game1-bg-image') || null;
    const lettertraceUpperButton = lettertracePage?.querySelector('[data-letter-case="upper"]') || null;
    const lettertraceLowerButton = lettertracePage?.querySelector('[data-letter-case="lower"]') || null;
    const lettertraceClearButtons = lettertracePage?.querySelectorAll('[data-trace-clear]') || [];
    const lettertraceUpperGlyph = lettertracePage?.querySelector('.lettertrace-letter-upper') || null;
    const lettertraceLowerGlyph = lettertracePage?.querySelector('.lettertrace-letter-lower') || null;
    const lettertraceTraceSvg = lettertracePage?.querySelector('.lettertrace-trace-svg') || null;
    const lettertraceTraceGlyphs = lettertracePage?.querySelectorAll('.lettertrace-trace-glyph') || [];
    const lettertraceTraceMaskPaths = lettertracePage?.querySelectorAll('.lettertrace-trace-mask-path') || [];
    const lettertraceTraceGuidePath = lettertracePage?.querySelector('.lettertrace-trace-glyph-guide') || null;
    const lettertraceTraceProgressGroup = lettertracePage?.querySelector('.lettertrace-trace-progress-group') || null;
    const lettertraceProgressLabel = lettertracePage?.querySelector('.lettertrace-progress-label') || null;
    const lettertraceTraceCanvas = lettertracePage?.querySelector('.lettertrace-trace-canvas') || null;
    const lettertraceTraceContext = lettertraceTraceCanvas ? lettertraceTraceCanvas.getContext('2d') : null;
    const lettertraceSoundButton = lettertracePage?.querySelector('.lettertrace-sound-btn') || null;
    const dragtomatchBackButton = dragtomatchPage?.querySelector('.game-return-btn.loading-link') || null;
    const game1BgVideo = game1Page?.querySelector('video.game1-bg-image') || null;
    const game1BgVideoSource = game1BgVideo?.querySelector('source') || null;
    const game1BgVideoSourceSrc = game1BgVideoSource?.getAttribute('src') || game1BgVideo?.getAttribute('src') || '';
    const game1BgLoopFadeWindow = 0.45;
    const game3ImageSize = { width: 1672, height: 941 };
    const game3HotspotCenters = {
        circle: { x: 453, y: 253},
        square: { x: 812, y: 150 },
        triangle: { x: 1175, y: 226 },
        rectangle: { x: 1493, y: 397 },
        oval: { x: 1320, y: 759.05 },
        heart: { x: 904.05, y: 805 },
        star: { x: 419, y: 787.05 },
        diamond: { x: 205, y: 569 },
    };
    const game3Hotspots = game3Page?.querySelectorAll('[data-game3-shape]') || [];
    const shapeCirclePage = document.getElementById('learnscape-shape-circle-page');
    const shapeCircleCharacter = shapeCirclePage?.querySelector('.shape-area-character-ch2') || null;
    const shapeCircleCharacter3 = shapeCirclePage?.querySelector('.shape-area-character-ch3') || null;
    const shapeCircleBubble = shapeCirclePage?.querySelector('.shape-area-speech-bubble') || null;
    const shapeCircleBubbleText = shapeCircleBubble?.querySelector('.shape-area-speech-bubble-text') || null;
    const shapeCircleMessage = shapeCircleBubble?.dataset.message || 'Hello! Kumusta ka, Kaibigan?';
    const shapeCircleTypingDelay = 55;
    const shapeCirclePauseAfterTyping = 1200;
    const shapeCircleTextFadeDuration = 450;
    const shapeCircleCharacterSlideDuration = 450;
    const shapeCircleCharacterPopDelay = 120;
    let shapeCircleTimers = [];
    let shapeCircleSession = 0;
    let lettertraceCurrentLetter = 'A';
    let lettertraceCurrentCase = 'upper';
    let lettertraceTraceDrawing = false;
    let lettertraceTraceLastPoint = null;
    let lettertraceTraceStrokeStates = [];
    let lettertraceTraceStrokeIndex = 0;
    let lettertraceTraceStrokeProgress = 0;

    const updateLettertraceProgressLabel = () => {
        if (!lettertraceProgressLabel) return;

        const totalLength = lettertraceTraceStrokeStates.reduce((sum, stroke) => sum + stroke.length, 0);
        const completedLength = lettertraceTraceStrokeStates
            .slice(0, lettertraceTraceStrokeIndex)
            .reduce((sum, stroke) => sum + stroke.length, 0)
            + (lettertraceTraceStrokeStates[lettertraceTraceStrokeIndex]?.progress || 0);
        const percentage = totalLength > 0
            ? Math.min(100, Math.round((completedLength / totalLength) * 100))
            : 0;

        lettertraceProgressLabel.textContent = `${percentage}%`;
    };

    const clearShapeCircleTimers = () => {
        shapeCircleTimers.forEach((timerId) => window.clearTimeout(timerId));
        shapeCircleTimers = [];
    };

    const resetShapeCircleScene = () => {
        clearShapeCircleTimers();
        shapeCircleSession += 1;

        if (shapeCircleBubbleText) {
            shapeCircleBubbleText.textContent = '';
            shapeCircleBubbleText.classList.remove('is-fading');
        }

        if (shapeCircleBubble) {
            shapeCircleBubble.hidden = false;
            shapeCircleBubble.classList.remove('is-visible', 'is-fading');
        }

        if (shapeCircleCharacter) {
            shapeCircleCharacter.hidden = false;
            shapeCircleCharacter.classList.remove('is-fading', 'is-sliding-left');
        }

        if (shapeCircleCharacter3) {
            shapeCircleCharacter3.hidden = true;
            shapeCircleCharacter3.classList.remove('is-popping');
        }
    };

    const startShapeCircleScene = () => {
        if (!shapeCirclePage || !shapeCircleBubble || !shapeCircleBubbleText || !shapeCircleCharacter) return;
        if (!isPageVisible(shapeCirclePage)) return;

        resetShapeCircleScene();

        const session = shapeCircleSession;
        const message = String(shapeCircleMessage);

        shapeCircleBubble.classList.add('is-visible');

        const typeNextCharacter = (index) => {
            if (session !== shapeCircleSession || !isPageVisible(shapeCirclePage)) return;

            shapeCircleBubbleText.textContent = message.slice(0, index);

            if (index >= message.length) {
                shapeCircleTimers.push(window.setTimeout(() => {
                    if (session !== shapeCircleSession || !isPageVisible(shapeCirclePage)) return;

                    shapeCircleBubbleText.classList.add('is-fading');

                    shapeCircleTimers.push(window.setTimeout(() => {
                        if (session !== shapeCircleSession || !isPageVisible(shapeCirclePage)) return;

                        shapeCircleBubble.hidden = true;
                        shapeCircleCharacter.classList.add('is-sliding-left');

                    shapeCircleTimers.push(window.setTimeout(() => {
                        if (session !== shapeCircleSession || !isPageVisible(shapeCirclePage)) return;

                        shapeCircleCharacter.hidden = true;

                        if (!shapeCircleCharacter3) return;

                        shapeCircleTimers.push(window.setTimeout(() => {
                            if (session !== shapeCircleSession || !isPageVisible(shapeCirclePage)) return;

                            shapeCircleCharacter3.hidden = false;
                            shapeCircleCharacter3.classList.remove('is-popping');
                            shapeCircleCharacter3.getBoundingClientRect();
                            shapeCircleCharacter3.classList.add('is-popping');
                        }, shapeCircleCharacterPopDelay));
                    }, shapeCircleCharacterSlideDuration));
                }, shapeCircleTextFadeDuration));
            }, shapeCirclePauseAfterTyping));

                return;
            }

            shapeCircleTimers.push(window.setTimeout(() => {
                typeNextCharacter(index + 1);
            }, shapeCircleTypingDelay));
        };

        typeNextCharacter(1);
    };

    const lettertraceTraceGuidePaths = {
        upper: {
            A: 'M300 780 L500 220 L700 780 M380 570 H620',
            B: 'M360 220 V780 M360 230 H540 C680 230 680 470 540 470 H360 M540 470 C690 470 690 770 540 770 H360',
            C: 'M680 300 C610 220 400 210 330 310 C260 410 270 620 340 700 C410 790 610 780 680 690',
            D: 'M350 220 V780 H520 C700 780 700 220 520 220 H350',
            E: 'M660 220 H350 V780 H660 M350 500 H600',
            F: 'M350 780 V220 H660 M350 500 H600',
            G: 'M680 300 C610 220 400 210 330 310 C260 410 270 620 340 700 C410 790 610 780 680 690 V560 H500',
            H: 'M350 220 V780 M650 220 V780 M350 500 H650',
            I: 'M350 220 H650 M500 220 V780 M350 780 H650',
            J: 'M650 220 V650 C650 820 350 820 350 650 V580',
            K: 'M350 220 V780 M650 220 L350 500 L650 780',
            L: 'M350 220 V780 H660',
            M: 'M300 780 V220 L500 500 L700 220 V780',
            N: 'M350 780 V220 L650 780 V220',
            O: 'M500 220 C350 220 300 330 300 500 C300 670 350 780 500 780 C650 780 700 670 700 500 C700 330 650 220 500 220',
            P: 'M350 780 V220 H530 C680 220 680 500 530 500 H350',
            Q: 'M500 220 C350 220 300 330 300 500 C300 670 350 780 500 780 C650 780 700 670 700 500 C700 330 650 220 500 220 M570 670 L720 820',
            R: 'M350 780 V220 H530 C680 220 680 500 530 500 H350 M520 500 L680 780',
            S: 'M660 290 C570 210 380 220 350 340 C320 450 430 480 520 510 C620 540 680 600 650 690 C610 800 400 800 330 700',
            T: 'M300 220 H700 M500 220 V780',
            U: 'M350 220 V620 C350 830 650 830 650 620 V220',
            V: 'M300 220 L500 780 L700 220',
            W: 'M250 220 L375 780 L500 470 L625 780 L750 220',
            X: 'M300 220 L700 780 M700 220 L300 780',
            Y: 'M300 220 L500 480 L700 220 M500 480 V780',
            Z: 'M300 220 H700 L300 780 H700'
        },
        lower: {
            A: 'M640 500 C600 450 500 445 420 500 C330 565 340 720 460 740 C550 755 620 700 640 630 M640 500 V740',
            B: 'M370 220 V740 M370 520 C430 445 560 450 610 540 C680 665 600 750 500 740 C430 735 390 690 370 630',
            C: 'M640 520 C580 450 470 450 400 520 C330 600 380 740 500 740 C570 740 620 705 650 660',
            D: 'M630 220 V740 M630 520 C580 450 470 450 400 520 C330 600 380 740 500 740 C570 740 620 700 630 630',
            E: 'M650 610 H380 C380 500 470 450 550 470 C620 490 650 550 650 620 H400 C420 700 510 750 610 700',
            F: 'M620 260 C560 210 490 250 490 350 V740 M400 420 H620',
            G: 'M640 520 C600 450 500 445 420 500 C330 565 340 720 460 740 C550 755 620 700 640 630 M640 520 V780 C620 850 470 850 400 790',
            H: 'M370 220 V740 M370 540 C430 450 570 450 620 540 V740',
            I: 'M500 470 V740 M500 340 L500 340',
            J: 'M570 470 V780 C560 850 430 850 420 770 M570 340 L570 340',
            K: 'M390 220 V740 M620 480 L390 620 M500 550 L640 740',
            L: 'M500 220 V740',
            M: 'M350 740 V540 C390 450 470 450 500 540 V740 M500 540 C540 450 620 450 650 540 V740',
            N: 'M380 740 V540 C430 450 560 450 620 540 V740',
            O: 'M500 470 C400 470 350 540 350 620 C350 700 400 740 500 740 C600 740 650 700 650 620 C650 540 600 470 500 470',
            P: 'M390 850 V540 C440 450 560 450 620 540 C680 650 610 740 500 740 C440 740 400 700 390 640',
            Q: 'M610 850 V540 C560 450 440 450 380 540 C320 650 390 740 500 740 C560 740 600 700 610 640',
            R: 'M390 740 V540 C440 450 550 450 620 520',
            S: 'M630 520 C570 460 450 450 390 510 C350 560 420 600 500 620 C590 640 640 670 610 720 C560 770 430 750 380 690',
            T: 'M500 330 V700 C500 750 560 760 610 720 M410 470 H590',
            U: 'M380 500 V650 C380 730 470 760 520 700 C550 670 600 620 620 540 V500 M620 500 V740',
            V: 'M380 500 L500 740 L620 500',
            W: 'M320 500 L400 740 L500 560 L600 740 L680 500',
            X: 'M380 500 L620 740 M620 500 L380 740',
            Y: 'M380 500 L500 700 L620 500 M500 700 V820',
            Z: 'M380 500 H650 L380 740 H650'
        }
    };

    const sampleLettertracePath = (pathData) => {
        const tokens = String(pathData || '').match(/[A-Za-z]|-?(?:\d+\.?\d*|\.\d+)/g) || [];
        const samples = [];
        let tokenIndex = 0;
        let command = '';
        let current = { x: 0, y: 0 };
        let totalLength = 0;

        const addPoint = (point, isMove = false) => {
            if (!isMove && samples.length) {
                totalLength += Math.hypot(point.x - current.x, point.y - current.y);
            }
            samples.push({ distance: totalLength, point: { ...point } });
            current = { ...point };
        };

        const readNumber = () => Number(tokens[tokenIndex++]);
        const addLine = (point) => {
            const start = { ...current };
            const distance = Math.hypot(point.x - start.x, point.y - start.y);
            const lineSteps = Math.max(2, Math.ceil(distance / 18));

            for (let step = 1; step <= lineSteps; step += 1) {
                const ratio = step / lineSteps;
                addPoint({
                    x: start.x + ((point.x - start.x) * ratio),
                    y: start.y + ((point.y - start.y) * ratio),
                });
            }
        };
        const addCurve = (controlOne, controlTwo, end) => {
            const start = { ...current };
            const curveSteps = 24;

            for (let step = 1; step <= curveSteps; step += 1) {
                const t = step / curveSteps;
                const inverse = 1 - t;
                addPoint({
                    x: (inverse ** 3 * start.x)
                        + (3 * inverse ** 2 * t * controlOne.x)
                        + (3 * inverse * t ** 2 * controlTwo.x)
                        + (t ** 3 * end.x),
                    y: (inverse ** 3 * start.y)
                        + (3 * inverse ** 2 * t * controlOne.y)
                        + (3 * inverse * t ** 2 * controlTwo.y)
                        + (t ** 3 * end.y),
                });
            }
        };

        while (tokenIndex < tokens.length) {
            if (/^[A-Za-z]$/.test(tokens[tokenIndex])) {
                command = tokens[tokenIndex++].toUpperCase();
            }

            if (command === 'M') {
                addPoint({ x: readNumber(), y: readNumber() }, true);
                command = 'L';
            } else if (command === 'L') {
                addLine({ x: readNumber(), y: readNumber() });
            } else if (command === 'H') {
                addLine({ x: readNumber(), y: current.y });
            } else if (command === 'V') {
                addLine({ x: current.x, y: readNumber() });
            } else if (command === 'C') {
                addCurve(
                    { x: readNumber(), y: readNumber() },
                    { x: readNumber(), y: readNumber() },
                    { x: readNumber(), y: readNumber() }
                );
            } else {
                tokenIndex += 1;
            }
        }

        return { samples, totalLength };
    };

    const resetLettertraceTraceProgress = () => {
        if (!lettertraceTraceProgressGroup || !lettertraceTraceGuidePath) return;

        const strokePaths = (lettertraceTraceGuidePath.getAttribute('d') || '')
            .split(/(?=M)/)
            .map((pathData) => pathData.trim())
            .filter(Boolean);
        const svgNamespace = 'http://www.w3.org/2000/svg';

        lettertraceTraceProgressGroup.innerHTML = '';
        lettertraceTraceStrokeStates = strokePaths.map((pathData) => {
            const sampledPath = sampleLettertracePath(pathData);
            const progressPath = document.createElementNS(svgNamespace, 'path');
            progressPath.classList.add('lettertrace-trace-progress');
            progressPath.setAttribute('d', pathData);
            progressPath.setAttribute('aria-hidden', 'true');
            progressPath.style.strokeDasharray = `${sampledPath.totalLength} ${sampledPath.totalLength}`;
            progressPath.style.strokeDashoffset = String(sampledPath.totalLength);
            lettertraceTraceProgressGroup.append(progressPath);

            const bounds = sampledPath.samples.reduce((nextBounds, sample) => ({
                minX: Math.min(nextBounds.minX, sample.point.x),
                maxX: Math.max(nextBounds.maxX, sample.point.x),
                minY: Math.min(nextBounds.minY, sample.point.y),
                maxY: Math.max(nextBounds.maxY, sample.point.y),
            }), { minX: Number.POSITIVE_INFINITY, maxX: Number.NEGATIVE_INFINITY, minY: Number.POSITIVE_INFINITY, maxY: Number.NEGATIVE_INFINITY });

            return {
                element: progressPath,
                length: sampledPath.totalLength,
                progress: 0,
                samples: sampledPath.samples,
                bounds,
            };
        }).filter((stroke) => stroke.length > 0);

        lettertraceTraceStrokeIndex = 0;
        lettertraceTraceStrokeProgress = 0;
        lettertraceTraceProgressGroup.style.visibility = 'hidden';
        updateLettertraceProgressLabel();
    };

    const configureLettertraceBrush = () => {
        if (!lettertraceTraceContext) return;

        lettertraceTraceContext.globalCompositeOperation = 'source-over';
        lettertraceTraceContext.strokeStyle = 'rgba(255, 213, 93, 0.95)';
        lettertraceTraceContext.fillStyle = 'rgba(255, 213, 93, 0.95)';
        lettertraceTraceContext.shadowColor = 'rgba(255, 234, 130, 0.34)';
        lettertraceTraceContext.shadowBlur = Math.max(8, Math.min(lettertraceTraceCanvas?.width || 0, lettertraceTraceCanvas?.height || 0) * 0.015);
    };

    const clearLettertraceCanvas = () => {
        if (!lettertraceTraceContext || !lettertraceTraceCanvas) return;
        const rect = lettertraceTraceCanvas.getBoundingClientRect();
        lettertraceTraceContext.clearRect(0, 0, rect.width, rect.height);
        lettertraceTraceLastPoint = null;
        resetLettertraceTraceProgress();
    };

    const resizeLettertraceCanvas = () => {
        if (!lettertraceTraceCanvas || !lettertraceTraceContext) return;

        const rect = lettertraceTraceCanvas.getBoundingClientRect();
        const nextWidth = Math.max(1, Math.round(rect.width));
        const nextHeight = Math.max(1, Math.round(rect.height));
        const dpr = window.devicePixelRatio || 1;

        lettertraceTraceCanvas.width = Math.max(1, Math.round(nextWidth * dpr));
        lettertraceTraceCanvas.height = Math.max(1, Math.round(nextHeight * dpr));
        lettertraceTraceContext.setTransform(1, 0, 0, 1, 0, 0);
        lettertraceTraceContext.clearRect(0, 0, lettertraceTraceCanvas.width, lettertraceTraceCanvas.height);
        lettertraceTraceContext.setTransform(dpr, 0, 0, dpr, 0, 0);
        lettertraceTraceContext.lineCap = 'round';
        lettertraceTraceContext.lineJoin = 'round';
        lettertraceTraceContext.lineWidth = Math.max(12, Math.min(nextWidth, nextHeight) * 0.04);
        configureLettertraceBrush();
    };

    const getLettertracePoint = (event) => {
        if (!lettertraceTraceCanvas) return null;

        const rect = lettertraceTraceCanvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };
    };

    const advanceLettertraceProgress = (event) => {
        const currentStroke = lettertraceTraceStrokeStates[lettertraceTraceStrokeIndex];
        if (!lettertraceTraceProgressGroup || !currentStroke || !currentStroke.length || !currentStroke.samples.length) return false;

        const pathRect = currentStroke.element.getBoundingClientRect();
        if (!pathRect.width && !pathRect.height) return false;

        const pathWidth = currentStroke.bounds.maxX - currentStroke.bounds.minX;
        const pathHeight = currentStroke.bounds.maxY - currentStroke.bounds.minY;

        const screenPoint = {
            x: pathWidth && pathRect.width
                ? currentStroke.bounds.minX
                    + ((event.clientX - pathRect.left) / pathRect.width) * pathWidth
                : currentStroke.bounds.minX,
            y: pathHeight && pathRect.height
                ? currentStroke.bounds.minY
                    + ((event.clientY - pathRect.top) / pathRect.height) * pathHeight
                : currentStroke.bounds.minY,
        };
        let nearestSample = null;
        let nearestDistance = Number.POSITIVE_INFINITY;

        currentStroke.samples.forEach((sample) => {
            const distance = Math.hypot(sample.point.x - screenPoint.x, sample.point.y - screenPoint.y);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestSample = sample;
            }
        });

        const traceTolerance = 52;
        const allowedLead = Math.max(180, currentStroke.length * 0.08);
        if (!nearestSample || nearestDistance > traceTolerance || nearestSample.distance > currentStroke.progress + allowedLead) {
            return false;
        }

        currentStroke.progress = Math.max(currentStroke.progress, nearestSample.distance);
        lettertraceTraceStrokeProgress = currentStroke.progress;
        currentStroke.element.style.strokeDashoffset = String(Math.max(0, currentStroke.length - currentStroke.progress));
        lettertraceTraceProgressGroup.style.visibility = 'visible';
        updateLettertraceProgressLabel();
        return true;
    };

    const updateLettertraceTraceGlyph = () => {
        if (!lettertraceTraceGlyphs.length) return;

        const nextGlyph = lettertraceCurrentCase === 'lower'
            ? lettertraceCurrentLetter.toLowerCase()
            : lettertraceCurrentLetter.toUpperCase();
        const nextGuidePath = lettertraceTraceGuidePaths[lettertraceCurrentCase]?.[lettertraceCurrentLetter]
            || lettertraceTraceGuidePaths.upper.A;

        lettertraceTraceGlyphs.forEach((glyph) => {
            if (glyph.tagName.toLowerCase() === 'path') {
                glyph.setAttribute('d', nextGuidePath);
            } else {
                glyph.textContent = nextGlyph;
            }
            glyph.dataset.case = lettertraceCurrentCase;
            glyph.setAttribute('aria-label', `Trace ${lettertraceCurrentLetter}`);
        });
        lettertraceTraceMaskPaths.forEach((maskPath) => {
            maskPath.setAttribute('d', nextGuidePath);
        });
        lettertraceTraceGuidePath?.setAttribute(
            'd',
            nextGuidePath
        );
        lettertraceTraceGuidePath?.setAttribute('aria-label', `Trace ${lettertraceCurrentLetter}`);
        lettertraceTraceSvg?.setAttribute('data-case', lettertraceCurrentCase);
        resetLettertraceTraceProgress();
    };

    if (game1BgVideo) {
        game1BgVideo.loop = true;
    }

    const syncGame1BgLoopVolume = () => {
        if (!game1BgVideo || !isPageVisible(game1Page)) return;

        const duration = game1BgVideo.duration;
        if (!Number.isFinite(duration) || duration <= 0) return;

        const currentTime = game1BgVideo.currentTime || 0;
        const timeToEnd = duration - currentTime;
        let targetVolume = 1;

        if (timeToEnd <= game1BgLoopFadeWindow) {
            targetVolume = Math.max(0, timeToEnd / game1BgLoopFadeWindow);
        } else if (currentTime <= game1BgLoopFadeWindow) {
            targetVolume = Math.min(1, currentTime / game1BgLoopFadeWindow);
        }

        if (Math.abs(game1BgVideo.volume - targetVolume) > 0.01) {
            game1BgVideo.volume = targetVolume;
        }
    };

    const loadGame1BgVideoSource = () => {
        if (!game1BgVideo || !game1BgVideoSource || !game1BgVideoSourceSrc) return;

        if (!game1BgVideoSource.getAttribute('src')) {
            game1BgVideoSource.setAttribute('src', game1BgVideoSourceSrc);
        }

        game1BgVideo.load?.();
    };

    const unloadGame1BgVideoSource = () => {
        if (!game1BgVideo) return;

        game1BgVideo.pause?.();
        try {
            game1BgVideo.currentTime = 0;
        } catch (error) {
            // The video can be mid-load; pausing is enough if rewinding is unavailable.
        }

        if (game1BgVideoSource?.getAttribute('src')) {
            game1BgVideoSource.removeAttribute('src');
            game1BgVideo.load?.();
        }
    };

    const isInShell = () => window.top !== window;

    const getShellContainer = () => {
        const localShell = document.getElementById('app-shell-container');
        if (localShell) {
            return localShell;
        }

        if (!isInShell()) return null;

        try {
            return window.top.document.getElementById('app-shell-container');
        } catch (error) {
            return null;
        }
    };

    const getAppFrame = () => {
        if (!isInShell()) return null;

        try {
            return window.top.document.getElementById('app-frame');
        } catch (error) {
            return null;
        }
    };

    const navigateApp = (target) => {
        const shellNavigate = window.top && window.top !== window
            ? window.top.__learnscapeNavigate
            : window.__learnscapeNavigate;

        if (typeof shellNavigate === 'function' && target && !target.startsWith('#')) {
            shellNavigate(target);
            return;
        }

        const frame = getAppFrame();

        if (frame && target && !target.startsWith('#')) {
            frame.src = target;
            return;
        }

        window.location.href = target;
    };

    const isFullscreenActive = () => Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement ||
        (window.top !== window && (() => {
            try {
                const shellContainer = getShellContainer();
                return shellContainer && (
                    window.top.document.fullscreenElement === shellContainer ||
                    window.top.document.webkitFullscreenElement === shellContainer ||
                    window.top.document.msFullscreenElement === shellContainer
                );
            } catch (error) {
                return false;
            }
        })())
    );

    const requestFullscreen = async (targetElement) => {
        const root = targetElement || document.documentElement;

        if (root.requestFullscreen) {
            return root.requestFullscreen();
        }

        if (root.webkitRequestFullscreen) {
            return root.webkitRequestFullscreen();
        }

        if (root.msRequestFullscreen) {
            return root.msRequestFullscreen();
        }

        return Promise.resolve();
    };

    const lockLandscape = async () => {
        const orientation = window.screen?.orientation;

        if (!orientation?.lock) {
            return;
        }

        try {
            await orientation.lock('landscape');
        } catch (error) {
            console.warn('Landscape lock was not available.', error);
        }
    };

    const enterFullscreenFlow = async (targetElement) => {
        try {
            if (!isFullscreenActive()) {
                await requestFullscreen(targetElement);
            }

            await lockLandscape();
        } catch (error) {
            console.warn('Fullscreen mode was not available.', error);
        }
    };

    const syncFullscreenClass = () => {
        document.body.classList.toggle('is-fullscreen-mode', isFullscreenActive());
    };

    const waitForFullscreenActive = (timeoutMs = 1500) => new Promise((resolve) => {
        if (isFullscreenActive()) {
            resolve(true);
            return;
        }

        let settled = false;

        const finish = (value) => {
            if (settled) return;
            settled = true;
            document.removeEventListener('fullscreenchange', onChange);
            document.removeEventListener('webkitfullscreenchange', onChange);
            document.removeEventListener('msfullscreenchange', onChange);
            window.clearTimeout(timer);
            resolve(value);
        };

        const onChange = () => {
            if (isFullscreenActive()) {
                finish(true);
            }
        };

        const timer = window.setTimeout(() => finish(false), timeoutMs);

        document.addEventListener('fullscreenchange', onChange);
        document.addEventListener('webkitfullscreenchange', onChange);
        document.addEventListener('msfullscreenchange', onChange);
    });

    const createLoadingMarkup = () => `
        <div class="page-loading-panel" role="status">
            <img class="page-loading-art" src="assets/Backgrounds/loadingscreen.png" alt="Loading">
            <div class="page-loading-bar" aria-hidden="true">
                <span></span>
            </div>
            <p class="page-loading-text">Loading Adventure</p>
        </div>
    `;

    const showLoadingScreen = () => {
        let loadingOverlay = document.querySelector('.page-loading-overlay');

        if (!loadingOverlay) {
            loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'page-loading-overlay';
            loadingOverlay.setAttribute('aria-live', 'polite');
            loadingOverlay.innerHTML = createLoadingMarkup();
            document.body.appendChild(loadingOverlay);
        }

        requestAnimationFrame(() => {
            document.body.classList.add('is-page-loading');
        });
    };

    const isPageVisible = (pageElement) => Boolean(pageElement && !pageElement.hidden);

    const playGame1BgVideo = () => {
        if (!game1BgVideo || !isPageVisible(game1Page) || document.hidden) return;

        loadGame1BgVideoSource();

        const playResult = game1BgVideo.play?.();
        if (playResult && typeof playResult.catch === 'function') {
            playResult.catch(() => {
                const startOnGesture = () => {
                    if (!isPageVisible(game1Page)) return;
                    loadGame1BgVideoSource();
                    const retryResult = game1BgVideo.play?.();
                    if (retryResult && typeof retryResult.catch === 'function') {
                        retryResult.catch(() => {});
                    }
                };

                window.addEventListener('pointerdown', startOnGesture, { once: true, passive: true });
                window.addEventListener('touchstart', startOnGesture, { once: true, passive: true });
                window.addEventListener('keydown', startOnGesture, { once: true });
            });
        }
    };

    const pauseGame1BgVideo = () => {
        if (!game1BgVideo) return;

        unloadGame1BgVideoSource();
    };

    const syncGame1BgPlayback = () => {
        if (!game1BgVideo) return;

        if (isPageVisible(game1Page) && !document.hidden) {
            loadGame1BgVideoSource();
            if (game1BgVideo.paused || game1BgVideo.ended) {
                playGame1BgVideo();
            }
            return;
        }

        pauseGame1BgVideo();
    };

    const resetGame3Hotspots = () => {
        game3Hotspots.forEach((hotspot) => {
            hotspot.classList.remove('is-active');
            hotspot.setAttribute('aria-pressed', 'false');
        });
    };

    const bindGame3Hotspots = () => {
        if (!game3Hotspots.length) return;

        game3Hotspots.forEach((hotspot) => {
            if (hotspot.dataset.bound === 'true') return;

            hotspot.dataset.bound = 'true';
            hotspot.addEventListener('click', (event) => {
                if (hotspot.dataset.game3Shape === 'circle') {
                    event.preventDefault();
                    event.stopPropagation();

                    if (typeof window.__learnscapeNavigate === 'function') {
                        window.__learnscapeNavigate('shape-circle');
                    } else {
                        window.location.hash = '#shape-circle';
                    }

                    return;
                }

                game3Hotspots.forEach((otherHotspot) => {
                    const isCurrent = otherHotspot === hotspot;
                    otherHotspot.classList.toggle('is-active', isCurrent);
                    otherHotspot.setAttribute('aria-pressed', isCurrent ? 'true' : 'false');
                });
            });
        });
    };

    const positionGame3Hotspots = () => {
        if (!game3Page || !game3Hotspots.length) return;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const imageAspect = game3ImageSize.width / game3ImageSize.height;
        const viewportAspect = viewportWidth / viewportHeight;

        let renderWidth;
        let renderHeight;
        let offsetX = 0;
        let offsetY = 0;

        // Match the background image's `object-fit: cover` sizing so the hotspots
        // stay pinned to the exact same pixels the user sees.
        if (viewportAspect > imageAspect) {
            renderWidth = viewportWidth;
            renderHeight = viewportWidth / imageAspect;
            offsetY = (viewportHeight - renderHeight) / 2;
        } else {
            renderHeight = viewportHeight;
            renderWidth = viewportHeight * imageAspect;
            offsetX = (viewportWidth - renderWidth) / 2;
        }

        game3Hotspots.forEach((hotspot) => {
            const key = hotspot.dataset.game3Shape;
            const center = game3HotspotCenters[key];
            if (!center) return;

            const left = offsetX + (center.x / game3ImageSize.width) * renderWidth;
            const top = offsetY + (center.y / game3ImageSize.height) * renderHeight;
            hotspot.style.left = `${left}px`;
            hotspot.style.top = `${top}px`;
        });
    };

    window.addEventListener('learnscape:routechange', (event) => {
        syncGame1BgPlayback();
        if (event.detail?.route !== 'game3') {
            resetGame3Hotspots();
        }
    });

    if (isPageVisible(game1Page) && !document.hidden) {
        loadGame1BgVideoSource();
        playGame1BgVideo();
    } else {
        unloadGame1BgVideoSource();
    }

    bindGame3Hotspots();
    positionGame3Hotspots();
    if (!isPageVisible(game3Page)) {
        resetGame3Hotspots();
    }

    game1BgVideo?.addEventListener('loadedmetadata', syncGame1BgLoopVolume);
    game1BgVideo?.addEventListener('timeupdate', syncGame1BgLoopVolume);
    game1BgVideo?.addEventListener('playing', syncGame1BgLoopVolume);
    game1BgVideo?.addEventListener('seeked', syncGame1BgLoopVolume);
    game1BgVideo?.addEventListener('pause', () => {
        if (game1BgVideo) {
            game1BgVideo.volume = 1;
        }
    });
    document.addEventListener('visibilitychange', syncGame1BgPlayback);
    window.addEventListener('pagehide', pauseGame1BgVideo);
    window.addEventListener('blur', pauseGame1BgVideo);
    window.addEventListener('resize', positionGame3Hotspots);
    window.addEventListener('orientationchange', positionGame3Hotspots);

    const createRotateOverlayMarkup = () => `
        <div class="rotate-panel">
            <div class="rotate-icon" aria-hidden="true">
                <span class="rotate-phone rotate-phone-portrait"></span>
                <span class="rotate-phone rotate-phone-landscape"></span>
                <span class="rotate-arrow">↻</span>
            </div>
            <p class="rotate-title">Rotate your phone</p>
            <p class="rotate-copy">For the best experience, use landscape mode.</p>
            <div class="rotate-button-cue" aria-hidden="true">
                <span class="rotate-button-cue-hand">👆</span>
            </div>
            <button class="rotate-button" type="button" aria-label="Rotate to landscape">
                <span class="rotate-button-text">TAP HERE</span>
            </button>
        </div>
    `;

    const ensureRotateOverlay = () => {
        let rotateOverlay = document.querySelector('.rotate-overlay');

        if (!rotateOverlay) {
            rotateOverlay = document.createElement('div');
            rotateOverlay.className = 'rotate-overlay';
            rotateOverlay.setAttribute('aria-hidden', 'false');
            rotateOverlay.innerHTML = createRotateOverlayMarkup();
            document.body.appendChild(rotateOverlay);
        }

        const rotateButton = rotateOverlay.querySelector('.rotate-button');

        if (rotateButton && !rotateButton.dataset.rotateBound) {
            rotateButton.dataset.rotateBound = 'true';
            rotateButton.addEventListener('click', async () => {
                try {
                    await enterFullscreenFlow(document.documentElement);
                } catch (error) {
                    console.warn('Rotate action was not available.', error);
                } finally {
                    updateRotateOverlay();
                }
            });
        }

        return rotateOverlay;
    };

    const shouldShowRotateOverlay = () => {
        const viewport = window.visualViewport;
        const viewportWidth = Math.round(viewport?.width ?? window.innerWidth);
        const viewportHeight = Math.round(viewport?.height ?? window.innerHeight);

        return viewportWidth <= 900 && viewportHeight > viewportWidth;
    };

    const updateRotateOverlay = () => {
        const rotateOverlay = ensureRotateOverlay();
        rotateOverlay.style.display = shouldShowRotateOverlay() ? 'flex' : 'none';
    };

    updateRotateOverlay();
    window.setTimeout(updateRotateOverlay, 150);
    window.setTimeout(updateRotateOverlay, 500);
    window.addEventListener('load', updateRotateOverlay);
    window.addEventListener('pageshow', updateRotateOverlay);
    window.addEventListener('resize', updateRotateOverlay);
    window.addEventListener('orientationchange', updateRotateOverlay);
    window.visualViewport?.addEventListener('resize', updateRotateOverlay);
    window.visualViewport?.addEventListener('scroll', updateRotateOverlay);

    const game1Stage = document.querySelector('.game1-stage');
    const game1IntroCard = document.querySelector('.game1-intro-card');
    const game1LevelGrid = document.querySelector('.game1-level-grid');
    let dragtomatchCards = [];
    let dragtomatchLevelButtons = [];
    const dragtomatchObjects = document.querySelector('.game1-dragtomatch-objects');
    const dragtomatchTutorialButton = document.querySelector('[data-dragtomatch-tutorial-button]');
    const dragtomatchTutorialOverlay = document.querySelector('.game1-dragmatch-tutorial');
    const dragtomatchTutorialVideo = dragtomatchTutorialOverlay?.querySelector('.game1-tutorial-video');
    const dragtomatchCelebrationLayer = document.querySelector('.game1-celebration-layer');
    const dragtomatchSun = document.querySelector('.game1-dragmatch-sun');
    const dragtomatchLetterImage = document.querySelector('.game1-current-letter');
    const dragtomatchRoundAdvanceDelay = 2600;
    const game1TransitionDuration = 450;
    const dragtomatchFlipTone = [494, 740];
    const dragtomatchMissTone = [220, 196, 174];
    const dragtomatchTutorialDelay = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 120 : 5000;
    const dragtomatchTutorialStorageKey = 'learnscape.dragtomatch.tutorialCompleted';
    let dragtomatchTutorialTimer = null;
    let dragtomatchTutorialDockTimer = null;

    const dragtomatchPairs = [
        { letter: 'A', letterSrc: 'assets/ABC UI/LetterA.png', objectName: 'Apple', objectSrc: 'assets/ABC UI/Apple.png' },
        { letter: 'B', letterSrc: 'assets/ABC UI/LetterB.png', objectName: 'Ball', objectSrc: 'assets/ABC UI/Ball.png' },
        { letter: 'C', letterSrc: 'assets/ABC UI/LetterC.png', objectName: 'Cat', objectSrc: 'assets/ABC UI/Cat.png' },
        { letter: 'D', letterSrc: 'assets/ABC UI/LetterD.png', objectName: 'Dog', objectSrc: 'assets/ABC UI/Dog.png' },
        { letter: 'E', letterSrc: 'assets/ABC UI/LetterE.png', objectName: 'Elephant', objectSrc: 'assets/ABC UI/Elephant.png' },
        { letter: 'F', letterSrc: 'assets/ABC UI/LetterF.png', objectName: 'Frog', objectSrc: 'assets/ABC UI/Frog.png' },
        { letter: 'G', letterSrc: 'assets/ABC UI/LetterG.png', objectName: 'Grapes', objectSrc: 'assets/ABC UI/Grapes.png' },
        { letter: 'H', letterSrc: 'assets/ABC UI/LetterH.png', objectName: 'House', objectSrc: 'assets/ABC UI/House.png' },
        { letter: 'I', letterSrc: 'assets/ABC UI/LetterI.png', objectName: 'Ice cream', objectSrc: 'assets/ABC UI/Ice cream.png' },
        { letter: 'J', letterSrc: 'assets/ABC UI/LetterJ.png', objectName: 'Jelly', objectSrc: 'assets/ABC UI/Jelly.png' },
        { letter: 'K', letterSrc: 'assets/ABC UI/LetterK.png', objectName: 'Kite', objectSrc: 'assets/ABC UI/Kite.png' },
        { letter: 'L', letterSrc: 'assets/ABC UI/LetterL.png', objectName: 'Lion', objectSrc: 'assets/ABC UI/Lion.png' },
        { letter: 'M', letterSrc: 'assets/ABC UI/LetterM.png', objectName: 'Moon', objectSrc: 'assets/ABC UI/Moon.png' },
        { letter: 'N', letterSrc: 'assets/ABC UI/LetterN.png', objectName: 'Nest', objectSrc: 'assets/ABC UI/Nest.png', objectScale: 0.8 },
        { letter: 'O', letterSrc: 'assets/ABC UI/LetterO.png', objectName: 'Orange', objectSrc: 'assets/ABC UI/Orange.png' },
        { letter: 'P', letterSrc: 'assets/ABC UI/LetterP.png', objectName: 'Parrot', objectSrc: 'assets/ABC UI/Parrot.png' },
        { letter: 'Q', letterSrc: 'assets/ABC UI/LetterQ.png', objectName: 'Queen', objectSrc: 'assets/ABC UI/Queen.png' },
        { letter: 'R', letterSrc: 'assets/ABC UI/LetterR.png', objectName: 'Rainbow', objectSrc: 'assets/ABC UI/Rainbow.png' },
        { letter: 'S', letterSrc: 'assets/ABC UI/LetterS.png', objectName: 'Sun', objectSrc: 'assets/ABC UI/Sun.png' },
        { letter: 'T', letterSrc: 'assets/ABC UI/LetterT.png', objectName: 'Train', objectSrc: 'assets/ABC UI/Train.png' },
        { letter: 'U', letterSrc: 'assets/ABC UI/LetterU.png', objectName: 'Umbrella', objectSrc: 'assets/ABC UI/Umbrella.png' },
        { letter: 'V', letterSrc: 'assets/ABC UI/LetterV.png', objectName: 'Violin', objectSrc: 'assets/ABC UI/Violin.png' },
        { letter: 'W', letterSrc: 'assets/ABC UI/LetterW.png', objectName: 'Whale', objectSrc: 'assets/ABC UI/Whale.png', objectScale: 0.82 },
        { letter: 'X', letterSrc: 'assets/ABC UI/LetterX.png', objectName: 'Xylophone', objectSrc: 'assets/ABC UI/Xylophone.png', objectScale: 0.82 },
        { letter: 'Y', letterSrc: 'assets/ABC UI/LetterY.png', objectName: 'Yoyo', objectSrc: 'assets/ABC UI/Yoyo.png' },
        { letter: 'Z', letterSrc: 'assets/ABC UI/LetterZ.png', objectName: 'Zebra', objectSrc: 'assets/ABC UI/Zebra.png' },
    ];

    const dragtomatchLevelRows = [9, 9, 8];

    const getDragtomatchLevelSrc = (letter) => `assets/Buttons/Level${letter}.png`;

    const getDragtomatchIndexForLetter = (letter) => {
        const normalizedLetter = String(letter || '').trim().toUpperCase();
        const index = dragtomatchPairs.findIndex((pair) => pair.letter === normalizedLetter);
        return index >= 0 ? index : 0;
    };

    const getDragtomatchLetterFromHash = () => {
        const hash = window.location.hash || '';
        if (!hash.startsWith('#dragtomatch')) return '';

        const queryIndex = hash.indexOf('?');
        if (queryIndex < 0) return '';

        const params = new URLSearchParams(hash.slice(queryIndex + 1));
        return params.get('letter') || '';
    };

    const getLettertraceParamsFromHash = () => {
        const hash = window.location.hash || '';
        if (!hash.startsWith('#lettertrace')) return {};

        const queryIndex = hash.indexOf('?');
        if (queryIndex < 0) return {};

        return Object.fromEntries(new URLSearchParams(hash.slice(queryIndex + 1)));
    };

    const updateDragtomatchBackground = (params = {}) => {
        if (!dragtomatchBgImage) return;

        const bg = String(params.bg || '').toLowerCase();
        const nextSrc = bg === 'abcbg'
            ? 'assets/Backgrounds/abcbg.webp'
            : 'assets/Backgrounds/skybg.png';

        if (dragtomatchBgImage.getAttribute('src') !== nextSrc) {
            dragtomatchBgImage.setAttribute('src', nextSrc);
        }
    };

    const updateLettertraceBackground = (params = {}) => {
        if (!lettertraceBgImage) return;

        const bg = String(params.bg || '').toLowerCase();
        const nextSrc = bg === 'abcbg'
            ? 'assets/Backgrounds/abcbg.webp'
            : 'assets/Backgrounds/abcbg.webp';

        if (lettertraceBgImage.getAttribute('src') !== nextSrc) {
            lettertraceBgImage.setAttribute('src', nextSrc);
        }
    };

    const syncLettertraceCase = (nextCase = lettertraceCurrentCase) => {
        lettertraceCurrentCase = nextCase === 'lower' ? 'lower' : 'upper';

        lettertraceUpperButton?.classList.toggle('is-active', lettertraceCurrentCase === 'upper');
        lettertraceLowerButton?.classList.toggle('is-active', lettertraceCurrentCase === 'lower');
        lettertraceUpperButton?.setAttribute('aria-pressed', lettertraceCurrentCase === 'upper' ? 'true' : 'false');
        lettertraceLowerButton?.setAttribute('aria-pressed', lettertraceCurrentCase === 'lower' ? 'true' : 'false');

        if (lettertraceUpperGlyph) {
            lettertraceUpperGlyph.textContent = lettertraceCurrentLetter.toUpperCase();
        }

        if (lettertraceLowerGlyph) {
            lettertraceLowerGlyph.textContent = lettertraceCurrentLetter.toLowerCase();
        }

        updateLettertraceTraceGlyph();
        clearLettertraceCanvas();
    };

    const setLettertraceNavigationTargets = (letter) => {
        const normalizedLetter = String(letter || lettertraceCurrentLetter || 'A').trim().toUpperCase() || 'A';

        if (dragtomatchBackButton) {
            dragtomatchBackButton.dataset.route = `lettertrace?letter=${encodeURIComponent(normalizedLetter)}&bg=abcbg`;
            dragtomatchBackButton.setAttribute('href', 'index.html');
        }
    };

    const renderLettertraceScreen = (letter) => {
        lettertraceCurrentLetter = String(letter || 'A').trim().toUpperCase() || 'A';
        syncLettertraceCase('upper');
        setLettertraceNavigationTargets(lettertraceCurrentLetter);
        window.requestAnimationFrame(() => {
            resizeLettertraceCanvas();
            clearLettertraceCanvas();
        });
    };

    const renderDragtomatchLevels = () => {
        if (!game1LevelGrid) return;

        game1LevelGrid.innerHTML = '';
        dragtomatchLevelButtons = [];
        let nextIndex = 0;

        dragtomatchLevelRows.forEach((rowSize, rowIndex) => {
            const row = document.createElement('div');
            row.className = 'game1-level-row';
            row.dataset.row = String(rowIndex + 1);

            for (let columnIndex = 0; columnIndex < rowSize; columnIndex += 1) {
                const currentIndex = nextIndex;
                const pair = dragtomatchPairs[currentIndex];
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'game1-level-button';
                button.dataset.index = String(currentIndex);
                button.dataset.letter = pair.letter;
                button.setAttribute('aria-label', `Jump to level ${pair.letter}`);
                button.innerHTML = `
                    <img class="game1-level-badge" src="${getDragtomatchLevelSrc(pair.letter)}" alt="" aria-hidden="true">
                    <span class="game1-level-rating" aria-hidden="true">
                        <span class="game1-level-stars">
                            <svg class="game1-level-star" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                <path d="M12 2.9 14.9 8.8l6.5 1-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5-4.7-4.6 6.5-1L12 2.9z"></path>
                            </svg>
                            <svg class="game1-level-star" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                <path d="M12 2.9 14.9 8.8l6.5 1-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5-4.7-4.6 6.5-1L12 2.9z"></path>
                            </svg>
                            <svg class="game1-level-star" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                <path d="M12 2.9 14.9 8.8l6.5 1-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5-4.7-4.6 6.5-1L12 2.9z"></path>
                            </svg>
                        </span>
                    </span>
                `;

                button.addEventListener('click', () => {
                    window.__learnscapeNavigate?.(`lettertrace?letter=${encodeURIComponent(pair.letter)}&bg=abcbg`);
                });

                row.appendChild(button);
                dragtomatchLevelButtons.push(button);
                nextIndex += 1;
            }

            game1LevelGrid.appendChild(row);
        });
    };

    const syncDragtomatchLevels = () => {
        dragtomatchLevelButtons.forEach((button, index) => {
            const isActive = index === dragtomatchCurrentIndex;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-current', isActive ? 'true' : 'false');
        });
    };

    const startDragtomatchAtLetter = (letter) => {
        renderDragtomatchRound(getDragtomatchIndexForLetter(letter));
    };

    const dragtomatchCardMarkup = `
        <span class="game1-object-card-inner">
            <span class="game1-object-card-face game1-object-card-face-back">
                <img class="game1-object-card-frame" src="assets/ABC UI/objectdisplayerback.webp" alt="">
            </span>
            <span class="game1-object-card-face game1-object-card-face-front">
                <img class="game1-object-card-frame" src="assets/ABC UI/objectdisplayerfront.png" alt="">
                <img class="game1-object-card-object" src="" alt="">
            </span>
        </span>
        <span class="game1-object-card-spell" aria-hidden="true"></span>
    `;

    const attachDragtomatchCardInteractions = (card) => {
        addTouchPressState(card, 'is-touching');

        card.addEventListener('click', () => {
            if (Date.now() < dragtomatchIgnoreClickUntil) return;
            if (card.classList.contains('is-solved')) return;

            if (dragtomatchSelectedLetter) {
                const correctLetter = dragtomatchLetterImage?.dataset.letter || '';
                const selectedLetter = dragtomatchSelectedLetter;
                const isCorrectMatch = card.dataset.letter === selectedLetter && selectedLetter === correctLetter;

                clearDragtomatchCardFlipTimer(card);
                clearDragtomatchSpeechTimer(card);

                if (isCorrectMatch) {
                    markDragtomatchSuccess(card);
                } else {
                    markDragtomatchMiss(card);
                }

                clearDragtomatchSelectedLetter();
                return;
            }

            clearDragtomatchCardFlipTimer(card);
            clearDragtomatchSpeechTimer(card);
            card.classList.add('is-flipped');
            card.setAttribute('aria-pressed', 'true');

            playDragtomatchFlipSound();
            speakDragtomatchObjectName(card.dataset.objectName || '', card).then(() => {
                if (card.classList.contains('is-solved')) return;
                card.classList.remove('is-flipped');
                card.setAttribute('aria-pressed', 'false');
                dragtomatchSpeechTimers.delete(card);
                dragtomatchFlipTimers.delete(card);
            });
        });

        card.addEventListener('dragenter', (event) => {
            event.preventDefault();
            card.classList.add('is-drop-target');
        });

        card.addEventListener('dragover', (event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            card.classList.add('is-drop-target');
        });

        card.addEventListener('dragleave', () => {
            card.classList.remove('is-drop-target');
        });

        card.addEventListener('drop', (event) => {
            event.preventDefault();
            card.classList.remove('is-drop-target');

            const droppedLetter = event.dataTransfer?.getData('text/plain');
            const correctLetter = dragtomatchLetterImage?.dataset.letter || '';

            if (!droppedLetter || !correctLetter) return;

            if (card.dataset.letter === droppedLetter && droppedLetter === correctLetter) {
                markDragtomatchSuccess(card);
            } else {
                markDragtomatchMiss(card);
            }
        });
    };

    const createDragtomatchCard = (cardIndex) => {
        const card = document.createElement('button');
        card.className = 'game1-object-card';
        card.type = 'button';
        card.dataset.dragtomatchObjectCard = 'true';
        card.setAttribute('aria-label', `Object card ${cardIndex + 1}`);
        card.setAttribute('aria-pressed', 'false');
        card.innerHTML = dragtomatchCardMarkup;
        attachDragtomatchCardInteractions(card);
        return card;
    };

    const reconcileDragtomatchCards = (choiceCount) => {
        if (!dragtomatchObjects) return [];

        while (dragtomatchCards.length < choiceCount) {
            const card = createDragtomatchCard(dragtomatchCards.length);
            dragtomatchObjects.appendChild(card);
            dragtomatchCards.push(card);
        }

        while (dragtomatchCards.length > choiceCount) {
            const card = dragtomatchCards.pop();
            if (!card) continue;
            clearDragtomatchCardFlipTimer(card);
            clearDragtomatchSpeechTimer(card);
            card.remove();
        }

        dragtomatchCards = Array.from(dragtomatchObjects.querySelectorAll('[data-dragtomatch-object-card]'));
        return dragtomatchCards;
    };
    const dragtomatchAudioContext = (() => {
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        return AudioCtor ? new AudioCtor() : null;
    })();
    const dragtomatchSpeechSynthesis = window.speechSynthesis || null;
    const dragtomatchFlipTimers = new WeakMap();
    const dragtomatchSpeechTimers = new WeakMap();
    const dragtomatchUsesTouchFallback = Boolean(
        (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
        navigator.maxTouchPoints > 0
    );
    let dragtomatchVoicesReadyPromise = null;
    let dragtomatchCelebrationTimer = null;
    let dragtomatchCelebrationReturnTimer = null;
    let dragtomatchCelebrationLetterTimers = [];
    let dragtomatchCelebratingCard = null;
    let dragtomatchCelebrationPlaceholder = null;
    let dragtomatchSelectedLetter = '';
    let dragtomatchTouchDragState = null;
    let dragtomatchIgnoreClickUntil = 0;
    let dragtomatchSunReactionTimer = null;
    const dragtomatchVoicePreferenceHints = [
        'natural',
        'online',
        'google',
        'microsoft',
        'soft',
        'sweet',
        'cute',
        'happy',
        'bright',
        'cheer',
        'cheery',
        'lively',
        'peppy',
        'sunny',
        'child',
        'kid',
        'kids',
        'kiddo',
        'girl',
        'female',
        'junior',
        'baby',
        'little',
        'samantha',
        'tessa',
        'serena',
        'zoe',
        'olivia',
        'claire',
        'sophia',
        'hannah',
        'lisa',
        'susan',
        'sarah',
        'aria',
        'jenny',
        'emma',
        'ava',
        'victoria',
    ];
    const dragtomatchVoiceAvoidHints = [
        'david',
        'mark',
        'john',
        'paul',
        'daniel',
        'dan',
        'james',
        'george',
        'thomas',
        'tom',
        'michael',
        'brian',
        'robert',
        'richard',
        'stephen',
        'kevin',
        'harry',
        'male',
        'man',
        'boy',
        'deep',
        'baritone',
    ];
    let dragtomatchCurrentIndex = 0;
    let dragtomatchAdvanceTimer = null;

    if (game1Stage) {
        const revealGame1Stage = () => {
            game1Stage.classList.add('is-visible');
        };

        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            window.setTimeout(revealGame1Stage, 120);
        } else if (game1IntroCard) {
            game1IntroCard.addEventListener('animationend', (event) => {
                if (event.animationName === 'game1IntroCard') {
                    revealGame1Stage();
                }
            }, { once: true });
        } else {
            window.setTimeout(revealGame1Stage, 5100);
        }
    }

    const shuffleArray = (items) => {
        const copy = items.slice();
        for (let index = copy.length - 1; index > 0; index -= 1) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
        }
        return copy;
    };

    const getDragtomatchChoiceCount = (letter) => {
        if (letter <= 'F') return 2;
        if (letter <= 'L') return 3;
        return 4;
    };

    const getDragtomatchRoundOptions = (index, choiceCount) => {
        const correct = dragtomatchPairs[index];
        const picks = [correct];
        const distractorOffsets = [1, 7, 13, 19, 23];

        distractorOffsets.forEach((offset) => {
            if (picks.length >= choiceCount) return;
            const candidate = dragtomatchPairs[(index + offset) % dragtomatchPairs.length];
            if (!picks.some((entry) => entry.letter === candidate.letter)) {
                picks.push(candidate);
            }
        });

        return shuffleArray(picks.slice(0, choiceCount));
    };

    const clearDragtomatchAdvance = () => {
        if (dragtomatchAdvanceTimer) {
            window.clearTimeout(dragtomatchAdvanceTimer);
            dragtomatchAdvanceTimer = null;
        }
    };

    const setDragtomatchSunReaction = (reaction) => {
        if (!dragtomatchSun) return;

        if (dragtomatchSunReactionTimer) {
            window.clearTimeout(dragtomatchSunReactionTimer);
            dragtomatchSunReactionTimer = null;
        }

        const nextReaction = reaction || 'happy';
        dragtomatchSun.dataset.reaction = nextReaction;

        if (nextReaction === 'happy') {
            dragtomatchSunReactionTimer = window.setTimeout(() => {
                dragtomatchSunReactionTimer = null;
                if (dragtomatchSun?.dataset.reaction === 'happy') {
                    setDragtomatchSunReaction('happy');
                }
            }, 1500);
        } else if (nextReaction === 'sad') {
            dragtomatchSunReactionTimer = window.setTimeout(() => {
                dragtomatchSunReactionTimer = null;
                if (dragtomatchSun?.dataset.reaction === 'sad') {
                    setDragtomatchSunReaction('happy');
                }
            }, 1200);
        }
    };

    const clearDragtomatchCardFlipTimer = (card) => {
        const timer = dragtomatchFlipTimers.get(card);
        if (timer) {
            window.clearTimeout(timer);
            dragtomatchFlipTimers.delete(card);
        }
    };

    const clearDragtomatchSpeechTimer = (card) => {
        const timer = dragtomatchSpeechTimers.get(card);
        if (timer) {
            window.clearTimeout(timer);
            dragtomatchSpeechTimers.delete(card);
        }
    };

    const getDragtomatchTutorialCompleted = () => {
        try {
            return window.localStorage.getItem(dragtomatchTutorialStorageKey) === 'true';
        } catch (error) {
            return false;
        }
    };

    const setDragtomatchTutorialCompleted = (completed) => {
        try {
            window.localStorage.setItem(dragtomatchTutorialStorageKey, completed ? 'true' : 'false');
        } catch (error) {
            // Storage can be unavailable in private or restricted contexts.
        }
    };

    const clearDragtomatchTutorial = () => {
        if (dragtomatchTutorialTimer) {
            window.clearTimeout(dragtomatchTutorialTimer);
            dragtomatchTutorialTimer = null;
        }

        if (dragtomatchTutorialDockTimer) {
            window.clearTimeout(dragtomatchTutorialDockTimer);
            dragtomatchTutorialDockTimer = null;
        }

        if (dragtomatchTutorialVideo) {
            dragtomatchTutorialVideo.pause();
            try {
                dragtomatchTutorialVideo.currentTime = 0;
            } catch (error) {
                // The video may not have metadata yet; pausing is enough here.
            }
        }

        if (dragtomatchTutorialOverlay) {
            dragtomatchTutorialOverlay.classList.remove('is-visible');
            dragtomatchTutorialOverlay.classList.remove('is-docking');
            dragtomatchTutorialOverlay.classList.remove('is-completing');
            dragtomatchTutorialOverlay.setAttribute('aria-hidden', 'true');
            dragtomatchTutorialOverlay.style.removeProperty('--tutorial-dock-x');
            dragtomatchTutorialOverlay.style.removeProperty('--tutorial-dock-y');
            dragtomatchTutorialOverlay.style.removeProperty('--tutorial-dock-scale');
        }
    };

    const completeDragtomatchTutorialDock = () => {
        if (!dragtomatchTutorialOverlay || !isPageVisible(dragtomatchPage)) {
            clearDragtomatchTutorial();
            setDragtomatchTutorialCompleted(true);
            return;
        }

        dragtomatchTutorialOverlay.classList.add('is-completing');
        dragtomatchTutorialOverlay.classList.remove('is-visible');
        dragtomatchTutorialOverlay.setAttribute('aria-hidden', 'true');

        dragtomatchTutorialDockTimer = window.setTimeout(() => {
            dragtomatchTutorialDockTimer = null;
            setDragtomatchTutorialCompleted(true);
            clearDragtomatchTutorial();
        }, 300);
    };

    const dockDragtomatchTutorial = () => {
        if (!dragtomatchTutorialOverlay || !dragtomatchTutorialButton || !isPageVisible(dragtomatchPage)) return;

        const overlayFrame = dragtomatchTutorialOverlay.querySelector('.game1-tutorial-frame');
        if (!overlayFrame) {
            clearDragtomatchTutorial();
            setDragtomatchTutorialCompleted(true);
            return;
        }

        const frameRect = overlayFrame.getBoundingClientRect();
        const buttonRect = dragtomatchTutorialButton.getBoundingClientRect();
        const frameCenterX = frameRect.left + frameRect.width / 2;
        const frameCenterY = frameRect.top + frameRect.height / 2;
        const buttonCenterX = buttonRect.left + buttonRect.width / 2;
        const buttonCenterY = buttonRect.top + buttonRect.height / 2;
        const dockScale = 0.09;
        const dockX = Math.round(buttonCenterX - frameCenterX);
        const dockY = Math.round(buttonCenterY - frameCenterY);

        dragtomatchTutorialOverlay.classList.add('is-docking');
        dragtomatchTutorialOverlay.style.setProperty('--tutorial-dock-x', `${dockX}px`);
        dragtomatchTutorialOverlay.style.setProperty('--tutorial-dock-y', `${dockY}px`);
        dragtomatchTutorialOverlay.style.setProperty('--tutorial-dock-scale', String(dockScale));

        dragtomatchTutorialDockTimer = window.setTimeout(() => {
            dragtomatchTutorialDockTimer = null;
            completeDragtomatchTutorialDock();
        }, 470);
    };

    const showDragtomatchTutorial = async (force = false) => {
        if (!dragtomatchTutorialOverlay || !dragtomatchTutorialVideo || !isPageVisible(dragtomatchPage)) return;
        if (dragtomatchTutorialOverlay.classList.contains('is-visible')) return;
        if (!force && getDragtomatchTutorialCompleted()) return;

        dragtomatchTutorialOverlay.classList.add('is-visible');
        dragtomatchTutorialOverlay.setAttribute('aria-hidden', 'false');

        try {
            try {
                dragtomatchTutorialVideo.currentTime = 0;
            } catch (error) {
                // If metadata is still loading, playback can still start from the beginning.
            }
            await dragtomatchTutorialVideo.play();
        } catch (error) {
            console.warn('Tutorial video could not autoplay.', error);
        }
    };

    const scheduleDragtomatchTutorial = () => {
        clearDragtomatchTutorial();

        if (!dragtomatchTutorialOverlay || !dragtomatchTutorialVideo || !isPageVisible(dragtomatchPage)) return;
        if (getDragtomatchTutorialCompleted()) return;

        dragtomatchTutorialTimer = window.setTimeout(() => {
            dragtomatchTutorialTimer = null;
            showDragtomatchTutorial();
        }, dragtomatchTutorialDelay);
    };

    const addTouchPressState = (element, className) => {
        if (!element) return;

        const setPressed = () => element.classList.add(className);
        const clearPressed = () => element.classList.remove(className);

        element.addEventListener('touchstart', setPressed, { passive: true });
        element.addEventListener('touchend', clearPressed, { passive: true });
        element.addEventListener('touchcancel', clearPressed, { passive: true });
    };

    const getDragtomatchCardFromPoint = (x, y) => {
        const target = document.elementFromPoint(x, y);
        return target?.closest?.('.game1-object-card') || null;
    };

    const clearDragtomatchTouchHover = () => {
        if (dragtomatchTouchDragState?.hoveredCard) {
            dragtomatchTouchDragState.hoveredCard.classList.remove('is-drop-target');
            dragtomatchTouchDragState.hoveredCard = null;
        }
    };

    const removeDragtomatchTouchGhost = () => {
        if (dragtomatchTouchDragState?.ghost?.parentNode) {
            dragtomatchTouchDragState.ghost.parentNode.removeChild(dragtomatchTouchDragState.ghost);
        }
        if (dragtomatchTouchDragState) {
            dragtomatchTouchDragState.ghost = null;
        }
    };

    const endDragtomatchTouchDrag = () => {
        if (!dragtomatchTouchDragState) return;

        document.body.classList.remove('is-touch-dragging');
        clearDragtomatchTouchHover();
        removeDragtomatchTouchGhost();

        if (dragtomatchLetterImage) {
            dragtomatchLetterImage.classList.remove('is-dragging');
        }

        dragtomatchTouchDragState = null;
    };

    const updateDragtomatchTouchDrag = (x, y) => {
        if (!dragtomatchTouchDragState || !dragtomatchTouchDragState.active) return;

        const state = dragtomatchTouchDragState;
        const dx = x - state.startX;
        const dy = y - state.startY;

        if (!state.dragging) {
            const distance = Math.hypot(dx, dy);
            if (distance < 8) return;

            state.dragging = true;
            state.letterImage.classList.add('is-dragging');
            state.letterImage.classList.remove('is-touching');
            state.ghost = state.letterImage.cloneNode(true);
            state.ghost.classList.add('is-touch-ghost');
            state.ghost.classList.remove('is-dragging', 'is-touching', 'is-selected');
            state.ghost.setAttribute('aria-hidden', 'true');
            state.ghost.setAttribute('draggable', 'false');
            state.ghost.style.position = 'fixed';
            state.ghost.style.left = `${x}px`;
            state.ghost.style.top = `${y}px`;
            state.ghost.style.margin = '0';
            state.ghost.style.transform = 'translate(-50%, -50%) scale(1.08)';
            state.ghost.style.zIndex = '60';
            state.ghost.style.pointerEvents = 'none';
            state.ghost.style.willChange = 'transform, opacity';
            state.ghost.style.transition = 'transform 0.08s linear, opacity 0.12s ease';
            document.body.appendChild(state.ghost);
            document.body.classList.add('is-touch-dragging');
            dragtomatchIgnoreClickUntil = Date.now() + 700;
        }

        if (!state.dragging || !state.ghost) return;

        state.ghost.style.left = `${x}px`;
        state.ghost.style.top = `${y}px`;

        const hoveredCard = getDragtomatchCardFromPoint(x, y);
        if (hoveredCard !== state.hoveredCard) {
            clearDragtomatchTouchHover();
            if (hoveredCard) {
                hoveredCard.classList.add('is-drop-target');
                state.hoveredCard = hoveredCard;
            }
        }
    };

    const beginDragtomatchTouchDrag = (event) => {
        if (!dragtomatchUsesTouchFallback || !dragtomatchLetterImage) return;
        const touch = event.changedTouches?.[0];
        if (!touch) return;

        if (dragtomatchTouchDragState) {
            endDragtomatchTouchDrag();
        }

        dragtomatchTouchDragState = {
            active: true,
            dragging: false,
            startX: touch.clientX,
            startY: touch.clientY,
            letter: dragtomatchLetterImage.dataset.letter || '',
            letterImage: dragtomatchLetterImage,
            hoveredCard: null,
            ghost: null,
        };

        dragtomatchLetterImage.classList.add('is-touching');
        dragtomatchIgnoreClickUntil = Date.now() + 350;
    };

    const finishDragtomatchTouchDrag = (event) => {
        if (!dragtomatchTouchDragState) return;

        const state = dragtomatchTouchDragState;
        const touch = event.changedTouches?.[0];
        const x = touch?.clientX ?? state.startX;
        const y = touch?.clientY ?? state.startY;

        if (!state.dragging) {
            endDragtomatchTouchDrag();
            return;
        }

        const droppedCard = getDragtomatchCardFromPoint(x, y) || state.hoveredCard;
        const correctLetter = dragtomatchLetterImage?.dataset.letter || '';

        if (droppedCard && state.letter && correctLetter && droppedCard.dataset.letter === state.letter && state.letter === correctLetter) {
            dragtomatchIgnoreClickUntil = Date.now() + 700;
            endDragtomatchTouchDrag();
            markDragtomatchSuccess(droppedCard);
            return;
        }

        if (droppedCard) {
            markDragtomatchMiss(droppedCard);
        }

        dragtomatchIgnoreClickUntil = Date.now() + 500;
        endDragtomatchTouchDrag();
    };

    const syncDragtomatchSelectionTargets = () => {
        const activeLetter = dragtomatchSelectedLetter || '';

        if (dragtomatchLetterImage) {
            dragtomatchLetterImage.classList.toggle('is-selected', Boolean(activeLetter));
        }

        dragtomatchCards.forEach((card) => {
            const shouldHighlight = Boolean(activeLetter) && card.dataset.letter === activeLetter;
            card.classList.toggle('is-drop-target', shouldHighlight);
        });
    };

    const setDragtomatchSelectedLetter = (letter) => {
        dragtomatchSelectedLetter = letter || '';
        syncDragtomatchSelectionTargets();
    };

    const clearDragtomatchSelectedLetter = () => {
        if (!dragtomatchSelectedLetter) return;
        dragtomatchSelectedLetter = '';
        syncDragtomatchSelectionTargets();
    };

    const clearDragtomatchCelebration = () => {
        if (dragtomatchCelebrationTimer) {
            window.clearTimeout(dragtomatchCelebrationTimer);
            dragtomatchCelebrationTimer = null;
        }

        if (dragtomatchCelebrationReturnTimer) {
            window.clearTimeout(dragtomatchCelebrationReturnTimer);
            dragtomatchCelebrationReturnTimer = null;
        }

        dragtomatchCelebrationLetterTimers.forEach((timer) => {
            window.clearTimeout(timer);
        });
        dragtomatchCelebrationLetterTimers = [];

        if (dragtomatchCelebratingCard) {
            const card = dragtomatchCelebratingCard;
            const spellTarget = card.querySelector('.game1-object-card-spell');
            if (spellTarget) {
                spellTarget.innerHTML = '';
            }

            card.classList.remove('game1-celebration-card');
            card.removeAttribute('aria-hidden');
            card.style.left = '';
            card.style.top = '';
            card.style.width = '';
            card.style.height = '';
            card.style.transform = '';
            card.style.opacity = '';
            card.style.filter = '';

            if (dragtomatchCelebrationPlaceholder?.parentNode) {
                dragtomatchCelebrationPlaceholder.parentNode.insertBefore(card, dragtomatchCelebrationPlaceholder);
                dragtomatchCelebrationPlaceholder.remove();
            }

            dragtomatchCelebratingCard = null;
        }
        dragtomatchCelebrationPlaceholder = null;

    };

    const getDragtomatchDisplayerHoldDelay = (word) => {
        const letterCount = Array.from(String(word || '')).filter((letter) => /[A-Za-z]/.test(letter)).length;
        if (!letterCount) return 700;

        return Math.max(900, Math.min(3200, 450 + letterCount * 260));
    };

    const startDragtomatchCelebration = (card, word) => new Promise((resolve) => {
        if (!card || !dragtomatchCelebrationLayer) {
            resolve();
            return;
        }

        clearDragtomatchCelebration();

        const spellTarget = card.querySelector('.game1-object-card-spell');
        if (!spellTarget) {
            resolve();
            return;
        }

        const cleanWord = String(word || '').trim();
        const displayLetters = Array.from(cleanWord);
        const zoomDelay = 160;
        const zoomDuration = 800;
        const returnDuration = 1150;
        const cardRect = card.getBoundingClientRect();
        const targetWidth = Math.min(window.innerWidth * 0.42, 620);
        const targetScale = targetWidth / Math.max(cardRect.width, 1);
        const targetX = window.innerWidth / 2 - (cardRect.left + cardRect.width / 2);
        const targetY = window.innerHeight / 2 - (cardRect.top + cardRect.height / 2) - Math.min(window.innerHeight * 0.03, 26);

        const placeholder = document.createElement('div');
        placeholder.className = 'game1-object-card-placeholder';
        placeholder.setAttribute('aria-hidden', 'true');
        card.parentNode?.insertBefore(placeholder, card);
        dragtomatchCelebrationPlaceholder = placeholder;

        card.classList.add('game1-celebration-card');
        card.classList.remove('is-solved', 'is-drop-target', 'is-wrong-drop');
        card.setAttribute('aria-hidden', 'true');
        card.disabled = true;
        card.style.left = `${cardRect.left}px`;
        card.style.top = `${cardRect.top}px`;
        card.style.width = `${cardRect.width}px`;
        card.style.height = `${cardRect.height}px`;
        card.style.transform = 'translate(0px, 0px) scale(1)';
        card.style.opacity = '1';

        spellTarget.innerHTML = '';
        spellTarget.setAttribute('aria-label', cleanWord);

        dragtomatchCelebratingCard = card;
        dragtomatchCelebrationLayer.appendChild(card);

        const letterSpans = [];
        const spokenSpans = [];

        displayLetters.forEach((letter) => {
            const letterSpan = document.createElement('span');
            letterSpan.className = letter === ' ' ? 'game1-object-card-spell-letter game1-object-card-spell-space' : 'game1-object-card-spell-letter';
            letterSpan.textContent = letter === ' ' ? '\u00A0' : letter;
            letterSpan.setAttribute('aria-hidden', 'true');
            if (letter !== ' ') {
                spokenSpans.push(letterSpan);
            } else {
                letterSpan.classList.add('is-visible');
            }
            spellTarget.appendChild(letterSpan);
            letterSpans.push(letterSpan);
        });

        if (!displayLetters.length) {
            spellTarget.textContent = cleanWord;
        }

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                card.style.transform = `translate(${targetX}px, ${targetY}px) scale(${targetScale})`;
            });
        });

        const returnToPlace = () => {
            spellTarget.innerHTML = '';
            card.style.transform = 'translate(0px, 0px) scale(1)';
            window.requestAnimationFrame(() => {
                card.classList.remove('is-flipped');
            });

            dragtomatchCelebrationReturnTimer = window.setTimeout(() => {
                dragtomatchCelebrationReturnTimer = null;
                resolve();
            }, returnDuration);
        };

        const startSpelling = () => {
            let visibleLetterCount = 0;
            let spellingEnded = false;
            let hasReturned = false;
            const afterAllLettersDelay = getDragtomatchDisplayerHoldDelay(cleanWord);

            const finishWhenReady = () => {
                if (hasReturned || !spellingEnded || visibleLetterCount < spokenSpans.length) return;
                hasReturned = true;

                dragtomatchCelebrationTimer = window.setTimeout(() => {
                    dragtomatchCelebrationTimer = null;
                    returnToPlace();
                }, afterAllLettersDelay);
            };

            const spellingPromise = speakDragtomatchSpelledWord(cleanWord, card, (spokenIndex) => {
                const targetSpan = spokenSpans[spokenIndex];
                if (targetSpan) {
                    targetSpan.classList.add('is-visible');
                    visibleLetterCount += 1;
                    finishWhenReady();
                }
            });

            spellingPromise
                .then(() => {
                    spellingEnded = true;
                    finishWhenReady();
                })
                .catch(() => {
                    spellingEnded = true;
                    finishWhenReady();
                });
        };

        dragtomatchCelebrationTimer = window.setTimeout(() => {
            dragtomatchCelebrationTimer = null;
            startSpelling();
        }, zoomDelay + zoomDuration);
    });

    const waitForDragtomatchVoices = () => {
        if (!dragtomatchSpeechSynthesis || typeof dragtomatchSpeechSynthesis.getVoices !== 'function') {
            return Promise.resolve([]);
        }

        const existingVoices = dragtomatchSpeechSynthesis.getVoices();
        if (existingVoices.length) {
            return Promise.resolve(existingVoices);
        }

        if (!dragtomatchVoicesReadyPromise) {
            dragtomatchVoicesReadyPromise = new Promise((resolve) => {
                const finish = () => {
                    const voices = dragtomatchSpeechSynthesis.getVoices();
                    resolve(voices);
                };

                const timeoutId = window.setTimeout(finish, 900);
                const handleVoicesChanged = () => {
                    window.clearTimeout(timeoutId);
                    dragtomatchSpeechSynthesis.removeEventListener?.('voiceschanged', handleVoicesChanged);
                    finish();
                };

                dragtomatchSpeechSynthesis.addEventListener?.('voiceschanged', handleVoicesChanged, { once: true });
            });
        }

        return dragtomatchVoicesReadyPromise;
    };

    const getDragtomatchPreferredVoice = () => {
        if (!dragtomatchSpeechSynthesis || typeof dragtomatchSpeechSynthesis.getVoices !== 'function') {
            return null;
        }

        const voices = dragtomatchSpeechSynthesis.getVoices();
        if (!voices.length) return null;

        const normalize = (value) => String(value || '').toLowerCase();
        const scoreVoice = (voice) => {
            const haystack = `${normalize(voice.name)} ${normalize(voice.voiceURI)} ${normalize(voice.lang)}`;
            let score = 0;

            dragtomatchVoicePreferenceHints.forEach((hint) => {
                if (haystack.includes(hint)) score += 4;
            });

            dragtomatchVoiceAvoidHints.forEach((hint) => {
                if (haystack.includes(hint)) score -= 5;
            });

            if (normalize(voice.lang).startsWith('en')) score += 2;
            if (normalize(voice.name).includes('female')) score += 4;
            if (normalize(voice.name).includes('happy')) score += 6;
            if (normalize(voice.name).includes('bright')) score += 6;
            if (normalize(voice.name).includes('cheer')) score += 6;
            if (normalize(voice.name).includes('lively')) score += 6;
            if (normalize(voice.name).includes('peppy')) score += 6;
            if (normalize(voice.name).includes('sunny')) score += 6;
            if (normalize(voice.name).includes('girl')) score += 8;
            if (normalize(voice.name).includes('child')) score += 10;
            if (normalize(voice.name).includes('kid')) score += 10;
            if (normalize(voice.name).includes('junior')) score += 6;
            if (voice.default) score -= 1;
            return score;
        };

        const rankedVoices = voices
            .map((voice) => ({ voice, score: scoreVoice(voice) }))
            .sort((left, right) => right.score - left.score);

        const bestVoice = rankedVoices[0]?.voice || null;
        if (bestVoice) return bestVoice;

        return voices[0] || null;
    };

    const speakDragtomatchObjectName = async (name, card) => {
        if (!name) {
            return;
        }

        clearDragtomatchSpeechTimer(card);

        if (!dragtomatchSpeechSynthesis || typeof window.SpeechSynthesisUtterance !== 'function') {
            await new Promise((resolve) => {
                const fallbackDelay = Math.max(900, Math.min(2600, name.length * 160));
                const timer = window.setTimeout(() => {
                    dragtomatchSpeechTimers.delete(card);
                    resolve();
                }, fallbackDelay);
                dragtomatchSpeechTimers.set(card, timer);
            });
            return;
        }

        await waitForDragtomatchVoices();
        dragtomatchSpeechSynthesis.cancel();

        await new Promise((resolve) => {
            const utterance = new window.SpeechSynthesisUtterance(name);
            const preferredVoice = getDragtomatchPreferredVoice();
            utterance.lang = preferredVoice?.lang || 'en-US';
            utterance.rate = 1.08;
            utterance.pitch = 1.85;
            utterance.volume = 1;
            utterance.voice = preferredVoice;

            let timer = null;
            const finish = () => {
                if (timer) {
                    window.clearTimeout(timer);
                    timer = null;
                }
                utterance.onend = null;
                utterance.onerror = null;
                dragtomatchSpeechTimers.delete(card);
                resolve();
            };

            utterance.onend = finish;
            utterance.onerror = finish;
            dragtomatchSpeechSynthesis.speak(utterance);

            const fallbackDelay = Math.max(900, Math.min(2600, name.length * 170));
            timer = window.setTimeout(() => {
                finish();
            }, fallbackDelay + 500);

            dragtomatchSpeechTimers.set(card, timer);
        });
    };

    const playDragtomatchFlipSound = () => {
        if (!dragtomatchAudioContext) return;

        if (dragtomatchAudioContext.state === 'suspended') {
            dragtomatchAudioContext.resume().catch(() => {});
        }

        const now = dragtomatchAudioContext.currentTime;
        const notes = dragtomatchFlipTone;

        notes.forEach((frequency, noteIndex) => {
            const oscillator = dragtomatchAudioContext.createOscillator();
            const gain = dragtomatchAudioContext.createGain();

            oscillator.type = noteIndex === 0 ? 'triangle' : 'sine';
            oscillator.frequency.value = frequency;
            gain.gain.value = 0.0001;

            oscillator.connect(gain);
            gain.connect(dragtomatchAudioContext.destination);

            const startTime = now + noteIndex * 0.05;
            const attackEnd = startTime + 0.03;
            const releaseEnd = startTime + 0.36 + noteIndex * 0.03;

            gain.gain.setValueAtTime(0.0001, startTime);
            gain.gain.exponentialRampToValueAtTime(0.18 - noteIndex * 0.03, attackEnd);
            gain.gain.exponentialRampToValueAtTime(0.0001, releaseEnd);

            oscillator.start(startTime);
            oscillator.stop(releaseEnd + 0.05);
        });
    };

    const playDragtomatchMissSound = () => {
        if (!dragtomatchAudioContext) return;

        if (dragtomatchAudioContext.state === 'suspended') {
            dragtomatchAudioContext.resume().catch(() => {});
        }

        const now = dragtomatchAudioContext.currentTime;

        dragtomatchMissTone.forEach((frequency, noteIndex) => {
            const oscillator = dragtomatchAudioContext.createOscillator();
            const gain = dragtomatchAudioContext.createGain();

            oscillator.type = noteIndex === 0 ? 'square' : 'triangle';
            oscillator.frequency.value = frequency;
            gain.gain.value = 0.0001;

            oscillator.connect(gain);
            gain.connect(dragtomatchAudioContext.destination);

            const startTime = now + noteIndex * 0.06;
            const attackEnd = startTime + 0.02;
            const releaseEnd = startTime + 0.18 + noteIndex * 0.03;

            gain.gain.setValueAtTime(0.0001, startTime);
            gain.gain.exponentialRampToValueAtTime(0.14 - noteIndex * 0.02, attackEnd);
            gain.gain.exponentialRampToValueAtTime(0.0001, releaseEnd);

            oscillator.start(startTime);
            oscillator.stop(releaseEnd + 0.04);
        });
    };

    const syncDragtomatchLetter = (pair) => {
        if (!dragtomatchLetterImage || !pair) return;
        dragtomatchLetterImage.textContent = pair.letter;
        dragtomatchLetterImage.dataset.letter = pair.letter;
        dragtomatchLetterImage.setAttribute('aria-label', `Letter ${pair.letter}`);
        dragtomatchLetterImage.setAttribute('draggable', dragtomatchUsesTouchFallback ? 'false' : 'true');
    };

    const renderDragtomatchRound = (index) => {
        clearDragtomatchAdvance();
        clearDragtomatchCelebration();
        clearDragtomatchSelectedLetter();
        setDragtomatchSunReaction('happy');

        if (!dragtomatchPairs.length) return;

        dragtomatchCurrentIndex = (index + dragtomatchPairs.length) % dragtomatchPairs.length;
        const currentPair = dragtomatchPairs[dragtomatchCurrentIndex];
        const choiceCount = getDragtomatchChoiceCount(currentPair.letter);
        reconcileDragtomatchCards(choiceCount);
        if (!dragtomatchCards.length) return;
        const roundOptions = getDragtomatchRoundOptions(dragtomatchCurrentIndex, choiceCount);

        if (dragtomatchObjects) {
            dragtomatchObjects.dataset.choiceCount = String(choiceCount);
            dragtomatchObjects.style.setProperty(
                '--object-card-image-size',
                choiceCount === 2 ? '0.82' : choiceCount === 3 ? '0.72' : '0.6'
            );
        }

        syncDragtomatchLetter(currentPair);
        setLettertraceNavigationTargets(currentPair.letter);
        syncDragtomatchLevels();

        dragtomatchCards.forEach((card, cardIndex) => {
            const option = roundOptions[cardIndex];
            const objectImage = card.querySelector('.game1-object-card-object');
            const isCorrect = option.letter === currentPair.letter;

            card.classList.remove('is-flipped', 'is-solved', 'is-wrong-drop', 'is-drop-target');
            card.setAttribute('aria-pressed', 'false');
            card.setAttribute('aria-disabled', 'false');
            card.dataset.letter = option.letter;
            card.dataset.objectName = option.objectName;
            card.dataset.objectSrc = option.objectSrc;
            card.dataset.objectScale = option.objectScale || '1';
            card.disabled = false;
            card.style.pointerEvents = 'auto';
            card.removeAttribute('hidden');
            card.removeAttribute('aria-hidden');
            card.setAttribute('aria-label', `Object card ${cardIndex + 1}: ${option.objectName}`);

            if (objectImage) {
                objectImage.src = option.objectSrc;
                objectImage.alt = option.objectName;
                objectImage.style.setProperty('--object-scale', option.objectScale || '1');
            }

            const spellTarget = card.querySelector('.game1-object-card-spell');
            if (spellTarget) {
                spellTarget.innerHTML = '';
            }

            card.dataset.correct = String(isCorrect);
        });
    };

    const speakDragtomatchSpelledWord = async (name, card, onLetterStart = () => {}) => {
        const cleanWord = String(name || '').trim();
        if (!cleanWord) {
            return;
        }

        const letters = Array.from(cleanWord).filter((letter) => /[A-Za-z]/.test(letter));
        if (!letters.length) {
            await speakDragtomatchObjectName(cleanWord, card);
            return;
        }

        clearDragtomatchSpeechTimer(card);

        await speakDragtomatchObjectName(cleanWord, card);
        await new Promise((resolve) => window.setTimeout(resolve, 30));

        const spellStepDelay = 170;
        const spellStartDelay = 60;
        const spellFinishDelay = 1600;
        const canSpeakLetters = dragtomatchSpeechSynthesis && typeof window.SpeechSynthesisUtterance === 'function';
        let preferredVoice = null;

        if (canSpeakLetters) {
            await waitForDragtomatchVoices();
            preferredVoice = getDragtomatchPreferredVoice();
            dragtomatchSpeechSynthesis.cancel();
        }

        await new Promise((resolve) => {
            letters.forEach((letter, index) => {
                const timer = window.setTimeout(() => {
                    if (!canSpeakLetters) {
                        onLetterStart(index, letter);
                        return;
                    }

                    const utterance = new window.SpeechSynthesisUtterance(letter.toUpperCase());
                    utterance.lang = preferredVoice?.lang || 'en-US';
                    utterance.rate = 1.65;
                    utterance.pitch = 1.9;
                    utterance.volume = 1;
                    utterance.voice = preferredVoice;

                    let revealed = false;
                    let revealFallbackTimer = null;
                    const revealWithVoice = () => {
                        if (revealed) return;
                        revealed = true;

                        if (revealFallbackTimer) {
                            window.clearTimeout(revealFallbackTimer);
                            revealFallbackTimer = null;
                        }

                        onLetterStart(index, letter);
                    };

                    utterance.onstart = revealWithVoice;
                    utterance.onerror = revealWithVoice;
                    dragtomatchSpeechSynthesis.speak(utterance);

                    revealFallbackTimer = window.setTimeout(revealWithVoice, 180);
                    dragtomatchCelebrationLetterTimers.push(revealFallbackTimer);
                }, spellStartDelay + index * spellStepDelay);

                dragtomatchCelebrationLetterTimers.push(timer);
            });

            const finishTimer = window.setTimeout(() => {
                dragtomatchSpeechTimers.delete(card);
                resolve();
            }, spellStartDelay + letters.length * spellStepDelay + spellFinishDelay);

            dragtomatchSpeechTimers.set(card, finishTimer);
        });
    };

    const advanceDragtomatchRound = () => {
        renderDragtomatchRound(dragtomatchCurrentIndex + 1);
    };

    const markDragtomatchSuccess = async (card) => {
        if (!card || card.classList.contains('is-solved')) return;

        clearDragtomatchSelectedLetter();
        clearDragtomatchCardFlipTimer(card);
        clearDragtomatchSpeechTimer(card);
        clearDragtomatchCelebration();
        card.classList.add('is-flipped');
        card.setAttribute('aria-pressed', 'true');
        card.setAttribute('aria-disabled', 'true');
        card.disabled = true;
        card.style.pointerEvents = 'none';
        setDragtomatchSunReaction('happy');
        playDragtomatchFlipSound();

        clearDragtomatchAdvance();

        const celebrationWord = card.dataset.objectName || card.dataset.letter || '';
        const celebrationPromise = startDragtomatchCelebration(card, celebrationWord);

        await Promise.all([celebrationPromise]);

        dragtomatchAdvanceTimer = window.setTimeout(() => {
            clearDragtomatchCelebration();
            card.classList.remove('is-flipped');
            card.classList.add('is-solved');
            card.setAttribute('aria-disabled', 'true');
            card.disabled = true;
            card.style.pointerEvents = 'none';
            advanceDragtomatchRound();
        }, game1TransitionDuration);
    };

    const markDragtomatchMiss = (card) => {
        if (!card) return;
        card.classList.remove('is-wrong-drop');
        setDragtomatchSunReaction('sad');
        playDragtomatchMissSound();
        card.getBoundingClientRect();
        card.classList.add('is-wrong-drop');
        window.setTimeout(() => {
            card.classList.remove('is-wrong-drop');
        }, 440);
    };

    if (dragtomatchUsesTouchFallback && dragtomatchLetterImage) {
        addTouchPressState(dragtomatchLetterImage, 'is-touching');
        dragtomatchLetterImage.addEventListener('touchstart', beginDragtomatchTouchDrag, { passive: false });
        document.addEventListener('touchmove', (event) => {
            if (!dragtomatchTouchDragState) return;
            const touch = event.touches?.[0];
            if (!touch) return;

            event.preventDefault();
            updateDragtomatchTouchDrag(touch.clientX, touch.clientY);
        }, { passive: false });
        document.addEventListener('touchend', finishDragtomatchTouchDrag, { passive: true });
        document.addEventListener('touchcancel', finishDragtomatchTouchDrag, { passive: true });

        dragtomatchLetterImage.addEventListener('click', (event) => {
            if (Date.now() < dragtomatchIgnoreClickUntil) return;
            event.preventDefault();
            event.stopPropagation();

            const currentLetter = dragtomatchLetterImage.dataset.letter || '';
            if (!currentLetter) return;

            if (dragtomatchSelectedLetter === currentLetter) {
                clearDragtomatchSelectedLetter();
                return;
            }

            setDragtomatchSelectedLetter(currentLetter);
        });
    }

    lettertraceUpperButton?.addEventListener('click', () => {
        syncLettertraceCase('upper');
    });

    lettertraceLowerButton?.addEventListener('click', () => {
        syncLettertraceCase('lower');
    });

    lettertraceClearButtons.forEach((button) => {
        button.addEventListener('click', () => {
            clearLettertraceCanvas();
        });
    });

    lettertraceSoundButton?.addEventListener('click', () => {
        const isPressed = lettertraceSoundButton.getAttribute('aria-pressed') === 'true';
        lettertraceSoundButton.setAttribute('aria-pressed', isPressed ? 'false' : 'true');
        lettertraceSoundButton.classList.toggle('is-muted', isPressed);
    });

    lettertraceTraceCanvas?.addEventListener('pointerdown', (event) => {
        if (!lettertraceTraceCanvas || !lettertraceTraceContext) return;

        lettertraceTraceDrawing = advanceLettertraceProgress(event);
        lettertraceTraceCanvas.setPointerCapture?.(event.pointerId);

        event.preventDefault();
    });

    lettertraceTraceCanvas?.addEventListener('pointermove', (event) => {
        if (!lettertraceTraceDrawing) return;

        advanceLettertraceProgress(event);
        event.preventDefault();
    });

    const stopLettertraceStroke = () => {
        const currentStroke = lettertraceTraceStrokeStates[lettertraceTraceStrokeIndex];
        if (currentStroke && currentStroke.progress >= currentStroke.length * 0.96) {
            currentStroke.progress = currentStroke.length;
            currentStroke.element.style.strokeDashoffset = '0';
            lettertraceTraceStrokeIndex += 1;
            lettertraceTraceStrokeProgress = 0;
            updateLettertraceProgressLabel();
        }
        lettertraceTraceDrawing = false;
        lettertraceTraceLastPoint = null;
    };

    lettertraceTraceCanvas?.addEventListener('pointerup', stopLettertraceStroke);
    lettertraceTraceCanvas?.addEventListener('pointercancel', stopLettertraceStroke);
    lettertraceTraceCanvas?.addEventListener('pointerleave', stopLettertraceStroke);

    dragtomatchLetterImage?.addEventListener('dragstart', (event) => {
        const letter = dragtomatchLetterImage.dataset.letter || '';
        if (!letter) return;

        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', letter);
        window.requestAnimationFrame(() => {
            dragtomatchLetterImage.classList.add('is-dragging');
        });
    });

    dragtomatchLetterImage?.addEventListener('dragend', () => {
        dragtomatchLetterImage.classList.remove('is-dragging');
        Array.from(dragtomatchObjects?.querySelectorAll('[data-dragtomatch-object-card]') || []).forEach((card) => card.classList.remove('is-drop-target'));
    });

    dragtomatchTutorialVideo?.addEventListener('ended', dockDragtomatchTutorial);
    dragtomatchTutorialOverlay?.addEventListener('click', (event) => {
        if (event.target === dragtomatchTutorialOverlay) {
            clearDragtomatchTutorial();
        }
    });
    dragtomatchTutorialButton?.addEventListener('click', () => {
        clearDragtomatchTutorial();
        showDragtomatchTutorial(true);
    });

    window.addEventListener('resize', () => {
        if (isPageVisible(lettertracePage)) {
            resizeLettertraceCanvas();
            clearLettertraceCanvas();
            updateLettertraceTraceGlyph();
        }
    });

    window.addEventListener('learnscape:routechange', (event) => {
        if (event.detail?.route === 'lettertrace') {
            updateLettertraceBackground(event.detail?.params || {});
            renderLettertraceScreen(event.detail?.params?.letter || getDragtomatchLetterFromHash());
            return;
        }

        if (event.detail?.route === 'dragtomatch') {
            setLettertraceNavigationTargets(event.detail?.params?.letter || getDragtomatchLetterFromHash());
            updateDragtomatchBackground(event.detail?.params || {});
            startDragtomatchAtLetter(event.detail?.params?.letter || getDragtomatchLetterFromHash());
            scheduleDragtomatchTutorial();
            return;
        }

        if (event.detail?.route === 'shapeCircle') {
            startShapeCircleScene();
            return;
        }

        updateLettertraceBackground({});
        updateDragtomatchBackground({});
        clearDragtomatchTutorial();
        resetShapeCircleScene();
    });

    if (isPageVisible(lettertracePage)) {
        updateLettertraceBackground(getLettertraceParamsFromHash());
        renderLettertraceScreen(getLettertraceParamsFromHash().letter || getDragtomatchLetterFromHash());
    }

    if (isPageVisible(dragtomatchPage)) {
        updateDragtomatchBackground(parseTarget(location.hash || 'title').params);
        setLettertraceNavigationTargets(getDragtomatchLetterFromHash());
        startDragtomatchAtLetter(getDragtomatchLetterFromHash());
        scheduleDragtomatchTutorial();
    }

    if (isPageVisible(shapeCirclePage)) {
        startShapeCircleScene();
    } else {
        resetShapeCircleScene();
    }

    renderDragtomatchLevels();
    if (!isPageVisible(lettertracePage)) {
        setLettertraceNavigationTargets(getDragtomatchLetterFromHash() || 'A');
    }

    loadingLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            const target = link.getAttribute('data-route') || link.getAttribute('href');

            event.preventDefault();

            if (!target || target.startsWith('#') || isNavigating) return;

            isNavigating = true;

            const releaseNavigationLock = () => {
                window.setTimeout(() => {
                    isNavigating = false;
                }, 100);
            };

            const goNext = () => {
                showLoadingScreen();

                window.setTimeout(() => {
                    navigateApp(target);
                    releaseNavigationLock();
                }, loadingDuration);
            };

            const shouldEnterFullscreen = link.classList.contains('btn-enter') && target === 'start';

            if (shouldEnterFullscreen) {
                const fullscreenTarget = getShellContainer() || getAppFrame() || document.documentElement;
                enterFullscreenFlow(fullscreenTarget).catch(() => {});
                goNext();
                return;
            }

            goNext();
        });
    });

    document.querySelector('.scroll-down')?.addEventListener('click', () => {
        document.getElementById('worlds')?.scrollIntoView({ behavior: 'smooth' });
    });

    const heroCharacters = document.querySelectorAll('.hero-character-ground');

    heroCharacters.forEach((heroCharacter) => {
        let hideTimer;

        heroCharacter.addEventListener('mouseenter', () => {
            window.clearTimeout(hideTimer);
            heroCharacter.classList.add('is-hiding');

            hideTimer = window.setTimeout(() => {
                heroCharacter.classList.remove('is-hiding');
            }, 2000);
        });
    });

    syncFullscreenClass();
    document.addEventListener('fullscreenchange', syncFullscreenClass);
    document.addEventListener('webkitfullscreenchange', syncFullscreenClass);
    document.addEventListener('msfullscreenchange', syncFullscreenClass);

    // Service worker registration is disabled during development to avoid stale cached assets.
});
