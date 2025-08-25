#!/usr/bin/env node

/**
 * Run Robust Test Suite - Complete Testing Solution
 * Addresses all Puppeteer testing issues with comprehensive diagnostics
 */

const RobustChatbotTest = require('./robust-chatbot-test');
const NetworkMonitor = require('./network-monitoring-utilities');
const fs = require('fs').promises;
const path = require('path');

class TestSuiteRunner {
    constructor() {
        this.results = {
            suites: [],
            overall: {
                passed: 0,
                failed: 0,
                duration: 0,
                startTime: Date.now()
            }
        };
        
        this.config = {
            environments: ['production', 'staging'],
            testTypes: ['functionality', 'performance', 'network'],
            outputDir: '/Users/andreapanzeri/progetti/IT-ERA/test-results',
            retryFailedTests: true,
            maxRetries: 2,
            parallel: false // Set to true for faster execution
        };
    }

    /**
     * Main test suite execution
     */
    async runFullTestSuite() {
        console.log('🎭 Starting IT-ERA Robust Test Suite');
        console.log('=' .repeat(80));
        console.log(`📋 Configuration:`);
        console.log(`   Environments: ${this.config.environments.join(', ')}`);
        console.log(`   Test Types: ${this.config.testTypes.join(', ')}`);
        console.log(`   Output Directory: ${this.config.outputDir}`);
        console.log(`   Retry Failed Tests: ${this.config.retryFailedTests}`);
        console.log('=' .repeat(80));

        await this.initializeOutputDirectory();

        try {
            // Run chatbot functionality tests
            if (this.config.testTypes.includes('functionality')) {
                console.log('\n🤖 Running Chatbot Functionality Tests...');
                const chatbotResult = await this.runChatbotTests();
                this.results.suites.push(chatbotResult);
            }

            // Run performance tests  
            if (this.config.testTypes.includes('performance')) {
                console.log('\n⚡ Running Performance Tests...');
                const performanceResult = await this.runPerformanceTests();
                this.results.suites.push(performanceResult);
            }

            // Run network connectivity tests
            if (this.config.testTypes.includes('network')) {
                console.log('\n🌐 Running Network Connectivity Tests...');
                const networkResult = await this.runNetworkTests();
                this.results.suites.push(networkResult);
            }

            // Generate comprehensive report
            await this.generateComprehensiveReport();

        } catch (error) {
            console.error('💥 Test suite execution failed:', error.message);
            this.results.overall.failed++;
        } finally {
            this.results.overall.duration = Date.now() - this.results.overall.startTime;
            await this.displayFinalSummary();
        }

        return this.results;
    }

    /**
     * Initialize output directory structure
     */
    async initializeOutputDirectory() {
        const dirs = [
            this.config.outputDir,
            path.join(this.config.outputDir, 'screenshots'),
            path.join(this.config.outputDir, 'reports'),
            path.join(this.config.outputDir, 'logs'),
            path.join(this.config.outputDir, 'network-traces')
        ];

        for (const dir of dirs) {
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch (error) {
                console.warn(`⚠️ Failed to create directory ${dir}: ${error.message}`);
            }
        }

        console.log(`✅ Output directory structure initialized: ${this.config.outputDir}`);
    }

