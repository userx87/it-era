/**
 * IT-ERA Enhanced AI System Tests
 * Comprehensive test suite for all AI components
 */

class ITERAISystemTests {
    constructor() {
        this.testResults = [];
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;
    }
    
    async runAllTests() {
        console.log('🧪 Starting IT-ERA AI System Tests...');
        
        // Component initialization tests
        await this.testComponentInitialization();
        
        // AI Configuration tests
        await this.testAIConfiguration();
        
        // Urgency detection tests
        await this.testUrgencyDetection();
        
        // Sector personalization tests
        await this.testSectorPersonalization();
        
        // Analytics system tests
        await this.testAnalyticsSystem();
        
        // Chatbot UX tests
        await this.testChatbotUX();
        
        // Auggie integration tests
        await this.testAuggieIntegration();
        
        // Performance tests
        await this.testPerformance();
        
        // Error handling tests
        await this.testErrorHandling();
        
        this.generateReport();
    }
    
    async testComponentInitialization() {
        console.log('📦 Testing Component Initialization...');
        
        // Test AI Config
        this.test('AI Config Loaded', () => {
            return window.ITERA_AI !== undefined;
        });
        
        // Test Enhanced AI System
        this.test('Enhanced AI System Loaded', () => {
            return window.ITERA_AI_ENHANCED !== undefined;
        });
        
        // Test Analytics
        this.test('Analytics System Loaded', () => {
            return window.ITERAAnalytics !== undefined;
        });
        
        // Test Sector Personalization
        this.test('Sector Personalization Loaded', () => {
            return window.ITERASectorPersonalization !== undefined;
        });
        
        // Test Auggie Integration
        this.test('Auggie Integration Loaded', () => {
            return window.ITERAuggieIntegration !== undefined;
        });
        
        // Test System Status
        this.test('System Initialized', () => {
            return window.ITERA_AI_ENHANCED?.initialized() === true;
        });
    }
    
    async testAIConfiguration() {
        console.log('🧠 Testing AI Configuration...');
        
        // Test API key security
        this.test('API Key Security', () => {
            const config = window.ITERA_AI;
            return config && typeof config.getSecureApiKey === 'function';
        });
        
        // Test performance config
        this.test('Performance Config', () => {
            const config = window.ITERA_AI;
            return config && config.performanceConfig && 
                   config.performanceConfig.maxRetries > 0;
        });
        
        // Test cache functionality
        this.test('Response Cache', () => {
            const config = window.ITERA_AI;
            return config && config.responseCache instanceof Map;
        });
        
        // Test fallback responses
        this.test('Fallback Responses', () => {
            const config = window.ITERA_AI;
            const fallback = config.getFallbackResponse('timeout');
            return fallback && fallback.includes('039 888 2041');
        });
    }
    
    async testUrgencyDetection() {
        console.log('🚨 Testing Urgency Detection...');
        
        const testCases = [
            { message: 'EMERGENZA! Server completamente down!', expectedLevel: 'critical' },
            { message: 'Urgente: problema con email', expectedLevel: 'high' },
            { message: 'Abbiamo un piccolo problema', expectedLevel: 'medium' },
            { message: 'Vorrei informazioni sui servizi', expectedLevel: 'low' }
        ];
        
        testCases.forEach((testCase, index) => {
            this.test(`Urgency Detection ${index + 1}`, () => {
                const result = window.ITERA_AI.detectUrgency(testCase.message);
                return result.level === testCase.expectedLevel;
            });
        });
        
        // Test time factors
        this.test('Time Factor Calculation', () => {
            const config = window.ITERA_AI.urgencyConfig;
            return config && config.timeFactors && 
                   config.timeFactors.outOfHours > 1;
        });
        
        // Test sector multipliers
        this.test('Sector Multipliers', () => {
            const config = window.ITERA_AI.urgencyConfig;
            return config && config.sectorMultipliers && 
                   config.sectorMultipliers.medical > config.sectorMultipliers.general;
        });
    }
    
