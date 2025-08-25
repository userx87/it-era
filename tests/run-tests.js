#!/usr/bin/env node

/**
 * IT-ERA CHATBOT TEST RUNNER
 * 
 * Orchestrates all chatbot tests with different modes and configurations
 */

const UltimateChatbotTester = require('./puppeteer-ultimate-chatbot-test');
const PerformanceTester = require('./chatbot-performance-test');
const fs = require('fs').promises;
const path = require('path');

class TestRunner {
  constructor() {
    this.config = {
      mode: process.env.TEST_MODE || 'all',
      headless: process.env.HEADLESS === 'true',
      slowMo: parseInt(process.env.SLOW_MO) || 100,
      timeout: parseInt(process.env.TIMEOUT) || 30000,
      retries: parseInt(process.env.RETRIES) || 3,
      screenshots: process.env.SCREENSHOTS !== 'false',
      parallel: process.env.PARALLEL === 'true'
    };
    
    this.results = {
      functional: null,
      performance: null,
      startTime: Date.now(),
      endTime: null
    };
  }

  async run() {
    console.log('🚀 Starting IT-ERA Chatbot Test Suite');
    console.log('=====================================');
    console.log(`Mode: ${this.config.mode}`);
    console.log(`Headless: ${this.config.headless}`);
    console.log(`Screenshots: ${this.config.screenshots}`);
    console.log(`Parallel: ${this.config.parallel}`);
    console.log('');

    await this.ensureDirectories();

    try {
      switch (this.config.mode) {
        case 'functional':
          await this.runFunctionalTests();
          break;
        case 'performance':
          await this.runPerformanceTests();
          break;
        case 'all':
          if (this.config.parallel) {
            await this.runTestsParallel();
          } else {
            await this.runTestsSequential();
          }
          break;
        default:
          throw new Error(`Unknown test mode: ${this.config.mode}`);
      }

      await this.generateCombinedReport();
      this.printFinalSummary();

    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
      process.exit(1);
    }
  }

