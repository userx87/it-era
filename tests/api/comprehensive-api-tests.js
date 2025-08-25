/**
 * IT-ERA Comprehensive API Testing Suite
 * Tests all API endpoints, authentication, performance, and reliability
 */

const puppeteer = require('puppeteer');
const crypto = require('crypto');

const API_TEST_CONFIG = {
    chatbotAPI: 'https://it-era-chatbot-prod.bulltech.workers.dev/api/chat',
    emailAPI: 'https://it-era-email.bulltech.workers.dev/api/contact',
    adminAPI: 'https://it-era-admin.bulltech.workers.dev/api',
    timeout: 15000,
    retryAttempts: 3,
    loadTestDuration: 60000, // 1 minute
    concurrentUsers: 10
};

class ComprehensiveAPITester {
    constructor() {
        this.testResults = {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            performance: [],
            errors: [],
            reliability: {
                uptime: 0,
                errorRate: 0,
                averageResponseTime: 0
            }
        };
    }

    async runFullAPITestSuite() {
        try {
            console.log('🚀 Starting comprehensive API test suite...');
            
            await this.testChatbotAPIEndpoints();
            await this.testEmailAPIEndpoints();
            await this.testAdminAPIEndpoints();
            await this.testAPIAuthentication();
            await this.testAPIPerformance();
            await this.testAPIReliability();
            await this.testAPIErrorHandling();
            await this.testAPIRateLimiting();
            await this.testAPIDataValidation();
            await this.testAPISecurityHeaders();
            
            await this.generateAPITestReport();
            
        } catch (error) {
            console.error('❌ API test suite failed:', error);
        }
    }

    async testChatbotAPIEndpoints() {
        console.log('🤖 Testing Chatbot API endpoints...');
        
        // Test start conversation
        await this.testEndpoint('POST', API_TEST_CONFIG.chatbotAPI, {
            action: 'start',
            page: '/test'
        }, 'Chatbot Start Conversation', {
            expectedStatus: 200,
            expectedFields: ['success', 'sessionId', 'response']
        });

        // Test message sending
        const sessionId = 'test-' + crypto.randomBytes(8).toString('hex');
        await this.testEndpoint('POST', API_TEST_CONFIG.chatbotAPI, {
            action: 'message',
            message: 'Ciao, ho bisogno di assistenza IT',
            sessionId: sessionId
        }, 'Chatbot Send Message', {
            expectedStatus: 200,
            expectedFields: ['success', 'response', 'options']
        });

        // Test emergency detection
        await this.testEndpoint('POST', API_TEST_CONFIG.chatbotAPI, {
            action: 'message',
            message: 'EMERGENZA! Il server è down e stiamo perdendo soldi!',
            sessionId: sessionId
        }, 'Chatbot Emergency Detection', {
            expectedStatus: 200,
            expectedFields: ['success', 'emergency', 'escalate'],
            customValidation: (response) => {
                return response.emergency === true || response.escalate === true;
            }
        });

        // Test escalation
        await this.testEndpoint('POST', API_TEST_CONFIG.chatbotAPI, {
            action: 'escalate',
            sessionId: sessionId,
            leadData: {
                contact_name: 'Test User',
                email: 'test@example.com',
                company_name: 'Test Company'
            }
        }, 'Chatbot Escalation', {
            expectedStatus: 200,
            expectedFields: ['success', 'message']
        });

        // Test health check
        await this.testEndpoint('GET', API_TEST_CONFIG.chatbotAPI.replace('/api/chat', '/health'), null, 'Chatbot Health Check', {
            expectedStatus: 200,
            expectedFields: ['status', 'service', 'ai']
        });

        // Test analytics endpoint
        await this.testEndpoint('GET', API_TEST_CONFIG.chatbotAPI.replace('/api/chat', '/analytics'), null, 'Chatbot Analytics', {
            expectedStatus: 200,
            expectedFields: ['success', 'analytics']
        });
    }

    async testEmailAPIEndpoints() {
        console.log('📧 Testing Email API endpoints...');
        
        // Test contact form submission
        await this.testEndpoint('POST', API_TEST_CONFIG.emailAPI, {
            nome: 'Test User',
            email: 'test@example.com',
            telefono: '0123456789',
            azienda: 'Test Company',
            messaggio: 'Test message for API testing',
            servizi: ['assistenza-it'],
            privacy: true,
            formType: 'api-test'
        }, 'Email Contact Form', {
            expectedStatus: 200,
            expectedFields: ['success', 'emailId']
        });

        // Test email with missing required fields
        await this.testEndpoint('POST', API_TEST_CONFIG.emailAPI, {
            nome: 'Test User',
            // Missing email and message
            privacy: true
        }, 'Email Validation Test', {
            expectedStatus: 400,
            expectedError: true
        });

        // Test email with invalid email format
        await this.testEndpoint('POST', API_TEST_CONFIG.emailAPI, {
            nome: 'Test User',
            email: 'invalid-email-format',
            messaggio: 'Test message',
            privacy: true
        }, 'Email Format Validation', {
            expectedStatus: 400,
            expectedError: true
        });
    }

