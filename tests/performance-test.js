/**
 * IT-ERA Templates Performance Test Suite
 * Tests loading times, Core Web Vitals, and performance optimization
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class ITEraPerformanceTestSuite {
    constructor() {
        this.results = [];
        this.templates = [
            {
                name: 'assistenza-it-template-new.html',
                path: '/Users/andreapanzeri/progetti/IT-ERA/templates/assistenza-it-template-new.html',
                type: 'assistenza-it'
            },
            {
                name: 'sicurezza-informatica-modern.html',
                path: '/Users/andreapanzeri/progetti/IT-ERA/templates/sicurezza-informatica-modern.html',
                type: 'sicurezza-informatica'
            },
            {
                name: 'cloud-storage-perfect.html',
                path: '/Users/andreapanzeri/progetti/IT-ERA/templates/cloud-storage-perfect.html',
                type: 'cloud-storage'
            }
        ];
    }

    async runPerformanceTests() {
        console.log('🚀 Starting IT-ERA Performance Test Suite...');
        
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        try {
            for (const template of this.templates) {
                console.log(`\n⚡ Performance testing: ${template.name}`);
                await this.testTemplatePerformance(browser, template);
            }
            
            await this.generatePerformanceReport();
        } finally {
            await browser.close();
        }
    }

    async testTemplatePerformance(browser, template) {
        const page = await browser.newPage();
        
        // Set up performance monitoring
        await page.setCacheEnabled(false);
        await page.setViewport({ width: 1920, height: 1080 });
        
        const performanceResults = {
            template: template.name,
            metrics: {},
            networkRequests: [],
            consoleErrors: [],
            accessibility: {},
            mobilePerformance: {}
        };

        // Listen for network requests
        page.on('request', request => {
            performanceResults.networkRequests.push({
                url: request.url(),
                method: request.method(),
                resourceType: request.resourceType()
            });
        });

        // Listen for console errors
        page.on('console', msg => {
            if (msg.type() === 'error') {
                performanceResults.consoleErrors.push(msg.text());
            }
        });

        try {
            // Load the template file
            const templateContent = await fs.readFile(template.path, 'utf8');
            await page.setContent(templateContent, { 
                waitUntil: 'networkidle0',
                timeout: 30000 
            });

            // Measure Core Web Vitals and Performance Metrics
            const metrics = await page.evaluate(() => {
                return new Promise((resolve) => {
                    const measurements = {};
                    
                    // Performance Observer for Core Web Vitals
                    if ('PerformanceObserver' in window) {
                        let lcp = 0;
                        let fid = 0;
                        let cls = 0;

                        // LCP Observer
                        try {
                            const lcpObserver = new PerformanceObserver((list) => {
                                const entries = list.getEntries();
                                if (entries.length > 0) {
                                    lcp = entries[entries.length - 1].startTime;
                                }
                            });
                            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
                        } catch (e) {}

                        // Layout Shift Observer
                        try {
                            const clsObserver = new PerformanceObserver((list) => {
                                for (const entry of list.getEntries()) {
                                    if (!entry.hadRecentInput) {
                                        cls += entry.value;
                                    }
                                }
                            });
                            clsObserver.observe({ entryTypes: ['layout-shift'] });
                        } catch (e) {}

                        measurements.lcp = lcp;
                        measurements.cls = cls;
                        measurements.fid = fid;
                    }

                    // Basic performance measurements
                    const navigation = performance.getEntriesByType('navigation')[0];
                    if (navigation) {
                        measurements.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.navigationStart;
                        measurements.loadComplete = navigation.loadEventEnd - navigation.navigationStart;
                        measurements.firstPaint = 0;
                        measurements.firstContentfulPaint = 0;

                        // Paint timings
                        const paintEntries = performance.getEntriesByType('paint');
                        for (const entry of paintEntries) {
                            if (entry.name === 'first-paint') {
                                measurements.firstPaint = entry.startTime;
                            } else if (entry.name === 'first-contentful-paint') {
                                measurements.firstContentfulPaint = entry.startTime;
                            }
                        }
                    }

                    // Resource timings
                    const resources = performance.getEntriesByType('resource');
                    measurements.totalResources = resources.length;
                    measurements.totalResourceSize = resources.reduce((total, resource) => {
                        return total + (resource.transferSize || 0);
                    }, 0);

                    // DOM complexity
                    measurements.domElements = document.getElementsByTagName('*').length;
                    measurements.images = document.images.length;
                    measurements.scripts = document.scripts.length;
                    measurements.stylesheets = document.styleSheets.length;

                    setTimeout(() => resolve(measurements), 2000);
                });
            });

            performanceResults.metrics = metrics;

            // Test mobile performance
            await page.setViewport({ width: 375, height: 667 }); // iPhone viewport
            await page.waitForTimeout(1000);
            
            const mobileMetrics = await page.evaluate(() => {
                const measurements = {};
                
                // Check for mobile-specific optimizations
                measurements.hasViewportMeta = !!document.querySelector('meta[name="viewport"]');
                measurements.hasResponsiveImages = document.querySelectorAll('img[srcset], img[sizes]').length;
                measurements.hasTouchTargets = document.querySelectorAll('button, .btn, a[class*="btn"]').length;
                
                // Check for mobile-unfriendly elements
                measurements.smallText = Array.from(document.querySelectorAll('*')).filter(el => {
                    const style = window.getComputedStyle(el);
                    const fontSize = parseFloat(style.fontSize);
                    return fontSize > 0 && fontSize < 12;
                }).length;

                return measurements;
            });

            performanceResults.mobilePerformance = mobileMetrics;

            // Accessibility audit (basic)
            const accessibilityResults = await page.evaluate(() => {
                const audit = {};
                
                // Alt text coverage
                const images = document.querySelectorAll('img');
                const imagesWithoutAlt = Array.from(images).filter(img => !img.alt).length;
                audit.imageAltCoverage = images.length > 0 ? ((images.length - imagesWithoutAlt) / images.length) * 100 : 100;
                
                // Form label coverage
                const inputs = document.querySelectorAll('input, textarea, select');
                let labeledInputs = 0;
                inputs.forEach(input => {
                    if (input.labels && input.labels.length > 0 || 
                        input.getAttribute('aria-label') || 
                        input.getAttribute('placeholder')) {
                        labeledInputs++;
                    }
                });
                audit.formLabelCoverage = inputs.length > 0 ? (labeledInputs / inputs.length) * 100 : 100;
                
                // Heading structure
                const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
                audit.headingCount = headings.length;
                audit.hasH1 = !!document.querySelector('h1');
                
                // Skip links
                audit.hasSkipLink = !!document.querySelector('.skip-link, a[href="#main-content"]');
                
                // Color contrast (basic check)
                const darkBackgrounds = document.querySelectorAll('.bg-dark, .navbar-dark, [style*="background: #"], [style*="background-color: #"]');
                audit.potentialContrastIssues = darkBackgrounds.length;

                return audit;
            });

            performanceResults.accessibility = accessibilityResults;

        } catch (error) {
            performanceResults.error = error.message;
            console.error(`❌ Error testing ${template.name}:`, error.message);
        }

        await page.close();
        this.results.push(performanceResults);
    }

    async generatePerformanceReport() {
        const reportDate = new Date().toISOString().split('T')[0];
        
        // Analyze results
        const analysis = this.analyzeResults();
        
        const report = {
            testDate: reportDate,
            summary: analysis.summary,
            detailed: this.results,
            recommendations: analysis.recommendations,
            benchmarks: {
                loadTime: { excellent: 1000, good: 2500, poor: 4000 },
                lcp: { excellent: 2500, good: 4000, poor: 6000 },
                cls: { excellent: 0.1, good: 0.25, poor: 0.5 },
                accessibility: { excellent: 95, good: 85, poor: 70 }
            }
        };

        // Write JSON report
        const jsonPath = `/Users/andreapanzeri/progetti/IT-ERA/tests/performance-report-${reportDate}.json`;
        await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));

        // Write HTML report
        const htmlPath = `/Users/andreapanzeri/progetti/IT-ERA/tests/performance-report-${reportDate}.html`;
        await fs.writeFile(htmlPath, this.generateHTMLReport(report));

        console.log(`\n📊 Performance Report Generated:`);
        console.log(`- JSON: ${jsonPath}`);
        console.log(`- HTML: ${htmlPath}`);
        
        // Display quick summary
        console.log('\n📈 Quick Summary:');
        Object.entries(analysis.summary).forEach(([template, summary]) => {
            console.log(`  ${template}: Score ${summary.overallScore}% (${summary.grade})`);
        });

        return report;
    }

    analyzeResults() {
        const summary = {};
        const recommendations = { critical: [], important: [], minor: [] };

        this.results.forEach(result => {
            const templateSummary = {
                loadTime: result.metrics?.loadComplete || 0,
                lcp: result.metrics?.lcp || 0,
                cls: result.metrics?.cls || 0,
                accessibility: this.calculateAccessibilityScore(result.accessibility),
                mobileOptimization: this.calculateMobileScore(result.mobilePerformance),
                resourceCount: result.networkRequests?.length || 0,
                consoleErrors: result.consoleErrors?.length || 0
            };

            // Calculate overall score
            let score = 100;
            
            // Performance scoring
            if (templateSummary.loadTime > 4000) score -= 20;
            else if (templateSummary.loadTime > 2500) score -= 10;
            
            if (templateSummary.lcp > 4000) score -= 15;
            else if (templateSummary.lcp > 2500) score -= 8;
            
            if (templateSummary.cls > 0.25) score -= 15;
            else if (templateSummary.cls > 0.1) score -= 8;
            
            // Accessibility scoring
            if (templateSummary.accessibility < 70) score -= 20;
            else if (templateSummary.accessibility < 85) score -= 10;
            
            // Console errors penalty
            score -= Math.min(templateSummary.consoleErrors * 5, 20);
            
            templateSummary.overallScore = Math.max(0, Math.round(score));
            templateSummary.grade = this.getPerformanceGrade(templateSummary.overallScore);

            summary[result.template] = templateSummary;

            // Generate recommendations
            this.generateRecommendationsForTemplate(result, templateSummary, recommendations);
        });

        return { summary, recommendations };
    }

    calculateAccessibilityScore(accessibility) {
        if (!accessibility) return 0;
        
        let score = 0;
        let maxScore = 0;

        if (typeof accessibility.imageAltCoverage === 'number') {
            score += accessibility.imageAltCoverage;
            maxScore += 100;
        }

        if (typeof accessibility.formLabelCoverage === 'number') {
            score += accessibility.formLabelCoverage;
            maxScore += 100;
        }

        if (accessibility.hasH1) {
            score += 20;
            maxScore += 20;
        }

        if (accessibility.hasSkipLink) {
            score += 10;
            maxScore += 10;
        }

        return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    }

    calculateMobileScore(mobilePerformance) {
        if (!mobilePerformance) return 0;
        
        let score = 0;
        let maxScore = 0;

        if (mobilePerformance.hasViewportMeta) {
            score += 25;
        }
        maxScore += 25;

        if (mobilePerformance.hasResponsiveImages > 0) {
            score += 15;
        }
        maxScore += 15;

        if (mobilePerformance.hasTouchTargets > 0) {
            score += 20;
        }
        maxScore += 20;

        // Penalty for small text
        const smallTextPenalty = Math.min(mobilePerformance.smallText * 2, 30);
        score = Math.max(0, score - smallTextPenalty);
        maxScore += 10; // Base mobile optimization score

        return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    }

    getPerformanceGrade(score) {
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    }

    generateRecommendationsForTemplate(result, summary, recommendations) {
        const template = result.template;

        // Critical issues
        if (summary.loadTime > 4000) {
            recommendations.critical.push({
                template,
                issue: 'Slow page load time',
                detail: `Load time: ${summary.loadTime}ms (target: <2500ms)`,
                solution: 'Optimize images, reduce HTTP requests, enable compression'
            });
        }

        if (summary.accessibility < 70) {
            recommendations.critical.push({
                template,
                issue: 'Poor accessibility score',
                detail: `Accessibility: ${summary.accessibility}% (target: >85%)`,
                solution: 'Add alt text to images, improve form labels, fix heading structure'
            });
        }

        if (summary.consoleErrors > 0) {
            recommendations.critical.push({
                template,
                issue: 'JavaScript errors detected',
                detail: `${summary.consoleErrors} console errors found`,
                solution: 'Fix JavaScript errors that may impact functionality'
            });
        }

        // Important issues
        if (summary.lcp > 2500) {
            recommendations.important.push({
                template,
                issue: 'Large Contentful Paint (LCP) too slow',
                detail: `LCP: ${summary.lcp}ms (target: <2500ms)`,
                solution: 'Optimize largest content element, preload critical resources'
            });
        }

        if (summary.cls > 0.1) {
            recommendations.important.push({
                template,
                issue: 'Cumulative Layout Shift (CLS) too high',
                detail: `CLS: ${summary.cls} (target: <0.1)`,
                solution: 'Reserve space for images, avoid inserting content dynamically'
            });
        }

        if (summary.resourceCount > 50) {
            recommendations.important.push({
                template,
                issue: 'Too many HTTP requests',
                detail: `${summary.resourceCount} requests (target: <30)`,
                solution: 'Combine CSS/JS files, use CSS sprites, optimize images'
            });
        }

        // Minor improvements
        if (!result.mobilePerformance?.hasViewportMeta) {
            recommendations.minor.push({
                template,
                issue: 'Missing viewport meta tag',
                detail: 'Viewport meta tag not found',
                solution: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0">'
            });
        }

        if (result.mobilePerformance?.smallText > 5) {
            recommendations.minor.push({
                template,
                issue: 'Small text elements on mobile',
                detail: `${result.mobilePerformance.smallText} elements with text <12px`,
                solution: 'Ensure text is at least 16px on mobile for readability'
            });
        }
    }

    generateHTMLReport(report) {
        return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IT-ERA Performance Test Report - ${report.testDate}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        .score-a { background: #198754; color: white; }
        .score-b { background: #20c997; color: white; }
        .score-c { background: #ffc107; color: dark; }
        .score-d { background: #fd7e14; color: white; }
        .score-f { background: #dc3545; color: white; }
        .metric-excellent { color: #198754; }
        .metric-good { color: #20c997; }
        .metric-poor { color: #dc3545; }
    </style>
</head>
<body class="bg-light">
    <div class="container py-5">
        <h1 class="mb-4">⚡ IT-ERA Performance Test Report</h1>
        <p class="text-muted">Generated on ${report.testDate}</p>

        <!-- Summary Cards -->
        <div class="row mb-5">
            ${Object.entries(report.summary).map(([template, summary]) => `
            <div class="col-md-4 mb-3">
                <div class="card">
                    <div class="card-header d-flex justify-content-between">
                        <h6 class="mb-0">${template.replace('.html', '')}</h6>
                        <span class="badge score-${summary.grade.toLowerCase()}">${summary.overallScore}% (${summary.grade})</span>
                    </div>
                    <div class="card-body">
                        <div class="row small">
                            <div class="col-6">
                                <div class="${summary.loadTime < 2500 ? 'metric-excellent' : summary.loadTime < 4000 ? 'metric-good' : 'metric-poor'}">${summary.loadTime}ms</div>
                                <div class="text-muted">Load Time</div>
                            </div>
                            <div class="col-6">
                                <div class="${summary.lcp < 2500 ? 'metric-excellent' : summary.lcp < 4000 ? 'metric-good' : 'metric-poor'}">${summary.lcp}ms</div>
                                <div class="text-muted">LCP</div>
                            </div>
                            <div class="col-6">
                                <div class="${summary.cls < 0.1 ? 'metric-excellent' : summary.cls < 0.25 ? 'metric-good' : 'metric-poor'}">${summary.cls.toFixed(3)}</div>
                                <div class="text-muted">CLS</div>
                            </div>
                            <div class="col-6">
                                <div class="${summary.accessibility >= 85 ? 'metric-excellent' : summary.accessibility >= 70 ? 'metric-good' : 'metric-poor'}">${summary.accessibility}%</div>
                                <div class="text-muted">A11y</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            `).join('')}
        </div>

        <!-- Performance Chart -->
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="mb-0">Performance Comparison</h5>
            </div>
            <div class="card-body">
                <canvas id="performanceChart" height="100"></canvas>
            </div>
        </div>

        <!-- Recommendations -->
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">📋 Performance Recommendations</h5>
            </div>
            <div class="card-body">
                ${report.recommendations.critical.length > 0 ? `
                <h6 class="text-danger">🚨 Critical Issues</h6>
                <div class="row mb-4">
                    ${report.recommendations.critical.map(rec => `
                    <div class="col-md-6 mb-3">
                        <div class="card border-danger">
                            <div class="card-body">
                                <h6 class="text-danger">${rec.issue}</h6>
                                <p class="small mb-2"><strong>${rec.template}:</strong> ${rec.detail}</p>
                                <p class="small text-success mb-0"><strong>Solution:</strong> ${rec.solution}</p>
                            </div>
                        </div>
                    </div>
                    `).join('')}
                </div>
                ` : ''}

                ${report.recommendations.important.length > 0 ? `
                <h6 class="text-warning">⚠️ Important Issues</h6>
                <div class="row mb-4">
                    ${report.recommendations.important.map(rec => `
                    <div class="col-md-6 mb-3">
                        <div class="card border-warning">
                            <div class="card-body">
                                <h6 class="text-warning">${rec.issue}</h6>
                                <p class="small mb-2"><strong>${rec.template}:</strong> ${rec.detail}</p>
                                <p class="small text-success mb-0"><strong>Solution:</strong> ${rec.solution}</p>
                            </div>
                        </div>
                    </div>
                    `).join('')}
                </div>
                ` : ''}

                ${report.recommendations.minor.length > 0 ? `
                <h6 class="text-info">💡 Minor Improvements</h6>
                <div class="row">
                    ${report.recommendations.minor.map(rec => `
                    <div class="col-md-6 mb-3">
                        <div class="card border-info">
                            <div class="card-body">
                                <h6 class="text-info">${rec.issue}</h6>
                                <p class="small mb-2"><strong>${rec.template}:</strong> ${rec.detail}</p>
                                <p class="small text-success mb-0"><strong>Solution:</strong> ${rec.solution}</p>
                            </div>
                        </div>
                    </div>
                    `).join('')}
                </div>
                ` : ''}
            </div>
        </div>
    </div>

    <script>
        // Performance Chart
        const ctx = document.getElementById('performanceChart').getContext('2d');
        new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Load Time', 'LCP', 'CLS', 'Accessibility', 'Mobile', 'Resources'],
                datasets: [
                    ${Object.entries(report.summary).map(([template, summary], index) => `
                    {
                        label: '${template.replace('.html', '')}',
                        data: [
                            ${Math.max(0, 100 - (summary.loadTime / 50))},
                            ${Math.max(0, 100 - (summary.lcp / 50))},
                            ${Math.max(0, 100 - (summary.cls * 400))},
                            ${summary.accessibility},
                            ${summary.mobileOptimization},
                            ${Math.max(0, 100 - summary.resourceCount)}
                        ],
                        borderColor: '${['#dc3545', '#198754', '#0dcaf0'][index]}',
                        backgroundColor: '${['rgba(220,53,69,0.2)', 'rgba(25,135,84,0.2)', 'rgba(13,202,240,0.2)'][index]}',
                        pointBackgroundColor: '${['#dc3545', '#198754', '#0dcaf0'][index]}'
                    }
                    `).join(',')}
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    </script>
</body>
</html>`;
    }
}

module.exports = ITEraPerformanceTestSuite;

// Run performance tests if called directly
if (require.main === module) {
    const testSuite = new ITEraPerformanceTestSuite();
    testSuite.runPerformanceTests()
        .then(() => console.log('✅ Performance tests completed successfully'))
        .catch(error => console.error('❌ Performance test suite failed:', error));
}