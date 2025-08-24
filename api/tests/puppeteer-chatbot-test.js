const puppeteer = require('puppeteer');

/**
 * IT-ERA Chatbot Test with Puppeteer
 * Test the chatbot on the live website to debug connection issues
 */

async function testChatbotOnLiveWebsite() {
  console.log('🚀 Starting IT-ERA Chatbot Live Website Test...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Set to true for headless testing
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    console.log(`📝 Console [${msg.type()}]:`, msg.text());
  });
  
  // Listen for page errors
  page.on('pageerror', error => {
    console.log(`❌ Page Error:`, error.message);
  });
  
  // Listen for request failures
  page.on('requestfailed', request => {
    console.log(`🔥 Request Failed: ${request.url()} - ${request.failure().errorText}`);
  });
  
  try {
    console.log('1️⃣ Navigating to IT-ERA website...');
    await page.goto('https://it-era.pages.dev/', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('✅ Page loaded successfully\n');
    
    // Wait for page to fully load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('2️⃣ Looking for chatbot button...');
    
    // Check if chatbot button exists
    const chatbotButton = await page.$('#it-era-chatbot-button');
    
    if (chatbotButton) {
      console.log('✅ Chatbot button found!\n');
      
      console.log('3️⃣ Clicking chatbot button...');
      await chatbotButton.click();
      
      // Wait for chatbot window to appear
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if chatbot window opened
      const chatWindow = await page.$('#it-era-chatbot-window');
      const windowDisplay = await page.evaluate(() => {
        const window = document.getElementById('it-era-chatbot-window');
        return window ? getComputedStyle(window).display : 'not found';
      });
      
      console.log(`📱 Chatbot window display: ${windowDisplay}`);
      
      if (windowDisplay === 'flex' || windowDisplay === 'block') {
        console.log('✅ Chatbot window opened successfully!\n');
        
        console.log('4️⃣ Checking for initial message...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Get messages in the chatbot
        const messages = await page.evaluate(() => {
          const messagesContainer = document.getElementById('it-era-messages');
          if (!messagesContainer) return 'Messages container not found';
          
          const messageElements = messagesContainer.querySelectorAll('.it-era-message');
          return Array.from(messageElements).map(msg => {
            const bubble = msg.querySelector('.it-era-message-bubble');
            return bubble ? bubble.innerHTML : 'No content';
          });
        });
        
        console.log('💬 Messages found:', messages);
        
        // Check if we got the connection error
        const hasConnectionError = messages.some(msg => 
          msg.includes('Problemi di connessione') || 
          msg.includes('039 888 2041')
        );
        
        if (hasConnectionError) {
          console.log('❌ CONNECTION ERROR DETECTED! The chatbot is showing fallback message.');
          
          // Check network requests
          console.log('\n5️⃣ Checking network requests...');
          
          // Monitor API calls
          page.on('response', response => {
            if (response.url().includes('chatbot') || response.url().includes('api/chat')) {
              console.log(`🌐 API Response: ${response.url()} - Status: ${response.status()}`);
            }
          });
          
          // Try to trigger a new message
          console.log('6️⃣ Testing message send...');
          const input = await page.$('#it-era-message-input');
          if (input) {
            await input.type('Test message');
            await page.keyboard.press('Enter');
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Check new messages
            const newMessages = await page.evaluate(() => {
              const messagesContainer = document.getElementById('it-era-messages');
              const messageElements = messagesContainer.querySelectorAll('.it-era-message');
              return Array.from(messageElements).map(msg => {
                const bubble = msg.querySelector('.it-era-message-bubble');
                return bubble ? bubble.innerHTML : 'No content';
              });
            });
            
            console.log('💬 Messages after test:', newMessages);
          }
          
        } else {
          console.log('✅ Chatbot is working correctly - no connection errors detected!');
        }
        
      } else {
        console.log('❌ Chatbot window did not open properly');
      }
      
    } else {
      console.log('❌ Chatbot button not found on the page');
      
      // Check if the script is loaded
      const hasScript = await page.evaluate(() => {
        return document.querySelector('script[src*="chatbot"]') !== null ||
               document.body.innerHTML.includes('it-era-chatbot-container');
      });
      
      console.log(`📜 Chatbot script loaded: ${hasScript}`);
    }
    
    // Take a screenshot for debugging
    await page.screenshot({ 
      path: '/Users/andreapanzeri/progetti/IT-ERA/api/tests/chatbot-debug-screenshot.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved to tests/chatbot-debug-screenshot.png');
    
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
  }
  
  // Keep browser open for manual inspection
  console.log('\n⏳ Browser will stay open for 30 seconds for manual inspection...');
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  await browser.close();
  console.log('\n✅ Test completed!');
}

// Run the test
testChatbotOnLiveWebsite().catch(console.error);