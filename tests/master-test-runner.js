/**
 * IT-ERA Master Test Runner
 * Comprehensive System Validation Suite
 * 
 * Testing & Validation Chief - HIVE MIND
 * Executes all test suites and generates unified reports
 */

const { exec, spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class MasterTestRunner {
    constructor() {
        this.testSuites = [
            {
                name: 'Security Penetration Tests',
                file: './security/penetration-tests.js',
                critical: true,
                timeout: 300000 // 5 minutes
            },
            {
                name: 'API Endpoint Tests',
                file: './api/comprehensive-api-tests.js',
                critical: true,
                timeout: 180000 // 3 minutes
            },
            {
                name: 'Authentication Flow Tests',
                file: './authentication/auth-flow-tests.js',
                critical: true,
                timeout: 240000 // 4 minutes
            },
            {
                name: 'Performance & Load Tests',
                file: './performance/load-testing.js',
                critical: false,
                timeout: 600000 // 10 minutes
            },
            {
                name: 'Frontend UI Tests',
                file: './frontend/ui-functionality-tests.js',
                critical: true,
                timeout: 480000 // 8 minutes
            }
        ];
        
        this.results = {
            summary: {
                totalSuites: this.testSuites.length,
                executedSuites: 0,
                passedSuites: 0,
                failedSuites: 0,
                criticalFailures: 0,
                totalTests: 0,
                passedTests: 0,
                failedTests: 0,
                executionTime: 0,
                timestamp: new Date().toISOString()
            },
            suites: [],
            vulnerabilities: [],
            performance: [],
            recommendations: []
        };
        
        this.reportsDir = path.join(__dirname, 'reports');
    }
    
    async initializeReportsDirectory() {
        try {
            await fs.mkdir(this.reportsDir, { recursive: true });
            console.log('✓ Reports directory initialized');
        } catch (error) {
            console.error('Failed to create reports directory:', error.message);
            throw error;
        }
    }
    
    async runTestSuite(suite) {
        console.log(`\n🧪 Running ${suite.name}...`);
        const startTime = Date.now();
        
        return new Promise((resolve) => {
            const child = spawn('node', [suite.file], {
                cwd: __dirname,
                stdio: 'pipe',
                timeout: suite.timeout
            });
            
            let stdout = '';
            let stderr = '';
            
            child.stdout.on('data', (data) => {
                stdout += data.toString();
                process.stdout.write(data);
            });
            
            child.stderr.on('data', (data) => {
                stderr += data.toString();
                process.stderr.write(data);
            });
            
            child.on('close', async (code) => {
                const endTime = Date.now();
                const duration = endTime - startTime;
                
                const suiteResult = {
                    name: suite.name,
                    file: suite.file,
                    critical: suite.critical,
                    passed: code === 0,
                    exitCode: code,
                    duration,
                    stdout,
                    stderr,
                    timestamp: new Date().toISOString()
                };
                
                // Try to load individual test report
                try {
                    const reportFile = suite.file.replace('.js', '-report.json');
                    const reportPath = path.join(this.reportsDir, path.basename(reportFile));
                    const reportData = await fs.readFile(reportPath, 'utf8');
                    suiteResult.detailedResults = JSON.parse(reportData);
                } catch (error) {
                    console.log(`⚠️  No detailed report found for ${suite.name}`);
                }
                
                this.results.suites.push(suiteResult);
                
                if (code === 0) {
                    console.log(`✅ ${suite.name} completed successfully (${duration}ms)`);
                    this.results.summary.passedSuites++;
                } else {
                    console.log(`❌ ${suite.name} failed with exit code ${code} (${duration}ms)`);
                    this.results.summary.failedSuites++;
                    if (suite.critical) {
                        this.results.summary.criticalFailures++;
                    }
                }
                
                this.results.summary.executedSuites++;
                resolve(suiteResult);
            });
            
            child.on('error', (error) => {
                console.error(`Failed to start ${suite.name}:`, error.message);
                resolve({
                    name: suite.name,
                    file: suite.file,
                    critical: suite.critical,
                    passed: false,
                    error: error.message,
                    duration: Date.now() - startTime,
                    timestamp: new Date().toISOString()
                });
            });
        });
    }
    
    async aggregateResults() {
        console.log('\n📊 Aggregating test results...');
        
        // Process individual suite results
        for (const suite of this.results.suites) {
            if (suite.detailedResults) {
                // Aggregate test counts
                if (suite.detailedResults.summary) {
                    this.results.summary.totalTests += suite.detailedResults.summary.totalTests || 0;
                    this.results.summary.passedTests += suite.detailedResults.summary.passedTests || 0;
                    this.results.summary.failedTests += suite.detailedResults.summary.failedTests || 0;
                }
                
                // Collect vulnerabilities
                if (suite.detailedResults.vulnerabilities) {
                    this.results.vulnerabilities.push(...suite.detailedResults.vulnerabilities);
                }
                
                // Collect performance data
                if (suite.detailedResults.performance) {
                    this.results.performance.push(...suite.detailedResults.performance);
                }
            }
        }
        
        // Generate recommendations
        this.generateRecommendations();
    }
    
    generateRecommendations() {
        console.log('🔍 Analyzing results and generating recommendations...');
        
        // Critical security recommendations
        if (this.results.vulnerabilities.length > 0) {
            this.results.recommendations.push({
                priority: 'CRITICAL',
                category: 'Security',
                title: 'Security Vulnerabilities Found',
                description: `${this.results.vulnerabilities.length} security vulnerabilities detected`,
                action: 'Immediate remediation required',
                details: this.results.vulnerabilities.map(v => v.description)
            });
        }
        
        // Critical failures
        if (this.results.summary.criticalFailures > 0) {
            this.results.recommendations.push({
                priority: 'HIGH',
                category: 'System Stability',
                title: 'Critical Test Failures',
                description: `${this.results.summary.criticalFailures} critical test suites failed`,
                action: 'System may be unstable - investigate immediately',
                details: this.results.suites
                    .filter(s => s.critical && !s.passed)
                    .map(s => `${s.name}: ${s.stderr || 'Unknown error'}`)
            });
        }
        
        // Performance recommendations
        const slowPerformance = this.results.performance.filter(p => p.responseTime > 2000);
        if (slowPerformance.length > 0) {
            this.results.recommendations.push({
                priority: 'MEDIUM',
                category: 'Performance',
                title: 'Slow Response Times',
                description: `${slowPerformance.length} endpoints showing slow response times`,
                action: 'Optimize performance for better user experience',
                details: slowPerformance.map(p => `${p.endpoint}: ${p.responseTime}ms`)
            });
        }
        
        // Success recommendations
        if (this.results.summary.criticalFailures === 0 && this.results.vulnerabilities.length === 0) {
            this.results.recommendations.push({
                priority: 'LOW',
                category: 'Maintenance',
                title: 'System Health Good',
                description: 'All critical tests passing, no major vulnerabilities found',
                action: 'Continue regular monitoring and maintenance',
                details: ['Regular security scans', 'Performance monitoring', 'Test suite updates']
            });
        }
    }
    
    async generateHIVEMindReport() {
        console.log('\n🤖 Generating HIVE MIND coordination report...');
        
        const hiveMindReport = {
            mission: 'IT-ERA System Validation Complete',
            chief: 'Testing & Validation Chief',
            timestamp: new Date().toISOString(),
            status: this.results.summary.criticalFailures === 0 ? 'MISSION_SUCCESS' : 'MISSION_CRITICAL',
            
            executiveSummary: {
                systemHealth: this.getSystemHealthStatus(),
                criticalIssues: this.results.summary.criticalFailures,
                vulnerabilities: this.results.vulnerabilities.length,
                testCoverage: this.calculateTestCoverage(),
                recommendations: this.results.recommendations.length
            },
            
            agentCoordination: {
                securityTeam: {
                    action: this.results.vulnerabilities.length > 0 ? 'IMMEDIATE_REMEDIATION' : 'MAINTAIN_VIGILANCE',
                    priority: this.results.vulnerabilities.length > 0 ? 'CRITICAL' : 'LOW',
                    findings: this.results.vulnerabilities
                },
                
                developmentTeam: {
                    action: this.results.summary.failedSuites > 0 ? 'BUG_FIXES_REQUIRED' : 'CONTINUE_DEVELOPMENT',
                    priority: this.results.summary.criticalFailures > 0 ? 'HIGH' : 'MEDIUM',
                    failedTests: this.results.suites.filter(s => !s.passed)
                },
                
                performanceTeam: {
                    action: this.results.performance.some(p => p.responseTime > 2000) ? 'OPTIMIZATION_NEEDED' : 'MONITOR',
                    priority: 'MEDIUM',
                    metrics: this.results.performance
                },
                
                deploymentTeam: {
                    action: this.results.summary.criticalFailures === 0 ? 'READY_FOR_PRODUCTION' : 'HOLD_DEPLOYMENT',
                    priority: this.results.summary.criticalFailures === 0 ? 'LOW' : 'CRITICAL',
                    status: this.getDeploymentReadiness()
                }
            },
            
            nextActions: this.results.recommendations.map(r => ({
                agent: this.mapRecommendationToAgent(r.category),
                priority: r.priority,
                action: r.action,
                description: r.description
            }))
        };
        
        // Save HIVE MIND report
        const hiveMindPath = path.join(this.reportsDir, 'hive-mind-coordination-report.json');
        await fs.writeFile(hiveMindPath, JSON.stringify(hiveMindReport, null, 2));
        
        return hiveMindReport;
    }
    
    getSystemHealthStatus() {
        if (this.results.summary.criticalFailures > 0) return 'CRITICAL';
        if (this.results.vulnerabilities.length > 0) return 'WARNING';
        if (this.results.summary.failedSuites > 0) return 'DEGRADED';
        return 'HEALTHY';
    }
    
    calculateTestCoverage() {
        const expectedModules = ['Authentication', 'API', 'Frontend', 'Security', 'Performance'];
        const testedModules = this.results.suites.filter(s => s.passed).length;
        return Math.round((testedModules / expectedModules.length) * 100);
    }
    
    getDeploymentReadiness() {
        if (this.results.summary.criticalFailures > 0) return 'NOT_READY';
        if (this.results.vulnerabilities.length > 0) return 'SECURITY_REVIEW_NEEDED';
        return 'READY';
    }
    
    mapRecommendationToAgent(category) {
        const mapping = {
            'Security': 'Security Team',
            'Performance': 'Performance Team',
            'System Stability': 'Development Team',
            'Maintenance': 'DevOps Team'
        };
        return mapping[category] || 'General Team';
    }
    
    async saveComprehensiveReport() {
        console.log('\n💾 Saving comprehensive test report...');
        
        const reportPath = path.join(this.reportsDir, 'comprehensive-test-report.json');
        await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));
        
        // Generate HTML report
        const htmlReport = this.generateHTMLReport();
        const htmlPath = path.join(this.reportsDir, 'comprehensive-test-report.html');
        await fs.writeFile(htmlPath, htmlReport);
        
        console.log(`✅ Comprehensive report saved:`);
        console.log(`   JSON: ${reportPath}`);
        console.log(`   HTML: ${htmlPath}`);
    }
    
    generateHTMLReport() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IT-ERA Comprehensive Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header .subtitle { opacity: 0.9; font-size: 1.1em; margin-top: 10px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; padding: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #667eea; }
        .metric .value { font-size: 2em; font-weight: bold; color: #333; }
        .metric .label { color: #666; font-size: 0.9em; text-transform: uppercase; margin-top: 5px; }
        .section { margin: 20px 30px; }
        .section h2 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        .test-suite { background: #f8f9fa; margin: 10px 0; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745; }
        .test-suite.failed { border-left-color: #dc3545; }
        .test-suite.critical { border-left-color: #ffc107; }
        .vulnerability { background: #fff5f5; border: 1px solid #fed7d7; padding: 15px; margin: 10px 0; border-radius: 8px; }
        .recommendation { background: #f0fff4; border: 1px solid #9ae6b4; padding: 15px; margin: 10px 0; border-radius: 8px; }
        .recommendation.critical { background: #fff5f5; border-color: #fed7d7; }
        .recommendation.high { background: #fffbf0; border-color: #faf089; }
        .status { padding: 5px 10px; border-radius: 20px; color: white; font-size: 0.8em; font-weight: bold; text-transform: uppercase; }
        .status.healthy { background: #28a745; }
        .status.warning { background: #ffc107; }
        .status.critical { background: #dc3545; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ IT-ERA System Validation</h1>
            <div class="subtitle">Testing & Validation Chief - HIVE MIND Mission Report</div>
            <div class="subtitle">Generated: ${this.results.summary.timestamp}</div>
        </div>
        
        <div class="summary">
            <div class="metric">
                <div class="value">${this.results.summary.executedSuites}/${this.results.summary.totalSuites}</div>
                <div class="label">Test Suites</div>
            </div>
            <div class="metric">
                <div class="value">${this.results.summary.passedTests}</div>
                <div class="label">Tests Passed</div>
            </div>
            <div class="metric">
                <div class="value">${this.results.vulnerabilities.length}</div>
                <div class="label">Vulnerabilities</div>
            </div>
            <div class="metric">
                <div class="value">${this.results.summary.criticalFailures}</div>
                <div class="label">Critical Failures</div>
            </div>
        </div>
        
        <div class="section">
            <h2>System Health Status</h2>
            <span class="status ${this.getSystemHealthStatus().toLowerCase()}">${this.getSystemHealthStatus()}</span>
        </div>
        
        <div class="section">
            <h2>Test Suite Results</h2>
            ${this.results.suites.map(suite => `
                <div class="test-suite ${suite.passed ? '' : 'failed'} ${suite.critical ? 'critical' : ''}">
                    <h3>${suite.passed ? '✅' : '❌'} ${suite.name}</h3>
                    <p><strong>Duration:</strong> ${suite.duration}ms</p>
                    <p><strong>File:</strong> ${suite.file}</p>
                    ${suite.critical ? '<p><strong>⚠️ Critical Suite</strong></p>' : ''}
                    ${!suite.passed ? `<p><strong>Error:</strong> ${suite.stderr || 'Unknown error'}</p>` : ''}
                </div>
            `).join('')}
        </div>
        
        ${this.results.vulnerabilities.length > 0 ? `
        <div class="section">
            <h2>🔐 Security Vulnerabilities</h2>
            ${this.results.vulnerabilities.map(vuln => `
                <div class="vulnerability">
                    <h4>⚠️ ${vuln.severity || 'Unknown'} - ${vuln.type || 'Security Issue'}</h4>
                    <p>${vuln.description || 'No description available'}</p>
                    ${vuln.recommendation ? `<p><strong>Recommendation:</strong> ${vuln.recommendation}</p>` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        <div class="section">
            <h2>📋 Recommendations</h2>
            ${this.results.recommendations.map(rec => `
                <div class="recommendation ${rec.priority.toLowerCase()}">
                    <h4>${rec.priority === 'CRITICAL' ? '🚨' : rec.priority === 'HIGH' ? '⚠️' : '💡'} ${rec.title}</h4>
                    <p><strong>Category:</strong> ${rec.category}</p>
                    <p><strong>Description:</strong> ${rec.description}</p>
                    <p><strong>Action:</strong> ${rec.action}</p>
                </div>
            `).join('')}
        </div>
        
        <div class="footer">
            <p>Report generated by IT-ERA Master Test Runner</p>
            <p>Testing & Validation Chief - HIVE MIND Coordination System</p>
        </div>
    </div>
</body>
</html>`;
    }
    
    async run() {
        const startTime = Date.now();
        
        console.log('🚀 IT-ERA Master Test Runner Starting...');
        console.log('Testing & Validation Chief - HIVE MIND Mission');
        console.log('================================================');
        
        try {
            // Initialize
            await this.initializeReportsDirectory();
            
            // Run all test suites
            for (const suite of this.testSuites) {
                await this.runTestSuite(suite);
            }
            
            // Process results
            this.results.summary.executionTime = Date.now() - startTime;
            await this.aggregateResults();
            
            // Generate reports
            await this.saveComprehensiveReport();
            const hiveMindReport = await this.generateHIVEMindReport();
            
            // Final summary
            console.log('\n🎯 MISSION COMPLETION SUMMARY');
            console.log('================================');
            console.log(`✅ Test Suites Executed: ${this.results.summary.executedSuites}/${this.results.summary.totalSuites}`);
            console.log(`✅ Test Suites Passed: ${this.results.summary.passedSuites}`);
            console.log(`❌ Test Suites Failed: ${this.results.summary.failedSuites}`);
            console.log(`🚨 Critical Failures: ${this.results.summary.criticalFailures}`);
            console.log(`🔐 Security Vulnerabilities: ${this.results.vulnerabilities.length}`);
            console.log(`⏱️  Total Execution Time: ${Math.round(this.results.summary.executionTime / 1000)}s`);
            console.log(`🏥 System Health: ${this.getSystemHealthStatus()}`);
            
            console.log('\n🤖 HIVE MIND COORDINATION');
            console.log('=========================');
            console.log(`Mission Status: ${hiveMindReport.status}`);
            console.log(`Deployment Status: ${hiveMindReport.agentCoordination.deploymentTeam.status}`);
            
            if (this.results.summary.criticalFailures === 0) {
                console.log('\n🎉 MISSION SUCCESS: System validation complete!');
                process.exit(0);
            } else {
                console.log('\n⚠️  MISSION CRITICAL: Immediate attention required!');
                process.exit(1);
            }
            
        } catch (error) {
            console.error('\n💥 MISSION FAILURE:', error.message);
            process.exit(1);
        }
    }
}

// Execute if called directly
if (require.main === module) {
    const runner = new MasterTestRunner();
    runner.run().catch(console.error);
}

module.exports = MasterTestRunner;