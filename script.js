// Smooth scrolling for anchor links is handled by CSS scroll-behavior: smooth.

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Learnscape Adventure loaded!');

const appVersion = '20260926-583';
    const appVersionKey = 'learnscape-app-version';
    const freshParamKey = 'fresh';
    let uiClickMasterVolume = null;
    const uiClickAudioContext = (() => {
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        return AudioCtor ? new AudioCtor() : null;
    })();
    const uiClickAudioOutput = (() => {
        if (!uiClickAudioContext) return null;

        const compressor = uiClickAudioContext.createDynamicsCompressor();
        const volume = uiClickAudioContext.createGain();
        compressor.threshold.value = -18;
        compressor.knee.value = 12;
        compressor.ratio.value = 6;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.12;
        volume.gain.value = 1.35 * (window.__learnscapeSoundScale?.() ?? 1);
        uiClickMasterVolume = volume;
        compressor.connect(volume);
        volume.connect(uiClickAudioContext.destination);
        return compressor;
    })();
    const uiClickSoundPresets = {
        tap: [
            { frequency: 520, type: 'square', gain: 0.1, duration: 0.045, attack: 0.008 },
            { frequency: 780, type: 'triangle', gain: 0.13, duration: 0.075, delay: 0.018, attack: 0.008 },
        ],
        pop: [
            { frequency: 560, type: 'square', gain: 0.12, duration: 0.055, attack: 0.008 },
            { frequency: 880, type: 'triangle', gain: 0.15, duration: 0.1, delay: 0.025, attack: 0.008 },
        ],
        chime: [
            { frequency: 523.25, type: 'triangle', gain: 0.13, duration: 0.12, attack: 0.01 },
            { frequency: 659.25, type: 'sine', gain: 0.12, duration: 0.16, delay: 0.045, attack: 0.01 },
            { frequency: 783.99, type: 'sine', gain: 0.11, duration: 0.2, delay: 0.09, attack: 0.01 },
        ],
        chestChime: [
            { frequency: 523.25, type: 'triangle', gain: 0.14, duration: 0.15, attack: 0.01 },
            { frequency: 659.25, type: 'triangle', gain: 0.14, duration: 0.19, delay: 0.055, attack: 0.01 },
            { frequency: 783.99, type: 'sine', gain: 0.13, duration: 0.24, delay: 0.11, attack: 0.01 },
            { frequency: 1046.5, type: 'sine', gain: 0.1, duration: 0.32, delay: 0.17, attack: 0.012 },
        ],
        backChime: [
            { frequency: 783.99, type: 'triangle', gain: 0.14, duration: 0.11, attack: 0.008 },
            { frequency: 659.25, type: 'triangle', gain: 0.13, duration: 0.14, delay: 0.055, attack: 0.008 },
            { frequency: 523.25, type: 'sine', gain: 0.12, duration: 0.19, delay: 0.11, attack: 0.01 },
        ],
        progressCelebration: [
            { frequency: 392, type: 'triangle', gain: 0.13, duration: 0.16, attack: 0.01 },
            { frequency: 523.25, type: 'triangle', gain: 0.15, duration: 0.2, delay: 0.075, attack: 0.01 },
            { frequency: 659.25, type: 'sine', gain: 0.14, duration: 0.25, delay: 0.15, attack: 0.012 },
            { frequency: 783.99, type: 'sine', gain: 0.12, duration: 0.34, delay: 0.225, attack: 0.012 },
        ],
        boardSuccess: [
            { frequency: 261.63, type: 'square', gain: 0.16, duration: 0.09, attack: 0.005 },
            { frequency: 523.25, type: 'triangle', gain: 0.2, duration: 0.16, delay: 0.035, attack: 0.006 },
            { frequency: 659.25, type: 'triangle', gain: 0.2, duration: 0.18, delay: 0.105, attack: 0.006 },
            { frequency: 783.99, type: 'triangle', gain: 0.2, duration: 0.2, delay: 0.175, attack: 0.006 },
            { frequency: 1046.5, type: 'triangle', gain: 0.19, duration: 0.34, delay: 0.245, attack: 0.008 },
            { frequency: 1318.51, type: 'sine', gain: 0.16, duration: 0.42, delay: 0.315, attack: 0.008 },
            { frequency: 783.99, type: 'sine', gain: 0.14, duration: 0.48, delay: 0.315, attack: 0.01 },
            { frequency: 1567.98, type: 'sine', gain: 0.12, duration: 0.5, delay: 0.37, attack: 0.01 },
        ],
        starPop: [
            { frequency: 440, type: 'square', gain: 0.1, duration: 0.055, attack: 0.006 },
            { frequency: 880, type: 'triangle', gain: 0.15, duration: 0.13, delay: 0.035, attack: 0.006 },
            { frequency: 1318.51, type: 'sine', gain: 0.12, duration: 0.2, delay: 0.085, attack: 0.008 },
            { frequency: 1760, type: 'sine', gain: 0.075, duration: 0.26, delay: 0.135, attack: 0.008 },
        ],
        spark: [
            { frequency: 880, type: 'triangle', gain: 0.13, duration: 0.055, attack: 0.006 },
            { frequency: 1174.66, type: 'sine', gain: 0.1, duration: 0.075, delay: 0.025, attack: 0.006 },
            { frequency: 1567.98, type: 'sine', gain: 0.075, duration: 0.11, delay: 0.05, attack: 0.006 },
        ],
        thunk: [
            { frequency: 260, type: 'square', gain: 0.14, duration: 0.055, attack: 0.006 },
            { frequency: 196, type: 'triangle', gain: 0.11, duration: 0.1, delay: 0.025, attack: 0.008 },
        ],
        wood: [
            { frequency: 220, type: 'square', gain: 0.13, duration: 0.055, attack: 0.006 },
            { frequency: 164.81, type: 'triangle', gain: 0.1, duration: 0.11, delay: 0.028, attack: 0.008 },
        ],
        woodCollectPop: [
            { frequency: 180, type: 'square', gain: 0.12, duration: 0.055, attack: 0.005 },
            { frequency: 360, type: 'triangle', gain: 0.13, duration: 0.09, delay: 0.02, attack: 0.006 },
            { frequency: 720, type: 'sine', gain: 0.1, duration: 0.14, delay: 0.055, attack: 0.008 },
        ],
        woodStore: [
            { frequency: 392, type: 'triangle', gain: 0.11, duration: 0.08, attack: 0.006 },
            { frequency: 659.25, type: 'triangle', gain: 0.14, duration: 0.14, delay: 0.04, attack: 0.008 },
            { frequency: 987.77, type: 'sine', gain: 0.09, duration: 0.2, delay: 0.1, attack: 0.01 },
        ],
        alert: [
            { frequency: 740, type: 'square', gain: 0.13, duration: 0.13, attack: 0.006 },
            { frequency: 392, type: 'sawtooth', gain: 0.12, duration: 0.16, delay: 0.13, attack: 0.008 },
            { frequency: 740, type: 'square', gain: 0.13, duration: 0.13, delay: 0.31, attack: 0.006 },
            { frequency: 392, type: 'sawtooth', gain: 0.12, duration: 0.2, delay: 0.44, attack: 0.008 },
        ],
        soft: [
            { frequency: 587.33, type: 'sine', gain: 0.13, duration: 0.08, attack: 0.01 },
        ],
        flip: [
            { frequency: 494, type: 'triangle', gain: 0.13, duration: 0.065, attack: 0.008 },
            { frequency: 740, type: 'sine', gain: 0.11, duration: 0.11, delay: 0.028, attack: 0.008 },
        ],
    };
    const uiClickSoundGainMultipliers = {
        boardSuccess: 1.75,
        alert: 1.45,
    };
    const syncUiClickVolume = () => {
        if (!uiClickMasterVolume || !uiClickAudioContext) return;
        uiClickMasterVolume.gain.setValueAtTime(
            1.35 * (window.__learnscapeSoundScale?.() ?? 1),
            uiClickAudioContext.currentTime,
        );
    };
    window.addEventListener('learnscape:soundchange', syncUiClickVolume);

    const resumeAudioContext = (audioContext) => {
        if (!audioContext || audioContext.state !== 'suspended') return;
        audioContext.resume().catch(() => {});
    };

    const playToneBurst = (audioContext, tones, baseDelay = 0, destination = audioContext?.destination) => {
        if (!audioContext || !Array.isArray(tones) || !tones.length) return;

        resumeAudioContext(audioContext);

        const now = audioContext.currentTime;

        tones.forEach((tone) => {
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();
            const delay = baseDelay + (tone.delay || 0);
            const startTime = now + delay;
            const attackEnd = startTime + Math.max(0.012, (tone.attack || 0.02));
            const releaseEnd = startTime + (tone.duration || 0.06);

            oscillator.type = tone.type || 'sine';
            oscillator.frequency.value = tone.frequency;
            gain.gain.value = 0.0001;

            oscillator.connect(gain);
            gain.connect(destination);

            gain.gain.setValueAtTime(0.0001, startTime);
            gain.gain.exponentialRampToValueAtTime(tone.gain || 0.08, attackEnd);
            gain.gain.exponentialRampToValueAtTime(0.0001, releaseEnd);

            oscillator.start(startTime);
            oscillator.stop(releaseEnd + 0.04);
        });
    };

    const playUiClickSound = (kind) => {
        if (!uiClickAudioContext) return;
        syncUiClickVolume();
        if ((window.__learnscapeSoundScale?.() ?? 1) === 0) return;
        const tones = uiClickSoundPresets[kind] || uiClickSoundPresets.tap;
        const gainMultiplier = uiClickSoundGainMultipliers[kind] || 1;
        playToneBurst(
            uiClickAudioContext,
            tones.map((tone) => ({
                ...tone,
                gain: (tone.gain || 0.08) * gainMultiplier,
            })),
            0,
            uiClickAudioOutput || uiClickAudioContext.destination,
        );
    };

    const getButtonClickSoundKind = (control) => {
        if (!control) return null;
        if (control.matches('button[disabled], [aria-disabled="true"]')) return null;
        if (control.classList.contains('circle-sort-object')) return null;
        if (control.classList.contains('square-answer-tile')) return null;
        if (control.classList.contains('shape-tv-choice')) return null;
        if (control.classList.contains('rectangle-mission-object')) return null;

        if (control.classList.contains('game-return-btn')) return 'backChime';
        if (control.classList.contains('shape-collection-chest')) return 'chestChime';
        if (control.classList.contains('shape-collection-close')) return 'thunk';
        if (control.classList.contains('circle-illustration-play-button')) return 'chime';
        if (control.classList.contains('circle-illustration-skip-button')) return 'tap';
        if (control.classList.contains('fullscreen-restore-button')) return 'tap';
        if (control.classList.contains('circle-lesson-progress-button')) {
            return control.matches('[data-circle-lesson-next], [data-square-lesson-next], [data-shape-preview-next]') ? 'chime' : 'pop';
        }
        if (control.classList.contains('shape-area-start-button')) return 'chime';
        if (control.classList.contains('shape-area-square-start-button')) return 'chime';
        if (control.classList.contains('shape-area-preview-start-button')) return 'chime';
        if (control.classList.contains('game-menu-btn')) return 'pop';
        if (control.classList.contains('rotate-button')) return 'spark';
        if (control.classList.contains('loading-link')) return 'chime';

        return 'tap';
    };

    document.addEventListener('click', (event) => {
        const control = event.target.closest?.('button, a');
        const clickSoundKind = getButtonClickSoundKind(control);

        if (!clickSoundKind) return;
        playUiClickSound(clickSoundKind);
    }, true);

    window.playUiClickSound = playUiClickSound;

    const clearCachedShell = async () => {
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map((registration) => registration.unregister()));
        }

        if ('caches' in window) {
            const cacheKeys = await caches.keys();
            await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)));
        }
    };

    const ensureFreshShell = async () => {
        let storedVersion = null;
        const currentUrl = new URL(window.location.href);
        const isFreshRequest = currentUrl.searchParams.get(freshParamKey) === appVersion;

        try {
            storedVersion = window.localStorage.getItem(appVersionKey);
        } catch (error) {
            storedVersion = null;
        }

        if (storedVersion === appVersion || isFreshRequest) {
            try {
                window.localStorage.setItem(appVersionKey, appVersion);
            } catch (error) {
                // The versioned URL is enough when storage is unavailable.
            }
            return false;
        }

        try {
            window.localStorage.setItem(appVersionKey, appVersion);
        } catch (error) {
            // The fresh query parameter prevents a reload loop when storage is unavailable.
        }

        await Promise.race([
            clearCachedShell(),
            new Promise((resolve) => window.setTimeout(resolve, 800)),
        ]);

        const nextUrl = currentUrl;
        nextUrl.searchParams.set(freshParamKey, appVersion);
        window.location.replace(nextUrl.toString());
        return true;
    };

    try {
        if (await ensureFreshShell()) return;
    } catch (error) {
        console.warn('Fresh shell reset was not available.', error);
    }

    const loadingLinks = document.querySelectorAll('.loading-link');
    let isNavigating = false;
    const loadingDuration = 1000;
    const titlePage = document.getElementById('learnscape-title-page');
    const game3Page = document.getElementById('learnscape-game3-page');
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
    const fullscreenRestoreButton = document.querySelector('.fullscreen-restore-button');
    const shapeCirclePage = document.getElementById('learnscape-shape-circle-page');
    const circleCameraPage = document.getElementById('learnscape-circle-camera-page');
    const circleCameraStartButton = circleCameraPage?.querySelector('.circle-camera-start-button') || null;
    const circleCameraVideo = circleCameraPage?.querySelector('.circle-camera-video') || null;
    const shapeCameraPages = Array.from(document.querySelectorAll('.shape-camera-page'));
    const shapeSquarePage = document.getElementById('learnscape-shape-square-page');
    const triangleGamePage = document.getElementById('learnscape-triangle-game-page');
    const rectangleDeliveryPage = document.getElementById('learnscape-rectangle-delivery-page');
    const rectangleRoadScroll = rectangleDeliveryPage?.querySelector('.rectangle-road-scroll');
    const rectangleRoadStrip = rectangleRoadScroll?.querySelector('.rectangle-road-strip');
    const rectangleHighwayTrack = rectangleRoadScroll?.querySelector('.rectangle-highway-track');
    const rectangleRoadToggle = rectangleDeliveryPage?.querySelector('.rectangle-road-toggle');
    const rectangleSpeedSlider = rectangleDeliveryPage?.querySelector('#rectangle-speed-slider');
    const rectangleSpeedValue = rectangleDeliveryPage?.querySelector('.rectangle-speed-value');
    const rectangleBossJumpButton = rectangleDeliveryPage?.querySelector('.rectangle-boss-jump-button');
    const rectangleJumpGuide = rectangleDeliveryPage?.querySelector('.rectangle-jump-guide');
    const rectangleGasMeter = rectangleDeliveryPage?.querySelector('.rectangle-gas-meter');
    const rectangleGasValueText = rectangleDeliveryPage?.querySelector('.rectangle-gas-value');
    const rectangleDeliveryProgress = rectangleDeliveryPage?.querySelector('.rectangle-delivery-progress');
    const rectangleDeliveryProgressCount = rectangleDeliveryPage?.querySelector('.rectangle-delivery-progress-count span');
    const rectangleGameOverOverlay = rectangleDeliveryPage?.querySelector('.rectangle-game-over-overlay');
    const rectangleGameOverRetry = rectangleDeliveryPage?.querySelector('.rectangle-game-over-retry');
    const rectangleDeliveryCompleteBg = rectangleDeliveryPage?.querySelector('.rectangle-delivery-complete-bg');
    const rectangleDeliveryCompleteConfetti = rectangleDeliveryPage?.querySelector('.rectangle-delivery-complete-confetti');
    const rectanglePauseButton = rectangleDeliveryPage?.querySelector('.rectangle-pause-button');
    const rectanglePauseOverlay = rectangleDeliveryPage?.querySelector('.rectangle-pause-overlay');
    const rectangleFinalProgress = rectangleDeliveryPage?.querySelector('.rectangle-final-progress');
    const rectangleFinalReplayButton = rectangleFinalProgress?.querySelector('[data-rectangle-final-replay]') || null;
    const rectangleFinalNextButton = rectangleFinalProgress?.querySelector('[data-rectangle-final-next]') || null;
    let rectangleRoadImages = [];
    let rectangleRoadLoopFrame = null;
    let rectangleRoadLoopWidth = 0;
    let rectangleRoadLoopOffset = 0;
    let rectangleHighwayOffset = 0;
    let rectangleHighwayLoopWidth = 0;
    let rectangleHighwayObstacles = [];
    const rectangleObstacleContacts = new Set();
    const rectangleRoadShapeObstacleFrames = new Map();
    let rectangleRoadShapeObstacleTimer = null;
    let rectangleRoadHitUntil = 0;
    let rectangleRoadLoopTime = 0;
    let rectangleRoadLoopPaused = false;
    let rectangleGamePaused = false;
    let rectangleBraking = null;
    let rectangleResumeFromDelivery = false;
    const rectangleRoadBaseSpeed = 0.1;
    const rectangleRoadPostDeliverySpeed = 0.14;
    const rectangleSpeedMultipliers = [0.8, 1.15, 1.5, 1.85, 2.25];
    const rectangleHornCueDistance = 220;
    const rectangleHornResetDistance = 380;
    let rectangleSpeedLevel = 3;
    let rectangleCurrentSpeedMultiplier = rectangleSpeedMultipliers[rectangleSpeedLevel - 1];
    let rectangleDisplayedGasLevel = -1;
    const rectangleDrivingAudio = window.Audio ? new Audio('assets/Audios/Sound effects/driving.mp3') : null;
    const rectangleHornAudio = window.Audio ? new Audio('assets/Audios/Sound effects/horn.mp3') : null;
    const rectangleStopAudio = window.Audio ? new Audio('assets/Audios/Sound effects/stop.mp3') : null;
    if (rectangleDrivingAudio) rectangleDrivingAudio.loop = true;
    let rectangleDrivingAudioPlayPending = false;
    let rectangleDrivingAudioLastAttempt = 0;
    let rectangleHornReady = true;
    const rectangleGasDrainPerMs = 0.00045;
    let rectangleGasLevel = 100;
    let rectangleGasPenaltyRemaining = 0;
    let rectangleWrongStopTimer = null;
    const rectangleRoadGasPickupFrames = new Map();
    const rectangleGasPickupThresholds = [50, 40, 30, 20, 10, 5];
    const rectangleTriggeredGasPickupThresholds = new Set();
    let rectangleGasDepleted = false;
    let rectangleGameOverRevealTimer = null;
    let rectangleGameOverLoseAudio = null;
    let abortRectangleBossEncounter = () => {};
    let resumeRectangleBossEncounter = () => {};
    const triggerRectangleGameOver = () => {
        if (rectangleGasDepleted || !rectangleDeliveryPage || rectangleDeliveryPage.hidden) return;
        rectangleGasDepleted = true;
        rectangleGasPenaltyRemaining = 0;
        clearRectangleRoadGasPickup();
        rectangleBossRetryWarningMilestone = rectangleBossActive && rectangleBossCurrentMilestone !== null
            ? rectangleBossCurrentMilestone
            : null;
        abortRectangleBossEncounter();
        rectangleRoadLoopPaused = true;
        rectangleBraking = null;
        rectangleDeliveryPage.classList.add('is-road-stopped', 'is-gas-empty');
        rectangleRoadStrip?.classList.add('is-loop-paused');
        if (rectangleWrongStopTimer !== null) {
            window.clearTimeout(rectangleWrongStopTimer);
            rectangleWrongStopTimer = null;
        }
        if (rectangleRoadToggle) {
            rectangleRoadToggle.disabled = true;
            rectangleRoadToggle.classList.remove('is-wrong-stop');
            rectangleRoadToggle.textContent = 'Empty';
            rectangleRoadToggle.setAttribute('aria-label', 'Out of gas');
        }
        if (rectangleBossJumpButton) rectangleBossJumpButton.disabled = true;
        if (rectangleDeliveryRevealTimer !== null) {
            window.clearTimeout(rectangleDeliveryRevealTimer);
            rectangleDeliveryRevealTimer = null;
        }
        if (rectangleDeliveryArrivalTimer !== null) {
            window.clearTimeout(rectangleDeliveryArrivalTimer);
            rectangleDeliveryArrivalTimer = null;
        }
        if (rectangleDeliveryJeepSequence) {
            rectangleDeliveryJeepSequence.hidden = false;
            rectangleDeliveryJeepSequence.classList.remove('is-driving');
            rectangleDeliveryJeepSequence.classList.add('is-arrived');
        }
        if (rectangleDeliveryDrivingJeep) rectangleDeliveryDrivingJeep.hidden = true;
        if (rectangleDeliveryArrivedJeep) rectangleDeliveryArrivedJeep.hidden = false;
        if (rectangleDeliveryInstructionAudio) {
            rectangleDeliveryInstructionAudio.pause();
            rectangleDeliveryInstructionAudio.currentTime = 0;
        }
        if (window.Audio) {
            rectangleGameOverLoseAudio = new window.Audio('assets/Audios/Sound effects/lose.mp3');
            rectangleGameOverLoseAudio.play().catch(() => {});
        }
        rectangleGameOverRevealTimer = window.setTimeout(() => {
            rectangleGameOverRevealTimer = null;
            if (!rectangleGasDepleted || rectangleDeliveryPage.hidden || !rectangleGameOverOverlay) return;
            rectangleGameOverOverlay.hidden = false;
            rectangleGameOverOverlay.getBoundingClientRect();
            rectangleGameOverOverlay.classList.add('is-visible');
            rectangleGameOverRetry?.focus({ preventScroll: true });
        }, 650);
    };
    const updateRectangleGasMeter = () => {
        const roundedLevel = Math.max(0, Math.round(rectangleGasLevel));
        rectangleGasMeter?.style.setProperty('--gas-level', `${rectangleGasLevel}%`);
        rectangleGasMeter?.setAttribute('aria-valuenow', String(roundedLevel));
        rectangleGasMeter?.classList.toggle('is-low', rectangleGasLevel <= 35);
        rectangleGasMeter?.classList.toggle('is-danger', rectangleGasLevel <= 15);
        if (rectangleGasValueText && roundedLevel !== rectangleDisplayedGasLevel) {
            rectangleDisplayedGasLevel = roundedLevel;
            rectangleGasValueText.textContent = `${roundedLevel}%`;
        }
    };
    const shouldSpawnRectangleMilestoneGas = () => (
        rectangleDeliveryPage
        && !rectangleDeliveryPage.hidden
        && !rectangleGasDepleted
        && !rectangleGamePaused
        && !rectangleRoadLoopPaused
        && !rectangleDeliveryPage.classList.contains('is-boss-battle')
        && !rectangleDeliveryPage.classList.contains('is-final-complete-scene')
        && rectangleDeliveryJeepSequence?.classList.contains('is-arrived')
    );

    const setRectangleGasLevel = (level) => {
        const previousGasLevel = rectangleGasLevel;
        rectangleGasLevel = Math.max(0, Math.min(100, level));
        updateRectangleGasMeter();
        if (rectangleGasLevel > 50) rectangleTriggeredGasPickupThresholds.clear();
        rectangleGasPickupThresholds.forEach((threshold) => {
            if (
                previousGasLevel > threshold
                && rectangleGasLevel <= threshold
                && !rectangleTriggeredGasPickupThresholds.has(threshold)
                && shouldSpawnRectangleMilestoneGas()
            ) {
                rectangleTriggeredGasPickupThresholds.add(threshold);
                spawnRectangleRoadGasPickup({ clearExisting: false, threshold });
            }
        });
        if (rectangleGasLevel <= 0) triggerRectangleGameOver();
    };
    updateRectangleGasMeter();
    const syncRectangleDrivingSound = () => {
        if (!rectangleDrivingAudio) return;
        const finalCelebrationDriving = rectangleDeliveryPage?.classList.contains('is-final-complete-scene')
            && rectangleDeliveryJeepSequence?.classList.contains('is-driving');
        const moving = !rectangleDeliveryPage?.hidden
            && !rectangleGasDepleted
            && !rectangleGamePaused
            && (!rectangleRoadLoopPaused || finalCelebrationDriving);
        const soundScale = window.__learnscapeSoundScale?.() ?? 1;
        const brakeFactor = rectangleBraking ? rectangleBraking.speedFactor : 1;
        rectangleDrivingAudio.volume = moving
            ? Math.min(1, 0.48 * brakeFactor * soundScale)
            : 0;
        rectangleDrivingAudio.playbackRate = Math.max(0.55, Math.min(1.5, rectangleCurrentSpeedMultiplier * brakeFactor));
        if (!moving || soundScale === 0) {
            rectangleDrivingAudio.pause();
            rectangleDrivingAudioPlayPending = false;
            return;
        }

        const now = performance.now();
        if (!rectangleDrivingAudio.paused || rectangleDrivingAudioPlayPending || now - rectangleDrivingAudioLastAttempt < 700) return;
        rectangleDrivingAudioPlayPending = true;
        rectangleDrivingAudioLastAttempt = now;
        rectangleDrivingAudio.play()
            .catch(() => {})
            .finally(() => {
                rectangleDrivingAudioPlayPending = false;
            });
    };
    window.addEventListener('learnscape:soundchange', syncRectangleDrivingSound);

    const startRectangleEngineSound = () => {
        if (!rectangleDrivingAudio) return;
        syncRectangleDrivingSound();
    };
    const stopRectangleEngineSound = () => {
        rectangleDrivingAudio?.pause();
        if (rectangleDrivingAudio) rectangleDrivingAudio.currentTime = 0;
        rectangleStopAudio?.pause();
    };
    const updateRectangleEngineSound = syncRectangleDrivingSound;

    const setRectangleGamePaused = (paused) => {
        if (!rectangleDeliveryPage || rectangleDeliveryPage.hidden || rectangleDeliveryPage.classList.contains('is-final-complete-scene')) {
            paused = false;
        }
        if (rectangleGamePaused === paused) return;
        rectangleGamePaused = paused;
        rectangleDeliveryPage?.classList.toggle('is-paused', paused);
        if (rectanglePauseOverlay) rectanglePauseOverlay.hidden = !paused;
        if (rectanglePauseButton) {
            rectanglePauseButton.setAttribute('aria-pressed', paused ? 'true' : 'false');
            rectanglePauseButton.setAttribute('aria-label', paused ? 'Resume rectangle game' : 'Pause rectangle game');
        }

        if (paused) {
            if (rectangleRoadShapeObstacleTimer !== null) {
                window.clearTimeout(rectangleRoadShapeObstacleTimer);
                rectangleRoadShapeObstacleTimer = null;
            }
            stopRectangleEngineSound();
            if (rectangleBossActive) clearRectangleBossTimers();
            return;
        }

        rectangleRoadLoopTime = performance.now();
        if (canRunRectangleRoadShapeObstacles()) scheduleRectangleRoadShapeObstacle();
        if (rectangleBossActive) {
            scheduleRectangleBossSpike(700);
            if (canSpawnRectangleBossGas()) scheduleRectangleBossGas(900);
            scheduleRectangleBossBlink(900);
            scheduleRectangleBossAutoLaser(700);
        }
        updateRectangleEngineSound();
    };

    const clearRectangleGamePause = () => setRectangleGamePaused(false);

    rectanglePauseButton?.addEventListener('click', () => {
        setRectangleGamePaused(!rectangleGamePaused);
    });
    rectanglePauseButton?.addEventListener('keydown', (event) => {
        if (event.code === 'Space') event.preventDefault();
    });

    const playRectangleHorn = () => {
        if (!rectangleHornAudio || (window.__learnscapeSoundScale?.() ?? 1) === 0) return;
        rectangleHornAudio.volume = Math.min(1, 0.7 * (window.__learnscapeSoundScale?.() ?? 1));
        rectangleHornAudio.currentTime = 0;
        rectangleHornAudio.play().catch(() => {});
    };
    const playRectangleStop = () => {
        if (!rectangleStopAudio || (window.__learnscapeSoundScale?.() ?? 1) === 0) return;
        rectangleStopAudio.volume = Math.min(1, 0.7 * (window.__learnscapeSoundScale?.() ?? 1));
        rectangleStopAudio.currentTime = 0;
        rectangleStopAudio.play().catch(() => {});
    };
    function clearRectangleRoadGasPickup() {
        rectangleRoadGasPickupFrames.forEach((frame) => window.cancelAnimationFrame(frame));
        rectangleRoadGasPickupFrames.clear();
        rectangleDeliveryPage?.querySelectorAll('.rectangle-road-gas-pickup')
            .forEach((pickup) => pickup.remove());
    }

    function collectRectangleRoadGasPickup(pickup) {
        if (!pickup?.isConnected) return;
        pickup.remove();
        const pickupFrame = rectangleRoadGasPickupFrames.get(pickup);
        if (pickupFrame !== undefined) {
            window.cancelAnimationFrame(pickupFrame);
            rectangleRoadGasPickupFrames.delete(pickup);
        }
        setRectangleGasLevel(rectangleGasLevel + 16);
        playUiClickSound('chime');
        rectangleGasMeter?.classList.remove('is-penalized');
        rectangleGasMeter?.getBoundingClientRect();
        rectangleGasMeter?.classList.add('is-penalized');
    }

    function watchRectangleRoadGasPickup(pickup) {
        const checkPickup = () => {
            if (!pickup.isConnected || !rectangleDeliveryJeepSequence || rectangleDeliveryPage?.hidden) {
                rectangleRoadGasPickupFrames.delete(pickup);
                return;
            }
            if (rectangleGamePaused) {
                rectangleRoadGasPickupFrames.set(pickup, window.requestAnimationFrame(checkPickup));
                return;
            }
            if (rectanglesOverlap(pickup.getBoundingClientRect(), rectangleDeliveryJeepSequence.getBoundingClientRect(), 8)) {
                collectRectangleRoadGasPickup(pickup);
                return;
            }
            rectangleRoadGasPickupFrames.set(pickup, window.requestAnimationFrame(checkPickup));
        };
        rectangleRoadGasPickupFrames.set(pickup, window.requestAnimationFrame(checkPickup));
    }

    function spawnRectangleRoadGasPickup({ clearExisting = true, threshold = null } = {}) {
        if (!rectangleDeliveryPage || rectangleDeliveryPage.hidden || rectangleGasDepleted || rectangleGamePaused) return;
        if (clearExisting) clearRectangleRoadGasPickup();
        const pickup = document.createElement('span');
        pickup.className = 'rectangle-road-gas-pickup';
        if (threshold !== null) pickup.dataset.gasThreshold = String(threshold);
        pickup.style.setProperty('--pickup-start-y', `${((Math.random() * 4.2) - 2.1).toFixed(2)}rem`);
        pickup.style.setProperty('--pickup-duration', `${(4.1 + Math.random() * 1.35).toFixed(2)}s`);
        pickup.style.setProperty('--pickup-bottom', `${Math.round(20 + Math.random() * 12)}%`);
        const gasIcon = rectangleGasMeter?.querySelector('.rectangle-gas-icon')?.cloneNode(true);
        if (gasIcon) pickup.append(gasIcon);
        rectangleDeliveryPage.append(pickup);
        pickup.addEventListener('animationend', () => {
            if (pickup.isConnected) pickup.remove();
            const pickupFrame = rectangleRoadGasPickupFrames.get(pickup);
            if (pickupFrame !== undefined) {
                window.cancelAnimationFrame(pickupFrame);
                rectangleRoadGasPickupFrames.delete(pickup);
            }
        }, { once: true });
        watchRectangleRoadGasPickup(pickup);
    }
    if (rectangleRoadStrip && !rectangleRoadStrip.dataset.loopReady) {
        const originalRoadImages = Array.from(rectangleRoadStrip.querySelectorAll(':scope > img'));
        originalRoadImages.forEach((image) => {
            const copy = image.cloneNode(true);
            copy.setAttribute('aria-hidden', 'true');
            rectangleRoadStrip.append(copy);
        });
        rectangleRoadImages = originalRoadImages;
        rectangleRoadStrip.dataset.loopReady = 'true';
    } else if (rectangleRoadStrip) {
        rectangleRoadImages = Array.from(rectangleRoadStrip.children).slice(0, rectangleRoadStrip.children.length / 2);
    }
    if (rectangleHighwayTrack && !rectangleHighwayTrack.dataset.loopReady) {
        const highwaySegments = Array.from(rectangleHighwayTrack.children);
        highwaySegments.forEach((segment) => rectangleHighwayTrack.append(segment.cloneNode(true)));
        rectangleHighwayTrack.dataset.loopReady = 'true';
    }
    rectangleHighwayObstacles = Array.from(rectangleHighwayTrack?.querySelectorAll('.rectangle-highway-obstacle') || []);
    rectangleHighwayObstacles.forEach((obstacle) => {
        obstacle.hidden = true;
    });
    const syncRectangleHighwayPosition = () => {
        if (!rectangleHighwayTrack) return;
        const displayedOffset = rectangleHighwayLoopWidth > 0
            ? rectangleHighwayOffset % rectangleHighwayLoopWidth
            : rectangleHighwayOffset;
        rectangleHighwayTrack.style.transform = `translate3d(${-displayedOffset}px, 0, 0)`;
    };
    const updateRectangleRoadLoopWidth = () => {
        if (!rectangleRoadStrip) return;
        const images = Array.from(rectangleRoadStrip.children).slice(0, rectangleRoadStrip.children.length / 2);
        const loopWidth = images.reduce((width, image) => width + image.getBoundingClientRect().width, 0);
        if (loopWidth > 0) {
            rectangleRoadLoopWidth = loopWidth;
            rectangleRoadLoopOffset %= loopWidth;
        }
        if (rectangleHighwayTrack) {
            const highwaySegments = Array.from(rectangleHighwayTrack.children)
                .slice(0, rectangleHighwayTrack.children.length / 2);
            rectangleHighwayLoopWidth = highwaySegments.reduce(
                (width, segment) => width + segment.getBoundingClientRect().width,
                0,
            );
            syncRectangleHighwayPosition();
        }
    };
    const canRunRectangleRoadShapeObstacles = () => (
        rectangleDeliveredItems.size >= 1
        && !rectangleDeliveryPage?.hidden
        && !rectangleDeliveryPage?.classList.contains('is-boss-battle')
        && !rectangleDeliveryPage?.classList.contains('is-final-complete-scene')
        && !rectangleGamePaused
        && !rectangleRoadLoopPaused
        && !rectangleGasDepleted
        && rectangleDeliveryJeepSequence?.classList.contains('is-arrived')
    );

    const clearRectangleRoadShapeObstacles = () => {
        if (rectangleRoadShapeObstacleTimer !== null) {
            window.clearTimeout(rectangleRoadShapeObstacleTimer);
            rectangleRoadShapeObstacleTimer = null;
        }
        rectangleRoadShapeObstacleFrames.forEach((frame) => window.cancelAnimationFrame(frame));
        rectangleRoadShapeObstacleFrames.clear();
        rectangleDeliveryPage?.querySelectorAll('.rectangle-road-shape-obstacle')
            .forEach((obstacle) => obstacle.remove());
    };

    const hitRectangleRoadShapeObstacle = (obstacle, timestamp) => {
        if (!obstacle?.isConnected || rectangleObstacleContacts.has(obstacle)) return;
        rectangleObstacleContacts.add(obstacle);
        if (timestamp < rectangleRoadHitUntil) return;

        rectangleRoadHitUntil = timestamp + 950;
        setRectangleGasLevel(rectangleGasLevel - 14);
        playUiClickSound('thunk');
        rectangleDeliveryPage.classList.remove('is-road-jeep-hit');
        rectangleDeliveryPage.getBoundingClientRect();
        rectangleDeliveryPage.classList.add('is-road-jeep-hit');
        window.setTimeout(() => rectangleDeliveryPage?.classList.remove('is-road-jeep-hit'), 420);
    };

    const watchRectangleRoadShapeObstacle = (obstacle) => {
        const checkObstacle = (timestamp) => {
            if (!obstacle.isConnected || !rectangleDeliveryJeepSequence || rectangleDeliveryPage?.hidden) {
                rectangleRoadShapeObstacleFrames.delete(obstacle);
                rectangleObstacleContacts.delete(obstacle);
                return;
            }
            if (rectangleGamePaused) {
                rectangleRoadShapeObstacleFrames.set(obstacle, window.requestAnimationFrame(checkObstacle));
                return;
            }
            const obstacleRect = obstacle.getBoundingClientRect();
            const jeepRect = rectangleDeliveryJeepSequence.getBoundingClientRect();
            if (obstacleRect.right < jeepRect.left - 80) {
                rectangleObstacleContacts.delete(obstacle);
            }
            if (
                rectangleDeliveryJeepSequence.classList.contains('is-boss-jumping')
                && obstacleRect.left < jeepRect.right - 20
                && obstacleRect.right > jeepRect.left + 20
            ) {
                rectangleObstacleContacts.add(obstacle);
            } else if (rectanglesOverlap(obstacleRect, jeepRect, 12)) {
                hitRectangleRoadShapeObstacle(obstacle, timestamp);
            }
            rectangleRoadShapeObstacleFrames.set(obstacle, window.requestAnimationFrame(checkObstacle));
        };
        rectangleRoadShapeObstacleFrames.set(obstacle, window.requestAnimationFrame(checkObstacle));
    };

    const spawnRectangleRoadShapeObstacle = () => {
        if (!canRunRectangleRoadShapeObstacles()) return;
        const shapes = ['circle', 'triangle', 'oval', 'diamond', 'star'];
        const obstacle = document.createElement('span');
        obstacle.className = 'rectangle-road-shape-obstacle';
        obstacle.dataset.shape = shapes[Math.floor(Math.random() * shapes.length)];
        obstacle.style.setProperty('--obstacle-bottom', `${Math.round(14 + Math.random() * 7)}%`);
        obstacle.style.setProperty('--obstacle-duration', `${(3.8 + Math.random() * 1.25).toFixed(2)}s`);
        obstacle.style.setProperty('--obstacle-spin-duration', `${(0.72 + Math.random() * 0.38).toFixed(2)}s`);
        rectangleDeliveryPage.append(obstacle);
        obstacle.addEventListener('animationend', () => {
            const frame = rectangleRoadShapeObstacleFrames.get(obstacle);
            if (frame !== undefined) window.cancelAnimationFrame(frame);
            rectangleRoadShapeObstacleFrames.delete(obstacle);
            rectangleObstacleContacts.delete(obstacle);
            obstacle.remove();
        }, { once: true });
        watchRectangleRoadShapeObstacle(obstacle);
    };

    const scheduleRectangleRoadShapeObstacle = (delay = 1200 + Math.random() * 900) => {
        if (rectangleRoadShapeObstacleTimer !== null) window.clearTimeout(rectangleRoadShapeObstacleTimer);
        if (!canRunRectangleRoadShapeObstacles()) return;
        rectangleRoadShapeObstacleTimer = window.setTimeout(() => {
            rectangleRoadShapeObstacleTimer = null;
            if (!canRunRectangleRoadShapeObstacles()) return;
            spawnRectangleRoadShapeObstacle();
            scheduleRectangleRoadShapeObstacle(1700 + Math.random() * 1500);
        }, delay);
    };

    const checkRectangleHighwayObstacles = (timestamp) => {
        if (
            !rectangleDeliveryJeepSequence?.classList.contains('is-arrived')
            || rectangleDeliveryPage?.classList.contains('is-boss-battle')
            || rectangleRoadLoopPaused
            || rectangleGamePaused
            || rectangleGasDepleted
        ) return;

        const jeepRect = rectangleDeliveryJeepSequence.getBoundingClientRect();
        rectangleHighwayObstacles.forEach((obstacle) => {
            if (obstacle.hidden) {
                rectangleObstacleContacts.delete(obstacle);
                return;
            }
            const obstacleRect = obstacle.getBoundingClientRect();
            if (obstacleRect.right < jeepRect.left - 60 || obstacleRect.left > jeepRect.right + 60) {
                rectangleObstacleContacts.delete(obstacle);
                return;
            }
            if (
                rectangleDeliveryJeepSequence.classList.contains('is-boss-jumping')
                && obstacleRect.left < jeepRect.right - 20
                && obstacleRect.right > jeepRect.left + 20
            ) {
                rectangleObstacleContacts.add(obstacle);
                return;
            }
            if (!rectanglesOverlap(obstacleRect, jeepRect, 12) || rectangleObstacleContacts.has(obstacle)) return;
            rectangleObstacleContacts.add(obstacle);
            if (timestamp < rectangleRoadHitUntil) return;

            rectangleRoadHitUntil = timestamp + 950;
            setRectangleGasLevel(rectangleGasLevel - 14);
            playUiClickSound('thunk');
            rectangleDeliveryPage.classList.remove('is-road-jeep-hit');
            rectangleDeliveryPage.getBoundingClientRect();
            rectangleDeliveryPage.classList.add('is-road-jeep-hit');
            window.setTimeout(() => rectangleDeliveryPage?.classList.remove('is-road-jeep-hit'), 420);
        });
    };
    const tickRectangleRoadLoop = (timestamp) => {
        const elapsedMs = rectangleRoadLoopTime ? Math.min(timestamp - rectangleRoadLoopTime, 34) : 0;
        if (rectangleGamePaused) {
            rectangleRoadLoopTime = timestamp;
            updateRectangleEngineSound();
            rectangleRoadLoopFrame = window.requestAnimationFrame(tickRectangleRoadLoop);
            return;
        }
        if (!rectangleRoadLoopWidth || !rectangleHighwayLoopWidth) updateRectangleRoadLoopWidth();
        if (rectangleRoadLoopTime && !rectangleRoadLoopPaused && rectangleRoadLoopWidth > 0) {
            const roadSpeed = rectangleDeliveredItems.size >= 1
                ? rectangleRoadPostDeliverySpeed
                : rectangleRoadBaseSpeed;
            const targetSpeedMultiplier = rectangleSpeedMultipliers[rectangleSpeedLevel - 1];
            const speedBlend = Math.min(1, elapsedMs / 140);
            rectangleCurrentSpeedMultiplier += (targetSpeedMultiplier - rectangleCurrentSpeedMultiplier) * speedBlend;
            if (rectangleBraking) {
                const progress = Math.min(1, (timestamp - rectangleBraking.startTime) / 850);
                rectangleBraking.speedFactor = (1 - progress) ** 2;
            }
            const travelDistance = elapsedMs * roadSpeed * rectangleCurrentSpeedMultiplier
                * (rectangleBraking?.speedFactor ?? 1);
            rectangleRoadLoopOffset = (rectangleRoadLoopOffset + travelDistance) % rectangleRoadLoopWidth;
            rectangleHighwayOffset += travelDistance;
            rectangleRoadStrip.style.transform = `translate3d(${-rectangleRoadLoopOffset}px, 0, 0)`;
            syncRectangleHighwayPosition();
            checkRectangleHighwayObstacles(timestamp);
            if (canRunRectangleRoadShapeObstacles() && rectangleRoadShapeObstacleTimer === null) {
                scheduleRectangleRoadShapeObstacle();
            } else if (!canRunRectangleRoadShapeObstacles() && rectangleRoadShapeObstacleTimer !== null) {
                window.clearTimeout(rectangleRoadShapeObstacleTimer);
                rectangleRoadShapeObstacleTimer = null;
            }
            setRectangleGasLevel(rectangleGasLevel - (elapsedMs * rectangleGasDrainPerMs));
            const currentJob = rectangleDeliveryJobs[rectangleDeliveryJobIndex];
            const currentStopDistance = currentJob ? getRectangleDeliveryStopDistance(currentJob) : Number.POSITIVE_INFINITY;
            if (!rectangleBraking && currentStopDistance < rectangleHornCueDistance && rectangleHornReady && !rectangleDeliveryPage?.classList.contains('is-boss-battle')) {
                rectangleHornReady = false;
                playRectangleHorn();
            } else if (currentStopDistance > rectangleHornResetDistance) {
                rectangleHornReady = true;
            }
            if (rectangleBraking?.speedFactor === 0) {
                const onStopped = rectangleBraking.onStopped;
                rectangleBraking = null;
                rectangleRoadLoopPaused = true;
                rectangleDeliveryPage?.classList.add('is-road-stopped');
                rectangleRoadStrip?.classList.add('is-loop-paused');
                clearRectangleRoadShapeObstacles();
                onStopped();
            }
        }
        updateRectangleEngineSound();
        if (elapsedMs && rectangleGasPenaltyRemaining > 0) {
            const penaltyStep = Math.min(rectangleGasPenaltyRemaining, elapsedMs * 0.01);
            rectangleGasPenaltyRemaining -= penaltyStep;
            setRectangleGasLevel(rectangleGasLevel - penaltyStep);
        }
        rectangleRoadLoopTime = timestamp;
        rectangleRoadLoopFrame = window.requestAnimationFrame(tickRectangleRoadLoop);
    };
    rectangleSpeedSlider?.addEventListener('input', () => {
        rectangleSpeedLevel = Math.max(1, Math.min(5, Number(rectangleSpeedSlider.value) || 3));
        if (rectangleSpeedValue) rectangleSpeedValue.textContent = String(rectangleSpeedLevel);
        updateRectangleEngineSound();
    });
    const startRectangleRoadLoop = ({ preservePosition = false } = {}) => {
        updateRectangleRoadLoopWidth();
        if (!preservePosition) {
            rectangleRoadLoopOffset = 0;
            rectangleHighwayOffset = 0;
            rectangleObstacleContacts.clear();
        }
        clearRectangleRoadShapeObstacles();
        rectangleRoadLoopTime = 0;
        rectangleRoadLoopPaused = false;
        rectangleBraking = null;
        rectangleCurrentSpeedMultiplier = rectangleSpeedMultipliers[rectangleSpeedLevel - 1];
        if (rectangleRoadStrip) {
            rectangleRoadStrip.style.transform = `translate3d(${-rectangleRoadLoopOffset}px, 0, 0)`;
        }
        syncRectangleHighwayPosition();
        rectangleRoadStrip?.classList.add('is-auto-looping');
        startRectangleEngineSound();
        if (canRunRectangleRoadShapeObstacles()) scheduleRectangleRoadShapeObstacle();
        if (rectangleRoadLoopFrame === null) rectangleRoadLoopFrame = window.requestAnimationFrame(tickRectangleRoadLoop);
    };
    const stopRectangleRoadLoop = ({ preservePosition = false } = {}) => {
        if (rectangleRoadLoopFrame !== null) window.cancelAnimationFrame(rectangleRoadLoopFrame);
        rectangleRoadLoopFrame = null;
        rectangleRoadLoopTime = 0;
        if (!preservePosition) {
            rectangleRoadLoopOffset = 0;
            rectangleHighwayOffset = 0;
            rectangleObstacleContacts.clear();
            clearRectangleRoadShapeObstacles();
        }
        rectangleRoadLoopPaused = false;
        rectangleBraking = null;
        if (rectangleRoadStrip) {
            if (preservePosition) {
                rectangleRoadStrip.style.transform = `translate3d(${-rectangleRoadLoopOffset}px, 0, 0)`;
            } else {
                rectangleRoadStrip.style.removeProperty('transform');
            }
        }
        syncRectangleHighwayPosition();
        stopRectangleEngineSound();
        rectangleRoadStrip?.classList.remove('is-auto-looping', 'is-loop-paused');
        if (rectangleRoadToggle) {
            rectangleRoadToggle.classList.remove('is-wrong-stop');
            rectangleRoadToggle.textContent = 'Stop';
            rectangleRoadToggle.setAttribute('aria-label', 'Stop at this delivery');
            rectangleRoadToggle.setAttribute('aria-pressed', 'false');
        }
    };
    rectangleRoadToggle?.addEventListener('click', () => {
        if (rectangleGamePaused) return;
        if (rectangleRoadToggle.disabled || rectangleBraking || !rectangleDeliveryJeepSequence?.classList.contains('is-arrived')) return;
        if (rectangleDeliveryPage?.classList.contains('is-boss-battle')) return;
        const job = rectangleDeliveryJobs[rectangleDeliveryJobIndex];
        if (!job) return;
        const isCorrectStop = isRectangleDeliveryStopNear(job);
        rectangleRoadToggle.disabled = true;
        rectangleRoadToggle.classList.remove('is-wrong-stop');
        rectangleRoadToggle.textContent = 'Stopping';
        rectangleRoadToggle.setAttribute('aria-label', 'Jeep slowing to a stop');
        playRectangleStop();
        rectangleBraking = {
            startTime: rectangleRoadLoopTime || performance.now(),
            speedFactor: 1,
            onStopped: () => {
                if (rectangleGasDepleted || rectangleDeliveryPage?.hidden) return;
                if (!isCorrectStop) {
                    rectangleRoadToggle.classList.add('is-wrong-stop');
                    rectangleRoadToggle.textContent = 'Wrong Stop';
                    rectangleRoadToggle.setAttribute('aria-label', `Keep moving until the ${job.destination} is beside the jeep`);
                    rectangleGasPenaltyRemaining += 12;
                    rectangleGasMeter?.classList.remove('is-penalized');
                    rectangleGasMeter?.getBoundingClientRect();
                    rectangleGasMeter?.classList.add('is-penalized');
                    if (rectangleWrongStopTimer !== null) window.clearTimeout(rectangleWrongStopTimer);
                    rectangleWrongStopTimer = window.setTimeout(() => {
                        rectangleWrongStopTimer = null;
                        if (rectangleDeliveryPage && !rectangleDeliveryPage.hidden) {
                            rectangleRoadLoopPaused = false;
                            rectangleDeliveryPage.classList.remove('is-road-stopped');
                            rectangleRoadStrip?.classList.remove('is-loop-paused');
                            rectangleRoadToggle.disabled = false;
                            rectangleRoadToggle.classList.remove('is-wrong-stop');
                            rectangleRoadToggle.textContent = 'Stop';
                            rectangleRoadToggle.setAttribute('aria-label', 'Stop at this delivery');
                            startRectangleEngineSound();
                            spawnRectangleRoadGasPickup();
                        }
                    }, 1200);
                    return;
                }
                rectangleRoadToggle.textContent = 'Going';
                rectangleRoadToggle.setAttribute('aria-label', `Heading to ${job.destination}`);
                rectangleRoadToggle.setAttribute('aria-pressed', 'true');
                rectangleResumeFromDelivery = true;
                rectangleDeliveryRouteTimer = window.setTimeout(() => {
                    rectangleDeliveryRouteTimer = null;
                    navigateApp(job.route);
                }, 800);
            },
        };
    });
    window.addEventListener('resize', () => {
        if (rectangleRoadStrip?.classList.contains('is-auto-looping')) updateRectangleRoadLoopWidth();
    });
    const rectangleDeliveryJeepSequence = rectangleDeliveryPage?.querySelector('.rectangle-delivery-jeep-sequence') || null;
    const rectangleDeliveryDrivingJeep = rectangleDeliveryPage?.querySelector('.rectangle-delivery-jeep-driving') || null;
    const rectangleDeliveryArrivedJeep = rectangleDeliveryPage?.querySelector('.rectangle-delivery-jeep-arrived') || null;
    const rectangleDeliveryInstructionPanel = rectangleDeliveryPage?.querySelector('.rectangle-delivery-instruction-panel') || null;
    const rectangleDeliveryInstructionDefaultText = rectangleDeliveryInstructionPanel?.textContent.trim() || '';
    const rectangleDeliveryTaskPanel = rectangleDeliveryPage?.querySelector('.rectangle-delivery-task-panel') || null;
    const rectangleDeliveryTaskItems = Array.from(rectangleDeliveryPage?.querySelectorAll('.rectangle-delivery-item') || []);
    const rectangleDeliveryTaskItemName = rectangleDeliveryPage?.querySelector('.rectangle-delivery-task-copy strong') || null;
    const rectangleDeliveryTaskDestinationName = rectangleDeliveryPage?.querySelector('.rectangle-delivery-task-destination strong') || null;
    const rectangleDeliveryJobs = [
        { item: 'books', itemName: 'Books', destination: 'Bookstore', route: 'rectangleBookstore', wayIndex: 1, center: 0.36 },
        { item: 'bread-tray', itemName: 'Bread Tray', destination: 'Bakery', route: 'rectangleBakery', wayIndex: 2, center: 0.82 },
        { item: 'toy-box', itemName: 'Toy Box', destination: 'Toy Shop', route: 'rectangleToyShop', wayIndex: 4, center: 0.39 },
    ];
    let rectangleDeliveryJobIndex = 0;
    const rectangleDeliveredItems = new Set();
    const rectangleDeliveryBackground = rectangleDeliveryPage?.querySelector('.shape-area-bg') || null;
    const rectangleBuildingHotspots = Array.from(rectangleDeliveryPage?.querySelectorAll('[data-rectangle-building]') || []);
    const rectangleDestinationPages = Array.from(document.querySelectorAll('.rectangle-destination-page'));
    const rectangleParkingShapes = Array.from(document.querySelectorAll('.rectangle-parking-shape'));
    const rectangleParkingWrongTimers = new WeakMap();
    let rectangleDeliveryArrivalTimer = null;
    let rectangleDeliveryRevealTimer = null;
    let rectangleDeliveryRouteTimer = null;
    let rectangleFinalCompletePending = false;
    let rectangleFinalCelebrationStarted = false;
    let rectangleFinalCompletedAudio = null;
    let rectangleFinalCheeringAudio = null;
    let rectangleFinalMahusayAudio = null;
    const getRectangleDeliveryStopDistance = (job) => {
        updateRectangleRoadLoopWidth();
        const targetImage = rectangleRoadImages[job.wayIndex];
        if (!targetImage || !rectangleRoadScroll || !rectangleRoadLoopWidth) return Number.POSITIVE_INFINITY;
        const targetWidth = targetImage.getBoundingClientRect().width;
        const targetX = rectangleRoadImages
            .slice(0, job.wayIndex)
            .reduce((x, image) => x + image.getBoundingClientRect().width, 0)
            + (targetWidth * job.center);
        const jeepCenterX = rectangleRoadScroll.clientWidth / 2;
        return [-1, 0, 1].reduce((distance, copyIndex) => {
            const copyX = targetX + (copyIndex * rectangleRoadLoopWidth) - rectangleRoadLoopOffset;
            return Math.min(distance, Math.abs(copyX - jeepCenterX));
        }, Number.POSITIVE_INFINITY);
    };

    const isRectangleDeliveryStopNear = (job) => {
        const targetImage = rectangleRoadImages[job.wayIndex];
        const targetWidth = targetImage?.getBoundingClientRect().width || 0;
        const nearestDistance = getRectangleDeliveryStopDistance(job);
        return nearestDistance <= Math.max(70, targetWidth * 0.14);
    };
    let rectangleDeliveryInstructionAudio = null;
    let rectangleDeliveryInstructionShown = false;
    let rectangleDeliveryInstructionHideTimer = null;
    let rectangleParkingInstructionAudio = null;
    let rectangleParkingFeedbackAudio = null;
    let rectangleParkingMoveTimer = null;
    let rectangleParkingRouteTimer = null;
    const shapePreviewPages = Array.from(document.querySelectorAll('.shape-area-preview-page'));
    const shapePreviewProgressByPage = new Map();
    const shapePreviewIntroStates = new Map();
    const shapePreviewSceneCleanupByPage = new Map();
    const heartMissionPage = document.getElementById('learnscape-shape-area-6-page');
    const heartMissionIntro = heartMissionPage?.querySelector('.heart-mission-intro') || null;
    const heartMissionCharacterWrap = heartMissionIntro?.querySelector('.heart-mission-character-wrap') || null;
    const heartMissionMessageText = heartMissionIntro?.querySelector('.heart-mission-message-text') || null;
    const heartMissionStartButton = heartMissionIntro?.querySelector('.heart-mission-start-button') || null;
    const heartCupidGame = heartMissionPage?.querySelector('.heart-cupid-game') || null;
    const heartShotField = heartCupidGame?.querySelector('.heart-shot-field') || null;
    const heartAimTrail = heartShotField?.querySelector('.heart-aim-trail') || null;
    const heartAimTrailGlow = heartShotField?.querySelector('.heart-aim-trail-glow') || null;
    const heartFlyingArrow = heartShotField?.querySelector('.heart-flying-arrow') || null;
    const heartFloatingBalloons = Array.from(heartCupidGame?.querySelectorAll('.heart-floating-balloon, .shape-floating-balloon, .powerup-floating-balloon') || []);
    const heartPointBalloons = heartFloatingBalloons.filter((balloon) => balloon.dataset.balloonKind === 'heart');
    const heartShapePenaltyBalloons = heartFloatingBalloons.filter((balloon) => balloon.dataset.balloonKind === 'shape' || balloon.classList.contains('shape-floating-balloon'));
    const heartFreezeBalloons = heartFloatingBalloons.filter((balloon) => balloon.dataset.balloonKind === 'freeze');
    const heartBombBalloons = heartFloatingBalloons.filter((balloon) => balloon.dataset.balloonKind === 'bomb');
    const heartCupidBowControl = heartCupidGame?.querySelector('.heart-cupid-bow-control') || null;
    const heartBowArt = heartCupidBowControl?.querySelector('.heart-bow-art') || null;
    const heartBowString = heartCupidBowControl?.querySelector('.heart-bow-string') || null;
    const heartBowArrowParts = Array.from(heartCupidBowControl?.querySelectorAll('.heart-bow-arrow, .heart-bow-arrow-head, .heart-bow-arrow-feather') || []);
    const heartColorGauge = heartCupidGame?.querySelector('.heart-color-gauge') || null;
    const heartColorTargetIcon = heartCupidGame?.querySelector('.heart-color-target-icon') || null;
    const heartColorGaugeFill = heartCupidGame?.querySelector('.heart-color-gauge-fill') || null;
    const heartColorMilestones = Array.from(heartCupidGame?.querySelectorAll('[data-heart-color-stage]') || []);
    const heartGameTimer = heartCupidGame?.querySelector('.heart-game-timer') || null;
    const heartGameTimerValue = heartCupidGame?.querySelector('.heart-game-timer-value') || null;
    const heartGamePauseButton = heartCupidGame?.querySelector('.heart-game-pause-button') || null;
    const heartGamePauseOverlay = heartCupidGame?.querySelector('.heart-game-pause-overlay') || null;
    const heartFreezeStatus = heartCupidGame?.querySelector('.heart-freeze-status') || null;
    const heartFreezeCountdown = heartCupidGame?.querySelector('.heart-freeze-countdown') || null;
    const heartGameResult = heartCupidGame?.querySelector('.heart-game-result') || null;
    const heartGameResultTitle = heartCupidGame?.querySelector('.heart-game-result-title') || null;
    const heartGameResultCopy = heartCupidGame?.querySelector('.heart-game-result-copy') || null;
    const heartGameRetryButton = heartCupidGame?.querySelector('.heart-game-retry-button') || null;
    const heartGameCelebration = heartMissionPage?.querySelector('.heart-game-celebration') || null;
    const heartCelebrationConfetti = heartGameCelebration?.querySelector('.heart-celebration-confetti') || null;
    const heartFinalProgress = heartMissionPage?.querySelector('.heart-final-progress') || null;
    const heartFinalReplayButton = heartFinalProgress?.querySelector('.heart-final-replay') || null;
    const heartFinalNextButton = heartFinalProgress?.querySelector('.heart-final-next') || null;
    const starMissionPage = document.getElementById('learnscape-shape-area-7-page');
    const starMissionIntro = starMissionPage?.querySelector('.star-mission-intro') || null;
    const starMissionMessageText = starMissionIntro?.querySelector('.star-mission-message-text') || null;
    const starMissionStartButton = starMissionIntro?.querySelector('.star-mission-start-button') || null;
    const starMissionWalker = starMissionPage?.querySelector('.star-mission-walker') || null;
    const starMissionWalkerCharacter = starMissionWalker?.querySelector('.star-mission-walker-character') || null;
    const starMissionFallField = starMissionPage?.querySelector('.star-mission-fall-field') || null;
    const starMissionSetup = starMissionPage?.querySelector('.star-mission-setup') || null;
    const starMissionTargetOptions = Array.from(starMissionPage?.querySelectorAll('.star-mission-target-option') || []);
    const starMissionHud = starMissionPage?.querySelector('.star-mission-hud') || null;
    const starMissionProgressValue = starMissionPage?.querySelector('.star-mission-progress-value') || null;
    const starMissionProgressFill = starMissionPage?.querySelector('.star-mission-progress-fill') || null;
    const starMissionTimerPanel = starMissionPage?.querySelector('.star-mission-timer-panel') || null;
    const starMissionTimerValue = starMissionPage?.querySelector('.star-mission-timer-value') || null;
    const starMissionCelebration = starMissionPage?.querySelector('.star-mission-celebration') || null;
    const starMissionConfetti = starMissionCelebration?.querySelector('.star-mission-confetti') || null;
    const starMissionTimeout = starMissionPage?.querySelector('.star-mission-timeout') || null;
    const starMissionRetryButton = starMissionTimeout?.querySelector('.star-mission-retry-button') || null;
    const diamondMissionPage = document.getElementById('learnscape-shape-area-8-page');
    const diamondMissionGuide = diamondMissionPage?.querySelector('.diamond-mission-guide') || null;
    const diamondMissionMessageText = diamondMissionGuide?.querySelector('.diamond-mission-message-text') || null;
    const diamondMissionStartButton = diamondMissionGuide?.querySelector('.diamond-mission-start-button') || null;
    const diamondMissionBlackout = diamondMissionPage?.querySelector('.diamond-mission-blackout') || null;
    const diamondMissionGame = diamondMissionPage?.querySelector('.diamond-mission-game') || null;
    const diamondMissionBatLayer = diamondMissionGame?.querySelector('.diamond-mission-bats') || null;
    const diamondMissionPauseButton = diamondMissionGame?.querySelector('.diamond-mission-pause-button') || null;
    const diamondMissionPauseOverlay = diamondMissionGame?.querySelector('.diamond-mission-pause-overlay') || null;
    const diamondMissionStorage = diamondMissionGame?.querySelector('.diamond-mission-storage') || null;
    const diamondMissionStorageSlots = Array.from(diamondMissionStorage?.querySelectorAll('.diamond-mission-storage-slot') || []);
    const diamondMissionReveal = diamondMissionGame?.querySelector('.diamond-mission-reveal') || null;
    const diamondMissionCelebration = diamondMissionPage?.querySelector('.diamond-mission-celebration') || null;
    const diamondMissionConfetti = diamondMissionCelebration?.querySelector('.diamond-mission-confetti') || null;
    const HEART_GAME_START_TIME_MS = 45000;
    const HEART_GAME_LARGE_HEART_BONUS_MS = 5000;
    const HEART_GAME_SMALL_HEART_BONUS_MS = 5000;
    const HEART_GAME_CLOCK_TICKING_AUDIO_SOURCE = 'assets/Audios/Sound effects/clock ticking.mp3';
    const HEART_GAME_TIMES_UP_AUDIO_SOURCE = 'assets/Audios/Sound effects/times up.mp3';
    const HEART_GAME_LOSE_AUDIO_SOURCE = 'assets/Audios/Sound effects/lose.mp3';
    const HEART_GAME_TARGET_BALLOON_COUNT = 4;
    const HEART_BALLOON_SPEED_VARIATIONS = [0.84, 1.08, 0.93, 1.17, 0.89, 1.12, 0.97, 1.2];
    const HEART_COLOR_CHALLENGES = [
        { key: 'red', label: 'RED', required: 3, color: '#ff435f', edge: '#9d1737' },
        { key: 'orange', label: 'ORANGE', required: 5, color: '#ff8a32', edge: '#a94516' },
        { key: 'yellow', label: 'YELLOW', required: 6, color: '#ffd83d', edge: '#a86d08' },
        { key: 'green', label: 'GREEN', required: 7, color: '#55c95c', edge: '#247431' },
        { key: 'blue', label: 'BLUE', required: 8, color: '#3f9cff', edge: '#205ca8' },
        { key: 'indigo', label: 'INDIGO', required: 9, color: '#5556c9', edge: '#2d2e79' },
        { key: 'violet', label: 'VIOLET', required: 10, color: '#a653e5', edge: '#65269b' },
    ];
    const HEART_CELEBRATION_AUDIO_SOURCES = [
        'assets/Audios/Sound effects/completed.mp3',
        'assets/Audios/Voice over/Mahusay.mp3',
        'assets/Audios/Sound effects/kids cheering.mp3',
    ];
    const STAR_MISSION_BOING_AUDIO_SOURCE = 'assets/Audios/Sound effects/boing.mp3';
    const STAR_MISSION_COLLECT_AUDIO_SOURCE = 'assets/Audios/Sound effects/star.mp3';
    const STAR_MISSION_WALK_AUDIO_SOURCE = 'assets/Audios/Sound effects/walk.mp3';
    const STAR_MISSION_COMPLETED_AUDIO_SOURCE = 'assets/Audios/Sound effects/completed.mp3';
    const STAR_MISSION_CELEBRATION_AUDIO_SOURCE = 'assets/Audios/Voice over/Mahusay.mp3';
    const STAR_MISSION_KIDS_CHEERING_AUDIO_SOURCE = 'assets/Audios/Sound effects/kids cheering.mp3';
    const STAR_MISSION_CLOCK_TICKING_AUDIO_SOURCE = 'assets/Audios/Sound effects/clock ticking.mp3';
    const STAR_MISSION_TIMES_UP_AUDIO_SOURCE = 'assets/Audios/Sound effects/times up.mp3';
    const STAR_MISSION_LOSE_AUDIO_SOURCE = 'assets/Audios/Sound effects/lose.mp3';
    const STAR_MISSION_PROGRESS_DELAY_MS = 4800;
    const STAR_MISSION_NON_STAR_PENALTY_MS = 1000;
    const DIAMOND_MISSION_AUDIO_SOURCE = 'assets/Audios/Voice over/diamondmission.mp3';
    const DIAMOND_MISSION_READY_AUDIO_SOURCE = 'assets/Audios/Voice over/Handa ka na ba.mp3';
    const DIAMOND_MISSION_REVEAL_AUDIO_SOURCE = 'assets/Audios/Sound effects/diamond.mp3';
    const DIAMOND_MISSION_REVEAL_DURATION_MS = 2600;
    const DIAMOND_MISSION_REVEAL_FADE_MS = 550;
    const DIAMOND_MISSION_CELEBRATION_DELAY_MS = 2900;
    const DIAMOND_MISSION_PROGRESS_DELAY_MS = 5200;
    const STAR_MISSION_TIME_BY_TARGET = {
        5: 20,
        10: 35,
        15: 45,
        20: 60,
    };
    let heartMissionSession = 0;
    let heartMissionTimers = [];
    let heartMissionAudio = null;
    let starMissionSession = 0;
    let starMissionTimers = [];
    let starMissionAudio = null;
    let starMissionWalkerActive = false;
    let starMissionWalkerIdleTimer = null;
    let starMissionWalkerDirection = 1;
    let starMissionWalkerX = 0;
    let starMissionWalkerTargetX = 0;
    let starMissionWalkAudio = null;
    let starMissionFallTimer = null;
    let starMissionCollisionFrame = null;
    const starMissionFallTimeouts = new Set();
    const starMissionActiveShapes = new Set();
    let starMissionSelectedTarget = 5;
    let starMissionCollectedStars = 0;
    let starMissionTimeRemainingMs = 20000;
    let starMissionTimerFrame = null;
    let starMissionTimerLastTick = null;
    let starMissionGameActive = false;
    let starMissionEndSession = 0;
    let starMissionEndTimers = [];
    let starMissionCompletedAudio = null;
    let starMissionCelebrationAudio = null;
    let starMissionKidsCheeringAudio = null;
    let starMissionClockTickingAudio = null;
    let starMissionTimesUpAudio = null;
    let starMissionLoseAudio = null;
    let diamondMissionSession = 0;
    let diamondMissionTimers = [];
    let diamondMissionAudio = null;
    let diamondMissionRevealAudio = null;
    let diamondMissionRevealAudioFrame = null;
    let diamondMissionCompletedAudio = null;
    let diamondMissionCelebrationAudio = null;
    let diamondMissionKidsCheeringAudio = null;
    let diamondMissionBatInterval = null;
    let diamondMissionBatSequence = 0;
    let diamondMissionDecoyIndex = 0;
    let diamondMissionRevealStarted = false;
    let diamondMissionPaused = false;
    const diamondMissionCollectedPieces = new Set();
    let heartShotAnimationFrame = null;
    let heartCurrentTrajectory = null;
    let heartLastAimClientX = null;
    let heartLastAimClientY = null;
    let heartGameColorIndex = 0;
    let heartGameColorProgress = 0;
    let heartGameTimeRemainingMs = HEART_GAME_START_TIME_MS;
    let heartGameClockFrame = null;
    let heartGameLastClockTick = null;
    let heartGameEnded = false;
    let heartGamePaused = false;
    let heartGameAudioSession = 0;
    let heartGameClockTickingAudio = null;
    let heartGameTimesUpAudio = null;
    let heartGameLoseAudio = null;
    let heartFreezeEndsAt = 0;
    let heartFreezePausedRemainingMs = 0;
    let heartFreezeTimer = null;
    let heartFreezeCountdownTimer = null;
    const heartBalloonRespawnTimers = new Map();
    let heartGameDifficultyPhase = 0;
    let heartGameSpeedRate = 0.82;
    let heartCelebrationSession = 0;
    let heartCelebrationTimers = [];
    let heartCelebrationAudio = null;
    let heartCelebrationAudioCache = [];

    shapePreviewPages.forEach((page, pageIndex) => {
        const progress = document.createElement('section');
        progress.className = 'circle-lesson-progress shape-preview-progress';
        progress.setAttribute('aria-label', 'Lesson progress');
        progress.setAttribute('aria-hidden', 'true');

        const board = document.createElement('div');
        board.className = 'circle-lesson-progress-board';

        const boardImage = document.createElement('img');
        boardImage.className = 'circle-lesson-progress-board-image';
        boardImage.src = 'assets/Shape UI/progressboard.webp';
        boardImage.alt = '';

        const svgNamespace = 'http://www.w3.org/2000/svg';
        const titleCurveId = `shapePreviewLessonTitleCurve${pageIndex + 3}`;
        const title = document.createElementNS(svgNamespace, 'svg');
        title.classList.add('circle-lesson-progress-title');
        title.setAttribute('viewBox', '0 0 200 72');
        title.setAttribute('role', 'img');
        title.setAttribute('aria-label', 'Lesson Complete!');

        const titleCurve = document.createElementNS(svgNamespace, 'path');
        titleCurve.id = titleCurveId;
        titleCurve.setAttribute('d', 'M 4 44 Q 100 32 196 44');
        titleCurve.setAttribute('fill', 'none');

        const titleText = document.createElementNS(svgNamespace, 'text');
        titleText.setAttribute('textLength', '184');
        titleText.setAttribute('lengthAdjust', 'spacingAndGlyphs');

        const titleTextPath = document.createElementNS(svgNamespace, 'textPath');
        titleTextPath.setAttribute('href', `#${titleCurveId}`);
        titleTextPath.setAttribute('startOffset', '50%');
        titleTextPath.setAttribute('text-anchor', 'middle');
        titleTextPath.textContent = 'Lesson Complete!';
        titleText.appendChild(titleTextPath);
        title.append(titleCurve, titleText);

        const stars = document.createElement('div');
        stars.className = 'circle-lesson-stars';
        stars.dataset.earnedStars = '1';
        stars.setAttribute('role', 'img');
        stars.setAttribute('aria-label', '1 of 3 stars earned');

        ['lesson-star.svg', 'lesson-star.svg', 'lesson-star.svg'].forEach((source) => {
            const slot = document.createElement('span');
            slot.className = 'circle-lesson-star-slot';
            const star = document.createElement('img');
            star.className = 'circle-lesson-star-real';
            star.src = `assets/Shape UI/${source}`;
            star.alt = '';
            slot.appendChild(star);
            stars.appendChild(slot);
        });

        const message = document.createElement('p');
        message.className = 'circle-lesson-star-message';
        message.textContent = 'Well done!';

        const actions = document.createElement('div');
        actions.className = 'circle-lesson-progress-actions';

        const replayButton = document.createElement('button');
        replayButton.className = 'circle-lesson-progress-button';
        replayButton.type = 'button';
        replayButton.setAttribute('data-shape-preview-replay', '');
        replayButton.setAttribute('aria-label', 'Replay shape lesson');
        const replayImage = document.createElement('img');
        replayImage.src = 'assets/Buttons/replay.webp';
        replayImage.alt = '';
        replayButton.appendChild(replayImage);

        const nextButton = document.createElement('button');
        nextButton.className = 'circle-lesson-progress-button';
        nextButton.type = 'button';
        nextButton.setAttribute('data-shape-preview-next', '');
        nextButton.setAttribute('aria-label', 'Continue to Shape Island');
        const nextImage = document.createElement('img');
        nextImage.src = 'assets/Buttons/next.webp';
        nextImage.alt = '';
        nextButton.appendChild(nextImage);

        actions.append(replayButton, nextButton);
        board.append(boardImage, title, stars, message, actions);
        progress.appendChild(board);
        page.insertBefore(progress, page.querySelector('.game-return-btn'));
        shapePreviewProgressByPage.set(page, progress);
    });
    const circleIllustrationPage = document.getElementById('learnscape-circle-illustration-page');
    const circleIllustrationVideo = circleIllustrationPage?.querySelector('.circle-illustration-video') || null;
    const circleTvLessonImage = circleIllustrationPage?.querySelector('.circle-tv-lesson-image') || null;
    const circleTvMascot = circleIllustrationPage?.querySelector('.circle-tv-mascot') || null;
    const circleTvQuestionPanel = circleIllustrationPage?.querySelector('.circle-tv-question-panel') || null;
    const circleIllustrationPlayButton = circleIllustrationPage?.querySelector('.circle-illustration-play-button') || null;
    const circleIllustrationSkipButton = circleIllustrationPage?.querySelector('.circle-illustration-skip-button') || null;
    const circleIllustrationProgress = circleIllustrationPage?.querySelector('.circle-lesson-progress') || null;
    const circleIllustrationReplayButton = circleIllustrationPage?.querySelector('[data-circle-lesson-replay]') || null;
    const circleIllustrationReplayImage = circleIllustrationReplayButton?.querySelector('img') || null;
    const circleIllustrationNextButton = circleIllustrationPage?.querySelector('[data-circle-lesson-next]') || null;
    const circleIllustrationStars = circleIllustrationPage?.querySelector('.circle-lesson-stars') || null;
    const circleIllustrationStarMessage = circleIllustrationPage?.querySelector('.circle-lesson-star-message') || null;
    const circleMissionGuide = circleIllustrationPage?.querySelector('.circle-mission-guide') || null;
    const circleMissionGuideBubble = circleMissionGuide?.querySelector('.circle-mission-guide-bubble') || null;
    const circleMissionGuideText = circleMissionGuide?.querySelector('.circle-mission-guide-text') || null;
    const circleMissionStartButton = circleMissionGuide?.querySelector('.circle-mission-start-button') || null;
    const circleIllustrationScene = circleIllustrationPage?.querySelector('.circle-illustration-scene') || null;
    const circleHuntUi = circleIllustrationPage?.querySelector('.circle-hunt-ui') || null;
    const circleHuntCount = circleHuntUi?.querySelector('.circle-hunt-count') || null;
    const circleHuntTime = circleHuntUi?.querySelector('.circle-hunt-time') || null;
    const circleHuntFeedback = circleHuntUi?.querySelector('.circle-hunt-feedback') || null;
    const circleHuntOverlay = circleHuntUi?.querySelector('.circle-hunt-overlay') || null;
    const circleHuntStartButton = circleHuntUi?.querySelector('.circle-hunt-start-button') || null;
    const circleHuntPlayAgainButton = circleHuntUi?.querySelector('.circle-hunt-play-again-button') || null;
    const circleHuntCountdown = circleHuntUi?.querySelector('.circle-hunt-countdown') || null;
    const circleHuntCelebration = circleHuntUi?.querySelector('.circle-hunt-celebration') || null;
    const circleHuntConfetti = circleHuntCelebration?.querySelector('.circle-hunt-confetti') || null;
    const circleHuntTargets = Array.from(circleIllustrationPage?.querySelectorAll('[data-circle-hunt-target]') || []);
    const circleSortBoard = circleIllustrationPage?.querySelector('.circle-lesson-activity-board') || null;
    const circleSortBin = circleSortBoard?.querySelector('.circle-sort-bin') || null;
    const circleSortBinCount = circleSortBin?.querySelector('.circle-sort-bin-count') || null;
    const circleSortFeedback = circleSortBoard?.querySelector('.circle-sort-feedback') || null;
    const circleSortObjects = Array.from(circleSortBoard?.querySelectorAll('.circle-sort-object') || []);
    const circleSortTargetCount = circleSortObjects.filter((object) => object.hasAttribute('data-circle-object')).length;
    const shapeCircleCharacter3 = shapeCirclePage?.querySelector('.shape-area-character-ch3') || null;
    const shapeCircleCharacter4 = shapeCirclePage?.querySelector('.shape-area-character-ch4') || null;
    const shapeCircleCharacter5 = shapeCirclePage?.querySelector('.shape-area-character-ch5') || null;
    const shapeCircleSpeakerCharacters = [shapeCircleCharacter3, shapeCircleCharacter4, shapeCircleCharacter5];
    const shapeCircleBubbleCh3 = shapeCirclePage?.querySelector('.shape-area-speech-bubble-ch3') || null;
    const shapeCircleBubbleCh3Text = shapeCircleBubbleCh3?.querySelector('.shape-area-speech-bubble-text') || null;
    const shapeCircleBubbleCh3Dots = shapeCircleBubbleCh3 ? document.createElement('span') : null;
    if (shapeCircleBubbleCh3Text) shapeCircleBubbleCh3Text.classList.add('shape-intro-bubble-text');
    if (shapeCircleBubbleCh3Dots && shapeCircleBubbleCh3) {
        shapeCircleBubbleCh3Dots.className = 'shape-intro-message-dots';
        shapeCircleBubbleCh3Dots.setAttribute('aria-hidden', 'true');
        shapeCircleBubbleCh3Dots.innerHTML = '<i>.</i><i>.</i><i>.</i>';
        shapeCircleBubbleCh3Text?.after(shapeCircleBubbleCh3Dots);
    }
    const shapeCircleBubbleCh3SkipButton = shapeCircleBubbleCh3?.querySelector('.shape-area-speech-bubble-skip') || null;
    const shapeSquareBgImage = shapeSquarePage?.querySelector('.shape-area-bg') || null;
    const shapeSquareCharacter3 = shapeSquarePage?.querySelector('.shape-area-square-character-ch3') || null;
    const shapeSquareCharacter9 = shapeSquarePage?.querySelector('.shape-area-square-character-ch9') || null;
    const shapeSquareCharacter4 = shapeSquarePage?.querySelector('.shape-area-square-character-next') || null;
    const shapeSquareCharacter5 = shapeSquarePage?.querySelector('.shape-area-square-character-ch5') || null;
    const shapeSquareBubble = shapeSquarePage?.querySelector('.shape-area-square-speech-bubble') || null;
    const shapeSquareBubbleText = shapeSquareBubble?.querySelector('span') || null;
    const shapeSquareBubbleDots = shapeSquareBubble ? document.createElement('span') : null;
    if (shapeSquareBubbleText) shapeSquareBubbleText.classList.add('shape-intro-bubble-text');
    if (shapeSquareBubbleDots && shapeSquareBubble) {
        shapeSquareBubbleDots.className = 'shape-intro-message-dots';
        shapeSquareBubbleDots.setAttribute('aria-hidden', 'true');
        shapeSquareBubbleDots.innerHTML = '<i>.</i><i>.</i><i>.</i>';
        shapeSquareBubble.appendChild(shapeSquareBubbleDots);
    }
    const shapeSquareStartButton = shapeSquarePage?.querySelector('.shape-area-square-start-button') || null;
    const shapeSquareBackButton = shapeSquarePage?.querySelector('.game-return-btn') || null;
    const shapeSquareVideoStage = shapeSquarePage?.querySelector('.square-illustration-video-stage') || null;
    const shapeSquareVideo = shapeSquarePage?.querySelector('.square-illustration-video') || null;
    const squareTvLessonImage = shapeSquarePage?.querySelector('.square-tv-lesson-image') || null;
    const squareTvMascot = shapeSquarePage?.querySelector('.square-tv-mascot') || null;
    const squareTvQuestionPanel = shapeSquarePage?.querySelector('.square-tv-question-panel') || null;
    const shapeSquarePlayButton = shapeSquarePage?.querySelector('.square-illustration-play-button') || null;
    const shapeSquareSkipButton = shapeSquarePage?.querySelector('.square-illustration-skip-button') || null;
    const shapeSquareProgress = shapeSquarePage?.querySelector('.square-lesson-progress') || null;
    const shapeSquareReplayButton = shapeSquarePage?.querySelector('[data-square-lesson-replay]') || null;
    const shapeSquareReplayButtonImage = shapeSquareReplayButton?.querySelector('img') || null;
    const shapeSquareNextButton = shapeSquarePage?.querySelector('[data-square-lesson-next]') || null;
    const shapeSquareNextButtonImage = shapeSquareNextButton?.querySelector('img') || null;
    const shapeSquareStars = shapeSquarePage?.querySelector('.square-lesson-stars') || null;
    const shapeSquareStarMessage = shapeSquarePage?.querySelector('.square-lesson-star-message') || null;
    const shapeSquareMissionGuide = shapeSquarePage?.querySelector('.square-mission-guide') || null;
    const shapeSquareMissionCharacter10 = shapeSquarePage?.querySelector('.square-mission-character-ch10') || null;
    const shapeSquareMissionCharacter11 = shapeSquarePage?.querySelector('.square-mission-character-ch11') || null;
    const shapeSquareCharacter12 = shapeSquarePage?.querySelector('.square-mission-character-ch12') || null;
    const shapeSquareCharacter13 = shapeSquarePage?.querySelector('.square-mission-character-ch13') || null;
    const shapeSquareChocolateQuestionBubble = shapeSquarePage?.querySelector('.square-chocolate-question-bubble') || null;
    const shapeSquareKidsCheerCharacters = Array.from(shapeSquarePage?.querySelectorAll('.square-kids-cheer-character') || []);
    const shapeSquareCelebrationText = shapeSquarePage?.querySelector('.square-puzzle-celebration-text') || null;
    const shapeSquareConfetti = shapeSquarePage?.querySelector('.square-puzzle-confetti') || null;
    const shapeSquarePuzzleNextButton = shapeSquarePage?.querySelector('.square-puzzle-next-button') || null;
    const shapeSquarePuzzleRetryButton = shapeSquarePage?.querySelector('.square-puzzle-retry-button') || null;
    const shapeSquareMissionBubble = shapeSquarePage?.querySelector('.square-mission-bubble') || null;
    const shapeSquareMissionBubbleText = shapeSquarePage?.querySelector('.square-mission-bubble-text') || null;
    const shapeSquareMissionStartButton = shapeSquarePage?.querySelector('.square-mission-start-button') || null;
    const squareObjectPanel = shapeSquarePage?.querySelector('.square-object-panel') || null;
    const squarePlacementTitle = shapeSquarePage?.querySelector('.square-placement-title') || null;
    const squarePlacementHint = shapeSquarePage?.querySelector('.square-placement-hint') || null;
    const squarePlacementHintObject = shapeSquarePage?.querySelector('.square-placement-hint-object') || null;
    const shapeSquareCookieSquare = shapeSquarePage?.querySelector('.square-cookie-square') || null;
    const shapeSquareAnswerTiles = shapeSquarePage?.querySelector('.square-answer-tiles') || null;
    const shapeSquareAnswerTileButtons = Array.from(shapeSquarePage?.querySelectorAll('.square-answer-tile') || []);
    const squareObjectPieces = Array.from(shapeSquarePage?.querySelectorAll('[data-square-piece]') || []);
    const squareObjectTargets = Array.from(shapeSquarePage?.querySelectorAll('[data-square-target]') || []);
    let shapeCircleBubbleCh3Messages = [];
    try {
        shapeCircleBubbleCh3Messages = JSON.parse(shapeCircleBubbleCh3?.dataset.messages || '[]');
    } catch (error) {
        shapeCircleBubbleCh3Messages = [];
    }
    if (!Array.isArray(shapeCircleBubbleCh3Messages) || !shapeCircleBubbleCh3Messages.length) {
        shapeCircleBubbleCh3Messages = [
            'MABUHAY!! Ako nga pala si Bibi',
            'Ikinagagalak kitang makilala',
            'Maligayang pagdating sa aking munting paraiso',
            "Kung saan pag-aaralan natin ang iba't-ibang hugis",
            'Simulan natin sa Circle o Bilog!',
            'Handa ka na ba?',
        ];
    }
    const shapeCircleGreetingAudioSource = 'assets/Audios/Voice over/Mabuhay.mp3';
    const shapeCircleIntroAudioSource = 'assets/Audios/Voice over/introcircle.mp3';
    const shapeCircleFinalAudioSource = 'assets/Audios/Voice over/Handa ka na ba.mp3';
    const shapeCircleIntroSegments = [
        { start: 0, end: 2.3 },
        { start: 2.3, end: 5.6 },
        { start: 5.6, end: 9.0 },
        { start: 9.0, end: 11.4 },
    ];
    let shapeCircleTimers = [];
    let shapeCircleSession = 0;
    let shapeCircleIntroAudio = null;
    let shapeCircleAudioFrame = null;
    const shapeSquareWelcomeMessage = 'Maligayang pagbabalik!';
    const shapeSquareCelebrationMessages = [
        'Matagumpay mong natapos ang Circle Mission!',
        'Binabati kita sa iyong tagumpay!',
    ];
    const shapeSquareNextShapeMessage = 'Ngayon, panibagong hugis ang ating aalamin!';
    const shapeSquareReadyMessage = 'Handa ka na ba?';
    const shapeSquareMissionStages = [
        {
            character: 'ch10',
            message: 'Para sa ating Square Mission!',
            start: 0,
            end: 1.9,
        },
        {
            character: 'ch10',
            message: 'Kailangan nating hanapin ang mga nawawalang bagay sa Square town at ibalik ito sa tamang ayos',
            start: 2.0,
            end: 8.5,
        },
        {
            character: 'ch11',
            message: 'Handa ka na ba?',
            start: 8.8,
        },
    ];
    const shapeSquareGreetingAudioSource = 'assets/Audios/Voice over/Maligayang.mp3';
    const shapeSquareAreaIntroAudioSource = 'assets/Audios/Voice over/Area intro.mp3';
    const shapeMissionCompletedAudioSource = 'assets/Audios/Voice over/Matagumpay na natapos.mp3';
    const shapeMissionNameAudioSource = 'assets/Audios/Voice over/Missions.mp3';
    const shapeSquareMissionAudioSource = 'assets/Audios/Voice over/squaremission.mp3';
    const shapeSquareReadyAudioSource = 'assets/Audios/Voice over/Handa ka na ba.mp3';
    const shapeSquareCompletedAudioSource = 'assets/Audios/Sound effects/completed.mp3';
    const shapeSquareCelebrationAudioSource = 'assets/Audios/Voice over/Mahusay.mp3';
    const shapeSquareKidsCheeringAudioSource = 'assets/Audios/Sound effects/kids cheering.mp3';
    const shapeSquareChocolateQuestionAudioSource = 'assets/Audios/Voice over/Tukuyin kung ilang square.mp3';
    const shapeQuestionAudioSource = 'assets/Audios/Voice over/anong hugis ito.mp3';
    const shapeChoiceAudioSource = 'assets/Audios/Voice over/shape choices.mp3';
    const shapeChoiceAudioSegments = {
        circle: { start: 0, end: 0.7 },
        square: { start: 0.7, end: 1.5 },
        triangle: { start: 1.5, end: 2.3 },
        rectangle: { start: 2.3, end: 3.2 },
        oval: { start: 3.2, end: 3.9 },
        heart: { start: 3.9, end: 4.5 },
        star: { start: 4.7, end: 5.5 },
        diamond: { start: 5.7, end: 6.6 },
    };
    const shapeMissionNameAudioSegments = {
        circle: { start: 0, end: 1.0 },
        square: { start: 1.4, end: 2.5 },
        triangle: { start: 3.1, end: 4.2 },
        rectangle: { start: 4.7, end: 5.9 },
        oval: { start: 6.5, end: 7.3 },
        heart: { start: 7.8, end: 8.8 },
        star: { start: 9.3, end: 10.3 },
        diamond: { start: 10.9, end: 12.0 },
    };
    let shapeChoiceAudio = null;
    let shapeWrongAnswerAudio = null;
    let shapeChoiceAudioFrame = null;
    let shapeChoiceAudioSession = 0;
    let shapeQuestionAudio = null;
    let shapeQuestionAudioTimer = null;
    let pendingShapeChoice = null;
    let pendingShapeChoiceAction = null;
    let activeShapeChoice = null;
    let shapeMissionCompletionAudio = null;
    let shapeMissionCompletionFrame = null;
    let shapeMissionCompletionSession = 0;
    if (window.Audio) {
        shapeChoiceAudio = new window.Audio(shapeChoiceAudioSource);
        shapeChoiceAudio.preload = 'auto';
        shapeChoiceAudio.playsInline = true;
        shapeChoiceAudio.load();
        shapeWrongAnswerAudio = new window.Audio('assets/Audios/Sound effects/buzzer.mp3');
        shapeWrongAnswerAudio.preload = 'auto';
        shapeWrongAnswerAudio.playsInline = true;
        shapeWrongAnswerAudio.load();
    }
    const shapeSquareAreaBackgroundSource = 'assets/Backgrounds/Area2.webp';
    const shapeSquareIllustrationBackgroundSource = 'assets/Backgrounds/squaregame.webp';
    const shapeSquareIntroStages = [
        { character: shapeSquareCharacter3, bubbleClass: null, message: shapeSquareWelcomeMessage },
        { character: shapeSquareCharacter9, bubbleClass: 'is-ch9', message: shapeSquareCelebrationMessages[0] },
        { character: shapeSquareCharacter9, bubbleClass: 'is-ch9', message: shapeSquareCelebrationMessages[1] },
        { character: shapeSquareCharacter4, bubbleClass: 'is-ch4', message: shapeSquareNextShapeMessage },
        { character: shapeSquareCharacter5, bubbleClass: 'is-ch5', message: shapeSquareReadyMessage },
    ];
    let shapeSquareTimers = [];
    let shapeSquareSession = 0;
    let shapeSquareIntroAudio = null;
    let shapeSquareMissionAudio = null;
    let shapeSquareReadyAudio = null;
    let shapeSquareCelebrationAudio = null;
    let shapeSquareChocolateQuestionAudio = null;
    let shapeSquareAreaIntroFrame = null;
    let shapeSquareStartPressTimer = null;
    let shapeSquareCelebrationTimers = [];
    const squareObjectSnapTimers = new Map();
    let squareObjectPanelExitTimer = null;
    let squareObjectGuidedTargetNumber = null;
    const squareObjectTargetSpecs = {
        1: { x: 793, y: 198, width: 138, height: 137 },
        2: { x: 230, y: 363, width: 126, height: 125 },
        3: { x: 1524, y: 444, width: 98, height: 99 },
        4: { x: 1285, y: 576, width: 129, height: 127 },
        5: { x: 770, y: 639, width: 154, height: 152 },
    };
    const squareObjectScatterSpecs = {
        1: { x: 360, y: 735, width: 88, height: 88 },
        2: { x: 520, y: 610, width: 84, height: 84 },
        3: { x: 1060, y: 650, width: 76, height: 76 },
        4: { x: 1450, y: 730, width: 88, height: 88 },
        5: { x: 1180, y: 560, width: 94, height: 94 },
    };
    let squareObjectCurrentScatterSpecs = { ...squareObjectScatterSpecs };
    let circleIllustrationCelebrationTimers = [];
    const circleMissionGuideMessages = [
        'Para sa ating Circle Mission',
        'Kailangan natin hanapin at kolektahin ang mga **bagay na bilog** na nakatago sa paligid!',
        'Hanapin ang mga ito bago maubos ang oras!',
        'Handa ka na ba?',
    ];
    const circleMissionGuideAudioSource = 'assets/Audios/Voice over/circlemission.mp3';
    const circleMissionGuideReadyAudioSource = 'assets/Audios/Voice over/Handa ka na ba.mp3';
    const circleMissionGuideSegments = [
        { start: 0, end: 1.9, messageIndex: 0 },
        { start: 2.0, end: 7.6, messageIndex: 1 },
        { start: 7.7, end: 10.8, messageIndex: 2 },
    ];
    const circleMissionGuideTypingDelay = 42;
    const circleMissionGuideMessagePause = 280;
    const circleMissionGuideFinalPause = 900;
    const circleHuntCompletedAudioSource = 'assets/Audios/Sound effects/completed.mp3';
    const circleHuntCelebrationAudioSource = 'assets/Audios/Voice over/Mahusay.mp3';
    const circleHuntKidsCheeringAudioSource = 'assets/Audios/Sound effects/kids cheering.mp3';
    const circleHuntClockTickingAudioSource = 'assets/Audios/Sound effects/clock ticking.mp3';
    const circleHuntSecondAudioSource = 'assets/Audios/Sound effects/sec.mp3';
    const circleHuntCountdownAudioSource = 'assets/Audios/Sound effects/3-2-1-countdown.mp3';
    const circleHuntTimesUpAudioSource = 'assets/Audios/Sound effects/times up.mp3';
    const circleHuntLoseAudioSource = 'assets/Audios/Sound effects/lose.mp3';
    let circleMissionGuideTimers = [];
    let circleMissionGuideSession = 0;
    let circleMissionGuideAudio = null;
    let circleMissionGuideAudioFrame = null;
    let circleHuntState = 'idle';
    const circleHuntStartingSeconds = 60;
    const circleHuntCorrectTimeBonus = 1;
    let circleHuntSeconds = circleHuntStartingSeconds;
    let circleHuntCollected = 0;
    let circleHuntIncorrectAttempts = 0;
    let circleHuntInterval = null;
    let circleHuntTimers = [];
    let circleHuntCompletedAudio = null;
    let circleHuntCompletedFadeFrame = null;
    let circleHuntCelebrationAudio = null;
    let circleHuntKidsCheeringAudio = null;
    let circleHuntClockTickingAudio = null;
    let circleHuntSecondAudio = null;
    let circleHuntCountdownAudio = null;
    let circleHuntTimesUpAudio = null;
    let circleHuntLoseAudio = null;
    let circleSortCollectedCount = 0;
    let circleSortActiveDrag = null;
    let circleSortResetTimers = [];
    let circleSortIgnoreClickUntil = 0;

    const getShapeCircleCh3ActiveCharacterIndex = (messageIndex) => (
        messageIndex >= 5 ? 2 : messageIndex >= 4 ? 1 : 0
    );

    const syncShapeCircleCh3SpeakerCharacters = (messageIndex) => {
        if (!shapeCircleBubbleCh3) return;

        const activeCharacterIndex = getShapeCircleCh3ActiveCharacterIndex(messageIndex);
        shapeCircleBubbleCh3.dataset.activeCharacter = `ch${activeCharacterIndex + 3}`;

        shapeCircleSpeakerCharacters.forEach((character, characterIndex) => {
            if (!character) return;

            const isActiveCharacter = characterIndex === activeCharacterIndex;
            const isNewCharacter = isActiveCharacter && character.hidden;
            character.hidden = !isActiveCharacter;

            if (isNewCharacter) {
                character.classList.remove('is-popping');
                character.getBoundingClientRect();
                character.classList.add('is-popping');
            }
        });
    };

    const showShapeCircleCh3FinalMessage = (shouldPlayAudio = true) => {
        if (!shapeCircleBubbleCh3 || !shapeCircleBubbleCh3Text || !shapeCircleBubbleCh3Messages.length) return;
        if (!isPageVisible(shapeCirclePage)) return;

        clearShapeCircleTimers();
        stopShapeCircleIntroAudio();
        shapeCirclePage?.classList.remove('is-intro-click-ready');

        const lastMessageIndex = shapeCircleBubbleCh3Messages.length - 1;
        const lastMessage = String(shapeCircleBubbleCh3Messages[lastMessageIndex] || '');

        shapeCircleBubbleCh3.hidden = false;
        shapeCircleBubbleCh3.classList.add('is-visible', 'is-triggering');
        shapeCircleBubbleCh3.classList.remove('is-fading');
        shapeCircleBubbleCh3Text.classList.remove('is-fading');
        shapeCircleBubbleCh3Text.textContent = lastMessage;
        syncShapeCircleCh3SpeakerCharacters(lastMessageIndex);

        if (shapeCircleBubbleCh3SkipButton) {
            shapeCircleBubbleCh3SkipButton.hidden = true;
            shapeCircleBubbleCh3SkipButton.style.display = 'none';
        }

        if (shouldPlayAudio !== false) {
            playShapeCircleAudio(shapeCircleFinalAudioSource);
        }
    };

    const clearShapeCircleTimers = () => {
        shapeCircleTimers.forEach((timerId) => window.clearTimeout(timerId));
        shapeCircleTimers = [];
        shapeCirclePage?.classList.remove('is-intro-click-ready');
    };

    const stopShapeCircleIntroAudio = () => {
        if (shapeCircleAudioFrame !== null) {
            window.cancelAnimationFrame(shapeCircleAudioFrame);
            shapeCircleAudioFrame = null;
        }

        if (!shapeCircleIntroAudio) return;

        shapeCircleIntroAudio.onended = null;
        shapeCircleIntroAudio.pause();
        try {
            shapeCircleIntroAudio.currentTime = 0;
        } catch (error) {
            // The clip may still be loading; pausing is enough if rewinding is unavailable.
        }
        shapeCircleIntroAudio = null;
    };

    const playShapeCircleAudio = (source, onEnded = null, onPlaybackFailed = null, options = {}) => {
        stopShapeCircleIntroAudio();

        const AudioCtor = window.Audio;
        if (!AudioCtor) return null;

        const startDelay = Number(options.startDelay) || 0;
        const onStarted = typeof options.onStarted === 'function' ? options.onStarted : null;
        const audio = new AudioCtor(source);
        audio.preload = 'auto';
        audio.playsInline = true;
        audio.volume = 1;
        shapeCircleIntroAudio = audio;
        audio.load?.();
        audio.onended = () => {
            if (shapeCircleIntroAudio !== audio) return;
            shapeCircleIntroAudio = null;
            onEnded?.();
        };
        const startPlayback = () => {
            if (shapeCircleIntroAudio !== audio) return;

            audio.play()
                .then(() => {
                    if (shapeCircleIntroAudio === audio) onStarted?.();
                })
                .catch(() => {
                    if (shapeCircleIntroAudio !== audio) return;
                    shapeCircleIntroAudio = null;
                    onPlaybackFailed?.();
                });
        };

        if (startDelay > 0) {
            shapeCircleTimers.push(window.setTimeout(startPlayback, startDelay));
        } else {
            startPlayback();
        }

        return audio;
    };

    const resetShapeCircleScene = () => {
        clearShapeCircleTimers();
        stopShapeCircleIntroAudio();
        shapeCircleSession += 1;

        if (shapeCircleBubbleCh3Text) {
            shapeCircleBubbleCh3Text.textContent = '';
            shapeCircleBubbleCh3Text.classList.remove('is-fading');
        }

        if (shapeCircleBubbleCh3) {
            shapeCircleBubbleCh3.hidden = true;
            shapeCircleBubbleCh3.classList.remove('is-visible', 'is-fading', 'is-triggering', 'is-message-complete');
        }

        if (shapeCircleBubbleCh3SkipButton) {
            shapeCircleBubbleCh3SkipButton.hidden = true;
            shapeCircleBubbleCh3SkipButton.style.display = 'none';
            shapeCircleBubbleCh3SkipButton.onclick = null;
        }

        shapeCircleSpeakerCharacters.forEach((character) => {
            if (!character) return;
            character.hidden = true;
            character.classList.remove('is-popping');
        });
    };

    const startShapeCircleScene = () => {
        if (!shapeCirclePage) return;
        if (!isPageVisible(shapeCirclePage)) return;

        resetShapeCircleScene();

        const session = shapeCircleSession;
        if (!shapeCircleBubbleCh3 || !shapeCircleBubbleCh3Text) return;

        let activeStageIndex = -1;
        const introStages = shapeCircleBubbleCh3Messages.map((message, index) => ({
            message: String(message || ''),
            audio: index === 0
                ? { type: 'clip', source: shapeCircleGreetingAudioSource }
                : index >= 1 && index <= shapeCircleIntroSegments.length
                    ? { type: 'segment', ...shapeCircleIntroSegments[index - 1] }
                    : { type: 'clip', source: shapeCircleFinalAudioSource },
        }));

        const showStage = (stageIndex) => {
            if (session !== shapeCircleSession || !isPageVisible(shapeCirclePage) || !introStages[stageIndex]) return;
            activeStageIndex = stageIndex;

            shapeCircleBubbleCh3.classList.remove('is-triggering', 'is-message-complete', 'is-final-message');
            shapeCircleBubbleCh3.classList.toggle('is-final-message', stageIndex >= introStages.length - 1);
            syncShapeCircleCh3SpeakerCharacters(stageIndex);
            if (shapeCircleBubbleCh3SkipButton) {
                shapeCircleBubbleCh3SkipButton.onclick = showShapeCircleCh3FinalMessage;
                shapeCircleBubbleCh3SkipButton.hidden = false;
                shapeCircleBubbleCh3SkipButton.style.display = '';
            }

            shapeCircleBubbleCh3.hidden = false;
            shapeCircleBubbleCh3.classList.add('is-visible');
            shapeCircleBubbleCh3.classList.remove('is-fading');
            shapeCircleBubbleCh3Text.classList.remove('is-fading');
            shapeCircleBubbleCh3Text.textContent = '';
        };

        const typeMessage = (message, onComplete) => {
            let characterIndex = 0;
            shapeCircleBubbleCh3Text.textContent = '';
            const typeNextCharacter = () => {
                if (session !== shapeCircleSession) return;
                characterIndex += 1;
                shapeCircleBubbleCh3Text.textContent = message.slice(0, characterIndex);
                if (characterIndex < message.length) {
                    shapeCircleTimers.push(window.setTimeout(typeNextCharacter, 28));
                    return;
                }
                onComplete();
            };
            typeNextCharacter();
        };

        const playIntroClip = (source, onEnded) => {
            playShapeCircleAudio(source, onEnded, onEnded);
        };

        const playIntroSegment = (start, end, onEnded) => {
            const AudioCtor = window.Audio;
            if (!AudioCtor) {
                onEnded();
                return;
            }
            stopShapeCircleIntroAudio();
            const audio = new AudioCtor(shapeCircleIntroAudioSource);
            shapeCircleIntroAudio = audio;
            audio.preload = 'auto';
            audio.playsInline = true;
            try {
                audio.currentTime = start;
            } catch (error) {
                // The start point is applied once the segment begins loading.
            }
            audio.play().then(() => {
                const stopAtEnd = () => {
                    if (session !== shapeCircleSession || shapeCircleIntroAudio !== audio) return;
                    if (audio.currentTime >= end || audio.ended) {
                        audio.pause();
                        shapeCircleIntroAudio = null;
                        shapeCircleAudioFrame = null;
                        onEnded();
                        return;
                    }
                    shapeCircleAudioFrame = window.requestAnimationFrame(stopAtEnd);
                };
                shapeCircleAudioFrame = window.requestAnimationFrame(stopAtEnd);
            }).catch(() => {
                if (session !== shapeCircleSession || shapeCircleIntroAudio !== audio) return;
                shapeCircleIntroAudio = null;
                onEnded();
            });
        };

        const playStage = (stageIndex) => {
            if (session !== shapeCircleSession || !introStages[stageIndex]) return;
            showStage(stageIndex);
            shapeCirclePage.classList.remove('is-intro-click-ready');
            let textFinished = false;
            let audioFinished = false;
            let stageComplete = false;
            let audioCompletionScheduled = false;
            const stageStartedAt = performance.now();
            const minimumAudioMs = introStages[stageIndex].audio?.type === 'segment'
                ? (introStages[stageIndex].audio.end - introStages[stageIndex].audio.start) * 1000
                : 1200;
            const unlockMessage = () => {
                if (!textFinished || !audioFinished || stageComplete || session !== shapeCircleSession) return;
                stageComplete = true;
                shapeCircleBubbleCh3.classList.add('is-message-complete');
                if (stageIndex >= introStages.length - 1) {
                    if (shapeCircleBubbleCh3SkipButton) {
                        shapeCircleBubbleCh3SkipButton.hidden = true;
                        shapeCircleBubbleCh3SkipButton.style.display = 'none';
                    }
                    return;
                }
                playStage(stageIndex + 1);
            };
            typeMessage(introStages[stageIndex].message, () => {
                textFinished = true;
                shapeCircleBubbleCh3.classList.add('is-message-complete');
                unlockMessage();
            });
            const finishAudio = () => {
                if (audioCompletionScheduled) return;
                audioCompletionScheduled = true;
                const remainingMs = Math.max(0, minimumAudioMs - (performance.now() - stageStartedAt));
                shapeCircleTimers.push(window.setTimeout(() => {
                    audioFinished = true;
                    unlockMessage();
                }, remainingMs));
            };

            const audio = introStages[stageIndex].audio;
            if (audio?.type === 'segment') {
                playIntroSegment(audio.start, audio.end, finishAudio);
            } else {
                playIntroClip(audio?.source || shapeCircleFinalAudioSource, finishAudio);
            }
        };

        playStage(0);
    };

    const clearShapeSquareTimers = () => {
        shapeSquareTimers.forEach((timerId) => window.clearTimeout(timerId));
        shapeSquareTimers = [];
        shapeSquarePage?.classList.remove('is-intro-click-ready');
        shapeSquareBubble?.classList.remove('is-message-complete');
    };

    const stopShapeMissionCompletionAudio = () => {
        shapeMissionCompletionSession += 1;
        if (shapeMissionCompletionFrame !== null) {
            window.cancelAnimationFrame(shapeMissionCompletionFrame);
            shapeMissionCompletionFrame = null;
        }
        if (!shapeMissionCompletionAudio) return;

        shapeMissionCompletionAudio.onended = null;
        shapeMissionCompletionAudio.pause();
        shapeMissionCompletionAudio = null;
    };

    const playShapeMissionCompletionAudio = (shapeName, onComplete = null) => {
        const segment = shapeMissionNameAudioSegments[String(shapeName || '').trim().toLowerCase()];
        const AudioCtor = window.Audio;
        if (!segment || !AudioCtor) {
            onComplete?.();
            return;
        }

        stopShapeMissionCompletionAudio();
        const session = shapeMissionCompletionSession;
        let didComplete = false;
        let didStartMissionName = false;
        const finish = () => {
            if (didComplete || session !== shapeMissionCompletionSession) return;
            didComplete = true;
            onComplete?.();
        };
        const shapeAudio = new AudioCtor(shapeMissionNameAudioSource);
        shapeAudio.preload = 'auto';
        shapeAudio.playsInline = true;
        const prepareMissionSegment = () => {
            try {
                shapeAudio.currentTime = segment.start;
            } catch (error) {
                // Playback will apply the segment start once metadata is ready.
            }
        };
        shapeAudio.addEventListener('loadedmetadata', prepareMissionSegment, { once: true });
        shapeAudio.load?.();
        prepareMissionSegment();

        const playMissionName = () => {
            if (didStartMissionName || session !== shapeMissionCompletionSession) return;
            didStartMissionName = true;
            if (shapeMissionCompletionFrame !== null) {
                window.cancelAnimationFrame(shapeMissionCompletionFrame);
                shapeMissionCompletionFrame = null;
            }

            shapeMissionCompletionAudio = shapeAudio;
            prepareMissionSegment();
            shapeAudio.play().then(() => {
                const stopAtSegmentEnd = () => {
                    if (session !== shapeMissionCompletionSession || shapeMissionCompletionAudio !== shapeAudio) return;
                    if (shapeAudio.currentTime >= segment.end || shapeAudio.ended) {
                        shapeAudio.pause();
                        shapeMissionCompletionAudio = null;
                        shapeMissionCompletionFrame = null;
                        finish();
                        return;
                    }
                    shapeMissionCompletionFrame = window.requestAnimationFrame(stopAtSegmentEnd);
                };
                shapeMissionCompletionFrame = window.requestAnimationFrame(stopAtSegmentEnd);
            }).catch(() => {
                if (shapeMissionCompletionAudio === shapeAudio) shapeMissionCompletionAudio = null;
                finish();
            });
        };
        const completionAudio = new AudioCtor(shapeMissionCompletedAudioSource);
        shapeMissionCompletionAudio = completionAudio;
        completionAudio.preload = 'auto';
        completionAudio.playsInline = true;
        completionAudio.onended = () => {
            if (session !== shapeMissionCompletionSession || shapeMissionCompletionAudio !== completionAudio) return;
            playMissionName();
        };
        completionAudio.play().then(() => {
            const transitionWithoutGap = () => {
                if (session !== shapeMissionCompletionSession || shapeMissionCompletionAudio !== completionAudio) return;
                const remainingTime = completionAudio.duration - completionAudio.currentTime;
                if (Number.isFinite(remainingTime) && remainingTime <= 0.08) {
                    playMissionName();
                    return;
                }
                shapeMissionCompletionFrame = window.requestAnimationFrame(transitionWithoutGap);
            };
            shapeMissionCompletionFrame = window.requestAnimationFrame(transitionWithoutGap);
        }).catch(() => {
            if (shapeMissionCompletionAudio !== completionAudio) return;
            shapeMissionCompletionAudio = null;
            playMissionName();
        });
    };

    const stopShapeSquareIntroAudio = () => {
        stopShapeMissionCompletionAudio();
        if (shapeSquareAreaIntroFrame !== null) {
            window.cancelAnimationFrame(shapeSquareAreaIntroFrame);
            shapeSquareAreaIntroFrame = null;
        }
        if (!shapeSquareIntroAudio) return;

        shapeSquareIntroAudio.onended = null;
        shapeSquareIntroAudio.pause();
        try {
            shapeSquareIntroAudio.currentTime = 0;
        } catch (error) {
            // Pausing is enough while the audio metadata is still loading.
        }
        shapeSquareIntroAudio = null;
    };

    const stopShapeSquareMissionAudio = () => {
        if (!shapeSquareMissionAudio) return;

        shapeSquareMissionAudio.onended = null;
        shapeSquareMissionAudio.pause();
        try {
            shapeSquareMissionAudio.currentTime = 0;
        } catch (error) {
            // Pausing is enough while the audio metadata is still loading.
        }
        shapeSquareMissionAudio = null;
    };

    const stopShapeSquareReadyAudio = () => {
        if (!shapeSquareReadyAudio) return;

        shapeSquareReadyAudio.onended = null;
        shapeSquareReadyAudio.pause();
        try {
            shapeSquareReadyAudio.currentTime = 0;
        } catch (error) {
            // Pausing is enough while the audio metadata is still loading.
        }
        shapeSquareReadyAudio = null;
    };

    const stopShapeSquareCelebrationAudio = () => {
        if (!shapeSquareCelebrationAudio) return;

        shapeSquareCelebrationAudio.onended = null;
        shapeSquareCelebrationAudio.pause();
        try {
            shapeSquareCelebrationAudio.currentTime = 0;
        } catch (error) {
            // Pausing is enough while the audio metadata is still loading.
        }
        shapeSquareCelebrationAudio = null;
    };

    const stopShapeSquareChocolateQuestionAudio = () => {
        if (!shapeSquareChocolateQuestionAudio) return;

        shapeSquareChocolateQuestionAudio.onended = null;
        shapeSquareChocolateQuestionAudio.pause();
        try {
            shapeSquareChocolateQuestionAudio.currentTime = 0;
        } catch (error) {
            // Pausing is enough while the audio metadata is still loading.
        }
        shapeSquareChocolateQuestionAudio = null;
    };

    const playShapeSquareChocolateQuestionAudio = () => {
        const AudioCtor = window.Audio;
        if (!AudioCtor) return;

        stopShapeSquareChocolateQuestionAudio();
        const audio = new AudioCtor(shapeSquareChocolateQuestionAudioSource);
        shapeSquareChocolateQuestionAudio = audio;
        audio.preload = 'auto';
        audio.playsInline = true;
        audio.onended = () => {
            if (shapeSquareChocolateQuestionAudio === audio) shapeSquareChocolateQuestionAudio = null;
        };
        audio.play().catch(() => {
            if (shapeSquareChocolateQuestionAudio === audio) shapeSquareChocolateQuestionAudio = null;
        });
    };

    const setShapeSquarePlayButtonVisible = (isVisible) => {
        if (!shapeSquarePlayButton) return;

        shapeSquarePlayButton.hidden = !isVisible;
        shapeSquarePlayButton.style.display = isVisible ? '' : 'none';
    };

    const setShapeSquareSkipButtonVisible = (isVisible) => {
        if (!shapeSquareSkipButton) return;

        shapeSquareSkipButton.hidden = !isVisible;
    };

    const setShapeSquareVideoStageVisible = (isVisible) => {
        if (!shapeSquareVideoStage) return;

        shapeSquareVideoStage.hidden = !isVisible;
        shapeSquareVideoStage.setAttribute('aria-hidden', String(!isVisible));
    };

    const getSquareObjectSceneRect = (spec) => {
        if (!shapeSquarePage || !spec) return null;
        if (!spec) return null;

        const viewportWidth = shapeSquarePage.clientWidth || window.innerWidth;
        const viewportHeight = shapeSquarePage.clientHeight || window.innerHeight;
        const sourceWidth = shapeSquareBgImage?.naturalWidth || 1680;
        const sourceHeight = shapeSquareBgImage?.naturalHeight || 945;
        const coverScale = Math.max(viewportWidth / sourceWidth, viewportHeight / sourceHeight);
        const renderedWidth = sourceWidth * coverScale;
        const renderedHeight = sourceHeight * coverScale;
        const offsetX = (viewportWidth - renderedWidth) / 2;
        const offsetY = (viewportHeight - renderedHeight) / 2;

        return {
            left: offsetX + (spec.x * coverScale),
            top: offsetY + (spec.y * coverScale),
            width: spec.width * coverScale,
            height: spec.height * coverScale,
        };
    };

    const getSquareObjectTargetRect = (pieceNumber) => (
        getSquareObjectSceneRect(squareObjectTargetSpecs[pieceNumber])
    );

    const getSquareObjectScatterRect = (pieceNumber) => (
        getSquareObjectSceneRect(squareObjectCurrentScatterSpecs[pieceNumber] || squareObjectScatterSpecs[pieceNumber])
    );

    const doSquareObjectSpecsOverlap = (firstSpec, secondSpec, padding = 0) => {
        if (!firstSpec || !secondSpec) return false;

        return !(
            firstSpec.x + firstSpec.width + padding < secondSpec.x
            || secondSpec.x + secondSpec.width + padding < firstSpec.x
            || firstSpec.y + firstSpec.height + padding < secondSpec.y
            || secondSpec.y + secondSpec.height + padding < firstSpec.y
        );
    };

    const randomizeSquareObjectScatterSpecs = () => {
        const bounds = {
            xMin: 410,
            xMax: 1530,
            yMin: 215,
            yMax: 760,
        };
        const nextSpecs = {};
        const placedSpecs = [];
        const squareObjectPanelAvoidSpec = {
            x: 0,
            y: 455,
            width: 380,
            height: 435,
        };
        const forbiddenSpecs = [
            ...Object.values(squareObjectTargetSpecs),
            squareObjectPanelAvoidSpec,
        ];

        Object.keys(squareObjectScatterSpecs).forEach((pieceNumber) => {
            const baseSpec = squareObjectScatterSpecs[pieceNumber];
            let chosenSpec = null;

            for (let attempt = 0; attempt < 70; attempt += 1) {
                const candidate = {
                    ...baseSpec,
                    x: bounds.xMin + Math.random() * Math.max(1, bounds.xMax - bounds.xMin - baseSpec.width),
                    y: bounds.yMin + Math.random() * Math.max(1, bounds.yMax - bounds.yMin - baseSpec.height),
                };
                const overlapsPiece = placedSpecs.some((spec) => doSquareObjectSpecsOverlap(candidate, spec, 54));
                const overlapsTarget = forbiddenSpecs.some((spec) => doSquareObjectSpecsOverlap(candidate, spec, 34));
                if (!overlapsPiece && !overlapsTarget) {
                    chosenSpec = candidate;
                    break;
                }
            }

            const finalSpec = chosenSpec || baseSpec;
            nextSpecs[pieceNumber] = finalSpec;
            placedSpecs.push(finalSpec);
        });

        squareObjectCurrentScatterSpecs = nextSpecs;
    };

    const applySquareObjectRect = (element, rect) => {
        if (!element || !rect) return;

        element.style.left = `${rect.left}px`;
        element.style.top = `${rect.top}px`;
        element.style.width = `${rect.width}px`;
        element.style.height = `${rect.height}px`;
    };

    const updateSquareObjectTargets = () => {
        squareObjectTargets.forEach((target) => {
            applySquareObjectRect(target, getSquareObjectTargetRect(target.dataset.squareTarget));
        });

        squareObjectPieces.forEach((piece) => {
            if (piece.dataset.squarePlaced === 'true') {
                applySquareObjectRect(piece, getSquareObjectTargetRect(piece.dataset.squarePiece));
                return;
            }
            if (piece.classList.contains('is-scattered')) {
                applySquareObjectRect(piece, getSquareObjectScatterRect(piece.dataset.squarePiece));
            }
        });
    };

    const shuffleValues = (values) => {
        const shuffled = [...values];
        for (let index = shuffled.length - 1; index > 0; index -= 1) {
            const randomIndex = Math.floor(Math.random() * (index + 1));
            [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
        }
        return shuffled;
    };

    const setShapeSquareAnswerTiles = () => {
        if (!shapeSquareAnswerTileButtons.length) return;

        if (shapeSquareCookieSquare) {
            shapeSquareCookieSquare.classList.remove(
                'is-being-eaten',
                'is-biting',
                'is-bite-1',
                'is-bite-2',
                'is-bite-3',
                'is-bite-4',
                'is-bite-5',
                'is-bite-6',
            );
        }

        const values = [10];
        while (values.length < shapeSquareAnswerTileButtons.length) {
            const candidate = Math.floor(Math.random() * 20) + 1;
            if (!values.includes(candidate)) values.push(candidate);
        }

        shuffleValues(values).forEach((value, index) => {
            const tile = shapeSquareAnswerTileButtons[index];
            if (!tile) return;
            tile.textContent = String(value);
            tile.dataset.answer = String(value);
            tile.dataset.correct = String(value === 10);
            tile.classList.remove('is-correct', 'is-wrong');
            tile.disabled = false;
            tile.setAttribute('aria-label', `Answer ${value}`);
        });
    };

    const hideShapeSquareAnswerChoices = () => {
        if (shapeSquareCookieSquare) shapeSquareCookieSquare.hidden = true;
        if (shapeSquareAnswerTiles) shapeSquareAnswerTiles.hidden = true;
        shapeSquareAnswerTileButtons.forEach((tile) => {
            tile.classList.remove('is-correct', 'is-wrong');
            tile.disabled = false;
        });
    };

    const animateShapeSquareChocolateBites = (onComplete) => {
        if (!shapeSquareCookieSquare) {
            onComplete?.();
            return;
        }

        shapeSquareCookieSquare.classList.add('is-being-eaten');
        let biteNumber = 0;
        const takeNextBite = () => {
            biteNumber += 1;
            shapeSquareCookieSquare.classList.remove('is-biting');
            shapeSquareCookieSquare.getBoundingClientRect();
            shapeSquareCookieSquare.classList.add(`is-bite-${biteNumber}`, 'is-biting');
            if (window.Audio) {
                const biteAudio = new window.Audio('assets/Audios/Sound effects/bite.mp3');
                biteAudio.play().catch(() => playUiClickSound('pop'));
            } else {
                playUiClickSound('pop');
            }

            const biteTimer = window.setTimeout(() => {
                shapeSquareTimers = shapeSquareTimers.filter((timerId) => timerId !== biteTimer);
                if (biteNumber < 6) {
                    takeNextBite();
                } else {
                    onComplete?.();
                }
            }, 520);
            shapeSquareTimers.push(biteTimer);
        };

        takeNextBite();
    };

    const showShapeSquareAnswerCelebration = () => {
        if (!shapeSquarePage) return;

        hideShapeSquareAnswerChoices();
        if (shapeSquareCharacter13) {
            shapeSquareCharacter13.hidden = true;
            shapeSquareCharacter13.classList.remove('is-entering');
        }
        if (shapeSquareChocolateQuestionBubble) {
            shapeSquareChocolateQuestionBubble.hidden = true;
            shapeSquareChocolateQuestionBubble.classList.remove('is-visible');
        }
        shapeSquarePage.classList.remove('is-progress-visible');
        shapeSquarePage.classList.add('is-square-answer-completing');
        shapeSquareProgress?.setAttribute('aria-hidden', 'true');
        if (shapeSquareCelebrationText) {
            shapeSquareCelebrationText.textContent = 'TAMA ANG IYONG SAGOT!';
            shapeSquareCelebrationText.hidden = true;
            shapeSquareCelebrationText.getBoundingClientRect();
            shapeSquareCelebrationText.hidden = false;
        }
        stopShapeSquareCelebrationAudio();
        stopShapeSquareChocolateQuestionAudio();

        const prepareKidsCheeringConfetti = () => {
            if (!shapeSquareConfetti) return;

            const colors = ['#ff4f64', '#ffd83d', '#38c7e8', '#70d34b', '#ff8f32', '#ffffff'];
            Array.from(shapeSquareConfetti.children).forEach((piece, index) => {
                piece.style.setProperty('--confetti-x', `${(index * 37) % 101}%`);
                piece.style.setProperty('--confetti-color', colors[index % colors.length]);
                piece.style.setProperty('--confetti-delay', `${-((index * 0.17) % 3.2)}s`);
                piece.style.setProperty('--confetti-duration', `${2.5 + ((index * 11) % 13) / 10}s`);
                piece.style.setProperty('--confetti-drift', `${((index * 29) % 150) - 75}px`);
                piece.style.setProperty('--confetti-size', `${0.35 + ((index * 5) % 13) / 10}rem`);
            });
        };

        const startKidsCheering = () => {
            if (!isPageVisible(shapeSquarePage)) return;
            prepareKidsCheeringConfetti();
            shapeSquarePage.classList.remove('is-square-answer-completing');
            shapeSquarePage.classList.add('is-square-kids-cheering');
            shapeSquareKidsCheerCharacters.forEach((character) => {
                character.hidden = false;
            });
            showShapeSquarePuzzleCelebration(shapeSquareKidsCheeringAudioSource, {
                message: 'TAMA ANG IYONG SAGOT!',
                onAudioEnded: showShapeSquareSecondProgress,
                showFollowupButtons: false,
                showMainCharacter: false,
                preserveMessage: true,
            });
        };

        const AudioCtor = window.Audio;
        if (!AudioCtor) {
            startKidsCheering();
            return;
        }

        const completedAudio = new AudioCtor(shapeSquareCompletedAudioSource);
        shapeSquareCelebrationAudio = completedAudio;
        completedAudio.preload = 'auto';
        completedAudio.playsInline = true;
        completedAudio.onended = () => {
            if (shapeSquareCelebrationAudio !== completedAudio) return;
            shapeSquareCelebrationAudio = null;
            startKidsCheering();
        };
        completedAudio.play().catch(() => {
            if (shapeSquareCelebrationAudio !== completedAudio) return;
            shapeSquareCelebrationAudio = null;
            startKidsCheering();
        });
    };

    const showShapeSquareSecondProgress = () => {
        if (!shapeSquarePage || !shapeSquareProgress) return;

        shapeSquarePage.classList.remove('is-square-puzzle-complete', 'is-square-puzzle-followup', 'is-square-kids-cheering');
        if (shapeSquareCelebrationText) shapeSquareCelebrationText.hidden = true;
        if (shapeSquareConfetti) shapeSquareConfetti.hidden = true;
        if (shapeSquareChocolateQuestionBubble) {
            shapeSquareChocolateQuestionBubble.hidden = true;
            shapeSquareChocolateQuestionBubble.classList.remove('is-visible');
        }
        shapeSquareKidsCheerCharacters.forEach((character) => {
            character.hidden = true;
        });
        if (shapeSquarePuzzleNextButton) {
            shapeSquarePuzzleNextButton.hidden = true;
            shapeSquarePuzzleNextButton.classList.remove('is-visible');
        }
        if (shapeSquarePuzzleRetryButton) {
            shapeSquarePuzzleRetryButton.hidden = true;
            shapeSquarePuzzleRetryButton.classList.remove('is-visible');
        }

        shapeSquarePage.classList.add('is-progress-visible');
        shapeSquareProgress.dataset.progressStage = 'answer';
        shapeSquareProgress.setAttribute('aria-hidden', 'false');
        if (shapeSquareReplayButtonImage) shapeSquareReplayButtonImage.src = 'assets/Buttons/Retry.webp';
        shapeSquareReplayButton?.setAttribute('aria-label', 'Retry square mission');
        if (shapeSquareNextButtonImage) shapeSquareNextButtonImage.src = 'assets/Buttons/next.webp';
        shapeSquareNextButton?.setAttribute('aria-label', 'Continue');
        setShapeSquareEarnedStars(2);
        playUiClickSound('boardSuccess');
        const starSoundTimer = window.setTimeout(() => {
            playUiClickSound('starPop');
            shapeSquareCelebrationTimers = shapeSquareCelebrationTimers.filter(
                (timerId) => timerId !== starSoundTimer,
            );
        }, 650);
        shapeSquareCelebrationTimers.push(starSoundTimer);
        shapeSquareNextButton?.focus({ preventScroll: true });
    };

    const handleShapeSquareAnswerTileClick = (event) => {
        const tile = event.currentTarget;
        if (!tile || tile.disabled) return;

        if (tile.dataset.correct === 'true') {
            shapeSquareAnswerTileButtons.forEach((button) => {
                button.disabled = true;
            });
            tile.classList.add('is-correct');
            if (window.Audio) {
                const correctAudio = new window.Audio('assets/Audios/Sound effects/correct.mp3');
                correctAudio.play().catch(() => playUiClickSound('chime'));
            } else {
                playUiClickSound('chime');
            }
            const completionTimer = window.setTimeout(() => {
                shapeSquareTimers = shapeSquareTimers.filter((timerId) => timerId !== completionTimer);
                animateShapeSquareChocolateBites(showShapeSquareAnswerCelebration);
            }, 420);
            shapeSquareTimers.push(completionTimer);
            return;
        }

        tile.classList.remove('is-wrong');
        tile.getBoundingClientRect();
        tile.classList.add('is-wrong');
        if (window.Audio) {
            const buzzerAudio = new window.Audio('assets/Audios/Sound effects/buzzer.mp3');
            buzzerAudio.play().catch(() => playUiClickSound('thunk'));
        } else {
            playUiClickSound('thunk');
        }
        const wrongTimer = window.setTimeout(() => {
            tile.classList.remove('is-wrong');
            shapeSquareTimers = shapeSquareTimers.filter((timerId) => timerId !== wrongTimer);
        }, 360);
        shapeSquareTimers.push(wrongTimer);
    };

    const resetSquareObjectPuzzle = () => {
        squareObjectGuidedTargetNumber = null;
        if (squarePlacementTitle) squarePlacementTitle.hidden = true;
        if (squarePlacementHint) squarePlacementHint.hidden = true;
        if (squarePlacementHintObject) squarePlacementHintObject.textContent = '';
        stopShapeSquareCelebrationAudio();
        stopShapeSquareChocolateQuestionAudio();
        shapeSquarePage?.classList.remove('is-square-puzzle-complete');
        shapeSquarePage?.classList.remove('is-square-puzzle-followup');
        shapeSquarePage?.classList.remove('is-square-answer-completing');
        shapeSquarePage?.classList.remove('is-square-kids-cheering');
        if (shapeSquareCelebrationText) shapeSquareCelebrationText.hidden = true;
        if (shapeSquareConfetti) shapeSquareConfetti.hidden = true;
        shapeSquareKidsCheerCharacters.forEach((character) => {
            character.hidden = true;
        });
        if (shapeSquarePuzzleNextButton) {
            shapeSquarePuzzleNextButton.hidden = true;
            shapeSquarePuzzleNextButton.classList.remove('is-visible');
        }
        hideShapeSquareAnswerChoices();
        if (shapeSquarePuzzleRetryButton) {
            shapeSquarePuzzleRetryButton.hidden = true;
            shapeSquarePuzzleRetryButton.classList.remove('is-visible');
        }
        if (shapeSquareCharacter12) {
            shapeSquareCharacter12.hidden = true;
            shapeSquareCharacter12.classList.remove('is-entering');
        }
        if (shapeSquareCharacter13) {
            shapeSquareCharacter13.hidden = true;
            shapeSquareCharacter13.classList.remove('is-entering');
        }
        if (shapeSquareChocolateQuestionBubble) {
            shapeSquareChocolateQuestionBubble.hidden = true;
            shapeSquareChocolateQuestionBubble.classList.remove('is-visible');
        }
        if (shapeSquarePuzzleNextButton) {
            shapeSquarePuzzleNextButton.hidden = true;
            shapeSquarePuzzleNextButton.classList.remove('is-visible');
        }
        hideShapeSquareAnswerChoices();
        if (shapeSquarePuzzleRetryButton) {
            shapeSquarePuzzleRetryButton.hidden = true;
            shapeSquarePuzzleRetryButton.classList.remove('is-visible');
        }
        squareObjectSnapTimers.forEach((timerId) => window.clearTimeout(timerId));
        squareObjectSnapTimers.clear();
        if (squareObjectPanelExitTimer !== null) {
            window.clearTimeout(squareObjectPanelExitTimer);
            squareObjectPanelExitTimer = null;
        }
        squareObjectTargets.forEach((target) => target.classList.remove('is-active', 'is-guide'));
        if (squareObjectPanel) {
            squareObjectPanel.hidden = false;
            squareObjectPanel.classList.remove('is-complete');
        }
        randomizeSquareObjectScatterSpecs();

        squareObjectPieces.forEach((piece) => {
            const slot = squareObjectPanel?.querySelector(`[data-square-slot="${piece.dataset.squarePiece}"]`);
            shapeSquarePage?.appendChild(piece);
            slot?.classList.add('is-empty');
            slot?.classList.remove('is-drag-source');
            piece.classList.remove('is-dragging', 'is-returning', 'is-collecting', 'is-snapping', 'is-placed');
            piece.classList.add('is-scattered');
            piece.style.removeProperty('--square-drag-x');
            piece.style.removeProperty('--square-drag-y');
            applySquareObjectRect(piece, getSquareObjectScatterRect(piece.dataset.squarePiece));
            delete piece.dataset.squarePlaced;
            delete piece.dataset.squareCollected;
            piece.removeAttribute('aria-disabled');
            piece.tabIndex = 0;
        });
    };

    const triggerShapeSquarePuzzleFollowup = () => {
        if (!shapeSquarePage || shapeSquarePage.classList.contains('is-square-puzzle-followup')) return;

        shapeSquarePage.classList.add('is-square-puzzle-followup');
        if (shapeSquareCelebrationText) shapeSquareCelebrationText.hidden = true;
        if (shapeSquarePuzzleNextButton) {
            shapeSquarePuzzleNextButton.hidden = true;
            shapeSquarePuzzleNextButton.classList.remove('is-visible');
        }
        if (shapeSquareCookieSquare) shapeSquareCookieSquare.hidden = false;
        setShapeSquareAnswerTiles();
        if (shapeSquareAnswerTiles) shapeSquareAnswerTiles.hidden = false;
        if (shapeSquarePuzzleRetryButton) {
            shapeSquarePuzzleRetryButton.hidden = true;
            shapeSquarePuzzleRetryButton.classList.remove('is-visible');
        }
        if (shapeSquarePuzzleRetryButton) {
            shapeSquarePuzzleRetryButton.hidden = true;
            shapeSquarePuzzleRetryButton.classList.remove('is-visible');
        }
        if (shapeSquareCharacter13) {
            shapeSquareCharacter13.hidden = false;
            shapeSquareCharacter13.getBoundingClientRect();
            shapeSquareCharacter13.classList.add('is-entering');
        }
        if (shapeSquareChocolateQuestionBubble) {
            shapeSquareChocolateQuestionBubble.hidden = false;
            shapeSquareChocolateQuestionBubble.getBoundingClientRect();
            shapeSquareChocolateQuestionBubble.classList.add('is-visible');
        }
        playShapeSquareChocolateQuestionAudio();
        shapeSquareCharacter12?.classList.remove('is-entering');
    };

    const returnToShapeSquareMissionStart = () => {
        if (!shapeSquarePage || !shapeSquareMissionGuide || !shapeSquareMissionStartButton) return;

        stopShapeSquareCelebrationAudio();
        stopShapeSquareChocolateQuestionAudio();
        resetSquareObjectPuzzle();
        shapeSquarePage.classList.remove('is-lesson-complete', 'is-square-puzzle-followup', 'is-progress-visible');
        shapeSquareProgress?.setAttribute('aria-hidden', 'true');
        if (shapeSquareProgress) shapeSquareProgress.dataset.progressStage = 'lesson';
        if (shapeSquareReplayButtonImage) shapeSquareReplayButtonImage.src = 'assets/Buttons/replay.webp';
        shapeSquareReplayButton?.setAttribute('aria-label', 'Replay square lesson');
        if (shapeSquareNextButtonImage) shapeSquareNextButtonImage.src = 'assets/Buttons/next.webp';
        shapeSquareNextButton?.setAttribute('aria-label', 'Continue');
        shapeSquarePage.classList.add('is-square-mission-guide');
        shapeSquareMissionGuide.hidden = false;
        shapeSquareMissionGuide.setAttribute('aria-hidden', 'false');
        shapeSquareMissionCharacter10.hidden = true;
        shapeSquareMissionCharacter11.hidden = true;
        shapeSquareMissionBubble.hidden = true;
        shapeSquareMissionStartButton.hidden = false;
        shapeSquareMissionStartButton.classList.add('is-visible');
        shapeSquareMissionStartButton.focus({ preventScroll: true });
    };

    const showShapeSquarePuzzleCelebration = (audioSource = shapeSquareCelebrationAudioSource, options = {}) => {
        if (!shapeSquarePage) return;

        shapeSquarePage.classList.add('is-square-puzzle-complete');
        if (shapeSquareCelebrationText) {
            shapeSquareCelebrationText.textContent = options.message || 'Napakahusay!';
            if (options.preserveMessage) {
                shapeSquareCelebrationText.hidden = false;
            } else {
                shapeSquareCelebrationText.hidden = true;
                shapeSquareCelebrationText.getBoundingClientRect();
                shapeSquareCelebrationText.hidden = false;
            }
        }
        if (shapeSquareConfetti) {
            shapeSquareConfetti.hidden = true;
            shapeSquareConfetti.getBoundingClientRect();
            shapeSquareConfetti.hidden = false;
        }
        if (options.showMainCharacter !== false && shapeSquareCharacter12) {
            shapeSquareCharacter12.hidden = false;
            shapeSquareCharacter12.classList.remove('is-entering');
            shapeSquareCharacter12.getBoundingClientRect();
            shapeSquareCharacter12.classList.add('is-entering');
        } else if (shapeSquareCharacter12) {
            shapeSquareCharacter12.hidden = true;
            shapeSquareCharacter12.classList.remove('is-entering');
        }

        if (shapeSquareCharacter13) {
            shapeSquareCharacter13.hidden = true;
            shapeSquareCharacter13.classList.remove('is-entering');
        }

        stopShapeSquareCelebrationAudio();
        const AudioCtor = window.Audio;
        if (!AudioCtor) return;
        const celebrationAudio = new AudioCtor(audioSource);
        shapeSquareCelebrationAudio = celebrationAudio;
        celebrationAudio.preload = 'auto';
        celebrationAudio.playsInline = true;
        celebrationAudio.volume = 1;
        celebrationAudio.onended = () => {
            if (shapeSquareCelebrationAudio !== celebrationAudio) return;
            shapeSquareCelebrationAudio = null;
            options.onAudioEnded?.();
        };
        celebrationAudio.play().catch(() => {
            if (shapeSquareCelebrationAudio !== celebrationAudio) return;
            shapeSquareCelebrationAudio = null;
            options.onAudioEnded?.();
        });

        if (typeof options.onAfterDelay === 'function') {
            const followupTimerId = window.setTimeout(() => {
                if (!isPageVisible(shapeSquarePage)) return;
                options.onAfterDelay();
                shapeSquareTimers = shapeSquareTimers.filter((timerId) => timerId !== followupTimerId);
            }, options.afterDelayMs || 2100);
            shapeSquareTimers.push(followupTimerId);
        } else if (options.showFollowupButtons !== false) {
            const followupTimerId = window.setTimeout(() => {
                if (!isPageVisible(shapeSquarePage)) return;
                if (shapeSquarePuzzleNextButton) {
                    shapeSquarePuzzleNextButton.hidden = false;
                    shapeSquarePuzzleNextButton.getBoundingClientRect();
                    shapeSquarePuzzleNextButton.classList.add('is-visible');
                }
                if (shapeSquarePuzzleRetryButton) {
                    shapeSquarePuzzleRetryButton.hidden = false;
                    shapeSquarePuzzleRetryButton.getBoundingClientRect();
                    shapeSquarePuzzleRetryButton.classList.add('is-visible');
                }
                shapeSquarePuzzleNextButton?.focus({ preventScroll: true });
                shapeSquareTimers = shapeSquareTimers.filter((timerId) => timerId !== followupTimerId);
            }, 2100);
            shapeSquareTimers.push(followupTimerId);
        }
    };

    const collectSquareObjectPiece = (piece) => {
        if (!piece?.classList.contains('is-scattered') || !shapeSquarePage) return;

        const slot = squareObjectPanel?.querySelector(`[data-square-slot="${piece.dataset.squarePiece}"]`);
        if (!slot) return;

        const pageRect = shapeSquarePage.getBoundingClientRect();
        const currentRect = piece.getBoundingClientRect();
        const slotRect = slot.getBoundingClientRect();
        piece.classList.remove('is-scattered');
        piece.classList.add('is-collecting');
        applySquareObjectRect(piece, {
            left: currentRect.left - pageRect.left,
            top: currentRect.top - pageRect.top,
            width: currentRect.width,
            height: currentRect.height,
        });
        piece.getBoundingClientRect();
        window.requestAnimationFrame(() => applySquareObjectRect(piece, {
            left: slotRect.left - pageRect.left,
            top: slotRect.top - pageRect.top,
            width: slotRect.width,
            height: slotRect.height,
        }));
        playUiClickSound('chime');

        const collectTimer = window.setTimeout(() => {
            slot.appendChild(piece);
            slot.classList.remove('is-empty');
            piece.classList.remove('is-collecting');
            piece.style.removeProperty('left');
            piece.style.removeProperty('top');
            piece.style.removeProperty('width');
            piece.style.removeProperty('height');
            piece.dataset.squareCollected = 'true';
            squareObjectSnapTimers.delete(piece);
            piece.focus({ preventScroll: true });
            playUiClickSound('pop');
            updateSquareObjectPlacementGuide();
        }, 500);
        squareObjectSnapTimers.set(piece, collectTimer);
    };

    const updateSquareObjectPlacementGuide = () => {
        const allCollected = squareObjectPieces.every((piece) => (
            piece.dataset.squareCollected === 'true' || piece.dataset.squarePlaced === 'true'
        ));
        const remainingPieces = allCollected
            ? squareObjectPieces.filter((piece) => piece.dataset.squarePlaced !== 'true')
            : [];
        const currentPiece = remainingPieces.find(
            (piece) => piece.dataset.squarePiece === squareObjectGuidedTargetNumber,
        );
        const nextPiece = currentPiece || remainingPieces[
            Math.floor(Math.random() * remainingPieces.length)
        ] || null;
        squareObjectGuidedTargetNumber = nextPiece?.dataset.squarePiece || null;

        if (squarePlacementTitle) squarePlacementTitle.hidden = !squareObjectGuidedTargetNumber;
        if (squarePlacementHint) squarePlacementHint.hidden = !squareObjectGuidedTargetNumber;
        if (squarePlacementHintObject) {
            squarePlacementHintObject.textContent = nextPiece?.dataset.squareHint || '';
        }

        squareObjectTargets.forEach((target) => {
            target.classList.toggle(
                'is-guide',
                Boolean(squareObjectGuidedTargetNumber)
                    && target.dataset.squareTarget === squareObjectGuidedTargetNumber,
            );
            target.classList.remove('is-active');
        });
    };

    const placeSquareObjectPiece = (piece) => {
        if (
            !piece
            || piece.dataset.squareCollected !== 'true'
            || piece.dataset.squarePlaced === 'true'
            || !shapeSquarePage
        ) return;

        const targetRect = getSquareObjectTargetRect(piece.dataset.squarePiece);
        if (!targetRect) return;

        const pageRect = shapeSquarePage.getBoundingClientRect();
        const currentRect = piece.getBoundingClientRect();
        const slot = piece.closest('.square-object-slot');
        slot?.classList.add('is-empty');
        slot?.classList.remove('is-drag-source');
        shapeSquarePage.appendChild(piece);
        piece.classList.remove('is-dragging', 'is-returning');
        piece.classList.add('is-snapping');
        piece.dataset.squarePlaced = 'true';
        piece.setAttribute('aria-disabled', 'true');
        piece.tabIndex = -1;
        piece.style.removeProperty('--square-drag-x');
        piece.style.removeProperty('--square-drag-y');
        applySquareObjectRect(piece, {
            left: currentRect.left - pageRect.left,
            top: currentRect.top - pageRect.top,
            width: currentRect.width,
            height: currentRect.height,
        });
        piece.getBoundingClientRect();

        window.requestAnimationFrame(() => applySquareObjectRect(piece, targetRect));
        playUiClickSound('chime');

        const snapTimer = window.setTimeout(() => {
            piece.classList.remove('is-snapping');
            piece.classList.add('is-placed');
            squareObjectSnapTimers.delete(piece);
            updateSquareObjectTargets();
            updateSquareObjectPlacementGuide();

            if (squareObjectPieces.every((currentPiece) => currentPiece.dataset.squarePlaced === 'true')) {
                squareObjectTargets.forEach((target) => target.classList.remove('is-active', 'is-guide'));
                if (squareObjectPanel) {
                    squareObjectPanel.classList.add('is-complete');
                    squareObjectPanelExitTimer = window.setTimeout(() => {
                        squareObjectPanel.hidden = true;
                        squareObjectPanelExitTimer = null;
                    }, 560);
                }
                playUiClickSound('boardSuccess');
                showShapeSquarePuzzleCelebration(shapeSquareKidsCheeringAudioSource);
            }
        }, 440);
        squareObjectSnapTimers.set(piece, snapTimer);
    };

    const showSquareObjectWrongChoice = (piece) => {
        if (!piece || piece.dataset.squarePlaced === 'true') return;
        piece.classList.remove('is-returning');
        piece.getBoundingClientRect();
        piece.classList.add('is-returning');
        if (window.Audio) {
            const audio = new window.Audio('assets/Audios/Sound effects/buzzer.mp3');
            audio.play().catch(() => {});
        } else {
            playUiClickSound('thunk');
        }
        window.setTimeout(() => {
            piece.classList.remove('is-returning');
        }, 330);
    };

    const activateSquareObjectPiece = (piece) => {
        if (!piece || piece.dataset.squarePlaced === 'true') return;

        if (piece.classList.contains('is-scattered')) {
            collectSquareObjectPiece(piece);
            return;
        }

        if (piece.dataset.squareCollected !== 'true') return;

        updateSquareObjectPlacementGuide();
        if (!squareObjectGuidedTargetNumber) return;

        if (piece.dataset.squarePiece === squareObjectGuidedTargetNumber) {
            if (window.Audio) {
                const audio = new window.Audio('assets/Audios/Sound effects/correct.mp3');
                audio.play().catch(() => {});
            }
            placeSquareObjectPiece(piece);
            return;
        }

        showSquareObjectWrongChoice(piece);
    };

    const hideShapeSquareProgress = () => {
        shapeSquareCelebrationTimers.forEach((timerId) => window.clearTimeout(timerId));
        shapeSquareCelebrationTimers = [];
        shapeSquarePage?.classList.remove('is-progress-visible');
        shapeSquareProgress?.setAttribute('aria-hidden', 'true');
    };

    const setShapeSquareEarnedStars = (count) => {
        if (!shapeSquareStars) return;

        const earnedStars = Math.max(0, Math.min(3, Number(count) || 0));
        const messages = ['', 'Well done!', 'Great job!', "Wow! You're a shape superstar!"];
        shapeSquareStars.dataset.earnedStars = String(earnedStars);
        shapeSquareStars.setAttribute('aria-label', `${earnedStars} of 3 stars earned`);
        if (shapeSquareStarMessage) {
            shapeSquareStarMessage.textContent = messages[earnedStars];
        }
    };

    const hideShapeSquareMissionGuide = () => {
        stopShapeSquareMissionAudio();
        shapeSquarePage?.classList.remove('is-square-mission-guide');
        shapeSquareMissionGuide?.setAttribute('aria-hidden', 'true');
        if (shapeSquareMissionGuide) shapeSquareMissionGuide.hidden = true;
        if (shapeSquareMissionCharacter10) {
            shapeSquareMissionCharacter10.hidden = false;
            shapeSquareMissionCharacter10.classList.remove('is-entering', 'is-exiting');
        }
        if (shapeSquareMissionCharacter11) {
            shapeSquareMissionCharacter11.hidden = true;
            shapeSquareMissionCharacter11.classList.remove('is-entering', 'is-exiting');
        }
        if (shapeSquareMissionBubble) {
            shapeSquareMissionBubble.hidden = false;
            shapeSquareMissionBubble.classList.remove('is-entering', 'is-ch11', 'is-message-changing');
        }
        if (shapeSquareMissionBubbleText) {
            shapeSquareMissionBubbleText.textContent = '';
        }
        if (shapeSquareMissionStartButton) {
            shapeSquareMissionStartButton.hidden = true;
            shapeSquareMissionStartButton.classList.remove('is-visible');
        }
    };

    const showShapeSquareObjectGame = () => {
        hideShapeSquareMissionGuide();
        stopShapeSquareReadyAudio();
        shapeSquareVideo?.pause();
        if (squareObjectPanel) {
            squareObjectPanel.hidden = false;
            squareObjectPanel.classList.remove('is-complete');
        }
        shapeSquarePage?.classList.add('is-lesson-complete');
        updateSquareObjectTargets();
        setShapeSquareVideoStageVisible(false);
        setShapeSquarePlayButtonVisible(false);
        setShapeSquareSkipButtonVisible(false);
    };

    const startShapeSquareMissionGuide = () => {
        if (!shapeSquarePage || !shapeSquareMissionGuide || !shapeSquareMissionBubble || !shapeSquareMissionBubbleText) {
            showShapeSquareObjectGame();
            return;
        }

        clearShapeSquareTimers();
        stopShapeSquareMissionAudio();
        stopShapeSquareReadyAudio();
        hideShapeSquareProgress();
        shapeSquareVideo?.pause();
        shapeSquarePage.classList.remove('is-lesson-complete');
        shapeSquarePage.classList.add('is-square-mission-guide');
        setShapeSquareVideoStageVisible(false);
        setShapeSquarePlayButtonVisible(false);
        setShapeSquareSkipButtonVisible(false);
        shapeSquareMissionGuide.hidden = false;
        shapeSquareMissionGuide.setAttribute('aria-hidden', 'false');
        if (shapeSquareMissionStartButton) {
            shapeSquareMissionStartButton.hidden = true;
            shapeSquareMissionStartButton.classList.remove('is-visible');
        }

        const session = shapeSquareSession;
        let activeMissionCharacter = '';
        const showMissionStage = (stageIndex) => {
            const stage = shapeSquareMissionStages[stageIndex];
            if (!stage || session !== shapeSquareSession || !isPageVisible(shapeSquarePage)) return;

            const activeCharacter = stage.character === 'ch11' ? shapeSquareMissionCharacter11 : shapeSquareMissionCharacter10;
            const inactiveCharacter = stage.character === 'ch11' ? shapeSquareMissionCharacter10 : shapeSquareMissionCharacter11;
            const didChangeCharacter = stage.character !== activeMissionCharacter;
            const isReadyStage = stage.character === 'ch11';
            activeMissionCharacter = stage.character;

            if (didChangeCharacter && inactiveCharacter) {
                inactiveCharacter.classList.remove('is-entering');
                inactiveCharacter.classList.add('is-exiting');
                const hideInactiveTimerId = window.setTimeout(() => {
                    inactiveCharacter.hidden = true;
                    inactiveCharacter.classList.remove('is-exiting');
                    shapeSquareTimers = shapeSquareTimers.filter((timerId) => timerId !== hideInactiveTimerId);
                }, 420);
                shapeSquareTimers.push(hideInactiveTimerId);
            }
            if (didChangeCharacter && activeCharacter) {
                const showActiveCharacter = () => {
                    if (session !== shapeSquareSession || !isPageVisible(shapeSquarePage)) return;
                    activeCharacter.hidden = false;
                    activeCharacter.classList.remove('is-entering', 'is-exiting');
                    activeCharacter.getBoundingClientRect();
                    activeCharacter.classList.add('is-entering');
                };

                if (isReadyStage) {
                    const showActiveCharacterTimerId = window.setTimeout(() => {
                        showActiveCharacter();
                        shapeSquareTimers = shapeSquareTimers.filter((timerId) => timerId !== showActiveCharacterTimerId);
                    }, 430);
                    shapeSquareTimers.push(showActiveCharacterTimerId);
                } else {
                    showActiveCharacter();
                }
            }

            if (didChangeCharacter) {
                shapeSquareMissionBubble.classList.remove('is-entering', 'is-message-changing');
                shapeSquareMissionBubble.classList.add('is-exiting');
            } else {
                shapeSquareMissionBubble.classList.add('is-message-changing');
            }

            const playReadyPromptAudio = () => {
                const AudioCtor = window.Audio;
                if (!AudioCtor) return;
                stopShapeSquareReadyAudio();
                const readyAudio = new AudioCtor(shapeSquareReadyAudioSource);
                shapeSquareReadyAudio = readyAudio;
                readyAudio.preload = 'auto';
                readyAudio.playsInline = true;
                readyAudio.volume = 1;
                readyAudio.onended = () => {
                    if (shapeSquareReadyAudio === readyAudio) shapeSquareReadyAudio = null;
                };
                readyAudio.play().catch(() => {
                    if (shapeSquareReadyAudio === readyAudio) shapeSquareReadyAudio = null;
                });
            };

            const bubbleDelay = didChangeCharacter ? 430 : 90;
            const bubbleTimerId = window.setTimeout(() => {
                if (session !== shapeSquareSession || !isPageVisible(shapeSquarePage)) return;
                shapeSquareMissionBubble.hidden = false;
                shapeSquareMissionBubble.classList.toggle('is-ch11', isReadyStage);
                shapeSquareMissionBubble.classList.toggle('is-short-message', String(stage.message || '').length <= 28);
                shapeSquareMissionBubbleText.textContent = stage.message;
                shapeSquareMissionBubble.classList.remove('is-exiting', 'is-message-changing', 'is-entering');
                shapeSquareMissionBubble.getBoundingClientRect();
                shapeSquareMissionBubble.classList.add('is-entering');
                if (isReadyStage) {
                    playReadyPromptAudio();
                }
                shapeSquareTimers = shapeSquareTimers.filter((timerId) => timerId !== bubbleTimerId);
            }, bubbleDelay);
            shapeSquareTimers.push(bubbleTimerId);

            if (isReadyStage) {
                const startButtonTimerId = window.setTimeout(() => {
                    if (session !== shapeSquareSession || !isPageVisible(shapeSquarePage) || !shapeSquareMissionStartButton) return;
                    if (shapeSquareMissionBubble) {
                        shapeSquareMissionBubble.classList.remove('is-entering');
                        shapeSquareMissionBubble.classList.add('is-exiting');
                    }
                    if (shapeSquareMissionCharacter11) {
                        shapeSquareMissionCharacter11.classList.remove('is-entering');
                        shapeSquareMissionCharacter11.classList.add('is-exiting');
                        const hideCh11TimerId = window.setTimeout(() => {
                            shapeSquareMissionCharacter11.hidden = true;
                            shapeSquareMissionCharacter11.classList.remove('is-exiting');
                            shapeSquareTimers = shapeSquareTimers.filter((timerId) => timerId !== hideCh11TimerId);
                        }, 420);
                        shapeSquareTimers.push(hideCh11TimerId);
                    }
                    const showStartTimerId = window.setTimeout(() => {
                        if (session !== shapeSquareSession || !isPageVisible(shapeSquarePage) || !shapeSquareMissionStartButton) return;
                        if (shapeSquareMissionBubble) {
                            shapeSquareMissionBubble.hidden = true;
                            shapeSquareMissionBubble.classList.remove('is-exiting', 'is-ch11', 'is-short-message', 'is-entering');
                        }
                        if (shapeSquareMissionBubbleText) {
                            shapeSquareMissionBubbleText.textContent = '';
                        }
                        shapeSquareMissionStartButton.hidden = false;
                        shapeSquareMissionStartButton.getBoundingClientRect();
                        shapeSquareMissionStartButton.classList.add('is-visible');
                        shapeSquareMissionStartButton.focus({ preventScroll: true });
                        shapeSquareTimers = shapeSquareTimers.filter((timerId) => timerId !== showStartTimerId);
                    }, 430);
                    shapeSquareTimers.push(showStartTimerId);
                    shapeSquareTimers = shapeSquareTimers.filter((timerId) => timerId !== startButtonTimerId);
                }, bubbleDelay + 1400);
                shapeSquareTimers.push(startButtonTimerId);
            }
        };

        const ch10Stages = shapeSquareMissionStages.filter((stage) => stage.character === 'ch10');
        const readyStageIndex = shapeSquareMissionStages.findIndex((stage) => stage.character === 'ch11');
        ch10Stages.forEach((stage) => {
            const stageIndex = shapeSquareMissionStages.indexOf(stage);
            const timerId = window.setTimeout(() => showMissionStage(stageIndex), stage.start * 1000);
            shapeSquareTimers.push(timerId);
        });

        const AudioCtor = window.Audio;
        if (AudioCtor) {
            const missionAudio = new AudioCtor(shapeSquareMissionAudioSource);
            shapeSquareMissionAudio = missionAudio;
            missionAudio.preload = 'auto';
            missionAudio.playsInline = true;
            missionAudio.volume = 1;
            missionAudio.onended = () => {
                if (shapeSquareMissionAudio === missionAudio) shapeSquareMissionAudio = null;
            };
            missionAudio.play().catch(() => {
                if (shapeSquareMissionAudio === missionAudio) shapeSquareMissionAudio = null;
            });

            const stopMissionAudioTimerId = window.setTimeout(() => {
                if (shapeSquareMissionAudio !== missionAudio) return;
                stopShapeSquareMissionAudio();
            }, 8500);
            shapeSquareTimers.push(stopMissionAudioTimerId);
        }

        const readyTimerId = window.setTimeout(() => showMissionStage(readyStageIndex), 8800);
        shapeSquareTimers.push(readyTimerId);

    };

    const shapeTvCelebrations = new WeakMap();
    const stopShapeTvCelebration = (page) => {
        const celebration = page && shapeTvCelebrations.get(page);
        if (!celebration) return;
        celebration.timers.forEach((timerId) => window.clearTimeout(timerId));
        celebration.audios.forEach((audio) => {
            audio.pause();
            audio.onended = null;
            audio.onerror = null;
        });
        celebration.overlay.remove();
        shapeTvCelebrations.delete(page);
    };

    const resetShapeTvChoices = (page) => {
        stopShapeTvCelebration(page);
        stopShapeChoiceAudio();
        pendingShapeChoice = null;
        pendingShapeChoiceAction = null;
        shapeWrongAnswerAudio?.pause();
        page?.querySelectorAll('.shape-tv-choice').forEach((choice) => {
            choice.disabled = false;
            choice.classList.remove('is-correct', 'is-wrong', 'is-speaking');
            delete choice.dataset.nameHeard;
            delete choice.dataset.answerPending;
            choice.removeAttribute('aria-pressed');
        });
    };

    const resetShapeSquareLessonVideo = () => {
        hideShapeSquareProgress();
        hideShapeSquareMissionGuide();
        shapeSquarePage?.classList.remove('is-lesson-complete', 'is-tv-lesson-image-visible');
        resetShapeTvChoices(shapeSquarePage);
        resetSquareObjectPuzzle();
        setShapeSquareEarnedStars(0);
        if (shapeSquareProgress) shapeSquareProgress.dataset.progressStage = 'lesson';
        if (shapeSquareReplayButtonImage) shapeSquareReplayButtonImage.src = 'assets/Buttons/replay.webp';
        shapeSquareReplayButton?.setAttribute('aria-label', 'Replay square lesson');
        if (shapeSquareNextButtonImage) shapeSquareNextButtonImage.src = 'assets/Buttons/next.webp';
        shapeSquareNextButton?.setAttribute('aria-label', 'Continue');
        setShapeSquareSkipButtonVisible(false);
        shapeSquareVideo?.pause?.();

        if (shapeSquareVideo) {
            shapeSquareVideo.hidden = false;
            try {
                shapeSquareVideo.currentTime = 0;
            } catch (error) {
                // Pausing is enough while the video metadata is still loading.
            }
        }
        if (squareTvLessonImage) squareTvLessonImage.hidden = true;
        if (squareTvMascot) squareTvMascot.hidden = true;
        if (squareTvQuestionPanel) squareTvQuestionPanel.hidden = true;

        setShapeSquareVideoStageVisible(false);
        setShapeSquarePlayButtonVisible(true);
    };

    const showShapeSquareProgress = (playRevealSound = true) => {
        if (!shapeSquarePage || !shapeSquareProgress) return;

        const wasAlreadyVisible = shapeSquarePage.classList.contains('is-progress-visible');
        shapeSquareVideo?.pause();
        setShapeSquarePlayButtonVisible(false);
        setShapeSquareSkipButtonVisible(false);
        hideShapeSquareMissionGuide();
        shapeSquarePage.classList.remove('is-lesson-complete');
        shapeSquarePage.classList.add('is-progress-visible');
        shapeSquareProgress.dataset.progressStage = 'lesson';
        if (shapeSquareReplayButtonImage) shapeSquareReplayButtonImage.src = 'assets/Buttons/replay.webp';
        shapeSquareReplayButton?.setAttribute('aria-label', 'Replay square lesson');
        if (shapeSquareNextButtonImage) shapeSquareNextButtonImage.src = 'assets/Buttons/next.webp';
        shapeSquareNextButton?.setAttribute('aria-label', 'Continue');
        setShapeSquareEarnedStars(1);
        shapeSquareProgress.setAttribute('aria-hidden', 'false');
        setShapeSquareVideoStageVisible(false);
        shapeSquareNextButton?.focus({ preventScroll: true });

        if (!wasAlreadyVisible && playRevealSound) {
            playUiClickSound('boardSuccess');
            const starSoundTimer = window.setTimeout(() => {
                playUiClickSound('starPop');
                shapeSquareCelebrationTimers = shapeSquareCelebrationTimers.filter(
                    (timerId) => timerId !== starSoundTimer,
                );
            }, 700);
            shapeSquareCelebrationTimers.push(starSoundTimer);
        }
    };

    const playShapeSquareLessonVideo = async () => {
        if (!shapeSquareVideo || !shapeSquarePage?.classList.contains('is-illustration-background') || !isPageVisible(shapeSquarePage)) return;

        try {
            hideShapeSquareProgress();
            shapeSquarePage.classList.remove('is-lesson-complete', 'is-tv-lesson-image-visible');
            resetShapeTvChoices(shapeSquarePage);
            setShapeSquareEarnedStars(0);
            setShapeSquarePlayButtonVisible(false);
            setShapeSquareSkipButtonVisible(true);
            setShapeSquareVideoStageVisible(true);
            shapeSquareVideo.hidden = false;
            if (squareTvLessonImage) squareTvLessonImage.hidden = true;
            if (squareTvMascot) squareTvMascot.hidden = true;
            if (squareTvQuestionPanel) squareTvQuestionPanel.hidden = true;

            try {
                shapeSquareVideo.currentTime = 0;
            } catch (error) {
                // The clip can still begin while its metadata is preparing.
            }

            await shapeSquareVideo.play();
        } catch (error) {
            setShapeSquarePlayButtonVisible(true);
            setShapeSquareSkipButtonVisible(false);
            console.warn('Square lesson video could not play.', error);
        }
    };

    const showShapeSquareTvLessonImage = () => {
        if (!shapeSquarePage || !shapeSquareVideo || !squareTvLessonImage) return;

        hideShapeSquareProgress();
        shapeSquareVideo.pause();
        shapeSquareVideo.hidden = true;
        squareTvLessonImage.hidden = false;
        if (squareTvMascot) squareTvMascot.hidden = false;
        if (squareTvQuestionPanel) squareTvQuestionPanel.hidden = false;
        setShapeSquarePlayButtonVisible(false);
        setShapeSquareSkipButtonVisible(false);
        setShapeSquareVideoStageVisible(true);
        shapeSquarePage.classList.add('is-tv-lesson-image-visible');
    };

    const finishShapeSquareLesson = () => {
        startShapeSquareMissionGuide();
    };

    const showShapeSquareFinalMessage = () => {
        if (!shapeSquarePage || !isPageVisible(shapeSquarePage)) return;

        clearShapeSquareTimers();
        stopShapeSquareIntroAudio();
        stopShapeSquareMissionAudio();
        stopShapeSquareReadyAudio();
        resetShapeSquareLessonVideo();
        shapeSquareSession += 1;
        shapeSquareStartButton?.classList.remove('is-clicking');
        if (shapeSquareStartButton) shapeSquareStartButton.hidden = false;
        shapeSquarePage?.classList.remove('is-transitioning-to-illustration', 'is-preparing-illustration-background');

        [shapeSquareCharacter3, shapeSquareCharacter9, shapeSquareCharacter4, shapeSquareCharacter5].forEach((character) => {
            if (!character) return;
            character.hidden = true;
            character.classList.remove('is-entering', 'is-exiting');
        });

        if (shapeSquareCharacter5) {
            shapeSquareCharacter5.hidden = false;
            shapeSquareCharacter5.getBoundingClientRect();
            shapeSquareCharacter5.classList.add('is-entering');
        }

        if (shapeSquareBubble) {
            shapeSquareBubble.classList.remove('is-ch9', 'is-ch4', 'is-entering', 'is-exiting', 'is-message-changing');
            shapeSquareBubble.classList.add('is-ch5');
            shapeSquareBubble.getBoundingClientRect();
            shapeSquareBubble.classList.add('is-entering');
        }
        if (shapeSquareBubbleText) {
            shapeSquareBubbleText.textContent = shapeSquareReadyMessage;
        }
        if (shapeSquareBgImage) {
            shapeSquareBgImage.src = shapeSquareAreaBackgroundSource;
        }
        shapeSquarePage.classList.remove('is-illustration-background');
    };

    const transitionBackToShapeSquareArea = () => {
        if (!shapeSquarePage?.classList.contains('is-illustration-background')) return false;

        const runWithLoading = getAppLoadingTransition();
        if (typeof runWithLoading === 'function') {
            runWithLoading(showShapeSquareFinalMessage);
            return true;
        }

        showShapeSquareFinalMessage();
        return true;
    };

    const resetShapeSquareScene = () => {
        clearShapeSquareTimers();
        stopShapeSquareIntroAudio();
        stopShapeSquareMissionAudio();
        stopShapeSquareReadyAudio();
        resetShapeSquareLessonVideo();
        shapeSquareSession += 1;
        if (shapeSquareStartPressTimer !== null) {
            window.clearTimeout(shapeSquareStartPressTimer);
            shapeSquareStartPressTimer = null;
        }
        shapeSquareStartButton?.classList.remove('is-clicking');
        if (shapeSquareStartButton) shapeSquareStartButton.hidden = true;
        shapeSquarePage?.classList.remove('is-transitioning-to-illustration', 'is-preparing-illustration-background');

        if (shapeSquareCharacter3) {
            shapeSquareCharacter3.hidden = false;
            shapeSquareCharacter3.classList.remove('is-entering', 'is-exiting');
        }
        if (shapeSquareCharacter9) {
            shapeSquareCharacter9.hidden = true;
            shapeSquareCharacter9.classList.remove('is-entering', 'is-exiting');
        }
        if (shapeSquareCharacter4) {
            shapeSquareCharacter4.hidden = true;
            shapeSquareCharacter4.classList.remove('is-entering', 'is-exiting');
        }
        if (shapeSquareCharacter5) {
            shapeSquareCharacter5.hidden = true;
            shapeSquareCharacter5.classList.remove('is-entering', 'is-exiting');
        }
        if (shapeSquareBubble) {
            shapeSquareBubble.classList.remove('is-ch9', 'is-ch4', 'is-ch5', 'is-entering', 'is-exiting', 'is-message-changing');
        }
        if (shapeSquareBubbleText) {
            shapeSquareBubbleText.textContent = shapeSquareWelcomeMessage;
        }
        if (shapeSquareBgImage) {
            shapeSquareBgImage.src = shapeSquareAreaBackgroundSource;
        }
        shapeSquarePage?.classList.remove('is-illustration-background');
    };

    const showShapeSquareIllustration = () => {
        if (!shapeSquarePage || !isPageVisible(shapeSquarePage)) return;

        clearShapeSquareTimers();
        stopShapeSquareIntroAudio();
        stopShapeSquareMissionAudio();
        stopShapeSquareReadyAudio();
        shapeSquareSession += 1;
        shapeSquareStartButton?.classList.remove('is-clicking');
        if (shapeSquareStartButton) shapeSquareStartButton.hidden = true;
        shapeSquarePage.classList.remove('is-transitioning-to-illustration', 'is-preparing-illustration-background');
        if (shapeSquareBgImage) {
            shapeSquareBgImage.src = shapeSquareIllustrationBackgroundSource;
        }
        resetShapeSquareLessonVideo();
        shapeSquarePage.classList.add('is-illustration-background');
        setShapeSquareVideoStageVisible(true);
    };

    const transitionToShapeSquareIllustration = () => {
        if (!shapeSquarePage || !isPageVisible(shapeSquarePage)) return false;
        if (shapeSquareStartPressTimer !== null) return true;

        const illustrationPreloader = window.Image ? new window.Image() : null;
        if (illustrationPreloader) {
            illustrationPreloader.src = shapeSquareIllustrationBackgroundSource;
        }
        shapeSquareVideo?.load?.();

        const revealIllustration = () => {
            shapeSquareStartPressTimer = null;
            if (!shapeSquarePage || !isPageVisible(shapeSquarePage)) return;
            showShapeSquareIllustration();
        };

        const runWithLoading = getAppLoadingTransition();
        if (typeof runWithLoading === 'function') {
            shapeSquareStartPressTimer = -1;
            const didStartLoading = runWithLoading(revealIllustration);
            if (didStartLoading !== false) {
                return true;
            }
            shapeSquareStartPressTimer = null;
        }

        shapeSquareStartPressTimer = window.setTimeout(revealIllustration, 1000);
        shapeSquareTimers.push(shapeSquareStartPressTimer);
        return true;
    };

    const getShapePreviewIntroState = (page) => {
        if (shapePreviewIntroStates.has(page)) return shapePreviewIntroStates.get(page);

        const background = page.querySelector('.shape-area-bg');
        const startButton = page.querySelector('.shape-area-preview-start-button');
        const characterSpecs = [
            { role: 'welcome', source: 'assets/Character/ch6.webp', extraClass: '' },
            { role: 'success', source: 'assets/Character/ch9.webp', extraClass: 'shape-area-square-character-ch9' },
            { role: 'next', source: 'assets/Character/ch14.webp', extraClass: 'shape-area-square-character-next' },
            { role: 'ready', source: 'assets/Character/ch5.webp', extraClass: '' },
        ];
        const characters = {};
        const fragment = document.createDocumentFragment();
        characterSpecs.forEach((spec, index) => {
            const character = document.createElement('img');
            character.className = `shape-area-square-character shape-preview-intro-character ${spec.extraClass}`.trim();
            character.src = spec.source;
            character.alt = '';
            character.setAttribute('aria-hidden', 'true');
            character.hidden = index !== 0;
            characters[spec.role] = character;
            fragment.appendChild(character);
        });

        const bubble = document.createElement('div');
        bubble.className = 'shape-area-square-speech-bubble shape-preview-intro-bubble';
        bubble.setAttribute('role', 'status');
        bubble.setAttribute('aria-live', 'polite');
        const bubbleText = document.createElement('span');
        bubbleText.className = 'shape-intro-bubble-text';
        bubbleText.textContent = shapeSquareWelcomeMessage;
        bubble.appendChild(bubbleText);
        const dots = document.createElement('span');
        dots.className = 'shape-intro-message-dots';
        dots.setAttribute('aria-hidden', 'true');
        dots.innerHTML = '<i>.</i><i>.</i><i>.</i>';
        bubble.appendChild(dots);
        fragment.appendChild(bubble);
        background?.after(fragment);

        const state = {
            session: 0,
            timers: [],
            audio: null,
            frame: null,
            usesMissionAudio: false,
            activeStage: 0,
            characters,
            bubble,
            bubbleText,
            dots,
            startButton,
        };
        shapePreviewIntroStates.set(page, state);
        return state;
    };

    const stopShapePreviewIntro = (page) => {
        const state = getShapePreviewIntroState(page);
        state.session += 1;
        state.timers.forEach((timerId) => window.clearTimeout(timerId));
        state.timers = [];
        if (state.frame !== null) {
            window.cancelAnimationFrame(state.frame);
            state.frame = null;
        }
        if (state.audio) {
            state.audio.onended = null;
            state.audio.pause?.();
            state.audio = null;
        }
        if (state.usesMissionAudio) {
            stopShapeMissionCompletionAudio();
            state.usesMissionAudio = false;
        }
        Object.entries(state.characters).forEach(([role, character]) => {
            character.hidden = role !== 'welcome';
            character.classList.remove('is-entering', 'is-exiting');
        });
        state.bubble.classList.remove('is-ch9', 'is-ch4', 'is-ch5', 'is-entering', 'is-exiting', 'is-message-changing');
        state.bubbleText.textContent = shapeSquareWelcomeMessage;
        state.activeStage = 0;
        if (state.startButton) state.startButton.hidden = true;
        page.classList.remove('is-preview-intro-active', 'is-intro-click-ready');
    };

    const startShapePreviewIntro = (page) => {
        if (!page || !isPageVisible(page) || page.classList.contains('is-illustration-background')) return;

        stopShapePreviewIntro(page);
        const state = getShapePreviewIntroState(page);
        const session = state.session;
        const completedShape = String(page.dataset.completedShape || '').trim().toLowerCase();
        const completedShapeLabel = completedShape.charAt(0).toUpperCase() + completedShape.slice(1);
        const stages = [
            { role: 'welcome', bubbleClass: null, message: shapeSquareWelcomeMessage },
            { role: 'success', bubbleClass: 'is-ch9', message: `Matagumpay mong natapos ang ${completedShapeLabel} Mission!` },
            { role: 'success', bubbleClass: 'is-ch9', message: shapeSquareCelebrationMessages[1] },
            { role: 'next', bubbleClass: 'is-ch4', message: shapeSquareNextShapeMessage },
            { role: 'ready', bubbleClass: 'is-ch5', message: shapeSquareReadyMessage },
        ];
        page.classList.add('is-preview-intro-active');
        state.characters.welcome.getBoundingClientRect();
        state.characters.welcome.classList.add('is-entering');
        state.bubble.getBoundingClientRect();
        state.bubble.classList.add('is-entering');

        const showStage = (stageIndex) => {
            if (session !== state.session || !isPageVisible(page) || !stages[stageIndex]) return;
            const stage = stages[stageIndex];
            const previousRole = stages[state.activeStage]?.role || null;
            state.activeStage = stageIndex;
            if (stage.role !== previousRole) {
                Object.entries(state.characters).forEach(([role, character]) => {
                    character.hidden = role !== stage.role;
                    character.classList.remove('is-entering', 'is-exiting');
                });
                const character = state.characters[stage.role];
                character.hidden = false;
                character.getBoundingClientRect();
                character.classList.add('is-entering');
            }
            state.bubble.classList.remove('is-ch9', 'is-ch4', 'is-ch5', 'is-exiting', 'is-message-changing', 'is-message-complete', 'is-final-message');
            state.bubble.classList.toggle('is-final-message', stageIndex >= stages.length - 1);
            if (stage.bubbleClass) state.bubble.classList.add(stage.bubbleClass);
        };

        const typeMessage = (message, onComplete) => {
            let characterIndex = 0;
            state.bubbleText.textContent = '';
            const typeNextCharacter = () => {
                if (session !== state.session) return;
                characterIndex += 1;
                state.bubbleText.textContent = message.slice(0, characterIndex);
                if (characterIndex < message.length) {
                    state.timers.push(window.setTimeout(typeNextCharacter, 28));
                    return;
                }
                onComplete();
            };
            typeNextCharacter();
        };

        const playClip = (source, onEnded) => {
            if (session !== state.session) return;
            const AudioCtor = window.Audio;
            if (!AudioCtor) {
                onEnded();
                return;
            }
            const audio = new AudioCtor(source);
            state.audio = audio;
            audio.preload = 'auto';
            audio.playsInline = true;
            audio.onended = () => {
                if (session !== state.session || state.audio !== audio) return;
                state.audio = null;
                onEnded();
            };
            audio.play().catch(() => {
                if (session !== state.session || state.audio !== audio) return;
                state.audio = null;
                onEnded();
            });
        };

        const playSegment = (source, start, end, onEnded) => {
            const AudioCtor = window.Audio;
            if (!AudioCtor) {
                onEnded();
                return;
            }
            const audio = new AudioCtor(source);
            state.audio = audio;
            audio.preload = 'auto';
            audio.playsInline = true;
            try {
                audio.currentTime = start;
            } catch (error) {
                // The start point is applied once the segment begins loading.
            }
            audio.play().then(() => {
                const stopAtEnd = () => {
                    if (session !== state.session || state.audio !== audio) return;
                    if (audio.currentTime >= end || audio.ended) {
                        audio.pause();
                        state.audio = null;
                        state.frame = null;
                        onEnded();
                        return;
                    }
                    state.frame = window.requestAnimationFrame(stopAtEnd);
                };
                state.frame = window.requestAnimationFrame(stopAtEnd);
            }).catch(() => {
                if (session !== state.session || state.audio !== audio) return;
                state.audio = null;
                onEnded();
            });
        };

        const playStage = (stageIndex) => {
            if (session !== state.session || !stages[stageIndex]) return;
            showStage(stageIndex);
            page.classList.remove('is-intro-click-ready');
            let textFinished = false;
            let audioFinished = false;
            let stageComplete = false;
            let audioCompletionScheduled = false;
            const stageStartedAt = performance.now();
            const minimumAudioMs = [1200, 3000, 2400, 3600, 1200][stageIndex];
            const unlockMessage = () => {
                if (!textFinished || !audioFinished || stageComplete || session !== state.session) return;
                stageComplete = true;
                state.bubble.classList.add('is-message-complete');
                if (stageIndex >= stages.length - 1) {
                    if (state.startButton) state.startButton.hidden = false;
                    return;
                }
                playStage(stageIndex + 1);
            };
            typeMessage(stages[stageIndex].message, () => {
                textFinished = true;
                state.bubble.classList.add('is-message-complete');
                unlockMessage();
            });
            const finishAudio = () => {
                if (audioCompletionScheduled) return;
                audioCompletionScheduled = true;
                const remainingMs = Math.max(0, minimumAudioMs - (performance.now() - stageStartedAt));
                state.timers.push(window.setTimeout(() => {
                    audioFinished = true;
                    unlockMessage();
                }, remainingMs));
            };

            if (stageIndex === 0) {
                playClip(shapeSquareGreetingAudioSource, finishAudio);
            } else if (stageIndex === 1) {
                state.usesMissionAudio = true;
                playShapeMissionCompletionAudio(completedShape, () => {
                    if (session !== state.session) return;
                    state.usesMissionAudio = false;
                    finishAudio();
                });
            } else if (stageIndex === 2) {
                playSegment(shapeSquareAreaIntroAudioSource, 0, 2.4, finishAudio);
            } else if (stageIndex === 3) {
                playSegment(shapeSquareAreaIntroAudioSource, 2.5, 6.1, finishAudio);
            } else {
                playClip(shapeSquareReadyAudioSource, finishAudio);
            }
        };

        playStage(0);
    };

    const stopHeartMissionSequence = () => {
        heartMissionSession += 1;
        heartMissionTimers.forEach((timerId) => window.clearTimeout(timerId));
        heartMissionTimers = [];
        if (heartMissionAudio) {
            heartMissionAudio.onended = null;
            heartMissionAudio.onerror = null;
            heartMissionAudio.pause?.();
            try {
                heartMissionAudio.currentTime = 0;
            } catch (error) {
                // The clip may not have loaded enough to rewind yet.
            }
            heartMissionAudio = null;
        }
        heartMissionIntro?.classList.remove('is-active', 'is-message-visible', 'is-message-changing', 'is-moving-right');
        heartMissionIntro?.setAttribute('aria-hidden', 'true');
        if (heartMissionIntro) heartMissionIntro.hidden = true;
        if (heartMissionStartButton) {
            heartMissionStartButton.hidden = true;
            heartMissionStartButton.classList.remove('is-visible');
        }
        heartMissionPage?.classList.remove('is-heart-mission-active');
    };

    const playHeartMissionAudio = (source, session, fallbackDuration, onComplete) => {
        if (heartMissionAudio) {
            heartMissionAudio.onended = null;
            heartMissionAudio.onerror = null;
            heartMissionAudio.pause?.();
        }

        let completed = false;
        const finish = () => {
            if (completed || session !== heartMissionSession) return;
            completed = true;
            if (heartMissionAudio) {
                heartMissionAudio.onended = null;
                heartMissionAudio.onerror = null;
                heartMissionAudio = null;
            }
            onComplete?.();
        };
        heartMissionTimers.push(window.setTimeout(finish, fallbackDuration));
        if (!window.Audio) return;

        const audio = new window.Audio(source);
        heartMissionAudio = audio;
        audio.preload = 'auto';
        audio.playsInline = true;
        audio.volume = Math.min(1, window.__learnscapeSoundScale?.() ?? 1);
        audio.onended = finish;
        audio.onerror = finish;
        audio.load?.();
        audio.play().catch(() => {});
    };

    const startHeartMissionSequence = () => {
        if (!heartMissionPage || heartMissionPage.hidden || !heartMissionIntro || !heartMissionMessageText) return;
        stopHeartMissionSequence();
        const session = heartMissionSession;
        heartMissionPage.classList.add('is-heart-mission-active');
        heartMissionMessageText.textContent = 'Para sa ating Heart Mission, putukin ang mga lobong hugis puso!';
        heartMissionIntro.hidden = false;
        heartMissionIntro.setAttribute('aria-hidden', 'false');
        heartMissionIntro.getBoundingClientRect();
        heartMissionTimers.push(window.setTimeout(() => {
            if (session !== heartMissionSession || heartMissionPage.hidden) return;
            heartMissionIntro.classList.add('is-active');
        }, 80));

        heartMissionTimers.push(window.setTimeout(() => {
            if (session !== heartMissionSession || heartMissionPage.hidden) return;
            heartMissionIntro.classList.add('is-message-visible');
            playHeartMissionAudio('assets/Audios/Voice over/heartmission.mp3', session, 8000, () => {
                if (session !== heartMissionSession || heartMissionPage.hidden) return;
                heartMissionIntro.classList.add('is-message-changing');
                heartMissionTimers.push(window.setTimeout(() => {
                    if (session !== heartMissionSession || heartMissionPage.hidden) return;
                    heartMissionMessageText.textContent = 'Handa ka na ba?';
                    heartMissionIntro.classList.remove('is-message-changing');
                    playHeartMissionAudio('assets/Audios/Voice over/Handa ka na ba.mp3', session, 4000, () => {
                        if (session !== heartMissionSession || heartMissionPage.hidden) return;
                        heartMissionIntro.classList.add('is-moving-right');
                        heartMissionTimers.push(window.setTimeout(() => {
                            if (session !== heartMissionSession || heartMissionPage.hidden || !heartMissionStartButton) return;
                            heartMissionStartButton.hidden = false;
                            heartMissionStartButton.getBoundingClientRect();
                            heartMissionStartButton.classList.add('is-visible');
                        }, 1800));
                    });
                }, 320));
            });
        }, 1950));
    };

    const stopStarMissionSequence = () => {
        starMissionSession += 1;
        starMissionTimers.forEach((timerId) => window.clearTimeout(timerId));
        starMissionTimers = [];
        if (starMissionAudio) {
            starMissionAudio.onended = null;
            starMissionAudio.onerror = null;
            starMissionAudio.pause?.();
            try {
                starMissionAudio.currentTime = 0;
            } catch (error) {
                // Some browsers block resetting before metadata is ready.
            }
            starMissionAudio = null;
        }
        starMissionIntro?.classList.remove('is-active', 'is-message-visible', 'is-message-changing', 'is-ready-message', 'is-fading-out', 'is-retry');
        starMissionIntro?.setAttribute('aria-hidden', 'true');
        if (starMissionIntro) starMissionIntro.hidden = true;
        if (starMissionStartButton) {
            starMissionStartButton.hidden = true;
            starMissionStartButton.classList.remove('is-visible');
        }
    };

    const playStarMissionAudio = (source, session, fallbackDuration, onComplete) => {
        if (starMissionAudio) {
            starMissionAudio.onended = null;
            starMissionAudio.onerror = null;
            starMissionAudio.pause?.();
        }

        let completed = false;
        const finish = () => {
            if (completed || session !== starMissionSession) return;
            completed = true;
            if (starMissionAudio) {
                starMissionAudio.onended = null;
                starMissionAudio.onerror = null;
                starMissionAudio = null;
            }
            onComplete?.();
        };
        starMissionTimers.push(window.setTimeout(finish, fallbackDuration));
        if (!window.Audio) return;

        const audio = new window.Audio(source);
        starMissionAudio = audio;
        audio.preload = 'auto';
        audio.playsInline = true;
        audio.volume = Math.min(1, window.__learnscapeSoundScale?.() ?? 1);
        audio.onended = finish;
        audio.onerror = finish;
        audio.load?.();
        audio.play().catch(() => {});
    };

    const startStarMissionSequence = () => {
        if (!starMissionPage || starMissionPage.hidden || !starMissionIntro || !starMissionMessageText) return;
        stopStarMissionSequence();
        const session = starMissionSession;
        starMissionIntro.classList.remove('is-ready-message');
        starMissionMessageText.textContent = 'Para sa ating Star Mission, kolektahin ang lahat ng mga bituin na nahuhulog mula sa langit.';
        starMissionIntro.hidden = false;
        starMissionIntro.setAttribute('aria-hidden', 'false');
        starMissionIntro.getBoundingClientRect();
        starMissionTimers.push(window.setTimeout(() => {
            if (session !== starMissionSession || starMissionPage.hidden) return;
            starMissionIntro.classList.add('is-active');
        }, 80));

        starMissionTimers.push(window.setTimeout(() => {
            if (session !== starMissionSession || starMissionPage.hidden) return;
            starMissionIntro.classList.add('is-message-visible');
            playStarMissionAudio('assets/Audios/Voice over/starmission.mp3', session, 9000, () => {
                if (session !== starMissionSession || starMissionPage.hidden) return;
                starMissionIntro.classList.add('is-message-changing');
                starMissionTimers.push(window.setTimeout(() => {
                    if (session !== starMissionSession || starMissionPage.hidden) return;
                    starMissionMessageText.textContent = 'Handa ka na ba?';
                    starMissionIntro.classList.remove('is-message-changing');
                    starMissionIntro.classList.add('is-ready-message');
                    playStarMissionAudio('assets/Audios/Voice over/Handa ka na ba.mp3', session, 4000, () => {
                        if (session !== starMissionSession || starMissionPage.hidden || !starMissionStartButton) return;
                        starMissionTimers.push(window.setTimeout(() => {
                            if (session !== starMissionSession || starMissionPage.hidden) return;
                            starMissionIntro.classList.add('is-fading-out');
                            starMissionTimers.push(window.setTimeout(() => {
                                if (session !== starMissionSession || starMissionPage.hidden) return;
                                starMissionStartButton.hidden = false;
                                starMissionStartButton.getBoundingClientRect();
                                starMissionStartButton.classList.add('is-visible');
                            }, 500));
                        }, 650));
                    });
                }, 320));
            });
        }, 950));
    };

    const diamondBatDiamondPaths = [
        'M92 20V80H8Z',
        'M8 20L92 80H8Z',
        'M8 20H92V80Z',
        'M8 20H92L8 80Z',
    ];
    const diamondBatFlightSpeeds = [
        { name: 'slow', duration: 13 },
        { name: 'normal', duration: 9 },
        { name: 'fast', duration: 6 },
    ];
    const diamondBatDecoys = [
        { name: 'circle', path: 'M16 84V20A64 64 0 0 1 80 84Z', color: '#f7b4ca' },
        { name: 'square', path: 'M18 18H82V82H18Z', color: '#f8d677' },
        { name: 'triangle', path: 'M18 82H82L18 30Z', color: '#a9d894' },
        { name: 'rectangle', path: 'M14 29H86V71H14Z', color: '#f4b784' },
        { name: 'oval', path: 'M18 84V31A62 38 0 0 1 82 84Z', color: '#bcb2f5' },
        { name: 'heart', path: 'M17 82V43C17 15 57 10 73 37C83 53 64 68 50 82Z', color: '#f4a5b8' },
        { name: 'star', path: 'M15 82L29 47L46 56L57 16L70 51L87 64L61 82Z', color: '#c6dc83' },
    ];

    const resetDiamondMissionBats = () => {
        diamondMissionPaused = false;
        diamondMissionGame?.classList.remove('is-paused');
        if (diamondMissionPauseOverlay) diamondMissionPauseOverlay.hidden = true;
        if (diamondMissionPauseButton) {
            diamondMissionPauseButton.hidden = true;
            diamondMissionPauseButton.setAttribute('aria-pressed', 'false');
            diamondMissionPauseButton.setAttribute('aria-label', 'Pause diamond game');
        }
        if (diamondMissionRevealAudioFrame !== null) {
            window.cancelAnimationFrame(diamondMissionRevealAudioFrame);
            diamondMissionRevealAudioFrame = null;
        }
        if (diamondMissionRevealAudio) {
            diamondMissionRevealAudio.pause();
            diamondMissionRevealAudio = null;
        }
        if (diamondMissionBatInterval !== null) window.clearInterval(diamondMissionBatInterval);
        diamondMissionBatInterval = null;
        diamondMissionBatSequence = 0;
        diamondMissionDecoyIndex = 0;
        diamondMissionRevealStarted = false;
        diamondMissionCollectedPieces.clear();
        diamondMissionBatLayer?.replaceChildren();
        diamondMissionGame?.querySelectorAll('.diamond-mission-flying-piece').forEach((piece) => {
            piece.getAnimations().forEach((animation) => animation.cancel());
            piece.remove();
        });
        diamondMissionStorageSlots.forEach((slot) => slot.classList.remove('is-filled'));
        diamondMissionStorage?.classList.remove('is-complete');
        diamondMissionStorage?.setAttribute('aria-label', 'Storage board with four empty pieces of a diamond');
        diamondMissionGame?.classList.remove('is-revealing');
        if (diamondMissionReveal) {
            diamondMissionReveal.hidden = true;
            diamondMissionReveal.classList.remove('is-transforming');
            diamondMissionReveal.removeAttribute('style');
        }
    };

    const startDiamondMissionCelebration = (session) => {
        if (session !== diamondMissionSession || diamondMissionPage?.hidden) return;
        if (diamondMissionGame) {
            diamondMissionGame.hidden = true;
            diamondMissionGame.classList.remove('is-active');
        }
        prepareMissionConfetti(diamondMissionConfetti, ['#8aeaff', '#d8faff', '#ffffff', '#ffe86e', '#9bdbff']);
        diamondMissionCelebration?.setAttribute('aria-hidden', 'false');
        diamondMissionCelebration?.classList.add('is-active');
        diamondMissionCompletedAudio = playStarMissionOneShot(STAR_MISSION_COMPLETED_AUDIO_SOURCE);
        diamondMissionCelebrationAudio = playStarMissionOneShot(STAR_MISSION_CELEBRATION_AUDIO_SOURCE);
        diamondMissionTimers.push(window.setTimeout(() => {
            if (session !== diamondMissionSession || diamondMissionPage?.hidden) return;
            diamondMissionKidsCheeringAudio = playStarMissionOneShot(STAR_MISSION_KIDS_CHEERING_AUDIO_SOURCE);
        }, 750));
        diamondMissionTimers.push(window.setTimeout(() => showDiamondMissionRewardProgress(session), DIAMOND_MISSION_PROGRESS_DELAY_MS));
    };

    const startDiamondMissionReveal = (session) => {
        if (!diamondMissionReveal || !diamondMissionGame || diamondMissionRevealStarted) return;
        diamondMissionRevealStarted = true;
        diamondMissionTimers.push(window.setTimeout(() => {
            if (session !== diamondMissionSession || diamondMissionPage?.hidden) return;
            const gameRect = diamondMissionGame.getBoundingClientRect();
            const slotRects = diamondMissionStorageSlots.map((slot) => slot.getBoundingClientRect());
            const left = Math.min(...slotRects.map((rect) => rect.left));
            const top = Math.min(...slotRects.map((rect) => rect.top));
            const right = Math.max(...slotRects.map((rect) => rect.right));
            const bottom = Math.max(...slotRects.map((rect) => rect.bottom));
            const diamondWidth = right - left;
            const diamondHeight = bottom - top;

            diamondMissionReveal.style.left = `${left - gameRect.left + diamondWidth / 2}px`;
            diamondMissionReveal.style.top = `${top - gameRect.top + diamondHeight / 2}px`;
            diamondMissionReveal.style.width = `${diamondWidth}px`;
            diamondMissionReveal.style.height = `${diamondHeight}px`;
            diamondMissionReveal.hidden = false;
            diamondMissionReveal.getBoundingClientRect();
            diamondMissionGame.classList.add('is-revealing');
            diamondMissionReveal.style.left = `${gameRect.width / 2}px`;
            diamondMissionReveal.style.top = `${gameRect.height / 2}px`;

            diamondMissionTimers.push(window.setTimeout(() => {
                if (session !== diamondMissionSession || diamondMissionPage?.hidden) return;
                const crystalWidth = Math.min(260, gameRect.width * 0.3, gameRect.height * 0.45);
                const crystalHeight = crystalWidth * (610 / 375);
                diamondMissionReveal.style.width = `${crystalWidth}px`;
                diamondMissionReveal.style.height = `${crystalHeight}px`;
                diamondMissionReveal.classList.add('is-transforming');
                if (window.Audio) {
                    const audio = new window.Audio(DIAMOND_MISSION_REVEAL_AUDIO_SOURCE);
                    const startVolume = Math.min(1, window.__learnscapeSoundScale?.() ?? 1);
                    const revealStartedAt = performance.now();
                    diamondMissionRevealAudio = audio;
                    audio.volume = startVolume;
                    audio.play().catch(() => {});
                    const updateVolume = (now) => {
                        if (session !== diamondMissionSession || diamondMissionRevealAudio !== audio) return;
                        const remaining = DIAMOND_MISSION_REVEAL_DURATION_MS - (now - revealStartedAt);
                        if (remaining <= 0) {
                            audio.pause();
                            diamondMissionRevealAudio = null;
                            diamondMissionRevealAudioFrame = null;
                            return;
                        }
                        audio.volume = startVolume * Math.min(1, remaining / DIAMOND_MISSION_REVEAL_FADE_MS);
                        diamondMissionRevealAudioFrame = window.requestAnimationFrame(updateVolume);
                    };
                    diamondMissionRevealAudioFrame = window.requestAnimationFrame(updateVolume);
                    diamondMissionTimers.push(window.setTimeout(() => {
                        if (diamondMissionRevealAudio !== audio) return;
                        audio.pause();
                        diamondMissionRevealAudio = null;
                        if (diamondMissionRevealAudioFrame !== null) window.cancelAnimationFrame(diamondMissionRevealAudioFrame);
                        diamondMissionRevealAudioFrame = null;
                    }, DIAMOND_MISSION_REVEAL_DURATION_MS));
                }
                diamondMissionTimers.push(window.setTimeout(() => startDiamondMissionCelebration(session), DIAMOND_MISSION_CELEBRATION_DELAY_MS));
            }, 2150));
        }, 550));
    };

    const releaseDiamondBatPiece = (piece, slotIndex, session) => {
        if (!diamondMissionGame) return;
        const gameRect = diamondMissionGame.getBoundingClientRect();
        const pieceRect = piece.getBoundingClientRect();
        const flyingPiece = piece.cloneNode(true);
        flyingPiece.setAttribute('class', 'diamond-mission-flying-piece');
        flyingPiece.style.left = `${pieceRect.left - gameRect.left}px`;
        flyingPiece.style.top = `${pieceRect.top - gameRect.top}px`;
        flyingPiece.style.width = `${pieceRect.width}px`;
        flyingPiece.style.height = `${pieceRect.height}px`;
        diamondMissionGame.append(flyingPiece);
        piece.style.visibility = 'hidden';

        const slotRect = slotIndex >= 0 ? diamondMissionStorageSlots[slotIndex]?.getBoundingClientRect() : null;
        const endX = slotRect
            ? slotRect.left + slotRect.width / 2 - pieceRect.left - pieceRect.width / 2
            : (Math.random() - 0.5) * 90;
        const endY = slotRect
            ? slotRect.top + slotRect.height / 2 - pieceRect.top - pieceRect.height / 2
            : gameRect.bottom - pieceRect.top + pieceRect.height + 20;
        const slotScale = slotRect
            ? Math.min(slotRect.width / (pieceRect.width * 0.84), slotRect.height / (pieceRect.height * 0.6))
            : 1;
        const frames = slotRect
            ? [
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { transform: `translate(${endX}px, ${endY}px) scale(${slotScale})`, opacity: 1, offset: 0.82 },
                { transform: `translate(${endX}px, ${endY}px) scale(${slotScale})`, opacity: 0 },
            ]
            : [
                { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
                { transform: `translate(${endX}px, ${endY}px) rotate(145deg)`, opacity: 1, offset: 0.75 },
                { transform: `translate(${endX}px, ${endY}px) rotate(175deg)`, opacity: 0 },
            ];
        const flight = flyingPiece.animate(frames, {
            duration: slotRect ? 650 : 720,
            easing: slotRect ? 'cubic-bezier(0.22, 0.8, 0.24, 1)' : 'ease-in',
            fill: 'forwards',
        });
        flight.onfinish = () => {
            flyingPiece.remove();
            if (!slotRect || session !== diamondMissionSession || diamondMissionPage?.hidden) return;
            diamondMissionStorageSlots[slotIndex]?.classList.add('is-filled');
            if (diamondMissionCollectedPieces.size === 4 && diamondMissionStorageSlots.every((slot) => slot.classList.contains('is-filled'))) {
                diamondMissionStorage?.classList.add('is-complete');
                if (diamondMissionBatInterval !== null) window.clearInterval(diamondMissionBatInterval);
                diamondMissionBatInterval = null;
                diamondMissionBatLayer?.replaceChildren();
                startDiamondMissionReveal(session);
            }
        };
    };

    const sendDiamondBatAway = (bat) => {
        if (!diamondMissionGame) return;
        const gameRect = diamondMissionGame.getBoundingClientRect();
        const batRect = bat.getBoundingClientRect();
        const fliesLeft = bat.classList.contains('is-flying-left');
        bat.style.animation = 'none';
        bat.style.left = `${batRect.left - gameRect.left}px`;
        bat.style.top = `${batRect.top - gameRect.top}px`;
        bat.style.transform = 'none';
        bat.classList.add('is-exiting');
        const distance = fliesLeft
            ? -(batRect.right - gameRect.left + batRect.width)
            : gameRect.right - batRect.left + batRect.width;
        const exit = bat.animate([
            { transform: 'translateX(0)' },
            { transform: `translateX(${distance}px)` },
        ], { duration: 480, easing: 'cubic-bezier(0.55, 0, 1, 0.55)', fill: 'forwards' });
        exit.onfinish = () => bat.remove();
    };

    const spawnDiamondMissionBat = (guaranteeDiamond = false) => {
        if (!diamondMissionBatLayer || diamondMissionPage?.hidden || !diamondMissionGame?.classList.contains('is-active') || diamondMissionCollectedPieces.size === 4) return;
        if (diamondMissionBatLayer.childElementCount >= 5) return;

        const flyingPieces = new Set(Array.from(diamondMissionBatLayer.querySelectorAll('[data-diamond-slot]'), (bat) => Number(bat.dataset.diamondSlot)));
        const availablePieces = diamondBatDiamondPaths.map((_, index) => index).filter((index) => !diamondMissionCollectedPieces.has(index) && !flyingPieces.has(index));
        const carryDiamond = availablePieces.length > 0 && (guaranteeDiamond || Math.random() < 0.65);
        const slotIndex = carryDiamond ? availablePieces[Math.floor(Math.random() * availablePieces.length)] : -1;
        const decoy = slotIndex < 0 ? diamondBatDecoys[diamondMissionDecoyIndex++ % diamondBatDecoys.length] : null;
        const bat = document.createElement('button');
        bat.type = 'button';
        bat.className = 'diamond-mission-bat';
        bat.setAttribute('aria-label', slotIndex >= 0 ? 'Catch a diamond piece' : `Bat carrying ${decoy.name === 'oval' ? 'an' : 'a'} ${decoy.name} piece`);
        bat.style.setProperty('--bat-top', `${[10, 20, 30, 40, 50][diamondMissionBatSequence % 5]}%`);
        const flightSpeed = diamondBatFlightSpeeds[diamondMissionBatSequence % diamondBatFlightSpeeds.length];
        bat.dataset.speed = flightSpeed.name;
        bat.style.setProperty('--bat-duration', `${flightSpeed.duration}s`);
        if (diamondMissionBatSequence % 2 === 1) bat.classList.add('is-flying-left');
        diamondMissionBatSequence += 1;
        if (slotIndex >= 0) bat.dataset.diamondSlot = String(slotIndex);

        const body = document.createElement('span');
        body.className = 'diamond-mission-bat-body';
        const image = document.createElement('img');
        image.className = 'diamond-mission-bat-image';
        image.src = 'assets/Character/bat.webp';
        image.alt = '';
        image.draggable = false;
        const piece = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        piece.setAttribute('class', 'diamond-mission-bat-piece');
        if (slotIndex === 0) piece.classList.add('is-upper-left');
        if (slotIndex === 1) piece.classList.add('is-upper-right');
        piece.setAttribute('viewBox', '0 0 100 100');
        piece.setAttribute('aria-hidden', 'true');
        const piecePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        piecePath.setAttribute('d', slotIndex >= 0 ? diamondBatDiamondPaths[slotIndex] : decoy.path);
        piecePath.setAttribute('fill', slotIndex >= 0 ? '#52cfee' : decoy.color);
        piecePath.setAttribute('stroke', '#ffffff');
        piecePath.setAttribute('stroke-width', slotIndex >= 0 ? '4' : '5');
        if (slotIndex >= 0) piecePath.setAttribute('vector-effect', 'non-scaling-stroke');
        piecePath.setAttribute('stroke-linejoin', 'round');
        piece.append(piecePath);
        body.append(piece, image);
        bat.append(body);

        bat.addEventListener('click', () => {
            if (bat.disabled || diamondMissionPage.hidden || diamondMissionCollectedPieces.size === 4) return;
            bat.disabled = true;
            const session = diamondMissionSession;
            releaseDiamondBatPiece(piece, slotIndex, session);
            sendDiamondBatAway(bat);
            if (slotIndex >= 0 && !diamondMissionCollectedPieces.has(slotIndex)) {
                diamondMissionCollectedPieces.add(slotIndex);
                diamondMissionStorage?.setAttribute('aria-label', `Storage board with ${diamondMissionCollectedPieces.size} of 4 diamond pieces found`);
                playUiClickSound('chime');
                if (diamondMissionCollectedPieces.size === 4) {
                    if (diamondMissionPauseButton) diamondMissionPauseButton.hidden = true;
                    if (diamondMissionBatInterval !== null) window.clearInterval(diamondMissionBatInterval);
                    diamondMissionBatInterval = null;
                    diamondMissionBatLayer.querySelectorAll('.diamond-mission-bat').forEach((flyingBat) => {
                        if (flyingBat === bat) return;
                        flyingBat.classList.add('is-caught');
                        window.setTimeout(() => flyingBat.remove(), 350);
                    });
                }
            }
        });
        bat.addEventListener('animationend', (event) => {
            if (event.target === bat) bat.remove();
        });
        diamondMissionBatLayer.append(bat);
    };

    const startDiamondMissionBats = () => {
        resetDiamondMissionBats();
        if (diamondMissionPauseButton) diamondMissionPauseButton.hidden = false;
        spawnDiamondMissionBat(true);
        diamondMissionBatInterval = window.setInterval(spawnDiamondMissionBat, 1450);
    };

    const setDiamondMissionPaused = (paused) => {
        if (!diamondMissionGame?.classList.contains('is-active')
            || diamondMissionRevealStarted
            || diamondMissionCollectedPieces.size >= 4) paused = false;
        if (diamondMissionPaused === paused) return;
        diamondMissionPaused = paused;
        diamondMissionGame.classList.toggle('is-paused', paused);
        if (diamondMissionPauseOverlay) diamondMissionPauseOverlay.hidden = !paused;
        if (diamondMissionPauseButton) {
            diamondMissionPauseButton.setAttribute('aria-pressed', paused ? 'true' : 'false');
            diamondMissionPauseButton.setAttribute('aria-label', paused ? 'Resume diamond game' : 'Pause diamond game');
        }

        if (paused) {
            if (diamondMissionBatInterval !== null) window.clearInterval(diamondMissionBatInterval);
            diamondMissionBatInterval = null;
            diamondMissionGame.getAnimations({ subtree: true }).forEach((animation) => animation.pause());
            diamondMissionBatLayer?.querySelectorAll('.diamond-mission-bat').forEach((bat) => {
                bat.disabled = true;
            });
            return;
        }

        diamondMissionGame.getAnimations({ subtree: true }).forEach((animation) => animation.play());
        diamondMissionBatLayer?.querySelectorAll('.diamond-mission-bat').forEach((bat) => {
            if (!bat.classList.contains('is-caught') && !bat.classList.contains('is-exiting')) bat.disabled = false;
        });
        if (diamondMissionBatInterval === null && diamondMissionCollectedPieces.size < 4) {
            diamondMissionBatInterval = window.setInterval(spawnDiamondMissionBat, 1450);
        }
    };

    const stopDiamondMissionSequence = () => {
        diamondMissionSession += 1;
        diamondMissionTimers.forEach((timerId) => window.clearTimeout(timerId));
        diamondMissionTimers = [];
        resetDiamondMissionBats();
        diamondMissionCompletedAudio = stopStarMissionAudio(diamondMissionCompletedAudio);
        diamondMissionCelebrationAudio = stopStarMissionAudio(diamondMissionCelebrationAudio);
        diamondMissionKidsCheeringAudio = stopStarMissionAudio(diamondMissionKidsCheeringAudio);
        diamondMissionCelebration?.classList.remove('is-active');
        diamondMissionCelebration?.setAttribute('aria-hidden', 'true');
        if (diamondMissionAudio) {
            diamondMissionAudio.onended = null;
            diamondMissionAudio.onerror = null;
            diamondMissionAudio.pause?.();
            try {
                diamondMissionAudio.currentTime = 0;
            } catch (error) {
                // Audio can still be loading while the route changes.
            }
            diamondMissionAudio = null;
        }
        diamondMissionGuide?.classList.remove('is-active', 'is-message-visible', 'is-message-changing', 'is-ready-message', 'is-exiting');
        diamondMissionGuide?.setAttribute('aria-hidden', 'true');
        if (diamondMissionGuide) diamondMissionGuide.hidden = true;
        if (diamondMissionMessageText) diamondMissionMessageText.textContent = '';
        if (diamondMissionStartButton) {
            diamondMissionStartButton.hidden = true;
            diamondMissionStartButton.classList.remove('is-visible');
        }
        if (diamondMissionBlackout) {
            diamondMissionBlackout.hidden = true;
            diamondMissionBlackout.classList.remove('is-visible');
        }
        if (diamondMissionGame) {
            diamondMissionGame.hidden = true;
            diamondMissionGame.classList.remove('is-active');
        }
        diamondMissionPage?.classList.remove('is-diamond-game-active');
    };

    const playDiamondMissionAudio = (source, session, fallbackDuration, onComplete) => {
        if (diamondMissionAudio) {
            diamondMissionAudio.onended = null;
            diamondMissionAudio.onerror = null;
            diamondMissionAudio.pause?.();
        }

        let completed = false;
        const finish = () => {
            if (completed || session !== diamondMissionSession) return;
            completed = true;
            if (diamondMissionAudio) {
                diamondMissionAudio.onended = null;
                diamondMissionAudio.onerror = null;
                diamondMissionAudio = null;
            }
            onComplete?.();
        };
        diamondMissionTimers.push(window.setTimeout(finish, fallbackDuration));
        if (!window.Audio) return;

        const audio = new window.Audio(source);
        diamondMissionAudio = audio;
        audio.preload = 'auto';
        audio.playsInline = true;
        audio.volume = Math.min(1, window.__learnscapeSoundScale?.() ?? 1);
        audio.onended = finish;
        audio.onerror = finish;
        audio.load?.();
        audio.play().catch(() => {});
    };

    const startDiamondMissionSequence = () => {
        if (!diamondMissionPage || diamondMissionPage.hidden || !diamondMissionGuide || !diamondMissionMessageText) return;
        stopDiamondMissionSequence();
        const session = diamondMissionSession;
        diamondMissionMessageText.textContent = 'Para sa ating Diamond Mission, buuin ang hugis na nasa puzzle sa pamamagitan ng paghahanap ng mga parte neto sa kweba.';
        diamondMissionGuide.hidden = false;
        diamondMissionGuide.setAttribute('aria-hidden', 'false');
        diamondMissionGuide.getBoundingClientRect();
        diamondMissionTimers.push(window.setTimeout(() => {
            if (session !== diamondMissionSession || diamondMissionPage.hidden) return;
            diamondMissionGuide.classList.add('is-active');
        }, 80));
        diamondMissionTimers.push(window.setTimeout(() => {
            if (session !== diamondMissionSession || diamondMissionPage.hidden) return;
            diamondMissionGuide.classList.add('is-message-visible');
            playDiamondMissionAudio(DIAMOND_MISSION_AUDIO_SOURCE, session, 10500, () => {
                if (session !== diamondMissionSession || diamondMissionPage.hidden) return;
                diamondMissionGuide.classList.add('is-message-changing');
                diamondMissionTimers.push(window.setTimeout(() => {
                    if (session !== diamondMissionSession || diamondMissionPage.hidden) return;
                    diamondMissionMessageText.textContent = 'Handa ka na ba?';
                    diamondMissionGuide.classList.remove('is-message-changing');
                    diamondMissionGuide.classList.add('is-ready-message');
                    playDiamondMissionAudio(DIAMOND_MISSION_READY_AUDIO_SOURCE, session, 4000, () => {
                        if (session !== diamondMissionSession || diamondMissionPage.hidden || !diamondMissionStartButton) return;
                        diamondMissionStartButton.hidden = false;
                        diamondMissionStartButton.getBoundingClientRect();
                        diamondMissionStartButton.classList.add('is-visible');
                    });
                }, 320));
            });
        }, 2550));
    };

    const showDiamondMissionRetryStart = () => {
        if (!diamondMissionPage || diamondMissionPage.hidden || !diamondMissionGuide || !diamondMissionStartButton) return;
        stopDiamondMissionSequence();
        diamondMissionGuide.hidden = false;
        diamondMissionGuide.setAttribute('aria-hidden', 'false');
        diamondMissionStartButton.hidden = false;
        diamondMissionStartButton.getBoundingClientRect();
        diamondMissionStartButton.classList.add('is-visible');
        diamondMissionStartButton.focus({ preventScroll: true });
    };

    const startDiamondMissionGame = () => {
        if (!diamondMissionPage || diamondMissionPage.hidden || !diamondMissionGuide) return;
        diamondMissionSession += 1;
        diamondMissionTimers.forEach((timerId) => window.clearTimeout(timerId));
        diamondMissionTimers = [];
        resetDiamondMissionBats();
        if (diamondMissionAudio) {
            diamondMissionAudio.onended = null;
            diamondMissionAudio.onerror = null;
            diamondMissionAudio.pause?.();
            diamondMissionAudio = null;
        }
        diamondMissionGuide.classList.remove('is-message-visible', 'is-message-changing', 'is-ready-message');
        diamondMissionGuide.classList.add('is-exiting');
        if (diamondMissionStartButton) {
            diamondMissionStartButton.classList.remove('is-visible');
            diamondMissionStartButton.hidden = true;
        }

        const blackoutTimer = window.setTimeout(() => {
            if (diamondMissionPage.hidden) return;
            if (diamondMissionBlackout) {
                diamondMissionBlackout.hidden = false;
                diamondMissionBlackout.getBoundingClientRect();
                diamondMissionBlackout.classList.add('is-visible');
            }
        }, 760);
        const gameTimer = window.setTimeout(() => {
            if (diamondMissionPage.hidden) return;
            diamondMissionPage.classList.add('is-diamond-game-active');
            if (diamondMissionGame) {
                diamondMissionGame.hidden = false;
                diamondMissionGame.getBoundingClientRect();
                diamondMissionGame.classList.add('is-active');
            }
            diamondMissionGuide.hidden = true;
            diamondMissionGuide.setAttribute('aria-hidden', 'true');
        }, 1700);
        const revealTimer = window.setTimeout(() => {
            if (diamondMissionPage.hidden) return;
            diamondMissionBlackout?.classList.remove('is-visible');
            startDiamondMissionBats();
        }, 2300);
        const cleanupTimer = window.setTimeout(() => {
            if (diamondMissionBlackout && !diamondMissionBlackout.classList.contains('is-visible')) {
                diamondMissionBlackout.hidden = true;
            }
        }, 3300);
        diamondMissionTimers.push(blackoutTimer, gameTimer, revealTimer, cleanupTimer);
    };

    const setStarMissionWalkerSprite = (source) => {
        if (!starMissionWalkerCharacter) return;
        const currentSource = starMissionWalkerCharacter.getAttribute('src') || '';
        if (currentSource === source) return;
        starMissionWalkerCharacter.src = source;
    };

    const stopStarMissionWalkAudio = () => {
        if (!starMissionWalkAudio) return;
        starMissionWalkAudio.pause();
        try {
            starMissionWalkAudio.currentTime = 0;
        } catch (error) {
            // The clip can be loading when idle begins.
        }
        starMissionWalkAudio = null;
    };

    const playStarMissionWalkAudio = () => {
        if (!window.Audio || (window.__learnscapeSoundScale?.() ?? 1) === 0) return;
        if (starMissionWalkAudio) return;
        starMissionWalkAudio = new window.Audio(STAR_MISSION_WALK_AUDIO_SOURCE);
        starMissionWalkAudio.loop = true;
        starMissionWalkAudio.preload = 'auto';
        starMissionWalkAudio.volume = Math.min(1, 1.45 * (window.__learnscapeSoundScale?.() ?? 1));
        starMissionWalkAudio.play().catch(() => {
            starMissionWalkAudio = null;
        });
    };

    const setStarMissionWalkerIdle = () => {
        if (!starMissionWalkerActive || !starMissionWalker) return;
        setStarMissionWalkerSprite('assets/Character/idle.gif');
        starMissionWalker.style.setProperty('--star-walker-facing', String(starMissionWalkerDirection));
        stopStarMissionWalkAudio();
    };

    const updateStarMissionWalkerPosition = (clientX) => {
        if (!starMissionWalkerActive || !starMissionWalker || !starMissionPage || starMissionPage.hidden) return;
        const pageRect = starMissionPage.getBoundingClientRect();
        const walkerRect = starMissionWalker.getBoundingClientRect();
        const walkerWidth = walkerRect.width || 160;
        const nextX = Math.max(0, Math.min(pageRect.width - walkerWidth, clientX - pageRect.left - (walkerWidth / 2)));
        const delta = nextX - starMissionWalkerX;
        starMissionWalkerTargetX = nextX;
        if (Math.abs(delta) > 2) {
            starMissionWalkerDirection = delta < 0 ? -1 : 1;
            starMissionWalkerX = nextX;
            starMissionWalker.style.setProperty('--star-walker-x', `${starMissionWalkerX}px`);
            starMissionWalker.style.setProperty('--star-walker-facing', String(starMissionWalkerDirection));
            setStarMissionWalkerSprite('assets/Character/walk.gif');
            playStarMissionWalkAudio();
        }
        if (starMissionWalkerIdleTimer !== null) window.clearTimeout(starMissionWalkerIdleTimer);
        starMissionWalkerIdleTimer = window.setTimeout(setStarMissionWalkerIdle, 180);
    };

    const startStarMissionWalker = () => {
        if (!starMissionPage || !starMissionWalker || !starMissionWalkerCharacter) return;
        if (starMissionWalkerActive) stopStarMissionWalker();
        starMissionWalkerActive = true;
        const pageRect = starMissionPage.getBoundingClientRect();
        const walkerWidth = Math.max(1, starMissionWalker.getBoundingClientRect().width || 160);
        starMissionWalkerX = Math.max(0, Math.min(pageRect.width - walkerWidth, pageRect.width * 0.12));
        starMissionWalkerTargetX = starMissionWalkerX;
        starMissionWalkerDirection = 1;
        starMissionWalker.hidden = false;
        starMissionWalker.style.setProperty('--star-walker-x', `${starMissionWalkerX}px`);
        starMissionWalker.style.setProperty('--star-walker-facing', '1');
        setStarMissionWalkerSprite('assets/Character/idle.gif');
        starMissionWalker.getBoundingClientRect();
        starMissionWalker.classList.add('is-active');
        window.addEventListener('mousemove', handleStarMissionWalkerMouseMove);
    };

    const stopStarMissionWalker = () => {
        starMissionWalkerActive = false;
        if (starMissionWalkerIdleTimer !== null) window.clearTimeout(starMissionWalkerIdleTimer);
        starMissionWalkerIdleTimer = null;
        window.removeEventListener('mousemove', handleStarMissionWalkerMouseMove);
        if (starMissionWalker) {
            starMissionWalker.classList.remove('is-active');
            starMissionWalker.hidden = true;
        }
        setStarMissionWalkerSprite('assets/Character/idle.gif');
        stopStarMissionWalkAudio();
        stopStarMissionFallingShapes();
    };

    function handleStarMissionWalkerMouseMove(event) {
        updateStarMissionWalkerPosition(event.clientX);
    }

    const getStarMissionDurationMs = (target = starMissionSelectedTarget) => (
        (STAR_MISSION_TIME_BY_TARGET[target] || STAR_MISSION_TIME_BY_TARGET[5]) * 1000
    );

    const formatStarMissionTime = (milliseconds) => String(Math.max(0, Math.ceil(milliseconds / 1000)));

    const updateStarMissionHud = () => {
        if (starMissionProgressValue) {
            starMissionProgressValue.textContent = `${starMissionCollectedStars} / ${starMissionSelectedTarget}`;
        }
        if (starMissionProgressFill) {
            starMissionProgressFill.style.width = `${Math.min(100, (starMissionCollectedStars / starMissionSelectedTarget) * 100)}%`;
        }
        if (starMissionTimerValue) starMissionTimerValue.textContent = formatStarMissionTime(starMissionTimeRemainingMs);
        starMissionTimerPanel?.setAttribute('aria-label', `${formatStarMissionTime(starMissionTimeRemainingMs)} seconds remaining`);
        starMissionTimerPanel?.classList.toggle('is-urgent', starMissionGameActive && starMissionTimeRemainingMs > 0 && starMissionTimeRemainingMs <= 5000);
    };

    const showStarMissionTimerPenalty = () => {
        if (!starMissionTimerPanel) return;
        const penalty = document.createElement('span');
        penalty.className = 'star-mission-timer-penalty';
        penalty.textContent = '-1';
        penalty.setAttribute('aria-hidden', 'true');
        starMissionTimerPanel.appendChild(penalty);
        window.setTimeout(() => penalty.remove(), 850);
    };

    const showStarMissionShapePenalty = (xPixels, yPixels) => {
        if (!starMissionFallField) return;
        const penalty = document.createElement('span');
        penalty.className = 'star-shape-penalty-pop';
        penalty.textContent = '-1';
        penalty.setAttribute('aria-hidden', 'true');
        penalty.style.left = `${xPixels}px`;
        penalty.style.top = `${yPixels}px`;
        starMissionFallField.appendChild(penalty);
        const removeTimer = window.setTimeout(() => {
            penalty.remove();
            starMissionFallTimeouts.delete(removeTimer);
        }, 760);
        starMissionFallTimeouts.add(removeTimer);
    };

    const stopStarMissionTimer = () => {
        if (starMissionTimerFrame !== null) window.cancelAnimationFrame(starMissionTimerFrame);
        starMissionTimerFrame = null;
        starMissionTimerLastTick = null;
    };

    const stopStarMissionAudio = (audio) => {
        if (!audio) return null;
        audio.onended = null;
        audio.onerror = null;
        audio.pause?.();
        try {
            audio.currentTime = 0;
        } catch (error) {
            // The clip can be mid-load; pausing still stops the audible part.
        }
        return null;
    };

    const playStarMissionOneShot = (source, onEnded = null) => {
        if (!window.Audio) {
            onEnded?.();
            return null;
        }
        const audio = new window.Audio(source);
        audio.preload = 'auto';
        audio.playsInline = true;
        audio.volume = Math.min(1, window.__learnscapeSoundScale?.() ?? 1);
        audio.onended = () => onEnded?.();
        audio.onerror = () => onEnded?.();
        audio.play().catch(() => onEnded?.());
        return audio;
    };

    const stopStarMissionClockTickingAudio = () => {
        starMissionClockTickingAudio = stopStarMissionAudio(starMissionClockTickingAudio);
    };

    const syncStarMissionClockTickingAudio = () => {
        const shouldTick = starMissionGameActive && starMissionTimeRemainingMs > 0 && starMissionTimeRemainingMs <= 5000;
        if (!shouldTick) {
            stopStarMissionClockTickingAudio();
            return;
        }
        if (starMissionClockTickingAudio || !window.Audio) return;
        starMissionClockTickingAudio = new window.Audio(STAR_MISSION_CLOCK_TICKING_AUDIO_SOURCE);
        starMissionClockTickingAudio.loop = true;
        starMissionClockTickingAudio.preload = 'auto';
        starMissionClockTickingAudio.volume = Math.min(1, window.__learnscapeSoundScale?.() ?? 1);
        starMissionClockTickingAudio.play().catch(() => {
            starMissionClockTickingAudio = null;
        });
    };

    const prepareMissionConfetti = (container, colors) => {
        if (!container || container.childElementCount) return;
        for (let index = 0; index < 130; index += 1) {
            const piece = document.createElement('span');
            if (container === starMissionConfetti) piece.classList.add('is-star-confetti');
            piece.style.setProperty('--confetti-x', `${(index * 37) % 101}%`);
            piece.style.setProperty('--confetti-color', colors[index % colors.length]);
            piece.style.setProperty('--confetti-delay', `${-((index * 0.17) % 3.2)}s`);
            piece.style.setProperty('--confetti-duration', `${2.5 + ((index * 11) % 13) / 10}s`);
            piece.style.setProperty('--confetti-drift', `${((index * 29) % 150) - 75}px`);
            piece.style.setProperty('--confetti-size', `${0.35 + ((index * 5) % 13) / 10}rem`);
            container.appendChild(piece);
        }
    };

    const stopStarMissionEndFlow = () => {
        starMissionEndSession += 1;
        starMissionEndTimers.forEach((timerId) => window.clearTimeout(timerId));
        starMissionEndTimers = [];
        starMissionCompletedAudio = stopStarMissionAudio(starMissionCompletedAudio);
        starMissionCelebrationAudio = stopStarMissionAudio(starMissionCelebrationAudio);
        starMissionKidsCheeringAudio = stopStarMissionAudio(starMissionKidsCheeringAudio);
        starMissionClockTickingAudio = stopStarMissionAudio(starMissionClockTickingAudio);
        starMissionTimesUpAudio = stopStarMissionAudio(starMissionTimesUpAudio);
        starMissionLoseAudio = stopStarMissionAudio(starMissionLoseAudio);
        starMissionCelebration?.classList.remove('is-active');
        starMissionCelebration?.setAttribute('aria-hidden', 'true');
        if (starMissionTimeout) {
            starMissionTimeout.hidden = true;
            starMissionTimeout.classList.remove('is-visible', 'is-intro');
            starMissionTimeout.setAttribute('aria-hidden', 'true');
        }
        starMissionTimerPanel?.classList.remove('is-urgent');
    };

    const startStarMissionWinFlow = () => {
        if (!starMissionPage || starMissionPage.hidden) return;
        stopStarMissionTimer();
        stopStarMissionClockTickingAudio();
        stopStarMissionWalker();
        stopStarMissionFallingShapes();
        if (starMissionHud) starMissionHud.hidden = true;
        starMissionGameActive = false;
        starMissionEndSession += 1;
        const session = starMissionEndSession;
        prepareMissionConfetti(starMissionConfetti, ['#ff4f64', '#ffd83d', '#38c7e8', '#70d34b', '#ff8f32', '#ffffff']);
        starMissionCelebration?.setAttribute('aria-hidden', 'false');
        starMissionCelebration?.classList.add('is-active');
        starMissionCompletedAudio = playStarMissionOneShot(STAR_MISSION_COMPLETED_AUDIO_SOURCE, () => {
            if (session !== starMissionEndSession) return;
            starMissionCompletedAudio = null;
        });
        starMissionCelebrationAudio = playStarMissionOneShot(STAR_MISSION_CELEBRATION_AUDIO_SOURCE, () => {
            if (session !== starMissionEndSession) return;
            starMissionCelebrationAudio = null;
        });
        const cheerTimer = window.setTimeout(() => {
            if (session !== starMissionEndSession) return;
            starMissionKidsCheeringAudio = playStarMissionOneShot(STAR_MISSION_KIDS_CHEERING_AUDIO_SOURCE, () => {
                if (session !== starMissionEndSession) return;
                starMissionKidsCheeringAudio = null;
                showStarMissionRewardProgress(session);
            });
            starMissionEndTimers = starMissionEndTimers.filter((timerId) => timerId !== cheerTimer);
        }, 750);
        starMissionEndTimers.push(cheerTimer);
        const progressTimer = window.setTimeout(() => {
            if (session !== starMissionEndSession) return;
            showStarMissionRewardProgress(session);
        }, STAR_MISSION_PROGRESS_DELAY_MS);
        starMissionEndTimers.push(progressTimer);
    };

    const startStarMissionLoseFlow = () => {
        if (!starMissionPage || starMissionPage.hidden) return;
        stopStarMissionTimer();
        stopStarMissionClockTickingAudio();
        stopStarMissionWalker();
        stopStarMissionFallingShapes();
        if (starMissionHud) starMissionHud.hidden = true;
        starMissionGameActive = false;
        starMissionEndSession += 1;
        const session = starMissionEndSession;
        if (starMissionTimeout) {
            starMissionTimeout.hidden = false;
            starMissionTimeout.setAttribute('aria-hidden', 'false');
            starMissionTimeout.classList.add('is-intro');
            starMissionTimeout.getBoundingClientRect();
            starMissionTimeout.classList.add('is-visible');
        }
        starMissionTimesUpAudio = playStarMissionOneShot(STAR_MISSION_TIMES_UP_AUDIO_SOURCE, () => {
            if (session !== starMissionEndSession) return;
            starMissionTimesUpAudio = null;
            starMissionTimeout?.classList.remove('is-intro');
            starMissionLoseAudio = playStarMissionOneShot(STAR_MISSION_LOSE_AUDIO_SOURCE, () => {
                if (session !== starMissionEndSession) return;
                starMissionLoseAudio = null;
            });
            starMissionRetryButton?.focus({ preventScroll: true });
        });
    };

    const startStarMissionTimer = () => {
        stopStarMissionTimer();
        const tick = (timestamp) => {
            if (!starMissionGameActive) {
                starMissionTimerFrame = null;
                return;
            }
            if (starMissionTimerLastTick === null) starMissionTimerLastTick = timestamp;
            const elapsed = Math.max(0, timestamp - starMissionTimerLastTick);
            starMissionTimerLastTick = timestamp;
            starMissionTimeRemainingMs = Math.max(0, starMissionTimeRemainingMs - elapsed);
            updateStarMissionHud();
            syncStarMissionClockTickingAudio();
            if (starMissionTimeRemainingMs <= 0) {
                startStarMissionLoseFlow();
                return;
            }
            starMissionTimerFrame = window.requestAnimationFrame(tick);
        };
        starMissionTimerFrame = window.requestAnimationFrame(tick);
    };

    const setStarMissionTarget = (target) => {
        starMissionSelectedTarget = Number(target) || 5;
        starMissionTimeRemainingMs = getStarMissionDurationMs();
        starMissionTargetOptions.forEach((option) => {
            const isSelected = Number(option.dataset.starTarget) === starMissionSelectedTarget;
            option.classList.toggle('is-selected', isSelected);
            option.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
        });
        updateStarMissionHud();
    };

    const showStarMissionSetup = () => {
        stopStarMissionEndFlow();
        const progress = shapePreviewProgressByPage.get(starMissionPage);
        if (progress) {
            progress.hidden = true;
            progress.setAttribute('aria-hidden', 'true');
        }
        stopStarMissionFallingShapes();
        stopStarMissionWalker();
        starMissionGameActive = false;
        starMissionCollectedStars = 0;
        starMissionTimeRemainingMs = getStarMissionDurationMs();
        updateStarMissionHud();
        if (starMissionHud) starMissionHud.hidden = true;
        if (starMissionSetup) {
            starMissionSetup.hidden = false;
            starMissionSetup.getBoundingClientRect();
        }
    };

    const showStarMissionRetryStart = () => {
        if (!starMissionPage || starMissionPage.hidden || !starMissionIntro || !starMissionStartButton) return;
        stopStarMissionEndFlow();
        stopStarMissionSequence();
        stopStarMissionFallingShapes();
        stopStarMissionWalker();
        starMissionGameActive = false;
        if (starMissionSetup) starMissionSetup.hidden = true;
        if (starMissionHud) starMissionHud.hidden = true;
        starMissionIntro.hidden = false;
        starMissionIntro.setAttribute('aria-hidden', 'false');
        starMissionIntro.classList.add('is-active', 'is-retry');
        starMissionStartButton.hidden = false;
        starMissionStartButton.getBoundingClientRect();
        starMissionStartButton.classList.add('is-visible');
        starMissionStartButton.focus({ preventScroll: true });
    };

    const startStarMissionGame = () => {
        if (!starMissionPage || starMissionPage.hidden) return;
        stopStarMissionEndFlow();
        const progress = shapePreviewProgressByPage.get(starMissionPage);
        if (progress) {
            progress.hidden = true;
            progress.setAttribute('aria-hidden', 'true');
        }
        starMissionGameActive = true;
        starMissionCollectedStars = 0;
        starMissionTimeRemainingMs = getStarMissionDurationMs();
        if (starMissionSetup) starMissionSetup.hidden = true;
        if (starMissionHud) starMissionHud.hidden = false;
        updateStarMissionHud();
        startStarMissionWalker();
        startStarMissionFallingShapes();
        startStarMissionTimer();
    };

    function stopStarMissionGame({ keepHud = false } = {}) {
        starMissionGameActive = false;
        stopStarMissionTimer();
        stopStarMissionClockTickingAudio();
        stopStarMissionWalker();
        stopStarMissionFallingShapes();
        if (starMissionHud && !keepHud) starMissionHud.hidden = true;
    }

    const createStarMissionShapeSvg = (kind) => {
        const shapeColor = {
            star: '#ffd84a',
            circle: '#4fc5ff',
            triangle: '#62d26f',
            square: '#ff9155',
            diamond: '#a878ff',
            oval: '#ff78a7',
        }[kind] || '#ffffff';
        const edgeColor = {
            star: '#a66a14',
            circle: '#2166a5',
            triangle: '#24713a',
            square: '#a84222',
            diamond: '#5d35a2',
            oval: '#9b315c',
        }[kind] || '#555555';
        const shapeMarkup = {
            star: '<path d="M50 5 L61 31 L89 33 L68 51 L75 79 L50 64 L25 79 L32 51 L11 33 L39 31 Z"></path>',
            circle: '<circle cx="50" cy="47" r="34"></circle>',
            triangle: '<path d="M50 8 L88 80 H12 Z"></path>',
            square: '<rect x="17" y="14" width="66" height="66" rx="7"></rect>',
            diamond: '<path d="M50 5 L90 43 L50 82 L10 43 Z"></path>',
            oval: '<ellipse cx="50" cy="48" rx="31" ry="40"></ellipse>',
        }[kind];
        return `
            <svg viewBox="0 0 100 100" aria-hidden="true">
                <g fill="${shapeColor}" stroke="${edgeColor}" stroke-width="6" stroke-linejoin="round">
                    ${shapeMarkup}
                </g>
            </svg>
        `;
    };

    const createStarMissionBurst = (xPercent, yPixels, color) => {
        if (!starMissionFallField) return;
        const burst = document.createElement('span');
        burst.className = 'star-burst';
        burst.style.setProperty('--burst-x', `${xPercent}%`);
        burst.style.setProperty('--burst-y', `${yPixels}px`);
        const particleCount = 10;
        for (let index = 0; index < particleCount; index += 1) {
            const particle = document.createElement('i');
            const angle = (Math.PI * 2 * index) / particleCount;
            const distance = 1.8 + Math.random() * 2.2;
            particle.style.setProperty('--burst-color', color);
            particle.style.setProperty('--burst-dx', `${Math.cos(angle) * distance}rem`);
            particle.style.setProperty('--burst-dy', `${Math.sin(angle) * distance - 1.2}rem`);
            particle.style.setProperty('--burst-size', `${(0.34 + Math.random() * 0.34).toFixed(2)}rem`);
            burst.appendChild(particle);
        }
        starMissionFallField.appendChild(burst);
        const removeTimer = window.setTimeout(() => {
            burst.remove();
            starMissionFallTimeouts.delete(removeTimer);
        }, 650);
        starMissionFallTimeouts.add(removeTimer);
    };

    const playStarMissionBoingSound = () => {
        if (!window.Audio || (window.__learnscapeSoundScale?.() ?? 1) === 0) return;
        const audio = new window.Audio(STAR_MISSION_BOING_AUDIO_SOURCE);
        audio.volume = Math.min(1, window.__learnscapeSoundScale?.() ?? 1);
        audio.play().catch(() => {});
    };

    const playStarMissionCollectSound = () => {
        if (!window.Audio || (window.__learnscapeSoundScale?.() ?? 1) === 0) return;
        const audio = new window.Audio(STAR_MISSION_COLLECT_AUDIO_SOURCE);
        audio.volume = Math.min(1, window.__learnscapeSoundScale?.() ?? 1);
        audio.play().catch(() => {});
    };

    const getStarMissionBasketRect = () => {
        if (!starMissionWalker || starMissionWalker.hidden || !starMissionFallField) return null;
        const walkerRect = starMissionWalker.getBoundingClientRect();
        const fieldRect = starMissionFallField.getBoundingClientRect();
        const facingRight = starMissionWalkerDirection >= 0;
        const left = facingRight
            ? walkerRect.left + (walkerRect.width * 0.54)
            : walkerRect.left + (walkerRect.width * 0.05);
        const right = facingRight
            ? walkerRect.left + (walkerRect.width * 0.96)
            : walkerRect.left + (walkerRect.width * 0.47);
        return {
            left: left - fieldRect.left,
            right: right - fieldRect.left,
            top: walkerRect.top + (walkerRect.height * 0.45) - fieldRect.top,
            bottom: walkerRect.top + (walkerRect.height * 0.78) - fieldRect.top,
        };
    };

    const finishStarMissionShape = (shape, delay = 360) => {
        const removeTimer = window.setTimeout(() => {
            shape.remove();
            starMissionActiveShapes.delete(shape);
            starMissionFallTimeouts.delete(removeTimer);
        }, delay);
        starMissionFallTimeouts.add(removeTimer);
    };

    const catchStarMissionShape = (shape, shapeRect, basketRect) => {
        if (!starMissionFallField || !shape.isConnected || shape.classList.contains('is-caught')) return;
        const fieldRect = starMissionFallField.getBoundingClientRect();
        const currentCenterX = shapeRect.left - fieldRect.left + (shapeRect.width / 2);
        const currentCenterY = shapeRect.top - fieldRect.top + (shapeRect.height / 2);
        const basketCenterX = (basketRect.left + basketRect.right) / 2;
        const basketCenterY = (basketRect.top + basketRect.bottom) / 2;
        shape.style.left = `${currentCenterX}px`;
        shape.style.top = `${currentCenterY}px`;
        shape.style.setProperty('--catch-dx', `${(basketCenterX - currentCenterX).toFixed(1)}px`);
        shape.style.setProperty('--catch-dy', `${(basketCenterY - currentCenterY).toFixed(1)}px`);
        shape.style.removeProperty('--fall-x');
        shape.classList.add('is-caught');
        playStarMissionCollectSound();
        let reachedTarget = false;
        if (starMissionGameActive) {
            starMissionCollectedStars = Math.min(starMissionSelectedTarget, starMissionCollectedStars + 1);
            updateStarMissionHud();
            reachedTarget = starMissionCollectedStars >= starMissionSelectedTarget;
        }
        createStarMissionBurst((basketCenterX / Math.max(1, fieldRect.width)) * 100, basketCenterY, '#ffd84a');
        finishStarMissionShape(shape, 360);
        if (reachedTarget) {
            starMissionGameActive = false;
            stopStarMissionTimer();
            stopStarMissionClockTickingAudio();
            const completeTimer = window.setTimeout(() => {
                startStarMissionWinFlow();
                starMissionFallTimeouts.delete(completeTimer);
            }, 420);
            starMissionFallTimeouts.add(completeTimer);
        }
    };

    const bounceStarMissionShape = (shape, shapeRect, basketRect) => {
        if (!shape.isConnected || shape.classList.contains('is-bouncing')) return;
        let penaltyX = null;
        let penaltyY = null;
        if (starMissionFallField && shapeRect && basketRect) {
            const fieldRect = starMissionFallField.getBoundingClientRect();
            const currentCenterX = shapeRect.left - fieldRect.left + (shapeRect.width / 2);
            const currentCenterY = shapeRect.top - fieldRect.top + (shapeRect.height / 2);
            const basketCenterX = (basketRect.left + basketRect.right) / 2;
            const bounceDx = currentCenterX < basketCenterX ? -4.5 : 4.5;
            penaltyX = currentCenterX;
            penaltyY = currentCenterY;
            shape.style.left = `${currentCenterX}px`;
            shape.style.top = `${currentCenterY}px`;
            shape.style.setProperty('--bounce-dx', `${bounceDx}rem`);
            shape.style.setProperty('--bounce-end-dx', `${bounceDx * 1.55}rem`);
            shape.style.setProperty('--bounce-dy', '-4.2rem');
            shape.style.removeProperty('--fall-x');
        }
        shape.classList.add('is-bouncing');
        playStarMissionBoingSound();
        if (starMissionGameActive) {
            starMissionTimeRemainingMs = Math.max(0, starMissionTimeRemainingMs - STAR_MISSION_NON_STAR_PENALTY_MS);
            updateStarMissionHud();
            showStarMissionTimerPenalty();
            if (penaltyX !== null && penaltyY !== null) showStarMissionShapePenalty(penaltyX, penaltyY);
            syncStarMissionClockTickingAudio();
            if (starMissionTimeRemainingMs <= 0) {
                startStarMissionLoseFlow();
                return;
            }
        }
        finishStarMissionShape(shape, 620);
    };

    const monitorStarMissionFallingShapes = () => {
        if (!starMissionWalkerActive || !starMissionFallField || starMissionPage?.hidden) {
            starMissionCollisionFrame = null;
            return;
        }
        const fieldRect = starMissionFallField.getBoundingClientRect();
        const basketRect = getStarMissionBasketRect();
        starMissionActiveShapes.forEach((shape) => {
            if (!shape.isConnected || shape.classList.contains('is-caught') || shape.classList.contains('is-bouncing')) return;
            const shapeRect = shape.getBoundingClientRect();
            const shapeCenterX = shapeRect.left - fieldRect.left + (shapeRect.width / 2);
            const shapeCenterY = shapeRect.top - fieldRect.top + (shapeRect.height / 2);
            const isStar = shape.dataset.kind === 'star';
            const isInsideBasket = Boolean(
                basketRect
                && shapeCenterX >= basketRect.left
                && shapeCenterX <= basketRect.right
                && shapeCenterY >= basketRect.top
                && shapeCenterY <= basketRect.bottom
            );
            if (isInsideBasket && isStar) {
                catchStarMissionShape(shape, shapeRect, basketRect);
                return;
            }
            if (isInsideBasket && !isStar) {
                bounceStarMissionShape(shape, shapeRect, basketRect);
                return;
            }

            const groundY = Number(shape.dataset.groundY || 0);
            if (groundY > 0 && shapeRect.bottom - fieldRect.top >= groundY - 2) {
                shape.classList.add('is-bursting');
                createStarMissionBurst(
                    (shapeCenterX / Math.max(1, fieldRect.width)) * 100,
                    groundY,
                    shape.dataset.burstColor || (isStar ? '#ffd84a' : '#9be8ff'),
                );
                finishStarMissionShape(shape, 240);
            }
        });
        starMissionCollisionFrame = window.requestAnimationFrame(monitorStarMissionFallingShapes);
    };

    const spawnStarMissionFallingShape = () => {
        if (!starMissionFallField || !starMissionWalkerActive || starMissionPage?.hidden) return;
        const kinds = ['star', 'star', 'star', 'circle', 'triangle', 'square', 'diamond', 'oval'];
        const kind = kinds[Math.floor(Math.random() * kinds.length)];
        const isStar = kind === 'star';
        const xPercent = 8 + Math.random() * 84;
        const duration = isStar ? 4.3 + Math.random() * 1.2 : 3.4 + Math.random() * 1.1;
        const size = isStar ? 4.4 + Math.random() * 2 : 4 + Math.random() * 1.8;
        const color = isStar ? '#ffd84a' : '#9be8ff';
        const fieldRect = starMissionFallField.getBoundingClientRect();
        const walkerRect = starMissionWalker?.getBoundingClientRect();
        const groundY = walkerRect
            ? Math.max(0, Math.min(fieldRect.height, walkerRect.bottom - fieldRect.top))
            : fieldRect.height * 0.84;
        const shape = document.createElement('span');
        shape.className = `star-falling-shape ${isStar ? 'is-star' : 'is-non-star'}`;
        shape.dataset.kind = kind;
        shape.style.setProperty('--fall-x', `${xPercent}%`);
        shape.style.setProperty('--fall-size', `${size.toFixed(2)}rem`);
        shape.style.setProperty('--fall-duration', `${duration.toFixed(2)}s`);
        shape.style.setProperty('--fall-ground-y', `${groundY.toFixed(1)}px`);
        shape.style.setProperty('--fall-rotate', `${Math.round(Math.random() * 80 - 40)}deg`);
        shape.style.setProperty('--fall-spin', `${Math.round((Math.random() > 0.5 ? 1 : -1) * (120 + Math.random() * 180))}deg`);
        shape.style.setProperty('--fall-wave', `${(1.4 + Math.random() * 2.2).toFixed(2)}rem`);
        shape.innerHTML = `<span class="star-falling-shape-art">${createStarMissionShapeSvg(kind)}</span>`;
        shape.dataset.groundY = groundY.toFixed(1);
        shape.dataset.burstColor = color;
        starMissionFallField.appendChild(shape);
        starMissionActiveShapes.add(shape);
    };

    const startStarMissionFallingShapes = () => {
        if (!starMissionFallField) return;
        starMissionFallField.hidden = false;
        spawnStarMissionFallingShape();
        if (starMissionFallTimer !== null) window.clearInterval(starMissionFallTimer);
        starMissionFallTimer = window.setInterval(spawnStarMissionFallingShape, 720);
        if (starMissionCollisionFrame !== null) window.cancelAnimationFrame(starMissionCollisionFrame);
        starMissionCollisionFrame = window.requestAnimationFrame(monitorStarMissionFallingShapes);
    };

    const stopStarMissionFallingShapes = () => {
        if (starMissionFallTimer !== null) window.clearInterval(starMissionFallTimer);
        starMissionFallTimer = null;
        if (starMissionCollisionFrame !== null) window.cancelAnimationFrame(starMissionCollisionFrame);
        starMissionCollisionFrame = null;
        starMissionFallTimeouts.forEach((timerId) => window.clearTimeout(timerId));
        starMissionFallTimeouts.clear();
        starMissionActiveShapes.clear();
        if (starMissionFallField) {
            starMissionFallField.hidden = true;
            starMissionFallField.replaceChildren();
        }
    };

    const sizeHeartShotField = () => {
        if (!heartShotField || !heartCupidGame) return;
        const rect = heartCupidGame.getBoundingClientRect();
        heartShotField.setAttribute('viewBox', `0 0 ${Math.max(1, rect.width)} ${Math.max(1, rect.height)}`);
    };

    const resetHeartCupidBow = () => {
        heartCupidGame?.classList.remove('is-aiming', 'is-shooting');
        heartCupidBowControl?.style.setProperty('--heart-bow-angle', '0deg');
        heartBowString?.setAttribute('d', 'M39 171 L160 179 L281 171');
        heartBowArrowParts.forEach((part) => part.removeAttribute('transform'));
        if (heartBowArt) heartBowArt.style.transform = '';
        if (heartAimTrail) heartAimTrail.setAttribute('d', '');
        if (heartAimTrailGlow) heartAimTrailGlow.setAttribute('d', '');
        if (heartFlyingArrow) {
            heartFlyingArrow.hidden = true;
            heartFlyingArrow.removeAttribute('transform');
        }
        heartCurrentTrajectory = null;
    };

    const getHeartBalloonVariedPlaybackRate = (balloon, rate) => {
        const balloonIndex = Math.max(0, heartFloatingBalloons.indexOf(balloon));
        return rate * HEART_BALLOON_SPEED_VARIATIONS[balloonIndex % HEART_BALLOON_SPEED_VARIATIONS.length];
    };

    const setHeartBalloonPlaybackRate = (rate) => {
        heartFloatingBalloons.forEach((balloon) => {
            const variedRate = getHeartBalloonVariedPlaybackRate(balloon, rate);
            balloon.getAnimations().forEach((animation) => {
                if (animation.animationName === 'heartBalloonRise') animation.playbackRate = variedRate;
            });
        });
    };

    const getHeartBalloonPlaybackRate = () => (
        heartGameSpeedRate * (heartFreezeEndsAt > performance.now() ? 0.24 : 1)
    );

    const formatHeartGameTime = (milliseconds) => {
        const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const updateHeartGameHud = () => {
        const challenge = HEART_COLOR_CHALLENGES[heartGameColorIndex] || null;
        const gaugePercent = challenge
            ? Math.min(
                100,
                ((heartGameColorIndex + (heartGameColorProgress / challenge.required))
                    / HEART_COLOR_CHALLENGES.length) * 100,
            )
            : 100;
        if (heartColorTargetIcon) {
            heartColorTargetIcon.style.setProperty('--heart-target-color', challenge?.color || '#ff6ba7');
            heartColorTargetIcon.style.setProperty('--heart-target-edge', challenge?.edge || '#8f2858');
        }
        if (heartColorGaugeFill) {
            heartColorGaugeFill.style.setProperty('--heart-gauge-hidden', `${100 - gaugePercent}%`);
        }
        if (heartColorGauge) {
            heartColorGauge.style.setProperty('--heart-target-color', challenge?.color || '#ff6ba7');
            heartColorGauge.style.setProperty('--heart-target-edge', challenge?.edge || '#8f2858');
            heartColorGauge.setAttribute(
                'aria-label',
                challenge
                    ? `Target ${challenge.label}: ${heartGameColorProgress} of ${challenge.required} hearts`
                    : 'All seven rainbow heart colors completed',
            );
        }
        heartColorMilestones.forEach((milestone, index) => {
            const milestoneChallenge = HEART_COLOR_CHALLENGES[index];
            milestone.classList.toggle('is-complete', index < heartGameColorIndex);
            milestone.classList.toggle('is-active', index === heartGameColorIndex);
            milestone.style.setProperty('--milestone-color', milestoneChallenge?.color || '#d4c3b5');
            milestone.style.setProperty('--milestone-edge', milestoneChallenge?.edge || '#8a7667');
        });
        if (heartGameTimerValue) heartGameTimerValue.textContent = formatHeartGameTime(heartGameTimeRemainingMs);
        heartGameTimer?.setAttribute('aria-label', `${Math.max(0, Math.ceil(heartGameTimeRemainingMs / 1000))} seconds remaining`);
        heartGameTimer?.classList.toggle('is-urgent', heartGameTimeRemainingMs <= 10000);
    };

    const stopHeartGameClock = () => {
        if (heartGameClockFrame !== null) window.cancelAnimationFrame(heartGameClockFrame);
        heartGameClockFrame = null;
        heartGameLastClockTick = null;
    };

    const stopHeartGameClockTickingAudio = () => {
        heartGameClockTickingAudio = stopStarMissionAudio(heartGameClockTickingAudio);
    };

    const stopHeartGameEndAudio = () => {
        heartGameAudioSession += 1;
        heartGameTimesUpAudio = stopStarMissionAudio(heartGameTimesUpAudio);
        heartGameLoseAudio = stopStarMissionAudio(heartGameLoseAudio);
    };

    const syncHeartGameClockTickingAudio = () => {
        const shouldTick = !heartGameEnded
            && !heartGamePaused
            && heartCupidGame
            && !heartCupidGame.hidden
            && heartGameTimeRemainingMs > 0
            && heartGameTimeRemainingMs <= 5000;
        if (!shouldTick) {
            stopHeartGameClockTickingAudio();
            return;
        }
        if (heartGameClockTickingAudio || !window.Audio) return;
        heartGameClockTickingAudio = new window.Audio(HEART_GAME_CLOCK_TICKING_AUDIO_SOURCE);
        heartGameClockTickingAudio.loop = true;
        heartGameClockTickingAudio.preload = 'auto';
        heartGameClockTickingAudio.volume = Math.min(1, window.__learnscapeSoundScale?.() ?? 1);
        heartGameClockTickingAudio.play().catch(() => {
            heartGameClockTickingAudio = null;
        });
    };

    const playHeartGameOverAudio = (reason) => {
        stopHeartGameEndAudio();
        const session = heartGameAudioSession;
        const playLoseAudio = () => {
            if (session !== heartGameAudioSession || !heartGameEnded) return;
            heartGameTimesUpAudio = null;
            heartGameLoseAudio = playStarMissionOneShot(HEART_GAME_LOSE_AUDIO_SOURCE, () => {
                if (session !== heartGameAudioSession) return;
                heartGameLoseAudio = null;
            });
        };
        if (reason === 'time') {
            heartGameTimesUpAudio = playStarMissionOneShot(HEART_GAME_TIMES_UP_AUDIO_SOURCE, playLoseAudio);
            return;
        }
        playLoseAudio();
    };

    const startHeartGameClock = () => {
        stopHeartGameClock();
        const tick = (timestamp) => {
            if (heartGameEnded) {
                heartGameClockFrame = null;
                return;
            }
            if (heartGameLastClockTick === null) heartGameLastClockTick = timestamp;
            const elapsedMs = Math.max(0, timestamp - heartGameLastClockTick);
            heartGameLastClockTick = timestamp;
            heartGameTimeRemainingMs = Math.max(0, heartGameTimeRemainingMs - elapsedMs);
            updateHeartGameHud();
            syncHeartGameClockTickingAudio();

            if (heartGameTimeRemainingMs <= 0) {
                finishHeartGame(false, 'time');
                return;
            }
            heartGameClockFrame = window.requestAnimationFrame(tick);
        };
        heartGameClockFrame = window.requestAnimationFrame(tick);
    };

    const clearHeartFreeze = () => {
        if (heartFreezeTimer !== null) window.clearTimeout(heartFreezeTimer);
        if (heartFreezeCountdownTimer !== null) window.clearInterval(heartFreezeCountdownTimer);
        heartFreezeTimer = null;
        heartFreezeCountdownTimer = null;
        heartFreezeEndsAt = 0;
        heartFreezePausedRemainingMs = 0;
        if (heartFreezeStatus) heartFreezeStatus.hidden = true;
        heartCupidGame?.classList.remove('is-freeze-active');
        setHeartBalloonPlaybackRate(heartGameSpeedRate);
    };

    const runHeartFreezeCountdown = (durationMs) => {
        heartFreezeEndsAt = performance.now() + durationMs;
        heartCupidGame?.classList.add('is-freeze-active');
        if (heartFreezeStatus) heartFreezeStatus.hidden = false;
        setHeartBalloonPlaybackRate(heartGameSpeedRate * 0.24);

        const updateCountdown = () => {
            const remaining = Math.max(0, heartFreezeEndsAt - performance.now());
            if (heartFreezeCountdown) heartFreezeCountdown.textContent = (remaining / 1000).toFixed(1);
        };
        updateCountdown();
        heartFreezeCountdownTimer = window.setInterval(updateCountdown, 100);
        heartFreezeTimer = window.setTimeout(clearHeartFreeze, durationMs);
    };

    const activateHeartFreeze = () => {
        clearHeartFreeze();
        runHeartFreezeCountdown(5000);
    };

    const resetHeartGamePauseUi = () => {
        heartGamePaused = false;
        heartFreezePausedRemainingMs = 0;
        heartCupidGame?.classList.remove('is-paused');
        if (heartGamePauseOverlay) heartGamePauseOverlay.hidden = true;
        if (heartGamePauseButton) {
            heartGamePauseButton.setAttribute('aria-pressed', 'false');
            heartGamePauseButton.setAttribute('aria-label', 'Pause heart game');
        }
    };

    const setHeartGamePaused = (paused) => {
        if (!heartCupidGame || heartCupidGame.hidden || heartGameEnded) paused = false;
        if (heartGamePaused === paused) return;
        heartGamePaused = paused;
        heartCupidGame.classList.toggle('is-paused', paused);
        if (heartGamePauseOverlay) heartGamePauseOverlay.hidden = !paused;
        if (heartGamePauseButton) {
            heartGamePauseButton.setAttribute('aria-pressed', paused ? 'true' : 'false');
            heartGamePauseButton.setAttribute('aria-label', paused ? 'Resume heart game' : 'Pause heart game');
        }

        if (paused) {
            stopHeartGameClock();
            syncHeartGameClockTickingAudio();
            if (heartShotAnimationFrame !== null) {
                window.cancelAnimationFrame(heartShotAnimationFrame);
                heartShotAnimationFrame = null;
            }
            resetHeartCupidBow();
            heartFreezePausedRemainingMs = Math.max(0, heartFreezeEndsAt - performance.now());
            if (heartFreezeTimer !== null) window.clearTimeout(heartFreezeTimer);
            if (heartFreezeCountdownTimer !== null) window.clearInterval(heartFreezeCountdownTimer);
            heartFreezeTimer = null;
            heartFreezeCountdownTimer = null;
            heartFreezeEndsAt = 0;
            heartFloatingBalloons.forEach((balloon) => {
                balloon.getAnimations().forEach((animation) => animation.pause());
            });
            if (heartCupidBowControl) heartCupidBowControl.disabled = true;
            return;
        }

        if (heartCupidBowControl) heartCupidBowControl.disabled = false;
        if (heartFreezePausedRemainingMs > 0) {
            const remainingMs = heartFreezePausedRemainingMs;
            heartFreezePausedRemainingMs = 0;
            runHeartFreezeCountdown(remainingMs);
        } else {
            setHeartBalloonPlaybackRate(heartGameSpeedRate);
        }
        heartFloatingBalloons.forEach((balloon) => {
            if (balloon.classList.contains('is-popping') || balloon.classList.contains('is-phase-hidden')) return;
            balloon.getAnimations().forEach((animation) => animation.play());
        });
        startHeartGameClock();
        syncHeartGameClockTickingAudio();
        restoreHeartCupidCursorAim();
    };

    heartGamePauseButton?.addEventListener('click', () => setHeartGamePaused(!heartGamePaused));
    heartGamePauseButton?.addEventListener('keydown', (event) => {
        if (event.code === 'Space') event.preventDefault();
    });

    const showHeartHitFeedback = (text, x, y, tone = 'positive') => {
        if (!heartCupidGame) return;
        const feedback = document.createElement('span');
        feedback.className = `heart-hit-feedback is-${tone}`;
        feedback.textContent = text;
        feedback.style.left = `${x}px`;
        feedback.style.top = `${y}px`;
        heartCupidGame.appendChild(feedback);
        window.setTimeout(() => feedback.remove(), 900);
    };

    const resetHeartFloatingBalloon = (balloon) => {
        const lifecycle = heartBalloonRespawnTimers.get(balloon);
        if (lifecycle?.timer !== undefined) window.clearTimeout(lifecycle.timer);
        lifecycle?.burst?.remove();
        heartBalloonRespawnTimers.delete(balloon);
        balloon.classList.remove('is-popping', 'is-respawning');
        ['left', 'top', 'bottom', 'width', 'height', 'opacity', 'transform'].forEach((property) => {
            balloon.style.removeProperty(property);
        });
        window.requestAnimationFrame(() => {
            balloon.getAnimations().forEach((animation) => {
                if (animation.animationName !== 'heartBalloonRise') return;
                animation.playbackRate = getHeartBalloonVariedPlaybackRate(balloon, getHeartBalloonPlaybackRate());
                if (heartGameEnded || heartGamePaused) animation.pause();
                else animation.play();
            });
        });
    };

    const respawnHeartFloatingBalloon = (balloon, previousXPercent) => {
        resetHeartFloatingBalloon(balloon);
        const nextXPercent = previousXPercent < 50
            ? 58 + (Math.random() * 36)
            : 6 + (Math.random() * 36);
        const respawnDelay = 1300 + (Math.random() * 1200);
        balloon.style.setProperty('--balloon-x', `${nextXPercent.toFixed(1)}%`);
        balloon.style.setProperty('--balloon-delay', '0s');
        balloon.classList.add('is-respawning');

        const respawnTimer = window.setTimeout(() => {
            heartBalloonRespawnTimers.delete(balloon);
            if (heartGameEnded) return;
            balloon.classList.remove('is-respawning');
            balloon.getBoundingClientRect();
            window.requestAnimationFrame(() => {
                balloon.getAnimations().forEach((animation) => {
                    if (animation.animationName !== 'heartBalloonRise') return;
                    animation.playbackRate = getHeartBalloonVariedPlaybackRate(balloon, getHeartBalloonPlaybackRate());
                    if (heartGamePaused) animation.pause();
                    else animation.play();
                });
            });
        }, respawnDelay);
        heartBalloonRespawnTimers.set(balloon, { timer: respawnTimer });
    };

    const setHeartPhaseBalloonVisible = (balloon, visible) => {
        const isHidden = balloon.classList.contains('is-phase-hidden');
        if (visible === !isHidden) return;
        resetHeartFloatingBalloon(balloon);
        if (!visible) {
            balloon.classList.add('is-phase-hidden');
            return;
        }
        balloon.style.setProperty('--balloon-delay', '0s');
        balloon.style.setProperty('--balloon-x', `${(7 + (Math.random() * 86)).toFixed(1)}%`);
        balloon.classList.remove('is-phase-hidden');
    };

    const setHeartPhaseBalloonSize = (balloon, size) => {
        const isSmall = size === 'small';
        balloon.classList.toggle('is-small', isSmall);
        balloon.classList.toggle('is-large', !isSmall);
    };

    const applyHeartBalloonColor = (balloon, challenge) => {
        if (!balloon || !challenge) return;
        balloon.dataset.heartColor = challenge.key;
        balloon.style.setProperty('--balloon-color', challenge.color);
        balloon.style.setProperty('--balloon-edge', challenge.edge);
    };

    const refreshHeartBalloonColors = () => {
        const targetChallenge = HEART_COLOR_CHALLENGES[heartGameColorIndex];
        if (!targetChallenge || !heartPointBalloons.length) return;

        const orderedBalloons = [...heartPointBalloons].sort((first, second) => (
            Number(first.classList.contains('is-popping') || first.classList.contains('is-respawning'))
            - Number(second.classList.contains('is-popping') || second.classList.contains('is-respawning'))
        ));
        const otherChallenges = shuffleValues(
            HEART_COLOR_CHALLENGES.filter((challenge) => challenge !== targetChallenge),
        );
        orderedBalloons.forEach((balloon, index) => {
            const isTargetBalloon = index < HEART_GAME_TARGET_BALLOON_COUNT;
            applyHeartBalloonColor(
                balloon,
                isTargetBalloon
                    ? targetChallenge
                    : otherChallenges[(index - HEART_GAME_TARGET_BALLOON_COUNT) % otherChallenges.length],
            );
            const isGreenTargetMix = heartGameColorIndex === 3 && isTargetBalloon;
            const isLastThreeTarget = heartGameColorIndex >= 4 && isTargetBalloon;
            const size = isLastThreeTarget || (isGreenTargetMix && index % 2 === 1)
                ? 'small'
                : 'large';
            setHeartPhaseBalloonSize(balloon, size);
        });
    };

    const updateHeartGameDifficulty = (force = false) => {
        const phase = heartGameColorIndex < 2 ? 1 : heartGameColorIndex < 5 ? 2 : 3;
        const finalSpeedStep = phase === 3 ? Math.min(2, heartGameColorIndex - 5) : 0;
        const difficultyKey = (phase * 10) + finalSpeedStep;
        const completedTargets = HEART_COLOR_CHALLENGES
            .slice(0, heartGameColorIndex)
            .reduce((total, challenge) => total + challenge.required, 0) + heartGameColorProgress;
        heartGameSpeedRate = Math.min(1.85, 0.82 + (completedTargets * 0.022));
        if (!force && difficultyKey === heartGameDifficultyPhase) {
            setHeartBalloonPlaybackRate(getHeartBalloonPlaybackRate());
            return;
        }
        heartGameDifficultyPhase = difficultyKey;

        heartPointBalloons.forEach((balloon, index) => {
            const visible = phase === 1 ? index < 5 : phase === 2 ? index < 5 : true;
            setHeartPhaseBalloonVisible(balloon, visible);
        });

        heartShapePenaltyBalloons.forEach((balloon, index) => {
            const visible = phase === 1 ? index < 4 : phase === 2 ? index < 6 : true;
            setHeartPhaseBalloonVisible(balloon, visible);
            setHeartPhaseBalloonSize(balloon, 'large');
        });

        heartFreezeBalloons.forEach((balloon) => setHeartPhaseBalloonVisible(balloon, phase >= 2));
        heartBombBalloons.forEach((balloon, index) => {
            setHeartPhaseBalloonVisible(balloon, phase >= 2 && (phase === 3 || index === 0));
            setHeartPhaseBalloonSize(balloon, 'large');
        });
        setHeartBalloonPlaybackRate(getHeartBalloonPlaybackRate());
    };

    const popHeartFloatingBalloon = (balloon, balloonRect, gameRect, playSound = true) => {
        const left = balloonRect.left - gameRect.left;
        const top = balloonRect.top - gameRect.top;
        const centerX = left + (balloonRect.width / 2);
        const centerY = top + (balloonRect.height * 0.3);
        const previousXPercent = Math.max(0, Math.min(100, (centerX / Math.max(1, gameRect.width)) * 100));

        balloon.style.left = `${left}px`;
        balloon.style.top = `${top}px`;
        balloon.style.bottom = 'auto';
        balloon.style.width = `${balloonRect.width}px`;
        balloon.style.height = `${balloonRect.height}px`;
        balloon.style.opacity = '1';
        balloon.style.transform = 'none';
        balloon.classList.add('is-popping');

        const burst = document.createElement('span');
        burst.className = 'heart-balloon-pop-burst';
        burst.style.left = `${centerX}px`;
        burst.style.top = `${centerY}px`;
        heartCupidGame?.appendChild(burst);
        if (playSound) playUiClickSound('pop');

        const popTimer = window.setTimeout(() => {
            heartBalloonRespawnTimers.delete(balloon);
            burst.remove();
            respawnHeartFloatingBalloon(balloon, previousXPercent);
        }, 560);
        heartBalloonRespawnTimers.set(balloon, { timer: popTimer, burst });
    };

    const findHeartBalloonHit = (fromX, fromY, toX, toY) => {
        if (!heartCupidGame) return null;
        const gameRect = heartCupidGame.getBoundingClientRect();
        const segmentX = toX - fromX;
        const segmentY = toY - fromY;
        const segmentLengthSquared = (segmentX * segmentX) + (segmentY * segmentY);
        let nearestHit = null;

        heartFloatingBalloons.forEach((balloon) => {
            if (balloon.classList.contains('is-popping')
                || balloon.classList.contains('is-respawning')
                || balloon.classList.contains('is-phase-hidden')) return;
            const balloonRect = balloon.getBoundingClientRect();
            if (balloonRect.bottom < gameRect.top || balloonRect.top > gameRect.bottom) return;
            const centerX = balloonRect.left - gameRect.left + (balloonRect.width / 2);
            const centerY = balloonRect.top - gameRect.top + (balloonRect.height * 0.3);
            const radius = Math.max(24, Math.min(balloonRect.width, balloonRect.height) * 0.38);
            const projection = segmentLengthSquared > 0
                ? Math.max(0, Math.min(1, (((centerX - fromX) * segmentX) + ((centerY - fromY) * segmentY)) / segmentLengthSquared))
                : 0;
            const closestX = fromX + (segmentX * projection);
            const closestY = fromY + (segmentY * projection);
            const distance = Math.hypot(centerX - closestX, centerY - closestY);

            if (distance <= radius && (!nearestHit || distance < nearestHit.distance)) {
                nearestHit = { balloon, balloonRect, gameRect, distance };
            }
        });

        return nearestHit;
    };

    const prepareHeartCelebrationConfetti = () => {
        if (!heartCelebrationConfetti || heartCelebrationConfetti.childElementCount) return;
        const colors = ['#ff4f91', '#ff79b7', '#ffd84f', '#ff6d68', '#f7a6d2', '#ffffff'];
        for (let index = 0; index < 42; index += 1) {
            const heart = document.createElement('span');
            heart.style.setProperty('--heart-x', `${2 + (Math.random() * 96)}%`);
            heart.style.setProperty('--heart-size', `${(0.55 + (Math.random() * 1.05)).toFixed(2)}rem`);
            heart.style.setProperty('--heart-color', colors[index % colors.length]);
            heart.style.setProperty('--heart-delay', `${(Math.random() * -3.5).toFixed(2)}s`);
            heart.style.setProperty('--heart-duration', `${(3.2 + (Math.random() * 2.2)).toFixed(2)}s`);
            heart.style.setProperty('--heart-drift', `${Math.round((Math.random() * 22) - 11)}vw`);
            heartCelebrationConfetti.appendChild(heart);
        }
    };

    const primeHeartCelebrationAudio = () => {
        if (!window.Audio || heartCelebrationAudioCache.length) return;
        heartCelebrationAudioCache = HEART_CELEBRATION_AUDIO_SOURCES.map((source) => {
            const audio = new window.Audio(source);
            audio.preload = 'auto';
            audio.playsInline = true;
            audio.load?.();
            return audio;
        });
    };

    const getHeartCelebrationAudio = (index) => {
        primeHeartCelebrationAudio();
        const cachedAudio = heartCelebrationAudioCache[index];
        if (cachedAudio) return cachedAudio;
        if (!window.Audio) return null;
        const audio = new window.Audio(HEART_CELEBRATION_AUDIO_SOURCES[index]);
        audio.preload = 'auto';
        audio.playsInline = true;
        return audio;
    };

    const stopHeartVictoryCelebration = () => {
        heartCelebrationSession += 1;
        heartCelebrationTimers.forEach((timer) => window.clearTimeout(timer));
        heartCelebrationTimers = [];
        if (heartCelebrationAudio) {
            heartCelebrationAudio.onended = null;
            heartCelebrationAudio.onerror = null;
            heartCelebrationAudio.pause();
            heartCelebrationAudio.currentTime = 0;
            heartCelebrationAudio = null;
        }
        heartGameCelebration?.classList.remove('is-active', 'is-character-exiting', 'is-finishing');
        if (heartGameCelebration) heartGameCelebration.hidden = true;
        heartFinalProgress?.setAttribute('aria-hidden', 'true');
        heartMissionPage?.classList.remove('is-heart-victory-celebration', 'is-heart-final-progress-visible');
    };

    const showHeartFinalProgress = (session) => {
        if (session !== heartCelebrationSession || !heartMissionPage || heartMissionPage.hidden) return;
        heartGameCelebration?.classList.add('is-character-exiting');
        const exitTimer = window.setTimeout(() => {
            if (session !== heartCelebrationSession) return;
            heartGameCelebration?.classList.add('is-finishing');
            const revealTimer = window.setTimeout(() => {
                if (session !== heartCelebrationSession) return;
                if (heartGameCelebration) heartGameCelebration.hidden = true;
                heartMissionPage.classList.remove('is-heart-victory-celebration');
                heartMissionPage.classList.add('is-heart-final-progress-visible');
                heartFinalProgress?.setAttribute('aria-hidden', 'false');
                playUiClickSound('boardSuccess');
                heartCelebrationTimers.push(window.setTimeout(() => {
                    if (session === heartCelebrationSession) playUiClickSound('starPop');
                }, 650));
            }, 480);
            heartCelebrationTimers.push(revealTimer);
        }, 1550);
        heartCelebrationTimers.push(exitTimer);
    };

    const startHeartVictoryCelebration = () => {
        if (!heartMissionPage || heartMissionPage.hidden) return;
        stopHeartVictoryCelebration();
        const session = heartCelebrationSession;
        prepareHeartCelebrationConfetti();
        if (heartCupidGame) {
            heartCupidGame.classList.remove('is-visible');
            heartCupidGame.hidden = true;
        }
        heartMissionPage.classList.remove('is-heart-cupid-game-active');
        heartMissionPage.classList.add('is-heart-victory-celebration');
        if (heartGameCelebration) {
            heartGameCelebration.hidden = false;
            heartGameCelebration.getBoundingClientRect();
            heartGameCelebration.classList.add('is-active');
        }

        const playCelebrationAudio = (index) => {
            if (session !== heartCelebrationSession) return;
            if (index >= HEART_CELEBRATION_AUDIO_SOURCES.length) {
                showHeartFinalProgress(session);
                return;
            }
            const audio = getHeartCelebrationAudio(index);
            if (!audio) {
                const fallbackTimer = window.setTimeout(() => playCelebrationAudio(index + 1), 1000);
                heartCelebrationTimers.push(fallbackTimer);
                return;
            }
            heartCelebrationAudio = audio;
            let advanced = false;
            const advance = () => {
                if (advanced || session !== heartCelebrationSession) return;
                advanced = true;
                if (heartCelebrationAudio === audio) heartCelebrationAudio = null;
                playCelebrationAudio(index + 1);
            };
            audio.pause();
            audio.onended = advance;
            audio.onerror = advance;
            audio.currentTime = 0;
            audio.play().catch(advance);
        };
        playCelebrationAudio(0);
    };

    const finishHeartGame = (won, reason = 'lives') => {
        if (heartGameEnded) return;
        heartGameEnded = true;
        resetHeartGamePauseUi();
        stopHeartGameClock();
        stopHeartGameClockTickingAudio();
        clearHeartFreeze();
        if (heartShotAnimationFrame !== null) {
            window.cancelAnimationFrame(heartShotAnimationFrame);
            heartShotAnimationFrame = null;
        }
        resetHeartCupidBow();
        if (heartCupidBowControl) heartCupidBowControl.disabled = true;
        heartFloatingBalloons.forEach((balloon) => {
            balloon.getAnimations().forEach((animation) => {
                if (animation.animationName === 'heartBalloonRise') animation.pause();
            });
        });
        if (reason === 'time') updateHeartGameHud();
        if (won) {
            stopHeartGameEndAudio();
            startHeartVictoryCelebration();
            return;
        }
        playHeartGameOverAudio(reason);
        if (heartGameResultTitle) {
            heartGameResultTitle.textContent = won ? 'Mission Complete!' : reason === 'time' ? "Time's Up!" : 'Out of Lives!';
        }
        if (heartGameResultCopy) {
            heartGameResultCopy.textContent = won
                ? 'You completed the rainbow!'
                : `Completed colors: ${heartGameColorIndex} of ${HEART_COLOR_CHALLENGES.length}`;
        }
        if (heartGameRetryButton) heartGameRetryButton.textContent = won ? 'Play Again' : 'Retry';
        if (heartGameResult) {
            heartGameResult.hidden = false;
            heartGameResult.getBoundingClientRect();
            heartGameResult.classList.add('is-visible');
        }
    };

    const resetHeartGameState = () => {
        stopHeartGameClockTickingAudio();
        stopHeartGameEndAudio();
        resetHeartGamePauseUi();
        clearHeartFreeze();
        heartGameColorIndex = 0;
        heartGameColorProgress = 0;
        heartGameTimeRemainingMs = HEART_GAME_START_TIME_MS;
        heartGameEnded = false;
        heartGameDifficultyPhase = 0;
        heartGameSpeedRate = 0.82;
        if (heartCupidBowControl) heartCupidBowControl.disabled = false;
        heartGameResult?.classList.remove('is-visible');
        if (heartGameResult) heartGameResult.hidden = true;
        heartCupidGame?.querySelectorAll('.heart-hit-feedback').forEach((feedback) => feedback.remove());
        heartFloatingBalloons.forEach(resetHeartFloatingBalloon);
        updateHeartGameDifficulty(true);
        refreshHeartBalloonColors();
        updateHeartGameHud();
        startHeartGameClock();
    };

    const handleHeartBalloonHit = ({ balloon, balloonRect, gameRect }) => {
        if (heartGameEnded) return;
        const kind = balloon.dataset.balloonKind || (balloon.classList.contains('heart-floating-balloon') ? 'heart' : 'shape');
        const feedbackX = balloonRect.left - gameRect.left + (balloonRect.width / 2);
        const feedbackY = balloonRect.top - gameRect.top + (balloonRect.height * 0.3);
        popHeartFloatingBalloon(balloon, balloonRect, gameRect, kind !== 'heart');

        if (kind === 'heart') {
            const challenge = HEART_COLOR_CHALLENGES[heartGameColorIndex];
            const poppedColor = HEART_COLOR_CHALLENGES.find(
                (colorChallenge) => colorChallenge.key === balloon.dataset.heartColor,
            );
            if (!challenge || balloon.dataset.heartColor !== challenge.key) {
                showHeartHitFeedback(poppedColor?.label || 'HEART', feedbackX, feedbackY, 'negative');
                if (window.Audio) {
                    const buzzerAudio = new window.Audio('assets/Audios/Sound effects/buzzer.mp3');
                    buzzerAudio.play().catch(() => playUiClickSound('thunk'));
                } else {
                    playUiClickSound('thunk');
                }
                return;
            }

            heartGameColorProgress += 1;
            const timeBonusMs = balloon.classList.contains('is-small')
                ? HEART_GAME_SMALL_HEART_BONUS_MS
                : HEART_GAME_LARGE_HEART_BONUS_MS;
            heartGameTimeRemainingMs += timeBonusMs;
            syncHeartGameClockTickingAudio();
            showHeartHitFeedback(challenge.label, feedbackX, feedbackY, 'positive');
            if (window.Audio) {
                const correctAudio = new window.Audio('assets/Audios/Sound effects/correct.mp3');
                correctAudio.play().catch(() => playUiClickSound('chime'));
            } else {
                playUiClickSound('chime');
            }

            if (heartGameColorProgress >= challenge.required) {
                heartGameColorIndex += 1;
                heartGameColorProgress = 0;
                if (heartGameColorIndex >= HEART_COLOR_CHALLENGES.length) {
                    updateHeartGameHud();
                    finishHeartGame(true);
                    return;
                }
                refreshHeartBalloonColors();
                playUiClickSound('starPop');
            }
            updateHeartGameDifficulty();
            updateHeartGameHud();
            return;
        }

        if (kind === 'shape') {
            heartGameTimeRemainingMs = Math.max(0, heartGameTimeRemainingMs - 10000);
            syncHeartGameClockTickingAudio();
            showHeartHitFeedback('-10s', feedbackX, feedbackY, 'negative');
            updateHeartGameHud();
            if (heartGameTimeRemainingMs <= 0) finishHeartGame(false, 'time');
            return;
        }

        if (kind === 'freeze') {
            activateHeartFreeze();
            showHeartHitFeedback('SLOW 5s', feedbackX, feedbackY, 'freeze');
            return;
        }

        if (kind === 'bomb') {
            showHeartHitFeedback('BOOM!', feedbackX, feedbackY, 'negative');
            heartFloatingBalloons.forEach((candidate) => {
                if (candidate === balloon || candidate.dataset.balloonKind !== 'heart' || candidate.classList.contains('is-popping')) return;
                const candidateRect = candidate.getBoundingClientRect();
                const isVisible = candidateRect.right > gameRect.left
                    && candidateRect.left < gameRect.right
                    && candidateRect.bottom > gameRect.top
                    && candidateRect.top < gameRect.bottom
                    && Number.parseFloat(window.getComputedStyle(candidate).opacity) > 0.1;
                if (isVisible) popHeartFloatingBalloon(candidate, candidateRect, gameRect, false);
            });
            updateHeartGameHud();
        }
    };

    const stopHeartCupidGame = () => {
        stopHeartVictoryCelebration();
        resetHeartGamePauseUi();
        stopHeartGameClock();
        stopHeartGameClockTickingAudio();
        stopHeartGameEndAudio();
        if (heartShotAnimationFrame !== null) {
            window.cancelAnimationFrame(heartShotAnimationFrame);
            heartShotAnimationFrame = null;
        }
        heartGameEnded = true;
        clearHeartFreeze();
        heartFloatingBalloons.forEach(resetHeartFloatingBalloon);
        heartCupidGame?.querySelectorAll('.heart-balloon-pop-burst').forEach((burst) => burst.remove());
        heartCupidGame?.querySelectorAll('.heart-hit-feedback').forEach((feedback) => feedback.remove());
        heartLastAimClientX = null;
        heartLastAimClientY = null;
        resetHeartCupidBow();
        if (heartCupidGame) {
            heartCupidGame.classList.remove('is-visible');
            heartCupidGame.hidden = true;
        }
        heartMissionPage?.classList.remove('is-heart-cupid-game-active');
    };

    const startHeartCupidGame = () => {
        if (!heartCupidGame || !heartMissionPage || heartMissionPage.hidden) return;
        stopHeartCupidGame();
        heartCupidGame.hidden = false;
        heartMissionPage.classList.add('is-heart-cupid-game-active');
        primeHeartCelebrationAudio();
        resetHeartGameState();
        sizeHeartShotField();
        resetHeartCupidBow();
        heartCupidGame.getBoundingClientRect();
        heartCupidGame.classList.add('is-visible');
        const gameRect = heartCupidGame.getBoundingClientRect();
        heartLastAimClientX = gameRect.left + (gameRect.width / 2);
        heartLastAimClientY = gameRect.top + (gameRect.height * 0.35);
        updateHeartCupidAim(heartLastAimClientX, heartLastAimClientY);
    };

    const updateHeartCupidAim = (clientX, clientY) => {
        if (!heartCupidGame || !heartCupidBowControl || !heartAimTrail || !heartAimTrailGlow || heartCupidGame.classList.contains('is-shooting')) return;
        const gameRect = heartCupidGame.getBoundingClientRect();
        const pivot = {
            x: gameRect.width / 2,
            y: gameRect.height - Math.max(34, gameRect.height * 0.055),
        };
        const target = {
            x: clientX - gameRect.left,
            y: Math.min(clientY - gameRect.top, pivot.y - 60),
        };
        let dx = target.x - pivot.x;
        let dy = target.y - pivot.y;
        const distance = Math.max(1, Math.hypot(dx, dy));
        dx /= distance;
        dy /= distance;
        const rawAngle = (Math.atan2(dy, dx) * 180 / Math.PI) + 90;
        const angle = Math.max(-72, Math.min(72, rawAngle));
        const angleRadians = (angle - 90) * Math.PI / 180;
        const unitX = Math.cos(angleRadians);
        const unitY = Math.sin(angleRadians);
        const pull = Math.max(18, Math.min(62, distance * 0.16));
        const launch = {
            x: pivot.x + unitX * Math.min(150, gameRect.height * 0.2),
            y: pivot.y + unitY * Math.min(150, gameRect.height * 0.2),
        };
        const flightDistance = Math.max(gameRect.width, gameRect.height) * 1.28;
        const end = {
            x: launch.x + unitX * flightDistance,
            y: launch.y + unitY * flightDistance,
        };
        const path = `M ${launch.x.toFixed(1)} ${launch.y.toFixed(1)} L ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;

        heartCupidBowControl.style.setProperty('--heart-bow-angle', `${angle.toFixed(2)}deg`);
        heartBowString?.setAttribute('d', `M39 171 L160 ${(179 + pull * 0.62).toFixed(1)} L281 171`);
        heartBowArrowParts.forEach((part) => part.setAttribute('transform', `translate(0 ${(pull * 0.5).toFixed(1)})`));
        if (heartBowArt) heartBowArt.style.transform = `scaleX(${(1 + pull / 850).toFixed(3)})`;
        heartAimTrail.setAttribute('d', path);
        heartAimTrailGlow.setAttribute('d', path);
        heartCurrentTrajectory = {
            startX: launch.x,
            startY: launch.y,
            endX: end.x,
            endY: end.y,
            angle: Math.atan2(end.y - launch.y, end.x - launch.x) * 180 / Math.PI,
        };
        if (!heartGameEnded) heartCupidGame.classList.add('is-aiming');
    };

    const restoreHeartCupidCursorAim = () => {
        if (heartGameEnded
            || heartGamePaused
            || !heartCupidGame
            || heartCupidGame.hidden
            || heartCupidGame.classList.contains('is-shooting')
            || heartLastAimClientX === null
            || heartLastAimClientY === null) return;
        updateHeartCupidAim(heartLastAimClientX, heartLastAimClientY);
    };

    const fireHeartCupidArrow = () => {
        if (heartGameEnded || heartGamePaused || heartCupidGame?.classList.contains('is-shooting')) return;
        restoreHeartCupidCursorAim();
        if (!heartCupidGame || !heartFlyingArrow || !heartCurrentTrajectory) {
            resetHeartCupidBow();
            return;
        }
        const trajectory = { ...heartCurrentTrajectory };
        heartCupidGame.classList.remove('is-aiming');
        heartCupidGame.classList.add('is-shooting');
        heartFlyingArrow.hidden = false;
        playUiClickSound('spark');
        const startedAt = performance.now();
        const duration = 760;
        let previousX = trajectory.startX;
        let previousY = trajectory.startY;

        const animateShot = (timestamp) => {
            const progress = Math.min(1, (timestamp - startedAt) / duration);
            const eased = 1 - ((1 - progress) ** 2);
            const x = trajectory.startX + (trajectory.endX - trajectory.startX) * eased;
            const y = trajectory.startY + (trajectory.endY - trajectory.startY) * eased;
            heartFlyingArrow.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${trajectory.angle.toFixed(2)})`);
            const hit = findHeartBalloonHit(previousX, previousY, x, y);
            if (hit) {
                heartShotAnimationFrame = null;
                handleHeartBalloonHit(hit);
                resetHeartCupidBow();
                restoreHeartCupidCursorAim();
                return;
            }
            previousX = x;
            previousY = y;
            if (progress < 1) {
                heartShotAnimationFrame = window.requestAnimationFrame(animateShot);
                return;
            }
            heartShotAnimationFrame = null;
            resetHeartCupidBow();
            restoreHeartCupidCursorAim();
        };
        heartShotAnimationFrame = window.requestAnimationFrame(animateShot);
    };

    window.addEventListener('pointermove', (event) => {
        if (!heartCupidGame
            || heartGameEnded
            || heartGamePaused
            || heartCupidGame.hidden
            || heartCupidGame.classList.contains('is-shooting')) return;
        heartLastAimClientX = event.clientX;
        heartLastAimClientY = event.clientY;
        updateHeartCupidAim(event.clientX, event.clientY);
    });

    window.addEventListener('keydown', (event) => {
        if (event.code !== 'Space'
            || event.repeat
            || !heartCupidGame
            || heartCupidGame.hidden
            || heartGameEnded
            || heartGamePaused
            || heartCupidGame.classList.contains('is-shooting')) return;
        event.preventDefault();
        fireHeartCupidArrow();
    });

    heartCupidBowControl?.addEventListener('dragstart', (event) => event.preventDefault());
    window.addEventListener('resize', () => {
        sizeHeartShotField();
        restoreHeartCupidCursorAim();
    });

    heartMissionStartButton?.addEventListener('click', () => {
        playUiClickSound('start');
        stopHeartMissionSequence();
        startHeartCupidGame();
    });

    starMissionStartButton?.addEventListener('click', () => {
        playUiClickSound('start');
        stopStarMissionSequence();
        showStarMissionSetup();
    });

    starMissionTargetOptions.forEach((option) => {
        option.addEventListener('click', () => {
            playUiClickSound('start');
            setStarMissionTarget(option.dataset.starTarget);
            startStarMissionGame();
        });
    });

    starMissionRetryButton?.addEventListener('click', () => {
        playUiClickSound('start');
        showStarMissionSetup();
    });

    diamondMissionStartButton?.addEventListener('click', () => {
        playUiClickSound('start');
        startDiamondMissionGame();
    });

    diamondMissionPauseButton?.addEventListener('click', () => {
        playUiClickSound('start');
        setDiamondMissionPaused(!diamondMissionPaused);
    });

    heartGameRetryButton?.addEventListener('click', () => {
        playUiClickSound('start');
        resetHeartGameState();
        resetHeartCupidBow();
    });

    heartFinalReplayButton?.addEventListener('click', () => {
        playUiClickSound('start');
        stopHeartCupidGame();
        stopHeartMissionSequence();
        if (!heartMissionIntro || !heartMissionStartButton) return;
        heartMissionPage?.classList.add('is-heart-mission-active');
        heartMissionIntro.hidden = false;
        heartMissionIntro.setAttribute('aria-hidden', 'false');
        heartMissionStartButton.hidden = false;
        heartMissionStartButton.getBoundingClientRect();
        heartMissionStartButton.classList.add('is-visible');
        heartMissionStartButton.focus({ preventScroll: true });
    });

    heartFinalNextButton?.addEventListener('click', () => {
        playUiClickSound('chime');
        stopHeartVictoryCelebration();
        openShapeCameraLayout('heartCamera');
    });

    const resetShapePreviewPage = (page) => {
        if (!page) return;

        delete page.dataset.lessonReplay;
        shapePreviewSceneCleanupByPage.get(page)?.();
        stopShapePreviewIntro(page);
        if (page === diamondMissionPage) stopDiamondMissionSequence();

        const background = page.querySelector('.shape-area-bg');
        const videoStage = page.querySelector('.shape-preview-video-stage');
        const video = page.querySelector('.shape-preview-video');
        const lessonImage = page.querySelector('.shape-preview-lesson-image');
        const mascot = page.querySelector('.shape-preview-mascot');
        const questionPanel = page.querySelector('.shape-preview-question-panel');
        const playButton = page.querySelector('.shape-preview-play-button');
        const skipButton = page.querySelector('.shape-preview-skip-button');
        const progress = shapePreviewProgressByPage.get(page);
        const progressStars = progress?.querySelector('.circle-lesson-stars') || null;
        const progressMessage = progress?.querySelector('.circle-lesson-star-message') || null;
        const replayButton = progress?.querySelector('[data-shape-preview-replay]') || null;
        const replayImage = replayButton?.querySelector('img') || null;
        const bridgeCharacterSequence = page.querySelector('.triangle-bridge-character-sequence');
        const bridgeWalkingCharacter = page.querySelector('.triangle-bridge-walking-character');
        const bridgeArrivalCharacter = page.querySelector('.triangle-bridge-arrival-character');
        const jeepSequence = page.querySelector('.rectangle-jeep-sequence');
        const drivingJeep = page.querySelector('.rectangle-jeep-driving');
        const arrivedJeep = page.querySelector('.rectangle-jeep-arrived');
        const areaBackgroundSource = page.dataset.areaBackground;
        if (background && areaBackgroundSource) {
            background.src = areaBackgroundSource;
        }
        video?.pause?.();
        if (video) {
            video.removeAttribute('src');
            video.load();
            video.hidden = false;
        }
        if (lessonImage) lessonImage.hidden = true;
        if (mascot) mascot.hidden = true;
        if (questionPanel) questionPanel.hidden = true;
        if (playButton) playButton.hidden = false;
        if (skipButton) skipButton.hidden = page.dataset.lessonReplay !== 'true';
        if (bridgeCharacterSequence) {
            bridgeCharacterSequence.hidden = true;
            bridgeCharacterSequence.classList.remove('is-walking');
        }
        if (bridgeWalkingCharacter) bridgeWalkingCharacter.hidden = false;
        if (bridgeArrivalCharacter) bridgeArrivalCharacter.hidden = true;
        if (jeepSequence) {
            jeepSequence.hidden = true;
            jeepSequence.classList.remove('is-driving', 'is-arrived', 'is-exiting');
        }
        if (drivingJeep) drivingJeep.hidden = false;
        if (arrivedJeep) arrivedJeep.hidden = true;
        videoStage?.setAttribute('aria-hidden', 'true');
        progress?.setAttribute('aria-hidden', 'true');
        if (progress) progress.dataset.progressStage = 'lesson';
        if (progressStars) {
            progressStars.dataset.earnedStars = '1';
            progressStars.setAttribute('aria-label', '1 of 3 stars earned');
        }
        if (progressMessage) progressMessage.textContent = 'Well done!';
        if (replayImage) replayImage.src = 'assets/Buttons/replay.webp';
        replayButton?.setAttribute('aria-label', 'Replay shape lesson');
        page.classList.remove('is-transitioning-to-illustration', 'is-illustration-background', 'is-tv-lesson-image-visible', 'is-progress-visible', 'is-next-background', 'is-fading-to-triangle-game', 'is-rectangle-village-departing');
        resetShapeTvChoices(page);
    };

    const showShapePreviewProgress = (page) => {
        if (!page || !isPageVisible(page)) return;

        const videoStage = page.querySelector('.shape-preview-video-stage');
        const progress = shapePreviewProgressByPage.get(page);
        page.classList.remove('is-tv-lesson-image-visible');
        page.classList.add('is-progress-visible');
        videoStage?.setAttribute('aria-hidden', 'true');
        progress?.setAttribute('aria-hidden', 'false');
        playUiClickSound('boardSuccess');
        window.setTimeout(() => {
            if (isPageVisible(page) && page.classList.contains('is-progress-visible')) {
                playUiClickSound('starPop');
            }
        }, 700);
    };

    const showStarMissionRewardProgress = (session) => {
        if (session !== starMissionEndSession || !isPageVisible(starMissionPage)) return;

        const progress = shapePreviewProgressByPage.get(starMissionPage);
        if (progress) {
            progress.dataset.progressStage = 'hunt';
            const stars = progress.querySelector('.circle-lesson-stars');
            const message = progress.querySelector('.circle-lesson-star-message');
            const replayButton = progress.querySelector('[data-shape-preview-replay]');
            const replayImage = replayButton?.querySelector('img');
            if (stars) {
                stars.dataset.earnedStars = '2';
                stars.setAttribute('aria-label', '2 of 3 stars earned');
            }
            if (message) message.textContent = 'Amazing! You collected all stars!';
            if (replayImage) replayImage.src = 'assets/Buttons/Retry.webp';
            replayButton?.setAttribute('aria-label', 'Retry Star Mission');
        }

        stopStarMissionEndFlow();
        starMissionPage?.classList.add('is-lesson-complete');
        showShapePreviewProgress(starMissionPage);
    };

    const showDiamondMissionRewardProgress = (session) => {
        if (session !== diamondMissionSession || !isPageVisible(diamondMissionPage)) return;

        const progress = shapePreviewProgressByPage.get(diamondMissionPage);
        if (progress) {
            progress.dataset.progressStage = 'hunt';
            const stars = progress.querySelector('.circle-lesson-stars');
            const message = progress.querySelector('.circle-lesson-star-message');
            const replayButton = progress.querySelector('[data-shape-preview-replay]');
            const replayImage = replayButton?.querySelector('img');
            if (stars) {
                stars.dataset.earnedStars = '2';
                stars.setAttribute('aria-label', '2 of 3 stars earned');
            }
            if (message) message.textContent = 'Amazing! You found the crystal!';
            if (replayImage) replayImage.src = 'assets/Buttons/Retry.webp';
            replayButton?.setAttribute('aria-label', 'Retry Diamond Mission');
        }

        stopDiamondMissionSequence();
        diamondMissionPage.classList.add('is-lesson-complete');
        showShapePreviewProgress(diamondMissionPage);
    };

    const showShapePreviewIllustration = (page) => {
        if (!page || !isPageVisible(page)) return;

        const background = page.querySelector('.shape-area-bg');
        const videoStage = page.querySelector('.shape-preview-video-stage');
        const video = page.querySelector('.shape-preview-video');
        const lessonImage = page.querySelector('.shape-preview-lesson-image');
        const mascot = page.querySelector('.shape-preview-mascot');
        const questionPanel = page.querySelector('.shape-preview-question-panel');
        const playButton = page.querySelector('.shape-preview-play-button');
        const skipButton = page.querySelector('.shape-preview-skip-button');
        const illustrationBackgroundSource = page.dataset.illustrationBackground;
        const videoSource = page.dataset.videoSource;
        if (background && illustrationBackgroundSource) {
            background.src = illustrationBackgroundSource;
        }
        if (video && videoSource) {
            video.src = videoSource;
            video.load();
            video.hidden = false;
        }
        if (lessonImage) lessonImage.hidden = Boolean(videoSource);
        if (mascot) mascot.hidden = Boolean(videoSource);
        if (questionPanel) questionPanel.hidden = Boolean(videoSource);
        if (playButton) playButton.hidden = false;
        if (skipButton) skipButton.hidden = page.dataset.lessonReplay !== 'true';
        videoStage?.setAttribute('aria-hidden', videoSource || lessonImage ? 'false' : 'true');
        page.classList.remove('is-transitioning-to-illustration');
        page.classList.add('is-illustration-background');
        page.classList.toggle('is-tv-lesson-image-visible', !videoSource && Boolean(lessonImage));
    };

    const transitionToShapePreviewIllustration = (page) => {
        if (!page || !isPageVisible(page) || page.classList.contains('is-transitioning-to-illustration')) return false;

        const illustrationBackgroundSource = page.dataset.illustrationBackground;
        const videoSource = page.dataset.videoSource;
        if (!illustrationBackgroundSource) return false;

        const illustrationPreloader = window.Image ? new window.Image() : null;
        if (illustrationPreloader) {
            illustrationPreloader.src = illustrationBackgroundSource;
        }
        const video = page.querySelector('.shape-preview-video');
        if (video && videoSource) {
            video.src = videoSource;
            video.load();
        }
        page.classList.add('is-transitioning-to-illustration');

        const revealIllustration = () => showShapePreviewIllustration(page);
        const runWithLoading = getAppLoadingTransition();
        if (typeof runWithLoading === 'function' && runWithLoading(revealIllustration) !== false) {
            return true;
        }

        window.setTimeout(revealIllustration, loadingDuration);
        return true;
    };

    shapePreviewPages.forEach((page) => {
        const videoStage = page.querySelector('.shape-preview-video-stage');
        const startButton = page.querySelector('.shape-area-preview-start-button');
        const video = page.querySelector('.shape-preview-video');
        const lessonImage = page.querySelector('.shape-preview-lesson-image');
        const mascot = page.querySelector('.shape-preview-mascot');
        const questionPanel = page.querySelector('.shape-preview-question-panel');
        const playButton = page.querySelector('.shape-preview-play-button');
        const skipButton = page.querySelector('.shape-preview-skip-button');
        const progress = shapePreviewProgressByPage.get(page);
        const replayButton = progress?.querySelector('[data-shape-preview-replay]') || null;
        const nextButton = progress?.querySelector('[data-shape-preview-next]') || null;
        const bridgeCharacterSequence = page.querySelector('.triangle-bridge-character-sequence');
        const bridgeWalkingCharacter = page.querySelector('.triangle-bridge-walking-character');
        const bridgeArrivalCharacter = page.querySelector('.triangle-bridge-arrival-character');
        const jeepSequence = page.querySelector('.rectangle-jeep-sequence');
        const drivingJeep = page.querySelector('.rectangle-jeep-driving');
        const arrivedJeep = page.querySelector('.rectangle-jeep-arrived');
        const rectangleMessagePanel = page.querySelector('.rectangle-village-message-panel');
        const rectangleMessageText = page.querySelector('.rectangle-village-message-text');
        const rectangleGoButton = page.querySelector('.rectangle-village-go-button');
        const rectangleMissionGuideCharacter = page.querySelector('.rectangle-mission-guide-character');
        const rectangleMissionGuideCharacterCh5 = page.querySelector('.rectangle-mission-guide-character-ch5');
        const rectangleMissionObjectPanel = page.querySelector('.rectangle-mission-object-panel');
        const rectangleMissionObjects = Array.from(page.querySelectorAll('.rectangle-mission-object'));
        const rectangleMissionStorage = page.querySelector('.rectangle-mission-storage-slots');
        const rectangleMissionStorageSlots = Array.from(page.querySelectorAll('.rectangle-mission-storage-slot'));
        const bridgeWalkingCharacterSource = bridgeWalkingCharacter?.getAttribute('src') || '';
        const bridgeMessagePanel = page.querySelector('.triangle-bridge-message-panel');
        const bridgeMessageText = page.querySelector('.triangle-bridge-message-text');
        const bridgeYesButton = page.querySelector('.triangle-bridge-yes-button');
        const bridgeDialogueMessages = [
            'Naku! Sira ang tulay! Hindi ako makakatawid papunta sa bundok',
            'Kaibigan, maaari mo ba akong tulungang ayusin ito?',
        ];
        const bridgeDialogueSegments = [
            { start: 0, end: 4.9 },
            { start: 4.9, end: 8.8 },
        ];
        let bridgeDialogueSession = 0;
        let bridgeDialogueAudio = null;
        let bridgeDialogueFrame = null;
        let bridgeDialogueTimers = [];
        let bridgeDialogueAdvance = null;

        const stopBridgeDialogue = () => {
            bridgeDialogueSession += 1;
            bridgeDialogueTimers.forEach((timerId) => window.clearTimeout(timerId));
            bridgeDialogueTimers = [];
            if (bridgeDialogueFrame !== null) {
                window.cancelAnimationFrame(bridgeDialogueFrame);
                bridgeDialogueFrame = null;
            }
            if (bridgeDialogueAudio) {
                bridgeDialogueAudio.pause?.();
                bridgeDialogueAudio = null;
            }
            bridgeDialogueAdvance = null;
            page.classList.remove('is-bridge-dialog-ready');
            if (bridgeMessagePanel) {
                bridgeMessagePanel.hidden = true;
                bridgeMessagePanel.classList.remove('is-visible', 'is-message-complete', 'is-final-message');
            }
            if (bridgeMessageText) bridgeMessageText.textContent = '';
            if (bridgeYesButton) {
                bridgeYesButton.hidden = true;
                bridgeYesButton.classList.remove('is-visible');
                bridgeYesButton.disabled = false;
            }
        };

        const startBridgeDialogue = () => {
            if (!bridgeMessagePanel || !bridgeMessageText || !isPageVisible(page)) return;

            stopBridgeDialogue();
            const session = bridgeDialogueSession;
            bridgeMessagePanel.hidden = false;
            bridgeMessagePanel.getBoundingClientRect();
            bridgeMessagePanel.classList.add('is-visible');

            const playStage = (stageIndex) => {
                const message = bridgeDialogueMessages[stageIndex];
                const segment = bridgeDialogueSegments[stageIndex];
                if (!message || !segment || session !== bridgeDialogueSession) return;

                bridgeDialogueAdvance = null;
                page.classList.remove('is-bridge-dialog-ready');
                bridgeMessagePanel.classList.remove('is-message-complete', 'is-final-message');
                bridgeMessagePanel.classList.toggle('is-final-message', stageIndex >= bridgeDialogueMessages.length - 1);
                bridgeMessageText.textContent = '';
                if (bridgeYesButton) {
                    bridgeYesButton.hidden = true;
                    bridgeYesButton.classList.remove('is-visible');
                }
                let textFinished = false;
                let audioFinished = false;

                const unlockStage = () => {
                    if (!textFinished || !audioFinished || session !== bridgeDialogueSession) return;
                    if (stageIndex < bridgeDialogueMessages.length - 1) {
                        const advanceStage = () => {
                            if (session !== bridgeDialogueSession || bridgeDialogueAdvance !== advanceStage) return;
                            bridgeDialogueAdvance = null;
                            playStage(stageIndex + 1);
                        };
                        bridgeDialogueAdvance = advanceStage;
                        page.classList.add('is-bridge-dialog-ready');
                        bridgeDialogueTimers.push(window.setTimeout(advanceStage, 700));
                    } else if (bridgeYesButton) {
                        bridgeYesButton.hidden = false;
                        bridgeYesButton.getBoundingClientRect();
                        bridgeYesButton.classList.add('is-visible');
                    }
                };

                let characterIndex = 0;
                const typeNextCharacter = () => {
                    if (session !== bridgeDialogueSession) return;
                    characterIndex += 1;
                    bridgeMessageText.textContent = message.slice(0, characterIndex);
                    if (characterIndex < message.length) {
                        bridgeDialogueTimers.push(window.setTimeout(typeNextCharacter, 28));
                        return;
                    }
                    textFinished = true;
                    bridgeMessagePanel.classList.add('is-message-complete');
                    unlockStage();
                };
                typeNextCharacter();

                const AudioCtor = window.Audio;
                if (!AudioCtor) {
                    audioFinished = true;
                    unlockStage();
                    return;
                }

                const audio = new AudioCtor('assets/Audios/Voice over/Naku.mp3');
                bridgeDialogueAudio = audio;
                audio.preload = 'auto';
                audio.playsInline = true;
                try {
                    audio.currentTime = segment.start;
                } catch (error) {
                    // The timestamp is applied as soon as the audio can play.
                }

                const finishAudio = () => {
                    if (session !== bridgeDialogueSession || bridgeDialogueAudio !== audio) return;
                    audio.pause?.();
                    bridgeDialogueAudio = null;
                    bridgeDialogueFrame = null;
                    audioFinished = true;
                    unlockStage();
                };

                audio.play().then(() => {
                    const stopAtSegmentEnd = () => {
                        if (session !== bridgeDialogueSession || bridgeDialogueAudio !== audio) return;
                        if (audio.currentTime >= segment.end || audio.ended) {
                            finishAudio();
                            return;
                        }
                        bridgeDialogueFrame = window.requestAnimationFrame(stopAtSegmentEnd);
                    };
                    bridgeDialogueFrame = window.requestAnimationFrame(stopAtSegmentEnd);
                }).catch(finishAudio);
            };

            playStage(0);
        };

        const rectangleDialogueMessages = [
            'Hello explorer!',
            'Para sa ating Rectangle Mission, tulungan mo akong ihatid ang mga gamit sa Rectangle Village.',
            'Piliin ang tatlong bagay na hugis rectangle at ilagay ito sa jeep.',
        ];
        const rectangleDialogueSegments = [
            { start: 0, end: 1.4 },
            { start: 1.4, end: 7.3 },
            { start: 0, end: null },
        ];
        const rectangleMessagePauseMs = 420;
        let rectangleDialogueSession = 0;
        let rectangleDialogueAudio = null;
        let rectangleDialogueReplacementAudio = null;
        let rectangleDialogueCompletionAudio = null;
        let rectangleDialogueFrame = null;
        let rectangleDialogueTimers = [];
        let rectangleMissionCompleted = false;

        const stopRectangleDialogue = () => {
            rectangleDialogueSession += 1;
            rectangleDialogueTimers.forEach((timerId) => window.clearTimeout(timerId));
            rectangleDialogueTimers = [];
            if (rectangleDialogueFrame !== null) {
                window.cancelAnimationFrame(rectangleDialogueFrame);
                rectangleDialogueFrame = null;
            }
            if (rectangleDialogueAudio) {
                rectangleDialogueAudio.onended = null;
                rectangleDialogueAudio.pause?.();
                rectangleDialogueAudio = null;
            }
            if (rectangleDialogueReplacementAudio) {
                rectangleDialogueReplacementAudio.pause?.();
                rectangleDialogueReplacementAudio = null;
            }
            if (rectangleDialogueCompletionAudio) {
                rectangleDialogueCompletionAudio.pause?.();
                rectangleDialogueCompletionAudio = null;
            }
            rectangleMissionCompleted = false;
            if (rectangleMessagePanel) rectangleMessagePanel.hidden = true;
            if (rectangleMessageText) rectangleMessageText.textContent = '';
            if (rectangleGoButton) rectangleGoButton.hidden = true;
            if (rectangleGoButton) rectangleGoButton.disabled = false;
            if (rectangleMissionGuideCharacter) rectangleMissionGuideCharacter.hidden = true;
            if (rectangleMissionGuideCharacterCh5) rectangleMissionGuideCharacterCh5.hidden = true;
            if (rectangleMissionObjectPanel) rectangleMissionObjectPanel.hidden = true;
            if (rectangleMissionStorage) rectangleMissionStorage.hidden = true;
            rectangleMissionStorageSlots.forEach((slot) => {
                slot.classList.remove('is-over', 'is-filled');
            });
            rectangleMissionObjects.forEach((object) => {
                object.hidden = false;
                object.disabled = true;
                object.classList.remove('is-selected', 'is-dragging', 'is-returning', 'is-stored');
                object.setAttribute('aria-pressed', 'false');
                object.style.setProperty('--drag-x', '0px');
                object.style.setProperty('--drag-y', '0px');
                object.style.setProperty('--snap-scale', '1');
            });
        };

        const startRectangleDialogue = () => {
            if (!rectangleMessagePanel || !rectangleMessageText || !isPageVisible(page)) return;
            stopRectangleDialogue();
            const session = rectangleDialogueSession;
            rectangleMessagePanel.hidden = false;
            rectangleMessageText.textContent = '';
            if (rectangleMissionGuideCharacter) rectangleMissionGuideCharacter.hidden = false;
            if (rectangleMissionGuideCharacterCh5) rectangleMissionGuideCharacterCh5.hidden = true;
            if (rectangleMissionObjectPanel) rectangleMissionObjectPanel.hidden = false;
            if (rectangleMissionStorage) rectangleMissionStorage.hidden = false;
            alignRectangleMissionStorageSlots();
            rectangleMissionObjects.forEach((object) => {
                object.hidden = false;
                object.disabled = true;
                object.classList.remove('is-selected', 'is-dragging', 'is-returning', 'is-stored');
                object.setAttribute('aria-pressed', 'false');
                object.style.setProperty('--drag-x', '0px');
                object.style.setProperty('--drag-y', '0px');
                object.style.setProperty('--snap-scale', '1');
            });

            const AudioCtor = window.Audio;
            if (AudioCtor) {
                rectangleDialogueAudio = new AudioCtor('assets/Audios/Voice over/rectanglemission.mp3');
                rectangleDialogueAudio.preload = 'auto';
                rectangleDialogueAudio.playsInline = true;
                rectangleDialogueAudio.load?.();
                rectangleDialogueReplacementAudio = new AudioCtor('assets/Audios/Voice over/piliin.mp3?v=20260917-1');
                rectangleDialogueReplacementAudio.preload = 'auto';
                rectangleDialogueReplacementAudio.playsInline = true;
                rectangleDialogueReplacementAudio.load?.();
                rectangleDialogueCompletionAudio = new AudioCtor('assets/Audios/Voice over/Masayang biyahe.mp3');
                rectangleDialogueCompletionAudio.preload = 'auto';
                rectangleDialogueCompletionAudio.playsInline = true;
                rectangleDialogueCompletionAudio.load?.();
            }
            const playStage = (stageIndex) => {
                if (session !== rectangleDialogueSession || !isPageVisible(page) || !rectangleDialogueMessages[stageIndex]) return;
                const segment = rectangleDialogueSegments[stageIndex];
                const audio = stageIndex === 2 ? rectangleDialogueReplacementAudio : rectangleDialogueAudio;
                if (rectangleMissionGuideCharacter) rectangleMissionGuideCharacter.hidden = false;
                if (rectangleMissionGuideCharacterCh5) rectangleMissionGuideCharacterCh5.hidden = true;
                rectangleMessageText.textContent = rectangleDialogueMessages[stageIndex];
                if (rectangleGoButton) rectangleGoButton.hidden = true;
                let stageFinished = false;
                const finishStage = () => {
                    if (stageFinished || session !== rectangleDialogueSession) return;
                    stageFinished = true;
                    audio?.pause?.();
                    if (audio) audio.onended = null;
                    if (rectangleDialogueFrame !== null) {
                        window.cancelAnimationFrame(rectangleDialogueFrame);
                        rectangleDialogueFrame = null;
                    }
                    if (stageIndex >= rectangleDialogueMessages.length - 1) {
                        rectangleMissionObjects.forEach((object) => {
                            object.disabled = false;
                        });
                        return;
                    }
                    rectangleDialogueTimers.push(window.setTimeout(() => playStage(stageIndex + 1), rectangleMessagePauseMs));
                };

                if (!audio) {
                    const fallbackDuration = Number.isFinite(segment.end)
                        ? (segment.end - segment.start) * 1000
                        : 4200;
                    rectangleDialogueTimers.push(window.setTimeout(finishStage, fallbackDuration));
                    return;
                }
                try {
                    audio.currentTime = segment.start;
                } catch (error) {
                    // The start point is applied once metadata is available.
                }
                audio.onended = finishStage;
                audio.play().then(() => {
                    const stopAtSegmentEnd = () => {
                        if (stageFinished || session !== rectangleDialogueSession) return;
                        if ((Number.isFinite(segment.end) && audio.currentTime >= segment.end) || audio.ended) {
                            finishStage();
                            return;
                        }
                        rectangleDialogueFrame = window.requestAnimationFrame(stopAtSegmentEnd);
                    };
                    rectangleDialogueFrame = window.requestAnimationFrame(stopAtSegmentEnd);
                }).catch(() => {
                    if (session !== rectangleDialogueSession) return;
                    const fallbackDuration = Number.isFinite(segment.end)
                        ? (segment.end - segment.start) * 1000
                        : 4200;
                    rectangleDialogueTimers.push(window.setTimeout(finishStage, fallbackDuration));
                });
            };

            rectangleDialogueTimers.push(window.setTimeout(() => playStage(0), rectangleMessagePauseMs));
        };

        const startRectangleCompletionDialogue = () => {
            if (rectangleMissionCompleted || !rectangleMessageText || !isPageVisible(page)) return;
            rectangleMissionCompleted = true;
            const session = rectangleDialogueSession;
            const completionStages = [
                {
                    message: 'Handa ka na ba sa isang masayang biyahe?',
                    audio: rectangleDialogueCompletionAudio,
                    start: 0,
                    end: 2.5,
                },
                {
                    message: 'Tara na! Sumakay na at simulan natin ang Bibi\u2019s Rectangle Delivery!',
                    audio: rectangleDialogueAudio,
                    start: 9.8,
                    end: 14.8,
                },
            ];

            rectangleMissionObjects.forEach((object) => {
                object.disabled = true;
            });

            const playCompletionStage = (stageIndex) => {
                const stage = completionStages[stageIndex];
                if (!stage || session !== rectangleDialogueSession || !isPageVisible(page)) return;
                if (rectangleMissionGuideCharacter) rectangleMissionGuideCharacter.hidden = true;
                if (rectangleMissionGuideCharacterCh5) rectangleMissionGuideCharacterCh5.hidden = false;
                rectangleMessageText.textContent = stage.message;
                if (rectangleGoButton) rectangleGoButton.hidden = true;

                let stageFinished = false;
                const finishStage = () => {
                    if (stageFinished || session !== rectangleDialogueSession) return;
                    stageFinished = true;
                    stage.audio?.pause?.();
                    if (stage.audio) stage.audio.onended = null;
                    if (rectangleDialogueFrame !== null) {
                        window.cancelAnimationFrame(rectangleDialogueFrame);
                        rectangleDialogueFrame = null;
                    }
                    if (stageIndex < completionStages.length - 1) {
                        rectangleDialogueTimers.push(window.setTimeout(
                            () => playCompletionStage(stageIndex + 1),
                            rectangleMessagePauseMs,
                        ));
                    } else if (rectangleGoButton) {
                        rectangleGoButton.hidden = false;
                    }
                };

                const audio = stage.audio;
                if (!audio) {
                    rectangleDialogueTimers.push(window.setTimeout(
                        finishStage,
                        (stage.end - stage.start) * 1000,
                    ));
                    return;
                }

                try {
                    audio.currentTime = stage.start;
                } catch (error) {
                    // The timestamp is applied as soon as the audio can play.
                }
                audio.onended = finishStage;
                audio.play().then(() => {
                    const stopAtCompletionEnd = () => {
                        if (stageFinished || session !== rectangleDialogueSession) return;
                        if (audio.currentTime >= stage.end || audio.ended) {
                            finishStage();
                            return;
                        }
                        rectangleDialogueFrame = window.requestAnimationFrame(stopAtCompletionEnd);
                    };
                    rectangleDialogueFrame = window.requestAnimationFrame(stopAtCompletionEnd);
                }).catch(() => {
                    if (session !== rectangleDialogueSession) return;
                    rectangleDialogueTimers.push(window.setTimeout(
                        finishStage,
                        (stage.end - stage.start) * 1000,
                    ));
                });
            };

            rectangleDialogueTimers.push(window.setTimeout(
                () => playCompletionStage(0),
                rectangleMessagePauseMs,
            ));
        };

        const alignRectangleMissionStorageSlots = () => {
            if (!rectangleMissionStorage || !rectangleMissionStorageSlots.length || page.hidden) return;
            const background = page.querySelector('.shape-area-bg');
            if (!background) return;

            const pageRect = page.getBoundingClientRect();
            const sourceWidth = background.naturalWidth || 1672;
            const sourceHeight = background.naturalHeight || 941;
            if (!pageRect.width || !pageRect.height) return;

            const scale = Math.max(pageRect.width / sourceWidth, pageRect.height / sourceHeight);
            const offsetX = (pageRect.width - (sourceWidth * scale)) / 2;
            const offsetY = (pageRect.height - (sourceHeight * scale)) / 2;

            rectangleMissionStorageSlots.forEach((slot) => {
                slot.style.left = `${offsetX + (Number(slot.dataset.sourceX) * scale)}px`;
                slot.style.top = `${offsetY + (Number(slot.dataset.sourceY) * scale)}px`;
                slot.style.width = `${Number(slot.dataset.sourceWidth) * scale}px`;
                slot.style.height = `${Number(slot.dataset.sourceHeight) * scale}px`;
            });
        };

        const snapRectangleMissionObject = (object, slot) => {
            if (!object || !slot) return;
            const objectRect = object.getBoundingClientRect();
            const slotRect = slot.getBoundingClientRect();
            const targetX = (slotRect.left + (slotRect.width / 2)) - (objectRect.left + (objectRect.width / 2));
            const targetY = (slotRect.top + (slotRect.height / 2)) - (objectRect.top + (objectRect.height / 2));
            const snapScale = Math.min(
                (slotRect.width * 0.92) / objectRect.width,
                (slotRect.height * 0.92) / objectRect.height,
                1,
            );

            object.classList.remove('is-dragging');
            object.classList.add('is-stored');
            object.disabled = true;
            object.setAttribute('aria-pressed', 'true');
            object.style.setProperty('--drag-x', `${targetX}px`);
            object.style.setProperty('--drag-y', `${targetY}px`);
            object.style.setProperty('--snap-scale', String(snapScale));
            slot.classList.remove('is-over');
            slot.classList.add('is-filled');
            playUiClickSound('woodStore');
            if (rectangleMissionStorageSlots.every((storageSlot) => storageSlot.classList.contains('is-filled'))) {
                startRectangleCompletionDialogue();
            }
        };

        rectangleMissionObjects.forEach((object) => {
            object.setAttribute('aria-pressed', 'false');
            object.addEventListener('click', () => {
                if (object.disabled || object.classList.contains('is-stored')) return;

                if (object.hasAttribute('data-rectangle-correct')) {
                    const availableSlot = rectangleMissionStorageSlots.find((slot) => !slot.classList.contains('is-filled'));
                    if (availableSlot) snapRectangleMissionObject(object, availableSlot);
                    return;
                }

                playUiClickSound('thunk');
                object.classList.remove('is-wrong');
                object.getBoundingClientRect();
                object.classList.add('is-wrong');
                const timerId = window.setTimeout(() => {
                    object.classList.remove('is-wrong');
                    rectangleDialogueTimers = rectangleDialogueTimers.filter((id) => id !== timerId);
                }, 420);
                rectangleDialogueTimers.push(timerId);
            });
            object.addEventListener('dragstart', (event) => event.preventDefault());
        });
        page.querySelector('.shape-area-bg')?.addEventListener('load', alignRectangleMissionStorageSlots);
        window.addEventListener('resize', alignRectangleMissionStorageSlots);

        shapePreviewSceneCleanupByPage.set(page, () => {
            stopBridgeDialogue();
            stopRectangleDialogue();
            if (page === heartMissionPage) {
                stopHeartMissionSequence();
                stopHeartCupidGame();
            }
            if (page === starMissionPage) {
                stopStarMissionSequence();
                stopStarMissionGame();
                stopStarMissionEndFlow();
                if (starMissionSetup) starMissionSetup.hidden = true;
            }
            if (page === diamondMissionPage) {
                stopDiamondMissionSequence();
            }
        });
        rectangleGoButton?.addEventListener('click', () => {
            if (!isPageVisible(page) || rectangleGoButton.hidden || rectangleGoButton.disabled) return;
            stopRectangleDialogue();
            rectangleGoButton.disabled = true;
            page.classList.add('is-rectangle-village-departing');
            if (jeepSequence) {
                jeepSequence.classList.remove('is-driving', 'is-arrived');
                if (arrivedJeep) arrivedJeep.hidden = true;
                if (drivingJeep) drivingJeep.hidden = false;
                jeepSequence.getBoundingClientRect();
                jeepSequence.classList.add('is-exiting');
            }
            const openRectangleDeliveryTimer = window.setTimeout(() => {
                window.location.hash = '#rectangle-delivery';
            }, 520);
            rectangleDialogueTimers.push(openRectangleDeliveryTimer);
        });
        page.addEventListener('click', (event) => {
            if (event.target.closest('a, button') || typeof bridgeDialogueAdvance !== 'function') return;
            const advance = bridgeDialogueAdvance;
            advance();
        });

        bridgeYesButton?.addEventListener('click', () => {
            if (!isPageVisible(page) || !page.classList.contains('is-next-background') || bridgeYesButton.disabled) return;
            bridgeYesButton.disabled = true;
            page.classList.add('is-fading-to-triangle-game');
            const openTriangleGameTimer = window.setTimeout(() => {
                window.location.hash = '#triangle-game';
                bridgeDialogueTimers = bridgeDialogueTimers.filter((timerId) => timerId !== openTriangleGameTimer);
            }, 550);
            bridgeDialogueTimers.push(openTriangleGameTimer);
        });

        bridgeCharacterSequence?.addEventListener('animationend', (event) => {
            if (event.target !== bridgeCharacterSequence || event.animationName !== 'triangleBridgeWalkDesktop') return;
            if (bridgeWalkingCharacter) bridgeWalkingCharacter.hidden = true;
            if (bridgeArrivalCharacter) bridgeArrivalCharacter.hidden = false;
            bridgeCharacterSequence.classList.remove('is-walking');
            startBridgeDialogue();
        });

        jeepSequence?.addEventListener('animationend', (event) => {
            if (event.target !== jeepSequence || event.animationName !== 'rectangleJeepDriveDesktop') return;
            if (!isPageVisible(page) || !page.classList.contains('is-next-background')) return;
            if (drivingJeep) drivingJeep.hidden = true;
            if (arrivedJeep) arrivedJeep.hidden = false;
            jeepSequence.classList.remove('is-driving');
            jeepSequence.classList.add('is-arrived');
            startRectangleDialogue();
        });

        startButton?.addEventListener('click', () => {
            delete page.dataset.lessonReplay;
            stopShapePreviewIntro(page);
            transitionToShapePreviewIllustration(page);
        });

        const resetVideoControls = () => {
            video?.pause?.();
            if (video) {
                try {
                    video.currentTime = 0;
                } catch (error) {
                    // The video can reset after its metadata becomes available.
                }
            }
            if (playButton) playButton.hidden = false;
            if (skipButton) skipButton.hidden = page.dataset.lessonReplay !== 'true';
        };

        const showLessonBackground = () => {
            delete page.dataset.lessonReplay;
            video?.pause?.();
            if (video) video.hidden = true;
            if (lessonImage) lessonImage.hidden = false;
            if (mascot) mascot.hidden = false;
            if (questionPanel) questionPanel.hidden = false;
            if (playButton) playButton.hidden = true;
            if (skipButton) skipButton.hidden = true;
            videoStage?.setAttribute('aria-hidden', 'false');
            page.classList.add('is-tv-lesson-image-visible');
        };

        const playShapePreviewLessonVideo = async () => {
            if (!video || !isPageVisible(page) || !page.classList.contains('is-illustration-background')) return;

            if (playButton) playButton.hidden = true;
            if (skipButton) skipButton.hidden = false;
            try {
                video.currentTime = 0;
                await video.play();
            } catch (error) {
                resetVideoControls();
                console.warn('Shape lesson video could not play.', error);
            }
        };

        playButton?.addEventListener('click', playShapePreviewLessonVideo);

        skipButton?.addEventListener('click', () => {
            showLessonBackground();
            scheduleShapeQuestionAudio();
        });
        video?.addEventListener('ended', () => {
            showLessonBackground();
            if (page === starMissionPage) scheduleShapeQuestionAudio();
        });

        replayButton?.addEventListener('click', () => {
            if (page === starMissionPage && progress?.dataset.progressStage === 'hunt') {
                page.classList.remove('is-progress-visible', 'is-lesson-complete');
                progress?.setAttribute('aria-hidden', 'true');
                showStarMissionRetryStart();
                return;
            }
            if (page === diamondMissionPage && progress?.dataset.progressStage === 'hunt') {
                page.classList.remove('is-progress-visible', 'is-lesson-complete');
                progress.setAttribute('aria-hidden', 'true');
                showDiamondMissionRetryStart();
                return;
            }
            page.classList.remove('is-progress-visible');
            progress?.setAttribute('aria-hidden', 'true');
            resetShapeTvChoices(page);
            page.dataset.lessonReplay = 'true';
            showShapePreviewIllustration(page);
            playButton?.focus({ preventScroll: true });
        });

        nextButton?.addEventListener('click', () => {
            if ((page === starMissionPage || page === diamondMissionPage) && progress?.dataset.progressStage === 'hunt') {
                if (page.dataset.cameraRoute) {
                    openShapeCameraLayout(page.dataset.cameraRoute);
                    return;
                }
                window.location.hash = '#game3';
                return;
            }

            const nextBackgroundSource = page.dataset.nextBackground;
            if (!nextBackgroundSource) {
                if (page.dataset.cameraRoute) {
                    openShapeCameraLayout(page.dataset.cameraRoute);
                    return;
                }

                window.location.hash = '#game3';
                return;
            }

            const background = page.querySelector('.shape-area-bg');
            const revealNextBackground = () => {
                if (!isPageVisible(page)) return;
                if (background) background.src = nextBackgroundSource;
                page.classList.remove('is-progress-visible', 'is-tv-lesson-image-visible', 'is-illustration-background');
                page.classList.add('is-next-background');
                progress?.setAttribute('aria-hidden', 'true');
                videoStage?.setAttribute('aria-hidden', 'true');
                if (page === heartMissionPage) startHeartMissionSequence();
                if (page === starMissionPage) startStarMissionSequence();
                if (page === diamondMissionPage) startDiamondMissionSequence();
                if (rectangleMissionGuideCharacter || rectangleMissionObjectPanel) {
                    if (jeepSequence) {
                        jeepSequence.hidden = true;
                        jeepSequence.classList.remove('is-driving', 'is-arrived', 'is-exiting');
                    }
                    startRectangleDialogue();
                } else if (jeepSequence) {
                    stopRectangleDialogue();
                    jeepSequence.hidden = true;
                    jeepSequence.classList.remove('is-driving', 'is-arrived');
                    if (drivingJeep) drivingJeep.hidden = false;
                    if (arrivedJeep) arrivedJeep.hidden = true;
                    jeepSequence.getBoundingClientRect();
                    jeepSequence.hidden = false;
                    jeepSequence.classList.add('is-driving');
                }
                if (bridgeCharacterSequence) {
                    bridgeCharacterSequence.hidden = true;
                    bridgeCharacterSequence.classList.remove('is-walking');
                    if (bridgeWalkingCharacter) {
                        bridgeWalkingCharacter.hidden = false;
                        if (bridgeWalkingCharacterSource) {
                            bridgeWalkingCharacter.src = `${bridgeWalkingCharacterSource}?play=${Date.now()}`;
                        }
                    }
                    if (bridgeArrivalCharacter) bridgeArrivalCharacter.hidden = true;
                    bridgeCharacterSequence.getBoundingClientRect();

                    let hasStartedWalking = false;
                    const startBridgeWalk = () => {
                        if (hasStartedWalking || !isPageVisible(page) || !page.classList.contains('is-next-background')) return;
                        hasStartedWalking = true;
                        bridgeCharacterSequence.classList.add('is-walking');
                        bridgeCharacterSequence.hidden = false;
                    };

                    if (!bridgeWalkingCharacter || bridgeWalkingCharacter.complete) {
                        startBridgeWalk();
                    } else {
                        bridgeWalkingCharacter.addEventListener('load', startBridgeWalk, { once: true });
                        bridgeWalkingCharacter.addEventListener('error', startBridgeWalk, { once: true });
                    }
                }
            };

            const preloader = window.Image ? new window.Image() : null;
            if (preloader) preloader.src = nextBackgroundSource;
            revealNextBackground();
        });
    });

    const stopRectangleFinalCelebrationAudio = () => {
        [rectangleFinalCompletedAudio, rectangleFinalCheeringAudio, rectangleFinalMahusayAudio].forEach((audio) => {
            if (!audio) return;
            audio.onended = null;
            audio.pause();
            audio.currentTime = 0;
        });
        rectangleFinalCompletedAudio = null;
        rectangleFinalCheeringAudio = null;
        rectangleFinalMahusayAudio = null;
    };

    const prepareRectangleFinalConfetti = () => {
        if (!rectangleDeliveryCompleteConfetti || rectangleDeliveryCompleteConfetti.childElementCount) return;
        const colors = ['#ff4c6a', '#ffe35d', '#33c76f', '#34a9ff', '#ff9b2f', '#a85dff'];
        for (let index = 0; index < 38; index += 1) {
            const piece = document.createElement('span');
            piece.style.setProperty('--confetti-x', `${3 + Math.random() * 94}%`);
            piece.style.setProperty('--confetti-color', colors[index % colors.length]);
            piece.style.setProperty('--confetti-delay', `${(Math.random() * -4).toFixed(2)}s`);
            piece.style.setProperty('--confetti-duration', `${(3.8 + Math.random() * 2.6).toFixed(2)}s`);
            piece.style.setProperty('--confetti-drift', `${Math.round((Math.random() * 18) - 9)}vw`);
            piece.style.setProperty('--confetti-rotate', `${Math.round(Math.random() * 360)}deg`);
            rectangleDeliveryCompleteConfetti.append(piece);
        }
    };

    const hideRectangleFinalProgress = () => {
        rectangleDeliveryPage?.classList.remove('is-rectangle-final-progress-visible');
        rectangleFinalProgress?.setAttribute('aria-hidden', 'true');
    };

    const showRectangleFinalProgress = () => {
        if (!rectangleDeliveryPage || rectangleDeliveryPage.hidden || !rectangleDeliveryPage.classList.contains('is-final-complete-scene')) return;
        rectangleDeliveryPage.classList.add('is-rectangle-final-progress-visible');
        rectangleFinalProgress?.setAttribute('aria-hidden', 'false');
        playUiClickSound('boardSuccess');
        window.setTimeout(() => {
            if (rectangleDeliveryPage.classList.contains('is-rectangle-final-progress-visible')) {
                playUiClickSound('starPop');
            }
        }, 650);
    };

    const startRectangleFinalCelebrationAudio = () => {
        if (rectangleFinalCelebrationStarted || !rectangleDeliveryPage?.classList.contains('is-final-complete-scene')) return;
        if (!window.Audio) {
            rectangleFinalCelebrationStarted = true;
            window.setTimeout(showRectangleFinalProgress, 1600);
            return;
        }
        rectangleFinalCelebrationStarted = true;
        stopRectangleFinalCelebrationAudio();
        const mahusayAudio = new window.Audio('assets/Audios/Voice over/Mahusay.mp3');
        const completedAudio = new window.Audio('assets/Audios/Sound effects/completed.mp3');
        const cheeringAudio = new window.Audio('assets/Audios/Sound effects/kids cheering.mp3');
        rectangleFinalMahusayAudio = mahusayAudio;
        rectangleFinalCompletedAudio = completedAudio;
        rectangleFinalCheeringAudio = cheeringAudio;
        mahusayAudio.preload = 'auto';
        completedAudio.preload = 'auto';
        cheeringAudio.preload = 'auto';
        mahusayAudio.playsInline = true;
        completedAudio.playsInline = true;
        cheeringAudio.playsInline = true;
        mahusayAudio.onended = () => {
            if (rectangleFinalMahusayAudio === mahusayAudio) rectangleFinalMahusayAudio = null;
        };
        completedAudio.onended = () => {
            if (rectangleFinalCompletedAudio !== completedAudio || !rectangleDeliveryPage?.classList.contains('is-final-complete-scene')) return;
            cheeringAudio.currentTime = 0;
            cheeringAudio.play().catch(() => showRectangleFinalProgress());
        };
        cheeringAudio.onended = () => {
            if (rectangleFinalCheeringAudio === cheeringAudio) rectangleFinalCheeringAudio = null;
            showRectangleFinalProgress();
        };
        mahusayAudio.currentTime = 0;
        mahusayAudio.play().catch(() => {});
        completedAudio.currentTime = 0;
        completedAudio.play().catch(() => {
            if (rectangleFinalCompletedAudio !== completedAudio) return;
            cheeringAudio.currentTime = 0;
            cheeringAudio.play().catch(() => showRectangleFinalProgress());
        });
    };

    const resetRectangleFinalCompleteScene = () => {
        rectangleFinalCompletePending = false;
        rectangleFinalCelebrationStarted = false;
        stopRectangleFinalCelebrationAudio();
        rectangleDeliveryPage?.classList.remove('is-final-complete-scene', 'is-rectangle-final-progress-visible');
        rectangleFinalProgress?.setAttribute('aria-hidden', 'true');
        if (rectangleDeliveryCompleteBg) rectangleDeliveryCompleteBg.hidden = true;
        if (rectangleDeliveryCompleteConfetti) rectangleDeliveryCompleteConfetti.hidden = true;
    };

    const resetRectangleDeliveryJeep = ({ preserveRoadPosition = false, keepFinalScene = false } = {}) => {
        clearRectangleGamePause();
        if (!keepFinalScene) resetRectangleFinalCompleteScene();
        stopRectangleRoadLoop({ preservePosition: preserveRoadPosition });
        rectangleDeliveryPage?.classList.remove('is-road-jeep-hit');
        rectangleDeliveryJeepSequence?.classList.remove('is-boss-jumping');
        if (rectangleBossJumpButton) {
            rectangleBossJumpButton.hidden = false;
            rectangleBossJumpButton.disabled = true;
        }
        rectangleGasDepleted = false;
        rectangleGasPenaltyRemaining = 0;
        clearRectangleRoadGasPickup();
        rectangleGasMeter?.classList.remove('is-penalized');
        rectangleDeliveryPage?.classList.remove('is-gas-empty');
        if (rectangleGameOverRevealTimer !== null) {
            window.clearTimeout(rectangleGameOverRevealTimer);
            rectangleGameOverRevealTimer = null;
        }
        if (rectangleGameOverOverlay) {
            rectangleGameOverOverlay.hidden = true;
            rectangleGameOverOverlay.classList.remove('is-visible');
        }
        if (rectangleGameOverLoseAudio) {
            rectangleGameOverLoseAudio.pause();
            rectangleGameOverLoseAudio.currentTime = 0;
            rectangleGameOverLoseAudio = null;
        }
        if (rectangleWrongStopTimer !== null) {
            window.clearTimeout(rectangleWrongStopTimer);
            rectangleWrongStopTimer = null;
        }
        if (rectangleDeliveryRouteTimer !== null) {
            window.clearTimeout(rectangleDeliveryRouteTimer);
            rectangleDeliveryRouteTimer = null;
        }
        if (rectangleDeliveryRevealTimer !== null) {
            window.clearTimeout(rectangleDeliveryRevealTimer);
            rectangleDeliveryRevealTimer = null;
        }
        rectangleDeliveryPage?.classList.remove('is-road-entering', 'is-road-visible', 'is-road-stopped');
        if (rectangleDeliveryArrivalTimer !== null) {
            window.clearTimeout(rectangleDeliveryArrivalTimer);
            rectangleDeliveryArrivalTimer = null;
        }
        if (rectangleDeliveryTaskPanel) {
            rectangleDeliveryTaskPanel.hidden = true;
            rectangleDeliveryTaskPanel.classList.remove('is-visible');
        }
        if (rectangleDeliveryInstructionPanel) {
            rectangleDeliveryInstructionPanel.hidden = true;
            rectangleDeliveryInstructionPanel.classList.remove('is-visible');
            rectangleDeliveryInstructionPanel.textContent = rectangleDeliveryInstructionDefaultText;
        }
        rectangleDeliveryPage?.classList.remove('is-instruction-active');
        if (rectangleDeliveryInstructionHideTimer !== null) {
            window.clearTimeout(rectangleDeliveryInstructionHideTimer);
            rectangleDeliveryInstructionHideTimer = null;
        }
        if (rectangleDeliveryInstructionAudio) {
            rectangleDeliveryInstructionAudio.pause();
            rectangleDeliveryInstructionAudio.currentTime = 0;
            rectangleDeliveryInstructionAudio.onended = null;
            rectangleDeliveryInstructionAudio = null;
        }
        rectangleDeliveryInstructionShown = false;
        if (rectangleRoadToggle) rectangleRoadToggle.disabled = true;
        if (!rectangleDeliveryJeepSequence) return;
        rectangleDeliveryJeepSequence.hidden = true;
        rectangleDeliveryJeepSequence.classList.remove('is-driving', 'is-arrived');
        if (rectangleDeliveryDrivingJeep) rectangleDeliveryDrivingJeep.hidden = false;
        if (rectangleDeliveryArrivedJeep) {
            rectangleDeliveryArrivedJeep.src = 'assets/Character/jeep.webp';
            rectangleDeliveryArrivedJeep.hidden = true;
        }
    };

    const rectangleBuildingSourceBounds = {
        bakery: { x: 127, y: 164, width: 310, height: 180 },
        bookstore: { x: 663, y: 196, width: 346, height: 147 },
        'toy-shop': { x: 1235, y: 164, width: 310, height: 180 },
    };

    const alignRectangleBuildingHotspots = () => {
        if (!rectangleDeliveryPage || !rectangleDeliveryBackground || rectangleDeliveryPage.hidden) return;
        const pageRect = rectangleDeliveryPage.getBoundingClientRect();
        const sourceWidth = rectangleDeliveryBackground.naturalWidth || 1672;
        const sourceHeight = rectangleDeliveryBackground.naturalHeight || 941;
        if (!pageRect.width || !pageRect.height || !sourceWidth || !sourceHeight) return;

        const scale = Math.max(pageRect.width / sourceWidth, pageRect.height / sourceHeight);
        const offsetX = (pageRect.width - (sourceWidth * scale)) / 2;
        const offsetY = (pageRect.height - (sourceHeight * scale)) / 2;

        rectangleBuildingHotspots.forEach((hotspot) => {
            const bounds = rectangleBuildingSourceBounds[hotspot.dataset.rectangleBuilding];
            if (!bounds) return;
            hotspot.style.left = `${offsetX + (bounds.x * scale)}px`;
            hotspot.style.top = `${offsetY + (bounds.y * scale)}px`;
            hotspot.style.width = `${bounds.width * scale}px`;
            hotspot.style.height = `${bounds.height * scale}px`;
        });
    };

    const hideRectangleDeliveryInstruction = () => {
        rectangleDeliveryInstructionHideTimer = null;
        rectangleDeliveryPage?.classList.remove('is-instruction-active');
        if (!rectangleDeliveryInstructionPanel) return;
        rectangleDeliveryInstructionPanel.classList.remove('is-visible');
        window.setTimeout(() => {
            if (rectangleDeliveryInstructionPanel.classList.contains('is-visible')) return;
            rectangleDeliveryInstructionPanel.hidden = true;
        }, 340);
    };

    const scheduleRectangleDeliveryInstructionHide = (delay = 700) => {
        if (rectangleDeliveryInstructionHideTimer !== null) window.clearTimeout(rectangleDeliveryInstructionHideTimer);
        rectangleDeliveryInstructionHideTimer = window.setTimeout(hideRectangleDeliveryInstruction, delay);
    };

    const showRectangleDeliveryInstruction = () => {
        if (rectangleDeliveryInstructionShown || !rectangleDeliveryPage || rectangleDeliveryPage.hidden) return;
        rectangleDeliveryInstructionShown = true;
        if (rectangleDeliveryInstructionHideTimer !== null) {
            window.clearTimeout(rectangleDeliveryInstructionHideTimer);
            rectangleDeliveryInstructionHideTimer = null;
        }
        rectangleDeliveryPage.classList.add('is-instruction-active');

        if (rectangleDeliveryInstructionPanel) {
            rectangleDeliveryInstructionPanel.hidden = false;
            rectangleDeliveryInstructionPanel.getBoundingClientRect();
            rectangleDeliveryInstructionPanel.classList.add('is-visible');
        }

        if (window.Audio) {
            rectangleDeliveryInstructionAudio = new window.Audio('assets/Audios/Voice over/ihatid.mp3');
            rectangleDeliveryInstructionAudio.onended = () => scheduleRectangleDeliveryInstructionHide(700);
            rectangleDeliveryInstructionAudio.play().catch(() => scheduleRectangleDeliveryInstructionHide(1600));
        } else {
            scheduleRectangleDeliveryInstructionHide(2300);
        }
    };

    const showRectangleDeliveryTask = () => {
        if (!rectangleDeliveryPage || !rectangleDeliveryTaskPanel || rectangleDeliveryPage.hidden) return;
        const isComplete = rectangleDeliveredItems.size >= rectangleDeliveryJobs.length;
        const job = rectangleDeliveryJobs[rectangleDeliveryJobIndex];
        rectangleDeliveryTaskItems.forEach((item) => {
            item.hidden = isComplete || item.dataset.deliveryItem !== job?.item;
        });
        if (rectangleDeliveryTaskItemName) rectangleDeliveryTaskItemName.textContent = isComplete ? 'All Items' : (job?.itemName || '');
        if (rectangleDeliveryTaskDestinationName) rectangleDeliveryTaskDestinationName.textContent = isComplete ? 'Complete!' : (job?.destination || '');
        rectangleDeliveryTaskPanel.hidden = false;
        rectangleDeliveryTaskPanel.getBoundingClientRect();
        rectangleDeliveryTaskPanel.classList.add('is-visible');
        if (rectangleRoadToggle && rectangleDeliveryJeepSequence?.classList.contains('is-arrived')) {
            rectangleRoadToggle.disabled = isComplete;
            if (isComplete) rectangleRoadToggle.textContent = 'Done';
        }
        if (rectangleBossJumpButton) rectangleBossJumpButton.disabled = isComplete;
        const isBossIntroPending = getRectangleBossMilestone() !== null;
        if (!isComplete && !isBossIntroPending) showRectangleDeliveryInstruction();
    };

    const showRectangleFinalCompleteTask = () => {
        if (!rectangleDeliveryTaskPanel || !rectangleDeliveryPage || rectangleDeliveryPage.hidden) return;
        rectangleDeliveryTaskItems.forEach((item) => {
            item.hidden = true;
        });
        if (rectangleDeliveryTaskItemName) rectangleDeliveryTaskItemName.textContent = 'CONGRATULATIONS!';
        if (rectangleDeliveryTaskDestinationName) rectangleDeliveryTaskDestinationName.textContent = 'ALL ITEMS DELIVERED!';
        rectangleDeliveryTaskPanel.hidden = false;
        rectangleDeliveryTaskPanel.getBoundingClientRect();
        rectangleDeliveryTaskPanel.classList.add('is-visible');
    };

    const startRectangleFinalCompleteScene = () => {
        if (!rectangleDeliveryPage || !rectangleDeliveryJeepSequence || rectangleDeliveryPage.hidden) return;
        resetRectangleDeliveryJeep({ keepFinalScene: true });
        clearRectangleRoadGasPickup();
        rectangleDeliveryPage.classList.remove('is-road-entering', 'is-road-visible', 'is-road-stopped', 'is-instruction-active', 'is-boss-battle', 'is-boss-jeep-hit');
        rectangleDeliveryPage.classList.add('is-final-complete-scene');
        if (rectangleDeliveryCompleteBg) rectangleDeliveryCompleteBg.hidden = false;
        if (rectangleDeliveryCompleteConfetti) {
            prepareRectangleFinalConfetti();
            rectangleDeliveryCompleteConfetti.hidden = false;
        }
        if (rectangleRoadToggle) {
            rectangleRoadToggle.disabled = true;
            rectangleRoadToggle.classList.remove('is-wrong-stop', 'is-boss-attack');
            rectangleRoadToggle.textContent = 'Done';
            rectangleRoadToggle.setAttribute('aria-label', 'All deliveries completed');
        }
        if (rectangleBossJumpButton) rectangleBossJumpButton.disabled = true;
        if (rectangleDeliveryInstructionPanel) {
            rectangleDeliveryInstructionPanel.hidden = true;
            rectangleDeliveryInstructionPanel.classList.remove('is-visible');
        }
        if (rectangleDeliveryDrivingJeep) rectangleDeliveryDrivingJeep.hidden = false;
        if (rectangleDeliveryArrivedJeep) {
            rectangleDeliveryArrivedJeep.src = 'assets/Character/jeep1.webp';
            rectangleDeliveryArrivedJeep.hidden = true;
        }
        rectangleDeliveryJeepSequence.hidden = false;
        rectangleDeliveryJeepSequence.classList.remove('is-arrived', 'is-boss-jumping');
        rectangleDeliveryJeepSequence.classList.add('is-driving');
        startRectangleEngineSound();
        showRectangleFinalCompleteTask();
    };

    const startRectangleDeliveryJeep = () => {
        if (!rectangleDeliveryPage || !rectangleDeliveryJeepSequence || rectangleDeliveryPage.hidden) return;
        if (rectangleFinalCompletePending || rectangleDeliveredItems.size >= rectangleDeliveryJobs.length) {
            rectangleFinalCompletePending = false;
            startRectangleFinalCompleteScene();
            return;
        }
        const shouldResume = rectangleResumeFromDelivery;
        alignRectangleBuildingHotspots();
        resetRectangleDeliveryJeep({ preserveRoadPosition: shouldResume });
        startRectangleRoadLoop({ preservePosition: shouldResume });
        rectangleResumeFromDelivery = false;
        rectangleDeliveryPage.classList.add('is-road-entering');
        rectangleDeliveryPage.getBoundingClientRect();
        window.requestAnimationFrame(() => rectangleDeliveryPage.classList.add('is-road-visible'));
        if (shouldResume) {
            rectangleDeliveryPage.classList.remove('is-road-entering', 'is-road-stopped');
            rectangleDeliveryPage.classList.add('is-road-visible');
            rectangleDeliveryJeepSequence.hidden = false;
            rectangleDeliveryJeepSequence.classList.remove('is-driving');
            rectangleDeliveryJeepSequence.classList.add('is-arrived');
            if (rectangleDeliveryDrivingJeep) rectangleDeliveryDrivingJeep.hidden = true;
            if (rectangleDeliveryArrivedJeep) rectangleDeliveryArrivedJeep.hidden = false;
            showRectangleDeliveryTask();
            return;
        }
        const revealRectangleDeliveryJeep = () => {
            rectangleDeliveryRevealTimer = null;
            if (rectangleDeliveryPage.hidden) return;
            if (rectangleGamePaused) {
                rectangleDeliveryRevealTimer = window.setTimeout(revealRectangleDeliveryJeep, 220);
                return;
            }
            rectangleDeliveryJeepSequence.getBoundingClientRect();
            rectangleDeliveryJeepSequence.hidden = false;
            rectangleDeliveryJeepSequence.classList.add('is-driving');
            const revealDeliveryTask = () => {
                if (rectangleDeliveryPage.hidden) return;
                if (rectangleGamePaused) {
                    rectangleDeliveryArrivalTimer = window.setTimeout(revealDeliveryTask, 220);
                    return;
                }
                rectangleDeliveryArrivalTimer = null;
                showRectangleDeliveryTask();
            };
            rectangleDeliveryArrivalTimer = window.setTimeout(revealDeliveryTask, 3600);
        };
        rectangleDeliveryRevealTimer = window.setTimeout(revealRectangleDeliveryJeep, 560);
    };

    rectangleDeliveryBackground?.addEventListener('load', alignRectangleBuildingHotspots);
    window.addEventListener('resize', alignRectangleBuildingHotspots);
    rectangleBuildingHotspots.forEach((hotspot) => {
        hotspot.addEventListener('click', () => {
            rectangleBuildingHotspots.forEach((candidate) => {
                candidate.classList.remove('is-pressed');
                candidate.setAttribute('aria-pressed', 'false');
            });
            hotspot.classList.add('is-pressed');
            hotspot.setAttribute('aria-pressed', 'true');
            const destinationRoutes = {
                bakery: 'rectangleBakery',
                bookstore: 'rectangleBookstore',
                'toy-shop': 'rectangleToyShop',
            };
            const destinationRoute = destinationRoutes[hotspot.dataset.rectangleBuilding];

            window.setTimeout(() => {
                hotspot.classList.remove('is-pressed');
                if (destinationRoute) navigateApp(destinationRoute);
            }, 180);
        });
    });

    rectangleFinalReplayButton?.addEventListener('click', () => {
        hideRectangleFinalProgress();
        navigateApp('shapeArea4');
    });

    rectangleFinalNextButton?.addEventListener('click', () => {
        hideRectangleFinalProgress();
        openShapeCameraLayout('rectangleCamera');
    });

    rectangleDeliveryJeepSequence?.addEventListener('animationend', (event) => {
        if (event.target !== rectangleDeliveryJeepSequence || event.animationName !== 'rectangleDeliveryJeepDriveDesktop') return;
        if (!rectangleDeliveryPage || rectangleDeliveryPage.hidden) return;
        if (rectangleDeliveryDrivingJeep) rectangleDeliveryDrivingJeep.hidden = true;
        if (rectangleDeliveryArrivedJeep) rectangleDeliveryArrivedJeep.hidden = false;
        rectangleDeliveryJeepSequence.classList.remove('is-driving');
        rectangleDeliveryJeepSequence.classList.add('is-arrived');
        if (rectangleDeliveryPage.classList.contains('is-final-complete-scene')) {
            stopRectangleEngineSound();
            playRectangleStop();
            showRectangleFinalCompleteTask();
            startRectangleFinalCelebrationAudio();
            return;
        }
        if (rectangleRoadToggle) rectangleRoadToggle.disabled = false;
        if (rectangleDeliveryArrivalTimer !== null) {
            window.clearTimeout(rectangleDeliveryArrivalTimer);
            rectangleDeliveryArrivalTimer = null;
        }
        showRectangleDeliveryTask();
    });

    window.addEventListener('learnscape:routechange', (event) => {
        if (event.detail?.route === 'rectangleDelivery') {
            startRectangleDeliveryJeep();
        } else {
            resetRectangleDeliveryJeep({ preserveRoadPosition: rectangleResumeFromDelivery });
            if (event.detail?.route === 'shapeArea4') {
                rectangleResumeFromDelivery = false;
                rectangleBossCompletedMilestones?.clear();
                rectangleBossCurrentMilestone = null;
                rectangleBossWarningMilestone = null;
                rectangleBossWarningAcknowledged = false;
                setRectangleGasLevel(100);
            }
        }
    });

    if (rectangleDeliveryPage && !rectangleDeliveryPage.hidden) {
        startRectangleDeliveryJeep();
    }

    rectangleGameOverRetry?.addEventListener('click', () => {
        if (!rectangleGasDepleted) return;
        const retryWarningMilestone = rectangleBossRetryWarningMilestone;
        rectangleGasDepleted = false;
        rectangleBossWarningAcknowledged = false;
        setRectangleGasLevel(100);
        startRectangleDeliveryJeep();
        window.setTimeout(() => {
            if (retryWarningMilestone === 2) {
                showRectangleBossWarning({ startGuideIndex: 1 });
            } else {
                resumeRectangleBossEncounter();
            }
            rectangleBossRetryWarningMilestone = null;
        }, 80);
    });

    const resetRectangleDestinationJeeps = () => {
        if (rectangleParkingMoveTimer !== null) {
            window.clearTimeout(rectangleParkingMoveTimer);
            rectangleParkingMoveTimer = null;
        }
        if (rectangleParkingRouteTimer !== null) {
            window.clearTimeout(rectangleParkingRouteTimer);
            rectangleParkingRouteTimer = null;
        }
        if (rectangleParkingInstructionAudio) {
            rectangleParkingInstructionAudio.pause();
            rectangleParkingInstructionAudio.currentTime = 0;
            rectangleParkingInstructionAudio = null;
        }
        if (rectangleParkingFeedbackAudio) {
            rectangleParkingFeedbackAudio.pause();
            rectangleParkingFeedbackAudio.currentTime = 0;
            rectangleParkingFeedbackAudio = null;
        }

        rectangleDestinationPages.forEach((page) => {
            const jeep = page.querySelector('.rectangle-destination-jeep');
            const instructionPanel = page.querySelector('.rectangle-parking-instruction-panel');
            const parkingShapes = page.querySelector('.rectangle-parking-shapes');
            page.classList.remove('is-parking-transition', 'is-parking-fading');
            if (parkingShapes) parkingShapes.hidden = true;
            page.querySelectorAll('.rectangle-parking-shape').forEach((shape) => {
                shape.disabled = false;
                shape.classList.remove('is-selected', 'is-wrong');
                shape.setAttribute('aria-pressed', 'false');
            });
            if (instructionPanel) {
                instructionPanel.hidden = true;
                instructionPanel.classList.remove('is-visible');
            }
            if (!jeep) return;
            jeep.hidden = true;
            jeep.classList.remove('is-entering', 'is-arrived', 'is-parking');
            jeep.style.removeProperty('--parking-shift-x');
            jeep.style.removeProperty('--parking-shift-y');
            jeep.style.removeProperty('--parking-duration');
        });
    };

    const startRectangleDestinationJeep = (routeName) => {
        const destinationRouteIds = {
            rectangleBakery: 'learnscape-rectangle-bakery-page',
            rectangleBookstore: 'learnscape-rectangle-bookstore-page',
            rectangleToyShop: 'learnscape-rectangle-toy-shop-page',
        };
        const destinationPage = document.getElementById(destinationRouteIds[routeName]);
        const jeep = destinationPage?.querySelector('.rectangle-destination-jeep');
        if (!destinationPage || destinationPage.hidden || !jeep) return;

        resetRectangleDestinationJeeps();
        jeep.hidden = false;
        jeep.getBoundingClientRect();
        jeep.classList.add('is-entering');
    };

    const alignRectangleParkingShapes = (page) => {
        const background = page?.querySelector('.shape-area-bg');
        const parkingShapes = page?.querySelector('.rectangle-parking-shapes');
        if (!page || page.hidden || !background || !parkingShapes) return;

        const pageRect = page.getBoundingClientRect();
        const sourceWidth = background.naturalWidth || 1672;
        const sourceHeight = background.naturalHeight || 941;
        if (!pageRect.width || !pageRect.height) return;

        const scale = Math.max(pageRect.width / sourceWidth, pageRect.height / sourceHeight);
        const offsetX = (pageRect.width - (sourceWidth * scale)) / 2;
        const offsetY = (pageRect.height - (sourceHeight * scale)) / 2;

        parkingShapes.querySelectorAll('.rectangle-parking-shape').forEach((shape) => {
            const x = Number(shape.dataset.sourceX);
            const y = Number(shape.dataset.sourceY);
            const width = Number(shape.dataset.sourceWidth);
            const height = Number(shape.dataset.sourceHeight);
            shape.style.left = `${offsetX + (x * scale)}px`;
            shape.style.top = `${offsetY + (y * scale)}px`;
            shape.style.width = `${width * scale}px`;
            shape.style.height = `${height * scale}px`;
        });
    };

    rectangleDestinationPages.forEach((page) => {
        const jeep = page.querySelector('.rectangle-destination-jeep');
        jeep?.addEventListener('animationend', (event) => {
            if (event.target !== jeep || event.animationName !== 'rectangleDestinationJeepEnterDesktop') return;
            jeep.classList.remove('is-entering');
            jeep.classList.add('is-arrived');

            const instructionPanel = page.querySelector('.rectangle-parking-instruction-panel');
            if (instructionPanel) {
                instructionPanel.hidden = false;
                instructionPanel.getBoundingClientRect();
                instructionPanel.classList.add('is-visible');
            }

            if (window.Audio) {
                rectangleParkingInstructionAudio = new window.Audio('assets/Audios/Voice over/iparada.mp3');
                rectangleParkingInstructionAudio.play().catch(() => {});
            }

            const parkingShapes = page.querySelector('.rectangle-parking-shapes');
            if (parkingShapes) {
                alignRectangleParkingShapes(page);
                parkingShapes.hidden = false;
            }
        });
    });

    rectangleDestinationPages.forEach((page) => {
        page.querySelector('.shape-area-bg')?.addEventListener('load', () => alignRectangleParkingShapes(page));
    });
    window.addEventListener('resize', () => {
        rectangleDestinationPages.forEach(alignRectangleParkingShapes);
    });

    const playRectangleParkingFeedback = (source) => {
        if (rectangleParkingFeedbackAudio) {
            rectangleParkingFeedbackAudio.pause();
            rectangleParkingFeedbackAudio.currentTime = 0;
            rectangleParkingFeedbackAudio = null;
        }
        const soundScale = window.__learnscapeSoundScale?.() ?? 1;
        if (!window.Audio || soundScale <= 0) return;
        const audio = new window.Audio(source);
        rectangleParkingFeedbackAudio = audio;
        audio.preload = 'auto';
        audio.playsInline = true;
        audio.volume = Math.min(1, soundScale);
        const releaseAudio = () => {
            if (rectangleParkingFeedbackAudio === audio) rectangleParkingFeedbackAudio = null;
        };
        audio.onended = releaseAudio;
        audio.onerror = releaseAudio;
        audio.play().catch(releaseAudio);
    };

    rectangleParkingShapes.forEach((shape) => {
        shape.addEventListener('click', () => {
            const page = shape.closest('.rectangle-destination-page');
            if (!page || page.classList.contains('is-parking-transition')) return;
            const isCorrectParking = shape.hasAttribute('data-correct-parking');
            page?.querySelectorAll('.rectangle-parking-shape').forEach((candidate) => {
                const isSelected = candidate === shape;
                candidate.classList.toggle('is-selected', isSelected && isCorrectParking);
                candidate.classList.remove('is-wrong');
                candidate.setAttribute('aria-pressed', String(isSelected && isCorrectParking));
            });
            if (!isCorrectParking) {
                const previousWrongTimer = rectangleParkingWrongTimers.get(shape);
                if (previousWrongTimer) window.clearTimeout(previousWrongTimer);
                shape.getBoundingClientRect();
                shape.classList.add('is-wrong');
                playRectangleParkingFeedback('assets/Audios/Sound effects/buzzer.mp3');
                const wrongTimer = window.setTimeout(() => {
                    shape.classList.remove('is-wrong');
                    rectangleParkingWrongTimers.delete(shape);
                }, 900);
                rectangleParkingWrongTimers.set(shape, wrongTimer);
                return;
            }

            playRectangleParkingFeedback('assets/Audios/Sound effects/correct.mp3');

            const jeep = page.querySelector('.rectangle-destination-jeep');
            const targetRoute = shape.dataset.parkingRoute;
            if (!jeep || !targetRoute) return;

            const jeepRect = jeep.getBoundingClientRect();
            const targetRect = shape.getBoundingClientRect();
            const shiftX = (targetRect.left + (targetRect.width / 2)) - (jeepRect.left + (jeepRect.width / 2));
            const shiftY = 0;
            const entrancePixelsPerMs = Math.max(0.01, (page.clientWidth * 0.48) / 2800);
            const parkingDurationMs = Math.max(600, Math.abs(shiftX) / entrancePixelsPerMs);

            jeep.style.setProperty('--parking-shift-x', `${shiftX}px`);
            jeep.style.setProperty('--parking-shift-y', `${shiftY}px`);
            jeep.style.setProperty('--parking-duration', `${parkingDurationMs}ms`);
            page.classList.add('is-parking-transition');
            page.querySelectorAll('.rectangle-parking-shape').forEach((candidate) => {
                candidate.disabled = true;
            });
            page.querySelector('.rectangle-parking-instruction-panel')?.classList.remove('is-visible');
            if (rectangleParkingInstructionAudio) {
                rectangleParkingInstructionAudio.pause();
                rectangleParkingInstructionAudio.currentTime = 0;
                rectangleParkingInstructionAudio = null;
            }
            jeep.classList.add('is-parking');

            rectangleParkingMoveTimer = window.setTimeout(() => {
                rectangleParkingMoveTimer = null;
                if (page.hidden) return;
                page.classList.add('is-parking-fading');
                rectangleParkingRouteTimer = window.setTimeout(() => {
                    rectangleParkingRouteTimer = null;
                    navigateApp(targetRoute);
                }, 560);
            }, parkingDurationMs + 80);
        });
    });

    window.addEventListener('learnscape:routechange', (event) => {
        const routeName = event.detail?.route;
        if (['rectangleBakery', 'rectangleBookstore', 'rectangleToyShop'].includes(routeName)) {
            startRectangleDestinationJeep(routeName);
        } else {
            resetRectangleDestinationJeeps();
        }
        if (['rectangleBakery1', 'rectangleBookstore1', 'rectangleToyShop1'].includes(routeName)) {
            const interiorPageId = {
                rectangleBakery1: 'learnscape-rectangle-bakery1-page',
                rectangleBookstore1: 'learnscape-rectangle-bookstore1-page',
                rectangleToyShop1: 'learnscape-rectangle-toy-shop1-page',
            }[routeName];
            const interiorPage = document.getElementById(interiorPageId);
            if (interiorPage) setupRectangleInteriorPage(interiorPage);
        }
    });

    const visibleRectangleDestination = rectangleDestinationPages.find((page) => !page.hidden);
    if (visibleRectangleDestination) {
        const initialDestinationRoutes = {
            'learnscape-rectangle-bakery-page': 'rectangleBakery',
            'learnscape-rectangle-bookstore-page': 'rectangleBookstore',
            'learnscape-rectangle-toy-shop-page': 'rectangleToyShop',
        };
        startRectangleDestinationJeep(initialDestinationRoutes[visibleRectangleDestination.id]);
    }

    const rectangleInteriorPages = Array.from(document.querySelectorAll('.rectangle-interior-page'));
    const rectangleBossEncounter = rectangleDeliveryPage?.querySelector('.rectangle-boss-encounter');
    const rectangleBossWarning = rectangleDeliveryPage?.querySelector('.rectangle-boss-warning');
    const rectangleBossWarningContinue = rectangleBossWarning?.querySelector('.rectangle-boss-warning-continue');
    const rectangleBossWarningNext = rectangleBossWarning?.querySelector('.rectangle-boss-warning-next');
    const rectangleBossGuidePages = Array.from(rectangleBossWarning?.querySelectorAll('.rectangle-boss-guide-page') || []);
    const rectangleBossHealth = rectangleBossEncounter?.querySelector('.rectangle-boss-health');
    const rectangleBossHealthValue = rectangleBossEncounter?.querySelector('.rectangle-boss-health-value');
    const rectangleBossEffects = rectangleBossEncounter?.querySelector('.rectangle-boss-effects');
    const rectangleBossDeliveryMilestones = [1, 2];
    const rectangleBossCompletedMilestones = new Set();
    let rectangleBossHealthPoints = 100;
    let rectangleBossActive = false;
    let rectangleBossCurrentMilestone = null;
    let rectangleBossWarningMilestone = null;
    let rectangleBossRetryWarningMilestone = null;
    let rectangleBossWarningAcknowledged = false;
    let rectangleBossAttackTimer = null;
    let rectangleBossGasTimer = null;
    let rectangleBossBlinkTimer = null;
    let rectangleBossFlashTimer = null;
    let rectangleBossFinishTimer = null;
    let rectangleBossAutoLaserTimer = null;
    let rectangleBossLaserReady = true;
    let rectangleBossJeepInvulnerable = false;
    let rectangleBossGuideIndex = 0;
    let rectangleJumpGuideObstacle = null;
    let rectangleJumpGuideTimer = null;
    const rectangleBossHazardShapes = ['circle', 'triangle', 'oval', 'diamond', 'star'];

    const rectanglesOverlap = (first, second, padding = 0) => (
        first.left + padding < second.right - padding
        && first.right - padding > second.left + padding
        && first.top + padding < second.bottom - padding
        && first.bottom - padding > second.top + padding
    );

    const updateRectangleBossHealth = () => {
        const health = Math.max(0, Math.min(100, rectangleBossHealthPoints));
        rectangleBossEncounter?.style.setProperty('--boss-health', `${health}%`);
        rectangleBossHealth?.setAttribute('aria-valuenow', String(health));
        if (rectangleBossHealthValue) rectangleBossHealthValue.textContent = `${health} HP`;
    };

    const getRectangleBossMilestone = () => {
        const deliveredCount = rectangleDeliveredItems.size;
        return rectangleBossDeliveryMilestones.includes(deliveredCount)
            && !rectangleBossCompletedMilestones.has(deliveredCount)
            ? deliveredCount
            : null;
    };

    const canSpawnRectangleBossGas = () => rectangleBossCurrentMilestone !== 2;

    const clearRectangleBossTimers = () => {
        [rectangleBossAttackTimer, rectangleBossGasTimer, rectangleBossBlinkTimer, rectangleBossFlashTimer, rectangleBossFinishTimer, rectangleBossAutoLaserTimer]
            .forEach((timer) => {
                if (timer !== null) window.clearTimeout(timer);
            });
        rectangleBossAttackTimer = null;
        rectangleBossGasTimer = null;
        rectangleBossBlinkTimer = null;
        rectangleBossFlashTimer = null;
        rectangleBossFinishTimer = null;
        rectangleBossAutoLaserTimer = null;
    };

    const hideRectangleJumpGuide = (obstacle = null) => {
        if (!rectangleJumpGuide || (obstacle && rectangleJumpGuideObstacle !== obstacle)) return;
        if (rectangleJumpGuideTimer !== null) {
            window.clearTimeout(rectangleJumpGuideTimer);
            rectangleJumpGuideTimer = null;
        }
        rectangleJumpGuide.classList.remove('is-visible');
        rectangleJumpGuide.hidden = true;
        rectangleJumpGuideObstacle = null;
    };

    const showRectangleJumpGuide = (obstacle) => {
        if (!rectangleJumpGuide || !obstacle) return;
        if (rectangleJumpGuideObstacle === obstacle && !rectangleJumpGuide.hidden) return;
        if (rectangleJumpGuideTimer !== null) window.clearTimeout(rectangleJumpGuideTimer);
        rectangleJumpGuideObstacle = obstacle;
        rectangleJumpGuide.classList.remove('is-visible');
        rectangleJumpGuide.hidden = false;
        rectangleJumpGuide.getBoundingClientRect();
        rectangleJumpGuide.classList.add('is-visible');
        rectangleJumpGuideTimer = window.setTimeout(() => {
            rectangleJumpGuideTimer = null;
            hideRectangleJumpGuide(obstacle);
        }, 1100);
    };

    const restoreRectangleDeliveryControls = () => {
        if (rectangleRoadToggle) {
            rectangleRoadToggle.disabled = false;
            rectangleRoadToggle.classList.remove('is-boss-attack');
            rectangleRoadToggle.textContent = 'Stop';
            rectangleRoadToggle.setAttribute('aria-label', 'Stop at this delivery');
        }
        if (rectangleBossJumpButton) {
            rectangleBossJumpButton.hidden = false;
            rectangleBossJumpButton.disabled = rectangleGasDepleted || rectangleDeliveredItems.size >= rectangleDeliveryJobs.length;
        }
    };

    const showRectangleBossGuidePage = (index = 0) => {
        if (!rectangleBossGuidePages.length) return;
        const activeGuidePages = rectangleBossGuidePages.filter((page) => (
            rectangleBossWarningMilestone !== 2 || page.dataset.bossGuidePage !== '1'
        ));
        rectangleBossGuideIndex = Math.max(0, Math.min(activeGuidePages.length - 1, index));
        const activePage = activeGuidePages[rectangleBossGuideIndex];
        rectangleBossGuidePages.forEach((page, pageIndex) => {
            const isActive = page === activePage;
            page.hidden = !isActive;
            page.classList.toggle('is-active', isActive);
        });
        const isLastGuide = rectangleBossGuideIndex >= activeGuidePages.length - 1;
        if (rectangleBossWarningNext) rectangleBossWarningNext.hidden = isLastGuide;
        if (rectangleBossWarningContinue) rectangleBossWarningContinue.hidden = !isLastGuide;
    };

    const stopRectangleBossEncounter = ({ resetHealth = true } = {}) => {
        rectangleBossActive = false;
        rectangleRoadHitUntil = performance.now() + 1200;
        clearRectangleBossTimers();
        rectangleBossEffects?.replaceChildren();
        rectangleBossEncounter?.classList.remove('is-active', 'is-mouth-open', 'is-blinking', 'is-monster-hit', 'is-defeated');
        if (rectangleBossEncounter) rectangleBossEncounter.hidden = true;
        rectangleBossWarning?.classList.remove('is-visible');
        if (rectangleBossWarning) rectangleBossWarning.hidden = true;
        rectangleDeliveryPage?.classList.remove('is-boss-battle', 'is-boss-jeep-hit');
        rectangleDeliveryJeepSequence?.classList.remove('is-boss-jumping');
        hideRectangleJumpGuide();
        rectangleBossJeepInvulnerable = false;
        rectangleBossLaserReady = true;
        rectangleBossCurrentMilestone = null;
        rectangleBossWarningMilestone = null;
        restoreRectangleDeliveryControls();
        if (resetHealth) {
            rectangleBossHealthPoints = 100;
            updateRectangleBossHealth();
        }
        showRectangleBossGuidePage(0);
    };

    abortRectangleBossEncounter = () => stopRectangleBossEncounter({ resetHealth: true });

    const watchRectangleBossEntityCollision = (entity, onCollision, { promptJump = false } = {}) => {
        const checkCollision = () => {
            if (!rectangleBossActive || !entity.isConnected || !rectangleDeliveryJeepSequence) {
                if (promptJump) hideRectangleJumpGuide(entity);
                return;
            }
            if (rectangleGamePaused) {
                window.requestAnimationFrame(checkCollision);
                return;
            }
            const entityRect = entity.getBoundingClientRect();
            const jeepRect = rectangleDeliveryJeepSequence.getBoundingClientRect();
            if (promptJump) {
                const approachDistance = entityRect.left - jeepRect.right;
                const guideDistance = Math.min(360, window.innerWidth * 0.28);
                const isJumping = rectangleDeliveryJeepSequence.classList.contains('is-boss-jumping');
                if (!isJumping && approachDistance > 0 && approachDistance <= guideDistance) {
                    showRectangleJumpGuide(entity);
                } else if (isJumping || entityRect.right < jeepRect.left) {
                    hideRectangleJumpGuide(entity);
                }
            }
            if (rectanglesOverlap(entityRect, jeepRect, 8)) {
                if (onCollision() !== false) {
                    if (promptJump) hideRectangleJumpGuide(entity);
                    return;
                }
            }
            window.requestAnimationFrame(checkCollision);
        };
        window.requestAnimationFrame(checkCollision);
    };

    const damageRectangleBossJeep = (hazard) => {
        if (
            !rectangleBossActive
            || rectangleGamePaused
            || rectangleBossJeepInvulnerable
            || rectangleDeliveryJeepSequence?.classList.contains('is-boss-jumping')
        ) return;
        rectangleBossJeepInvulnerable = true;
        hazard.remove();
        setRectangleGasLevel(rectangleGasLevel - 20);
        playUiClickSound('thunk');
        rectangleDeliveryPage?.classList.remove('is-boss-jeep-hit');
        rectangleDeliveryPage?.getBoundingClientRect();
        rectangleDeliveryPage?.classList.add('is-boss-jeep-hit');
        window.setTimeout(() => {
            rectangleBossJeepInvulnerable = false;
            rectangleDeliveryPage?.classList.remove('is-boss-jeep-hit');
        }, 900);
    };

    const spawnRectangleBossShapeHazard = () => {
        if (!rectangleBossActive || rectangleGamePaused || !rectangleBossEffects) return;
        const hazard = document.createElement('span');
        hazard.className = 'rectangle-boss-spike';
        hazard.dataset.shape = rectangleBossHazardShapes[Math.floor(Math.random() * rectangleBossHazardShapes.length)];
        rectangleBossEffects.append(hazard);
        hazard.addEventListener('animationend', () => {
            hideRectangleJumpGuide(hazard);
            hazard.remove();
        }, { once: true });
        watchRectangleBossEntityCollision(hazard, () => damageRectangleBossJeep(hazard), { promptJump: true });
    };

    const scheduleRectangleBossBlink = (delay = 1100 + Math.random() * 1300) => {
        if (rectangleBossBlinkTimer !== null) window.clearTimeout(rectangleBossBlinkTimer);
        rectangleBossBlinkTimer = window.setTimeout(() => {
            rectangleBossBlinkTimer = null;
            if (!rectangleBossActive || rectangleGamePaused) return;
            if (!rectangleBossEncounter?.classList.contains('is-mouth-open')) {
                rectangleBossEncounter?.classList.add('is-blinking');
                window.setTimeout(() => rectangleBossEncounter?.classList.remove('is-blinking'), 170);
            }
            scheduleRectangleBossBlink(1800 + Math.random() * 2600);
        }, delay);
    };

    const scheduleRectangleBossSpike = (delay = 2400) => {
        if (rectangleBossAttackTimer !== null) window.clearTimeout(rectangleBossAttackTimer);
        rectangleBossAttackTimer = window.setTimeout(() => {
            rectangleBossAttackTimer = null;
            if (!rectangleBossActive || rectangleGamePaused) return;
            rectangleBossEncounter?.classList.remove('is-blinking');
            rectangleBossEncounter?.classList.remove('is-mouth-open');
            rectangleBossEncounter?.getBoundingClientRect();
            rectangleBossEncounter?.classList.add('is-mouth-open');
            window.setTimeout(() => {
                if (!rectangleBossActive) return;
                spawnRectangleBossShapeHazard();
            }, 300);
            window.setTimeout(() => rectangleBossEncounter?.classList.remove('is-mouth-open'), 620);
            scheduleRectangleBossSpike(2600 + Math.random() * 1200);
        }, delay);
    };

    const collectRectangleBossRectangle = (pickup) => {
        if (
            !rectangleBossActive
            || rectangleGamePaused
            || !pickup.isConnected
            || !rectangleDeliveryJeepSequence?.classList.contains('is-boss-jumping')
        ) return false;
        pickup.remove();
        setRectangleGasLevel(rectangleGasLevel + 18);
        playUiClickSound('chime');
        rectangleGasMeter?.classList.remove('is-penalized');
        rectangleGasMeter?.getBoundingClientRect();
        rectangleGasMeter?.classList.add('is-penalized');
        return true;
    };

    const spawnRectangleBossRectangle = () => {
        if (!rectangleBossActive || rectangleGamePaused || !rectangleBossEffects || !canSpawnRectangleBossGas()) return;
        const pickup = document.createElement('span');
        pickup.className = 'rectangle-boss-rectangle-pickup';
        rectangleBossEffects.append(pickup);
        pickup.addEventListener('animationend', () => pickup.remove(), { once: true });
        watchRectangleBossEntityCollision(pickup, () => collectRectangleBossRectangle(pickup));
    };

    const scheduleRectangleBossGas = (delay = 2600) => {
        if (!canSpawnRectangleBossGas()) return;
        if (rectangleBossGasTimer !== null) window.clearTimeout(rectangleBossGasTimer);
        rectangleBossGasTimer = window.setTimeout(() => {
            rectangleBossGasTimer = null;
            if (!rectangleBossActive || rectangleGamePaused || !canSpawnRectangleBossGas()) return;
            spawnRectangleBossRectangle();
            scheduleRectangleBossGas(3200 + Math.random() * 2600);
        }, delay);
    };

    const finishRectangleBossBattle = () => {
        if (!rectangleBossActive || rectangleGamePaused) return;
        rectangleBossActive = false;
        rectangleRoadHitUntil = performance.now() + 1200;
        if (rectangleBossCurrentMilestone !== null) {
            rectangleBossCompletedMilestones.add(rectangleBossCurrentMilestone);
        }
        clearRectangleBossTimers();
        rectangleBossEffects?.querySelectorAll('.rectangle-boss-spike, .rectangle-boss-rectangle-pickup')
            .forEach((entity) => entity.remove());
        rectangleBossEncounter?.classList.remove('is-mouth-open', 'is-blinking');
        rectangleBossEncounter?.classList.add('is-defeated');
        rectangleDeliveryJeepSequence?.classList.remove('is-boss-jumping');
        if (rectangleRoadToggle) rectangleRoadToggle.disabled = true;
        if (rectangleBossJumpButton) rectangleBossJumpButton.disabled = true;
        if (rectangleDeliveryInstructionPanel) rectangleDeliveryInstructionPanel.textContent = 'Shape Monster defeated!';
        playUiClickSound('boardSuccess');

        rectangleBossFinishTimer = window.setTimeout(() => {
            rectangleBossFinishTimer = null;
            rectangleBossEncounter?.classList.remove('is-active', 'is-defeated', 'is-monster-hit');
            if (rectangleBossEncounter) rectangleBossEncounter.hidden = true;
            rectangleDeliveryPage?.classList.remove('is-boss-battle', 'is-boss-jeep-hit');
            rectangleBossCurrentMilestone = null;
            rectangleBossWarningMilestone = null;
            rectangleBossWarningAcknowledged = false;
            restoreRectangleDeliveryControls();
            if (rectangleDeliveryInstructionPanel) {
                rectangleDeliveryInstructionPanel.textContent = rectangleDeliveryInstructionDefaultText;
            }
            showRectangleDeliveryTask();
        }, 1100);
    };

    const damageRectangleBoss = () => {
        if (!rectangleBossActive) return;
        rectangleBossHealthPoints = Math.max(0, rectangleBossHealthPoints - 5);
        updateRectangleBossHealth();
        rectangleBossEncounter?.classList.remove('is-monster-hit');
        rectangleBossEncounter?.getBoundingClientRect();
        rectangleBossEncounter?.classList.add('is-monster-hit');
        if (rectangleBossFlashTimer !== null) window.clearTimeout(rectangleBossFlashTimer);
        rectangleBossFlashTimer = window.setTimeout(() => {
            rectangleBossFlashTimer = null;
            rectangleBossEncounter?.classList.remove('is-monster-hit');
        }, 150);
        if (rectangleBossHealthPoints === 0) finishRectangleBossBattle();
    };

    const fireRectangleBossLaser = () => {
        if (
            !rectangleBossActive
            || rectangleGamePaused
            || !rectangleBossLaserReady
            || !rectangleBossEffects
            || rectangleDeliveryJeepSequence?.classList.contains('is-boss-jumping')
        ) return;
        rectangleBossLaserReady = false;
        const laser = document.createElement('span');
        laser.className = 'rectangle-boss-laser';
        rectangleBossEffects.append(laser);
        playUiClickSound('spark');
        window.setTimeout(damageRectangleBoss, 330);
        laser.addEventListener('animationend', () => laser.remove(), { once: true });
        window.setTimeout(() => {
            rectangleBossLaserReady = true;
        }, 700);
    };

    const scheduleRectangleBossAutoLaser = (delay = 650) => {
        if (rectangleBossAutoLaserTimer !== null) window.clearTimeout(rectangleBossAutoLaserTimer);
        rectangleBossAutoLaserTimer = window.setTimeout(() => {
            rectangleBossAutoLaserTimer = null;
            if (!rectangleBossActive || rectangleGamePaused) return;
            fireRectangleBossLaser();
            scheduleRectangleBossAutoLaser(1100);
        }, delay);
    };

    const jumpRectangleBossJeep = () => {
        if (
            !rectangleDeliveryPage || rectangleDeliveryPage.hidden || rectangleGasDepleted || rectangleRoadLoopPaused || rectangleGamePaused
            || !rectangleBossWarning?.hidden
            || !rectangleDeliveryJeepSequence?.classList.contains('is-arrived')
            || rectangleDeliveryJeepSequence.classList.contains('is-boss-jumping')
        ) return;
        hideRectangleJumpGuide();
        rectangleDeliveryJeepSequence.classList.add('is-boss-jumping');
        if (rectangleBossJumpButton) rectangleBossJumpButton.disabled = true;
        window.setTimeout(() => {
            rectangleDeliveryJeepSequence.classList.remove('is-boss-jumping');
            if (rectangleBossJumpButton && !rectangleDeliveryPage.hidden && !rectangleGasDepleted && rectangleBossWarning?.hidden) {
                rectangleBossJumpButton.disabled = false;
            }
        }, 780);
    };

    const showRectangleBossWarning = ({ startGuideIndex = 0 } = {}) => {
        const milestone = getRectangleBossMilestone();
        if (!rectangleBossWarning || !milestone) return;
        if (rectangleBossWarningAcknowledged && rectangleBossWarningMilestone === milestone) return;
        rectangleBossWarningMilestone = milestone;
        rectangleBossWarningAcknowledged = false;
        if (rectangleDeliveryInstructionAudio) {
            rectangleDeliveryInstructionAudio.pause();
            rectangleDeliveryInstructionAudio.currentTime = 0;
            rectangleDeliveryInstructionAudio.onended = null;
            rectangleDeliveryInstructionAudio = null;
        }
        if (rectangleDeliveryInstructionHideTimer !== null) {
            window.clearTimeout(rectangleDeliveryInstructionHideTimer);
            rectangleDeliveryInstructionHideTimer = null;
        }
        rectangleDeliveryPage?.classList.remove('is-instruction-active');
        if (rectangleDeliveryRevealTimer !== null) {
            window.clearTimeout(rectangleDeliveryRevealTimer);
            rectangleDeliveryRevealTimer = null;
        }
        if (rectangleDeliveryArrivalTimer !== null) {
            window.clearTimeout(rectangleDeliveryArrivalTimer);
            rectangleDeliveryArrivalTimer = null;
        }
        rectangleRoadLoopPaused = true;
        rectangleRoadStrip?.classList.add('is-loop-paused');
        clearRectangleRoadShapeObstacles();
        rectangleDeliveryTaskPanel?.classList.remove('is-visible');
        if (rectangleDeliveryTaskPanel) rectangleDeliveryTaskPanel.hidden = true;
        rectangleDeliveryInstructionPanel?.classList.remove('is-visible');
        if (rectangleDeliveryInstructionPanel) rectangleDeliveryInstructionPanel.hidden = true;
        if (rectangleRoadToggle) rectangleRoadToggle.disabled = true;
        if (rectangleBossJumpButton) rectangleBossJumpButton.disabled = true;
        showRectangleBossGuidePage(startGuideIndex);
        rectangleBossWarning.hidden = false;
        rectangleBossWarning.getBoundingClientRect();
        rectangleBossWarning.classList.add('is-visible');
        playUiClickSound('alert');
        rectangleBossWarningNext?.focus({ preventScroll: true });
    };

    const startRectangleBossEncounter = () => {
        const milestone = getRectangleBossMilestone();
        if (
            rectangleBossActive
            || !milestone
            || !rectangleDeliveryPage
            || rectangleDeliveryPage.hidden
            || rectangleDeliveryPage.classList.contains('is-final-complete-scene')
            || rectangleDeliveredItems.size >= rectangleDeliveryJobs.length
            || !rectangleBossEncounter
        ) return;

        if (!rectangleBossWarningAcknowledged || rectangleBossWarningMilestone !== milestone) {
            showRectangleBossWarning();
            return;
        }

        rectangleBossActive = true;
        rectangleObstacleContacts.clear();
        rectangleBossCurrentMilestone = milestone;
        rectangleBossHealthPoints = 100;
        updateRectangleBossHealth();
        rectangleBossEffects?.replaceChildren();
        rectangleDeliveryPage.classList.add('is-boss-battle');
        rectangleBossEncounter.hidden = false;
        rectangleBossEncounter.classList.remove('is-defeated', 'is-mouth-open', 'is-blinking', 'is-monster-hit');
        rectangleBossEncounter.getBoundingClientRect();
        rectangleBossEncounter.classList.add('is-active');
        if (rectangleDeliveryJeepSequence) {
            rectangleDeliveryJeepSequence.hidden = false;
            rectangleDeliveryJeepSequence.classList.remove('is-driving');
            rectangleDeliveryJeepSequence.classList.add('is-arrived');
        }
        if (rectangleDeliveryDrivingJeep) rectangleDeliveryDrivingJeep.hidden = true;
        if (rectangleDeliveryArrivedJeep) rectangleDeliveryArrivedJeep.hidden = false;
        if (rectangleDeliveryTaskPanel) {
            rectangleDeliveryTaskPanel.hidden = true;
            rectangleDeliveryTaskPanel.classList.remove('is-visible');
        }
        if (rectangleDeliveryInstructionPanel) {
            rectangleDeliveryInstructionPanel.hidden = true;
            rectangleDeliveryInstructionPanel.textContent = rectangleDeliveryInstructionDefaultText;
            rectangleDeliveryInstructionPanel.classList.remove('is-visible');
        }
        if (rectangleRoadToggle) {
            rectangleRoadToggle.disabled = true;
            rectangleRoadToggle.classList.remove('is-wrong-stop');
            rectangleRoadToggle.classList.add('is-boss-attack');
            rectangleRoadToggle.textContent = '';
            rectangleRoadToggle.setAttribute('aria-label', 'Laser fires automatically');
        }
        if (rectangleBossJumpButton) {
            rectangleBossJumpButton.hidden = false;
            rectangleBossJumpButton.disabled = false;
        }
        scheduleRectangleBossSpike();
        if (canSpawnRectangleBossGas()) scheduleRectangleBossGas();
        scheduleRectangleBossBlink();
        scheduleRectangleBossAutoLaser();
    };

    resumeRectangleBossEncounter = startRectangleBossEncounter;

    rectangleBossWarningNext?.addEventListener('click', () => {
        playUiClickSound('chime');
        showRectangleBossGuidePage(rectangleBossGuideIndex + 1);
        const activeGuideCount = rectangleBossGuidePages.filter((page) => (
            rectangleBossWarningMilestone !== 2 || page.dataset.bossGuidePage !== '1'
        )).length;
        if (rectangleBossGuideIndex >= activeGuideCount - 1) {
            rectangleBossWarningContinue?.focus({ preventScroll: true });
        }
    });

    rectangleBossWarningContinue?.addEventListener('click', () => {
        if (rectangleBossWarningAcknowledged) return;
        rectangleBossWarningAcknowledged = true;
        playUiClickSound('chime');
        rectangleBossWarning?.classList.remove('is-visible');
        window.setTimeout(() => {
            if (rectangleBossWarning) rectangleBossWarning.hidden = true;
            rectangleRoadLoopPaused = false;
            rectangleRoadStrip?.classList.remove('is-loop-paused');
            startRectangleBossEncounter();
        }, 240);
    });

    window.addEventListener('keydown', (event) => {
        if (
            event.code !== 'Space'
            || event.repeat
            || event.ctrlKey
            || event.altKey
            || event.metaKey
            || !rectangleDeliveryPage
            || rectangleDeliveryPage.hidden
        ) return;
        const target = event.target;
        if (
            target instanceof HTMLElement
            && target.matches('input, textarea, select, button, [contenteditable="true"]')
            && target !== rectanglePauseButton
            && target !== rectangleSpeedSlider
            && target !== rectangleRoadToggle
        ) return;
        event.preventDefault();
        jumpRectangleBossJeep();
    });
    window.addEventListener('learnscape:routechange', (event) => {
        if (event.detail?.route === 'rectangleDelivery') {
            window.setTimeout(startRectangleBossEncounter, 140);
        } else {
            rectangleBossWarning?.classList.remove('is-visible');
            if (rectangleBossWarning) rectangleBossWarning.hidden = true;
            if (rectangleBossActive) stopRectangleBossEncounter({ resetHealth: true });
        }
    });

    let rectangleInteriorReturnTimer = null;
    let rectangleCounterCheeringAudio = null;
    let rectangleCounterCheeringFrame = null;

    const stopRectangleCounterCheering = () => {
        if (rectangleCounterCheeringFrame !== null) {
            window.cancelAnimationFrame(rectangleCounterCheeringFrame);
            rectangleCounterCheeringFrame = null;
        }
        if (!rectangleCounterCheeringAudio) return;

        rectangleCounterCheeringAudio.onended = null;
        rectangleCounterCheeringAudio.pause();
        rectangleCounterCheeringAudio = null;
    };

    const playRectangleCounterCheering = () => {
        if (!window.Audio) return;

        stopRectangleCounterCheering();
        const audio = new window.Audio('assets/Audios/Sound effects/kids cheering.mp3');
        rectangleCounterCheeringAudio = audio;
        audio.preload = 'auto';
        audio.playsInline = true;
        audio.volume = 1;
        audio.onended = () => {
            if (rectangleCounterCheeringAudio !== audio) return;
            if (rectangleCounterCheeringFrame !== null) {
                window.cancelAnimationFrame(rectangleCounterCheeringFrame);
                rectangleCounterCheeringFrame = null;
            }
            rectangleCounterCheeringAudio = null;
        };
        audio.play().then(() => {
            const startedAt = performance.now();
            const updateCheering = (now) => {
                if (rectangleCounterCheeringAudio !== audio) return;
                const elapsed = now - startedAt;
                if (elapsed >= 3000) {
                    stopRectangleCounterCheering();
                    return;
                }
                audio.volume = elapsed >= 2500 ? Math.max(0, (3000 - elapsed) / 500) : 1;
                rectangleCounterCheeringFrame = window.requestAnimationFrame(updateCheering);
            };
            rectangleCounterCheeringFrame = window.requestAnimationFrame(updateCheering);
        }).catch(() => {
            if (rectangleCounterCheeringAudio === audio) stopRectangleCounterCheering();
        });
    };

    const updateRectangleDeliveryProgress = () => {
        const deliveredCount = Math.min(rectangleDeliveredItems.size, rectangleDeliveryJobs.length);
        if (rectangleDeliveryProgressCount) rectangleDeliveryProgressCount.textContent = String(deliveredCount);
        rectangleDeliveryProgress?.style.setProperty('--delivery-progress', `${(deliveredCount / rectangleDeliveryJobs.length) * 100}%`);
        rectangleDeliveryProgress?.setAttribute('aria-label', `Deliveries completed: ${deliveredCount} of ${rectangleDeliveryJobs.length}`);
        rectangleDeliveryProgress?.classList.toggle('is-complete', deliveredCount === rectangleDeliveryJobs.length);
    };

    const completeRectangleCounterDelivery = (page, object, counterStorage) => {
        const itemType = object.dataset.rectangleItem;
        if (!itemType || rectangleDeliveredItems.has(itemType)) return;

        rectangleDeliveredItems.add(itemType);
        updateRectangleDeliveryProgress();

        const placedWrap = counterStorage.querySelector('.rectangle-counter-placed-item');
        const placedImg = counterStorage.querySelector('.rectangle-counter-placed-image');
        const sourceImg = object.querySelector('.rectangle-interior-object-image');
        if (placedImg && sourceImg) placedImg.src = sourceImg.src;
        if (placedWrap) placedWrap.hidden = false;
        counterStorage.classList.add('is-delivered');

        const slot = object.closest('.rectangle-interior-storage-slot');
        slot?.classList.add('is-delivered');
        object.disabled = true;
        object.style.setProperty('--drag-x', '0px');
        object.style.setProperty('--drag-y', '0px');

        playUiClickSound('progressCelebration');
        if (window.Audio) {
            const audio = new window.Audio('assets/Audios/Sound effects/completed.mp3');
            audio.play().catch(() => {});
        }
        playRectangleCounterCheering();

        const bubble = page.querySelector('.rectangle-staff-bubble');
        if (bubble) {
            bubble.hidden = false;
            bubble.classList.remove('is-visible');
            void bubble.offsetWidth;
            bubble.classList.add('is-visible');
        }

        const nextJobIndex = rectangleDeliveryJobs.findIndex((job) => !rectangleDeliveredItems.has(job.item));
        if (nextJobIndex !== -1) rectangleDeliveryJobIndex = nextJobIndex;

        const isFinalDelivery = rectangleDeliveredItems.size >= rectangleDeliveryJobs.length;
        rectangleResumeFromDelivery = !isFinalDelivery;
        rectangleFinalCompletePending = isFinalDelivery;
        if (rectangleInteriorReturnTimer !== null) window.clearTimeout(rectangleInteriorReturnTimer);
        rectangleInteriorReturnTimer = window.setTimeout(() => {
            rectangleInteriorReturnTimer = null;
            if (!page.hidden) navigateApp('rectangleDelivery');
        }, 3100);
    };

    updateRectangleDeliveryProgress();

    const alignRectangleInteriorScene = (page) => {
        if (!page || page.hidden) return;
        const bg = page.querySelector('.shape-area-bg');
        if (!bg) return;
        const pageRect = page.getBoundingClientRect();
        const srcW = bg.naturalWidth || 1672;
        const srcH = bg.naturalHeight || 941;
        if (!pageRect.width || !pageRect.height) return;

        const scale = Math.max(pageRect.width / srcW, pageRect.height / srcH);
        const offsetX = (pageRect.width - (srcW * scale)) / 2;
        const offsetY = (pageRect.height - (srcH * scale)) / 2;

        const counter = page.querySelector('.rectangle-counter-storage');
        if (counter) {
            const cx = Number(counter.dataset.sourceX || 925);
            const cy = Number(counter.dataset.sourceY || 565);
            const cw = Number(counter.dataset.sourceWidth || 205);
            const ch = Number(counter.dataset.sourceHeight || 120);
            counter.style.left = `${offsetX + (cx * scale)}px`;
            counter.style.top = `${offsetY + (cy * scale)}px`;
            counter.style.width = `${cw * scale}px`;
            counter.style.height = `${ch * scale}px`;
        }

        const bubble = page.querySelector('.rectangle-staff-bubble');
        if (bubble) {
            const bx = Number(bubble.dataset.sourceX || 686);
            const by = Number(bubble.dataset.sourceY || 180);
            const bw = Number(bubble.dataset.sourceWidth || 300);
            bubble.style.left = `${offsetX + ((bx + bw / 2) * scale)}px`;
            bubble.style.top = `${offsetY + (by * scale)}px`;
        }
    };

    const deliverRectangleObjectToCounter = (page, object) => {
        const itemType = object.dataset.rectangleItem;
        const rightObject = page.dataset.rightObject;
        const counterStorage = page.querySelector('.rectangle-counter-storage');
        if (!counterStorage) return;

        if (itemType === rightObject) {
            completeRectangleCounterDelivery(page, object, counterStorage);
        } else {
            playUiClickSound('thunk');
            object.classList.add('is-wrong', 'is-returning');
            window.setTimeout(() => {
                object.classList.remove('is-wrong', 'is-returning');
            }, 400);
        }
    };

    const setupRectangleInteriorPage = (page) => {
        if (!page) return;
        alignRectangleInteriorScene(page);

        const rightObject = page.dataset.rightObject;
        const isDelivered = rectangleDeliveredItems.has(rightObject);
        const counterStorage = page.querySelector('.rectangle-counter-storage');
        const bubble = page.querySelector('.rectangle-staff-bubble');

        if (counterStorage) {
            const placedWrap = counterStorage.querySelector('.rectangle-counter-placed-item');
            const placedImg = counterStorage.querySelector('.rectangle-counter-placed-image');
            if (isDelivered) {
                counterStorage.classList.add('is-delivered');
                const sourceImg = page.querySelector(`[data-rectangle-item="${rightObject}"] .rectangle-interior-object-image`);
                if (placedImg && sourceImg) placedImg.src = sourceImg.src;
                if (placedWrap) placedWrap.hidden = false;
            } else {
                counterStorage.classList.remove('is-delivered', 'is-active', 'is-over');
                if (placedWrap) placedWrap.hidden = true;
            }
        }

        if (bubble) {
            if (isDelivered) {
                bubble.hidden = false;
                bubble.classList.add('is-visible');
            } else {
                bubble.hidden = true;
                bubble.classList.remove('is-visible');
            }
        }

        page.querySelectorAll('.rectangle-interior-storage-slot').forEach((slot) => {
            const slotItem = slot.dataset.storageSlot;
            const objBtn = slot.querySelector('.rectangle-interior-object');
            const delivered = rectangleDeliveredItems.has(slotItem);
            slot.classList.toggle('is-delivered', delivered);
            if (objBtn) {
                objBtn.disabled = delivered;
                objBtn.style.setProperty('--drag-x', '0px');
                objBtn.style.setProperty('--drag-y', '0px');
                objBtn.classList.remove('is-dragging', 'is-returning', 'is-wrong');
            }
        });
    };

    rectangleInteriorPages.forEach((page) => {
        const objects = Array.from(page.querySelectorAll('.rectangle-interior-object'));

        objects.forEach((object) => {
            object.addEventListener('click', () => {
                if (
                    object.disabled
                    || object.closest('.rectangle-interior-storage-slot')?.classList.contains('is-delivered')
                ) return;

                deliverRectangleObjectToCounter(page, object);
            });
        });
    });

    window.addEventListener('resize', () => {
        rectangleInteriorPages.forEach((page) => {
            if (!page.hidden) alignRectangleInteriorScene(page);
        });
    });

    const visibleRectangleInterior = rectangleInteriorPages.find((page) => !page.hidden);
    if (visibleRectangleInterior) {
        setupRectangleInteriorPage(visibleRectangleInterior);
    }

    const triangleGameCharacter = triangleGamePage?.querySelector('.triangle-game-character') || null;
    const triangleGameMessagePanel = triangleGamePage?.querySelector('.triangle-game-message-panel') || null;
    const triangleGameMessageText = triangleGamePage?.querySelector('.triangle-game-message-text') || null;
    const triangleGameMessageLastWord = triangleGamePage?.querySelector('.triangle-game-message-last-word') || null;
    const triangleGameStartButton = triangleGamePage?.querySelector('.triangle-game-start-button') || null;
    const triangleGameBackground = triangleGamePage?.querySelector('.shape-area-bg') || null;
    const triangleGameTreeGroup = triangleGamePage?.querySelector('.triangle-game-tree-group') || null;
    const triangleGameTrees = Array.from(triangleGamePage?.querySelectorAll('[data-triangle-game-tree]') || []);
    const triangleWoodStorage = triangleGamePage?.querySelector('.triangle-wood-storage') || null;
    const triangleWoodStorageImage = triangleWoodStorage?.querySelector('.triangle-wood-storage-image') || null;
    const triangleWoodClickGuide = triangleWoodStorage?.querySelector('.triangle-wood-click-guide') || null;
    const triangleWoodStorageCount = triangleWoodStorage?.querySelector('[data-triangle-wood-count]') || null;
    const triangleCraftingPanel = triangleGamePage?.querySelector('.triangle-crafting-panel') || null;
    const triangleCraftingShapes = triangleCraftingPanel?.querySelector('.triangle-crafting-shapes') || null;
    const triangleCraftingSlots = Array.from(triangleCraftingPanel?.querySelectorAll('[data-triangle-craft-slot]') || []);
    const triangleBridgeQuestion = triangleCraftingPanel?.querySelector('.triangle-bridge-question') || null;
    const triangleBridgeQuestionChoices = Array.from(triangleBridgeQuestion?.querySelectorAll('[data-triangle-count-answer]') || []);
    const triangleBridgeBuildOverlay = triangleCraftingPanel?.querySelector('.triangle-bridge-build-overlay') || null;
    const triangleCraftedBridge = triangleCraftingPanel?.querySelector('.triangle-crafted-bridge') || null;
    const triangleGameCompleteTitle = triangleGamePage?.querySelector('.triangle-game-complete-title') || null;
    const triangleGameCompleteConfetti = triangleGamePage?.querySelector('.triangle-game-complete-confetti') || null;
    const triangleGameCompleteCharacterSequence = triangleGamePage?.querySelector('.triangle-game-complete-character-sequence') || null;
    const triangleGameCompleteWalkingCharacter = triangleGamePage?.querySelector('.triangle-game-complete-walking-character') || null;
    const triangleGameCompleteArrivalCharacter = triangleGamePage?.querySelector('.triangle-game-complete-arrival-character') || null;
    const triangleGameCompleteProgress = triangleGamePage?.querySelector('.triangle-game-complete-progress') || null;
    const triangleGameCompleteReplayButton = triangleGameCompleteProgress?.querySelector('[data-triangle-game-replay]') || null;
    const triangleGameCompleteNextButton = triangleGameCompleteProgress?.querySelector('[data-triangle-game-next]') || null;
    const triangleGameTreeSources = [
        'assets/Shape UI/tree1.webp',
        'assets/Shape UI/tree2.webp',
        'assets/Shape UI/tree3.webp',
        'assets/Shape UI/tree4.webp',
    ];
    const triangleGameBackgroundSource = 'assets/Backgrounds/trianglegame.webp';
    const triangleGameCompletedBackgroundSource = 'assets/Backgrounds/trianglegame1.webp';
    const triangleGameCompleteWalkingSource = 'assets/Character/walking.gif';
    const triangleGameCompleteVoiceSource = 'assets/Audios/Voice over/Mahusay.mp3';
    const triangleGameCompleteCheeringSource = 'assets/Audios/Sound effects/kids cheering.mp3';
    const triangleGameMessages = [
        'Para sa ating triangle mission.',
        'Kailangan nating ayusin ang tulay upang makapagpatuloy!',
        'Aha! May nakita akong mga puno!',
        'Gamitin natin ang mga kahoy para ayusin ang tulay!',
        'Handa ka na ba?',
    ];
    const triangleGameAudioSegments = [
        { start: 0, end: 2.5 },
        { start: 2.5, end: 6.6 },
        { start: 6.6, end: 9.5 },
        { start: 9.5, end: 13.3 },
        { start: 0, end: Number.POSITIVE_INFINITY, source: 'assets/Audios/Voice over/Handa ka na ba.mp3' },
    ];
    let triangleGameDialogueSession = 0;
    let triangleGameDialogueAudio = null;
    let triangleGameDialogueFrame = null;
    let triangleGameDialogueTimers = [];
    let triangleGameDialogueAdvance = null;
    const triangleGameTreePixelData = new Map();
    let triangleWoodCollected = 0;
    let triangleWoodCollectionSession = 0;
    let triangleWoodSnapInProgress = false;
    let triangleBridgeBuildSession = 0;
    let triangleBridgeBuildTimers = [];
    let triangleBridgeQuestionAnswered = false;
    let triangleBridgeQuestionAudio = null;
    let triangleGameCompleteVoiceAudio = null;
    let triangleGameCompleteCheeringAudio = null;
    let triangleGameCompleteWalkLoopTimer = null;

    const prepareTriangleGameCompleteConfetti = () => {
        if (!triangleGameCompleteConfetti || triangleGameCompleteConfetti.childElementCount) return;
        const colors = ['#ff4f64', '#ffd83d', '#38c7e8', '#70d34b', '#ff8f32', '#f17ac6', '#ffffff'];
        Array.from({ length: 56 }, (_, index) => {
            const piece = document.createElement('span');
            piece.style.setProperty('--confetti-x', `${(index * 37) % 101}%`);
            piece.style.setProperty('--confetti-color', colors[index % colors.length]);
            piece.style.setProperty('--confetti-delay', `${-((index * 0.19) % 4.1)}s`);
            piece.style.setProperty('--confetti-duration', `${2.8 + ((index * 13) % 16) / 10}s`);
            piece.style.setProperty('--confetti-drift', `${((index * 31) % 180) - 90}px`);
            piece.style.setProperty('--confetti-size', `${0.42 + ((index * 7) % 12) / 10}rem`);
            triangleGameCompleteConfetti.appendChild(piece);
            return piece;
        });
    };

    const stopTriangleGameCompletionSequence = () => {
        if (triangleGameCompleteWalkLoopTimer !== null) {
            window.clearTimeout(triangleGameCompleteWalkLoopTimer);
            triangleGameCompleteWalkLoopTimer = null;
        }
        triangleGameCompleteVoiceAudio?.pause?.();
        triangleGameCompleteCheeringAudio?.pause?.();
        triangleGameCompleteVoiceAudio = null;
        triangleGameCompleteCheeringAudio = null;
        if (triangleGameCompleteTitle) {
            triangleGameCompleteTitle.hidden = true;
            triangleGameCompleteTitle.classList.remove('is-visible');
        }
        if (triangleGameCompleteConfetti) {
            triangleGameCompleteConfetti.hidden = true;
            triangleGameCompleteConfetti.classList.remove('is-active');
        }
        if (triangleGameCompleteCharacterSequence) {
            triangleGameCompleteCharacterSequence.hidden = true;
            triangleGameCompleteCharacterSequence.classList.remove('is-walking', 'is-arrived', 'is-leaving');
        }
        if (triangleGameCompleteWalkingCharacter) triangleGameCompleteWalkingCharacter.hidden = false;
        if (triangleGameCompleteArrivalCharacter) triangleGameCompleteArrivalCharacter.hidden = true;
        if (triangleGameCompleteProgress) triangleGameCompleteProgress.setAttribute('aria-hidden', 'true');
        triangleGamePage?.classList.remove('is-game-progress-visible');
    };

    const showTriangleGameCompleteProgress = () => {
        if (!triangleGamePage?.classList.contains('is-bridge-complete-scene') || !triangleGameCompleteProgress) return;
        if (triangleGameCompleteTitle) {
            triangleGameCompleteTitle.classList.remove('is-visible');
            triangleGameCompleteTitle.hidden = true;
        }
        if (triangleGameCompleteConfetti) {
            triangleGameCompleteConfetti.classList.remove('is-active');
            triangleGameCompleteConfetti.hidden = true;
        }
        triangleGameCompleteProgress.setAttribute('aria-hidden', 'false');
        triangleGamePage.classList.add('is-game-progress-visible');
        playUiClickSound('boardSuccess');
        triangleBridgeBuildTimers.push(window.setTimeout(() => {
            if (triangleGamePage.classList.contains('is-game-progress-visible')) playUiClickSound('starPop');
        }, 650));
    };

    const startTriangleGameCompletionExitWalk = () => {
        if (!triangleGameCompleteCharacterSequence || !triangleGamePage?.classList.contains('is-bridge-complete-scene')) return;
        triangleGameCompleteCharacterSequence.classList.remove('is-walking', 'is-arrived', 'is-leaving');
        if (triangleGameCompleteArrivalCharacter) triangleGameCompleteArrivalCharacter.hidden = true;
        if (triangleGameCompleteWalkingCharacter) {
            triangleGameCompleteWalkingCharacter.hidden = false;
            triangleGameCompleteWalkingCharacter.src = `${triangleGameCompleteWalkingSource}?leave=${Date.now()}`;
        }
        triangleGameCompleteCharacterSequence.getBoundingClientRect();

        let hasStarted = false;
        const startLeaving = () => {
            if (hasStarted || !triangleGamePage.classList.contains('is-bridge-complete-scene')) return;
            hasStarted = true;
            triangleGameCompleteCharacterSequence.hidden = false;
            triangleGameCompleteCharacterSequence.classList.add('is-leaving');
            triangleGameCompleteWalkLoopTimer = window.setTimeout(() => {
                triangleGameCompleteWalkLoopTimer = null;
                if (
                    triangleGameCompleteCharacterSequence.classList.contains('is-leaving')
                    && triangleGameCompleteWalkingCharacter
                ) triangleGameCompleteWalkingCharacter.src = `${triangleGameCompleteWalkingSource}?leave-loop=${Date.now()}`;
            }, 2140);
        };
        if (!triangleGameCompleteWalkingCharacter || triangleGameCompleteWalkingCharacter.complete) {
            startLeaving();
        } else {
            triangleGameCompleteWalkingCharacter.addEventListener('load', startLeaving, { once: true });
            triangleGameCompleteWalkingCharacter.addEventListener('error', startLeaving, { once: true });
        }
    };

    const playTriangleGameCompletionAudio = () => {
        if (!window.Audio || !triangleGamePage?.classList.contains('is-bridge-complete-scene')) return;

        let cheeringStarted = false;
        const playCheering = () => {
            if (cheeringStarted || !triangleGamePage?.classList.contains('is-bridge-complete-scene')) return;
            cheeringStarted = true;
            const cheeringAudio = new window.Audio(triangleGameCompleteCheeringSource);
            triangleGameCompleteCheeringAudio = cheeringAudio;
            cheeringAudio.preload = 'auto';
            cheeringAudio.playsInline = true;
            cheeringAudio.onended = () => {
                if (triangleGameCompleteCheeringAudio !== cheeringAudio) return;
                triangleGameCompleteCheeringAudio = null;
                startTriangleGameCompletionExitWalk();
            };
            cheeringAudio.play().catch(() => {
                if (triangleGameCompleteCheeringAudio !== cheeringAudio) return;
                triangleGameCompleteCheeringAudio = null;
                startTriangleGameCompletionExitWalk();
            });
        };

        const voiceAudio = new window.Audio(triangleGameCompleteVoiceSource);
        triangleGameCompleteVoiceAudio = voiceAudio;
        voiceAudio.preload = 'auto';
        voiceAudio.playsInline = true;
        const finishVoice = () => {
            if (triangleGameCompleteVoiceAudio !== voiceAudio) return;
            triangleGameCompleteVoiceAudio = null;
            playCheering();
        };
        voiceAudio.onended = finishVoice;
        voiceAudio.addEventListener('timeupdate', () => {
            if (
                Number.isFinite(voiceAudio.duration)
                && voiceAudio.duration - voiceAudio.currentTime <= 0.65
            ) playCheering();
        });
        voiceAudio.play().catch(finishVoice);
    };

    const startTriangleGameCompletionSequence = () => {
        if (!triangleGameCompleteCharacterSequence || !triangleGamePage?.classList.contains('is-bridge-complete-scene')) return;

        if (triangleGameCompleteTitle) {
            triangleGameCompleteTitle.hidden = false;
            triangleGameCompleteTitle.getBoundingClientRect();
            triangleGameCompleteTitle.classList.add('is-visible');
        }
        triangleGameCompleteCharacterSequence.hidden = true;
        triangleGameCompleteCharacterSequence.classList.remove('is-walking', 'is-arrived', 'is-leaving');
        if (triangleGameCompleteArrivalCharacter) triangleGameCompleteArrivalCharacter.hidden = true;
        if (triangleGameCompleteWalkingCharacter) {
            triangleGameCompleteWalkingCharacter.hidden = false;
            triangleGameCompleteWalkingCharacter.src = `${triangleGameCompleteWalkingSource}?play=${Date.now()}`;
        }
        triangleGameCompleteCharacterSequence.getBoundingClientRect();

        let hasStarted = false;
        const startWalking = () => {
            if (hasStarted || !triangleGamePage.classList.contains('is-bridge-complete-scene')) return;
            hasStarted = true;
            triangleGameCompleteCharacterSequence.hidden = false;
            triangleGameCompleteCharacterSequence.classList.add('is-walking');
        };
        if (!triangleGameCompleteWalkingCharacter || triangleGameCompleteWalkingCharacter.complete) {
            startWalking();
        } else {
            triangleGameCompleteWalkingCharacter.addEventListener('load', startWalking, { once: true });
            triangleGameCompleteWalkingCharacter.addEventListener('error', startWalking, { once: true });
        }
    };

    triangleGameCompleteCharacterSequence?.addEventListener('animationend', (event) => {
        if (
            event.target === triangleGameCompleteCharacterSequence
            && event.animationName === 'triangleGameCompletedBridgeExitDesktop'
            && triangleGamePage?.classList.contains('is-bridge-complete-scene')
        ) {
            if (triangleGameCompleteWalkLoopTimer !== null) {
                window.clearTimeout(triangleGameCompleteWalkLoopTimer);
                triangleGameCompleteWalkLoopTimer = null;
            }
            triangleGameCompleteCharacterSequence.hidden = true;
            triangleGameCompleteCharacterSequence.classList.remove('is-leaving');
            showTriangleGameCompleteProgress();
            return;
        }
        if (
            event.target !== triangleGameCompleteCharacterSequence
            || event.animationName !== 'triangleGameCompletedBridgeWalkDesktop'
            || !triangleGamePage?.classList.contains('is-bridge-complete-scene')
        ) return;
        if (triangleGameCompleteWalkingCharacter) triangleGameCompleteWalkingCharacter.hidden = true;
        if (triangleGameCompleteArrivalCharacter) triangleGameCompleteArrivalCharacter.hidden = false;
        triangleGameCompleteCharacterSequence.classList.remove('is-walking');
        triangleGameCompleteCharacterSequence.classList.add('is-arrived');
        if (triangleGameCompleteConfetti) {
            prepareTriangleGameCompleteConfetti();
            triangleGameCompleteConfetti.hidden = false;
            triangleGameCompleteConfetti.classList.remove('is-active');
            triangleGameCompleteConfetti.getBoundingClientRect();
            triangleGameCompleteConfetti.classList.add('is-active');
        }
        playTriangleGameCompletionAudio();
    });

    triangleGameCompleteReplayButton?.addEventListener('click', () => {
        triangleGamePage?.classList.remove('is-game-progress-visible');
        triangleGameCompleteProgress?.setAttribute('aria-hidden', 'true');
        stopTriangleGameDialogue();
        if (!triangleGameStartButton) return;
        triangleGameStartButton.hidden = false;
        triangleGameStartButton.getBoundingClientRect();
        triangleGameStartButton.classList.add('is-visible');
        triangleGameStartButton.focus({ preventScroll: true });
    });

    triangleGameCompleteNextButton?.addEventListener('click', () => {
        openShapeCameraLayout('triangleCamera');
    });

    triangleGameTreeSources.forEach((source) => {
        const image = new Image();
        image.src = source;
    });

    const resetTriangleGameTrees = () => {
        triangleWoodCollectionSession += 1;
        triangleBridgeBuildSession += 1;
        triangleBridgeBuildTimers.forEach((timerId) => window.clearTimeout(timerId));
        triangleBridgeBuildTimers = [];
        triangleWoodCollected = 0;
        triangleBridgeQuestionAnswered = false;
        triangleBridgeQuestionAudio?.pause?.();
        triangleBridgeQuestionAudio = null;
        triangleGamePage?.classList.remove('is-switching-completed-background', 'is-bridge-complete-scene', 'is-game-progress-visible');
        stopTriangleGameCompletionSequence();
        if (triangleGameBackground) triangleGameBackground.src = triangleGameBackgroundSource;
        triangleGameTreeGroup?.classList.remove('is-active', 'is-over-tree', 'is-exiting');
        triangleGamePage?.querySelectorAll('.triangle-wood-collectible').forEach((collectible) => collectible.remove());
        triangleGamePage?.querySelectorAll('.triangle-wood-drag-ghost').forEach((ghost) => ghost.remove());
        triangleWoodSnapInProgress = false;
        if (triangleWoodStorageCount) triangleWoodStorageCount.textContent = '0';
        if (triangleWoodStorage) {
            triangleWoodStorage.hidden = true;
            triangleWoodStorage.classList.remove('is-visible', 'is-storing', 'is-crafting', 'is-exiting');
        }
        if (triangleWoodStorageImage) {
            triangleWoodStorageImage.removeAttribute('role');
            triangleWoodStorageImage.removeAttribute('tabindex');
            triangleWoodStorageImage.removeAttribute('aria-label');
        }
        if (triangleWoodClickGuide) triangleWoodClickGuide.hidden = true;
        if (triangleCraftingPanel) {
            triangleCraftingPanel.hidden = true;
            triangleCraftingPanel.classList.remove('is-visible', 'is-complete', 'is-building', 'is-bridge-revealed', 'is-exiting');
        }
        if (triangleBridgeQuestion) {
            triangleBridgeQuestion.hidden = true;
            triangleBridgeQuestion.classList.remove('is-visible');
        }
        triangleBridgeQuestionChoices.forEach((choice) => {
            choice.disabled = false;
            choice.classList.remove('is-correct', 'is-wrong');
            choice.setAttribute('aria-pressed', 'false');
        });
        triangleCraftingShapes?.classList.remove('is-built-away');
        if (triangleBridgeBuildOverlay) {
            triangleBridgeBuildOverlay.hidden = true;
            triangleBridgeBuildOverlay.classList.remove('is-building', 'is-clearing');
        }
        if (triangleCraftedBridge) {
            triangleCraftedBridge.hidden = true;
            triangleCraftedBridge.classList.remove('is-visible');
        }
        triangleCraftingSlots.forEach((slot) => {
            slot.classList.remove('is-filled', 'is-snapping');
            const wood = slot.querySelector('img');
            if (wood) wood.hidden = true;
        });
        triangleGameTrees.forEach((tree, treeIndex) => {
            tree.src = 'assets/Shape UI/tree.webp';
            tree.dataset.treeStage = '0';
            tree.tabIndex = -1;
            tree.classList.remove('is-clickable', 'is-hit', 'is-fallen');
            tree.setAttribute('aria-label', `Tree ${treeIndex + 1}`);
        });
    };

    const stopTriangleGameDialogue = () => {
        triangleGameDialogueSession += 1;
        triangleGameDialogueTimers.forEach((timerId) => window.clearTimeout(timerId));
        triangleGameDialogueTimers = [];
        if (triangleGameDialogueFrame !== null) {
            window.cancelAnimationFrame(triangleGameDialogueFrame);
            triangleGameDialogueFrame = null;
        }
        if (triangleGameDialogueAudio) {
            triangleGameDialogueAudio.pause?.();
            triangleGameDialogueAudio = null;
        }
        triangleGameDialogueAdvance = null;
        triangleGamePage?.classList.remove('is-dialog-ready');
        if (triangleGameCharacter) {
            triangleGameCharacter.hidden = true;
            triangleGameCharacter.classList.remove('is-visible', 'is-ch17');
        }
        if (triangleGameMessagePanel) {
            triangleGameMessagePanel.hidden = true;
            triangleGameMessagePanel.classList.remove('is-visible', 'is-message-complete', 'is-final-message');
        }
        if (triangleGameMessageText) triangleGameMessageText.textContent = '';
        if (triangleGameMessageLastWord) triangleGameMessageLastWord.textContent = '';
        if (triangleGameStartButton) {
            triangleGameStartButton.hidden = true;
            triangleGameStartButton.classList.remove('is-visible');
        }
        resetTriangleGameTrees();
    };

    const startTriangleGameDialogue = () => {
        if (!triangleGamePage || triangleGamePage.hidden || !triangleGameCharacter || !triangleGameMessagePanel || !triangleGameMessageText) return;

        stopTriangleGameDialogue();
        const session = triangleGameDialogueSession;
        triangleGameCharacter.hidden = false;
        triangleGameMessagePanel.hidden = false;
        triangleGameCharacter.getBoundingClientRect();
        triangleGameMessagePanel.getBoundingClientRect();
        triangleGameCharacter.classList.add('is-visible');
        triangleGameMessagePanel.classList.add('is-visible');

        const playStage = (stageIndex) => {
            const message = triangleGameMessages[stageIndex];
            const segment = triangleGameAudioSegments[stageIndex];
            if (!message || !segment || session !== triangleGameDialogueSession || triangleGamePage.hidden) return;

            triangleGameCharacter.src = stageIndex === 4
                ? 'assets/Character/ch17.webp'
                : stageIndex === 2
                    ? 'assets/Character/ch16.webp'
                    : 'assets/Character/ch6.webp';
            triangleGameCharacter.classList.toggle('is-ch17', stageIndex === 4);
            triangleGameDialogueAdvance = null;
            triangleGamePage.classList.remove('is-dialog-ready');
            triangleGameMessagePanel.classList.remove('is-message-complete', 'is-final-message');
            triangleGameMessagePanel.classList.toggle('is-final-message', stageIndex >= triangleGameMessages.length - 1);
            triangleGameMessageText.textContent = '';
            if (triangleGameMessageLastWord) triangleGameMessageLastWord.textContent = '';
            let textFinished = false;
            let audioFinished = false;

            const unlockStage = () => {
                if (!textFinished || !audioFinished || session !== triangleGameDialogueSession) return;
                if (stageIndex < triangleGameMessages.length - 1) {
                    const advanceStage = () => {
                        if (session !== triangleGameDialogueSession || triangleGameDialogueAdvance !== advanceStage) return;
                        triangleGameDialogueAdvance = null;
                        playStage(stageIndex + 1);
                    };
                    triangleGameDialogueAdvance = advanceStage;
                    triangleGamePage.classList.add('is-dialog-ready');
                    triangleGameDialogueTimers.push(window.setTimeout(advanceStage, 700));
                    return;
                }

                triangleGameCharacter.classList.remove('is-visible');
                triangleGameMessagePanel.classList.remove('is-visible');
                triangleGameDialogueTimers.push(window.setTimeout(() => {
                    if (session !== triangleGameDialogueSession || triangleGamePage.hidden) return;
                    triangleGameCharacter.hidden = true;
                    triangleGameMessagePanel.hidden = true;
                    if (!triangleGameStartButton) return;
                    triangleGameStartButton.hidden = false;
                    triangleGameStartButton.getBoundingClientRect();
                    triangleGameStartButton.classList.add('is-visible');
                }, 420));
            };

            const lastWordStart = message.lastIndexOf(' ') + 1;
            const messageLead = message.slice(0, lastWordStart);
            const messageLastWord = message.slice(lastWordStart);
            let characterIndex = 0;
            const typeNextCharacter = () => {
                if (session !== triangleGameDialogueSession) return;
                characterIndex += 1;
                if (triangleGameMessageLastWord && characterIndex > messageLead.length) {
                    triangleGameMessageText.textContent = messageLead;
                    triangleGameMessageLastWord.textContent = messageLastWord.slice(0, characterIndex - messageLead.length);
                } else {
                    triangleGameMessageText.textContent = message.slice(0, characterIndex);
                }
                if (characterIndex < message.length) {
                    triangleGameDialogueTimers.push(window.setTimeout(typeNextCharacter, 28));
                    return;
                }
                textFinished = true;
                triangleGameMessagePanel.classList.add('is-message-complete');
                unlockStage();
            };
            typeNextCharacter();

            const AudioCtor = window.Audio;
            if (!AudioCtor) {
                audioFinished = true;
                unlockStage();
                return;
            }

            const audio = new AudioCtor(segment.source || 'assets/Audios/Voice over/trianglemisson.mp3');
            triangleGameDialogueAudio = audio;
            audio.preload = 'auto';
            audio.playsInline = true;
            try {
                audio.currentTime = segment.start;
            } catch (error) {
                // The timestamp is applied as soon as the audio can play.
            }

            const finishAudio = () => {
                if (session !== triangleGameDialogueSession || triangleGameDialogueAudio !== audio) return;
                audio.pause?.();
                triangleGameDialogueAudio = null;
                triangleGameDialogueFrame = null;
                audioFinished = true;
                unlockStage();
            };

            audio.play().then(() => {
                const stopAtSegmentEnd = () => {
                    if (session !== triangleGameDialogueSession || triangleGameDialogueAudio !== audio) return;
                    if (audio.currentTime >= segment.end || audio.ended) {
                        finishAudio();
                        return;
                    }
                    triangleGameDialogueFrame = window.requestAnimationFrame(stopAtSegmentEnd);
                };
                triangleGameDialogueFrame = window.requestAnimationFrame(stopAtSegmentEnd);
            }).catch(finishAudio);
        };

        playStage(0);
    };

    triangleGamePage?.addEventListener('click', (event) => {
        if (event.target.closest('a, button') || typeof triangleGameDialogueAdvance !== 'function') return;
        const advance = triangleGameDialogueAdvance;
        advance();
    });

    const getNextTriangleCraftingSlot = () => triangleCraftingSlots.find((slot) => !slot.classList.contains('is-filled')) || null;

    const showTriangleCraftingPanel = (session) => {
        if (session !== triangleWoodCollectionSession || !triangleCraftingPanel || !triangleWoodStorage) return;
        triangleCraftingPanel.hidden = false;
        triangleCraftingPanel.getBoundingClientRect();
        triangleCraftingPanel.classList.add('is-visible');
        triangleWoodStorage.classList.add('is-crafting');
        triangleWoodStorageImage?.setAttribute('role', 'button');
        triangleWoodStorageImage?.setAttribute('tabindex', '0');
        triangleWoodStorageImage?.setAttribute('aria-label', 'Tap to place a wood block in the bridge frame');
        if (triangleWoodClickGuide) triangleWoodClickGuide.hidden = false;
        playUiClickSound('chime');
    };

    const storeTriangleWoodBlock = (session) => {
        if (session !== triangleWoodCollectionSession || !triangleWoodStorage || !triangleWoodStorageCount) return;
        triangleWoodCollected = Math.min(9, triangleWoodCollected + 1);
        triangleWoodStorageCount.textContent = String(triangleWoodCollected);
        playUiClickSound('woodStore');
        triangleWoodStorage.classList.remove('is-storing');
        triangleWoodStorage.getBoundingClientRect();
        triangleWoodStorage.classList.add('is-storing');
        triangleGameDialogueTimers.push(window.setTimeout(() => {
            if (session === triangleWoodCollectionSession) triangleWoodStorage.classList.remove('is-storing');
        }, 380));
        if (triangleWoodCollected === 9) {
            triangleGameDialogueTimers.push(window.setTimeout(() => showTriangleCraftingPanel(session), 520));
        }
    };

    const releaseTriangleWoodBlocks = (tree) => {
        if (!triangleGamePage || !triangleWoodStorageImage) return;
        const session = triangleWoodCollectionSession;
        window.requestAnimationFrame(() => {
            if (session !== triangleWoodCollectionSession || triangleGamePage.hidden) return;
            const pageRect = triangleGamePage.getBoundingClientRect();
            const treeRect = tree.getBoundingClientRect();
            const storageRect = triangleWoodStorageImage.getBoundingClientRect();
            const startX = treeRect.left - pageRect.left + (treeRect.width * 0.78);
            const startY = treeRect.bottom - pageRect.top - (treeRect.height * 0.34);
            const targetX = storageRect.left - pageRect.left + (storageRect.width / 2);
            const targetY = storageRect.top - pageRect.top + (storageRect.height / 2);
            const burstOffsets = [
                { x: -105, y: -120, rotation: -18 },
                { x: 0, y: -165, rotation: 8 },
                { x: 105, y: -115, rotation: 20 },
            ];

            burstOffsets.forEach((burst, blockIndex) => {
                triangleGameDialogueTimers.push(window.setTimeout(() => {
                    if (session !== triangleWoodCollectionSession || triangleGamePage.hidden) return;
                    const collectible = document.createElement('img');
                    collectible.className = 'triangle-wood-collectible';
                    collectible.src = 'assets/Shape UI/wood-block-stylized.webp';
                    collectible.alt = '';
                    collectible.setAttribute('aria-hidden', 'true');
                    collectible.style.left = `${startX}px`;
                    collectible.style.top = `${startY}px`;
                    triangleGamePage.appendChild(collectible);
                    playUiClickSound('woodCollectPop');

                    const animation = collectible.animate([
                        {
                            left: `${startX}px`,
                            top: `${startY}px`,
                            opacity: 0,
                            transform: `translate(-50%, -50%) scale(0.22) rotate(${burst.rotation - 12}deg)`,
                        },
                        {
                            offset: 0.48,
                            left: `${startX + burst.x}px`,
                            top: `${startY + burst.y}px`,
                            opacity: 1,
                            transform: `translate(-50%, -50%) scale(1.08) rotate(${burst.rotation}deg)`,
                        },
                        {
                            left: `${targetX}px`,
                            top: `${targetY}px`,
                            opacity: 0.94,
                            transform: 'translate(-50%, -50%) scale(0.3) rotate(0deg)',
                        },
                    ], {
                        duration: 1120,
                        easing: 'cubic-bezier(0.2, 0.82, 0.28, 1)',
                        fill: 'forwards',
                    });

                    animation.finished.then(() => {
                        collectible.remove();
                        storeTriangleWoodBlock(session);
                    }).catch(() => collectible.remove());
                }, blockIndex * 180));
            });
        });
    };

    const createTriangleWoodDragGhost = (clientX, clientY) => {
        if (!triangleGamePage) return null;
        const pageRect = triangleGamePage.getBoundingClientRect();
        const ghost = document.createElement('img');
        ghost.className = 'triangle-wood-drag-ghost';
        ghost.src = 'assets/Shape UI/wood-block-stylized.webp';
        ghost.alt = '';
        ghost.setAttribute('aria-hidden', 'true');
        ghost.style.left = `${clientX - pageRect.left}px`;
        ghost.style.top = `${clientY - pageRect.top}px`;
        triangleGamePage.appendChild(ghost);
        return ghost;
    };

    const bumpTriangleWoodStorageImage = (session) => {
        if (session !== triangleWoodCollectionSession || !triangleWoodStorage) return;
        triangleWoodStorage.classList.remove('is-storing');
        triangleWoodStorage.getBoundingClientRect();
        triangleWoodStorage.classList.add('is-storing');
        triangleGameDialogueTimers.push(window.setTimeout(() => {
            if (session === triangleWoodCollectionSession) triangleWoodStorage.classList.remove('is-storing');
        }, 380));
    };

    const playTriangleBridgeQuestionAudio = (source) => {
        triangleBridgeQuestionAudio?.pause?.();
        triangleBridgeQuestionAudio = null;
        const soundScale = window.__learnscapeSoundScale?.() ?? 1;
        if (!window.Audio || soundScale <= 0) return;
        const audio = new window.Audio(source);
        triangleBridgeQuestionAudio = audio;
        audio.preload = 'auto';
        audio.playsInline = true;
        audio.volume = Math.min(1, soundScale);
        const releaseAudio = () => {
            if (triangleBridgeQuestionAudio === audio) triangleBridgeQuestionAudio = null;
        };
        audio.onended = releaseAudio;
        audio.onerror = releaseAudio;
        audio.play().catch(releaseAudio);
    };

    const showTriangleBridgeQuestion = (session) => {
        if (!triangleBridgeQuestion || session !== triangleWoodCollectionSession) return;
        triangleBridgeQuestionAnswered = false;
        triangleBridgeQuestionChoices.forEach((choice) => {
            choice.disabled = false;
            choice.classList.remove('is-correct', 'is-wrong');
            choice.setAttribute('aria-pressed', 'false');
        });
        triangleBridgeQuestion.hidden = false;
        triangleBridgeQuestion.getBoundingClientRect();
        triangleBridgeQuestion.classList.add('is-visible');
        triangleBridgeQuestionChoices[0]?.focus({ preventScroll: true });
        playUiClickSound('chime');
        playTriangleBridgeQuestionAudio('assets/Audios/Voice over/ilang hugis.mp3');
    };

    const startTriangleBridgeBuildSequence = (collectionSession) => {
        if (
            !triangleCraftingPanel
            || !triangleBridgeBuildOverlay
            || !triangleCraftedBridge
            || collectionSession !== triangleWoodCollectionSession
        ) return;

        triangleBridgeBuildSession += 1;
        const buildSession = triangleBridgeBuildSession;
        triangleBridgeBuildTimers.forEach((timerId) => window.clearTimeout(timerId));
        triangleBridgeBuildTimers = [];
        triangleBridgeQuestion?.classList.remove('is-visible');
        if (triangleBridgeQuestion) triangleBridgeQuestion.hidden = true;
        const scheduleBuildStep = (callback, delay) => {
            const timerId = window.setTimeout(() => {
                triangleBridgeBuildTimers = triangleBridgeBuildTimers.filter((currentId) => currentId !== timerId);
                if (
                    buildSession !== triangleBridgeBuildSession
                    || collectionSession !== triangleWoodCollectionSession
                    || triangleGamePage?.hidden
                ) return;
                callback();
            }, delay);
            triangleBridgeBuildTimers.push(timerId);
        };

        triangleCraftingPanel.classList.remove('is-complete', 'is-bridge-revealed');
        triangleCraftingPanel.classList.add('is-building');
        triangleCraftingShapes?.classList.remove('is-built-away');
        triangleCraftedBridge.hidden = true;
        triangleCraftedBridge.classList.remove('is-visible');
        triangleBridgeBuildOverlay.hidden = false;
        triangleBridgeBuildOverlay.classList.remove('is-building', 'is-clearing');
        triangleBridgeBuildOverlay.getBoundingClientRect();
        triangleBridgeBuildOverlay.classList.add('is-building');
        const completedBackgroundPreloader = window.Image ? new window.Image() : null;
        if (completedBackgroundPreloader) completedBackgroundPreloader.src = triangleGameCompletedBackgroundSource;

        [180, 620, 1060, 1500, 1940, 2380, 2820].forEach((delay) => {
            scheduleBuildStep(() => playUiClickSound('wood'), delay);
        });

        scheduleBuildStep(() => {
            triangleCraftingShapes?.classList.add('is-built-away');
            triangleCraftedBridge.hidden = false;
            triangleCraftedBridge.getBoundingClientRect();
            triangleCraftedBridge.classList.add('is-visible');
            triangleCraftingPanel.classList.add('is-bridge-revealed');
            triangleBridgeBuildOverlay.classList.add('is-clearing');
            playUiClickSound('boardSuccess');
        }, 3200);

        scheduleBuildStep(() => {
            triangleBridgeBuildOverlay.hidden = true;
            triangleBridgeBuildOverlay.classList.remove('is-building', 'is-clearing');
            triangleCraftingPanel.classList.remove('is-building');
            triangleCraftingPanel.classList.add('is-complete');
        }, 5000);

        scheduleBuildStep(() => {
            triangleGamePage?.classList.add('is-switching-completed-background');
            triangleCraftingPanel.classList.add('is-exiting');
            triangleWoodStorage?.classList.add('is-exiting');
            triangleGameTreeGroup?.classList.add('is-exiting');
        }, 6000);

        scheduleBuildStep(() => {
            if (triangleGameBackground) triangleGameBackground.src = triangleGameCompletedBackgroundSource;
            triangleCraftingPanel.hidden = true;
            if (triangleWoodStorage) triangleWoodStorage.hidden = true;
            triangleGamePage?.classList.add('is-bridge-complete-scene');
            window.requestAnimationFrame(() => {
                if (
                    buildSession === triangleBridgeBuildSession
                    && collectionSession === triangleWoodCollectionSession
                ) {
                    triangleGamePage?.classList.remove('is-switching-completed-background');
                    startTriangleGameCompletionSequence();
                }
            });
        }, 6500);
    };

    const snapTriangleWoodIntoSlot = (ghost, slot, session) => {
        if (!triangleGamePage || !ghost || !slot || session !== triangleWoodCollectionSession) {
            ghost?.remove();
            return;
        }
        triangleWoodSnapInProgress = true;
        const pageRect = triangleGamePage.getBoundingClientRect();
        const slotRect = slot.getBoundingClientRect();
        const targetX = slotRect.left - pageRect.left + (slotRect.width / 2);
        const targetY = slotRect.top - pageRect.top + (slotRect.height / 2);
        const slotAngle = Number.parseFloat(slot.dataset.slotAngle || '0');
        ghost.src = 'assets/Shape UI/wood-plank-side.webp';
        ghost.classList.add('is-side-view');
        const animation = ghost.animate([
            {
                left: ghost.style.left,
                top: ghost.style.top,
                opacity: 1,
                transform: 'translate(-50%, -50%) rotate(0deg) scale(1)',
            },
            {
                left: `${targetX}px`,
                top: `${targetY}px`,
                opacity: 1,
                transform: `translate(-50%, -50%) rotate(${slotAngle}deg) scale(0.72)`,
            },
        ], {
            duration: 420,
            easing: 'cubic-bezier(0.2, 0.88, 0.3, 1)',
            fill: 'forwards',
        });

        animation.finished.then(() => {
            ghost.remove();
            triangleWoodSnapInProgress = false;
            if (session !== triangleWoodCollectionSession || slot.classList.contains('is-filled')) return;
            const wood = slot.querySelector('img');
            if (wood) wood.hidden = false;
            slot.classList.add('is-filled', 'is-snapping');
            triangleWoodCollected = Math.max(0, triangleWoodCollected - 1);
            if (triangleWoodStorageCount) triangleWoodStorageCount.textContent = String(triangleWoodCollected);
            playUiClickSound('woodStore');
            bumpTriangleWoodStorageImage(session);
            triangleGameDialogueTimers.push(window.setTimeout(() => slot.classList.remove('is-snapping'), 420));

            if (triangleCraftingSlots.every((craftingSlot) => craftingSlot.classList.contains('is-filled'))) {
                triangleWoodStorage?.classList.remove('is-crafting');
                triangleWoodStorage?.classList.add('is-exiting');
                triangleWoodStorageImage?.setAttribute('tabindex', '-1');
                triangleWoodStorageImage?.setAttribute('aria-label', 'All wood blocks have been placed');
                showTriangleBridgeQuestion(session);
            }
        }).catch(() => {
            triangleWoodSnapInProgress = false;
            ghost.remove();
        });
    };

    const placeNextTriangleWood = () => {
        if (
            !triangleWoodStorage?.classList.contains('is-crafting') ||
            triangleWoodCollected <= 0 ||
            triangleWoodSnapInProgress
        ) return;
        const nextSlot = getNextTriangleCraftingSlot();
        if (!nextSlot || !triangleWoodStorageImage) return;
        if (triangleWoodClickGuide) triangleWoodClickGuide.hidden = true;
        const storageRect = triangleWoodStorageImage.getBoundingClientRect();
        const ghost = createTriangleWoodDragGhost(
            storageRect.left + (storageRect.width / 2),
            storageRect.top + (storageRect.height / 2),
        );
        if (!ghost) return;
        playUiClickSound('wood');
        snapTriangleWoodIntoSlot(ghost, nextSlot, triangleWoodCollectionSession);
    };

    triangleWoodStorageImage?.addEventListener('click', placeNextTriangleWood);
    triangleWoodStorageImage?.addEventListener('dragstart', (event) => event.preventDefault());
    triangleWoodStorageImage?.addEventListener('keydown', (event) => {
        if ((event.key !== 'Enter' && event.key !== ' ') || triangleWoodCollected <= 0 || triangleWoodSnapInProgress) return;
        event.preventDefault();
        placeNextTriangleWood();
    });

    triangleBridgeQuestionChoices.forEach((choice) => {
        choice.addEventListener('click', () => {
            if (triangleBridgeQuestionAnswered || triangleBridgeQuestion?.hidden) return;
            const isCorrect = choice.hasAttribute('data-correct-answer');
            triangleBridgeQuestionChoices.forEach((candidate) => {
                candidate.classList.remove('is-correct', 'is-wrong');
                candidate.setAttribute('aria-pressed', 'false');
            });
            choice.classList.add(isCorrect ? 'is-correct' : 'is-wrong');
            choice.setAttribute('aria-pressed', 'true');

            if (!isCorrect) {
                playTriangleBridgeQuestionAudio('assets/Audios/Sound effects/buzzer.mp3');
                triangleGameDialogueTimers.push(window.setTimeout(() => {
                    choice.classList.remove('is-wrong');
                    choice.setAttribute('aria-pressed', 'false');
                }, 650));
                return;
            }

            triangleBridgeQuestionAnswered = true;
            triangleBridgeQuestionChoices.forEach((candidate) => {
                candidate.disabled = true;
            });
            playTriangleBridgeQuestionAudio('assets/Audios/Sound effects/correct.mp3');
            const session = triangleWoodCollectionSession;
            triangleGameDialogueTimers.push(window.setTimeout(() => {
                if (session === triangleWoodCollectionSession) startTriangleBridgeBuildSequence(session);
            }, 650));
        });
    });

    const advanceTriangleGameTree = (tree) => {
        if (!triangleGameTreeGroup?.classList.contains('is-active') || !tree.classList.contains('is-clickable')) return;
        const currentStage = Number.parseInt(tree.dataset.treeStage || '0', 10);
        const nextStage = Math.min(currentStage + 1, 3);
        tree.dataset.treeStage = String(nextStage);
        tree.src = triangleGameTreeSources[nextStage - 1];
        tree.classList.remove('is-hit');
        tree.getBoundingClientRect();
        tree.classList.add('is-hit');

        const treeNumber = triangleGameTrees.indexOf(tree) + 1;
        const tapsRemaining = 3 - nextStage;
        if (nextStage >= 3) {
            tree.classList.remove('is-clickable');
            tree.tabIndex = -1;
            tree.setAttribute('aria-label', `Tree ${treeNumber} is falling`);
            triangleGameDialogueTimers.push(window.setTimeout(() => {
                if (triangleGamePage?.hidden || tree.dataset.treeStage !== '3') return;
                tree.src = triangleGameTreeSources[3];
                tree.dataset.treeStage = '4';
                tree.classList.add('is-fallen');
                tree.setAttribute('aria-label', `Tree ${treeNumber} has fallen`);
                releaseTriangleWoodBlocks(tree);
            }, 380));
            return;
        }
        tree.setAttribute('aria-label', `Tree ${treeNumber}, ${tapsRemaining} taps remaining`);
    };

    const isPointOnTriangleGameTree = (tree, clientX, clientY) => {
        if (!tree.complete || !tree.naturalWidth || !tree.naturalHeight) return false;
        const rect = tree.getBoundingClientRect();
        if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return false;

        const scale = Math.min(rect.width / tree.naturalWidth, rect.height / tree.naturalHeight);
        const renderedWidth = tree.naturalWidth * scale;
        const renderedHeight = tree.naturalHeight * scale;
        const offsetX = (rect.width - renderedWidth) / 2;
        const offsetY = rect.height - renderedHeight;
        const mirroredX = rect.right - clientX;
        const localY = clientY - rect.top;
        if (mirroredX < offsetX || mirroredX >= offsetX + renderedWidth || localY < offsetY || localY >= offsetY + renderedHeight) return false;

        const source = tree.currentSrc || tree.src;
        let pixelData = triangleGameTreePixelData.get(source);
        if (!pixelData) {
            const canvas = document.createElement('canvas');
            canvas.width = tree.naturalWidth;
            canvas.height = tree.naturalHeight;
            const context = canvas.getContext('2d', { willReadFrequently: true });
            if (!context) return true;
            context.drawImage(tree, 0, 0);
            try {
                pixelData = context.getImageData(0, 0, canvas.width, canvas.height);
                triangleGameTreePixelData.set(source, pixelData);
            } catch (error) {
                return true;
            }
        }

        const pixelX = Math.min(pixelData.width - 1, Math.floor(((mirroredX - offsetX) / renderedWidth) * pixelData.width));
        const pixelY = Math.min(pixelData.height - 1, Math.floor(((localY - offsetY) / renderedHeight) * pixelData.height));
        return pixelData.data[((pixelY * pixelData.width) + pixelX) * 4 + 3] > 24;
    };

    const findTriangleGameTreeAtPoint = (clientX, clientY) => [...triangleGameTrees]
        .reverse()
        .find((tree) => tree.classList.contains('is-clickable') && isPointOnTriangleGameTree(tree, clientX, clientY));

    triangleGameStartButton?.addEventListener('click', () => {
        triangleGameStartButton.classList.remove('is-visible');
        triangleGameStartButton.hidden = true;
        triangleGameTreeGroup?.classList.add('is-active');
        if (triangleWoodStorage) {
            triangleWoodStorage.hidden = false;
            triangleWoodStorage.getBoundingClientRect();
            triangleWoodStorage.classList.add('is-visible');
        }
        triangleGameTrees.forEach((tree, treeIndex) => {
            tree.src = 'assets/Shape UI/tree.webp';
            tree.dataset.treeStage = '0';
            tree.tabIndex = 0;
            tree.classList.add('is-clickable');
            tree.classList.remove('is-hit', 'is-fallen');
            tree.setAttribute('aria-label', `Tree ${treeIndex + 1}, 3 taps remaining`);
        });
    });

    triangleGameTreeGroup?.addEventListener('click', (event) => {
        const tree = findTriangleGameTreeAtPoint(event.clientX, event.clientY);
        if (tree) advanceTriangleGameTree(tree);
    });

    triangleGameTreeGroup?.addEventListener('pointermove', (event) => {
        triangleGameTreeGroup.classList.toggle('is-over-tree', Boolean(findTriangleGameTreeAtPoint(event.clientX, event.clientY)));
    });

    triangleGameTreeGroup?.addEventListener('pointerleave', () => {
        triangleGameTreeGroup.classList.remove('is-over-tree');
    });

    triangleGameTrees.forEach((tree) => {
        tree.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            advanceTriangleGameTree(tree);
        });
        tree.addEventListener('animationend', () => tree.classList.remove('is-hit'));
    });

    window.addEventListener('learnscape:routechange', (event) => {
        if (event.detail?.route === 'triangleGame') {
            startTriangleGameDialogue();
        } else {
            stopTriangleGameDialogue();
        }
    });

    if (triangleGamePage && !triangleGamePage.hidden) {
        startTriangleGameDialogue();
    }

    const stopShapeChoiceAudio = () => {
        shapeChoiceAudioSession += 1;
        if (shapeChoiceAudioFrame !== null) {
            window.cancelAnimationFrame(shapeChoiceAudioFrame);
            shapeChoiceAudioFrame = null;
        }
        shapeChoiceAudio?.pause?.();
        activeShapeChoice?.classList.remove('is-speaking');
        activeShapeChoice = null;
    };

    const stopShapeQuestionAudio = () => {
        pendingShapeChoice = null;
        pendingShapeChoiceAction = null;
        if (shapeQuestionAudioTimer !== null) {
            window.clearTimeout(shapeQuestionAudioTimer);
            shapeQuestionAudioTimer = null;
        }
        shapeQuestionAudio?.pause?.();
        shapeQuestionAudio = null;
    };

    const scheduleShapeQuestionAudio = () => {
        stopShapeQuestionAudio();
        shapeQuestionAudioTimer = window.setTimeout(() => {
            shapeQuestionAudioTimer = null;
            if (!window.Audio) return;

            const audio = new window.Audio(shapeQuestionAudioSource);
            shapeQuestionAudio = audio;
            audio.preload = 'auto';
            audio.playsInline = true;
            audio.addEventListener('ended', () => {
                if (shapeQuestionAudio !== audio) return;
                shapeQuestionAudio = null;
                const queuedChoice = pendingShapeChoice;
                const queuedAction = pendingShapeChoiceAction;
                pendingShapeChoice = null;
                pendingShapeChoiceAction = null;
                if (queuedChoice) playShapeChoiceAudio(queuedChoice, true, queuedAction);
            }, { once: true });
            audio.play().catch(() => {
                if (shapeQuestionAudio !== audio) return;
                shapeQuestionAudio = null;
                const queuedChoice = pendingShapeChoice;
                const queuedAction = pendingShapeChoiceAction;
                pendingShapeChoice = null;
                pendingShapeChoiceAction = null;
                if (queuedChoice) playShapeChoiceAudio(queuedChoice, true, queuedAction);
            });
        }, 400);
    };

    const playShapeChoiceAudio = async (choice, forceReplay = false, onFinished = null) => {
        if (!choice || choice.disabled || (!forceReplay && choice.dataset.nameHeard === 'true')) return;
        const normalizedShapeName = choice.textContent.trim().toLowerCase();
        const segment = shapeChoiceAudioSegments[normalizedShapeName];
        if (!segment || !shapeChoiceAudio || (window.__learnscapeSoundScale?.() ?? 1) === 0) {
            choice.dataset.nameHeard = 'true';
            onFinished?.();
            return;
        }
        if (
            shapeQuestionAudioTimer !== null
            || (shapeQuestionAudio && !shapeQuestionAudio.paused && !shapeQuestionAudio.ended)
        ) {
            pendingShapeChoice = choice;
            pendingShapeChoiceAction = onFinished;
            return;
        }

        pendingShapeChoice = null;
        pendingShapeChoiceAction = null;
        stopShapeChoiceAudio();
        activeShapeChoice = choice;
        choice.classList.add('is-speaking');
        const session = shapeChoiceAudioSession;

        try {
            shapeChoiceAudio.currentTime = segment.start;
            shapeChoiceAudio.volume = Math.min(1, window.__learnscapeSoundScale?.() ?? 1);
            await shapeChoiceAudio.play();
        } catch (error) {
            if (session === shapeChoiceAudioSession) {
                choice.dataset.nameHeard = 'true';
                stopShapeChoiceAudio();
                onFinished?.();
            }
            return;
        }

        const stopAtSegmentEnd = () => {
            if (session !== shapeChoiceAudioSession) return;
            if (shapeChoiceAudio.currentTime >= segment.end || shapeChoiceAudio.ended) {
                choice.dataset.nameHeard = 'true';
                stopShapeChoiceAudio();
                onFinished?.();
                return;
            }
            shapeChoiceAudioFrame = window.requestAnimationFrame(stopAtSegmentEnd);
        };
        shapeChoiceAudioFrame = window.requestAnimationFrame(stopAtSegmentEnd);
    };

    const playShapeTvCelebration = (page, choiceGroup) => {
        const screen = choiceGroup.closest('.circle-illustration-tv-screen');
        if (!page || !screen) return;
        stopShapeTvCelebration(page);

        const overlay = document.createElement('div');
        overlay.className = 'shape-tv-celebration';
        overlay.setAttribute('role', 'status');
        overlay.setAttribute('aria-live', 'polite');
        overlay.innerHTML = '<div class="shape-tv-celebration-confetti" aria-hidden="true"></div><div class="shape-tv-celebration-copy"><strong>CONGRATULATIONS</strong><span>TAMA ANG IYONG SAGOT!</span></div><div class="shape-tv-celebration-character shape-tv-celebration-ch7" aria-hidden="true"><img src="assets/Character/ch7.webp" alt=""></div><div class="shape-tv-celebration-character shape-tv-celebration-ch8" aria-hidden="true"><img src="assets/Character/ch8.webp" alt=""></div>';
        const confetti = overlay.querySelector('.shape-tv-celebration-confetti');
        for (let index = 0; index < 96; index += 1) {
            const piece = document.createElement('i');
            piece.style.setProperty('--piece-x', `${3 + (index * 37) % 94}%`);
            piece.style.setProperty('--piece-delay', `${-(index % 16) * 0.24}s`);
            piece.style.setProperty('--piece-duration', `${2.7 + (index % 5) * 0.3}s`);
            piece.style.setProperty('--piece-color', ['#ffe56b', '#ff8caa', '#7fe8ff', '#adf081'][index % 4]);
            confetti.append(piece);
        }
        screen.append(overlay);

        const celebration = { overlay, timers: [], audios: [] };
        shapeTvCelebrations.set(page, celebration);
        const schedule = (callback, delay) => {
            const timer = window.setTimeout(callback, delay);
            celebration.timers.push(timer);
        };
        const playSound = (source) => {
            if (!window.Audio || (window.__learnscapeSoundScale?.() ?? 1) === 0) return null;
            const audio = new window.Audio(source);
            audio.volume = Math.min(1, window.__learnscapeSoundScale?.() ?? 1);
            audio.playsInline = true;
            celebration.audios.push(audio);
            audio.play().catch(() => {});
            return audio;
        };
        const finish = () => {
            if (shapeTvCelebrations.get(page) !== celebration) return;
            stopShapeTvCelebration(page);
            if (!isPageVisible(page) || !page.classList.contains('is-tv-lesson-image-visible')) return;
            if (page === circleIllustrationPage) showCircleIllustrationProgress();
            else if (page === shapeSquarePage) showShapeSquareProgress();
            else showShapePreviewProgress(page);
        };
        const startCelebration = () => {
            if (shapeTvCelebrations.get(page) !== celebration || !isPageVisible(page)) return;
            overlay.classList.add('is-active');
            playSound('assets/Audios/Voice over/Mahusay.mp3');
            playSound('assets/Audios/Sound effects/completed.mp3');
            schedule(() => playSound('assets/Audios/Sound effects/kids cheering.mp3'), 450);
            schedule(finish, 4800);
        };

        playSound('assets/Audios/Sound effects/correct.mp3');
        schedule(startCelebration, 600);
    };

    document.querySelectorAll('.shape-tv-choices').forEach((choiceGroup) => {
        const choices = Array.from(choiceGroup.querySelectorAll('.shape-tv-choice'));
        const lessonPage = choiceGroup.closest('.circle-illustration-page, .shape-area-page');
        const handleShapeTvChoiceAnswer = (choice) => {
            delete choice.dataset.answerPending;
            if (choice.disabled) return;
            pendingShapeChoice = null;
            pendingShapeChoiceAction = null;
            stopShapeChoiceAudio();
            if (choice.hasAttribute('data-correct-answer')) {
                shapeWrongAnswerAudio?.pause();
                choices.forEach((item) => {
                    item.disabled = true;
                    item.classList.remove('is-wrong');
                    item.setAttribute('aria-pressed', item === choice ? 'true' : 'false');
                });
                choice.classList.add('is-correct');
                playShapeTvCelebration(lessonPage, choiceGroup);
                return;
            }

            if (shapeWrongAnswerAudio) {
                shapeWrongAnswerAudio.pause();
                shapeWrongAnswerAudio.currentTime = 0;
                shapeWrongAnswerAudio.volume = Math.min(1, window.__learnscapeSoundScale?.() ?? 1);
                if (shapeWrongAnswerAudio.volume > 0) shapeWrongAnswerAudio.play().catch(() => {});
            }
            choice.classList.remove('is-wrong');
            choice.getBoundingClientRect();
            choice.classList.add('is-wrong');
            window.setTimeout(() => choice.classList.remove('is-wrong'), 500);
        };

        choices.forEach((choice) => {
            choice.addEventListener('pointerenter', () => {
                if (choiceGroup.querySelector('[data-answer-pending="true"]')) return;
                playShapeChoiceAudio(choice, true);
            });

            choice.addEventListener('focus', () => {
                if (choiceGroup.querySelector('[data-answer-pending="true"]')) return;
                playShapeChoiceAudio(choice, true);
            });

            choice.addEventListener('pointerleave', () => {
                if (pendingShapeChoice === choice && !pendingShapeChoiceAction) pendingShapeChoice = null;
            });

            choice.addEventListener('click', () => {
                if (choice.disabled || choice.dataset.answerPending === 'true') return;
                choice.dataset.answerPending = 'true';
                handleShapeTvChoiceAnswer(choice);
            });
        });
    });

    const startShapeSquareScene = () => {
        if (!shapeSquarePage || !shapeSquareCharacter3 || !shapeSquareCharacter9 || !shapeSquareCharacter4 || !shapeSquareCharacter5 || !shapeSquareBubble || !shapeSquareBubbleText) return;
        if (!isPageVisible(shapeSquarePage)) return;

        resetShapeSquareScene();
        const session = shapeSquareSession;

        shapeSquareCharacter3.getBoundingClientRect();
        shapeSquareCharacter3.classList.add('is-entering');
        shapeSquareBubble.getBoundingClientRect();
        shapeSquareBubble.classList.add('is-entering');

        let activeStageIndex = 0;
        const showStage = (stageIndex) => {
            if (session !== shapeSquareSession || !isPageVisible(shapeSquarePage)) return;
            if (!shapeSquareIntroStages[stageIndex]) return;

            const previousCharacter = shapeSquareIntroStages[activeStageIndex]?.character || null;
            activeStageIndex = stageIndex;
            const stage = shapeSquareIntroStages[stageIndex];
            if (stage.character === previousCharacter) {
                shapeSquareBubble.classList.remove('is-message-complete');
                return;
            }

            [shapeSquareCharacter3, shapeSquareCharacter9, shapeSquareCharacter4, shapeSquareCharacter5].forEach((character) => {
                if (!character) return;
                character.hidden = character !== stage.character;
                character.classList.remove('is-entering', 'is-exiting');
            });

            stage.character.hidden = false;
            stage.character.getBoundingClientRect();
            stage.character.classList.add('is-entering');

            shapeSquareBubble.classList.remove('is-ch9', 'is-ch4', 'is-ch5', 'is-exiting', 'is-message-changing', 'is-message-complete', 'is-final-message');
            shapeSquareBubble.classList.toggle('is-final-message', stageIndex >= shapeSquareIntroStages.length - 1);
            if (stage.bubbleClass) shapeSquareBubble.classList.add(stage.bubbleClass);
            shapeSquareBubbleText.textContent = '';
        };

        const typeManualMessage = (message, onComplete) => {
            let characterIndex = 0;
            shapeSquareBubbleText.textContent = '';
            const typeNextCharacter = () => {
                if (session !== shapeSquareSession) return;
                characterIndex += 1;
                shapeSquareBubbleText.textContent = message.slice(0, characterIndex);
                if (characterIndex < message.length) {
                    shapeSquareTimers.push(window.setTimeout(typeNextCharacter, 28));
                    return;
                }
                onComplete();
            };
            typeNextCharacter();
        };

        const playManualClip = (source, onEnded) => {
            const AudioCtor = window.Audio;
            if (!AudioCtor) {
                onEnded();
                return;
            }
            const audio = new AudioCtor(source);
            shapeSquareIntroAudio = audio;
            audio.preload = 'auto';
            audio.playsInline = true;
            audio.onended = () => {
                if (session !== shapeSquareSession || shapeSquareIntroAudio !== audio) return;
                shapeSquareIntroAudio = null;
                onEnded();
            };
            audio.play().catch(() => {
                if (session !== shapeSquareSession || shapeSquareIntroAudio !== audio) return;
                shapeSquareIntroAudio = null;
                onEnded();
            });
        };

        const playManualSegment = (start, end, onEnded) => {
            const AudioCtor = window.Audio;
            if (!AudioCtor) {
                onEnded();
                return;
            }
            const audio = new AudioCtor(shapeSquareAreaIntroAudioSource);
            shapeSquareIntroAudio = audio;
            audio.preload = 'auto';
            audio.playsInline = true;
            try {
                audio.currentTime = start;
            } catch (error) {
                // The start point is applied once the segment begins loading.
            }
            audio.play().then(() => {
                const stopAtEnd = () => {
                    if (session !== shapeSquareSession || shapeSquareIntroAudio !== audio) return;
                    if (audio.currentTime >= end || audio.ended) {
                        audio.pause();
                        shapeSquareIntroAudio = null;
                        shapeSquareAreaIntroFrame = null;
                        onEnded();
                        return;
                    }
                    shapeSquareAreaIntroFrame = window.requestAnimationFrame(stopAtEnd);
                };
                shapeSquareAreaIntroFrame = window.requestAnimationFrame(stopAtEnd);
            }).catch(() => {
                if (session !== shapeSquareSession || shapeSquareIntroAudio !== audio) return;
                shapeSquareIntroAudio = null;
                onEnded();
            });
        };

        const playManualStage = (stageIndex) => {
            if (session !== shapeSquareSession || !shapeSquareIntroStages[stageIndex]) return;
            showStage(stageIndex);
            shapeSquarePage.classList.remove('is-intro-click-ready');
            let textFinished = false;
            let audioFinished = false;
            let stageComplete = false;
            let audioCompletionScheduled = false;
            const stageStartedAt = performance.now();
            const minimumAudioMs = [1200, 3000, 2400, 3600, 1200][stageIndex];
            const unlockMessage = () => {
                if (!textFinished || !audioFinished || stageComplete || session !== shapeSquareSession) return;
                stageComplete = true;
                shapeSquareBubble.classList.add('is-message-complete');
                if (stageIndex >= shapeSquareIntroStages.length - 1) {
                    if (shapeSquareStartButton) shapeSquareStartButton.hidden = false;
                    return;
                }
                playManualStage(stageIndex + 1);
            };
            typeManualMessage(shapeSquareIntroStages[stageIndex].message, () => {
                textFinished = true;
                shapeSquareBubble.classList.add('is-message-complete');
                unlockMessage();
            });
            const finishAudio = () => {
                if (audioCompletionScheduled) return;
                audioCompletionScheduled = true;
                const remainingMs = Math.max(0, minimumAudioMs - (performance.now() - stageStartedAt));
                shapeSquareTimers.push(window.setTimeout(() => {
                    audioFinished = true;
                    unlockMessage();
                }, remainingMs));
            };

            if (stageIndex === 0) {
                playManualClip(shapeSquareGreetingAudioSource, finishAudio);
            } else if (stageIndex === 1) {
                playShapeMissionCompletionAudio('circle', finishAudio);
            } else if (stageIndex === 2) {
                playManualSegment(0, 2.4, finishAudio);
            } else if (stageIndex === 3) {
                playManualSegment(2.5, 6.1, finishAudio);
            } else {
                playManualClip(shapeSquareReadyAudioSource, finishAudio);
            }
        };

        playManualStage(0);
        return;

        const AudioCtor = window.Audio;
        if (!AudioCtor) {
            [1, 2, 3, 4].forEach((stageIndex) => {
                shapeSquareTimers.push(window.setTimeout(() => showStage(stageIndex), stageIndex * 2200));
            });
            return;
        }

        const playAreaIntro = () => {
            if (session !== shapeSquareSession || !isPageVisible(shapeSquarePage)) return;

            showStage(2);
            const areaIntroAudio = new AudioCtor(shapeSquareAreaIntroAudioSource);
            shapeSquareIntroAudio = areaIntroAudio;
            areaIntroAudio.preload = 'auto';
            areaIntroAudio.playsInline = true;
            areaIntroAudio.volume = 1;
            let showedNextShapeMessage = false;
            const showNextShapeMessage = () => {
                if (showedNextShapeMessage || session !== shapeSquareSession) return;
                showedNextShapeMessage = true;
                showStage(3);
            };
            let didFinishAreaIntro = false;
            const finishAreaIntro = () => {
                if (didFinishAreaIntro || shapeSquareIntroAudio !== areaIntroAudio) return;
                didFinishAreaIntro = true;
                if (shapeSquareAreaIntroFrame !== null) {
                    window.cancelAnimationFrame(shapeSquareAreaIntroFrame);
                    shapeSquareAreaIntroFrame = null;
                }
                areaIntroAudio.onended = null;
                areaIntroAudio.pause();
                if (shapeSquareIntroAudio !== areaIntroAudio) return;
                shapeSquareIntroAudio = null;
                showNextShapeMessage();
                showStage(4);
            };
            areaIntroAudio.onended = finishAreaIntro;

            areaIntroAudio.play().then(() => {
                const syncAreaIntroMessages = () => {
                    if (session !== shapeSquareSession || shapeSquareIntroAudio !== areaIntroAudio) return;
                    if (areaIntroAudio.currentTime >= 2.5) showNextShapeMessage();
                    if (areaIntroAudio.currentTime >= 6.1 || areaIntroAudio.ended) {
                        finishAreaIntro();
                        return;
                    }
                    shapeSquareAreaIntroFrame = window.requestAnimationFrame(syncAreaIntroMessages);
                };
                shapeSquareAreaIntroFrame = window.requestAnimationFrame(syncAreaIntroMessages);
            }).catch(() => {
                if (shapeSquareIntroAudio !== areaIntroAudio) return;
                areaIntroAudio.onended = null;
                shapeSquareIntroAudio = null;
                shapeSquareTimers.push(window.setTimeout(showNextShapeMessage, 2500));
                shapeSquareTimers.push(window.setTimeout(() => showStage(4), 6100));
            });
        };

        const playCompletedMissionMessage = () => {
            if (session !== shapeSquareSession || !isPageVisible(shapeSquarePage)) return;
            showStage(1);
            playShapeMissionCompletionAudio('circle', playAreaIntro);
        };

        const greetingAudio = new AudioCtor(shapeSquareGreetingAudioSource);
        shapeSquareIntroAudio = greetingAudio;
        greetingAudio.preload = 'auto';
        greetingAudio.playsInline = true;
        greetingAudio.volume = 1;
        greetingAudio.onended = () => {
            if (shapeSquareIntroAudio !== greetingAudio) return;
            shapeSquareIntroAudio = null;
            playCompletedMissionMessage();
        };
        greetingAudio.play().catch(() => {
            if (shapeSquareIntroAudio !== greetingAudio) return;
            greetingAudio.onended = null;
            shapeSquareIntroAudio = null;
            playCompletedMissionMessage();
        });
    };

    const setCircleIllustrationPlayButtonVisible = (isVisible) => {
        if (!circleIllustrationPlayButton) return;

        circleIllustrationPlayButton.hidden = !isVisible;
        circleIllustrationPlayButton.style.display = isVisible ? '' : 'none';
    };

    const setCircleIllustrationSkipButtonVisible = (isVisible) => {
        if (!circleIllustrationSkipButton) return;

        circleIllustrationSkipButton.hidden = !isVisible;
    };

    const clearCircleMissionGuideTimers = () => {
        circleMissionGuideTimers.forEach((timerId) => window.clearTimeout(timerId));
        circleMissionGuideTimers = [];
    };

    const stopCircleMissionGuideAudio = () => {
        if (circleMissionGuideAudioFrame !== null) {
            window.cancelAnimationFrame(circleMissionGuideAudioFrame);
            circleMissionGuideAudioFrame = null;
        }
        if (!circleMissionGuideAudio) return;

        circleMissionGuideAudio.onended = null;
        circleMissionGuideAudio.pause();
        try {
            circleMissionGuideAudio.currentTime = 0;
        } catch (error) {
            // The audio can be mid-load; pausing is enough if rewinding is unavailable.
        }
        circleMissionGuideAudio = null;
    };

    const createCircleMissionGuideAudio = (src) => {
        if (!src) return null;

        const AudioCtor = window.Audio;
        if (!AudioCtor) return null;

        const audio = new AudioCtor(src);
        audio.preload = 'auto';
        audio.playsInline = true;
        audio.volume = 1;
        return audio;
    };

    const waitForCircleMissionGuideAudioMetadata = (audio, timeoutMs = 1200) => new Promise((resolve) => {
        if (!audio) {
            resolve(false);
            return;
        }

        if (Number.isFinite(audio.duration) && audio.duration > 0) {
            resolve(true);
            return;
        }

        let settled = false;
        const finish = (result) => {
            if (settled) return;
            settled = true;
            resolve(result);
        };

        let timeoutId = null;

        const cleanup = () => {
            audio.removeEventListener('loadedmetadata', onMetadata);
            audio.removeEventListener('durationchange', onMetadata);
            audio.removeEventListener('error', onError);
            if (timeoutId) {
                window.clearTimeout(timeoutId);
            }
        };

        const onMetadata = () => {
            cleanup();
            finish(true);
        };

        const onError = () => {
            cleanup();
            finish(false);
        };

        timeoutId = window.setTimeout(() => {
            cleanup();
            finish(false);
        }, timeoutMs);

        audio.addEventListener('loadedmetadata', onMetadata, { once: true });
        audio.addEventListener('durationchange', onMetadata, { once: true });
        audio.addEventListener('error', onError, { once: true });
        audio.load?.();
    });

    const getCircleMissionGuideTypingDelay = (message, audioDurationSeconds) => {
        const plainMessageLength = Math.max(1, String(message || '').replace(/\*\*/g, '').length);
        if (!Number.isFinite(audioDurationSeconds) || audioDurationSeconds <= 0) {
            return circleMissionGuideTypingDelay;
        }

        const typingWindowMs = Math.max(450, Math.round(audioDurationSeconds * 1000 * 0.9));
        const typedDelay = Math.round(typingWindowMs / plainMessageLength);
        return Math.max(18, typedDelay);
    };

    const setCircleMissionGuideTypedText = (message, visibleCharacterCount) => {
        if (!circleMissionGuideText) return;

        const fragment = document.createDocumentFragment();
        const segments = String(message).split(/(\*\*.*?\*\*)/g).filter(Boolean);
        let remainingCharacters = visibleCharacterCount;

        segments.forEach((segment) => {
            if (remainingCharacters <= 0) return;

            const isBold = segment.startsWith('**') && segment.endsWith('**');
            const segmentText = isBold ? segment.slice(2, -2) : segment;
            const visibleText = segmentText.slice(0, remainingCharacters);
            const node = isBold ? document.createElement('strong') : document.createTextNode('');
            node.textContent = visibleText;
            fragment.appendChild(node);
            remainingCharacters -= visibleText.length;
        });

        circleMissionGuideText.replaceChildren(fragment);
    };

    const updateCircleMissionGuideBubbleSize = (message) => {
        if (!circleMissionGuideBubble) return;
        const plainMessageLength = String(message || '').replace(/\*\*/g, '').length;
        circleMissionGuideBubble.classList.toggle('is-short-message', plainMessageLength <= 28);
    };

    const resetCircleMissionGuide = () => {
        clearCircleMissionGuideTimers();
        stopCircleMissionGuideAudio();
        circleMissionGuideSession += 1;

        if (circleMissionGuideText) {
            circleMissionGuideText.textContent = '';
        }
        if (circleMissionGuide) {
            circleMissionGuide.hidden = true;
            circleMissionGuide.setAttribute('aria-hidden', 'true');
            circleMissionGuide.classList.remove('is-active', 'is-bubble-visible', 'is-exiting');
        }
        circleMissionGuideBubble?.classList.remove('is-short-message');
        if (circleMissionStartButton) {
            circleMissionStartButton.hidden = true;
            circleMissionStartButton.classList.remove('is-visible', 'is-clicking');
        }
    };

    const startCircleMissionGuide = () => {
        if (!circleMissionGuide || !circleMissionGuideText || !isPageVisible(circleIllustrationPage)) return;

        resetCircleMissionGuide();
        const session = circleMissionGuideSession;
        circleMissionGuide.hidden = false;
        circleMissionGuide.setAttribute('aria-hidden', 'false');
        circleMissionGuide.getBoundingClientRect();
        circleMissionGuide.classList.add('is-active');

        const playMessage = async (messageIndex) => {
            if (session !== circleMissionGuideSession || !isPageVisible(circleIllustrationPage)) return;

            if (messageIndex >= circleMissionGuideMessages.length) {
                const startButtonTimerId = window.setTimeout(() => {
                    if (session !== circleMissionGuideSession) return;
                    if (!circleMissionStartButton) {
                        resetCircleMissionGuide();
                        showCircleHuntStart();
                        return;
                    }
                    circleMissionStartButton.hidden = false;
                    circleMissionStartButton.getBoundingClientRect();
                    circleMissionStartButton.classList.add('is-visible');
                    circleMissionStartButton.focus({ preventScroll: true });
                    circleMissionGuideTimers = circleMissionGuideTimers.filter((timerId) => timerId !== startButtonTimerId);
                }, 350);
                circleMissionGuideTimers.push(startButtonTimerId);
                return;
            }

            const message = circleMissionGuideMessages[messageIndex];
            const plainMessageLength = message.replace(/\*\*/g, '').length;
            const isLastMessage = messageIndex === circleMissionGuideMessages.length - 1;
            const audioSrc = isLastMessage ? circleMissionGuideReadyAudioSource : null;
            const audio = createCircleMissionGuideAudio(audioSrc);
            let typingDelay = circleMissionGuideTypingDelay;
            let messageCompleted = false;
            let audioCompleted = !audio;
            let nextMessageQueued = false;

            const queueNextMessage = () => {
                if (nextMessageQueued) return;
                nextMessageQueued = true;
                circleMissionGuideTimers.push(window.setTimeout(() => {
                    playMessage(messageIndex + 1).catch(() => {});
                }, isLastMessage ? circleMissionGuideFinalPause : circleMissionGuideMessagePause));
            };

            const finishMessage = () => {
                if (messageCompleted) return;
                messageCompleted = true;
                if (audioCompleted) {
                    queueNextMessage();
                }
            };

            updateCircleMissionGuideBubbleSize(message);
            setCircleMissionGuideTypedText(message, isLastMessage ? plainMessageLength : 0);
            circleMissionGuide.classList.add('is-bubble-visible');

            if (audio) {
                const metadataReady = await waitForCircleMissionGuideAudioMetadata(audio);
                if (session !== circleMissionGuideSession || !isPageVisible(circleIllustrationPage)) return;

                if (metadataReady && Number.isFinite(audio.duration) && audio.duration > 0) {
                    typingDelay = getCircleMissionGuideTypingDelay(message, audio.duration);
                }

                circleMissionGuideAudio = audio;
                circleMissionGuideAudio.onended = () => {
                    if (circleMissionGuideAudio === audio) {
                        circleMissionGuideAudio = null;
                    }
                    audioCompleted = true;
                    if (messageCompleted) {
                        queueNextMessage();
                    }
                };
                try {
                    await audio.play();
                } catch (error) {
                    // If playback is blocked, keep the text animation running.
                    audioCompleted = true;
                }
            }

            if (isLastMessage) {
                finishMessage();
                return;
            }

            const typeCharacter = (characterIndex) => {
                if (session !== circleMissionGuideSession || !isPageVisible(circleIllustrationPage)) return;

                setCircleMissionGuideTypedText(message, characterIndex);
                if (characterIndex >= plainMessageLength) {
                    finishMessage();
                    return;
                }

                circleMissionGuideTimers.push(window.setTimeout(() => {
                    typeCharacter(characterIndex + 1);
                }, typingDelay));
            };

            typeCharacter(1);
        };

        const playSyncedMissionMessages = () => {
            const lastSegment = circleMissionGuideSegments[circleMissionGuideSegments.length - 1];
            let activeSegmentIndex = -1;
            let hasFinished = false;

            const showSegment = (segmentIndex) => {
                if (segmentIndex === activeSegmentIndex || !circleMissionGuideSegments[segmentIndex]) return;
                activeSegmentIndex = segmentIndex;
                const messageIndex = circleMissionGuideSegments[segmentIndex].messageIndex;
                const message = circleMissionGuideMessages[messageIndex] || '';
                updateCircleMissionGuideBubbleSize(message);
                setCircleMissionGuideTypedText(message, message.replace(/\*\*/g, '').length);
                circleMissionGuide.classList.add('is-bubble-visible');
            };

            const playReadyMessage = () => {
                if (hasFinished) return;
                hasFinished = true;
                if (circleMissionGuideAudioFrame !== null) {
                    window.cancelAnimationFrame(circleMissionGuideAudioFrame);
                    circleMissionGuideAudioFrame = null;
                }
                if (circleMissionGuideAudio) {
                    circleMissionGuideAudio.onended = null;
                    circleMissionGuideAudio.pause();
                    circleMissionGuideAudio = null;
                }
                circleMissionGuideTimers.push(window.setTimeout(() => {
                    playMessage(circleMissionGuideMessages.length - 1).catch(() => {});
                }, circleMissionGuideMessagePause));
            };

            const playWithoutAudio = () => {
                circleMissionGuideSegments.forEach((segment, segmentIndex) => {
                    circleMissionGuideTimers.push(window.setTimeout(() => {
                        if (session !== circleMissionGuideSession || !isPageVisible(circleIllustrationPage)) return;
                        showSegment(segmentIndex);
                    }, segment.start * 1000));
                });
                circleMissionGuideTimers.push(window.setTimeout(playReadyMessage, lastSegment.end * 1000));
            };

            const audio = createCircleMissionGuideAudio(circleMissionGuideAudioSource);
            if (!audio) {
                playWithoutAudio();
                return;
            }

            circleMissionGuideAudio = audio;
            audio.onended = playReadyMessage;
            audio.play().then(() => {
                const syncMessagesToAudio = () => {
                    if (
                        session !== circleMissionGuideSession
                        || !isPageVisible(circleIllustrationPage)
                        || circleMissionGuideAudio !== audio
                    ) return;

                    let segmentIndex = 0;
                    circleMissionGuideSegments.forEach((segment, currentIndex) => {
                        if (audio.currentTime >= segment.start) segmentIndex = currentIndex;
                    });
                    showSegment(segmentIndex);

                    if (audio.currentTime >= lastSegment.end) {
                        playReadyMessage();
                        return;
                    }
                    circleMissionGuideAudioFrame = window.requestAnimationFrame(syncMessagesToAudio);
                };

                syncMessagesToAudio();
            }).catch(() => {
                if (circleMissionGuideAudio !== audio) return;
                audio.onended = null;
                circleMissionGuideAudio = null;
                playWithoutAudio();
            });
        };

        circleMissionGuideTimers.push(window.setTimeout(() => {
            playSyncedMissionMessages();
        }, 520));
    };

    const clearCircleHuntTimers = () => {
        circleHuntTimers.forEach((timerId) => window.clearTimeout(timerId));
        circleHuntTimers = [];
        if (circleHuntInterval !== null) {
            window.clearInterval(circleHuntInterval);
            circleHuntInterval = null;
        }
        stopCircleHuntClockTickingAudio();
        stopCircleHuntSecondAudio();
        stopCircleHuntCountdownAudio();
    };

    const stopCircleHuntCountdownAudio = () => {
        if (!circleHuntCountdownAudio) return;

        circleHuntCountdownAudio.onended = null;
        circleHuntCountdownAudio.pause();
        try {
            circleHuntCountdownAudio.currentTime = 0;
        } catch (error) {
            // The clip may still be loading, so pausing is enough.
        }
        circleHuntCountdownAudio = null;
    };

    const playCircleHuntCountdownAudio = () => {
        stopCircleHuntCountdownAudio();
        if (!window.Audio || (window.__learnscapeSoundScale?.() ?? 1) === 0) return;

        const audio = new Audio(circleHuntCountdownAudioSource);
        circleHuntCountdownAudio = audio;
        audio.preload = 'auto';
        audio.playsInline = true;
        audio.volume = Math.min(1, window.__learnscapeSoundScale?.() ?? 1);
        audio.onended = () => {
            if (circleHuntCountdownAudio === audio) circleHuntCountdownAudio = null;
        };
        audio.play().catch(() => {
            if (circleHuntCountdownAudio === audio) circleHuntCountdownAudio = null;
        });
    };

    const stopCircleHuntClockTickingAudio = () => {
        if (!circleHuntClockTickingAudio) return;

        circleHuntClockTickingAudio.pause();
        try {
            circleHuntClockTickingAudio.currentTime = 0;
        } catch (error) {
            // The clip may still be loading, so pausing is enough.
        }
        circleHuntClockTickingAudio = null;
    };

    const syncCircleHuntClockTickingAudio = () => {
        const shouldTick = circleHuntState === 'playing' && circleHuntSeconds > 0 && circleHuntSeconds <= 5;

        if (!shouldTick) {
            stopCircleHuntClockTickingAudio();
            return;
        }

        if (circleHuntClockTickingAudio) return;

        circleHuntClockTickingAudio = new Audio(circleHuntClockTickingAudioSource);
        circleHuntClockTickingAudio.loop = true;
        circleHuntClockTickingAudio.preload = 'auto';
        circleHuntClockTickingAudio.play().catch(() => {
            circleHuntClockTickingAudio = null;
        });
    };

    const stopCircleHuntSecondAudio = () => {
        if (!circleHuntSecondAudio) return;

        circleHuntSecondAudio.pause();
        try {
            circleHuntSecondAudio.currentTime = 0;
        } catch (error) {
            // The clip may still be loading, so pausing is enough.
        }
        circleHuntSecondAudio = null;
    };

    const playCircleHuntSecondAudio = () => {
        stopCircleHuntSecondAudio();
        circleHuntSecondAudio = new Audio(circleHuntSecondAudioSource);
        circleHuntSecondAudio.preload = 'auto';
        circleHuntSecondAudio.onended = () => {
            circleHuntSecondAudio = null;
        };
        circleHuntSecondAudio.play().catch(() => {
            circleHuntSecondAudio = null;
        });
    };

    const stopCircleHuntTimesUpAudio = () => {
        if (!circleHuntTimesUpAudio) return;

        circleHuntTimesUpAudio.pause();
        try {
            circleHuntTimesUpAudio.currentTime = 0;
        } catch (error) {
            // The clip may still be loading, so pausing is enough.
        }
        circleHuntTimesUpAudio = null;
    };

    const playCircleHuntTimesUpAudio = (onFinish = null) => {
        stopCircleHuntTimesUpAudio();
        const audio = new Audio(circleHuntTimesUpAudioSource);
        circleHuntTimesUpAudio = audio;
        audio.preload = 'auto';
        audio.onended = () => {
            if (circleHuntTimesUpAudio !== audio) return;
            circleHuntTimesUpAudio = null;
            onFinish?.();
        };
        audio.play().catch(() => {
            if (circleHuntTimesUpAudio !== audio) return;
            circleHuntTimesUpAudio = null;
            onFinish?.();
        });
    };

    const stopCircleHuntLoseAudio = () => {
        if (!circleHuntLoseAudio) return;

        circleHuntLoseAudio.pause();
        try {
            circleHuntLoseAudio.currentTime = 0;
        } catch (error) {
            // The clip may still be loading, so pausing is enough.
        }
        circleHuntLoseAudio = null;
    };

    const playCircleHuntLoseAudio = () => {
        stopCircleHuntLoseAudio();
        circleHuntLoseAudio = new Audio(circleHuntLoseAudioSource);
        circleHuntLoseAudio.preload = 'auto';
        circleHuntLoseAudio.onended = () => {
            circleHuntLoseAudio = null;
        };
        circleHuntLoseAudio.play().catch(() => {
            circleHuntLoseAudio = null;
        });
    };

    const updateCircleHuntHud = () => {
        if (circleHuntCount) {
            circleHuntCount.textContent = `${circleHuntCollected}/${circleHuntTargets.length}`;
        }
        if (circleHuntTime) {
            circleHuntTime.textContent = `${circleHuntSeconds}s`;
        }
    };

    const setCircleHuntFeedback = (message, kind = '') => {
        if (!circleHuntFeedback) return;

        circleHuntFeedback.classList.remove('is-success', 'is-wrong', 'is-visible');
        circleHuntFeedback.textContent = message;
        if (kind) circleHuntFeedback.classList.add(`is-${kind}`);
        circleHuntFeedback.getBoundingClientRect();
        circleHuntFeedback.classList.add('is-visible');

        const timerId = window.setTimeout(() => {
            circleHuntFeedback.classList.remove('is-visible');
            circleHuntTimers = circleHuntTimers.filter((id) => id !== timerId);
        }, 1150);
        circleHuntTimers.push(timerId);
    };

    const prepareCircleHuntConfetti = () => {
        if (!circleHuntConfetti || circleHuntConfetti.childElementCount) return;

        const colors = ['#ff4f64', '#ffd83d', '#38c7e8', '#70d34b', '#ff8f32', '#ffffff'];
        for (let index = 0; index < 120; index += 1) {
            const piece = document.createElement('span');
            piece.style.setProperty('--confetti-x', `${(index * 37) % 101}%`);
            piece.style.setProperty('--confetti-color', colors[index % colors.length]);
            piece.style.setProperty('--confetti-delay', `${-((index * 0.17) % 3.2)}s`);
            piece.style.setProperty('--confetti-duration', `${2.5 + ((index * 11) % 13) / 10}s`);
            piece.style.setProperty('--confetti-drift', `${((index * 29) % 150) - 75}px`);
            piece.style.setProperty('--confetti-size', `${0.35 + ((index * 5) % 13) / 10}rem`);
            circleHuntConfetti.appendChild(piece);
        }
    };

    const stopCircleHuntCelebrationAudio = () => {
        if (!circleHuntCelebrationAudio) return;

        circleHuntCelebrationAudio.onended = null;
        circleHuntCelebrationAudio.pause();
        try {
            circleHuntCelebrationAudio.currentTime = 0;
        } catch (error) {
            // The clip may still be loading, so pausing is enough.
        }
        circleHuntCelebrationAudio = null;
    };

    const stopCircleHuntCompletedAudio = () => {
        if (circleHuntCompletedFadeFrame !== null) {
            window.cancelAnimationFrame(circleHuntCompletedFadeFrame);
            circleHuntCompletedFadeFrame = null;
        }
        if (!circleHuntCompletedAudio) return;

        circleHuntCompletedAudio.onended = null;
        circleHuntCompletedAudio.pause();
        try {
            circleHuntCompletedAudio.currentTime = 0;
        } catch (error) {
            // The clip may still be loading, so pausing is enough.
        }
        circleHuntCompletedAudio = null;
    };

    const startCircleHuntWinCelebration = () => {
        playCircleHuntKidsCheeringAudio();
        startCircleHuntCelebration();
    };

    const playCircleHuntCompletedAudio = () => {
        stopCircleHuntCompletedAudio();
        const audio = new Audio(circleHuntCompletedAudioSource);
        audio.preload = 'auto';
        circleHuntCompletedAudio = audio;
        audio.onended = () => {
            if (circleHuntCompletedAudio !== audio) return;
            if (circleHuntCompletedFadeFrame !== null) {
                window.cancelAnimationFrame(circleHuntCompletedFadeFrame);
                circleHuntCompletedFadeFrame = null;
            }
            circleHuntCompletedAudio = null;
            startCircleHuntWinCelebration();
        };
        audio.play()
            .then(() => {
                const updateCompletedAudioFade = () => {
                    if (circleHuntCompletedAudio !== audio) return;
                    const remainingSeconds = audio.duration - audio.currentTime;
                    if (Number.isFinite(remainingSeconds) && remainingSeconds <= 0.5) {
                        audio.volume = Math.max(0, remainingSeconds / 0.5);
                    }
                    circleHuntCompletedFadeFrame = window.requestAnimationFrame(updateCompletedAudioFade);
                };
                updateCompletedAudioFade();
            })
            .catch(() => {
                if (circleHuntCompletedAudio !== audio) return;
                if (circleHuntCompletedFadeFrame !== null) {
                    window.cancelAnimationFrame(circleHuntCompletedFadeFrame);
                    circleHuntCompletedFadeFrame = null;
                }
                circleHuntCompletedAudio = null;
                startCircleHuntWinCelebration();
            });
    };

    const stopCircleHuntKidsCheeringAudio = () => {
        if (!circleHuntKidsCheeringAudio) return;

        circleHuntKidsCheeringAudio.onended = null;
        circleHuntKidsCheeringAudio.pause();
        try {
            circleHuntKidsCheeringAudio.currentTime = 0;
        } catch (error) {
            // The clip may still be loading, so pausing is enough.
        }
        circleHuntKidsCheeringAudio = null;
    };

    const playCircleHuntKidsCheeringAudio = () => {
        stopCircleHuntKidsCheeringAudio();
        const audio = new Audio(circleHuntKidsCheeringAudioSource);
        audio.preload = 'auto';
        circleHuntKidsCheeringAudio = audio;
        audio.onended = () => {
            if (circleHuntKidsCheeringAudio !== audio) return;
            circleHuntKidsCheeringAudio = null;
            showCircleHuntRewardProgress();
        };
        audio.play().catch(() => {
            if (circleHuntKidsCheeringAudio !== audio) return;
            circleHuntKidsCheeringAudio = null;
            showCircleHuntRewardProgress();
        });
    };

    const stopCircleHuntCelebration = () => {
        stopCircleHuntCompletedAudio();
        stopCircleHuntCelebrationAudio();
        stopCircleHuntKidsCheeringAudio();
        circleHuntCelebration?.classList.remove('is-active', 'is-ch8-visible');
        circleHuntCelebration?.setAttribute('aria-hidden', 'true');
    };

    const startCircleHuntCelebration = () => {
        if (!circleHuntCelebration) return;

        prepareCircleHuntConfetti();
        circleHuntCelebration.setAttribute('aria-hidden', 'false');
        circleHuntCelebration.classList.add('is-active', 'is-ch8-visible');
        stopCircleHuntCelebrationAudio();
        circleHuntCelebrationAudio = new Audio(circleHuntCelebrationAudioSource);
        circleHuntCelebrationAudio.preload = 'auto';
        circleHuntCelebrationAudio.onended = () => {
            circleHuntCelebrationAudio = null;
        };
        circleHuntCelebrationAudio.play().catch(() => {
            circleHuntCelebrationAudio = null;
        });
    };

    const showCircleHuntRewardProgress = () => {
        if (circleHuntState !== 'ended' || !isPageVisible(circleIllustrationPage)) return;

        circleHuntState = 'reward';
        clearCircleHuntTimers();
        stopCircleHuntCelebration();
        circleHuntUi?.setAttribute('aria-hidden', 'true');
        if (circleHuntUi) circleHuntUi.hidden = true;
        circleIllustrationPage?.classList.remove('is-circle-hunt-active', 'is-circle-hunt-ended', 'is-circle-hunt-timeout', 'is-circle-hunt-timeout-intro', 'is-circle-hunt-timeout-result');
        showCircleIllustrationProgress();
        if (circleIllustrationReplayImage) {
            circleIllustrationReplayImage.src = 'assets/Buttons/Retry.webp';
        }
        if (circleIllustrationProgress) circleIllustrationProgress.dataset.progressStage = 'hunt';
        circleIllustrationReplayButton?.setAttribute('aria-label', 'Retry circle hunt');
        const secondStarTimerId = window.setTimeout(() => {
            setCircleIllustrationEarnedStars(2);
            circleIllustrationCelebrationTimers = circleIllustrationCelebrationTimers.filter(
                (timerId) => timerId !== secondStarTimerId,
            );
        }, 40);
        circleIllustrationCelebrationTimers.push(secondStarTimerId);
    };

    const resetCircleHunt = () => {
        clearCircleHuntTimers();
        stopCircleHuntCelebration();
        stopCircleHuntTimesUpAudio();
        stopCircleHuntLoseAudio();
        circleHuntState = 'idle';
        circleHuntSeconds = circleHuntStartingSeconds;
        circleHuntCollected = 0;
        circleHuntIncorrectAttempts = 0;
        circleIllustrationPage?.classList.remove('is-circle-hunt-active', 'is-circle-hunt-playing', 'is-circle-hunt-ended', 'is-circle-hunt-timeout', 'is-circle-hunt-timeout-intro', 'is-circle-hunt-timeout-result');
        circleHuntUi?.setAttribute('aria-hidden', 'true');
        if (circleHuntUi) circleHuntUi.hidden = true;
        if (circleHuntStartButton) {
            circleHuntStartButton.hidden = false;
            circleHuntStartButton.textContent = 'START';
        }
        if (circleHuntPlayAgainButton) circleHuntPlayAgainButton.hidden = true;
        if (circleHuntCountdown) {
            circleHuntCountdown.hidden = true;
            circleHuntCountdown.textContent = '';
            circleHuntCountdown.classList.remove('is-result', 'is-win');
        }
        if (circleHuntFeedback) {
            circleHuntFeedback.textContent = '';
            circleHuntFeedback.classList.remove('is-success', 'is-wrong', 'is-visible');
        }
        circleIllustrationScene?.querySelectorAll('.circle-hunt-miss-marker').forEach((marker) => marker.remove());
        circleHuntTargets.forEach((target) => {
            target.classList.remove('is-collected', 'is-correct', 'is-hinting');
            target.setAttribute('tabindex', '-1');
            target.removeAttribute('aria-disabled');
        });
        updateCircleHuntHud();
    };

    const showCircleHuntStart = () => {
        if (!circleHuntUi || !isPageVisible(circleIllustrationPage)) return;

        resetCircleHunt();
        circleHuntState = 'ready';
        circleHuntUi.hidden = false;
        circleHuntUi.setAttribute('aria-hidden', 'false');
        circleIllustrationVideo?.pause();
        circleIllustrationPage?.classList.add('is-lesson-complete');
        setCircleIllustrationPlayButtonVisible(false);
        setCircleIllustrationSkipButtonVisible(false);
        circleIllustrationPage?.classList.add('is-circle-hunt-active');
        circleHuntStartButton?.focus({ preventScroll: true });
    };

    const finishCircleHunt = (didWin) => {
        if (circleHuntState !== 'playing') return;

        clearCircleHuntTimers();
        stopCircleHuntClockTickingAudio();
        circleHuntState = 'ended';
        circleIllustrationPage?.classList.remove('is-circle-hunt-playing');
        circleIllustrationPage?.classList.add('is-circle-hunt-ended');
        circleIllustrationPage?.classList.toggle('is-circle-hunt-timeout', !didWin);
        circleIllustrationPage?.classList.toggle('is-circle-hunt-timeout-intro', !didWin);
        circleIllustrationPage?.classList.remove('is-circle-hunt-timeout-result');
        circleHuntTargets.forEach((target) => target.setAttribute('tabindex', '-1'));
        if (circleHuntCountdown) {
            circleHuntCountdown.hidden = !didWin;
            circleHuntCountdown.textContent = didWin ? 'YOU FOUND THEM ALL!' : '';
            circleHuntCountdown.classList.add('is-result');
            circleHuntCountdown.classList.toggle('is-win', didWin);
        }
        if (circleHuntStartButton) {
            circleHuntStartButton.hidden = true;
        }
        if (circleHuntPlayAgainButton) {
            circleHuntPlayAgainButton.hidden = true;
        }
        if (didWin) {
            if (circleHuntFeedback) {
                circleHuntFeedback.textContent = '';
                circleHuntFeedback.classList.remove('is-success', 'is-wrong', 'is-visible');
            }
            playCircleHuntCompletedAudio();
        } else {
            if (circleHuntFeedback) {
                circleHuntFeedback.textContent = '';
                circleHuntFeedback.classList.remove('is-success', 'is-wrong', 'is-visible');
            }
            playCircleHuntTimesUpAudio(() => {
                if (circleHuntState !== 'ended') return;
                circleIllustrationPage?.classList.remove('is-circle-hunt-timeout-intro');
                circleIllustrationPage?.classList.add('is-circle-hunt-timeout-result');
                if (circleHuntCountdown) {
                    circleHuntCountdown.textContent = "TIME'S UP!";
                    circleHuntCountdown.hidden = false;
                }
                if (circleHuntPlayAgainButton) {
                    circleHuntPlayAgainButton.hidden = false;
                    circleHuntPlayAgainButton.focus({ preventScroll: true });
                }
                playCircleHuntLoseAudio();
            });
        }
    };

    const beginCircleHuntTimer = () => {
        if (circleHuntState !== 'countdown') return;

        circleHuntState = 'playing';
        circleIllustrationPage?.classList.add('is-circle-hunt-playing');
        if (circleHuntCountdown) circleHuntCountdown.hidden = true;
        circleHuntTargets.forEach((target) => target.setAttribute('tabindex', '0'));
        circleHuntTargets.find((target) => !target.classList.contains('is-collected'))?.focus({ preventScroll: true });

        circleHuntInterval = window.setInterval(() => {
            if (circleHuntState !== 'playing') return;
            circleHuntSeconds = Math.max(0, circleHuntSeconds - 1);
            updateCircleHuntHud();
            syncCircleHuntClockTickingAudio();
            if (circleHuntSeconds > 0) {
                playCircleHuntSecondAudio();
            }
            if (circleHuntSeconds === 0) finishCircleHunt(false);
        }, 1000);
    };

    const startCircleHuntCountdown = () => {
        if (!['ready', 'ended'].includes(circleHuntState)) return;

        clearCircleHuntTimers();
        stopCircleHuntTimesUpAudio();
        stopCircleHuntLoseAudio();
        circleHuntState = 'countdown';
        circleHuntSeconds = circleHuntStartingSeconds;
        circleHuntCollected = 0;
        circleHuntIncorrectAttempts = 0;
        circleIllustrationPage?.classList.remove('is-circle-hunt-ended', 'is-circle-hunt-playing', 'is-circle-hunt-timeout', 'is-circle-hunt-timeout-intro', 'is-circle-hunt-timeout-result');
        stopCircleHuntCelebration();
        circleHuntTargets.forEach((target) => {
            target.classList.remove('is-collected', 'is-correct', 'is-hinting');
            target.setAttribute('tabindex', '-1');
            target.removeAttribute('aria-disabled');
        });
        updateCircleHuntHud();
        if (circleHuntStartButton) circleHuntStartButton.hidden = true;
        if (circleHuntPlayAgainButton) circleHuntPlayAgainButton.hidden = true;
        circleHuntCountdown?.classList.remove('is-result', 'is-win');
        if (!circleHuntCountdown) {
            beginCircleHuntTimer();
            return;
        }

        circleHuntCountdown.hidden = false;
        playCircleHuntCountdownAudio();
        ['3', '2', '1', 'GO!'].forEach((label, index) => {
            const timerId = window.setTimeout(() => {
                if (circleHuntState !== 'countdown') return;
                circleHuntCountdown.textContent = label;
                circleHuntCountdown.classList.remove('is-popping');
                circleHuntCountdown.getBoundingClientRect();
                circleHuntCountdown.classList.add('is-popping');
                playUiClickSound(label === 'GO!' ? 'chime' : 'tap');
            }, index * 700);
            circleHuntTimers.push(timerId);
        });
        const startTimerId = window.setTimeout(beginCircleHuntTimer, 2800);
        circleHuntTimers.push(startTimerId);
    };

    const sparkleCircleHuntHint = () => {
        const undiscovered = circleHuntTargets.filter((target) => !target.classList.contains('is-collected'));
        if (!undiscovered.length) return;

        const hintTarget = undiscovered[Math.floor(Math.random() * undiscovered.length)];
        hintTarget.classList.remove('is-hinting');
        hintTarget.getBoundingClientRect();
        hintTarget.classList.add('is-hinting');
        playUiClickSound('spark');
        const timerId = window.setTimeout(() => {
            hintTarget.classList.remove('is-hinting');
            circleHuntTimers = circleHuntTimers.filter((id) => id !== timerId);
        }, 1250);
        circleHuntTimers.push(timerId);
    };

    const collectCircleHuntTarget = (target) => {
        if (circleHuntState !== 'playing' || !target || target.classList.contains('is-collected')) return;

        target.classList.add('is-collected', 'is-correct');
        target.setAttribute('tabindex', '-1');
        target.setAttribute('aria-disabled', 'true');
        circleHuntCollected += 1;
        circleHuntSeconds += circleHuntCorrectTimeBonus;
        updateCircleHuntHud();
        syncCircleHuntClockTickingAudio();
        setCircleHuntFeedback(`+${circleHuntCorrectTimeBonus} SEC!`, 'success');
        if (circleHuntCollected < circleHuntTargets.length) {
            playUiClickSound('starPop');
        }

        const timerId = window.setTimeout(() => {
            target.classList.remove('is-correct');
            circleHuntTimers = circleHuntTimers.filter((id) => id !== timerId);
        }, 700);
        circleHuntTimers.push(timerId);

        if (circleHuntCollected >= circleHuntTargets.length) {
            finishCircleHunt(true);
        }
    };

    const handleCircleHuntMiss = (event) => {
        if (circleHuntState !== 'playing' || !circleIllustrationScene) return;

        circleHuntIncorrectAttempts += 1;
        setCircleHuntFeedback('Oops! Look for something round!', 'wrong');
        playUiClickSound('thunk');

        const sceneRect = circleIllustrationScene.getBoundingClientRect();
        const marker = document.createElement('span');
        marker.className = 'circle-hunt-miss-marker';
        marker.setAttribute('aria-hidden', 'true');
        marker.style.left = `${event.clientX - sceneRect.left}px`;
        marker.style.top = `${event.clientY - sceneRect.top}px`;
        circleIllustrationScene.appendChild(marker);
        const markerTimerId = window.setTimeout(() => {
            marker.remove();
            circleHuntTimers = circleHuntTimers.filter((id) => id !== markerTimerId);
        }, 650);
        circleHuntTimers.push(markerTimerId);

        if (circleHuntIncorrectAttempts % 3 === 0) {
            sparkleCircleHuntHint();
        }
    };

    const hideCircleIllustrationProgress = () => {
        circleIllustrationCelebrationTimers.forEach((timerId) => window.clearTimeout(timerId));
        circleIllustrationCelebrationTimers = [];
        circleIllustrationPage?.classList.remove('is-progress-visible');
        circleIllustrationProgress?.setAttribute('aria-hidden', 'true');
    };

    const setCircleIllustrationEarnedStars = (count) => {
        if (!circleIllustrationStars) return;

        const earnedStars = Math.max(0, Math.min(3, Number(count) || 0));
        const messages = [
            '',
            'Well done!',
            'Great job!',
            "Wow! You're a shape superstar!",
        ];
        circleIllustrationStars.dataset.earnedStars = String(earnedStars);
        circleIllustrationStars.setAttribute('aria-label', `${earnedStars} of 3 stars earned`);
        if (circleIllustrationStarMessage) {
            circleIllustrationStarMessage.textContent = messages[earnedStars];
        }
    };

    const updateCircleSortProgress = (message = '') => {
        if (circleSortBinCount) {
            circleSortBinCount.textContent = `${circleSortCollectedCount}/${circleSortTargetCount}`;
        }
        circleSortBin?.setAttribute(
            'aria-label',
            `Circle bin, ${circleSortCollectedCount} of ${circleSortTargetCount} circle objects collected`,
        );
        if (circleSortFeedback && message) {
            circleSortFeedback.textContent = message;
        }
    };

    const resetCircleSortActivity = () => {
        circleSortResetTimers.forEach((timerId) => window.clearTimeout(timerId));
        circleSortResetTimers = [];
        circleSortCollectedCount = 0;
        circleSortActiveDrag = null;
        circleSortBoard?.classList.remove('is-complete');
        circleSortBoard?.setAttribute('aria-hidden', 'true');
        circleSortBin?.classList.remove('is-over');
        circleSortFeedback?.classList.remove('is-success');

        circleSortObjects.forEach((object) => {
            object.hidden = false;
            object.disabled = false;
            object.classList.remove('is-dragging', 'is-returning', 'is-collected');
            object.style.setProperty('--drag-x', '0px');
            object.style.setProperty('--drag-y', '0px');
        });
        updateCircleSortProgress('Find the round objects!');
    };

    const startCircleSortActivity = () => {
        resetCircleSortActivity();
        circleSortBoard?.setAttribute('aria-hidden', 'false');
    };

    const isPointInsideCircleSortBin = (clientX, clientY) => {
        if (!circleSortBin) return false;

        const binRect = circleSortBin.getBoundingClientRect();
        const radius = Math.min(binRect.width, binRect.height) * 0.58;
        const distance = Math.hypot(
            clientX - (binRect.left + binRect.width / 2),
            clientY - (binRect.top + binRect.height / 2),
        );
        return distance <= radius;
    };

    const returnCircleSortObject = (object, message) => {
        if (!object) return;

        object.classList.remove('is-dragging');
        object.classList.add('is-returning');
        object.style.setProperty('--drag-x', '0px');
        object.style.setProperty('--drag-y', '0px');
        updateCircleSortProgress(message);
        playUiClickSound('thunk');

        const timerId = window.setTimeout(() => {
            object.classList.remove('is-returning');
            circleSortResetTimers = circleSortResetTimers.filter((id) => id !== timerId);
        }, 450);
        circleSortResetTimers.push(timerId);
    };

    const collectCircleSortObject = (object) => {
        if (!object || !circleSortBin || object.classList.contains('is-collected')) return;

        const objectRect = object.getBoundingClientRect();
        const binRect = circleSortBin.getBoundingClientRect();
        const currentDragX = circleSortActiveDrag?.dragX || 0;
        const currentDragY = circleSortActiveDrag?.dragY || 0;
        const targetX = currentDragX + (binRect.left + binRect.width / 2) - (objectRect.left + objectRect.width / 2);
        const targetY = currentDragY + (binRect.top + binRect.height / 2) - (objectRect.top + objectRect.height / 2);

        object.classList.remove('is-dragging');
        object.classList.add('is-collected');
        object.disabled = true;
        object.style.setProperty('--drag-x', `${targetX}px`);
        object.style.setProperty('--drag-y', `${targetY}px`);
        circleSortCollectedCount += 1;

        const isComplete = circleSortCollectedCount >= circleSortTargetCount;
        updateCircleSortProgress(
            isComplete
                ? 'Amazing! You found every circle object!'
                : `${object.dataset.objectName || 'Circle object'} collected!`,
        );
        playUiClickSound(isComplete ? 'progressCelebration' : 'starPop');

        if (isComplete) {
            circleSortBoard?.classList.add('is-complete');
            circleSortFeedback?.classList.add('is-success');
        }

        const timerId = window.setTimeout(() => {
            object.hidden = true;
            circleSortResetTimers = circleSortResetTimers.filter((id) => id !== timerId);
        }, 520);
        circleSortResetTimers.push(timerId);
    };

    const beginCircleSortDrag = (event) => {
        const object = event.currentTarget;
        if (
            !object
            || object.disabled
            || circleSortActiveDrag
            || (event.pointerType === 'mouse' && event.button !== 0)
        ) return;

        circleSortActiveDrag = {
            object,
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            dragX: 0,
            dragY: 0,
            didMove: false,
        };
        object.classList.remove('is-returning');
        object.classList.add('is-dragging');
        object.setPointerCapture?.(event.pointerId);
        event.preventDefault();
    };

    const moveCircleSortDrag = (event) => {
        const drag = circleSortActiveDrag;
        if (!drag || drag.pointerId !== event.pointerId || drag.object !== event.currentTarget) return;

        drag.dragX = event.clientX - drag.startX;
        drag.dragY = event.clientY - drag.startY;
        drag.didMove = drag.didMove || Math.hypot(drag.dragX, drag.dragY) > 4;
        drag.object.style.setProperty('--drag-x', `${drag.dragX}px`);
        drag.object.style.setProperty('--drag-y', `${drag.dragY}px`);
        circleSortBin?.classList.toggle('is-over', isPointInsideCircleSortBin(event.clientX, event.clientY));
        event.preventDefault();
    };

    const endCircleSortDrag = (event, wasCancelled = false) => {
        const drag = circleSortActiveDrag;
        if (!drag || drag.pointerId !== event.pointerId) return;

        const object = drag.object;
        const droppedOnBin = !wasCancelled && isPointInsideCircleSortBin(event.clientX, event.clientY);
        const isCircleObject = object.hasAttribute('data-circle-object');
        object.releasePointerCapture?.(event.pointerId);
        circleSortBin?.classList.remove('is-over');
        circleSortIgnoreClickUntil = performance.now() + 500;

        if (droppedOnBin && isCircleObject) {
            collectCircleSortObject(object);
        } else {
            const objectName = object.dataset.objectName || 'That object';
            const message = droppedOnBin
                ? `${objectName} is not a circle. It goes back!`
                : isCircleObject
                    ? `Drag the ${objectName.toLowerCase()} into the circle bin.`
                    : 'Look for an object that is round like a circle.';
            returnCircleSortObject(object, message);
        }

        circleSortActiveDrag = null;
        event.preventDefault();
    };

    const showCircleIllustrationProgress = (playRevealSound = true) => {
        if (!circleIllustrationPage || !circleIllustrationProgress) return;

        const wasAlreadyVisible = circleIllustrationPage.classList.contains('is-progress-visible');
        circleIllustrationVideo?.pause();
        setCircleIllustrationPlayButtonVisible(false);
        setCircleIllustrationSkipButtonVisible(false);
        circleIllustrationPage.classList.remove('is-lesson-complete');
        circleIllustrationPage.classList.add('is-progress-visible');
        if (circleIllustrationReplayImage) {
            circleIllustrationReplayImage.src = 'assets/Buttons/replay.webp';
        }
        circleIllustrationProgress.dataset.progressStage = 'lesson';
        circleIllustrationReplayButton?.setAttribute('aria-label', 'Replay lesson');
        setCircleIllustrationEarnedStars(1);
        circleIllustrationProgress.setAttribute('aria-hidden', 'false');
        circleIllustrationNextButton?.focus({ preventScroll: true });

        if (!wasAlreadyVisible && playRevealSound) {
            playUiClickSound('boardSuccess');
            const starSoundTimer = window.setTimeout(() => {
                playUiClickSound('starPop');
                circleIllustrationCelebrationTimers = circleIllustrationCelebrationTimers.filter(
                    (timerId) => timerId !== starSoundTimer,
                );
            }, 700);
            circleIllustrationCelebrationTimers.push(starSoundTimer);
        }
    };

    const retryCircleHunt = () => {
        hideCircleIllustrationProgress();
        showCircleHuntStart();
    };

    const finishCircleIllustrationLesson = () => {
        hideCircleIllustrationProgress();
        resetCircleHunt();
        circleIllustrationVideo?.pause();
        circleIllustrationPage?.classList.add('is-lesson-complete');
        setCircleIllustrationPlayButtonVisible(false);
        setCircleIllustrationSkipButtonVisible(false);
        circleMissionGuideTimers.push(window.setTimeout(startCircleMissionGuide, 280));
    };

    const openCircleCameraLayout = () => {
        hideCircleIllustrationProgress();
        resetCircleHunt();
        stopCircleHuntCelebration();
        circleIllustrationVideo?.pause();
        navigateApp('circleCamera');
    };

    let circleCameraStream = null;

    const setCircleCameraButtonText = (text) => {
        const label = circleCameraStartButton?.querySelector('strong');
        if (label) label.textContent = text;
    };

    const stopCircleCameraStream = () => {
        if (circleCameraStream) {
            circleCameraStream.getTracks().forEach((track) => track.stop());
            circleCameraStream = null;
        }
        if (circleCameraVideo) {
            circleCameraVideo.pause();
            circleCameraVideo.srcObject = null;
            circleCameraVideo.hidden = true;
        }
        if (circleCameraStartButton) {
            circleCameraStartButton.disabled = false;
            setCircleCameraButtonText('Start Camera');
        }
    };

    const startCircleCameraStream = async () => {
        if (!circleCameraStartButton || !circleCameraVideo) return;
        if (!navigator.mediaDevices?.getUserMedia) {
            setCircleCameraButtonText('Camera Unavailable');
            return;
        }

        circleCameraStartButton.disabled = true;
        setCircleCameraButtonText('Opening Camera...');

        try {
            stopCircleCameraStream();
            circleCameraStartButton.disabled = true;
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                },
                audio: false,
            });
            circleCameraStream = stream;
            circleCameraVideo.srcObject = stream;
            circleCameraVideo.hidden = false;
            await circleCameraVideo.play();
            setCircleCameraButtonText('Camera Ready');
        } catch (error) {
            circleCameraStartButton.disabled = false;
            setCircleCameraButtonText('Allow Camera');
        }
    };

    const shapeCameraStreams = new Map();

    const setShapeCameraButtonText = (page, text) => {
        const label = page?.querySelector('.circle-camera-start-button strong');
        if (label) label.textContent = text;
    };

    const stopShapeCameraStream = (page) => {
        const stream = shapeCameraStreams.get(page);
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            shapeCameraStreams.delete(page);
        }

        const video = page?.querySelector('.circle-camera-video');
        const button = page?.querySelector('.circle-camera-start-button');
        if (video) {
            video.pause();
            video.srcObject = null;
            video.hidden = true;
        }
        if (button) {
            button.disabled = false;
            setShapeCameraButtonText(page, 'Start Camera');
        }
    };

    const stopAllShapeCameraStreams = () => {
        shapeCameraPages.forEach(stopShapeCameraStream);
    };

    const startShapeCameraStream = async (page) => {
        const button = page?.querySelector('.circle-camera-start-button');
        const video = page?.querySelector('.circle-camera-video');
        if (!button || !video) return;
        if (!navigator.mediaDevices?.getUserMedia) {
            setShapeCameraButtonText(page, 'Camera Unavailable');
            return;
        }

        button.disabled = true;
        setShapeCameraButtonText(page, 'Opening Camera...');

        try {
            stopShapeCameraStream(page);
            button.disabled = true;
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false,
            });
            shapeCameraStreams.set(page, stream);
            video.srcObject = stream;
            video.hidden = false;
            await video.play();
            setShapeCameraButtonText(page, 'Camera Ready');
        } catch (error) {
            button.disabled = false;
            setShapeCameraButtonText(page, 'Allow Camera');
        }
    };

    const openShapeCameraLayout = (routeName) => {
        if (!routeName) return;
        navigateApp(routeName);
    };

    const playCircleIllustrationVideo = async () => {
        if (!circleIllustrationVideo || !isPageVisible(circleIllustrationPage)) return;

        try {
            resetCircleMissionGuide();
            hideCircleIllustrationProgress();
            resetCircleSortActivity();
            resetCircleHunt();
            setCircleIllustrationEarnedStars(0);
            circleIllustrationPage?.classList.remove('is-lesson-complete', 'is-tv-lesson-image-visible');
            resetShapeTvChoices(circleIllustrationPage);
            setCircleIllustrationPlayButtonVisible(false);
            setCircleIllustrationSkipButtonVisible(true);
            circleIllustrationVideo.hidden = false;
            if (circleTvLessonImage) circleTvLessonImage.hidden = true;
            if (circleTvMascot) circleTvMascot.hidden = true;
            if (circleTvQuestionPanel) circleTvQuestionPanel.hidden = true;

            try {
                circleIllustrationVideo.currentTime = 0;
            } catch (error) {
                // The clip may still be preparing metadata; playback can still start from the beginning.
            }

            await circleIllustrationVideo.play();
        } catch (error) {
            setCircleIllustrationPlayButtonVisible(true);
            setCircleIllustrationSkipButtonVisible(false);
            console.warn('Circle lesson video could not play.', error);
        }
    };

    const showCircleTvLessonImage = () => {
        if (!circleIllustrationPage || !circleIllustrationVideo || !circleTvLessonImage) return;

        hideCircleIllustrationProgress();
        circleIllustrationVideo.pause();
        circleIllustrationVideo.hidden = true;
        circleTvLessonImage.hidden = false;
        if (circleTvMascot) circleTvMascot.hidden = false;
        if (circleTvQuestionPanel) circleTvQuestionPanel.hidden = false;
        setCircleIllustrationPlayButtonVisible(false);
        setCircleIllustrationSkipButtonVisible(false);
        circleIllustrationPage.classList.add('is-tv-lesson-image-visible');
    };

    const resetCircleIllustrationVideo = () => {
        if (!circleIllustrationVideo) return;

        resetCircleMissionGuide();
        hideCircleIllustrationProgress();
        resetCircleSortActivity();
        resetCircleHunt();
        circleIllustrationPage?.classList.remove('is-lesson-complete', 'is-tv-lesson-image-visible');
        resetShapeTvChoices(circleIllustrationPage);
        setCircleIllustrationEarnedStars(0);
        setCircleIllustrationSkipButtonVisible(false);
        circleIllustrationVideo.pause?.();
        circleIllustrationVideo.hidden = false;
        if (circleTvLessonImage) circleTvLessonImage.hidden = true;
        if (circleTvMascot) circleTvMascot.hidden = true;
        if (circleTvQuestionPanel) circleTvQuestionPanel.hidden = true;

        try {
            circleIllustrationVideo.currentTime = 0;
        } catch (error) {
            // If the clip is still loading, pausing is enough and the next open will restart it.
        }

        setCircleIllustrationPlayButtonVisible(true);
    };

    window.__learnscapePlayCircleIllustrationVideo = playCircleIllustrationVideo;
    window.__learnscapeResetCircleIllustrationVideo = resetCircleIllustrationVideo;

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

    const getAppNavigator = () => {
        try {
            return window.top && window.top !== window
                ? window.top.__learnscapeNavigate
                : window.__learnscapeNavigate;
        } catch (error) {
            return null;
        }
    };

    const getAppLoadingTransition = () => {
        try {
            return window.top && window.top !== window
                ? window.top.__learnscapeRunWithLoading
                : window.__learnscapeRunWithLoading;
        } catch (error) {
            return null;
        }
    };

    const navigateApp = (target) => {
        const shellNavigate = getAppNavigator();

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
        const targets = [document.documentElement, targetElement].filter((target, index, list) => (
            target && list.indexOf(target) === index
        ));
        let lastError = null;

        for (const root of targets) {
            try {
                if (root.requestFullscreen) {
                    await root.requestFullscreen();
                    return true;
                }

                if (root.webkitRequestFullscreen) {
                    await root.webkitRequestFullscreen();
                    return true;
                }

                if (root.msRequestFullscreen) {
                    await root.msRequestFullscreen();
                    return true;
                }
            } catch (error) {
                lastError = error;
            }
        }

        if (lastError) throw lastError;
        return false;
    };

    const exitFullscreen = async () => {
        const documentsToTry = [document];

        try {
            if (window.top && window.top.document && window.top.document !== document) {
                documentsToTry.push(window.top.document);
            }
        } catch (error) {
            // Same-origin access can fail in embedded contexts; the current document is still worth trying.
        }

        for (const root of documentsToTry) {
            if (root.exitFullscreen) {
                return root.exitFullscreen();
            }

            if (root.webkitExitFullscreen) {
                return root.webkitExitFullscreen();
            }

            if (root.msExitFullscreen) {
                return root.msExitFullscreen();
            }
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

            if (!isFullscreenActive()) return false;
            await lockLandscape();
            document.body.classList.remove('is-windowed-fallback');
            syncFullscreenClass();
            return true;
        } catch (error) {
            console.warn('Fullscreen mode was not available.', error);
            return false;
        }
    };

    const toggleFullscreenFlow = async (targetElement) => {
        try {
            if (isFullscreenActive()) {
                await exitFullscreen();
                return;
            }

            await enterFullscreenFlow(targetElement);
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

    bindGame3Hotspots();
    positionGame3Hotspots();
    if (!isPageVisible(game3Page)) {
        resetGame3Hotspots();
    }

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

    circleSortObjects.forEach((object) => {
        object.addEventListener('pointerdown', beginCircleSortDrag);
        object.addEventListener('pointermove', moveCircleSortDrag);
        object.addEventListener('pointerup', (event) => endCircleSortDrag(event));
        object.addEventListener('pointercancel', (event) => endCircleSortDrag(event, true));
        object.addEventListener('dragstart', (event) => event.preventDefault());
        object.addEventListener('keydown', (event) => {
            if (!['Enter', ' '].includes(event.key) || object.disabled) return;

            event.preventDefault();
            circleSortIgnoreClickUntil = performance.now() + 400;
            if (object.hasAttribute('data-circle-object')) {
                collectCircleSortObject(object);
            } else {
                returnCircleSortObject(object, `${object.dataset.objectName || 'That object'} is not a circle.`);
            }
        });
        object.addEventListener('click', (event) => {
            if (performance.now() < circleSortIgnoreClickUntil) {
                event.preventDefault();
                return;
            }
            if (object.disabled || circleSortActiveDrag) return;

            if (object.hasAttribute('data-circle-object')) {
                collectCircleSortObject(object);
            } else {
                returnCircleSortObject(object, `${object.dataset.objectName || 'That object'} is not a circle.`);
            }
        });
    });
    document.addEventListener('pointerup', (event) => endCircleSortDrag(event), true);
    document.addEventListener('pointercancel', (event) => endCircleSortDrag(event, true), true);

    circleHuntStartButton?.addEventListener('click', startCircleHuntCountdown);
    circleHuntPlayAgainButton?.addEventListener('click', startCircleHuntCountdown);
    circleMissionStartButton?.addEventListener('click', () => {
        playUiClickSound('chime');
        circleMissionStartButton.classList.add('is-clicking');
        const startCircleMissionTimerId = window.setTimeout(() => {
            resetCircleMissionGuide();
            showCircleHuntStart();
            startCircleHuntCountdown();
            circleMissionGuideTimers = circleMissionGuideTimers.filter((timerId) => timerId !== startCircleMissionTimerId);
        }, 180);
        circleMissionGuideTimers.push(startCircleMissionTimerId);
    });
    circleIllustrationScene?.addEventListener('click', (event) => {
        if (circleHuntState !== 'playing') return;

        const target = event.target.closest?.('[data-circle-hunt-target]');
        if (target) {
            collectCircleHuntTarget(target);
        } else {
            handleCircleHuntMiss(event);
        }
    });
    circleHuntTargets.forEach((target) => {
        target.addEventListener('dragstart', (event) => event.preventDefault());
        target.addEventListener('keydown', (event) => {
            if (!['Enter', ' '].includes(event.key)) return;
            event.preventDefault();
            collectCircleHuntTarget(target);
        });
    });

    circleIllustrationPlayButton?.addEventListener('click', () => {
        if (circleIllustrationVideo?.paused && circleIllustrationVideo.currentTime > 0 && !circleIllustrationVideo.ended && !circleIllustrationVideo.hidden) {
            circleIllustrationVideo.play().catch(() => {});
            return;
        }
        playCircleIllustrationVideo();
    });

    circleIllustrationSkipButton?.addEventListener('click', () => {
        showCircleTvLessonImage();
        scheduleShapeQuestionAudio();
    });

    circleIllustrationVideo?.addEventListener('play', () => {
        setCircleIllustrationPlayButtonVisible(false);
        setCircleIllustrationSkipButtonVisible(true);
    });

    circleIllustrationVideo?.addEventListener('ended', showCircleTvLessonImage);

    circleIllustrationReplayButton?.addEventListener('click', () => {
        if (circleIllustrationProgress?.dataset.progressStage === 'hunt') {
            retryCircleHunt();
            return;
        }
        resetCircleIllustrationVideo();
        circleIllustrationPlayButton?.focus({ preventScroll: true });
    });
    circleIllustrationNextButton?.addEventListener('click', () => {
        if (circleIllustrationProgress?.dataset.progressStage === 'hunt') {
            openCircleCameraLayout();
            return;
        }
        finishCircleIllustrationLesson();
    });
    circleCameraStartButton?.addEventListener('click', startCircleCameraStream);
    shapeCameraPages.forEach((page) => {
        page.querySelector('.circle-camera-start-button')?.addEventListener('click', () => {
            startShapeCameraStream(page);
        });
    });

    circleIllustrationVideo?.addEventListener('pause', () => {
        if (
            circleIllustrationVideo.currentTime > 0
            && !circleIllustrationVideo.ended
            && !circleIllustrationPage?.classList.contains('is-progress-visible')
            && !circleIllustrationPage?.classList.contains('is-lesson-complete')
            && !circleIllustrationPage?.classList.contains('is-tv-lesson-image-visible')
        ) {
            setCircleIllustrationPlayButtonVisible(true);
            setCircleIllustrationSkipButtonVisible(false);
        }
    });

    const lessonVideos = Array.from(document.querySelectorAll('.circle-illustration-tv-screen video'));
    const lessonSeekTargets = new WeakMap();
    lessonVideos.forEach((video) => {
        const playButton = video.closest('.circle-illustration-video-stage')?.querySelector('.circle-illustration-play-button');
        video.addEventListener('pause', () => {
            const page = video.closest('.circle-illustration-page, .shape-area-page');
            if (!playButton || !isPageVisible(page) || video.hidden || video.ended || video.currentTime <= 0) return;
            if (playButton.classList.contains('shape-preview-play-button')) playButton.hidden = false;
            playButton.classList.remove('is-paused-fading');
            void playButton.offsetWidth;
            playButton.classList.add('is-paused-fading');
        });
        video.addEventListener('play', () => {
            playButton?.classList.remove('is-paused-fading');
            if (playButton?.classList.contains('shape-preview-play-button')) playButton.hidden = true;
        });
        video.addEventListener('click', () => {
            if (video.hidden || video.ended) return;
            if (video.paused) video.play().catch(() => {});
            else video.pause();
        });
        video.addEventListener('seeked', () => {
            const target = lessonSeekTargets.get(video);
            if (target === undefined) return;
            if (video.hidden || video.ended || Math.abs(video.currentTime - target) < 0.3) {
                lessonSeekTargets.delete(video);
                return;
            }
            video.currentTime = target;
        });
        video.addEventListener('ended', () => lessonSeekTargets.delete(video));
    });
    document.addEventListener('keydown', (event) => {
        if (!['Space', 'ArrowLeft', 'ArrowRight'].includes(event.code) || event.ctrlKey || event.altKey || event.metaKey) return;
        if (event.target?.closest?.('button, a, input, textarea, select, [contenteditable="true"], [role="dialog"]')) return;
        if (getComputedStyle(document.querySelector('.fullscreen-restore-overlay')).display !== 'none') return;

        const video = lessonVideos.find((candidate) => {
            const page = candidate.closest('.circle-illustration-page, .shape-area-page');
            const stage = candidate.closest('.circle-illustration-video-stage');
            return isPageVisible(page)
                && !candidate.hidden
                && !candidate.ended
                && candidate.getClientRects().length > 0
                && stage?.getAttribute('aria-hidden') !== 'true';
        });
        if (!video) return;

        if (event.code === 'Space') {
            if (event.repeat) return;
            event.preventDefault();
            if (video.paused) video.play().catch(() => {});
            else video.pause();
            return;
        }

        if (video.readyState === 0) return;
        event.preventDefault();
        const offset = event.code === 'ArrowRight' ? 5 : -5;
        const end = Number.isFinite(video.duration) ? video.duration : Infinity;
        const target = Math.max(0, Math.min(end, (lessonSeekTargets.get(video) ?? video.currentTime) + offset));
        lessonSeekTargets.set(video, target);
        video.currentTime = target;
    });

    shapeSquarePlayButton?.addEventListener('click', () => {
        if (shapeSquareVideo?.paused && shapeSquareVideo.currentTime > 0 && !shapeSquareVideo.ended && !shapeSquareVideo.hidden) {
            shapeSquareVideo.play().catch(() => {});
            return;
        }
        playShapeSquareLessonVideo();
    });
    shapeSquareSkipButton?.addEventListener('click', () => {
        showShapeSquareTvLessonImage();
        scheduleShapeQuestionAudio();
    });
    shapeSquareVideo?.addEventListener('ended', showShapeSquareTvLessonImage);
    shapeSquareReplayButton?.addEventListener('click', () => {
        if (shapeSquareProgress?.dataset.progressStage === 'answer') {
            returnToShapeSquareMissionStart();
            return;
        }
        resetShapeSquareLessonVideo();
        setShapeSquareVideoStageVisible(true);
        shapeSquarePlayButton?.focus({ preventScroll: true });
    });
    shapeSquareNextButton?.addEventListener('click', () => {
        if (shapeSquareProgress?.dataset.progressStage === 'answer') {
            openShapeCameraLayout('squareCamera');
            return;
        }
        finishShapeSquareLesson();
    });
    shapeSquareMissionStartButton?.addEventListener('click', () => {
        playUiClickSound('chime');
        showShapeSquareObjectGame();
    });
    shapeSquarePuzzleNextButton?.addEventListener('click', () => {
        playUiClickSound('chime');
        triggerShapeSquarePuzzleFollowup();
    });
    shapeSquarePuzzleRetryButton?.addEventListener('click', () => {
        playUiClickSound('chime');
        returnToShapeSquareMissionStart();
    });
    shapeSquareAnswerTileButtons.forEach((tile) => {
        tile.addEventListener('click', handleShapeSquareAnswerTileClick);
    });
    shapeSquareBgImage?.addEventListener('load', updateSquareObjectTargets);

    squareObjectPieces.forEach((piece) => {
        piece.addEventListener('dragstart', (event) => event.preventDefault());
        piece.addEventListener('click', () => activateSquareObjectPiece(piece));
        piece.addEventListener('keydown', (event) => {
            if (!['Enter', ' '].includes(event.key) || piece.dataset.squarePlaced === 'true') return;
            event.preventDefault();
            activateSquareObjectPiece(piece);
        });
    });

    shapeSquareVideo?.addEventListener('play', () => {
        setShapeSquarePlayButtonVisible(false);
        setShapeSquareSkipButtonVisible(true);
    });

    shapeSquareVideo?.addEventListener('pause', () => {
        if (
            shapeSquareVideo.currentTime > 0
            && !shapeSquareVideo.ended
            && !shapeSquarePage?.classList.contains('is-progress-visible')
            && !shapeSquarePage?.classList.contains('is-square-mission-guide')
            && !shapeSquarePage?.classList.contains('is-lesson-complete')
            && !shapeSquarePage?.classList.contains('is-tv-lesson-image-visible')
        ) {
            setShapeSquarePlayButtonVisible(true);
            setShapeSquareSkipButtonVisible(false);
        }
    });

    window.addEventListener('resize', () => {
        updateSquareObjectTargets();
    });

    let activeLearnscapeRoute = isPageVisible(circleIllustrationPage)
        ? 'circleIllustration'
        : isPageVisible(shapeCirclePage)
            ? 'shapeCircle'
            : isPageVisible(shapeSquarePage) ? 'shapeSquare' : null;

    window.addEventListener('learnscape:routechange', (event) => {
        const previousRoute = activeLearnscapeRoute;
        activeLearnscapeRoute = event.detail?.route || null;

        shapePreviewPages.forEach((page) => {
            if (!isPageVisible(page)) resetShapePreviewPage(page);
        });

        if (event.detail?.route !== 'circleIllustration') {
            resetCircleIllustrationVideo();
        }
        if (event.detail?.route !== 'circleCamera') {
            stopCircleCameraStream();
        }
        if (!/^(square|triangle|rectangle|oval|heart|star|diamond)Camera$/.test(event.detail?.route || '')) {
            stopAllShapeCameraStreams();
        }
        if (event.detail?.route !== 'shapeSquare') {
            resetShapeSquareScene();
        }

        if (/^shapeArea[3-8]$/.test(event.detail?.route || '')) {
            const activePreviewPage = shapePreviewPages.find((page) => isPageVisible(page));
            if (activePreviewPage) {
                if (/Camera$/.test(previousRoute || '')) resetShapePreviewPage(activePreviewPage);
                startShapePreviewIntro(activePreviewPage);
            }
            return;
        }

        if (event.detail?.route === 'shapeCircle') {
            if (previousRoute === 'circleIllustration') {
                resetShapeCircleScene();
                showShapeCircleCh3FinalMessage(false);
            } else {
                startShapeCircleScene();
            }
            return;
        }

        if (event.detail?.route === 'shapeSquare') {
            resetShapeCircleScene();
            startShapeSquareScene();
            return;
        }

        resetShapeCircleScene();
    });

    if (isPageVisible(shapeCirclePage)) {
        startShapeCircleScene();
    } else {
        resetShapeCircleScene();
    }

    if (isPageVisible(shapeSquarePage)) {
        startShapeSquareScene();
    } else {
        resetShapeSquareScene();
    }

    shapePreviewPages.forEach((page) => {
        if (isPageVisible(page)) startShapePreviewIntro(page);
    });

    resetCircleIllustrationVideo();

    const ovalBoardStage = document.querySelector('.oval-board-stage');
    const ovalBoardCards = Array.from(document.querySelectorAll('.oval-board-card'));
    const ovalBoardGamePage = document.getElementById('learnscape-oval-board-game-page');
    const ovalMissionGuide = ovalBoardGamePage?.querySelector('.oval-mission-guide') || null;
    const ovalMissionMessagePanel = ovalMissionGuide?.querySelector('.oval-mission-message-panel') || null;
    const ovalMissionMessageText = ovalMissionGuide?.querySelector('.oval-mission-message-text') || null;
    const ovalMissionStartButton = ovalMissionGuide?.querySelector('.oval-mission-start-button') || null;
    const ovalMatchProgressValue = ovalBoardGamePage?.querySelector('.oval-match-progress-value') || null;
    const ovalMatchTimerPanel = ovalBoardGamePage?.querySelector('.oval-match-timer-panel') || null;
    const ovalMatchTimerValue = ovalMatchTimerPanel?.querySelector('.oval-match-timer-value') || null;
    const ovalMatchReward = document.querySelector('.oval-match-reward');
    const ovalMatchConfetti = ovalMatchReward?.querySelector('.oval-match-confetti') || null;
    const ovalMatchObject = ovalMatchReward?.querySelector('.oval-match-object');
    const ovalGameCelebration = ovalBoardGamePage?.querySelector('.oval-game-celebration') || null;
    const ovalCompletedObjects = ovalGameCelebration?.querySelector('.oval-completed-objects') || null;
    const ovalCelebrationConfetti = ovalGameCelebration?.querySelector('.oval-celebration-confetti') || null;
    const ovalFinalProgress = ovalBoardGamePage?.querySelector('.oval-final-progress') || null;
    const ovalFinalReplayButton = ovalFinalProgress?.querySelector('[data-oval-final-replay]') || null;
    const ovalFinalNextButton = ovalFinalProgress?.querySelector('[data-oval-final-next]') || null;
    const ovalTimeoutFlow = ovalBoardGamePage?.querySelector('.oval-timeout-flow') || null;
    const ovalTimesUpStage = ovalTimeoutFlow?.querySelector('.oval-times-up-stage') || null;
    const ovalGameOverPanel = ovalTimeoutFlow?.querySelector('.oval-game-over-panel') || null;
    const ovalGameOverRetryButton = ovalTimeoutFlow?.querySelector('.oval-game-over-retry') || null;
    const ovalPairPieces = [1, 2, 3, 4, 5].flatMap((ovalNumber) => ([
        {
            number: ovalNumber,
            image: `assets/Shape UI/oval${ovalNumber}.webp`,
            objectImage: `assets/Shape UI/oval${ovalNumber}object.webp`,
            side: 'left',
        },
        {
            number: ovalNumber,
            image: `assets/Shape UI/oval${ovalNumber}.webp`,
            objectImage: `assets/Shape UI/oval${ovalNumber}object.webp`,
            side: 'right',
        },
    ]));
    const ovalObjectImageByNumber = new Map(
        ovalPairPieces.map((piece) => [String(piece.number), piece.objectImage]),
    );
    const ovalChallengePieces = [
        { number: 'bomb-1', challengeType: 'bomb' },
        { number: 'bomb-2', challengeType: 'bomb' },
        { number: 'bomb-3', challengeType: 'bomb' },
        { number: 'freeze-1', challengeType: 'freeze' },
        { number: 'freeze-2', challengeType: 'freeze' },
    ].map((piece) => ({
        ...piece,
        image: '',
        objectImage: '',
        side: 'center',
        challenge: true,
    }));
    const ovalHalfPieces = [...ovalPairPieces, ...ovalChallengePieces];
    for (let index = ovalHalfPieces.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [ovalHalfPieces[index], ovalHalfPieces[swapIndex]] = [ovalHalfPieces[swapIndex], ovalHalfPieces[index]];
    }
    let ovalOpenCards = [];
    let ovalMatchResolving = false;
    let ovalRewardHideTimer = null;
    let ovalMatchCheeringAudio = null;
    let ovalWrongPairAudio = null;
    let ovalMissionSession = 0;
    let ovalMissionTimers = [];
    let ovalMissionAudio = null;
    let ovalGameStarted = false;
    let ovalMatchedObjects = [];
    let ovalCelebrationCompletedAudio = null;
    let ovalCelebrationCheeringAudio = null;
    let ovalCelebrationSoundTimers = [];
    let ovalGameTimer = null;
    let ovalTimeRemaining = 45;
    let ovalTimerPausedForMatch = false;
    let ovalTrapSession = 0;
    let ovalTrapTimers = [];
    let ovalIncorrectMatches = 0;
    let ovalPairHintTimer = null;
    let ovalTickingAudio = null;
    let ovalTimesUpAudio = null;
    let ovalGameOverLoseAudio = null;
    let ovalGameOverSession = 0;
    let ovalGameOverTimers = [];
    let ovalGameOverActive = false;
    const ovalMissionAudioSource = 'assets/Audios/Voice over/oval mission.mp3';
    const ovalReadyAudioSource = 'assets/Audios/Voice over/Handa ka na ba.mp3';

    const clearOvalMissionTimers = () => {
        ovalMissionTimers.forEach((timerId) => window.clearTimeout(timerId));
        ovalMissionTimers = [];
    };

    const updateOvalGameHud = () => {
        if (ovalMatchProgressValue) ovalMatchProgressValue.textContent = `${ovalMatchedObjects.length}/5`;
        if (ovalMatchTimerValue) ovalMatchTimerValue.textContent = `${ovalTimeRemaining}s`;
        ovalMatchTimerPanel?.classList.toggle('is-time-up', ovalTimeRemaining <= 0);
    };

    const stopOvalGameTimer = () => {
        if (ovalGameTimer === null) return;
        window.clearInterval(ovalGameTimer);
        ovalGameTimer = null;
    };

    const stopOvalTickingAudio = () => {
        if (!ovalTickingAudio) return;
        ovalTickingAudio.pause();
        ovalTickingAudio.onended = null;
        ovalTickingAudio = null;
    };

    const startOvalTickingAudio = () => {
        if (ovalTickingAudio || !window.Audio || (window.__learnscapeSoundScale?.() ?? 1) <= 0) return;
        const audio = new window.Audio('assets/Audios/Sound effects/clock ticking.mp3');
        ovalTickingAudio = audio;
        audio.preload = 'auto';
        audio.playsInline = true;
        audio.loop = true;
        audio.volume = Math.min(1, window.__learnscapeSoundScale?.() ?? 1);
        audio.play().catch(() => {
            if (ovalTickingAudio === audio) ovalTickingAudio = null;
        });
    };

    const syncOvalTickingAudio = () => {
        if (ovalGameStarted && !ovalGameOverActive && ovalTimeRemaining > 0 && ovalTimeRemaining <= 10) {
            startOvalTickingAudio();
        } else {
            stopOvalTickingAudio();
        }
    };

    const clearOvalGameOverFlow = () => {
        ovalGameOverSession += 1;
        ovalGameOverTimers.forEach((timerId) => window.clearTimeout(timerId));
        ovalGameOverTimers = [];
        stopOvalTickingAudio();
        [ovalTimesUpAudio, ovalGameOverLoseAudio].forEach((audio) => {
            if (!audio) return;
            audio.onended = null;
            audio.pause();
        });
        ovalTimesUpAudio = null;
        ovalGameOverLoseAudio = null;
        ovalGameOverActive = false;
        if (ovalTimeoutFlow) ovalTimeoutFlow.hidden = true;
        if (ovalTimesUpStage) ovalTimesUpStage.hidden = false;
        if (ovalGameOverPanel) {
            ovalGameOverPanel.hidden = true;
            ovalGameOverPanel.classList.remove('is-visible');
        }
    };

    const beginOvalGameOverFlow = () => {
        if (ovalGameOverActive || !ovalTimeoutFlow || !ovalTimesUpStage || !ovalGameOverPanel) return;
        clearOvalGameOverFlow();
        ovalGameOverActive = true;
        const session = ovalGameOverSession;
        ovalGameStarted = false;
        stopOvalGameTimer();
        stopOvalTickingAudio();
        clearOvalPairHint();
        clearOvalTrapEffects();
        ovalOpenCards = [];
        ovalBoardCards.forEach((card) => { card.disabled = true; });
        ovalTimeoutFlow.hidden = false;
        ovalTimesUpStage.hidden = false;
        ovalGameOverPanel.hidden = true;
        ovalGameOverPanel.classList.remove('is-visible');

        let panelShown = false;
        const showGameOverPanel = () => {
            if (panelShown || session !== ovalGameOverSession || !ovalGameOverActive) return;
            panelShown = true;
            ovalTimesUpStage.hidden = true;
            ovalGameOverPanel.hidden = false;
            void ovalGameOverPanel.offsetWidth;
            ovalGameOverPanel.classList.add('is-visible');
            if (window.Audio) {
                const loseAudio = new window.Audio('assets/Audios/Sound effects/lose.mp3');
                ovalGameOverLoseAudio = loseAudio;
                loseAudio.preload = 'auto';
                loseAudio.playsInline = true;
                loseAudio.volume = Math.min(1, window.__learnscapeSoundScale?.() ?? 1);
                loseAudio.play().catch(() => {});
            }
        };

        ovalGameOverTimers.push(window.setTimeout(showGameOverPanel, 2600));
        if (!window.Audio) return;
        const timesUpAudio = new window.Audio('assets/Audios/Sound effects/times up.mp3');
        ovalTimesUpAudio = timesUpAudio;
        timesUpAudio.preload = 'auto';
        timesUpAudio.playsInline = true;
        timesUpAudio.volume = Math.min(1, window.__learnscapeSoundScale?.() ?? 1);
        timesUpAudio.onended = showGameOverPanel;
        timesUpAudio.play().catch(() => {});
    };

    const runOvalGameTimer = () => {
        if (ovalGameTimer !== null) return;
        ovalGameTimer = window.setInterval(() => {
            ovalTimeRemaining = Math.max(0, ovalTimeRemaining - 1);
            updateOvalGameHud();
            syncOvalTickingAudio();
            if (ovalTimeRemaining <= 0) beginOvalGameOverFlow();
        }, 1000);
    };

    const startOvalGameTimer = () => {
        stopOvalGameTimer();
        ovalTimerPausedForMatch = false;
        ovalTimeRemaining = 45;
        updateOvalGameHud();
        runOvalGameTimer();
    };

    const addOvalTimeBonus = (seconds) => {
        ovalTimeRemaining += seconds;
        updateOvalGameHud();
        syncOvalTickingAudio();
        ovalMatchTimerPanel?.classList.remove('is-bonus');
        void ovalMatchTimerPanel?.offsetWidth;
        ovalMatchTimerPanel?.classList.add('is-bonus');
        ovalTrapTimers.push(window.setTimeout(() => ovalMatchTimerPanel?.classList.remove('is-bonus'), 680));
        if (ovalGameStarted && !ovalTimerPausedForMatch) runOvalGameTimer();
    };

    const clearOvalPairHint = () => {
        if (ovalPairHintTimer !== null) {
            window.clearTimeout(ovalPairHintTimer);
            ovalPairHintTimer = null;
        }
        ovalBoardCards.forEach((card) => card.classList.remove('is-pair-hinting'));
    };

    const stopOvalMatchCheering = () => {
        if (!ovalMatchCheeringAudio) return;
        ovalMatchCheeringAudio.onended = null;
        ovalMatchCheeringAudio.onerror = null;
        ovalMatchCheeringAudio.pause();
        try {
            ovalMatchCheeringAudio.currentTime = 0;
        } catch (error) {
            // Pausing is enough if the clip has not loaded yet.
        }
        ovalMatchCheeringAudio = null;
    };

    const playOvalMatchCheering = () => {
        stopOvalMatchCheering();
        if (!window.Audio || (window.__learnscapeSoundScale?.() ?? 1) <= 0) return;
        const audio = new window.Audio('assets/Audios/Sound effects/kids cheering.mp3');
        ovalMatchCheeringAudio = audio;
        audio.preload = 'auto';
        audio.playsInline = true;
        audio.volume = Math.min(1, window.__learnscapeSoundScale?.() ?? 1);
        audio.onended = () => {
            if (ovalMatchCheeringAudio === audio) ovalMatchCheeringAudio = null;
        };
        audio.onerror = () => {
            if (ovalMatchCheeringAudio === audio) ovalMatchCheeringAudio = null;
        };
        audio.play().catch(() => {
            if (ovalMatchCheeringAudio === audio) ovalMatchCheeringAudio = null;
        });
    };

    const stopOvalWrongPairAudio = () => {
        if (!ovalWrongPairAudio) return;
        ovalWrongPairAudio.onended = null;
        ovalWrongPairAudio.onerror = null;
        ovalWrongPairAudio.pause();
        try {
            ovalWrongPairAudio.currentTime = 0;
        } catch (error) {
            // Pausing is enough if the clip has not loaded yet.
        }
        ovalWrongPairAudio = null;
    };

    const playOvalWrongPairBuzzer = () => {
        stopOvalWrongPairAudio();
        if (!window.Audio || (window.__learnscapeSoundScale?.() ?? 1) <= 0) return;
        const audio = new window.Audio('assets/Audios/Sound effects/buzzer.mp3');
        ovalWrongPairAudio = audio;
        audio.preload = 'auto';
        audio.playsInline = true;
        audio.volume = Math.min(1, window.__learnscapeSoundScale?.() ?? 1);
        audio.onended = () => {
            if (ovalWrongPairAudio === audio) ovalWrongPairAudio = null;
        };
        audio.onerror = () => {
            if (ovalWrongPairAudio === audio) ovalWrongPairAudio = null;
        };
        audio.play().catch(() => {
            if (ovalWrongPairAudio === audio) ovalWrongPairAudio = null;
        });
    };

    const showOvalPairHint = () => {
        clearOvalPairHint();
        const availableCards = ovalBoardCards.filter((card) => (
            card.dataset.ovalChallenge !== 'true'
            && !card.classList.contains('is-matched')
            && !card.classList.contains('is-clearing')
            && !card.classList.contains('is-flipped')
            && !card.classList.contains('is-frozen')
        ));
        const pairs = new Map();
        availableCards.forEach((card) => {
            const number = card.dataset.ovalNumber;
            if (!pairs.has(number)) pairs.set(number, []);
            pairs.get(number).push(card);
        });
        const validPairs = [...pairs.values()].filter((cards) => cards.length >= 2);
        if (!validPairs.length) return;
        const hintedPair = validPairs[Math.floor(Math.random() * validPairs.length)].slice(0, 2);
        hintedPair.forEach((card) => card.classList.add('is-pair-hinting'));
        ovalPairHintTimer = window.setTimeout(() => {
            hintedPair.forEach((card) => card.classList.remove('is-pair-hinting'));
            ovalPairHintTimer = null;
        }, 2000);
    };

    const clearOvalTrapEffects = () => {
        ovalTrapSession += 1;
        ovalTrapTimers.forEach((timerId) => window.clearTimeout(timerId));
        ovalTrapTimers = [];
        ovalBoardCards.forEach((card) => {
            card.classList.remove('is-bomb-triggered', 'is-frozen');
        });
        ovalMatchTimerPanel?.classList.remove('is-bonus');
    };

    const triggerOvalBomb = (card) => {
        card.disabled = true;
        card.classList.add('is-flipped', 'is-bomb-triggered');
        card.setAttribute('aria-pressed', 'true');
        ovalTimeRemaining = Math.max(0, ovalTimeRemaining - 5);
        updateOvalGameHud();
        syncOvalTickingAudio();
        if (ovalTimeRemaining <= 0) beginOvalGameOverFlow();
        playUiClickSound('alert');
        const session = ovalTrapSession;
        ovalTrapTimers.push(window.setTimeout(() => {
            if (session !== ovalTrapSession) return;
            card.classList.remove('is-flipped', 'is-bomb-triggered');
            card.setAttribute('aria-pressed', 'false');
            if (ovalGameStarted && !card.classList.contains('is-matched')) card.disabled = false;
        }, 950));
    };

    const triggerOvalFreeze = (card) => {
        const candidates = ovalBoardCards
            .filter((candidate) => (
                candidate !== card
                && candidate.dataset.ovalChallenge !== 'true'
                && !candidate.classList.contains('is-matched')
                && !candidate.classList.contains('is-clearing')
                && !candidate.classList.contains('is-flipped')
                && !candidate.classList.contains('is-frozen')
            ))
            .sort(() => Math.random() - 0.5)
            .slice(0, 2);
        const frozenCards = [card, ...candidates];
        frozenCards.forEach((frozenCard) => {
            frozenCard.disabled = true;
            frozenCard.classList.add('is-frozen');
        });
        card.classList.add('is-flipped');
        card.setAttribute('aria-pressed', 'true');
        playUiClickSound('spark');
        const session = ovalTrapSession;
        ovalTrapTimers.push(window.setTimeout(() => {
            if (session !== ovalTrapSession) return;
            frozenCards.forEach((frozenCard) => {
                frozenCard.classList.remove('is-frozen');
                if (frozenCard === card) {
                    frozenCard.classList.remove('is-flipped');
                    frozenCard.setAttribute('aria-pressed', 'false');
                }
                if (ovalGameStarted && !frozenCard.classList.contains('is-matched')) frozenCard.disabled = false;
            });
        }, 5000));
    };

    const hideOvalFinalProgress = () => {
        ovalBoardGamePage?.classList.remove('is-oval-final-progress-visible');
        ovalFinalProgress?.setAttribute('aria-hidden', 'true');
    };

    const showOvalFinalProgress = () => {
        if (!ovalBoardGamePage || ovalBoardGamePage.hidden || !ovalBoardGamePage.classList.contains('is-celebrating')) return;
        if (ovalBoardGamePage.classList.contains('is-oval-final-progress-visible')) return;
        ovalBoardGamePage.classList.add('is-oval-final-progress-visible');
        ovalFinalProgress?.setAttribute('aria-hidden', 'false');
        playUiClickSound('boardSuccess');
        ovalCelebrationSoundTimers.push(window.setTimeout(() => {
            if (ovalBoardGamePage.classList.contains('is-oval-final-progress-visible')) playUiClickSound('starPop');
        }, 650));
    };

    const stopOvalCelebrationSounds = () => {
        ovalCelebrationSoundTimers.forEach((timerId) => window.clearTimeout(timerId));
        ovalCelebrationSoundTimers = [];
        [ovalCelebrationCompletedAudio, ovalCelebrationCheeringAudio].forEach((audio) => {
            if (!audio) return;
            audio.onended = null;
            audio.pause();
            try {
                audio.currentTime = 0;
            } catch (error) {
                // The clip may not have loaded enough to rewind yet.
            }
        });
        ovalCelebrationCompletedAudio = null;
        ovalCelebrationCheeringAudio = null;
    };

    const startOvalCelebrationSounds = () => {
        stopOvalCelebrationSounds();
        ovalMatchedObjects.forEach((piece, index) => {
            ovalCelebrationSoundTimers.push(window.setTimeout(() => {
                playUiClickSound(index === ovalMatchedObjects.length - 1 ? 'progressCelebration' : 'tap');
            }, index * 220));
        });

        ovalCelebrationSoundTimers.push(window.setTimeout(() => {
            const AudioCtor = window.Audio;
            if (!AudioCtor) {
                ovalCelebrationSoundTimers.push(window.setTimeout(showOvalFinalProgress, 4000));
                return;
            }
            const soundScale = Math.min(1, window.__learnscapeSoundScale?.() ?? 1);
            const completedAudio = new AudioCtor('assets/Audios/Sound effects/completed.mp3');
            const cheeringAudio = new AudioCtor('assets/Audios/Sound effects/kids cheering.mp3');
            ovalCelebrationCompletedAudio = completedAudio;
            ovalCelebrationCheeringAudio = cheeringAudio;
            [completedAudio, cheeringAudio].forEach((audio) => {
                audio.preload = 'auto';
                audio.playsInline = true;
                audio.volume = soundScale;
            });
            const startCheering = () => {
                if (ovalCelebrationCheeringAudio !== cheeringAudio) return;
                cheeringAudio.currentTime = 0;
                cheeringAudio.play().catch(showOvalFinalProgress);
            };
            completedAudio.onended = () => {
                if (ovalCelebrationCompletedAudio === completedAudio) ovalCelebrationCompletedAudio = null;
                startCheering();
            };
            cheeringAudio.onended = () => {
                if (ovalCelebrationCheeringAudio === cheeringAudio) ovalCelebrationCheeringAudio = null;
                showOvalFinalProgress();
            };
            completedAudio.currentTime = 0;
            completedAudio.play().catch(startCheering);
            ovalCelebrationSoundTimers.push(window.setTimeout(showOvalFinalProgress, 10000));
        }, 1250));
    };

    const stopOvalMissionAudio = () => {
        if (!ovalMissionAudio) return;
        ovalMissionAudio.pause();
        try {
            ovalMissionAudio.currentTime = 0;
        } catch (error) {
            // The clip may not have loaded enough to rewind yet.
        }
        ovalMissionAudio = null;
    };

    const playOvalMissionAudio = (source, session, fallbackDuration, onComplete) => {
        stopOvalMissionAudio();
        const AudioCtor = window.Audio;
        let finished = false;
        let fallbackTimer = null;
        const finish = () => {
            if (finished || session !== ovalMissionSession) return;
            finished = true;
            if (fallbackTimer !== null) window.clearTimeout(fallbackTimer);
            if (ovalMissionAudio) {
                ovalMissionAudio.onended = null;
                ovalMissionAudio.onerror = null;
                ovalMissionAudio = null;
            }
            onComplete?.();
        };

        fallbackTimer = window.setTimeout(finish, fallbackDuration);
        ovalMissionTimers.push(fallbackTimer);
        if (!AudioCtor) return;

        const audio = new AudioCtor(source);
        ovalMissionAudio = audio;
        audio.preload = 'auto';
        audio.playsInline = true;
        audio.volume = Math.min(1, window.__learnscapeSoundScale?.() ?? 1);
        audio.onended = finish;
        audio.onerror = () => {};
        audio.load?.();
        audio.play().catch(() => {});
    };

    const stopOvalMissionIntro = () => {
        ovalMissionSession += 1;
        clearOvalMissionTimers();
        stopOvalMissionAudio();
        stopOvalCelebrationSounds();
        stopOvalMatchCheering();
        stopOvalWrongPairAudio();
        stopOvalGameTimer();
        clearOvalTrapEffects();
        clearOvalPairHint();
        clearOvalGameOverFlow();
        ovalBoardStage?.classList.remove('is-opening-preview');
        ovalMissionGuide?.classList.remove('is-visible');
        ovalMissionMessagePanel?.classList.remove('is-cycling');
        if (ovalMissionGuide) ovalMissionGuide.hidden = true;
        if (ovalMissionStartButton) {
            ovalMissionStartButton.hidden = true;
            ovalMissionStartButton.classList.remove('is-visible');
        }
        ovalBoardGamePage?.classList.remove('is-mission-intro');
    };

    const startOvalMissionIntro = () => {
        if (!ovalBoardGamePage || ovalBoardGamePage.hidden || !ovalMissionGuide || !ovalMissionMessageText) return;
        stopOvalMissionIntro();
        const session = ovalMissionSession;
        resetOvalBoardGame();
        ovalGameStarted = false;
        ovalBoardGamePage.classList.add('is-mission-intro');
        ovalBoardStage?.setAttribute('aria-hidden', 'true');
        ovalBoardCards.forEach((card) => {
            if (!card.classList.contains('is-matched')) card.disabled = true;
        });
        ovalMissionMessageText.textContent = 'Para sa ating Oval Mission, hanapin ang magkaparehas na bagay upang mabuo ito.';
        ovalMissionGuide.hidden = false;
        ovalMissionGuide.setAttribute('aria-hidden', 'false');
        ovalMissionGuide.getBoundingClientRect();
        ovalMissionGuide.classList.add('is-visible');

        const revealStartButton = () => {
            if (session !== ovalMissionSession || ovalBoardGamePage.hidden) return;
            ovalMissionGuide.classList.remove('is-visible');
            ovalMissionTimers.push(window.setTimeout(() => {
                if (session !== ovalMissionSession || ovalBoardGamePage.hidden || !ovalMissionStartButton) return;
                ovalMissionStartButton.hidden = false;
                ovalMissionStartButton.getBoundingClientRect();
                ovalMissionStartButton.classList.add('is-visible');
            }, 460));
        };

        const playReadyMessage = () => {
            if (session !== ovalMissionSession || ovalBoardGamePage.hidden) return;
            ovalMissionMessagePanel?.classList.add('is-cycling');
            ovalMissionTimers.push(window.setTimeout(() => {
                if (session !== ovalMissionSession || ovalBoardGamePage.hidden) return;
                ovalMissionMessageText.textContent = 'Handa ka na ba?';
                ovalMissionMessagePanel?.classList.remove('is-cycling');
                playOvalMissionAudio(ovalReadyAudioSource, session, 3200, revealStartButton);
            }, 280));
        };

        playOvalMissionAudio(ovalMissionAudioSource, session, 7000, playReadyMessage);
    };

    const applyOvalHalfPiece = (card, halfPiece) => {
        card.style.setProperty('--oval-piece-image', `url("${halfPiece.image}")`);
        card.style.setProperty('--oval-piece-position', `${halfPiece.side} center`);
        card.dataset.ovalPiece = `${halfPiece.image}-${halfPiece.side}`;
        card.dataset.ovalImage = halfPiece.image;
        card.dataset.ovalSide = halfPiece.side;
        card.dataset.ovalNumber = String(halfPiece.number);
        card.dataset.ovalObjectImage = halfPiece.objectImage;
        card.dataset.ovalChallenge = halfPiece.challenge ? 'true' : 'false';
        card.dataset.ovalChallengeType = halfPiece.challengeType || '';
        card.classList.toggle('is-challenge-card', Boolean(halfPiece.challenge));
        card.classList.toggle('is-bomb-card', halfPiece.challengeType === 'bomb');
        card.classList.toggle('is-freeze-card', halfPiece.challengeType === 'freeze');
    };

    const resetOvalBoardGame = () => {
        ovalMatchedObjects = [];
        ovalOpenCards = [];
        ovalMatchResolving = false;
        ovalTimerPausedForMatch = false;
        ovalIncorrectMatches = 0;
        ovalBoardStage?.classList.remove('is-opening-preview');
        ovalBoardGamePage?.classList.remove('is-celebrating');
        hideOvalFinalProgress();
        stopOvalCelebrationSounds();
        stopOvalGameTimer();
        clearOvalTrapEffects();
        clearOvalGameOverFlow();
        ovalTimeRemaining = 45;
        updateOvalGameHud();
        if (ovalRewardHideTimer !== null) {
            window.clearTimeout(ovalRewardHideTimer);
            ovalRewardHideTimer = null;
        }
        if (ovalMatchReward) {
            ovalMatchReward.hidden = true;
            ovalMatchReward.classList.remove('is-visible');
        }
        if (ovalGameCelebration) {
            ovalGameCelebration.hidden = true;
            ovalGameCelebration.classList.remove('is-active');
        }

        const resetPieces = [...ovalHalfPieces];
        for (let index = resetPieces.length - 1; index > 0; index -= 1) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            [resetPieces[index], resetPieces[swapIndex]] = [resetPieces[swapIndex], resetPieces[index]];
        }
        ovalBoardCards.forEach((card, index) => {
            card.classList.remove('is-flipped', 'is-match-burst', 'is-pair-correct', 'is-pair-incorrect', 'is-clearing', 'is-matched', 'is-bomb-triggered', 'is-frozen', 'is-pair-hinting');
            card.disabled = false;
            card.setAttribute('aria-pressed', 'false');
            applyOvalHalfPiece(card, resetPieces[index]);
        });
    };

    const randomizeRemainingOvalObjects = () => {
        const remainingCards = ovalBoardCards.filter((card) => !card.classList.contains('is-matched'));
        if (remainingCards.length <= 2) return;

        const originalChallengeTypes = remainingCards.map((card) => card.dataset.ovalChallengeType || '');
        const remainingPieces = remainingCards.map((card) => ({
            number: card.dataset.ovalNumber,
            image: card.dataset.ovalImage,
            objectImage: card.dataset.ovalObjectImage,
            side: card.dataset.ovalSide,
            challenge: card.dataset.ovalChallenge === 'true',
            challengeType: card.dataset.ovalChallengeType,
        }));

        let shuffledPieces = [...remainingPieces];
        for (let attempt = 0; attempt < 120; attempt += 1) {
            shuffledPieces = [...remainingPieces];
            for (let index = shuffledPieces.length - 1; index > 0; index -= 1) {
                const swapIndex = Math.floor(Math.random() * (index + 1));
                [shuffledPieces[index], shuffledPieces[swapIndex]] = [shuffledPieces[swapIndex], shuffledPieces[index]];
            }
            const trapsMovedToDifferentSlots = shuffledPieces.every((piece, index) => (
                !piece.challengeType || piece.challengeType !== originalChallengeTypes[index]
            ));
            if (trapsMovedToDifferentSlots) break;
        }

        remainingCards.forEach((card, index) => applyOvalHalfPiece(card, shuffledPieces[index]));
        ovalBoardStage?.classList.remove('is-reshuffling');
        void ovalBoardStage?.offsetWidth;
        ovalBoardStage?.classList.add('is-reshuffling');
        window.setTimeout(() => ovalBoardStage?.classList.remove('is-reshuffling'), 520);
    };

    const previewRemainingOvalCards = (duration, onComplete) => {
        const previewCards = ovalBoardCards.filter((card) => !card.classList.contains('is-matched'));
        if (duration <= 0 || previewCards.length === 0) {
            onComplete?.();
            return;
        }

        ovalBoardStage?.classList.add('is-opening-preview');
        previewCards.forEach((card) => {
            card.disabled = true;
            card.classList.add('is-flipped');
            card.setAttribute('aria-pressed', 'true');
        });
        ovalMissionTimers.push(window.setTimeout(() => {
            ovalBoardStage?.classList.remove('is-opening-preview');
            void ovalBoardStage?.offsetWidth;
            previewCards.forEach((card) => {
                card.classList.remove('is-flipped');
                card.setAttribute('aria-pressed', 'false');
            });
            ovalMissionTimers.push(window.setTimeout(() => onComplete?.(), 520));
        }, duration));
    };

    const showOvalGameCelebration = () => {
        if (!ovalGameCelebration || !ovalCompletedObjects || ovalMatchedObjects.length !== 5) return;
        ovalGameStarted = false;
        stopOvalGameTimer();
        stopOvalTickingAudio();
        ovalBoardGamePage?.classList.add('is-celebrating');
        ovalCompletedObjects.replaceChildren();
        ovalMatchedObjects.forEach((piece, index) => {
            const object = document.createElement('img');
            object.className = 'oval-completed-object';
            object.src = piece.objectImage;
            object.alt = `Matched object ${index + 1}`;
            object.style.setProperty('--object-delay', `${index * 0.22}s`);
            ovalCompletedObjects.appendChild(object);
        });

        if (ovalCelebrationConfetti && ovalCelebrationConfetti.childElementCount === 0) {
            const colors = ['#ffd84a', '#ff766b', '#63d6c6', '#65a9ff', '#f58bc0', '#fff4a8'];
            for (let index = 0; index < 46; index += 1) {
                const confetti = document.createElement('span');
                confetti.style.setProperty('--confetti-x', `${2 + Math.random() * 96}%`);
                confetti.style.setProperty('--confetti-size', `${0.48 + Math.random() * 0.8}rem`);
                confetti.style.setProperty('--confetti-color', colors[index % colors.length]);
                confetti.style.setProperty('--confetti-delay', `${1.05 + Math.random() * 1.3}s`);
                confetti.style.setProperty('--confetti-duration', `${2.8 + Math.random() * 1.8}s`);
                confetti.style.setProperty('--confetti-drift', `${-8 + Math.random() * 16}vw`);
                ovalCelebrationConfetti.appendChild(confetti);
            }
        }

        ovalGameCelebration.hidden = false;
        ovalGameCelebration.classList.remove('is-active');
        void ovalGameCelebration.offsetWidth;
        ovalGameCelebration.classList.add('is-active');
        startOvalCelebrationSounds();
    };

    const showOvalMatchReward = (piece) => {
        if (!ovalMatchReward || !ovalMatchObject || !piece) return;
        if (ovalRewardHideTimer !== null) {
            window.clearTimeout(ovalRewardHideTimer);
            ovalRewardHideTimer = null;
        }
        ovalMatchObject.src = piece.objectImage;
        ovalMatchObject.alt = `Oval ${piece.number} matched object`;
        if (ovalMatchConfetti && ovalMatchConfetti.childElementCount === 0) {
            const colors = ['#ffe04f', '#ff6f7f', '#61d8f2', '#69d65f', '#b77bff', '#ff9d42'];
            for (let index = 0; index < 68; index += 1) {
                const confetti = document.createElement('span');
                confetti.style.setProperty('--match-confetti-x', `${2 + Math.random() * 96}%`);
                confetti.style.setProperty('--match-confetti-size', `${0.42 + Math.random() * 0.7}rem`);
                confetti.style.setProperty('--match-confetti-color', colors[index % colors.length]);
                confetti.style.setProperty('--match-confetti-delay', `${Math.random() * 0.55}s`);
                confetti.style.setProperty('--match-confetti-duration', `${2 + Math.random() * 1.15}s`);
                confetti.style.setProperty('--match-confetti-drift', `${-9 + Math.random() * 18}vw`);
                ovalMatchConfetti.appendChild(confetti);
            }
        }
        ovalMatchReward.hidden = false;
        ovalMatchReward.classList.remove('is-visible');
        void ovalMatchReward.offsetWidth;
        ovalMatchReward.classList.add('is-visible');
        playOvalMatchCheering();
        ovalRewardHideTimer = window.setTimeout(() => {
            ovalMatchReward.classList.remove('is-visible');
            ovalMatchReward.hidden = true;
            stopOvalMatchCheering();
            ovalRewardHideTimer = null;
        }, 4250);
    };

    ovalBoardCards.forEach((card, index) => {
        const halfPiece = ovalHalfPieces[index];
        if (halfPiece) {
            applyOvalHalfPiece(card, halfPiece);
        }
        card.addEventListener('click', () => {
            if (
                !ovalGameStarted
                || ovalMatchResolving
                || card.classList.contains('is-flipped')
                || card.classList.contains('is-matched')
                || card.classList.contains('is-clearing')
                || card.classList.contains('is-frozen')
            ) return;

            if (card.dataset.ovalChallengeType === 'bomb') {
                triggerOvalBomb(card);
                return;
            }

            if (card.dataset.ovalChallengeType === 'freeze') {
                triggerOvalFreeze(card);
                return;
            }

            if (card.classList.contains('is-pair-hinting')) clearOvalPairHint();

            card.classList.add('is-flipped');
            card.setAttribute('aria-pressed', 'true');
            ovalOpenCards.push(card);

            if (ovalOpenCards.length < 2) return;

            const [firstCard, secondCard] = ovalOpenCards;
            const isMatch = firstCard.dataset.ovalNumber === secondCard.dataset.ovalNumber;
            ovalOpenCards = [];
            ovalMatchResolving = true;

            if (isMatch) {
                const matchedNumber = firstCard.dataset.ovalNumber;
                const piece = {
                    number: matchedNumber,
                    objectImage: ovalObjectImageByNumber.get(matchedNumber),
                };
                if (!piece.objectImage) {
                    ovalMatchResolving = false;
                    return;
                }
                ovalTimerPausedForMatch = true;
                stopOvalGameTimer();
                stopOvalTickingAudio();
                ovalMatchedObjects.push(piece);
                addOvalTimeBonus(5);
                updateOvalGameHud();
                firstCard.classList.add('is-match-burst', 'is-pair-correct');
                secondCard.classList.add('is-match-burst', 'is-pair-correct');
                showOvalMatchReward(piece);
                playUiClickSound('boardSuccess');

                window.setTimeout(() => {
                    firstCard.classList.remove('is-match-burst', 'is-pair-correct');
                    secondCard.classList.remove('is-match-burst', 'is-pair-correct');
                }, 1400);

                window.setTimeout(() => {
                    firstCard.classList.add('is-clearing');
                    secondCard.classList.add('is-clearing');
                }, 4250);

                window.setTimeout(() => {
                    [firstCard, secondCard].forEach((matchedCard) => {
                        matchedCard.classList.remove('is-clearing', 'is-flipped');
                        matchedCard.classList.add('is-matched');
                        matchedCard.disabled = true;
                        matchedCard.setAttribute('aria-pressed', 'true');
                    });
                    if (ovalMatchedObjects.length === 5) {
                        window.setTimeout(showOvalGameCelebration, 260);
                    } else {
                        randomizeRemainingOvalObjects();
                        const previewDuration = {
                            1: 500,
                            2: 500,
                            3: 500,
                        }[ovalMatchedObjects.length] || 0;
                        ovalMissionTimers.push(window.setTimeout(() => {
                            previewRemainingOvalCards(previewDuration, () => {
                                ovalTimerPausedForMatch = false;
                                if (ovalGameStarted && !ovalGameOverActive && ovalTimeRemaining > 0) {
                                    runOvalGameTimer();
                                    syncOvalTickingAudio();
                                }
                                ovalMatchResolving = false;
                                ovalBoardCards.forEach((card) => {
                                    if (!card.classList.contains('is-matched')) card.disabled = false;
                                });
                            });
                        }, 520));
                    }
                    if (ovalMatchedObjects.length === 5) {
                        window.setTimeout(() => {
                            ovalTimerPausedForMatch = false;
                            ovalMatchResolving = false;
                        }, 520);
                    }
                }, 4850);
                return;
            }

            firstCard.classList.add('is-pair-incorrect');
            secondCard.classList.add('is-pair-incorrect');
            playOvalWrongPairBuzzer();
            window.setTimeout(() => {
                [firstCard, secondCard].forEach((openCard) => {
                    openCard.classList.remove('is-flipped', 'is-pair-incorrect');
                    openCard.setAttribute('aria-pressed', 'false');
                });
                ovalIncorrectMatches += 1;
                if (ovalIncorrectMatches >= 3) {
                    ovalIncorrectMatches = 0;
                    showOvalPairHint();
                }
                ovalMatchResolving = false;
            }, 1400);
        });
    });

    ovalMissionStartButton?.addEventListener('click', () => {
        playUiClickSound('start');
        clearOvalMissionTimers();
        stopOvalMissionAudio();
        ovalGameStarted = false;
        ovalMatchResolving = true;
        ovalMissionStartButton.classList.remove('is-visible');
        ovalMissionStartButton.hidden = true;
        ovalMissionGuide?.classList.remove('is-visible');
        ovalMissionGuide?.setAttribute('aria-hidden', 'true');
        ovalBoardGamePage?.classList.remove('is-mission-intro');
        ovalBoardStage?.setAttribute('aria-hidden', 'false');
        ovalMissionTimers.push(window.setTimeout(() => {
            if (ovalMissionGuide) ovalMissionGuide.hidden = true;
        }, 520));
        previewRemainingOvalCards(3000, () => {
            ovalGameStarted = true;
            ovalMatchResolving = false;
            ovalBoardCards.forEach((card) => {
                if (!card.classList.contains('is-matched')) card.disabled = false;
            });
            startOvalGameTimer();
        });
    });

    ovalGameOverRetryButton?.addEventListener('click', () => {
        playUiClickSound('start');
        clearOvalGameOverFlow();
        resetOvalBoardGame();
        ovalGameStarted = false;
        ovalBoardGamePage?.classList.add('is-mission-intro');
        ovalBoardStage?.setAttribute('aria-hidden', 'true');
        ovalBoardCards.forEach((card) => { card.disabled = true; });
        if (ovalMissionGuide) {
            ovalMissionGuide.hidden = false;
            ovalMissionGuide.setAttribute('aria-hidden', 'false');
            ovalMissionGuide.classList.remove('is-visible');
        }
        if (ovalMissionStartButton) {
            ovalMissionStartButton.hidden = false;
            ovalMissionStartButton.getBoundingClientRect();
            ovalMissionStartButton.classList.add('is-visible');
        }
    });

    ovalFinalReplayButton?.addEventListener('click', () => {
        playUiClickSound('start');
        stopOvalMissionIntro();
        resetOvalBoardGame();
        ovalGameStarted = false;
        ovalBoardGamePage?.classList.add('is-mission-intro');
        ovalBoardStage?.setAttribute('aria-hidden', 'true');
        ovalBoardCards.forEach((card) => { card.disabled = true; });
        if (ovalMissionGuide) {
            ovalMissionGuide.hidden = false;
            ovalMissionGuide.setAttribute('aria-hidden', 'false');
        }
        if (ovalMissionStartButton) {
            ovalMissionStartButton.hidden = false;
            ovalMissionStartButton.getBoundingClientRect();
            ovalMissionStartButton.classList.add('is-visible');
            ovalMissionStartButton.focus({ preventScroll: true });
        }
    });

    ovalFinalNextButton?.addEventListener('click', () => {
        playUiClickSound('start');
        hideOvalFinalProgress();
        openShapeCameraLayout('ovalCamera');
    });

    window.addEventListener('learnscape:routechange', (event) => {
        if (event.detail?.route === 'ovalBoardGame') {
            startOvalMissionIntro();
        } else {
            stopOvalMissionIntro();
        }
    });

    if (ovalBoardGamePage && !ovalBoardGamePage.hidden) {
        startOvalMissionIntro();
    }

    loadingLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            const target = link.getAttribute('data-route') || link.getAttribute('href');

            event.preventDefault();

            if (link === shapeSquareBackButton && shapeSquarePage?.classList.contains('is-illustration-background')) {
                transitionBackToShapeSquareArea();
                return;
            }

            if (target === 'square-illustration') {
                transitionToShapeSquareIllustration();
                return;
            }

            if (!target || target.startsWith('#') || isNavigating) return;

            isNavigating = true;

            const releaseNavigationLock = () => {
                window.setTimeout(() => {
                    isNavigating = false;
                }, 100);
            };

            const goNext = () => {
                const appNavigate = getAppNavigator();

                if (typeof appNavigate === 'function') {
                    appNavigate(target);
                    releaseNavigationLock();
                    return;
                }

                showLoadingScreen();

                window.setTimeout(() => {
                    navigateApp(target);
                    releaseNavigationLock();
                }, loadingDuration);
            };

            const shouldEnterFullscreen = link.classList.contains('btn-enter') && target === 'game3';

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

    const game3IslandCarousel = document.querySelector('.game3-island-carousel');
    const game3IslandPrevButton = document.querySelector('.game3-island-prev');
    const game3IslandNextButton = document.querySelector('.game3-island-next');

    if (game3IslandCarousel && game3IslandPrevButton && game3IslandNextButton) {
        const game3IslandCards = game3IslandCarousel.querySelectorAll('.game3-island-card');

        const updateGame3IslandButtons = () => {
            const currentIsland = Math.round(game3IslandCarousel.scrollLeft / game3IslandCarousel.clientWidth);
            game3IslandPrevButton.disabled = currentIsland <= 0;
            game3IslandNextButton.disabled = currentIsland >= game3IslandCards.length - 1;
            game3Page.dataset.game3Island = String(currentIsland + 1);
        };

        game3IslandPrevButton.addEventListener('click', () => {
            const currentIsland = Math.round(game3IslandCarousel.scrollLeft / game3IslandCarousel.clientWidth);
            const previousIsland = Math.max(currentIsland - 1, 0);

            game3IslandCarousel.scrollTo({
                left: previousIsland * game3IslandCarousel.clientWidth,
                behavior: 'smooth'
            });
        });

        game3IslandNextButton.addEventListener('click', () => {
            const currentIsland = Math.round(game3IslandCarousel.scrollLeft / game3IslandCarousel.clientWidth);
            const nextIsland = Math.min(currentIsland + 1, game3IslandCards.length - 1);

            game3IslandCarousel.scrollTo({
                left: nextIsland * game3IslandCarousel.clientWidth,
                behavior: 'smooth'
            });
        });

        game3IslandCarousel.addEventListener('scroll', updateGame3IslandButtons, { passive: true });
        window.addEventListener('resize', updateGame3IslandButtons);
        updateGame3IslandButtons();
    }

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
    document.addEventListener('fullscreenchange', () => {
        if (isFullscreenActive()) document.body.classList.remove('is-windowed-fallback');
        syncFullscreenClass();
    });
    document.addEventListener('webkitfullscreenchange', () => {
        if (isFullscreenActive()) document.body.classList.remove('is-windowed-fallback');
        syncFullscreenClass();
    });
    document.addEventListener('msfullscreenchange', () => {
        if (isFullscreenActive()) document.body.classList.remove('is-windowed-fallback');
        syncFullscreenClass();
    });

    // Service worker registration is disabled during development to avoid stale cached assets.
});
