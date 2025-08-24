const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const lighthouse = require('lighthouse');

describe('Performance UI Testing', () => {
  let browser;
  let page;
  
  beforeAll(async () => {
    browser = await puppeteer.launch({ 
      headless: false,
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--remote-debugging-port=9222']
    });
    page = await browser.newPage();
    
    // Enable performance monitoring
    await page.setCacheEnabled(false);
    await page.evaluateOnNewDocument(() => {
      window.performanceData = [];
      
      // Monitor network requests
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const start = performance.now();
        return originalFetch.apply(this, args).then(response => {
          const end = performance.now();
          window.performanceData.push({
            type: 'fetch',
            url: args[0],
            duration: end - start,
            timestamp: Date.now()
          });
          return response;
        });
      };
    });
  });
  
  afterAll(async () => {
    if (browser) await browser.close();
  });
  
  describe('Page Load Performance', () => {
    test('should meet page load performance thresholds', async () => {
      const startTime = Date.now();
      
      // Navigate and measure load time
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      const loadTime = Date.now() - startTime;
      
      // Get performance metrics
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
          loadComplete: navigation.loadEventEnd - navigation.navigationStart,
          firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime,
          firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime,
          transferSize: navigation.transferSize,
          domInteractive: navigation.domInteractive - navigation.navigationStart
        };
      });
      
      // Verify performance targets from PSD
      expect(loadTime).toBeLessThan(5000); // Page load < 5s
      expect(performanceMetrics.domContentLoaded).toBeLessThan(3000); // DOM ready < 3s
      expect(performanceMetrics.firstContentfulPaint).toBeLessThan(2000); // FCP < 2s
      
      await global.takeScreenshot(page, 'page-load-performance');
      
      // Save performance data
      await fs.writeJson(path.join(global.TEST_CONFIG.REPORTS_DIR, 'page-load-performance.json'), {
        loadTime,
        metrics: performanceMetrics,
        thresholdsMet: {
          pageLoad: loadTime < 5000,
          domContentLoaded: performanceMetrics.domContentLoaded < 3000,
          firstContentfulPaint: performanceMetrics.firstContentfulPaint < 2000
        }
      });
    });
    
    test('should measure JavaScript execution performance', async () => {
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      // Measure JavaScript execution time
      const jsPerformance = await page.evaluate(() => {
        const start = performance.now();
        
        // Simulate heavy operations
        const results = {
          domQuery: 0,
          eventHandling: 0,
          rendering: 0
        };
        
        // DOM query performance
        const domStart = performance.now();
        for (let i = 0; i < 1000; i++) {
          document.querySelectorAll('.message, .status-item, .test-button');
        }
        results.domQuery = performance.now() - domStart;
        
        // Event handling performance
        const eventStart = performance.now();
        for (let i = 0; i < 100; i++) {
          const event = new Event('click');
          document.dispatchEvent(event);
        }
        results.eventHandling = performance.now() - eventStart;
        
        const totalTime = performance.now() - start;
        
        return {
          ...results,
          totalTime,
          memoryUsage: performance.memory ? {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit
          } : null
        };
      });
      
      expect(jsPerformance.totalTime).toBeLessThan(100); // JS execution < 100ms
      expect(jsPerformance.domQuery).toBeLessThan(50);
      
      await global.takeScreenshot(page, 'javascript-performance');
      
      await fs.writeJson(path.join(global.TEST_CONFIG.REPORTS_DIR, 'javascript-performance.json'), jsPerformance);
    });
  });
  
  describe('API Response Time Performance', () => {
    test('should meet API response time requirements', async () => {
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      const apiTests = [];
      
      // Mock API with realistic delays
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url().includes('chat')) {
          const startTime = Date.now();
          
          // Simulate realistic API processing time
          setTimeout(() => {
            const responseTime = Date.now() - startTime;
            apiTests.push({
              url: request.url(),
              method: request.method(),
              responseTime,
              timestamp: Date.now()
            });
            
            request.respond({
              contentType: 'application/json',
              body: JSON.stringify({
                success: true,
                response: 'Performance test response',
                metadata: { responseTime }
              })
            });
          }, 1200); // 1.2s delay to test threshold
        } else {
          request.continue();
        }
      });
      
      // Test multiple API calls
      const messages = ['Test 1', 'Test 2', 'Test 3'];
      
      for (const message of messages) {
        await page.type('#chatInput', message);
        const sendStart = Date.now();
        await page.click('#sendButton');
        
        await page.waitForSelector('.message.bot:last-child', { timeout: 5000 });
        const totalTime = Date.now() - sendStart;
        
        expect(totalTime).toBeLessThan(global.TEST_CONFIG.PERFORMANCE_THRESHOLDS.RESPONSE_TIME);
        
        await page.evaluate(() => document.getElementById('chatInput').value = '');
        await page.waitForTimeout(500);
      }
      
      const avgResponseTime = apiTests.reduce((sum, test) => sum + test.responseTime, 0) / apiTests.length;
      expect(avgResponseTime).toBeLessThan(global.TEST_CONFIG.PERFORMANCE_THRESHOLDS.RESPONSE_TIME);
      
      await global.takeScreenshot(page, 'api-response-performance');
      
      await fs.writeJson(path.join(global.TEST_CONFIG.REPORTS_DIR, 'api-performance.json'), {
        tests: apiTests,
        averageResponseTime: avgResponseTime,
        thresholdMet: avgResponseTime < global.TEST_CONFIG.PERFORMANCE_THRESHOLDS.RESPONSE_TIME
      });
    });
  });
  
  describe('Memory Usage and Resource Management', () => {
    test('should maintain acceptable memory usage', async () => {
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      const initialMemory = await page.evaluate(() => ({
        used: performance.memory?.usedJSHeapSize || 0,
        total: performance.memory?.totalJSHeapSize || 0
      }));
      
      // Simulate heavy usage
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url().includes('chat')) {
          request.respond({
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              response: 'Memory test response with some data to simulate memory usage'
            })
          });
        } else {
          request.continue();
        }
      });
      
      // Send multiple messages to simulate usage
      for (let i = 0; i < 20; i++) {
        await page.type('#chatInput', `Memory test message ${i + 1}`);
        await page.click('#sendButton');
        await page.waitForTimeout(200);
      }
      
      const finalMemory = await page.evaluate(() => ({
        used: performance.memory?.usedJSHeapSize || 0,
        total: performance.memory?.totalJSHeapSize || 0
      }));
      
      const memoryIncrease = finalMemory.used - initialMemory.used;
      const memoryUsageMB = memoryIncrease / (1024 * 1024);
      
      // Memory increase should be reasonable (< 50MB for heavy usage)
      expect(memoryUsageMB).toBeLessThan(50);
      
      await global.takeScreenshot(page, 'memory-usage-test');
      
      await fs.writeJson(path.join(global.TEST_CONFIG.REPORTS_DIR, 'memory-usage.json'), {
        initialMemory,
        finalMemory,
        memoryIncrease,
        memoryUsageMB,
        withinLimits: memoryUsageMB < 50
      });
    });
    
    test('should clean up resources properly', async () => {
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      // Monitor resource cleanup
      const resourceData = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource');
        return {
          totalResources: resources.length,
          imageResources: resources.filter(r => r.name.match(/\.(jpg|jpeg|png|gif|svg)$/i)).length,
          scriptResources: resources.filter(r => r.name.match(/\.js$/i)).length,
          cssResources: resources.filter(r => r.name.match(/\.css$/i)).length,
          totalTransferSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0)
        };
      });
      
      expect(resourceData.totalTransferSize).toBeLessThan(5 * 1024 * 1024); // < 5MB total
      
      await global.takeScreenshot(page, 'resource-cleanup-test');
      
      await fs.writeJson(path.join(global.TEST_CONFIG.REPORTS_DIR, 'resource-usage.json'), resourceData);
    });
  });
  
  describe('Network Performance and Efficiency', () => {
    test('should optimize network requests', async () => {
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      const networkData = [];
      
      page.on('response', response => {
        networkData.push({
          url: response.url(),
          status: response.status(),
          size: response.headers()['content-length'] || 0,
          type: response.headers()['content-type'] || 'unknown',
          timing: response.timing()
        });
      });
      
      // Trigger some network activity
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url().includes('chat')) {
          request.respond({
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              response: 'Network optimization test'
            })
          });
        } else {
          request.continue();
        }
      });
      
      await page.type('#chatInput', 'Network test');
      await page.click('#sendButton');
      await page.waitForTimeout(2000);
      
      const apiRequests = networkData.filter(req => req.url.includes('chat'));
      
      if (apiRequests.length > 0) {
        const avgSize = apiRequests.reduce((sum, req) => sum + parseInt(req.size || 0), 0) / apiRequests.length;
        expect(avgSize).toBeLessThan(10000); // < 10KB average response
      }
      
      await global.takeScreenshot(page, 'network-optimization');
      
      await fs.writeJson(path.join(global.TEST_CONFIG.REPORTS_DIR, 'network-performance.json'), {
        totalRequests: networkData.length,
        apiRequests: apiRequests.length,
        networkData
      });
    });
  });
  
  describe('Lighthouse Performance Audit', () => {
    test('should pass Lighthouse performance audit', async () => {
      // Run Lighthouse audit
      const lighthouseResults = await lighthouse(global.TEST_CONFIG.TEST_PAGE_URL, {
        port: 9222,
        onlyCategories: ['performance'],
        settings: {
          formFactor: 'desktop',
          throttling: {
            rttMs: 40,
            throughputKbps: 10240,
            cpuSlowdownMultiplier: 1
          }
        }
      });
      
      const performanceScore = lighthouseResults.lhr.categories.performance.score * 100;
      const metrics = lighthouseResults.lhr.audits;
      
      // Save Lighthouse report
      const reportPath = path.join(global.TEST_CONFIG.REPORTS_DIR, 'lighthouse-performance.html');
      await fs.writeFile(reportPath, lighthouseResults.report);
      
      // Performance expectations
      expect(performanceScore).toBeGreaterThanOrEqual(80); // > 80 performance score
      
      const keyMetrics = {
        firstContentfulPaint: parseFloat(metrics['first-contentful-paint'].numericValue),
        largestContentfulPaint: parseFloat(metrics['largest-contentful-paint'].numericValue),
        cumulativeLayoutShift: parseFloat(metrics['cumulative-layout-shift'].numericValue),
        totalBlockingTime: parseFloat(metrics['total-blocking-time'].numericValue)
      };
      
      expect(keyMetrics.firstContentfulPaint).toBeLessThan(2000); // FCP < 2s
      expect(keyMetrics.largestContentfulPaint).toBeLessThan(2500); // LCP < 2.5s
      expect(keyMetrics.cumulativeLayoutShift).toBeLessThan(0.1); // CLS < 0.1
      
      await fs.writeJson(path.join(global.TEST_CONFIG.REPORTS_DIR, 'lighthouse-metrics.json'), {
        performanceScore,
        keyMetrics,
        passedThresholds: {
          performanceScore: performanceScore >= 80,
          firstContentfulPaint: keyMetrics.firstContentfulPaint < 2000,
          largestContentfulPaint: keyMetrics.largestContentfulPaint < 2500,
          cumulativeLayoutShift: keyMetrics.cumulativeLayoutShift < 0.1
        }
      });
    }, 60000); // Extended timeout for Lighthouse
  });
  
  describe('Real User Metrics Simulation', () => {
    test('should simulate realistic user interaction performance', async () => {
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      const userInteractionMetrics = [];
      
      // Simulate realistic user interactions
      const interactions = [
        { action: 'click', selector: '.test-button:first-child', expectedTime: 100 },
        { action: 'type', selector: '#chatInput', text: 'Realistic user message', expectedTime: 200 },
        { action: 'click', selector: '#sendButton', expectedTime: 50 },
        { action: 'scroll', expectedTime: 30 }
      ];
      
      for (const interaction of interactions) {
        const startTime = performance.now();
        
        switch (interaction.action) {
          case 'click':
            await page.click(interaction.selector);
            break;
          case 'type':
            await page.type(interaction.selector, interaction.text);
            break;
          case 'scroll':
            await page.evaluate(() => window.scrollBy(0, 100));
            break;
        }
        
        const duration = performance.now() - startTime;
        
        userInteractionMetrics.push({
          action: interaction.action,
          duration,
          expected: interaction.expectedTime,
          performsWell: duration < interaction.expectedTime * 2
        });
        
        expect(duration).toBeLessThan(interaction.expectedTime * 2);
        
        await page.waitForTimeout(100);
      }
      
      const avgInteractionTime = userInteractionMetrics.reduce((sum, metric) => sum + metric.duration, 0) / userInteractionMetrics.length;
      expect(avgInteractionTime).toBeLessThan(100); // Average interaction < 100ms
      
      await global.takeScreenshot(page, 'user-interaction-performance');
      
      await fs.writeJson(path.join(global.TEST_CONFIG.REPORTS_DIR, 'user-interaction-metrics.json'), {
        interactions: userInteractionMetrics,
        averageTime: avgInteractionTime,
        allPerformWell: userInteractionMetrics.every(m => m.performsWell)
      });
    });
  });
});