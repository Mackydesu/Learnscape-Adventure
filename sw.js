const SHELL_CACHE = 'learnscape-shell-v2';
const META_CACHE = 'learnscape-meta-v2';
const ACTIVE_CACHE_KEY = new URL('__learnscape_active_cache__', self.registration.scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await cache.add(new URL('index.html', self.registration.scope).href);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

async function activeCache() {
  const meta = await caches.open(META_CACHE);
  const active = await meta.match(ACTIVE_CACHE_KEY);
  return active ? caches.open(await active.text()) : null;
}

async function cachedResponse(request) {
  try {
    const cache = await activeCache();
    const shell = await caches.open(SHELL_CACHE);
    const match = async (url) => (cache && await cache.match(url, { ignoreSearch: true })) ||
      shell.match(url, { ignoreSearch: true });
    const cached = await match(request.url);
    if (cached) return cached;

    // The installed start URL can be the project directory, while installation
    // pre-caches index.html. Treat only that navigation as the same page.
    const scope = new URL(self.registration.scope);
    const url = new URL(request.url);
    if (request.mode === 'navigate' && url.origin === scope.origin && url.pathname === scope.pathname) {
      return match(new URL('index.html', scope).href);
    }
  } catch (error) {
    // Unavailable cache storage must not stop an otherwise working network request.
  }
  return null;
}

function unavailableResponse() {
  return new Response('The requested game resource is temporarily unavailable.', {
    status: 503,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

async function rangeResponse(response, range) {
  const bytes = await response.arrayBuffer();
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match || (!match[1] && !match[2])) return null;
  let start = match[1] ? Number(match[1]) : Math.max(0, bytes.byteLength - Number(match[2]));
  let end = match[1] && match[2] ? Number(match[2]) : bytes.byteLength - 1;
  if (start >= bytes.byteLength || start > end) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${bytes.byteLength}` } });
  }
  end = Math.min(end, bytes.byteLength - 1);
  const headers = new Headers(response.headers);
  headers.set('Content-Range', `bytes ${start}-${end}/${bytes.byteLength}`);
  headers.set('Content-Length', String(end - start + 1));
  headers.set('Accept-Ranges', 'bytes');
  return new Response(bytes.slice(start, end + 1), { status: 206, headers });
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  const isShell = request.mode === 'navigate' || /\.(?:html|js|css)$/.test(url.pathname) ||
    url.pathname.endsWith('/runtime-assets.json');
  event.respondWith((async () => {
    if (request.cache === 'reload') {
      try {
        const response = await fetch(request);
        if (response.ok || request.mode !== 'navigate') return response;
      } catch (error) {
        // Reloads for individual assets must not silently use an old version.
        if (request.mode !== 'navigate') return unavailableResponse();
      }
      return (await cachedResponse(request)) || unavailableResponse();
    }
    if (isShell) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          event.waitUntil(caches.open(SHELL_CACHE)
            .then((cache) => cache.put(request, response.clone()))
            .catch(() => {}));
        }
        if (response.ok) return response;
        return (await cachedResponse(request)) || response;
      } catch (error) {
        const cached = await cachedResponse(request);
        if (cached) return cached;
        return unavailableResponse();
      }
    }

    const cached = await cachedResponse(request);
    if (cached) {
      const range = request.headers.get('Range');
      if (!range) return cached;
      const partial = await rangeResponse(cached, range);
      if (partial) return partial;
    }
    try { return await fetch(request); } catch (error) { return unavailableResponse(); }
  })());
});
