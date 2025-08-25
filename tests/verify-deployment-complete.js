const puppeteer = require('puppeteer');

async function verifyDeploymentComplete() {
  const browser = await puppeteer.launch({ 
    headless: false, 
    slowMo: 1000 
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console and error logging
    page.on('console', msg => {
      if (msg.text().includes('API') || msg.text().includes('Dashboard') || msg.text().includes('Error')) {
        console.log('📋 PAGE LOG:', msg.text());
      }
    });
    
    page.on('pageerror', error => {
      console.log('❌ PAGE ERROR:', error.message);
    });
    
    // Monitor network requests
    page.on('response', response => {
      if (response.url().includes('dashboard') || response.url().includes('admin/api')) {
        console.log(`📡 API Response: ${response.status()} ${response.url()}`);
      }
    });
    
    console.log('🔗 Loading admin panel...');
    await page.goto('https://it-era.pages.dev/admin/', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Quick login
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('🔐 Logging in...');
    await page.type('#loginEmail', 'admin@it-era.it');
    await page.type('#loginPassword', 'admin123!');
    await page.click('button[type="submit"]');
    
    // Wait for auth
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    console.log('✅ Login completed, testing deployment status...');
    
    // Check if api.js file has been updated
    const apiFileContent = await page.evaluate(async () => {
      try {
        const response = await fetch('/admin/js/api.js');
        const content = await response.text();
        return {
          hasFixedUrlLogic: content.includes("endpoint.startsWith('http')"),
          contentLength: content.length,
          lastModified: response.headers.get('last-modified')
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('📄 API File Status:', apiFileContent);
    
    if (apiFileContent.hasFixedUrlLogic) {
      console.log('✅ Deployment complete! Fixed api.js is now served');
      
      // Test Dashboard API call
      console.log('🔄 Testing Dashboard navigation...');
      const dashboardResult = await page.evaluate(async () => {
        try {
          console.log('Calling loadDashboard()...');
          if (typeof loadDashboard === 'function') {
            await loadDashboard();
            return { success: true, message: 'Dashboard loaded successfully' };
          } else {
            return { success: false, message: 'loadDashboard function not found' };
          }
        } catch (error) {
          return { success: false, error: error.message };
        }
      });
      
      console.log('📊 Dashboard Test Result:', dashboardResult);
      
      // Wait and check content
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const contentCheck = await page.evaluate(() => {
        const mainContent = document.getElementById('mainContent');
        return {
          hasContent: mainContent && mainContent.innerHTML.length > 500,
          contentLength: mainContent ? mainContent.innerHTML.length : 0,
          hasStats: mainContent ? mainContent.innerHTML.includes('Articoli Totali') : false,
          hasError: mainContent ? mainContent.innerHTML.includes('alert-danger') : false
        };
      });
      
      console.log('📈 Content Check:', contentCheck);
      
      if (contentCheck.hasContent && contentCheck.hasStats) {
        console.log('🎉 SUCCESS! Admin navigation is working perfectly!');
        return true;
      } else if (contentCheck.hasError) {
        console.log('❌ Still has errors, deployment might need more time');
        return false;
      } else {
        console.log('⚠️ Partial success, content loading');
        return false;
      }
      
    } else {
      console.log('⏳ Deployment still in progress, old api.js being served');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  } finally {
    await new Promise(resolve => setTimeout(resolve, 5000));
    await browser.close();
  }
}

async function runDeploymentCheck() {
  console.log('🚀 Checking deployment status...');
  const isComplete = await verifyDeploymentComplete();
  
  if (isComplete) {
    console.log('\n✅ DEPLOYMENT VERIFIED: Admin navigation is working!');
  } else {
    console.log('\n⏳ DEPLOYMENT PENDING: Will need to check again in a few minutes');
  }
  
  return isComplete;
}

runDeploymentCheck();