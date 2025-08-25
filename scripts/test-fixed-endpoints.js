/**
 * Test Fixed Admin API Endpoints
 * Validates the fixes for the "Unexpected token '<'" error
 */

const API_BASE_URL = 'https://it-era-admin-auth-production.bulltech.workers.dev';

async function testLogin() {
  console.log('\n🔑 Testing Login...');
  
  const response = await fetch(`${API_BASE_URL}/admin/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      email: 'admin@it-era.it',
      password: 'admin123'
    })
  });
  
  const data = await response.json();
  
  if (data.success && data.token) {
    console.log('✅ Login successful');
    console.log(`📝 Token: ${data.token.substring(0, 50)}...`);
    return data.token;
  } else {
    console.log('❌ Login failed:', data.error);
    return null;
  }
}

async function testProtectedEndpoint(endpoint, token, description) {
  console.log(`\n🔒 Testing ${description}...`);
  
  if (!token) {
    console.log('❌ No token available, skipping test');
    return false;
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });
  
  console.log(`📊 Status: ${response.status}`);
  console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);
  
  const responseText = await response.text();
  
  // Check if response is HTML (the original problem)
  const isHTML = responseText.trim().startsWith('<!DOCTYPE') || 
                 responseText.trim().startsWith('<html') ||
                 responseText.includes('<body>');
  
  if (isHTML) {
    console.error('❌ PROBLEM STILL EXISTS: Endpoint returned HTML instead of JSON!');
    console.log(`📝 Response: ${responseText.substring(0, 200)}`);
    return false;
  }
  
  try {
    const jsonData = JSON.parse(responseText);
    console.log('✅ Valid JSON response received');
    
    if (response.ok) {
      console.log('✅ Request successful');
      console.log(`📦 Data keys: ${Object.keys(jsonData).join(', ')}`);
      return true;
    } else {
      console.log(`⚠️ Request failed with status ${response.status}: ${jsonData.error || 'Unknown error'}`);
      return false;
    }
  } catch (parseError) {
    console.error('❌ Invalid JSON response');
    console.log(`📝 Raw response: ${responseText}`);
    return false;
  }
}

async function runFixedEndpointTests() {
  console.log('🚀 Testing Fixed IT-ERA Admin API Endpoints');
  console.log('=========================================');
  
  // Step 1: Login and get token
  const token = await testLogin();
  
  if (!token) {
    console.log('\n❌ Cannot proceed with tests - login failed');
    return;
  }
  
  // Step 2: Test all previously failing endpoints
  const tests = [
    { endpoint: '/admin/api/auth/verify', description: 'Token Verification' },
    { endpoint: '/admin/api/posts', description: 'Posts API' },
    { endpoint: '/admin/api/dashboard', description: 'Dashboard API' },
    { endpoint: '/health', description: 'Health Check' }
  ];
  
  const results = [];
  
  for (const test of tests) {
    const success = await testProtectedEndpoint(test.endpoint, token, test.description);
    results.push({ endpoint: test.endpoint, success });
  }
  
  // Summary
  console.log('\n📋 FIX VALIDATION SUMMARY:');
  console.log('==========================');
  
  const successfulTests = results.filter(r => r.success);
  const failedTests = results.filter(r => !r.success);
  
  console.log(`✅ Fixed endpoints: ${successfulTests.length}/${results.length}`);
  
  if (failedTests.length > 0) {
    console.log('\n❌ Still failing:');
    failedTests.forEach(test => console.log(`  - ${test.endpoint}`));
  }
  
  if (successfulTests.length === results.length) {
    console.log('\n🎉 ALL ENDPOINTS FIXED! No more "Unexpected token \'<\'" errors!');
    console.log('💡 The admin panel should now work correctly with proper JSON responses.');
  } else {
    console.log('\n⚠️ Some endpoints still need attention.');
  }
  
  return successfulTests.length === results.length;
}

// Run the tests
runFixedEndpointTests().catch(console.error);