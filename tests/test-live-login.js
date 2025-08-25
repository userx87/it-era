const puppeteer = require('puppeteer');

async function testLiveLogin() {
  console.log('🔐 Test login live per trovare "Unexpected token"');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    defaultViewport: null,
    slowMo: 50
  });
  
  try {
    const page = await browser.newPage();
    
    // Intercetta tutti gli errori JavaScript
    page.on('pageerror', error => {
      console.log('🚨 PAGE ERROR:', error.message);
    });
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ CONSOLE ERROR:', msg.text());
      }
    });
    
    console.log('🌐 Apertura admin panel...');
    await page.goto('https://it-era.pages.dev/admin/', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('✅ Pagina caricata');
    
    // Aspetta che il form di login sia visibile
    await page.waitForSelector('#loginEmail', { timeout: 10000 });
    console.log('📋 Form di login trovato');
    
    // Inserisci credenziali
    await page.type('#loginEmail', 'admin@it-era.it');
    await page.type('#loginPassword', 'admin123');
    console.log('🔑 Credenziali inserite');
    
    // Click login button
    console.log('🔍 Click login button...');
    await page.click('button[type="submit"]');
    
    // Aspetta un po' per vedere cosa succede
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Controlla se c'è il token
    const hasToken = await page.evaluate(() => {
      return localStorage.getItem('auth_token') !== null;
    });
    
    console.log('🎫 Token presente:', hasToken);
    
    // Controlla se la dashboard è visibile
    const hasMainContent = await page.evaluate(() => {
      const mainContent = document.getElementById('mainContent');
      return mainContent && mainContent.style.display !== 'none';
    });
    
    console.log('📊 Dashboard visibile:', hasMainContent);
    
    console.log('✅ Test completato. Browser resta aperto per 15 secondi...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
  } catch (error) {
    console.error('❌ Errore durante test:', error.message);
  } finally {
    await browser.close();
  }
}

testLiveLogin();