    async testAdminAPIEndpoints() {
        console.log('👨‍💼 Testing Admin API endpoints...');
        
        // Test admin dashboard (should require auth)
        await this.testEndpoint('GET', API_TEST_CONFIG.adminAPI + '/dashboard', null, 'Admin Dashboard Access', {
            expectedStatus: 401, // Should be unauthorized without auth
            expectedError: true
        });

        // Test admin login
        await this.testEndpoint('POST', API_TEST_CONFIG.adminAPI + '/auth/login', {
            username: 'test-user',
            password: 'test-password'
        }, 'Admin Login Test', {
            expectedStatus: [200, 401], // Either success or invalid credentials
            allowMultipleStatuses: true
        });

        // Test admin stats endpoint
        await this.testEndpoint('GET', API_TEST_CONFIG.adminAPI + '/stats', null, 'Admin Stats', {
            expectedStatus: [200, 401],
            allowMultipleStatuses: true
        });
    }

    async testAPIAuthentication() {
        console.log('🔐 Testing API authentication mechanisms...');
        
        const authTests = [
            // Test without token
            {
                endpoint: API_TEST_CONFIG.adminAPI + '/users',
                headers: {},
                expectedStatus: 401,
                testName: 'No Auth Token'
            },
            // Test with invalid token
            {
                endpoint: API_TEST_CONFIG.adminAPI + '/users',
                headers: { 'Authorization': 'Bearer invalid-token' },
                expectedStatus: 401,
                testName: 'Invalid Auth Token'
            },
            // Test with malformed token
            {
                endpoint: API_TEST_CONFIG.adminAPI + '/users',
                headers: { 'Authorization': 'InvalidFormat' },
                expectedStatus: 401,
                testName: 'Malformed Auth Header'
            }
        ];

        for (const test of authTests) {
            await this.testEndpoint('GET', test.endpoint, null, `Authentication: ${test.testName}`, {
                expectedStatus: test.expectedStatus,
                headers: test.headers,
                expectedError: true
            });
        }
    }

    async testAPIPerformance() {
        console.log('⚡ Testing API performance...');
        
        const performanceTests = [
            {
                name: 'Chatbot Response Time',
                endpoint: API_TEST_CONFIG.chatbotAPI,
                method: 'POST',
                body: { action: 'start' },
                maxResponseTime: 3000 // 3 seconds
            },
            {
                name: 'Email Submission Performance',
                endpoint: API_TEST_CONFIG.emailAPI,
                method: 'POST',
                body: {
                    nome: 'Performance Test',
                    email: 'perf@test.com',
                    messaggio: 'Performance testing',
                    privacy: true
                },
                maxResponseTime: 5000 // 5 seconds
            },
            {
                name: 'Health Check Performance',
                endpoint: API_TEST_CONFIG.chatbotAPI.replace('/api/chat', '/health'),
                method: 'GET',
                body: null,
                maxResponseTime: 1000 // 1 second
            }
        ];

        for (const test of performanceTests) {
            const startTime = Date.now();
            
            try {
                const response = await this.makeRequest(test.method, test.endpoint, test.body);
                const responseTime = Date.now() - startTime;
                
                this.testResults.performance.push({
                    testName: test.name,
                    responseTime,
                    passed: responseTime <= test.maxResponseTime,
                    threshold: test.maxResponseTime
                });
                
                if (responseTime <= test.maxResponseTime) {
                    this.recordTestResult(true, `${test.name}: ${responseTime}ms`);
                } else {
                    this.recordTestResult(false, `${test.name}: ${responseTime}ms (exceeds ${test.maxResponseTime}ms)`);
                }
                
            } catch (error) {
                this.recordTestResult(false, `${test.name}: Error - ${error.message}`);
            }
        }
    }

