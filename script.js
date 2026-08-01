// Smooth scrolling for anchor links is handled by CSS scroll-behavior: smooth.

document.addEventListener('DOMContentLoaded', () => {
    console.log('Learnscape Adventure loaded!');

    const loadingLinks = document.querySelectorAll('.loading-link');
    let isNavigating = false;
    const loadingDuration = 1000;

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

    const game1Slides = Array.from(document.querySelectorAll('[data-game1-slide]'));
    const game1Prev = document.querySelector('[data-game1-prev]');
    const game1Next = document.querySelector('[data-game1-next]');
    const game1PlayButton = document.querySelector('.game1-play-btn');
    const game1PlayRoutes = ['dragtomatch', 'poptheword', 'bunnyhop'];
    const dragtomatchCards = Array.from(document.querySelectorAll('[data-dragtomatch-object-card]'));
    const dragtomatchObjects = document.querySelector('.game1-dragtomatch-objects');
    const dragtomatchCelebrationLayer = document.querySelector('.game1-celebration-layer');
    const dragtomatchLetterImage = document.querySelector('.game1-current-letter');
    const dragtomatchRoundAdvanceDelay = 2600;
    const game1TransitionDuration = 450;
    const dragtomatchFlipTone = [494, 740];

    const dragtomatchPairs = [
        { letter: 'A', letterSrc: 'assets/ABC Elements/LetterA.png', objectName: 'Apple', objectSrc: 'assets/ABC Elements/Apple.png' },
        { letter: 'B', letterSrc: 'assets/ABC Elements/LetterB.png', objectName: 'Ball', objectSrc: 'assets/ABC Elements/Ball.png' },
        { letter: 'C', letterSrc: 'assets/ABC Elements/LetterC.png', objectName: 'Cat', objectSrc: 'assets/ABC Elements/Cat.png' },
        { letter: 'D', letterSrc: 'assets/ABC Elements/LetterD.png', objectName: 'Dog', objectSrc: 'assets/ABC Elements/Dog.png' },
        { letter: 'E', letterSrc: 'assets/ABC Elements/LetterE.png', objectName: 'Elephant', objectSrc: 'assets/ABC Elements/Elephant.png' },
        { letter: 'F', letterSrc: 'assets/ABC Elements/LetterF.png', objectName: 'Frog', objectSrc: 'assets/ABC Elements/Frog.png' },
        { letter: 'G', letterSrc: 'assets/ABC Elements/LetterG.png', objectName: 'Grapes', objectSrc: 'assets/ABC Elements/Grapes.png' },
        { letter: 'H', letterSrc: 'assets/ABC Elements/LetterH.png', objectName: 'House', objectSrc: 'assets/ABC Elements/House.png' },
        { letter: 'I', letterSrc: 'assets/ABC Elements/LetterI.png', objectName: 'Ice cream', objectSrc: 'assets/ABC Elements/Ice cream.png' },
        { letter: 'J', letterSrc: 'assets/ABC Elements/LetterJ.png', objectName: 'Jelly', objectSrc: 'assets/ABC Elements/Jelly.png' },
        { letter: 'K', letterSrc: 'assets/ABC Elements/LetterK.png', objectName: 'Kite', objectSrc: 'assets/ABC Elements/Kite.png' },
        { letter: 'L', letterSrc: 'assets/ABC Elements/LetterL.png', objectName: 'Lion', objectSrc: 'assets/ABC Elements/Lion.png' },
        { letter: 'M', letterSrc: 'assets/ABC Elements/LetterM.png', objectName: 'Moon', objectSrc: 'assets/ABC Elements/Moon.png' },
        { letter: 'N', letterSrc: 'assets/ABC Elements/LetterN.png', objectName: 'Nest', objectSrc: 'assets/ABC Elements/Nest.png', objectScale: 0.8 },
        { letter: 'O', letterSrc: 'assets/ABC Elements/LetterO.png', objectName: 'Orange', objectSrc: 'assets/ABC Elements/Orange.png' },
        { letter: 'P', letterSrc: 'assets/ABC Elements/LetterP.png', objectName: 'Parrot', objectSrc: 'assets/ABC Elements/Parrot.png' },
        { letter: 'Q', letterSrc: 'assets/ABC Elements/LetterQ.png', objectName: 'Queen', objectSrc: 'assets/ABC Elements/Queen.png' },
        { letter: 'R', letterSrc: 'assets/ABC Elements/LetterR.png', objectName: 'Rainbow', objectSrc: 'assets/ABC Elements/Rainbow.png' },
        { letter: 'S', letterSrc: 'assets/ABC Elements/LetterS.png', objectName: 'Sun', objectSrc: 'assets/ABC Elements/Sun.png' },
        { letter: 'T', letterSrc: 'assets/ABC Elements/LetterT.png', objectName: 'Train', objectSrc: 'assets/ABC Elements/Train.png' },
        { letter: 'U', letterSrc: 'assets/ABC Elements/LetterU.png', objectName: 'Umbrella', objectSrc: 'assets/ABC Elements/Umbrella.png' },
        { letter: 'V', letterSrc: 'assets/ABC Elements/LetterV.png', objectName: 'Violin', objectSrc: 'assets/ABC Elements/Violin.png' },
        { letter: 'W', letterSrc: 'assets/ABC Elements/LetterW.png', objectName: 'Whale', objectSrc: 'assets/ABC Elements/Whale.png', objectScale: 0.82 },
        { letter: 'X', letterSrc: 'assets/ABC Elements/LetterX.png', objectName: 'Xylophone', objectSrc: 'assets/ABC Elements/Xylophone.png', objectScale: 0.82 },
        { letter: 'Y', letterSrc: 'assets/ABC Elements/LetterY.png', objectName: 'Yoyo', objectSrc: 'assets/ABC Elements/Yoyo.png' },
        { letter: 'Z', letterSrc: 'assets/ABC Elements/LetterZ.png', objectName: 'Zebra', objectSrc: 'assets/ABC Elements/Zebra.png' },
    ];
    const dragtomatchAudioContext = (() => {
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        return AudioCtor ? new AudioCtor() : null;
    })();
    const dragtomatchSpeechSynthesis = window.speechSynthesis || null;
    const dragtomatchFlipTimers = new WeakMap();
    const dragtomatchSpeechTimers = new WeakMap();
    let dragtomatchVoicesReadyPromise = null;
    let dragtomatchCelebrationTimer = null;
    let dragtomatchCelebrationLetterTimers = [];
    let dragtomatchCelebratingCard = null;
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

    let game1SlideIndex = game1Slides.findIndex((slide) => slide.classList.contains('is-active'));
    let game1IsAnimating = false;

    if (game1SlideIndex < 0) {
        game1SlideIndex = 0;
    }

    const resetGame1TransitionClasses = () => {
        game1Slides.forEach((slide) => {
            slide.classList.remove(
                'is-enter-from-left',
                'is-enter-from-right',
                'is-leave-to-left',
                'is-leave-to-right'
            );
        });
    };

    const setGame1Slide = (index, direction = 'next') => {
        if (!game1Slides.length) return;

        const normalizedIndex = (index + game1Slides.length) % game1Slides.length;
        if (normalizedIndex === game1SlideIndex || game1IsAnimating) return;

        const currentSlide = game1Slides[game1SlideIndex];
        const nextSlide = game1Slides[normalizedIndex];
        const enterClass = direction === 'prev' ? 'is-enter-from-left' : 'is-enter-from-right';
        const leaveClass = direction === 'prev' ? 'is-leave-to-right' : 'is-leave-to-left';

        game1IsAnimating = true;
        resetGame1TransitionClasses();

        nextSlide.classList.add(enterClass);
        nextSlide.getBoundingClientRect();

        currentSlide.classList.add(leaveClass);
        nextSlide.classList.add('is-active');

        window.setTimeout(() => {
            currentSlide.classList.remove('is-active', leaveClass);
            nextSlide.classList.remove(enterClass);
            game1SlideIndex = normalizedIndex;
            game1IsAnimating = false;
        }, game1TransitionDuration);
    };

    if (game1Slides.length) {
        resetGame1TransitionClasses();
        game1Slides.forEach((slide, slideIndex) => {
            slide.classList.toggle('is-active', slideIndex === game1SlideIndex);
        });

        game1Prev?.addEventListener('click', () => {
            setGame1Slide(game1SlideIndex - 1, 'prev');
        });

        game1Next?.addEventListener('click', () => {
            setGame1Slide(game1SlideIndex + 1, 'next');
        });
    }

    game1PlayButton?.addEventListener('click', () => {
        const targetRoute = game1PlayRoutes[game1SlideIndex] || game1PlayRoutes[0];

        if (targetRoute) {
            window.__learnscapeNavigate?.(targetRoute);
        }
    });

    const shuffleArray = (items) => {
        const copy = items.slice();
        for (let index = copy.length - 1; index > 0; index -= 1) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
        }
        return copy;
    };

    const getDragtomatchRoundOptions = (index) => {
        const correct = dragtomatchPairs[index];
        const picks = [correct];
        const distractorOffsets = [1, 7, 13, 19, 23];

        distractorOffsets.forEach((offset) => {
            if (picks.length >= 4) return;
            const candidate = dragtomatchPairs[(index + offset) % dragtomatchPairs.length];
            if (!picks.some((entry) => entry.letter === candidate.letter)) {
                picks.push(candidate);
            }
        });

        return shuffleArray(picks.slice(0, 4));
    };

    const clearDragtomatchAdvance = () => {
        if (dragtomatchAdvanceTimer) {
            window.clearTimeout(dragtomatchAdvanceTimer);
            dragtomatchAdvanceTimer = null;
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

    const clearDragtomatchCelebration = () => {
        if (dragtomatchCelebrationTimer) {
            window.clearTimeout(dragtomatchCelebrationTimer);
            dragtomatchCelebrationTimer = null;
        }

        dragtomatchCelebrationLetterTimers.forEach((timer) => {
            window.clearTimeout(timer);
        });
        dragtomatchCelebrationLetterTimers = [];

        if (dragtomatchCelebratingCard) {
            dragtomatchCelebratingCard.remove();
            dragtomatchCelebratingCard = null;
        }

        if (dragtomatchCelebrationLayer) {
            dragtomatchCelebrationLayer.innerHTML = '';
        }

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
        const letters = Array.from(cleanWord);
        const revealDelay = 110;
        const holdDelay = 900;
        const zoomDelay = 160;
        const zoomDuration = 800;
        const cardRect = card.getBoundingClientRect();
        const targetWidth = Math.min(window.innerWidth * 0.42, 620);
        const targetScale = targetWidth / Math.max(cardRect.width, 1);
        const targetX = window.innerWidth / 2 - (cardRect.left + cardRect.width / 2);
        const targetY = window.innerHeight / 2 - (cardRect.top + cardRect.height / 2) - Math.min(window.innerHeight * 0.03, 26);

        const celebrationCard = card.cloneNode(true);
        celebrationCard.classList.add('game1-celebration-card');
        celebrationCard.classList.remove('is-solved', 'is-drop-target', 'is-wrong-drop', 'is-celebrating');
        celebrationCard.setAttribute('aria-hidden', 'true');
        celebrationCard.disabled = true;
        celebrationCard.style.left = `${cardRect.left}px`;
        celebrationCard.style.top = `${cardRect.top}px`;
        celebrationCard.style.width = `${cardRect.width}px`;
        celebrationCard.style.height = `${cardRect.height}px`;
        celebrationCard.style.transform = 'translate(0px, 0px) scale(1)';
        celebrationCard.style.setProperty('--celebration-scale', String(targetScale));

        const celebrationSpellTarget = celebrationCard.querySelector('.game1-object-card-spell');
        if (!celebrationSpellTarget) {
            resolve();
            return;
        }

        celebrationSpellTarget.innerHTML = '';
        spellTarget.innerHTML = '';
        spellTarget.setAttribute('aria-label', cleanWord);
        celebrationSpellTarget.setAttribute('aria-label', cleanWord);

        dragtomatchCelebratingCard = celebrationCard;
        dragtomatchCelebrationLayer.appendChild(celebrationCard);

        letters.forEach((letter, index) => {
            const letterSpan = document.createElement('span');
            letterSpan.className = letter === ' ' ? 'game1-object-card-spell-letter game1-object-card-spell-space' : 'game1-object-card-spell-letter';
            letterSpan.textContent = letter === ' ' ? '\u00A0' : letter;
            const cloneLetterSpan = letterSpan.cloneNode(true);
            celebrationSpellTarget.appendChild(cloneLetterSpan);

            const timer = window.setTimeout(() => {
                cloneLetterSpan.classList.add('is-visible');
            }, zoomDelay + zoomDuration + index * revealDelay);
            dragtomatchCelebrationLetterTimers.push(timer);
        });

        if (!letters.length) {
            celebrationSpellTarget.textContent = cleanWord;
        }

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                celebrationCard.style.transform = `translate(${targetX}px, ${targetY}px) scale(${targetScale})`;
            });
        });

        const totalDuration = zoomDelay + zoomDuration + Math.max(letters.length * revealDelay + holdDelay, 1200);
        dragtomatchCelebrationTimer = window.setTimeout(() => {
            dragtomatchCelebrationTimer = null;
            resolve();
        }, totalDuration);
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
            utterance.rate = 0.82;
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

    const syncDragtomatchLetter = (pair) => {
        if (!dragtomatchLetterImage || !pair) return;
        dragtomatchLetterImage.textContent = pair.letter;
        dragtomatchLetterImage.dataset.letter = pair.letter;
        dragtomatchLetterImage.setAttribute('aria-label', `Letter ${pair.letter}`);
        dragtomatchLetterImage.setAttribute('draggable', 'true');
    };

    const renderDragtomatchRound = (index) => {
        clearDragtomatchAdvance();
        clearDragtomatchCelebration();

        if (!dragtomatchCards.length || !dragtomatchPairs.length) return;

        dragtomatchCurrentIndex = (index + dragtomatchPairs.length) % dragtomatchPairs.length;
        const currentPair = dragtomatchPairs[dragtomatchCurrentIndex];
        const roundOptions = getDragtomatchRoundOptions(dragtomatchCurrentIndex);

        syncDragtomatchLetter(currentPair);

        dragtomatchCards.forEach((card, cardIndex) => {
            const option = roundOptions[cardIndex];
            const objectImage = card.querySelector('.game1-object-card-object');
            const isCorrect = option.letter === currentPair.letter;

            card.classList.remove('is-flipped', 'is-solved', 'is-wrong-drop');
            card.setAttribute('aria-pressed', 'false');
            card.setAttribute('aria-disabled', 'false');
            card.dataset.letter = option.letter;
            card.dataset.objectName = option.objectName;
            card.dataset.objectSrc = option.objectSrc;
            card.dataset.objectScale = option.objectScale || '1';
            card.disabled = false;
            card.style.pointerEvents = 'auto';
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

    const advanceDragtomatchRound = () => {
        renderDragtomatchRound(dragtomatchCurrentIndex + 1);
    };

    const markDragtomatchSuccess = async (card) => {
        if (!card || card.classList.contains('is-solved')) return;

        clearDragtomatchCardFlipTimer(card);
        clearDragtomatchSpeechTimer(card);
        clearDragtomatchCelebration();
        card.classList.add('is-flipped');
        card.setAttribute('aria-pressed', 'true');
        card.setAttribute('aria-disabled', 'true');
        card.disabled = true;
        card.style.pointerEvents = 'none';
        playDragtomatchFlipSound();

        clearDragtomatchAdvance();

        const celebrationWord = card.dataset.objectName || card.dataset.letter || '';
        const speechPromise = speakDragtomatchObjectName(celebrationWord, card);
        const celebrationPromise = startDragtomatchCelebration(card, celebrationWord);

        await Promise.all([speechPromise, celebrationPromise]);

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
        card.getBoundingClientRect();
        card.classList.add('is-wrong-drop');
        window.setTimeout(() => {
            card.classList.remove('is-wrong-drop');
        }, 320);
    };

    dragtomatchCards.forEach((card) => {
        card.addEventListener('click', () => {
            if (card.classList.contains('is-solved')) return;

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
    });

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
        dragtomatchCards.forEach((card) => card.classList.remove('is-drop-target'));
    });

    renderDragtomatchRound(0);

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