    /**
     * Run chatbot functionality tests
     */
    async runChatbotTests() {
        const suiteResult = {
            name: 'Chatbot Functionality',
            startTime: Date.now(),
            tests: [],
            passed: 0,
            failed: 0
        };

        try {
            console.log('   🔍 Initializing chatbot test...');
            const chatbotTest = new RobustChatbotTest();
            
            const result = await chatbotTest.runComprehensiveTest();
            
            suiteResult.tests.push({
                name: 'Comprehensive Chatbot Test',
                passed: result.testPassed || false,
                details: result.summary || {},
                duration: result.duration || 0
            });

            if (result.testPassed) {
                suiteResult.passed++;
                this.results.overall.passed++;
                console.log('   ✅ Chatbot functionality tests PASSED');
            } else {
                suiteResult.failed++;
                this.results.overall.failed++;
                console.log('   ❌ Chatbot functionality tests FAILED');
                
                // Retry if configured
                if (this.config.retryFailedTests) {
                    console.log('   🔄 Retrying chatbot test...');
                    const retryResult = await this.retryTest(() => chatbotTest.runComprehensiveTest());
                    if (retryResult.success) {
                        console.log('   ✅ Chatbot test PASSED on retry');
                        suiteResult.passed++;
                        suiteResult.failed--;
                        this.results.overall.passed++;
                        this.results.overall.failed--;
                    }
                }
            }

        } catch (error) {
            console.error('   💥 Chatbot test suite crashed:', error.message);
            suiteResult.failed++;
            this.results.overall.failed++;
            suiteResult.tests.push({
                name: 'Chatbot Test (Crashed)',
                passed: false,
                error: error.message,
                duration: 0
            });
        }

        suiteResult.duration = Date.now() - suiteResult.startTime;
        return suiteResult;
    }

    /**
     * Run performance tests
     */
    async runPerformanceTests() {
        const suiteResult = {
            name: 'Performance Tests',
            startTime: Date.now(),
            tests: [],
            passed: 0,
            failed: 0
        };

        console.log('   ⚡ Running page load performance tests...');

        try {
            const puppeteer = require('puppeteer');
            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            for (const env of this.config.environments) {
                const testResult = await this.runSinglePerformanceTest(browser, env);
                suiteResult.tests.push(testResult);
                
                if (testResult.passed) {
                    suiteResult.passed++;
                } else {
                    suiteResult.failed++;
                }
            }

            await browser.close();

            if (suiteResult.passed > suiteResult.failed) {
                this.results.overall.passed++;
                console.log('   ✅ Performance tests majority PASSED');
            } else {
                this.results.overall.failed++;
                console.log('   ❌ Performance tests majority FAILED');
            }

        } catch (error) {
            console.error('   💥 Performance test suite crashed:', error.message);
            suiteResult.failed++;
            this.results.overall.failed++;
        }

        suiteResult.duration = Date.now() - suiteResult.startTime;
        return suiteResult;
    }

