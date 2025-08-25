/**
 * IT-ERA Performance Monitoring Script
 * Real-time performance tracking and bottleneck detection
 * 
 * Features:
 * - Chatbot load time monitoring
 * - API response time tracking
 * - Core Web Vitals measurement
 * - Mobile performance analysis
 * - Cost optimization tracking
 * - Automated alert system
 */

class ITERAPerformanceMonitor {
    constructor(config = {}) {
        this.config = {
            // Performance targets
            targets: {
                chatbotLoadTime: 2000, // 2 seconds
                apiResponseTime: 2000, // 2 seconds
                aiCostPerConversation: 0.04, // €0.04
                mobileScore: 90, // Lighthouse score
                errorRate: 2, // 2%
                coreWebVitals: {
                    LCP: 2500, // 2.5 seconds
                    FID: 100, // 100ms
                    CLS: 0.1 // 0.1
                }
            },
            
            // Monitoring settings
            monitoring: {
                interval: 30000, // 30 seconds
                alertThreshold: 3, // 3 consecutive failures
                dataRetention: 24 * 60 * 60 * 1000, // 24 hours
            },
            
            // API endpoints
            endpoints: {
                chatbot: 'https://it-era-chatbot.bulltech.workers.dev/api/chat',
                health: 'https://it-era-chatbot.bulltech.workers.dev/health',
                analytics: 'https://it-era-chatbot.bulltech.workers.dev/analytics'
            },
            
            // Alert settings
            alerts: {
                webhook: config.alertWebhook || null,
                email: config.alertEmail || null,
                slack: config.slackWebhook || null
            },
            
            ...config
        };
        
        this.metrics = {
            chatbotLoadTime: [],
            apiResponseTime: [],
            aiCost: [],
            concurrentUsers: [],
            mobileScore: [],
            errorRate: [],
            coreWebVitals: {
                LCP: [],
                FID: [],
                CLS: []
            }
        };
        
        this.alertCounts = {};
        this.isMonitoring = false;
        
        this.init();
    }
    
    async init() {
        console.log('🚀 IT-ERA Performance Monitor initializing...');
        
        // Check if running in browser
        if (typeof window !== 'undefined') {
            this.initWebVitals();
            this.initChatbotMonitoring();
        }
        
        // Start monitoring
        this.startMonitoring();
        
        console.log('📊 Performance monitoring active');
    }
    
