/**
 * IT-ERA Advanced Analytics System
 * Comprehensive conversation analytics, sentiment analysis, and business insights
 * Real-time monitoring and performance tracking
 */

class ITERAAnalyticsSystem {
    constructor() {
        this.config = {
            enabled: true,
            realTimeTracking: true,
            batchSize: 20,
            flushInterval: 30000, // 30 seconds
            retentionDays: 90,
            endpoints: {
                events: '/api/analytics/events',
                conversations: '/api/analytics/conversations',
                performance: '/api/analytics/performance',
                insights: '/api/analytics/insights'
            }
        };
        
        // Analytics storage
        this.storage = {
            events: [],
            conversations: new Map(),
            performance: [],
            sessions: new Map(),
            insights: {
                daily: {},
                weekly: {},
                monthly: {}
            }
        };
        
        // Real-time metrics
        this.metrics = {
            totalConversations: 0,
            totalMessages: 0,
            averageResponseTime: 0,
            urgentConversations: 0,
            sectorDistribution: { medical: 0, legal: 0, general: 0 },
            sentimentDistribution: { positive: 0, negative: 0, neutral: 0, urgent: 0 },
            conversionRate: 0,
            satisfactionScore: 0
        };
        
        this.init();
    }
    
    init() {
        console.log('📊 IT-ERA Analytics System initializing...');
        
        // Setup periodic data flush
        this.setupPeriodicFlush();
        
        // Setup real-time monitoring
        this.setupRealTimeMonitoring();
        
        // Integrate with existing systems
        this.integrateWithAI();
        this.integrateWithChatbot();
        
        // Setup cleanup routine
        this.setupCleanup();
        
        console.log('✅ IT-ERA Analytics System initialized');
    }
    
    // Event tracking
    trackEvent(eventType, data = {}) {
        if (!this.config.enabled) return;
        
        const event = {
            id: this.generateEventId(),
            type: eventType,
            timestamp: Date.now(),
            sessionId: this.getCurrentSessionId(),
            data: {
                ...data,
                userAgent: navigator.userAgent,
                url: window.location.href,
                referrer: document.referrer
            }
        };
        
        this.storage.events.push(event);
        this.updateRealTimeMetrics(event);
        
        // Real-time processing for critical events
        if (this.isCriticalEvent(eventType)) {
            this.processCriticalEvent(event);
        }
        
        console.log('📈 Event tracked:', eventType, data);
    }
    
    // Conversation tracking
    trackConversation(conversationData) {
        const sessionId = conversationData.sessionId || this.getCurrentSessionId();
        
        if (!this.storage.conversations.has(sessionId)) {
            this.storage.conversations.set(sessionId, {
                id: sessionId,
                startTime: Date.now(),
                messages: [],
                analysis: {},
                outcome: null,
                satisfaction: null
            });
            this.metrics.totalConversations++;
        }
        
        const conversation = this.storage.conversations.get(sessionId);
        
        // Update conversation data
        if (conversationData.message) {
            conversation.messages.push({
                timestamp: Date.now(),
                content: conversationData.message,
                type: conversationData.messageType || 'user',
                analysis: conversationData.analysis || {}
            });
            this.metrics.totalMessages++;
        }
        
        if (conversationData.analysis) {
            conversation.analysis = { ...conversation.analysis, ...conversationData.analysis };
            
            // Update sector distribution
            if (conversationData.analysis.sector) {
                this.metrics.sectorDistribution[conversationData.analysis.sector]++;
            }
            
            // Update sentiment distribution
            if (conversationData.analysis.sentiment) {
                this.metrics.sentimentDistribution[conversationData.analysis.sentiment]++;
            }
            
            // Track urgent conversations
            if (conversationData.analysis.urgencyLevel === 'critical') {
                this.metrics.urgentConversations++;
            }
        }
        
        if (conversationData.outcome) {
            conversation.outcome = conversationData.outcome;
        }
        
        if (conversationData.satisfaction) {
            conversation.satisfaction = conversationData.satisfaction;
            this.updateSatisfactionScore(conversationData.satisfaction);
        }
        
        conversation.lastUpdate = Date.now();
    }
    
