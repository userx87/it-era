#!/usr/bin/env node

/**
 * IT-ERA AI Chatbot Integration Test Runner
 * Orchestrates all AI testing scenarios and generates comprehensive reports
 * Author: Testing Specialist
 * Date: 2025-08-24
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Test Runner Configuration
const TEST_RUNNER_CONFIG = {
  testEnvironment: process.env.NODE_ENV || 'development',
  apiEndpoint: process.env.CHATBOT_API_ENDPOINT || 'http://localhost:8788/api/chat',
  outputDir: './tests/reports',
  testTimeout: 300000, // 5 minutes per test suite
  parallel: process.env.TEST_PARALLEL === 'true',
  verbose: process.env.TEST_VERBOSE === 'true',
  
  testSuites: [
    {
      name: 'AI Integration Tests',
      file: './tests/ai/comprehensive-ai-chatbot-tests.js',
      priority: 1,
      timeout: 180000 // 3 minutes
    },
    {
      name: 'Performance Benchmarks',
      file: './tests/ai/performance-benchmark-tests.js', 
      priority: 2,
      timeout: 300000 // 5 minutes
    },
    {
      name: 'Comprehensive Chatbot Tests',
      file: './tests/chatbot/chatbot-comprehensive-tests.js',
      priority: 3,
      timeout: 120000 // 2 minutes
    },
    {
      name: 'Teams Integration Tests',
      file: './tests/chatbot/teams-integration-tests.js',
      priority: 4,
      timeout: 60000 // 1 minute
    }
  ],

  reportFormats: ['console', 'html', 'json'],
  
  successCriteria: {
    minPassRate: 80, // 80% tests must pass
    maxResponseTime: 10000, // 10s max response time
    minAISuccessRate: 95, // 95% AI calls must succeed
    maxCostPerConversation: 0.10 // $0.10 max cost per conversation
  }
};

class IntegrationTestRunner {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
    this.environment = {
      nodeVersion: process.version,
      testEnvironment: TEST_RUNNER_CONFIG.testEnvironment,
      apiEndpoint: TEST_RUNNER_CONFIG.apiEndpoint,
      timestamp: new Date().toISOString()
    };
  }

  async runAllTests() {
    console.log('🚀 IT-ERA AI CHATBOT INTEGRATION TEST RUNNER');
    console.log('=' .repeat(80));
    console.log(`Environment: ${this.environment.testEnvironment}`);
    console.log(`API Endpoint: ${this.environment.apiEndpoint}`);
    console.log(`Node Version: ${this.environment.nodeVersion}`);
    console.log(`Timestamp: ${this.environment.timestamp}`);
    console.log('=' .repeat(80));

    try {
      // Create output directory
      await this.ensureOutputDirectory();
      
      // Pre-flight checks
      await this.runPreflightChecks();

      // Run test suites
      if (TEST_RUNNER_CONFIG.parallel) {
        await this.runTestSuitesParallel();
      } else {
        await this.runTestSuitesSequential();
      }

      // Generate comprehensive report
      await this.generateComprehensiveReport();

      // Evaluate overall success
      const overallSuccess = this.evaluateOverallSuccess();
      
      console.log('\n🏁 TEST RUNNER COMPLETE');
      console.log(`Overall Result: ${overallSuccess ? '✅ SUCCESS' : '❌ FAILURE'}`);
      
      process.exit(overallSuccess ? 0 : 1);

    } catch (error) {
      console.error('❌ Test runner failed:', error);
      process.exit(1);
    }
  }

  async ensureOutputDirectory() {
    const outputDir = TEST_RUNNER_CONFIG.outputDir;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`📁 Created output directory: ${outputDir}`);
    }
  }

  async runPreflightChecks() {
    console.log('\n🔍 PREFLIGHT CHECKS');
    console.log('-' .repeat(40));

    // Check API availability
    await this.checkAPIAvailability();
    
    // Check test files exist
    await this.checkTestFilesExist();
    
    // Check environment variables
    await this.checkEnvironmentVariables();

    console.log('✅ Preflight checks completed\n');
  }

  async checkAPIAvailability() {
    console.log('   Checking API availability...');
    
    try {
      const response = await fetch(TEST_RUNNER_CONFIG.apiEndpoint.replace('/api/chat', '/health'));
      
      if (response.ok) {
        const healthData = await response.json();
        console.log(`   ✅ API is available: ${healthData.status}`);
      } else {
        throw new Error(`API returned status ${response.status}`);
      }
    } catch (error) {
      console.log(`   ⚠️  API not available: ${error.message}`);
      console.log('   📝 Tests will run but may fail if API is down');
    }
  }

  async checkTestFilesExist() {
    console.log('   Checking test files...');
    
    for (const suite of TEST_RUNNER_CONFIG.testSuites) {
      if (fs.existsSync(suite.file)) {
        console.log(`   ✅ ${suite.name}: ${suite.file}`);
      } else {
        console.log(`   ❌ ${suite.name}: ${suite.file} not found`);
      }
    }
  }

  async checkEnvironmentVariables() {
    console.log('   Checking environment variables...');
    
    const requiredEnvVars = ['NODE_ENV'];
    const optionalEnvVars = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'TEAMS_WEBHOOK_URL'];
    
    requiredEnvVars.forEach(envVar => {
      if (process.env[envVar]) {
        console.log(`   ✅ ${envVar}: set`);
      } else {
        console.log(`   ⚠️  ${envVar}: not set (required)`);
      }
    });

    optionalEnvVars.forEach(envVar => {
      if (process.env[envVar]) {
        console.log(`   ✅ ${envVar}: set`);
      } else {
        console.log(`   💡 ${envVar}: not set (optional)`);
      }
    });
  }

  async runTestSuitesSequential() {
    console.log('\n🔄 RUNNING TEST SUITES (SEQUENTIAL)');
    console.log('-' .repeat(40));

    // Sort by priority
    const sortedSuites = TEST_RUNNER_CONFIG.testSuites.sort((a, b) => a.priority - b.priority);

    for (const suite of sortedSuites) {
      await this.runTestSuite(suite);
    }
  }

  async runTestSuitesParallel() {
    console.log('\n🔄 RUNNING TEST SUITES (PARALLEL)');
    console.log('-' .repeat(40));

    const promises = TEST_RUNNER_CONFIG.testSuites.map(suite => 
      this.runTestSuite(suite)
    );

    await Promise.all(promises);
  }

  async runTestSuite(suite) {
    console.log(`\n📋 ${suite.name.toUpperCase()}`);
    console.log(`   File: ${suite.file}`);
    console.log(`   Timeout: ${suite.timeout / 1000}s`);
    
    const startTime = Date.now();
    
    try {
      const result = await this.executeTestFile(suite);
      const duration = Date.now() - startTime;
      
      const testResult = {
        suite: suite.name,
        file: suite.file,
        success: result.success,
        duration,
        output: result.output,
        error: result.error,
        metrics: result.metrics || {},
        timestamp: new Date().toISOString()
      };

      this.results.push(testResult);

      if (result.success) {
        console.log(`   ✅ ${suite.name} PASSED (${duration}ms)`);
      } else {
        console.log(`   ❌ ${suite.name} FAILED (${duration}ms)`);
        if (result.error) {
          console.log(`   Error: ${result.error}`);
        }
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.log(`   ❌ ${suite.name} CRASHED (${duration}ms)`);
      console.log(`   Error: ${error.message}`);
      
      this.results.push({
        suite: suite.name,
        file: suite.file,
        success: false,
        duration,
        error: error.message,
        crashed: true,
        timestamp: new Date().toISOString()
      });
    }
  }

  async executeTestFile(suite) {
    return new Promise((resolve, reject) => {
      const testProcess = spawn('node', [suite.file], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: suite.timeout
      });

      let output = '';
      let error = '';

      testProcess.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        if (TEST_RUNNER_CONFIG.verbose) {
          process.stdout.write(`   [${suite.name}] ${text}`);
        }
      });

      testProcess.stderr.on('data', (data) => {
        const text = data.toString();
        error += text;
        if (TEST_RUNNER_CONFIG.verbose) {
          process.stderr.write(`   [${suite.name}] ${text}`);
        }
      });

      testProcess.on('close', (code) => {
        const success = code === 0;
        
        // Try to extract metrics from output
        const metrics = this.extractMetricsFromOutput(output);
        
        resolve({
          success,
          output,
          error: error || (success ? null : 'Test suite failed'),
          metrics,
          exitCode: code
        });
      });

      testProcess.on('error', (err) => {
        reject(new Error(`Failed to start test process: ${err.message}`));
      });

      // Handle timeout
      setTimeout(() => {
        if (!testProcess.killed) {
          testProcess.kill('SIGKILL');
          reject(new Error(`Test suite timed out after ${suite.timeout / 1000}s`));
        }
      }, suite.timeout);
    });
  }

  extractMetricsFromOutput(output) {
    const metrics = {};
    
    // Extract common metrics patterns
    const patterns = {
      successRate: /Success Rate: ([\d.]+)%/i,
      responseTime: /Average Response Time: ([\d.]+)ms/i,
      aiSuccessRate: /AI Success Rate: ([\d.]+)%/i,
      totalTests: /Total Tests: (\d+)/i,
      passedTests: /Passed: (\d+)/i,
      failedTests: /Failed: (\d+)/i
    };

    Object.entries(patterns).forEach(([key, pattern]) => {
      const match = output.match(pattern);
      if (match) {
        metrics[key] = parseFloat(match[1]) || 0;
      }
    });

    return metrics;
  }

  async generateComprehensiveReport() {
    console.log('\n📊 GENERATING COMPREHENSIVE REPORT');
    console.log('-' .repeat(40));

    const report = this.buildReport();
    
    // Generate different report formats
    for (const format of TEST_RUNNER_CONFIG.reportFormats) {
      await this.generateReportFormat(report, format);
    }

    console.log('✅ Report generation completed\n');
  }

  buildReport() {
    const totalDuration = Date.now() - this.startTime;
    const successfulSuites = this.results.filter(r => r.success).length;
    const failedSuites = this.results.length - successfulSuites;
    
    // Aggregate metrics
    const aggregatedMetrics = this.aggregateMetrics();
    
    return {
      summary: {
        totalSuites: this.results.length,
        successfulSuites,
        failedSuites,
        successRate: (successfulSuites / this.results.length) * 100,
        totalDuration,
        timestamp: new Date().toISOString()
      },
      environment: this.environment,
      results: this.results,
      metrics: aggregatedMetrics,
      analysis: this.analyzeResults(),
      recommendations: this.generateRecommendations()
    };
  }

  aggregateMetrics() {
    const allMetrics = this.results
      .map(r => r.metrics)
      .filter(m => m && Object.keys(m).length > 0);

    if (allMetrics.length === 0) return {};

    const aggregated = {};
    
    // Sum totals
    const sumMetrics = ['totalTests', 'passedTests', 'failedTests'];
    sumMetrics.forEach(metric => {
      aggregated[metric] = allMetrics.reduce((sum, m) => sum + (m[metric] || 0), 0);
    });

    // Average percentages and times
    const avgMetrics = ['successRate', 'responseTime', 'aiSuccessRate'];
    avgMetrics.forEach(metric => {
      const values = allMetrics.map(m => m[metric]).filter(v => v !== undefined);
      if (values.length > 0) {
        aggregated[metric] = values.reduce((sum, v) => sum + v, 0) / values.length;
      }
    });

    return aggregated;
  }

  analyzeResults() {
    const analysis = {
      criticalIssues: [],
      warnings: [],
      strengths: []
    };

    // Check success criteria
    if (this.results.some(r => !r.success)) {
      analysis.criticalIssues.push('One or more test suites failed');
    }

    const metrics = this.aggregateMetrics();
    
    if (metrics.successRate && metrics.successRate < TEST_RUNNER_CONFIG.successCriteria.minPassRate) {
      analysis.criticalIssues.push(`Success rate ${metrics.successRate.toFixed(1)}% below minimum ${TEST_RUNNER_CONFIG.successCriteria.minPassRate}%`);
    }

    if (metrics.responseTime && metrics.responseTime > TEST_RUNNER_CONFIG.successCriteria.maxResponseTime) {
      analysis.warnings.push(`Response time ${metrics.responseTime.toFixed(0)}ms above target ${TEST_RUNNER_CONFIG.successCriteria.maxResponseTime}ms`);
    }

    if (metrics.aiSuccessRate && metrics.aiSuccessRate >= TEST_RUNNER_CONFIG.successCriteria.minAISuccessRate) {
      analysis.strengths.push(`AI success rate ${metrics.aiSuccessRate.toFixed(1)}% meets target`);
    }

    // Analyze individual test results
    const performanceTest = this.results.find(r => r.suite.includes('Performance'));
    if (performanceTest && performanceTest.success) {
      analysis.strengths.push('Performance benchmarks passed');
    }

    const integrationTest = this.results.find(r => r.suite.includes('Integration'));
    if (integrationTest && integrationTest.success) {
      analysis.strengths.push('AI integration working correctly');
    }

    return analysis;
  }

  generateRecommendations() {
    const recommendations = [];
    const analysis = this.analyzeResults();

    if (analysis.criticalIssues.length === 0) {
      recommendations.push('🎉 All critical tests passed - system ready for production');
    } else {
      recommendations.push('🚨 Critical issues found - resolve before production deployment');
      analysis.criticalIssues.forEach(issue => {
        recommendations.push(`   • ${issue}`);
      });
    }

    if (analysis.warnings.length > 0) {
      recommendations.push('⚠️  Performance improvements recommended:');
      analysis.warnings.forEach(warning => {
        recommendations.push(`   • ${warning}`);
      });
    }

    // Specific technical recommendations
    const metrics = this.aggregateMetrics();
    
    if (metrics.responseTime && metrics.responseTime > 5000) {
      recommendations.push('🔧 Optimize response times by improving AI prompt efficiency');
    }

    if (metrics.aiSuccessRate && metrics.aiSuccessRate < 95) {
      recommendations.push('🧠 Improve AI reliability with better error handling and fallbacks');
    }

    const teamsTest = this.results.find(r => r.suite.includes('Teams'));
    if (teamsTest && !teamsTest.success) {
      recommendations.push('📧 Fix Teams webhook integration for proper escalation');
    }

    return recommendations;
  }

  async generateReportFormat(report, format) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    switch (format) {
      case 'console':
        this.generateConsoleReport(report);
        break;
        
      case 'html':
        const htmlPath = path.join(TEST_RUNNER_CONFIG.outputDir, `test-report-${timestamp}.html`);
        await this.generateHTMLReport(report, htmlPath);
        console.log(`   📄 HTML report: ${htmlPath}`);
        break;
        
      case 'json':
        const jsonPath = path.join(TEST_RUNNER_CONFIG.outputDir, `test-report-${timestamp}.json`);
        await this.generateJSONReport(report, jsonPath);
        console.log(`   📊 JSON report: ${jsonPath}`);
        break;
    }
  }

  generateConsoleReport(report) {
    console.log('📋 FINAL TEST REPORT');
    console.log('=' .repeat(80));
    
    console.log(`📊 SUMMARY`);
    console.log(`   Test Suites: ${report.summary.totalSuites}`);
    console.log(`   Successful: ${report.summary.successfulSuites} ✅`);
    console.log(`   Failed: ${report.summary.failedSuites} ❌`);
    console.log(`   Success Rate: ${report.summary.successRate.toFixed(1)}%`);
    console.log(`   Total Duration: ${(report.summary.totalDuration / 1000).toFixed(1)}s`);

    if (report.metrics && Object.keys(report.metrics).length > 0) {
      console.log(`\n⚡ AGGREGATED METRICS`);
      Object.entries(report.metrics).forEach(([key, value]) => {
        if (typeof value === 'number') {
          const formatted = key.includes('Rate') || key.includes('Percent') ? 
            `${value.toFixed(1)}%` : 
            (key.includes('Time') ? `${value.toFixed(0)}ms` : value.toString());
          console.log(`   ${key}: ${formatted}`);
        }
      });
    }

    console.log(`\n🔍 ANALYSIS`);
    if (report.analysis.criticalIssues.length > 0) {
      console.log(`   Critical Issues: ${report.analysis.criticalIssues.length}`);
      report.analysis.criticalIssues.forEach(issue => console.log(`   ❌ ${issue}`));
    }
    
    if (report.analysis.warnings.length > 0) {
      console.log(`   Warnings: ${report.analysis.warnings.length}`);
      report.analysis.warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
    }
    
    if (report.analysis.strengths.length > 0) {
      console.log(`   Strengths: ${report.analysis.strengths.length}`);
      report.analysis.strengths.forEach(strength => console.log(`   ✅ ${strength}`));
    }

    console.log(`\n📝 RECOMMENDATIONS`);
    report.recommendations.forEach(rec => console.log(rec));
  }

  async generateHTMLReport(report, filePath) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IT-ERA AI Chatbot Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: #f0f8ff; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: white; border: 1px solid #ddd; border-radius: 8px; padding: 15px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #2c5aa0; }
        .test-result { margin: 10px 0; padding: 15px; border-radius: 5px; }
        .success { background: #d4edda; border-left: 5px solid #28a745; }
        .failure { background: #f8d7da; border-left: 5px solid #dc3545; }
        .analysis { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .recommendations { background: #e3f2fd; border: 1px solid #81c784; border-radius: 8px; padding: 20px; }
        ul { margin: 0; padding-left: 20px; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 IT-ERA AI Chatbot Integration Test Report</h1>
        <p class="timestamp">Generated: ${report.summary.timestamp}</p>
        <p>Environment: ${report.environment.testEnvironment} | API: ${report.environment.apiEndpoint}</p>
    </div>

    <div class="summary">
        <div class="metric-card">
            <div class="metric-value">${report.summary.totalSuites}</div>
            <div>Test Suites</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${report.summary.successfulSuites}</div>
            <div>Successful</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${report.summary.failedSuites}</div>
            <div>Failed</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${report.summary.successRate.toFixed(1)}%</div>
            <div>Success Rate</div>
        </div>
    </div>

    <h2>📋 Test Results</h2>
    ${report.results.map(result => `
        <div class="test-result ${result.success ? 'success' : 'failure'}">
            <h3>${result.success ? '✅' : '❌'} ${result.suite}</h3>
            <p><strong>Duration:</strong> ${result.duration}ms</p>
            ${result.error ? `<p><strong>Error:</strong> ${result.error}</p>` : ''}
        </div>
    `).join('')}

    <div class="analysis">
        <h2>🔍 Analysis</h2>
        ${report.analysis.criticalIssues.length > 0 ? `
            <h3>❌ Critical Issues</h3>
            <ul>${report.analysis.criticalIssues.map(issue => `<li>${issue}</li>`).join('')}</ul>
        ` : ''}
        ${report.analysis.warnings.length > 0 ? `
            <h3>⚠️ Warnings</h3>
            <ul>${report.analysis.warnings.map(warning => `<li>${warning}</li>`).join('')}</ul>
        ` : ''}
        ${report.analysis.strengths.length > 0 ? `
            <h3>✅ Strengths</h3>
            <ul>${report.analysis.strengths.map(strength => `<li>${strength}</li>`).join('')}</ul>
        ` : ''}
    </div>

    <div class="recommendations">
        <h2>📝 Recommendations</h2>
        <ul>${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}</ul>
    </div>
</body>
</html>`;

    fs.writeFileSync(filePath, html);
  }

  async generateJSONReport(report, filePath) {
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
  }

  evaluateOverallSuccess() {
    const report = this.buildReport();
    
    // Check basic success criteria
    if (report.summary.failedSuites > 0) return false;
    if (report.summary.successRate < TEST_RUNNER_CONFIG.successCriteria.minPassRate) return false;
    if (report.analysis.criticalIssues.length > 0) return false;
    
    // Check metrics if available
    if (report.metrics.responseTime && report.metrics.responseTime > TEST_RUNNER_CONFIG.successCriteria.maxResponseTime) {
      return false;
    }
    
    if (report.metrics.aiSuccessRate && report.metrics.aiSuccessRate < TEST_RUNNER_CONFIG.successCriteria.minAISuccessRate) {
      return false;
    }
    
    return true;
  }
}

// Main execution
if (require.main === module) {
  const runner = new IntegrationTestRunner();
  runner.runAllTests().catch(error => {
    console.error('Test runner crashed:', error);
    process.exit(1);
  });
}

module.exports = { IntegrationTestRunner, TEST_RUNNER_CONFIG };