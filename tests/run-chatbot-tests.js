#!/usr/bin/env node

/**
 * Test Runner for IT-ERA Chatbot
 * Run comprehensive tests to verify production readiness
 */

const ChatbotTester = require('./chatbot-functionality-tests.js');

async function main() {
  console.log('🚀 IT-ERA Chatbot Production Readiness Tests\n');
  
  // Configuration options
  const config = {
    // Test different environments
    baseUrl: process.env.CHATBOT_URL || 'https://it-era-chatbot.bulltech.workers.dev',
    
    // Test configuration
    verbose: process.env.VERBOSE === 'true' || false,
    skipSlowTests: process.env.SKIP_SLOW === 'true' || false
  };

  console.log(`🔗 Testing endpoint: ${config.baseUrl}`);
  console.log(`⚙️  Configuration: ${JSON.stringify(config, null, 2)}\n`);

  try {
    const tester = new ChatbotTester(config);
    const report = await tester.runAllTests();
    
    // Exit with appropriate code
    process.exit(report.failedTests > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('💥 Test execution failed:', error.message);
    process.exit(1);
  }
}

// Handle CLI arguments
if (process.argv.length > 2) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
IT-ERA Chatbot Test Runner

Usage: node run-chatbot-tests.js [options]

Options:
  --help, -h          Show this help message
  --verbose           Enable verbose output  
  --skip-slow         Skip slow performance tests
  --url <url>         Override default API endpoint

Environment Variables:
  CHATBOT_URL         API endpoint to test (default: production)
  VERBOSE             Enable verbose output (true/false)
  SKIP_SLOW          Skip slow tests (true/false)

Examples:
  # Test production
  node run-chatbot-tests.js
  
  # Test development environment
  CHATBOT_URL="http://localhost:8787" node run-chatbot-tests.js
  
  # Verbose testing
  VERBOSE=true node run-chatbot-tests.js
  
  # Quick testing (skip performance tests)
  SKIP_SLOW=true node run-chatbot-tests.js
    `);
    process.exit(0);
  }
  
  // Parse URL override
  const urlIndex = args.indexOf('--url');
  if (urlIndex !== -1 && args[urlIndex + 1]) {
    process.env.CHATBOT_URL = args[urlIndex + 1];
  }
  
  // Parse flags
  if (args.includes('--verbose')) {
    process.env.VERBOSE = 'true';
  }
  
  if (args.includes('--skip-slow')) {
    process.env.SKIP_SLOW = 'true';
  }
}

// Run tests
main();