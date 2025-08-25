/**
 * IT-ERA Admin Panel - Frontend Integration Testing
 * 
 * Comprehensive testing script to validate all frontend-backend integrations
 * and ensure proper functionality.
 */

class IntegrationTester {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            warnings: 0,
            tests: []
        };
        
        this.config = {
            timeout: 10000, // 10 seconds
            retries: 3
        };
    }

    /**
     * Run all integration tests
     */
    async runAllTests() {
        console.info('=== IT-ERA Admin Panel Integration Tests ===');
        
        try {
            // Configuration tests
            await this.testConfiguration();
            
            // API endpoint tests
            await this.testAPIEndpoints();
            
            // Authentication flow tests
            await this.testAuthenticationFlow();
            
            // Error handling tests
            await this.testErrorHandling();
            
            // UI integration tests
            await this.testUIIntegration();
            
            // Performance tests
            await this.testPerformance();
            
        } catch (error) {
            this.logError('Critical test failure', error);
        }
        
        this.generateReport();
        return this.results;
    }

    /**
     * Test configuration setup
     */
    async testConfiguration() {
        await this.runTest('Config - API URLs defined', () => {
            this.assert(typeof CONFIG !== 'undefined', 'CONFIG object not found');
            this.assert(CONFIG.API_BASE_URL, 'API_BASE_URL not configured');
            this.assert(CONFIG.API_BASE_URL.includes('https://'), 'API_BASE_URL should use HTTPS');
            this.assert(CONFIG.API_BASE_URL === 'https://it-era-admin-auth-production.bulltech.workers.dev', 'API_BASE_URL should match backend URL');
        });

        await this.runTest('Config - Required services available', () => {
            this.assert(typeof tokenManager !== 'undefined', 'TokenManager not available');
            this.assert(typeof securityGuard !== 'undefined', 'SecurityGuard not available');
            this.assert(typeof notificationManager !== 'undefined', 'NotificationManager not available');
            this.assert(typeof apiManager !== 'undefined', 'APIManager not available');
        });

        await this.runTest('Config - Bootstrap and dependencies', () => {
            this.assert(typeof bootstrap !== 'undefined', 'Bootstrap not loaded');
            this.assert(document.querySelector('link[href*="bootstrap"]'), 'Bootstrap CSS not loaded');
            this.assert(document.querySelector('link[href*="font-awesome"]'), 'FontAwesome CSS not loaded');
        });
    }

    /**
     * Test API endpoints configuration
     */
    async testAPIEndpoints() {
        await this.runTest('API - Endpoint URL construction', () => {
            // Test various endpoint constructions
            const testEndpoints = [
                '/admin/api/auth/login',
                '/admin/api/dashboard',
                '/admin/api/posts',
                '/admin/api/users'
            ];

            testEndpoints.forEach(endpoint => {
                const fullUrl = CONFIG.API_BASE_URL + endpoint;
                this.assert(fullUrl.startsWith('https://'), `Endpoint ${endpoint} should use HTTPS`);
                this.assert(!fullUrl.includes('undefined'), `Endpoint ${endpoint} construction failed`);
            });
        });

        await this.runTest('API - Authentication headers', () => {
            const headers = tokenManager.getAuthHeaders();
            this.assert(typeof headers === 'object', 'Auth headers should be an object');
            this.assert(headers['Content-Type'], 'Content-Type header should be set');
        });

        await this.runTest('API - Error handling setup', () => {
            this.assert(typeof handleAPIError === 'function', 'handleAPIError function not available');
            this.assert(typeof showLoading === 'function', 'showLoading function not available');
            this.assert(typeof hideLoading === 'function', 'hideLoading function not available');
        });
    }

    /**
     * Test authentication flow
     */
    async testAuthenticationFlow() {
        await this.runTest('Auth - Token manager initialization', () => {
            this.assert(tokenManager.encryptionKey, 'Encryption key should be generated');
            this.assert(typeof tokenManager.storeToken === 'function', 'storeToken method should exist');
            this.assert(typeof tokenManager.getToken === 'function', 'getToken method should exist');
        });

        await this.runTest('Auth - Security guard initialization', () => {
            this.assert(securityGuard.config, 'Security config should be available');
            this.assert(securityGuard.config.MAX_LOGIN_ATTEMPTS > 0, 'Login attempts limit should be set');
            this.assert(typeof securityGuard.makeSecureRequest === 'function', 'makeSecureRequest method should exist');
        });

        await this.runTest('Auth - JWT validation logic', () => {
            // Test JWT validation with dummy tokens
            const validJWT = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjo5OTk5OTk5OTk5fQ.5Y8oHSkjMa8fxKKXqSZbWNJ4dIcKawMAhJ_JRz3UZZU';
            const invalidJWT = 'invalid.jwt.token';

            this.assert(tokenManager.validateTokenStructure(validJWT), 'Valid JWT should pass validation');
            this.assert(!tokenManager.validateTokenStructure(invalidJWT), 'Invalid JWT should fail validation');
            this.assert(!tokenManager.validateTokenStructure(''), 'Empty token should fail validation');
        });
    }

    /**
     * Test error handling
     */
    async testErrorHandling() {
        await this.runTest('Error - Notification system', () => {
            this.assert(typeof notificationManager.showError === 'function', 'showError method should exist');
            this.assert(typeof notificationManager.showSuccess === 'function', 'showSuccess method should exist');
            this.assert(typeof notificationManager.handleApiError === 'function', 'handleApiError method should exist');
            
            // Test notification container creation
            const container = notificationManager.createNotificationContainer();
            this.assert(container && container.id === 'notificationContainer', 'Notification container should be created');
        });

        await this.runTest('Error - Global error handlers', () => {
            // Check if global error handlers are set up
            this.assert(window.addEventListener, 'Event listeners should be available');
            
            // Test error handling
            const testError = new Error('Test error message');
            const handledMessage = handleAPIError(testError, 'Test context');
            this.assert(typeof handledMessage === 'string', 'Error handler should return a message');
        });
    }

    /**
     * Test UI integration
     */
    async testUIIntegration() {
        await this.runTest('UI - Required DOM elements', () => {
            const requiredElements = [
                'authModal',
                'adminInterface',
                'dashboardSection',
                'postsSection',
                'mediaSection',
                'usersSection',
                'settingsSection'
            ];

            requiredElements.forEach(elementId => {
                const element = document.getElementById(elementId);
                this.assert(element, `Element ${elementId} should exist`);
            });
        });

        await this.runTest('UI - Navigation setup', () => {
            const navLinks = document.querySelectorAll('[data-section]');
            this.assert(navLinks.length > 0, 'Navigation links with data-section should exist');
            
            // Test section switching functionality
            this.assert(typeof showSection === 'function', 'showSection function should exist');
        });

        await this.runTest('UI - Form elements', () => {
            const loginForm = document.getElementById('loginForm');
            this.assert(loginForm, 'Login form should exist');
            
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            this.assert(emailInput && emailInput.type === 'email', 'Email input should exist and be of type email');
            this.assert(passwordInput && passwordInput.type === 'password', 'Password input should exist and be of type password');
        });
    }

    /**
     * Test performance
     */
    async testPerformance() {
        await this.runTest('Performance - Script loading', () => {
            const scripts = document.querySelectorAll('script[src]');
            this.assert(scripts.length > 0, 'Scripts should be loaded');
            
            // Check for duplicate script loading
            const scriptSources = Array.from(scripts).map(s => s.src);
            const uniqueSources = [...new Set(scriptSources)];
            this.assert(scriptSources.length === uniqueSources.length, 'No duplicate scripts should be loaded');
        });

        await this.runTest('Performance - Memory usage', () => {
            if (window.performance && window.performance.memory) {
                const memory = window.performance.memory;
                this.assert(memory.usedJSHeapSize < memory.jsHeapSizeLimit * 0.8, 'Memory usage should be reasonable');
            } else {
                this.warn('Performance memory API not available');
            }
        });

        await this.runTest('Performance - Load time', () => {
            if (window.performance && window.performance.timing) {
                const timing = window.performance.timing;
                const loadTime = timing.loadEventEnd - timing.navigationStart;
                this.assert(loadTime < 5000, 'Page load time should be under 5 seconds');
            } else {
                this.warn('Performance timing API not available');
            }
        });
    }

    /**
     * Run individual test
     */
    async runTest(testName, testFunction) {
        const startTime = performance.now();
        
        try {
            await Promise.race([
                Promise.resolve(testFunction()),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Test timeout')), this.config.timeout)
                )
            ]);
            
            const endTime = performance.now();
            const duration = Math.round(endTime - startTime);
            
            this.logPass(testName, duration);
            this.results.passed++;
            
        } catch (error) {
            this.logFail(testName, error);
            this.results.failed++;
        }
    }

    /**
     * Assert condition
     */
    assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }

    /**
     * Log warning
     */
    warn(message) {
        console.warn(`⚠️  ${message}`);
        this.results.warnings++;
    }

    /**
     * Log test pass
     */
    logPass(testName, duration = 0) {
        console.log(`✅ ${testName} ${duration ? `(${duration}ms)` : ''}`);
        this.results.tests.push({
            name: testName,
            status: 'passed',
            duration
        });
    }

    /**
     * Log test failure
     */
    logFail(testName, error) {
        console.error(`❌ ${testName}: ${error.message}`);
        this.results.tests.push({
            name: testName,
            status: 'failed',
            error: error.message
        });
    }

    /**
     * Log general error
     */
    logError(context, error) {
        console.error(`🚨 ${context}:`, error);
    }

    /**
     * Generate test report
     */
    generateReport() {
        console.log('\n=== Test Results Summary ===');
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`⚠️  Warnings: ${this.results.warnings}`);
        
        const totalTests = this.results.passed + this.results.failed;
        const successRate = totalTests > 0 ? ((this.results.passed / totalTests) * 100).toFixed(1) : 0;
        
        console.log(`📊 Success Rate: ${successRate}%`);
        
        if (this.results.failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.results.tests
                .filter(t => t.status === 'failed')
                .forEach(t => console.log(`   - ${t.name}: ${t.error}`));
        }
        
        if (successRate >= 90) {
            console.log('\n🎉 Integration tests completed successfully!');
        } else if (successRate >= 75) {
            console.log('\n⚠️  Integration tests completed with warnings');
        } else {
            console.log('\n🚨 Integration tests failed - critical issues found');
        }
        
        return this.results;
    }
}

// Global integration tester
window.integrationTester = new IntegrationTester();

// Auto-run tests when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a moment for all scripts to initialize
    setTimeout(() => {
        if (window.location.search.includes('test=true') || window.location.hash.includes('test')) {
            window.integrationTester.runAllTests();
        }
    }, 2000);
});

console.info('IntegrationTester: Frontend integration testing system loaded');