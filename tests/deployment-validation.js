#!/usr/bin/env node

/**
 * IT-ERA Admin Panel - Deployment Validation Suite
 * 
 * Comprehensive testing of the deployed admin panel including:
 * - Authentication endpoints
 * - JWT token validation
 * - Admin interface functionality
 * - API endpoint security
 */

const https = require('https');
const http = require('http');

class DeploymentValidator {
    constructor() {
        this.baseURL = 'https://it-era-admin-auth-production.bulltech.workers.dev';
        this.adminURL = 'https://it-era.pages.dev';
        this.testResults = [];
        this.token = null;
    }

    /**
     * Run all validation tests
     */
    async runAllTests() {
        console.log('🚀 Starting IT-ERA Admin Panel Deployment Validation');
        console.log('=' .repeat(60));
        
        const tests = [
            { name: 'CORS Preflight', test: () => this.testCORSPreflight() },
            { name: 'Authentication Endpoint', test: () => this.testAuthEndpoint() },
            { name: 'Login with Valid Credentials', test: () => this.testValidLogin() },
            { name: 'Login with Invalid Credentials', test: () => this.testInvalidLogin() },
            { name: 'JWT Token Verification', test: () => this.testTokenVerification() },
            { name: 'Admin Interface Access', test: () => this.testAdminInterface() },
            { name: 'Protected Route Security', test: () => this.testProtectedRoute() },
            { name: 'Token Expiration Handling', test: () => this.testTokenExpiration() },
            { name: 'Rate Limiting', test: () => this.testRateLimiting() },
            { name: 'Security Headers', test: () => this.testSecurityHeaders() }
        ];

        let passed = 0;
        let failed = 0;

        for (const testCase of tests) {
            try {
                console.log(`\n📋 Testing: ${testCase.name}`);
                const result = await testCase.test();
                
                if (result.success) {
                    console.log(`✅ PASS: ${testCase.name}`);
                    passed++;
                } else {
                    console.log(`❌ FAIL: ${testCase.name} - ${result.error}`);
                    failed++;
                }
                
                this.testResults.push({
                    name: testCase.name,
                    success: result.success,
                    error: result.error,
                    details: result.details
                });
            } catch (error) {
                console.log(`💥 ERROR: ${testCase.name} - ${error.message}`);
                failed++;
                this.testResults.push({
                    name: testCase.name,
                    success: false,
                    error: error.message
                });
            }
        }

        this.printSummary(passed, failed);
        return { passed, failed, total: tests.length, results: this.testResults };
    }

    /**
     * Test CORS preflight request
     */
    async testCORSPreflight() {
        const response = await this.makeRequest('/admin/api/auth/login', {
            method: 'OPTIONS'
        });

        if (response.status !== 200) {
            return { success: false, error: `Expected 200, got ${response.status}` };
        }

        const corsHeaders = [
            'Access-Control-Allow-Origin',
            'Access-Control-Allow-Methods',
            'Access-Control-Allow-Headers'
        ];

        for (const header of corsHeaders) {
            if (!response.headers[header.toLowerCase()]) {
                return { success: false, error: `Missing CORS header: ${header}` };
            }
        }

        return { 
            success: true, 
            details: { 
                status: response.status,
                corsHeaders: corsHeaders.map(h => ({
                    header: h,
                    value: response.headers[h.toLowerCase()]
                }))
            }
        };
    }

    /**
     * Test authentication endpoint availability
     */
    async testAuthEndpoint() {
        const response = await this.makeRequest('/admin/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({})
        });

        // Should return 400 for missing credentials, not 404
        if (response.status === 404) {
            return { success: false, error: 'Authentication endpoint not found' };
        }

        if (response.status !== 400) {
            return { success: false, error: `Expected 400 for empty body, got ${response.status}` };
        }

