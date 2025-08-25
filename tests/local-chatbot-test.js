const puppeteer = require('puppeteer');

async function testLocalChatbot() {
    console.log('🧪 Testing Local Chatbot with Nuclear Security...');
    console.log('=' .repeat(50));
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        // Capture console logs
        page.on('console', msg => {
            if (msg.type() === 'log' || msg.type() === 'error') {
                console.log(`[BROWSER ${msg.type().toUpperCase()}]:`, msg.text());
            }
        });
        
        // Test local server
        console.log('📍 Loading local server at http://localhost:8082/web/');
        await page.goto('http://localhost:8082/web/', {
            waitUntil: 'networkidle0',
            timeout: 10000
        });
        
        console.log('✅ Page loaded');
        
        // Look for chatbot button
        const buttonSelector = '#it-era-chatbot-button';
        await page.waitForSelector(buttonSelector, { timeout: 5000 });
        console.log('✅ Chatbot button found');
        
        // Click chatbot button
        await page.click(buttonSelector);
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('✅ Chatbot button clicked');
        
        // Check for chat window
        const windowSelector = '#it-era-chatbot-window';
        const windowVisible = await page.$(windowSelector);
        
        if (windowVisible) {
            console.log('✅ Chat window opened');
            
            // Wait for messages to load
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Get all messages - check both selectors
            let messages = [];
            try {
                // Try with correct class
                messages = await page.$$eval('.it-era-message', msgs => 
                    msgs.map(m => m.textContent.trim())
                );
            } catch(e) {
                console.log('⚠️ No messages found with .it-era-message selector');
            }
            
            // Also check the container
            const containerText = await page.$eval('#it-era-messages', el => el.textContent.trim()).catch(() => '');
            console.log('Container text:', containerText || '(empty)');
            
            console.log(`\n📝 Messages found: ${messages.length}`);
            if (messages.length > 0) {
                console.log('First message:', messages[0]);
                
                // Security check
                const systemPromptPatterns = [
                    'Sei pronto',
                    'intercettare',
                    'opportunità',
                    'Messaggio iniziale',
                    'professionale',
                    'commerciale',
                    'primo filtro',
                    'Non sei un tecnico',
                    'RICHIEDI SEMPRE',
                    'INIZIA CON'
                ];
                
                const hasSystemPrompt = messages.some(msg => 
                    systemPromptPatterns.some(pattern => 
                        msg.toLowerCase().includes(pattern.toLowerCase())
                    )
                );
                
                if (hasSystemPrompt) {
                    console.log('❌ SECURITY ALERT: System prompt detected!');
                    return { success: false, error: 'System prompt exposed' };
                } else {
                    console.log('✅ Security check passed - No system prompts');
                }
                
                // Check for correct greeting
                const expectedGreeting = '[IT-ERA] Ciao! Sono l\'assistente virtuale di IT-ERA. Come posso aiutarti oggi?';
                if (messages[0] === expectedGreeting) {
                    console.log('✅ Correct greeting displayed');
                } else {
                    console.log('⚠️ Greeting differs from expected');
                    console.log('Expected:', expectedGreeting);
                    console.log('Actual:', messages[0]);
                }
            }
            
            return { 
                success: true,
                messages: messages
            };
            
        } else {
            console.log('❌ Chat window did not open');
            return { success: false, error: 'Window not opened' };
        }
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
        return { success: false, error: error.message };
    } finally {
        await browser.close();
        console.log('🔄 Browser closed');
    }
}

// Run test
testLocalChatbot()
    .then(result => {
        console.log('\n' + '='.repeat(50));
        console.log(`🎯 RESULT: ${result.success ? 'SUCCESS' : 'FAILED'}`);
        
        if (result.success) {
            console.log('🎉 Nuclear security is working!');
            console.log('Messages:', result.messages);
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