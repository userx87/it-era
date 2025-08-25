#!/usr/bin/env node

/**
 * IT-ERA Admin Panel Deployment Verification Script
 * GitHub Deployment Master Agent
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configuration
const CONFIG = {
    PRODUCTION_URL: 'https://admin.it-era.it',
    STAGING_URL: 'https://staging-admin.it-era.it',
    API_ENDPOINTS: {
        production: 'https://it-era-admin-auth-production.bulltech.workers.dev',
        staging: 'https://it-era-admin-auth-staging.bulltech.workers.dev'
    },
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 2000
};

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

class DeploymentVerifier {
    constructor(environment = 'production') {
        this.environment = environment;
        this.baseUrl = environment === 'production' ? CONFIG.PRODUCTION_URL : CONFIG.STAGING_URL;
        this.apiUrl = CONFIG.API_ENDPOINTS[environment];
        this.results = {
            passed: 0,
            failed: 0,
            warnings: 0,
            tests: []
        };
    }

    log(message, color = 'reset') {
        console.log(`${colors[color]}${message}${colors.reset}`);
    }

    success(message) {
        this.log(`✅ ${message}`, 'green');
        this.results.passed++;
    }

    error(message) {
        this.log(`❌ ${message}`, 'red');
        this.results.failed++;
    }

    warning(message) {
        this.log(`⚠️  ${message}`, 'yellow');
        this.results.warnings++;
    }

    info(message) {
        this.log(`ℹ️  ${message}`, 'blue');
    }

    async makeRequest(url, options = {}) {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            const client = parsedUrl.protocol === 'https:' ? https : http;
            
            const requestOptions = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port,
                path: parsedUrl.pathname + parsedUrl.search,
                method: options.method || 'GET',
                headers: {
                    'User-Agent': 'IT-ERA Deployment Verifier/1.0',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    ...options.headers
                },
                timeout: CONFIG.TIMEOUT
            };

            const req = client.request(requestOptions, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: data
                    });
                });
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.on('error', reject);
            
            if (options.body) {
                req.write(options.body);
            }
            
            req.end();
        });
    }

    async retryRequest(url, options = {}, attempts = CONFIG.RETRY_ATTEMPTS) {
        for (let i = 0; i < attempts; i++) {
            try {
                return await this.makeRequest(url, options);
            } catch (error) {
                if (i === attempts - 1) throw error;
                await this.delay(CONFIG.RETRY_DELAY);
                this.warning(`Retrying request to ${url} (attempt ${i + 2}/${attempts})`);
            }
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async testBasicConnectivity() {
        this.info('Testing basic connectivity...');
        
        try {
            const response = await this.retryRequest(this.baseUrl);
            
            if (response.statusCode === 200) {
                this.success(`Admin panel is accessible at ${this.baseUrl}`);
                return true;
            } else if (response.statusCode >= 300 && response.statusCode < 400) {
                this.warning(`Admin panel redirects (${response.statusCode}) at ${this.baseUrl}`);
                return true;
            } else {
                this.error(`Admin panel returns ${response.statusCode} at ${this.baseUrl}`);
                return false;
            }
        } catch (error) {
            this.error(`Cannot connect to admin panel: ${error.message}`);
            return false;
        }
    }

    async testSecurityHeaders() {
        this.info('Testing security headers...');
        
        try {
            const response = await this.retryRequest(this.baseUrl);
            const headers = response.headers;
            
            const requiredHeaders = {
                'x-frame-options': 'DENY',
                'x-content-type-options': 'nosniff',
                'x-xss-protection': '1; mode=block'
            };
            
            let allPresent = true;
            
            for (const [header, expectedValue] of Object.entries(requiredHeaders)) {
                if (headers[header]) {
                    if (headers[header].toLowerCase().includes(expectedValue.toLowerCase())) {
                        this.success(`Security header ${header} is properly set`);
                    } else {
                        this.warning(`Security header ${header} has unexpected value: ${headers[header]}`);
                    }
                } else {
                    this.error(`Missing security header: ${header}`);
                    allPresent = false;
                }
            }
            
            // Check HTTPS
            if (this.baseUrl.startsWith('https://')) {
                this.success('HTTPS is enabled');
            } else {
                this.error('HTTPS is not enabled');
                allPresent = false;
            }
            
            return allPresent;
        } catch (error) {
            this.error(`Security headers test failed: ${error.message}`);
            return false;
        }
    }

    async testContentDelivery() {
        this.info('Testing content delivery...');
        
        try {
            const startTime = Date.now();
            const response = await this.retryRequest(this.baseUrl);
            const loadTime = Date.now() - startTime;
            
            if (loadTime < 3000) {
                this.success(`Page loads quickly (${loadTime}ms)`);
            } else if (loadTime < 5000) {
                this.warning(`Page loads slowly (${loadTime}ms)`);
            } else {
                this.error(`Page loads too slowly (${loadTime}ms)`);
            }
            
            // Check content type
            const contentType = response.headers['content-type'];
            if (contentType && contentType.includes('text/html')) {
                this.success('Correct content type (text/html)');
            } else {
                this.error(`Incorrect content type: ${contentType}`);
            }
            
            // Check for basic HTML structure
            if (response.body.includes('<title>IT-ERA Admin Panel</title>')) {
                this.success('HTML title is correct');
            } else {
                this.warning('HTML title may be incorrect');
            }
            
            if (response.body.includes('bootstrap') && response.body.includes('fontawesome')) {
                this.success('Required CSS frameworks are loaded');
            } else {
                this.error('Required CSS frameworks may be missing');
            }
            
            return true;
        } catch (error) {
            this.error(`Content delivery test failed: ${error.message}`);
            return false;
        }
    }

    async testAPIConnectivity() {
        this.info('Testing API connectivity...');
        
        try {
            // Test basic API endpoint
            const response = await this.retryRequest(`${this.apiUrl}/health`);
            
            if (response.statusCode === 200) {
                this.success('API health endpoint is accessible');
            } else {
                this.warning(`API health endpoint returns ${response.statusCode}`);
            }
            
            // Test CORS headers
            const corsResponse = await this.retryRequest(this.apiUrl, {
                method: 'OPTIONS',
                headers: {
                    'Origin': this.baseUrl,
                    'Access-Control-Request-Method': 'POST',
                    'Access-Control-Request-Headers': 'Content-Type,Authorization'
                }
            });
            
            if (corsResponse.headers['access-control-allow-origin']) {
                this.success('CORS is properly configured');
            } else {
                this.error('CORS headers may be missing');
            }
            
            return true;
        } catch (error) {
            this.error(`API connectivity test failed: ${error.message}`);
            return false;
        }
    }

    async testSPARouting() {
        this.info('Testing SPA routing...');
        
        const routes = ['/admin', '/admin/dashboard', '/admin/posts', '/admin/settings'];
        
        for (const route of routes) {
            try {
                const response = await this.retryRequest(`${this.baseUrl}${route}`);
                
                if (response.statusCode === 200) {
                    this.success(`Route ${route} is accessible`);
                } else {
                    this.error(`Route ${route} returns ${response.statusCode}`);
                }
            } catch (error) {
                this.error(`Route ${route} test failed: ${error.message}`);
            }
        }
        
        return true;
    }

    async testPerformance() {
        this.info('Testing performance metrics...');
        
        const tests = [
            { name: 'Initial load', url: this.baseUrl },
            { name: 'Static assets', url: `${this.baseUrl}/css/admin.css` },
            { name: 'JavaScript', url: `${this.baseUrl}/js/config.js` }
        ];
        
        for (const test of tests) {
            try {
                const startTime = Date.now();
                const response = await this.retryRequest(test.url);
                const loadTime = Date.now() - startTime;
                
                if (response.statusCode === 200) {
                    if (loadTime < 1000) {
                        this.success(`${test.name} loads quickly (${loadTime}ms)`);
                    } else if (loadTime < 3000) {
                        this.warning(`${test.name} loads acceptably (${loadTime}ms)`);
                    } else {
                        this.error(`${test.name} loads slowly (${loadTime}ms)`);
                    }
                } else {
                    this.error(`${test.name} returns ${response.statusCode}`);
                }
            } catch (error) {
                this.error(`${test.name} test failed: ${error.message}`);
            }
        }
        
        return true;
    }

    async runAllTests() {
        this.log(`\n🚀 IT-ERA Admin Panel Deployment Verification`, 'cyan');
        this.log(`📍 Environment: ${this.environment}`, 'blue');
        this.log(`🌐 Target URL: ${this.baseUrl}`, 'blue');
        this.log(`🔗 API URL: ${this.apiUrl}`, 'blue');
        this.log(`⏰ Started at: ${new Date().toLocaleString()}\n`, 'blue');

        const tests = [
            { name: 'Basic Connectivity', fn: this.testBasicConnectivity.bind(this) },
            { name: 'Security Headers', fn: this.testSecurityHeaders.bind(this) },
            { name: 'Content Delivery', fn: this.testContentDelivery.bind(this) },
            { name: 'API Connectivity', fn: this.testAPIConnectivity.bind(this) },
            { name: 'SPA Routing', fn: this.testSPARouting.bind(this) },
            { name: 'Performance', fn: this.testPerformance.bind(this) }
        ];

        for (const test of tests) {
            this.log(`\n📋 Running ${test.name} tests...`, 'magenta');
            try {
                await test.fn();
            } catch (error) {
                this.error(`Test suite '${test.name}' failed: ${error.message}`);
            }
        }

        this.printSummary();
    }

    printSummary() {
        this.log(`\n📊 Deployment Verification Summary`, 'cyan');
        this.log(`═══════════════════════════════════`, 'cyan');
        
        if (this.results.failed === 0) {
            this.log(`🎉 All tests passed! Deployment is ready for production.`, 'green');
        } else if (this.results.failed <= 2) {
            this.log(`⚠️  Minor issues detected. Review and fix before production.`, 'yellow');
        } else {
            this.log(`🚫 Major issues detected. Deployment needs attention.`, 'red');
        }
        
        this.log(`\n📈 Results:`, 'blue');
        this.log(`   ✅ Passed: ${this.results.passed}`, 'green');
        this.log(`   ❌ Failed: ${this.results.failed}`, 'red');
        this.log(`   ⚠️  Warnings: ${this.results.warnings}`, 'yellow');
        
        this.log(`\n🕐 Completed at: ${new Date().toLocaleString()}`, 'blue');
        
        // Exit with appropriate code
        process.exit(this.results.failed > 0 ? 1 : 0);
    }
}

// CLI interface
function showHelp() {
    console.log(`
IT-ERA Admin Panel Deployment Verifier

Usage: node verify-deployment.js [environment] [options]

Environments:
  production    Verify production deployment (default)
  staging       Verify staging deployment

Options:
  --help, -h    Show this help message
  --verbose, -v Enable verbose output

Examples:
  node verify-deployment.js                    # Verify production
  node verify-deployment.js staging            # Verify staging
  node verify-deployment.js production -v      # Verbose production verification
`);
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        showHelp();
        process.exit(0);
    }
    
    const environment = args[0] || 'production';
    const verbose = args.includes('--verbose') || args.includes('-v');
    
    if (!['production', 'staging'].includes(environment)) {
        console.error(`❌ Invalid environment: ${environment}`);
        console.error('   Valid environments: production, staging');
        process.exit(1);
    }
    
    const verifier = new DeploymentVerifier(environment);
    
    try {
        await verifier.runAllTests();
    } catch (error) {
        console.error(`\n💥 Verification failed with error:`, error.message);
        process.exit(1);
    }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = DeploymentVerifier;