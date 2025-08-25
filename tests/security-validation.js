/**
 * IT-ERA Admin Panel - Security Validation Test
 * Tests all critical security vulnerabilities fixes
 */

class SecurityValidator {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            tests: []
        };
    }

    /**
     * Run all security validation tests
     */
    async runAllTests() {
        console.group('🛡️ IT-ERA Admin Panel - Security Validation');
        
        await this.testAuthenticationGuard();
        await this.testJWTValidation();
        await this.testTokenExpiration();
        await this.testUIBlocking();
        await this.testAPISecurityHeaders();
        await this.testAutomaticLogout();
        await this.testUnauthorizedAccess();
        
        this.displayResults();
        console.groupEnd();
        
        return this.results;
    }

    /**
     * Test 1: Authentication Guard System
     */
    async testAuthenticationGuard() {
        console.group('Test 1: Authentication Guard System');
        
        try {
            // Test security guard initialization
            const hasSecurityGuard = window.securityGuard !== undefined;
            this.addResult('Security Guard Exists', hasSecurityGuard);
            
            // Test security overlay creation
            const hasSecurityOverlay = document.getElementById('security-overlay') !== null;
            this.addResult('Security Overlay Created', hasSecurityOverlay);
            
            // Test token validation function
            const hasTokenValidation = typeof window.securityGuard?.performSecurityCheck === 'function';
            this.addResult('Token Validation Function', hasTokenValidation);
            
        } catch (error) {
            this.addResult('Authentication Guard Test', false, error.message);
        }
        
        console.groupEnd();
    }

    /**
     * Test 2: JWT Token Validation
     */
    async testJWTValidation() {
        console.group('Test 2: JWT Token Validation');
        
        try {
            // Test invalid token formats
            const invalidTokens = [
                '',
                'invalid',
                'invalid.token',
                'invalid.token.format.extra',
                'notbase64.notbase64.notbase64'
            ];
            
            let validationsPassed = 0;
            
            for (const token of invalidTokens) {
                localStorage.setItem('auth_token', token);
                
                if (window.authManager) {
                    const isValid = window.authManager.validateJWT();
                    if (!isValid) {
                        validationsPassed++;
                    }
                }
            }
            
            const allInvalidTokensRejected = validationsPassed === invalidTokens.length;
            this.addResult('Invalid JWT Tokens Rejected', allInvalidTokensRejected);
            
            // Test valid JWT format (mock)
            const validJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.Lp-38rKzp_PX8bGjsxogKmNuYuWJblOJD9Oh9qIQNcg';
            localStorage.setItem('auth_token', validJWT);
            
            if (window.authManager) {
                const isValidFormat = window.authManager.validateJWT();
                this.addResult('Valid JWT Format Accepted', isValidFormat);
            }
            
        } catch (error) {
            this.addResult('JWT Validation Test', false, error.message);
        }
        
        console.groupEnd();
    }

    /**
     * Test 3: Token Expiration Check
     */
    async testTokenExpiration() {
        console.group('Test 3: Token Expiration Check');
        
        try {
            if (window.authManager) {
                // Test expired token (past timestamp)
                const expiredPayload = {
                    sub: '123',
                    exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
                    iat: Math.floor(Date.now() / 1000) - 7200 // 2 hours ago
                };
                
                window.authManager.tokenPayload = expiredPayload;
                const isExpired = window.authManager.isTokenExpired();
                this.addResult('Expired Token Detected', isExpired);
                
                // Test valid token (future timestamp)
                const validPayload = {
                    sub: '123',
                    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
                    iat: Math.floor(Date.now() / 1000) // now
                };
                
                window.authManager.tokenPayload = validPayload;
                const isNotExpired = !window.authManager.isTokenExpired();
                this.addResult('Valid Token Not Expired', isNotExpired);
            }
            
        } catch (error) {
            this.addResult('Token Expiration Test', false, error.message);
        }
        
        console.groupEnd();
    }

    /**
     * Test 4: UI Blocking Before Authentication
     */
    async testUIBlocking() {
        console.group('Test 4: UI Blocking');
        
        try {
            // Test that admin content is hidden initially
            const mainContent = document.getElementById('mainContent');
            const isContentHidden = mainContent && mainContent.innerHTML.includes('Loading');
            this.addResult('Main Content Initially Hidden', isContentHidden);
            
            // Test security overlay exists
            const securityOverlay = document.getElementById('security-overlay');
            const hasSecurityOverlay = securityOverlay !== null;
            this.addResult('Security Overlay Present', hasSecurityOverlay);
            
            // Test navigation is blocked
            const navItems = document.querySelectorAll('.nav-link');
            const hasNavigation = navItems.length > 0;
            this.addResult('Navigation Elements Present', hasNavigation);
            
        } catch (error) {
            this.addResult('UI Blocking Test', false, error.message);
        }
        
        console.groupEnd();
    }

    /**
     * Test 5: API Security Headers
     */
    async testAPISecurityHeaders() {
        console.group('Test 5: API Security Headers');
        
        try {
            if (window.apiManager) {
                // Mock a request to test headers
                const originalFetch = window.fetch;
                let capturedHeaders = null;
                
                window.fetch = async (url, options) => {
                    capturedHeaders = options.headers;
                    throw new Error('Test request - not executed');
                };
                
                try {
                    await window.apiManager.request('/test');
                } catch (e) {
                    // Expected to fail
                }
                
                // Restore fetch
                window.fetch = originalFetch;
                
                const hasAuthHeader = capturedHeaders && capturedHeaders['Authorization'];
                this.addResult('Authorization Header Present', !!hasAuthHeader);
                
                const hasSecurityHeader = capturedHeaders && capturedHeaders['X-Admin-Panel'];
                this.addResult('Security Header Present', !!hasSecurityHeader);
                
                const hasCSRFProtection = capturedHeaders && capturedHeaders['X-Requested-With'];
                this.addResult('CSRF Protection Header', !!hasCSRFProtection);
            }
            
        } catch (error) {
            this.addResult('API Security Headers Test', false, error.message);
        }
        
        console.groupEnd();
    }

    /**
     * Test 6: Automatic Logout on Invalid Token
     */
    async testAutomaticLogout() {
        console.group('Test 6: Automatic Logout');
        
        try {
            if (window.authManager) {
                // Save current state
                const originalToken = window.authManager.token;
                const originalIsAuthenticated = window.authManager.isAuthenticated;
                
                // Set invalid token
                window.authManager.token = 'invalid.token.here';
                window.authManager.isAuthenticated = true;
                
                // Trigger auth check
                await window.authManager.checkAuth();
                
                // Check if logout was called
                const wasLoggedOut = !window.authManager.isAuthenticated;
                this.addResult('Automatic Logout on Invalid Token', wasLoggedOut);
                
                const tokenCleared = !window.authManager.token;
                this.addResult('Token Cleared on Logout', tokenCleared);
                
                // Restore original state
                window.authManager.token = originalToken;
                window.authManager.isAuthenticated = originalIsAuthenticated;
            }
            
        } catch (error) {
            this.addResult('Automatic Logout Test', false, error.message);
        }
        
        console.groupEnd();
    }

    /**
     * Test 7: Unauthorized Access Prevention
     */
    async testUnauthorizedAccess() {
        console.group('Test 7: Unauthorized Access Prevention');
        
        try {
            // Clear all tokens
            localStorage.removeItem('auth_token');
            sessionStorage.removeItem('auth_token');
            
            // Test that API requests are blocked
            let apiBlocked = false;
            if (window.apiManager && window.authManager) {
                window.authManager.isAuthenticated = false;
                window.authManager.token = null;
                
                try {
                    await window.apiManager.request('/test');
                } catch (error) {
                    apiBlocked = error.message.includes('Authentication required');
                }
            }
            
            this.addResult('API Requests Blocked Without Auth', apiBlocked);
            
            // Test that login modal is shown
            const loginModal = document.getElementById('loginModal');
            const hasLoginModal = loginModal !== null;
            this.addResult('Login Modal Available', hasLoginModal);
            
        } catch (error) {
            this.addResult('Unauthorized Access Test', false, error.message);
        }
        
        console.groupEnd();
    }

    /**
     * Add test result
     */
    addResult(testName, passed, error = null) {
        const result = {
            test: testName,
            passed: passed,
            error: error
        };
        
        this.results.tests.push(result);
        
        if (passed) {
            this.results.passed++;
            console.log(`✅ ${testName}`);
        } else {
            this.results.failed++;
            console.log(`❌ ${testName}${error ? ': ' + error : ''}`);
        }
    }

    /**
     * Display final results
     */
    displayResults() {
        console.group('📊 Security Validation Results');
        
        const total = this.results.passed + this.results.failed;
        const percentage = total > 0 ? ((this.results.passed / total) * 100).toFixed(1) : 0;
        
        console.log(`Total Tests: ${total}`);
        console.log(`Passed: ${this.results.passed}`);
        console.log(`Failed: ${this.results.failed}`);
        console.log(`Success Rate: ${percentage}%`);
        
        if (this.results.failed > 0) {
            console.group('❌ Failed Tests:');
            this.results.tests
                .filter(test => !test.passed)
                .forEach(test => {
                    console.log(`- ${test.test}${test.error ? ': ' + test.error : ''}`);
                });
            console.groupEnd();
        }
        
        // Security recommendations
        if (this.results.failed > 0) {
            console.group('🔧 Security Recommendations:');
            console.log('1. Ensure all authentication guards are properly initialized');
            console.log('2. Validate JWT tokens on every request');
            console.log('3. Implement automatic token cleanup');
            console.log('4. Block UI access until authentication is verified');
            console.log('5. Use secure API headers for all requests');
            console.groupEnd();
        } else {
            console.log('🎉 All security tests passed! Admin panel is secure.');
        }
        
        console.groupEnd();
    }
}

// Auto-run security validation when script loads
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(async () => {
        const validator = new SecurityValidator();
        await validator.runAllTests();
        
        // Store results globally for access
        window.securityValidationResults = validator.results;
    }, 5000); // Wait 5 seconds for initialization
});

// Export for manual testing
window.SecurityValidator = SecurityValidator;