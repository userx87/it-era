const puppeteer = require('puppeteer');

async function simpleDirectTest() {
  console.log('🚀 Simple direct navigation test...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  try {
    const page = await browser.newPage();
    
    console.log('📡 Navigating to admin panel...');
    await page.goto('https://it-era.pages.dev/admin/', { 
      waitUntil: 'networkidle0',
      timeout: 15000 
    });
    
    console.log('✅ Page loaded, starting login...');
    
    // Aspetta che la pagina sia pronta
    await page.waitForTimeout(2000);
    
    // Login diretto
    await page.evaluate(() => {
      document.getElementById('loginEmail').value = 'admin@it-era.it';
      document.getElementById('loginPassword').value = 'admin123!';
    });
    
    await page.click('button[type="submit"]');
    
    console.log('⏳ Waiting for login...');
    await page.waitForTimeout(4000);
    
    // Verifica login
    const isLoggedIn = await page.evaluate(() => {
      return localStorage.getItem('auth_token') !== null;
    });
    
    if (!isLoggedIn) {
      console.log('❌ Login failed');
      return;
    }
    
    console.log('✅ Login successful!');
    
    // Test Dashboard cliccando direttamente
    console.log('🔄 Testing Dashboard navigation...');
    
    await page.evaluate(() => {
      console.log('Clicking Dashboard...');
      const dashboardLink = document.querySelector('a[onclick="loadDashboard()"]');
      if (dashboardLink) {
        dashboardLink.click();
      } else {
        console.log('Dashboard link not found');
      }
    });
    
    // Aspetta risposta
    await page.waitForTimeout(4000);
    
    // Verifica risultato
    const result = await page.evaluate(() => {
      const mainContent = document.getElementById('mainContent');
      if (!mainContent) return { error: 'mainContent not found' };
      
      return {
        contentLength: mainContent.innerHTML.length,
        hasStats: mainContent.innerHTML.includes('Articoli Totali') || mainContent.innerHTML.includes('Dashboard'),
        hasError: mainContent.innerHTML.includes('alert-danger'),
        preview: mainContent.innerHTML.substring(0, 300).replace(/\s+/g, ' ')
      };
    });
    
    console.log('\n📊 DASHBOARD TEST RESULT:');
    console.log(`Content length: ${result.contentLength} characters`);
    console.log(`Has dashboard content: ${result.hasStats ? '✅ YES' : '❌ NO'}`);
    console.log(`Has errors: ${result.hasError ? '❌ YES' : '✅ NO'}`);
    console.log(`Preview: ${result.preview}`);
    
    if (result.contentLength > 100 && result.hasStats && !result.hasError) {
      console.log('\n🎉 SUCCESS: Dashboard navigation funziona perfettamente!');
    } else if (result.hasError) {
      console.log('\n❌ ERROR: Dashboard ha errori API');
    } else {
      console.log('\n⚠️ PARTIAL: Dashboard caricato ma contenuto limitato');
    }
    
    // Testa anche Posts
    console.log('\n🔄 Testing Posts navigation...');
    await page.evaluate(() => {
      const postsLink = document.querySelector('a[onclick="loadPosts()"]');
      if (postsLink) postsLink.click();
    });
    
    await page.waitForTimeout(3000);
    
    const postsResult = await page.evaluate(() => {
      const mainContent = document.getElementById('mainContent');
      return {
        contentLength: mainContent ? mainContent.innerHTML.length : 0,
        hasContent: mainContent ? mainContent.innerHTML.length > 50 : false
      };
    });
    
    console.log(`📝 Posts navigation: ${postsResult.hasContent ? '✅ Working' : '❌ Not working'} (${postsResult.contentLength} chars)`);
    
    console.log('\n✅ Navigation tests completed!');
    console.log('Browser will close in 3 seconds...');
    
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

simpleDirectTest();