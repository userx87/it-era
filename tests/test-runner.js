/**
 * Comprehensive Test Runner
 * IT-ERA Website Testing Suite Orchestrator
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class TestRunner {
    constructor() {
        this.results = {
            summary: {
                totalTests: 0,
                passed: 0,
                failed: 0,
                skipped: 0,
                startTime: new Date(),
                endTime: null,
                duration: 0
            },
            suites: {}
        };
        
        this.testSuites = [
            {
                name: 'Unit Tests',
                command: 'npm',
                args: ['run', 'test:unit'],
                timeout: 60000,
                critical: true
            },
            {
                name: 'E2E Tests',
                command: 'npm',
                args: ['run', 'test:e2e'],
                timeout: 300000,
                critical: true
            },
            {
                name: 'Performance Tests',
                command: 'npm',
                args: ['run', 'test:performance'],
                timeout: 180000,
                critical: false
            },
            {
                name: 'Accessibility Tests',
                command: 'npm',
                args: ['run', 'test:accessibility'],
                timeout: 120000,
                critical: false
            },
            {
                name: 'Lighthouse Audit',
                command: 'npm',
                args: ['run', 'lighthouse'],
                timeout: 120000,
                critical: false
            }
        ];
    }

    /**
     * Run all test suites
     */
    async runAllTests() {
        console.log('🚀 Starting IT-ERA Comprehensive Testing Suite...\n');
        
        // Ensure test results directory exists
        await this.ensureTestDirectory();
        
        // Run each test suite
        for (const suite of this.testSuites) {
            await this.runTestSuite(suite);
        }
        
        // Calculate final results
        this.results.summary.endTime = new Date();
        this.results.summary.duration = this.results.summary.endTime - this.results.summary.startTime;
        
        // Generate reports
        await this.generateReports();
        
        // Display summary
        this.displaySummary();
        
        // Return results
        return this.results;
    }

    /**
     * Run individual test suite
     */
    async runTestSuite(suite) {
        console.log(`📋 Running ${suite.name}...`);
        
        const startTime = Date.now();
        const result = {
            name: suite.name,
            status: 'running',
            startTime: new Date(),
            endTime: null,
            duration: 0,
            output: '',
            error: null,
            critical: suite.critical
        };

        try {
            const output = await this.executeCommand(suite.command, suite.args, suite.timeout);
            
            result.status = 'passed';
            result.output = output;
            this.results.summary.passed++;
            
            console.log(`   ✅ ${suite.name} passed`);
            
        } catch (error) {
            result.status = 'failed';
            result.error = error.message;
            result.output = error.output || '';
            
            if (suite.critical) {
                this.results.summary.failed++;
                console.log(`   ❌ ${suite.name} failed (CRITICAL)`);
                console.log(`      Error: ${error.message}`);
            } else {
                this.results.summary.skipped++;
                console.log(`   ⚠️  ${suite.name} failed (non-critical)`);
                console.log(`      Error: ${error.message}`);
            }
        }
        
        result.endTime = new Date();
        result.duration = Date.now() - startTime;
        this.results.suites[suite.name] = result;
        this.results.summary.totalTests++;
        
        console.log(`   ⏱️  Duration: ${result.duration}ms\n`);
    }

    /**
     * Execute command with timeout
     */
    executeCommand(command, args, timeout) {
        return new Promise((resolve, reject) => {
            const process = spawn(command, args, {
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: true
            });

            let output = '';
            let errorOutput = '';

            process.stdout.on('data', (data) => {
                output += data.toString();
            });

            process.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            const timeoutId = setTimeout(() => {
                process.kill('SIGKILL');
                reject(new Error(`Command timed out after ${timeout}ms`));
            }, timeout);

            process.on('close', (code) => {
                clearTimeout(timeoutId);
                
                if (code === 0) {
                    resolve(output);
                } else {
                    const error = new Error(`Command failed with exit code ${code}`);
                    error.output = output + errorOutput;
                    reject(error);
                }
            });

            process.on('error', (error) => {
                clearTimeout(timeoutId);
                reject(error);
            });
        });
    }

    /**
     * Ensure test directory exists
     */
    async ensureTestDirectory() {
        try {
            await fs.mkdir('test-results', { recursive: true });
            await fs.mkdir('test-results/screenshots', { recursive: true });
            await fs.mkdir('test-results/reports', { recursive: true });
        } catch (error) {
            console.warn('Warning: Could not create test directories:', error.message);
        }
    }

    /**
     * Generate comprehensive reports
     */
    async generateReports() {
        try {
            // Generate JSON report
            const jsonReport = {
                ...this.results,
                metadata: {
                    testRunner: 'IT-ERA Test Suite',
                    version: '1.0.0',
                    environment: process.env.NODE_ENV || 'development',
                    timestamp: new Date().toISOString()
                }
            };

            await fs.writeFile(
                'test-results/test-report.json',
                JSON.stringify(jsonReport, null, 2)
            );

            // Generate HTML report
            const htmlReport = this.generateHTMLReport(jsonReport);
            await fs.writeFile('test-results/test-report.html', htmlReport);

            // Generate JUnit XML report (for CI/CD)
            const junitReport = this.generateJUnitReport(jsonReport);
            await fs.writeFile('test-results/junit-report.xml', junitReport);

            console.log('📊 Test reports generated:');
            console.log('   - test-results/test-report.json');
            console.log('   - test-results/test-report.html');
            console.log('   - test-results/junit-report.xml');

        } catch (error) {
            console.error('❌ Failed to generate reports:', error.message);
        }
    }

    /**
     * Generate HTML report
     */
    generateHTMLReport(report) {
        const passRate = (report.summary.passed / report.summary.totalTests * 100).toFixed(1);
        const statusClass = passRate >= 80 ? 'success' : passRate >= 60 ? 'warning' : 'danger';

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IT-ERA Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .success { color: #28a745; }
        .warning { color: #ffc107; }
        .danger { color: #dc3545; }
        .suite { margin-bottom: 20px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
        .suite-header { background: #f8f9fa; padding: 15px; font-weight: bold; }
        .suite-content { padding: 15px; }
        .status-passed { color: #28a745; }
        .status-failed { color: #dc3545; }
        .status-skipped { color: #6c757d; }
        .output { background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px; max-height: 200px; overflow-y: auto; }
        .error { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>IT-ERA Test Report</h1>
            <p>Generated: ${report.metadata.timestamp}</p>
            <p>Environment: ${report.metadata.environment}</p>
        </div>
        
        <div class="summary">
            <div class="metric">
                <div class="metric-value ${statusClass}">${passRate}%</div>
                <div>Pass Rate</div>
            </div>
            <div class="metric">
                <div class="metric-value">${report.summary.totalTests}</div>
                <div>Total Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value success">${report.summary.passed}</div>
                <div>Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value danger">${report.summary.failed}</div>
                <div>Failed</div>
            </div>
            <div class="metric">
                <div class="metric-value">${(report.summary.duration / 1000).toFixed(1)}s</div>
                <div>Duration</div>
            </div>
        </div>
        
        <h2>Test Suites</h2>
        ${Object.values(report.suites).map(suite => `
        <div class="suite">
            <div class="suite-header">
                <span class="status-${suite.status}">${suite.name}</span>
                <span style="float: right;">${suite.status.toUpperCase()} (${suite.duration}ms)</span>
            </div>
            <div class="suite-content">
                ${suite.error ? `
                <div class="output error">
                    <strong>Error:</strong> ${suite.error}
                </div>
                ` : ''}
                ${suite.output ? `
                <div class="output">
                    <strong>Output:</strong><br>
                    ${suite.output.substring(0, 1000)}${suite.output.length > 1000 ? '...' : ''}
                </div>
                ` : ''}
            </div>
        </div>
        `).join('')}
    </div>
</body>
</html>`;
    }

    /**
     * Generate JUnit XML report
     */
    generateJUnitReport(report) {
        const testcases = Object.values(report.suites).map(suite => {
            if (suite.status === 'passed') {
                return `    <testcase name="${suite.name}" time="${suite.duration / 1000}"/>`;
            } else {
                return `    <testcase name="${suite.name}" time="${suite.duration / 1000}">
      <failure message="${suite.error || 'Test failed'}">${suite.output || ''}</failure>
    </testcase>`;
            }
        }).join('\n');

        return `<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="IT-ERA Test Suite" 
           tests="${report.summary.totalTests}" 
           failures="${report.summary.failed}" 
           time="${report.summary.duration / 1000}">
${testcases}
</testsuite>`;
    }

    /**
     * Display summary
     */
    displaySummary() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total Tests: ${this.results.summary.totalTests}`);
        console.log(`✅ Passed: ${this.results.summary.passed}`);
        console.log(`❌ Failed: ${this.results.summary.failed}`);
        console.log(`⚠️  Skipped: ${this.results.summary.skipped}`);
        console.log(`⏱️  Duration: ${(this.results.summary.duration / 1000).toFixed(1)}s`);
        
        const passRate = (this.results.summary.passed / this.results.summary.totalTests * 100).toFixed(1);
        console.log(`📈 Pass Rate: ${passRate}%`);
        
        if (this.results.summary.failed > 0) {
            console.log('\n❌ FAILED TESTS:');
            Object.values(this.results.suites)
                .filter(suite => suite.status === 'failed' && suite.critical)
                .forEach(suite => {
                    console.log(`   - ${suite.name}: ${suite.error}`);
                });
        }
        
        console.log('\n🎯 RECOMMENDATIONS:');
        if (passRate >= 90) {
            console.log('   ✅ Excellent! All critical tests are passing.');
        } else if (passRate >= 70) {
            console.log('   ⚠️  Good, but some improvements needed.');
        } else {
            console.log('   ❌ Critical issues found. Address failed tests before deployment.');
        }
        
        console.log('='.repeat(60));
    }
}

// Export for use in other modules
module.exports = TestRunner;

// Run tests if called directly
if (require.main === module) {
    const runner = new TestRunner();
    runner.runAllTests()
        .then(results => {
            const exitCode = results.summary.failed > 0 ? 1 : 0;
            process.exit(exitCode);
        })
        .catch(error => {
            console.error('💥 Test runner failed:', error);
            process.exit(1);
        });
}
