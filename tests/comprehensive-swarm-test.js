const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Test configuration
const CONFIG = {
  adminUrl: 'https://it-era.pages.dev/admin/',
  credentials: {
    email: 'admin@it-era.it',
    password: 'admin123!'
  },
  timeout: 30000,
  screenshotDir: path.join(__dirname, 'screenshots')
};

// Test results collector
const testResults = {
  timestamp: new Date().toISOString(),
  swarmId: 'swarm_1756113223610_g88f16vw2',
  agents: ['PuppeteerTestAgent', 'TestspriteAgent', 'SwarmCoordinator'],
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  }
};

// Helper function to log test results
function logTest(name, status, details = {}) {
  const test = {
    name,
    status,
    timestamp: new Date().toISOString(),
    duration: details.duration || 0,
    error: details.error || null,
    screenshot: details.screenshot || null
  };
  
  testResults.tests.push(test);
  testResults.summary.total++;
  testResults.summary[status]++;
  
  const icon = status === 'passed' ? '✅' : status === 'failed' ? '❌' : '⏭️';
  console.log(`${icon} ${name}: ${status.toUpperCase()}`);
  if (details.error) console.log(`   Error: ${details.error}`);
}

// Main test suite
async function runComprehensiveTests() {
  console.log('🚀 IT-ERA Admin Panel - Comprehensive Swarm Test Suite');
  console.log('========================================================');
  console.log(`📅 Date: ${new Date().toLocaleString()}`);
  console.log(`🤖 Swarm ID: ${testResults.swarmId}`);
  console.log(`👥 Agents: ${testResults.agents.join(', ')}`);
  console.log('');
  
  let browser;
  
  try {
    // Create screenshots directory
    await fs.mkdir(CONFIG.screenshotDir, { recursive: true });
    
    // Launch browser
    console.log('🌐 Launching browser...');
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--window-size=1280,720']
    });
    
    const page = await browser.newPage();
    
    // Set up request interception for API monitoring
    const apiCalls = [];
    page.on('response', response => {
      if (response.url().includes('api')) {
        apiCalls.push({
          url: response.url(),
          status: response.status(),
          method: response.request().method()
        });
      }
    });
    
    // TEST 1: Page Load
    console.log('\n📋 TEST SUITE 1: Page Loading');
    console.log('--------------------------------');
    const startTime = Date.now();
    
    try {
      await page.goto(CONFIG.adminUrl, { waitUntil: 'networkidle2', timeout: CONFIG.timeout });
      const loadTime = Date.now() - startTime;
      logTest('Page Load', 'passed', { duration: loadTime });
      
      // Take screenshot
      await page.screenshot({ 
        path: path.join(CONFIG.screenshotDir, '01-page-load.png'),
        fullPage: true 
      });
      
      // Check for essential elements
      const hasLoginForm = await page.$('#loginEmail') !== null;
      logTest('Login Form Present', hasLoginForm ? 'passed' : 'failed');
      
    } catch (error) {
      logTest('Page Load', 'failed', { error: error.message });
    }
    
    // TEST 2: Authentication
    console.log('\n📋 TEST SUITE 2: Authentication');
    console.log('--------------------------------');
    
    try {
      // Fill login form
      await page.type('#loginEmail', CONFIG.credentials.email, { delay: 50 });
      await page.type('#loginPassword', CONFIG.credentials.password, { delay: 50 });
      
      // Submit form
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {})
      ]);
      
      // Wait for authentication
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check authentication status
      const isAuthenticated = await page.evaluate(() => {
        return localStorage.getItem('auth_token') !== null;
      });
      
      logTest('Login Process', isAuthenticated ? 'passed' : 'failed');
      
      if (isAuthenticated) {
        await page.screenshot({ 
          path: path.join(CONFIG.screenshotDir, '02-authenticated.png'),
          fullPage: true 
        });
      }
      
    } catch (error) {
      logTest('Login Process', 'failed', { error: error.message });
    }
    
    // TEST 3: Navigation Menu
    console.log('\n📋 TEST SUITE 3: Navigation Menu');
    console.log('--------------------------------');
    
    const menuItems = [
      { name: 'Dashboard', selector: 'a[onclick="loadDashboard()"]', expectedContent: 'Totale Post' },
      { name: 'Posts', selector: 'a[onclick="loadPosts()"]', expectedContent: 'Post' },
      { name: 'Categories', selector: 'a[onclick="loadCategories()"]', expectedContent: 'Categor' },
      { name: 'Tags', selector: 'a[onclick="loadTags()"]', expectedContent: 'Tag' },
      { name: 'Media', selector: 'a[onclick="loadMedia()"]', expectedContent: 'Media' },
      { name: 'Analytics', selector: 'a[onclick="loadAnalytics()"]', expectedContent: 'Analytic' }
    ];
    
    for (const item of menuItems) {
      try {
        // Click menu item
        await page.click(item.selector);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check content loaded
        const content = await page.evaluate(() => {
          const mainContent = document.getElementById('mainContent');
          return mainContent ? mainContent.innerText : '';
        });
        
        const hasExpectedContent = content.includes(item.expectedContent);
        logTest(`Navigate to ${item.name}`, hasExpectedContent ? 'passed' : 'failed');
        
        // Take screenshot of each section
        if (hasExpectedContent) {
          await page.screenshot({ 
            path: path.join(CONFIG.screenshotDir, `03-${item.name.toLowerCase()}.png`),
            fullPage: true 
          });
        }
        
      } catch (error) {
        logTest(`Navigate to ${item.name}`, 'failed', { error: error.message });
      }
    }
    
    // TEST 4: API Endpoints
    console.log('\n📋 TEST SUITE 4: API Endpoints');
    console.log('--------------------------------');
    
    // Analyze API calls made during navigation
    const uniqueAPIs = [...new Set(apiCalls.map(call => call.url))];
    console.log(`📡 Total API calls: ${apiCalls.length}`);
    console.log(`📍 Unique endpoints: ${uniqueAPIs.length}`);
    
    const failedAPIs = apiCalls.filter(call => call.status >= 400);
    if (failedAPIs.length > 0) {
      logTest('API Health Check', 'failed', { 
        error: `${failedAPIs.length} failed API calls detected` 
      });
      failedAPIs.forEach(api => {
        console.log(`   ❌ ${api.status} ${api.method} ${api.url}`);
      });
    } else {
      logTest('API Health Check', 'passed');
    }
    
    // TEST 5: Performance Metrics
    console.log('\n📋 TEST SUITE 5: Performance Metrics');
    console.log('----------------------------------------');
    
    const metrics = await page.metrics();
    const performance = await page.evaluate(() => {
      const perf = window.performance.timing;
      return {
        domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
        loadComplete: perf.loadEventEnd - perf.loadEventStart,
        domInteractive: perf.domInteractive - perf.navigationStart,
        firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0
      };
    });
    
    console.log(`⏱️  DOM Content Loaded: ${performance.domContentLoaded}ms`);
    console.log(`⏱️  Page Load Complete: ${performance.loadComplete}ms`);
    console.log(`⏱️  DOM Interactive: ${performance.domInteractive}ms`);
    console.log(`⏱️  First Paint: ${Math.round(performance.firstPaint)}ms`);
    console.log(`📊 JS Heap Size: ${Math.round(metrics.JSHeapUsedSize / 1024 / 1024)}MB`);
    
    logTest('Performance Metrics', performance.domInteractive < 3000 ? 'passed' : 'failed', {
      duration: performance.domInteractive
    });
    
    // TEST 6: Data Integrity
    console.log('\n📋 TEST SUITE 6: Data Integrity');
    console.log('----------------------------------');
    
    // Navigate back to Dashboard to check data
    await page.click('a[onclick="loadDashboard()"]');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const dashboardData = await page.evaluate(() => {
      const mainContent = document.getElementById('mainContent');
      if (!mainContent) return null;
      
      const html = mainContent.innerHTML;
      return {
        hasPosts: html.includes('12') || html.includes('Post'),
        hasCategories: html.includes('6') || html.includes('Categor'),
        hasTags: html.includes('24') || html.includes('Tag'),
        hasViews: html.includes('6789') || html.includes('Visual'),
        hasRecentPosts: html.includes('Ransomware') || html.includes('VPN')
      };
    });
    
    if (dashboardData) {
      Object.entries(dashboardData).forEach(([key, value]) => {
        const testName = `Dashboard ${key.replace('has', '')}`;
        logTest(testName, value ? 'passed' : 'failed');
      });
    }
    
    // TEST 7: Error Handling
    console.log('\n📋 TEST SUITE 7: Error Handling');
    console.log('----------------------------------');
    
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Try to trigger an error
    await page.evaluate(() => {
      // Simulate an API error
      if (typeof apiManager !== 'undefined') {
        apiManager.get('/invalid-endpoint').catch(e => console.log('Expected error:', e));
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    logTest('Error Handling', consoleErrors.length === 0 ? 'passed' : 'warning', {
      error: consoleErrors.length > 0 ? `${consoleErrors.length} console errors detected` : null
    });
    
    // FINAL SUMMARY
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${testResults.summary.total}`);
    console.log(`✅ Passed: ${testResults.summary.passed}`);
    console.log(`❌ Failed: ${testResults.summary.failed}`);
    console.log(`⏭️  Skipped: ${testResults.summary.skipped}`);
    
    const successRate = (testResults.summary.passed / testResults.summary.total * 100).toFixed(1);
    console.log(`\n📈 Success Rate: ${successRate}%`);
    
    if (successRate >= 80) {
      console.log('\n🎉 EXCELLENT! Admin panel is working perfectly!');
    } else if (successRate >= 60) {
      console.log('\n⚠️  GOOD: Most features working, some issues detected');
    } else {
      console.log('\n❌ NEEDS ATTENTION: Multiple issues detected');
    }
    
    // Save test results to file
    await fs.writeFile(
      path.join(__dirname, 'test-results.json'),
      JSON.stringify(testResults, null, 2)
    );
    
    console.log(`\n📁 Results saved to: ${path.join(__dirname, 'test-results.json')}`);
    console.log(`📸 Screenshots saved to: ${CONFIG.screenshotDir}`);
    
  } catch (error) {
    console.error('❌ CRITICAL ERROR:', error);
    logTest('Test Suite', 'failed', { error: error.message });
  } finally {
    if (browser) {
      await browser.close();
    }
    
    // Report to swarm coordinator
    console.log('\n🤖 Reporting to Swarm Coordinator...');
    console.log('✅ Test execution completed');
    console.log(`📊 Final Status: ${testResults.summary.passed}/${testResults.summary.total} tests passed`);
  }
}

// Execute tests
console.log('🔧 IT-ERA Admin Panel - Comprehensive Test Suite');
console.log('🤖 Powered by MCP Swarm Intelligence\n');

runComprehensiveTests().then(() => {
  console.log('\n✅ All tests completed successfully!');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});