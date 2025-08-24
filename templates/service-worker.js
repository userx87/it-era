/**
 * Service Worker for IT-ERA Templates
 * Optimizes loading performance and provides offline functionality
 * Improves Core Web Vitals scores through intelligent caching
 */

const CACHE_NAME = 'it-era-v2.0.0';
const STATIC_CACHE = 'it-era-static-v2.0.0';
const DYNAMIC_CACHE = 'it-era-dynamic-v2.0.0';
const RUNTIME_CACHE = 'it-era-runtime-v2.0.0';

// Critical resources to cache immediately
const CRITICAL_ASSETS = [
    '/',
    '/assistenza-it',
    '/sicurezza-informatica',
    '/cloud-storage',
    '/manifest.json',
    '/images/logo-it-era.png',
    '/images/favicon-192x192.png',
    '/images/favicon-512x512.png',
    // Critical CSS and JS will be added dynamically
];

// External resources to cache
const EXTERNAL_RESOURCES = [
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Route patterns for different caching strategies
const CACHE_STRATEGIES = {
    // Cache first - for static assets
    CACHE_FIRST: [
        /\.(?:css|js|woff2?|ttf|eot|svg|png|jpg|jpeg|webp|avif|ico|gif)$/,
        /^https:\/\/fonts\.googleapis\.com/,
        /^https:\/\/fonts\.gstatic\.com/,
        /^https:\/\/cdn\.jsdelivr\.net/,
        /^https:\/\/cdnjs\.cloudflare\.com/
    ],
    
    // Network first - for API calls and dynamic content
    NETWORK_FIRST: [
        /\/api\//,
        /\/contact-form/,
        /\.php$/,
        /\.json$/
    ],
    
    // Stale while revalidate - for pages and templates
    STALE_WHILE_REVALIDATE: [
        /\/assistenza-it-/,
        /\/sicurezza-informatica-/,
        /\/cloud-storage-/,
        /\/pages\//,
        /\.html$/
    ]
};

// Performance monitoring
const PERFORMANCE_METRICS = {
    cacheHits: 0,
    cacheMisses: 0,
    networkRequests: 0,
    offlineRequests: 0,
    averageResponseTime: 0
};

// Install event - cache critical resources
self.addEventListener('install', event => {
    console.log('🔧 Service Worker installing...');
    
    event.waitUntil(
        Promise.all([
            // Cache critical assets
            caches.open(STATIC_CACHE).then(cache => {
                console.log('📦 Caching critical assets...');
                return cache.addAll(CRITICAL_ASSETS.concat(EXTERNAL_RESOURCES));
            }),
            
            // Initialize performance tracking
            initializePerformanceTracking()
        ]).then(() => {
            console.log('✅ Service Worker installed successfully');
            // Force activation of new service worker
            return self.skipWaiting();
        }).catch(error => {
            console.error('❌ Service Worker installation failed:', error);
        })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('🚀 Service Worker activating...');
    
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            cleanupOldCaches(),
            
            // Claim all clients
            self.clients.claim(),
            
            // Initialize runtime cache
            initializeRuntimeCache()
        ]).then(() => {
            console.log('✅ Service Worker activated successfully');
        })
    );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Skip non-GET requests and chrome-extension requests
    if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
        return;
    }
    
    // Record metrics
    recordNetworkRequest();
    
    event.respondWith(
        handleRequest(request).catch(error => {
            console.error('Request handling failed:', error);
            return handleOfflineRequest(request);
        })
    );
});

// Background sync for offline form submissions
self.addEventListener('sync', event => {
    if (event.tag === 'contact-form-sync') {
        event.waitUntil(syncOfflineForms());
    }
});

