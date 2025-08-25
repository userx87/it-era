/**
 * IT-ERA Admin API Test Suite
 * Comprehensive testing for all admin API endpoints
 */

const BASE_URL = 'http://localhost:8787'; // Change for production testing
const ADMIN_API_BASE = `${BASE_URL}/admin/api`;

// Test configuration
const TEST_CONFIG = {
  timeout: 10000, // 10 seconds
  retries: 3,
  users: {
    admin: {
      email: 'admin@it-era.it',
      password: 'admin123'
    },
    editor: {
      email: 'editor@it-era.it',
      password: 'editor123'
    }
  }
};

// Global test state
let adminToken = null;
let editorToken = null;
let testPostId = null;
let testMediaId = null;

/**
 * Test utilities
 */
class TestUtils {
  static async makeRequest(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${ADMIN_API_BASE}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const requestOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    };

    console.log(`🔗 ${options.method || 'GET'} ${url}`);
    
    try {
      const response = await fetch(url, requestOptions);
      const data = await response.json();
      
      console.log(`📊 Status: ${response.status}`);
      if (!response.ok) {
        console.log(`❌ Error: ${data.error || 'Unknown error'}`);
      }
      
      return { response, data };
    } catch (error) {
      console.log(`🚫 Network Error: ${error.message}`);
      throw error;
    }
  }

  static assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
    console.log(`✅ ${message}`);
  }

  static async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Test suites
 */
class AdminAPITests {
  
  async runAllTests() {
    console.log('🚀 Starting IT-ERA Admin API Test Suite');
    console.log('=' .repeat(50));
    
    try {
      await this.testHealthCheck();
      await this.testAuthentication();
      await this.testDashboard();
      await this.testPostsManagement();
      await this.testMediaManagement();
      await this.testUserManagement();
      await this.testSettingsManagement();
      await this.testAnalytics();
      await this.testSecurity();
      
      console.log('\n🎉 All tests completed successfully!');
      
    } catch (error) {
      console.error('\n💥 Test suite failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Test health check endpoint
   */
  async testHealthCheck() {
    console.log('\n📋 Testing Health Check...');
    
    const { response, data } = await TestUtils.makeRequest('/auth/health');
    
    TestUtils.assert(response.ok, 'Health check returns 200');
    TestUtils.assert(data.success === true, 'Health check success flag is true');
    TestUtils.assert(data.data.status === 'healthy', 'Service status is healthy');
    TestUtils.assert(data.data.service === 'IT-ERA Admin API', 'Service name is correct');
    TestUtils.assert(data.data.version === '1.0.0', 'Version is correct');
    TestUtils.assert(data.data.endpoints, 'Endpoints information is present');
    
    console.log('✅ Health check test passed');
  }

  /**
   * Test authentication endpoints
   */
  async testAuthentication() {
    console.log('\n🔐 Testing Authentication...');
    
    // Test login with invalid credentials
    console.log('Testing invalid login...');
    const { response: invalidResponse } = await TestUtils.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid@example.com',
        password: 'wrongpassword'
      })
    });
    
    TestUtils.assert(invalidResponse.status === 401, 'Invalid login returns 401');
    
