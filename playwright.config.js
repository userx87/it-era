/**
 * Playwright Configuration for IT-ERA E2E Tests
 * Comprehensive end-to-end testing for chatbot, forms, and critical flows
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test directory
  testDir: './tests/e2e',
  
  // Global setup and teardown
  globalSetup: './tests/setup/global-setup.js',
  globalTeardown: './tests/setup/global-teardown.js',
  
  // Test configuration
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  
  // Fail fast on CI
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: './tests/reports/playwright' }],
    ['json', { outputFile: './tests/reports/playwright/results.json' }],
    ['junit', { outputFile: './tests/reports/playwright/results.xml' }],
    process.env.CI ? ['github'] : ['list']
  ],
  
  // Global test settings
  use: {
    // Base URL for tests
    baseURL: process.env.BASE_URL || 'http://localhost:8080',
    
    // Browser context options
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Viewport
    viewport: { width: 1280, height: 720 },
    
    // Ignore HTTPS errors for local testing
    ignoreHTTPSErrors: true,
    
    // User agent
    userAgent: 'IT-ERA E2E Test Suite'
  },
  
  // Test projects for different browsers and scenarios
  projects: [
    // Desktop browsers
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*\.spec\.js/
    },
    {
      name: 'firefox-desktop',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /.*\.spec\.js/
    },
    {
      name: 'webkit-desktop',
      use: { ...devices['Desktop Safari'] },
      testMatch: /.*\.spec\.js/
    },
    
    // Mobile devices
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: /.*mobile.*\.spec\.js/
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
      testMatch: /.*mobile.*\.spec\.js/
    },
    
    // Tablet
    {
      name: 'tablet-chrome',
      use: { ...devices['iPad Pro'] },
      testMatch: /.*tablet.*\.spec\.js/
    },
    
    // Emergency flow tests (critical)
    {
      name: 'emergency-flows',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*emergency.*\.spec\.js/,
      retries: 3 // More retries for critical flows
    },
    
    // Chatbot specific tests
    {
      name: 'chatbot-integration',
      use: { 
        ...devices['Desktop Chrome'],
        // Longer timeout for chatbot interactions
        actionTimeout: 10000
      },
      testMatch: /.*chatbot.*\.spec\.js/
    },
    
    // Performance tests
    {
      name: 'performance',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*performance.*\.spec\.js/
    }
  ],
  
  // Web server configuration for local testing
  webServer: {
    command: 'npm run preview',
    port: 8080,
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  },
  
  // Output directory
  outputDir: './tests/results',
  
  // Test metadata
  metadata: {
    project: 'IT-ERA',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'test'
  }
});
