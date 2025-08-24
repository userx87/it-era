/**
 * Performance Optimization Utilities
 * Shared performance enhancements across all templates
 */

class PerformanceOptimizer {
    constructor() {
        this.observers = new Map();
        this.loadedImages = new Set();
        this.criticalCSS = '';
        this.deferredResources = [];
        
        this.init();
    }

    init() {
        this.setupCriticalCSS();
        this.setupLazyLoading();
        this.setupResourceHints();
        this.setupWebVitalsTracking();
        this.setupServiceWorker();
    }

    /**
     * Critical CSS Management
     */
    setupCriticalCSS() {
        // Extract and inline critical CSS
        const criticalStyles = this.extractCriticalStyles();
        if (criticalStyles) {
            this.inlineCriticalCSS(criticalStyles);
        }

        // Defer non-critical CSS
        this.deferNonCriticalCSS();
    }

    extractCriticalStyles() {
        // Above-the-fold elements selectors
        const criticalSelectors = [
            'header', '.hero-section', '.navigation',
            '.connectivity-bar', '.security-status-bar', '.innovation-progress-bar',
            '.btn-primary', '.btn-secondary',
            'h1', 'h2', '.section-title'
        ];

        let criticalCSS = '';
        
        // Extract styles for critical selectors
        for (const stylesheet of document.styleSheets) {
            try {
                for (const rule of stylesheet.cssRules || []) {
                    if (rule.type === CSSRule.STYLE_RULE) {
                        const selector = rule.selectorText;
                        if (criticalSelectors.some(critical => 
                            selector.includes(critical)
                        )) {
                            criticalCSS += rule.cssText + '\n';
                        }
                    }
                }
            } catch (e) {
                // Skip cross-origin stylesheets
                console.warn('Cannot access stylesheet:', e);
            }
        }

        return criticalCSS;
    }

    inlineCriticalCSS(styles) {
        if (!styles) return;

        const criticalStyle = document.createElement('style');
        criticalStyle.textContent = styles;
        criticalStyle.dataset.critical = 'true';
        document.head.insertBefore(criticalStyle, document.head.firstChild);
    }

    deferNonCriticalCSS() {
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]:not([data-critical])');
        
