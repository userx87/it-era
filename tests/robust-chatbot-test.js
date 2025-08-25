/**
 * Robust Chatbot Test using Puppeteer Debugging Utilities
 * Addresses all identified issues with comprehensive error handling
 */

const PuppeteerDebugger = require('./puppeteer-debugging-utilities');

class RobustChatbotTest {
    constructor() {
        this.debugger = new PuppeteerDebugger({
            headless: false, // Set to true for headless testing
            screenshotDir: '/Users/andreapanzeri/progetti/IT-ERA/test-results/screenshots',
            reportDir: '/Users/andreapanzeri/progetti/IT-ERA/test-results/reports',
            timeout: 30000,
            slowMo: 250 // Slower for debugging
        });

        // Widget configuration - centralized and configurable
        this.widgetConfig = {
            buttonSelector: '#it-era-chatbot-button, .chatbot-button, [data-chatbot="button"]',
            windowSelector: '#it-era-chatbot-window, .chatbot-window, [data-chatbot="window"]',
            messagesSelector: '#it-era-messages, .chatbot-messages, [data-chatbot="messages"]',
            inputSelector: '#it-era-message-input, .chatbot-input, [data-chatbot="input"]',
            closeSelector: '.chatbot-close, [data-chatbot="close"]'
        };

        this.testResults = {
            passed: 0,
            failed: 0,
            warnings: 0,
            details: []
        };
    }

    /**
     * Main test execution
     */
    async runComprehensiveTest() {
        console.log('🚀 Starting Robust IT-ERA Chatbot Test\n');
        console.log('=' .repeat(80));
        
        try {
            // Initialize debugging utilities
            await this.debugger.initialize();
            
            // Launch browser
            await this.debugger.launchBrowser();
            
            // Test multiple environments
            const environments = ['production', 'staging'];
            let testPassed = false;
            
            for (const env of environments) {
                console.log(`\n🌍 Testing ${env.toUpperCase()} environment`);
                console.log('-'.repeat(50));
                
                try {
                    const result = await this.testEnvironment(env);
                    if (result.success) {
                        testPassed = true;
                        console.log(`✅ ${env} environment test PASSED`);
                        break; // Success, no need to test other environments
                    } else {
                        console.log(`❌ ${env} environment test FAILED`);
                    }
                } catch (error) {
                    console.log(`💥 ${env} environment test CRASHED: ${error.message}`);
                    this.addTestResult('environment_test', env, false, `Environment test crashed: ${error.message}`);
                }
            }
            
            // Final assessment
            await this.generateFinalReport(testPassed);
            
        } catch (error) {
            console.error('💥 Test suite crashed:', error.message);
            this.addTestResult('test_suite', 'initialization', false, `Test suite crashed: ${error.message}`);
        } finally {
            // Cleanup
            await this.debugger.cleanup();
        }
        
        return this.testResults;
    }

    /**
     * Test a specific environment
     */
    async testEnvironment(environment) {
        const page = await this.debugger.createMonitoredPage(`${environment}-test`);
        
        try {
            // Step 1: Navigate to site
            console.log(`1️⃣ Navigating to ${environment} site...`);
            await this.debugger.navigateToSite(page, environment);
            this.addTestResult('navigation', environment, true, 'Successfully navigated to site');

            // Take initial screenshot
            await this.debugger.takeScreenshot(page, `${environment}-initial-load`, {
                context: 'environment-test',
                metadata: { environment, step: 'initial-load' }
            });

            // Step 2: Page health check
            console.log('2️⃣ Performing page health check...');
            const healthResult = await this.performPageHealthCheck(page);
            
            if (!healthResult.healthy) {
                this.addTestResult('health_check', environment, false, 'Page health check failed');
                return { success: false, reason: 'Page health check failed' };
            }

            // Step 3: Widget verification
            console.log('3️⃣ Verifying chatbot widget...');
            const widgetResult = await this.debugger.verifyWidgetLoading(page, this.widgetConfig);
            
            // Step 4: Interaction testing
            console.log('4️⃣ Testing chatbot interactions...');
            const interactionResult = await this.testChatbotInteractions(page);

            // Step 5: API connectivity test
            console.log('5️⃣ Testing API connectivity...');
            const apiResult = await this.testApiConnectivity(page);

            // Evaluate overall success
            const success = widgetResult.buttonFound && 
                           widgetResult.windowOpens && 
                           healthResult.healthy &&
                           interactionResult.success;

            return {
                success,
                widgetResult,
                healthResult,
                interactionResult,
                apiResult
            };

        } catch (error) {
            console.error(`❌ Environment test failed: ${error.message}`);
            
            // Take error screenshot
            await this.debugger.takeScreenshot(page, `${environment}-error`, {
                context: 'error',
                metadata: { environment, error: error.message }
            });
            
            return { success: false, error: error.message };
        } finally {
            await page.close();
        }
    }

