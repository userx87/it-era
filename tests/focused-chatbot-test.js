/**
 * FOCUSED CHATBOT TEST for REAL PRODUCTION SITE
 * Testing https://it-era.pages.dev for chatbot functionality
 */

const puppeteer = require('puppeteer');

async function testChatbotOnProduction() {
    console.log('🚀 Testing Chatbot on REAL Production Site: https://it-era.pages.dev');
    console.log('=' .repeat(70));
    
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 500,
        defaultViewport: { width: 1920, height: 1080 }
    });
    
    try {
        const page = await browser.newPage();
        
        // Monitor console messages
        const consoleMessages = [];
        page.on('console', msg => {
            const logEntry = {
                type: msg.type(),
                text: msg.text(),
                timestamp: new Date().toLocaleTimeString()
            };
            consoleMessages.push(logEntry);
            
            if (msg.type() === 'error') {
                console.log(`❌ JS Error: ${msg.text()}`);
            } else if (msg.text().includes('chatbot') || msg.text().includes('IT-ERA')) {
                console.log(`🤖 Chatbot Log: ${msg.text()}`);
            }
        });
        
        // Monitor network requests
        const networkRequests = [];
        page.on('request', request => {
            if (request.url().includes('api') || request.url().includes('chat') || request.url().includes('bot')) {
                networkRequests.push({
                    url: request.url(),
                    method: request.method(),
                    timestamp: new Date().toLocaleTimeString()
                });
                console.log(`🌐 API Request: ${request.method()} ${request.url()}`);
            }
        });
        
        page.on('response', response => {
            if (response.url().includes('api') || response.url().includes('chat') || response.url().includes('bot')) {
                console.log(`📡 API Response: ${response.status()} ${response.url()}`);
            }
        });
        
        // Step 1: Navigate to production site
        console.log('\n1️⃣ Navigating to production site...');
        await page.goto('https://it-era.pages.dev', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        const title = await page.title();
        console.log(`✅ Page loaded: ${title}`);
        
        // Step 2: Wait for page to fully load
        console.log('\n2️⃣ Waiting for page elements to load...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Step 3: Look for chatbot button
        console.log('\n3️⃣ Looking for chatbot button...');
        
        const chatbotSelectors = [
            '#it-era-chatbot-button',
            '.chatbot-button',
            '[data-chatbot="button"]',
            '.chat-button',
            '#chatbot-btn',
            'button[id*="chatbot"]',
            'button[class*="chatbot"]',
            '.floating-chat-button',
            '.chat-widget-button'
        ];
        
        let buttonFound = false;
        let buttonSelector = null;
        
        for (const selector of chatbotSelectors) {
            try {
                const button = await page.$(selector);
                if (button) {
                    const isVisible = await button.isIntersectingViewport();
                    if (isVisible) {
                        buttonFound = true;
                        buttonSelector = selector;
                        console.log(`✅ Chatbot button found: ${selector}`);
                        break;
                    }
                }
            } catch (error) {
                // Continue to next selector
            }
        }
        
        if (!buttonFound) {
            console.log('❌ Chatbot button NOT found with any selector');
            
            // Debug: Check what elements are actually on the page
            console.log('\n🔍 Debugging - Looking for any button-like elements:');
            const allButtons = await page.$$eval('button, [role="button"], .btn, [class*="button"]', buttons => 
                buttons.map(btn => ({
                    tagName: btn.tagName,
                    id: btn.id || 'no-id',
                    className: btn.className || 'no-class',
                    text: btn.textContent?.trim() || 'no-text',
                    visible: btn.offsetParent !== null
                })).filter(btn => btn.visible)
            );
            
            console.log('Visible buttons found:', allButtons);
            return { success: false, error: 'Chatbot button not found' };
        }
        
        // Step 4: Click the chatbot button
        console.log('\n4️⃣ Clicking chatbot button...');
        await page.click(buttonSelector);
        console.log('✅ Button clicked');
        
        // Step 5: Wait for chatbot window to appear
        console.log('\n5️⃣ Waiting for chatbot window...');
        await page.waitForTimeout(3000);
        
        const windowSelectors = [
            '#it-era-chatbot-window',
            '.chatbot-window',
            '[data-chatbot="window"]',
            '.chat-window',
            '.chatbot-container',
            '.chat-widget',
            '.chatbot-modal'
        ];
        
        let windowFound = false;
        let windowSelector = null;
        
        for (const selector of windowSelectors) {
            try {
                const window = await page.$(selector);
                if (window) {
                    const isVisible = await window.isIntersectingViewport();
                    if (isVisible) {
                        windowFound = true;
                        windowSelector = selector;
                        console.log(`✅ Chatbot window found and visible: ${selector}`);
                        break;
                    }
                }
            } catch (error) {
                // Continue to next selector
            }
        }
        
        if (!windowFound) {
            console.log('❌ Chatbot window did NOT open or is not visible');
            return { success: false, error: 'Chatbot window not found after clicking button' };
        }
        
        // Step 6: Look for messages in the chatbot
        console.log('\n6️⃣ Checking for chatbot messages...');
        await new Promise(resolve => setTimeout(resolve, 5000)); // Give time for greeting message
        
        const messageSelectors = [
            '#it-era-messages',
            '.chatbot-messages',
            '[data-chatbot="messages"]',
            '.chat-messages',
            '.message-container',
            '.chatbot-conversation'
        ];
        
        let messagesFound = false;
        let messageData = [];
        
        for (const selector of messageSelectors) {
            try {
                const messagesContainer = await page.$(selector);
                if (messagesContainer) {
                    const messages = await page.$$eval(`${selector} .message, ${selector} .chatbot-message, ${selector} [class*="message"]`, messages => 
                        messages.map(msg => ({
                            text: msg.textContent?.trim() || '',
                            className: msg.className || '',
                            visible: msg.offsetParent !== null
                        })).filter(msg => msg.text && msg.visible)
                    );
                    
                    if (messages.length > 0) {
                        messagesFound = true;
                        messageData = messages;
                        console.log(`✅ Found ${messages.length} messages in chatbot`);
                        messages.forEach((msg, i) => {
                            console.log(`   Message ${i+1}: "${msg.text}"`);
                        });
                        break;
                    }
                }
            } catch (error) {
                // Continue to next selector
            }
        }
        
        if (!messagesFound) {
            console.log('⚠️  No messages found in chatbot (but window opened)');
        }
        
        // Step 7: Check for greeting message issues
        console.log('\n7️⃣ Checking for greeting message issues...');
        const greetingIssues = messageData.filter(msg => 
            msg.text.includes('SYSTEM_PROMPT') || 
            msg.text.includes('INIZIO:') ||
            msg.text.includes('generateSystemPrompt') ||
            msg.text.includes('RISPOSTA TIPO') ||
            msg.text.includes('Sei l\'assistente virtuale')
        );
        
        if (greetingIssues.length > 0) {
            console.log('🚨 CRITICAL: System prompt detected in user-visible messages!');
            greetingIssues.forEach(issue => {
                console.log(`   Issue: "${issue.text}"`);
            });
        } else {
            console.log('✅ No system prompt issues detected in visible messages');
        }
        
        // Step 8: Test message sending
        console.log('\n8️⃣ Testing message sending...');
        const inputSelectors = [
            '#it-era-message-input',
            '.chatbot-input',
            '[data-chatbot="input"]',
            '.chat-input',
            'input[type="text"]',
            'textarea'
        ];
        
        let inputFound = false;
        for (const selector of inputSelectors) {
            try {
                const input = await page.$(selector);
                if (input) {
                    await input.type('Test automatico - verifica funzionamento');
                    await page.keyboard.press('Enter');
                    console.log('✅ Test message sent');
                    inputFound = true;
                    
                    // Wait for response
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    break;
                }
            } catch (error) {
                // Continue to next selector
            }
        }
        
        if (!inputFound) {
            console.log('⚠️  Input field not found - cannot test message sending');
        }
        
        // Final summary
        console.log('\n' + '='.repeat(70));
        console.log('🏆 CHATBOT TEST RESULTS');
        console.log('='.repeat(70));
        console.log(`✅ Site loaded: YES`);
        console.log(`✅ Button found: ${buttonFound ? 'YES' : 'NO'}`);
        console.log(`✅ Window opened: ${windowFound ? 'YES' : 'NO'}`);
        console.log(`✅ Messages found: ${messagesFound ? 'YES' : 'NO'} (${messageData.length} messages)`);
        console.log(`✅ Input field: ${inputFound ? 'YES' : 'NO'}`);
        console.log(`⚠️  Greeting issues: ${greetingIssues.length > 0 ? 'YES - CRITICAL' : 'NO'}`);
        console.log(`🌐 API calls made: ${networkRequests.length}`);
        console.log(`📝 Console messages: ${consoleMessages.length}`);
        
        const overallSuccess = buttonFound && windowFound && greetingIssues.length === 0;
        console.log(`\n🎯 OVERALL SUCCESS: ${overallSuccess ? 'PASS' : 'FAIL'}`);
        
        return {
            success: overallSuccess,
            details: {
                buttonFound,
                windowFound,
                messagesFound,
                inputFound,
                greetingIssues: greetingIssues.length,
                apiCalls: networkRequests.length,
                consoleLogs: consoleMessages.length
            },
            messages: messageData,
            networkRequests,
            consoleMessages
        };
        
    } catch (error) {
        console.error('💥 Test failed with error:', error.message);
        return { success: false, error: error.message };
    } finally {
        await browser.close();
        console.log('🔄 Browser closed');
    }
}

// Run the test
testChatbotOnProduction()
    .then(results => {
        console.log('\n🎭 Test completed!');
        if (results.success) {
            console.log('🎉 Chatbot is working correctly on production!');
            process.exit(0);
        } else {
            console.log('❌ Chatbot test failed. Please check the issues above.');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('💥 Test execution failed:', error);
        process.exit(1);
    });