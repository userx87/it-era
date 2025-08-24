const puppeteer = require('puppeteer');

async function testSimpleNavigation() {
  const browser = await puppeteer.launch({ 
    headless: false, 
    slowMo: 1000 
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      console.log('PAGE LOG:', msg.text());
    });
    
    // Enable error logging
    page.on('pageerror', error => {
      console.log('PAGE ERROR:', error.message);
    });
    
    console.log('Going to admin panel...');
    await page.goto('https://it-era.pages.dev/admin/', { waitUntil: 'networkidle2' });
    
    // Login
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.type('#loginEmail', 'admin@it-era.it');
    await page.type('#loginPassword', 'admin123!');
    await page.click('button[type="submit"]');
    
    // Wait for login
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('Logged in, testing Dashboard click...');
    
    // Try clicking Dashboard
    await page.evaluate(() => {
      console.log('Testing Dashboard function exists:', typeof loadDashboard);
      if (typeof loadDashboard === 'function') {
        console.log('Calling loadDashboard()');
        loadDashboard();
      } else {
        console.log('loadDashboard function not found');
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check content
    const content = await page.evaluate(() => {
      const mainContent = document.getElementById('mainContent');
      return {
        contentLength: mainContent ? mainContent.innerHTML.length : 0,
        contentPreview: mainContent ? mainContent.innerHTML.substring(0, 200) : 'No content'
      };
    });
    
    console.log('Main content length:', content.contentLength);
    console.log('Content preview:', content.contentPreview);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  // Keep browser open for inspection
  await new Promise(resolve => setTimeout(resolve, 30000));
  await browser.close();
}

testSimpleNavigation();