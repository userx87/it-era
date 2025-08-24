/**
 * Form Validation Tests for IT-ERA Admin Panel
 * Tests all form validations for posts, categories, tags, and settings
 */

const testData = require('../fixtures/testData');

describe('Form Validation Tests', () => {
  let authToken;

  beforeAll(async () => {
    const loginResponse = await testUtils.apiRequest('POST', '/auth/login', testData.validCredentials);
    authToken = loginResponse.data.token;
  });

  describe('Authentication Form Validation', () => {
    test('should validate email format', async () => {
      const emailTestCases = testData.formValidationCases.email;

      for (const testCase of emailTestCases) {
        const loginData = {
          email: testCase.value,
          password: 'validpassword123'
        };

        try {
          const response = await testUtils.apiRequest('POST', '/auth/login', loginData);
          
          if (testCase.expected) {
            // Should succeed or fail with 401 (wrong password), not validation error
            expect([200, 401]).toContain(response.status);
          } else {
            fail(`Invalid email ${testCase.value} should be rejected`);
          }
        } catch (error) {
          if (!testCase.expected) {
            // Should fail with validation error (400/422), not auth error (401)
            expect(error.message).toContain('400' || '422');
          } else {
            // Valid email should only fail with auth error
            expect(error.message).toContain('401');
          }
        }
      }
    });

    test('should validate password requirements', async () => {
      const passwordTestCases = testData.formValidationCases.password;

      for (const testCase of passwordTestCases) {
        const loginData = {
          email: 'test@valid-email.com',
          password: testCase.value
        };

        try {
          const response = await testUtils.apiRequest('POST', '/auth/login', loginData);
          
          if (testCase.expected) {
            expect([200, 401]).toContain(response.status);
          } else {
            fail(`Weak password ${testCase.value} should be rejected`);
          }
        } catch (error) {
          if (!testCase.expected) {
            expect(error.message).toContain('400' || '422');
          }
        }
      }
    });

    test('should require both email and password', async () => {
      const requiredFieldTests = [
        { email: '', password: 'validpass' },
        { email: 'valid@email.com', password: '' },
        { email: '', password: '' },
        { email: 'valid@email.com' }, // Missing password
        { password: 'validpass' } // Missing email
      ];

      for (const testData of requiredFieldTests) {
        try {
          await testUtils.apiRequest('POST', '/auth/login', testData);
          fail(`Incomplete login data should be rejected: ${JSON.stringify(testData)}`);
        } catch (error) {
          expect(error.message).toContain('400' || '422');
        }
      }
    });
  });

  describe('Post Form Validation', () => {
    test('should validate post title requirements', async () => {
      const titleTestCases = testData.formValidationCases.title;

      for (const testCase of titleTestCases) {
        const postData = {
          title: testCase.value,
          content: 'Valid content for testing title validation'
        };

        try {
          const response = await testUtils.apiRequest('POST', '/api/posts', postData, {
            'Authorization': `Bearer ${authToken}`
          });

          if (testCase.expected) {
            expect(response.status).toBe(201);
            // Clean up successful creation
            await testUtils.apiRequest('DELETE', `/api/posts/${response.data.id}`, null, {
              'Authorization': `Bearer ${authToken}`
            });
          } else {
            fail(`Invalid title should be rejected: ${testCase.message}`);
          }
        } catch (error) {
          if (!testCase.expected) {
            expect(error.message).toContain('400' || '422');
          } else {
            throw error;
          }
        }
      }
    });

    test('should validate post content requirements', async () => {
      const contentTestCases = [
        { value: '', expected: false, message: 'Empty content' },
        { value: 'Short', expected: false, message: 'Too short content' },
        { value: 'Valid content that meets minimum length requirements for a proper blog post', expected: true, message: 'Valid content' },
        { value: 'x'.repeat(10000), expected: true, message: 'Long content within limits' },
        { value: 'x'.repeat(100000), expected: false, message: 'Content too long' }
      ];

      for (const testCase of contentTestCases) {
        const postData = {
          title: 'Valid Test Post Title',
          content: testCase.value
        };

        try {
          const response = await testUtils.apiRequest('POST', '/api/posts', postData, {
            'Authorization': `Bearer ${authToken}`
          });

          if (testCase.expected) {
            expect(response.status).toBe(201);
            await testUtils.apiRequest('DELETE', `/api/posts/${response.data.id}`, null, {
              'Authorization': `Bearer ${authToken}`
            });
          } else {
            fail(`Invalid content should be rejected: ${testCase.message}`);
          }
        } catch (error) {
          if (!testCase.expected) {
            expect(error.message).toContain('400' || '422');
          }
        }
      }
    });

    test('should validate post status values', async () => {
      const statusTestCases = [
        { value: 'published', expected: true },
        { value: 'draft', expected: true },
        { value: 'archived', expected: true },
        { value: 'invalid-status', expected: false },
        { value: 'PUBLISHED', expected: false }, // Case sensitive
        { value: 123, expected: false },
        { value: null, expected: true } // Should default
      ];

      for (const testCase of statusTestCases) {
        const postData = {
          title: 'Status Validation Test Post',
          content: 'Content for status validation testing',
          status: testCase.value
        };

        try {
          const response = await testUtils.apiRequest('POST', '/api/posts', postData, {
            'Authorization': `Bearer ${authToken}`
          });

          if (testCase.expected) {
            expect(response.status).toBe(201);
            if (testCase.value === null) {
              expect(response.data.status).toBe('draft'); // Default status
            } else {
              expect(response.data.status).toBe(testCase.value);
            }
            await testUtils.apiRequest('DELETE', `/api/posts/${response.data.id}`, null, {
              'Authorization': `Bearer ${authToken}`
            });
          } else {
            fail(`Invalid status ${testCase.value} should be rejected`);
          }
        } catch (error) {
          if (!testCase.expected) {
            expect(error.message).toContain('400' || '422');
          }
        }
      }
    });

    test('should validate slug format', async () => {
      const slugTestCases = [
        { value: 'valid-slug', expected: true },
        { value: 'valid-slug-123', expected: true },
        { value: 'Invalid Slug', expected: false }, // Spaces not allowed
        { value: 'invalid_slug!', expected: false }, // Special chars not allowed
        { value: 'UPPERCASE-SLUG', expected: false }, // Should be lowercase
        { value: 'slug with spaces', expected: false },
        { value: 'slug@with#symbols', expected: false },
        { value: '', expected: true }, // Should auto-generate
        { value: 'a'.repeat(200), expected: false } // Too long
      ];

      for (const testCase of slugTestCases) {
        const postData = {
          title: 'Slug Validation Test',
          content: 'Content for slug validation',
          slug: testCase.value
        };

        try {
          const response = await testUtils.apiRequest('POST', '/api/posts', postData, {
            'Authorization': `Bearer ${authToken}`
          });

          if (testCase.expected) {
            expect(response.status).toBe(201);
            if (testCase.value === '') {
              expect(response.data.slug).toBe('slug-validation-test');
            }
            await testUtils.apiRequest('DELETE', `/api/posts/${response.data.id}`, null, {
              'Authorization': `Bearer ${authToken}`
            });
          } else {
            fail(`Invalid slug ${testCase.value} should be rejected`);
          }
        } catch (error) {
          if (!testCase.expected) {
            expect(error.message).toContain('400' || '422');
          }
        }
      }
    });

    test('should prevent duplicate slugs', async () => {
      // Create first post
      const firstPost = await testUtils.apiRequest('POST', '/api/posts', {
        title: 'Duplicate Slug Test',
        content: 'First post content',
        slug: 'duplicate-test-slug'
      }, {
        'Authorization': `Bearer ${authToken}`
      });

      expect(firstPost.status).toBe(201);

      // Try to create second post with same slug
      try {
        await testUtils.apiRequest('POST', '/api/posts', {
          title: 'Another Post',
          content: 'Second post content',
          slug: 'duplicate-test-slug'
        }, {
          'Authorization': `Bearer ${authToken}`
        });
        fail('Duplicate slug should be rejected');
      } catch (error) {
        expect(error.message).toContain('400' || '409');
      }

      // Clean up
      await testUtils.apiRequest('DELETE', `/api/posts/${firstPost.data.id}`, null, {
        'Authorization': `Bearer ${authToken}`
      });
    });
  });

  describe('Category Form Validation', () => {
    test('should validate category name requirements', async () => {
      const nameTestCases = [
        { value: '', expected: false, message: 'Empty name' },
        { value: 'A', expected: false, message: 'Too short name' },
        { value: 'Valid Category Name', expected: true, message: 'Valid name' },
        { value: 'a'.repeat(100), expected: false, message: 'Name too long' }
      ];

      for (const testCase of nameTestCases) {
        const categoryData = {
          name: testCase.value,
          description: 'Valid category description'
        };

        try {
          const response = await testUtils.apiRequest('POST', '/api/categories', categoryData, {
            'Authorization': `Bearer ${authToken}`
          });

          if (testCase.expected) {
            expect(response.status).toBe(201);
            await testUtils.apiRequest('DELETE', `/api/categories/${response.data.id}`, null, {
              'Authorization': `Bearer ${authToken}`
            });
          } else {
            fail(`Invalid category name should be rejected: ${testCase.message}`);
          }
        } catch (error) {
          if (!testCase.expected) {
            expect(error.message).toContain('400' || '422');
          }
        }
      }
    });

    test('should validate category slug format', async () => {
      const slugTestCases = [
        { value: 'valid-category-slug', expected: true },
        { value: 'Invalid Category Slug', expected: false },
        { value: 'invalid@slug', expected: false },
        { value: '', expected: true } // Auto-generate
      ];

      for (const testCase of slugTestCases) {
        const categoryData = {
          name: 'Test Category Name',
          slug: testCase.value,
          description: 'Test description'
        };

        try {
          const response = await testUtils.apiRequest('POST', '/api/categories', categoryData, {
            'Authorization': `Bearer ${authToken}`
          });

          if (testCase.expected) {
            expect(response.status).toBe(201);
            await testUtils.apiRequest('DELETE', `/api/categories/${response.data.id}`, null, {
              'Authorization': `Bearer ${authToken}`
            });
          } else {
            fail(`Invalid category slug should be rejected`);
          }
        } catch (error) {
          if (!testCase.expected) {
            expect(error.message).toContain('400' || '422');
          }
        }
      }
    });

    test('should validate color format', async () => {
      const colorTestCases = [
        { value: '#FF0000', expected: true },
        { value: '#ff0000', expected: true },
        { value: '#123456', expected: true },
        { value: 'red', expected: false },
        { value: 'FF0000', expected: false }, // Missing #
        { value: '#FG0000', expected: false }, // Invalid hex
        { value: '#FF00', expected: false }, // Too short
        { value: '#FF000000', expected: false } // Too long
      ];

      for (const testCase of colorTestCases) {
        const categoryData = {
          name: 'Color Test Category',
          color: testCase.value,
          description: 'Category for color validation'
        };

        try {
          const response = await testUtils.apiRequest('POST', '/api/categories', categoryData, {
            'Authorization': `Bearer ${authToken}`
          });

          if (testCase.expected) {
            expect(response.status).toBe(201);
            expect(response.data.color).toBe(testCase.value.toLowerCase());
            await testUtils.apiRequest('DELETE', `/api/categories/${response.data.id}`, null, {
              'Authorization': `Bearer ${authToken}`
            });
          } else {
            fail(`Invalid color ${testCase.value} should be rejected`);
          }
        } catch (error) {
          if (!testCase.expected) {
            expect(error.message).toContain('400' || '422');
          }
        }
      }
    });
  });

  describe('Tag Form Validation', () => {
    test('should validate tag name format', async () => {
      const tagNameTests = [
        { value: '', expected: false },
        { value: 'valid-tag', expected: true },
        { value: 'Valid Tag', expected: false }, // Should be lowercase with hyphens
        { value: 'valid_tag', expected: false }, // Underscores not allowed
        { value: 'tag with spaces', expected: false },
        { value: 'tag@symbol', expected: false },
        { value: 'a'.repeat(50), expected: false } // Too long
      ];

      for (const testCase of tagNameTests) {
        const tagData = {
          name: testCase.value,
          color: '#0056cc'
        };

        try {
          const response = await testUtils.apiRequest('POST', '/api/tags', tagData, {
            'Authorization': `Bearer ${authToken}`
          });

          if (testCase.expected) {
            expect(response.status).toBe(201);
            await testUtils.apiRequest('DELETE', `/api/tags/${response.data.id}`, null, {
              'Authorization': `Bearer ${authToken}`
            });
          } else {
            fail(`Invalid tag name ${testCase.value} should be rejected`);
          }
        } catch (error) {
          if (!testCase.expected) {
            expect(error.message).toContain('400' || '422');
          }
        }
      }
    });
  });

  describe('Settings Form Validation', () => {
    test('should validate site settings', async () => {
      const settingsTests = [
        {
          data: { site_title: '' },
          expected: false,
          message: 'Empty site title'
        },
        {
          data: { site_title: 'Valid Site Title' },
          expected: true,
          message: 'Valid site title'
        },
        {
          data: { site_email: 'invalid-email' },
          expected: false,
          message: 'Invalid email format'
        },
        {
          data: { site_email: 'valid@email.com' },
          expected: true,
          message: 'Valid email'
        },
        {
          data: { posts_per_page: 'not-a-number' },
          expected: false,
          message: 'Invalid posts per page'
        },
        {
          data: { posts_per_page: 10 },
          expected: true,
          message: 'Valid posts per page'
        }
      ];

      for (const test of settingsTests) {
        try {
          const response = await testUtils.apiRequest('PUT', '/api/settings', test.data, {
            'Authorization': `Bearer ${authToken}`
          });

          if (test.expected) {
            expect(response.status).toBe(200);
          } else {
            fail(`Invalid setting should be rejected: ${test.message}`);
          }
        } catch (error) {
          if (!test.expected) {
            expect(error.message).toContain('400' || '422');
          }
        }
      }
    });
  });

  describe('File Upload Validation', () => {
    test('should validate file types', async () => {
      const fileTypeTests = [
        { type: 'image/jpeg', expected: true },
        { type: 'image/png', expected: true },
        { type: 'image/gif', expected: true },
        { type: 'application/pdf', expected: false },
        { type: 'text/html', expected: false },
        { type: 'application/javascript', expected: false }
      ];

      for (const test of fileTypeTests) {
        const fileData = {
          file: {
            name: `test.${test.type.split('/')[1]}`,
            type: test.type,
            size: 1024 * 100 // 100KB
          }
        };

        try {
          await testUtils.apiRequest('POST', '/api/media/upload', fileData, {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'multipart/form-data'
          });

          if (!test.expected) {
            fail(`Invalid file type ${test.type} should be rejected`);
          }
        } catch (error) {
          if (!test.expected) {
            expect(error.message).toContain('400' || '415');
          }
        }
      }
    });

    test('should validate file size limits', async () => {
      const sizeTests = [
        { size: 1024, expected: true }, // 1KB
        { size: 1024 * 1024, expected: true }, // 1MB
        { size: 5 * 1024 * 1024, expected: true }, // 5MB
        { size: 10 * 1024 * 1024, expected: false }, // 10MB (too large)
        { size: 0, expected: false } // Empty file
      ];

      for (const test of sizeTests) {
        const fileData = {
          file: {
            name: 'test-image.jpg',
            type: 'image/jpeg',
            size: test.size
          }
        };

        try {
          await testUtils.apiRequest('POST', '/api/media/upload', fileData, {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'multipart/form-data'
          });

          if (!test.expected) {
            fail(`File size ${test.size} should be rejected`);
          }
        } catch (error) {
          if (!test.expected) {
            expect(error.message).toContain('413' || '400');
          }
        }
      }
    });
  });
});