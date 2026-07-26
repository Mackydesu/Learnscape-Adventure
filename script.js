// Smooth scrolling for anchor links is handled by CSS scroll-behavior: smooth.

document.addEventListener('DOMContentLoaded', () => {
    console.log('Learnscape Adventure loaded!');

    const loadingLinks = document.querySelectorAll('.loading-link');
    let isNavigating = false;
    const loadingDuration = 900;

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