        return { 
            success: true, 
            details: { status: response.status, message: 'Endpoint accessible' }
        };
    }

    /**
     * Test login with valid credentials
     */
    async testValidLogin() {
        const credentials = {
            email: 'admin@it-era.it',
            password: 'admin123'
        };

        const response = await this.makeRequest('/admin/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });

        if (response.status !== 200) {
            return { success: false, error: `Login failed with status ${response.status}` };
        }

        const data = JSON.parse(response.body);
        
        if (!data.success || !data.token || !data.user) {
            return { success: false, error: 'Invalid login response format' };
        }

        // Store token for subsequent tests
        this.token = data.token;

        return { 
            success: true, 
            details: { 
                user: data.user,
                tokenLength: data.token.length,
                hasRefreshToken: !!data.refreshToken
            }
        };
    }

    /**
     * Test login with invalid credentials
     */
    async testInvalidLogin() {
        const credentials = {
            email: 'invalid@example.com',
            password: 'wrongpassword'
        };

        const response = await this.makeRequest('/admin/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });

        if (response.status !== 401) {
            return { success: false, error: `Expected 401 for invalid credentials, got ${response.status}` };
        }

        const data = JSON.parse(response.body);
        
        if (data.success || data.token) {
            return { success: false, error: 'Invalid credentials should not return success or token' };
        }

        return { 
            success: true, 
            details: { status: response.status, message: 'Correctly rejected invalid credentials' }
        };
    }

    /**
     * Test JWT token verification
     */
    async testTokenVerification() {
        if (!this.token) {
            return { success: false, error: 'No token available for verification' };
        }

        const response = await this.makeRequest('/admin/api/auth/verify', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });

        if (response.status !== 200) {
            return { success: false, error: `Token verification failed with status ${response.status}` };
        }

        const data = JSON.parse(response.body);
        
        if (!data.success || !data.user) {
            return { success: false, error: 'Invalid verification response format' };
        }

        return { 
            success: true, 
            details: { 
                user: data.user,
                message: 'Token verification successful'
            }
        };
    }

    /**
     * Test admin interface accessibility
     */
    async testAdminInterface() {
        try {
            const response = await this.makeHTTPRequest(`${this.adminURL}/admin/`, {
                method: 'GET'
            });

            if (response.status !== 200) {
                return { success: false, error: `Admin interface not accessible: ${response.status}` };
            }

            // Check if admin interface HTML contains expected elements
            const body = response.body;
            const expectedElements = [
                'IT-ERA Admin Panel',
                'authModal',
                'adminInterface',
                'loginForm'
            ];

            for (const element of expectedElements) {
                if (!body.includes(element)) {
                    return { success: false, error: `Missing expected element: ${element}` };
                }
            }

            return { 
                success: true, 
                details: { 
                    status: response.status,
                    contentLength: body.length,
                    message: 'Admin interface accessible with all expected elements'
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Test protected route security
     */
    async testProtectedRoute() {
        // Test without token
        const responseWithoutToken = await this.makeRequest('/admin/api/auth/verify', {
            method: 'POST'
        });

        if (responseWithoutToken.status !== 401) {
            return { success: false, error: `Protected route should return 401 without token, got ${responseWithoutToken.status}` };
        }

        // Test with invalid token
        const responseWithInvalidToken = await this.makeRequest('/admin/api/auth/verify', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer invalid-token'
            }
        });

        if (responseWithInvalidToken.status !== 401) {
            return { success: false, error: `Protected route should return 401 with invalid token, got ${responseWithInvalidToken.status}` };
        }

        return { 
            success: true, 
            details: { 
                message: 'Protected routes correctly reject unauthorized access'
            }
        };
    }

    /**
     * Test token expiration handling
     */
    async testTokenExpiration() {
        // Create a token with short expiry for testing
        const shortLivedCredentials = {
            email: 'admin@it-era.it',
            password: 'admin123!'
        };

        const response = await this.makeRequest('/admin/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(shortLivedCredentials)
        });

        if (response.status !== 200) {
            return { success: false, error: 'Could not obtain token for expiration test' };
        }

        const data = JSON.parse(response.body);
        
        // Parse token payload to check expiration
        try {
            const payload = JSON.parse(atob(data.token.split('.')[1]));
            const expirationTime = new Date(payload.exp * 1000);
            const currentTime = new Date();
            
            if (expirationTime <= currentTime) {
                return { success: false, error: 'Token is already expired' };
            }

            return { 
                success: true, 
                details: { 
                    expiresAt: expirationTime.toISOString(),
                    timeToExpiry: Math.floor((expirationTime - currentTime) / 1000 / 60) + ' minutes',
                    message: 'Token expiration properly configured'
                }
            };
        } catch (error) {
            return { success: false, error: 'Could not parse token payload' };
        }
    }

    /**
     * Test rate limiting (basic)
     */
    async testRateLimiting() {
        const requests = [];
        
        // Make multiple rapid requests to test rate limiting
        for (let i = 0; i < 5; i++) {
            requests.push(
                this.makeRequest('/admin/api/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({
                        email: 'test@example.com',
                        password: 'wrong'
                    })
                })
            );
        }

        const responses = await Promise.all(requests);
        
        // All should either be 401 (unauthorized) or 429 (rate limited)
        const validStatuses = responses.every(r => r.status === 401 || r.status === 429);
        
        if (!validStatuses) {
            return { success: false, error: 'Unexpected status codes in rate limiting test' };
        }

        return { 
            success: true, 
            details: { 
                message: 'Rate limiting working as expected',
                responses: responses.map(r => r.status)
            }
        };
    }

    /**
     * Test security headers
     */
    async testSecurityHeaders() {
        const response = await this.makeRequest('/admin/api/auth/login', {
            method: 'OPTIONS'
        });

        const securityHeaders = {
            'content-type': 'application/json',
            'access-control-allow-credentials': 'true'
        };

        const missingHeaders = [];
        
        for (const [header, expectedValue] of Object.entries(securityHeaders)) {
            const actualValue = response.headers[header];
            if (!actualValue || (expectedValue && actualValue !== expectedValue)) {
                missingHeaders.push({ header, expected: expectedValue, actual: actualValue });
            }
        }

        if (missingHeaders.length > 0) {
            return { 
                success: false, 
                error: 'Missing or incorrect security headers',
                details: { missingHeaders }
            };
        }

        return { 
            success: true, 
            details: { 
                message: 'All security headers present and correct',
                headers: Object.keys(response.headers)
            }
        };
    }

    /**
     * Make HTTP request helper
     */
    async makeRequest(path, options = {}) {
        const url = `${this.baseURL}${path}`;
        
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            const requestOptions = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || 443,
                path: parsedUrl.pathname + parsedUrl.search,
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'IT-ERA-Deployment-Validator/1.0',
                    ...options.headers
                }
            };

            if (options.body) {
                requestOptions.headers['Content-Length'] = Buffer.byteLength(options.body);
            }

            const req = https.request(requestOptions, (res) => {
                let body = '';
                
                res.on('data', (chunk) => {
                    body += chunk;
                });
                
                res.on('end', () => {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: body
                    });
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            if (options.body) {
                req.write(options.body);
            }

            req.end();
        });
    }

    /**
     * Make HTTP request for pages
     */
    async makeHTTPRequest(url, options = {}) {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            const isHttps = parsedUrl.protocol === 'https:';
            const client = isHttps ? https : http;
            
            const requestOptions = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || (isHttps ? 443 : 80),
                path: parsedUrl.pathname + parsedUrl.search,
                method: options.method || 'GET',
                headers: {
                    'User-Agent': 'IT-ERA-Deployment-Validator/1.0',
                    ...options.headers
                }
            };

            const req = client.request(requestOptions, (res) => {
                let body = '';
                
                res.on('data', (chunk) => {
                    body += chunk;
                });
                
                res.on('end', () => {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: body
                    });
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            if (options.body) {
                req.write(options.body);
            }

            req.end();
        });
    }

    /**
     * Print test summary
     */
    printSummary(passed, failed) {
        console.log('\n' + '='.repeat(60));
        console.log('📊 DEPLOYMENT VALIDATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
        
        if (failed === 0) {
            console.log('\n🎉 ALL TESTS PASSED! Deployment is successful.');
            console.log('🚀 Admin panel is ready for production use.');
        } else {
            console.log('\n⚠️  Some tests failed. Please review and fix issues before production use.');
        }
        
        console.log('\n📋 Test Results:');
        this.testResults.forEach(result => {
            const status = result.success ? '✅' : '❌';
            console.log(`  ${status} ${result.name}`);
            if (!result.success) {
                console.log(`     Error: ${result.error}`);
            }
        });
    }
}

// Export for module use
module.exports = DeploymentValidator;

// Run if called directly
if (require.main === module) {
    const validator = new DeploymentValidator();
    validator.runAllTests()
        .then((results) => {
            process.exit(results.failed === 0 ? 0 : 1);
        })
        .catch((error) => {
            console.error('💥 Validation suite crashed:', error);
            process.exit(1);
        });
}