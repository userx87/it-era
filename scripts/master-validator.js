#!/usr/bin/env node
/**
 * Master QA Validator - IT-ERA Production
 * Orchestrates all validation tests in parallel
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class MasterValidator {
  constructor() {
    this.startTime = Date.now();
    this.results = {
      tests: [],
      metrics: {
        all_tests_pass: true,
        critical_issues: 0,
        warnings: 0,
        qa_score: '100%',
        execution_time: 0
      },
      summary: {}
    };
  }

  async validateSitemapRobots() {
    console.log('🗺️ Testing sitemap.xml and robots.txt...');
    
    try {
      const sitemapTest = await this.testUrl('https://it-era.it/sitemap.xml');
      const robotsTest = await this.testUrl('https://it-era.it/robots.txt');
      
      this.results.tests.push({
        name: 'sitemap-200',
        status: sitemapTest.status === 200 ? 'PASS' : 'FAIL',
        response: sitemapTest
      });

      this.results.tests.push({
        name: 'robots-200',
        status: robotsTest.status === 200 ? 'PASS' : 'FAIL',
        content: robotsTest
      });

      if (sitemapTest.status !== 200 || robotsTest.status !== 200) {
        this.results.metrics.critical_issues++;
        this.results.metrics.all_tests_pass = false;
      }

    } catch (error) {
      console.error('❌ Sitemap/Robots validation failed:', error.message);
      this.results.metrics.critical_issues += 2;
      this.results.metrics.all_tests_pass = false;
    }
  }

  async testUrl(url) {
    const { spawn } = require('child_process');
    
    return new Promise((resolve) => {
      const curl = spawn('curl', ['-I', '-s', '-w', '%{http_code}', url]);
      let output = '';
      
      curl.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      curl.on('close', (code) => {
        const lines = output.split('\n');
        const statusMatch = output.match(/HTTP\/\d\.\d (\d{3})/);
        const status = statusMatch ? parseInt(statusMatch[1]) : 0;
        
        resolve({
          status,
          headers: lines.slice(0, 10),
          curl_exit_code: code
        });
      });
    });
  }

  async runPlaywrightValidation() {
    console.log('🎭 Running Playwright validation...');
    
    try {
      const { stdout, stderr } = await execAsync('node scripts/playwright-validator.js');
      const playwrightResults = JSON.parse(fs.readFileSync('reports/data/playwright-results.json', 'utf8'));
      
      // Integrate Playwright results
      this.results.tests.push(...playwrightResults.tests);
      
      if (!playwrightResults.metrics.all_tests_pass) {
        this.results.metrics.all_tests_pass = false;
        this.results.metrics.critical_issues++;
      }

      this.results.summary.playwright = {
        navigation_consistency: playwrightResults.metrics.navigation_consistency,
        console_errors: playwrightResults.metrics.console_errors_found,
        pages_tested: playwrightResults.metrics.total_pages_tested
      };

    } catch (error) {
      console.error('❌ Playwright validation failed:', error.message);
      this.results.tests.push({
        name: 'playwright-suite',
        status: 'FAIL',
        error: error.message
      });
      this.results.metrics.critical_issues++;
      this.results.metrics.all_tests_pass = false;
    }
  }

  async runQAPuppeteerValidation() {
    console.log('🔍 Running QA Puppeteer validation...');
    
    try {
      const { stdout, stderr } = await execAsync('node scripts/qa-puppeteer.js');
      const qaResults = JSON.parse(fs.readFileSync('reports/qa.json', 'utf8'));
      
      // Integrate QA results
      this.results.tests.push({
        name: 'qa-puppeteer',
        status: qaResults.metrics.all_tests_pass ? 'PASS' : 'FAIL',
        checks: qaResults.tests.map(test => ({
          page: test.url,
          checks: test.checks,
          status: test.status
        }))
      });

      if (!qaResults.metrics.all_tests_pass) {
        this.results.metrics.all_tests_pass = false;
        this.results.metrics.critical_issues += qaResults.metrics.critical_issues;
      }

      this.results.metrics.warnings += qaResults.metrics.warnings;

      this.results.summary.qa = {
        qa_score: qaResults.metrics.qa_score,
        critical_issues: qaResults.metrics.critical_issues,
        warnings: qaResults.metrics.warnings
      };

    } catch (error) {
      console.error('❌ QA Puppeteer validation failed:', error.message);
      this.results.tests.push({
        name: 'qa-puppeteer',
        status: 'FAIL',
        error: error.message
      });
      this.results.metrics.critical_issues++;
      this.results.metrics.all_tests_pass = false;
    }
  }

  async runLighthouseValidation() {
    console.log('🔍 Running Lighthouse validation...');
    
    try {
      const { stdout, stderr } = await execAsync('node scripts/lighthouse-validator.js');
      const lighthouseResults = JSON.parse(fs.readFileSync('reports/data/lighthouse-summary.json', 'utf8'));
      
      // Integrate Lighthouse results
      this.results.tests.push(...lighthouseResults.tests);
      
      if (!lighthouseResults.metrics.all_tests_pass) {
        this.results.metrics.all_tests_pass = false;
        this.results.metrics.critical_issues++;
      }

      this.results.summary.lighthouse = lighthouseResults.metrics.average_scores;

    } catch (error) {
      console.error('❌ Lighthouse validation failed:', error.message);
      this.results.tests.push({
        name: 'lighthouse',
        status: 'FAIL',
        error: error.message
      });
      this.results.metrics.critical_issues++;
      this.results.metrics.all_tests_pass = false;
    }
  }

  async runValidation() {
    console.log('🚀 Starting Master Validation Suite...');
    console.log('🎯 Target: https://it-era.it');
    console.log('📊 Testing: Navigation, GA4, SEO, Performance, QA Metrics');
    console.log('⏰ Starting at:', new Date().toISOString());

    try {
      // Run validations in parallel where possible
      await Promise.allSettled([
        this.validateSitemapRobots(),
        this.runPlaywrightValidation(),
        this.runQAPuppeteerValidation()
      ]);

      // Run Lighthouse separately (resource intensive)
      await this.runLighthouseValidation();

      // Calculate final metrics
      this.results.metrics.execution_time = Math.round((Date.now() - this.startTime) / 1000);
      
      const passedTests = this.results.tests.filter(t => t.status === 'PASS').length;
      const totalTests = this.results.tests.length;
      this.results.metrics.qa_score = `${Math.round((passedTests / totalTests) * 100)}%`;

      // Save final results
      const finalReportPath = path.join(process.cwd(), 'reports/validate.results.json');
      fs.writeFileSync(finalReportPath, JSON.stringify(this.results, null, 2));

      // Generate human-readable report
      this.generateSummaryReport();

      console.log('\n🏁 MASTER VALIDATION COMPLETE!');
      console.log('═══════════════════════════════════');
      console.log(`✅ Overall Status: ${this.results.metrics.all_tests_pass ? 'PASS' : 'FAIL'}`);
      console.log(`📊 QA Score: ${this.results.metrics.qa_score}`);
      console.log(`🚨 Critical Issues: ${this.results.metrics.critical_issues}`);
      console.log(`⚠️  Warnings: ${this.results.metrics.warnings}`);
      console.log(`⏱️  Execution Time: ${this.results.metrics.execution_time}s`);
      console.log(`📋 Tests Run: ${this.results.tests.length}`);
      console.log('═══════════════════════════════════');

      return this.results;

    } catch (error) {
      console.error('❌ Master validation failed:', error);
      this.results.metrics.all_tests_pass = false;
      this.results.metrics.critical_issues++;
      
      const errorReportPath = path.join(process.cwd(), 'reports/validation-error.json');
      fs.writeFileSync(errorReportPath, JSON.stringify({
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }, null, 2));

      throw error;
    }
  }

  generateSummaryReport() {
    const reportLines = [
      '# IT-ERA Production Validation Report',
      `Generated: ${new Date().toISOString()}`,
      `Target: https://it-era.it`,
      '',
      '## Summary',
      `- **Overall Status**: ${this.results.metrics.all_tests_pass ? '✅ PASS' : '❌ FAIL'}`,
      `- **QA Score**: ${this.results.metrics.qa_score}`,
      `- **Critical Issues**: ${this.results.metrics.critical_issues}`,
      `- **Warnings**: ${this.results.metrics.warnings}`,
      `- **Execution Time**: ${this.results.metrics.execution_time} seconds`,
      '',
      '## Test Results',
      ...this.results.tests.map(test => 
        `- **${test.name}**: ${test.status === 'PASS' ? '✅' : '❌'} ${test.status}`
      ),
      ''
    ];

    if (this.results.summary.lighthouse) {
      reportLines.push(
        '## Lighthouse Scores',
        `- Performance: ${this.results.summary.lighthouse.performance}/100`,
        `- SEO: ${this.results.summary.lighthouse.seo}/100`,
        `- Accessibility: ${this.results.summary.lighthouse.accessibility}/100`,
        `- Best Practices: ${this.results.summary.lighthouse.bestPractices}/100`,
        ''
      );
    }

    const reportPath = path.join(process.cwd(), 'reports/validation-summary.md');
    fs.writeFileSync(reportPath, reportLines.join('\n'));
    
    console.log(`📄 Summary report saved: ${reportPath}`);
  }
}

// Run if called directly
if (require.main === module) {
  const validator = new MasterValidator();
  validator.runValidation()
    .then(results => {
      process.exit(results.metrics.all_tests_pass ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Fatal error in master validation:', error);
      process.exit(1);
    });
}

module.exports = MasterValidator;