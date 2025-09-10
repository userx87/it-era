/**
 * IT-ERA Service Worker - Performance Optimized
 * Strategic caching, offline support, and intelligent preloading
 */

const CACHE_NAME = 'it-era-v1.1.0';
const STATIC_CACHE = 'it-era-static-v1.1.0';
const DYNAMIC_CACHE = 'it-era-dynamic-v1.1.0';

// Critical resources to cache immediately
const CRITICAL_RESOURCES = [
    '/',
    '/index.html',
    '/css/critical.min.css',
    '/css/combined.min.css',
    '/js/critical.min.js',
    '/manifest.json'
];

// Resources to cache on first access
const CACHE_ON_ACCESS = [
    '/css/',
    '/js/',
    '/images/',
    '/fonts/'
];

// Network-first resources (always try network first)
const NETWORK_FIRST = [
    '/api/',
    '/contatti.html',
    '/grazie-contatto.html'
];

// Cache strategies
const STRATEGIES = {
    CACHE_FIRST: 'cache-first',
    NETWORK_FIRST: 'network-first',
    STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
    NETWORK_ONLY: 'network-only'
};

self.addEventListener('install', event => {
    console.log('🔧 Service Worker installing...');

    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('📦 Caching critical resources...');
                return cache.addAll(CRITICAL_RESOURCES);
            })
            .then(() => {
                console.log('✅ Critical resources cached');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('❌ Error caching critical resources:', error);
            })
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 IT-ERA Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Old caches cleaned');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip external requests
  if (url.origin !== location.origin) return;
  
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('📦 Serving from cache:', request.url);
          return cachedResponse;
        }
        
        // Network request with caching
        return fetch(request)
          .then((networkResponse) => {
            // Don't cache non-successful responses
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }
            
            // Clone response for caching
            const responseClone = networkResponse.clone();
            
            // Determine cache strategy
            const cacheName = isStaticAsset(request.url) ? STATIC_CACHE : DYNAMIC_CACHE;
            
            caches.open(cacheName)
              .then((cache) => {
                console.log('💾 Caching:', request.url);
                cache.put(request, responseClone);
              });
            
            return networkResponse;
          })
          .catch(() => {
            // Offline fallback
            if (request.destination === 'document') {
              return caches.match('/offline.html') || 
                     caches.match('/index.html');
            }
          });
      })
  );
});

// Helper function to determine if asset is static
function isStaticAsset(url) {
  return url.includes('.css') || 
         url.includes('.js') || 
         url.includes('.png') || 
         url.includes('.jpg') || 
         url.includes('.svg') || 
         url.includes('.woff');
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'contact-form') {
    event.waitUntil(syncContactForms());
  }
});

async function syncContactForms() {
  // Sync offline contact form submissions
  console.log('🔄 Syncing offline contact forms...');
  // Implementation would sync stored form data
}

// Push notifications (future feature)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/images/it-era-icon-192.png',
      badge: '/images/it-era-badge.png',
      tag: 'it-era-notification'
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});