    async testAPIReliability() {
        console.log('🔄 Testing API reliability with load...');
        
        const reliabilityTest = {
            endpoint: API_TEST_CONFIG.chatbotAPI,
            concurrent: 5,
            duration: 30000, // 30 seconds
            requestInterval: 1000 // 1 request per second per thread
        };

        const startTime = Date.now();
        const results = [];
        const promises = [];

        // Start concurrent test threads
        for (let i = 0; i < reliabilityTest.concurrent; i++) {
            promises.push(this.runReliabilityThread(i, reliabilityTest, results));
        }

        await Promise.all(promises);

        // Calculate reliability metrics
        const totalRequests = results.length;
        const successfulRequests = results.filter(r => r.success).length;
        const totalResponseTime = results.reduce((sum, r) => sum + (r.responseTime || 0), 0);

        this.testResults.reliability = {
            uptime: (successfulRequests / totalRequests) * 100,
            errorRate: ((totalRequests - successfulRequests) / totalRequests) * 100,
            averageResponseTime: totalResponseTime / totalRequests,
            totalRequests,
            successfulRequests,
            duration: Date.now() - startTime
        };

        this.recordTestResult(
            this.testResults.reliability.uptime >= 95,
            `Reliability Test: ${this.testResults.reliability.uptime.toFixed(2)}% uptime`
        );
    }

    async runReliabilityThread(threadId, config, results) {
        const endTime = Date.now() + config.duration;
        let requestCount = 0;

        while (Date.now() < endTime) {
            const startTime = Date.now();
            
            try {
                await this.makeRequest('POST', config.endpoint, {
                    action: 'message',
                    message: `Reliability test thread ${threadId} request ${requestCount}`,
                    sessionId: `reliability-${threadId}-${requestCount}`
                });
                
                results.push({
                    threadId,
                    requestCount,
                    success: true,
                    responseTime: Date.now() - startTime
                });
                
            } catch (error) {
                results.push({
                    threadId,
                    requestCount,
                    success: false,
                    error: error.message,
                    responseTime: Date.now() - startTime
                });
            }
            
            requestCount++;
            await this.delay(config.requestInterval);
        }
    }

    async testAPIErrorHandling() {
        console.log('🚨 Testing API error handling...');
        
        const errorTests = [
            // Malformed JSON
            {
                name: 'Malformed JSON',
                endpoint: API_TEST_CONFIG.chatbotAPI,
                body: '{"invalid": json}',
                expectedStatus: 400
            },
            // Missing Content-Type
            {
                name: 'Missing Content-Type',
                endpoint: API_TEST_CONFIG.chatbotAPI,
                body: { action: 'start' },
                headers: { 'Content-Type': 'text/plain' },
                expectedStatus: 400
            },
            // Oversized payload
            {
                name: 'Oversized Payload',
                endpoint: API_TEST_CONFIG.chatbotAPI,
                body: {
                    action: 'message',
                    message: 'A'.repeat(10000) // Very long message
                },
                expectedStatus: [400, 413] // Bad request or payload too large
            },
            // Invalid action
            {
                name: 'Invalid Action',
                endpoint: API_TEST_CONFIG.chatbotAPI,
                body: { action: 'invalid_action' },
                expectedStatus: 400
            }
        ];

        for (const test of errorTests) {
            try {
                const response = await this.makeRequest('POST', test.endpoint, test.body, test.headers);
                const passed = Array.isArray(test.expectedStatus) ? 
                    test.expectedStatus.includes(response.status) :
                    response.status === test.expectedStatus;
                
                this.recordTestResult(passed, `Error Handling: ${test.name}`);
                
            } catch (error) {
                // Error is expected for these tests
                this.recordTestResult(true, `Error Handling: ${test.name} (properly rejected)`);
            }
        }
    }

    async testAPIRateLimiting() {
        console.log('🚦 Testing API rate limiting...');
        
        const rapidRequests = [];
        const testMessage = 'Rate limit test';
        
        // Send 20 rapid requests
        for (let i = 0; i < 20; i++) {
            rapidRequests.push(
                this.makeRequest('POST', API_TEST_CONFIG.chatbotAPI, {
                    action: 'message',
                    message: testMessage + ' ' + i,
                    sessionId: 'rate-test-' + i
                }).catch(error => ({
                    error: true,
                    status: error.status || 0,
                    message: error.message
                }))
            );
        }

        const results = await Promise.all(rapidRequests);
        const rateLimitedRequests = results.filter(r => r.status === 429 || r.error).length;
        const successfulRequests = results.filter(r => !r.error).length;

        // Rate limiting should kick in for rapid requests
        const rateLimitingWorking = rateLimitedRequests > 0 || successfulRequests < 15;
        
        this.recordTestResult(
            rateLimitingWorking,
            `Rate Limiting: ${successfulRequests}/20 requests succeeded, ${rateLimitedRequests} rate limited`
        );
    }

