/**
 * IT-ERA Templates - Master Test Runner
 * Runs all test suites and generates comprehensive reports
 */

const ITEraTemplateTestSuite = require('./templates-test-suite');
const ITEraPerformanceTestSuite = require('./performance-test');
const ITEraAccessibilityTestSuite = require('./accessibility-test');
const fs = require('fs').promises;
const path = require('path');

class ITEraMasterTestRunner {
    constructor() {
        this.results = {
            templateTests: null,
            performanceTests: null,
            accessibilityTests: null
        };
        this.startTime = Date.now();
    }

    async runAllTests() {
        console.log('🚀 Starting IT-ERA Complete Template Test Suite...\n');
        console.log('Testing templates for:');
        console.log('  ✓ SEO optimization');
        console.log('  ✓ Form functionality with Resend API');
        console.log('  ✓ Mobile responsiveness');
        console.log('  ✓ WCAG AAA accessibility compliance');
        console.log('  ✓ Performance optimization');
        console.log('  ✓ Conversion optimization');
        console.log('  ✓ Template placeholder functionality');
        console.log('\n' + '='.repeat(60));

        try {
            // Run Template Tests (SEO, Forms, Conversion, Placeholders)
            console.log('\n📄 Running Template Quality Tests...');
            const templateTestSuite = new ITEraTemplateTestSuite();
            this.results.templateTests = await templateTestSuite.runAllTests();

            // Run Performance Tests
            console.log('\n⚡ Running Performance Tests...');
            const performanceTestSuite = new ITEraPerformanceTestSuite();
            this.results.performanceTests = await performanceTestSuite.runPerformanceTests();

            // Run Accessibility Tests
            console.log('\n♿ Running Accessibility Tests (WCAG AAA)...');
            const accessibilityTestSuite = new ITEraAccessibilityTestSuite();
            this.results.accessibilityTests = await accessibilityTestSuite.runAccessibilityTests();

            // Generate master report
            await this.generateMasterReport();
            
            // Display final summary
            this.displayFinalSummary();

        } catch (error) {
            console.error('❌ Test execution failed:', error);
            throw error;
        }
    }

    async generateMasterReport() {
        const reportDate = new Date().toISOString().split('T')[0];
        const testDuration = Math.round((Date.now() - this.startTime) / 1000);
        
        // Combine all results
        const masterReport = {
            testDate: reportDate,
            testDuration: testDuration,
            overview: this.generateOverview(),
            templateQuality: this.results.templateTests,
            performance: this.results.performanceTests,
            accessibility: this.results.accessibilityTests,
            businessReadiness: this.assessBusinessReadiness(),
            finalRecommendations: this.generateFinalRecommendations()
        };

        // Write master JSON report
        const jsonPath = `/Users/andreapanzeri/progetti/IT-ERA/tests/master-test-report-${reportDate}.json`;
        await fs.writeFile(jsonPath, JSON.stringify(masterReport, null, 2));

        // Write executive HTML report
        const htmlPath = `/Users/andreapanzeri/progetti/IT-ERA/tests/master-test-report-${reportDate}.html`;
        await fs.writeFile(htmlPath, this.generateExecutiveHTMLReport(masterReport));

        // Write business-ready CSV summary
        const csvPath = `/Users/andreapanzeri/progetti/IT-ERA/tests/business-summary-${reportDate}.csv`;
        await fs.writeFile(csvPath, this.generateBusinessCSV(masterReport));

        console.log(`\n📊 Master Test Report Generated:`);
        console.log(`  📄 JSON Report: ${jsonPath}`);
        console.log(`  🌐 HTML Report: ${htmlPath}`);
        console.log(`  📈 Business CSV: ${csvPath}`);

        return masterReport;
    }

