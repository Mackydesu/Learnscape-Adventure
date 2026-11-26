const RUNTIME_CACHE_PREFIX = 'learnscape-runtime-';
const RUNTIME_META_CACHE = 'learnscape-meta-v2';
const ACTIVE_RUNTIME_CACHE_KEY = '__learnscape_active_cache__';

const getScopeUrl = () => new URL(self.registration.scope);
const getActiveRuntimeCacheKey = () => new URL(ACTIVE_RUNTIME_CACHE_KEY, getScopeUrl()).href;

const getActiveRuntimeCache = async () => {
    const metaCache = await caches.open(RUNTIME_META_CACHE);
    const activeCache = await metaCache.match(getActiveRuntimeCacheKey());
    const cacheName = activeCache && await activeCache.text();

    if (!cacheName?.startsWith(RUNTIME_CACHE_PREFIX)) return null;
    return caches.open(cacheName);
};

const getCachedResponse = async (request) => {
    const runtimeCache = await getActiveRuntimeCache();
    if (!runtimeCache) return null;

    const cached = await runtimeCache.match(request, { ignoreSearch: true });
    if (cached || request.mode !== 'navigate') return cached;

    return runtimeCache.match(new URL('index.html', getScopeUrl()).href, { ignoreSearch: true });
};

const respondNetworkFirst = async (request) => {
    try {
        return await fetch(request);
    } catch (error) {
        const cached = await getCachedResponse(request);
        return cached || Response.error();
    }
};

const respondCacheFirst = async (request) => {
    const cached = await getCachedResponse(request);
    return cached || fetch(request);
};

self.addEventListener('install', (event) => {
    // The page verifies and stores every asset in the runtime cache. The
    // worker only needs to activate so it can serve that verified cache.
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    const scopeUrl = getScopeUrl();
    if (url.origin !== scopeUrl.origin || !url.href.startsWith(scopeUrl.href)) return;

    const isRuntimeManifest = url.pathname === new URL('runtime-assets.json', scopeUrl).pathname;
    // The startup loader uses no-cache requests to validate a newly deployed
    // manifest. Let those refresh from the network, but still fall back to
    // the last verified cache when the player is offline.
    const shouldRevalidate = request.cache === 'no-cache' || request.cache === 'reload';
    if (request.mode === 'navigate' || isRuntimeManifest || shouldRevalidate) {
        event.respondWith(respondNetworkFirst(request));
        return;
    }

    event.respondWith(respondCacheFirst(request));
});
