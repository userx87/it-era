#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const TestReportGenerator = require('./generate-report');

class TestRunner {
  constructor() {
    this.testSuites = [
      { name: 'UI Responsiveness', file: 'ui-responsiveness.test.js', timeout: 60000 },
      { name: 'Chatbot Interface', file: 'chatbot-interface.test.js', timeout: 90000 },
      { name: 'Admin Panel', file: 'admin-panel.test.js', timeout: 60000 },
      { name: 'Interaction Flow', file: 'interaction-flow.test.js', timeout: 120000 },
      { name: 'Performance UI', file: 'performance-ui.test.js', timeout: 180000 },
      { name: 'Accessibility', file: 'accessibility.test.js', timeout: 90000 }
    ];
    
    this.results = {
      startTime: new Date(),
      endTime: null,
      totalDuration: 0,
      suiteResults: [],
      summary: {
        total: this.testSuites.length,
        passed: 0,
        failed: 0,
        skipped: 0
      }
    };
  }
  
  async runAllTests() {
    console.log('🚀 Starting comprehensive IT-ERA Chatbot UI Testing Suite\\n');
    console.log('📋 Test Plan:');
    this.testSuites.forEach((suite, index) => {
      console.log(`   ${index + 1}. ${suite.name} (${suite.file})`);
    });
    console.log('\\n' + '='.repeat(60) + '\\n');
    
    // Ensure dependencies are installed
    await this.checkDependencies();
    
    // Run each test suite
    for (let i = 0; i < this.testSuites.length; i++) {
      const suite = this.testSuites[i];
      console.log(`\\n🧪 Running Test Suite ${i + 1}/${this.testSuites.length}: ${suite.name}`);
      console.log('⏱️  Timeout:', suite.timeout / 1000, 'seconds');
      
      const suiteResult = await this.runTestSuite(suite);
      this.results.suiteResults.push(suiteResult);
      
      if (suiteResult.status === 'passed') {
        this.results.summary.passed++;
        console.log('✅', suite.name, 'completed successfully');
      } else if (suiteResult.status === 'failed') {
        this.results.summary.failed++;
        console.log('❌', suite.name, 'failed with errors');
      } else {
        this.results.summary.skipped++;
        console.log('⏭️', suite.name, 'was skipped');
      }
      
      console.log('   Duration:', suiteResult.duration, 'ms');
      
      // Brief pause between test suites
      await this.sleep(2000);
    }
    
    this.results.endTime = new Date();
    this.results.totalDuration = this.results.endTime - this.results.startTime;
    
    // Generate final report
    await this.generateFinalReport();
    
    // Display summary
    this.displaySummary();
    
    return this.results;
  }
  
  async runTestSuite(suite) {
    const startTime = Date.now();
    const result = {
      name: suite.name,
      file: suite.file,
      status: 'unknown',
      duration: 0,
      output: '',
      errors: [],
      startTime: new Date(startTime),
      endTime: null
    };
    
    try {
      const output = await this.executeJestTest(suite.file, suite.timeout);
      result.output = output;
      result.status = output.includes('FAIL') ? 'failed' : 'passed';
      
      // Extract specific metrics if available
      if (output.includes('Tests:')) {
        const testMatch = output.match(/Tests:\\s+(\\d+)\\s+passed/);
        if (testMatch) {
          result.testsPassed = parseInt(testMatch[1]);
        }
      }
      
    } catch (error) {
      result.status = 'failed';
      result.errors.push(error.message);
      console.error(`\\n❌ Error in ${suite.name}:`, error.message);
    }
    
    result.endTime = new Date();
    result.duration = Date.now() - startTime;
    
    return result;
  }
  
