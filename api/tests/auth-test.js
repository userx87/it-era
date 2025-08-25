/**
 * IT-ERA Authentication Endpoint Test Suite
 * Tests the standalone authentication worker implementation
 */

const ENDPOINTS = {
  dev: 'http://localhost:8787/admin/api/auth',
  prod: 'https://it-era.pages.dev/admin/api/auth'
};

const TEST_CREDENTIALS = {
  valid: {
    email: 'admin@it-era.it',
    password: 'admin123!'
  },
  invalid: {
    email: 'wrong@example.com',
    password: 'wrongpass'
  }
};

class AuthTester {
  constructor(baseUrl = ENDPOINTS.prod) {
    this.baseUrl = baseUrl;
    this.results = [];
  }

  async runTest(name, testFn) {
    console.log(`\n🧪 Running test: ${name}`);
    try {
      const result = await testFn();
      console.log(`✅ ${name}: PASSED`);
      this.results.push({ name, status: 'PASSED', result });
      return result;
    } catch (error) {
      console.log(`❌ ${name}: FAILED`);
      console.log(`   Error: ${error.message}`);
      this.results.push({ name, status: 'FAILED', error: error.message });
      throw error;
    }
  }

  async testLogin(credentials, shouldSucceed = true) {
    const response = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    });

    const data = await response.json();
    
    if (shouldSucceed) {
      if (!response.ok || !data.success) {
        throw new Error(`Expected success but got: ${data.error || response.statusText}`);
      }
      if (!data.token || !data.user) {
        throw new Error('Missing token or user data in successful response');
      }
      return { response, data };
    } else {
      if (response.ok && data.success) {
        throw new Error('Expected failure but got success');
      }
      return { response, data };
    }
  }

  async testVerify(token, shouldSucceed = true) {
    const response = await fetch(`${this.baseUrl}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (shouldSucceed) {
      if (!response.ok || !data.success) {
        throw new Error(`Expected success but got: ${data.error || response.statusText}`);
      }
      if (!data.user) {
        throw new Error('Missing user data in successful response');
      }
      return { response, data };
    } else {
      if (response.ok && data.success) {
        throw new Error('Expected failure but got success');
      }
      return { response, data };
    }
  }

  async testCors(endpoint) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://it-era.pages.dev',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });

    if (!response.ok) {
      throw new Error(`CORS preflight failed with status: ${response.status}`);
    }

    const corsHeaders = [
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Methods',
      'Access-Control-Allow-Headers'
    ];

    for (const header of corsHeaders) {
      if (!response.headers.get(header)) {
        throw new Error(`Missing CORS header: ${header}`);
      }
    }

    return response;
  }

  async runAllTests() {
    console.log(`🚀 Starting authentication tests for: ${this.baseUrl}`);
    console.log('='.repeat(60));

    try {
      // Test CORS
      await this.runTest('CORS Preflight - /login', () => this.testCors('/login'));
      await this.runTest('CORS Preflight - /verify', () => this.testCors('/verify'));

      // Test valid login
      const loginResult = await this.runTest('Valid Login', () => 
        this.testLogin(TEST_CREDENTIALS.valid, true)
      );
      const token = loginResult.data.token;

      // Test invalid login
      await this.runTest('Invalid Login', () => 
        this.testLogin(TEST_CREDENTIALS.invalid, false)
      );

      // Test token verification
      await this.runTest('Valid Token Verification', () => 
        this.testVerify(token, true)
      );

      // Test invalid token
      await this.runTest('Invalid Token Verification', () => 
        this.testVerify('invalid-token', false)
      );

      // Test missing credentials
      await this.runTest('Missing Credentials', async () => {
        const response = await fetch(`${this.baseUrl}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        
        if (response.ok) {
          throw new Error('Expected failure for missing credentials');
        }
        return response;
      });

      // Test user data structure
      await this.runTest('User Data Structure', () => {
        const userData = loginResult.data.user;
        const requiredFields = ['id', 'email', 'name', 'role'];
        
        for (const field of requiredFields) {
          if (!userData[field]) {
            throw new Error(`Missing required user field: ${field}`);
          }
        }
        
        if (userData.email !== TEST_CREDENTIALS.valid.email) {
          throw new Error('User email mismatch');
        }
        
        return userData;
      });

    } catch (error) {
      console.log(`\n💥 Test suite failed: ${error.message}`);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    
    const passed = this.results.filter(r => r.status === 'PASSED').length;
    const failed = this.results.filter(r => r.status === 'FAILED').length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%`);
    
    if (failed === 0) {
      console.log('\n🎉 All tests passed! Authentication endpoint is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the implementation.');
    }

    return {
      passed,
      failed,
      total: this.results.length,
      results: this.results
    };
  }
}

// CLI usage
if (typeof process !== 'undefined' && process.argv) {
  const args = process.argv.slice(2);
  const env = args[0] || 'prod';
  const endpoint = ENDPOINTS[env] || ENDPOINTS.prod;
  
  console.log(`🔧 Testing environment: ${env}`);
  console.log(`🌐 Endpoint: ${endpoint}`);
  
  const tester = new AuthTester(endpoint);
  tester.runAllTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}

// Export for use in other modules
if (typeof module !== 'undefined') {
  module.exports = { AuthTester, ENDPOINTS, TEST_CREDENTIALS };
}