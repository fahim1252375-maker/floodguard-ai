// Service Worker for FloodGuard AI - DSH Hacks V2
// Enables offline operations room reliability and stale-while-revalidate caching for telemetry feeds

const CACHE_NAME = 'floodguard-cache-v3';
// Only files that actually exist are pre-cached (a missing file used to make cache.addAll fail
// atomically, so nothing was cached and the offline fallback never worked).
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
];

const API_ROUTES = [
  '/api/weather/live',
  '/api/river/live',
  '/api/alerts',
  '/api/reports',
];

// Install: cache essential offline shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // Cache each asset independently so one failure cannot discard the rest.
      Promise.allSettled(STATIC_ASSETS.map((asset) => cache.add(asset))).then((results) => {
        results.forEach((r, i) => {
          if (r.status === 'rejected') {
            console.warn('[SW] Could not pre-cache', STATIC_ASSETS[i], r.reason);
          }
        });
      })
    )
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Stale-While-Revalidate for live telemetry APIs, cache-first for static, network-first for others
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Stale-While-Revalidate for critical telemetry API endpoints
  const isTelemetryApi = API_ROUTES.some((route) => url.pathname.startsWith(route));
  if (isTelemetryApi) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => cachedResponse);

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Cache-first for Vite build assets (JS, CSS, SVGs, fonts)
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return (
          cached ||
          fetch(request).then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
        );
      })
    );
    return;
  }

  // Network-first with offline fallback for navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        // caches.match() returns a Promise, so `a || b` never reached the second lookup.
        return (await caches.match('/index.html')) || (await caches.match('/')) || Response.error();
      })
    );
    return;
  }

  // Default network fetch with cache fallback
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});
