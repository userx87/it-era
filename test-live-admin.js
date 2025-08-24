const puppeteer = require('puppeteer');

async function testLiveAdmin() {
  const browser = await puppeteer.launch({ 
    headless: false, 
    slowMo: 1000 
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to live admin panel
    console.log('Navigating to live admin panel...');
    await page.goto('https://it-era.pages.dev/admin/', { 
      waitUntil: 'networkidle2', 
      timeout: 15000 
    });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check login modal
    const loginModal = await page.$('#loginModal');
    console.log('Login modal found:', !!loginModal);
    
    if (loginModal) {
      // Try login
      console.log('Attempting login...');
      await page.type('#loginEmail', 'admin@it-era.it');
      await page.type('#loginPassword', 'admin123!');
      await page.click('button[type="submit"]');
      
      // Wait for authentication
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check if logged in
      const isLoggedIn = await page.evaluate(() => {
        return {
          hasToken: !!localStorage.getItem('blog_admin_token'),
          currentUser: document.getElementById('currentUser')?.textContent,
          modalHidden: document.getElementById('loginModal')?.style.display === 'none'
        };
      });
      
      console.log('Login result:', isLoggedIn);
      
      if (isLoggedIn.hasToken) {
        console.log('✅ Admin panel login successful!');
        
        // Check sidebar content
        const sidebarContent = await page.evaluate(() => {
          const sidebar = document.querySelector('.sidebar');
          return {
            hasSidebar: !!sidebar,
            navLinks: Array.from(document.querySelectorAll('.nav-link')).map(link => link.textContent.trim()),
            mainContent: document.getElementById('mainContent')?.innerHTML?.length || 0
          };
        });
        
        console.log('Sidebar content:', sidebarContent);
        
        if (sidebarContent.mainContent > 0) {
          console.log('✅ Dashboard content loaded!');
        } else {
          console.log('❌ Dashboard content not loaded');
        }
        
      } else {
        console.log('❌ Login failed');
      }
    } else {
      console.log('❌ Login modal not found');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testLiveAdmin();