  executeJestTest(testFile, timeout) {
    return new Promise((resolve, reject) => {
      const jestProcess = spawn('npx', ['jest', testFile, '--verbose', '--testTimeout=' + timeout], {
        cwd: __dirname,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';
      
      jestProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        // Real-time output for user feedback
        process.stdout.write(output);
      });
      
      jestProcess.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        process.stderr.write(output);
      });
      
      jestProcess.on('close', (code) => {
        const fullOutput = stdout + stderr;
        
        if (code === 0 || fullOutput.includes('passed')) {
          resolve(fullOutput);
        } else {
          reject(new Error(`Jest exited with code ${code}\\n${fullOutput}`));
        }
      });
      
      jestProcess.on('error', (error) => {
        reject(new Error(`Failed to start Jest: ${error.message}`));
      });
      
      // Timeout handling
      setTimeout(() => {
        jestProcess.kill('SIGTERM');
        reject(new Error(`Test suite timed out after ${timeout}ms`));
      }, timeout + 10000); // Add buffer to Jest's internal timeout
    });
  }
  
  async checkDependencies() {
    console.log('📦 Checking dependencies...');
    
    const packageJsonPath = path.join(__dirname, 'package.json');
    if (!await fs.pathExists(packageJsonPath)) {
      console.log('⚠️  package.json not found, attempting to install dependencies...');
      await this.installDependencies();
    }
    
    // Check for required binaries
    const requiredBinaries = ['node', 'npm'];
    for (const binary of requiredBinaries) {
      try {
        await this.executeCommand('which', [binary]);
        console.log(`✅ ${binary} is available`);
      } catch (error) {
        throw new Error(`Required binary ${binary} not found`);
      }
    }
    
    console.log('✅ Dependencies check completed\\n');
  }
  
  async installDependencies() {
    console.log('📥 Installing dependencies...');
    
    try {
      await this.executeCommand('npm', ['install'], { cwd: __dirname });
      console.log('✅ Dependencies installed successfully');
    } catch (error) {
      throw new Error(`Failed to install dependencies: ${error.message}`);
    }
  }
  
  executeCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, { ...options, stdio: 'pipe' });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => stdout += data.toString());
      child.stderr.on('data', (data) => stderr += data.toString());
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });
      
      child.on('error', reject);
    });
  }
  
  async generateFinalReport() {
    console.log('\\n📊 Generating comprehensive test report...');
    
    try {
      // Save test execution results
      const resultsPath = path.join(__dirname, 'reports', 'test-execution-results.json');
      await fs.ensureDir(path.dirname(resultsPath));
      await fs.writeJson(resultsPath, this.results, { spaces: 2 });
      
      // Generate comprehensive report
      const reportGenerator = new TestReportGenerator();
      await reportGenerator.generateComprehensiveReport();
      
      console.log('✅ Report generation completed');
      
    } catch (error) {
      console.error('⚠️  Report generation failed:', error.message);
    }
  }
  
  displaySummary() {
    console.log('\\n' + '='.repeat(60));
    console.log('📋 TEST EXECUTION SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`\\n🕐 Execution Time:`);
    console.log(`   Started:  ${this.results.startTime.toLocaleString()}`);
    console.log(`   Finished: ${this.results.endTime.toLocaleString()}`);
    console.log(`   Duration: ${Math.round(this.results.totalDuration / 1000)}s (${Math.round(this.results.totalDuration / 60000)}m)`);
    
    console.log(`\\n📊 Results Summary:`);
    console.log(`   Total Suites: ${this.results.summary.total}`);
    console.log(`   ✅ Passed:    ${this.results.summary.passed}`);
    console.log(`   ❌ Failed:    ${this.results.summary.failed}`);
    console.log(`   ⏭️  Skipped:   ${this.results.summary.skipped}`);
    
    const successRate = Math.round((this.results.summary.passed / this.results.summary.total) * 100);
    console.log(`   🎯 Success Rate: ${successRate}%`);
    
    console.log(`\\n🔍 Suite Details:`);
    this.results.suiteResults.forEach((suite, index) => {
      const statusIcon = suite.status === 'passed' ? '✅' : suite.status === 'failed' ? '❌' : '⏭️';
      const duration = Math.round(suite.duration / 1000);
      console.log(`   ${statusIcon} ${suite.name}: ${suite.status.toUpperCase()} (${duration}s)`);
      
      if (suite.errors.length > 0) {
        suite.errors.forEach(error => {
          console.log(`      ⚠️  ${error}`);
        });
      }
    });
    
    console.log(`\\n📁 Reports Generated:`);
    console.log(`   📄 HTML Report: final-reports/comprehensive-ui-test-report.html`);
    console.log(`   📋 Summary: final-reports/TEST-SUMMARY.md`);
    console.log(`   📊 Data: final-reports/test-results-data.json`);
    console.log(`   📸 Screenshots: screenshots/`);
    
    if (this.results.summary.failed > 0) {
      console.log(`\\n🚨 ATTENTION REQUIRED:`);
      console.log(`   ${this.results.summary.failed} test suite(s) failed and need investigation`);
      console.log(`   Check the detailed reports for specific issues and recommendations`);
      
      // Set exit code for CI/CD pipelines
      process.exitCode = 1;
    } else {
      console.log(`\\n🎉 ALL TEST SUITES PASSED!`);
      console.log(`   The IT-ERA Chatbot UI is ready for production deployment`);
    }
    
    console.log('\\n' + '='.repeat(60));
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI execution
if (require.main === module) {
  const runner = new TestRunner();
  
  // Handle process interruption
  process.on('SIGINT', () => {
    console.log('\\n\\n⚠️  Test execution interrupted by user');
    console.log('📊 Generating partial report...');
    runner.generateFinalReport().then(() => {
      process.exit(130);
    });
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('\\n💥 Uncaught Exception:', error.message);
    console.error(error.stack);
    process.exit(1);
  });
  
  // Run all tests
  runner.runAllTests()
    .then((results) => {
      console.log('\\n🏁 Test execution completed successfully!');
    })
    .catch((error) => {
      console.error('\\n💥 Test execution failed:', error.message);
      console.error(error.stack);
      process.exit(1);
    });
}

module.exports = TestRunner;