    async testSectorPersonalization() {
        console.log('🎯 Testing Sector Personalization...');
        
        const testCases = [
            { message: 'Backup cartelle cliniche pazienti', expectedSector: 'medical' },
            { message: 'Sicurezza documenti studio legale', expectedSector: 'legal' },
            { message: 'Assistenza IT aziendale generale', expectedSector: 'general' }
        ];
        
        testCases.forEach((testCase, index) => {
            this.test(`Sector Detection ${index + 1}`, () => {
                const result = window.ITERASectorPersonalization.detectSector(testCase.message);
                return result.sector === testCase.expectedSector;
            });
        });
        
        // Test personalization
        this.test('Response Personalization', () => {
            const personalization = window.ITERASectorPersonalization;
            const response = personalization.personalizeResponse(
                'Test response', 
                'medical', 
                { urgencyLevel: 'high' }
            );
            return response.includes('GDPR') || response.includes('sanitario');
        });
        
        // Test risk calculation
        this.test('Risk Score Calculation', () => {
            const personalization = window.ITERASectorPersonalization;
            const risk = personalization.calculateRiskScore(
                'Dati pazienti persi', 
                'medical', 
                { score: 5 }
            );
            return risk.score > 5; // Should be higher due to medical sector
        });
    }
    
    async testAnalyticsSystem() {
        console.log('📊 Testing Analytics System...');
        
        // Test event tracking
        this.test('Event Tracking', () => {
            const analytics = window.ITERAAnalytics;
            const initialEvents = analytics.storage.events.length;
            analytics.trackEvent('test_event', { test: true });
            return analytics.storage.events.length > initialEvents;
        });
        
        // Test metrics
        this.test('Metrics Generation', () => {
            const analytics = window.ITERAAnalytics;
            const metrics = analytics.getMetrics();
            return metrics && typeof metrics.totalConversations === 'number';
        });
        
        // Test insights
        this.test('Insights Generation', () => {
            const analytics = window.ITERAAnalytics;
            const insights = analytics.generateInsights();
            return insights && insights.realTime;
        });
        
        // Test data export
        this.test('Data Export', () => {
            const analytics = window.ITERAAnalytics;
            const exported = analytics.exportData();
            return exported && exported.includes('metrics');
        });
    }
    
    async testChatbotUX() {
        console.log('💬 Testing Chatbot UX...');
        
        // Test typing indicator
        this.test('Typing Indicator', () => {
            const chatbot = window.ITERASmartChatbot;
            if (!chatbot) return false;
            
            chatbot.showTypingIndicator();
            const indicator = document.getElementById('typing-indicator');
            chatbot.hideTypingIndicator();
            
            return indicator !== null;
        });
        
        // Test message formatting
        this.test('Message Formatting', () => {
            const chatbot = window.ITERASmartChatbot;
            if (!chatbot) return false;
            
            const formatted = chatbot.formatMessage('Call 039 888 2041 or email info@it-era.it');
            return formatted.includes('<a href="tel:') && formatted.includes('<a href="mailto:');
        });
        
        // Test emergency widget
        this.test('Emergency Widget', () => {
            const chatbot = window.ITERASmartChatbot;
            if (!chatbot) return false;
            
            chatbot.showEmergencyContact();
            const widget = document.querySelector('.emergency-contact-widget');
            
            // Cleanup
            if (widget) widget.remove();
            
            return widget !== null;
        });
    }
    
    async testAuggieIntegration() {
        console.log('🤖 Testing Auggie Integration...');
        
        // Test integration status
        this.test('Auggie Integration Status', () => {
            const auggie = window.ITERAuggieIntegration;
            return auggie && typeof auggie.getStatus === 'function';
        });
        
        // Test routing rules
        this.test('Routing Rules', () => {
            const auggie = window.ITERAuggieIntegration;
            return auggie && auggie.routingRules && 
                   Object.keys(auggie.routingRules).length > 0;
        });
        
        // Test fallback mechanism
        this.test('Fallback Mechanism', () => {
            const auggie = window.ITERAuggieIntegration;
            const shouldUseAuggie = auggie.shouldUseAuggie([
                { content: 'analisi codice sistema' }
            ]);
            return typeof shouldUseAuggie === 'boolean';
        });
    }
    