    // Performance tracking
    trackPerformance(performanceData) {
        const performance = {
            timestamp: Date.now(),
            sessionId: this.getCurrentSessionId(),
            ...performanceData
        };
        
        this.storage.performance.push(performance);
        
        // Update average response time
        if (performanceData.responseTime) {
            const totalResponseTime = this.metrics.averageResponseTime * (this.metrics.totalMessages - 1);
            this.metrics.averageResponseTime = (totalResponseTime + performanceData.responseTime) / this.metrics.totalMessages;
        }
        
        // Keep only recent performance data
        if (this.storage.performance.length > 1000) {
            this.storage.performance = this.storage.performance.slice(-500);
        }
    }
    
    // Sentiment analysis tracking
    trackSentiment(message, sentiment, confidence) {
        this.trackEvent('sentiment_analysis', {
            message: message.substring(0, 100), // First 100 chars for privacy
            sentiment,
            confidence,
            messageLength: message.length
        });
    }
    
    // Business insights generation
    generateInsights() {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        
        // Daily insights
        if (!this.storage.insights.daily[today]) {
            this.storage.insights.daily[today] = this.calculateDailyInsights();
        }
        
        // Weekly insights (every Sunday)
        if (now.getDay() === 0) {
            const weekKey = this.getWeekKey(now);
            if (!this.storage.insights.weekly[weekKey]) {
                this.storage.insights.weekly[weekKey] = this.calculateWeeklyInsights();
            }
        }
        
        // Monthly insights (first day of month)
        if (now.getDate() === 1) {
            const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            if (!this.storage.insights.monthly[monthKey]) {
                this.storage.insights.monthly[monthKey] = this.calculateMonthlyInsights();
            }
        }
        
        return {
            daily: this.storage.insights.daily[today],
            realTime: this.metrics
        };
    }
    
    calculateDailyInsights() {
        const today = new Date().toISOString().split('T')[0];
        const todayEvents = this.storage.events.filter(event => 
            new Date(event.timestamp).toISOString().split('T')[0] === today
        );
        
        return {
            totalEvents: todayEvents.length,
            conversationsStarted: todayEvents.filter(e => e.type === 'conversation_started').length,
            emergenciesDetected: todayEvents.filter(e => e.type === 'emergency_triggered').length,
            averageResponseTime: this.calculateAverageResponseTime(todayEvents),
            topSectors: this.getTopSectors(todayEvents),
            sentimentBreakdown: this.getSentimentBreakdown(todayEvents),
            peakHours: this.getPeakHours(todayEvents)
        };
    }
    
    calculateWeeklyInsights() {
        // Implementation for weekly insights
        return {
            conversationTrends: this.getConversationTrends('week'),
            sectorGrowth: this.getSectorGrowth('week'),
            performanceMetrics: this.getPerformanceMetrics('week'),
            userSatisfaction: this.getUserSatisfaction('week')
        };
    }
    
    calculateMonthlyInsights() {
        // Implementation for monthly insights
        return {
            businessImpact: this.getBusinessImpact('month'),
            aiPerformance: this.getAIPerformance('month'),
            sectorAnalysis: this.getSectorAnalysis('month'),
            recommendations: this.generateRecommendations('month')
        };
    }
    
    // Real-time monitoring
    setupRealTimeMonitoring() {
        // Monitor critical metrics in real-time
        setInterval(() => {
            this.checkCriticalMetrics();
        }, 5000); // Every 5 seconds
    }
    
    checkCriticalMetrics() {
        // Check for anomalies or critical situations
        const recentEvents = this.storage.events.filter(event => 
            Date.now() - event.timestamp < 60000 // Last minute
        );
        
        const emergencies = recentEvents.filter(e => e.type === 'emergency_triggered');
        if (emergencies.length > 3) {
            this.alertHighEmergencyVolume(emergencies);
        }
        
        const errors = recentEvents.filter(e => e.type === 'ai_error');
        if (errors.length > 5) {
            this.alertHighErrorRate(errors);
        }
    }
    
    // Integration methods
    integrateWithAI() {
        if (window.ITERA_AI) {
            // Override analytics methods
            const originalSendAnalytics = window.ITERA_AI.sendAnalytics;
            window.ITERA_AI.sendAnalytics = (eventType, data) => {
                this.trackEvent(eventType, data);
                if (originalSendAnalytics) {
                    originalSendAnalytics.call(window.ITERA_AI, eventType, data);
                }
            };
        }
    }
    
