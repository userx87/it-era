const puppeteer = require('puppeteer');

async function testChatbotOpening() {
  console.log('🧪 Testing IT-ERA Chatbot Opening...\n');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false, // Visualizza il browser
      devtools: true,  // Apri DevTools per debug
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Cattura errori console
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('❌ Console Error:', msg.text());
      }
    });
    
    // Cattura errori di pagina
    page.on('pageerror', error => {
      console.error('❌ Page Error:', error.message);
    });
    
    // Cattura richieste fallite
    page.on('requestfailed', request => {
      console.error('❌ Request Failed:', request.url(), '-', request.failure().errorText);
    });
    
    console.log('📱 Navigating to local IT-ERA website...');
    await page.goto('http://localhost:8080/web/index.html', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    console.log('⏳ Waiting for chatbot button...');
    
    // Attendi che il chatbot sia caricato
    try {
      await page.waitForSelector('#itera-chat-button', { 
        timeout: 10000,
        visible: true 
      });
      console.log('✅ Chatbot button found!');
    } catch (e) {
      console.error('❌ Chatbot button NOT found!');
      
      // Controlla se il widget esiste
      const widgetExists = await page.evaluate(() => {
        return document.getElementById('itera-chat-widget') !== null;
      });
      console.log('Widget container exists:', widgetExists);
      
      // Controlla se ci sono errori di script
      const scripts = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script'));
        return scripts.map(s => ({
          src: s.src || 'inline',
          loaded: s.src ? s.complete : true
        }));
      });
      console.log('Scripts loaded:', scripts);
    }
    
    // Prova a cliccare il bottone
    console.log('🖱️ Attempting to click chatbot button...');
    try {
      await page.click('#itera-chat-button');
      console.log('✅ Button clicked!');
      
      // Attendi che la finestra si apra
      await page.waitForSelector('#itera-chat-window:not(.hidden)', {
        timeout: 5000
      });
      console.log('✅ Chat window opened!');
      
      // Cattura il messaggio di benvenuto
      const greetingMessage = await page.evaluate(() => {
        const messages = document.querySelector('#itera-chat-messages');
        if (messages) {
          const firstMessage = messages.querySelector('.itera-chat-message-content');
          return firstMessage ? firstMessage.textContent : null;
        }
        return null;
      });
      
      console.log('\n📝 Greeting Message:', greetingMessage);
      
      // Verifica se il messaggio contiene istruzioni interne
      if (greetingMessage) {
        if (greetingMessage.includes('INIZIO:') || 
            greetingMessage.includes('RISPOSTA TIPO') ||
            greetingMessage.includes('Ogni conversazione inizia')) {
          console.error('\n🚨 CRITICAL: System prompts exposed to user!');
        } else if (greetingMessage.includes('[IT-ERA]')) {
          console.log('✅ Correct greeting format with [IT-ERA] prefix');
        } else {
          console.warn('⚠️ Greeting missing [IT-ERA] prefix');
        }
      }
      
    } catch (clickError) {
      console.error('❌ Failed to open chatbot:', clickError.message);
      
      // Cattura screenshot per debug
      await page.screenshot({ 
        path: 'chatbot-error.png',
        fullPage: true 
      });
      console.log('📸 Screenshot saved as chatbot-error.png');
      
      // Cattura HTML per analisi
      const html = await page.content();
      require('fs').writeFileSync('chatbot-page.html', html);
      console.log('📄 HTML saved as chatbot-page.html');
    }
    
    // Test API direttamente
    console.log('\n🔌 Testing API directly...');
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('https://it-era-chatbot-prod.bulltech.workers.dev/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://www.it-era.it'
          },
          body: JSON.stringify({ action: 'start' })
        });
        const data = await response.json();
        return { status: response.status, data };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('API Response:', JSON.stringify(apiResponse, null, 2));
    
    // Mantieni aperto per debug manuale
    console.log('\n⏸️ Browser will stay open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Esegui il test
testChatbotOpening().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Test crashed:', error);
  process.exit(1);
});