/**
 * COMPREHENSIVE PRODUCTION VALIDATION SUITE
 * Tests the complete IT-ERA chatbot system on live production site
 * 
 * Tests covered:
 * 1. Site accessibility and loading
 * 2. Chatbot button presence and functionality
 * 3. Greeting message validation
 * 4. System prompt exposure check
 * 5. Emergency phone number display
 * 6. Conversation flow testing
 * 7. Error handling and fallbacks
 * 8. Performance metrics
 */

const puppeteer = require('puppeteer');

class ProductionValidator {
    constructor() {
        this.results = {
            siteAccess: false,
            buttonPresence: false,
            buttonClickable: false,
            greetingMessage: false,
            noSystemPrompts: false,
            phoneNumberDisplay: false,
            conversationFlow: false,
            errorHandling: false,
            performance: {},
            errors: [],
            warnings: [],
            details: {}
        };
        
        this.startTime = Date.now();
        this.expectedGreeting = "[IT-ERA] Ciao, come posso aiutarti?";
        this.expectedPhone = "039 888 2041";
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
        const icons = { info: '📋', success: '✅', error: '❌', warning: '⚠️', debug: '🔍' };
        console.log(`[${timestamp}] ${icons[type]} ${message}`);
    }

    async validateSiteAccess(page) {
        this.log('Testing site accessibility...', 'info');
        
        try {
            const loadStart = Date.now();
            await page.goto('https://it-era.pages.dev/', { 
                waitUntil: 'networkidle0',
                timeout: 25000 
            });
            
            const loadTime = Date.now() - loadStart;
            this.results.performance.siteLoadTime = loadTime;
            
            // Check if site loaded properly
            const title = await page.title();
            const hasContent = await page.$('body');
            
            if (hasContent && title) {
                this.results.siteAccess = true;
                this.results.details.pageTitle = title;
                this.results.details.loadTime = `${loadTime}ms`;
                this.log(`Site loaded successfully in ${loadTime}ms`, 'success');
                this.log(`Page title: "${title}"`, 'debug');
                return true;
            } else {
                this.results.errors.push('Site loaded but missing basic content');
                this.log('Site loaded but missing basic content', 'error');
                return false;
            }
        } catch (error) {
            this.results.errors.push(`Site access failed: ${error.message}`);
            this.log(`Site access failed: ${error.message}`, 'error');
            return false;
        }
    }

    async validateChatbotButton(page) {
        this.log('Validating chatbot button presence and functionality...', 'info');
        
        try {
            // Look for the chatbot button
            const button = await page.$('#it-era-chatbot-button');
            
            if (!button) {
                // Try alternative selectors
                const altButtons = await page.$$('[id*="chatbot"], [class*="chatbot"], [data-chatbot]');
                
                if (altButtons.length > 0) {
                    this.results.warnings.push('Chatbot button found with alternative selector');
                    this.log('Chatbot button found with alternative selector', 'warning');
                } else {
                    this.results.errors.push('Chatbot button not found');
                    this.log('Chatbot button not found', 'error');
                    return false;
                }
            }
            
            this.results.buttonPresence = true;
            this.log('Chatbot button found', 'success');
            
            // Test button clickability
            try {
                await page.click('#it-era-chatbot-button');
                this.results.buttonClickable = true;
                this.log('Chatbot button is clickable', 'success');
                
                // Wait for potential animation/loading
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                return true;
            } catch (clickError) {
                this.results.errors.push(`Button click failed: ${clickError.message}`);
                this.log(`Button click failed: ${clickError.message}`, 'error');
                return false;
            }
            
        } catch (error) {
            this.results.errors.push(`Button validation failed: ${error.message}`);
            this.log(`Button validation failed: ${error.message}`, 'error');
            return false;
        }
    }

