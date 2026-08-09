const CACHE_NAME = 'g4k-workplace-v2';

// On install, skip waiting to immediately take control
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// On activate, purge ALL old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Network-First strategy for navigations and RSC requests
// Stale-While-Revalidate for static assets (images, fonts, etc.)
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never cache API calls, WebSocket upgrades, or Chrome extension requests
  if (
    url.pathname.startsWith('/api/') ||
    url.protocol === 'chrome-extension:' ||
    request.headers.get('Upgrade') === 'websocket'
  ) {
    return;
  }

  // Navigation requests and Next.js RSC (_rsc) payloads: Network-First
  if (request.mode === 'navigate' || url.searchParams.has('_rsc')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses for offline fallback
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline: try cache, then a basic offline page
          return caches.match(request).then((cached) => {
            return cached || caches.match('/');
          });
        })
    );
    return;
  }

  // Static assets (JS, CSS, images, fonts): Stale-While-Revalidate
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|webp|woff2?)$/)
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cached) => {
          const networkFetch = fetch(request).then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          }).catch(() => cached); // If network fails, fall back to cache

          // Return cached immediately if available, otherwise wait for network
          return cached || networkFetch;
        });
      })
    );
    return;
  }

  // Everything else: just fetch normally
});
