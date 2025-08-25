const puppeteer = require('puppeteer');

async function testStandalone() {
    console.log('🧪 Testing Standalone Chatbot...');
    console.log('=' .repeat(50));
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        // Capture console logs
        page.on('console', msg => {
            console.log(`[BROWSER]:`, msg.text());
        });
        
        console.log('📍 Loading standalone chatbot...');
        await page.goto('http://localhost:8082/tests/standalone-chatbot.html', {
            waitUntil: 'networkidle0',
            timeout: 10000
        });
        
        console.log('✅ Page loaded');
        
        // Look for chatbot button
        const buttonExists = await page.$('#chatbot-button');
        console.log(`🔍 Chatbot button: ${buttonExists ? 'Found' : 'Not found'}`);
        
        if (buttonExists) {
            // Click button
            await page.click('#chatbot-button');
            console.log('✅ Button clicked');
            
            // Wait for window
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Check window
            const windowVisible = await page.$eval('#chatbot-window', el => 
                el.style.display !== 'none'
            ).catch(() => false);
            
            console.log(`📱 Window visible: ${windowVisible}`);
            
            if (windowVisible) {
                // Get messages
                const messages = await page.$$eval('.message', msgs => 
                    msgs.map(m => m.textContent.trim())
                );
                
                console.log(`\n📝 Messages found: ${messages.length}`);
                messages.forEach((msg, i) => {
                    console.log(`  ${i+1}. ${msg}`);
                });
                
                // Check for system prompt
                const hasSystemPrompt = messages.some(msg => 
                    msg.includes('RICHIEDI SEMPRE') || 
                    msg.includes('professionale') ||
                    msg.includes('intercettare')
                );
                
                if (hasSystemPrompt) {
                    console.log('\n❌ SECURITY ISSUE: System prompt detected!');
                    return { success: false };
                }
                
                // Check for correct greeting
                const expectedGreeting = "[IT-ERA] Ciao! Sono l'assistente virtuale di IT-ERA. Come posso aiutarti oggi?";
                if (messages.length > 0 && messages[0] === expectedGreeting) {
                    console.log('\n✅ Correct greeting displayed!');
                    return { success: true };
                } else {
                    console.log('\n⚠️ Greeting not as expected');
                    return { success: false };
                }
            }
        }
        
        return { success: false };
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        return { success: false };
    } finally {
        await browser.close();
        console.log('\n🔄 Browser closed');
    }
}

// Run test
testStandalone()
    .then(result => {
        console.log('='.repeat(50));
        if (result.success) {
            console.log('🎉 CHATBOT TEST PASSED!');
            console.log('✅ No system prompts exposed');
            console.log('✅ Correct greeting displayed');
        } else {
            console.log('❌ CHATBOT TEST FAILED');
        }
        console.log('='.repeat(50));
        process.exit(result.success ? 0 : 1);
    });