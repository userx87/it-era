const puppeteer = require('puppeteer');

async function quickNavigationTest() {
  const browser = await puppeteer.launch({ 
    headless: true
  });
  
  try {
    const page = await browser.newPage();
    
    console.log('🔗 Quick navigation test...');
    await page.goto('https://it-era.pages.dev/admin/', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Quick login
    await page.type('#loginEmail', 'admin@it-era.it');
    await page.type('#loginPassword', 'admin123!');
    await page.click('button[type="submit"]');
    
    // Wait for auth
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    // Test dashboard function
    const result = await page.evaluate(async () => {
      try {
        // Check if functions exist
        const functionsExist = {
          loadDashboard: typeof loadDashboard === 'function',
          apiManager: typeof apiManager !== 'undefined',
          CONFIG: typeof CONFIG !== 'undefined'
        };
        
        if (functionsExist.loadDashboard && functionsExist.apiManager) {
          // Try calling dashboard
          const dashboardResponse = await apiManager.getDashboard();
          return {
            success: true,
            functionsExist,
            dashboardData: !!dashboardResponse,
            responseKeys: dashboardResponse ? Object.keys(dashboardResponse) : []
          };
        }
        
        return {
          success: false,
          functionsExist,
          error: 'Functions missing'
        };
        
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
    
    console.log('📊 Test Results:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Navigation API is working!');
    } else {
      console.log('❌ Navigation API has issues:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
}

quickNavigationTest();