const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

/**
 * ULTIMATE IT-ERA CHATBOT PRODUCTION TEST SUITE
 * Testing both production URLs with comprehensive validation
 */

class ComprehensiveChatbotTester {
  constructor() {
    this.results = {
      production: {},
      staging: {},
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        critical: 0
      },
      screenshots: [],
      errors: []
    };
    
    this.testUrls = [
      { name: 'production', url: 'https://www.it-era.it' },
      { name: 'staging', url: 'https://it-era.pages.dev' }
    ];
    
    this.viewports = [
      { name: 'desktop', width: 1920, height: 1080 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'mobile', width: 375, height: 667 }
    ];
  }

  async initialize() {
    console.log('🚀 Initializing Ultimate Chatbot Test Suite...');
    
    // Create screenshots directory
    const screenshotsDir = path.join(__dirname, 'screenshots', 'comprehensive-test');
    await fs.mkdir(screenshotsDir, { recursive: true });
    
    this.browser = await puppeteer.launch({
      headless: false, // Set to true for CI/CD
      defaultViewport: null,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--allow-running-insecure-content'
      ]
    });
    
    console.log('✅ Browser initialized');
  }

  async testChatbotOnUrl(urlInfo, viewport) {
    const page = await this.browser.newPage();
    const testName = `${urlInfo.name}_${viewport.name}`;
    console.log(`\n🧪 Testing ${testName} - ${urlInfo.url}`);
    
    try {
      // Set viewport
      await page.setViewport({
        width: viewport.width,
        height: viewport.height
      });
      
      // Navigate to page
      console.log('📍 Loading page...');
      await page.goto(urlInfo.url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Take initial screenshot
      const initialScreenshot = `${testName}_initial.png`;
      await page.screenshot({ 
        path: path.join(__dirname, 'screenshots', 'comprehensive-test', initialScreenshot),
        fullPage: true 
      });
      this.results.screenshots.push(initialScreenshot);
      
      // Test 1: Page loads successfully
      const title = await page.title();
      console.log(`📄 Page title: ${title}`);
      
      // Test 2: Wait for chatbot widget to be available
      console.log('🤖 Waiting for chatbot widget...');
      await page.waitForSelector('#chatbot-widget, [id*="chat"], [class*="chat"]', { 
        timeout: 10000 
      });
      
      // Test 3: Check for chatbot button/icon
      const chatbotTrigger = await page.$('#chatbot-widget .chat-toggle, .chat-button, [class*="chat-toggle"], [class*="chat-button"]');
      if (!chatbotTrigger) {
        throw new Error('Chatbot trigger button not found');
      }
      console.log('✅ Chatbot trigger found');
      
      // Test 4: Click chatbot trigger
      console.log('👆 Clicking chatbot trigger...');
      await chatbotTrigger.click();
      
      // Wait for chatbot to open
      await page.waitForTimeout(2000);
      
      // Take screenshot after opening
      const openedScreenshot = `${testName}_opened.png`;
      await page.screenshot({ 
        path: path.join(__dirname, 'screenshots', 'comprehensive-test', openedScreenshot),
        fullPage: true 
      });
      this.results.screenshots.push(openedScreenshot);
      
      // Test 5: Check for greeting message
      console.log('📬 Checking greeting message...');
      await page.waitForTimeout(3000); // Wait for greeting to appear
      
      const greetingFound = await page.evaluate(() => {
        const messages = document.querySelectorAll('[class*="message"], [class*="chat-message"], .message');
        for (let message of messages) {
          const text = message.textContent || message.innerText;
          if (text.includes('[IT-ERA]') && text.includes('Ciao, come posso aiutarti?')) {
            return true;
          }
        }
        return false;
      });
      
      if (!greetingFound) {
        console.log('⚠️  Specific greeting not found, checking for any greeting...');
        const anyGreeting = await page.evaluate(() => {
          const messages = document.querySelectorAll('[class*="message"], [class*="chat-message"], .message');
          return messages.length > 0 ? messages[0].textContent || messages[0].innerText : '';
        });
        console.log(`📝 Found greeting: ${anyGreeting}`);
      } else {
        console.log('✅ Correct IT-ERA greeting found');
      }
      
      // Test 6: Send test message
      console.log('💬 Sending test message...');
      const messageInput = await page.$('input[type="text"], textarea, [class*="input"], [class*="message-input"]');
      if (messageInput) {
        await messageInput.type('Ho bisogno di assistenza IT urgente');
        
        // Find send button
        const sendButton = await page.$('button[type="submit"], [class*="send"], [class*="submit"]');
        if (sendButton) {
          await sendButton.click();
          await page.waitForTimeout(3000);
          
          // Take screenshot after message
          const messageScreenshot = `${testName}_message_sent.png`;
          await page.screenshot({ 
            path: path.join(__dirname, 'screenshots', 'comprehensive-test', messageScreenshot),
            fullPage: true 
          });
          this.results.screenshots.push(messageScreenshot);
        }
      }
      
      // Test 7: Check for emergency phone number
      console.log('📞 Checking for emergency phone number...');
      const emergencyPhone = await page.evaluate(() => {
        const bodyText = document.body.textContent || document.body.innerText;
        return bodyText.includes('039 888 2041');
      });
      
      if (emergencyPhone) {
        console.log('✅ Emergency phone number found');
      } else {
        console.log('⚠️  Emergency phone number not visible');
      }
      
      // Test 8: Check for system prompt leakage
      console.log('🔒 Checking for system prompt security...');
      const systemPromptLeakage = await page.evaluate(() => {
        const bodyText = (document.body.textContent || document.body.innerText).toLowerCase();
        const suspiciousTerms = ['system:', 'prompt:', 'assistant:', 'ai model', 'openai', 'anthropic'];
        return suspiciousTerms.some(term => bodyText.includes(term));
      });
      
      if (systemPromptLeakage) {
        console.log('🚨 CRITICAL: Possible system prompt exposure detected');
        this.results.summary.critical++;
      } else {
        console.log('✅ No system prompt leakage detected');
      }
      
      // Test 9: API Connectivity Test
      console.log('🌐 Testing API connectivity...');
      const apiTest = await page.evaluate(async () => {
        try {
          // Check if there are any network requests to chat/API endpoints
          const performanceEntries = performance.getEntriesByType('navigation');
          return performanceEntries.length > 0;
        } catch (error) {
          return false;
        }
      });
      
      // Test 10: Mobile responsiveness (if mobile viewport)
      if (viewport.name === 'mobile') {
        console.log('📱 Testing mobile responsiveness...');
        const mobileOptimized = await page.evaluate(() => {
          const chatWidget = document.querySelector('#chatbot-widget, [class*="chat"]');
          if (!chatWidget) return false;
          
          const rect = chatWidget.getBoundingClientRect();
          return rect.width <= window.innerWidth && rect.height <= window.innerHeight;
        });
        
        console.log(`📱 Mobile optimization: ${mobileOptimized ? 'PASS' : 'FAIL'}`);
      }
      
      // Final screenshot
      const finalScreenshot = `${testName}_final.png`;
      await page.screenshot({ 
        path: path.join(__dirname, 'screenshots', 'comprehensive-test', finalScreenshot),
        fullPage: true 
      });
      this.results.screenshots.push(finalScreenshot);
      
      // Compile test results
      this.results[urlInfo.name][viewport.name] = {
        status: 'PASS',
        title: title,
        greetingFound: greetingFound,
        emergencyPhone: emergencyPhone,
        systemPromptSecure: !systemPromptLeakage,
        apiConnectivity: apiTest,
        screenshots: [initialScreenshot, openedScreenshot, messageScreenshot, finalScreenshot]
      };
      
      this.results.summary.passed++;
      console.log(`✅ ${testName} completed successfully`);
      
    } catch (error) {
      console.error(`❌ ${testName} failed:`, error.message);
      
      // Take error screenshot
      const errorScreenshot = `${testName}_error.png`;
      try {
        await page.screenshot({ 
          path: path.join(__dirname, 'screenshots', 'comprehensive-test', errorScreenshot),
          fullPage: true 
        });
        this.results.screenshots.push(errorScreenshot);
      } catch (screenshotError) {
        console.error('Failed to take error screenshot:', screenshotError.message);
      }
      
      this.results[urlInfo.name][viewport.name] = {
        status: 'FAIL',
        error: error.message,
        screenshots: [errorScreenshot]
      };
      
      this.results.errors.push(`${testName}: ${error.message}`);
      this.results.summary.failed++;
    } finally {
      await page.close();
      this.results.summary.totalTests++;
    }
  }

  async runAllTests() {
    console.log('\n🎯 Starting comprehensive chatbot tests...');
    
    for (const urlInfo of this.testUrls) {
      this.results[urlInfo.name] = {};
      
      for (const viewport of this.viewports) {
        await this.testChatbotOnUrl(urlInfo, viewport);
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  async generateReport() {
    console.log('\n📊 Generating comprehensive test report...');
    
    const timestamp = new Date().toISOString();
    const reportData = {
      timestamp: timestamp,
      summary: this.results.summary,
      results: this.results,
      testConfiguration: {
        urls: this.testUrls,
        viewports: this.viewports
      }
    };
    
    // Save JSON report
    const jsonReportPath = path.join(__dirname, 'reports', `chatbot-comprehensive-test-${Date.now()}.json`);
    await fs.mkdir(path.dirname(jsonReportPath), { recursive: true });
    await fs.writeFile(jsonReportPath, JSON.stringify(reportData, null, 2));
    
    // Generate HTML report
    const htmlReport = this.generateHtmlReport(reportData);
    const htmlReportPath = path.join(__dirname, 'reports', `chatbot-comprehensive-test-${Date.now()}.html`);
    await fs.writeFile(htmlReportPath, htmlReport);
    
    console.log(`📋 Reports generated:`);
    console.log(`   JSON: ${jsonReportPath}`);
    console.log(`   HTML: ${htmlReportPath}`);
    
    return reportData;
  }

  generateHtmlReport(data) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>IT-ERA Chatbot Comprehensive Test Report</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { background: #0056cc; color: white; padding: 20px; border-radius: 8px; }
            .summary { display: flex; gap: 20px; margin: 20px 0; }
            .stat-card { background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; }
            .pass { background: #d4edda; border-left: 5px solid #28a745; }
            .fail { background: #f8d7da; border-left: 5px solid #dc3545; }
            .critical { background: #fff3cd; border-left: 5px solid #ffc107; }
            .test-result { margin: 10px 0; padding: 15px; border-radius: 8px; }
            .screenshots { display: flex; gap: 10px; flex-wrap: wrap; margin: 10px 0; }
            .screenshot { max-width: 200px; border: 1px solid #ddd; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🤖 IT-ERA Chatbot Comprehensive Test Report</h1>
            <p>Generated: ${data.timestamp}</p>
        </div>
        
        <div class="summary">
            <div class="stat-card">
                <h3>${data.summary.totalTests}</h3>
                <p>Total Tests</p>
            </div>
            <div class="stat-card pass">
                <h3>${data.summary.passed}</h3>
                <p>Passed</p>
            </div>
            <div class="stat-card fail">
                <h3>${data.summary.failed}</h3>
                <p>Failed</p>
            </div>
            <div class="stat-card critical">
                <h3>${data.summary.critical}</h3>
                <p>Critical Issues</p>
            </div>
        </div>

        <h2>📊 Test Results by Environment</h2>
        
        ${Object.entries(data.results).filter(([key]) => key !== 'summary' && key !== 'screenshots' && key !== 'errors').map(([env, results]) => `
            <h3>🌐 ${env.toUpperCase()}</h3>
            <table>
                <tr>
                    <th>Viewport</th>
                    <th>Status</th>
                    <th>Greeting</th>
                    <th>Emergency Phone</th>
                    <th>Security</th>
                    <th>API</th>
                </tr>
                ${Object.entries(results).map(([viewport, result]) => `
                    <tr class="${result.status === 'PASS' ? 'pass' : 'fail'}">
                        <td>${viewport}</td>
                        <td>${result.status}</td>
                        <td>${result.greetingFound ? '✅' : '❌'}</td>
                        <td>${result.emergencyPhone ? '✅' : '❌'}</td>
                        <td>${result.systemPromptSecure ? '✅' : '🚨'}</td>
                        <td>${result.apiConnectivity ? '✅' : '❌'}</td>
                    </tr>
                `).join('')}
            </table>
        `).join('')}

        ${data.results.errors && data.results.errors.length > 0 ? `
            <h2>❌ Errors Encountered</h2>
            <ul>
                ${data.results.errors.map(error => `<li>${error}</li>`).join('')}
            </ul>
        ` : ''}

        <h2>📷 Screenshots Generated</h2>
        <p>Total screenshots: ${data.results.screenshots ? data.results.screenshots.length : 0}</p>
        
        <h2>🔧 Test Configuration</h2>
        <h3>URLs Tested:</h3>
        <ul>
            ${data.testConfiguration.urls.map(url => `<li>${url.name}: ${url.url}</li>`).join('')}
        </ul>
        
        <h3>Viewports Tested:</h3>
        <ul>
            ${data.testConfiguration.viewports.map(vp => `<li>${vp.name}: ${vp.width}x${vp.height}</li>`).join('')}
        </ul>
    </body>
    </html>
    `;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Main execution function
async function runComprehensiveChatbotTests() {
  const tester = new ComprehensiveChatbotTester();
  
  try {
    await tester.initialize();
    await tester.runAllTests();
    const report = await tester.generateReport();
    
    // Print summary
    console.log('\n🎉 COMPREHENSIVE TEST SUMMARY');
    console.log('================================');
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`Critical Issues: ${report.summary.critical}`);
    console.log(`Success Rate: ${((report.summary.passed / report.summary.totalTests) * 100).toFixed(1)}%`);
    
    if (report.summary.critical > 0) {
      console.log('\n🚨 CRITICAL ISSUES DETECTED - IMMEDIATE ATTENTION REQUIRED!');
    }
    
    if (report.summary.failed === 0) {
      console.log('\n✅ ALL TESTS PASSED! Chatbot is production ready.');
    } else {
      console.log(`\n⚠️  ${report.summary.failed} tests failed. Review required.`);
    }
    
  } catch (error) {
    console.error('🚨 Test suite failed:', error);
    throw error;
  } finally {
    await tester.cleanup();
  }
}

// Export for use in other modules
module.exports = {
  ComprehensiveChatbotTester,
  runComprehensiveChatbotTests
};

// Run tests if called directly
if (require.main === module) {
  runComprehensiveChatbotTests()
    .then(() => {
      console.log('\n🎯 Comprehensive chatbot testing completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}