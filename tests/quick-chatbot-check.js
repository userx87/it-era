/**
 * QUICK CHATBOT CHECK - Real Production Site Test
 */

const puppeteer = require('puppeteer');

async function quickChatbotCheck() {
    console.log('🚀 Quick Chatbot Check: https://it-era.it');
    console.log('=' .repeat(50));
    
    const browser = await puppeteer.launch({
        headless: true, // Faster headless mode
        timeout: 30000
    });
    
    try {
        const page = await browser.newPage();
        
        // Navigate to live production domain
        console.log('🌐 Loading live production site...');
        await page.goto('https://it-era.it/', { 
            waitUntil: 'networkidle0',
            timeout: 25000 
        });
        
        console.log('✅ Site loaded successfully');
        
        // Check for chatbot button
        console.log('🔍 Looking for chatbot button...');
        const buttonExists = await page.$('#it-era-chatbot-button');
        
        if (buttonExists) {
            console.log('✅ Chatbot button found!');
            
            // Click button
            console.log('🖱️ Clicking chatbot button...');
            await page.click('#it-era-chatbot-button');
            
            // Wait briefly for window
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Check for window
            const windowExists = await page.$('#it-era-chatbot-window');
            
            if (windowExists) {
                console.log('✅ Chatbot window opened!');
                
                // Check for messages
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                const messages = await page.$$eval('#it-era-messages .it-era-message', msgs => 
                    msgs.map(m => m.textContent.trim()).filter(t => t.length > 0)
                );
                
                console.log(`📝 Messages found: ${messages.length}`);
                if (messages.length > 0) {
                    console.log('   First message:', messages[0]);
                    
                    // Check for system prompt issues
                    const hasSystemPrompt = messages.some(msg => 
                        msg.includes('SYSTEM_PROMPT') || 
                        msg.includes('INIZIO:') ||
                        msg.includes('generateSystemPrompt')
                    );
                    
                    if (hasSystemPrompt) {
                        console.log('🚨 CRITICAL: System prompt visible to user!');
                        return { success: false, error: 'System prompt exposed' };
                    } else {
                        console.log('✅ No system prompt issues');
                    }
                }
                
                // Check input field
                const inputExists = await page.$('#it-era-message-input');
                console.log(`💬 Input field: ${inputExists ? 'Found' : 'Not found'}`);
                
                return { 
                    success: true, 
                    details: {
                        buttonExists: true,
                        windowExists: true,
                        messageCount: messages.length,
                        inputExists: !!inputExists,
                        firstMessage: messages[0] || 'None'
                    }
                };
                
            } else {
                console.log('❌ Chatbot window did not open');
                return { success: false, error: 'Window did not open' };
            }
            
        } else {
            console.log('❌ Chatbot button not found');
            
            // Debug: Look for any chatbot-related elements
            const chatElements = await page.$$eval('[id*="chatbot"], [class*="chatbot"], [data-chatbot]', elements =>
                elements.map(el => ({
                    tag: el.tagName,
                    id: el.id,
                    class: el.className,
                    text: el.textContent?.slice(0, 50) || ''
                }))
            );
            
            console.log('🔍 Chatbot-related elements found:', chatElements.length);
            if (chatElements.length > 0) {
                chatElements.forEach((el, i) => {
                    console.log(`   ${i+1}. ${el.tag}#${el.id}.${el.class}: "${el.text}"`);
                });
            }
            
            return { success: false, error: 'Button not found' };
        }
        
    } catch (error) {
        console.error('💥 Error:', error.message);
        return { success: false, error: error.message };
    } finally {
        await browser.close();
        console.log('🔄 Browser closed');
    }
}

// Run check
quickChatbotCheck()
    .then(result => {
        console.log('\n' + '='.repeat(50));
        console.log(`🎯 RESULT: ${result.success ? 'SUCCESS' : 'FAILED'}`);
        
        if (result.success) {
            console.log('🎉 Chatbot is working on production!');
            console.log('Details:', result.details);
        } else {
            console.log('❌ Issue:', result.error);
        }
        
        console.log('='.repeat(50));
        process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
        console.error('💥 Test crashed:', error);
        process.exit(1);
    });