    async validateChatbotWindow(page) {
        this.log('Validating chatbot window and greeting...', 'info');
        
        try {
            // Check for chatbot window
            const window = await page.$('#it-era-chatbot-window');
            
            if (!window) {
                this.results.errors.push('Chatbot window did not appear');
                this.log('Chatbot window did not appear', 'error');
                return false;
            }
            
            this.log('Chatbot window opened', 'success');
            
            // Wait for messages to load
            await new Promise(resolve => setTimeout(resolve, 4000));
            
            // Get all messages
            const messages = await page.$$eval('#it-era-messages .it-era-message', msgs => 
                msgs.map(m => ({
                    text: m.textContent.trim(),
                    classList: Array.from(m.classList),
                    innerHTML: m.innerHTML
                })).filter(m => m.text.length > 0)
            );
            
            this.results.details.messageCount = messages.length;
            this.log(`Found ${messages.length} messages`, 'debug');
            
            if (messages.length === 0) {
                this.results.warnings.push('No messages found in chatbot');
                this.log('No messages found in chatbot', 'warning');
                return false;
            }
            
            // Validate greeting message
            const firstMessage = messages[0];
            this.results.details.firstMessage = firstMessage.text;
            
            if (firstMessage.text.includes('Ciao, come posso aiutarti?')) {
                this.results.greetingMessage = true;
                this.log('Correct greeting message found', 'success');
            } else {
                this.results.warnings.push(`Unexpected greeting: "${firstMessage.text}"`);
                this.log(`Unexpected greeting: "${firstMessage.text}"`, 'warning');
            }
            
            // Check for system prompt exposure
            const systemPromptFound = messages.some(msg => 
                msg.text.includes('SYSTEM_PROMPT') || 
                msg.text.includes('INIZIO:') ||
                msg.text.includes('generateSystemPrompt') ||
                msg.text.includes('You are') ||
                msg.text.includes('Assistant:') ||
                msg.innerHTML.includes('&lt;system&gt;') ||
                msg.innerHTML.includes('<system>')
            );
            
            if (systemPromptFound) {
                this.results.errors.push('CRITICAL: System prompt exposed to user');
                this.log('CRITICAL: System prompt exposed to user', 'error');
            } else {
                this.results.noSystemPrompts = true;
                this.log('No system prompt exposure detected', 'success');
            }
            
            return true;
            
        } catch (error) {
            this.results.errors.push(`Window validation failed: ${error.message}`);
            this.log(`Window validation failed: ${error.message}`, 'error');
            return false;
        }
    }

    async validatePhoneNumberDisplay(page) {
        this.log('Validating emergency phone number display...', 'info');
        
        try {
            // Check if phone number is visible anywhere on the page
            const phoneFound = await page.evaluate((expectedPhone) => {
                const pageText = document.body.innerText;
                return pageText.includes(expectedPhone);
            }, this.expectedPhone);
            
            if (phoneFound) {
                this.results.phoneNumberDisplay = true;
                this.log(`Phone number ${this.expectedPhone} found on page`, 'success');
            } else {
                // Check in chatbot messages specifically
                const phoneInChat = await page.evaluate((expectedPhone) => {
                    const messages = document.querySelectorAll('#it-era-messages .it-era-message');
                    for (let msg of messages) {
                        if (msg.textContent.includes(expectedPhone)) return true;
                    }
                    return false;
                }, this.expectedPhone);
                
                if (phoneInChat) {
                    this.results.phoneNumberDisplay = true;
                    this.log(`Phone number ${this.expectedPhone} found in chat`, 'success');
                } else {
                    this.results.warnings.push(`Phone number ${this.expectedPhone} not visible`);
                    this.log(`Phone number ${this.expectedPhone} not visible`, 'warning');
                }
            }
            
            return this.results.phoneNumberDisplay;
            
        } catch (error) {
            this.results.errors.push(`Phone validation failed: ${error.message}`);
            this.log(`Phone validation failed: ${error.message}`, 'error');
            return false;
        }
    }