    /**
     * Perform comprehensive page health check
     */
    async performPageHealthCheck(page) {
        console.log('   🔍 Running page health diagnostics...');
        
        const health = {
            healthy: true,
            issues: [],
            metrics: {}
        };

        try {
            // Check page title
            const title = await page.title();
            health.metrics.title = title;
            
            if (!title || title.length < 10) {
                health.healthy = false;
                health.issues.push('Invalid or missing page title');
                this.addTestResult('health_check', 'title', false, 'Invalid page title');
            } else {
                console.log(`   ✅ Page title: ${title}`);
                this.addTestResult('health_check', 'title', true, 'Valid page title');
            }

            // Check for critical elements
            const criticalSelectors = [
                'body',
                'main, #main, .main-content',
                'header, .header',
                'footer, .footer'
            ];

            for (const selector of criticalSelectors) {
                const element = await page.$(selector);
                if (element) {
                    console.log(`   ✅ Critical element found: ${selector}`);
                    this.addTestResult('health_check', `element_${selector}`, true, 'Critical element present');
                } else {
                    health.issues.push(`Missing critical element: ${selector}`);
                    this.addTestResult('health_check', `element_${selector}`, false, 'Critical element missing');
                }
            }

            // Check for JavaScript errors (accumulated during page load)
            const jsErrors = this.debugger.consoleLogs.filter(log => log.type === 'error');
            health.metrics.jsErrors = jsErrors.length;
            
            if (jsErrors.length > 0) {
                health.issues.push(`${jsErrors.length} JavaScript errors detected`);
                console.log(`   ⚠️ JavaScript errors: ${jsErrors.length}`);
                this.addTestResult('health_check', 'js_errors', false, `${jsErrors.length} JS errors found`);
            } else {
                console.log('   ✅ No JavaScript errors');
                this.addTestResult('health_check', 'js_errors', true, 'No JavaScript errors');
            }

            // Check network connectivity
            const failedRequests = this.debugger.networkRequests.filter(req => req.isAborted || (req.status >= 400));
            health.metrics.failedRequests = failedRequests.length;
            
            if (failedRequests.length > 0) {
                health.issues.push(`${failedRequests.length} failed network requests`);
                console.log(`   ⚠️ Failed requests: ${failedRequests.length}`);
                this.addTestResult('health_check', 'network', false, `${failedRequests.length} failed requests`);
            } else {
                console.log('   ✅ All network requests successful');
                this.addTestResult('health_check', 'network', true, 'Network requests healthy');
            }

            // Performance check - page load time
            const loadTime = Date.now() - this.debugger.startTime;
            health.metrics.loadTime = loadTime;
            
            if (loadTime > 10000) { // 10 seconds
                health.healthy = false;
                health.issues.push(`Slow page load: ${loadTime}ms`);
                this.addTestResult('health_check', 'performance', false, `Slow load time: ${loadTime}ms`);
            } else {
                console.log(`   ✅ Page load time: ${loadTime}ms`);
                this.addTestResult('health_check', 'performance', true, `Good load time: ${loadTime}ms`);
            }

            return health;

        } catch (error) {
            health.healthy = false;
            health.issues.push(`Health check error: ${error.message}`);
            this.addTestResult('health_check', 'general', false, `Health check failed: ${error.message}`);
            return health;
        }
    }

