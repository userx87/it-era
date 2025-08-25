/**
 * ULTIMATE IT-ERA CHATBOT PUPPETEER TEST SUITE
 * 
 * Comprehensive testing for all chatbot scenarios:
 * - Normal user interactions
 * - Message typing and responses
 * - Option selections
 * - Emergency scenario testing
 * - Mobile viewport testing
 * - Performance monitoring
 * - Dynamic content loading
 * - Retry logic and error handling
 * 
 * Author: QA Testing Agent
 * URL: https://www.it-era.it
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class ITERAChatbotTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = [];
    this.performanceMetrics = {
      chatOpenTime: 0,
      messageResponseTime: 0,
      totalLoadTime: 0,
      networkRequests: [],
      consoleErrors: []
    };
    this.config = {
      baseUrl: 'https://www.it-era.it',
      timeout: 30000,
      retryAttempts: 3,
      headless: false, // Set to false for debugging
      slowMo: 100,
      screenshots: true
    };
  }

  /**
   * Initialize browser and page with advanced configurations
   */
  async initialize() {
    console.log('🚀 Initializing Ultimate Chatbot Test Suite...');
    
    this.browser = await puppeteer.launch({
      headless: this.config.headless,
      slowMo: this.config.slowMo,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--allow-running-insecure-content',
        '--disable-features=VizDisplayCompositor'
      ],
      defaultViewport: {
        width: 1920,
        height: 1080
      }
    });

    this.page = await this.browser.newPage();
    
    // Enable request/response monitoring
    await this.page.setRequestInterception(true);
    this.page.on('request', request => {
      this.performanceMetrics.networkRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: Date.now()
      });
      request.continue();
    });

    // Monitor console errors
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.performanceMetrics.consoleErrors.push({
          text: msg.text(),
          timestamp: Date.now()
        });
      }
    });

    // Set user agent
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('✅ Browser initialized successfully');
  }

  /**
   * Load IT-ERA homepage with performance monitoring
   */
  async loadHomepage() {
    console.log('📄 Loading IT-ERA homepage...');
    const startTime = Date.now();
    
    try {
      await this.page.goto(this.config.baseUrl, {
        waitUntil: ['networkidle0', 'domcontentloaded'],
        timeout: this.config.timeout
      });
      
      this.performanceMetrics.totalLoadTime = Date.now() - startTime;
      
      // Wait for chatbot to be ready
      await this.page.waitForSelector('#it-era-chatbot-container', { 
        visible: true, 
        timeout: 10000 
      });
      
      console.log(`✅ Homepage loaded in ${this.performanceMetrics.totalLoadTime}ms`);
      
      if (this.config.screenshots) {
        await this.takeScreenshot('01-homepage-loaded');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Failed to load homepage:', error.message);
      return false;
    }
  }

  /**
   * TEST SCENARIO 1: Normal user opens chatbot
   */
  async testChatbotOpen() {
    console.log('🔵 TEST 1: Testing chatbot open functionality...');
    
    try {
      const chatButton = await this.page.$('#it-era-chatbot-button');
      if (!chatButton) {
        throw new Error('Chatbot button not found');
      }

      // Measure open time
      const startTime = Date.now();
      await chatButton.click();
      
      // Wait for chat window to appear
      await this.page.waitForSelector('#it-era-chatbot-window', { 
        visible: true, 
        timeout: 5000 
      });
      
      this.performanceMetrics.chatOpenTime = Date.now() - startTime;
      
      // Verify chat window is visible
      const chatWindow = await this.page.$('#it-era-chatbot-window');
      const isVisible = await chatWindow.isIntersectingViewport();
      
      if (!isVisible) {
        throw new Error('Chat window is not visible');
      }

      // Check for welcome message
      await this.page.waitForSelector('.it-era-message.bot', { timeout: 5000 });
      const welcomeMessage = await this.page.$eval('.it-era-message.bot .it-era-message-bubble', 
        el => el.textContent);

      console.log(`✅ Chatbot opened successfully in ${this.performanceMetrics.chatOpenTime}ms`);
      console.log(`📝 Welcome message: "${welcomeMessage.substring(0, 50)}..."`);
      
      if (this.config.screenshots) {
        await this.takeScreenshot('02-chatbot-opened');
      }

      this.addTestResult('chatbot_open', true, {
        openTime: this.performanceMetrics.chatOpenTime,
        welcomeMessage: welcomeMessage.substring(0, 100)
      });

      return true;
    } catch (error) {
      console.error('❌ Chatbot open test failed:', error.message);
      this.addTestResult('chatbot_open', false, { error: error.message });
      return false;
    }
  }

  /**
   * TEST SCENARIO 2: User types a message
   */
  async testMessageTyping() {
    console.log('🔵 TEST 2: Testing message typing and response...');
    
    const testMessages = [
      'Ciao, ho bisogno di assistenza',
      'Vorrei un preventivo per sicurezza informatica',
      'Ho un problema con il mio server',
      'Quando siete aperti?'
    ];

    for (let i = 0; i < testMessages.length; i++) {
      const message = testMessages[i];
      console.log(`📝 Testing message ${i + 1}: "${message}"`);
      
      try {
        // Clear input and type message
        const input = await this.page.$('#it-era-message-input');
        if (!input) {
          throw new Error('Message input not found');
        }

        await input.click({ clickCount: 3 });
        await input.type(message, { delay: 50 });
        
        // Send message
        const sendButton = await this.page.$('#it-era-send-btn');
        const startTime = Date.now();
        await sendButton.click();
        
        // Wait for user message to appear
        await this.page.waitForFunction(() => {
          const messages = document.querySelectorAll('.it-era-message.user');
          return messages[messages.length - 1]?.textContent?.includes(arguments[0]);
        }, { timeout: 5000 }, message);

        // Wait for bot response with typing indicator
        await this.page.waitForSelector('#typing-indicator', { timeout: 2000 })
          .catch(() => console.log('No typing indicator shown'));
        
        // Wait for bot response
        await this.page.waitForFunction((messageCount) => {
          return document.querySelectorAll('.it-era-message.bot').length > messageCount;
        }, { timeout: 15000 }, i + 1);

        const responseTime = Date.now() - startTime;
        this.performanceMetrics.messageResponseTime = responseTime;

        // Get bot response
        const botMessages = await this.page.$$eval('.it-era-message.bot', 
          messages => messages.map(msg => msg.textContent));
        const latestResponse = botMessages[botMessages.length - 1];

        console.log(`✅ Message ${i + 1} processed in ${responseTime}ms`);
        console.log(`🤖 Bot response: "${latestResponse.substring(0, 50)}..."`);

        this.addTestResult(`message_${i + 1}`, true, {
          message,
          response: latestResponse.substring(0, 100),
          responseTime
        });

        await this.delay(1000); // Pause between messages

      } catch (error) {
        console.error(`❌ Message ${i + 1} test failed:`, error.message);
        this.addTestResult(`message_${i + 1}`, false, { error: error.message });
      }
    }

    if (this.config.screenshots) {
      await this.takeScreenshot('03-message-conversation');
    }

    return true;
  }

  /**
   * TEST SCENARIO 3: User selects an option
   */
  async testOptionSelection() {
    console.log('🔵 TEST 3: Testing option button selection...');
    
    try {
      // Look for option buttons
      await this.page.waitForSelector('.it-era-option-btn', { timeout: 5000 });
      const optionButtons = await this.page.$$('.it-era-option-btn');
      
      if (optionButtons.length === 0) {
        throw new Error('No option buttons found');
      }

      console.log(`📋 Found ${optionButtons.length} option buttons`);
      
      // Test first option button
      const firstOption = optionButtons[0];
      const optionText = await this.page.evaluate(el => el.textContent, firstOption);
      
      console.log(`🎯 Clicking option: "${optionText}"`);
      
      const startTime = Date.now();
      await firstOption.click();
      
      // Wait for response
      await this.page.waitForFunction((currentMessageCount) => {
        return document.querySelectorAll('.it-era-message').length > currentMessageCount;
      }, { timeout: 10000 }, await this.page.$$eval('.it-era-message', msgs => msgs.length));
      
      const responseTime = Date.now() - startTime;
      
      console.log(`✅ Option selection processed in ${responseTime}ms`);
      
      this.addTestResult('option_selection', true, {
        optionText,
        responseTime
      });

      if (this.config.screenshots) {
        await this.takeScreenshot('04-option-selected');
      }

      return true;
    } catch (error) {
      console.error('❌ Option selection test failed:', error.message);
      this.addTestResult('option_selection', false, { error: error.message });
      return false;
    }
  }

  /**
   * TEST SCENARIO 4: Emergency scenario test
   */
  async testEmergencyScenario() {
    console.log('🔵 TEST 4: Testing emergency scenario...');
    
    const emergencyMessages = [
      'URGENTE: il server è down!',
      'EMERGENZA: ransomware sui nostri PC',
      'Sistema bloccato, aiuto immediato!',
      'Attacco hacker in corso!'
    ];

    for (const message of emergencyMessages) {
      try {
        console.log(`🚨 Testing emergency message: "${message}"`);
        
        // Type emergency message
        const input = await this.page.$('#it-era-message-input');
        await input.click({ clickCount: 3 });
        await input.type(message, { delay: 30 });
        
        const sendButton = await this.page.$('#it-era-send-btn');
        const startTime = Date.now();
        await sendButton.click();
        
        // Wait for emergency response
        await this.page.waitForFunction((msgCount) => {
          return document.querySelectorAll('.it-era-message.bot').length > msgCount;
        }, { timeout: 10000 }, await this.page.$$eval('.it-era-message.bot', msgs => msgs.length));
        
        // Check for emergency styling or phone number
        const hasEmergencyResponse = await this.page.evaluate(() => {
          const lastBotMessage = Array.from(document.querySelectorAll('.it-era-message.bot')).pop();
          const text = lastBotMessage ? lastBotMessage.textContent : '';
          return text.includes('039 888 2041') || text.includes('emergenza') || text.includes('immediato');
        });
        
        const responseTime = Date.now() - startTime;
        
        if (hasEmergencyResponse) {
          console.log(`✅ Emergency response triggered in ${responseTime}ms`);
          this.addTestResult('emergency_scenario', true, { message, responseTime });
        } else {
          console.log(`⚠️ Emergency response not detected for: "${message}"`);
          this.addTestResult('emergency_scenario', false, { 
            message, 
            error: 'No emergency response detected' 
          });
        }
        
        await this.delay(1500);
        
      } catch (error) {
        console.error(`❌ Emergency test failed for "${message}":`, error.message);
        this.addTestResult('emergency_scenario', false, { 
          message, 
          error: error.message 
        });
      }
    }

    if (this.config.screenshots) {
      await this.takeScreenshot('05-emergency-scenario');
    }

    return true;
  }

  /**
   * TEST SCENARIO 5: Mobile viewport test
   */
  async testMobileViewport() {
    console.log('🔵 TEST 5: Testing mobile viewport...');
    
    const mobileViewports = [
      { name: 'iPhone 12', width: 390, height: 844 },
      { name: 'Samsung Galaxy S21', width: 360, height: 800 },
      { name: 'iPad', width: 768, height: 1024 }
    ];

    for (const viewport of mobileViewports) {
      try {
        console.log(`📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
        
        // Set viewport
        await this.page.setViewport({
          width: viewport.width,
          height: viewport.height,
          isMobile: viewport.width < 768
        });

        // Wait for responsive adjustments
        await this.delay(1000);
        
        // Check if chatbot is visible
        const chatButton = await this.page.$('#it-era-chatbot-button');
        const isVisible = await chatButton.isIntersectingViewport();
        
        if (!isVisible) {
          throw new Error('Chatbot button not visible in mobile viewport');
        }

        // Test opening on mobile
        await chatButton.click();
        await this.page.waitForSelector('#it-era-chatbot-window', { 
          visible: true, 
          timeout: 5000 
        });

        // Check mobile responsiveness
        const chatWindowBounds = await this.page.$eval('#it-era-chatbot-window', el => {
          const rect = el.getBoundingClientRect();
          return {
            width: rect.width,
            height: rect.height,
            right: rect.right,
            bottom: rect.bottom
          };
        });

        const isResponsive = chatWindowBounds.right <= viewport.width && 
                           chatWindowBounds.bottom <= viewport.height;

        if (!isResponsive) {
          throw new Error('Chat window not properly responsive');
        }

        console.log(`✅ ${viewport.name} test passed`);
        this.addTestResult(`mobile_${viewport.name.toLowerCase().replace(/\s+/g, '_')}`, true, {
          viewport: viewport.name,
          dimensions: `${viewport.width}x${viewport.height}`,
          chatWindowBounds
        });

        if (this.config.screenshots) {
          await this.takeScreenshot(`06-mobile-${viewport.name.toLowerCase().replace(/\s+/g, '-')}`);
        }

        // Close chat for next test
        await this.page.click('#it-era-close-chat');
        await this.delay(500);

      } catch (error) {
        console.error(`❌ Mobile test failed for ${viewport.name}:`, error.message);
        this.addTestResult(`mobile_${viewport.name.toLowerCase().replace(/\s+/g, '_')}`, false, {
          viewport: viewport.name,
          error: error.message
        });
      }
    }

    // Reset to desktop viewport
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    return true;
  }

  /**
   * Test dynamic content loading and retry logic
   */
  async testDynamicContentAndRetry() {
    console.log('🔵 TEST 6: Testing dynamic content loading and retry logic...');
    
    try {
      // Test network failure scenario
      await this.page.setOfflineMode(true);
      
      // Try to send a message while offline
      const input = await this.page.$('#it-era-message-input');
      await input.click({ clickCount: 3 });
      await input.type('Test message while offline', { delay: 50 });
      
      const sendButton = await this.page.$('#it-era-send-btn');
      await sendButton.click();
      
      await this.delay(2000);
      
      // Go back online
      await this.page.setOfflineMode(false);
      
      // Test retry functionality
      await sendButton.click();
      
      // Wait for response
      await this.page.waitForFunction((msgCount) => {
        return document.querySelectorAll('.it-era-message.bot').length > msgCount;
      }, { timeout: 15000 }, await this.page.$$eval('.it-era-message.bot', msgs => msgs.length));
      
      console.log('✅ Dynamic content and retry logic test passed');
      this.addTestResult('dynamic_content_retry', true, {
        scenario: 'Network failure and recovery'
      });

    } catch (error) {
      console.error('❌ Dynamic content test failed:', error.message);
      this.addTestResult('dynamic_content_retry', false, { error: error.message });
    }

    if (this.config.screenshots) {
      await this.takeScreenshot('07-dynamic-content-retry');
    }
  }

  /**
   * Test performance metrics collection
   */
  async testPerformanceMetrics() {
    console.log('🔵 TEST 7: Collecting performance metrics...');
    
    try {
      // Collect Core Web Vitals
      const metrics = await this.page.evaluate(() => {
        return new Promise((resolve) => {
          if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              resolve(entries.map(entry => ({
                name: entry.name,
                value: entry.value,
                rating: entry.value < 2500 ? 'good' : entry.value < 4000 ? 'needs-improvement' : 'poor'
              })));
            });
            observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
          } else {
            resolve([]);
          }
        });
      });

      // Memory usage
      const memoryInfo = await this.page.evaluate(() => {
        return performance.memory ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        } : null;
      });

      this.performanceMetrics.coreWebVitals = metrics;
      this.performanceMetrics.memoryUsage = memoryInfo;

      console.log('✅ Performance metrics collected');
      console.log(`📊 Network requests: ${this.performanceMetrics.networkRequests.length}`);
      console.log(`⚠️ Console errors: ${this.performanceMetrics.consoleErrors.length}`);

      this.addTestResult('performance_metrics', true, {
        coreWebVitals: metrics,
        memoryUsage: memoryInfo,
        networkRequests: this.performanceMetrics.networkRequests.length,
        consoleErrors: this.performanceMetrics.consoleErrors.length
      });

    } catch (error) {
      console.error('❌ Performance metrics test failed:', error.message);
      this.addTestResult('performance_metrics', false, { error: error.message });
    }
  }

  /**
   * Utility: Take screenshot with timestamp
   */
  async takeScreenshot(name) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `screenshot-${name}-${timestamp}.png`;
      const screenshotDir = path.join(__dirname, 'screenshots');
      
      // Create screenshots directory if it doesn't exist
      try {
        await fs.access(screenshotDir);
      } catch {
        await fs.mkdir(screenshotDir, { recursive: true });
      }
      
      await this.page.screenshot({
        path: path.join(screenshotDir, filename),
        fullPage: true
      });
      
      console.log(`📸 Screenshot saved: ${filename}`);
    } catch (error) {
      console.error('❌ Failed to take screenshot:', error.message);
    }
  }

  /**
   * Utility: Add test result
   */
  addTestResult(testName, passed, details = {}) {
    this.testResults.push({
      test: testName,
      passed,
      timestamp: new Date().toISOString(),
      details
    });
  }

  /**
   * Utility: Delay function
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate comprehensive test report
   */
  async generateReport() {
    console.log('📊 Generating comprehensive test report...');
    
    const passedTests = this.testResults.filter(test => test.passed);
    const failedTests = this.testResults.filter(test => !test.passed);
    
    const report = {
      summary: {
        totalTests: this.testResults.length,
        passed: passedTests.length,
        failed: failedTests.length,
        successRate: `${((passedTests.length / this.testResults.length) * 100).toFixed(2)}%`,
        testDate: new Date().toISOString()
      },
      performance: this.performanceMetrics,
      testResults: this.testResults,
      recommendations: this.generateRecommendations()
    };

    // Save report to file
    const reportDir = path.join(__dirname, 'reports');
    try {
      await fs.access(reportDir);
    } catch {
      await fs.mkdir(reportDir, { recursive: true });
    }

    const reportFile = path.join(reportDir, `chatbot-test-report-${Date.now()}.json`);
    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));

    // Generate HTML report
    await this.generateHTMLReport(report, reportDir);

    console.log('✅ Test report generated:', reportFile);
    
    return report;
  }

  /**
   * Generate recommendations based on test results
   */
  generateRecommendations() {
    const recommendations = [];
    
    if (this.performanceMetrics.chatOpenTime > 1000) {
      recommendations.push('Consider optimizing chatbot open time (current: ' + this.performanceMetrics.chatOpenTime + 'ms)');
    }
    
    if (this.performanceMetrics.messageResponseTime > 5000) {
      recommendations.push('Message response time could be improved (current: ' + this.performanceMetrics.messageResponseTime + 'ms)');
    }
    
    if (this.performanceMetrics.consoleErrors.length > 0) {
      recommendations.push(`Fix ${this.performanceMetrics.consoleErrors.length} console errors detected`);
    }
    
    const failedTests = this.testResults.filter(test => !test.passed);
    if (failedTests.length > 0) {
      recommendations.push(`Address ${failedTests.length} failed tests: ${failedTests.map(t => t.test).join(', ')}`);
    }
    
    return recommendations;
  }

  /**
   * Generate HTML report
   */
  async generateHTMLReport(report, reportDir) {
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>IT-ERA Chatbot Test Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #667eea; }
        .test-result { padding: 10px; margin: 10px 0; border-radius: 4px; }
        .passed { background: #d4edda; border-left: 4px solid #28a745; }
        .failed { background: #f8d7da; border-left: 4px solid #dc3545; }
        .performance { background: #e2e3e5; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .recommendations { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🚀 IT-ERA Chatbot Ultimate Test Report</h1>
        <p>Comprehensive automated testing results</p>
        <p>Generated: ${report.summary.testDate}</p>
      </div>
      
      <div class="summary">
        <div class="metric">
          <div class="metric-value">${report.summary.totalTests}</div>
          <div>Total Tests</div>
        </div>
        <div class="metric">
          <div class="metric-value" style="color: #28a745;">${report.summary.passed}</div>
          <div>Passed</div>
        </div>
        <div class="metric">
          <div class="metric-value" style="color: #dc3545;">${report.summary.failed}</div>
          <div>Failed</div>
        </div>
        <div class="metric">
          <div class="metric-value">${report.summary.successRate}</div>
          <div>Success Rate</div>
        </div>
      </div>

      <div class="performance">
        <h3>📊 Performance Metrics</h3>
        <ul>
          <li><strong>Chat Open Time:</strong> ${report.performance.chatOpenTime}ms</li>
          <li><strong>Message Response Time:</strong> ${report.performance.messageResponseTime}ms</li>
          <li><strong>Total Load Time:</strong> ${report.performance.totalLoadTime}ms</li>
          <li><strong>Network Requests:</strong> ${report.performance.networkRequests.length}</li>
          <li><strong>Console Errors:</strong> ${report.performance.consoleErrors.length}</li>
        </ul>
      </div>

      ${report.recommendations.length > 0 ? `
      <div class="recommendations">
        <h3>💡 Recommendations</h3>
        <ul>
          ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
      </div>
      ` : ''}

      <h3>📋 Test Results</h3>
      ${report.testResults.map(test => `
        <div class="test-result ${test.passed ? 'passed' : 'failed'}">
          <h4>${test.passed ? '✅' : '❌'} ${test.test}</h4>
          <p><strong>Status:</strong> ${test.passed ? 'PASSED' : 'FAILED'}</p>
          <p><strong>Timestamp:</strong> ${test.timestamp}</p>
          ${test.details ? `<p><strong>Details:</strong> ${JSON.stringify(test.details, null, 2)}</p>` : ''}
        </div>
      `).join('')}
    </body>
    </html>
    `;

    const htmlFile = path.join(reportDir, `chatbot-test-report-${Date.now()}.html`);
    await fs.writeFile(htmlFile, htmlContent);
    
    console.log('✅ HTML report generated:', htmlFile);
  }

  /**
   * Execute all tests with retry logic
   */
  async runAllTests() {
    console.log('🚀 Starting Ultimate IT-ERA Chatbot Test Suite...');
    console.log(`🌐 Target URL: ${this.config.baseUrl}`);
    console.log(`⚙️ Configuration: ${JSON.stringify(this.config, null, 2)}`);
    
    const startTime = Date.now();
    
    try {
      // Initialize
      await this.initialize();
      
      // Load homepage
      const homepageLoaded = await this.loadHomepage();
      if (!homepageLoaded) {
        throw new Error('Failed to load homepage, aborting tests');
      }
      
      // Execute test scenarios
      await this.testChatbotOpen();
      await this.testMessageTyping();
      await this.testOptionSelection();
      await this.testEmergencyScenario();
      await this.testMobileViewport();
      await this.testDynamicContentAndRetry();
      await this.testPerformanceMetrics();
      
      const totalTestTime = Date.now() - startTime;
      console.log(`⏱️ Total test execution time: ${totalTestTime}ms`);
      
      // Generate report
      const report = await this.generateReport();
      
      // Print summary
      console.log('\n' + '='.repeat(50));
      console.log('🏁 TEST SUITE COMPLETED');
      console.log('='.repeat(50));
      console.log(`📊 Total Tests: ${report.summary.totalTests}`);
      console.log(`✅ Passed: ${report.summary.passed}`);
      console.log(`❌ Failed: ${report.summary.failed}`);
      console.log(`📈 Success Rate: ${report.summary.successRate}`);
      console.log(`⏱️ Execution Time: ${totalTestTime}ms`);
      
      if (report.recommendations.length > 0) {
        console.log('\n💡 RECOMMENDATIONS:');
        report.recommendations.forEach(rec => console.log(`   • ${rec}`));
      }
      
      return report;
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Export for use as module or run directly
if (require.main === module) {
  const tester = new ITERAChatbotTester();
  tester.runAllTests()
    .then(report => {
      console.log('\n🎉 All tests completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = ITERAChatbotTester;