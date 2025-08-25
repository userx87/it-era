/**
 * DETAILED CHATBOT INVESTIGATION
 * Deep dive into chatbot behavior and messaging system
 */

const puppeteer = require('puppeteer');

async function detailedChatbotInvestigation() {
    console.log('🔍 DETAILED CHATBOT INVESTIGATION');
    console.log('='.repeat(60));
    
    const browser = await puppeteer.launch({
        headless: false, // Visual debugging
        slowMo: 100,
        timeout: 30000,
        devtools: true
    });
    
    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 800 });
        
        // Capture all console messages
        page.on('console', msg => {
            const type = msg.type();
            if (['log', 'info', 'warn', 'error'].includes(type)) {
                console.log(`[CONSOLE ${type.toUpperCase()}] ${msg.text()}`);
            }
        });
        
        // Capture network requests
        page.on('response', response => {
            if (response.url().includes('chatbot') || response.url().includes('api')) {
                console.log(`[NETWORK] ${response.status()} ${response.url()}`);
            }
        });
        
        console.log('📥 Loading https://it-era.pages.dev/...');
        await page.goto('https://it-era.pages.dev/', { 
            waitUntil: 'networkidle0',
            timeout: 25000 
        });
        
        console.log('✅ Site loaded');
        
        // Wait a bit for any async loading
        await page.waitForTimeout(3000);
        
        // Look for chatbot elements
        console.log('\n🔍 Searching for chatbot elements...');
        
        const chatbotElements = await page.evaluate(() => {
            const elements = [];
            
            // Look for specific IDs
            const ids = ['it-era-chatbot-button', 'it-era-chatbot-window', 'it-era-messages', 'it-era-message-input'];
            ids.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    elements.push({
                        type: 'id',
                        selector: `#${id}`,
                        exists: true,
                        visible: el.offsetParent !== null,
                        innerHTML: el.innerHTML.substring(0, 200) + '...'
                    });
                } else {
                    elements.push({
                        type: 'id',
                        selector: `#${id}`,
                        exists: false
                    });
                }
            });
            
            // Look for chatbot-related classes or attributes
            const chatbotEls = document.querySelectorAll('[class*="chatbot"], [id*="chatbot"], [data-chatbot]');
            chatbotEls.forEach((el, i) => {
                elements.push({
                    type: 'chatbot-related',
                    selector: `Element ${i}`,
                    tag: el.tagName,
                    id: el.id,
                    classList: Array.from(el.classList),
                    visible: el.offsetParent !== null
                });
            });
            
            return elements;
        });
        
        console.log('\n📋 Chatbot Elements Found:');
        chatbotElements.forEach(el => {
            console.log(`  ${el.exists !== false ? '✅' : '❌'} ${el.selector}`);
            if (el.exists !== false) {
                console.log(`      Visible: ${el.visible}`);
                if (el.innerHTML) {
                    console.log(`      Content preview: ${el.innerHTML.substring(0, 100)}...`);
                }
            }
        });
        
        // Try to click chatbot button
        console.log('\n🖱️  Attempting to click chatbot button...');
        
        try {
            const button = await page.$('#it-era-chatbot-button');
            if (button) {
                console.log('✅ Button found, clicking...');
                await button.click();
                
                // Wait for window to appear
                console.log('⏳ Waiting for chatbot window...');
                await page.waitForTimeout(5000);
                
                // Check if window appeared
                const window = await page.$('#it-era-chatbot-window');
                if (window) {
                    console.log('✅ Chatbot window opened');
                    
                    // Wait longer for messages to load
                    console.log('⏳ Waiting for messages to load...');
                    await page.waitForTimeout(8000);
                    
                    // Try multiple message selectors
                    const messageSelectors = [
                        '#it-era-messages .it-era-message',
                        '#it-era-messages .message',
                        '#it-era-messages div',
                        '.it-era-message',
                        '.message',
                        '[class*="message"]'
                    ];
                    
                    for (const selector of messageSelectors) {
                        const messages = await page.$$(selector);
                        console.log(`📝 Messages found with "${selector}": ${messages.length}`);
                        
                        if (messages.length > 0) {
                            const messageTexts = await page.$$eval(selector, msgs => 
                                msgs.map(m => ({
                                    text: m.textContent.trim(),
                                    html: m.innerHTML.substring(0, 200),
                                    classList: Array.from(m.classList)
                                }))
                            );
                            
                            console.log('📋 Message details:');
                            messageTexts.forEach((msg, i) => {
                                console.log(`  ${i + 1}. "${msg.text}"`);
                                console.log(`      Classes: [${msg.classList.join(', ')}]`);
                                console.log(`      HTML: ${msg.html}...`);
                            });
                        }
                    }
                    
                    // Check entire chatbot content
                    const chatbotContent = await page.$eval('#it-era-chatbot-window', el => el.innerHTML);
                    console.log('\n📄 Full chatbot window content (first 500 chars):');
                    console.log(chatbotContent.substring(0, 500) + '...');
                    
                    // Try to send a test message
                    console.log('\n💬 Testing message input...');
                    const input = await page.$('#it-era-message-input');
                    if (input) {
                        console.log('✅ Input field found');
                        await page.type('#it-era-message-input', 'Test message');
                        console.log('📝 Typed test message');
                        
                        // Try different ways to send
                        await page.keyboard.press('Enter');
                        console.log('⌨️  Pressed Enter');
                        
                        // Wait for response
                        await page.waitForTimeout(10000);
                        console.log('⏳ Waited for response');
                        
                        // Check messages again
                        const finalMessages = await page.$$eval('#it-era-messages .it-era-message', msgs => 
                            msgs.map(m => m.textContent.trim()).filter(t => t.length > 0)
                        );
                        
                        console.log(`📝 Final message count: ${finalMessages.length}`);
                        if (finalMessages.length > 0) {
                            finalMessages.forEach((msg, i) => {
                                console.log(`  ${i + 1}. "${msg}"`);
                            });
                        }
                    } else {
                        console.log('❌ Input field not found');
                    }
                    
                } else {
                    console.log('❌ Chatbot window did not open');
                }
            } else {
                console.log('❌ Chatbot button not found');
            }
        } catch (clickError) {
            console.error('❌ Click error:', clickError.message);
        }
        
        // Keep browser open for manual inspection
        console.log('\n🔍 Browser kept open for manual inspection...');
        console.log('Press Ctrl+C to close');
        
        // Wait indefinitely for manual inspection
        await new Promise(() => {});
        
    } catch (error) {
        console.error('💥 Investigation failed:', error);
    } finally {
        // Don't close browser automatically for debugging
        // await browser.close();
    }
}

// Run investigation
detailedChatbotInvestigation();