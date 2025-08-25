module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/production-debug-test.js',
    '**/deployment-verification-test.js', 
    '**/*.test.js',
    '**/*.spec.js'
  ],
  testTimeout: 120000, // 2 minutes timeout for Puppeteer tests
  setupFilesAfterEnv: [],
  verbose: true,
  detectOpenHandles: true,
  forceExit: true
};