    async validateConversationFlow(page) {
        this.log('Testing conversation flow...', 'info');
        
        try {
            // Check for input field
            const input = await page.$('#it-era-message-input');
            
            if (!input) {
                this.results.errors.push('Message input field not found');
                this.log('Message input field not found', 'error');
                return false;
            }
            
            this.log('Input field found', 'success');
            
            // Test sending a message
            const testMessage = "Ciao, avete assistenza per Milano?";
            await page.type('#it-era-message-input', testMessage);
            
            // Look for send button
            const sendButton = await page.$('#it-era-send-button, button[type="submit"], .send-button');
            
            if (sendButton) {
                await sendButton.click();
                this.log('Test message sent', 'success');
                
                // Wait for response
                await new Promise(resolve => setTimeout(resolve, 8000));
                
                // Check if new messages appeared
                const newMessages = await page.$$eval('#it-era-messages .it-era-message', msgs => 
                    msgs.map(m => m.textContent.trim()).filter(t => t.length > 0)
                );
                
                if (newMessages.length > this.results.details.messageCount) {
                    this.results.conversationFlow = true;
                    this.results.details.conversationWorking = true;
                    this.results.details.testMessageResponse = newMessages[newMessages.length - 1];
                    this.log('Conversation flow working - received response', 'success');
                } else {
                    this.results.warnings.push('Sent message but no response received');
                    this.log('Sent message but no response received', 'warning');
                }
            } else {
                // Try Enter key
                await page.keyboard.press('Enter');
                await new Promise(resolve => setTimeout(resolve, 5000));
                
                const newMessages = await page.$$eval('#it-era-messages .it-era-message', msgs => 
                    msgs.map(m => m.textContent.trim()).filter(t => t.length > 0)
                );
                
                if (newMessages.length > this.results.details.messageCount) {
                    this.results.conversationFlow = true;
                    this.results.details.conversationWorking = true;
                    this.log('Conversation flow working via Enter key', 'success');
                } else {
                    this.results.warnings.push('Could not find send button or trigger message send');
                    this.log('Could not find send button or trigger message send', 'warning');
                }
            }
            
            return this.results.conversationFlow;
            
        } catch (error) {
            this.results.errors.push(`Conversation flow test failed: ${error.message}`);
            this.log(`Conversation flow test failed: ${error.message}`, 'error');
            return false;
        }
    }

