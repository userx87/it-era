// Global test setup and utilities
const axios = require('axios');

// Test configuration
global.TEST_CONFIG = {
  ADMIN_PANEL_URL: 'https://it-era.pages.dev/admin/',
  API_BASE_URL: 'https://it-era-blog-api.bulltech.workers.dev',
  TEST_USER: {
    email: 'admin@it-era.it',
    password: 'admin123!'
  },
  TIMEOUTS: {
    API: 10000,
    UI: 30000,
    PERFORMANCE: 5000
  }
};

// Global test utilities
global.testUtils = {
  // Generate random test data
  generateTestData: () => ({
    title: `Test Post ${Date.now()}`,
    content: `Test content generated at ${new Date().toISOString()}`,
    category: `test-category-${Date.now()}`,
    tags: [`tag1-${Date.now()}`, `tag2-${Date.now()}`],
    slug: `test-post-${Date.now()}`
  }),

  // Wait for element or condition
  waitFor: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // API request helper with error handling
  apiRequest: async (method, endpoint, data = null, headers = {}) => {
    try {
      const config = {
        method,
        url: `${global.TEST_CONFIG.API_BASE_URL}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        timeout: global.TEST_CONFIG.TIMEOUTS.API
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return response;
    } catch (error) {
      throw new Error(`API request failed: ${error.message}`);
    }
  },

  // Clean test data
  cleanup: async (token) => {
    // Clean up test posts, categories, tags
    try {
      await global.testUtils.apiRequest('DELETE', '/test-cleanup', null, {
        'Authorization': `Bearer ${token}`
      });
    } catch (error) {
      console.warn('Cleanup failed:', error.message);
    }
  }
};

// Global test hooks
beforeAll(async () => {
  console.log('🚀 Starting IT-ERA Admin Panel Test Suite');
  // Set longer timeout for all tests
  jest.setTimeout(60000);
});

afterAll(async () => {
  console.log('✅ IT-ERA Admin Panel Test Suite Complete');
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});