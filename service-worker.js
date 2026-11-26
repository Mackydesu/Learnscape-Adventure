const RUNTIME_CACHE_PREFIX = 'learnscape-runtime-';
const RUNTIME_META_CACHE = 'learnscape-meta-v2';
const ACTIVE_RUNTIME_CACHE_KEY = '__learnscape_active_cache__';

const getScopeUrl = () => new URL(self.registration.scope);
const getActiveRuntimeCacheKey = () => new URL(ACTIVE_RUNTIME_CACHE_KEY, getScopeUrl()).href;
const getAppShellUrl = () => new URL('index.html', getScopeUrl()).href;
const getRuntimeManifestUrl = () => new URL('runtime-assets.json', getScopeUrl()).href;
const isNavigationRequest = (request) => request.mode === 'navigate' || request.destination === 'document';
const isRuntimeCacheName = (name) => /^learnscape-runtime-[a-f0-9]{20}$/.test(name);
let activeRuntimeCache = null;
let activeRuntimeCacheLookup = null;

const offlineFallback = (request) => {
    const url = new URL(request.url);
    // Returning a successful response prevents a stale or incomplete worker
    // from manufacturing a noisy 503 response while the app repairs itself.
    // A completed runtime cache always wins before this fallback is used.
    if (isNavigationRequest(request)) {
        return new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Learnscape Adventure</title><main><h1>Mag-connect muna sa internet</h1><p>Tapusin muna ang pag-download ng laro bago ito gamitin offline.</p></main>`, {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'X-Learnscape-Offline': 'not-cached-yet',
            },
        });
    }

    if (url.href === getRuntimeManifestUrl()) {
        // The page validates this shape and will keep using the game that is
        // already open instead of treating the failed request as a 503.
        return new Response(JSON.stringify({ version: '', assets: [] }), {
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'X-Learnscape-Offline': 'not-cached-yet',
            },
        });
    }

    return new Response('', {
        headers: { 'X-Learnscape-Offline': 'not-cached-yet' },
    });
};

const findActiveRuntimeCache = async () => {
    let activeName = null;
    let metaCache = null;
    try {
        metaCache = await caches.open(RUNTIME_META_CACHE);
        const activeCache = await metaCache.match(getActiveRuntimeCacheKey());
        activeName = activeCache && await activeCache.text();
    } catch (error) {
        // Cache Storage may be temporarily unavailable; network handling below
        // still allows the online game to open.
    }

    let cacheNames = [];
    try {
        cacheNames = await caches.keys();
    } catch (error) {
        return null;
    }

    // A previous deployment can leave a complete asset cache behind while its
    // metadata entry is missing. Find and repair that cache instead of
    // responding with an offline error on every page load.
    const candidates = [...new Set([
        activeName,
        ...cacheNames.filter(isRuntimeCacheName),
    ].filter((name) => isRuntimeCacheName(name) && cacheNames.includes(name)))];

    for (const cacheName of candidates) {
        try {
            const runtimeCache = await caches.open(cacheName);
            const [shell, manifest] = await Promise.all([
                runtimeCache.match(getAppShellUrl(), { ignoreSearch: true }),
                runtimeCache.match(getRuntimeManifestUrl(), { ignoreSearch: true }),
            ]);
            if (!shell || !manifest) continue;

            if (cacheName !== activeName && metaCache) {
                await metaCache.put(getActiveRuntimeCacheKey(), new Response(cacheName));
            }
            return runtimeCache;
        } catch (error) {
            // Try the next complete runtime cache, if one exists.
        }
    }

    return null;
};

const getActiveRuntimeCache = async () => {
    if (activeRuntimeCache) return activeRuntimeCache;
    if (!activeRuntimeCacheLookup) {
        activeRuntimeCacheLookup = findActiveRuntimeCache()
            .then((runtimeCache) => {
                if (runtimeCache) activeRuntimeCache = runtimeCache;
                return runtimeCache;
            })
            .finally(() => {
                activeRuntimeCacheLookup = null;
            });
    }
    return activeRuntimeCacheLookup;
};

const getCachedResponse = async (request) => {
    const runtimeCache = await getActiveRuntimeCache();
    if (!runtimeCache) return null;

    const cached = await runtimeCache.match(request, { ignoreSearch: true });
    if (cached || !isNavigationRequest(request)) return cached;

    return (await runtimeCache.match(getScopeUrl().href, { ignoreSearch: true }))
        || runtimeCache.match(getAppShellUrl(), { ignoreSearch: true });
};

const fetchNetwork = async (request) => {
    let lastError;
    // GitHub Pages can momentarily reject a request while a deployment is
    // propagating. One retry keeps that transient failure from breaking boot.
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            return await fetch(request);
        } catch (error) {
            lastError = error;
        }
    }
    throw lastError;
};

const respondNetworkFirst = async (request) => {
    try {
        const response = await fetchNetwork(request);
        if (response.ok) return response;

        const cached = await getCachedResponse(request);
        return cached || offlineFallback(request);
    } catch (error) {
        const cached = await getCachedResponse(request);
        return cached || offlineFallback(request);
    }
};

const respondCacheFirst = async (request) => {
    const cached = await getCachedResponse(request);
    if (cached) return cached;

    try {
        const response = await fetchNetwork(request);
        return response.ok ? response : offlineFallback(request);
    } catch (error) {
        return offlineFallback(request);
    }
};

self.addEventListener('install', (event) => {
    // The page verifies and stores every asset in the runtime cache. The
    // worker only needs to activate so it can serve that verified cache.
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
    if (event.data?.type === 'LEARNSCAPE_SKIP_WAITING') {
        self.skipWaiting();
        return;
    }
    if (event.data?.type === 'LEARNSCAPE_RUNTIME_CACHE_READY') {
        activeRuntimeCache = null;
        activeRuntimeCacheLookup = null;
    }
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    const scopeUrl = getScopeUrl();
    if (url.origin !== scopeUrl.origin || !url.pathname.startsWith(scopeUrl.pathname)) return;

    const isRuntimeManifest = url.pathname === new URL('runtime-assets.json', scopeUrl).pathname;
    // The startup loader uses no-cache requests to validate a newly deployed
    // manifest. Let those refresh from the network, but still fall back to
    // the last verified cache when the player is offline.
    const shouldRevalidate = request.cache === 'no-cache' || request.cache === 'reload';
    if (isNavigationRequest(request) || isRuntimeManifest || shouldRevalidate) {
        event.respondWith(respondNetworkFirst(request));
        return;
    }

    event.respondWith(respondCacheFirst(request));
});
