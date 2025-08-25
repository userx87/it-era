/**
 * Puppeteer Debugging Utilities - Comprehensive Error Handling & Monitoring
 * Addresses all current test issues with robust diagnostics
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class PuppeteerDebugger {
    constructor(options = {}) {
        this.options = {
            headless: options.headless || false,
            screenshotDir: options.screenshotDir || '/Users/andreapanzeri/progetti/IT-ERA/test-results/screenshots',
            reportDir: options.reportDir || '/Users/andreapanzeri/progetti/IT-ERA/test-results/reports',
            timeout: options.timeout || 30000,
            slowMo: options.slowMo || 100,
            ...options
        };
        
        this.testResults = [];
        this.networkRequests = [];
        this.consoleLogs = [];
        this.errors = [];
        this.startTime = Date.now();
        
        // URL Configuration - Fixed for different environments
        this.urls = {
            production: 'https://it-era.pages.dev',
            staging: 'https://main.it-era.pages.dev', 
            local: 'http://localhost:8080', // Fixed from using wrong localhost
            file: 'file:///Users/andreapanzeri/progetti/IT-ERA/web'
        };
    }

    /**
     * Initialize directories for screenshots and reports
     */
    async initialize() {
        try {
            await fs.mkdir(this.options.screenshotDir, { recursive: true });
            await fs.mkdir(this.options.reportDir, { recursive: true });
            console.log('✅ Debug utilities initialized');
        } catch (error) {
            console.error('❌ Failed to initialize debug utilities:', error.message);
        }
    }

    /**
     * Launch browser with comprehensive debugging capabilities
     */
    async launchBrowser() {
        const launchOptions = {
            headless: this.options.headless,
            slowMo: this.options.slowMo,
            defaultViewport: { width: 1920, height: 1080 },
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--disable-dev-shm-usage',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding'
            ]
        };

        this.browser = await puppeteer.launch(launchOptions);
        console.log('🚀 Browser launched with debugging capabilities');
        return this.browser;
    }

    /**
     * Create a new page with comprehensive monitoring
     */
    async createMonitoredPage(pageName = 'main') {
        const page = await this.browser.newPage();
        
        // Set longer timeout to prevent premature failures
        page.setDefaultTimeout(this.options.timeout);
        page.setDefaultNavigationTimeout(this.options.timeout);

        // Console log capture with categorization
        page.on('console', (msg) => {
            const logEntry = {
                type: msg.type(),
                text: msg.text(),
                timestamp: new Date().toISOString(),
                page: pageName,
                location: msg.location()
            };
            
            this.consoleLogs.push(logEntry);
            
            // Color-coded console output
            const colors = {
                error: '\x1b[31m',   // Red
                warn: '\x1b[33m',    // Yellow
                info: '\x1b[36m',    // Cyan
                log: '\x1b[37m',     // White
                debug: '\x1b[35m'    // Magenta
            };
            
            const color = colors[msg.type()] || '\x1b[37m';
            console.log(`${color}📝 Console [${msg.type()}]: ${msg.text()}\x1b[0m`);
        });

        // Enhanced error capture
        page.on('pageerror', (error) => {
            const errorEntry = {
                type: 'page_error',
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString(),
                page: pageName
            };
            
            this.errors.push(errorEntry);
            console.log(`❌ Page Error [${pageName}]: ${error.message}`);
        });

        // Network request monitoring with CORS detection
        page.on('request', (request) => {
            const requestEntry = {
                url: request.url(),
                method: request.method(),
                headers: request.headers(),
                resourceType: request.resourceType(),
                timestamp: new Date().toISOString(),
                page: pageName,
                isAborted: false,
                status: null,
                failure: null
            };
            
            this.networkRequests.push(requestEntry);
            
            // Log API requests and potential CORS issues
            if (request.url().includes('api') || request.url().includes('chat')) {
                console.log(`🌐 API Request: ${request.method()} ${request.url()}`);
                
                // Check for CORS preflight
                if (request.method() === 'OPTIONS') {
                    console.log('🔍 CORS Preflight detected');
                }
            }
        });

        // Network response monitoring
        page.on('response', (response) => {
            const request = this.networkRequests.find(req => req.url === response.url());
            if (request) {
                request.status = response.status();
                request.statusText = response.statusText();
                request.responseHeaders = response.headers();
            }

            // Detailed logging for important responses
            if (response.url().includes('api') || response.url().includes('chat')) {
                const statusColor = response.status() >= 400 ? '\x1b[31m' : '\x1b[32m';
                console.log(`${statusColor}📡 API Response: ${response.url()} - ${response.status()}\x1b[0m`);
                
                // CORS error detection
                if (response.status() === 0 || response.status() >= 400) {
                    const corsHeaders = response.headers()['access-control-allow-origin'];
                    if (!corsHeaders) {
                        console.log('⚠️ Possible CORS issue detected - no CORS headers');
                    }
                }
            }
        });

        // Network request failures
        page.on('requestfailed', (request) => {
            const requestEntry = this.networkRequests.find(req => req.url === request.url());
            if (requestEntry) {
                requestEntry.isAborted = true;
                requestEntry.failure = request.failure();
            }

            const errorEntry = {
                type: 'network_error',
                url: request.url(),
                method: request.method(),
                failure: request.failure(),
                timestamp: new Date().toISOString(),
                page: pageName
            };
            
            this.errors.push(errorEntry);
            console.log(`🔥 Request Failed [${pageName}]: ${request.url()} - ${request.failure().errorText}`);
        });

        // Dialog handling (alerts, confirms, prompts)
        page.on('dialog', async (dialog) => {
            console.log(`💬 Dialog [${dialog.type()}]: ${dialog.message()}`);
            await dialog.dismiss();
        });

        return page;
    }

    /**
     * Safe navigation with retry and fallback URLs
     */
    async navigateToSite(page, environment = 'production', retries = 3) {
        const url = this.urls[environment];
        
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                console.log(`🔗 Attempt ${attempt}: Navigating to ${url} (${environment})`);
                
                const response = await page.goto(url, {
                    waitUntil: 'networkidle2', // Wait for network to be idle
                    timeout: this.options.timeout
                });

                if (response && response.ok()) {
                    console.log(`✅ Successfully loaded ${url}`);
                    return response;
                } else {
                    throw new Error(`HTTP ${response ? response.status() : 'unknown'}: ${response ? response.statusText() : 'No response'}`);
                }
            } catch (error) {
                console.log(`❌ Navigation attempt ${attempt} failed: ${error.message}`);
                
                if (attempt === retries) {
                    // Try fallback environments
                    if (environment === 'production') {
                        console.log('🔄 Trying staging environment as fallback...');
                        return await this.navigateToSite(page, 'staging', 1);
                    } else if (environment === 'staging') {
                        console.log('🔄 Trying local environment as fallback...');
                        return await this.navigateToSite(page, 'local', 1);
                    }
                    
                    throw new Error(`Failed to navigate after ${retries} attempts: ${error.message}`);
                }
                
                // Wait before retry
                await this.wait(2000 * attempt);
            }
        }
    }

    /**
     * Modern wait function - replacement for deprecated page.waitForTimeout
     */
    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Wait for element with timeout and error handling
     */
    async waitForElement(page, selector, options = {}) {
        const timeout = options.timeout || this.options.timeout;
        const visible = options.visible !== false;
        
        try {
            console.log(`⏳ Waiting for element: ${selector}`);
            
            const element = await page.waitForSelector(selector, {
                visible,
                timeout
            });
            
            if (element) {
                console.log(`✅ Element found: ${selector}`);
                return element;
            }
        } catch (error) {
            console.log(`❌ Element not found: ${selector} - ${error.message}`);
            
            // Take screenshot for debugging
            await this.takeScreenshot(page, `element-not-found-${selector.replace(/[^a-zA-Z0-9]/g, '-')}`);
            
            if (options.required !== false) {
                throw error;
            }
            
            return null;
        }
    }

    /**
     * Enhanced screenshot function with context and metadata
     */
    async takeScreenshot(page, name, options = {}) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `${name}-${timestamp}.png`;
            const filepath = path.join(this.options.screenshotDir, filename);
            
            await page.screenshot({
                path: filepath,
                fullPage: options.fullPage || true,
                ...options
            });
            
            console.log(`📸 Screenshot saved: ${filename}`);
            
            // Save screenshot metadata
            const metadata = {
                filename,
                timestamp,
                url: page.url(),
                viewport: await page.viewport(),
                userAgent: await page.evaluate(() => navigator.userAgent),
                context: options.context || 'general',
                ...options.metadata
            };
            
            const metadataFile = filepath.replace('.png', '.json');
            await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2));
            
            return filepath;
        } catch (error) {
            console.error(`❌ Screenshot failed: ${error.message}`);
            return null;
        }
    }

    /**
     * Widget loading verification with detailed diagnostics
     */
    async verifyWidgetLoading(page, widgetConfig) {
        console.log('🔍 Starting widget loading verification...');
        
        const results = {
            buttonFound: false,
            windowOpens: false,
            initialMessage: false,
            apiConnection: false,
            errors: [],
            screenshots: []
        };

        try {
            // Check for widget button
            const button = await this.waitForElement(page, widgetConfig.buttonSelector, {
                timeout: 10000,
                required: false
            });
            
            if (button) {
                results.buttonFound = true;
                console.log('✅ Widget button found');
                
                // Take screenshot before clicking
                const beforeClick = await this.takeScreenshot(page, 'widget-before-click', {
                    context: 'widget-verification',
                    metadata: { step: 'before-click' }
                });
                results.screenshots.push(beforeClick);
                
                // Click the button
                await button.click();
                console.log('🖱️ Widget button clicked');
                
                // Wait for widget window
                await this.wait(2000);
                
                // Check if window opened
                const window = await page.$(widgetConfig.windowSelector);
                if (window) {
                    const isVisible = await window.isIntersectingViewport();
                    
                    if (isVisible) {
                        results.windowOpens = true;
                        console.log('✅ Widget window opened');
                        
                        // Take screenshot after opening
                        const afterOpen = await this.takeScreenshot(page, 'widget-after-open', {
                            context: 'widget-verification',
                            metadata: { step: 'after-open' }
                        });
                        results.screenshots.push(afterOpen);
                        
                        // Check for initial messages
                        await this.wait(3000); // Wait for initial message
                        
                        const messages = await page.evaluate((selector) => {
                            const container = document.querySelector(selector);
                            if (!container) return [];
                            
                            const messageElements = container.querySelectorAll('.message, .it-era-message');
                            return Array.from(messageElements).map(msg => ({
                                text: msg.textContent.trim(),
                                html: msg.innerHTML,
                                classes: Array.from(msg.classList)
                            }));
                        }, widgetConfig.messagesSelector);
                        
                        if (messages && messages.length > 0) {
                            results.initialMessage = true;
                            results.messageContent = messages;
                            console.log(`✅ Initial messages found: ${messages.length}`);
                            
                            // Check for connection errors
                            const hasConnectionError = messages.some(msg => 
                                msg.text.includes('connessione') || 
                                msg.text.includes('039 888 2041') ||
                                msg.text.includes('Problemi')
                            );
                            
                            if (hasConnectionError) {
                                results.errors.push('Connection error detected in widget messages');
                                console.log('⚠️ Connection error detected in widget');
                            } else {
                                results.apiConnection = true;
                                console.log('✅ No connection errors detected');
                            }
                        }
                    }
                }
            } else {
                results.errors.push('Widget button not found');
                console.log('❌ Widget button not found');
                
                // Check if widget script is loaded
                const hasScript = await page.evaluate(() => {
                    return document.querySelector('script[src*="chatbot"]') !== null ||
                           document.body.innerHTML.includes('chatbot') ||
                           window.ITEraChatbot !== undefined;
                });
                
                results.scriptLoaded = hasScript;
                console.log(`📜 Widget script loaded: ${hasScript}`);
            }
            
        } catch (error) {
            results.errors.push(error.message);
            console.log(`❌ Widget verification failed: ${error.message}`);
            
            // Take error screenshot
            const errorScreenshot = await this.takeScreenshot(page, 'widget-verification-error', {
                context: 'widget-verification-error',
                metadata: { error: error.message }
            });
            results.screenshots.push(errorScreenshot);
        }
        
        return results;
    }

    /**
     * Comprehensive error analysis and reporting
     */
    generateErrorReport() {
        const report = {
            testDuration: Date.now() - this.startTime,
            summary: {
                totalErrors: this.errors.length,
                totalConsoleMessages: this.consoleLogs.length,
                totalNetworkRequests: this.networkRequests.length,
                failedRequests: this.networkRequests.filter(req => req.isAborted || (req.status >= 400)).length
            },
            errors: this.errors,
            consoleLogs: this.consoleLogs.filter(log => ['error', 'warn'].includes(log.type)),
            networkIssues: this.networkRequests.filter(req => req.isAborted || (req.status >= 400)),
            corsIssues: this.networkRequests.filter(req => 
                req.failure && (
                    req.failure.errorText.includes('CORS') ||
                    req.failure.errorText.includes('net::ERR_FAILED') ||
                    req.failure.errorText.includes('net::ERR_BLOCKED_BY_CLIENT')
                )
            ),
            recommendations: this.generateRecommendations()
        };

        return report;
    }

    /**
     * Generate recommendations based on captured issues
     */
    generateRecommendations() {
        const recommendations = [];
        
        // Network issues
        const failedRequests = this.networkRequests.filter(req => req.isAborted || (req.status >= 400));
        if (failedRequests.length > 0) {
            recommendations.push({
                category: 'Network',
                issue: `${failedRequests.length} failed network requests detected`,
                solution: 'Check API endpoints and CORS configuration'
            });
        }
        
        // CORS issues
        const corsErrors = this.errors.filter(error => 
            error.message && error.message.toLowerCase().includes('cors')
        );
        if (corsErrors.length > 0) {
            recommendations.push({
                category: 'CORS',
                issue: 'CORS errors detected',
                solution: 'Add proper Access-Control-Allow-Origin headers to API responses'
            });
        }
        
        // Console errors
        const consoleErrors = this.consoleLogs.filter(log => log.type === 'error');
        if (consoleErrors.length > 0) {
            recommendations.push({
                category: 'JavaScript',
                issue: `${consoleErrors.length} JavaScript errors found`,
                solution: 'Review and fix JavaScript errors in browser console'
            });
        }
        
        return recommendations;
    }

    /**
     * Save comprehensive test report
     */
    async saveReport(testName) {
        const report = this.generateErrorReport();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportFile = path.join(this.options.reportDir, `${testName}-report-${timestamp}.json`);
        
        try {
            await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
            console.log(`📋 Test report saved: ${reportFile}`);
            
            // Generate HTML report for better readability
            await this.generateHtmlReport(report, testName);
            
            return reportFile;
        } catch (error) {
            console.error(`❌ Failed to save report: ${error.message}`);
            return null;
        }
    }

    /**
     * Generate HTML report for better visualization
     */
    async generateHtmlReport(report, testName) {
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Puppeteer Test Report - ${testName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { border-bottom: 2px solid #0056cc; padding-bottom: 20px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #0056cc; }
        .metric-label { color: #6c757d; margin-top: 5px; }
        .section { margin: 30px 0; }
        .error { background: #fff5f5; border-left: 4px solid #dc3545; padding: 15px; margin: 10px 0; border-radius: 4px; }
        .warning { background: #fffbf0; border-left: 4px solid #ffc107; padding: 15px; margin: 10px 0; border-radius: 4px; }
        .success { background: #f0fff4; border-left: 4px solid #28a745; padding: 15px; margin: 10px 0; border-radius: 4px; }
        .code { background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 0.9em; overflow-x: auto; }
        .timestamp { color: #6c757d; font-size: 0.8em; }
        .recommendation { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 10px 0; border-radius: 4px; }
        h1, h2, h3 { color: #333; }
        h1 { color: #0056cc; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎭 Puppeteer Test Report</h1>
            <h2>${testName}</h2>
            <p class="timestamp">Generated: ${new Date().toISOString()}</p>
        </div>

        <div class="summary">
            <div class="metric">
                <div class="metric-value">${(report.testDuration / 1000).toFixed(1)}s</div>
                <div class="metric-label">Test Duration</div>
            </div>
            <div class="metric">
                <div class="metric-value">${report.summary.totalErrors}</div>
                <div class="metric-label">Total Errors</div>
            </div>
            <div class="metric">
                <div class="metric-value">${report.summary.failedRequests}</div>
                <div class="metric-label">Failed Requests</div>
            </div>
            <div class="metric">
                <div class="metric-value">${report.summary.totalNetworkRequests}</div>
                <div class="metric-label">Network Requests</div>
            </div>
        </div>

        <div class="section">
            <h3>🚨 Errors</h3>
            ${report.errors.length === 0 ? '<div class="success">No errors detected!</div>' : 
              report.errors.map(error => `
                <div class="error">
                    <strong>${error.type}</strong>: ${error.message}<br>
                    <span class="timestamp">${error.timestamp}</span>
                    ${error.stack ? `<div class="code">${error.stack}</div>` : ''}
                </div>
              `).join('')
            }
        </div>

        <div class="section">
            <h3>🌐 Network Issues</h3>
            ${report.networkIssues.length === 0 ? '<div class="success">No network issues detected!</div>' : 
              report.networkIssues.map(req => `
                <div class="error">
                    <strong>${req.method} ${req.url}</strong><br>
                    Status: ${req.status || 'Failed'} - ${req.failure ? req.failure.errorText : 'Unknown error'}<br>
                    <span class="timestamp">${req.timestamp}</span>
                </div>
              `).join('')
            }
        </div>

        <div class="section">
            <h3>⚠️ Console Warnings & Errors</h3>
            ${report.consoleLogs.length === 0 ? '<div class="success">No console issues detected!</div>' : 
              report.consoleLogs.map(log => `
                <div class="${log.type === 'error' ? 'error' : 'warning'}">
                    <strong>[${log.type.toUpperCase()}]</strong>: ${log.text}<br>
                    <span class="timestamp">${log.timestamp} - Page: ${log.page}</span>
                </div>
              `).join('')
            }
        </div>

        <div class="section">
            <h3>💡 Recommendations</h3>
            ${report.recommendations.length === 0 ? '<div class="success">No specific recommendations!</div>' : 
              report.recommendations.map(rec => `
                <div class="recommendation">
                    <strong>${rec.category}</strong>: ${rec.issue}<br>
                    <strong>Solution:</strong> ${rec.solution}
                </div>
              `).join('')
            }
        </div>
    </div>
</body>
</html>`;

        const htmlFile = path.join(this.options.reportDir, `${testName}-report-${Date.now()}.html`);
        await fs.writeFile(htmlFile, htmlContent);
        console.log(`📊 HTML report generated: ${htmlFile}`);
    }

    /**
     * Cleanup and close browser
     */
    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            console.log('🔄 Browser closed');
        }
    }
}

module.exports = PuppeteerDebugger;