    // Test login with valid admin credentials
    console.log('Testing admin login...');
    const { response: adminResponse, data: adminData } = await TestUtils.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(TEST_CONFIG.users.admin)
    });
    
    TestUtils.assert(adminResponse.ok, 'Admin login returns 200');
    TestUtils.assert(adminData.success === true, 'Admin login success flag is true');
    TestUtils.assert(adminData.data.token, 'Admin login returns token');
    TestUtils.assert(adminData.data.user.role === 'admin', 'Admin user has admin role');
    
    adminToken = adminData.data.token;
    
    // Test login with editor credentials
    console.log('Testing editor login...');
    const { response: editorResponse, data: editorData } = await TestUtils.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(TEST_CONFIG.users.editor)
    });
    
    TestUtils.assert(editorResponse.ok, 'Editor login returns 200');
    TestUtils.assert(editorData.data.user.role === 'editor', 'Editor user has editor role');
    
    editorToken = editorData.data.token;
    
    // Test token verification
    console.log('Testing token verification...');
    const { response: verifyResponse, data: verifyData } = await TestUtils.makeRequest('/auth/verify', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    TestUtils.assert(verifyResponse.ok, 'Token verification returns 200');
    TestUtils.assert(verifyData.success === true, 'Token verification success');
    TestUtils.assert(verifyData.data.user, 'Token verification returns user data');
    
    // Test invalid token
    console.log('Testing invalid token...');
    const { response: invalidTokenResponse } = await TestUtils.makeRequest('/auth/verify', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid_token'
      }
    });
    
    TestUtils.assert(invalidTokenResponse.status === 401, 'Invalid token returns 401');
    
    console.log('✅ Authentication tests passed');
  }

  /**
   * Test dashboard endpoint
   */
  async testDashboard() {
    console.log('\n📊 Testing Dashboard...');
    
    const { response, data } = await TestUtils.makeRequest('/dashboard', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    TestUtils.assert(response.ok, 'Dashboard returns 200');
    TestUtils.assert(data.success === true, 'Dashboard success flag is true');
    TestUtils.assert(data.data.stats, 'Dashboard returns stats');
    TestUtils.assert(data.data.stats.posts, 'Dashboard has posts stats');
    TestUtils.assert(data.data.stats.users, 'Dashboard has users stats');
    TestUtils.assert(data.data.recent_activity, 'Dashboard has recent activity');
    TestUtils.assert(Array.isArray(data.data.quick_actions), 'Dashboard has quick actions array');
    
    console.log('✅ Dashboard test passed');
  }

  /**
   * Test posts management endpoints
   */
  async testPostsManagement() {
    console.log('\n📝 Testing Posts Management...');
    
    // Test get posts
    console.log('Testing get posts...');
    const { response: getResponse, data: getData } = await TestUtils.makeRequest('/posts', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    TestUtils.assert(getResponse.ok, 'Get posts returns 200');
    TestUtils.assert(getData.success === true, 'Get posts success flag is true');
    TestUtils.assert(Array.isArray(getData.data.posts), 'Posts is an array');
    TestUtils.assert(getData.data.pagination, 'Pagination info is present');
    
    // Test create post
    console.log('Testing create post...');
    const testPost = {
      title: 'Test Post from API Test',
      content: 'This is a test post created by the API test suite.',
      excerpt: 'Test post excerpt',
      status: 'draft',
      category: 'Test',
      tags: ['test', 'api'],
      seo_title: 'Test Post SEO Title',
      meta_description: 'Test post meta description',
      focus_keyword: 'test post'
    };
    
    const { response: createResponse, data: createData } = await TestUtils.makeRequest('/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(testPost)
    });
    
    TestUtils.assert(createResponse.ok, 'Create post returns 200');
    TestUtils.assert(createData.success === true, 'Create post success flag is true');
    TestUtils.assert(createData.data.post.id, 'Created post has ID');
    TestUtils.assert(createData.data.post.title === testPost.title, 'Created post title matches');
    
    testPostId = createData.data.post.id;
    
    // Test update post
    console.log('Testing update post...');
    const updatedPost = {
      title: 'Updated Test Post',
      content: 'This post has been updated.',
      status: 'published'
    };
    
    const { response: updateResponse, data: updateData } = await TestUtils.makeRequest(`/posts/${testPostId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(updatedPost)
    });
    
    TestUtils.assert(updateResponse.ok, 'Update post returns 200');
    TestUtils.assert(updateData.success === true, 'Update post success flag is true');
    
    // Test search posts
    console.log('Testing search posts...');
    const { response: searchResponse, data: searchData } = await TestUtils.makeRequest('/posts?search=test', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    TestUtils.assert(searchResponse.ok, 'Search posts returns 200');
    TestUtils.assert(searchData.data.posts.length > 0, 'Search returns results');
    
    console.log('✅ Posts management tests passed');
  }

  /**
   * Test media management endpoints
   */
  async testMediaManagement() {
    console.log('\n🖼️ Testing Media Management...');
    
    // Test get media
    console.log('Testing get media...');
    const { response: getResponse, data: getData } = await TestUtils.makeRequest('/media', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    TestUtils.assert(getResponse.ok, 'Get media returns 200');
    TestUtils.assert(getData.success === true, 'Get media success flag is true');
    TestUtils.assert(Array.isArray(getData.data.media), 'Media is an array');
    TestUtils.assert(getData.data.pagination, 'Media pagination info is present');
    
    // Test media with filters
    console.log('Testing media filters...');
    const { response: filterResponse, data: filterData } = await TestUtils.makeRequest('/media?type=image&page=1&limit=5', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    TestUtils.assert(filterResponse.ok, 'Filtered media returns 200');
    TestUtils.assert(filterData.success === true, 'Filtered media success flag is true');
    
    // Note: File upload test would require multipart form data
    // This is more complex to test without a proper file
    console.log('Note: File upload test skipped (requires multipart form data)');
    
    console.log('✅ Media management tests passed');
  }

  /**
   * Test user management endpoints (admin only)
   */
  async testUserManagement() {
    console.log('\n👥 Testing User Management...');
    
    // Test get users (admin only)
    console.log('Testing get users as admin...');
    const { response: adminGetResponse, data: adminGetData } = await TestUtils.makeRequest('/users', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    TestUtils.assert(adminGetResponse.ok, 'Admin get users returns 200');
    TestUtils.assert(adminGetData.success === true, 'Admin get users success flag is true');
    TestUtils.assert(Array.isArray(adminGetData.data.users), 'Users is an array');
    
    // Test get users as editor (should fail)
    console.log('Testing get users as editor (should fail)...');
    const { response: editorGetResponse } = await TestUtils.makeRequest('/users', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${editorToken}`
      }
    });
    
    TestUtils.assert(editorGetResponse.status === 403, 'Editor get users returns 403');
    
    // Test create user (admin only)
    console.log('Testing create user...');
    const newUser = {
      email: 'testuser@it-era.it',
      password: 'testpassword123',
      name: 'Test User',
      role: 'editor',
      username: 'testuser'
    };
    
    const { response: createUserResponse, data: createUserData } = await TestUtils.makeRequest('/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(newUser)
    });
    
    TestUtils.assert(createUserResponse.ok, 'Create user returns 200');
    TestUtils.assert(createUserData.success === true, 'Create user success flag is true');
    TestUtils.assert(createUserData.data.user.email === newUser.email, 'Created user email matches');
    TestUtils.assert(!createUserData.data.user.password, 'Password not returned in response');
    
    console.log('✅ User management tests passed');
  }

  /**
   * Test settings management endpoints (admin only)
   */
  async testSettingsManagement() {
    console.log('\n⚙️ Testing Settings Management...');
    
    // Test get settings (admin only)
    console.log('Testing get settings as admin...');
    const { response: getResponse, data: getData } = await TestUtils.makeRequest('/settings', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    TestUtils.assert(getResponse.ok, 'Get settings returns 200');
    TestUtils.assert(getData.success === true, 'Get settings success flag is true');
    TestUtils.assert(getData.data.settings, 'Settings data is present');
    TestUtils.assert(getData.data.settings.site, 'Site settings are present');
    TestUtils.assert(getData.data.settings.seo, 'SEO settings are present');
    
    // Test update settings
    console.log('Testing update settings...');
    const updatedSettings = {
      site: {
        title: 'Updated Blog Title'
      },
      seo: {
        default_meta_description: 'Updated meta description'
      }
    };
    
    const { response: updateResponse, data: updateData } = await TestUtils.makeRequest('/settings', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(updatedSettings)
    });
    
    TestUtils.assert(updateResponse.ok, 'Update settings returns 200');
    TestUtils.assert(updateData.success === true, 'Update settings success flag is true');
    
    // Test get settings as editor (should fail)
    console.log('Testing get settings as editor (should fail)...');
    const { response: editorGetResponse } = await TestUtils.makeRequest('/settings', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${editorToken}`
      }
    });
    
    TestUtils.assert(editorGetResponse.status === 403, 'Editor get settings returns 403');
    
    console.log('✅ Settings management tests passed');
  }

  /**
   * Test analytics endpoint
   */
  async testAnalytics() {
    console.log('\n📈 Testing Analytics...');
    
    // Test basic analytics
    console.log('Testing basic analytics...');
    const { response, data } = await TestUtils.makeRequest('/analytics', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    TestUtils.assert(response.ok, 'Analytics returns 200');
    TestUtils.assert(data.success === true, 'Analytics success flag is true');
    TestUtils.assert(data.data.overview, 'Analytics has overview data');
    TestUtils.assert(data.data.posts_performance, 'Analytics has posts performance data');
    TestUtils.assert(data.data.traffic_sources, 'Analytics has traffic sources data');
    TestUtils.assert(data.data.time_series, 'Analytics has time series data');
    
    // Test analytics with parameters
    console.log('Testing analytics with parameters...');
    const { response: paramResponse, data: paramData } = await TestUtils.makeRequest('/analytics?period=30d&metric=views', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    TestUtils.assert(paramResponse.ok, 'Parameterized analytics returns 200');
    TestUtils.assert(paramData.success === true, 'Parameterized analytics success flag is true');
    
    console.log('✅ Analytics tests passed');
  }

  /**
   * Test security features
   */
  async testSecurity() {
    console.log('\n🔒 Testing Security Features...');
    
    // Test CORS headers
    console.log('Testing CORS headers...');
    const { response: corsResponse } = await TestUtils.makeRequest('/auth/health', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://it-era.pages.dev'
      }
    });
    
    TestUtils.assert(corsResponse.status === 204, 'CORS preflight returns 204');
    TestUtils.assert(corsResponse.headers.get('Access-Control-Allow-Origin'), 'CORS headers present');
    
    // Test missing authorization
    console.log('Testing missing authorization...');
    const { response: noAuthResponse } = await TestUtils.makeRequest('/dashboard');
    
    TestUtils.assert(noAuthResponse.status === 401, 'Missing auth returns 401');
    
    // Test invalid endpoint
    console.log('Testing invalid endpoint...');
    const { response: invalidResponse } = await TestUtils.makeRequest('/nonexistent', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    TestUtils.assert(invalidResponse.status === 404, 'Invalid endpoint returns 404');
    
    // Test malformed JSON
    console.log('Testing malformed JSON...');
    const { response: malformedResponse } = await TestUtils.makeRequest('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: '{"invalid": json}'
    });
    
    TestUtils.assert(malformedResponse.status === 400 || malformedResponse.status === 500, 'Malformed JSON handled properly');
    
    console.log('✅ Security tests passed');
  }

  /**
   * Clean up test data
   */
  async cleanup() {
    console.log('\n🧹 Cleaning up test data...');
    
    if (testPostId) {
      console.log(`Deleting test post ${testPostId}...`);
      try {
        await TestUtils.makeRequest(`/posts/${testPostId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });
        console.log('✅ Test post deleted');
      } catch (error) {
        console.log('⚠️ Failed to delete test post:', error.message);
      }
    }
    
    console.log('✅ Cleanup completed');
  }
}

/**
 * Run the test suite
 */
async function runTests() {
  const tests = new AdminAPITests();
  
  try {
    await tests.runAllTests();
    await tests.cleanup();
  } catch (error) {
    console.error('Test suite failed:', error);
    await tests.cleanup();
    process.exit(1);
  }
}

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AdminAPITests,
    TestUtils,
    TEST_CONFIG
  };
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}