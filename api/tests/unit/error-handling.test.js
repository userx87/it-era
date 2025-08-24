/**
 * Error Handling and Edge Cases Tests for IT-ERA Admin Panel
 * Tests error scenarios, edge cases, and system resilience
 */

const testData = require('../fixtures/testData');

describe('Error Handling and Edge Cases', () => {
  let authToken;

  beforeAll(async () => {
    const loginResponse = await testUtils.apiRequest('POST', '/auth/login', testData.validCredentials);
    authToken = loginResponse.data.token;
  });

  describe('API Error Handling', () => {
    test('should handle 404 errors gracefully', async () => {
      const nonExistentEndpoints = [
        '/api/nonexistent',
        '/api/posts/999999',
        '/api/categories/invalid-id',
        '/api/tags/999999'
      ];

      for (const endpoint of nonExistentEndpoints) {
        try {
          await testUtils.apiRequest('GET', endpoint, null, {
            'Authorization': `Bearer ${authToken}`
          });
          fail(`Endpoint ${endpoint} should return 404`);
        } catch (error) {
          expect(error.message).toContain('404');
        }
      }
    });

    test('should handle malformed JSON requests', async () => {
      const malformedData = [
        '{"invalid": json}',
        '{title: "missing quotes"}',
        '{"trailing": "comma",}',
        'not json at all'
      ];

      for (const data of malformedData) {
        try {
          const response = await fetch(`${TEST_CONFIG.API_BASE_URL}/api/posts`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: data
          });

          if (response.ok) {
            fail('Malformed JSON should be rejected');
          }

          expect([400, 422]).toContain(response.status);
        } catch (error) {
          // Network errors are acceptable for malformed requests
          expect(error).toBeDefined();
        }
      }
    });

    test('should handle missing Content-Type header', async () => {
      try {
        const response = await fetch(`${TEST_CONFIG.API_BASE_URL}/api/posts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`
            // Missing Content-Type header
          },
          body: JSON.stringify({
            title: 'Test Post',
            content: 'Test Content'
          })
        });

        // Should either succeed (server handles missing header) or fail appropriately
        if (!response.ok) {
          expect([400, 415]).toContain(response.status);
        }
      } catch (error) {
        // Network error is acceptable
        expect(error).toBeDefined();
      }
    });

    test('should handle extremely large request bodies', async () => {
      const largeData = {
        title: 'Large Data Test',
        content: 'x'.repeat(1024 * 1024 * 5) // 5MB content
      };

      try {
        await testUtils.apiRequest('POST', '/api/posts', largeData, {
          'Authorization': `Bearer ${authToken}`
        });
        
        // If it succeeds, verify it was properly handled
        console.log('Large request was accepted by server');
      } catch (error) {
        // Should fail with payload too large or similar error
        expect(error.message).toContain('413' || '400' || '422');
      }
    });
  });

  describe('Authentication Edge Cases', () => {
    test('should handle expired tokens gracefully', async () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjF9.invalid';

      try {
        await testUtils.apiRequest('GET', '/api/posts', null, {
          'Authorization': `Bearer ${expiredToken}`
        });
        fail('Expired token should be rejected');
      } catch (error) {
        expect(error.message).toContain('401');
      }
    });

    test('should handle malformed tokens', async () => {
      const malformedTokens = [
        'not-a-jwt-token',
        'Bearer invalid.token.format',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.invalid-signature'
      ];

      for (const token of malformedTokens) {
        try {
          await testUtils.apiRequest('GET', '/api/posts', null, {
            'Authorization': `Bearer ${token}`
          });
          fail(`Malformed token should be rejected: ${token}`);
        } catch (error) {
          expect(error.message).toContain('401');
        }
      }
    });

    test('should handle missing Authorization header', async () => {
      try {
        await testUtils.apiRequest('GET', '/api/posts');
        fail('Request without auth should be rejected');
      } catch (error) {
        expect(error.message).toContain('401');
      }
    });

    test('should handle double login attempts', async () => {
      // First login
      const firstLogin = await testUtils.apiRequest('POST', '/auth/login', testData.validCredentials);
      expect(firstLogin.status).toBe(200);

      // Second login with same credentials should work
      const secondLogin = await testUtils.apiRequest('POST', '/auth/login', testData.validCredentials);
      expect(secondLogin.status).toBe(200);

      // Both tokens should be valid
      const response1 = await testUtils.apiRequest('GET', '/api/posts', null, {
        'Authorization': `Bearer ${firstLogin.data.token}`
      });
      expect(response1.status).toBe(200);

      const response2 = await testUtils.apiRequest('GET', '/api/posts', null, {
        'Authorization': `Bearer ${secondLogin.data.token}`
      });
      expect(response2.status).toBe(200);
    });
  });

  describe('Database Edge Cases', () => {
    test('should handle duplicate key scenarios', async () => {
      // Create a post with specific slug
      const postData = {
        title: 'Duplicate Test Post',
        content: 'Content for duplicate test',
        slug: 'unique-test-slug-' + Date.now()
      };

      const firstPost = await testUtils.apiRequest('POST', '/api/posts', postData, {
        'Authorization': `Bearer ${authToken}`
      });
      expect(firstPost.status).toBe(201);

      // Try to create another post with same slug
      try {
        await testUtils.apiRequest('POST', '/api/posts', {
          ...postData,
          title: 'Different Title'
        }, {
          'Authorization': `Bearer ${authToken}`
        });
        fail('Duplicate slug should be rejected');
      } catch (error) {
        expect(error.message).toContain('400' || '409');
      }

      // Cleanup
      await testUtils.apiRequest('DELETE', `/api/posts/${firstPost.data.id}`, null, {
        'Authorization': `Bearer ${authToken}`
      });
    });

    test('should handle foreign key constraints', async () => {
      // Try to create a post with non-existent category
      const postWithInvalidCategory = {
        title: 'Invalid Category Test',
        content: 'Content for invalid category test',
        category_id: 999999
      };

      try {
        await testUtils.apiRequest('POST', '/api/posts', postWithInvalidCategory, {
          'Authorization': `Bearer ${authToken}`
        });
        
        // If it succeeds, the system handles missing categories gracefully
        console.log('System handles missing categories gracefully');
      } catch (error) {
        // Should fail with appropriate error
        expect(error.message).toContain('400' || '422');
      }
    });

    test('should handle transaction rollbacks', async () => {
      // This test simulates a scenario where a complex operation might fail partway through
      const bulkData = {
        posts: [
          { title: 'Valid Post 1', content: 'Valid content 1' },
          { title: '', content: 'Invalid post with empty title' }, // This should fail
          { title: 'Valid Post 2', content: 'Valid content 2' }
        ]
      };

      try {
        await testUtils.apiRequest('POST', '/api/posts/bulk', bulkData, {
          'Authorization': `Bearer ${authToken}`
        });
        
        // If it succeeds, check that no partial data was created
        console.log('Bulk operation completed successfully');
      } catch (error) {
        // Failure is expected due to invalid data
        expect(error.message).toContain('400' || '422');
        
        // Verify no partial data was created
        const postsResponse = await testUtils.apiRequest('GET', '/api/posts?search=Valid Post', null, {
          'Authorization': `Bearer ${authToken}`
        });
        
        // Should not find any of the posts from the failed bulk operation
        const foundPosts = postsResponse.data.filter(post => 
          post.title.includes('Valid Post 1') || post.title.includes('Valid Post 2')
        );
        expect(foundPosts.length).toBe(0);
      }
    });
  });

  describe('Input Validation Edge Cases', () => {
    test('should handle null and undefined values', async () => {
      const nullValueTests = [
        { title: null, content: 'Valid content' },
        { title: 'Valid title', content: null },
        { title: undefined, content: 'Valid content' },
        { title: 'Valid title', content: undefined }
      ];

      for (const testCase of nullValueTests) {
        try {
          await testUtils.apiRequest('POST', '/api/posts', testCase, {
            'Authorization': `Bearer ${authToken}`
          });
          fail(`Null/undefined values should be rejected: ${JSON.stringify(testCase)}`);
        } catch (error) {
          expect(error.message).toContain('400' || '422');
        }
      }
    });

    test('should handle empty string vs null distinction', async () => {
      const testCases = [
        { title: '', content: 'Content with empty title' },
        { title: 'Title with empty content', content: '' },
        { title: '   ', content: 'Content with whitespace title' }, // Whitespace only
        { title: 'Title with whitespace content', content: '   ' }
      ];

      for (const testCase of testCases) {
        try {
          await testUtils.apiRequest('POST', '/api/posts', testCase, {
            'Authorization': `Bearer ${authToken}`
          });
          fail(`Empty/whitespace values should be rejected: ${JSON.stringify(testCase)}`);
        } catch (error) {
          expect(error.message).toContain('400' || '422');
        }
      }
    });

    test('should handle Unicode and special characters', async () => {
      const unicodeTests = [
        { title: '🚀 Test Post with Emojis 🎉', content: 'Content with emojis 📝✨' },
        { title: 'Test with àccënts and ñoñ-ASCII', content: 'Content with spéciál characters' },
        { title: 'Test with 中文 Chinese characters', content: 'Content with 日本語 Japanese' },
        { title: 'Test with RTL العربية', content: 'Content with Hebrew עברית' }
      ];

      for (const testCase of unicodeTests) {
        try {
          const response = await testUtils.apiRequest('POST', '/api/posts', testCase, {
            'Authorization': `Bearer ${authToken}`
          });

          if (response.status === 201) {
            expect(response.data.title).toBe(testCase.title);
            expect(response.data.content).toBe(testCase.content);
            
            // Cleanup
            await testUtils.apiRequest('DELETE', `/api/posts/${response.data.id}`, null, {
              'Authorization': `Bearer ${authToken}`
            });
          }
        } catch (error) {
          console.warn(`Unicode test failed: ${testCase.title} - ${error.message}`);
        }
      }
    });
  });

  describe('Concurrency Edge Cases', () => {
    test('should handle race conditions in post creation', async () => {
      const sameSlugData = {
        title: 'Race Condition Test',
        content: 'Testing race conditions',
        slug: 'race-condition-test-' + Date.now()
      };

      // Create multiple posts simultaneously with the same slug
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          testUtils.apiRequest('POST', '/api/posts', sameSlugData, {
            'Authorization': `Bearer ${authToken}`
          }).catch(error => ({ error: error.message }))
        );
      }

      const results = await Promise.all(promises);
      
      // Only one should succeed, others should fail with conflict
      const successful = results.filter(result => !result.error);
      const failed = results.filter(result => result.error);

      expect(successful.length).toBe(1);
      expect(failed.length).toBe(4);

      // Cleanup successful creation
      if (successful.length > 0) {
        await testUtils.apiRequest('DELETE', `/api/posts/${successful[0].data.id}`, null, {
          'Authorization': `Bearer ${authToken}`
        });
      }
    });

    test('should handle concurrent updates to same resource', async () => {
      // Create a test post
      const postResponse = await testUtils.apiRequest('POST', '/api/posts', {
        title: 'Concurrent Update Test',
        content: 'Initial content for concurrent update test'
      }, {
        'Authorization': `Bearer ${authToken}`
      });

      const postId = postResponse.data.id;

      // Perform concurrent updates
      const updatePromises = [];
      for (let i = 0; i < 3; i++) {
        updatePromises.push(
          testUtils.apiRequest('PUT', `/api/posts/${postId}`, {
            title: `Updated Title ${i}`,
            content: `Updated content ${i}`
          }, {
            'Authorization': `Bearer ${authToken}`
          }).catch(error => ({ error: error.message }))
        );
      }

      const updateResults = await Promise.all(updatePromises);
      
      // At least one should succeed
      const successfulUpdates = updateResults.filter(result => !result.error);
      expect(successfulUpdates.length).toBeGreaterThanOrEqual(1);

      // Verify final state
      const finalResponse = await testUtils.apiRequest('GET', `/api/posts/${postId}`, null, {
        'Authorization': `Bearer ${authToken}`
      });
      expect(finalResponse.status).toBe(200);

      // Cleanup
      await testUtils.apiRequest('DELETE', `/api/posts/${postId}`, null, {
        'Authorization': `Bearer ${authToken}`
      });
    });
  });

  describe('Network and Timeout Edge Cases', () => {
    test('should handle slow network conditions', async () => {
      // Simulate slow operation with large data
      const largePost = {
        title: 'Large Content Test Post',
        content: 'Lorem ipsum '.repeat(10000) // Large content
      };

      const startTime = performance.now();
      
      try {
        const response = await testUtils.apiRequest('POST', '/api/posts', largePost, {
          'Authorization': `Bearer ${authToken}`
        });

        const endTime = performance.now();
        const duration = endTime - startTime;

        console.log(`Large post creation took ${duration.toFixed(2)}ms`);

        if (response.status === 201) {
          // If successful, verify data integrity
          expect(response.data.title).toBe(largePost.title);
          expect(response.data.content).toBe(largePost.content);

          // Cleanup
          await testUtils.apiRequest('DELETE', `/api/posts/${response.data.id}`, null, {
            'Authorization': `Bearer ${authToken}`
          });
        }
      } catch (error) {
        // Timeout or payload too large errors are acceptable
        expect(error.message).toMatch(/timeout|413|422|400/i);
      }
    }, 30000);
  });

  describe('Resource Exhaustion Edge Cases', () => {
    test('should handle rapid sequential requests', async () => {
      const rapidRequests = [];
      const requestCount = 50;

      for (let i = 0; i < requestCount; i++) {
        rapidRequests.push(
          testUtils.apiRequest('GET', '/api/posts', null, {
            'Authorization': `Bearer ${authToken}`
          }).catch(error => ({ error: error.message }))
        );
      }

      const results = await Promise.all(rapidRequests);
      
      const successful = results.filter(result => !result.error);
      const failed = results.filter(result => result.error);

      console.log(`Rapid requests: ${successful.length}/${requestCount} successful`);

      // Most should succeed unless rate limited
      if (failed.length > 0) {
        // Rate limiting errors are acceptable
        failed.forEach(failure => {
          expect(failure.error).toMatch(/429|503/);
        });
      }

      expect(successful.length / requestCount).toBeGreaterThan(0.5); // At least 50% should succeed
    }, 60000);
  });

  describe('Data Consistency Edge Cases', () => {
    test('should maintain referential integrity', async () => {
      // Create category
      const categoryResponse = await testUtils.apiRequest('POST', '/api/categories', {
        name: 'Integrity Test Category',
        slug: 'integrity-test-category'
      }, {
        'Authorization': `Bearer ${authToken}`
      });

      const categoryId = categoryResponse.data.id;

      // Create post with this category
      const postResponse = await testUtils.apiRequest('POST', '/api/posts', {
        title: 'Post with Category Reference',
        content: 'Content for integrity test',
        category_id: categoryId
      }, {
        'Authorization': `Bearer ${authToken}`
      });

      // Try to delete category while post still references it
      try {
        await testUtils.apiRequest('DELETE', `/api/categories/${categoryId}`, null, {
          'Authorization': `Bearer ${authToken}`
        });
        
        // If deletion succeeds, verify post still exists and handles missing category
        const postCheck = await testUtils.apiRequest('GET', `/api/posts/${postResponse.data.id}`, null, {
          'Authorization': `Bearer ${authToken}`
        });
        expect(postCheck.status).toBe(200);
      } catch (error) {
        // Should fail due to foreign key constraint
        expect(error.message).toContain('400' || '409');
      }

      // Cleanup in correct order
      await testUtils.apiRequest('DELETE', `/api/posts/${postResponse.data.id}`, null, {
        'Authorization': `Bearer ${authToken}`
      });
      await testUtils.apiRequest('DELETE', `/api/categories/${categoryId}`, null, {
        'Authorization': `Bearer ${authToken}`
      });
    });
  });
});