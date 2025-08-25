// Jest setup file for IT-ERA Chatbot E2E Tests

// Set up global test timeout
jest.setTimeout(120000); // 2 minutes for E2E tests

// Global test configuration
global.console = {
  ...console,
  // Override console.log to add timestamps
  log: jest.fn((...args) => {
    console.info(`[${new Date().toISOString()}]`, ...args);
  }),
  warn: jest.fn((...args) => {
    console.info(`[WARN ${new Date().toISOString()}]`, ...args);
  }),
  error: jest.fn((...args) => {
    console.info(`[ERROR ${new Date().toISOString()}]`, ...args);
  })
};

// Global test utilities
global.testUtils = {
  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  waitForElement: async (page, selector, timeout = 30000) => {
    try {
      await page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      console.warn(`Element ${selector} not found within ${timeout}ms`);
      return false;
    }
  },
  
  safeClick: async (page, selector) => {
    try {
      const element = await page.$(selector);
      if (element) {
        await element.click();
        return true;
      }
      return false;
    } catch (error) {
      console.warn(`Failed to click ${selector}:`, error.message);
      return false;
    }
  },

  takeScreenshotSafely: async (page, path, fullPage = true) => {
    try {
      await page.screenshot({ path, fullPage });
      console.log(`Screenshot saved: ${path}`);
    } catch (error) {
      console.warn(`Failed to take screenshot ${path}:`, error.message);
    }
  }
};

// Error handling for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, cleaning up...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, cleaning up...');
  process.exit(0);
});