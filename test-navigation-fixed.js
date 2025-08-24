const puppeteer = require('puppeteer');

async function testNavigationFixed() {
  const browser = await puppeteer.launch({ 
    headless: false, 
    slowMo: 1500 
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable request/response logging
    page.on('response', response => {
      if (response.url().includes('dashboard')) {
        console.log(`📡 API Response: ${response.status()} ${response.url()}`);
      }
    });
    
    page.on('request', request => {
      if (request.url().includes('dashboard')) {
        console.log(`📤 API Request: ${request.method()} ${request.url()}`);
      }
    });
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.text().includes('Dashboard') || msg.text().includes('API') || msg.text().includes('Error')) {
        console.log('🖥️  PAGE:', msg.text());
      }
    });
    
    console.log('🔗 Going to admin panel...');
    await page.goto('https://it-era.pages.dev/admin/', { waitUntil: 'networkidle2' });
    
    // Login
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('🔐 Logging in...');
    await page.type('#loginEmail', 'admin@it-era.it');
    await page.type('#loginPassword', 'admin123!');
    await page.click('button[type="submit"]');
    
    // Wait for login
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('📊 Testing Dashboard navigation...');
    
    // Click Dashboard link
    await page.click('a[onclick="loadDashboard()"]');
    
    // Wait for API call
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if dashboard loaded
    const dashboardTest = await page.evaluate(() => {
      const mainContent = document.getElementById('mainContent');
      return {
        hasContent: mainContent && mainContent.innerHTML.length > 500,
        contentLength: mainContent ? mainContent.innerHTML.length : 0,
        hasStats: mainContent ? mainContent.innerHTML.includes('Articoli Totali') : false,
        hasCharts: mainContent ? mainContent.innerHTML.includes('Quick Actions') : false,
        hasError: mainContent ? mainContent.innerHTML.includes('alert-danger') : false
      };
    });
    
    console.log('\n📈 Dashboard Test Results:');
    console.log(`   Content loaded: ${dashboardTest.hasContent}`);
    console.log(`   Content length: ${dashboardTest.contentLength} chars`);
    console.log(`   Has stats cards: ${dashboardTest.hasStats}`);
    console.log(`   Has quick actions: ${dashboardTest.hasCharts}`);
    console.log(`   Has errors: ${dashboardTest.hasError}`);
    
    if (dashboardTest.hasContent && dashboardTest.hasStats) {
      console.log('✅ Dashboard loaded successfully!');
    } else if (dashboardTest.hasError) {
      console.log('❌ Dashboard has errors');
    } else {
      console.log('⚠️  Dashboard content incomplete');
    }
    
    // Test Posts navigation
    console.log('\n📝 Testing Posts navigation...');
    await page.click('a[onclick="loadPosts()"]');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const postsTest = await page.evaluate(() => {
      const mainContent = document.getElementById('mainContent');
      return {
        contentLength: mainContent ? mainContent.innerHTML.length : 0,
        hasPostsContent: mainContent ? mainContent.innerHTML.includes('Post') : false,
        hasError: mainContent ? mainContent.innerHTML.includes('alert-danger') : false,
        hasInfo: mainContent ? mainContent.innerHTML.includes('in sviluppo') : false
      };
    });
    
    console.log(`   Posts content length: ${postsTest.contentLength} chars`);
    if (postsTest.hasInfo) {
      console.log('   ℹ️  Posts shows "in sviluppo" message (expected)');
    } else if (postsTest.hasError) {
      console.log('   ❌ Posts has errors');
    } else {
      console.log('   ✅ Posts navigation working');
    }
    
    console.log('\n🎉 Navigation test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await new Promise(resolve => setTimeout(resolve, 10000));
    await browser.close();
  }
}

testNavigationFixed();