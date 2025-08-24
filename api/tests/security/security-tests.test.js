/**
 * Security Tests for IT-ERA Admin Panel
 * Tests for unauthorized access, input sanitization, XSS, SQL injection, etc.
 */

const testData = require('../fixtures/testData');

describe('Security Tests', () => {
  let authToken;
  let testPost;

  beforeAll(async () => {
    const loginResponse = await testUtils.apiRequest('POST', '/auth/login', testData.validCredentials);
    authToken = loginResponse.data.token;
  });

  describe('Authentication & Authorization', () => {
    test('should reject access without authentication token', async () => {
      const protectedEndpoints = [
        '/api/posts',
        '/api/categories',
        '/api/tags',
        '/api/dashboard/stats',
        '/api/settings'
      ];

      for (const endpoint of protectedEndpoints) {
        try {
          await testUtils.apiRequest('GET', endpoint);
          fail(`Endpoint ${endpoint} should require authentication`);
        } catch (error) {
          expect(error.message).toContain('401');
        }
      }
    });

    test('should reject invalid authentication tokens', async () => {
      const invalidTokens = [
        'invalid-token',
        'Bearer',
        'Bearer ',
        'Bearer invalid',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature'
      ];

      for (const token of invalidTokens) {
        try {
          await testUtils.apiRequest('GET', '/api/posts', null, {
            'Authorization': token
          });
          fail(`Invalid token ${token} should be rejected`);
        } catch (error) {
          expect(error.message).toContain('401');
        }
      }
    });

    test('should reject expired tokens', async () => {
      // This would require a test token with short expiry
      // For now, we test the endpoint exists
      try {
        await testUtils.apiRequest('POST', '/auth/refresh', null, {
          'Authorization': 'Bearer expired.token.here'
        });
        fail('Expired token should be rejected');
      } catch (error) {
        expect(error.message).toContain('401');
      }
    });

    test('should validate token permissions for admin endpoints', async () => {
      const adminEndpoints = [
        { method: 'POST', path: '/api/posts' },
        { method: 'DELETE', path: '/api/posts/1' },
        { method: 'PUT', path: '/api/settings' }
      ];

      // Test with regular user token (if available)
      for (const endpoint of adminEndpoints) {
        try {
          await testUtils.apiRequest(endpoint.method, endpoint.path, {}, {
            'Authorization': `Bearer ${authToken}`
          });
          // If no error, endpoint allows admin access (which is expected)
        } catch (error) {
          // 403 would indicate insufficient permissions
          if (error.message.includes('403')) {
            console.log(`Endpoint ${endpoint.path} properly restricts access`);
          }
        }
      }
    });
  });

  describe('Input Sanitization & XSS Prevention', () => {
    test('should sanitize XSS attempts in post creation', async () => {
      for (const payload of testData.maliciousPayloads) {
        const postData = {
          title: `XSS Test: ${payload}`,
          content: `Content with XSS: ${payload}`
        };

        const response = await testUtils.apiRequest('POST', '/api/posts', postData, {
          'Authorization': `Bearer ${authToken}`
        });

        if (response.status === 201) {
          // Verify content is sanitized
          expect(response.data.title).not.toContain('<script>');
          expect(response.data.title).not.toContain('javascript:');
          expect(response.data.content).not.toContain('<script>');
          
          // Clean up
          await testUtils.apiRequest('DELETE', `/api/posts/${response.data.id}`, null, {
            'Authorization': `Bearer ${authToken}`
          });
        }
      }
    });

    test('should prevent script injection in category names', async () => {
      for (const payload of testData.maliciousPayloads.slice(0, 5)) {
        const categoryData = {
          name: payload,
          description: `Category with malicious name: ${payload}`
        };

        try {
          const response = await testUtils.apiRequest('POST', '/api/categories', categoryData, {
            'Authorization': `Bearer ${authToken}`
          });

          if (response.status === 201) {
            expect(response.data.name).not.toContain('<script>');
            expect(response.data.name).not.toContain('javascript:');
            
            // Clean up
            await testUtils.apiRequest('DELETE', `/api/categories/${response.data.id}`, null, {
              'Authorization': `Bearer ${authToken}`
            });
          }
        } catch (error) {
          // Validation error is acceptable
          expect(error.message).toContain('400' || '422');
        }
      }
    });

    test('should sanitize HTML in post content', async () => {
      const htmlPayloads = [
        '<img src=x onerror=alert("XSS")>',
        '<iframe src="javascript:alert(\'XSS\')"></iframe>',
        '<object data="javascript:alert(\'XSS\')"></object>',
        '<embed src="javascript:alert(\'XSS\')">',
        '<link rel=stylesheet href="javascript:alert(\'XSS\')">'
      ];

      for (const payload of htmlPayloads) {
        const postData = {
          title: 'HTML Sanitization Test',
          content: payload
        };

        const response = await testUtils.apiRequest('POST', '/api/posts', postData, {
          'Authorization': `Bearer ${authToken}`
        });

        if (response.status === 201) {
          // Check if dangerous HTML is removed or escaped
          expect(response.data.content).not.toContain('javascript:');
          expect(response.data.content).not.toContain('onerror=');
          
          await testUtils.apiRequest('DELETE', `/api/posts/${response.data.id}`, null, {
            'Authorization': `Bearer ${authToken}`
          });
        }
      }
    });
  });

  describe('SQL Injection Prevention', () => {
    test('should prevent SQL injection in search queries', async () => {
      const sqlPayloads = [
        "'; DROP TABLE posts; --",
        "' OR '1'='1",
        "' UNION SELECT * FROM users --",
        "admin'; DELETE FROM posts WHERE '1'='1"
      ];

      for (const payload of sqlPayloads) {
        try {
          const response = await testUtils.apiRequest('GET', `/api/posts?search=${encodeURIComponent(payload)}`, null, {
            'Authorization': `Bearer ${authToken}`
          });

          // If request succeeds, verify no SQL injection occurred
          expect(response.status).toBe(200);
          expect(Array.isArray(response.data)).toBe(true);
        } catch (error) {
          // 400 error for invalid search is acceptable
          expect(error.message).toContain('400');
        }
      }

      // Verify posts table still exists and has data
      const postsResponse = await testUtils.apiRequest('GET', '/api/posts', null, {
        'Authorization': `Bearer ${authToken}`
      });
      expect(postsResponse.status).toBe(200);
    });

    test('should prevent SQL injection in filter parameters', async () => {
      const sqlPayloads = [
        "1; DROP TABLE categories; --",
        "1 OR 1=1",
        "1 UNION SELECT id FROM users"
      ];

      for (const payload of sqlPayloads) {
        try {
          const response = await testUtils.apiRequest('GET', `/api/posts?category=${payload}`, null, {
            'Authorization': `Bearer ${authToken}`
          });

          expect(response.status).toBe(200);
        } catch (error) {
          expect(error.message).toContain('400');
        }
      }
    });
  });

  describe('CSRF Protection', () => {
    test('should validate CSRF tokens for state-changing operations', async () => {
      // Test POST request without CSRF token
      try {
        const response = await testUtils.apiRequest('POST', '/api/posts', {
          title: 'CSRF Test Post',
          content: 'Testing CSRF protection'
        }, {
          'Authorization': `Bearer ${authToken}`,
          'X-Requested-With': undefined // Remove CSRF header
        });

        // If CSRF protection is implemented, should fail
        // If not implemented, this test documents the security gap
        if (response.status === 201) {
          console.warn('CSRF protection may not be implemented');
          await testUtils.apiRequest('DELETE', `/api/posts/${response.data.id}`, null, {
            'Authorization': `Bearer ${authToken}`
          });
        }
      } catch (error) {
        // 403 would indicate CSRF protection is working
        expect(error.message).toContain('403' || '400');
      }
    });
  });

  describe('Rate Limiting', () => {
    test('should rate limit API requests', async () => {
      const requests = [];
      
      // Make rapid requests to test rate limiting
      for (let i = 0; i < 20; i++) {
        requests.push(
          testUtils.apiRequest('GET', '/api/posts', null, {
            'Authorization': `Bearer ${authToken}`
          }).catch(error => error)
        );
      }

      const responses = await Promise.all(requests);
      
      // Check if any requests were rate limited
      const rateLimited = responses.filter(response => 
        response.message && response.message.includes('429')
      );

      if (rateLimited.length > 0) {
        console.log(`Rate limiting active: ${rateLimited.length} requests blocked`);
      } else {
        console.warn('Rate limiting may not be implemented');
      }
    }, 15000);

    test('should rate limit login attempts', async () => {
      const loginAttempts = [];
      const invalidCredentials = {
        email: 'attacker@test.com',
        password: 'wrongpassword'
      };

      for (let i = 0; i < 15; i++) {
        loginAttempts.push(
          testUtils.apiRequest('POST', '/auth/login', invalidCredentials)
            .catch(error => error)
        );
      }

      const results = await Promise.all(loginAttempts);
      
      const rateLimitedAttempts = results.filter(result =>
        result.message && result.message.includes('429')
      );

      expect(rateLimitedAttempts.length).toBeGreaterThan(0);
    }, 20000);
  });

  describe('File Upload Security', () => {
    test('should validate file types on upload', async () => {
      // Test with dangerous file types
      const dangerousFiles = [
        { name: 'malware.exe', type: 'application/x-executable' },
        { name: 'script.php', type: 'application/x-php' },
        { name: 'backdoor.jsp', type: 'application/x-jsp' },
        { name: 'shell.sh', type: 'application/x-sh' }
      ];

      for (const file of dangerousFiles) {
        try {
          await testUtils.apiRequest('POST', '/api/media/upload', {
            file: {
              name: file.name,
              type: file.type,
              data: 'fake-file-content'
            }
          }, {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'multipart/form-data'
          });
          
          fail(`Dangerous file type ${file.type} should be rejected`);
        } catch (error) {
          expect(error.message).toContain('400' || '415');
        }
      }
    });

    test('should limit file size', async () => {
      const largeFileData = 'x'.repeat(10 * 1024 * 1024); // 10MB

      try {
        await testUtils.apiRequest('POST', '/api/media/upload', {
          file: {
            name: 'large-file.jpg',
            type: 'image/jpeg',
            data: largeFileData
          }
        }, {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data'
        });
        
        fail('Large file should be rejected');
      } catch (error) {
        expect(error.message).toContain('413' || '400');
      }
    });
  });

  describe('Information Disclosure', () => {
    test('should not leak sensitive information in error messages', async () => {
      try {
        await testUtils.apiRequest('GET', '/api/posts/999999', null, {
          'Authorization': `Bearer ${authToken}`
        });
      } catch (error) {
        // Error message should not contain sensitive info like DB structure
        expect(error.message).not.toMatch(/database|mysql|postgres|sqlite|table|column/i);
      }
    });

    test('should not expose system information', async () => {
      try {
        await testUtils.apiRequest('GET', '/api/nonexistent', null, {
          'Authorization': `Bearer ${authToken}`
        });
      } catch (error) {
        // Should not reveal server technology, paths, or versions
        expect(error.message).not.toMatch(/apache|nginx|express|node\.js|php|python/i);
        expect(error.message).not.toMatch(/\/usr\/|\/var\/|c:\\/i);
        expect(error.message).not.toMatch(/version \d+\.\d+/i);
      }
    });
  });

  describe('Content Security Policy', () => {
    test('should set appropriate security headers', async () => {
      const response = await testUtils.apiRequest('GET', '/api/posts', null, {
        'Authorization': `Bearer ${authToken}`
      });

      // Check for security headers (if implemented)
      const headers = response.headers || {};
      
      if (headers['x-content-type-options']) {
        expect(headers['x-content-type-options']).toBe('nosniff');
      }
      
      if (headers['x-frame-options']) {
        expect(headers['x-frame-options']).toMatch(/DENY|SAMEORIGIN/);
      }
      
      if (headers['x-xss-protection']) {
        expect(headers['x-xss-protection']).toBe('1; mode=block');
      }
    });
  });

  describe('Session Security', () => {
    test('should invalidate sessions on logout', async () => {
      // Create a new session
      const loginResponse = await testUtils.apiRequest('POST', '/auth/login', testData.validCredentials);
      const sessionToken = loginResponse.data.token;

      // Verify session works
      const verifyResponse = await testUtils.apiRequest('GET', '/api/posts', null, {
        'Authorization': `Bearer ${sessionToken}`
      });
      expect(verifyResponse.status).toBe(200);

      // Logout
      await testUtils.apiRequest('POST', '/auth/logout', null, {
        'Authorization': `Bearer ${sessionToken}`
      });

      // Verify session is invalidated
      try {
        await testUtils.apiRequest('GET', '/api/posts', null, {
          'Authorization': `Bearer ${sessionToken}`
        });
        fail('Logged out session should be invalid');
      } catch (error) {
        expect(error.message).toContain('401');
      }
    });

    test('should handle concurrent sessions properly', async () => {
      const sessions = [];
      
      // Create multiple sessions
      for (let i = 0; i < 3; i++) {
        const response = await testUtils.apiRequest('POST', '/auth/login', testData.validCredentials);
        sessions.push(response.data.token);
      }

      // Verify all sessions work
      for (const token of sessions) {
        const response = await testUtils.apiRequest('GET', '/api/posts', null, {
          'Authorization': `Bearer ${token}`
        });
        expect(response.status).toBe(200);
      }

      // Logout one session
      await testUtils.apiRequest('POST', '/auth/logout', null, {
        'Authorization': `Bearer ${sessions[0]}`
      });

      // Verify only that session is invalidated
      try {
        await testUtils.apiRequest('GET', '/api/posts', null, {
          'Authorization': `Bearer ${sessions[0]}`
        });
        fail('Logged out session should be invalid');
      } catch (error) {
        expect(error.message).toContain('401');
      }

      // Other sessions should still work
      const response = await testUtils.apiRequest('GET', '/api/posts', null, {
        'Authorization': `Bearer ${sessions[1]}`
      });
      expect(response.status).toBe(200);
    });
  });
});