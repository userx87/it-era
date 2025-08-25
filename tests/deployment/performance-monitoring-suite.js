/**
 * Performance Monitoring Suite for IT-ERA Chatbot
 * Real-time metrics collection and analysis
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;

class PerformanceMonitoringSuite {
    constructor() {
        this.browser = null;
        this.metrics = {
            timestamp: new Date().toISOString(),
            performance_data: [],
            resource_usage: {},
            response_times: {},
            bottleneck_analysis: {},
            optimization_recommendations: []
        };
        
        this.monitoringUrls = [
            'https://www.it-era.it',
            'https://www.it-era.it/pages/assistenza-it-milano.html',
            'https://www.it-era.it/pages/cloud-storage-bergamo.html',
            'https://www.it-era.it/pages/sicurezza-informatica-monza.html'
        ];
    }

    async initialize() {
        console.log('📊 Initializing Performance Monitoring Suite...');
        this.browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
    }

    async collectDetailedMetrics(url) {
        console.log(`🔍 Collecting detailed metrics for: ${url}`);
        const page = await this.browser.newPage();
        
        // Enable performance monitoring
        await page.setCacheEnabled(false);
        await page.coverage.startCSSCoverage();
        await page.coverage.startJSCoverage();
        
        try {
            const navigationStart = Date.now();
            
            // Navigate and collect timing metrics
            const response = await page.goto(url, { 
                waitUntil: 'networkidle2',
                timeout: 15000 
            });
            
            const navigationEnd = Date.now();
            const initialLoadTime = navigationEnd - navigationStart;
            
            // Wait for chatbot widget
            const chatbotStart = Date.now();
            await page.waitForSelector('#it-era-chatbot-widget', { timeout: 10000 });
            const chatbotLoadTime = Date.now() - chatbotStart;
            
            // Collect comprehensive performance data
            const performanceData = await page.evaluate(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                const paint = performance.getEntriesByType('paint');
                const resources = performance.getEntriesByType('resource');
                
                return {
                    navigation: {
                        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                        responseTime: navigation.responseEnd - navigation.responseStart,
                        domInteractive: navigation.domInteractive - navigation.navigationStart,
                        domComplete: navigation.domComplete - navigation.navigationStart
                    },
                    paint: paint.reduce((acc, entry) => {
                        acc[entry.name] = entry.startTime;
                        return acc;
                    }, {}),
                    resources: resources.length,
                    memory: performance.memory ? {
                        usedJSHeapSize: performance.memory.usedJSHeapSize,
                        totalJSHeapSize: performance.memory.totalJSHeapSize,
                        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                    } : null
                };
            });
            
            // Test chatbot interaction performance
            const interactionStart = Date.now();
            await page.click('#it-era-chatbot-widget');
            await page.waitForSelector('.chatbot-open', { timeout: 5000 });
            
            const messageInput = await page.waitForSelector('#chatbot-input', { timeout: 3000 });
            await messageInput.type('Test di performance');
            
            const sendStart = Date.now();
            await page.click('#chatbot-send-button');
            await page.waitForSelector('.chatbot-message.ai-response', { timeout: 15000 });
            const responseTime = Date.now() - sendStart;
            const totalInteractionTime = Date.now() - interactionStart;
            
            // Collect resource coverage data
            const jsCoverage = await page.coverage.stopJSCoverage();
            const cssCoverage = await page.coverage.stopCSSCoverage();
            
            const urlMetrics = {
                url,
                timestamp: new Date().toISOString(),
                load_times: {
                    initial_load: initialLoadTime,
                    chatbot_load: chatbotLoadTime,
                    interaction_response: responseTime,
                    total_interaction: totalInteractionTime
                },
                performance_data: performanceData,
                coverage: {
                    js_files: jsCoverage.length,
                    css_files: cssCoverage.length,
                    js_unused_bytes: jsCoverage.reduce((acc, entry) => acc + (entry.ranges.reduce((total, range) => total + range.end - range.start, 0)), 0)
                },
                http_status: response.status()
            };
            
            this.metrics.performance_data.push(urlMetrics);
            console.log(`✅ Metrics collected for ${url} - Load: ${initialLoadTime}ms, Chatbot: ${responseTime}ms`);
            
        } catch (error) {
            console.error(`❌ Failed to collect metrics for ${url}:`, error.message);
            this.metrics.performance_data.push({
                url,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        } finally {
            await page.close();
        }
    }

    async analyzeBottlenecks() {
        console.log('🔍 Analyzing performance bottlenecks...');
        
        const validMetrics = this.metrics.performance_data.filter(m => !m.error);
        
        if (validMetrics.length === 0) {
            console.warn('⚠️ No valid metrics to analyze');
            return;
        }
        
        // Calculate averages
        const avgLoadTime = validMetrics.reduce((sum, m) => sum + m.load_times.initial_load, 0) / validMetrics.length;
        const avgChatbotResponse = validMetrics.reduce((sum, m) => sum + m.load_times.interaction_response, 0) / validMetrics.length;
        const avgChatbotLoad = validMetrics.reduce((sum, m) => sum + m.load_times.chatbot_load, 0) / validMetrics.length;
        
        // Identify bottlenecks
        const bottlenecks = [];
        
        if (avgLoadTime > 3000) {
            bottlenecks.push({
                type: 'Page Load Time',
                severity: 'HIGH',
                current: `${avgLoadTime.toFixed(0)}ms`,
                target: '< 3000ms',
                impact: 'User experience and SEO ranking'
            });
        }
        
        if (avgChatbotResponse > 5000) {
            bottlenecks.push({
                type: 'Chatbot Response Time',
                severity: 'HIGH',
                current: `${avgChatbotResponse.toFixed(0)}ms`,
                target: '< 3000ms',
                impact: 'User engagement and conversion'
            });
        }
        
        if (avgChatbotLoad > 2000) {
            bottlenecks.push({
                type: 'Chatbot Widget Load',
                severity: 'MEDIUM',
                current: `${avgChatbotLoad.toFixed(0)}ms`,
                target: '< 1500ms',
                impact: 'Initial chatbot availability'
            });
        }
        
        // Check resource usage
        validMetrics.forEach(metric => {
            if (metric.performance_data.memory && metric.performance_data.memory.usedJSHeapSize > 50000000) {
                bottlenecks.push({
                    type: 'Memory Usage',
                    severity: 'MEDIUM',
                    current: `${(metric.performance_data.memory.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB`,
                    target: '< 50MB',
                    impact: 'Browser performance on low-end devices',
                    url: metric.url
                });
            }
        });
        
        this.metrics.bottleneck_analysis = {
            total_bottlenecks: bottlenecks.length,
            high_severity: bottlenecks.filter(b => b.severity === 'HIGH').length,
            medium_severity: bottlenecks.filter(b => b.severity === 'MEDIUM').length,
            bottlenecks,
            averages: {
                page_load: avgLoadTime,
                chatbot_response: avgChatbotResponse,
                chatbot_load: avgChatbotLoad
            }
        };
        
        console.log(`🎯 Bottleneck analysis complete: ${bottlenecks.length} issues found`);
    }

    generateOptimizationRecommendations() {
        console.log('💡 Generating optimization recommendations...');
        
        const recommendations = [];
        const bottlenecks = this.metrics.bottleneck_analysis.bottlenecks || [];
        
        // Page load optimizations
        if (bottlenecks.some(b => b.type === 'Page Load Time')) {
            recommendations.push({
                priority: 'HIGH',
                category: 'Page Performance',
                recommendation: 'Implement lazy loading for non-critical resources',
                implementation: 'Add loading="lazy" to images and defer non-essential JavaScript',
                expected_improvement: '20-30% load time reduction'
            });
            
            recommendations.push({
                priority: 'HIGH',
                category: 'Page Performance', 
                recommendation: 'Enable CDN and browser caching',
                implementation: 'Configure Cloudflare caching rules and set appropriate cache headers',
                expected_improvement: '40-50% load time reduction for returning visitors'
            });
        }
        
        // Chatbot optimizations
        if (bottlenecks.some(b => b.type === 'Chatbot Response Time')) {
            recommendations.push({
                priority: 'CRITICAL',
                category: 'Chatbot Performance',
                recommendation: 'Optimize AI response processing',
                implementation: 'Implement response caching for common queries and optimize worker processing',
                expected_improvement: '50-60% response time reduction'
            });
            
            recommendations.push({
                priority: 'HIGH',
                category: 'Chatbot Performance',
                recommendation: 'Add progressive loading for chatbot responses',
                implementation: 'Show typing indicators and stream responses progressively',
                expected_improvement: 'Better perceived performance'
            });
        }
        
        // Memory optimizations
        if (bottlenecks.some(b => b.type === 'Memory Usage')) {
            recommendations.push({
                priority: 'MEDIUM',
                category: 'Resource Management',
                recommendation: 'Implement memory cleanup for chatbot interactions',
                implementation: 'Clear old conversation data and optimize DOM manipulation',
                expected_improvement: '30-40% memory usage reduction'
            });
        }
        
        // General optimizations
        recommendations.push({
            priority: 'HIGH',
            category: 'Monitoring',
            recommendation: 'Implement real-time performance monitoring',
            implementation: 'Add performance tracking to chatbot worker and frontend',
            expected_improvement: 'Proactive issue detection and resolution'
        });
        
        this.metrics.optimization_recommendations = recommendations;
        console.log(`✅ Generated ${recommendations.length} optimization recommendations`);
    }

    async generateReport() {
        const reportPath = `/Users/andreapanzeri/progetti/IT-ERA/tests/deployment/performance-monitoring-report-${Date.now()}.json`;
        const htmlReportPath = `/Users/andreapanzeri/progetti/IT-ERA/tests/deployment/performance-monitoring-report-${Date.now()}.html`;
        
        // Generate HTML report
        const htmlReport = this.generateHtmlReport();
        
        await fs.writeFile(reportPath, JSON.stringify(this.metrics, null, 2));
        await fs.writeFile(htmlReportPath, htmlReport);
        
        console.log(`📊 Performance monitoring reports generated:`);
        console.log(`JSON: ${reportPath}`);
        console.log(`HTML: ${htmlReportPath}`);
        
        return { jsonReport: reportPath, htmlReport: htmlReportPath };
    }

    generateHtmlReport() {
        const validMetrics = this.metrics.performance_data.filter(m => !m.error);
        const avgLoadTime = validMetrics.length > 0 ? 
            (validMetrics.reduce((sum, m) => sum + m.load_times.initial_load, 0) / validMetrics.length).toFixed(0) : 0;
        const avgResponseTime = validMetrics.length > 0 ? 
            (validMetrics.reduce((sum, m) => sum + m.load_times.interaction_response, 0) / validMetrics.length).toFixed(0) : 0;
        
        return `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IT-ERA Chatbot Performance Monitoring Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f8f9fa; }
        .container { max-width: 1400px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #0056cc, #004499); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px; }
        .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .metric-value { font-size: 2.5em; font-weight: bold; margin: 10px 0; }
        .metric-good { color: #28a745; }
        .metric-warning { color: #ffc107; }
        .metric-error { color: #dc3545; }
        .section { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 30px; }
        .bottleneck-item { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .bottleneck-high { border-color: #dc3545; background: #f8d7da; }
        .bottleneck-medium { border-color: #ffc107; background: #fff3cd; }
        .recommendation { background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .recommendation-critical { border-color: #dc3545; background: #f8d7da; }
        .recommendation-high { border-color: #fd7e14; background: #fff3cd; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #0056cc; color: white; }
        .status-good { color: #28a745; font-weight: bold; }
        .status-warning { color: #ffc107; font-weight: bold; }
        .status-error { color: #dc3545; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 IT-ERA Chatbot Performance Monitoring Report</h1>
            <p>Real-time performance analysis and optimization recommendations</p>
            <div style="font-size: 0.9em; opacity: 0.9;">Generated: ${new Date().toLocaleString('it-IT')}</div>
        </div>
        
        <div class="metric-grid">
            <div class="metric-card">
                <h3>Average Page Load Time</h3>
                <div class="metric-value ${avgLoadTime < 3000 ? 'metric-good' : avgLoadTime < 5000 ? 'metric-warning' : 'metric-error'}">${avgLoadTime}ms</div>
                <div>Target: < 3000ms</div>
            </div>
            
            <div class="metric-card">
                <h3>Average Chatbot Response</h3>
                <div class="metric-value ${avgResponseTime < 3000 ? 'metric-good' : avgResponseTime < 5000 ? 'metric-warning' : 'metric-error'}">${avgResponseTime}ms</div>
                <div>Target: < 3000ms</div>
            </div>
            
            <div class="metric-card">
                <h3>Total Bottlenecks</h3>
                <div class="metric-value ${this.metrics.bottleneck_analysis.total_bottlenecks === 0 ? 'metric-good' : this.metrics.bottleneck_analysis.high_severity > 0 ? 'metric-error' : 'metric-warning'}">${this.metrics.bottleneck_analysis.total_bottlenecks || 0}</div>
                <div>High: ${this.metrics.bottleneck_analysis.high_severity || 0}, Medium: ${this.metrics.bottleneck_analysis.medium_severity || 0}</div>
            </div>
            
            <div class="metric-card">
                <h3>URLs Tested</h3>
                <div class="metric-value metric-good">${validMetrics.length}</div>
                <div>Success rate: ${validMetrics.length > 0 ? ((validMetrics.length / this.metrics.performance_data.length) * 100).toFixed(1) : 0}%</div>
            </div>
        </div>
        
        <div class="section">
            <h2>🎯 Performance Bottlenecks Analysis</h2>
            ${this.metrics.bottleneck_analysis.bottlenecks && this.metrics.bottleneck_analysis.bottlenecks.length > 0 ? 
                this.metrics.bottleneck_analysis.bottlenecks.map(bottleneck => `
                    <div class="bottleneck-item bottleneck-${bottleneck.severity.toLowerCase()}">
                        <h4>${bottleneck.type} - ${bottleneck.severity} PRIORITY</h4>
                        <p><strong>Current:</strong> ${bottleneck.current} | <strong>Target:</strong> ${bottleneck.target}</p>
                        <p><strong>Impact:</strong> ${bottleneck.impact}</p>
                        ${bottleneck.url ? `<p><strong>URL:</strong> ${bottleneck.url}</p>` : ''}
                    </div>
                `).join('') : 
                '<div class="bottleneck-item" style="background: #d4edda; border-color: #c3e6cb;">✅ No critical performance bottlenecks detected!</div>'
            }
        </div>
        
        <div class="section">
            <h2>💡 Optimization Recommendations</h2>
            ${this.metrics.optimization_recommendations.map(rec => `
                <div class="recommendation recommendation-${rec.priority.toLowerCase()}">
                    <h4>${rec.recommendation} - ${rec.priority} PRIORITY</h4>
                    <p><strong>Category:</strong> ${rec.category}</p>
                    <p><strong>Implementation:</strong> ${rec.implementation}</p>
                    <p><strong>Expected Improvement:</strong> ${rec.expected_improvement}</p>
                </div>
            `).join('')}
        </div>
        
        <div class="section">
            <h2>📈 Detailed Performance Data</h2>
            <table>
                <thead>
                    <tr>
                        <th>URL</th>
                        <th>Load Time</th>
                        <th>Chatbot Load</th>
                        <th>Response Time</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.metrics.performance_data.map(data => `
                        <tr>
                            <td><a href="${data.url}" target="_blank">${data.url}</a></td>
                            <td class="${data.load_times ? (data.load_times.initial_load < 3000 ? 'status-good' : data.load_times.initial_load < 5000 ? 'status-warning' : 'status-error') : ''}">${data.load_times ? data.load_times.initial_load + 'ms' : 'Failed'}</td>
                            <td class="${data.load_times ? (data.load_times.chatbot_load < 1500 ? 'status-good' : 'status-warning') : ''}">${data.load_times ? data.load_times.chatbot_load + 'ms' : 'N/A'}</td>
                            <td class="${data.load_times ? (data.load_times.interaction_response < 3000 ? 'status-good' : data.load_times.interaction_response < 5000 ? 'status-warning' : 'status-error') : ''}">${data.load_times ? data.load_times.interaction_response + 'ms' : 'N/A'}</td>
                            <td class="${data.error ? 'status-error' : 'status-good'}">${data.error ? 'FAILED' : 'SUCCESS'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="section">
            <h2>🎯 Next Steps</h2>
            <ol>
                <li>Address HIGH priority bottlenecks immediately</li>
                <li>Implement critical and high priority recommendations</li>
                <li>Set up continuous performance monitoring</li>
                <li>Schedule regular performance reviews</li>
                <li>Monitor user feedback and engagement metrics</li>
            </ol>
        </div>
    </div>
</body>
</html>`;
    }

    async runComplete() {
        try {
            await this.initialize();
            
            console.log('🚀 Starting Complete Performance Monitoring...');
            
            // Collect metrics for all URLs
            for (const url of this.monitoringUrls) {
                await this.collectDetailedMetrics(url);
            }
            
            // Analyze bottlenecks
            await this.analyzeBottlenecks();
            
            // Generate recommendations
            this.generateOptimizationRecommendations();
            
            // Generate reports
            const reports = await this.generateReport();
            
            console.log('🎉 Performance Monitoring Complete!');
            console.log(`📊 Summary: ${this.metrics.bottleneck_analysis.total_bottlenecks || 0} bottlenecks found`);
            
            return reports;
            
        } catch (error) {
            console.error('❌ Performance monitoring failed:', error);
            throw error;
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
}

module.exports = PerformanceMonitoringSuite;

// Execute if run directly
if (require.main === module) {
    const monitor = new PerformanceMonitoringSuite();
    monitor.runComplete()
        .then(reports => {
            console.log('✅ Performance monitoring completed!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Performance monitoring failed:', error);
            process.exit(1);
        });
}