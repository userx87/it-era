/**
 * IT-ERA CHATBOT PERFORMANCE BENCHMARK TEST
 * 
 * Advanced performance testing focusing on:
 * - Response time optimization
 * - Memory usage monitoring
 * - Network request analysis
 * - Core Web Vitals measurement
 * - Load testing scenarios
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;

class ChatbotPerformanceTester {
  constructor() {
    this.metrics = {
      loadTimes: [],
      responseTimes: [],
      memoryUsage: [],
      networkActivity: [],
      coreWebVitals: {},
      errors: []
    };
  }

  async runPerformanceTests() {
    console.log('🏃‍♂️ Starting Performance Benchmark Tests...');
    
    const browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      // Test 1: Initial Load Performance
      await this.testInitialLoad(browser);
      
      // Test 2: Chatbot Opening Speed
      await this.testChatbotOpenSpeed(browser);
      
      // Test 3: Message Response Performance
      await this.testMessageResponsePerformance(browser);
      
      // Test 4: Memory Usage Over Time
      await this.testMemoryUsage(browser);
      
      // Test 5: Network Request Optimization
      await this.testNetworkOptimization(browser);
      
      // Test 6: Concurrent User Simulation
      await this.testConcurrentUsers(browser);
      
      // Generate Performance Report
      await this.generatePerformanceReport();
      
    } finally {
      await browser.close();
    }
  }

  async testInitialLoad(browser) {
    console.log('📄 Testing initial page load performance...');
    
    const page = await browser.newPage();
    
    // Enable performance monitoring
    await page.setCacheEnabled(false);
    
    const startTime = Date.now();
    await page.goto('https://www.it-era.it', {
      waitUntil: ['networkidle0', 'domcontentloaded']
    });
    
    const loadTime = Date.now() - startTime;
    this.metrics.loadTimes.push(loadTime);
    
    // Get Core Web Vitals
    const vitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = {};
          for (const entry of list.getEntries()) {
            entries[entry.name] = entry.value;
          }
          resolve(entries);
        });
        observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
      });
    });
    
    this.metrics.coreWebVitals = vitals;
    console.log(`✅ Page loaded in ${loadTime}ms`);
    
    await page.close();
  }

  async testChatbotOpenSpeed(browser) {
    console.log('💬 Testing chatbot open speed...');
    
    const page = await browser.newPage();
    await page.goto('https://www.it-era.it');
    
    // Wait for chatbot to be ready
    await page.waitForSelector('#it-era-chatbot-button');
    
    const iterations = 5;
    const openTimes = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      await page.click('#it-era-chatbot-button');
      await page.waitForSelector('#it-era-chatbot-window', { visible: true });
      const openTime = Date.now() - startTime;
      openTimes.push(openTime);
      
      // Close chatbot for next iteration
      await page.click('#it-era-close-chat');
      await page.waitForSelector('#it-era-chatbot-window', { hidden: true });
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const avgOpenTime = openTimes.reduce((a, b) => a + b, 0) / openTimes.length;
    console.log(`✅ Average chatbot open time: ${avgOpenTime.toFixed(2)}ms`);
    
    this.metrics.chatbotOpenTimes = openTimes;
    await page.close();
  }

  async testMessageResponsePerformance(browser) {
    console.log('⚡ Testing message response performance...');
    
    const page = await browser.newPage();
    await page.goto('https://www.it-era.it');
    
    // Open chatbot
    await page.click('#it-era-chatbot-button');
    await page.waitForSelector('#it-era-chatbot-window', { visible: true });
    
    const testMessages = [
      'Ciao, ho bisogno di assistenza',
      'Vorrei un preventivo',
      'Problemi con il server',
      'Assistenza urgente',
      'Sicurezza informatica'
    ];
    
    for (const message of testMessages) {
      const startTime = Date.now();
      
      // Type and send message
      await page.type('#it-era-message-input', message);
      await page.click('#it-era-send-btn');
      
      // Wait for bot response
      await page.waitForFunction(() => {
        const messages = document.querySelectorAll('.it-era-message.bot');
        return messages.length > 0;
      });
      
      const responseTime = Date.now() - startTime;
      this.metrics.responseTimes.push(responseTime);
      
      console.log(`📝 "${message}" response time: ${responseTime}ms`);
      
      // Clear input for next message
      await page.evaluate(() => {
        document.getElementById('it-era-message-input').value = '';
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    await page.close();
  }

  async testMemoryUsage(browser) {
    console.log('🧠 Testing memory usage over time...');
    
    const page = await browser.newPage();
    await page.goto('https://www.it-era.it');
    
    // Open chatbot
    await page.click('#it-era-chatbot-button');
    await page.waitForSelector('#it-era-chatbot-window', { visible: true });
    
    // Simulate extended usage
    for (let i = 0; i < 20; i++) {
      // Send message
      await page.type('#it-era-message-input', `Test message ${i + 1}`);
      await page.click('#it-era-send-btn');
      
      // Get memory usage
      const memory = await page.evaluate(() => {
        return performance.memory ? {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        } : null;
      });
      
      if (memory) {
        this.metrics.memoryUsage.push({
          iteration: i + 1,
          timestamp: Date.now(),
          ...memory
        });
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Clear input
      await page.evaluate(() => {
        document.getElementById('it-era-message-input').value = '';
      });
    }
    
    console.log(`✅ Memory usage tracked over 20 iterations`);
    await page.close();
  }

  async testNetworkOptimization(browser) {
    console.log('🌐 Testing network request optimization...');
    
    const page = await browser.newPage();
    
    // Monitor network requests
    const networkRequests = [];
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
        timestamp: Date.now()
      });
    });
    
    await page.goto('https://www.it-era.it');
    
    // Open chatbot and interact
    await page.click('#it-era-chatbot-button');
    await page.waitForSelector('#it-era-chatbot-window', { visible: true });
    
    // Send a few messages
    const messages = ['Ciao', 'Preventivo', 'Assistenza'];
    for (const message of messages) {
      await page.type('#it-era-message-input', message);
      await page.click('#it-era-send-btn');
      await new Promise(resolve => setTimeout(resolve, 2000));
      await page.evaluate(() => {
        document.getElementById('it-era-message-input').value = '';
      });
    }
    
    this.metrics.networkActivity = networkRequests;
    
    // Analyze requests
    const apiRequests = networkRequests.filter(req => req.url.includes('api'));
    const staticRequests = networkRequests.filter(req => 
      req.resourceType === 'stylesheet' || 
      req.resourceType === 'script' || 
      req.resourceType === 'image'
    );
    
    console.log(`✅ Total requests: ${networkRequests.length}`);
    console.log(`📡 API requests: ${apiRequests.length}`);
    console.log(`📦 Static requests: ${staticRequests.length}`);
    
    await page.close();
  }

  async testConcurrentUsers(browser) {
    console.log('👥 Simulating concurrent users...');
    
    const concurrentUsers = 3;
    const promises = [];
    
    for (let i = 0; i < concurrentUsers; i++) {
      promises.push(this.simulateUser(browser, i + 1));
    }
    
    await Promise.all(promises);
    console.log(`✅ Concurrent user simulation completed`);
  }

  async simulateUser(browser, userId) {
    const page = await browser.newPage();
    
    try {
      await page.goto('https://www.it-era.it');
      
      // Random delay to simulate real user behavior
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000));
      
      // Open chatbot
      await page.click('#it-era-chatbot-button');
      await page.waitForSelector('#it-era-chatbot-window', { visible: true });
      
      // Send messages
      const userMessages = [
        `User ${userId}: Ciao`,
        `User ${userId}: Ho bisogno di assistenza`,
        `User ${userId}: Grazie`
      ];
      
      for (const message of userMessages) {
        await page.type('#it-era-message-input', message);
        await page.click('#it-era-send-btn');
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        await page.evaluate(() => {
          document.getElementById('it-era-message-input').value = '';
        });
      }
      
    } catch (error) {
      console.error(`❌ User ${userId} simulation failed:`, error.message);
      this.metrics.errors.push({
        user: userId,
        error: error.message,
        timestamp: Date.now()
      });
    } finally {
      await page.close();
    }
  }

  async generatePerformanceReport() {
    console.log('📊 Generating performance report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        avgLoadTime: this.metrics.loadTimes.reduce((a, b) => a + b, 0) / this.metrics.loadTimes.length,
        avgResponseTime: this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length,
        maxMemoryUsed: Math.max(...this.metrics.memoryUsage.map(m => m.used)),
        totalNetworkRequests: this.metrics.networkActivity.length,
        errorCount: this.metrics.errors.length
      },
      coreWebVitals: this.metrics.coreWebVitals,
      detailedMetrics: this.metrics,
      recommendations: this.generateRecommendations()
    };
    
    // Save to file
    await fs.writeFile(
      `tests/reports/performance-report-${Date.now()}.json`,
      JSON.stringify(report, null, 2)
    );
    
    // Print summary
    console.log('\n📈 PERFORMANCE SUMMARY:');
    console.log(`⏱️  Average Load Time: ${report.summary.avgLoadTime.toFixed(2)}ms`);
    console.log(`💬 Average Response Time: ${report.summary.avgResponseTime.toFixed(2)}ms`);
    console.log(`🧠 Max Memory Used: ${(report.summary.maxMemoryUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`🌐 Network Requests: ${report.summary.totalNetworkRequests}`);
    console.log(`❌ Errors: ${report.summary.errorCount}`);
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      report.recommendations.forEach(rec => console.log(`   • ${rec}`));
    }
    
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    const avgResponseTime = this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length;
    if (avgResponseTime > 3000) {
      recommendations.push('Consider implementing response caching to improve message response time');
    }
    
    const maxMemory = Math.max(...this.metrics.memoryUsage.map(m => m.used));
    if (maxMemory > 50 * 1024 * 1024) { // 50MB
      recommendations.push('Monitor memory usage - consider implementing cleanup for long conversations');
    }
    
    const apiRequests = this.metrics.networkActivity.filter(req => req.url.includes('api')).length;
    if (apiRequests > 10) {
      recommendations.push('Consider batching API requests to reduce network overhead');
    }
    
    if (this.metrics.errors.length > 0) {
      recommendations.push('Address the identified errors to improve user experience');
    }
    
    return recommendations;
  }
}

// Run if executed directly
if (require.main === module) {
  const tester = new ChatbotPerformanceTester();
  tester.runPerformanceTests()
    .then(() => {
      console.log('\n🎉 Performance testing completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Performance testing failed:', error);
      process.exit(1);
    });
}

module.exports = ChatbotPerformanceTester;