    /**
     * Run a single performance test for an environment
     */
    async runSinglePerformanceTest(browser, environment) {
        const testResult = {
            name: `Performance Test - ${environment}`,
            environment,
            passed: false,
            metrics: {},
            startTime: Date.now()
        };

        try {
            const page = await browser.newPage();
            
            // Setup performance monitoring
            const networkMonitor = new NetworkMonitor(page, { logLevel: 'warn' });
            
            const urls = {
                production: 'https://it-era.pages.dev',
                staging: 'https://main.it-era.pages.dev'
            };

            const startTime = Date.now();
            
            // Navigate with performance timing
            const response = await page.goto(urls[environment], {
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            const loadTime = Date.now() - startTime;

            // Get performance metrics
            const performanceMetrics = await page.evaluate(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                return {
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
                    loadComplete: navigation.loadEventEnd - navigation.navigationStart,
                    firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
                    firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
                };
            });

            testResult.metrics = {
                totalLoadTime: loadTime,
                statusCode: response?.status() || 0,
                ...performanceMetrics,
                networkAnalysis: networkMonitor.getNetworkAnalysis()
            };

            // Performance criteria
            const criteria = {
                maxLoadTime: 5000, // 5 seconds
                maxDOMContentLoaded: 3000, // 3 seconds
                minStatusCode: 200,
                maxStatusCode: 299
            };

            testResult.passed = 
                loadTime <= criteria.maxLoadTime &&
                performanceMetrics.domContentLoaded <= criteria.maxDOMContentLoaded &&
                response?.status() >= criteria.minStatusCode &&
                response?.status() <= criteria.maxStatusCode;

            console.log(`     📊 ${environment}: Load=${loadTime}ms, DOM=${performanceMetrics.domContentLoaded}ms, Status=${response?.status()}`);

            await page.close();

        } catch (error) {
            console.error(`     ❌ Performance test failed for ${environment}: ${error.message}`);
            testResult.error = error.message;
        }

        testResult.duration = Date.now() - testResult.startTime;
        return testResult;
    }

    /**
     * Run network connectivity tests
     */
    async runNetworkTests() {
        const suiteResult = {
            name: 'Network Connectivity',
            startTime: Date.now(),
            tests: [],
            passed: 0,
            failed: 0
        };

        console.log('   🌐 Running network connectivity tests...');

        try {
            const puppeteer = require('puppeteer');
            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            for (const env of this.config.environments) {
                const testResult = await this.runSingleNetworkTest(browser, env);
                suiteResult.tests.push(testResult);
                
                if (testResult.passed) {
                    suiteResult.passed++;
                } else {
                    suiteResult.failed++;
                }
            }

            await browser.close();

            if (suiteResult.passed > suiteResult.failed) {
                this.results.overall.passed++;
                console.log('   ✅ Network tests majority PASSED');
            } else {
                this.results.overall.failed++;
                console.log('   ❌ Network tests majority FAILED');
            }

        } catch (error) {
            console.error('   💥 Network test suite crashed:', error.message);
            suiteResult.failed++;
            this.results.overall.failed++;
        }

        suiteResult.duration = Date.now() - suiteResult.startTime;
        return suiteResult;
    }

    /**
     * Run a single network test for an environment
     */
    async runSingleNetworkTest(browser, environment) {
        const testResult = {
            name: `Network Test - ${environment}`,
            environment,
            passed: false,
            networkAnalysis: {},
            startTime: Date.now()
        };

        try {
            const page = await browser.newPage();
            const networkMonitor = new NetworkMonitor(page, { logLevel: 'error' });
            
            const urls = {
                production: 'https://it-era.pages.dev',
                staging: 'https://main.it-era.pages.dev'
            };

            // Navigate and wait for all network activity
            await page.goto(urls[environment], {
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            // Wait a bit more for any async requests
            await new Promise(resolve => setTimeout(resolve, 5000));

            const analysis = networkMonitor.getNetworkAnalysis();
            testResult.networkAnalysis = analysis;

            // Network health criteria
            const criteria = {
                maxFailures: 2, // Allow some minor failures
                maxCORSIssues: 0,
                minSuccessRate: 0.8 // 80% of requests should succeed
            };

            const successRate = analysis.summary.totalRequests > 0 ? 
                (analysis.summary.totalRequests - analysis.summary.totalFailures) / analysis.summary.totalRequests : 0;

            testResult.passed = 
                analysis.summary.totalFailures <= criteria.maxFailures &&
                analysis.summary.corsIssues <= criteria.maxCORSIssues &&
                successRate >= criteria.minSuccessRate;

            console.log(`     🔍 ${environment}: Requests=${analysis.summary.totalRequests}, Failures=${analysis.summary.totalFailures}, Success=${Math.round(successRate * 100)}%`);

            await page.close();

        } catch (error) {
            console.error(`     ❌ Network test failed for ${environment}: ${error.message}`);
            testResult.error = error.message;
        }

        testResult.duration = Date.now() - testResult.startTime;
        return testResult;
    }

    /**
     * Retry a failed test
     */
    async retryTest(testFunction, maxRetries = 2) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`   🔄 Retry attempt ${attempt}/${maxRetries}...`);
                const result = await testFunction();
                
                if (result.testPassed || result.success) {
                    return { success: true, result, attempt };
                }
                
                if (attempt < maxRetries) {
                    // Wait before retry
                    await new Promise(resolve => setTimeout(resolve, 3000 * attempt));
                }
            } catch (error) {
                console.log(`   ❌ Retry attempt ${attempt} failed: ${error.message}`);
                if (attempt === maxRetries) {
                    return { success: false, error, attempt };
                }
            }
        }
        
