/**
 * IT-ERA Performance and Load Testing Suite
 * Comprehensive performance testing, load testing, and stress testing for all systems
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const PERFORMANCE_TEST_CONFIG = {
    targetURL: 'https://www.it-era.it',
    chatbotAPI: 'https://it-era-chatbot-prod.bulltech.workers.dev/api/chat',
    emailAPI: 'https://it-era-email.bulltech.workers.dev/api/contact',
    adminAPI: 'https://it-era-admin.bulltech.workers.dev/api',
    
    // Load testing parameters
    loadTest: {
        duration: 120000, // 2 minutes
        rampUpTime: 30000, // 30 seconds
        maxUsers: 50,
        requestInterval: 2000 // 2 seconds between requests
    },
    
    // Performance thresholds
    thresholds: {
        pageLoad: 3000, // 3 seconds
        apiResponse: 2000, // 2 seconds
        chatbotResponse: 5000, // 5 seconds
        emailSubmission: 10000, // 10 seconds
        firstContentfulPaint: 2000, // 2 seconds
        largestContentfulPaint: 4000, // 4 seconds
        cumulativeLayoutShift: 0.1,
        timeToInteractive: 5000 // 5 seconds
    }
};

class PerformanceLoadTester {
    constructor() {
        this.browser = null;
        this.testResults = {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            performanceMetrics: [],
            loadTestResults: [],
            webVitalsResults: [],
            stressTestResults: []
        };
        
        this.activeUsers = 0;
        this.totalRequests = 0;
        this.failedRequests = 0;
        this.responseTimes = [];
    }

    async runPerformanceTests() {
        try {
            console.log('⚡ Starting comprehensive performance and load testing...');
            
            await this.init();
            
            // Performance tests
            await this.testPageLoadPerformance();
            await this.testAPIPerformance();
            await this.testChatbotPerformance();
            await this.testWebVitalsMetrics();
            
            // Load tests
            await this.runLoadTest();
            await this.runStressTest();
            await this.testConcurrentUsers();
            
            // Specific performance scenarios
            await this.testMobilePerformance();
            await this.testSlowNetworkConditions();
            await this.testCacheEffectiveness();
            await this.testResourceOptimization();
            
            await this.generatePerformanceReport();
            
        } catch (error) {
            console.error('❌ Performance testing failed:', error);
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }

    async init() {
        this.browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security'
            ]
        });
        
        console.log('🚀 Performance tester initialized');
    }

    async testPageLoadPerformance() {
        console.log('📄 Testing page load performance...');
        
        const testPages = [
            { name: 'Homepage', url: PERFORMANCE_TEST_CONFIG.targetURL },
            { name: 'Services Page', url: PERFORMANCE_TEST_CONFIG.targetURL + '/pages/assistenza-it.html' },
            { name: 'Contact Page', url: PERFORMANCE_TEST_CONFIG.targetURL + '/pages/contatti.html' },
            { name: 'Cloud Storage', url: PERFORMANCE_TEST_CONFIG.targetURL + '/pages/cloud-storage.html' },
            { name: 'Security Page', url: PERFORMANCE_TEST_CONFIG.targetURL + '/pages/sicurezza-informatica.html' }
        ];

        for (const testPage of testPages) {
            const page = await this.browser.newPage();
            
            try {
                // Enable performance metrics
                await page.setCacheEnabled(false);
                
                const startTime = Date.now();
                
                // Navigate and measure load time
                const response = await page.goto(testPage.url, { 
                    waitUntil: 'networkidle2',
                    timeout: PERFORMANCE_TEST_CONFIG.thresholds.pageLoad + 5000
                });
                
                const loadTime = Date.now() - startTime;
                
                // Get performance metrics
                const performanceMetrics = await page.evaluate(() => {
                    return {
                        ...performance.getEntriesByType('navigation')[0],
                        ...performance.timing
                    };
                });

                // Calculate key metrics
                const metrics = {
                    pageName: testPage.name,
                    url: testPage.url,
                    totalLoadTime: loadTime,
                    domContentLoaded: performanceMetrics.domContentLoadedEventEnd - performanceMetrics.domContentLoadedEventStart,
                    firstPaint: performanceMetrics.responseEnd - performanceMetrics.requestStart,
                    domInteractive: performanceMetrics.domInteractive - performanceMetrics.requestStart,
                    resourcesLoaded: await page.$$eval('*', elements => elements.length),
                    responseStatus: response.status()
                };
                
                const passed = loadTime <= PERFORMANCE_TEST_CONFIG.thresholds.pageLoad && response.status() === 200;
                
                this.recordPerformanceTest(
                    passed,
                    `Page Load: ${testPage.name}`,
                    metrics,
                    PERFORMANCE_TEST_CONFIG.thresholds.pageLoad
                );
                
            } catch (error) {
                this.recordPerformanceTest(
                    false,
                    `Page Load: ${testPage.name}`,
                    { error: error.message, timeout: true },
                    PERFORMANCE_TEST_CONFIG.thresholds.pageLoad
                );
            } finally {
                await page.close();
            }
        }
    }

    async testAPIPerformance() {
        console.log('🔌 Testing API performance...');
        
        const apiEndpoints = [
            {
                name: 'Chatbot Health Check',
                method: 'GET',
                url: PERFORMANCE_TEST_CONFIG.chatbotAPI.replace('/api/chat', '/health'),
                threshold: PERFORMANCE_TEST_CONFIG.thresholds.apiResponse
            },
            {
                name: 'Chatbot Start',
                method: 'POST',
                url: PERFORMANCE_TEST_CONFIG.chatbotAPI,
                body: { action: 'start' },
                threshold: PERFORMANCE_TEST_CONFIG.thresholds.chatbotResponse
            },
            {
                name: 'Email Contact Form',
                method: 'POST',
                url: PERFORMANCE_TEST_CONFIG.emailAPI,
                body: {
                    nome: 'Performance Test',
                    email: 'perf-test@example.com',
                    messaggio: 'Performance testing message',
                    privacy: true
                },
                threshold: PERFORMANCE_TEST_CONFIG.thresholds.emailSubmission
            }
        ];

        for (const endpoint of apiEndpoints) {
            const testResults = [];
            
            // Run multiple iterations for average
            for (let i = 0; i < 10; i++) {
                const startTime = Date.now();
                
                try {
                    const options = {
                        method: endpoint.method,
                        headers: { 'Content-Type': 'application/json' }
                    };
                    
                    if (endpoint.body) {
                        options.body = JSON.stringify(endpoint.body);
                    }
                    
                    const response = await fetch(endpoint.url, options);
                    const responseTime = Date.now() - startTime;
                    
                    testResults.push({
                        responseTime,
                        status: response.status,
                        success: response.status < 400
                    });
                    
                    await this.delay(100); // Small delay between requests
                    
                } catch (error) {
                    testResults.push({
                        responseTime: Date.now() - startTime,
                        success: false,
                        error: error.message
                    });
                }
            }
            
            // Calculate averages
            const successfulTests = testResults.filter(t => t.success);
            const averageResponseTime = successfulTests.length > 0 
                ? successfulTests.reduce((sum, t) => sum + t.responseTime, 0) / successfulTests.length
                : 0;
            
            const passed = averageResponseTime <= endpoint.threshold && successfulTests.length >= 8; // 80% success rate
            
            this.recordPerformanceTest(
                passed,
                `API Performance: ${endpoint.name}`,
                {
                    averageResponseTime,
                    successRate: (successfulTests.length / testResults.length) * 100,
                    totalTests: testResults.length,
                    fastestResponse: Math.min(...testResults.map(t => t.responseTime)),
                    slowestResponse: Math.max(...testResults.map(t => t.responseTime))
                },
                endpoint.threshold
            );
        }
    }

    async testChatbotPerformance() {
        console.log('🤖 Testing chatbot performance...');
        
        const chatbotScenarios = [
            'Ciao, ho bisogno di assistenza',
            'Vorrei un preventivo per assistenza IT',
            'Ho un problema urgente con il server',
            'EMERGENZA! Sistema bloccato, perdendo soldi!',
            'Informazioni sui servizi di sicurezza informatica'
        ];

        for (const message of chatbotScenarios) {
            const sessionId = 'perf-test-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            const startTime = Date.now();
            
            try {
                const response = await fetch(PERFORMANCE_TEST_CONFIG.chatbotAPI, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'message',
                        message: message,
                        sessionId: sessionId
                    })
                });
                
                const responseTime = Date.now() - startTime;
                const data = await response.json();
                
                const passed = responseTime <= PERFORMANCE_TEST_CONFIG.thresholds.chatbotResponse && 
                              response.status === 200 && 
                              data.success;
                
                this.recordPerformanceTest(
                    passed,
                    `Chatbot Response: ${message.substring(0, 30)}...`,
                    {
                        responseTime,
                        status: response.status,
                        hasResponse: !!data.response,
                        aiPowered: data.aiPowered,
                        cached: data.cached,
                        emergency: data.emergency
                    },
                    PERFORMANCE_TEST_CONFIG.thresholds.chatbotResponse
                );
                
            } catch (error) {
                this.recordPerformanceTest(
                    false,
                    `Chatbot Response: ${message.substring(0, 30)}...`,
                    { error: error.message, responseTime: Date.now() - startTime },
                    PERFORMANCE_TEST_CONFIG.thresholds.chatbotResponse
                );
            }
        }
    }

    async testWebVitalsMetrics() {
        console.log('📊 Testing Web Vitals metrics...');
        
        const page = await this.browser.newPage();
        
        try {
            // Enable performance tracking
            await page.evaluateOnNewDocument(() => {
                window.webVitalsData = {};
            });
            
            await page.goto(PERFORMANCE_TEST_CONFIG.targetURL, { waitUntil: 'networkidle2' });
            
            // Wait for page to fully load
            await page.waitForTimeout(3000);
            
            // Get Web Vitals metrics
            const webVitals = await page.evaluate(() => {
                return new Promise((resolve) => {
                    const observer = new PerformanceObserver((list) => {
                        const entries = list.getEntries();
                        const vitals = {};
                        
                        entries.forEach(entry => {
                            if (entry.entryType === 'paint') {
                                if (entry.name === 'first-contentful-paint') {
                                    vitals.firstContentfulPaint = entry.startTime;
                                }
                            }
                            if (entry.entryType === 'largest-contentful-paint') {
                                vitals.largestContentfulPaint = entry.startTime;
                            }
                            if (entry.entryType === 'layout-shift') {
                                vitals.cumulativeLayoutShift = (vitals.cumulativeLayoutShift || 0) + entry.value;
                            }
                        });
                        
                        resolve(vitals);
                    });
                    
                    observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift'] });
                    
                    // Fallback timeout
                    setTimeout(() => {
                        resolve(window.webVitalsData || {});
                    }, 5000);
                });
            });
            
            // Test each Web Vital
            const webVitalTests = [
                {
                    name: 'First Contentful Paint',
                    value: webVitals.firstContentfulPaint,
                    threshold: PERFORMANCE_TEST_CONFIG.thresholds.firstContentfulPaint
                },
                {
                    name: 'Largest Contentful Paint',
                    value: webVitals.largestContentfulPaint,
                    threshold: PERFORMANCE_TEST_CONFIG.thresholds.largestContentfulPaint
                },
                {
                    name: 'Cumulative Layout Shift',
                    value: webVitals.cumulativeLayoutShift,
                    threshold: PERFORMANCE_TEST_CONFIG.thresholds.cumulativeLayoutShift,
                    lowerIsBetter: true
                }
            ];
            
            for (const vital of webVitalTests) {
                if (vital.value !== undefined) {
                    const passed = vital.lowerIsBetter 
                        ? vital.value <= vital.threshold
                        : vital.value >= vital.threshold;
                    
                    this.recordPerformanceTest(
                        passed,
                        `Web Vitals: ${vital.name}`,
                        { value: vital.value, unit: vital.name.includes('Shift') ? 'score' : 'ms' },
                        vital.threshold
                    );
                    
                    this.testResults.webVitalsResults.push({
                        metric: vital.name,
                        value: vital.value,
                        threshold: vital.threshold,
                        passed
                    });
                }
            }
            
        } catch (error) {
            this.recordPerformanceTest(
                false,
                'Web Vitals Collection',
                { error: error.message },
                0
            );
        } finally {
            await page.close();
        }
    }

    async runLoadTest() {
        console.log('🏋️ Running load test...');
        
        const config = PERFORMANCE_TEST_CONFIG.loadTest;
        const startTime = Date.now();
        const endTime = startTime + config.duration;
        const rampUpEndTime = startTime + config.rampUpTime;
        
        const users = [];
        const results = [];
        
        // Ramp up users gradually
        const userInterval = config.rampUpTime / config.maxUsers;
        
        for (let i = 0; i < config.maxUsers; i++) {
            setTimeout(() => {
                this.startVirtualUser(i, endTime, results);
            }, i * userInterval);
        }
        
        // Monitor progress
        const monitoring = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, config.duration - elapsed);
            
            console.log(`Load Test Progress: ${Math.floor(elapsed / 1000)}s elapsed, ${Math.floor(remaining / 1000)}s remaining, ${this.activeUsers} active users`);
        }, 10000);
        
        // Wait for test completion
        await new Promise(resolve => {
            const checkCompletion = setInterval(() => {
                if (Date.now() >= endTime && this.activeUsers === 0) {
                    clearInterval(checkCompletion);
                    clearInterval(monitoring);
                    resolve();
                }
            }, 1000);
        });
        
        // Analyze results
        const successfulRequests = results.filter(r => r.success).length;
        const averageResponseTime = results.length > 0
            ? results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
            : 0;
        
        const loadTestResult = {
            duration: config.duration,
            maxUsers: config.maxUsers,
            totalRequests: results.length,
            successfulRequests,
            failedRequests: results.length - successfulRequests,
            successRate: (successfulRequests / results.length) * 100,
            averageResponseTime,
            requestsPerSecond: results.length / (config.duration / 1000),
            peakResponseTime: Math.max(...results.map(r => r.responseTime)),
            minResponseTime: Math.min(...results.map(r => r.responseTime))
        };
        
        this.testResults.loadTestResults.push(loadTestResult);
        
        const passed = loadTestResult.successRate >= 95 && 
                      loadTestResult.averageResponseTime <= PERFORMANCE_TEST_CONFIG.thresholds.apiResponse;
        
        this.recordPerformanceTest(
            passed,
            'Load Test',
            loadTestResult,
            PERFORMANCE_TEST_CONFIG.thresholds.apiResponse
        );
        
        console.log(`✅ Load test completed: ${loadTestResult.successRate.toFixed(1)}% success rate, ${loadTestResult.averageResponseTime.toFixed(0)}ms avg response`);
    }

    async startVirtualUser(userId, endTime, results) {
        this.activeUsers++;
        
        const scenarios = [
            () => this.chatbotScenario(),
            () => this.emailScenario(),
            () => this.pageVisitScenario()
        ];
        
        while (Date.now() < endTime) {
            try {
                const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
                const result = await scenario();
                
                results.push({
                    userId,
                    timestamp: Date.now(),
                    ...result
                });
                
                await this.delay(PERFORMANCE_TEST_CONFIG.loadTest.requestInterval + Math.random() * 1000);
                
            } catch (error) {
                results.push({
                    userId,
                    timestamp: Date.now(),
                    success: false,
                    error: error.message,
                    responseTime: 0
                });
            }
        }
        
        this.activeUsers--;
    }

    async chatbotScenario() {
        const messages = [
            'Ciao',
            'Ho bisogno di assistenza',
            'Preventivo per 10 PC',
            'Grazie'
        ];
        
        const startTime = Date.now();
        const sessionId = 'load-test-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        
        try {
            // Start conversation
            await fetch(PERFORMANCE_TEST_CONFIG.chatbotAPI, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'start', sessionId })
            });
            
            // Send message
            const message = messages[Math.floor(Math.random() * messages.length)];
            const response = await fetch(PERFORMANCE_TEST_CONFIG.chatbotAPI, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'message',
                    message,
                    sessionId
                })
            });
            
            return {
                scenario: 'chatbot',
                success: response.status === 200,
                responseTime: Date.now() - startTime,
                status: response.status
            };
            
        } catch (error) {
            return {
                scenario: 'chatbot',
                success: false,
                responseTime: Date.now() - startTime,
                error: error.message
            };
        }
    }

    async emailScenario() {
        const startTime = Date.now();
        
        try {
            const response = await fetch(PERFORMANCE_TEST_CONFIG.emailAPI, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome: 'Load Test User',
                    email: `loadtest${Date.now()}@example.com`,
                    messaggio: 'Load test message',
                    privacy: true
                })
            });
            
            return {
                scenario: 'email',
                success: response.status === 200,
                responseTime: Date.now() - startTime,
                status: response.status
            };
            
        } catch (error) {
            return {
                scenario: 'email',
                success: false,
                responseTime: Date.now() - startTime,
                error: error.message
            };
        }
    }

    async pageVisitScenario() {
        const pages = [
            PERFORMANCE_TEST_CONFIG.targetURL,
            PERFORMANCE_TEST_CONFIG.targetURL + '/pages/assistenza-it.html',
            PERFORMANCE_TEST_CONFIG.targetURL + '/pages/cloud-storage.html'
        ];
        
        const page = await this.browser.newPage();
        const startTime = Date.now();
        
        try {
            const targetPage = pages[Math.floor(Math.random() * pages.length)];
            const response = await page.goto(targetPage, { 
                waitUntil: 'domcontentloaded',
                timeout: 10000
            });
            
            await page.close();
            
            return {
                scenario: 'page_visit',
                success: response.status() === 200,
                responseTime: Date.now() - startTime,
                status: response.status()
            };
            
        } catch (error) {
            await page.close();
            
            return {
                scenario: 'page_visit',
                success: false,
                responseTime: Date.now() - startTime,
                error: error.message
            };
        }
    }

    async runStressTest() {
        console.log('💪 Running stress test...');
        
        // Stress test with higher load
        const stressConfig = {
            duration: 60000, // 1 minute
            maxUsers: 100, // Higher than normal load
            requestInterval: 500 // Faster requests
        };
        
        const startTime = Date.now();
        const results = [];
        const promises = [];
        
        // Create stress load
        for (let i = 0; i < stressConfig.maxUsers; i++) {
            promises.push(this.stressTestUser(i, startTime + stressConfig.duration, results));
        }
        
        await Promise.all(promises);
        
        // Analyze stress test results
        const successfulRequests = results.filter(r => r.success).length;
        const stressTestResult = {
            users: stressConfig.maxUsers,
            duration: stressConfig.duration,
            totalRequests: results.length,
            successfulRequests,
            successRate: (successfulRequests / results.length) * 100,
            averageResponseTime: results.reduce((sum, r) => sum + r.responseTime, 0) / results.length,
            errorRate: ((results.length - successfulRequests) / results.length) * 100
        };
        
        this.testResults.stressTestResults.push(stressTestResult);
        
        // System should handle at least 80% success rate under stress
        const passed = stressTestResult.successRate >= 80;
        
        this.recordPerformanceTest(
            passed,
            'Stress Test',
            stressTestResult,
            80 // 80% success rate threshold
        );
        
        console.log(`✅ Stress test completed: ${stressTestResult.successRate.toFixed(1)}% success rate under high load`);
    }

    async stressTestUser(userId, endTime, results) {
        while (Date.now() < endTime) {
            const startTime = Date.now();
            
            try {
                // Rapid chatbot requests
                const response = await fetch(PERFORMANCE_TEST_CONFIG.chatbotAPI, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'message',
                        message: `Stress test message from user ${userId}`,
                        sessionId: `stress-${userId}-${Date.now()}`
                    })
                });
                
                results.push({
                    userId,
                    success: response.status === 200,
                    responseTime: Date.now() - startTime,
                    status: response.status
                });
                
            } catch (error) {
                results.push({
                    userId,
                    success: false,
                    responseTime: Date.now() - startTime,
                    error: error.message
                });
            }
            
            await this.delay(500 + Math.random() * 500); // 500-1000ms between requests
        }
    }

    async testConcurrentUsers() {
        console.log('👥 Testing concurrent user scenarios...');
        
        const concurrentTests = [
            { users: 5, scenario: 'light_load' },
            { users: 15, scenario: 'medium_load' },
            { users: 25, scenario: 'heavy_load' }
        ];
        
        for (const test of concurrentTests) {
            const promises = [];
            const results = [];
            const startTime = Date.now();
            
            // Start concurrent users
            for (let i = 0; i < test.users; i++) {
                promises.push(this.concurrentUserSession(i, results));
            }
            
            await Promise.all(promises);
            
            const totalTime = Date.now() - startTime;
            const successfulSessions = results.filter(r => r.success).length;
            
            const concurrentResult = {
                scenario: test.scenario,
                users: test.users,
                successfulSessions,
                successRate: (successfulSessions / test.users) * 100,
                totalTime,
                averageSessionTime: results.reduce((sum, r) => sum + r.duration, 0) / results.length
            };
            
            const passed = concurrentResult.successRate >= 90;
            
            this.recordPerformanceTest(
                passed,
                `Concurrent Users: ${test.scenario} (${test.users} users)`,
                concurrentResult,
                90 // 90% success rate
            );
        }
    }

    async concurrentUserSession(userId, results) {
        const startTime = Date.now();
        
        try {
            // Simulate a complete user session
            const sessionId = `concurrent-${userId}-${Date.now()}`;
            
            // Start chatbot
            await fetch(PERFORMANCE_TEST_CONFIG.chatbotAPI, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'start', sessionId })
            });
            
            // Send messages
            const messages = ['Ciao', 'Assistenza IT', 'Preventivo'];
            for (const message of messages) {
                await fetch(PERFORMANCE_TEST_CONFIG.chatbotAPI, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'message', message, sessionId })
                });
                
                await this.delay(1000); // Wait between messages
            }
            
            results.push({
                userId,
                success: true,
                duration: Date.now() - startTime
            });
            
        } catch (error) {
            results.push({
                userId,
                success: false,
                duration: Date.now() - startTime,
                error: error.message
            });
        }
    }

    async testMobilePerformance() {
        console.log('📱 Testing mobile performance...');
        
        const page = await this.browser.newPage();
        
        try {
            // Simulate mobile device
            await page.emulate({
                name: 'iPhone X',
                userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1',
                viewport: { width: 375, height: 812, deviceScaleFactor: 3, isMobile: true, hasTouch: true, isLandscape: false }
            });
            
            const startTime = Date.now();
            await page.goto(PERFORMANCE_TEST_CONFIG.targetURL, { waitUntil: 'networkidle2' });
            const loadTime = Date.now() - startTime;
            
            // Test mobile-specific metrics
            const mobileMetrics = await page.evaluate(() => ({
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                },
                touchSupport: 'ontouchstart' in window,
                devicePixelRatio: window.devicePixelRatio
            }));
            
            const passed = loadTime <= PERFORMANCE_TEST_CONFIG.thresholds.pageLoad;
            
            this.recordPerformanceTest(
                passed,
                'Mobile Performance',
                {
                    loadTime,
                    ...mobileMetrics
                },
                PERFORMANCE_TEST_CONFIG.thresholds.pageLoad
            );
            
        } catch (error) {
            this.recordPerformanceTest(
                false,
                'Mobile Performance',
                { error: error.message },
                PERFORMANCE_TEST_CONFIG.thresholds.pageLoad
            );
        } finally {
            await page.close();
        }
    }

    async testSlowNetworkConditions() {
        console.log('🐌 Testing slow network conditions...');
        
        const page = await this.browser.newPage();
        
        try {
            // Simulate slow 3G connection
            const client = await page.target().createCDPSession();
            await client.send('Network.emulateNetworkConditions', {
                offline: false,
                downloadThroughput: 1.6 * 1024 * 1024 / 8, // 1.6 Mbps
                uploadThroughput: 750 * 1024 / 8, // 750 kbps
                latency: 300 // 300ms
            });
            
            const startTime = Date.now();
            await page.goto(PERFORMANCE_TEST_CONFIG.targetURL, { waitUntil: 'networkidle2' });
            const loadTime = Date.now() - startTime;
            
            // Slow network should still load within reasonable time (extended threshold)
            const slowNetworkThreshold = PERFORMANCE_TEST_CONFIG.thresholds.pageLoad * 2;
            const passed = loadTime <= slowNetworkThreshold;
            
            this.recordPerformanceTest(
                passed,
                'Slow Network Performance',
                { loadTime, networkCondition: 'Slow 3G' },
                slowNetworkThreshold
            );
            
        } catch (error) {
            this.recordPerformanceTest(
                false,
                'Slow Network Performance',
                { error: error.message },
                PERFORMANCE_TEST_CONFIG.thresholds.pageLoad * 2
            );
        } finally {
            await page.close();
        }
    }

    async testCacheEffectiveness() {
        console.log('💾 Testing cache effectiveness...');
        
        const page = await this.browser.newPage();
        
        try {
            // First visit (cold cache)
            await page.setCacheEnabled(false);
            const coldStartTime = Date.now();
            await page.goto(PERFORMANCE_TEST_CONFIG.targetURL, { waitUntil: 'networkidle2' });
            const coldLoadTime = Date.now() - coldStartTime;
            
            // Second visit (warm cache)
            await page.setCacheEnabled(true);
            const warmStartTime = Date.now();
            await page.reload({ waitUntil: 'networkidle2' });
            const warmLoadTime = Date.now() - warmStartTime;
            
            // Cache should improve performance
            const cacheImprovement = ((coldLoadTime - warmLoadTime) / coldLoadTime) * 100;
            const passed = cacheImprovement > 10; // At least 10% improvement
            
            this.recordPerformanceTest(
                passed,
                'Cache Effectiveness',
                {
                    coldLoadTime,
                    warmLoadTime,
                    improvementPercentage: cacheImprovement
                },
                10 // 10% improvement threshold
            );
            
        } catch (error) {
            this.recordPerformanceTest(
                false,
                'Cache Effectiveness',
                { error: error.message },
                10
            );
        } finally {
            await page.close();
        }
    }

    async testResourceOptimization() {
        console.log('🎯 Testing resource optimization...');
        
        const page = await this.browser.newPage();
        
        try {
            await page.goto(PERFORMANCE_TEST_CONFIG.targetURL, { waitUntil: 'networkidle2' });
            
            // Analyze resources
            const resourceMetrics = await page.evaluate(() => {
                const resources = performance.getEntriesByType('resource');
                
                const analysis = {
                    totalResources: resources.length,
                    totalSize: 0,
                    resourceTypes: {},
                    largeResources: [],
                    slowResources: []
                };
                
                resources.forEach(resource => {
                    const type = resource.initiatorType || 'other';
                    analysis.resourceTypes[type] = (analysis.resourceTypes[type] || 0) + 1;
                    
                    const size = resource.transferSize || 0;
                    analysis.totalSize += size;
                    
                    if (size > 1024 * 1024) { // > 1MB
                        analysis.largeResources.push({
                            name: resource.name,
                            size: size,
                            type: type
                        });
                    }
                    
                    const loadTime = resource.responseEnd - resource.responseStart;
                    if (loadTime > 3000) { // > 3 seconds
                        analysis.slowResources.push({
                            name: resource.name,
                            loadTime: loadTime,
                            type: type
                        });
                    }
                });
                
                return analysis;
            });
            
            // Check optimization criteria
            const optimizationScore = this.calculateOptimizationScore(resourceMetrics);
            const passed = optimizationScore >= 70; // 70% optimization score
            
            this.recordPerformanceTest(
                passed,
                'Resource Optimization',
                {
                    ...resourceMetrics,
                    optimizationScore,
                    totalSizeMB: (resourceMetrics.totalSize / (1024 * 1024)).toFixed(2)
                },
                70
            );
            
        } catch (error) {
            this.recordPerformanceTest(
                false,
                'Resource Optimization',
                { error: error.message },
                70
            );
        } finally {
            await page.close();
        }
    }

    calculateOptimizationScore(metrics) {
        let score = 100;
        
        // Penalize for too many resources
        if (metrics.totalResources > 100) score -= 20;
        else if (metrics.totalResources > 50) score -= 10;
        
        // Penalize for large total size
        const sizeMB = metrics.totalSize / (1024 * 1024);
        if (sizeMB > 10) score -= 30;
        else if (sizeMB > 5) score -= 15;
        
        // Penalize for large individual resources
        score -= Math.min(metrics.largeResources.length * 10, 20);
        
        // Penalize for slow resources
        score -= Math.min(metrics.slowResources.length * 5, 15);
        
        return Math.max(score, 0);
    }

    // Helper methods
    recordPerformanceTest(passed, testName, metrics, threshold) {
        this.testResults.totalTests++;
        
        const result = {
            testName,
            passed,
            metrics,
            threshold,
            timestamp: new Date().toISOString()
        };
        
        this.testResults.performanceMetrics.push(result);
        
        if (passed) {
            this.testResults.passedTests++;
            console.log(`✅ ${testName}: ${this.formatMetrics(metrics)}`);
        } else {
            this.testResults.failedTests++;
            console.log(`❌ ${testName}: ${this.formatMetrics(metrics)} (threshold: ${threshold})`);
        }
    }

    formatMetrics(metrics) {
        if (typeof metrics === 'object' && metrics !== null) {
            if (metrics.responseTime !== undefined) {
                return `${metrics.responseTime}ms`;
            } else if (metrics.loadTime !== undefined) {
                return `${metrics.loadTime}ms`;
            } else if (metrics.averageResponseTime !== undefined) {
                return `${metrics.averageResponseTime.toFixed(0)}ms avg`;
            } else if (metrics.successRate !== undefined) {
                return `${metrics.successRate.toFixed(1)}% success`;
            }
        }
        return 'completed';
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async generatePerformanceReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalTests: this.testResults.totalTests,
                passedTests: this.testResults.passedTests,
                failedTests: this.testResults.failedTests,
                successRate: ((this.testResults.passedTests / this.testResults.totalTests) * 100).toFixed(1)
            },
            performanceMetrics: this.testResults.performanceMetrics,
            loadTestResults: this.testResults.loadTestResults,
            webVitalsResults: this.testResults.webVitalsResults,
            stressTestResults: this.testResults.stressTestResults,
            recommendations: this.generatePerformanceRecommendations(),
            testConfiguration: PERFORMANCE_TEST_CONFIG
        };

        // Ensure reports directory exists
        require('fs').mkdirSync('/Users/andreapanzeri/progetti/IT-ERA/tests/reports', { recursive: true });
        
        // Save report
        require('fs').writeFileSync(
            '/Users/andreapanzeri/progetti/IT-ERA/tests/reports/performance-load-test-report.json',
            JSON.stringify(report, null, 2)
        );

        console.log('\n⚡ PERFORMANCE & LOAD TEST REPORT');
        console.log('==================================');
        console.log(`Total Tests: ${report.summary.totalTests}`);
        console.log(`Passed: ${report.summary.passedTests}`);
        console.log(`Failed: ${report.summary.failedTests}`);
        console.log(`Success Rate: ${report.summary.successRate}%`);
        
        if (this.testResults.loadTestResults.length > 0) {
            console.log(`\n🏋️ Load Test Results:`);
            this.testResults.loadTestResults.forEach(result => {
                console.log(`- ${result.maxUsers} users: ${result.successRate.toFixed(1)}% success, ${result.averageResponseTime.toFixed(0)}ms avg`);
            });
        }
        
        if (this.testResults.webVitalsResults.length > 0) {
            console.log(`\n📊 Web Vitals:`);
            this.testResults.webVitalsResults.forEach(vital => {
                const status = vital.passed ? '✅' : '❌';
                console.log(`${status} ${vital.metric}: ${vital.value}${vital.metric.includes('Shift') ? '' : 'ms'}`);
            });
        }
        
        if (this.testResults.stressTestResults.length > 0) {
            console.log(`\n💪 Stress Test:`);
            this.testResults.stressTestResults.forEach(result => {
                console.log(`- ${result.users} users: ${result.successRate.toFixed(1)}% success under stress`);
            });
        }
        
        const failedTests = this.testResults.performanceMetrics.filter(test => !test.passed);
        if (failedTests.length > 0) {
            console.log(`\n❌ Failed Performance Tests:`);
            failedTests.forEach((test, index) => {
                console.log(`${index + 1}. ${test.testName}`);
            });
        }
        
        console.log(`\n📄 Detailed report saved: tests/reports/performance-load-test-report.json`);
    }

    generatePerformanceRecommendations() {
        const recommendations = [];
        const failedTests = this.testResults.performanceMetrics.filter(test => !test.passed);
        
        if (failedTests.some(test => test.testName.includes('Page Load'))) {
            recommendations.push('Optimize page load times by compressing images and minifying CSS/JS');
        }
        
        if (failedTests.some(test => test.testName.includes('API Performance'))) {
            recommendations.push('Improve API response times by optimizing database queries and adding caching');
        }
        
        if (failedTests.some(test => test.testName.includes('Chatbot'))) {
            recommendations.push('Optimize chatbot AI response generation and implement better caching');
        }
        
        if (this.testResults.webVitalsResults.some(vital => !vital.passed)) {
            recommendations.push('Address Web Vitals issues to improve user experience and SEO rankings');
        }
        
        if (this.testResults.loadTestResults.some(result => result.successRate < 95)) {
            recommendations.push('Improve system capacity to handle higher concurrent loads');
        }
        
        if (this.testResults.stressTestResults.some(result => result.successRate < 80)) {
            recommendations.push('Implement better error handling and circuit breakers for high-stress scenarios');
        }
        
        if (failedTests.some(test => test.testName.includes('Mobile'))) {
            recommendations.push('Optimize mobile performance with responsive images and mobile-first design');
        }
        
        if (failedTests.some(test => test.testName.includes('Network'))) {
            recommendations.push('Implement progressive loading and better offline capabilities');
        }
        
        return recommendations;
    }
}

// Export for use in other test suites
module.exports = PerformanceLoadTester;

// Run if called directly
if (require.main === module) {
    const tester = new PerformanceLoadTester();
    tester.runPerformanceTests()
        .then(() => {
            console.log('✅ Performance and load testing completed');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Performance testing failed:', error);
            process.exit(1);
        });
}