    generateOverview() {
        const templates = [
            'assistenza-it-template-new.html',
            'sicurezza-informatica-modern.html', 
            'cloud-storage-perfect.html'
        ];

        const overview = {};

        templates.forEach(template => {
            const templateOverview = {
                name: template,
                status: 'READY',
                issues: {
                    critical: 0,
                    major: 0,
                    minor: 0
                },
                scores: {
                    seo: 0,
                    accessibility: 0,
                    performance: 0,
                    conversion: 0,
                    overall: 0
                }
            };

            // Get template test results
            if (this.results.templateTests) {
                const templateResult = this.results.templateTests.templateResults.find(r => r.template === template);
                if (templateResult) {
                    const totalTests = templateResult.results.reduce((sum, category) => sum + category.results.length, 0);
                    const passedTests = templateResult.results.reduce((sum, category) => 
                        sum + category.results.filter(r => r.status === 'PASS').length, 0);
                    templateOverview.scores.seo = Math.round((passedTests / totalTests) * 100);
                }
            }

            // Get accessibility results
            if (this.results.accessibilityTests) {
                const accessResult = this.results.accessibilityTests.templateResults.find(r => r.template === template);
                if (accessResult) {
                    templateOverview.scores.accessibility = accessResult.score;
                    templateOverview.issues.critical += accessResult.results.filter(r => 
                        r.status === 'FAIL' && r.level === 'A'
                    ).length;
                }
            }

            // Get performance results
            if (this.results.performanceTests) {
                const perfResult = this.results.performanceTests.summary[template];
                if (perfResult) {
                    templateOverview.scores.performance = perfResult.overallScore;
                }
            }

            // Calculate overall score
            const scores = Object.values(templateOverview.scores).filter(s => s > 0);
            templateOverview.scores.overall = scores.length > 0 ? 
                Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length) : 0;

            // Determine status
            if (templateOverview.issues.critical > 0) {
                templateOverview.status = 'NEEDS_FIXES';
            } else if (templateOverview.scores.overall < 80) {
                templateOverview.status = 'NEEDS_IMPROVEMENT';
            } else {
                templateOverview.status = 'PRODUCTION_READY';
            }

            overview[template] = templateOverview;
        });

