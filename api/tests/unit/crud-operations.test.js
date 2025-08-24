/**
 * CRUD Operations Unit Tests for IT-ERA Admin Panel
 * Tests Create, Read, Update, Delete operations for all entities
 */

const testData = require('../fixtures/testData');

describe('CRUD Operations Tests', () => {
  let authToken;
  let createdEntities = {
    posts: [],
    categories: [],
    tags: []
  };

  beforeAll(async () => {
    // Get authentication token
    const loginResponse = await testUtils.apiRequest('POST', '/auth/login', testData.validCredentials);
    authToken = loginResponse.data.token;
  });

  afterAll(async () => {
    // Cleanup all created entities
    for (const post of createdEntities.posts) {
      try {
        await testUtils.apiRequest('DELETE', `/api/posts/${post.id}`, null, {
          'Authorization': `Bearer ${authToken}`
        });
      } catch (error) {
        console.warn(`Failed to delete post ${post.id}:`, error.message);
      }
    }

    for (const category of createdEntities.categories) {
      try {
        await testUtils.apiRequest('DELETE', `/api/categories/${category.id}`, null, {
          'Authorization': `Bearer ${authToken}`
        });
      } catch (error) {
        console.warn(`Failed to delete category ${category.id}:`, error.message);
      }
    }

    for (const tag of createdEntities.tags) {
      try {
        await testUtils.apiRequest('DELETE', `/api/tags/${tag.id}`, null, {
          'Authorization': `Bearer ${authToken}`
        });
      } catch (error) {
        console.warn(`Failed to delete tag ${tag.id}:`, error.message);
      }
    }
  });

  describe('Posts CRUD Operations', () => {
    describe('Create Posts', () => {
      test('should create post with all valid fields', async () => {
        const postData = testData.validPosts[0];
        
        const response = await testUtils.apiRequest('POST', '/api/posts', postData, {
          'Authorization': `Bearer ${authToken}`
        });
        
        expect(response.status).toBe(201);
        expect(response.data).toMatchObject({
          title: postData.title,
          content: postData.content,
          status: postData.status,
          featured: postData.featured
        });
        expect(response.data).toHaveProperty('id');
        expect(response.data).toHaveProperty('created_at');
        expect(response.data).toHaveProperty('updated_at');
        
        createdEntities.posts.push(response.data);
      });

      test('should create post with minimum required fields', async () => {
        const minimalPost = {
          title: 'Minimal Test Post',
          content: 'Minimal content for testing'
        };
        
        const response = await testUtils.apiRequest('POST', '/api/posts', minimalPost, {
          'Authorization': `Bearer ${authToken}`
        });
        
        expect(response.status).toBe(201);
        expect(response.data.title).toBe(minimalPost.title);
        expect(response.data.content).toBe(minimalPost.content);
        expect(response.data.status).toBe('draft'); // Default status
        
        createdEntities.posts.push(response.data);
      });

      test('should reject post with invalid data', async () => {
        const invalidPost = testData.invalidPosts[0];
        
        try {
          await testUtils.apiRequest('POST', '/api/posts', invalidPost, {
            'Authorization': `Bearer ${authToken}`
          });
          fail('Should have rejected invalid post data');
        } catch (error) {
          expect(error.message).toContain('400' || '422');
        }
      });

      test('should auto-generate slug from title', async () => {
        const postWithoutSlug = {
          title: 'Auto Generated Slug Test Post',
          content: 'Content for slug generation test'
        };
        
        const response = await testUtils.apiRequest('POST', '/api/posts', postWithoutSlug, {
          'Authorization': `Bearer ${authToken}`
        });
        
        expect(response.status).toBe(201);
        expect(response.data.slug).toBe('auto-generated-slug-test-post');
        
        createdEntities.posts.push(response.data);
      });
    });

    describe('Read Posts', () => {
      test('should get all posts', async () => {
        const response = await testUtils.apiRequest('GET', '/api/posts', null, {
          'Authorization': `Bearer ${authToken}`
        });
        
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data.length).toBeGreaterThanOrEqual(createdEntities.posts.length);
      });

      test('should get single post by ID', async () => {
        const testPost = createdEntities.posts[0];
        
        const response = await testUtils.apiRequest('GET', `/api/posts/${testPost.id}`, null, {
          'Authorization': `Bearer ${authToken}`
        });
        
        expect(response.status).toBe(200);
        expect(response.data.id).toBe(testPost.id);
        expect(response.data.title).toBe(testPost.title);
      });

      test('should get post by slug', async () => {
        const testPost = createdEntities.posts[0];
        
        const response = await testUtils.apiRequest('GET', `/api/posts/slug/${testPost.slug}`, null, {
          'Authorization': `Bearer ${authToken}`
        });
        
        expect(response.status).toBe(200);
        expect(response.data.slug).toBe(testPost.slug);
      });

      test('should filter posts by status', async () => {
        const response = await testUtils.apiRequest('GET', '/api/posts?status=published', null, {
          'Authorization': `Bearer ${authToken}`
        });
        
        expect(response.status).toBe(200);
        response.data.forEach(post => {
          expect(post.status).toBe('published');
        });
      });
    });

    describe('Update Posts', () => {
      test('should update post with PUT (full update)', async () => {
        const testPost = createdEntities.posts[0];
        const updatedData = {
          ...testPost,
          title: 'Updated Full Post Title',
          content: 'Updated full content',
          status: 'published'
        };
        
        const response = await testUtils.apiRequest('PUT', `/api/posts/${testPost.id}`, updatedData, {
          'Authorization': `Bearer ${authToken}`
        });
        
        expect(response.status).toBe(200);
        expect(response.data.title).toBe(updatedData.title);
        expect(response.data.content).toBe(updatedData.content);
        expect(response.data.status).toBe(updatedData.status);
        expect(response.data.updated_at).not.toBe(testPost.updated_at);
        
        // Update our reference
        Object.assign(testPost, response.data);
      });

      test('should update post with PATCH (partial update)', async () => {
        const testPost = createdEntities.posts[1];
        const patchData = { featured: true };
        
        const response = await testUtils.apiRequest('PATCH', `/api/posts/${testPost.id}`, patchData, {
          'Authorization': `Bearer ${authToken}`
        });
        
        expect(response.status).toBe(200);
        expect(response.data.featured).toBe(true);
        expect(response.data.title).toBe(testPost.title); // Should remain unchanged
        
        Object.assign(testPost, response.data);
      });

      test('should update post slug when title changes', async () => {
        const testPost = createdEntities.posts[2];
        const newTitle = 'New Title For Slug Update';
        
        const response = await testUtils.apiRequest('PATCH', `/api/posts/${testPost.id}`, { 
          title: newTitle 
        }, {
          'Authorization': `Bearer ${authToken}`
        });
        
        expect(response.status).toBe(200);
        expect(response.data.title).toBe(newTitle);
        expect(response.data.slug).toBe('new-title-for-slug-update');
        
        Object.assign(testPost, response.data);
      });
    });

    describe('Delete Posts', () => {
      test('should soft delete post', async () => {
        const postToDelete = createdEntities.posts.pop(); // Remove from cleanup list
        
        const response = await testUtils.apiRequest('DELETE', `/api/posts/${postToDelete.id}`, null, {
          'Authorization': `Bearer ${authToken}`
        });
        
        expect(response.status).toBe(204);
        
        // Verify post is not accessible
        try {
          await testUtils.apiRequest('GET', `/api/posts/${postToDelete.id}`, null, {
            'Authorization': `Bearer ${authToken}`
          });
          fail('Deleted post should not be accessible');
        } catch (error) {
          expect(error.message).toContain('404');
        }
      });

      test('should prevent deleting non-existent post', async () => {
        try {
          await testUtils.apiRequest('DELETE', '/api/posts/999999', null, {
            'Authorization': `Bearer ${authToken}`
          });
          fail('Should not delete non-existent post');
        } catch (error) {
          expect(error.message).toContain('404');
        }
      });
    });
  });

  describe('Categories CRUD Operations', () => {
    describe('Create Categories', () => {
      test('should create category with all fields', async () => {
        const categoryData = testData.validCategories[0];
        
        const response = await testUtils.apiRequest('POST', '/api/categories', categoryData, {
          'Authorization': `Bearer ${authToken}`
        });
        
        expect(response.status).toBe(201);
        expect(response.data).toMatchObject(categoryData);
        expect(response.data).toHaveProperty('id');
        
        createdEntities.categories.push(response.data);
      });

      test('should create category with auto-generated slug', async () => {
        const categoryData = {
          name: 'Auto Slug Category',
          description: 'Category for auto slug test'
        };
        
        const response = await testUtils.apiRequest('POST', '/api/categories', categoryData, {
          'Authorization': `Bearer ${authToken}`
        });
        
        expect(response.status).toBe(201);
        expect(response.data.slug).toBe('auto-slug-category');
        
        createdEntities.categories.push(response.data);
      });

      test('should prevent duplicate category slugs', async () => {
        const existingCategory = createdEntities.categories[0];
        const duplicateData = {
          name: 'Different Name',
          slug: existingCategory.slug
        };
        
        try {
          await testUtils.apiRequest('POST', '/api/categories', duplicateData, {
            'Authorization': `Bearer ${authToken}`
          });
          fail('Should prevent duplicate slug');
        } catch (error) {
          expect(error.message).toContain('400' || '409');
        }
      });
    });

    describe('Read Categories', () => {
      test('should get all categories', async () => {
        const response = await testUtils.apiRequest('GET', '/api/categories', null, {
          'Authorization': `Bearer ${authToken}`
        });
        
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data.length).toBeGreaterThanOrEqual(2);
      });

      test('should get category by ID', async () => {
        const testCategory = createdEntities.categories[0];
        
        const response = await testUtils.apiRequest('GET', `/api/categories/${testCategory.id}`, null, {
          'Authorization': `Bearer ${authToken}`
        });
        
        expect(response.status).toBe(200);
        expect(response.data.id).toBe(testCategory.id);
      });
    });

    describe('Update Categories', () => {
      test('should update category', async () => {
        const testCategory = createdEntities.categories[0];
        const updatedData = {
          name: 'Updated Category Name',
          description: 'Updated description'
        };
        
        const response = await testUtils.apiRequest('PUT', `/api/categories/${testCategory.id}`, updatedData, {
          'Authorization': `Bearer ${authToken}`
        });
        
        expect(response.status).toBe(200);
        expect(response.data.name).toBe(updatedData.name);
        expect(response.data.description).toBe(updatedData.description);
        
        Object.assign(testCategory, response.data);
      });
    });
  });

  describe('Tags CRUD Operations', () => {
    describe('Create Tags', () => {
      test('should create tag', async () => {
        const tagData = testData.validTags[0];
        
        const response = await testUtils.apiRequest('POST', '/api/tags', tagData, {
          'Authorization': `Bearer ${authToken}`
        });
        
        expect(response.status).toBe(201);
        expect(response.data.name).toBe(tagData.name);
        expect(response.data.color).toBe(tagData.color);
        
        createdEntities.tags.push(response.data);
      });

      test('should create multiple tags in bulk', async () => {
        const bulkTags = testData.validTags.slice(1, 3);
        
        const response = await testUtils.apiRequest('POST', '/api/tags/bulk', { tags: bulkTags }, {
          'Authorization': `Bearer ${authToken}`
        });
        
        expect(response.status).toBe(201);
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data.length).toBe(bulkTags.length);
        
        createdEntities.tags.push(...response.data);
      });
    });

    describe('Read Tags', () => {
      test('should get all tags', async () => {
        const response = await testUtils.apiRequest('GET', '/api/tags', null, {
          'Authorization': `Bearer ${authToken}`
        });
        
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data.length).toBeGreaterThanOrEqual(3);
      });

      test('should get popular tags', async () => {
        const response = await testUtils.apiRequest('GET', '/api/tags?popular=true&limit=10', null, {
          'Authorization': `Bearer ${authToken}`
        });
        
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data.length).toBeLessThanOrEqual(10);
      });
    });

    describe('Update Tags', () => {
      test('should update tag', async () => {
        const testTag = createdEntities.tags[0];
        const updatedData = {
          name: 'updated-tag-name',
          color: '#ff0000'
        };
        
        const response = await testUtils.apiRequest('PUT', `/api/tags/${testTag.id}`, updatedData, {
          'Authorization': `Bearer ${authToken}`
        });
        
        expect(response.status).toBe(200);
        expect(response.data.name).toBe(updatedData.name);
        expect(response.data.color).toBe(updatedData.color);
        
        Object.assign(testTag, response.data);
      });
    });
  });

  describe('Bulk Operations', () => {
    test('should bulk update post status', async () => {
      const postIds = createdEntities.posts.slice(0, 2).map(post => post.id);
      const bulkUpdate = {
        ids: postIds,
        data: { status: 'published' }
      };
      
      const response = await testUtils.apiRequest('PATCH', '/api/posts/bulk', bulkUpdate, {
        'Authorization': `Bearer ${authToken}`
      });
      
      expect(response.status).toBe(200);
      expect(response.data.updated_count).toBe(postIds.length);
    });

    test('should bulk delete posts', async () => {
      // Create posts specifically for deletion
      const postsToDelete = [];
      for (let i = 0; i < 3; i++) {
        const postData = {
          title: `Bulk Delete Test Post ${i}`,
          content: `Content for bulk delete test ${i}`
        };
        
        const response = await testUtils.apiRequest('POST', '/api/posts', postData, {
          'Authorization': `Bearer ${authToken}`
        });
        
        postsToDelete.push(response.data);
      }
      
      const deleteIds = postsToDelete.map(post => post.id);
      
      const response = await testUtils.apiRequest('DELETE', '/api/posts/bulk', { ids: deleteIds }, {
        'Authorization': `Bearer ${authToken}`
      });
      
      expect(response.status).toBe(200);
      expect(response.data.deleted_count).toBe(deleteIds.length);
    });
  });
});