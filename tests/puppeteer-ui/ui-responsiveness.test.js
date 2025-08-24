const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

describe('UI Responsiveness Testing', () => {
  let browser;
  let page;
  
  beforeAll(async () => {
    browser = await puppeteer.launch({ 
      headless: false,
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  });
  
  afterAll(async () => {
    if (browser) await browser.close();
  });
  
  describe('Test Page Load and Basic Structure', () => {
    test('should load test page correctly on all viewports', async () => {
      const results = [];
      
      for (const [viewportName, viewport] of Object.entries(global.TEST_CONFIG.VIEWPORTS)) {
        await page.setViewport(viewport);
        
        const startTime = Date.now();
        await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { 
          waitUntil: 'networkidle0',
          timeout: 30000 
        });
        const loadTime = Date.now() - startTime;
        
        // Take screenshot
        const screenshot = await global.takeScreenshot(page, `test-page-${viewportName.toLowerCase()}`);
        
        // Check if main components are visible
        const componentsVisible = await page.evaluate(() => {
          const components = {
            container: !!document.querySelector('.container'),
            chatPanel: !!document.querySelector('.panel'),
            chatContainer: !!document.querySelector('.chat-container'),
            testScenarios: !!document.querySelector('.test-scenarios'),
            swarmIndicator: !!document.querySelector('.swarm-indicator'),
            statusGrid: !!document.querySelector('.status-grid')
          };
          return components;
        });
        
        results.push({
          viewport: viewportName,
          loadTime,
          screenshot,
          componentsVisible,
          passed: loadTime < 5000 && Object.values(componentsVisible).every(v => v)
        });
        
        expect(loadTime).toBeLessThan(5000);
        expect(componentsVisible.container).toBe(true);
        expect(componentsVisible.chatPanel).toBe(true);
        expect(componentsVisible.chatContainer).toBe(true);
      }
      
      // Save test results
      await fs.writeJson(path.join(global.TEST_CONFIG.REPORTS_DIR, 'ui-load-test-results.json'), results);
    });
    
    test('should display swarm status indicators correctly', async () => {
      await page.setViewport(global.TEST_CONFIG.VIEWPORTS.DESKTOP);
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      // Check swarm indicator
      const swarmStatus = await page.$eval('#swarmStatus', el => ({
        visible: !!el,
        text: el.textContent,
        styles: window.getComputedStyle(el)
      }));
      
      expect(swarmStatus.visible).toBe(true);
      expect(swarmStatus.text).toContain('SWARM ACTIVE');
      
      // Check agent count
      const agentCount = await page.$eval('#agentCount', el => el.textContent);
      expect(agentCount).toContain('8 Active');
      
      await global.takeScreenshot(page, 'swarm-status-indicators');
    });
  });
  
  describe('Responsive Design Validation', () => {
    test('should adapt layout correctly for mobile devices', async () => {
      await page.setViewport(global.TEST_CONFIG.VIEWPORTS.MOBILE);
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      // Check if grid layout changes to single column
      const layoutInfo = await page.evaluate(() => {
        const container = document.querySelector('.container');
        const computedStyle = window.getComputedStyle(container);
        return {
          gridTemplateColumns: computedStyle.gridTemplateColumns,
          width: container.offsetWidth,
          isMobileLayout: computedStyle.gridTemplateColumns === 'none' || computedStyle.gridTemplateColumns.split(' ').length === 1
        };
      });
      
      expect(layoutInfo.isMobileLayout).toBe(true);
      
      // Check if elements are still accessible
      const elementsAccessible = await page.evaluate(() => {
        const elements = document.querySelectorAll('.panel, .chat-container, .test-button');
        return Array.from(elements).every(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });
      });
      
      expect(elementsAccessible).toBe(true);
      await global.takeScreenshot(page, 'mobile-responsive-layout');
    });
    
    test('should maintain functionality on tablet viewport', async () => {
      await page.setViewport(global.TEST_CONFIG.VIEWPORTS.TABLET);
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      // Test chat input functionality
      await page.type('#chatInput', 'Test message on tablet');
      
      const inputValue = await page.$eval('#chatInput', el => el.value);
      expect(inputValue).toBe('Test message on tablet');
      
      // Test button interactions
      const testButton = await page.$('.test-button');
      expect(testButton).toBeTruthy();
      
      // Check button hover states
      await page.hover('.test-button');
      const hoverStyles = await page.evaluate(() => {
        const button = document.querySelector('.test-button');
        return window.getComputedStyle(button);
      });
      
      await global.takeScreenshot(page, 'tablet-functionality-test');
    });
  });
  
  describe('CSS Animations and Transitions', () => {
    test('should display message animations correctly', async () => {
      await page.setViewport(global.TEST_CONFIG.VIEWPORTS.DESKTOP);
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      // Add a new message to trigger animation
      await page.evaluate(() => {
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot';
        messageDiv.innerHTML = '<div>Test animated message</div>';
        messagesContainer.appendChild(messageDiv);
      });
      
      // Wait for animation to complete
      await page.waitForTimeout(500);
      
      // Check if animation class is applied
      const animationApplied = await page.evaluate(() => {
        const message = document.querySelector('.message:last-child');
        const styles = window.getComputedStyle(message);
        return {
          opacity: styles.opacity,
          transform: styles.transform,
          hasAnimation: styles.animation !== 'none'
        };
      });
      
      expect(parseFloat(animationApplied.opacity)).toBe(1);
      await global.takeScreenshot(page, 'message-animation-test');
    });
    
    test('should show loading states correctly', async () => {
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      // Trigger loading state by clicking send without network
      await page.setOfflineMode(true);
      await page.type('#chatInput', 'Test message');
      await page.click('#sendButton');
      
      // Check loading spinner
      await page.waitForSelector('.loading', { timeout: 5000 });
      const loadingVisible = await page.$('.loading');
      expect(loadingVisible).toBeTruthy();
      
      await global.takeScreenshot(page, 'loading-state-test');
      
      // Reset offline mode
      await page.setOfflineMode(false);
    });
  });
  
  describe('Performance Metrics Display', () => {
    test('should update metrics correctly', async () => {
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      // Check initial metrics
      const initialMetrics = await page.evaluate(() => ({
        totalQueries: document.getElementById('totalQueries').textContent,
        avgTime: document.getElementById('avgTime').textContent,
        avgCost: document.getElementById('avgCost').textContent
      }));
      
      expect(initialMetrics.totalQueries).toBe('0');
      expect(initialMetrics.avgTime).toBe('0ms');
      expect(initialMetrics.avgCost).toBe('€0.00');
      
      // Simulate metric update
      await page.evaluate(() => {
        window.updateMetrics(1200, 0.035, 75);
      });
      
      const updatedMetrics = await page.evaluate(() => ({
        totalQueries: document.getElementById('totalQueries').textContent,
        avgTime: document.getElementById('avgTime').textContent,
        avgCost: document.getElementById('avgCost').textContent
      }));
      
      expect(updatedMetrics.totalQueries).toBe('1');
      expect(updatedMetrics.avgTime).toBe('1200ms');
      expect(updatedMetrics.avgCost).toContain('0.035');
      
      await global.takeScreenshot(page, 'metrics-update-test');
    });
  });
  
  describe('Cross-Browser Compatibility', () => {
    test('should work consistently across different user agents', async () => {
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
      ];
      
      const results = [];
      
      for (const userAgent of userAgents) {
        await page.setUserAgent(userAgent);
        await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
        
        const browserCompatibility = await page.evaluate(() => {
          return {
            cssGridSupport: CSS.supports('display', 'grid'),
            flexboxSupport: CSS.supports('display', 'flex'),
            customPropertiesSupport: CSS.supports('--custom-property', 'value'),
            animationsSupport: CSS.supports('animation', 'test 1s'),
            viewport: {
              width: window.innerWidth,
              height: window.innerHeight
            }
          };
        });
        
        results.push({
          userAgent: userAgent.split(') ')[1]?.split('/')[0] || 'Unknown',
          compatibility: browserCompatibility
        });
        
        expect(browserCompatibility.cssGridSupport).toBe(true);
        expect(browserCompatibility.flexboxSupport).toBe(true);
        
        await global.takeScreenshot(page, `browser-compatibility-${results.length}`);
      }
      
      await fs.writeJson(path.join(global.TEST_CONFIG.REPORTS_DIR, 'browser-compatibility-results.json'), results);
    });
  });
});