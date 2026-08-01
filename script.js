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
    const dragtomatchLetterImage = document.querySelector('.game1-current-letter');
    const dragtomatchRoundAdvanceDelay = 2600;
    const dragtomatchPreviewFlipDelay = 950;
    const game1TransitionDuration = 450;

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
    const dragtomatchFlipTimers = new WeakMap();
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

    const syncDragtomatchLetter = (pair) => {
        if (!dragtomatchLetterImage || !pair) return;
        dragtomatchLetterImage.textContent = pair.letter;
        dragtomatchLetterImage.dataset.letter = pair.letter;
        dragtomatchLetterImage.setAttribute('aria-label', `Letter ${pair.letter}`);
        dragtomatchLetterImage.setAttribute('draggable', 'true');
    };

    const renderDragtomatchRound = (index) => {
        clearDragtomatchAdvance();

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

            card.dataset.correct = String(isCorrect);
        });
    };

    const advanceDragtomatchRound = () => {
        renderDragtomatchRound(dragtomatchCurrentIndex + 1);
    };

    const markDragtomatchSuccess = (card) => {
        if (!card || card.classList.contains('is-solved')) return;

        clearDragtomatchCardFlipTimer(card);
        card.classList.add('is-flipped');
        card.setAttribute('aria-pressed', 'true');

        clearDragtomatchAdvance();
        window.setTimeout(() => {
            card.classList.remove('is-flipped');
            card.classList.add('is-solved');
            card.setAttribute('aria-disabled', 'true');
            card.disabled = true;
            card.style.pointerEvents = 'none';
        }, dragtomatchRoundAdvanceDelay);

        dragtomatchAdvanceTimer = window.setTimeout(() => {
            advanceDragtomatchRound();
        }, dragtomatchRoundAdvanceDelay + game1TransitionDuration);
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
            card.classList.add('is-flipped');
            card.setAttribute('aria-pressed', 'true');

            const flipBackTimer = window.setTimeout(() => {
                if (card.classList.contains('is-solved')) return;
                card.classList.remove('is-flipped');
                card.setAttribute('aria-pressed', 'false');
                dragtomatchFlipTimers.delete(card);
            }, dragtomatchPreviewFlipDelay);

            dragtomatchFlipTimers.set(card, flipBackTimer);
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