        stylesheets.forEach(link => {
            // Convert to preload and defer actual loading
            link.rel = 'preload';
            link.as = 'style';
            link.onload = function() {
                this.onload = null;
                this.rel = 'stylesheet';
            };
        });
    }

    /**
     * Lazy Loading Implementation
     */
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            this.setupIntersectionObserver();
        } else {
            this.fallbackLazyLoading();
        }
    }

    setupIntersectionObserver() {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    imageObserver.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.1
        });

        // Observe all lazy images
        const lazyImages = document.querySelectorAll('img[loading="lazy"], img[data-src]');
        lazyImages.forEach(img => {
            imageObserver.observe(img);
        });

        this.observers.set('images', imageObserver);

        // Setup lazy loading for other content
        this.setupContentLazyLoading();
    }

    loadImage(img) {
        if (this.loadedImages.has(img)) return;
        
        const src = img.dataset.src || img.src;
        if (!src) return;

        // Create new image for loading
        const imageLoader = new Image();
        imageLoader.onload = () => {
            img.src = src;
            img.classList.add('loaded');
            this.loadedImages.add(img);
            
            // Trigger custom event
            img.dispatchEvent(new CustomEvent('imageLoaded', { 
                detail: { src } 
            }));
        };
        
        imageLoader.onerror = () => {
            img.classList.add('error');
            console.warn('Failed to load image:', src);
        };
        
        imageLoader.src = src;
    }

    setupContentLazyLoading() {
        const contentObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadDeferredContent(entry.target);
                    contentObserver.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '100px 0px',
            threshold: 0.1
        });

        // Observe sections with data-defer attribute
        const deferredSections = document.querySelectorAll('[data-defer]');
        deferredSections.forEach(section => {
            contentObserver.observe(section);
        });

        this.observers.set('content', contentObserver);
    }

    loadDeferredContent(element) {
        const deferType = element.dataset.defer;
        
        switch (deferType) {
            case 'calculator':
                this.loadCalculatorAssets();
                break;
            case 'charts':
                this.loadChartLibraries();
                break;
            case 'animations':
                this.loadAnimationLibraries();
                break;
            default:
                this.loadGenericContent(element);
        }
        
        element.classList.add('content-loaded');
    }

    fallbackLazyLoading() {
        // Fallback for browsers without IntersectionObserver
        let timeout;
        const lazyLoad = () => {
            if (timeout) clearTimeout(timeout);
            
            timeout = setTimeout(() => {
                const lazyImages = document.querySelectorAll('img[loading="lazy"]:not(.loaded)');
                lazyImages.forEach(img => {
                    if (this.isElementInViewport(img)) {
                        this.loadImage(img);
                    }
                });
            }, 20);
        };

        document.addEventListener('scroll', lazyLoad);
        window.addEventListener('resize', lazyLoad);
        window.addEventListener('orientationchange', lazyLoad);
    }

    isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    /**
     * Resource Hints Management
     */
    setupResourceHints() {
        this.preconnectToOrigins();
        this.preloadCriticalResources();
        this.prefetchNextPageResources();
    }

    preconnectToOrigins() {
        const criticalOrigins = [
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com',
            'https://cdnjs.cloudflare.com'
        ];

        criticalOrigins.forEach(origin => {
            if (!document.querySelector(`link[rel="preconnect"][href="${origin}"]`)) {
                const link = document.createElement('link');
                link.rel = 'preconnect';
                link.href = origin;
                link.crossOrigin = 'anonymous';
                document.head.appendChild(link);
            }
        });
    }

    preloadCriticalResources() {
        const criticalResources = [
            { href: 'styles/critical.css', as: 'style', type: 'text/css' },
            { href: 'scripts/critical.js', as: 'script', type: 'application/javascript' }
        ];

        criticalResources.forEach(resource => {
            const existingPreload = document.querySelector(
                `link[rel="preload"][href="${resource.href}"]`
            );
            
            if (!existingPreload) {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.href = resource.href;
                link.as = resource.as;
                if (resource.type) link.type = resource.type;
                if (resource.crossOrigin) link.crossOrigin = resource.crossOrigin;
                document.head.appendChild(link);
            }
        });
    }

    prefetchNextPageResources() {
        // Prefetch likely next page resources on hover/focus
        const navigationLinks = document.querySelectorAll('a[href^="/"], a[href^="./"]');
        
        navigationLinks.forEach(link => {
            let prefetchTimeout;
            
            const startPrefetch = () => {
                prefetchTimeout = setTimeout(() => {
                    this.prefetchPage(link.href);
                }, 100); // Delay to avoid prefetching on quick hovers
            };
            
            const cancelPrefetch = () => {
                if (prefetchTimeout) {
                    clearTimeout(prefetchTimeout);
                }
            };
            
            link.addEventListener('mouseenter', startPrefetch);
            link.addEventListener('focus', startPrefetch);
            link.addEventListener('mouseleave', cancelPrefetch);
            link.addEventListener('blur', cancelPrefetch);
        });
    }

    prefetchPage(url) {
        if (this.deferredResources.includes(url)) return;
        
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
        
        this.deferredResources.push(url);
    }

    /**
     * Web Vitals Tracking
     */
    setupWebVitalsTracking() {
        if ('PerformanceObserver' in window) {
            this.trackLCP();
            this.trackFID();
            this.trackCLS();
        }
        
        this.trackCustomMetrics();
    }

    trackLCP() {
        const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            
            console.log('LCP:', lastEntry.startTime);
            this.reportMetric('LCP', lastEntry.startTime);
        });
        
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    }

    trackFID() {
        const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                console.log('FID:', entry.processingStart - entry.startTime);
                this.reportMetric('FID', entry.processingStart - entry.startTime);
            });
        });
        
        fidObserver.observe({ entryTypes: ['first-input'] });
    }

    trackCLS() {
        let cumulativeLayoutShiftScore = 0;
        
        const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                    cumulativeLayoutShiftScore += entry.value;
                }
            }
            
            console.log('CLS:', cumulativeLayoutShiftScore);
            this.reportMetric('CLS', cumulativeLayoutShiftScore);
        });
        
        clsObserver.observe({ entryTypes: ['layout-shift'] });
    }

    trackCustomMetrics() {
        // Track time to interactive
        this.measureTTI();
        
        // Track resource loading times
        this.trackResourceTiming();
        
        // Track user interactions
        this.trackInteractionMetrics();
    }

    measureTTI() {
        // Simplified TTI measurement
        let ttiStartTime = performance.now();
        
        const checkTTI = () => {
            if (document.readyState === 'complete' && !this.hasLongTasks()) {
                const tti = performance.now() - ttiStartTime;
                console.log('TTI:', tti);
                this.reportMetric('TTI', tti);
            } else {
                requestIdleCallback(checkTTI);
            }
        };
        
        requestIdleCallback(checkTTI);
    }

    hasLongTasks() {
        const entries = performance.getEntriesByType('longtask');
        return entries.some(entry => 
            entry.startTime + entry.duration > performance.now() - 5000
        );
    }

    trackResourceTiming() {
        const resourceObserver = new PerformanceObserver((list) => {
            list.getEntries().forEach(entry => {
                if (entry.duration > 100) { // Track slow resources
                    console.warn('Slow resource:', entry.name, entry.duration);
                    this.reportMetric('SlowResource', {
                        name: entry.name,
                        duration: entry.duration,
                        type: entry.initiatorType
                    });
                }
            });
        });
        
        resourceObserver.observe({ entryTypes: ['resource'] });
    }

    trackInteractionMetrics() {
        let interactionCount = 0;
        let totalInteractionTime = 0;
        
        ['click', 'keydown', 'touchstart'].forEach(eventType => {
            document.addEventListener(eventType, (e) => {
                const startTime = performance.now();
                
                requestAnimationFrame(() => {
                    const interactionTime = performance.now() - startTime;
                    interactionCount++;
                    totalInteractionTime += interactionTime;
                    
                    if (interactionTime > 100) {
                        console.warn('Slow interaction:', eventType, interactionTime);
                    }
                });
            }, { passive: true });
        });
        
        // Report average interaction time periodically
        setInterval(() => {
            if (interactionCount > 0) {
                const avgInteractionTime = totalInteractionTime / interactionCount;
                this.reportMetric('AvgInteractionTime', avgInteractionTime);
                
                // Reset counters
                interactionCount = 0;
                totalInteractionTime = 0;
            }
        }, 30000); // Every 30 seconds
    }

    reportMetric(name, value) {
        // Send metrics to analytics service
        if (typeof gtag !== 'undefined') {
            gtag('event', 'web_vitals', {
                event_category: 'Performance',
                event_label: name,
                value: Math.round(value),
                non_interaction: true
            });
        }
        
        // Send to custom analytics endpoint
        if (window.analytics && typeof window.analytics.track === 'function') {
            window.analytics.track('Performance Metric', {
                metric: name,
                value: value,
                timestamp: Date.now(),
                page: window.location.pathname
            });
        }
    }

    /**
     * Service Worker Setup
     */
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('SW registered:', registration);
                        this.handleServiceWorkerUpdates(registration);
                    })
                    .catch(error => {
                        console.log('SW registration failed:', error);
                    });
            });
        }
    }

    handleServiceWorkerUpdates(registration) {
        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // Show update notification
                    this.showUpdateNotification();
                }
            });
        });
    }

    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.className = 'update-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <p>Una nuova versione è disponibile!</p>
                <button class="btn-primary btn-sm" onclick="window.location.reload()">
                    Aggiorna
                </button>
                <button class="btn-secondary btn-sm" onclick="this.parentNode.parentNode.remove()">
                    Ignora
                </button>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border-radius: 8px;
            padding: 16px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            max-width: 300px;
        `;
        
        document.body.appendChild(notification);
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 10000);
    }

    /**
     * Asset Loading Helpers
     */
    loadCalculatorAssets() {
        const calculatorCSS = this.loadCSS('/assets/css/calculator.css');
        const calculatorJS = this.loadScript('/assets/js/calculator.js');
        
        return Promise.all([calculatorCSS, calculatorJS]);
    }

    loadChartLibraries() {
        return this.loadScript('https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js');
    }

    loadAnimationLibraries() {
        return this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.9.6/lottie.min.js');
    }

    loadGenericContent(element) {
        const contentUrl = element.dataset.contentUrl;
        if (contentUrl) {
            fetch(contentUrl)
                .then(response => response.text())
                .then(html => {
                    element.innerHTML = html;
                })
                .catch(error => {
                    console.error('Failed to load content:', error);
                });
        }
    }

    loadCSS(href) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Cleanup
     */
    destroy() {
        // Disconnect all observers
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
        
        // Clear loaded images set
        this.loadedImages.clear();
        
        // Remove event listeners
        document.removeEventListener('scroll', this.lazyLoad);
        window.removeEventListener('resize', this.lazyLoad);
        window.removeEventListener('orientationchange', this.lazyLoad);
    }

    /**
     * Public API
     */
    static getInstance() {
        if (!window.performanceOptimizer) {
            window.performanceOptimizer = new PerformanceOptimizer();
        }
        return window.performanceOptimizer;
    }
}

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    PerformanceOptimizer.getInstance();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceOptimizer;
}

// Make available globally
window.PerformanceOptimizer = PerformanceOptimizer;