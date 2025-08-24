const puppeteer = require('puppeteer');

async function testAdminLogin() {
  const browser = await puppeteer.launch({ 
    headless: false, // Show browser for debugging
    slowMo: 1000,   // Slow down actions
    devtools: true  // Open DevTools
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable request interception to log network requests
    await page.setRequestInterception(true);
    page.on('request', request => {
      console.log(`REQUEST: ${request.method()} ${request.url()}`);
      if (request.postData()) {
        console.log(`POST DATA: ${request.postData()}`);
      }
      request.continue();
    });
    
    page.on('response', response => {
      console.log(`RESPONSE: ${response.status()} ${response.url()}`);
    });
    
    // Navigate to admin panel
    console.log('Navigating to admin panel...');
    await page.goto('http://localhost:3000/web/admin/index.html', { 
      waitUntil: 'networkidle2', 
      timeout: 10000 
    });
    
    // Wait for page to fully load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check what's happening on the page
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        bodyContent: document.body.innerHTML.length,
        scripts: Array.from(document.scripts).map(s => s.src || 'inline'),
        hasLoginModal: !!document.getElementById('loginModal'),
        modalDisplay: document.getElementById('loginModal')?.style.display,
        hasAuthManager: typeof authManager !== 'undefined',
        authStatus: typeof authManager !== 'undefined' ? authManager.isAuthenticated : 'undefined',
        console: typeof console !== 'undefined'
      };
    });
    
    console.log('Page info:', pageInfo);
    
    // Try to trigger the modal show manually
    if (pageInfo.hasLoginModal) {
      console.log('Modal exists, trying to show it...');
      await page.evaluate(() => {
        if (typeof authManager !== 'undefined') {
          authManager.showLoginModal();
        }
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      console.log('Modal does not exist in DOM');
    }
    
    // Check if CONFIG is loaded
    const configCheck = await page.evaluate(() => {
      return {
        configExists: typeof CONFIG !== 'undefined',
        apiBaseUrl: typeof CONFIG !== 'undefined' ? CONFIG.API_BASE_URL : 'undefined'
      };
    });
    console.log('CONFIG check:', configCheck);
    
    // Fill in login form
    console.log('Filling login form...');
    await page.type('#loginEmail', 'admin@it-era.it');
    await page.type('#loginPassword', 'admin123!');
    
    // Submit form
    console.log('Submitting login form...');
    await page.click('button[type="submit"]');
    
    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check login result
    const loginResult = await page.evaluate(() => {
      const token = localStorage.getItem('blog_admin_token');
      const modal = document.getElementById('loginModal');
      const currentUser = document.getElementById('currentUser').textContent;
      
      return {
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        modalDisplay: modal ? modal.style.display : 'unknown',
        currentUser: currentUser,
        authManagerStatus: typeof authManager !== 'undefined' ? authManager.isAuthenticated : 'undefined'
      };
    });
    
    console.log('Login result:', loginResult);
    
    if (loginResult.hasToken) {
      console.log('✅ Login successful! Token saved to localStorage');
    } else {
      console.log('❌ Login failed - no token found');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

testAdminLogin();