const puppeteer = require('puppeteer');

async function fastNavigationTest() {
  const browser = await puppeteer.launch({ 
    headless: false, 
    slowMo: 200,  // Solo 200ms invece di 2000ms
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Log solo errori importanti
    page.on('console', msg => {
      if (msg.text().includes('Error') || msg.text().includes('Failed')) {
        console.log('❌ ERROR:', msg.text());
      }
    });
    
    page.on('pageerror', error => {
      console.log('❌ PAGE ERROR:', error.message);
    });
    
    // Monitor solo API calls
    page.on('response', response => {
      if (response.url().includes('dashboard') || response.url().includes('admin/api')) {
        const status = response.status();
        const statusIcon = status === 200 ? '✅' : '❌';
        console.log(`${statusIcon} API: ${status} ${response.url()}`);
      }
    });
    
    console.log('🚀 Fast navigation test starting...');
    await page.goto('https://it-era.pages.dev/admin/', { waitUntil: 'domcontentloaded' });
    
    // Login veloce
    await page.waitForSelector('#loginEmail', { timeout: 10000 });
    await page.type('#loginEmail', 'admin@it-era.it', { delay: 20 });
    await page.type('#loginPassword', 'admin123!', { delay: 20 });
    await page.click('button[type="submit"]');
    
    // Aspetta login
    await page.waitForFunction(() => localStorage.getItem('auth_token') !== null, { timeout: 10000 });
    console.log('✅ Login completato velocemente!');
    
    // Test rapido Dashboard
    console.log('🔄 Test Dashboard...');
    await page.click('a[onclick="loadDashboard()"]');
    
    // Aspetta risposta API o timeout
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const dashboardResult = await page.evaluate(() => {
      const mainContent = document.getElementById('mainContent');
      return {
        hasContent: mainContent && mainContent.innerHTML.length > 100,
        hasError: mainContent ? mainContent.innerHTML.includes('alert-danger') : false,
        contentLength: mainContent ? mainContent.innerHTML.length : 0
      };
    });
    
    console.log('📊 Dashboard result:');
    console.log(`   Content: ${dashboardResult.hasContent ? '✅' : '❌'} (${dashboardResult.contentLength} chars)`);
    console.log(`   Errors: ${dashboardResult.hasError ? '❌ SI' : '✅ NO'}`);
    
    if (dashboardResult.hasContent && !dashboardResult.hasError) {
      console.log('🎉 SUCCESS: Dashboard navigation funziona!');
    } else {
      console.log('⚠️ ISSUE: Dashboard ha problemi');
    }
    
    // Test rapido Posts
    console.log('🔄 Test Posts...');
    await page.click('a[onclick="loadPosts()"]');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const postsResult = await page.evaluate(() => {
      const mainContent = document.getElementById('mainContent');
      return {
        hasContent: mainContent && mainContent.innerHTML.length > 50,
        contentLength: mainContent ? mainContent.innerHTML.length : 0
      };
    });
    
    console.log(`📝 Posts: ${postsResult.hasContent ? '✅' : '❌'} (${postsResult.contentLength} chars)`);
    
    console.log('\n🎯 Test completato! Browser si chiuderà in 5 secondi...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

fastNavigationTest();