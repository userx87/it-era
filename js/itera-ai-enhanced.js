/**
 * IT-ERA Enhanced AI System Integration
 * Complete integration of all AI components with Auggie support
 * Maintains backward compatibility with existing systems
 */

class ITERAEnhancedAI {
    constructor() {
        this.version = '2.0.0';
        this.initialized = false;
        this.components = {
            aiConfig: null,
            chatbot: null,
            analytics: null,
            sectorPersonalization: null,
            auggieIntegration: null
        };
        
        this.config = {
            enableAuggie: true,
            enableAnalytics: true,
            enableSectorPersonalization: true,
            enableEnhancedUX: true,
            fallbackChain: ['auggie', 'openai', 'static'],
            debug: false
        };
        
        this.init();
    }
    
    async init() {
        console.log('🚀 IT-ERA Enhanced AI System initializing...');
        
        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }
            
            // Initialize components in order
            await this.initializeComponents();
            
            // Setup integrations
            this.setupIntegrations();
            
            // Setup global API
            this.setupGlobalAPI();
            
            // Setup monitoring
            this.setupMonitoring();
            
            this.initialized = true;
            console.log('✅ IT-ERA Enhanced AI System initialized successfully');
            
            // Send initialization event
            this.trackEvent('system_initialized', {
                version: this.version,
                components: Object.keys(this.components),
                timestamp: Date.now()
            });
            
        } catch (error) {
            console.error('❌ IT-ERA Enhanced AI System initialization failed:', error);
            this.handleInitializationError(error);
        }
    }
    
    async initializeComponents() {
        // Initialize AI Config (already loaded)
        if (window.ITERA_AI) {
            this.components.aiConfig = window.ITERA_AI;
            console.log('✅ AI Config component loaded');
        }
        
        // Initialize Analytics
        if (window.ITERAAnalytics) {
            this.components.analytics = window.ITERAAnalytics;
            console.log('✅ Analytics component loaded');
        }
        
        // Initialize Sector Personalization
        if (window.ITERASectorPersonalization) {
            this.components.sectorPersonalization = window.ITERASectorPersonalization;
            console.log('✅ Sector Personalization component loaded');
        }
        
        // Initialize Chatbot (already loaded)
        if (window.ITERASmartChatbot) {
            this.components.chatbot = window.ITERASmartChatbot;
            console.log('✅ Smart Chatbot component loaded');
        }
        
        // Initialize Auggie Integration
        if (window.ITERAuggieIntegration && this.config.enableAuggie) {
            this.components.auggieIntegration = window.ITERAuggieIntegration;
            console.log('✅ Auggie Integration component loaded');
        }
    }
    
    setupIntegrations() {
        // Integrate Analytics with all components
        if (this.components.analytics) {
            this.integrateAnalytics();
        }
        
        // Integrate Sector Personalization
        if (this.components.sectorPersonalization) {
            this.integrateSectorPersonalization();
        }
        
        // Integrate Auggie
        if (this.components.auggieIntegration) {
            this.integrateAuggie();
        }
        
        // Setup enhanced error handling
        this.setupErrorHandling();
    }
    
    integrateAnalytics() {
        const analytics = this.components.analytics;
        
        // Override AI response generation to include analytics
        if (this.components.aiConfig) {
            const originalCallOpenAI = this.components.aiConfig.callOpenAI;
            this.components.aiConfig.callOpenAI = async function(messages, options = {}) {
                const startTime = performance.now();
                
                try {
                    const result = await originalCallOpenAI.call(this, messages, options);
                    
                    analytics.trackPerformance({
                        type: 'ai_response',
                        responseTime: performance.now() - startTime,
                        success: true,
                        model: options.model || 'gpt-4',
                        tokens: result.length
                    });
                    
                    return result;
                } catch (error) {
                    analytics.trackPerformance({
                        type: 'ai_response',
                        responseTime: performance.now() - startTime,
                        success: false,
                        error: error.message
                    });
                    throw error;
                }
            };
        }
        
        console.log('🔗 Analytics integration completed');
    }
    
    integrateSectorPersonalization() {
        const personalization = this.components.sectorPersonalization;
        
        // Enhance AI responses with sector personalization
        if (this.components.aiConfig) {
            const originalCallOpenAI = this.components.aiConfig.callOpenAI;
            this.components.aiConfig.callOpenAI = async function(messages, options = {}) {
                // Detect sector if not provided
                if (!options.sector && messages.length > 0) {
                    const lastMessage = messages[messages.length - 1].content;
                    const sectorAnalysis = personalization.detectSector(lastMessage);
                    options.sector = sectorAnalysis.sector;
                    options.sectorConfidence = sectorAnalysis.confidence;
                }
                
                const result = await originalCallOpenAI.call(this, messages, options);
                
                // Personalize response based on sector
                if (options.sector) {
                    return personalization.personalizeResponse(result, options.sector, {
                        urgencyLevel: options.urgencyLevel,
                        intent: options.intent
                    });
                }
                
                return result;
            };
        }
        
        console.log('🎯 Sector Personalization integration completed');
    }
    
    integrateAuggie() {
        const auggie = this.components.auggieIntegration;
        
        // Enable Auggie integration in AI Config
        if (this.components.aiConfig && auggie.auggieAvailable) {
            this.components.aiConfig.enableAuggieIntegration(auggie);
            console.log('🤖 Auggie integration enabled');
        } else {
            console.log('⚠️ Auggie not available, using OpenAI fallback');
        }
    }
    
    setupErrorHandling() {
        // Global error handler for AI system
        window.addEventListener('error', (event) => {
            if (event.error && event.error.message.includes('ITERA')) {
                this.handleError(event.error);
            }
        });
        
        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            if (event.reason && event.reason.message && event.reason.message.includes('ITERA')) {
                this.handleError(event.reason);
            }
        });
    }
    
    setupGlobalAPI() {
        // Create unified API for external access
        window.ITERA_AI_ENHANCED = {
            version: this.version,
            initialized: () => this.initialized,
            
            // Analytics API
            track: (event, data) => this.trackEvent(event, data),
            getMetrics: () => this.components.analytics?.getMetrics() || {},
            getInsights: () => this.components.analytics?.getInsights() || {},
            
            // AI API
            chat: (message, options = {}) => this.processMessage(message, options),
            detectUrgency: (message) => this.components.aiConfig?.detectUrgency(message),
            detectSector: (message) => this.components.sectorPersonalization?.detectSector(message),
            
            // System API
            getStatus: () => this.getSystemStatus(),
            enableAuggie: () => this.enableAuggie(),
            disableAuggie: () => this.disableAuggie(),
            
            // Debug API
            debug: (enabled) => { this.config.debug = enabled; },
            getComponents: () => this.components,
            getConfig: () => this.config
        };
        
        console.log('🌐 Global API setup completed');
    }
    
    setupMonitoring() {
        // System health monitoring
        setInterval(() => {
            this.performHealthCheck();
        }, 60000); // Every minute
        
        // Performance monitoring
        setInterval(() => {
            this.monitorPerformance();
        }, 30000); // Every 30 seconds
    }
    
    // Public methods
    async processMessage(message, options = {}) {
        if (!this.initialized) {
            throw new Error('IT-ERA Enhanced AI System not initialized');
        }
        
        const startTime = performance.now();
        
        try {
            // Enhanced message processing with all components
            const analysis = await this.analyzeMessage(message, options);
            const response = await this.generateResponse(message, analysis, options);
            
            // Track the interaction
            this.trackEvent('message_processed', {
                messageLength: message.length,
                responseTime: performance.now() - startTime,
                analysis: analysis,
                success: true
            });
            
            return {
                response,
                analysis,
                responseTime: performance.now() - startTime
            };
            
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }
    
    async analyzeMessage(message, options = {}) {
        const analysis = {};
        
        // Urgency detection
        if (this.components.aiConfig) {
            analysis.urgency = this.components.aiConfig.detectUrgency(message);
        }
        
        // Sector detection
        if (this.components.sectorPersonalization) {
            analysis.sector = this.components.sectorPersonalization.detectSector(message, options);
        }
        
        // Sentiment analysis
        if (this.components.aiConfig) {
            analysis.sentiment = this.components.aiConfig.detectSentiment(message);
        }
        
        // Service recommendation
        if (this.components.aiConfig) {
            analysis.service = this.components.aiConfig.getServiceRecommendation(message);
        }
        
        return analysis;
    }
    
    async generateResponse(message, analysis, options = {}) {
        const messages = [{
            role: 'user',
            content: message
        }];
        
        const aiOptions = {
            ...options,
            sector: analysis.sector?.sector,
            urgencyLevel: analysis.urgency?.level,
            sentiment: analysis.sentiment?.sentiment
        };
        
        return await this.components.aiConfig.callOpenAI(messages, aiOptions);
    }
    
    trackEvent(eventType, data = {}) {
        if (this.components.analytics) {
            this.components.analytics.trackEvent(eventType, data);
        }
        
        if (this.config.debug) {
            console.log('📊 Event tracked:', eventType, data);
        }
    }
    
    getSystemStatus() {
        return {
            version: this.version,
            initialized: this.initialized,
            components: Object.keys(this.components).reduce((status, key) => {
                status[key] = !!this.components[key];
                return status;
            }, {}),
            config: this.config,
            health: this.getHealthStatus()
        };
    }
    
    getHealthStatus() {
        // Basic health check
        return {
            aiConfig: !!this.components.aiConfig,
            chatbot: !!this.components.chatbot,
            analytics: !!this.components.analytics,
            sectorPersonalization: !!this.components.sectorPersonalization,
            auggieIntegration: !!this.components.auggieIntegration,
            overall: this.initialized
        };
    }
    
    performHealthCheck() {
        const health = this.getHealthStatus();
        
        if (!health.overall) {
            console.warn('⚠️ IT-ERA Enhanced AI System health check failed');
            this.trackEvent('health_check_failed', health);
        }
    }
    
    monitorPerformance() {
        const performance = {
            memory: this.getMemoryUsage(),
            responseTime: this.getAverageResponseTime(),
            errorRate: this.getErrorRate()
        };
        
        this.trackEvent('performance_monitor', performance);
    }
    
    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
        }
        return null;
    }
    
    getAverageResponseTime() {
        return this.components.analytics?.getMetrics()?.averageResponseTime || 0;
    }
    
    getErrorRate() {
        const metrics = this.components.analytics?.getMetrics();
        if (metrics && metrics.totalMessages > 0) {
            return (metrics.errors || 0) / metrics.totalMessages;
        }
        return 0;
    }
    
    enableAuggie() {
        this.config.enableAuggie = true;
        if (this.components.auggieIntegration) {
            this.components.auggieIntegration.enableAuggie();
        }
    }
    
    disableAuggie() {
        this.config.enableAuggie = false;
        if (this.components.auggieIntegration) {
            this.components.auggieIntegration.disableAuggie();
        }
    }
    
    handleError(error) {
        console.error('❌ IT-ERA Enhanced AI Error:', error);
        
        this.trackEvent('system_error', {
            message: error.message,
            stack: error.stack,
            timestamp: Date.now()
        });
    }
    
    handleInitializationError(error) {
        console.error('❌ Initialization failed, falling back to basic mode');
        
        // Try to initialize basic functionality
        if (window.ITERA_AI) {
            this.components.aiConfig = window.ITERA_AI;
        }
        
        this.initialized = true; // Mark as initialized even in fallback mode
    }
}

// Initialize the enhanced AI system
window.ITERAEnhancedAI = new ITERAEnhancedAI();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ITERAEnhancedAI;
}

console.log('🧠 IT-ERA Enhanced AI System loaded');