    async testAPIDataValidation() {
        console.log('✅ Testing API data validation...');
        
        const validationTests = [
            // Email API validation
            {
                name: 'Email - Missing Required Fields',
                endpoint: API_TEST_CONFIG.emailAPI,
                body: { nome: 'Test' }, // Missing email, message, privacy
                expectedStatus: 400
            },
            {
                name: 'Email - Invalid Email Format',
                endpoint: API_TEST_CONFIG.emailAPI,
                body: {
                    nome: 'Test',
                    email: 'invalid-email',
                    messaggio: 'Test',
                    privacy: true
                },
                expectedStatus: 400
            },
            {
                name: 'Email - Invalid Phone Format',
                endpoint: API_TEST_CONFIG.emailAPI,
                body: {
                    nome: 'Test',
                    email: 'test@example.com',
                    telefono: 'invalid-phone',
                    messaggio: 'Test',
                    privacy: true
                },
                expectedStatus: [200, 400] // May accept or reject invalid phone
            },
            // Chatbot API validation
            {
                name: 'Chatbot - Missing Action',
                endpoint: API_TEST_CONFIG.chatbotAPI,
                body: { message: 'Test' }, // Missing action
                expectedStatus: 400
            },
            {
                name: 'Chatbot - Invalid Session ID Format',
                endpoint: API_TEST_CONFIG.chatbotAPI,
                body: {
                    action: 'message',
                    message: 'Test',
                    sessionId: '<script>alert("xss")</script>'
                },
                expectedStatus: [200, 400] // Should sanitize or reject
            }
        ];

        for (const test of validationTests) {
            try {
                const response = await this.makeRequest('POST', test.endpoint, test.body);
                
                const expectedStatuses = Array.isArray(test.expectedStatus) ? test.expectedStatus : [test.expectedStatus];
                const passed = expectedStatuses.includes(response.status);
                
                this.recordTestResult(passed, `Data Validation: ${test.name}`);
                
            } catch (error) {
                // Validation errors are expected
                this.recordTestResult(true, `Data Validation: ${test.name} (properly rejected)`);
            }
        }
    }

    async testAPISecurityHeaders() {
        console.log('🔒 Testing API security headers...');
        
        const endpoints = [
            API_TEST_CONFIG.chatbotAPI,
            API_TEST_CONFIG.emailAPI,
            API_TEST_CONFIG.adminAPI + '/dashboard'
        ];

        const requiredHeaders = [
            'X-Frame-Options',
            'X-Content-Type-Options',
            'X-XSS-Protection'
        ];

        const recommendedHeaders = [
            'Strict-Transport-Security',
            'Content-Security-Policy',
            'Referrer-Policy'
        ];

        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint, { method: 'OPTIONS' });
                const headers = response.headers;
                
                let securityScore = 0;
                const missingHeaders = [];
                
                // Check required headers
                for (const header of requiredHeaders) {
                    if (headers.has(header.toLowerCase())) {
                        securityScore += 2;
                    } else {
                        missingHeaders.push(header);
                    }
                }
                
                // Check recommended headers
                for (const header of recommendedHeaders) {
                    if (headers.has(header.toLowerCase())) {
                        securityScore += 1;
                    }
                }
                
                const maxScore = requiredHeaders.length * 2 + recommendedHeaders.length;
                const passed = securityScore >= maxScore * 0.6; // 60% threshold
                
