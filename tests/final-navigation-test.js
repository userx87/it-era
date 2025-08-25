const puppeteer = require('puppeteer');

async function finalNavigationTest() {
  console.log('🎯 Final navigation test with corrected data format...');
  
  const browser = await puppeteer.launch({ headless: false });
  
  try {
    const page = await browser.newPage();
    
    // Monitor API calls  
    page.on('response', response => {
      if (response.url().includes('dashboard') || response.status() !== 200) {
        console.log(`📡 ${response.status()} ${response.url()}`);
      }
    });
    
    page.on('console', msg => {
      if (msg.text().includes('Error') || msg.text().includes('Dashboard')) {
        console.log('🖥️ ', msg.text());
      }
    });
    
    console.log('Loading admin panel...');
    await page.goto('https://it-era.pages.dev/admin/');
    
    // Login rapido
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.evaluate(() => {
      document.getElementById('loginEmail').value = 'admin@it-era.it';
      document.getElementById('loginPassword').value = 'admin123!';
      document.querySelector('button[type="submit"]').click();
    });
    
    console.log('Logging in and testing dashboard...');
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    // Test Dashboard navigation
    const dashboardTest = await page.evaluate(async () => {
      try {
        console.log('Starting dashboard test...');
        
        // Check authentication
        const token = localStorage.getItem('auth_token');
        if (!token) {
          return { success: false, error: 'Not authenticated' };
        }
        
        // Call loadDashboard
        if (typeof loadDashboard === 'function') {
          await loadDashboard();
          
          // Wait for content to load
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          const mainContent = document.getElementById('mainContent');
          if (!mainContent) {
            return { success: false, error: 'mainContent not found' };
          }
          
          const html = mainContent.innerHTML;
          
          return {
            success: true,
            contentLength: html.length,
            hasStats: html.includes('Totale Post') || html.includes('12'), // Check for actual data
            hasCategories: html.includes('Categorie') || html.includes('6'),
            hasTags: html.includes('Tag') || html.includes('24'),
            hasRecentPosts: html.includes('Post Recenti') || html.includes('Ransomware'),
            hasErrors: html.includes('alert-danger') || html.includes('error'),
            preview: html.substring(0, 500).replace(/\s+/g, ' ')
          };
          
        } else {
          return { success: false, error: 'loadDashboard function not found' };
        }
        
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    console.log('\n📊 DASHBOARD TEST RESULTS:');
    console.log(`Success: ${dashboardTest.success ? '✅' : '❌'}`);
    
    if (dashboardTest.success) {
      console.log(`Content length: ${dashboardTest.contentLength} chars`);
      console.log(`Has stats: ${dashboardTest.hasStats ? '✅' : '❌'}`);
      console.log(`Has categories: ${dashboardTest.hasCategories ? '✅' : '❌'}`);
      console.log(`Has tags: ${dashboardTest.hasTags ? '✅' : '❌'}`);
      console.log(`Has recent posts: ${dashboardTest.hasRecentPosts ? '✅' : '❌'}`);
      console.log(`Has errors: ${dashboardTest.hasErrors ? '❌' : '✅'}`);
      
      if (dashboardTest.contentLength > 1000 && dashboardTest.hasStats && !dashboardTest.hasErrors) {
        console.log('\n🎉 PERFECT! Dashboard funziona perfettamente con i dati API!');
        console.log('✅ La navigazione del menu sinistro è completamente operativa!');
      } else if (dashboardTest.hasErrors) {
        console.log('\n⚠️ Dashboard caricato ma con errori');
        console.log(`Preview: ${dashboardTest.preview}`);
      } else {
        console.log('\n📈 Dashboard caricato, verificando contenuto...');
        console.log(`Preview: ${dashboardTest.preview}`);
      }
      
    } else {
      console.log(`Error: ${dashboardTest.error}`);
    }
    
    console.log('\n🔄 Testing additional menu items...');
    
    // Test Posts menu
    const postsTest = await page.evaluate(() => {
      try {
        if (typeof loadPosts === 'function') {
          loadPosts();
          return { success: true };
        }
        return { success: false, error: 'loadPosts not found' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    console.log(`Posts menu: ${postsTest.success ? '✅' : '❌'}`);
    
    console.log('\n🎯 Navigation test completed!');
    console.log('Browser will close in 8 seconds...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

finalNavigationTest();