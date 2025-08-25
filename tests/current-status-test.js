const puppeteer = require('puppeteer');

async function currentStatusTest() {
  console.log('🔍 Testing current admin panel status...');
  
  const browser = await puppeteer.launch({ headless: false });
  
  try {
    const page = await browser.newPage();
    
    // Monitor API calls
    page.on('response', response => {
      if (response.url().includes('dashboard') || response.url().includes('admin/api')) {
        console.log(`📡 API: ${response.status()} ${response.url()}`);
      }
    });
    
    console.log('Loading admin panel...');
    await page.goto('https://it-era.pages.dev/admin/');
    
    // Quick login
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.evaluate(() => {
      document.getElementById('loginEmail').value = 'admin@it-era.it';
      document.getElementById('loginPassword').value = 'admin123!';
      document.querySelector('button[type="submit"]').click();
    });
    
    // Wait for login
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    // Test current navigation functionality
    console.log('\n🔄 Testing Dashboard...');
    
    const testResult = await page.evaluate(async () => {
      try {
        // Check if functions exist
        const functionsExist = {
          loadDashboard: typeof loadDashboard === 'function',
          apiManager: typeof apiManager !== 'undefined',
          CONFIG: typeof CONFIG !== 'undefined'
        };
        
        if (!functionsExist.loadDashboard) {
          return { success: false, error: 'loadDashboard function not found', functionsExist };
        }
        
        if (!functionsExist.apiManager) {
          return { success: false, error: 'apiManager not found', functionsExist };
        }
        
        // Try to call loadDashboard
        console.log('Calling loadDashboard()...');
        await loadDashboard();
        
        // Wait a bit and check content
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const mainContent = document.getElementById('mainContent');
        const result = {
          success: true,
          contentLength: mainContent ? mainContent.innerHTML.length : 0,
          hasStats: mainContent ? mainContent.innerHTML.includes('Articoli Totali') : false,
          hasError: mainContent ? mainContent.innerHTML.includes('alert-danger') : false,
          functionsExist
        };
        
        return result;
        
      } catch (error) {
        return { 
          success: false, 
          error: error.message,
          functionsExist: {
            loadDashboard: typeof loadDashboard === 'function',
            apiManager: typeof apiManager !== 'undefined',
            CONFIG: typeof CONFIG !== 'undefined'
          }
        };
      }
    });
    
    console.log('\n📊 TEST RESULTS:');
    console.log(`Functions available: ${JSON.stringify(testResult.functionsExist, null, 2)}`);
    
    if (testResult.success) {
      console.log(`✅ Dashboard test successful!`);
      console.log(`   Content length: ${testResult.contentLength} chars`);
      console.log(`   Has stats: ${testResult.hasStats ? '✅' : '❌'}`);
      console.log(`   Has errors: ${testResult.hasError ? '❌' : '✅'}`);
      
      if (testResult.contentLength > 100 && testResult.hasStats) {
        console.log('\n🎉 SUCCESS: La navigazione del menu funziona perfettamente!');
      } else {
        console.log('\n⚠️ PARTIAL: Dashboard caricato ma API può avere problemi');
      }
      
    } else {
      console.log(`❌ Dashboard test failed: ${testResult.error}`);
    }
    
    // Keep open for inspection
    console.log('\n👀 Browser resterà aperto per 10 secondi per ispezione...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
    console.log('✅ Test completed');
  }
}

currentStatusTest();