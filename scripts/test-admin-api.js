/**
 * IT-ERA Admin API Test Script
 * Tests all admin API endpoints to identify HTML vs JSON response issues
 */

const API_BASE_URL = 'https://it-era-admin-auth-production.bulltech.workers.dev';

const endpoints = [
  {
    name: 'Login',
    method: 'POST',
    path: '/admin/api/auth/login',
    body: { email: 'admin@it-era.it', password: 'admin123' }
  },
  {
    name: 'Token Verification',
    method: 'GET', 
    path: '/admin/api/auth/verify',
    headers: { 'Authorization': 'Bearer test-token' }
  },
  {
    name: 'Posts API',
    method: 'GET',
    path: '/admin/api/posts'
  },
  {
    name: 'Dashboard API', 
    method: 'GET',
    path: '/admin/api/dashboard'
  },
  {
    name: 'Health Check',
    method: 'GET',
    path: '/health'
  }
];

async function testEndpoint(endpoint) {
  console.log(`\n🧪 Testing ${endpoint.name}: ${endpoint.method} ${endpoint.path}`);
  
  try {
    const options = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'IT-ERA-API-Test/1.0',
        ...endpoint.headers
      }
    };
    
    if (endpoint.body) {
      options.body = JSON.stringify(endpoint.body);
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint.path}`, options);
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);
    
    const responseText = await response.text();
    
    // Check if response is HTML (indicating an error page)
    const isHTML = responseText.trim().startsWith('<!DOCTYPE') || 
                   responseText.trim().startsWith('<html') ||
                   responseText.includes('<body>');
    
    if (isHTML) {
      console.error(`❌ PROBLEM: Endpoint returned HTML instead of JSON!`);
      console.log(`📝 First 200 chars: ${responseText.substring(0, 200)}`);
      return { success: false, error: 'HTML_RESPONSE', status: response.status };
    }
    
    // Try to parse as JSON
    let jsonData;
    try {
      jsonData = JSON.parse(responseText);
      console.log(`✅ Valid JSON response`);
      console.log(`📦 Response data:`, JSON.stringify(jsonData, null, 2));
      return { success: true, data: jsonData, status: response.status };
    } catch (parseError) {
      console.error(`❌ PROBLEM: Invalid JSON response!`);
      console.log(`📝 Raw response: ${responseText}`);
      return { success: false, error: 'INVALID_JSON', status: response.status, response: responseText };
    }
    
  } catch (error) {
    console.error(`❌ Network Error: ${error.message}`);
    return { success: false, error: 'NETWORK_ERROR', message: error.message };
  }
}

async function runAllTests() {
  console.log('🚀 Starting IT-ERA Admin API Tests');
  console.log(`📍 Testing base URL: ${API_BASE_URL}`);
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push({ endpoint: endpoint.name, ...result });
  }
  
  console.log('\n📋 TEST SUMMARY:');
  console.log('================');
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.endpoint}: ${result.success ? 'OK' : result.error} (${result.status || 'N/A'})`);
  });
  
  const failedTests = results.filter(r => !r.success);
  if (failedTests.length > 0) {
    console.log('\n🔍 ISSUES DETECTED:');
    failedTests.forEach(test => {
      console.log(`- ${test.endpoint}: ${test.error}`);
      if (test.error === 'HTML_RESPONSE') {
        console.log('  → This endpoint is returning HTML instead of JSON (likely a 404/500 error page)');
      }
    });
    
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('1. Check if missing API endpoints are properly configured in the worker');
    console.log('2. Verify routing configuration in wrangler.toml');
    console.log('3. Check if authentication endpoints exist in the source code');
    console.log('4. Test with proper credentials for protected endpoints');
  } else {
    console.log('\n🎉 All tests passed! API endpoints are working correctly.');
  }
}

// Run tests
runAllTests().catch(console.error);