    async validateErrorHandling(page) {
        this.log('Testing error handling and fallbacks...', 'info');
        
        try {
            // Test network error simulation (if possible)
            // Check for error states in the UI
            const errorElements = await page.$$('.error, .alert-danger, [class*="error"]');
            
            if (errorElements.length > 0) {
                const errorTexts = await Promise.all(
                    errorElements.map(el => page.evaluate(e => e.textContent, el))
                );
                
                this.results.warnings.push(`Found ${errorElements.length} error elements on page`);
                this.results.details.errorElements = errorTexts;
                this.log(`Found ${errorElements.length} error elements`, 'warning');
            }
            
            // Check console errors
            const logs = [];
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    logs.push(msg.text());
                }
            });
            
            // Wait a moment to collect any errors
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            if (logs.length > 0) {
                this.results.warnings.push(`${logs.length} console errors detected`);
                this.results.details.consoleErrors = logs;
                this.log(`${logs.length} console errors detected`, 'warning');
            } else {
                this.results.errorHandling = true;
                this.log('No console errors detected', 'success');
            }
            
            return true;
            
        } catch (error) {
            this.results.errors.push(`Error handling test failed: ${error.message}`);
            this.log(`Error handling test failed: ${error.message}`, 'error');
            return false;
        }
    }

    async runCompleteValidation() {
        this.log('🚀 Starting Comprehensive Production Validation', 'info');
        this.log('Target: https://it-era.pages.dev/', 'info');
        this.log('='.repeat(70), 'info');
        
        const browser = await puppeteer.launch({
            headless: true,
            timeout: 30000,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        try {
            const page = await browser.newPage();
            
            // Set viewport for consistent testing
            await page.setViewport({ width: 1200, height: 800 });
            
            // Enable console logging
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    this.log(`Console Error: ${msg.text()}`, 'error');
                }
            });
            
            // Run all validation tests
            await this.validateSiteAccess(page);
            
            if (this.results.siteAccess) {
                await this.validateChatbotButton(page);
                
                if (this.results.buttonClickable) {
                    await this.validateChatbotWindow(page);
                    await this.validatePhoneNumberDisplay(page);
                    await this.validateConversationFlow(page);
                }
                
                await this.validateErrorHandling(page);
            }
            
            // Calculate overall performance
            this.results.performance.totalTestTime = Date.now() - this.startTime;
            
        } catch (error) {
            this.results.errors.push(`Test suite failed: ${error.message}`);
            this.log(`Test suite failed: ${error.message}`, 'error');
        } finally {
            await browser.close();
            this.log('Browser closed', 'debug');
        }
        
        return this.generateReport();
    }

    generateReport() {
        const totalTests = 8;
        const passedTests = Object.values(this.results).slice(0, totalTests).filter(v => v === true).length;
        const successRate = ((passedTests / totalTests) * 100).toFixed(1);
        
        const report = {
            timestamp: new Date().toISOString(),
            site: 'https://it-era.pages.dev/',
            testsSummary: {
                total: totalTests,
                passed: passedTests,
                failed: totalTests - passedTests,
                successRate: `${successRate}%`
            },
            results: this.results,
            criticalIssues: this.results.errors.length,
            warnings: this.results.warnings.length,
            isProductionReady: this.results.errors.length === 0 && passedTests >= 6,
            recommendations: this.generateRecommendations()
        };
        
        this.printReport(report);
        return report;
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (!this.results.greetingMessage) {
            recommendations.push("Fix chatbot greeting message to display '[IT-ERA] Ciao, come posso aiutarti?'");
        }
        
        if (!this.results.noSystemPrompts) {
            recommendations.push("CRITICAL: Remove system prompt exposure from user interface");
        }
        
        if (!this.results.phoneNumberDisplay) {
            recommendations.push("Ensure emergency phone number (039 888 2041) is visible");
        }
        
        if (!this.results.conversationFlow) {
            recommendations.push("Fix conversation flow - messages not sending/receiving properly");
        }
        
        if (this.results.performance.siteLoadTime > 5000) {
            recommendations.push("Optimize site loading time (currently over 5 seconds)");
        }
        
        if (this.results.warnings.length > 0) {
            recommendations.push("Address reported warnings for better user experience");
        }
        
        if (recommendations.length === 0) {
            recommendations.push("All tests passed! System is production ready.");
        }
        
        return recommendations;
    }

    printReport(report) {
        console.log('\n' + '='.repeat(70));
        console.log('📊 PRODUCTION VALIDATION REPORT');
        console.log('='.repeat(70));
        console.log(`🌐 Site: ${report.site}`);
        console.log(`⏱️  Test Time: ${report.results.performance.totalTestTime}ms`);
        console.log(`📈 Success Rate: ${report.testsSummary.successRate} (${report.testsSummary.passed}/${report.testsSummary.total})`);
        
        console.log('\n📋 TEST RESULTS:');
        console.log(`  ✅ Site Access: ${this.results.siteAccess ? 'PASS' : 'FAIL'}`);
        console.log(`  ✅ Button Presence: ${this.results.buttonPresence ? 'PASS' : 'FAIL'}`);
        console.log(`  ✅ Button Clickable: ${this.results.buttonClickable ? 'PASS' : 'FAIL'}`);
        console.log(`  ✅ Greeting Message: ${this.results.greetingMessage ? 'PASS' : 'FAIL'}`);
        console.log(`  ✅ No System Prompts: ${this.results.noSystemPrompts ? 'PASS' : 'FAIL'}`);
        console.log(`  ✅ Phone Display: ${this.results.phoneNumberDisplay ? 'PASS' : 'FAIL'}`);
        console.log(`  ✅ Conversation Flow: ${this.results.conversationFlow ? 'PASS' : 'FAIL'}`);
        console.log(`  ✅ Error Handling: ${this.results.errorHandling ? 'PASS' : 'FAIL'}`);
        
        if (report.criticalIssues > 0) {
            console.log(`\n🚨 CRITICAL ISSUES (${report.criticalIssues}):`);
            this.results.errors.forEach((error, i) => {
                console.log(`  ${i + 1}. ${error}`);
            });
        }
        
        if (report.warnings > 0) {
            console.log(`\n⚠️  WARNINGS (${report.warnings}):`);
            this.results.warnings.forEach((warning, i) => {
                console.log(`  ${i + 1}. ${warning}`);
            });
        }
        
        console.log('\n🎯 RECOMMENDATIONS:');
        report.recommendations.forEach((rec, i) => {
            console.log(`  ${i + 1}. ${rec}`);
        });
        
        console.log(`\n🚀 PRODUCTION READY: ${report.isProductionReady ? 'YES ✅' : 'NO ❌'}`);
        console.log('='.repeat(70));
        
        return report;
    }
}

// Export for use in other scripts
module.exports = ProductionValidator;

// Run if called directly
if (require.main === module) {
    const validator = new ProductionValidator();
    validator.runCompleteValidation()
        .then(report => {
            process.exit(report.isProductionReady ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Validation suite crashed:', error);
            process.exit(1);
        });
}