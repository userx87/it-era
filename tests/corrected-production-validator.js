/**
 * CORRECTED PRODUCTION VALIDATION SUITE
 * Tests the complete IT-ERA chatbot system with CORRECT element selectors
 * 
 * Based on analysis of chat-widget.js:
 * - Button ID: itera-chat-button (not it-era-chatbot-button)
 * - Window ID: itera-chat-window
 * - Messages container: itera-chat-messages
 * - Message selector: .itera-chat-message
 * - Input ID: itera-chat-textarea
 */

const puppeteer = require('puppeteer');

class CorrectedProductionValidator {
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
            // Wait for DOM to be fully loaded
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Look for the CORRECT chatbot button ID from the code
            const button = await page.$('#itera-chat-button');
            
            if (!button) {
                // Try alternative selectors as fallback
                const altButtons = await page.$$('[id*="itera-chat"], [class*="itera-chat-button"], .itera-chat-button');
                
                if (altButtons.length > 0) {
                    this.results.warnings.push('Chatbot button found with alternative selector');
                    this.log('Chatbot button found with alternative selector', 'warning');
                } else {
                    this.results.errors.push('Chatbot button not found - expected #itera-chat-button');
                    this.log('Chatbot button not found - expected #itera-chat-button', 'error');
                    
                    // Debug: show what elements exist
                    const allElements = await page.evaluate(() => {
                        const elements = [];
                        document.querySelectorAll('[id*="chat"], [class*="chat"]').forEach(el => {
                            elements.push({
                                id: el.id,
                                className: el.className,
                                tag: el.tagName
                            });
                        });
                        return elements;
                    });
                    
                    this.log(`Debug - Found chat elements: ${JSON.stringify(allElements)}`, 'debug');
                    return false;
                }
            } else {
                this.results.buttonPresence = true;
                this.log('Chatbot button found with correct ID', 'success');
            }
            
            // Test button clickability
            try {
                await page.click('#itera-chat-button');
                this.results.buttonClickable = true;
                this.log('Chatbot button is clickable', 'success');
                
                // Wait for window to appear (longer wait as per code)
                await new Promise(resolve => setTimeout(resolve, 5000));
                
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
            // Check for chatbot window with CORRECT ID
            const window = await page.$('#itera-chat-window');
            
            if (!window) {
                this.results.errors.push('Chatbot window did not appear - expected #itera-chat-window');
                this.log('Chatbot window did not appear - expected #itera-chat-window', 'error');
                return false;
            }
            
            // Check if window is visible (not hidden)
            const isVisible = await page.evaluate(() => {
                const window = document.querySelector('#itera-chat-window');
                return window && !window.classList.contains('hidden');
            });
            
            if (!isVisible) {
                this.results.warnings.push('Chatbot window exists but is hidden');
                this.log('Chatbot window exists but is hidden', 'warning');
            } else {
                this.log('Chatbot window opened and visible', 'success');
            }
            
            // Wait for messages to load with extended timeout
            await new Promise(resolve => setTimeout(resolve, 8000));
            
            // Get all messages with CORRECT selector from code
            const messages = await page.evaluate(() => {
                const msgs = document.querySelectorAll('#itera-chat-messages .itera-chat-message');
                return Array.from(msgs).map(m => ({
                    text: m.textContent.trim(),
                    classList: Array.from(m.classList),
                    innerHTML: m.innerHTML
                })).filter(m => m.text.length > 0);
            });
            
            this.results.details.messageCount = messages.length;
            this.log(`Found ${messages.length} messages`, 'debug');
            
            if (messages.length === 0) {
                // Check for hardcoded greeting in HTML (from line 102-106)
                const hardcodedGreeting = await page.evaluate(() => {
                    const greetingDiv = document.querySelector('#itera-chat-messages .itera-chat-message.bot .itera-chat-message-content');
                    return greetingDiv ? greetingDiv.textContent.trim() : null;
                });
                
                if (hardcodedGreeting) {
                    this.results.details.firstMessage = hardcodedGreeting;
                    this.results.details.messageCount = 1;
                    this.log(`Found hardcoded greeting: "${hardcodedGreeting}"`, 'debug');
                    
                    if (hardcodedGreeting.includes('Ciao, come posso aiutarti?')) {
                        this.results.greetingMessage = true;
                        this.log('Correct greeting message found (hardcoded)', 'success');
                    } else {
                        this.results.warnings.push(`Unexpected hardcoded greeting: "${hardcodedGreeting}"`);
                        this.log(`Unexpected hardcoded greeting: "${hardcodedGreeting}"`, 'warning');
                    }
                } else {
                    this.results.warnings.push('No messages found in chatbot');
                    this.log('No messages found in chatbot', 'warning');
                }
            } else {
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
            }
            
            // Check for system prompt exposure with enhanced patterns
            const allContent = await page.evaluate(() => {
                const window = document.querySelector('#itera-chat-window');
                return window ? window.innerHTML : '';
            });
            
            const systemPromptIndicators = [
                'INIZIO:', 'RISPOSTA TIPO', 'SYSTEM_PROMPT', 'generateSystemPrompt',
                'Sei l\'assistente virtuale', 'REGOLE ASSOLUTE', 'IDENTITÀ:',
                'BusinessRules', 'systemPrompt', '# IDENTITÀ',
                'COMPORTAMENTO CONVERSAZIONALE', 'OBIETTIVI PRIMARI'
            ];
            
            const systemPromptFound = systemPromptIndicators.some(indicator => 
                allContent.includes(indicator)
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
                    const messages = document.querySelectorAll('#itera-chat-messages .itera-chat-message');
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
            // Check for input field with CORRECT ID
            const input = await page.$('#itera-chat-textarea');
            
            if (!input) {
                this.results.errors.push('Message input field not found - expected #itera-chat-textarea');
                this.log('Message input field not found - expected #itera-chat-textarea', 'error');
                return false;
            }
            
            this.log('Input field found', 'success');
            
            // Test sending a message
            const testMessage = "Ciao, avete assistenza per Milano?";
            await page.type('#itera-chat-textarea', testMessage);
            
            // Look for send button with CORRECT ID
            const sendButton = await page.$('#itera-chat-send');
            
            if (sendButton) {
                await sendButton.click();
                this.log('Test message sent via button', 'success');
            } else {
                // Try Enter key as per code (line 763-767)
                await page.keyboard.press('Enter');
                this.log('Test message sent via Enter key', 'success');
            }
            
            // Wait for response (longer timeout for API calls)
            await new Promise(resolve => setTimeout(resolve, 12000));
            
            // Check if new messages appeared
            const newMessages = await page.evaluate(() => {
                const msgs = document.querySelectorAll('#itera-chat-messages .itera-chat-message');
                return Array.from(msgs).map(m => m.textContent.trim()).filter(t => t.length > 0);
            });
            
            if (newMessages.length > (this.results.details.messageCount || 0)) {
                this.results.conversationFlow = true;
                this.results.details.conversationWorking = true;
                this.results.details.testMessageResponse = newMessages[newMessages.length - 1];
                this.log('Conversation flow working - received response', 'success');
                
                // Check if response contains system prompt
                const lastResponse = newMessages[newMessages.length - 1];
                const hasSystemPrompt = ['INIZIO:', 'SYSTEM_PROMPT', 'generateSystemPrompt'].some(indicator => 
                    lastResponse.includes(indicator)
                );
                
                if (hasSystemPrompt) {
                    this.results.errors.push('CRITICAL: System prompt in conversation response');
                    this.log('CRITICAL: System prompt in conversation response', 'error');
                }
                
            } else {
                this.results.warnings.push('Sent message but no response received');
                this.log('Sent message but no response received', 'warning');
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
            // Collect console errors
            const logs = [];
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    logs.push(msg.text());
                }
            });
            
