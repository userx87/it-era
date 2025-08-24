const puppeteer = require('puppeteer');

async function testAdminNavigation() {
  const browser = await puppeteer.launch({ 
    headless: false, 
    slowMo: 2000 
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport for better visibility
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('🔗 Navigating to admin panel...');
    await page.goto('https://it-era.pages.dev/admin/', { 
      waitUntil: 'networkidle2', 
      timeout: 15000 
    });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Login first
    console.log('🔐 Logging in...');
    await page.type('#loginEmail', 'admin@it-era.it');
    await page.type('#loginPassword', 'admin123!');
    await page.click('button[type="submit"]');
    
    // Wait for authentication
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if logged in
    const isLoggedIn = await page.evaluate(() => {
      return !!localStorage.getItem('blog_admin_token');
    });
    
    if (!isLoggedIn) {
      console.log('❌ Login failed');
      return;
    }
    
    console.log('✅ Login successful! Testing navigation...');
    
    // Test each menu item
    const menuItems = [
      { name: 'Dashboard', onclick: 'loadDashboard()', selector: 'a[onclick="loadDashboard()"]' },
      { name: 'Post', onclick: 'loadPosts()', selector: 'a[onclick="loadPosts()"]' },
      { name: 'Categorie', onclick: 'loadCategories()', selector: 'a[onclick="loadCategories()"]' },
      { name: 'Tag', onclick: 'loadTags()', selector: 'a[onclick="loadTags()"]' },
      { name: 'Media', onclick: 'loadMedia()', selector: 'a[onclick="loadMedia()"]' },
      { name: 'Analytics', onclick: 'loadAnalytics()', selector: 'a[onclick="loadAnalytics()"]' },
      { name: 'Calendario', onclick: 'loadCalendar()', selector: 'a[onclick="loadCalendar()"]' },
      { name: 'Webhooks', onclick: 'loadWebhooks()', selector: 'a[onclick="loadWebhooks()"]' }
    ];
    
    for (const item of menuItems) {
      console.log(`\n📋 Testing ${item.name}...`);
      
      try {
        // Click the menu item
        await page.waitForSelector(item.selector, { timeout: 5000 });
        await page.click(item.selector);
        
        // Wait for content to load
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check the main content area
        const content = await page.evaluate(() => {
          const mainContent = document.getElementById('mainContent');
          return {
            hasContent: mainContent && mainContent.innerHTML.length > 100,
            contentLength: mainContent ? mainContent.innerHTML.length : 0,
            hasSpinner: mainContent ? mainContent.innerHTML.includes('spinner-border') : false,
            hasError: mainContent ? mainContent.innerHTML.includes('alert-danger') : false,
            hasAlert: mainContent ? mainContent.innerHTML.includes('alert-info') : false
          };
        });
        
        console.log(`   Content loaded: ${content.hasContent}`);
        console.log(`   Content length: ${content.contentLength} chars`);
        
        if (content.hasError) {
          console.log('   ❌ Error detected in content');
        } else if (content.hasAlert) {
          console.log('   ℹ️  Info message (likely "in sviluppo")');
        } else if (content.hasSpinner) {
          console.log('   ⏳ Still loading...');
        } else if (content.hasContent) {
          console.log('   ✅ Content loaded successfully');
        } else {
          console.log('   ⚠️  No content or minimal content');
        }
        
      } catch (error) {
        console.log(`   ❌ Failed to test ${item.name}: ${error.message}`);
      }
    }
    
    // Test admin-only sections (if user is admin)
    console.log('\n🔒 Testing admin-only sections...');
    
    const adminItems = [
      { name: 'Utenti', onclick: 'loadUsers()', selector: 'a[onclick="loadUsers()"]' },
      { name: 'Impostazioni', onclick: 'loadSettings()', selector: 'a[onclick="loadSettings()"]' }
    ];
    
    for (const item of adminItems) {
      console.log(`\n👥 Testing ${item.name} (Admin only)...`);
      
      try {
        const elementExists = await page.$(item.selector) !== null;
        if (!elementExists) {
          console.log('   ⚠️  Element not found (may be hidden for non-admin users)');
          continue;
        }
        
        await page.click(item.selector);
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const content = await page.evaluate(() => {
          const mainContent = document.getElementById('mainContent');
          return {
            hasContent: mainContent && mainContent.innerHTML.length > 100,
            contentLength: mainContent ? mainContent.innerHTML.length : 0,
            hasError: mainContent ? mainContent.innerHTML.includes('alert-danger') : false
          };
        });
        
        console.log(`   Content loaded: ${content.hasContent} (${content.contentLength} chars)`);
        if (content.hasError) {
          console.log('   ❌ Error detected');
        } else {
          console.log('   ✅ Admin section accessible');
        }
        
      } catch (error) {
        console.log(`   ❌ Failed to test ${item.name}: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Navigation test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Keep browser open for inspection
    console.log('\n👁️  Browser will remain open for manual inspection...');
    // await browser.close();
  }
}

testAdminNavigation();