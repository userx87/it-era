#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { runLighthouseAudit } = require('./lighthouse-audit.js');

const RESULTS_FILE = path.join(__dirname, 'validate-results.json');

async function runValidationSuite() {
  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    metrics: {
      performance: 0,
      seo: 0,
      accessibility: 0,
      best_practices: 0
    },
    status: 'RUNNING'
  };

  console.log('🚀 Starting DEVI Validation Suite...\n');

  try {
    // 1. Run Playwright E2E Navigation Tests
    console.log('📋 Running E2E Navigation Consistency Tests...');
    try {
      execSync('npx playwright test e2e-navigation-test.js --reporter=json', {
        cwd: __dirname,
        stdio: 'pipe',
        timeout: 120000
      });
      
      results.tests.push({
        name: 'nav-consistency',
        status: 'PASS',
        details: 'All navigation elements consistent across test pages'
      });
      console.log('✅ Navigation tests PASSED\n');
    } catch (error) {
      results.tests.push({
        name: 'nav-consistency',
        status: 'FAIL',
        details: `Navigation test failures: ${error.message}`
      });
      console.log('❌ Navigation tests FAILED\n');
    }

    // 2. Run GA4 Tracking Tests
    console.log('📊 Running GA4 & GTM Tracking Verification...');
    try {
      execSync('npx playwright test ga4-tracking-test.js --reporter=json', {
        cwd: __dirname,
        stdio: 'pipe',
        timeout: 90000
      });
      
      results.tests.push({
        name: 'ga4-tracking',
        status: 'PASS',
        evidence: 'GA4 tracking ID G-T5VWN9EH21 and GTM GTM-KPF3JZT verified'
      });
      console.log('✅ GA4 tracking tests PASSED\n');
    } catch (error) {
      results.tests.push({
        name: 'ga4-tracking',
        status: 'FAIL',
        evidence: `GA4 tracking failures: ${error.message}`
      });
      console.log('❌ GA4 tracking tests FAILED\n');
    }

    // 3. Run SEO Validation Tests
    console.log('🔍 Running SEO Validation Tests...');
    try {
      execSync('npx playwright test seo-validation-test.js --reporter=json', {
        cwd: __dirname,
        stdio: 'pipe',
        timeout: 120000
      });
      
      results.tests.push({
        name: 'sitemap-200',
        status: 'PASS',
        response: 'Sitemap.xml accessible with valid XML structure and URLs'
      });
      console.log('✅ SEO validation tests PASSED\n');
    } catch (error) {
      results.tests.push({
        name: 'sitemap-200',
        status: 'FAIL',
        response: `SEO validation failures: ${error.message}`
      });
      console.log('❌ SEO validation tests FAILED\n');
    }

    // 4. Run Lighthouse Performance Audits
    console.log('⚡ Running Lighthouse Performance Audits...');
    try {
      const lighthouseResults = await runLighthouseAudit();
      
      if (lighthouseResults.averageScores) {
        results.metrics = {
          performance: lighthouseResults.averageScores.performance,
          seo: lighthouseResults.averageScores.seo,
          accessibility: lighthouseResults.averageScores.accessibility,
          best_practices: lighthouseResults.averageScores.bestPractices
        };

        const reportLink = `./lighthouse-summary-${Date.now()}.json`;
        results.tests.push({
          name: 'lighthouse',
          scores: lighthouseResults.averageScores,
          report_link: reportLink,
          status: (lighthouseResults.averageScores.performance >= 85 && 
                   lighthouseResults.averageScores.seo >= 95) ? 'PASS' : 'FAIL'
        });
        console.log('✅ Lighthouse audits COMPLETED\n');
      } else {
        throw new Error('No valid Lighthouse results');
      }
    } catch (error) {
      results.tests.push({
        name: 'lighthouse',
        status: 'FAIL',
        details: `Lighthouse audit failures: ${error.message}`
      });
      console.log('❌ Lighthouse audits FAILED\n');
    }

    // Final status determination
    const passedTests = results.tests.filter(t => t.status === 'PASS').length;
    const totalTests = results.tests.length;
    
    results.status = passedTests === totalTests ? 'PASS' : 'PARTIAL';

    // Save results
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));

    // Generate summary
    console.log('🎯 DEVI VALIDATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Overall Status: ${results.status}`);
    console.log(`Tests Passed: ${passedTests}/${totalTests}`);
    console.log(`Performance Score: ${results.metrics.performance}`);
    console.log(`SEO Score: ${results.metrics.seo}`);
    console.log(`Accessibility Score: ${results.metrics.accessibility}`);
    console.log(`Best Practices Score: ${results.metrics.best_practices}`);
    console.log('='.repeat(50));

    results.tests.forEach(test => {
      const status = test.status === 'PASS' ? '✅' : '❌';
      console.log(`${status} ${test.name}: ${test.status}`);
    });

    return results;

  } catch (error) {
    console.error('❌ Fatal error in validation suite:', error);
    results.status = 'ERROR';
    results.error = error.message;
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
    return results;
  }
}

if (require.main === module) {
  runValidationSuite()
    .then(results => {
      process.exit(results.status === 'PASS' ? 0 : 1);
    })
    .catch(error => {
      console.error('Validation suite failed:', error);
      process.exit(1);
    });
}

module.exports = { runValidationSuite };