    /**
     * Test chatbot interactions with comprehensive verification
     */
    async testChatbotInteractions(page) {
        console.log('   🤖 Testing chatbot interactions...');
        
        const result = {
            success: false,
            steps: [],
            errors: []
        };

        try {
            // Find and click chatbot button
            const button = await this.debugger.waitForElement(page, this.widgetConfig.buttonSelector, {
                timeout: 10000,
                required: false
            });

            if (!button) {
                result.errors.push('Chatbot button not found');
                this.addTestResult('chatbot_interaction', 'button_click', false, 'Button not found');
                return result;
            }

            console.log('   🖱️ Clicking chatbot button...');
            await button.click();
            result.steps.push('Button clicked');

            // Wait for widget to open
            await this.debugger.wait(3000);

            // Verify widget opened
            const widget = await page.$(this.widgetConfig.windowSelector);
            if (!widget) {
                result.errors.push('Widget window did not appear');
                this.addTestResult('chatbot_interaction', 'widget_open', false, 'Widget window not found');
                return result;
            }

            const isVisible = await widget.isIntersectingViewport();
            if (!isVisible) {
                result.errors.push('Widget window is not visible');
                this.addTestResult('chatbot_interaction', 'widget_visible', false, 'Widget not visible');
                return result;
            }

            console.log('   ✅ Widget window opened and is visible');
            result.steps.push('Widget opened and visible');
            this.addTestResult('chatbot_interaction', 'widget_open', true, 'Widget opened successfully');

            // Take screenshot of opened widget
            await this.debugger.takeScreenshot(page, 'widget-opened', {
                context: 'chatbot-interaction',
                metadata: { step: 'widget-opened' }
            });

            // Wait for initial messages to load
            console.log('   ⏳ Waiting for initial messages...');
            await this.debugger.wait(5000); // Give enough time for API calls

            // Check for messages
            const messages = await page.evaluate((selector) => {
                const container = document.querySelector(selector);
                if (!container) return null;
                
                const messageElements = container.querySelectorAll('.message, .it-era-message, .chatbot-message');
                return Array.from(messageElements).map(msg => ({
                    text: msg.textContent.trim(),
                    html: msg.innerHTML,
                    classes: Array.from(msg.classList),
                    visible: msg.offsetParent !== null
                }));
            }, this.widgetConfig.messagesSelector);

            if (messages && messages.length > 0) {
                console.log(`   ✅ Found ${messages.length} messages`);
                result.steps.push(`Found ${messages.length} messages`);
                this.addTestResult('chatbot_interaction', 'messages_found', true, `${messages.length} messages found`);

                // Check for connection issues
                const connectionErrors = messages.filter(msg => 
                    msg.text.toLowerCase().includes('connessione') ||
                    msg.text.toLowerCase().includes('errore') ||
                    msg.text.includes('039 888 2041')
                );

                if (connectionErrors.length > 0) {
                    result.errors.push('Connection error messages detected');
                    console.log('   ⚠️ Connection error messages detected');
                    this.addTestResult('chatbot_interaction', 'connection_health', false, 'Connection errors in messages');
                } else {
                    console.log('   ✅ No connection error messages');
                    this.addTestResult('chatbot_interaction', 'connection_health', true, 'No connection errors');
                }
            } else {
                result.errors.push('No messages found in widget');
                console.log('   ❌ No messages found');
                this.addTestResult('chatbot_interaction', 'messages_found', false, 'No messages found');
            }

            // Test sending a message
            console.log('   📝 Testing message sending...');
            const input = await page.$(this.widgetConfig.inputSelector);
            
            if (input) {
                await input.type('Test automatico - questa è una prova');
                await page.keyboard.press('Enter');
                
                console.log('   ✅ Test message sent');
                result.steps.push('Test message sent');
                this.addTestResult('chatbot_interaction', 'message_send', true, 'Message sent successfully');
                
                // Wait for response
                await this.debugger.wait(5000);
                
                // Take screenshot after sending message
                await this.debugger.takeScreenshot(page, 'message-sent', {
                    context: 'chatbot-interaction',
                    metadata: { step: 'message-sent' }
                });
                
            } else {
                result.errors.push('Message input field not found');
                console.log('   ❌ Input field not found');
                this.addTestResult('chatbot_interaction', 'input_field', false, 'Input field not found');
            }

            // Overall success determination
            result.success = result.errors.length === 0 && result.steps.length >= 2;

            return result;

        } catch (error) {
            result.errors.push(`Interaction test error: ${error.message}`);
            console.log(`   ❌ Interaction test failed: ${error.message}`);
            this.addTestResult('chatbot_interaction', 'general', false, `Test failed: ${error.message}`);
            
            // Take error screenshot
            await this.debugger.takeScreenshot(page, 'interaction-error', {
                context: 'error',
                metadata: { error: error.message }
            });
            
            return result;
        }
    }

