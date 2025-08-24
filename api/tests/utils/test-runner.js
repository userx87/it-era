#!/usr/bin/env node

/**
 * Automated Test Runner for IT-ERA Admin Panel
 * Orchestrates all test suites with comprehensive reporting
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class ITERATestRunner {
  constructor() {
    this.testResults = {
      timestamp: new Date().toISOString(),
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0
      },
      suites: {},
      coverage: null,
      performance: {},
      security: {
        vulnerabilities: [],
        issues: []
      }
    };
    
    this.config = {
      timeout: 300000, // 5 minutes total timeout
      parallel: true,
      coverage: true,
      generateReports: true,
      ciMode: process.env.CI === 'true'
    };
  }

  async run() {
    console.log('🚀 Starting IT-ERA Admin Panel Test Suite');
    console.log('=' .repeat(60));
    
    const startTime = Date.now();
    
    try {
      await this.setupEnvironment();
      await this.runTestSuites();
      await this.generateReports();
      
      const duration = Date.now() - startTime;
      this.testResults.summary.duration = duration;
      
      this.printSummary();
      
      // Exit with appropriate code
      const exitCode = this.testResults.summary.failed > 0 ? 1 : 0;
      process.exit(exitCode);
      
    } catch (error) {
      console.error('❌ Test runner failed:', error.message);
      process.exit(1);
    }
  }

  async setupEnvironment() {
    console.log('📋 Setting up test environment...');
    
    // Check if package.json exists
    const packagePath = path.join(__dirname, '../package.json');
    if (!fs.existsSync(packagePath)) {
      throw new Error('package.json not found. Run from tests directory.');
    }

    // Install dependencies if needed
    try {
      console.log('📦 Installing test dependencies...');
      execSync('npm install', { 
        cwd: path.dirname(packagePath),
        stdio: this.config.ciMode ? 'pipe' : 'inherit'
      });
    } catch (error) {
      console.warn('⚠️ Failed to install dependencies:', error.message);
    }

    // Verify test targets are accessible
    await this.verifyTestTargets();
  }

  async verifyTestTargets() {
    console.log('🔍 Verifying test targets...');
    
    const targets = [
      { name: 'Admin Panel', url: 'https://it-era.pages.dev/admin/' },
      { name: 'API', url: 'https://it-era-blog-api.bulltech.workers.dev' }
    ];

    for (const target of targets) {
      try {
        const response = await fetch(target.url, { method: 'HEAD' });
        console.log(`✅ ${target.name}: ${response.status === 200 ? 'Available' : response.status}`);
      } catch (error) {
        console.warn(`⚠️ ${target.name}: ${error.message}`);
      }
    }
  }

  async runTestSuites() {
    const suites = [
      {
        name: 'Authentication',
        pattern: 'unit/auth.test.js',
        priority: 1,
        timeout: 30000
      },
      {
        name: 'API Integration',
        pattern: 'integration/api-endpoints.test.js',
        priority: 2,
        timeout: 60000
      },
      {
        name: 'CRUD Operations',
        pattern: 'unit/crud-operations.test.js',
        priority: 2,
        timeout: 45000
      },
      {
        name: 'Form Validation',
        pattern: 'unit/form-validation.test.js',
        priority: 2,
        timeout: 30000
      },
      {
        name: 'User Roles & Permissions',
        pattern: 'unit/user-roles.test.js',
        priority: 2,
        timeout: 30000
      },
      {
        name: 'Security Tests',
        pattern: 'security/security-tests.test.js',
        priority: 3,
        timeout: 60000
      },
      {
        name: 'Error Handling',
        pattern: 'unit/error-handling.test.js',
        priority: 2,
        timeout: 45000
      },
      {
        name: 'E2E UI Tests',
        pattern: 'e2e/admin-panel.test.js',
        priority: 3,
        timeout: 120000
      },
      {
        name: 'Performance Benchmarks',
        pattern: 'performance/benchmarks.test.js',
        priority: 4,
        timeout: 180000
      }
    ];

    if (this.config.parallel) {
      await this.runSuitesInParallel(suites);
    } else {
      await this.runSuitesSequentially(suites);
    }
  }

  async runSuitesInParallel(suites) {
    console.log('🔄 Running test suites in parallel...');
    
    // Group by priority to avoid overwhelming system
    const priorityGroups = {};
    suites.forEach(suite => {
      if (!priorityGroups[suite.priority]) {
        priorityGroups[suite.priority] = [];
      }
      priorityGroups[suite.priority].push(suite);
    });

    // Run each priority group
    for (const [priority, groupSuites] of Object.entries(priorityGroups)) {
      console.log(`\n📊 Running Priority ${priority} tests...`);
      
      const promises = groupSuites.map(suite => this.runSingleSuite(suite));
      await Promise.all(promises);
    }
  }

  async runSuitesSequentially(suites) {
    console.log('📝 Running test suites sequentially...');
    
    // Sort by priority
    const sortedSuites = suites.sort((a, b) => a.priority - b.priority);
    
    for (const suite of sortedSuites) {
      await this.runSingleSuite(suite);
    }
  }

  async runSingleSuite(suite) {
    console.log(`\n🧪 Running ${suite.name} tests...`);
    
    const startTime = Date.now();
    
    try {
      const result = await this.executeJestCommand(suite);
      
      this.testResults.suites[suite.name] = {
        status: 'passed',
        duration: Date.now() - startTime,
        tests: result.tests || 0,
        passed: result.passed || 0,
        failed: result.failed || 0,
        output: result.output
      };

      this.testResults.summary.total += result.tests || 0;
      this.testResults.summary.passed += result.passed || 0;
      this.testResults.summary.failed += result.failed || 0;

      console.log(`✅ ${suite.name}: ${result.passed}/${result.tests} passed`);
      
    } catch (error) {
      console.log(`❌ ${suite.name}: Failed - ${error.message}`);
      
      this.testResults.suites[suite.name] = {
        status: 'failed',
        duration: Date.now() - startTime,
        error: error.message,
        output: error.output || ''
      };
      
      this.testResults.summary.failed += 1;
    }
  }

  async executeJestCommand(suite) {
    return new Promise((resolve, reject) => {
      const jestArgs = [
        '--testPathPattern=' + suite.pattern,
        '--json',
        '--testTimeout=' + suite.timeout,
        '--verbose'
      ];

      if (this.config.coverage && suite.name !== 'E2E UI Tests') {
        jestArgs.push('--coverage');
      }

      if (this.config.ciMode) {
        jestArgs.push('--ci', '--watchAll=false');
      }

      const jest = spawn('npx', ['jest', ...jestArgs], {
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe'
      });

      let output = '';
      let errorOutput = '';

      jest.stdout.on('data', (data) => {
        output += data.toString();
      });

      jest.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      jest.on('close', (code) => {
        try {
          // Parse Jest JSON output
          const lines = output.split('\n');
          const jsonLine = lines.find(line => line.trim().startsWith('{'));
          
          if (jsonLine) {
            const result = JSON.parse(jsonLine);
            
            resolve({
              tests: result.numTotalTests,
              passed: result.numPassedTests,
              failed: result.numFailedTests,
              output: output,
              code: code
            });
          } else {
            // Fallback parsing
            const passedMatch = output.match(/(\\d+) passing/);
            const failedMatch = output.match(/(\\d+) failing/);
            
            resolve({
              tests: (parseInt(passedMatch?.[1] || 0)) + (parseInt(failedMatch?.[1] || 0)),
              passed: parseInt(passedMatch?.[1] || 0),
              failed: parseInt(failedMatch?.[1] || 0),
              output: output,
              code: code
            });
          }
        } catch (parseError) {
          reject(new Error(`Failed to parse test results: ${parseError.message}\\n${output}\\n${errorOutput}`));
        }
      });

      jest.on('error', (error) => {
        reject(new Error(`Failed to run jest: ${error.message}`));
      });

      // Handle timeout
      setTimeout(() => {
        jest.kill();
        reject(new Error(`Test suite timed out after ${suite.timeout}ms`));
      }, suite.timeout);
    });
  }

  async generateReports() {
    if (!this.config.generateReports) return;

    console.log('\\n📊 Generating test reports...');
    
    const reportsDir = path.join(__dirname, '../reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Generate JSON report
    const jsonReport = path.join(reportsDir, 'test-results.json');
    fs.writeFileSync(jsonReport, JSON.stringify(this.testResults, null, 2));

    // Generate HTML report
    await this.generateHTMLReport();

    // Generate CI/CD report
    if (this.config.ciMode) {
      await this.generateCIReport();
    }

    console.log(`📄 Reports generated in: ${reportsDir}`);
  }

  async generateHTMLReport() {
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IT-ERA Admin Panel Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #0056cc, #17a2b8); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header .subtitle { opacity: 0.9; margin-top: 5px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; padding: 30px; }
        .stat-card { text-align: center; padding: 20px; border-radius: 8px; }
        .stat-card.passed { background: #d4edda; border: 2px solid #28a745; }
        .stat-card.failed { background: #f8d7da; border: 2px solid #dc3545; }
        .stat-card.total { background: #e2e3e5; border: 2px solid #6c757d; }
        .stat-card .number { font-size: 2.5em; font-weight: bold; margin-bottom: 10px; }
        .stat-card .label { font-size: 1.1em; color: #666; }
        .suites { padding: 0 30px 30px; }
        .suite { margin-bottom: 20px; border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden; }
        .suite-header { padding: 15px 20px; background: #f8f9fa; border-bottom: 1px solid #dee2e6; display: flex; justify-content: space-between; align-items: center; }
        .suite-name { font-weight: 600; font-size: 1.1em; }
        .suite-status { padding: 4px 12px; border-radius: 20px; color: white; font-size: 0.9em; }
        .suite-status.passed { background: #28a745; }
        .suite-status.failed { background: #dc3545; }
        .suite-details { padding: 20px; }
        .suite-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 15px; }
        .suite-stat { text-align: center; }
        .suite-stat .value { font-size: 1.5em; font-weight: bold; }
        .suite-stat .label { color: #666; font-size: 0.9em; }
        .footer { text-align: center; padding: 20px; color: #666; border-top: 1px solid #dee2e6; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>IT-ERA Admin Panel</h1>
            <div class="subtitle">Test Report - ${new Date(this.testResults.timestamp).toLocaleString()}</div>
        </div>
        
        <div class="summary">
            <div class="stat-card total">
                <div class="number">${this.testResults.summary.total}</div>
                <div class="label">Total Tests</div>
            </div>
            <div class="stat-card passed">
                <div class="number">${this.testResults.summary.passed}</div>
                <div class="label">Passed</div>
            </div>
            <div class="stat-card failed">
                <div class="number">${this.testResults.summary.failed}</div>
                <div class="label">Failed</div>
            </div>
            <div class="stat-card">
                <div class="number">${(this.testResults.summary.duration / 1000).toFixed(1)}s</div>
                <div class="label">Duration</div>
            </div>
        </div>

        <div class="suites">
            <h2>Test Suites</h2>
            ${Object.entries(this.testResults.suites).map(([name, suite]) => `
                <div class="suite">
                    <div class="suite-header">
                        <div class="suite-name">${name}</div>
                        <div class="suite-status ${suite.status}">${suite.status.toUpperCase()}</div>
                    </div>
                    <div class="suite-details">
                        <div class="suite-stats">
                            <div class="suite-stat">
                                <div class="value">${suite.tests || 'N/A'}</div>
                                <div class="label">Tests</div>
                            </div>
                            <div class="suite-stat">
                                <div class="value">${suite.passed || 0}</div>
                                <div class="label">Passed</div>
                            </div>
                            <div class="suite-stat">
                                <div class="value">${suite.failed || 0}</div>
                                <div class="label">Failed</div>
                            </div>
                            <div class="suite-stat">
                                <div class="value">${((suite.duration || 0) / 1000).toFixed(1)}s</div>
                                <div class="label">Duration</div>
                            </div>
                        </div>
                        ${suite.error ? `<div style="color: #dc3545; font-family: monospace; background: #f8f9fa; padding: 10px; border-radius: 4px;">${suite.error}</div>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="footer">
            <p>Generated by IT-ERA Test Runner • ${new Date().toISOString()}</p>
        </div>
    </div>
</body>
</html>`;

    const htmlPath = path.join(__dirname, '../reports/test-report.html');
    fs.writeFileSync(htmlPath, htmlTemplate);
  }

  async generateCIReport() {
    // Generate JUnit XML format for CI/CD systems
    const junitTemplate = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="IT-ERA Admin Panel Tests" tests="${this.testResults.summary.total}" failures="${this.testResults.summary.failed}" time="${(this.testResults.summary.duration / 1000).toFixed(3)}">
${Object.entries(this.testResults.suites).map(([name, suite]) => `
  <testsuite name="${name}" tests="${suite.tests || 1}" failures="${suite.failed || (suite.status === 'failed' ? 1 : 0)}" time="${((suite.duration || 0) / 1000).toFixed(3)}">
    ${suite.status === 'failed' ? `<testcase name="${name}" classname="IT-ERA"><failure>${suite.error || 'Test suite failed'}</failure></testcase>` : `<testcase name="${name}" classname="IT-ERA"/>`}
  </testsuite>`).join('')}
</testsuites>`;

    const junitPath = path.join(__dirname, '../reports/junit.xml');
    fs.writeFileSync(junitPath, junitTemplate);
  }

  printSummary() {
    console.log('\\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    
    const { summary } = this.testResults;
    const successRate = summary.total > 0 ? ((summary.passed / summary.total) * 100).toFixed(1) : 0;
    
    console.log(`🧪 Total Tests:    ${summary.total}`);
    console.log(`✅ Passed:        ${summary.passed}`);
    console.log(`❌ Failed:        ${summary.failed}`);
    console.log(`⏱️  Duration:      ${(summary.duration / 1000).toFixed(1)}s`);
    console.log(`📈 Success Rate:  ${successRate}%`);
    
    console.log('\\n📋 Suite Results:');
    Object.entries(this.testResults.suites).forEach(([name, suite]) => {
      const status = suite.status === 'passed' ? '✅' : '❌';
      const duration = ((suite.duration || 0) / 1000).toFixed(1);
      console.log(`${status} ${name}: ${duration}s`);
    });
    
    console.log('\\n' + '='.repeat(60));
    
    if (summary.failed === 0) {
      console.log('🎉 All tests passed! IT-ERA Admin Panel is ready for production.');
    } else {
      console.log(`⚠️  ${summary.failed} test(s) failed. Please review the issues above.`);
    }
    
    console.log('='.repeat(60));
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const runner = new ITERATestRunner();
  
  // Parse command line arguments
  args.forEach(arg => {
    switch (arg) {
      case '--sequential':
        runner.config.parallel = false;
        break;
      case '--no-coverage':
        runner.config.coverage = false;
        break;
      case '--no-reports':
        runner.config.generateReports = false;
        break;
      case '--ci':
        runner.config.ciMode = true;
        break;
      case '--help':
        console.log(`
IT-ERA Admin Panel Test Runner

Usage: node test-runner.js [options]

Options:
  --sequential    Run tests sequentially instead of in parallel
  --no-coverage   Skip code coverage collection
  --no-reports    Skip report generation
  --ci            Run in CI mode (machine-readable output)
  --help          Show this help message

Examples:
  node test-runner.js                    # Run all tests with default settings
  node test-runner.js --sequential       # Run tests one by one
  node test-runner.js --ci --no-reports  # CI mode without HTML reports
        `);
        process.exit(0);
    }
  });
  
  runner.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = ITERATestRunner;