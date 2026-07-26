// Smooth scrolling for anchor links is handled by CSS scroll-behavior: smooth.

document.addEventListener('DOMContentLoaded', () => {
    console.log('Learnscape Adventure loaded!');

    const loadingLinks = document.querySelectorAll('.loading-link');
    let isNavigating = false;
    const loadingDuration = 900;
    const fullscreenButton = document.querySelector('.btn-fullscreen');
    const fullscreenLabel = document.querySelector('.btn-fullscreen-label');
    const fullscreenEnabled =
        !!(document.fullscreenEnabled || document.webkitFullscreenEnabled || document.msFullscreenEnabled);

    const isFullscreenActive = () => Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
    );

    const requestFullscreen = async () => {
        const root = document.documentElement;

        if (root.requestFullscreen) {
            await root.requestFullscreen();
            return;
        }

        if (root.webkitRequestFullscreen) {
            root.webkitRequestFullscreen();
            return;
        }

        if (root.msRequestFullscreen) {
            root.msRequestFullscreen();
        }
    };

    const exitFullscreen = async () => {
        if (document.exitFullscreen) {
            await document.exitFullscreen();
            return;
        }

        if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
            return;
        }

        if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    };

    const syncFullscreenButton = () => {
        if (!fullscreenButton || !fullscreenLabel) return;

        const active = isFullscreenActive();
        fullscreenLabel.textContent = active ? 'EXIT FULL SCREEN' : 'FULL SCREEN';
        fullscreenButton.setAttribute(
            'aria-label',
            active ? 'Exit full screen mode' : 'Enter full screen mode'
        );
    };

    if (fullscreenButton) {
        const isMobileViewport = window.matchMedia('(max-width: 900px)').matches ||
            window.matchMedia('(hover: none) and (pointer: coarse)').matches;

        if (fullscreenEnabled && isMobileViewport) {
            fullscreenButton.hidden = false;
            syncFullscreenButton();

            fullscreenButton.addEventListener('click', async () => {
                try {
                    if (isFullscreenActive()) {
                        await exitFullscreen();
                    } else {
                        await requestFullscreen();
                    }
                } catch (error) {
                    console.warn('Fullscreen mode is not available in this browser.', error);
                } finally {
                    syncFullscreenButton();
                }
            });
        }
    }

    document.addEventListener('fullscreenchange', syncFullscreenButton);
    document.addEventListener('webkitfullscreenchange', syncFullscreenButton);
    document.addEventListener('msfullscreenchange', syncFullscreenButton);

    const createLoadingMarkup = () => `
        <div class="page-loading-panel" role="status">
            <img class="page-loading-art" src="assets/Backgrounds/loadingscreen.png" alt="Loading">
            <div class="page-loading-bar" aria-hidden="true">
                <span></span>
            </div>
            <p class="page-loading-text">Loading your adventure...</p>
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

    loadingLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            const target = link.getAttribute('href');

            if (!target || target.startsWith('#') || isNavigating) return;

            event.preventDefault();
            isNavigating = true;
            showLoadingScreen();

            window.setTimeout(() => {
                window.location.href = target;
            }, loadingDuration);
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

    const game1ChoiceButtons = document.querySelectorAll('.game1-choice-button');

    game1ChoiceButtons.forEach((button) => {
        button.addEventListener('click', () => {
            game1ChoiceButtons.forEach((otherButton) => {
                const isCurrent = otherButton === button;
                otherButton.classList.toggle('is-active', isCurrent);
                otherButton.setAttribute('aria-pressed', isCurrent ? 'true' : 'false');
            });
        });
    });
});
