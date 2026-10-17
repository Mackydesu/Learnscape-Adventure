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
  const cache = await activeCache();
  return (cache && await cache.match(request.url, { ignoreSearch: true })) ||
    (await caches.open(SHELL_CACHE)).match(request.url, { ignoreSearch: true });
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
    if (request.cache === 'reload') return fetch(request);
    if (isShell) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(SHELL_CACHE);
          event.waitUntil(cache.put(request, response.clone()));
        }
        return response;
      } catch (error) {
        const cached = await cachedResponse(request);
        if (cached) return cached;
        throw error;
      }
    }

    const cached = await cachedResponse(request);
    if (cached) {
      const range = request.headers.get('Range');
      if (!range) return cached;
      const partial = await rangeResponse(cached, range);
      if (partial) return partial;
    }
    return fetch(request);
  })());
});
