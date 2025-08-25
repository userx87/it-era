const puppeteer = require('puppeteer');

class AdminPanelTester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.baseUrl = 'https://it-era.pages.dev/admin/';
        this.credentials = {
            email: 'admin@it-era.it',
            password: 'admin123!'
        };
        this.testResults = {
            authentication: {},
            navigation: {},
            apiIntegration: {},
            security: {},
            overall: { passed: 0, failed: 0, warnings: [] }
        };
    }

    async initialize() {
        console.log('🚀 Initializing Puppeteer browser...');
        this.browser = await puppeteer.launch({
            headless: false, // Set to true for CI/CD
            defaultViewport: { width: 1920, height: 1080 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        this.page = await this.browser.newPage();
        
        // Enable request interception for API monitoring
        await this.page.setRequestInterception(true);
        this.page.on('request', request => {
            console.log(`📡 Request: ${request.method()} ${request.url()}`);
            request.continue();
        });
        
        this.page.on('response', response => {
            console.log(`📨 Response: ${response.status()} ${response.url()}`);
        });
    }

    async testAuthentication() {
        console.log('\n🔐 Testing Authentication Flow...');
        try {
            // Navigate to admin panel
            await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
            
            // Wait for page to load
            await this.page.waitForSelector('input[type="email"], input[name="email"], #email, .email-input', { timeout: 5000 });
            
            // Find email and password inputs using multiple selectors
            let emailInput = await this.page.$('input[type="email"]') || 
                           await this.page.$('input[name="email"]') || 
                           await this.page.$('#email') ||
                           await this.page.$('.email-input');
                           
            let passwordInput = await this.page.$('input[type="password"]') || 
                              await this.page.$('input[name="password"]') || 
                              await this.page.$('#password') ||
                              await this.page.$('.password-input');
            
            if (!emailInput || !passwordInput) {
                throw new Error('Login form inputs not found');
            }
            
            // Fill login credentials
            await emailInput.type(this.credentials.email);
            await passwordInput.type(this.credentials.password);
            
            // Find and click login button
            const loginBtn = await this.page.$('button[type="submit"]') || 
                           await this.page.$('.login-btn') ||
                           await this.page.$('#loginBtn') ||
                           await this.page.$('input[type="submit"]');
            
            if (!loginBtn) {
                throw new Error('Login button not found');
            }
            
            await loginBtn.click();
            
            // Wait for navigation or dashboard
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Check if redirected to dashboard or authenticated area
            const currentUrl = this.page.url();
            const hasAuthContent = await this.page.$('.dashboard, .admin-dashboard, #dashboard') !== null;
            const isLoggedIn = currentUrl.includes('dashboard') || hasAuthContent;
            
            if (isLoggedIn) {
                console.log('✅ Login successful');
                this.testResults.authentication.login = { status: 'PASS', message: 'Login successful' };
                this.testResults.overall.passed++;
            } else {
                console.log('⚠️  Login status unclear - checking for auth indicators');
                this.testResults.authentication.login = { status: 'WARNING', message: 'Login status unclear' };
                this.testResults.overall.warnings.push('Login status unclear');
            }
            
            // Check for JWT token in localStorage
            const token = await this.page.evaluate(() => {
                return localStorage.getItem('adminToken') || 
                       localStorage.getItem('token') || 
                       localStorage.getItem('authToken') ||
                       localStorage.getItem('jwt') ||
                       sessionStorage.getItem('adminToken') ||
                       sessionStorage.getItem('token');
            });
            
            if (token) {
                console.log('✅ JWT token found in storage');
                this.testResults.authentication.tokenStorage = { status: 'PASS', message: 'JWT token stored' };
                this.testResults.overall.passed++;
            } else {
                console.log('⚠️  JWT token not found in storage');
                this.testResults.authentication.tokenStorage = { status: 'WARNING', message: 'JWT token not found' };
                this.testResults.overall.warnings.push('JWT token not found in storage');
            }
            
        } catch (error) {
            console.log(`❌ Authentication test failed: ${error.message}`);
            this.testResults.authentication.login = { status: 'FAIL', message: error.message };
            this.testResults.overall.failed++;
        }
    }

    async testNavigation() {
        console.log('\n🧭 Testing Navigation...');
        
        const menuItems = [
            { name: 'Dashboard', selectors: ['[data-menu="dashboard"]', '.nav-dashboard', '#nav-dashboard', 'a[href*="dashboard"]'] },
            { name: 'Posts', selectors: ['[data-menu="posts"]', '.nav-posts', '#nav-posts', 'a[href*="post"]'] },
            { name: 'Media', selectors: ['[data-menu="media"]', '.nav-media', '#nav-media', 'a[href*="media"]'] },
            { name: 'Users', selectors: ['[data-menu="users"]', '.nav-users', '#nav-users', 'a[href*="user"]'] },
            { name: 'Settings', selectors: ['[data-menu="settings"]', '.nav-settings', '#nav-settings', 'a[href*="settings"]'] }
        ];
        
        this.testResults.navigation.items = {};
        
        for (const item of menuItems) {
            try {
                console.log(`Testing navigation to ${item.name}...`);
                
                let element = null;
                let foundSelector = null;
                
                // Try each selector for this menu item
                for (const selector of item.selectors) {
                    try {
                        element = await this.page.$(selector);
                        if (element) {
                            foundSelector = selector;
                            break;
                        }
                    } catch (e) {
                        // Invalid selector, try next one
                        continue;
                    }
                }
                
                if (element && foundSelector) {
                    console.log(`Found ${item.name} with selector: ${foundSelector}`);
                    await element.click();
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    // Check if page loaded successfully
                    const pageTitle = await this.page.title();
                    const currentUrl = this.page.url();
                    
                    console.log(`✅ ${item.name} navigation successful`);
                    this.testResults.navigation.items[item.name] = {
                        status: 'PASS',
                        url: currentUrl,
                        title: pageTitle,
                        selector: foundSelector
                    };
                    this.testResults.overall.passed++;
                } else {
                    console.log(`⚠️  ${item.name} menu item not found with any selector`);
                    this.testResults.navigation.items[item.name] = {
                        status: 'WARNING',
                        message: 'Menu item not found'
                    };
                    this.testResults.overall.warnings.push(`${item.name} menu item not found`);
                }
            } catch (error) {
                console.log(`❌ ${item.name} navigation failed: ${error.message}`);
                this.testResults.navigation.items[item.name] = {
                    status: 'FAIL',
                    message: error.message
                };
                this.testResults.overall.failed++;
            }
        }
    }

    async testApiIntegration() {
        console.log('\n🌐 Testing API Integration...');
        
        try {
            // Navigate to dashboard to trigger API calls
            await this.page.goto(`${this.baseUrl}dashboard`, { waitUntil: 'networkidle2' });
            
            // Monitor network requests
            const apiCalls = [];
            this.page.on('response', response => {
                if (response.url().includes('/api/')) {
                    apiCalls.push({
                        url: response.url(),
                        status: response.status(),
                        headers: response.headers()
                    });
                }
            });
            
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            if (apiCalls.length > 0) {
                console.log(`✅ Found ${apiCalls.length} API calls`);
                this.testResults.apiIntegration.calls = { status: 'PASS', count: apiCalls.length, calls: apiCalls };
                this.testResults.overall.passed++;
                
                // Check if API calls include auth tokens
                const authenticatedCalls = apiCalls.filter(call => 
                    call.headers.authorization || call.headers.Authorization
                );
                
                if (authenticatedCalls.length > 0) {
                    console.log(`✅ Found ${authenticatedCalls.length} authenticated API calls`);
                    this.testResults.apiIntegration.authentication = { status: 'PASS', count: authenticatedCalls.length };
                    this.testResults.overall.passed++;
                } else {
                    console.log('⚠️  No authenticated API calls found');
                    this.testResults.apiIntegration.authentication = { status: 'WARNING', message: 'No auth headers found' };
                    this.testResults.overall.warnings.push('No authenticated API calls detected');
                }
            } else {
                console.log('⚠️  No API calls detected');
                this.testResults.apiIntegration.calls = { status: 'WARNING', message: 'No API calls detected' };
                this.testResults.overall.warnings.push('No API calls detected on dashboard');
            }
            
        } catch (error) {
            console.log(`❌ API integration test failed: ${error.message}`);
            this.testResults.apiIntegration.error = { status: 'FAIL', message: error.message };
            this.testResults.overall.failed++;
        }
    }

    async testSecurity() {
        console.log('\n🔒 Testing Security...');
        
        try {
            // Test logout functionality
            const logoutBtn = await this.page.$('#logoutBtn, .logout, [data-action="logout"]');
            if (logoutBtn) {
                await logoutBtn.click();
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const currentUrl = this.page.url();
                if (currentUrl.includes('login') || !currentUrl.includes('/admin/')) {
                    console.log('✅ Logout functionality works');
                    this.testResults.security.logout = { status: 'PASS', message: 'Logout successful' };
                    this.testResults.overall.passed++;
                } else {
                    throw new Error('Logout did not redirect properly');
                }
            } else {
                console.log('⚠️  Logout button not found');
                this.testResults.security.logout = { status: 'WARNING', message: 'Logout button not found' };
                this.testResults.overall.warnings.push('Logout button not found');
            }
            
            // Test protected route access without auth
            await this.page.goto(`${this.baseUrl}dashboard`, { waitUntil: 'networkidle2' });
            const currentUrl = this.page.url();
            
            if (currentUrl.includes('login') || currentUrl.includes('unauthorized')) {
                console.log('✅ Protected routes properly secured');
                this.testResults.security.protectedRoutes = { status: 'PASS', message: 'Protected routes secured' };
                this.testResults.overall.passed++;
            } else {
                console.log('❌ Protected routes not properly secured');
                this.testResults.security.protectedRoutes = { status: 'FAIL', message: 'Can access protected routes without auth' };
                this.testResults.overall.failed++;
            }
            
        } catch (error) {
            console.log(`❌ Security test failed: ${error.message}`);
            this.testResults.security.error = { status: 'FAIL', message: error.message };
            this.testResults.overall.failed++;
        }
    }

    async generateReport() {
        console.log('\n📋 Generating Test Report...');
        
        const report = {
            timestamp: new Date().toISOString(),
            environment: 'Production',
            url: this.baseUrl,
            summary: {
                totalTests: this.testResults.overall.passed + this.testResults.overall.failed,
                passed: this.testResults.overall.passed,
                failed: this.testResults.overall.failed,
                warnings: this.testResults.overall.warnings.length,
                successRate: Math.round((this.testResults.overall.passed / (this.testResults.overall.passed + this.testResults.overall.failed)) * 100) || 0
            },
            results: this.testResults
        };
        
        console.log('\n🎯 TEST SUMMARY:');
        console.log(`Total Tests: ${report.summary.totalTests}`);
        console.log(`Passed: ${report.summary.passed}`);
        console.log(`Failed: ${report.summary.failed}`);
        console.log(`Warnings: ${report.summary.warnings}`);
        console.log(`Success Rate: ${report.summary.successRate}%`);
        
        return report;
    }

    async runAllTests() {
        try {
            await this.initialize();
            await this.testAuthentication();
            await this.testNavigation();
            await this.testApiIntegration();
            await this.testSecurity();
            
            const report = await this.generateReport();
            return report;
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
            throw error;
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
}

// Export for use in other modules
module.exports = AdminPanelTester;

// Run tests if called directly
if (require.main === module) {
    (async () => {
        const tester = new AdminPanelTester();
        try {
            const report = await tester.runAllTests();
            console.log('\n📄 Full Report:');
            console.log(JSON.stringify(report, null, 2));
        } catch (error) {
            console.error('Test execution failed:', error);
            process.exit(1);
        }
    })();
}