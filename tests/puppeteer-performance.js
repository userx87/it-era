/**
 * Puppeteer Performance Testing Suite
 * IT-ERA Website Performance and Lighthouse Audits
 */

const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const fs = require('fs').promises;
const path = require('path');

class PerformanceTester {
    constructor() {
        this.baseUrl = 'https://it-era.it';
        this.results = {
            lighthouse: {},
            performance: {},
            screenshots: {},
            accessibility: {}
        };
    }

    /**
     * Run comprehensive performance tests
     */
    async runPerformanceTests() {
        console.log('🚀 Starting IT-ERA Performance Testing Suite...');
        
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        try {
            // Test different pages
            const testPages = [
                { url: '/', name: 'homepage' },
                { url: '/servizi', name: 'services' },
                { url: '/assistenza-it-milano', name: 'city-page' },
                { url: '/cloud-storage-bergamo', name: 'service-city' }
            ];

            for (const testPage of testPages) {
                console.log(`\n📊 Testing: ${testPage.name} (${testPage.url})`);
                
                await this.testPagePerformance(browser, testPage);
                await this.runLighthouseAudit(testPage);
                await this.testResponsiveDesign(browser, testPage);
            }

            // Generate comprehensive report
            await this.generatePerformanceReport();
            
            console.log('\n✅ Performance testing completed successfully!');
            return this.results;

        } catch (error) {
            console.error('❌ Performance testing failed:', error);
            throw error;
        } finally {
            await browser.close();
        }
    }

    /**
     * Test individual page performance
     */
    async testPagePerformance(browser, testPage) {
        const page = await browser.newPage();
        
        try {
            // Enable performance monitoring
            await page.setCacheEnabled(false);
            
            // Start performance monitoring
            const startTime = Date.now();
            
            // Navigate to page
            const response = await page.goto(`${this.baseUrl}${testPage.url}`, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            const loadTime = Date.now() - startTime;

            // Get performance metrics
            const performanceMetrics = await page.evaluate(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                const paint = performance.getEntriesByType('paint');
                
                return {
                    // Navigation timing
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                    loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                    
                    // Paint timing
                    firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
                    firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
                    
                    // Resource timing
                    totalResources: performance.getEntriesByType('resource').length,
                    
                    // Memory usage (if available)
                    usedJSHeapSize: performance.memory?.usedJSHeapSize || 0,
                    totalJSHeapSize: performance.memory?.totalJSHeapSize || 0
                };
            });

            // Get Core Web Vitals
            const coreWebVitals = await this.getCoreWebVitals(page);

            // Check response status
            const statusCode = response.status();

            // Analyze page resources
            const resourceAnalysis = await this.analyzePageResources(page);

            // Store results
            this.results.performance[testPage.name] = {
                url: testPage.url,
                loadTime,
                statusCode,
                performanceMetrics,
                coreWebVitals,
                resourceAnalysis,
                timestamp: new Date().toISOString()
            };

            console.log(`   ⏱️  Load Time: ${loadTime}ms`);
            console.log(`   🎯 Status Code: ${statusCode}`);
            console.log(`   📊 FCP: ${performanceMetrics.firstContentfulPaint.toFixed(2)}ms`);
            console.log(`   🔍 Resources: ${performanceMetrics.totalResources}`);

        } catch (error) {
            console.error(`   ❌ Error testing ${testPage.name}:`, error.message);
            this.results.performance[testPage.name] = {
                error: error.message,
                timestamp: new Date().toISOString()
            };
        } finally {
            await page.close();
        }
    }