                this.recordTestResult(
                    passed,
                    `Security Headers for ${endpoint}: ${securityScore}/${maxScore} (Missing: ${missingHeaders.join(', ') || 'None'})`
                );
                
            } catch (error) {
                this.recordTestResult(false, `Security Headers Test Failed for ${endpoint}: ${error.message}`);
            }
        }
    }

    // Helper methods
    async testEndpoint(method, url, body, testName, options = {}) {
        const startTime = Date.now();
        
        try {
            const response = await this.makeRequest(method, url, body, options.headers);
            const responseTime = Date.now() - startTime;
            
            let passed = true;
            const issues = [];
            
            // Check status code
            if (options.expectedStatus) {
                const expectedStatuses = Array.isArray(options.expectedStatus) ? options.expectedStatus : [options.expectedStatus];
                if (!expectedStatuses.includes(response.status)) {
                    passed = false;
                    issues.push(`Expected status ${options.expectedStatus}, got ${response.status}`);
                }
            }
            
            // Check expected fields
            if (options.expectedFields && response.data) {
                for (const field of options.expectedFields) {
                    if (!(field in response.data)) {
                        passed = false;
                        issues.push(`Missing field: ${field}`);
                    }
                }
            }
            
            // Custom validation
            if (options.customValidation && response.data) {
                if (!options.customValidation(response.data)) {
                    passed = false;
                    issues.push('Custom validation failed');
                }
            }
            
            // Check for expected errors
            if (options.expectedError && response.status < 400) {
                passed = false;
                issues.push('Expected error but got success');
            }
            
            this.recordTestResult(
                passed,
                `${testName}: ${responseTime}ms${issues.length ? ' - ' + issues.join(', ') : ''}`
            );
            
            return response;
            
        } catch (error) {
            const responseTime = Date.now() - startTime;
            
            if (options.expectedError) {
                this.recordTestResult(true, `${testName}: Expected error caught - ${error.message}`);
            } else {
                this.recordTestResult(false, `${testName}: Error - ${error.message} (${responseTime}ms)`);
            }
            
            throw error;
        }
    }

    async makeRequest(method, url, body, headers = {}) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        if (body && method !== 'GET') {
            options.body = typeof body === 'string' ? body : JSON.stringify(body);
        }

        const response = await fetch(url, options);
        
        let data = null;
        try {
            const text = await response.text();
            if (text) {
                data = JSON.parse(text);
            }
        } catch (e) {
            // Response might not be JSON
        }

        return {
            status: response.status,
            headers: response.headers,
            data
        };
    }

    recordTestResult(passed, message) {
        this.testResults.totalTests++;
        
        if (passed) {
            this.testResults.passedTests++;
            console.log(`✅ ${message}`);
        } else {
            this.testResults.failedTests++;
            console.log(`❌ ${message}`);
            this.testResults.errors.push(message);
        }
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async generateAPITestReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: this.testResults,
            testConfiguration: API_TEST_CONFIG,
            recommendations: this.generateRecommendations()
        };

        // Ensure reports directory exists
        require('fs').mkdirSync('/Users/andreapanzeri/progetti/IT-ERA/tests/reports', { recursive: true });
        
        // Save report
        require('fs').writeFileSync(
            '/Users/andreapanzeri/progetti/IT-ERA/tests/reports/comprehensive-api-test-report.json',
            JSON.stringify(report, null, 2)
        );

        console.log('\n🔍 COMPREHENSIVE API TEST REPORT');
        console.log('==================================');
        console.log(`Total Tests: ${this.testResults.totalTests}`);
        console.log(`Passed: ${this.testResults.passedTests}`);
        console.log(`Failed: ${this.testResults.failedTests}`);
        console.log(`Success Rate: ${((this.testResults.passedTests / this.testResults.totalTests) * 100).toFixed(1)}%`);
        
        if (this.testResults.reliability.uptime) {
            console.log(`\n📊 Reliability Metrics:`);
            console.log(`Uptime: ${this.testResults.reliability.uptime.toFixed(2)}%`);
            console.log(`Error Rate: ${this.testResults.reliability.errorRate.toFixed(2)}%`);
            console.log(`Avg Response Time: ${this.testResults.reliability.averageResponseTime.toFixed(0)}ms`);
        }
        
        if (this.testResults.performance.length > 0) {
            console.log(`\n⚡ Performance Results:`);
            this.testResults.performance.forEach(perf => {
                const status = perf.passed ? '✅' : '❌';
                console.log(`${status} ${perf.testName}: ${perf.responseTime}ms (max: ${perf.threshold}ms)`);
            });
        }
        
        if (this.testResults.errors.length > 0) {
            console.log(`\n❌ Failed Tests:`);
            this.testResults.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }
        
        console.log(`\n📄 Detailed report saved: tests/reports/comprehensive-api-test-report.json`);
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (this.testResults.failedTests > 0) {
            recommendations.push('Address failed test cases before production deployment');
        }
        
        if (this.testResults.reliability.uptime < 95) {
            recommendations.push('Improve API reliability - uptime below 95%');
        }
        
        const slowTests = this.testResults.performance.filter(p => !p.passed);
        if (slowTests.length > 0) {
            recommendations.push('Optimize API performance for slow endpoints');
        }
        
        if (this.testResults.reliability.errorRate > 5) {
            recommendations.push('Investigate and reduce API error rate');
        }
        
        if (this.testResults.reliability.averageResponseTime > 2000) {
            recommendations.push('Improve overall API response times');
        }
        
        return recommendations;
    }
}

// Export for use in other test suites
module.exports = ComprehensiveAPITester;

// Run if called directly
if (require.main === module) {
    const tester = new ComprehensiveAPITester();
    tester.runFullAPITestSuite()
        .then(() => {
            console.log('✅ Comprehensive API testing completed');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ API testing failed:', error);
            process.exit(1);
        });
}