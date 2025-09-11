/**
 * IT-ERA Core Web Vitals Monitoring
 * Tracks and reports Core Web Vitals metrics
 */

class WebVitalsMonitor {
    constructor() {
        this.metrics = {};
        this.reportingEndpoint = '/api/web-vitals';
        this.init();
    }

    /**
     * Initialize Web Vitals monitoring
     */
    init() {
        console.log('📊 Web Vitals monitoring initialized');
        
        // Track Core Web Vitals
        this.trackLCP();
        this.trackFID();
        this.trackCLS();
        this.trackFCP();
        this.trackTTFB();
        
        // Report metrics when page is about to unload
        this.setupReporting();
    }

    /**
     * Track Largest Contentful Paint (LCP)
     */
    trackLCP() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                
                this.metrics.lcp = Math.round(lastEntry.startTime);
                console.log('📏 LCP:', this.metrics.lcp + 'ms');
                
                // Send to analytics if available
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'web_vitals', {
                        metric_name: 'LCP',
                        metric_value: this.metrics.lcp,
                        metric_rating: this.getRating('lcp', this.metrics.lcp)
                    });
                }
            });
            
            observer.observe({ entryTypes: ['largest-contentful-paint'] });
        }
    }

    /**
     * Track First Input Delay (FID)
     */
    trackFID() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    this.metrics.fid = Math.round(entry.processingStart - entry.startTime);
                    console.log('⚡ FID:', this.metrics.fid + 'ms');
                    
                    // Send to analytics if available
                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'web_vitals', {
                            metric_name: 'FID',
                            metric_value: this.metrics.fid,
                            metric_rating: this.getRating('fid', this.metrics.fid)
                        });
                    }
                });
            });
            
            observer.observe({ entryTypes: ['first-input'] });
        }
    }

    /**
     * Track Cumulative Layout Shift (CLS)
     */
    trackCLS() {
        if ('PerformanceObserver' in window) {
            let clsValue = 0;
            let sessionValue = 0;
            let sessionEntries = [];
            
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                
                entries.forEach(entry => {
                    if (!entry.hadRecentInput) {
                        const firstSessionEntry = sessionEntries[0];
                        const lastSessionEntry = sessionEntries[sessionEntries.length - 1];
                        
                        if (sessionValue && 
                            entry.startTime - lastSessionEntry.startTime < 1000 &&
                            entry.startTime - firstSessionEntry.startTime < 5000) {
                            sessionValue += entry.value;
                            sessionEntries.push(entry);
                        } else {
                            sessionValue = entry.value;
                            sessionEntries = [entry];
                        }
                        
                        if (sessionValue > clsValue) {
                            clsValue = sessionValue;
                            this.metrics.cls = Math.round(clsValue * 1000) / 1000;
                            console.log('📐 CLS:', this.metrics.cls);
                            
                            // Send to analytics if available
                            if (typeof gtag !== 'undefined') {
                                gtag('event', 'web_vitals', {
                                    metric_name: 'CLS',
                                    metric_value: this.metrics.cls,
                                    metric_rating: this.getRating('cls', this.metrics.cls)
                                });
                            }
                        }
                    }
                });
            });
            
            observer.observe({ entryTypes: ['layout-shift'] });
        }
    }

    /**
     * Track First Contentful Paint (FCP)
     */
    trackFCP() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (entry.name === 'first-contentful-paint') {
                        this.metrics.fcp = Math.round(entry.startTime);
                        console.log('🎨 FCP:', this.metrics.fcp + 'ms');
                        
                        // Send to analytics if available
                        if (typeof gtag !== 'undefined') {
                            gtag('event', 'web_vitals', {
                                metric_name: 'FCP',
                                metric_value: this.metrics.fcp,
                                metric_rating: this.getRating('fcp', this.metrics.fcp)
                            });
                        }
                    }
                });
            });
            
            observer.observe({ entryTypes: ['paint'] });
        }
    }

    /**
     * Track Time to First Byte (TTFB)
     */
    trackTTFB() {
        if ('performance' in window && 'timing' in performance) {
            window.addEventListener('load', () => {
                const navigation = performance.getEntriesByType('navigation')[0];
                if (navigation) {
                    this.metrics.ttfb = Math.round(navigation.responseStart - navigation.requestStart);
                    console.log('🚀 TTFB:', this.metrics.ttfb + 'ms');
                    
                    // Send to analytics if available
                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'web_vitals', {
                            metric_name: 'TTFB',
                            metric_value: this.metrics.ttfb,
                            metric_rating: this.getRating('ttfb', this.metrics.ttfb)
                        });
                    }
                }
            });
        }
    }

    /**
     * Get performance rating for a metric
     */
    getRating(metric, value) {
        const thresholds = {
            lcp: { good: 2500, needsImprovement: 4000 },
            fid: { good: 100, needsImprovement: 300 },
            cls: { good: 0.1, needsImprovement: 0.25 },
            fcp: { good: 1800, needsImprovement: 3000 },
            ttfb: { good: 800, needsImprovement: 1800 }
        };
        
        const threshold = thresholds[metric];
        if (!threshold) return 'unknown';
        
        if (value <= threshold.good) return 'good';
        if (value <= threshold.needsImprovement) return 'needs-improvement';
        return 'poor';
    }

    /**
     * Setup reporting to server
     */
    setupReporting() {
        // Report metrics when page is about to unload
        window.addEventListener('beforeunload', () => {
            this.reportMetrics();
        });
        
        // Report metrics after 10 seconds (for long sessions)
        setTimeout(() => {
            this.reportMetrics();
        }, 10000);
        
        // Report metrics when page becomes hidden
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.reportMetrics();
            }
        });
    }

    /**
     * Report metrics to server
     */
    reportMetrics() {
        if (Object.keys(this.metrics).length === 0) return;
        
        const data = {
            ...this.metrics,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            connection: this.getConnectionInfo()
        };
        
        // Use sendBeacon for reliable reporting
        if ('sendBeacon' in navigator) {
            navigator.sendBeacon(
                this.reportingEndpoint,
                JSON.stringify(data)
            );
        } else {
            // Fallback to fetch
            fetch(this.reportingEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
                keepalive: true
            }).catch(error => {
                console.warn('Failed to report Web Vitals:', error);
            });
        }
        
        console.log('📊 Web Vitals reported:', data);
    }

    /**
     * Get connection information
     */
    getConnectionInfo() {
        if ('connection' in navigator) {
            const conn = navigator.connection;
            return {
                effectiveType: conn.effectiveType,
                downlink: conn.downlink,
                rtt: conn.rtt,
                saveData: conn.saveData
            };
        }
        return null;
    }

    /**
     * Get current metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }

    /**
     * Get performance summary
     */
    getPerformanceSummary() {
        const summary = {
            overall: 'unknown',
            metrics: {},
            recommendations: []
        };
        
        let totalScore = 0;
        let metricCount = 0;
        
        Object.keys(this.metrics).forEach(metric => {
            const value = this.metrics[metric];
            const rating = this.getRating(metric, value);
            
            summary.metrics[metric] = {
                value: value,
                rating: rating,
                unit: metric === 'cls' ? '' : 'ms'
            };
            
            // Calculate score for overall rating
            const score = rating === 'good' ? 100 : rating === 'needs-improvement' ? 75 : 25;
            totalScore += score;
            metricCount++;
        });
        
        // Calculate overall rating
        if (metricCount > 0) {
            const averageScore = totalScore / metricCount;
            if (averageScore >= 90) summary.overall = 'good';
            else if (averageScore >= 70) summary.overall = 'needs-improvement';
            else summary.overall = 'poor';
        }
        
        return summary;
    }
}

// Initialize Web Vitals monitoring when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.webVitalsMonitor = new WebVitalsMonitor();
});

// Export for manual access
window.getWebVitals = () => window.webVitalsMonitor?.getMetrics() || {};
window.getPerformanceSummary = () => window.webVitalsMonitor?.getPerformanceSummary() || {};
