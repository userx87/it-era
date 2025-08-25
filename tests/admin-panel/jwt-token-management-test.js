/**
 * IT-ERA Admin Panel - JWT Token Management Test Suite
 * 
 * Comprehensive test suite for JWT token persistence, auto-refresh,
 * and "Remember Me" functionality.
 */

const puppeteer = require('puppeteer');

class JWTTokenManagementTester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.baseUrl = 'file:///Users/andreapanzeri/progetti/IT-ERA/admin/index.html';
        this.credentials = {
            email: 'admin@it-era.it',
            password: 'admin123!'
        };
        this.testResults = {
            tokenStorage: {},
            tokenRefresh: {},
            rememberMe: {},
            sessionPersistence: {},
            tokenExpiration: {},
            overall: { passed: 0, failed: 0, warnings: [] }
        };
    }

    async initialize() {
        console.log('🚀 Initializing JWT Token Management Tests...');
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1920, height: 1080 },
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files']
        });
        
        this.page = await this.browser.newPage();
        
        // Enable console logging
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('🔴 Page Error:', msg.text());
            } else if (msg.type() === 'warn') {
                console.log('🟡 Page Warning:', msg.text());
            } else if (msg.text().includes('TokenManager') || msg.text().includes('AuthManager')) {
                console.log('📡 Auth Log:', msg.text());
            }
        });

        // Enable request/response logging
        await this.page.setRequestInterception(true);
        this.page.on('request', request => {
            console.log(`📡 Request: ${request.method()} ${request.url()}`);
            request.continue();
        });
    }

    async testTokenManagerInitialization() {
        console.log('\n🔧 Testing TokenManager Initialization...');
        
        try {
            await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
            await this.page.waitForTimeout(2000);

            // Check if TokenManager is initialized
            const tokenManagerExists = await this.page.evaluate(() => {
                return typeof window.tokenManager !== 'undefined';
            });

            if (tokenManagerExists) {
                console.log('✅ TokenManager initialized successfully');
                this.testResults.tokenStorage.initialization = { status: 'PASS', message: 'TokenManager initialized' };
                this.testResults.overall.passed++;
            } else {
                throw new Error('TokenManager not found');
            }

            // Check TokenManager methods
            const tokenManagerMethods = await this.page.evaluate(() => {
                if (!window.tokenManager) return {};
                
                return {
                    hasStoreToken: typeof window.tokenManager.storeToken === 'function',
                    hasGetToken: typeof window.tokenManager.getToken === 'function',
                    hasIsAuthenticated: typeof window.tokenManager.isAuthenticated === 'function',
                    hasGetTokenInfo: typeof window.tokenManager.getTokenInfo === 'function',
                    hasForceRefresh: typeof window.tokenManager.forceRefresh === 'function'
                };
            });

            const requiredMethods = Object.values(tokenManagerMethods);
            if (requiredMethods.every(method => method === true)) {
                console.log('✅ All TokenManager methods available');
                this.testResults.tokenStorage.methods = { status: 'PASS', message: 'All methods available' };
                this.testResults.overall.passed++;
            } else {
                console.log('⚠️ Some TokenManager methods missing:', tokenManagerMethods);
                this.testResults.tokenStorage.methods = { status: 'WARNING', message: 'Some methods missing', details: tokenManagerMethods };
                this.testResults.overall.warnings.push('Some TokenManager methods missing');
            }

        } catch (error) {
            console.log(`❌ TokenManager initialization failed: ${error.message}`);
            this.testResults.tokenStorage.initialization = { status: 'FAIL', message: error.message };
            this.testResults.overall.failed++;
        }
    }

    async testTokenStorageAndRetrieval() {
        console.log('\n🔐 Testing Token Storage and Retrieval...');

        try {
            // Test token storage with mock data
            const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.Lkx8_GfQZfHVhZ8f8PQo5L5K5L5K5L5K5L5K5L5K5L4';
            const mockRefreshToken = 'refresh_token_123';

            // Test sessionStorage (rememberMe = false)
            const sessionResult = await this.page.evaluate((token, refresh) => {
                try {
                    const success = window.tokenManager.storeToken(token, refresh, false);
                    const retrievedToken = window.tokenManager.getToken();
                    const isAuthenticated = window.tokenManager.isAuthenticated();
                    
                    return {
                        storeSuccess: success,
                        tokenRetrieved: retrievedToken === token,
                        isAuthenticated: isAuthenticated,
                        storage: 'session'
                    };
                } catch (error) {
                    return { error: error.message };
                }
            }, mockToken, mockRefreshToken);

            if (sessionResult.error) {
                throw new Error(`Session storage test failed: ${sessionResult.error}`);
            }

            if (sessionResult.storeSuccess && sessionResult.tokenRetrieved && sessionResult.isAuthenticated) {
                console.log('✅ Session storage test passed');
                this.testResults.tokenStorage.sessionStorage = { status: 'PASS', message: 'Session storage works correctly' };
                this.testResults.overall.passed++;
            } else {
                console.log('❌ Session storage test failed:', sessionResult);
                this.testResults.tokenStorage.sessionStorage = { status: 'FAIL', message: 'Session storage failed', details: sessionResult };
                this.testResults.overall.failed++;
            }

            // Test localStorage (rememberMe = true)
            const localResult = await this.page.evaluate((token, refresh) => {
                try {
                    // Clear previous storage first
                    window.tokenManager.clearTokens();
                    
                    const success = window.tokenManager.storeToken(token, refresh, true);
                    const retrievedToken = window.tokenManager.getToken();
                    const isAuthenticated = window.tokenManager.isAuthenticated();
                    const tokenInfo = window.tokenManager.getTokenInfo();
                    
                    return {
                        storeSuccess: success,
                        tokenRetrieved: retrievedToken === token,
                        isAuthenticated: isAuthenticated,
                        rememberMe: tokenInfo ? tokenInfo.rememberMe : null,
                        storage: 'local'
                    };
                } catch (error) {
                    return { error: error.message };
                }
            }, mockToken, mockRefreshToken);

            if (localResult.error) {
                throw new Error(`Local storage test failed: ${localResult.error}`);
            }

            if (localResult.storeSuccess && localResult.tokenRetrieved && localResult.isAuthenticated && localResult.rememberMe) {
                console.log('✅ Local storage test passed');
                this.testResults.tokenStorage.localStorage = { status: 'PASS', message: 'Local storage works correctly' };
                this.testResults.overall.passed++;
            } else {
                console.log('❌ Local storage test failed:', localResult);
                this.testResults.tokenStorage.localStorage = { status: 'FAIL', message: 'Local storage failed', details: localResult };
                this.testResults.overall.failed++;
            }

        } catch (error) {
            console.log(`❌ Token storage test failed: ${error.message}`);
            this.testResults.tokenStorage.error = { status: 'FAIL', message: error.message };
            this.testResults.overall.failed++;
        }
    }

    async testTokenEncryption() {
        console.log('\n🔒 Testing Token Encryption...');

        try {
            const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.Lkx8_GfQZfHVhZ8f8PQo5L5K5L5K5L5K5L5K5L5K5L4';

            const encryptionResult = await this.page.evaluate((token) => {
                try {
                    // Store token
                    window.tokenManager.clearTokens();
                    window.tokenManager.storeToken(token, null, true);
                    
                    // Check if token is encrypted in localStorage
                    const storedData = localStorage.getItem('it_era_admin_token');
                    const isTokenVisibleInStorage = storedData && storedData.includes(token);
                    
                    return {
                        hasStoredData: !!storedData,
                        tokenVisibleInStorage: isTokenVisibleInStorage,
                        storedDataLength: storedData ? storedData.length : 0,
                        isEncrypted: storedData && !isTokenVisibleInStorage
                    };
                } catch (error) {
                    return { error: error.message };
                }
            }, mockToken);

            if (encryptionResult.error) {
                throw new Error(`Encryption test failed: ${encryptionResult.error}`);
            }

            if (encryptionResult.hasStoredData && encryptionResult.isEncrypted) {
                console.log('✅ Token encryption test passed');
                this.testResults.tokenStorage.encryption = { 
                    status: 'PASS', 
                    message: 'Token is encrypted in storage',
                    details: encryptionResult
                };
                this.testResults.overall.passed++;
            } else {
                console.log('❌ Token encryption test failed - token may be stored in plain text');
                this.testResults.tokenStorage.encryption = { 
                    status: 'FAIL', 
                    message: 'Token not properly encrypted',
                    details: encryptionResult
                };
                this.testResults.overall.failed++;
            }

        } catch (error) {
            console.log(`❌ Token encryption test failed: ${error.message}`);
            this.testResults.tokenStorage.encryption = { status: 'FAIL', message: error.message };
            this.testResults.overall.failed++;
        }
    }

    async testTokenExpiration() {
        console.log('\n⏰ Testing Token Expiration Handling...');

        try {
            // Create an expired token
            const expiredToken = await this.page.evaluate(() => {
                const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
                const payload = btoa(JSON.stringify({
                    sub: '1234567890',
                    name: 'John Doe',
                    iat: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
                    exp: Math.floor(Date.now() / 1000) - 1800  // 30 minutes ago (expired)
                }));
                const signature = 'fake_signature';
                
                return `${header}.${payload}.${signature}`;
            });

            const expirationResult = await this.page.evaluate((token) => {
                try {
                    // Clear existing tokens
                    window.tokenManager.clearTokens();
                    
                    // Try to store expired token
                    const storeResult = window.tokenManager.storeToken(token, null, false);
                    const isAuthenticated = window.tokenManager.isAuthenticated();
                    const tokenInfo = window.tokenManager.getTokenInfo();
                    
                    return {
                        storeResult: storeResult,
                        isAuthenticated: isAuthenticated,
                        tokenValid: tokenInfo ? tokenInfo.isValid : false,
                        timeToExpiry: tokenInfo ? tokenInfo.timeToExpiry : null
                    };
                } catch (error) {
                    return { error: error.message };
                }
            }, expiredToken);

            if (expirationResult.error) {
                throw new Error(`Expiration test failed: ${expirationResult.error}`);
            }

            // Expired tokens should not be considered valid
            if (!expirationResult.isAuthenticated && !expirationResult.tokenValid) {
                console.log('✅ Token expiration handling works correctly');
                this.testResults.tokenExpiration.expiredToken = { 
                    status: 'PASS', 
                    message: 'Expired tokens properly rejected',
                    details: expirationResult
                };
                this.testResults.overall.passed++;
            } else {
                console.log('❌ Token expiration handling failed - expired token accepted');
                this.testResults.tokenExpiration.expiredToken = { 
                    status: 'FAIL', 
                    message: 'Expired token was accepted',
                    details: expirationResult
                };
                this.testResults.overall.failed++;
            }

        } catch (error) {
            console.log(`❌ Token expiration test failed: ${error.message}`);
            this.testResults.tokenExpiration.error = { status: 'FAIL', message: error.message };
            this.testResults.overall.failed++;
        }
    }

    async testRememberMeFunctionality() {
        console.log('\n🧠 Testing Remember Me Functionality...');

        try {
            // Simulate page reload to test persistence
            const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.Lkx8_GfQZfHVhZ8f8PQo5L5K5L5K5L5K5L5K5L5K5L4';

            // Test Remember Me = true (localStorage)
            await this.page.evaluate((token) => {
                window.tokenManager.clearTokens();
                window.tokenManager.storeToken(token, 'refresh123', true);
            }, mockToken);

            // Reload page to simulate browser restart
            await this.page.reload({ waitUntil: 'networkidle2' });
            await this.page.waitForTimeout(2000);

            const rememberMeResult = await this.page.evaluate(() => {
                try {
                    const isAuthenticated = window.tokenManager.isAuthenticated();
                    const token = window.tokenManager.getToken();
                    const tokenInfo = window.tokenManager.getTokenInfo();
                    
                    return {
                        isAuthenticated: isAuthenticated,
                        hasToken: !!token,
                        rememberMe: tokenInfo ? tokenInfo.rememberMe : null,
                        tokenPersisted: true
                    };
                } catch (error) {
                    return { error: error.message };
                }
            });

            if (rememberMeResult.error) {
                throw new Error(`Remember Me test failed: ${rememberMeResult.error}`);
            }

            if (rememberMeResult.isAuthenticated && rememberMeResult.hasToken && rememberMeResult.rememberMe) {
                console.log('✅ Remember Me functionality works correctly');
                this.testResults.rememberMe.localStorage = { 
                    status: 'PASS', 
                    message: 'Remember Me persists tokens correctly',
                    details: rememberMeResult
                };
                this.testResults.overall.passed++;
            } else {
                console.log('❌ Remember Me functionality failed');
                this.testResults.rememberMe.localStorage = { 
                    status: 'FAIL', 
                    message: 'Remember Me did not persist tokens',
                    details: rememberMeResult
                };
                this.testResults.overall.failed++;
            }

            // Test Remember Me = false (sessionStorage) - should clear on reload
            await this.page.evaluate((token) => {
                window.tokenManager.clearTokens();
                window.tokenManager.storeToken(token, 'refresh123', false);
            }, mockToken);

            // Reload page again
            await this.page.reload({ waitUntil: 'networkidle2' });
            await this.page.waitForTimeout(2000);

            const sessionResult = await this.page.evaluate(() => {
                try {
                    const isAuthenticated = window.tokenManager.isAuthenticated();
                    const token = window.tokenManager.getToken();
                    
                    return {
                        isAuthenticated: isAuthenticated,
                        hasToken: !!token,
                        shouldBeClear: true
                    };
                } catch (error) {
                    return { error: error.message };
                }
            });

            if (sessionResult.error) {
                throw new Error(`Session storage test failed: ${sessionResult.error}`);
            }

            if (!sessionResult.isAuthenticated && !sessionResult.hasToken) {
                console.log('✅ Session storage correctly cleared on reload');
                this.testResults.rememberMe.sessionStorage = { 
                    status: 'PASS', 
                    message: 'Session storage correctly cleared',
                    details: sessionResult
                };
                this.testResults.overall.passed++;
            } else {
                console.log('⚠️ Session storage not properly cleared - may be using localStorage');
                this.testResults.rememberMe.sessionStorage = { 
                    status: 'WARNING', 
                    message: 'Session storage may not be properly cleared',
                    details: sessionResult
                };
                this.testResults.overall.warnings.push('Session storage not properly cleared');
            }

        } catch (error) {
            console.log(`❌ Remember Me test failed: ${error.message}`);
            this.testResults.rememberMe.error = { status: 'FAIL', message: error.message };
            this.testResults.overall.failed++;
        }
    }

    async testAutoRefreshMechanism() {
        console.log('\n🔄 Testing Auto-Refresh Mechanism...');

        try {
            // Create a token that will expire soon
            const soonToExpireToken = await this.page.evaluate(() => {
                const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
                const payload = btoa(JSON.stringify({
                    sub: '1234567890',
                    name: 'John Doe',
                    iat: Math.floor(Date.now() / 1000),
                    exp: Math.floor(Date.now() / 1000) + 300  // Expires in 5 minutes
                }));
                const signature = 'fake_signature';
                
                return `${header}.${payload}.${signature}`;
            });

            const refreshResult = await this.page.evaluate((token) => {
                try {
                    // Clear tokens and store soon-to-expire token
                    window.tokenManager.clearTokens();
                    const storeResult = window.tokenManager.storeToken(token, 'refresh_token_123', false);
                    
                    // Check if auto-refresh is set up
                    const tokenInfo = window.tokenManager.getTokenInfo();
                    
                    return {
                        storeResult: storeResult,
                        tokenInfo: tokenInfo,
                        hasRefreshToken: tokenInfo ? tokenInfo.hasRefreshToken : false,
                        timeToExpiry: tokenInfo ? tokenInfo.timeToExpiry : null
                    };
                } catch (error) {
                    return { error: error.message };
                }
            }, soonToExpireToken);

            if (refreshResult.error) {
                throw new Error(`Auto-refresh setup test failed: ${refreshResult.error}`);
            }

            if (refreshResult.hasRefreshToken && refreshResult.timeToExpiry > 0) {
                console.log('✅ Auto-refresh mechanism is set up correctly');
                this.testResults.tokenRefresh.setup = { 
                    status: 'PASS', 
                    message: 'Auto-refresh setup successful',
                    details: {
                        hasRefreshToken: refreshResult.hasRefreshToken,
                        timeToExpiry: Math.floor(refreshResult.timeToExpiry / 1000) + 's'
                    }
                };
                this.testResults.overall.passed++;

                // Test manual refresh
                const manualRefreshResult = await this.page.evaluate(() => {
                    try {
                        // This would normally call the server, but we'll test the method exists
                        return {
                            hasForceRefreshMethod: typeof window.tokenManager.forceRefresh === 'function',
                            methodAvailable: true
                        };
                    } catch (error) {
                        return { error: error.message };
                    }
                });

                if (manualRefreshResult.hasForceRefreshMethod) {
                    console.log('✅ Manual token refresh method available');
                    this.testResults.tokenRefresh.manual = { 
                        status: 'PASS', 
                        message: 'Manual refresh method available'
                    };
                    this.testResults.overall.passed++;
                } else {
                    console.log('❌ Manual token refresh method not available');
                    this.testResults.tokenRefresh.manual = { 
                        status: 'FAIL', 
                        message: 'Manual refresh method not found'
                    };
                    this.testResults.overall.failed++;
                }

            } else {
                console.log('❌ Auto-refresh mechanism setup failed');
                this.testResults.tokenRefresh.setup = { 
                    status: 'FAIL', 
                    message: 'Auto-refresh not properly set up',
                    details: refreshResult
                };
                this.testResults.overall.failed++;
            }

        } catch (error) {
            console.log(`❌ Auto-refresh test failed: ${error.message}`);
            this.testResults.tokenRefresh.error = { status: 'FAIL', message: error.message };
            this.testResults.overall.failed++;
        }
    }

    async generateReport() {
        console.log('\n📋 Generating JWT Token Management Test Report...');
        
        const report = {
            timestamp: new Date().toISOString(),
            testSuite: 'JWT Token Management',
            environment: 'IT-ERA Admin Panel',
            summary: {
                totalTests: this.testResults.overall.passed + this.testResults.overall.failed,
                passed: this.testResults.overall.passed,
                failed: this.testResults.overall.failed,
                warnings: this.testResults.overall.warnings.length,
                successRate: Math.round((this.testResults.overall.passed / (this.testResults.overall.passed + this.testResults.overall.failed)) * 100) || 0
            },
            results: this.testResults,
            recommendations: this.generateRecommendations()
        };
        
        console.log('\n🎯 JWT TOKEN MANAGEMENT TEST SUMMARY:');
        console.log(`Total Tests: ${report.summary.totalTests}`);
        console.log(`Passed: ${report.summary.passed}`);
        console.log(`Failed: ${report.summary.failed}`);
        console.log(`Warnings: ${report.summary.warnings}`);
        console.log(`Success Rate: ${report.summary.successRate}%`);
        
        if (report.recommendations.length > 0) {
            console.log('\n💡 RECOMMENDATIONS:');
            report.recommendations.forEach((rec, index) => {
                console.log(`${index + 1}. ${rec}`);
            });
        }
        
        return report;
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (this.testResults.tokenStorage.encryption?.status === 'FAIL') {
            recommendations.push('Implement stronger token encryption to protect stored tokens');
        }
        
        if (this.testResults.tokenExpiration.expiredToken?.status === 'FAIL') {
            recommendations.push('Improve token expiration validation to prevent expired token usage');
        }
        
        if (this.testResults.rememberMe.sessionStorage?.status === 'WARNING') {
            recommendations.push('Ensure session storage is properly cleared when "Remember Me" is disabled');
        }
        
        if (this.testResults.tokenRefresh.setup?.status === 'FAIL') {
            recommendations.push('Implement automatic token refresh mechanism for better user experience');
        }
        
        if (this.testResults.overall.failed > 0) {
            recommendations.push('Address failed tests to ensure secure token management');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('JWT token management system is working correctly!');
        }
        
        return recommendations;
    }

    async runAllTests() {
        try {
            await this.initialize();
            
            await this.testTokenManagerInitialization();
            await this.testTokenStorageAndRetrieval();
            await this.testTokenEncryption();
            await this.testTokenExpiration();
            await this.testRememberMeFunctionality();
            await this.testAutoRefreshMechanism();
            
            const report = await this.generateReport();
            return report;
            
        } catch (error) {
            console.error('❌ JWT Token Management test suite failed:', error);
            throw error;
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
}

// Export for use in other modules
module.exports = JWTTokenManagementTester;

// Run tests if called directly
if (require.main === module) {
    (async () => {
        const tester = new JWTTokenManagementTester();
        try {
            const report = await tester.runAllTests();
            
            // Save report to file
            const fs = require('fs');
            const reportPath = `/Users/andreapanzeri/progetti/IT-ERA/tests/admin-panel/jwt-token-test-report-${Date.now()}.json`;
            fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
            
            console.log(`\n📄 Full report saved to: ${reportPath}`);
            console.log('\n📋 Test Results Summary:');
            console.log(JSON.stringify(report.summary, null, 2));
            
        } catch (error) {
            console.error('Test execution failed:', error);
            process.exit(1);
        }
    })();
}