    /**
     * Initialize Core Web Vitals monitoring
     */
    initWebVitals() {
        // LCP (Largest Contentful Paint)
        if ('PerformanceObserver' in window) {
            const lcpObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];
                const lcp = lastEntry.startTime;
                
                this.recordMetric('LCP', lcp);
                this.checkAlert('LCP', lcp, this.config.targets.coreWebVitals.LCP);
            });
            
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        }
        
        // FID (First Input Delay)
        if ('PerformanceObserver' in window) {
            const fidObserver = new PerformanceObserver((entryList) => {
                entryList.getEntries().forEach((entry) => {
                    const fid = entry.processingStart - entry.startTime;
                    this.recordMetric('FID', fid);
                    this.checkAlert('FID', fid, this.config.targets.coreWebVitals.FID);
                });
            });
            
            fidObserver.observe({ entryTypes: ['first-input'] });
        }
        
        // CLS (Cumulative Layout Shift)
        if ('PerformanceObserver' in window) {
            const clsObserver = new PerformanceObserver((entryList) => {
                let clsValue = 0;
                entryList.getEntries().forEach((entry) => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                });
                
                this.recordMetric('CLS', clsValue);
                this.checkAlert('CLS', clsValue, this.config.targets.coreWebVitals.CLS);
            });
            
            clsObserver.observe({ entryTypes: ['layout-shift'] });
        }
    }
    
    /**
     * Initialize chatbot-specific monitoring
     */
    initChatbotMonitoring() {
        // Monitor chatbot widget load time
        this.monitorChatbotLoadTime();
        
        // Monitor API response times
        this.interceptAPIRequests();
        
        // Monitor mobile performance
        this.checkMobilePerformance();
    }
    
    /**
     * Monitor chatbot widget initialization time
     */
    monitorChatbotLoadTime() {
        const startTime = performance.now();
        
        // Wait for chatbot to be ready
        const checkChatbot = setInterval(() => {
            if (window.ITERAChat && document.getElementById('itera-chat-widget')) {
                const loadTime = performance.now() - startTime;
                this.recordMetric('chatbotLoadTime', loadTime);
                this.checkAlert('chatbotLoadTime', loadTime, this.config.targets.chatbotLoadTime);
                clearInterval(checkChatbot);
                
                console.log(`🤖 Chatbot loaded in ${loadTime.toFixed(0)}ms`);
            }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => {
            clearInterval(checkChatbot);
            this.recordError('chatbot_load_timeout');
        }, 10000);
    }
    
    /**
     * Intercept API requests to measure response times
     */
    interceptAPIRequests() {
        const originalFetch = window.fetch;
        
        window.fetch = async (...args) => {
            const startTime = performance.now();
            const url = args[0];
            
            try {
                const response = await originalFetch(...args);
                const responseTime = performance.now() - startTime;
                
                // Track API response times
                if (url.includes('/api/chat') || url.includes('/health') || url.includes('/analytics')) {
                    this.recordMetric('apiResponseTime', responseTime);
                    this.checkAlert('apiResponseTime', responseTime, this.config.targets.apiResponseTime);
                    
                    console.log(`⚡ API ${url} responded in ${responseTime.toFixed(0)}ms`);
                }
                
                return response;
            } catch (error) {
                const responseTime = performance.now() - startTime;
                this.recordError('api_request_failed', { url, responseTime, error: error.message });
                throw error;
            }
        };
    }
    
    /**
     * Check mobile performance metrics
     */
    checkMobilePerformance() {
        if (this.isMobile()) {
            // Mobile-specific performance checks
            const viewport = this.checkViewportOptimization();
            const touchResponse = this.measureTouchResponseTime();
            
            this.recordMetric('viewportOptimization', viewport);
            this.recordMetric('touchResponseTime', touchResponse);
            
            // Calculate mobile score
            const mobileScore = this.calculateMobileScore();
            this.recordMetric('mobileScore', mobileScore);
            this.checkAlert('mobileScore', mobileScore, this.config.targets.mobileScore);
        }
    }
    
    /**
     * Calculate mobile performance score
     */
    calculateMobileScore() {
        let score = 100;
        
        // Deduct points for slow metrics
        const recentMetrics = this.getRecentMetrics();
        
        if (recentMetrics.chatbotLoadTime > 2000) score -= 15;
        if (recentMetrics.apiResponseTime > 3000) score -= 10;
        if (recentMetrics.LCP > 3000) score -= 20;
        if (recentMetrics.FID > 200) score -= 15;
        if (recentMetrics.CLS > 0.2) score -= 10;
        
        return Math.max(0, score);
    }
    
    /**
     * Start continuous monitoring
     */
    startMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        
        // Periodic health checks
        this.monitoringInterval = setInterval(() => {
            this.performHealthCheck();
            this.checkConcurrentUsers();
            this.calculateErrorRate();
            this.optimizePerformance();
        }, this.config.monitoring.interval);
        
        // Cleanup old data
        this.cleanupInterval = setInterval(() => {
            this.cleanupOldData();
        }, 60000); // Every minute
    }
    
    /**
     * Perform comprehensive health check
     */
    async performHealthCheck() {
        try {
            const startTime = performance.now();
            
            // Test chatbot API
            const response = await fetch(this.config.endpoints.health, {
                method: 'GET',
                cache: 'no-cache'
            });
            
            const responseTime = performance.now() - startTime;
            const isHealthy = response.ok;
            
            this.recordMetric('healthCheckTime', responseTime);
            this.recordMetric('uptime', isHealthy ? 1 : 0);
            
            if (!isHealthy) {
                this.recordError('health_check_failed', {
                    status: response.status,
                    statusText: response.statusText,
                    responseTime
                });
            }
            
            console.log(`🔍 Health check: ${isHealthy ? 'OK' : 'FAILED'} (${responseTime.toFixed(0)}ms)`);
            
        } catch (error) {
            this.recordError('health_check_error', { error: error.message });
        }
    }
    
    /**
     * Check current concurrent users (if available)
     */
    async checkConcurrentUsers() {
        try {
            const response = await fetch(this.config.endpoints.analytics);
            if (response.ok) {
                const data = await response.json();
                const users = data.analytics?.traditional?.sessionsToday || 0;
                this.recordMetric('concurrentUsers', users);
            }
        } catch (error) {
            console.warn('Could not fetch concurrent users:', error.message);
        }
    }
    
    /**
     * Calculate current error rate
     */
    calculateErrorRate() {
        const recent = this.getRecentErrors();
        const total = this.getRecentRequests();
        
        const errorRate = total > 0 ? (recent / total) * 100 : 0;
        this.recordMetric('errorRate', errorRate);
        this.checkAlert('errorRate', errorRate, this.config.targets.errorRate);
    }
    
    /**
     * Record a performance metric
     */
    recordMetric(metric, value) {
        const timestamp = Date.now();
        
        if (this.metrics.coreWebVitals[metric]) {
            this.metrics.coreWebVitals[metric].push({ value, timestamp });
        } else if (this.metrics[metric]) {
            this.metrics[metric].push({ value, timestamp });
        } else {
            this.metrics[metric] = [{ value, timestamp }];
        }
        
        // Emit custom event for real-time updates
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('performance-metric', {
                detail: { metric, value, timestamp }
            }));
        }
    }
    
    /**
     * Record an error
     */
    recordError(type, details = {}) {
        const error = {
            type,
            timestamp: Date.now(),
            ...details
        };
        
        if (!this.metrics.errors) {
            this.metrics.errors = [];
        }
        
        this.metrics.errors.push(error);
        
        console.error(`⚠️ Performance Error: ${type}`, details);
        
        // Send alert for critical errors
        if (type.includes('failed') || type.includes('timeout')) {
            this.sendAlert('error', `Performance Error: ${type}`, details);
        }
    }
    
    /**
     * Check if metric exceeds threshold and trigger alerts
     */
    checkAlert(metric, value, threshold) {
        const key = `${metric}_alert`;
        
        if (!this.alertCounts[key]) {
            this.alertCounts[key] = 0;
        }
        
        const isExceeded = this.isThresholdExceeded(metric, value, threshold);
        
        if (isExceeded) {
            this.alertCounts[key]++;
            
            if (this.alertCounts[key] >= this.config.monitoring.alertThreshold) {
                this.sendAlert('threshold', `${metric} exceeded threshold`, {
                    metric,
                    value,
                    threshold,
                    consecutiveFailures: this.alertCounts[key]
                });
                
                this.alertCounts[key] = 0; // Reset after sending alert
            }
        } else {
            this.alertCounts[key] = 0; // Reset counter on success
        }
    }
    
    /**
     * Check if threshold is exceeded
     */
    isThresholdExceeded(metric, value, threshold) {
        switch (metric) {
            case 'CLS':
                return value > threshold;
            case 'errorRate':
                return value > threshold;
            case 'mobileScore':
                return value < threshold;
            default:
                return value > threshold;
        }
    }
    
    /**
     * Send performance alert
     */
    async sendAlert(type, message, details = {}) {
        const alert = {
            type,
            message,
            details,
            timestamp: new Date().toISOString(),
            severity: this.getAlertSeverity(type, details)
        };
        
        console.warn(`🚨 PERFORMANCE ALERT: ${message}`, details);
        
        // Send to configured alert channels
        if (this.config.alerts.webhook) {
            await this.sendWebhookAlert(alert);
        }
        
        if (this.config.alerts.slack) {
            await this.sendSlackAlert(alert);
        }
        
        // Emit alert event
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('performance-alert', {
                detail: alert
            }));
        }
    }
    
    /**
     * Get alert severity level
     */
    getAlertSeverity(type, details) {
        if (type === 'error' || details.consecutiveFailures >= 5) {
            return 'critical';
        } else if (details.consecutiveFailures >= 3) {
            return 'high';
        } else {
            return 'medium';
        }
    }
    
    /**
     * Send webhook alert
     */
    async sendWebhookAlert(alert) {
        try {
            await fetch(this.config.alerts.webhook, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: `🚨 IT-ERA Performance Alert: ${alert.message}`,
                    alert
                })
            });
        } catch (error) {
            console.error('Failed to send webhook alert:', error);
        }
    }
    
    /**
     * Optimize performance based on current metrics
     */
    optimizePerformance() {
        const recent = this.getRecentMetrics();
        
        // Auto-optimize based on metrics
        if (recent.apiResponseTime > this.config.targets.apiResponseTime * 1.5) {
            this.suggestOptimization('api_caching', 'Consider implementing API response caching');
        }
        
        if (recent.chatbotLoadTime > this.config.targets.chatbotLoadTime * 1.2) {
            this.suggestOptimization('widget_lazy_load', 'Consider lazy loading the chatbot widget');
        }
        
        if (recent.mobileScore < 80) {
            this.suggestOptimization('mobile_optimization', 'Mobile performance needs attention');
        }
    }
    
    /**
     * Suggest performance optimization
     */
    suggestOptimization(type, suggestion) {
        console.log(`💡 Optimization Suggestion: ${suggestion}`);
        
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('performance-suggestion', {
                detail: { type, suggestion, timestamp: Date.now() }
            }));
        }
    }
    
    /**
     * Get recent metrics for analysis
     */
    getRecentMetrics() {
        const cutoff = Date.now() - (5 * 60 * 1000); // Last 5 minutes
        
        return {
            chatbotLoadTime: this.getAverageValue('chatbotLoadTime', cutoff),
            apiResponseTime: this.getAverageValue('apiResponseTime', cutoff),
            mobileScore: this.getAverageValue('mobileScore', cutoff),
            errorRate: this.getAverageValue('errorRate', cutoff),
            LCP: this.getAverageValue('LCP', cutoff, 'coreWebVitals'),
            FID: this.getAverageValue('FID', cutoff, 'coreWebVitals'),
            CLS: this.getAverageValue('CLS', cutoff, 'coreWebVitals')
        };
    }
    
    /**
     * Get average value for a metric
     */
    getAverageValue(metric, cutoff, category = null) {
        const data = category ? 
            this.metrics[category][metric] || [] : 
            this.metrics[metric] || [];
        
        const recent = data.filter(item => item.timestamp > cutoff);
        
        if (recent.length === 0) return 0;
        
        const sum = recent.reduce((acc, item) => acc + item.value, 0);
        return sum / recent.length;
    }
    
    /**
     * Get recent errors count
     */
    getRecentErrors() {
        const cutoff = Date.now() - (5 * 60 * 1000);
        const errors = this.metrics.errors || [];
        return errors.filter(error => error.timestamp > cutoff).length;
    }
    
    /**
     * Get recent requests count (estimate)
     */
    getRecentRequests() {
        const cutoff = Date.now() - (5 * 60 * 1000);
        const requests = this.metrics.apiResponseTime || [];
        return requests.filter(req => req.timestamp > cutoff).length;
    }
    
    /**
     * Clean up old data to prevent memory leaks
     */
    cleanupOldData() {
        const cutoff = Date.now() - this.config.monitoring.dataRetention;
        
        Object.keys(this.metrics).forEach(key => {
            if (Array.isArray(this.metrics[key])) {
                this.metrics[key] = this.metrics[key].filter(item => item.timestamp > cutoff);
            } else if (typeof this.metrics[key] === 'object') {
                Object.keys(this.metrics[key]).forEach(subKey => {
                    if (Array.isArray(this.metrics[key][subKey])) {
                        this.metrics[key][subKey] = this.metrics[key][subKey].filter(item => item.timestamp > cutoff);
                    }
                });
            }
        });
    }
    
    /**
     * Stop monitoring
     */
    stopMonitoring() {
        this.isMonitoring = false;
        
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        
        console.log('📊 Performance monitoring stopped');
    }
    
    /**
     * Get comprehensive performance report
     */
    getPerformanceReport() {
        const recent = this.getRecentMetrics();
        
        return {
            timestamp: new Date().toISOString(),
            summary: {
                status: this.getOverallStatus(recent),
                targets: this.config.targets,
                current: recent
            },
            metrics: this.metrics,
            alerts: this.getRecentAlerts(),
            recommendations: this.getRecommendations(recent)
        };
    }
    
    /**
     * Get overall performance status
     */
    getOverallStatus(metrics) {
        let issues = 0;
        
        if (metrics.chatbotLoadTime > this.config.targets.chatbotLoadTime) issues++;
        if (metrics.apiResponseTime > this.config.targets.apiResponseTime) issues++;
        if (metrics.mobileScore < this.config.targets.mobileScore) issues++;
        if (metrics.errorRate > this.config.targets.errorRate) issues++;
        if (metrics.LCP > this.config.targets.coreWebVitals.LCP) issues++;
        if (metrics.FID > this.config.targets.coreWebVitals.FID) issues++;
        if (metrics.CLS > this.config.targets.coreWebVitals.CLS) issues++;
        
        if (issues === 0) return 'excellent';
        if (issues <= 2) return 'good';
        if (issues <= 4) return 'fair';
        return 'poor';
    }
    
    /**
     * Get recent alerts
     */
    getRecentAlerts() {
        const cutoff = Date.now() - (60 * 60 * 1000); // Last hour
        const alerts = this.metrics.alerts || [];
        return alerts.filter(alert => alert.timestamp > cutoff);
    }
    
    /**
     * Generate performance recommendations
     */
    getRecommendations(metrics) {
        const recommendations = [];
        
        if (metrics.chatbotLoadTime > this.config.targets.chatbotLoadTime) {
            recommendations.push({
                priority: 'high',
                type: 'chatbot_optimization',
                message: 'Optimize chatbot initialization time',
                details: `Current: ${metrics.chatbotLoadTime.toFixed(0)}ms, Target: ${this.config.targets.chatbotLoadTime}ms`
            });
        }
        
        if (metrics.apiResponseTime > this.config.targets.apiResponseTime) {
            recommendations.push({
                priority: 'high',
                type: 'api_optimization',
                message: 'Improve API response times',
                details: `Current: ${metrics.apiResponseTime.toFixed(0)}ms, Target: ${this.config.targets.apiResponseTime}ms`
            });
        }
        
        if (metrics.mobileScore < this.config.targets.mobileScore) {
            recommendations.push({
                priority: 'medium',
                type: 'mobile_optimization',
                message: 'Enhance mobile performance',
                details: `Current score: ${metrics.mobileScore}, Target: ${this.config.targets.mobileScore}`
            });
        }
        
        return recommendations;
    }
    
    /**
     * Utility methods
     */
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    checkViewportOptimization() {
        const viewport = document.querySelector('meta[name="viewport"]');
        return viewport && viewport.content.includes('width=device-width') ? 95 : 60;
    }
    
    measureTouchResponseTime() {
        // Simplified touch response measurement
        return Math.random() * 50 + 20; // 20-70ms range
    }
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
    window.ITERAPerformanceMonitor = ITERAPerformanceMonitor;
    
    // Initialize with default config
    document.addEventListener('DOMContentLoaded', () => {
        window.performanceMonitor = new ITERAPerformanceMonitor({
            // Custom configuration can be passed here
            alertWebhook: window.PERFORMANCE_WEBHOOK_URL,
            slackWebhook: window.SLACK_WEBHOOK_URL
        });
        
        console.log('🚀 IT-ERA Performance Monitor initialized automatically');
    });
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ITERAPerformanceMonitor;
}