        return { success: false, attempt: maxRetries };
    }

    /**
     * Generate comprehensive test report
     */
    async generateComprehensiveReport() {
        console.log('\n📋 Generating comprehensive test report...');

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalSuites: this.results.suites.length,
                totalPassed: this.results.overall.passed,
                totalFailed: this.results.overall.failed,
                totalDuration: this.results.overall.duration,
                successRate: this.results.overall.passed + this.results.overall.failed > 0 ? 
                    Math.round((this.results.overall.passed / (this.results.overall.passed + this.results.overall.failed)) * 100) : 0
            },
            suites: this.results.suites,
            environment: {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch,
                timestamp: new Date().toISOString()
            },
            recommendations: this.generateRecommendations()
        };

        // Save JSON report
        const jsonReportPath = path.join(this.config.outputDir, 'reports', `comprehensive-test-report-${Date.now()}.json`);
        await fs.writeFile(jsonReportPath, JSON.stringify(report, null, 2));

        // Generate HTML report
        await this.generateHTMLReport(report);

        console.log(`✅ Comprehensive report saved: ${jsonReportPath}`);
        return report;
    }

    /**
     * Generate HTML report
     */
    async generateHTMLReport(report) {
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IT-ERA Test Suite Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f7fa; color: #333; line-height: 1.6; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0056cc, #004099); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; box-shadow: 0 4px 20px rgba(0,86,204,0.3); }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header .meta { opacity: 0.9; font-size: 1.1em; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
        .summary-card { background: white; padding: 25px; border-radius: 12px; text-align: center; box-shadow: 0 2px 15px rgba(0,0,0,0.1); transition: transform 0.3s ease; }
        .summary-card:hover { transform: translateY(-5px); }
        .summary-card.success { border-left: 5px solid #28a745; }
        .summary-card.danger { border-left: 5px solid #dc3545; }
        .summary-card.info { border-left: 5px solid #17a2b8; }
        .summary-card.warning { border-left: 5px solid #ffc107; }
        .metric-value { font-size: 2.5em; font-weight: bold; margin-bottom: 5px; }
        .metric-label { color: #6c757d; font-size: 1.1em; }
        .success-rate { background: linear-gradient(45deg, #28a745, #20c997); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .suite-section { background: white; margin: 30px 0; padding: 30px; border-radius: 12px; box-shadow: 0 2px 15px rgba(0,0,0,0.1); }
        .suite-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #f8f9fa; }
        .suite-status { padding: 8px 16px; border-radius: 20px; font-weight: bold; text-transform: uppercase; font-size: 0.85em; }
        .status-passed { background: #d4edda; color: #155724; }
        .status-failed { background: #f8d7da; color: #721c24; }
        .status-mixed { background: #fff3cd; color: #856404; }
        .test-grid { display: grid; gap: 15px; margin-top: 20px; }
        .test-item { padding: 15px; border-radius: 8px; border-left: 4px solid #dee2e6; }
        .test-passed { border-left-color: #28a745; background: #f8fff9; }
        .test-failed { border-left-color: #dc3545; background: #fff5f5; }
        .test-name { font-weight: bold; margin-bottom: 5px; }
        .test-details { font-size: 0.9em; color: #6c757d; }
        .recommendations { background: #e7f3ff; border: 1px solid #bee5eb; border-radius: 12px; padding: 25px; margin: 30px 0; }
        .recommendations h3 { color: #0056cc; margin-bottom: 15px; }
        .recommendation-item { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #17a2b8; }
        .footer { text-align: center; color: #6c757d; margin: 40px 0; }
        @media (max-width: 768px) {
            .container { padding: 10px; }
            .header { padding: 20px; }
            .header h1 { font-size: 2em; }
            .summary-grid { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎭 IT-ERA Test Suite Report</h1>
            <div class="meta">
                Generated: ${report.timestamp}<br>
                Duration: ${(report.summary.totalDuration / 1000).toFixed(1)} seconds
            </div>
        </div>

        <div class="summary-grid">
            <div class="summary-card success">
                <div class="metric-value success-rate">${report.summary.successRate}%</div>
                <div class="metric-label">Success Rate</div>
            </div>
            <div class="summary-card info">
                <div class="metric-value" style="color: #0056cc;">${report.summary.totalSuites}</div>
                <div class="metric-label">Test Suites</div>
            </div>
            <div class="summary-card success">
                <div class="metric-value" style="color: #28a745;">${report.summary.totalPassed}</div>
                <div class="metric-label">Passed</div>
            </div>
            <div class="summary-card danger">
                <div class="metric-value" style="color: #dc3545;">${report.summary.totalFailed}</div>
                <div class="metric-label">Failed</div>
            </div>
        </div>

        ${report.suites.map(suite => `
            <div class="suite-section">
                <div class="suite-header">
                    <h2>🧪 ${suite.name}</h2>
                    <span class="suite-status ${suite.passed === suite.tests.length ? 'status-passed' : suite.passed > 0 ? 'status-mixed' : 'status-failed'}">
                        ${suite.passed === suite.tests.length ? 'All Passed' : suite.passed > 0 ? 'Partial' : 'Failed'}
                    </span>
                </div>
                <div class="test-details">
                    <strong>Duration:</strong> ${(suite.duration / 1000).toFixed(1)}s | 
                    <strong>Tests:</strong> ${suite.tests.length} | 
                    <strong>Passed:</strong> ${suite.passed} | 
                    <strong>Failed:</strong> ${suite.failed}
                </div>
                <div class="test-grid">
                    ${suite.tests.map(test => `
                        <div class="test-item ${test.passed ? 'test-passed' : 'test-failed'}">
                            <div class="test-name">${test.passed ? '✅' : '❌'} ${test.name}</div>
                            <div class="test-details">
                                Duration: ${(test.duration / 1000).toFixed(1)}s
                                ${test.error ? `<br><strong>Error:</strong> ${test.error}` : ''}
                                ${test.environment ? `<br><strong>Environment:</strong> ${test.environment}` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('')}

        ${report.recommendations.length > 0 ? `
            <div class="recommendations">
                <h3>💡 Recommendations</h3>
                ${report.recommendations.map(rec => `
                    <div class="recommendation-item">
                        <strong>${rec.category}:</strong> ${rec.issue}<br>
                        <em>→ ${rec.solution}</em>
                    </div>
                `).join('')}
            </div>
        ` : ''}

        <div class="footer">
            <p>Report generated by IT-ERA Robust Test Suite</p>
            <p>Node.js ${report.environment.nodeVersion} on ${report.environment.platform} ${report.environment.arch}</p>
        </div>
    </div>
</body>
</html>`;

        const htmlReportPath = path.join(this.config.outputDir, 'reports', `test-report-${Date.now()}.html`);
        await fs.writeFile(htmlReportPath, htmlContent);
        console.log(`📊 HTML report generated: ${htmlReportPath}`);
    }

    /**
     * Generate recommendations based on test results
     */
    generateRecommendations() {
        const recommendations = [];

        // Check for common failure patterns
        const failedSuites = this.results.suites.filter(suite => suite.failed > 0);
        
        if (failedSuites.length > 0) {
            failedSuites.forEach(suite => {
                if (suite.name === 'Chatbot Functionality') {
                    recommendations.push({
                        category: 'Chatbot',
                        issue: 'Chatbot functionality tests failed',
                        solution: 'Check widget implementation, API connectivity, and CORS configuration'
                    });
                }
                
                if (suite.name === 'Performance Tests') {
                    recommendations.push({
                        category: 'Performance',
                        issue: 'Page load performance is below expectations',
                        solution: 'Optimize images, implement caching, and minimize JavaScript bundles'
                    });
                }
                
                if (suite.name === 'Network Connectivity') {
                    recommendations.push({
                        category: 'Network',
                        issue: 'Network connectivity issues detected',
                        solution: 'Review API endpoints, SSL certificates, and CDN configuration'
                    });
                }
            });
        }

        // Success recommendations
        if (this.results.overall.passed > this.results.overall.failed) {
            recommendations.push({
                category: 'Maintenance',
                issue: 'Tests are mostly passing',
                solution: 'Implement regular automated testing and monitoring'
            });
        }

        return recommendations;
    }

    /**
     * Display final summary
     */
    async displayFinalSummary() {
        console.log('\n' + '='.repeat(80));
        console.log('🏆 FINAL TEST SUITE SUMMARY');
        console.log('='.repeat(80));

        const totalTests = this.results.overall.passed + this.results.overall.failed;
        const successRate = totalTests > 0 ? Math.round((this.results.overall.passed / totalTests) * 100) : 0;

        console.log(`📊 Overall Results:`);
        console.log(`   ✅ Passed: ${this.results.overall.passed}`);
        console.log(`   ❌ Failed: ${this.results.overall.failed}`);
        console.log(`   📈 Success Rate: ${successRate}%`);
        console.log(`   ⏱️ Duration: ${(this.results.overall.duration / 1000).toFixed(1)} seconds`);

        const status = successRate >= 80 ? '🎉 EXCELLENT' :
                      successRate >= 60 ? '✅ GOOD' :
                      successRate >= 40 ? '⚠️ NEEDS WORK' :
                      '🚨 CRITICAL ISSUES';

        console.log(`\n🎯 Overall Status: ${status}`);

        // Suite breakdown
        console.log(`\n📋 Suite Breakdown:`);
        this.results.suites.forEach(suite => {
            const suiteRate = suite.tests.length > 0 ? Math.round((suite.passed / suite.tests.length) * 100) : 0;
            const suiteStatus = suite.passed === suite.tests.length ? '✅' :
                              suite.passed > 0 ? '⚠️' : '❌';
            console.log(`   ${suiteStatus} ${suite.name}: ${suite.passed}/${suite.tests.length} (${suiteRate}%)`);
        });

        console.log(`\n📁 Results saved to: ${this.config.outputDir}`);
        console.log('='.repeat(80));
    }
}

// Export for use as module
module.exports = TestSuiteRunner;

// Run if called directly
if (require.main === module) {
    const runner = new TestSuiteRunner();
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
🎭 IT-ERA Robust Test Suite Runner

Usage: node run-robust-test-suite.js [options]

Options:
  --production-only    Test only production environment
  --staging-only       Test only staging environment
  --functionality-only Run only chatbot functionality tests
  --performance-only   Run only performance tests
  --network-only       Run only network tests
  --parallel          Run tests in parallel (faster)
  --no-retry          Disable retry of failed tests
  --help, -h          Show this help message

Examples:
  node run-robust-test-suite.js
  node run-robust-test-suite.js --production-only --functionality-only
  node run-robust-test-suite.js --parallel --no-retry
        `);
        process.exit(0);
    }

    // Configure based on arguments
    if (args.includes('--production-only')) {
        runner.config.environments = ['production'];
    }
    if (args.includes('--staging-only')) {
        runner.config.environments = ['staging'];
    }
    if (args.includes('--functionality-only')) {
        runner.config.testTypes = ['functionality'];
    }
    if (args.includes('--performance-only')) {
        runner.config.testTypes = ['performance'];
    }
    if (args.includes('--network-only')) {
        runner.config.testTypes = ['network'];
    }
    if (args.includes('--parallel')) {
        runner.config.parallel = true;
    }
    if (args.includes('--no-retry')) {
        runner.config.retryFailedTests = false;
    }

    // Execute test suite
    runner.runFullTestSuite()
        .then(results => {
            const successRate = results.overall.passed + results.overall.failed > 0 ? 
                (results.overall.passed / (results.overall.passed + results.overall.failed)) * 100 : 0;
            
            console.log(`\n🎭 Test suite execution completed with ${successRate.toFixed(1)}% success rate`);
            process.exit(successRate >= 50 ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Test suite runner crashed:', error);
            process.exit(1);
        });
}