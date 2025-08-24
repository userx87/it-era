const fs = require('fs-extra');
const path = require('path');

// Setup test environment
beforeAll(async () => {
  // Ensure screenshots and reports directories exist
  await fs.ensureDir(path.join(__dirname, 'screenshots'));
  await fs.ensureDir(path.join(__dirname, 'reports'));
  await fs.ensureDir(path.join(__dirname, 'lighthouse-reports'));
  
  // Set longer timeout for UI tests
  jest.setTimeout(120000);
});

// Global test configuration
global.TEST_CONFIG = {
  TEST_PAGE_URL: 'file://' + path.resolve('/Users/andreapanzeri/progetti/IT-ERA/api/docs/test-swarm-chatbot.html'),
  ADMIN_PAGE_URL: 'file://' + path.resolve('/Users/andreapanzeri/progetti/IT-ERA/api/docs/admin-chatbot.html'),
  API_URL: 'https://it-era-chatbot-staging.bulltech.workers.dev',
  SCREENSHOTS_DIR: path.join(__dirname, 'screenshots'),
  REPORTS_DIR: path.join(__dirname, 'reports'),
  
  // Test viewports
  VIEWPORTS: {
    MOBILE: { width: 375, height: 667 },
    TABLET: { width: 768, height: 1024 },
    DESKTOP: { width: 1920, height: 1080 },
    LARGE_DESKTOP: { width: 2560, height: 1440 }
  },
  
  // Performance thresholds based on PSD requirements
  PERFORMANCE_THRESHOLDS: {
    RESPONSE_TIME: 1600, // <1.6s requirement
    PAGE_LOAD: 3000,
    COST_PER_QUERY: 0.04, // <€0.04 requirement
    LEAD_SCORE_ACCURACY: 85, // >85% requirement
    ERROR_RATE: 5 // <5% requirement
  }
};

// Utility function to wait for element
global.waitForElement = async (page, selector, timeout = 30000) => {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    console.error(`Element ${selector} not found within ${timeout}ms`);
    return false;
  }
};

// Utility function to take screenshot
global.takeScreenshot = async (page, name, fullPage = true) => {
  const screenshotPath = path.join(global.TEST_CONFIG.SCREENSHOTS_DIR, `${name}-${Date.now()}.png`);
  await page.screenshot({ 
    path: screenshotPath, 
    fullPage,
    type: 'png',
    quality: 90
  });
  return screenshotPath;
};

// Cleanup after each test
afterEach(async () => {
  // Add any cleanup logic here
});