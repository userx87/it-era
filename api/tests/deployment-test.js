/**
 * Deployment Test Script for API Gateway Chatbot Integration
 * Tests that all endpoints are accessible and return expected responses
 */

async function testEndpoint(url, options = {}) {
  try {
    const response = await fetch(url, {
      timeout: 5000,
      ...options
    });
    
    return {
      url,
      status: response.status,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
      body: response.status < 500 ? await response.text() : 'Server Error'
    };
  } catch (error) {
    return {
      url,
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

async function testChatbotIntegration() {
  console.log('🧪 Testing API Gateway Chatbot Integration...\n');
  
  const baseUrl = process.env.API_BASE_URL || 'https://it-era-api.bulltech.workers.dev';
  
  const tests = [
    // Health checks
    {
      name: 'General API Health Check',
      url: `${baseUrl}/api/health`,
      method: 'GET'
    },
    {
      name: 'Chatbot Health Check',
      url: `${baseUrl}/health`,
      method: 'GET',
      headers: { 'User-Agent': 'chatbot-health-check' }
    },
    
    // API Documentation
    {
      name: 'API Documentation',
      url: `${baseUrl}/api`,
      method: 'GET'
    },
    
    // CORS Preflight
    {
      name: 'Chatbot CORS Preflight',
      url: `${baseUrl}/api/chat`,
      method: 'OPTIONS',
      headers: { 
        'Origin': 'https://it-era.it',
        'Access-Control-Request-Method': 'POST'
      }
    },
    
    // Chatbot endpoints
    {
      name: 'Chatbot Start Session',
      url: `${baseUrl}/api/chat`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start' })
    },
    
    // Analytics routing
    {
      name: 'Chatbot Analytics',
      url: `${baseUrl}/analytics`,
      method: 'GET',
      headers: { 'X-Chatbot-Request': 'true' }
    },
    {
      name: 'General Analytics',
      url: `${baseUrl}/api/analytics`,
      method: 'GET'
    }
  ];
  
  const results = [];
  
  for (const test of tests) {
    console.log(`Testing: ${test.name}`);
    const result = await testEndpoint(test.url, {
      method: test.method || 'GET',
      headers: test.headers || {},
      body: test.body
    });
    
    result.testName = test.name;
    results.push(result);
    
    const status = result.ok ? '✅' : '❌';
    console.log(`${status} ${result.status} ${test.name}`);
    
    if (!result.ok && result.error) {
      console.log(`   Error: ${result.error}`);
    }
    
    console.log('');
  }
  
  // Summary
  const passed = results.filter(r => r.ok).length;
  const total = results.length;
  
  console.log(`\n📊 Test Results: ${passed}/${total} passed`);
  
  // Check specific integration points
  const apiDoc = results.find(r => r.testName === 'API Documentation');
  if (apiDoc?.ok) {
    try {
      const doc = JSON.parse(apiDoc.body);
      const hasChatbot = doc.endpoints?.chatbot;
      console.log(`📚 API Documentation includes chatbot endpoints: ${hasChatbot ? '✅' : '❌'}`);
    } catch (e) {
      console.log('⚠️  Could not parse API documentation');
    }
  }
  
  const healthCheck = results.find(r => r.testName === 'General API Health Check');
  if (healthCheck?.ok) {
    try {
      const health = JSON.parse(healthCheck.body);
      const hasChatbotStatus = health.services?.chatbot;
      console.log(`🏥 Health check includes chatbot status: ${hasChatbotStatus ? '✅' : '❌'}`);
    } catch (e) {
      console.log('⚠️  Could not parse health check response');
    }
  }
  
  const corsTest = results.find(r => r.testName === 'Chatbot CORS Preflight');
  if (corsTest?.ok) {
    const hasCorsHeaders = corsTest.headers['access-control-allow-origin'] === '*';
    console.log(`🌐 CORS headers properly configured: ${hasCorsHeaders ? '✅' : '❌'}`);
  }
  
  return results;
}

// Run if called directly
if (require.main === module) {
  testChatbotIntegration()
    .then(results => {
      const failed = results.filter(r => !r.ok).length;
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('💥 Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { testChatbotIntegration, testEndpoint };