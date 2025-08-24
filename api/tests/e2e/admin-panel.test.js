/**
 * End-to-End Tests for IT-ERA Admin Panel
 * Tests complete user workflows using Puppeteer
 */

const puppeteer = require('puppeteer');
const testData = require('../fixtures/testData');

describe('Admin Panel E2E Tests', () => {
  let browser;
  let page;
  
  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    
    // Set longer timeout
    await page.setDefaultTimeout(30000);
    
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Page error:', msg.text());
      }
    });
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  describe('Authentication Flow', () => {
    test('should load login page', async () => {
      await page.goto(TEST_CONFIG.ADMIN_PANEL_URL);
      
      await page.waitForSelector('form', { timeout: 10000 });
      
      // Check if login form is present
      const loginForm = await page.$('form');
      expect(loginForm).toBeTruthy();
      
      // Check for email and password fields
      const emailField = await page.$('input[type="email"], input[name="email"]');
      const passwordField = await page.$('input[type="password"], input[name="password"]');
      
      expect(emailField).toBeTruthy();
      expect(passwordField).toBeTruthy();
    });

    test('should login with valid credentials', async () => {
      await page.goto(TEST_CONFIG.ADMIN_PANEL_URL);
      
      // Wait for login form
      await page.waitForSelector('form');
      
      // Fill login form
      await page.type('input[type="email"], input[name="email"]', testData.validCredentials.email);
      await page.type('input[type="password"], input[name="password"]', testData.validCredentials.password);
      
      // Submit form
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }),
        page.click('button[type="submit"], input[type="submit"]')
      ]);
      
      // Check if redirected to dashboard
      const currentUrl = page.url();
      expect(currentUrl).toContain('admin') || expect(currentUrl).toContain('dashboard');
      
      // Check for dashboard elements
      const dashboardElement = await page.$('.dashboard, .admin-panel, .main-content');
      expect(dashboardElement).toBeTruthy();
    });

    test('should show error for invalid credentials', async () => {
      await page.goto(TEST_CONFIG.ADMIN_PANEL_URL);
      
      await page.waitForSelector('form');
      
      // Fill with invalid credentials
      await page.type('input[type="email"], input[name="email"]', 'invalid@email.com');
      await page.type('input[type="password"], input[name="password"]', 'wrongpassword');
      
      await page.click('button[type="submit"], input[type="submit"]');
      
      // Wait for error message
      await page.waitForSelector('.error, .alert-danger, .message', { timeout: 5000 });
      
      const errorElement = await page.$('.error, .alert-danger, .message');
      expect(errorElement).toBeTruthy();
    });
  });

  describe('Dashboard Navigation', () => {
    beforeEach(async () => {
      // Login before each test
      await page.goto(TEST_CONFIG.ADMIN_PANEL_URL);
      await page.waitForSelector('form');
      
      await page.type('input[type="email"], input[name="email"]', testData.validCredentials.email);
      await page.type('input[type="password"], input[name="password"]', testData.validCredentials.password);
      
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        page.click('button[type="submit"], input[type="submit"]')
      ]);
    });

    test('should navigate to posts section', async () => {
      // Look for posts/articles navigation link
      const postsLink = await page.$('a[href*="post"], a[href*="article"], .nav-posts');
      
      if (postsLink) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle0' }),
          postsLink.click()
        ]);
        
        // Check if posts page loaded
        const postsTable = await page.$('table, .posts-list, .articles-list');
        expect(postsTable).toBeTruthy();
      }
    });

    test('should navigate to categories section', async () => {
      const categoriesLink = await page.$('a[href*="categor"], .nav-categories');
      
      if (categoriesLink) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle0' }),
          categoriesLink.click()
        ]);
        
        const categoriesSection = await page.$('.categories, table');
        expect(categoriesSection).toBeTruthy();
      }
    });

    test('should navigate to tags section', async () => {
      const tagsLink = await page.$('a[href*="tag"], .nav-tags');
      
      if (tagsLink) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle0' }),
          tagsLink.click()
        ]);
        
        const tagsSection = await page.$('.tags, table');
        expect(tagsSection).toBeTruthy();
      }
    });
  });

  describe('Post Management', () => {
    beforeEach(async () => {
      await page.goto(TEST_CONFIG.ADMIN_PANEL_URL);
      await page.waitForSelector('form');
      
      await page.type('input[type="email"], input[name="email"]', testData.validCredentials.email);
      await page.type('input[type="password"], input[name="password"]', testData.validCredentials.password);
      
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        page.click('button[type="submit"], input[type="submit"]')
      ]);
    });

    test('should create new post', async () => {
      // Navigate to new post form
      const newPostLink = await page.$('a[href*="new"], button:contains("New"), .btn-new-post');
      
      if (newPostLink) {
        await newPostLink.click();
        await page.waitForSelector('form, .post-form');
        
        // Fill post form
        const testPost = testData.validPosts[0];
        
        await page.type('input[name="title"], #title', testPost.title);
        
        // Handle content field (might be textarea or rich editor)
        const contentField = await page.$('textarea[name="content"], #content, .editor');
        if (contentField) {
          await page.type('textarea[name="content"], #content', testPost.content);
        }
        
        // Submit form
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }),
          page.click('button[type="submit"], input[type="submit"]')
        ]);
        
        // Check for success message or redirect
        const successIndicator = await page.$('.success, .alert-success, .message-success');
        expect(successIndicator).toBeTruthy() || expect(page.url()).toContain('post');
      }
    });

    test('should validate required fields', async () => {
      const newPostLink = await page.$('a[href*="new"], button:contains("New")');
      
      if (newPostLink) {
        await newPostLink.click();
        await page.waitForSelector('form');
        
        // Try to submit empty form
        await page.click('button[type="submit"], input[type="submit"]');
        
        // Check for validation errors
        const errorMessages = await page.$$('.error, .alert-danger, .field-error');
        expect(errorMessages.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Responsive Design', () => {
    test('should work on mobile viewport', async () => {
      await page.setViewport({ width: 375, height: 667 });
      await page.goto(TEST_CONFIG.ADMIN_PANEL_URL);
      
      await page.waitForSelector('form');
      
      // Check if mobile menu exists or layout adapts
      const mobileElements = await page.$$('.mobile-menu, .hamburger, .menu-toggle');
      const responsiveContainer = await page.$('.container-fluid, .responsive');
      
      expect(mobileElements.length > 0 || responsiveContainer).toBeTruthy();
    });

    test('should work on tablet viewport', async () => {
      await page.setViewport({ width: 768, height: 1024 });
      await page.goto(TEST_CONFIG.ADMIN_PANEL_URL);
      
      await page.waitForSelector('form');
      
      // Login and check dashboard layout
      await page.type('input[type="email"], input[name="email"]', testData.validCredentials.email);
      await page.type('input[type="password"], input[name="password"]', testData.validCredentials.password);
      
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        page.click('button[type="submit"], input[type="submit"]')
      ]);
      
      // Check if layout is appropriate for tablet
      const sidebarOrNav = await page.$('.sidebar, .navigation, .nav');
      expect(sidebarOrNav).toBeTruthy();
    });
  });

  describe('Performance Testing', () => {
    test('should load login page within performance threshold', async () => {
      const startTime = Date.now();
      
      await page.goto(TEST_CONFIG.ADMIN_PANEL_URL, { waitUntil: 'networkidle0' });
      
      const loadTime = Date.now() - startTime;
      console.log(`Login page load time: ${loadTime}ms`);
      
      expect(loadTime).toBeLessThan(TEST_CONFIG.TIMEOUTS.PERFORMANCE);
    });

    test('should measure dashboard load performance', async () => {
      await page.goto(TEST_CONFIG.ADMIN_PANEL_URL);
      await page.waitForSelector('form');
      
      await page.type('input[type="email"], input[name="email"]', testData.validCredentials.email);
      await page.type('input[type="password"], input[name="password"]', testData.validCredentials.password);
      
      const startTime = Date.now();
      
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        page.click('button[type="submit"], input[type="submit"]')
      ]);
      
      const dashboardLoadTime = Date.now() - startTime;
      console.log(`Dashboard load time: ${dashboardLoadTime}ms`);
      
      expect(dashboardLoadTime).toBeLessThan(TEST_CONFIG.TIMEOUTS.PERFORMANCE * 2);
    });
  });
});