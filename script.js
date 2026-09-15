// Smooth scrolling for anchor links is handled by CSS scroll-behavior: smooth.

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Learnscape Adventure loaded!');

    const appVersion = '20260915-289';
    const appVersionKey = 'learnscape-app-version';
    const freshParamKey = 'fresh';

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
    const fullscreenRestoreButton = document.querySelector('.fullscreen-restore-button');
    const shapeCirclePage = document.getElementById('learnscape-shape-circle-page');
    const shapeSquarePage = document.getElementById('learnscape-shape-square-page');
    const triangleGamePage = document.getElementById('learnscape-triangle-game-page');
    const shapePreviewPages = Array.from(document.querySelectorAll('.shape-area-preview-page'));
    const shapePreviewProgressByPage = new Map();
    const shapePreviewIntroStates = new Map();
    const shapePreviewSceneCleanupByPage = new Map();

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

        ['1star.webp', '2star.webp', '1star.webp'].forEach((source) => {
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
    const shapeCircleLearningGoal = shapeCirclePage?.querySelector('.shape-area-learning-goal') || null;
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
    let shapeChoiceAudioFrame = null;
    let shapeChoiceAudioSession = 0;
    let shapeQuestionAudio = null;
    let shapeQuestionAudioTimer = null;
    let pendingShapeChoiceName = null;
    let shapeMissionCompletionAudio = null;
    let shapeMissionCompletionFrame = null;
    let shapeMissionCompletionSession = 0;
    if (window.Audio) {
        shapeChoiceAudio = new window.Audio(shapeChoiceAudioSource);
        shapeChoiceAudio.preload = 'auto';
        shapeChoiceAudio.playsInline = true;
        shapeChoiceAudio.load();
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
    let squareObjectActiveDrag = null;
    const squareObjectSnapTimers = new Map();
    let squareObjectPanelExitTimer = null;
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
    let circleHuntTimesUpAudio = null;
    let circleHuntLoseAudio = null;
    let circleSortCollectedCount = 0;
    let circleSortActiveDrag = null;
    let circleSortResetTimers = [];
    let circleSortIgnoreClickUntil = 0;
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
        shapeCircleLearningGoal?.classList.add('is-start-ready');
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

        if (shapeCircleLearningGoal) {
            shapeCircleLearningGoal.classList.remove('is-start-ready');
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
            shapeCircleLearningGoal?.classList.remove('is-start-ready');

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
                    shapeCircleLearningGoal?.classList.add('is-start-ready');
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
            shapeSquareCelebrationText.textContent = 'YOU GOT THE CORRECT ANSWER!';
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
                message: 'YOU GOT THE CORRECT ANSWER!',
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
            playUiClickSound('chime');
            const completionTimer = window.setTimeout(() => {
                showShapeSquareAnswerCelebration();
                shapeSquareTimers = shapeSquareTimers.filter((timerId) => timerId !== completionTimer);
            }, 520);
            shapeSquareTimers.push(completionTimer);
            return;
        }

        tile.classList.remove('is-wrong');
        tile.getBoundingClientRect();
        tile.classList.add('is-wrong');
        playUiClickSound('thunk');
        const wrongTimer = window.setTimeout(() => {
            tile.classList.remove('is-wrong');
            shapeSquareTimers = shapeSquareTimers.filter((timerId) => timerId !== wrongTimer);
        }, 360);
        shapeSquareTimers.push(wrongTimer);
    };

    const resetSquareObjectPuzzle = () => {
        squareObjectActiveDrag = null;
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
        squareObjectTargets.forEach((target) => target.classList.remove('is-active'));
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
            shapeSquareCelebrationText.textContent = options.message || 'You fix them all!';
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
        }, 500);
        squareObjectSnapTimers.set(piece, collectTimer);
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

            if (squareObjectPieces.every((currentPiece) => currentPiece.dataset.squarePlaced === 'true')) {
                if (squareObjectPanel) {
                    squareObjectPanel.classList.add('is-complete');
                    squareObjectPanelExitTimer = window.setTimeout(() => {
                        squareObjectPanel.hidden = true;
                        squareObjectPanelExitTimer = null;
                    }, 560);
                }
                playUiClickSound('boardSuccess');
                showShapeSquarePuzzleCelebration();
            }
        }, 440);
        squareObjectSnapTimers.set(piece, snapTimer);
    };

    const isSquareObjectDropCorrect = (piece, clientX, clientY) => {
        const target = squareObjectTargets.find(
            (currentTarget) => currentTarget.dataset.squareTarget === piece?.dataset.squarePiece,
        );
        if (!target) return false;

        const rect = target.getBoundingClientRect();
        const toleranceX = Math.max(12, rect.width * 0.28);
        const toleranceY = Math.max(12, rect.height * 0.28);
        return clientX >= rect.left - toleranceX
            && clientX <= rect.right + toleranceX
            && clientY >= rect.top - toleranceY
            && clientY <= rect.bottom + toleranceY;
    };

    const beginSquareObjectDrag = (event) => {
        const piece = event.currentTarget;
        if (
            !piece
            || piece.dataset.squarePlaced === 'true'
            || piece.dataset.squareCollected !== 'true'
            || squareObjectActiveDrag
            || !shapeSquarePage?.classList.contains('is-lesson-complete')
            || (event.pointerType === 'mouse' && event.button !== 0)
        ) return;

        squareObjectActiveDrag = {
            piece,
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
        };
        piece.classList.remove('is-returning');
        piece.classList.add('is-dragging');
        piece.closest('.square-object-slot')?.classList.add('is-drag-source');
        piece.setPointerCapture?.(event.pointerId);
        squareObjectTargets.find(
            (target) => target.dataset.squareTarget === piece.dataset.squarePiece,
        )?.classList.add('is-active');
        event.preventDefault();
    };

    const moveSquareObjectDrag = (event) => {
        const drag = squareObjectActiveDrag;
        if (!drag || drag.pointerId !== event.pointerId || drag.piece !== event.currentTarget) return;

        drag.piece.style.setProperty('--square-drag-x', `${event.clientX - drag.startX}px`);
        drag.piece.style.setProperty('--square-drag-y', `${event.clientY - drag.startY}px`);
        event.preventDefault();
    };

    const endSquareObjectDrag = (event, wasCancelled = false) => {
        const drag = squareObjectActiveDrag;
        if (!drag || drag.pointerId !== event.pointerId) return;

        const piece = drag.piece;
        piece.releasePointerCapture?.(event.pointerId);
        squareObjectTargets.forEach((target) => target.classList.remove('is-active'));
        squareObjectActiveDrag = null;

        if (!wasCancelled && isSquareObjectDropCorrect(piece, event.clientX, event.clientY)) {
            placeSquareObjectPiece(piece);
            return;
        }

        piece.classList.remove('is-dragging');
        piece.classList.add('is-returning');
        piece.style.setProperty('--square-drag-x', '0px');
        piece.style.setProperty('--square-drag-y', '0px');
        playUiClickSound('thunk');
        window.setTimeout(() => {
            piece.classList.remove('is-returning');
            piece.closest('.square-object-slot')?.classList.remove('is-drag-source');
        }, 330);
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

    const resetShapeTvChoices = (page) => {
        page?.querySelectorAll('.shape-tv-choice').forEach((choice) => {
            choice.disabled = false;
            choice.classList.remove('is-correct', 'is-wrong');
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

    const resetShapePreviewPage = (page) => {
        if (!page) return;

        shapePreviewSceneCleanupByPage.get(page)?.();
        stopShapePreviewIntro(page);

        const background = page.querySelector('.shape-area-bg');
        const videoStage = page.querySelector('.shape-preview-video-stage');
        const video = page.querySelector('.shape-preview-video');
        const lessonImage = page.querySelector('.shape-preview-lesson-image');
        const mascot = page.querySelector('.shape-preview-mascot');
        const questionPanel = page.querySelector('.shape-preview-question-panel');
        const playButton = page.querySelector('.shape-preview-play-button');
        const skipButton = page.querySelector('.shape-preview-skip-button');
        const areaTitle = page.querySelector('.shape-area-preview-title');
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
        if (skipButton) skipButton.hidden = true;
        if (areaTitle?.classList.contains('is-bridge-repair-title')) {
            areaTitle.innerHTML = '<span>Area</span><strong>3</strong>';
            areaTitle.setAttribute('aria-label', 'Area 3');
            areaTitle.classList.remove('is-bridge-repair-title');
        }
        if (bridgeCharacterSequence) {
            bridgeCharacterSequence.hidden = true;
            bridgeCharacterSequence.classList.remove('is-walking');
        }
        if (bridgeWalkingCharacter) bridgeWalkingCharacter.hidden = false;
        if (bridgeArrivalCharacter) bridgeArrivalCharacter.hidden = true;
        if (jeepSequence) {
            jeepSequence.hidden = true;
            jeepSequence.classList.remove('is-driving', 'is-arrived');
        }
        if (drivingJeep) drivingJeep.hidden = false;
        if (arrivedJeep) arrivedJeep.hidden = true;
        videoStage?.setAttribute('aria-hidden', 'true');
        shapePreviewProgressByPage.get(page)?.setAttribute('aria-hidden', 'true');
        page.classList.remove('is-transitioning-to-illustration', 'is-illustration-background', 'is-tv-lesson-image-visible', 'is-progress-visible', 'is-next-background', 'is-fading-to-triangle-game');
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
        if (background && illustrationBackgroundSource && !videoSource && !lessonImage) {
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
        if (skipButton) skipButton.hidden = true;
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
                        bridgeDialogueAdvance = () => playStage(stageIndex + 1);
                        page.classList.add('is-bridge-dialog-ready');
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
            'Handa ka na ba sa isang masayang biyahe?',
            'Tara na! Sumakay na at simulan natin ang Bibi\u2019s Rectangle Delivery!',
        ];
        const rectangleDialogueSegments = [
            { start: 0, end: 1.4 },
            { start: 1.4, end: 7.3 },
            { start: 0, end: 2.5 },
            { start: 9.8, end: 14.8 },
        ];
        const rectangleMessagePauseMs = 420;
        let rectangleDialogueSession = 0;
        let rectangleDialogueAudio = null;
        let rectangleDialogueReplacementAudio = null;
        let rectangleDialogueFrame = null;
        let rectangleDialogueTimers = [];

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
            if (rectangleMessagePanel) rectangleMessagePanel.hidden = true;
            if (rectangleMessageText) rectangleMessageText.textContent = '';
            if (rectangleGoButton) rectangleGoButton.hidden = true;
        };

        const startRectangleDialogue = () => {
            if (!rectangleMessagePanel || !rectangleMessageText || !isPageVisible(page)) return;
            stopRectangleDialogue();
            const session = rectangleDialogueSession;
            rectangleMessagePanel.hidden = false;
            rectangleMessageText.textContent = '';

            const AudioCtor = window.Audio;
            if (AudioCtor) {
                rectangleDialogueAudio = new AudioCtor('assets/Audios/Voice over/rectanglemission.mp3');
                rectangleDialogueAudio.preload = 'auto';
                rectangleDialogueAudio.playsInline = true;
                rectangleDialogueAudio.load?.();
                rectangleDialogueReplacementAudio = new AudioCtor('assets/Audios/Voice over/Masayang biyahe.mp3');
                rectangleDialogueReplacementAudio.preload = 'auto';
                rectangleDialogueReplacementAudio.playsInline = true;
                rectangleDialogueReplacementAudio.load?.();
            }
            const playStage = (stageIndex) => {
                if (session !== rectangleDialogueSession || !isPageVisible(page) || !rectangleDialogueMessages[stageIndex]) return;
                const segment = rectangleDialogueSegments[stageIndex];
                const audio = stageIndex === 2 ? rectangleDialogueReplacementAudio : rectangleDialogueAudio;
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
                        if (rectangleGoButton) rectangleGoButton.hidden = false;
                        return;
                    }
                    rectangleDialogueTimers.push(window.setTimeout(() => playStage(stageIndex + 1), rectangleMessagePauseMs));
                };

                if (!audio) {
                    rectangleDialogueTimers.push(window.setTimeout(finishStage, (segment.end - segment.start) * 1000));
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
                        if (audio.currentTime >= segment.end || audio.ended) {
                            finishStage();
                            return;
                        }
                        rectangleDialogueFrame = window.requestAnimationFrame(stopAtSegmentEnd);
                    };
                    rectangleDialogueFrame = window.requestAnimationFrame(stopAtSegmentEnd);
                }).catch(() => {
                    if (session !== rectangleDialogueSession) return;
                    rectangleDialogueTimers.push(window.setTimeout(finishStage, (segment.end - segment.start) * 1000));
                });
            };

            rectangleDialogueTimers.push(window.setTimeout(() => playStage(0), rectangleMessagePauseMs));
        };

        shapePreviewSceneCleanupByPage.set(page, () => {
            stopBridgeDialogue();
            stopRectangleDialogue();
        });
        rectangleGoButton?.addEventListener('click', () => {
            if (!isPageVisible(page) || rectangleGoButton.hidden) return;
            window.location.hash = '#rectangle-delivery';
        });
        page.addEventListener('click', (event) => {
            if (event.target.closest('a, button') || typeof bridgeDialogueAdvance !== 'function') return;
            const advance = bridgeDialogueAdvance;
            bridgeDialogueAdvance = null;
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
            if (skipButton) skipButton.hidden = true;
        };

        const showLessonBackground = () => {
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

        playButton?.addEventListener('click', async () => {
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
        });

        skipButton?.addEventListener('click', () => {
            showLessonBackground();
            scheduleShapeQuestionAudio();
        });
        video?.addEventListener('ended', showLessonBackground);

        replayButton?.addEventListener('click', () => {
            page.classList.remove('is-progress-visible');
            progress?.setAttribute('aria-hidden', 'true');
            resetShapeTvChoices(page);
            showShapePreviewIllustration(page);
        });

        nextButton?.addEventListener('click', () => {
            const nextBackgroundSource = page.dataset.nextBackground;
            if (!nextBackgroundSource) {
                window.location.hash = '#game3';
                return;
            }

            const background = page.querySelector('.shape-area-bg');
            const areaTitle = page.querySelector('.shape-area-preview-title');
            const revealNextBackground = () => {
                if (!isPageVisible(page)) return;
                if (background) background.src = nextBackgroundSource;
                page.classList.remove('is-progress-visible', 'is-tv-lesson-image-visible', 'is-illustration-background');
                page.classList.add('is-next-background');
                progress?.setAttribute('aria-hidden', 'true');
                videoStage?.setAttribute('aria-hidden', 'true');
                if (areaTitle && page.dataset.nextTitle) {
                    areaTitle.textContent = page.dataset.nextTitle;
                    areaTitle.setAttribute('aria-label', page.dataset.nextTitle);
                    areaTitle.classList.add('is-bridge-repair-title');
                }
                if (jeepSequence) {
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
    const triangleWoodStorageCount = triangleWoodStorage?.querySelector('[data-triangle-wood-count]') || null;
    const triangleWoodDragGuide = triangleGamePage?.querySelector('.triangle-wood-drag-guide') || null;
    const triangleCraftingPanel = triangleGamePage?.querySelector('.triangle-crafting-panel') || null;
    const triangleCraftingShapes = triangleCraftingPanel?.querySelector('.triangle-crafting-shapes') || null;
    const triangleCraftingSlots = Array.from(triangleCraftingPanel?.querySelectorAll('[data-triangle-craft-slot]') || []);
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
    let triangleWoodDrag = null;
    let triangleWoodSnapInProgress = false;
    let triangleBridgeBuildSession = 0;
    let triangleBridgeBuildTimers = [];
    let triangleWoodGuideIdleTimer = null;
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
        startTriangleGameDialogue();
    });

    triangleGameCompleteNextButton?.addEventListener('click', () => {
        window.location.hash = '#game3';
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
        hideTriangleWoodDragGuide();
        triangleGamePage?.classList.remove('is-switching-completed-background', 'is-bridge-complete-scene', 'is-game-progress-visible');
        stopTriangleGameCompletionSequence();
        if (triangleGameBackground) triangleGameBackground.src = triangleGameBackgroundSource;
        triangleGameTreeGroup?.classList.remove('is-active', 'is-over-tree', 'is-exiting');
        triangleGamePage?.querySelectorAll('.triangle-wood-collectible').forEach((collectible) => collectible.remove());
        triangleWoodDrag?.ghost?.remove();
        triangleWoodDrag = null;
        triangleWoodSnapInProgress = false;
        if (triangleWoodStorageCount) triangleWoodStorageCount.textContent = '0';
        if (triangleWoodStorage) {
            triangleWoodStorage.hidden = true;
            triangleWoodStorage.classList.remove('is-visible', 'is-storing', 'is-crafting', 'is-exiting');
        }
        if (triangleWoodStorageImage) {
            triangleWoodStorageImage.classList.remove('is-drag-source');
            triangleWoodStorageImage.removeAttribute('role');
            triangleWoodStorageImage.removeAttribute('tabindex');
            triangleWoodStorageImage.removeAttribute('aria-label');
        }
        if (triangleCraftingPanel) {
            triangleCraftingPanel.hidden = true;
            triangleCraftingPanel.classList.remove('is-visible', 'is-complete', 'is-building', 'is-bridge-revealed', 'is-exiting');
        }
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
                    triangleGameDialogueAdvance = () => playStage(stageIndex + 1);
                    triangleGamePage.classList.add('is-dialog-ready');
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
        triangleGameDialogueAdvance = null;
        advance();
    });

    const getNextTriangleCraftingSlot = () => triangleCraftingSlots.find((slot) => !slot.classList.contains('is-filled')) || null;

    const hideTriangleWoodDragGuide = () => {
        if (triangleWoodGuideIdleTimer !== null) {
            window.clearTimeout(triangleWoodGuideIdleTimer);
            triangleWoodGuideIdleTimer = null;
        }
        if (!triangleWoodDragGuide) return;
        triangleWoodDragGuide.hidden = true;
        triangleWoodDragGuide.classList.remove('is-active');
    };

    const showTriangleWoodDragGuide = () => {
        const nextSlot = getNextTriangleCraftingSlot();
        if (
            !triangleGamePage
            || !triangleWoodDragGuide
            || !triangleWoodStorageImage
            || !nextSlot
            || !triangleWoodStorage?.classList.contains('is-crafting')
            || triangleWoodCollected <= 0
            || triangleWoodDrag
            || triangleWoodSnapInProgress
        ) return;

        const pageRect = triangleGamePage.getBoundingClientRect();
        const storageRect = triangleWoodStorageImage.getBoundingClientRect();
        const slotRect = nextSlot.getBoundingClientRect();
        triangleWoodDragGuide.style.setProperty('--guide-start-x', `${storageRect.left - pageRect.left + (storageRect.width / 2)}px`);
        triangleWoodDragGuide.style.setProperty('--guide-start-y', `${storageRect.top - pageRect.top + (storageRect.height / 2)}px`);
        triangleWoodDragGuide.style.setProperty('--guide-target-x', `${slotRect.left - pageRect.left + (slotRect.width / 2)}px`);
        triangleWoodDragGuide.style.setProperty('--guide-target-y', `${slotRect.top - pageRect.top + (slotRect.height / 2)}px`);
        triangleWoodDragGuide.hidden = false;
        triangleWoodDragGuide.classList.remove('is-active');
        triangleWoodDragGuide.getBoundingClientRect();
        triangleWoodDragGuide.classList.add('is-active');
    };

    const scheduleTriangleWoodDragGuide = (delay = 5600) => {
        hideTriangleWoodDragGuide();
        const session = triangleWoodCollectionSession;
        triangleWoodGuideIdleTimer = window.setTimeout(() => {
            triangleWoodGuideIdleTimer = null;
            if (session === triangleWoodCollectionSession) showTriangleWoodDragGuide();
        }, delay);
    };

    const showTriangleCraftingPanel = (session) => {
        if (session !== triangleWoodCollectionSession || !triangleCraftingPanel || !triangleWoodStorage) return;
        triangleCraftingPanel.hidden = false;
        triangleCraftingPanel.getBoundingClientRect();
        triangleCraftingPanel.classList.add('is-visible');
        triangleWoodStorage.classList.add('is-crafting');
        triangleWoodStorageImage?.setAttribute('role', 'button');
        triangleWoodStorageImage?.setAttribute('tabindex', '0');
        triangleWoodStorageImage?.setAttribute('aria-label', 'Drag a wood block to the triangle crafting panel');
        playUiClickSound('chime');
        scheduleTriangleWoodDragGuide(700);
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
                    collectible.src = 'assets/Shape UI/wood-block-stylized.png';
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
        ghost.src = 'assets/Shape UI/wood-block-stylized.png';
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
                hideTriangleWoodDragGuide();
                triangleWoodStorage?.classList.remove('is-crafting');
                triangleWoodStorageImage?.setAttribute('tabindex', '-1');
                triangleWoodStorageImage?.setAttribute('aria-label', 'All wood blocks have been placed');
                startTriangleBridgeBuildSequence(session);
            }
        }).catch(() => {
            triangleWoodSnapInProgress = false;
            ghost.remove();
        });
    };

    const returnTriangleWoodToStorage = (ghost) => {
        if (!ghost || !triangleGamePage || !triangleWoodStorageImage) return;
        const pageRect = triangleGamePage.getBoundingClientRect();
        const storageRect = triangleWoodStorageImage.getBoundingClientRect();
        const targetX = storageRect.left - pageRect.left + (storageRect.width / 2);
        const targetY = storageRect.top - pageRect.top + (storageRect.height / 2);
        const animation = ghost.animate([
            { left: ghost.style.left, top: ghost.style.top, opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
            { left: `${targetX}px`, top: `${targetY}px`, opacity: 0, transform: 'translate(-50%, -50%) scale(0.32)' },
        ], {
            duration: 280,
            easing: 'ease-in',
            fill: 'forwards',
        });
        animation.finished.then(() => ghost.remove()).catch(() => ghost.remove());
    };

    const beginTriangleWoodDrag = (event) => {
        if (
            !triangleWoodStorage?.classList.contains('is-crafting') ||
            triangleWoodCollected <= 0 ||
            triangleWoodDrag ||
            triangleWoodSnapInProgress ||
            (event.pointerType === 'mouse' && event.button !== 0)
        ) return;
        const ghost = createTriangleWoodDragGhost(event.clientX, event.clientY);
        if (!ghost) return;
        hideTriangleWoodDragGuide();
        triangleWoodDrag = {
            ghost,
            pointerId: event.pointerId,
            session: triangleWoodCollectionSession,
        };
        triangleWoodStorageImage?.classList.add('is-drag-source');
        triangleWoodStorageImage?.setPointerCapture?.(event.pointerId);
        playUiClickSound('wood');
        event.preventDefault();
    };

    const moveTriangleWoodDrag = (event) => {
        if (!triangleWoodDrag || event.pointerId !== triangleWoodDrag.pointerId || !triangleGamePage) return;
        const pageRect = triangleGamePage.getBoundingClientRect();
        triangleWoodDrag.ghost.style.left = `${event.clientX - pageRect.left}px`;
        triangleWoodDrag.ghost.style.top = `${event.clientY - pageRect.top}px`;
        event.preventDefault();
    };

    const endTriangleWoodDrag = (event, cancelled = false) => {
        if (!triangleWoodDrag || event.pointerId !== triangleWoodDrag.pointerId) return;
        const drag = triangleWoodDrag;
        triangleWoodDrag = null;
        triangleWoodStorageImage?.classList.remove('is-drag-source');
        try {
            triangleWoodStorageImage?.releasePointerCapture?.(event.pointerId);
        } catch (error) {
            // Pointer capture may already be released by the browser.
        }

        const panelRect = triangleCraftingPanel?.getBoundingClientRect();
        const droppedOnPanel = !cancelled && panelRect &&
            event.clientX >= panelRect.left && event.clientX <= panelRect.right &&
            event.clientY >= panelRect.top && event.clientY <= panelRect.bottom;
        const nextSlot = droppedOnPanel ? getNextTriangleCraftingSlot() : null;
        if (nextSlot) {
            snapTriangleWoodIntoSlot(drag.ghost, nextSlot, drag.session);
        } else {
            returnTriangleWoodToStorage(drag.ghost);
        }
        scheduleTriangleWoodDragGuide();
    };

    triangleWoodStorageImage?.addEventListener('pointerdown', beginTriangleWoodDrag);
    triangleWoodStorageImage?.addEventListener('pointermove', moveTriangleWoodDrag);
    triangleWoodStorageImage?.addEventListener('pointerup', (event) => endTriangleWoodDrag(event));
    triangleWoodStorageImage?.addEventListener('pointercancel', (event) => endTriangleWoodDrag(event, true));
    triangleWoodStorageImage?.addEventListener('dragstart', (event) => event.preventDefault());
    triangleWoodStorageImage?.addEventListener('keydown', (event) => {
        if ((event.key !== 'Enter' && event.key !== ' ') || triangleWoodCollected <= 0 || triangleWoodSnapInProgress) return;
        const nextSlot = getNextTriangleCraftingSlot();
        if (!nextSlot) return;
        hideTriangleWoodDragGuide();
        const storageRect = triangleWoodStorageImage.getBoundingClientRect();
        const ghost = createTriangleWoodDragGhost(
            storageRect.left + (storageRect.width / 2),
            storageRect.top + (storageRect.height / 2),
        );
        snapTriangleWoodIntoSlot(ghost, nextSlot, triangleWoodCollectionSession);
        scheduleTriangleWoodDragGuide();
        event.preventDefault();
    });

    triangleGamePage?.addEventListener('pointermove', () => {
        if (
            triangleWoodDragGuide?.hidden
            && triangleWoodStorage?.classList.contains('is-crafting')
            && !triangleWoodDrag
            && !triangleWoodSnapInProgress
        ) scheduleTriangleWoodDragGuide();
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
    };

    const stopShapeQuestionAudio = () => {
        pendingShapeChoiceName = null;
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
                const queuedShapeName = pendingShapeChoiceName;
                pendingShapeChoiceName = null;
                if (queuedShapeName) playShapeChoiceAudio(queuedShapeName);
            }, { once: true });
            audio.play().catch(() => {
                if (shapeQuestionAudio !== audio) return;
                shapeQuestionAudio = null;
                const queuedShapeName = pendingShapeChoiceName;
                pendingShapeChoiceName = null;
                if (queuedShapeName) playShapeChoiceAudio(queuedShapeName);
            });
        }, 400);
    };

    const playShapeChoiceAudio = async (shapeName) => {
        const normalizedShapeName = String(shapeName || '').trim().toLowerCase();
        const segment = shapeChoiceAudioSegments[normalizedShapeName];
        if (!segment || !shapeChoiceAudio) return;
        if (
            shapeQuestionAudioTimer !== null
            || (shapeQuestionAudio && !shapeQuestionAudio.paused && !shapeQuestionAudio.ended)
        ) {
            pendingShapeChoiceName = normalizedShapeName;
            return;
        }

        pendingShapeChoiceName = null;
        stopShapeChoiceAudio();
        const session = shapeChoiceAudioSession;

        try {
            shapeChoiceAudio.currentTime = segment.start;
            await shapeChoiceAudio.play();
        } catch (error) {
            return;
        }

        const stopAtSegmentEnd = () => {
            if (session !== shapeChoiceAudioSession) return;
            if (shapeChoiceAudio.currentTime >= segment.end || shapeChoiceAudio.ended) {
                shapeChoiceAudio.pause();
                shapeChoiceAudioFrame = null;
                return;
            }
            shapeChoiceAudioFrame = window.requestAnimationFrame(stopAtSegmentEnd);
        };
        shapeChoiceAudioFrame = window.requestAnimationFrame(stopAtSegmentEnd);
    };

    document.querySelectorAll('.shape-tv-choices').forEach((choiceGroup) => {
        const choices = Array.from(choiceGroup.querySelectorAll('.shape-tv-choice'));
        const lessonPage = choiceGroup.closest('.circle-illustration-page, .shape-area-page');

        choices.forEach((choice) => {
            choice.addEventListener('pointerenter', () => {
                if (!choice.disabled) playShapeChoiceAudio(choice.textContent);
            });

            choice.addEventListener('pointerleave', () => {
                const shapeName = choice.textContent.trim().toLowerCase();
                if (pendingShapeChoiceName === shapeName) pendingShapeChoiceName = null;
            });

            choice.addEventListener('click', () => {
                pendingShapeChoiceName = null;
                stopShapeChoiceAudio();
                if (choice.hasAttribute('data-correct-answer')) {
                    choices.forEach((item) => {
                        item.disabled = true;
                        item.classList.remove('is-wrong');
                        item.setAttribute('aria-pressed', item === choice ? 'true' : 'false');
                    });
                    choice.classList.add('is-correct');
                    playUiClickSound('chime');
                    window.setTimeout(() => {
                        if (!lessonPage || !isPageVisible(lessonPage)) return;
                        if (lessonPage === circleIllustrationPage) {
                            showCircleIllustrationProgress();
                            return;
                        }
                        if (lessonPage === shapeSquarePage) {
                            showShapeSquareProgress();
                            return;
                        }
                        showShapePreviewProgress(lessonPage);
                    }, 650);
                    return;
                }

                playUiClickSound('tap');
                choice.classList.remove('is-wrong');
                choice.getBoundingClientRect();
                choice.classList.add('is-wrong');
                window.setTimeout(() => choice.classList.remove('is-wrong'), 500);
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

            await lockLandscape();
        } catch (error) {
            console.warn('Fullscreen mode was not available.', error);
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
            : 'assets/Backgrounds/skybg.webp';

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
        volume.gain.value = 1.35;
        compressor.connect(volume);
        volume.connect(uiClickAudioContext.destination);
        return compressor;
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
    };
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
        if (control.classList.contains('game1-object-card')) return null;
        if (control.classList.contains('circle-sort-object')) return null;
        if (control.classList.contains('square-answer-tile')) return null;
        if (control.classList.contains('shape-tv-choice')) return null;

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
        if (control.classList.contains('game1-tutorial-button')) return 'spark';
        if (control.classList.contains('game1-level-button')) return 'spark';
        if (control.classList.contains('lettertrace-sound-btn')) return 'tap';
        if (control.classList.contains('lettertrace-nav-clear')) return 'thunk';
        if (control.classList.contains('lettertrace-nav-button')) return control.matches('[data-letter-case]') ? 'tap' : 'thunk';
        if (control.matches('[data-trace-clear]')) return 'thunk';
        if (control.classList.contains('loading-link')) return 'chime';

        return 'tap';
    };

    document.addEventListener('click', (event) => {
        const control = event.target.closest?.('button, a');
        const clickSoundKind = getButtonClickSoundKind(control);

        if (!clickSoundKind) return;
        playUiClickSound(clickSoundKind);
    }, true);

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

        if (dragtomatchTutorialButton) {
            dragtomatchTutorialButton.classList.remove('is-hidden');
        }
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
    });
    circleIllustrationNextButton?.addEventListener('click', finishCircleIllustrationLesson);

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

    shapeSquarePlayButton?.addEventListener('click', playShapeSquareLessonVideo);
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
        setShapeSquarePlayButtonVisible(true);
    });
    shapeSquareNextButton?.addEventListener('click', () => {
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
        piece.addEventListener('pointerdown', beginSquareObjectDrag);
        piece.addEventListener('pointermove', moveSquareObjectDrag);
        piece.addEventListener('pointerup', (event) => endSquareObjectDrag(event));
        piece.addEventListener('pointercancel', (event) => endSquareObjectDrag(event, true));
        piece.addEventListener('dragstart', (event) => event.preventDefault());
        piece.addEventListener('click', () => {
            if (piece.classList.contains('is-scattered')) {
                collectSquareObjectPiece(piece);
            }
        });
        piece.addEventListener('keydown', (event) => {
            if (!['Enter', ' '].includes(event.key) || piece.dataset.squarePlaced === 'true') return;
            event.preventDefault();
            if (piece.classList.contains('is-scattered')) {
                collectSquareObjectPiece(piece);
                return;
            }
            placeSquareObjectPiece(piece);
        });
    });
    document.addEventListener('pointerup', (event) => endSquareObjectDrag(event), true);
    document.addEventListener('pointercancel', (event) => endSquareObjectDrag(event, true), true);

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
        if (isPageVisible(lettertracePage)) {
            resizeLettertraceCanvas();
            clearLettertraceCanvas();
            updateLettertraceTraceGlyph();
        }
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
        if (event.detail?.route !== 'shapeSquare') {
            resetShapeSquareScene();
        }

        if (/^shapeArea[3-8]$/.test(event.detail?.route || '')) {
            const activePreviewPage = shapePreviewPages.find((page) => isPageVisible(page));
            if (activePreviewPage) startShapePreviewIntro(activePreviewPage);
            return;
        }

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

    if (isPageVisible(shapeSquarePage)) {
        startShapeSquareScene();
    } else {
        resetShapeSquareScene();
    }

    shapePreviewPages.forEach((page) => {
        if (isPageVisible(page)) startShapePreviewIntro(page);
    });

    resetCircleIllustrationVideo();

    renderDragtomatchLevels();
    if (!isPageVisible(lettertracePage)) {
        setLettertraceNavigationTargets(getDragtomatchLetterFromHash() || 'A');
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

    fullscreenRestoreButton?.addEventListener('click', () => {
        const fullscreenTarget = getShellContainer() || getAppFrame() || document.documentElement;
        enterFullscreenFlow(fullscreenTarget).catch(() => {});
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
        syncFullscreenClass();
    });
    document.addEventListener('webkitfullscreenchange', () => {
        syncFullscreenClass();
    });
    document.addEventListener('msfullscreenchange', () => {
        syncFullscreenClass();
    });

    // Service worker registration is disabled during development to avoid stale cached assets.
});