    async testPerformance() {
        console.log('⚡ Testing Performance...');
        
        // Test response time
        await this.asyncTest('AI Response Time', async () => {
            const startTime = performance.now();
            
            try {
                await window.ITERA_AI_ENHANCED.chat('Test message');
                const responseTime = performance.now() - startTime;
                return responseTime < 5000; // Should respond within 5 seconds
            } catch (error) {
                // Even errors should be fast
                const responseTime = performance.now() - startTime;
                return responseTime < 2000;
            }
        });
        
        // Test cache performance
        this.test('Cache Performance', () => {
            const ai = window.ITERA_AI;
            const cacheKey = ai.generateCacheKey([{ content: 'test' }], {});
            return typeof cacheKey === 'string' && cacheKey.length > 0;
        });
        
        // Test memory usage
        this.test('Memory Usage', () => {
            const enhanced = window.ITERA_AI_ENHANCED;
            const memoryUsage = enhanced.getMemoryUsage();
            return memoryUsage === null || memoryUsage.used > 0;
        });
    }
    
    async testErrorHandling() {
        console.log('🛡️ Testing Error Handling...');
        
        // Test API error handling
        await this.asyncTest('API Error Handling', async () => {
            const ai = window.ITERA_AI;
            
            // Simulate API error by using invalid options
            try {
                await ai.callOpenAI([], { model: 'invalid-model' });
                return false; // Should have thrown an error
            } catch (error) {
                // Should return fallback response
                return true;
            }
        });
        
        // Test timeout handling
        this.test('Timeout Configuration', () => {
            const ai = window.ITERA_AI;
            return ai.performanceConfig.timeout > 0;
        });
        
        // Test error tracking
        this.test('Error Tracking', () => {
            const enhanced = window.ITERA_AI_ENHANCED;
            enhanced.handleError(new Error('Test error'));
            
            // Should track error in analytics
            const analytics = window.ITERAAnalytics;
            const recentEvents = analytics.storage.events.filter(e => 
                e.type === 'system_error' && 
                Date.now() - e.timestamp < 1000
            );
            
            return recentEvents.length > 0;
        });
    }
    
    // Test utilities
    test(name, testFunction) {
        this.totalTests++;
        
        try {
            const result = testFunction();
            if (result) {
                this.passedTests++;
                this.testResults.push({ name, status: 'PASS', error: null });
                console.log(`✅ ${name}`);
            } else {
                this.failedTests++;
                this.testResults.push({ name, status: 'FAIL', error: 'Test returned false' });
                console.log(`❌ ${name}`);
            }
        } catch (error) {
            this.failedTests++;
            this.testResults.push({ name, status: 'ERROR', error: error.message });
            console.log(`💥 ${name}: ${error.message}`);
        }
    }
    
    async asyncTest(name, testFunction) {
        this.totalTests++;
        
        try {
            const result = await testFunction();
            if (result) {
                this.passedTests++;
                this.testResults.push({ name, status: 'PASS', error: null });
                console.log(`✅ ${name}`);
            } else {
                this.failedTests++;
                this.testResults.push({ name, status: 'FAIL', error: 'Test returned false' });
                console.log(`❌ ${name}`);
            }
        } catch (error) {
            this.failedTests++;
            this.testResults.push({ name, status: 'ERROR', error: error.message });
            console.log(`💥 ${name}: ${error.message}`);
        }
    }
    
    generateReport() {
        console.log('\n📋 TEST REPORT');
        console.log('================');
        console.log(`Total Tests: ${this.totalTests}`);
        console.log(`Passed: ${this.passedTests} (${Math.round(this.passedTests/this.totalTests*100)}%)`);
        console.log(`Failed: ${this.failedTests} (${Math.round(this.failedTests/this.totalTests*100)}%)`);
        
        if (this.failedTests > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.testResults
                .filter(test => test.status !== 'PASS')
                .forEach(test => {
                    console.log(`- ${test.name}: ${test.error || 'Failed'}`);
                });
        }
        
        console.log('\n🎯 OVERALL RESULT:', this.failedTests === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
        
        // Store results globally for access
        window.ITERA_TEST_RESULTS = {
            total: this.totalTests,
            passed: this.passedTests,
            failed: this.failedTests,
            results: this.testResults,
            success: this.failedTests === 0
        };
    }
}

// Auto-run tests when loaded
if (typeof window !== 'undefined') {
    window.ITERAISystemTests = ITERAISystemTests;
    
    // Run tests after system initialization
    setTimeout(async () => {
        const tester = new ITERAISystemTests();
        await tester.runAllTests();
    }, 3000); // Wait 3 seconds for system to initialize
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ITERAISystemTests;
}
