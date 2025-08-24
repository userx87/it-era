/**
 * Authentication Unit Tests for IT-ERA Admin Panel
 * Tests login, logout, token validation, and session management
 */

const { testUtils } = require('../utils/setup');
const testData = require('../fixtures/testData');

describe('Authentication Unit Tests', () => {
  let authToken;
  
  describe('Login Authentication', () => {
    test('should login with valid credentials', async () => {
      const loginData = testData.validCredentials;
      
      const response = await testUtils.apiRequest('POST', '/auth/login', loginData);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('token');
      expect(response.data).toHaveProperty('user');
      expect(response.data.user.email).toBe(loginData.email);
      expect(response.data.token).toBeDefined();
      
      // Store token for subsequent tests
      authToken = response.data.token;
    });

    test('should reject invalid email', async () => {
      const invalidData = testData.invalidCredentials[0];
      
      try {
        await testUtils.apiRequest('POST', '/auth/login', invalidData);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('401' || '403');
      }
    });

    test('should reject invalid password', async () => {
      const invalidData = testData.invalidCredentials[1];
      
      try {
        await testUtils.apiRequest('POST', '/auth/login', invalidData);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('401' || '403');
      }
    });

    test('should reject empty credentials', async () => {
      const emptyData = testData.invalidCredentials[3];
      
      try {
        await testUtils.apiRequest('POST', '/auth/login', emptyData);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('400' || '422');
      }
    });

    test('should reject malformed email', async () => {
      const malformedData = testData.invalidCredentials[4];
      
      try {
        await testUtils.apiRequest('POST', '/auth/login', malformedData);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('400' || '422');
      }
    });
  });

  describe('Token Validation', () => {
    beforeAll(async () => {
      // Ensure we have a valid token
      if (!authToken) {
        const response = await testUtils.apiRequest('POST', '/auth/login', testData.validCredentials);
        authToken = response.data.token;
      }
    });

    test('should validate valid token', async () => {
      const response = await testUtils.apiRequest('GET', '/auth/validate', null, {
        'Authorization': `Bearer ${authToken}`
      });
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('valid', true);
      expect(response.data).toHaveProperty('user');
    });

    test('should reject invalid token', async () => {
      try {
        await testUtils.apiRequest('GET', '/auth/validate', null, {
          'Authorization': 'Bearer invalid-token'
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('401' || '403');
      }
    });

    test('should reject missing token', async () => {
      try {
        await testUtils.apiRequest('GET', '/auth/validate');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('401');
      }
    });

    test('should reject malformed authorization header', async () => {
      try {
        await testUtils.apiRequest('GET', '/auth/validate', null, {
          'Authorization': 'InvalidFormat token'
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('401');
      }
    });
  });

  describe('Protected Endpoints', () => {
    test('should access protected endpoint with valid token', async () => {
      const response = await testUtils.apiRequest('GET', '/admin/dashboard', null, {
        'Authorization': `Bearer ${authToken}`
      });
      
      expect(response.status).toBe(200);
    });

    test('should reject protected endpoint without token', async () => {
      try {
        await testUtils.apiRequest('GET', '/admin/dashboard');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('401');
      }
    });
  });

  describe('Session Management', () => {
    test('should refresh token when valid', async () => {
      const response = await testUtils.apiRequest('POST', '/auth/refresh', null, {
        'Authorization': `Bearer ${authToken}`
      });
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('token');
      expect(response.data.token).not.toBe(authToken);
    });

    test('should logout and invalidate token', async () => {
      const response = await testUtils.apiRequest('POST', '/auth/logout', null, {
        'Authorization': `Bearer ${authToken}`
      });
      
      expect(response.status).toBe(200);
      
      // Verify token is invalidated
      try {
        await testUtils.apiRequest('GET', '/auth/validate', null, {
          'Authorization': `Bearer ${authToken}`
        });
        fail('Token should be invalidated');
      } catch (error) {
        expect(error.message).toContain('401');
      }
    });
  });

  describe('Rate Limiting', () => {
    test('should rate limit excessive login attempts', async () => {
      const attempts = [];
      const invalidCredentials = testData.invalidCredentials[0];
      
      // Make multiple failed attempts
      for (let i = 0; i < 10; i++) {
        attempts.push(
          testUtils.apiRequest('POST', '/auth/login', invalidCredentials)
            .catch(err => err)
        );
      }
      
      const results = await Promise.all(attempts);
      
      // Check if rate limiting kicks in
      const rateLimitedResponses = results.filter(result => 
        result.message && result.message.includes('429')
      );
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    }, 30000);
  });

  afterAll(async () => {
    // Cleanup any test tokens
    if (authToken) {
      try {
        await testUtils.cleanup(authToken);
      } catch (error) {
        console.warn('Cleanup failed:', error.message);
      }
    }
  });
});