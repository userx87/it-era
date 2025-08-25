const puppeteer = require('puppeteer');

async function debugUnexpectedToken() {
  console.log('🔍 Debug "Unexpected token \'<\'" error');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    defaultViewport: null 
  });
  
  try {
    const page = await browser.newPage();
    
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text());
      }
    });
    
    // Listen for network requests
    page.on('response', response => {
      console.log(`📡 ${response.status()} ${response.url()}`);
    });
    
    console.log('🌐 Opening admin panel...');
    await page.goto('https://it-era.pages.dev/admin/', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Check for JavaScript errors
    const errors = await page.evaluate(() => {
      return window.errors || [];
    });
    
    if (errors.length > 0) {
      console.log('🚨 Found JavaScript errors:', errors);
    }
    
    // Try to trigger login to see the error
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const hasError = await page.evaluate(() => {
      return window.console.error.toString();
    });
    
    console.log('✅ Check complete. Browser will stay open for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Error during debug:', error.message);
  } finally {
    await browser.close();
  }
}

debugUnexpectedToken();