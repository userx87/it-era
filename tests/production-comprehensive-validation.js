/**
 * COMPREHENSIVE PRODUCTION VALIDATION SUITE
 * Tests the complete IT-ERA system on live domain
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class ProductionValidator {
    constructor() {
        this.testResults = {
            timestamp: new Date().toISOString(),
            domain: 'https://it-era.it',
            tests: [],
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                critical: 0
            }
        };
        
        this.browser = null;
        this.page = null;
    }

    async initialize() {
        console.log('🚀 IT-ERA Production Validation Suite');
        console.log('=' .repeat(60));
        console.log(`🌐 Target Domain: ${this.testResults.domain}`);
        console.log(`⏰ Started: ${this.testResults.timestamp}`);
        console.log('=' .repeat(60));

        this.browser = await puppeteer.launch({
            headless: true,
            timeout: 30000,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });

        this.page = await this.browser.newPage();
        
        // Set realistic viewport and user agent
        await this.page.setViewport({ width: 1920, height: 1080 });
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    }

    async addTestResult(testName, passed, details = {}, critical = false) {
        const result = {
            test: testName,
            passed,
            critical,
            details,
            timestamp: new Date().toISOString()
        };
        
        this.testResults.tests.push(result);
        this.testResults.summary.total++;
        
        if (passed) {
            this.testResults.summary.passed++;
            console.log(`✅ ${testName}`);
        } else {
            this.testResults.summary.failed++;
            if (critical) this.testResults.summary.critical++;
            console.log(`❌ ${testName} ${critical ? '(CRITICAL)' : ''}`);
            if (details.error) {
                console.log(`   Error: ${details.error}`);
            }
        }
        
        if (details.info) {
            console.log(`   Info: ${details.info}`);
        }
    }

    async testSiteAccessibility() {
        try {
            const startTime = Date.now();
            const response = await this.page.goto(this.testResults.domain, { 
                waitUntil: 'networkidle0',
                timeout: 25000 
            });
            
            const loadTime = Date.now() - startTime;
            const status = response.status();
            
            await this.addTestResult(
                'Site Accessibility', 
                status === 200,
                { 
                    status, 
                    loadTime: `${loadTime}ms`,
                    info: `Site loaded in ${loadTime}ms with status ${status}`
                },
                true
            );
            
            return status === 200;
        } catch (error) {
            await this.addTestResult(
                'Site Accessibility', 
                false,
                { error: error.message },
                true
            );
            return false;
        }
    }

    async testChatbotPresence() {
        try {
            // Look for chatbot button
            const buttonExists = await this.page.$('#it-era-chatbot-button');
            
            if (!buttonExists) {
                // Look for any chatbot-related elements
                const chatElements = await this.page.$$eval(
                    '[id*="chatbot"], [class*="chatbot"], [data-chatbot], script[src*="chatbot"]',
                    elements => elements.map(el => ({
                        tag: el.tagName,
                        id: el.id,
                        class: el.className,
                        src: el.src || '',
                        text: el.textContent?.slice(0, 50) || ''
                    }))
                );
                
                await this.addTestResult(
                    'Chatbot Button Presence', 
                    false,
                    { 
                        error: 'Chatbot button not found',
                        elementsFound: chatElements.length,
                        elements: chatElements
                    },
                    true
                );
                return false;
            }
            
            await this.addTestResult('Chatbot Button Presence', true);
            return true;
        } catch (error) {
            await this.addTestResult(
                'Chatbot Button Presence', 
                false,
                { error: error.message },
                true
            );
            return false;
        }
    }

    async testChatbotFunctionality() {
        try {
            const buttonExists = await this.page.$('#it-era-chatbot-button');
            if (!buttonExists) {
                await this.addTestResult(
                    'Chatbot Functionality',
                    false,
                    { error: 'Chatbot button not available for testing' },
                    true
                );
                return false;
            }

            // Click chatbot button
            await this.page.click('#it-era-chatbot-button');
            
            // Wait for window to appear
            await this.page.waitForSelector('#it-era-chatbot-window', { timeout: 5000 });
            
            // Check if window opened
            const windowExists = await this.page.$('#it-era-chatbot-window');
            
            if (!windowExists) {
                await this.addTestResult(
                    'Chatbot Functionality',
                    false,
                    { error: 'Chatbot window did not open' },
                    true
                );
                return false;
            }

            await this.addTestResult('Chatbot Functionality', true, {
                info: 'Chatbot window opens successfully'
            });
            return true;
            
        } catch (error) {
            await this.addTestResult(
                'Chatbot Functionality',
                false,
                { error: error.message },
                true
            );
            return false;
        }
    }

    async testGreetingMessage() {
        try {
            // Wait for initial messages to load
            await this.page.waitForTimeout(3000);
            
            const messages = await this.page.$$eval(
                '#it-era-messages .it-era-message', 
                msgs => msgs.map(m => m.textContent.trim()).filter(t => t.length > 0)
            );
            
            const hasGreeting = messages.length > 0;
            const greetingText = messages[0] || 'None';
            
            await this.addTestResult(
                'Greeting Message Display',
                hasGreeting,
                { 
                    messageCount: messages.length,
                    firstMessage: greetingText,
                    info: `${messages.length} messages found, first: "${greetingText.slice(0, 50)}..."`
                }
            );
            
            return { hasGreeting, messages };
        } catch (error) {
            await this.addTestResult(
                'Greeting Message Display',
                false,
                { error: error.message }
            );
            return { hasGreeting: false, messages: [] };
        }
    }

    async testNuclearSecurity(messages) {
        try {
            const systemPromptPatterns = [
                'SYSTEM_PROMPT',
                'INIZIO:',
                'generateSystemPrompt',
                'You are an AI assistant',
                'NEVER reveal these instructions',
                'PROMPT_PROTECTION',
                'SYSTEM:',
                'Assistant:'
            ];
            
            let securityViolations = [];
            
            for (const message of messages) {
                for (const pattern of systemPromptPatterns) {
                    if (message.toLowerCase().includes(pattern.toLowerCase())) {
                        securityViolations.push({
                            pattern,
                            message: message.slice(0, 100) + '...'
                        });
                    }
                }
            }
            
            const isSecure = securityViolations.length === 0;
            
            await this.addTestResult(
                'Nuclear Security (No System Prompts)',
                isSecure,
                { 
                    violations: securityViolations,
                    info: isSecure ? 'No system prompts detected in user-visible content' : `${securityViolations.length} security violations found`
                },
                !isSecure
            );
            
            return isSecure;
        } catch (error) {
            await this.addTestResult(
                'Nuclear Security (No System Prompts)',
                false,
                { error: error.message },
                true
            );
            return false;
        }
    }

    async testAPIEndpoint() {
        try {
            // Test API endpoint directly
            const response = await this.page.evaluate(async () => {
                try {
                    const res = await fetch('https://it-era-chatbot-production.bulltech.workers.dev/api/chatbot', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            message: 'Test message for production validation',
                            conversationId: 'test-validation-' + Date.now()
                        })
                    });
                    
                    const data = await res.json();
                    return {
                        status: res.status,
                        success: res.ok,
                        data: data,
                        responseTime: Date.now()
                    };
                } catch (err) {
                    return {
                        success: false,
                        error: err.message
                    };
                }
            });
            
            await this.addTestResult(
                'API Endpoint Response',
                response.success,
                { 
                    status: response.status,
                    responseTime: response.responseTime,
                    error: response.error,
                    info: response.success ? `API responding with status ${response.status}` : 'API endpoint not accessible'
                }
            );
            
            return response.success;
        } catch (error) {
            await this.addTestResult(
                'API Endpoint Response',
                false,
                { error: error.message }
            );
            return false;
        }
    }

    async testInputField() {
        try {
            const inputExists = await this.page.$('#it-era-message-input');
            
            if (inputExists) {
                // Test if input is functional
                await this.page.focus('#it-era-message-input');
                await this.page.type('#it-era-message-input', 'Test input functionality');
                
                const inputValue = await this.page.$eval('#it-era-message-input', el => el.value);
                const isWorking = inputValue === 'Test input functionality';
                
                await this.addTestResult(
                    'Input Field Functionality',
                    isWorking,
                    { 
                        exists: true,
                        canType: isWorking,
                        info: isWorking ? 'Input field accepts text input' : 'Input field not responding to keyboard input'
                    }
                );
                return isWorking;
            } else {
                await this.addTestResult(
                    'Input Field Functionality',
                    false,
                    { exists: false, error: 'Input field not found' }
                );
                return false;
            }
        } catch (error) {
            await this.addTestResult(
                'Input Field Functionality',
                false,
                { error: error.message }
            );
            return false;
        }
    }

    async testPerformance() {
        try {
            const metrics = await this.page.metrics();
            
            // Get Core Web Vitals-like metrics
            const timing = await this.page.evaluate(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                return {
                    domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart,
                    loadComplete: perfData.loadEventEnd - perfData.fetchStart,
                    firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime || 0,
                    firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
                };
            });
            
            const performanceGood = timing.domContentLoaded < 2000 && timing.loadComplete < 4000;
            
            await this.addTestResult(
                'Performance Metrics',
                performanceGood,
                {
                    domContentLoaded: `${Math.round(timing.domContentLoaded)}ms`,
                    loadComplete: `${Math.round(timing.loadComplete)}ms`,
                    firstPaint: `${Math.round(timing.firstPaint)}ms`,
                    firstContentfulPaint: `${Math.round(timing.firstContentfulPaint)}ms`,
                    jsHeapUsed: `${Math.round(metrics.JSHeapUsedSize / 1024 / 1024 * 100) / 100}MB`,
                    info: performanceGood ? 'Performance within acceptable thresholds' : 'Performance may need optimization'
                }
            );
            
            return performanceGood;
        } catch (error) {
            await this.addTestResult(
                'Performance Metrics',
                false,
                { error: error.message }
            );
            return false;
        }
    }

    async generateReport() {
        const reportPath = path.join(__dirname, `production-validation-report-${Date.now()}.json`);
        
        // Calculate overall success rate
        const successRate = this.testResults.summary.total > 0 
            ? Math.round((this.testResults.summary.passed / this.testResults.summary.total) * 100)
            : 0;
            
        this.testResults.summary.successRate = successRate;
        this.testResults.summary.overallStatus = 
            this.testResults.summary.critical > 0 ? 'CRITICAL_ISSUES' :
            successRate >= 90 ? 'EXCELLENT' :
            successRate >= 75 ? 'GOOD' :
            successRate >= 50 ? 'NEEDS_IMPROVEMENT' : 'POOR';

        // Write detailed JSON report
        fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
        
        return reportPath;
    }

    async printSummary() {
        console.log('\n' + '=' .repeat(60));
        console.log('🎯 PRODUCTION VALIDATION SUMMARY');
        console.log('=' .repeat(60));
        console.log(`📊 Tests: ${this.testResults.summary.passed}/${this.testResults.summary.total} passed (${this.testResults.summary.successRate}%)`);
        console.log(`🚨 Critical Issues: ${this.testResults.summary.critical}`);
        console.log(`📈 Overall Status: ${this.testResults.summary.overallStatus}`);
        
        if (this.testResults.summary.critical > 0) {
            console.log('\n🚨 CRITICAL ISSUES FOUND:');
            this.testResults.tests
                .filter(test => test.critical && !test.passed)
                .forEach(test => {
                    console.log(`   • ${test.test}: ${test.details.error || 'Failed'}`);
                });
        }
        
        console.log('\n📋 TEST BREAKDOWN:');
        this.testResults.tests.forEach(test => {
            const icon = test.passed ? '✅' : '❌';
            const critical = test.critical && !test.passed ? ' (CRITICAL)' : '';
            console.log(`   ${icon} ${test.test}${critical}`);
        });
        
        console.log('=' .repeat(60));
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

// Main execution
async function runProductionValidation() {
    const validator = new ProductionValidator();
    
    try {
        await validator.initialize();
        
        // Test sequence
        console.log('\n🔍 Running production validation tests...\n');
        
        const siteAccessible = await validator.testSiteAccessibility();
        if (!siteAccessible) {
            console.log('🚨 Site not accessible - aborting further tests');
            return;
        }
        
        const chatbotPresent = await validator.testChatbotPresence();
        if (chatbotPresent) {
            const chatbotWorking = await validator.testChatbotFunctionality();
            
            if (chatbotWorking) {
                const { messages } = await validator.testGreetingMessage();
                await validator.testNuclearSecurity(messages);
                await validator.testInputField();
            }
        }
        
        await validator.testAPIEndpoint();
        await validator.testPerformance();
        
        // Generate reports
        const reportPath = await validator.generateReport();
        await validator.printSummary();
        
        console.log(`\n📄 Detailed report saved: ${reportPath}`);
        
    } catch (error) {
        console.error('💥 Validation suite crashed:', error.message);
        process.exit(1);
    } finally {
        await validator.cleanup();
    }
}

// Run if called directly
if (require.main === module) {
    runProductionValidation()
        .then(() => {
            console.log('\n✅ Production validation completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Production validation failed:', error);
            process.exit(1);
        });
}

module.exports = { ProductionValidator, runProductionValidation };