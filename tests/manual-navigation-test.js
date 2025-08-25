const puppeteer = require('puppeteer');

async function manualNavigationTest() {
  const browser = await puppeteer.launch({ 
    headless: false, 
    slowMo: 2000 
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable detailed logging
    page.on('console', msg => {
      console.log('🖥️  PAGE:', msg.text());
    });
    
    page.on('pageerror', error => {
      console.log('❌ PAGE ERROR:', error.message);
    });
    
    // Monitor network
    page.on('response', response => {
      if (response.url().includes('api') || response.url().includes('.js')) {
        const status = response.status();
        const statusIcon = status === 200 ? '✅' : status >= 400 ? '❌' : '⚠️';
        console.log(`${statusIcon} ${status} ${response.url()}`);
      }
    });
    
    page.on('requestfailed', request => {
      console.log('❌ FAILED:', request.url(), request.failure().errorText);
    });
    
    console.log('🌐 Navigating to admin panel...');
    await page.goto('https://it-era.pages.dev/admin/', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Login process
    console.log('🔐 Starting login...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await page.type('#loginEmail', 'admin@it-era.it');
    await page.type('#loginPassword', 'admin123!');
    await page.click('button[type="submit"]');
    
    console.log('⏳ Waiting for authentication...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check current state
    const currentState = await page.evaluate(() => {
      return {
        loggedIn: localStorage.getItem('auth_token') !== null,
        currentPath: window.location.pathname,
        hasMainContent: !!document.getElementById('mainContent'),
        functionsAvailable: {
          loadDashboard: typeof loadDashboard === 'function',
          loadPosts: typeof loadPosts === 'function',
          apiManager: typeof apiManager !== 'undefined',
          CONFIG: typeof CONFIG !== 'undefined'
        }
      };
    });
    
    console.log('📊 Current State:', JSON.stringify(currentState, null, 2));
    
    if (!currentState.loggedIn) {
      console.log('❌ Login failed, stopping test');
      return;
    }
    
    console.log('✅ Login successful, testing menu navigation...');
    
    // Test each menu item with detailed error reporting
    const menuItems = [
      { name: 'Dashboard', function: 'loadDashboard()', selector: 'a[onclick="loadDashboard()"]' },
      { name: 'Posts', function: 'loadPosts()', selector: 'a[onclick="loadPosts()"]' },
      { name: 'Categories', function: 'loadCategories()', selector: 'a[onclick="loadCategories()"]' },
      { name: 'Tags', function: 'loadTags()', selector: 'a[onclick="loadTags()"]' },
      { name: 'Media', function: 'loadMedia()', selector: 'a[onclick="loadMedia()"]' },
      { name: 'Analytics', function: 'loadAnalytics()', selector: 'a[onclick="loadAnalytics()"]' }
    ];
    
    for (const item of menuItems) {
      console.log(`\n🔄 Testing ${item.name}...`);
      
      try {
        // Click menu item
        await page.click(item.selector);
        
        // Wait for potential API calls
        await new Promise(resolve => setTimeout(resolve, 4000));
        
        // Check result
        const result = await page.evaluate((itemName) => {
          const mainContent = document.getElementById('mainContent');
          return {
            contentLength: mainContent ? mainContent.innerHTML.length : 0,
            hasError: mainContent ? mainContent.innerHTML.includes('alert-danger') : false,
            hasContent: mainContent ? mainContent.innerHTML.length > 100 : false,
            contentPreview: mainContent ? mainContent.innerHTML.substring(0, 200) : '',
            lastError: window.lastAPIError || null
          };
        }, item.name);
        
        console.log(`   📏 Content length: ${result.contentLength}`);
        console.log(`   ${result.hasError ? '❌' : '✅'} Has errors: ${result.hasError}`);
        console.log(`   ${result.hasContent ? '✅' : '❌'} Has content: ${result.hasContent}`);
        
        if (result.lastError) {
          console.log(`   🚨 Last error: ${result.lastError}`);
        }
        
        if (result.contentLength > 0 && result.contentLength < 200) {
          console.log(`   📋 Content preview: ${result.contentPreview.replace(/\s+/g, ' ').trim()}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Failed to test ${item.name}:`, error.message);
      }
    }
    
    console.log('\n🎯 Navigation test completed. Check results above.');
    
    // Keep browser open for manual inspection
    console.log('\n👀 Browser will stay open for 30 seconds for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

manualNavigationTest();