  async ensureDirectories() {
    const dirs = ['reports', 'screenshots'];
    for (const dir of dirs) {
      const dirPath = path.join(__dirname, dir);
      try {
        await fs.access(dirPath);
      } catch {
        await fs.mkdir(dirPath, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    }
  }

  async runFunctionalTests() {
    console.log('🧪 Running Functional Tests...\n');
    
    const tester = new UltimateChatbotTester();
    tester.config.headless = this.config.headless;
    tester.config.slowMo = this.config.slowMo;
    tester.config.timeout = this.config.timeout;
    tester.config.screenshots = this.config.screenshots;
    
    this.results.functional = await tester.runAllTests();
  }

  async runPerformanceTests() {
    console.log('📊 Running Performance Tests...\n');
    
    const tester = new PerformanceTester();
    this.results.performance = await tester.runPerformanceTests();
  }

  async runTestsParallel() {
    console.log('⚡ Running tests in parallel...\n');
    
    const functionalPromise = this.runFunctionalTests();
    const performancePromise = this.runPerformanceTests();
    
    await Promise.all([functionalPromise, performancePromise]);
  }

  async runTestsSequential() {
    console.log('📋 Running tests sequentially...\n');
    
    await this.runFunctionalTests();
    await this.runPerformanceTests();
  }

  async generateCombinedReport() {
    console.log('📊 Generating combined report...');
    
    this.results.endTime = Date.now();
    const totalDuration = this.results.endTime - this.results.startTime;
    
    const combinedReport = {
      metadata: {
        timestamp: new Date().toISOString(),
        duration: totalDuration,
        configuration: this.config
      },
      summary: this.generateSummary(),
      functional: this.results.functional,
      performance: this.results.performance,
      overall_recommendations: this.generateOverallRecommendations()
    };

    const reportFile = path.join(__dirname, 'reports', `combined-report-${Date.now()}.json`);
    await fs.writeFile(reportFile, JSON.stringify(combinedReport, null, 2));

    // Generate HTML report
    await this.generateHTMLCombinedReport(combinedReport);
    
    console.log(`✅ Combined report saved: ${reportFile}`);
  }

  generateSummary() {
    const summary = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      overallSuccessRate: '0%',
      criticalIssues: [],
      performanceIssues: []
    };

    if (this.results.functional) {
      summary.totalTests += this.results.functional.summary.totalTests;
      summary.passedTests += this.results.functional.summary.passed;
      summary.failedTests += this.results.functional.summary.failed;
    }

    if (this.results.performance) {
      const perfSummary = this.results.performance.summary;
      if (perfSummary.avgResponseTime > 5000) {
        summary.performanceIssues.push('Slow response time detected');
      }
      if (perfSummary.errorCount > 0) {
        summary.criticalIssues.push(`${perfSummary.errorCount} errors in performance tests`);
      }
    }

    if (summary.totalTests > 0) {
      summary.overallSuccessRate = `${((summary.passedTests / summary.totalTests) * 100).toFixed(2)}%`;
    }

    return summary;
  }

  generateOverallRecommendations() {
    const recommendations = [];
    
    if (this.results.functional?.recommendations) {
      recommendations.push(...this.results.functional.recommendations);
    }
    
    if (this.results.performance?.recommendations) {
      recommendations.push(...this.results.performance.recommendations);
    }

    // Add overall recommendations based on combined results
    if (this.results.functional && this.results.performance) {
      const funcSuccess = parseFloat(this.results.functional.summary.successRate);
      const hasPerformanceIssues = this.results.performance.summary.errorCount > 0;
      
      if (funcSuccess < 80) {
        recommendations.push('CRITICAL: Functional test success rate below 80% - immediate attention required');
      }
      
      if (hasPerformanceIssues) {
        recommendations.push('Performance issues detected - review server capacity and response optimization');
      }
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  async generateHTMLCombinedReport(report) {
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>IT-ERA Chatbot - Complete Test Report</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; border-radius: 12px; margin-bottom: 30px; }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
        .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
        .stat-value { font-size: 2.5em; font-weight: bold; color: #667eea; }
        .stat-label { color: #666; margin-top: 5px; }
        .section { background: white; padding: 30px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .section h2 { color: #333; margin-bottom: 20px; font-size: 1.8em; }
        .test-result { padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #ccc; }
        .passed { background: #d4edda; border-left-color: #28a745; }
        .failed { background: #f8d7da; border-left-color: #dc3545; }
        .warning { background: #fff3cd; border-left-color: #ffc107; }
        .recommendations { background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .recommendations h3 { color: #1976d2; margin-bottom: 15px; }
        .recommendations ul { padding-left: 20px; }
        .recommendations li { margin: 8px 0; }
        .performance-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 6px; }
        .metric-name { font-weight: bold; color: #495057; }
        .metric-value { font-size: 1.2em; color: #667eea; margin-top: 5px; }
        .footer { text-align: center; padding: 30px; color: #666; border-top: 1px solid #eee; margin-top: 40px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚀 IT-ERA Chatbot Complete Test Report</h1>
          <p>Comprehensive functional and performance testing results</p>
          <p><strong>Generated:</strong> ${report.metadata.timestamp}</p>
          <p><strong>Duration:</strong> ${(report.metadata.duration / 1000).toFixed(2)} seconds</p>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${report.summary.totalTests}</div>
            <div class="stat-label">Total Tests</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #28a745;">${report.summary.passedTests}</div>
            <div class="stat-label">Passed</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #dc3545;">${report.summary.failedTests}</div>
            <div class="stat-label">Failed</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${report.summary.overallSuccessRate}</div>
            <div class="stat-label">Success Rate</div>
          </div>
        </div>

        ${report.functional ? `
        <div class="section">
          <h2>🧪 Functional Test Results</h2>
          <div class="performance-metrics">
            <div class="metric">
              <div class="metric-name">Chat Open Time</div>
              <div class="metric-value">${report.functional.performance.chatOpenTime}ms</div>
            </div>
            <div class="metric">
              <div class="metric-name">Message Response Time</div>
              <div class="metric-value">${report.functional.performance.messageResponseTime}ms</div>
            </div>
            <div class="metric">
              <div class="metric-name">Network Requests</div>
              <div class="metric-value">${report.functional.performance.networkRequests.length}</div>
            </div>
            <div class="metric">
              <div class="metric-name">Console Errors</div>
              <div class="metric-value">${report.functional.performance.consoleErrors.length}</div>
            </div>
          </div>
        </div>
        ` : ''}

        ${report.performance ? `
        <div class="section">
          <h2>📊 Performance Test Results</h2>
          <div class="performance-metrics">
            <div class="metric">
              <div class="metric-name">Average Load Time</div>
              <div class="metric-value">${report.performance.summary.avgLoadTime.toFixed(2)}ms</div>
            </div>
            <div class="metric">
              <div class="metric-name">Average Response Time</div>
              <div class="metric-value">${report.performance.summary.avgResponseTime.toFixed(2)}ms</div>
            </div>
            <div class="metric">
              <div class="metric-name">Max Memory Used</div>
              <div class="metric-value">${(report.performance.summary.maxMemoryUsed / 1024 / 1024).toFixed(2)}MB</div>
            </div>
            <div class="metric">
              <div class="metric-name">Total Network Requests</div>
              <div class="metric-value">${report.performance.summary.totalNetworkRequests}</div>
            </div>
          </div>
        </div>
        ` : ''}

        ${report.overall_recommendations.length > 0 ? `
        <div class="recommendations">
          <h3>💡 Overall Recommendations</h3>
          <ul>
            ${report.overall_recommendations.map(rec => `<li>${rec}</li>`).join('')}
          </ul>
        </div>
        ` : ''}

        ${report.summary.criticalIssues.length > 0 ? `
        <div class="section">
          <h2>🚨 Critical Issues</h2>
          ${report.summary.criticalIssues.map(issue => `
            <div class="test-result failed">
              <strong>CRITICAL:</strong> ${issue}
            </div>
          `).join('')}
        </div>
        ` : ''}

        <div class="footer">
          <p>Generated by IT-ERA Chatbot Ultimate Test Suite</p>
          <p>For technical support, contact the QA Team</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const htmlFile = path.join(__dirname, 'reports', `combined-report-${Date.now()}.html`);
    await fs.writeFile(htmlFile, htmlContent);
    
    console.log(`✅ HTML report generated: ${htmlFile}`);
  }

  printFinalSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('🏁 IT-ERA CHATBOT TEST SUITE COMPLETED');
    console.log('='.repeat(60));
    
    const summary = this.generateSummary();
    console.log(`📊 Total Tests: ${summary.totalTests}`);
    console.log(`✅ Passed: ${summary.passedTests}`);
    console.log(`❌ Failed: ${summary.failedTests}`);
    console.log(`📈 Overall Success Rate: ${summary.overallSuccessRate}`);
    console.log(`⏱️ Total Duration: ${((this.results.endTime - this.results.startTime) / 1000).toFixed(2)}s`);
    
    if (summary.criticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES:');
      summary.criticalIssues.forEach(issue => console.log(`   • ${issue}`));
    }
    
    if (summary.performanceIssues.length > 0) {
      console.log('\n⚠️  PERFORMANCE ISSUES:');
      summary.performanceIssues.forEach(issue => console.log(`   • ${issue}`));
    }
    
    console.log('\n🎉 Test suite execution completed!');
    console.log('📋 Check the reports directory for detailed results');
    console.log('='.repeat(60));
  }
}

// Command line usage
if (require.main === module) {
  const runner = new TestRunner();
  runner.run().catch(error => {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = TestRunner;