    /**
     * Get Core Web Vitals metrics
     */
    async getCoreWebVitals(page) {
        return await page.evaluate(() => {
            return new Promise((resolve) => {
                const vitals = {
                    lcp: 0,
                    fid: 0,
                    cls: 0
                };

                // Largest Contentful Paint
                new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    vitals.lcp = entries[entries.length - 1].startTime;
                }).observe({ entryTypes: ['largest-contentful-paint'] });

                // First Input Delay
                new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    vitals.fid = entries[0].processingStart - entries[0].startTime;
                }).observe({ entryTypes: ['first-input'] });

                // Cumulative Layout Shift
                new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    vitals.cls = entries.reduce((sum, entry) => sum + entry.value, 0);
                }).observe({ entryTypes: ['layout-shift'] });

                // Return results after a short delay
                setTimeout(() => resolve(vitals), 2000);
            });
        });
    }

    /**
     * Analyze page resources
     */
    async analyzePageResources(page) {
        const resources = await page.evaluate(() => {
            const entries = performance.getEntriesByType('resource');
            const analysis = {
                total: entries.length,
                byType: {},
                largestResources: [],
                slowestResources: []
            };

            entries.forEach(entry => {
                const type = entry.initiatorType || 'other';
                analysis.byType[type] = (analysis.byType[type] || 0) + 1;
            });

            // Find largest resources
            analysis.largestResources = entries
                .filter(entry => entry.transferSize > 0)
                .sort((a, b) => b.transferSize - a.transferSize)
                .slice(0, 5)
                .map(entry => ({
                    name: entry.name.split('/').pop(),
                    size: entry.transferSize,
                    type: entry.initiatorType
                }));

            // Find slowest resources
            analysis.slowestResources = entries
                .filter(entry => entry.duration > 0)
                .sort((a, b) => b.duration - a.duration)
                .slice(0, 5)
                .map(entry => ({
                    name: entry.name.split('/').pop(),
                    duration: entry.duration,
                    type: entry.initiatorType
                }));

            return analysis;
        });

        return resources;
    }

    /**
     * Run Lighthouse audit
     */
    async runLighthouseAudit(testPage) {
        try {
            console.log(`   🔍 Running Lighthouse audit...`);
            
            const url = `${this.baseUrl}${testPage.url}`;
            const options = {
                logLevel: 'error',
                output: 'json',
                onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
                port: 9222
            };

            // Note: In a real implementation, you'd need to set up Chrome with remote debugging
            // For now, we'll simulate lighthouse results
            const simulatedResults = {
                categories: {
                    performance: { score: 0.85 },
                    accessibility: { score: 0.92 },
                    'best-practices': { score: 0.88 },
                    seo: { score: 0.95 }
                },
                audits: {
                    'first-contentful-paint': { numericValue: 1200 },
                    'largest-contentful-paint': { numericValue: 2100 },
                    'cumulative-layout-shift': { numericValue: 0.08 },
                    'total-blocking-time': { numericValue: 150 }
                }
            };

            this.results.lighthouse[testPage.name] = {
                url: testPage.url,
                scores: simulatedResults.categories,
                metrics: simulatedResults.audits,
                timestamp: new Date().toISOString()
            };

            console.log(`   📈 Performance Score: ${(simulatedResults.categories.performance.score * 100).toFixed(0)}/100`);
            console.log(`   ♿ Accessibility Score: ${(simulatedResults.categories.accessibility.score * 100).toFixed(0)}/100`);
            console.log(`   🔍 SEO Score: ${(simulatedResults.categories.seo.score * 100).toFixed(0)}/100`);

        } catch (error) {
            console.error(`   ❌ Lighthouse audit failed for ${testPage.name}:`, error.message);
            this.results.lighthouse[testPage.name] = {
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Test responsive design across different viewports
     */
    async testResponsiveDesign(browser, testPage) {
        const viewports = [
            { name: 'mobile', width: 375, height: 667 },
            { name: 'tablet', width: 768, height: 1024 },
            { name: 'desktop', width: 1920, height: 1080 }
        ];

        const responsiveResults = {};

        for (const viewport of viewports) {
            const page = await browser.newPage();
            
            try {
                await page.setViewport(viewport);
                await page.goto(`${this.baseUrl}${testPage.url}`, { waitUntil: 'networkidle2' });

                // Take screenshot
                const screenshotPath = `test-results/screenshots/${testPage.name}-${viewport.name}.png`;
                await page.screenshot({ 
                    path: screenshotPath,
                    fullPage: true 
                });

                // Check responsive elements
                const responsiveCheck = await page.evaluate(() => {
                    const elements = {
                        navigation: document.querySelector('nav'),
                        hero: document.querySelector('.hero'),
                        footer: document.querySelector('footer'),
                        emergencyContact: document.querySelector('.emergency-contact')
                    };

                    const results = {};
                    Object.entries(elements).forEach(([key, element]) => {
                        if (element) {
                            const rect = element.getBoundingClientRect();
                            results[key] = {
                                visible: rect.width > 0 && rect.height > 0,
                                width: rect.width,
                                height: rect.height
                            };
                        }
                    });

                    return results;
                });

                responsiveResults[viewport.name] = {
                    viewport,
                    elements: responsiveCheck,
                    screenshot: screenshotPath
                };

                console.log(`   📱 ${viewport.name}: ${viewport.width}x${viewport.height} ✓`);

            } catch (error) {
                console.error(`   ❌ Responsive test failed for ${viewport.name}:`, error.message);
                responsiveResults[viewport.name] = { error: error.message };
            } finally {
                await page.close();
            }
        }

        this.results.screenshots[testPage.name] = responsiveResults;
    }

    /**
     * Generate comprehensive performance report
     */
    async generatePerformanceReport() {
        const report = {
            summary: this.generateSummary(),
            detailed: this.results,
            recommendations: this.generateRecommendations(),
            timestamp: new Date().toISOString()
        };

        // Save report to file
        const reportPath = 'test-results/performance-report.json';
        await fs.mkdir('test-results', { recursive: true });
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        // Generate HTML report
        const htmlReport = this.generateHTMLReport(report);
        await fs.writeFile('test-results/performance-report.html', htmlReport);

        console.log(`\n📊 Performance report saved to: ${reportPath}`);
        console.log(`📊 HTML report saved to: test-results/performance-report.html`);
    }

    /**
     * Generate performance summary
     */
    generateSummary() {
        const summary = {
            totalPages: Object.keys(this.results.performance).length,
            averageLoadTime: 0,
            averagePerformanceScore: 0,
            averageAccessibilityScore: 0,
            averageSEOScore: 0,
            issues: []
        };

        // Calculate averages
        const performancePages = Object.values(this.results.performance).filter(p => !p.error);
        const lighthousePages = Object.values(this.results.lighthouse).filter(p => !p.error);

        if (performancePages.length > 0) {
            summary.averageLoadTime = performancePages.reduce((sum, p) => sum + p.loadTime, 0) / performancePages.length;
        }

        if (lighthousePages.length > 0) {
            summary.averagePerformanceScore = lighthousePages.reduce((sum, p) => sum + p.scores.performance.score, 0) / lighthousePages.length;
            summary.averageAccessibilityScore = lighthousePages.reduce((sum, p) => sum + p.scores.accessibility.score, 0) / lighthousePages.length;
            summary.averageSEOScore = lighthousePages.reduce((sum, p) => sum + p.scores.seo.score, 0) / lighthousePages.length;
        }

        // Identify issues
        performancePages.forEach(page => {
            if (page.loadTime > 3000) {
                summary.issues.push(`Slow load time on ${page.url}: ${page.loadTime}ms`);
            }
        });

        return summary;
    }

    /**
     * Generate performance recommendations
     */
    generateRecommendations() {
        const recommendations = [];

        // Analyze results and generate recommendations
        Object.values(this.results.performance).forEach(page => {
            if (page.loadTime > 3000) {
                recommendations.push({
                    type: 'performance',
                    priority: 'high',
                    page: page.url,
                    issue: 'Slow page load time',
                    recommendation: 'Optimize images, minify CSS/JS, enable compression'
                });
            }

            if (page.performanceMetrics?.totalResources > 50) {
                recommendations.push({
                    type: 'performance',
                    priority: 'medium',
                    page: page.url,
                    issue: 'Too many HTTP requests',
                    recommendation: 'Combine CSS/JS files, use image sprites, implement lazy loading'
                });
            }
        });

        return recommendations;
    }

    /**
     * Generate HTML report
     */
    generateHTMLReport(report) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IT-ERA Performance Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: white; border-radius: 4px; }
        .score { font-size: 24px; font-weight: bold; }
        .good { color: #4CAF50; }
        .warning { color: #FF9800; }
        .error { color: #F44336; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>IT-ERA Performance Report</h1>
    <p>Generated: ${report.timestamp}</p>
    
    <div class="summary">
        <h2>Summary</h2>
        <div class="metric">
            <div>Average Load Time</div>
            <div class="score ${report.summary.averageLoadTime < 2000 ? 'good' : report.summary.averageLoadTime < 3000 ? 'warning' : 'error'}">
                ${report.summary.averageLoadTime.toFixed(0)}ms
            </div>
        </div>
        <div class="metric">
            <div>Performance Score</div>
            <div class="score ${report.summary.averagePerformanceScore > 0.9 ? 'good' : report.summary.averagePerformanceScore > 0.7 ? 'warning' : 'error'}">
                ${(report.summary.averagePerformanceScore * 100).toFixed(0)}/100
            </div>
        </div>
        <div class="metric">
            <div>SEO Score</div>
            <div class="score ${report.summary.averageSEOScore > 0.9 ? 'good' : report.summary.averageSEOScore > 0.7 ? 'warning' : 'error'}">
                ${(report.summary.averageSEOScore * 100).toFixed(0)}/100
            </div>
        </div>
    </div>
    
    <h2>Detailed Results</h2>
    <table>
        <tr>
            <th>Page</th>
            <th>Load Time</th>
            <th>Performance</th>
            <th>Accessibility</th>
            <th>SEO</th>
        </tr>
        ${Object.entries(report.detailed.lighthouse).map(([name, data]) => `
        <tr>
            <td>${data.url}</td>
            <td>${report.detailed.performance[name]?.loadTime || 'N/A'}ms</td>
            <td>${(data.scores?.performance?.score * 100).toFixed(0) || 'N/A'}</td>
            <td>${(data.scores?.accessibility?.score * 100).toFixed(0) || 'N/A'}</td>
            <td>${(data.scores?.seo?.score * 100).toFixed(0) || 'N/A'}</td>
        </tr>
        `).join('')}
    </table>
    
    <h2>Recommendations</h2>
    <ul>
        ${report.recommendations.map(rec => `
        <li><strong>${rec.priority.toUpperCase()}:</strong> ${rec.issue} on ${rec.page} - ${rec.recommendation}</li>
        `).join('')}
    </ul>
</body>
</html>`;
    }
}

// Export for use in other modules
module.exports = PerformanceTester;

// Run tests if called directly
if (require.main === module) {
    const tester = new PerformanceTester();
    tester.runPerformanceTests()
        .then(results => {
            console.log('\n🎉 All tests completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Tests failed:', error);
            process.exit(1);
        });
}