    /**
     * Test API connectivity
     */
    async testApiConnectivity(page) {
        console.log('   🌐 Testing API connectivity...');
        
        const result = {
            chatbotApi: false,
            apiRequests: [],
            corsIssues: false,
            errors: []
        };

        // Filter API-related requests
        const apiRequests = this.debugger.networkRequests.filter(req => 
            req.url.includes('/api/') ||
            req.url.includes('chat') ||
            req.url.includes('bot') ||
            req.url.includes('cloudflare') ||
            req.url.includes('workers')
        );

        result.apiRequests = apiRequests;

        if (apiRequests.length === 0) {
            result.errors.push('No API requests detected');
            console.log('   ❌ No API requests found');
            this.addTestResult('api_connectivity', 'requests', false, 'No API requests detected');
        } else {
            console.log(`   ✅ Found ${apiRequests.length} API requests`);
            this.addTestResult('api_connectivity', 'requests', true, `${apiRequests.length} API requests found`);

            // Check for successful API calls
            const successfulRequests = apiRequests.filter(req => req.status && req.status >= 200 && req.status < 400);
            const failedRequests = apiRequests.filter(req => req.isAborted || (req.status && req.status >= 400));

            if (successfulRequests.length > 0) {
                result.chatbotApi = true;
                console.log(`   ✅ ${successfulRequests.length} successful API calls`);
                this.addTestResult('api_connectivity', 'success', true, `${successfulRequests.length} successful calls`);
            } else {
                console.log(`   ❌ No successful API calls (${failedRequests.length} failed)`);
                this.addTestResult('api_connectivity', 'success', false, 'No successful API calls');
            }

            // Check for CORS issues
            const corsFailures = apiRequests.filter(req => 
                req.failure && (
                    req.failure.errorText.includes('CORS') ||
                    req.failure.errorText.includes('Access-Control') ||
                    req.status === 0
                )
            );

            if (corsFailures.length > 0) {
                result.corsIssues = true;
                result.errors.push(`CORS issues detected: ${corsFailures.length} requests`);
                console.log(`   ⚠️ CORS issues: ${corsFailures.length} requests`);
                this.addTestResult('api_connectivity', 'cors', false, `${corsFailures.length} CORS issues`);
            } else {
                console.log('   ✅ No CORS issues detected');
                this.addTestResult('api_connectivity', 'cors', true, 'No CORS issues');
            }
        }

        return result;
    }

    /**
     * Add test result to tracking
     */
    addTestResult(category, test, passed, message) {
        this.testResults.details.push({
            category,
            test,
            passed,
            message,
            timestamp: new Date().toISOString()
        });

        if (passed) {
            this.testResults.passed++;
        } else {
            this.testResults.failed++;
        }
    }

    /**
     * Generate final comprehensive report
     */
    async generateFinalReport(testPassed) {
        console.log('\n' + '='.repeat(80));
        console.log('🏆 ROBUST CHATBOT TEST - FINAL REPORT');
        console.log('='.repeat(80));

        // Test summary
        const totalTests = this.testResults.passed + this.testResults.failed;
        const successRate = totalTests > 0 ? Math.round((this.testResults.passed / totalTests) * 100) : 0;

        console.log(`\n📊 TEST SUMMARY:`);
        console.log(`   ✅ Passed: ${this.testResults.passed}`);
        console.log(`   ❌ Failed: ${this.testResults.failed}`);
        console.log(`   📈 Success Rate: ${successRate}%`);
        console.log(`   🎯 Overall Result: ${testPassed ? 'PASS' : 'FAIL'}`);

        // Category breakdown
        console.log(`\n📋 CATEGORY BREAKDOWN:`);
        const categories = [...new Set(this.testResults.details.map(d => d.category))];
        
        for (const category of categories) {
            const categoryTests = this.testResults.details.filter(d => d.category === category);
            const categoryPassed = categoryTests.filter(t => t.passed).length;
            const categoryTotal = categoryTests.length;
            const categoryRate = Math.round((categoryPassed / categoryTotal) * 100);
            
            console.log(`   ${category}: ${categoryPassed}/${categoryTotal} (${categoryRate}%)`);
        }

        // Issues found
        const failedTests = this.testResults.details.filter(d => !d.passed);
        if (failedTests.length > 0) {
            console.log(`\n🚨 ISSUES IDENTIFIED:`);
            failedTests.forEach((test, index) => {
                console.log(`   ${index + 1}. [${test.category}] ${test.test}: ${test.message}`);
            });
        }

        // Generate debugging report
        console.log(`\n📋 Generating detailed debugging report...`);
        const reportFile = await this.debugger.saveReport('robust-chatbot-test');

        // Recommendations
        console.log(`\n💡 RECOMMENDATIONS:`);
        if (!testPassed) {
            console.log('   🔧 Fix the identified issues above');
            console.log('   🌐 Check network connectivity and API endpoints');
            console.log('   🛡️ Verify CORS configuration');
            console.log('   🐛 Review JavaScript console for errors');
        } else {
            console.log('   🎉 Chatbot is working correctly!');
            console.log('   📈 Consider monitoring performance metrics');
            console.log('   🔍 Regular testing recommended');
        }

        console.log(`\n📄 Detailed report saved: ${reportFile}`);
        console.log('='.repeat(80));

        return {
            testPassed,
            successRate,
            reportFile,
            summary: this.testResults
        };
    }
}

// Export for use as module
module.exports = RobustChatbotTest;

// Run test if called directly
if (require.main === module) {
    const test = new RobustChatbotTest();
    test.runComprehensiveTest()
        .then(results => {
            console.log('\n🎭 Test execution completed!');
            process.exit(results.testPassed ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Test execution failed:', error);
            process.exit(1);
        });
}