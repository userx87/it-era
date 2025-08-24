/**
 * API Integration Tests for IT-ERA Admin Panel
 * Tests all API endpoints for functionality and data integrity
 */

const testData = require('../fixtures/testData');

describe('API Integration Tests', () => {
  let authToken;
  let testPost;
  let testCategory;
  let testTag;

  beforeAll(async () => {
    // Login to get authentication token
    const loginResponse = await testUtils.apiRequest('POST', '/auth/login', testData.validCredentials);
    authToken = loginResponse.data.token;
    expect(authToken).toBeDefined();
  });

  afterAll(async () => {
    // Cleanup test data
    await testUtils.cleanup(authToken);
  });

  describe('Posts API', () => {
    test('should create a new post', async () => {
      const postData = testData.validPosts[0];
      
      const response = await testUtils.apiRequest('POST', '/api/posts', postData, {
        'Authorization': `Bearer ${authToken}`
      });
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data.title).toBe(postData.title);
      expect(response.data.content).toBe(postData.content);
      expect(response.data.status).toBe(postData.status);
      
      testPost = response.data;
    });

    test('should get all posts', async () => {
      const response = await testUtils.apiRequest('GET', '/api/posts', null, {
        'Authorization': `Bearer ${authToken}`
      });
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      
      // Check if our test post is in the list
      const foundPost = response.data.find(post => post.id === testPost.id);
      expect(foundPost).toBeDefined();
    });

    test('should get single post by ID', async () => {
      const response = await testUtils.apiRequest('GET', `/api/posts/${testPost.id}`, null, {
        'Authorization': `Bearer ${authToken}`
      });
      
      expect(response.status).toBe(200);
      expect(response.data.id).toBe(testPost.id);
      expect(response.data.title).toBe(testPost.title);
    });

    test('should update post', async () => {
      const updatedData = {
        title: 'Updated Test Post Title',
        content: 'Updated content for the test post'
      };
      
      const response = await testUtils.apiRequest('PUT', `/api/posts/${testPost.id}`, updatedData, {
        'Authorization': `Bearer ${authToken}`
      });
      
      expect(response.status).toBe(200);
      expect(response.data.title).toBe(updatedData.title);
      expect(response.data.content).toBe(updatedData.content);
      
      // Update our test post reference
      testPost = response.data;
    });

    test('should partially update post (PATCH)', async () => {
      const patchData = { status: 'draft' };
      
      const response = await testUtils.apiRequest('PATCH', `/api/posts/${testPost.id}`, patchData, {
        'Authorization': `Bearer ${authToken}`
      });
      
      expect(response.status).toBe(200);
      expect(response.data.status).toBe(patchData.status);
      expect(response.data.title).toBe(testPost.title); // Should remain unchanged
    });

    test('should get posts with pagination', async () => {
      const response = await testUtils.apiRequest('GET', '/api/posts?page=1&limit=10', null, {
        'Authorization': `Bearer ${authToken}`
      });
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('posts');
      expect(response.data).toHaveProperty('pagination');
      expect(response.data.pagination).toHaveProperty('page');
      expect(response.data.pagination).toHaveProperty('limit');
      expect(response.data.pagination).toHaveProperty('total');
    });

    test('should filter posts by status', async () => {
      const response = await testUtils.apiRequest('GET', '/api/posts?status=published', null, {
        'Authorization': `Bearer ${authToken}`
      });
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      // All returned posts should have published status
      response.data.forEach(post => {
        expect(post.status).toBe('published');
      });
    });

    test('should search posts by title', async () => {
      const searchTerm = 'Test';
      const response = await testUtils.apiRequest('GET', `/api/posts?search=${searchTerm}`, null, {
        'Authorization': `Bearer ${authToken}`
      });
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      // All returned posts should contain search term
      response.data.forEach(post => {
        expect(post.title.toLowerCase()).toContain(searchTerm.toLowerCase());
      });
    });
  });

  describe('Categories API', () => {
    test('should create a new category', async () => {
      const categoryData = testData.validCategories[0];
      
      const response = await testUtils.apiRequest('POST', '/api/categories', categoryData, {
        'Authorization': `Bearer ${authToken}`
      });
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data.name).toBe(categoryData.name);
      expect(response.data.slug).toBe(categoryData.slug);
      
      testCategory = response.data;
    });

    test('should get all categories', async () => {
      const response = await testUtils.apiRequest('GET', '/api/categories', null, {
        'Authorization': `Bearer ${authToken}`
      });
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      const foundCategory = response.data.find(cat => cat.id === testCategory.id);
      expect(foundCategory).toBeDefined();
    });

    test('should update category', async () => {
      const updatedData = {
        name: 'Updated Category Name',
        description: 'Updated category description'
      };
      
      const response = await testUtils.apiRequest('PUT', `/api/categories/${testCategory.id}`, updatedData, {
        'Authorization': `Bearer ${authToken}`
      });
      
      expect(response.status).toBe(200);
      expect(response.data.name).toBe(updatedData.name);
      expect(response.data.description).toBe(updatedData.description);
    });

    test('should prevent duplicate category slugs', async () => {
      const duplicateData = {
        name: 'Another Category',
        slug: testCategory.slug // Same slug as existing category
      };
      
      try {
        await testUtils.apiRequest('POST', '/api/categories', duplicateData, {
          'Authorization': `Bearer ${authToken}`
        });
        fail('Should have prevented duplicate slug');
      } catch (error) {
        expect(error.message).toContain('400' || '409');
      }
    });
  });

  describe('Tags API', () => {
    test('should create a new tag', async () => {
      const tagData = testData.validTags[0];
      
      const response = await testUtils.apiRequest('POST', '/api/tags', tagData, {
        'Authorization': `Bearer ${authToken}`
      });
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data.name).toBe(tagData.name);
      
      testTag = response.data;
    });

    test('should get all tags', async () => {
      const response = await testUtils.apiRequest('GET', '/api/tags', null, {
        'Authorization': `Bearer ${authToken}`
      });
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      const foundTag = response.data.find(tag => tag.id === testTag.id);
      expect(foundTag).toBeDefined();
    });

    test('should get tags with usage count', async () => {
      const response = await testUtils.apiRequest('GET', '/api/tags?include_count=true', null, {
        'Authorization': `Bearer ${authToken}`
      });
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      response.data.forEach(tag => {
        expect(tag).toHaveProperty('post_count');
        expect(typeof tag.post_count).toBe('number');
      });
    });
  });

  describe('Dashboard API', () => {
    test('should get dashboard statistics', async () => {
      const response = await testUtils.apiRequest('GET', '/api/dashboard/stats', null, {
        'Authorization': `Bearer ${authToken}`
      });
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('posts');
      expect(response.data).toHaveProperty('categories');
      expect(response.data).toHaveProperty('tags');
      expect(typeof response.data.posts.total).toBe('number');
      expect(typeof response.data.posts.published).toBe('number');
      expect(typeof response.data.posts.draft).toBe('number');
    });

    test('should get recent activity', async () => {
      const response = await testUtils.apiRequest('GET', '/api/dashboard/activity', null, {
        'Authorization': `Bearer ${authToken}`
      });
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      response.data.forEach(activity => {
        expect(activity).toHaveProperty('type');
        expect(activity).toHaveProperty('description');
        expect(activity).toHaveProperty('timestamp');
      });
    });
  });

  describe('Media API', () => {
    test('should handle file upload', async () => {
      // Note: This test would require actual file handling
      // For now, we'll test the endpoint exists and handles missing file
      try {
        await testUtils.apiRequest('POST', '/api/media/upload', {}, {
          'Authorization': `Bearer ${authToken}`
        });
      } catch (error) {
        // Should return 400 for missing file, not 404 for missing endpoint
        expect(error.message).toContain('400');
      }
    });

    test('should get media library', async () => {
      const response = await testUtils.apiRequest('GET', '/api/media', null, {
        'Authorization': `Bearer ${authToken}`
      });
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });
  });

  describe('Settings API', () => {
    test('should get site settings', async () => {
      const response = await testUtils.apiRequest('GET', '/api/settings', null, {
        'Authorization': `Bearer ${authToken}`
      });
      
      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('object');
    });

    test('should update site settings', async () => {
      const settingsData = {
        site_title: 'IT-ERA Test Site',
        site_description: 'Test description for IT-ERA'
      };
      
      const response = await testUtils.apiRequest('PUT', '/api/settings', settingsData, {
        'Authorization': `Bearer ${authToken}`
      });
      
      expect(response.status).toBe(200);
      expect(response.data.site_title).toBe(settingsData.site_title);
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for non-existent post', async () => {
      try {
        await testUtils.apiRequest('GET', '/api/posts/999999', null, {
          'Authorization': `Bearer ${authToken}`
        });
        fail('Should have returned 404');
      } catch (error) {
        expect(error.message).toContain('404');
      }
    });

    test('should return 401 for unauthorized access', async () => {
      try {
        await testUtils.apiRequest('GET', '/api/posts');
        fail('Should have returned 401');
      } catch (error) {
        expect(error.message).toContain('401');
      }
    });

    test('should handle malformed JSON', async () => {
      try {
        await testUtils.apiRequest('POST', '/api/posts', 'invalid json', {
          'Authorization': `Bearer ${authToken}`
        });
        fail('Should have handled malformed JSON');
      } catch (error) {
        expect(error.message).toContain('400');
      }
    });
  });

  describe('Cleanup', () => {
    test('should delete test post', async () => {
      if (testPost && testPost.id) {
        const response = await testUtils.apiRequest('DELETE', `/api/posts/${testPost.id}`, null, {
          'Authorization': `Bearer ${authToken}`
        });
        
        expect(response.status).toBe(204);
        
        // Verify post is deleted
        try {
          await testUtils.apiRequest('GET', `/api/posts/${testPost.id}`, null, {
            'Authorization': `Bearer ${authToken}`
          });
          fail('Post should be deleted');
        } catch (error) {
          expect(error.message).toContain('404');
        }
      }
    });

    test('should delete test category', async () => {
      if (testCategory && testCategory.id) {
        const response = await testUtils.apiRequest('DELETE', `/api/categories/${testCategory.id}`, null, {
          'Authorization': `Bearer ${authToken}`
        });
        
        expect(response.status).toBe(204);
      }
    });

    test('should delete test tag', async () => {
      if (testTag && testTag.id) {
        const response = await testUtils.apiRequest('DELETE', `/api/tags/${testTag.id}`, null, {
          'Authorization': `Bearer ${authToken}`
        });
        
        expect(response.status).toBe(204);
      }
    });
  });
});