    integrateWithChatbot() {
        if (window.ITERASmartChatbot) {
            // Add analytics to chatbot events
            const originalTrackEvent = window.ITERASmartChatbot.prototype.trackEvent;
            window.ITERASmartChatbot.prototype.trackEvent = function(eventName, data) {
                window.ITERAAnalytics.trackEvent(eventName, data);
                if (originalTrackEvent) {
                    originalTrackEvent.call(this, eventName, data);
                }
            };
        }
    }
    
    // Utility methods
    generateEventId() {
        return 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    getCurrentSessionId() {
        if (!this.currentSessionId) {
            this.currentSessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        return this.currentSessionId;
    }
    
    isCriticalEvent(eventType) {
        return ['emergency_triggered', 'ai_error', 'system_failure'].includes(eventType);
    }
    
    processCriticalEvent(event) {
        console.warn('🚨 Critical event detected:', event);
        
        // Send immediate alert
        this.sendImmediateAlert(event);
    }
    
    sendImmediateAlert(event) {
        // In production, this would send alerts to monitoring systems
        console.log('📢 Immediate alert sent for:', event.type);
    }
    
    updateRealTimeMetrics(event) {
        // Update real-time dashboard metrics
        if (event.type === 'conversation_started') {
            this.metrics.totalConversations++;
        }
        
        if (event.type === 'message_sent') {
            this.metrics.totalMessages++;
        }
    }
    
    updateSatisfactionScore(satisfaction) {
        // Update overall satisfaction score
        const currentScore = this.metrics.satisfactionScore;
        const totalConversations = this.metrics.totalConversations;
        
        this.metrics.satisfactionScore = 
            ((currentScore * (totalConversations - 1)) + satisfaction) / totalConversations;
    }
    
    // Data management
    setupPeriodicFlush() {
        setInterval(() => {
            this.flushData();
        }, this.config.flushInterval);
    }
    
    async flushData() {
        if (this.storage.events.length === 0) return;
        
        try {
            // Send events to server
            await this.sendToServer('events', this.storage.events);
            
            // Send conversations
            const conversationsArray = Array.from(this.storage.conversations.values());
            if (conversationsArray.length > 0) {
                await this.sendToServer('conversations', conversationsArray);
            }
            
            // Send performance data
            if (this.storage.performance.length > 0) {
                await this.sendToServer('performance', this.storage.performance);
            }
            
            // Clear sent data
            this.storage.events = [];
            this.storage.performance = [];
            
            console.log('📤 Analytics data flushed to server');
            
        } catch (error) {
            console.error('❌ Failed to flush analytics data:', error);
        }
    }
    
    async sendToServer(endpoint, data) {
        const url = this.config.endpoints[endpoint];
        if (!url) return;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data, timestamp: Date.now() })
        });
        
        if (!response.ok) {
            throw new Error(`Analytics server error: ${response.status}`);
        }
    }
    
    setupCleanup() {
        // Clean old data every hour
        setInterval(() => {
            this.cleanupOldData();
        }, 3600000); // 1 hour
    }
    
    cleanupOldData() {
        const cutoffTime = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000);
        
        // Clean events
        this.storage.events = this.storage.events.filter(event => 
            event.timestamp > cutoffTime
        );
        
        // Clean conversations
        for (const [sessionId, conversation] of this.storage.conversations.entries()) {
            if (conversation.lastUpdate < cutoffTime) {
                this.storage.conversations.delete(sessionId);
            }
        }
        
        console.log('🧹 Old analytics data cleaned up');
    }
    
    // Public API
    getMetrics() {
        return { ...this.metrics };
    }
    
    getInsights() {
        return this.generateInsights();
    }
    
    exportData(format = 'json') {
        const data = {
            metrics: this.metrics,
            events: this.storage.events,
            conversations: Array.from(this.storage.conversations.values()),
            performance: this.storage.performance,
            insights: this.storage.insights
        };
        
        if (format === 'csv') {
            return this.convertToCSV(data);
        }
        
        return JSON.stringify(data, null, 2);
    }
}

// Initialize analytics system
window.ITERAAnalytics = new ITERAAnalyticsSystem();

// Global API
window.ITERAAnalytics.api = {
    track: (event, data) => window.ITERAAnalytics.trackEvent(event, data),
    getMetrics: () => window.ITERAAnalytics.getMetrics(),
    getInsights: () => window.ITERAAnalytics.getInsights(),
    export: (format) => window.ITERAAnalytics.exportData(format)
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ITERAAnalyticsSystem;
}

console.log('📊 IT-ERA Advanced Analytics System loaded');
