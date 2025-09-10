/**
 * Optimized Browser Test Configuration for IT-ERA
 * Fixes: Eliminates blank pages, improves typing speed, optimizes performance
 */

const puppeteer = require('puppeteer');

class OptimizedBrowserConfig {
  constructor(options = {}) {
    this.config = {
      // High-performance browser settings
      headless: options.headless !== false ? 'new' : false,
      
      // Optimized args to eliminate issues and improve performance
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-images', // Faster loading
        '--disable-javascript-harmony-shipping',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
        '--disable-features=TranslateUI',
        '--no-first-run',
        '--no-default-browser-check',
        '--no-crash-upload',
        '--memory-pressure-off',
        '--max_old_space_size=4096',
        '--aggressive-cache-discard',
        '--disable-ipc-flooding-protection'
      ],
      
      // Faster execution settings
      defaultViewport: {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
      },
      
      // Performance optimizations
      timeout: 30000,
      ignoreHTTPSErrors: true,
      ignoreDefaultArgs: ['--enable-automation'], // Reduce detection
      
      // Override user agent to avoid bot detection
      ...options
    };
    
    this.optimizedTypingDelay = 10; // Much faster typing
    this.defaultTimeout = 5000;
  }

  /**
   * Create optimized browser instance
   */
  async createBrowser() {
    const browser = await puppeteer.launch(this.config);
    
    // Configure browser for optimal performance
    browser.on('targetcreated', async (target) => {
      // Prevent unnecessary page creation
      if (target.type() === 'page' && target.url() === 'about:blank') {
        const page = await target.page();
        if (page && page.url() === 'about:blank') {
          await page.close();
        }
      }
    });

    return browser;
  }

  /**
   * Create optimized page with performance settings
   */
  async createPage(browser) {
    const page = await browser.newPage();
    
    // Set optimized viewport
    await page.setViewport(this.config.defaultViewport);
    
    // Set faster timeouts
    page.setDefaultTimeout(this.defaultTimeout);
    page.setDefaultNavigationTimeout(this.defaultTimeout);
    
    // Disable images and CSS for faster loading (optional)
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (resourceType === 'image' || resourceType === 'stylesheet' || resourceType === 'font') {
        req.abort();
      } else {
        req.continue();
      }
    });
    
    // Enhanced error handling
    page.on('error', err => {
      console.log('Page error:', err.message);
    });
    
    page.on('pageerror', err => {
      console.log('Page error:', err.message);
    });
    
    // Inject optimized typing function
    await page.evaluateOnNewDocument(() => {
      // Override default typing behavior for faster input
      window.fastType = (selector, text) => {
        const element = document.querySelector(selector);
        if (element) {
          element.focus();
          element.value = text;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        }
      };
    });
    
    return page;
  }

  /**
   * Fast typing with optimized delay
   */
  async fastType(page, selector, text, options = {}) {
    const delay = options.delay || this.optimizedTypingDelay;
    
    try {
      await page.waitForSelector(selector, { timeout: this.defaultTimeout });
      
      // Use JavaScript injection for instant typing when possible
      if (options.instant) {
        await page.evaluate((sel, txt) => {
          const element = document.querySelector(sel);
          if (element) {
            element.focus();
            element.value = txt;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }, selector, text);
      } else {
        // Use optimized typing
        await page.type(selector, text, { delay });
      }
    } catch (error) {
      console.error(`Fast typing failed for ${selector}:`, error.message);
      throw error;
    }
  }

  /**
   * Optimized page navigation
   */
  async navigateToPage(page, url, options = {}) {
    const waitUntil = options.waitUntil || 'domcontentloaded'; // Faster than networkidle
    const timeout = options.timeout || this.defaultTimeout;
    
    try {
      await page.goto(url, {
        waitUntil,
        timeout
      });
      
      // Wait for basic elements to load
      if (options.waitForSelector) {
        await page.waitForSelector(options.waitForSelector, { timeout });
      }
      
    } catch (error) {
      console.error(`Navigation failed to ${url}:`, error.message);
      throw error;
    }
  }

  /**
   * Fast click with retry logic
   */
  async fastClick(page, selector, options = {}) {
    const timeout = options.timeout || this.defaultTimeout;
    const retries = options.retries || 3;
    
    for (let i = 0; i < retries; i++) {
      try {
        await page.waitForSelector(selector, { timeout, visible: true });
        await page.click(selector);
        return;
      } catch (error) {
        if (i === retries - 1) {
          console.error(`Fast click failed for ${selector}:`, error.message);
          throw error;
        }
        await page.waitForTimeout(500);
      }
    }
  }

  /**
   * Wait for element with optimized timeout
   */
  async waitForElement(page, selector, options = {}) {
    const timeout = options.timeout || this.defaultTimeout;
    
    try {
      await page.waitForSelector(selector, {
        timeout,
        visible: options.visible !== false
      });
    } catch (error) {
      console.error(`Wait for element failed ${selector}:`, error.message);
      throw error;
    }
  }

  /**
   * Optimized admin panel login
   */
  async adminLogin(page, credentials = {}) {
    const email = credentials.email || 'admin@it-era.it';
    const password = credentials.password || 'admin123!';
    
    try {
      // Wait for login modal or form
      await this.waitForElement(page, '#loginEmail');
      
      // Fast login with instant typing
      await this.fastType(page, '#loginEmail', email, { instant: true });
      await this.fastType(page, '#loginPassword', password, { instant: true });
      
      // Submit form
      await this.fastClick(page, 'button[type="submit"]');
      
      // Wait for successful login (shorter timeout)
      await page.waitForTimeout(2000);
      
      // Verify login success
      const loginSuccess = await page.evaluate(() => {
        return {
          hasToken: !!localStorage.getItem('blog_admin_token'),
          modalHidden: !document.querySelector('#loginModal.show')
        };
      });
      
      return loginSuccess.hasToken || loginSuccess.modalHidden;
      
    } catch (error) {
      console.error('Admin login failed:', error.message);
      return false;
    }
  }

  /**
   * Test admin menu navigation with performance monitoring
   */
  async testAdminNavigation(page) {
    const menuItems = [
      { name: 'Dashboard', func: 'loadDashboard', selector: 'a[onclick="loadDashboard()"]' },
      { name: 'Posts', func: 'loadPosts', selector: 'a[onclick="loadPosts()"]' },
      { name: 'Categories', func: 'loadCategories', selector: 'a[onclick="loadCategories()"]' },
      { name: 'Tags', func: 'loadTags', selector: 'a[onclick="loadTags()"]' },
      { name: 'Media', func: 'loadMedia', selector: 'a[onclick="loadMedia()"]' },
      { name: 'Analytics', func: 'loadAnalytics', selector: 'a[onclick="loadAnalytics()"]' },
      { name: 'Calendar', func: 'loadCalendar', selector: 'a[onclick="loadCalendar()"]' },
      { name: 'Webhooks', func: 'loadWebhooks', selector: 'a[onclick="loadWebhooks()"]' },
      { name: 'Users', func: 'loadUsers', selector: 'a[onclick="loadUsers()"]' },
      { name: 'Settings', func: 'loadSettings', selector: 'a[onclick="loadSettings()"]' }
    ];

    const results = [];

    for (const item of menuItems) {
      const startTime = Date.now();
      
      try {
        // Check if element exists
        const elementExists = await page.$(item.selector) !== null;
        if (!elementExists) {
          results.push({
            name: item.name,
            status: 'MISSING',
            error: 'Selector not found',
            time: 0
          });
          continue;
        }

        // Test function exists
        const functionExists = await page.evaluate((funcName) => {
          return typeof window[funcName] === 'function';
        }, item.func);

        if (!functionExists) {
          results.push({
            name: item.name,
            status: 'BROKEN',
            error: 'Function not implemented',
            time: Date.now() - startTime
          });
          continue;
        }

        // Click and test
        await this.fastClick(page, item.selector);
        await page.waitForTimeout(1500); // Reduced wait time

        // Check content loaded
        const contentCheck = await page.evaluate(() => {
          const mainContent = document.getElementById('mainContent');
          return {
            hasContent: mainContent && mainContent.innerHTML.length > 100,
            hasError: mainContent && mainContent.innerHTML.includes('alert-danger'),
            contentLength: mainContent ? mainContent.innerHTML.length : 0
          };
        });

        const time = Date.now() - startTime;
        
        if (contentCheck.hasError) {
          results.push({
            name: item.name,
            status: 'ERROR',
            error: 'Content shows error message',
            time
          });
        } else if (contentCheck.hasContent) {
          results.push({
            name: item.name,
            status: 'WORKING',
            contentLength: contentCheck.contentLength,
            time
          });
        } else {
          results.push({
            name: item.name,
            status: 'NO_CONTENT',
            error: 'No content loaded',
            time
          });
        }

      } catch (error) {
        results.push({
          name: item.name,
          status: 'FAILED',
          error: error.message,
          time: Date.now() - startTime
        });
      }
    }

    return results;
  }

  /**
   * Cleanup and close browser
   */
  async closeBrowser(browser) {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = OptimizedBrowserConfig;