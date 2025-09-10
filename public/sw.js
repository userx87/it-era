// IT-ERA Service Worker v2.0
const CACHE_NAME = 'it-era-v2.0';
const STATIC_CACHE = 'it-era-static-v2.0';

const STATIC_ASSETS = [
  '/',
  '/servizi',
  '/contatti',
  '/css/design-system.min.css',
  '/css/components.min.css',
  '/css/styles.css',
  '/js/main.js'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) return;
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
          .then(fetchResponse => {
            // Cache successful responses
            if (fetchResponse.status === 200) {
              const responseClone = fetchResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, responseClone));
            }
            return fetchResponse;
          });
      })
      .catch(() => {
        // Fallback for offline
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});