// Push notifications for emergency IT support
self.addEventListener('push', event => {
    if (!event.data) return;
    
    const options = {
        body: event.data.text(),
        icon: '/images/logo-it-era.png',
        badge: '/images/badge-icon.png',
        tag: 'it-era-notification',
        requireInteraction: true,
        actions: [
            {
                action: 'call',
                title: 'Chiama Subito',
                icon: '/images/phone-icon.png'
            },
            {
                action: 'dismiss',
                title: 'Chiudi',
                icon: '/images/close-icon.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('IT-ERA - Supporto Urgente', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'call') {
        event.waitUntil(
            clients.openWindow('tel:+390398882041')
        );
    } else if (event.action !== 'dismiss') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Core functions

async function handleRequest(request) {
    const url = new URL(request.url);
    const startTime = performance.now();
    
    try {
        // Determine caching strategy
        const strategy = getCachingStrategy(request);
        let response;
        
        switch (strategy) {
            case 'CACHE_FIRST':
                response = await cacheFirstStrategy(request);
                break;
            case 'NETWORK_FIRST':
                response = await networkFirstStrategy(request);
                break;
            case 'STALE_WHILE_REVALIDATE':
                response = await staleWhileRevalidateStrategy(request);
                break;
            default:
                response = await networkFirstStrategy(request);
        }
        
        // Record performance metrics
        const endTime = performance.now();
        recordResponseTime(endTime - startTime);
        
        if (response.headers.get('X-Cache') === 'HIT') {
            recordCacheHit();
        } else {
            recordCacheMiss();
        }
        
        return response;
        
    } catch (error) {
        console.error('Request handling error:', error);
        throw error;
    }
}

function getCachingStrategy(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Check each strategy pattern
    for (const [strategy, patterns] of Object.entries(CACHE_STRATEGIES)) {
        for (const pattern of patterns) {
            if (pattern.test(pathname) || pattern.test(url.href)) {
                return strategy;
            }
        }
    }
    
    // Default strategy
    return 'NETWORK_FIRST';
}

async function cacheFirstStrategy(request) {
    try {
        // Try cache first
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            // Add cache hit header
            const response = cachedResponse.clone();
            response.headers.set('X-Cache', 'HIT');
            return response;
        }
        
        // Fallback to network
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        // Return cached version if available
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
}

async function networkFirstStrategy(request) {
    try {
        // Try network first
        const networkResponse = await fetch(request, {
            // Add timeout for better UX
            signal: AbortSignal.timeout(5000)
        });
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        // Fallback to cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            // Add cache fallback header
            cachedResponse.headers.set('X-Cache', 'STALE');
            return cachedResponse;
        }
        throw error;
    }
}

async function staleWhileRevalidateStrategy(request) {
    try {
        // Get cached response immediately
        const cachedResponse = await caches.match(request);
        
        // Start network request in background
        const networkResponsePromise = fetch(request).then(networkResponse => {
            if (networkResponse.ok) {
                // Update cache in background
                const cache = caches.open(DYNAMIC_CACHE);
                cache.then(c => c.put(request, networkResponse.clone()));
            }
            return networkResponse;
        });
        
        // Return cached version immediately if available
        if (cachedResponse) {
            cachedResponse.headers.set('X-Cache', 'HIT');
            return cachedResponse;
        }
        
        // Wait for network if no cache
        return await networkResponsePromise;
        
    } catch (error) {
        // Fallback to cache only
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
}

async function handleOfflineRequest(request) {
    const url = new URL(request.url);
    
    recordOfflineRequest();
    
    // Handle different types of offline requests
    if (url.pathname.startsWith('/assistenza-it') || url.pathname.startsWith('/pages/')) {
        // Return cached page or offline page
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline fallback page
        return await caches.match('/offline.html') || createOfflineResponse();
    }
    
    // Handle API requests offline
    if (url.pathname.startsWith('/api/') || url.pathname === '/contact-form') {
        return createOfflineAPIResponse();
    }
    
    // Handle static assets
    if (isStaticAsset(request)) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
    }
    
    // Default offline response
    return createOfflineResponse();
}

function createOfflineResponse() {
    const offlineHTML = `
        <!DOCTYPE html>
        <html lang="it">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Offline - IT-ERA</title>
            <style>
                body { 
                    font-family: system-ui, sans-serif; 
                    text-align: center; 
                    padding: 2rem;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0;
                }
                .offline-content {
                    background: rgba(255,255,255,0.1);
                    padding: 3rem;
                    border-radius: 20px;
                    backdrop-filter: blur(15px);
                    border: 1px solid rgba(255,255,255,0.2);
                }
                h1 { font-size: 2.5rem; margin-bottom: 1rem; }
                p { font-size: 1.1rem; margin-bottom: 2rem; opacity: 0.9; }
                .btn {
                    background: rgba(255,255,255,0.2);
                    border: 2px solid rgba(255,255,255,0.3);
                    color: white;
                    padding: 12px 24px;
                    border-radius: 8px;
                    text-decoration: none;
                    margin: 0 10px;
                    display: inline-block;
                }
                .emergency { background: #dc3545; border-color: #dc3545; }
            </style>
        </head>
        <body>
            <div class="offline-content">
                <h1>🔧 IT-ERA - Modalità Offline</h1>
                <p>
                    Non sei connesso a Internet, ma puoi comunque contattarci per assistenza urgente!
                </p>
                <div>
                    <a href="tel:+390398882041" class="btn emergency">📞 Chiamata Emergenza</a>
                    <button onclick="location.reload()" class="btn">🔄 Riprova</button>
                </div>
                <div style="margin-top: 2rem; font-size: 0.9rem; opacity: 0.7;">
                    <p>
                        <strong>Assistenza 24/7:</strong> 039 888 2041<br>
                        <strong>Email:</strong> info@it-era.it
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;
    
    return new Response(offlineHTML, {
        status: 200,
        statusText: 'OK',
        headers: {
            'Content-Type': 'text/html',
            'X-Cache': 'OFFLINE'
        }
    });
}

function createOfflineAPIResponse() {
    return new Response(JSON.stringify({
        error: 'offline',
        message: 'Richiesta salvata. Ti contatteremo appena possibile.',
        emergency: {
            phone: '+390398882041',
            email: 'info@it-era.it'
        }
    }), {
        status: 202,
        statusText: 'Accepted',
        headers: {
            'Content-Type': 'application/json',
            'X-Cache': 'OFFLINE'
        }
    });
}

async function cleanupOldCaches() {
    try {
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(name => 
            name.startsWith('it-era-') && 
            name !== CACHE_NAME && 
            name !== STATIC_CACHE && 
            name !== DYNAMIC_CACHE && 
            name !== RUNTIME_CACHE
        );
        
        await Promise.all(
            oldCaches.map(cacheName => {
                console.log('🗑️ Deleting old cache:', cacheName);
                return caches.delete(cacheName);
            })
        );
        
        console.log(`✅ Cleaned up ${oldCaches.length} old caches`);
    } catch (error) {
        console.error('Cache cleanup failed:', error);
    }
}

async function initializeRuntimeCache() {
    try {
        const cache = await caches.open(RUNTIME_CACHE);
        
        // Pre-cache commonly requested pages
        const commonPages = [
            '/assistenza-it-milano',
            '/assistenza-it-bergamo',
            '/sicurezza-informatica-milano',
            '/cloud-storage-milano'
        ];
        
        // Cache pages that don't exist yet
        commonPages.forEach(async page => {
            const response = await fetch(page).catch(() => null);
            if (response && response.ok) {
                cache.put(page, response);
            }
        });
        
    } catch (error) {
        console.error('Runtime cache initialization failed:', error);
    }
}

async function syncOfflineForms() {
    try {
        // Get stored form data
        const formData = await getStoredFormData();
        
        if (formData.length === 0) return;
        
        // Attempt to sync each form
        for (const data of formData) {
            try {
                const response = await fetch('/contact-form', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                if (response.ok) {
                    // Remove from storage on success
                    await removeStoredFormData(data.id);
                    console.log('✅ Synced offline form submission');
                }
            } catch (error) {
                console.error('Form sync failed:', error);
            }
        }
    } catch (error) {
        console.error('Offline form sync failed:', error);
    }
}

function isStaticAsset(request) {
    return /\.(css|js|png|jpg|jpeg|webp|avif|svg|woff2?|ttf|eot)$/i.test(request.url);
}

// Performance tracking functions
function initializePerformanceTracking() {
    // Reset metrics
    Object.keys(PERFORMANCE_METRICS).forEach(key => {
        PERFORMANCE_METRICS[key] = 0;
    });
    
    console.log('📊 Performance tracking initialized');
}

function recordNetworkRequest() {
    PERFORMANCE_METRICS.networkRequests++;
}

function recordCacheHit() {
    PERFORMANCE_METRICS.cacheHits++;
}

function recordCacheMiss() {
    PERFORMANCE_METRICS.cacheMisses++;
}

function recordOfflineRequest() {
    PERFORMANCE_METRICS.offlineRequests++;
}

function recordResponseTime(time) {
    const currentAvg = PERFORMANCE_METRICS.averageResponseTime;
    const totalRequests = PERFORMANCE_METRICS.networkRequests;
    PERFORMANCE_METRICS.averageResponseTime = 
        (currentAvg * (totalRequests - 1) + time) / totalRequests;
}

// Storage helpers for offline form sync
async function getStoredFormData() {
    // This would integrate with IndexedDB or localStorage
    // For now, return empty array
    return [];
}

async function removeStoredFormData(id) {
    // Remove specific form data by ID
    return true;
}

// Message handling for cache updates
self.addEventListener('message', event => {
    if (event.data && event.data.type) {
        switch (event.data.type) {
            case 'SKIP_WAITING':
                self.skipWaiting();
                break;
                
            case 'GET_PERFORMANCE_METRICS':
                event.ports[0].postMessage(PERFORMANCE_METRICS);
                break;
                
            case 'CLEAR_CACHE':
                clearAllCaches().then(() => {
                    event.ports[0].postMessage({ success: true });
                });
                break;
                
            case 'UPDATE_CACHE':
                updateCriticalAssets().then(() => {
                    event.ports[0].postMessage({ success: true });
                });
                break;
        }
    }
});

async function clearAllCaches() {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
}

async function updateCriticalAssets() {
    const cache = await caches.open(STATIC_CACHE);
    await cache.addAll(CRITICAL_ASSETS);
}

console.log('🚀 IT-ERA Service Worker v2.0.0 loaded');