            // Wait to collect any errors
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Check for visible error elements
            const errorElements = await page.$$('.error, .alert-danger, [class*="error"]');
            
            if (errorElements.length > 0) {
                const errorTexts = await Promise.all(
                    errorElements.map(el => page.evaluate(e => e.textContent, el))
                );
                
                this.results.warnings.push(`Found ${errorElements.length} error elements on page`);
                this.results.details.errorElements = errorTexts;
                this.log(`Found ${errorElements.length} error elements`, 'warning');
            }
            
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
        this.log('🚀 Starting CORRECTED Production Validation', 'info');
        this.log('Target: https://it-era.pages.dev/', 'info');
        this.log('Element IDs: itera-chat-button, itera-chat-window, itera-chat-messages', 'debug');
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
        console.log('📊 CORRECTED PRODUCTION VALIDATION REPORT');
        console.log('='.repeat(70));
        console.log(`🌐 Site: ${report.site}`);
        console.log(`⏱️  Test Time: ${report.results.performance.totalTestTime}ms`);
        console.log(`📈 Success Rate: ${report.testsSummary.successRate} (${report.testsSummary.passed}/${report.testsSummary.total})`);
        
        console.log('\n📋 TEST RESULTS:');
        console.log(`  ${this.results.siteAccess ? '✅' : '❌'} Site Access: ${this.results.siteAccess ? 'PASS' : 'FAIL'}`);
        console.log(`  ${this.results.buttonPresence ? '✅' : '❌'} Button Presence: ${this.results.buttonPresence ? 'PASS' : 'FAIL'}`);
        console.log(`  ${this.results.buttonClickable ? '✅' : '❌'} Button Clickable: ${this.results.buttonClickable ? 'PASS' : 'FAIL'}`);
        console.log(`  ${this.results.greetingMessage ? '✅' : '❌'} Greeting Message: ${this.results.greetingMessage ? 'PASS' : 'FAIL'}`);
        console.log(`  ${this.results.noSystemPrompts ? '✅' : '❌'} No System Prompts: ${this.results.noSystemPrompts ? 'PASS' : 'FAIL'}`);
        console.log(`  ${this.results.phoneNumberDisplay ? '✅' : '❌'} Phone Display: ${this.results.phoneNumberDisplay ? 'PASS' : 'FAIL'}`);
        console.log(`  ${this.results.conversationFlow ? '✅' : '❌'} Conversation Flow: ${this.results.conversationFlow ? 'PASS' : 'FAIL'}`);
        console.log(`  ${this.results.errorHandling ? '✅' : '❌'} Error Handling: ${this.results.errorHandling ? 'PASS' : 'FAIL'}`);
        
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
        
        console.log('\n📋 DETAILED RESULTS:');
        if (this.results.details.firstMessage) {
            console.log(`  📝 First Message: "${this.results.details.firstMessage}"`);
        }
        if (this.results.details.messageCount) {
            console.log(`  💬 Message Count: ${this.results.details.messageCount}`);
        }
        if (this.results.details.loadTime) {
            console.log(`  ⏱️  Load Time: ${this.results.details.loadTime}`);
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
module.exports = CorrectedProductionValidator;

// Run if called directly
if (require.main === module) {
    const validator = new CorrectedProductionValidator();
    validator.runCompleteValidation()
        .then(report => {
            process.exit(report.isProductionReady ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Validation suite crashed:', error);
            process.exit(1);
        });
}