        return overview;
    }

    assessBusinessReadiness() {
        const assessment = {
            readyForProduction: [],
            needsMinorFixes: [],
            needsMajorFixes: [],
            summary: {
                totalTemplates: 3,
                productionReady: 0,
                needsFixes: 0,
                estimatedFixTime: '0 hours'
            }
        };

        Object.entries(this.generateOverview()).forEach(([template, overview]) => {
            const templateName = template.replace('.html', '');
            
            if (overview.status === 'PRODUCTION_READY') {
                assessment.readyForProduction.push({
                    template: templateName,
                    score: overview.scores.overall,
                    strengths: this.getTemplateStrengths(template, overview)
                });
                assessment.summary.productionReady++;
            } else if (overview.issues.critical === 0 && overview.scores.overall >= 70) {
                assessment.needsMinorFixes.push({
                    template: templateName,
                    score: overview.scores.overall,
                    issues: overview.issues,
                    estimatedHours: 2
                });
                assessment.summary.needsFixes++;
            } else {
                assessment.needsMajorFixes.push({
                    template: templateName,
                    score: overview.scores.overall,
                    issues: overview.issues,
                    estimatedHours: 8
                });
                assessment.summary.needsFixes++;
            }
        });

        // Calculate total fix time
        const totalHours = assessment.needsMinorFixes.reduce((sum, t) => sum + t.estimatedHours, 0) +
                          assessment.needsMajorFixes.reduce((sum, t) => sum + t.estimatedHours, 0);
        assessment.summary.estimatedFixTime = `${totalHours} hours`;

        return assessment;
    }

    getTemplateStrengths(template, overview) {
        const strengths = [];
        
        if (overview.scores.accessibility >= 90) strengths.push('Excellent accessibility (WCAG AAA)');
        if (overview.scores.performance >= 90) strengths.push('High performance scores');
        if (overview.scores.seo >= 90) strengths.push('SEO optimized');
        if (overview.scores.conversion >= 80) strengths.push('Good conversion elements');
        
        return strengths;
    }

    generateFinalRecommendations() {
        const recommendations = {
            immediate: [],
            shortTerm: [],
            longTerm: []
        };

        // Collect critical issues that need immediate attention
        if (this.results.accessibilityTests) {
            this.results.accessibilityTests.templateResults.forEach(template => {
                const criticalA11yIssues = template.results.filter(r => 
                    r.status === 'FAIL' && r.level === 'A'
                );
                
                criticalA11yIssues.forEach(issue => {
                    recommendations.immediate.push({
                        template: template.template,
                        priority: 'CRITICAL',
                        category: 'Accessibility',
                        issue: issue.test,
                        impact: 'Blocks users with disabilities',
                        solution: issue.recommendation
                    });
                });
            });
        }

        // Performance issues
        if (this.results.performanceTests) {
            this.results.performanceTests.recommendations.critical.forEach(rec => {
                recommendations.immediate.push({
                    template: rec.template,
                    priority: 'HIGH',
                    category: 'Performance',
                    issue: rec.issue,
                    impact: 'Poor user experience, SEO impact',
                    solution: rec.solution
                });
            });
        }

        // Short-term improvements
        if (this.results.templateTests) {
            this.results.templateTests.recommendations.important.forEach(rec => {
                recommendations.shortTerm.push({
                    template: rec.template,
                    category: rec.category,
                    issue: rec.test,
                    solution: rec.recommendation
                });
            });
        }

        // Long-term optimizations
        recommendations.longTerm.push({
            category: 'Monitoring',
            issue: 'Ongoing quality assurance',
            solution: 'Set up automated testing pipeline for continuous quality monitoring'
        });

        recommendations.longTerm.push({
            category: 'Performance',
            issue: 'Advanced optimization',
            solution: 'Implement advanced caching, CDN optimization, and image compression'
        });

        return recommendations;
    }

    generateExecutiveHTMLReport(report) {
        return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IT-ERA Templates - Executive Test Report</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        .status-ready { background: #198754; color: white; }
        .status-improvement { background: #ffc107; color: dark; }
        .status-fixes { background: #dc3545; color: white; }
        .score-excellent { color: #198754; font-weight: bold; }
        .score-good { color: #20c997; font-weight: bold; }
        .score-fair { color: #ffc107; font-weight: bold; }
        .score-poor { color: #dc3545; font-weight: bold; }
        .executive-summary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    </style>
</head>
<body class="bg-light">
    <div class="executive-summary text-white py-5 mb-5">
        <div class="container">
            <h1 class="display-4 fw-bold mb-3">🏆 IT-ERA Templates Quality Report</h1>
            <p class="lead">Comprehensive testing results for production readiness</p>
            <div class="row mt-4">
                <div class="col-md-3">
                    <div class="text-center">
                        <div class="display-6 fw-bold">${report.businessReadiness.summary.totalTemplates}</div>
                        <div>Total Templates</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="text-center">
                        <div class="display-6 fw-bold">${report.businessReadiness.summary.productionReady}</div>
                        <div>Production Ready</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="text-center">
                        <div class="display-6 fw-bold">${report.businessReadiness.summary.needsFixes}</div>
                        <div>Need Fixes</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="text-center">
                        <div class="display-6 fw-bold">${report.businessReadiness.summary.estimatedFixTime}</div>
                        <div>Fix Time</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="container">
        <!-- Template Overview -->
        <div class="row mb-5">
            <div class="col-12">
                <h2 class="mb-4">📊 Template Quality Overview</h2>
            </div>
            ${Object.entries(report.overview).map(([template, overview]) => `
            <div class="col-md-4 mb-4">
                <div class="card h-100">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">${template.replace('.html', '').replace('-', ' ').toUpperCase()}</h5>
                        <span class="badge status-${overview.status === 'PRODUCTION_READY' ? 'ready' : overview.status === 'NEEDS_IMPROVEMENT' ? 'improvement' : 'fixes'}">
                            ${overview.status.replace('_', ' ')}
                        </span>
                    </div>
                    <div class="card-body">
                        <div class="row mb-3">
                            <div class="col-6">
                                <div class="text-center">
                                    <div class="h3 mb-0 ${overview.scores.overall >= 90 ? 'score-excellent' : overview.scores.overall >= 80 ? 'score-good' : overview.scores.overall >= 70 ? 'score-fair' : 'score-poor'}">${overview.scores.overall}%</div>
                                    <small class="text-muted">Overall Score</small>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="small">
                                    <div>SEO: ${overview.scores.seo}%</div>
                                    <div>Accessibility: ${overview.scores.accessibility}%</div>
                                    <div>Performance: ${overview.scores.performance}%</div>
                                </div>
                            </div>
                        </div>
                        
                        ${overview.issues.critical > 0 ? `
                        <div class="alert alert-danger py-2">
                            <small><strong>${overview.issues.critical} Critical Issues</strong> - Must fix before production</small>
                        </div>
                        ` : overview.issues.major > 0 ? `
                        <div class="alert alert-warning py-2">
                            <small><strong>${overview.issues.major} Major Issues</strong> - Should fix soon</small>
                        </div>
                        ` : `
                        <div class="alert alert-success py-2">
                            <small><strong>✓ Ready for Production</strong></small>
                        </div>
                        `}
                    </div>
                </div>
            </div>
            `).join('')}
        </div>

        <!-- Business Readiness -->
        <div class="row mb-5">
            <div class="col-12">
                <h2 class="mb-4">🚀 Business Readiness Assessment</h2>
            </div>
            
            ${report.businessReadiness.readyForProduction.length > 0 ? `
            <div class="col-md-4">
                <div class="card border-success">
                    <div class="card-header bg-success text-white">
                        <h5 class="mb-0">✅ Production Ready (${report.businessReadiness.readyForProduction.length})</h5>
                    </div>
                    <div class="card-body">
                        ${report.businessReadiness.readyForProduction.map(template => `
                        <div class="mb-3">
                            <h6>${template.template} <span class="badge bg-success">${template.score}%</span></h6>
                            <ul class="small mb-0">
                                ${template.strengths.map(strength => `<li>${strength}</li>`).join('')}
                            </ul>
                        </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            ` : ''}

            ${report.businessReadiness.needsMinorFixes.length > 0 ? `
            <div class="col-md-4">
                <div class="card border-warning">
                    <div class="card-header bg-warning">
                        <h5 class="mb-0">⚠️ Minor Fixes Needed (${report.businessReadiness.needsMinorFixes.length})</h5>
                    </div>
                    <div class="card-body">
                        ${report.businessReadiness.needsMinorFixes.map(template => `
                        <div class="mb-3">
                            <h6>${template.template} <span class="badge bg-warning">${template.score}%</span></h6>
                            <small class="text-muted">Est. ${template.estimatedHours} hours to fix</small>
                        </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            ` : ''}

            ${report.businessReadiness.needsMajorFixes.length > 0 ? `
            <div class="col-md-4">
                <div class="card border-danger">
                    <div class="card-header bg-danger text-white">
                        <h5 class="mb-0">🔥 Major Fixes Needed (${report.businessReadiness.needsMajorFixes.length})</h5>
                    </div>
                    <div class="card-body">
                        ${report.businessReadiness.needsMajorFixes.map(template => `
                        <div class="mb-3">
                            <h6>${template.template} <span class="badge bg-danger">${template.score}%</span></h6>
                            <small class="text-muted">Est. ${template.estimatedHours} hours to fix</small>
                        </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            ` : ''}
        </div>

        <!-- Action Items -->
        <div class="row mb-5">
            <div class="col-12">
                <h2 class="mb-4">🎯 Action Items & Recommendations</h2>
            </div>
            
            ${report.finalRecommendations.immediate.length > 0 ? `
            <div class="col-12 mb-4">
                <div class="card border-danger">
                    <div class="card-header bg-danger text-white">
                        <h5 class="mb-0">🚨 Immediate Actions Required (${report.finalRecommendations.immediate.length})</h5>
                    </div>
                    <div class="card-body">
                        ${report.finalRecommendations.immediate.slice(0, 5).map(rec => `
                        <div class="alert alert-danger mb-3">
                            <div class="row">
                                <div class="col-md-8">
                                    <h6 class="mb-1">${rec.template} - ${rec.issue}</h6>
                                    <p class="mb-1 small"><strong>Impact:</strong> ${rec.impact}</p>
                                </div>
                                <div class="col-md-4">
                                    <span class="badge bg-danger">${rec.priority}</span>
                                    <span class="badge bg-secondary ms-1">${rec.category}</span>
                                </div>
                            </div>
                            <p class="mb-0 small"><strong>Solution:</strong> ${rec.solution}</p>
                        </div>
                        `).join('')}
                        ${report.finalRecommendations.immediate.length > 5 ? `
                        <p class="text-muted"><em>... and ${report.finalRecommendations.immediate.length - 5} more immediate items</em></p>
                        ` : ''}
                    </div>
                </div>
            </div>
            ` : ''}
        </div>

        <!-- Test Details Links -->
        <div class="row mb-5">
            <div class="col-12">
                <h2 class="mb-4">📋 Detailed Test Reports</h2>
                <div class="row">
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-body text-center">
                                <h5>🔍 Template Quality</h5>
                                <p class="text-muted">SEO, Forms, Conversion, Placeholders</p>
                                <a href="template-test-report-${report.testDate}.html" class="btn btn-primary">View Report</a>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-body text-center">
                                <h5>♿ Accessibility</h5>
                                <p class="text-muted">WCAG AAA Compliance Testing</p>
                                <a href="accessibility-report-${report.testDate}.html" class="btn btn-primary">View Report</a>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-body text-center">
                                <h5>⚡ Performance</h5>
                                <p class="text-muted">Core Web Vitals & Speed</p>
                                <a href="performance-report-${report.testDate}.html" class="btn btn-primary">View Report</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;
    }

    generateBusinessCSV(report) {
        const rows = ['Template,Overall Score,Status,SEO Score,Accessibility Score,Performance Score,Critical Issues,Major Issues,Production Ready,Estimated Fix Hours'];
        
        Object.entries(report.overview).forEach(([template, overview]) => {
            const businessData = report.businessReadiness.readyForProduction.find(t => t.template === template.replace('.html', '')) ||
                                report.businessReadiness.needsMinorFixes.find(t => t.template === template.replace('.html', '')) ||
                                report.businessReadiness.needsMajorFixes.find(t => t.template === template.replace('.html', ''));
            
            const estimatedHours = businessData?.estimatedHours || 0;
            
            rows.push([
                template.replace('.html', ''),
                overview.scores.overall,
                overview.status,
                overview.scores.seo,
                overview.scores.accessibility,
                overview.scores.performance,
                overview.issues.critical,
                overview.issues.major,
                overview.status === 'PRODUCTION_READY' ? 'YES' : 'NO',
                estimatedHours
            ].join(','));
        });
        
        return rows.join('\n');
    }

    displayFinalSummary() {
        const endTime = Date.now();
        const duration = Math.round((endTime - this.startTime) / 1000);
        
        console.log('\n' + '='.repeat(80));
        console.log('🏆 IT-ERA TEMPLATE TEST SUITE - FINAL SUMMARY');
        console.log('='.repeat(80));
        
        console.log(`\n⏱️  Test Duration: ${duration} seconds`);
        console.log(`📅 Test Date: ${new Date().toISOString().split('T')[0]}`);
        
        const businessReadiness = this.assessBusinessReadiness();
        
        console.log('\n📊 BUSINESS READINESS:');
        console.log(`  ✅ Production Ready: ${businessReadiness.readyForProduction.length}/3 templates`);
        console.log(`  ⚠️  Need Fixes: ${businessReadiness.needsMinorFixes.length + businessReadiness.needsMajorFixes.length}/3 templates`);
        console.log(`  🕐 Estimated Fix Time: ${businessReadiness.summary.estimatedFixTime}`);
        
        if (businessReadiness.readyForProduction.length > 0) {
            console.log('\n✅ READY FOR PRODUCTION:');
            businessReadiness.readyForProduction.forEach(template => {
                console.log(`  - ${template.template}: ${template.score}% overall`);
            });
        }
        
        if (businessReadiness.needsMinorFixes.length > 0) {
            console.log('\n⚠️  NEED MINOR FIXES:');
            businessReadiness.needsMinorFixes.forEach(template => {
                console.log(`  - ${template.template}: ${template.score}% (${template.estimatedHours}h fixes)`);
            });
        }
        
        if (businessReadiness.needsMajorFixes.length > 0) {
            console.log('\n🔥 NEED MAJOR FIXES:');
            businessReadiness.needsMajorFixes.forEach(template => {
                console.log(`  - ${template.template}: ${template.score}% (${template.estimatedHours}h fixes)`);
            });
        }
        
        console.log('\n📋 NEXT STEPS:');
        console.log('  1. Review detailed HTML reports for specific issues');
        console.log('  2. Fix critical accessibility and performance issues first');
        console.log('  3. Implement recommended SEO and conversion optimizations');
        console.log('  4. Test template placeholder replacement system');
        console.log('  5. Set up automated testing pipeline for continuous monitoring');
        
        console.log('\n🎯 REPORTS GENERATED:');
        console.log('  - Master executive report (HTML)');
        console.log('  - Business summary (CSV)'); 
        console.log('  - Detailed technical reports (HTML + JSON)');
        
        console.log('\n' + '='.repeat(80));
        console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY!');
        console.log('='.repeat(80));
    }
}

// Run all tests if called directly
if (require.main === module) {
    const masterRunner = new ITEraMasterTestRunner();
    masterRunner.runAllTests()
        .then(() => {
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Master test runner failed:', error);
            process.exit(1);
        });
}

module.exports = ITEraMasterTestRunner;