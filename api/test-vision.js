#!/usr/bin/env node
/**
 * Quick Vision Integration Test Runner
 * Validates GPT 4.1 Mini vision capabilities
 */

const fetch = require('node-fetch');

const API_ENDPOINT = process.env.CHATBOT_API_URL || 'http://localhost:8787/api/chat';

// Simple test image (1x1 pixel PNG)
const TEST_IMAGE = {
  name: 'test_screenshot.png',
  type: 'image/png',
  size: 95,
  dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
  data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
};

async function testVisionIntegration() {
  console.log('🧪 Testing GPT 4.1 Mini Vision Integration...\n');

  // Test 1: Basic Vision Request
  console.log('📸 Test 1: Basic image analysis...');
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'start'
      })
    });

    const startResult = await response.json();
    
    if (!startResult.success) {
      throw new Error('Failed to start session');
    }

    console.log(`✅ Session started: ${startResult.sessionId}`);

    // Send vision request
    const visionResponse = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'message',
        message: 'Ho questo errore sul computer. Puoi analizzare lo screenshot?',
        images: [TEST_IMAGE],
        hasVision: true,
        sessionId: startResult.sessionId,
        timestamp: Date.now()
      })
    });

    const visionResult = await visionResponse.json();
    
    if (visionResult.success) {
      console.log(`✅ Vision request successful`);
      console.log(`👁️ Vision used: ${visionResult.visionUsed || false}`);
      console.log(`🤖 AI powered: ${visionResult.aiPowered || false}`);
      console.log(`💰 Cost: €${(visionResult.cost || 0).toFixed(6)}`);
      console.log(`⏱️ Response time: ${visionResult.responseTime || 0}ms`);
      console.log(`💬 Response: "${visionResult.response?.substring(0, 100)}..."`);
    } else {
      console.log(`❌ Vision request failed: ${visionResult.error}`);
    }

  } catch (error) {
    console.log(`❌ Test 1 failed: ${error.message}`);
  }

  // Test 2: Configuration Check
  console.log('\n🔧 Test 2: Configuration validation...');
  try {
    const healthResponse = await fetch(`${API_ENDPOINT.replace('/api/chat', '/health')}`);
    const health = await healthResponse.json();
    
    console.log(`✅ Service status: ${health.status}`);
    console.log(`🤖 AI engine: ${health.ai?.engine || 'unknown'}`);
    console.log(`📋 Primary model: ${health.ai?.primaryModel || 'unknown'}`);
    console.log(`👁️ Hybrid enabled: ${health.ai?.hybridEnabled || false}`);
    console.log(`💰 Target cost: ${health.ai?.targetCost || 'unknown'}`);

  } catch (error) {
    console.log(`❌ Test 2 failed: ${error.message}`);
  }

  // Test 3: Error Handling
  console.log('\n🛡️ Test 3: Error handling...');
  try {
    const errorResponse = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'message',
        message: 'Test invalid image',
        images: [{
          name: 'invalid.txt',
          type: 'text/plain',
          size: 100,
          dataUrl: 'data:text/plain;base64,aW52YWxpZA==',
          data: 'aW52YWxpZA=='
        }],
        hasVision: true,
        sessionId: `test_${Date.now()}`,
        timestamp: Date.now()
      })
    });

    const errorResult = await errorResponse.json();
    
    if (errorResult.success) {
      console.log(`✅ Error handling successful`);
      console.log(`👁️ Vision used: ${errorResult.visionUsed || false}`);
      console.log(`💬 Fallback response provided`);
    } else {
      console.log(`⚠️ Expected graceful handling, got error: ${errorResult.error}`);
    }

  } catch (error) {
    console.log(`❌ Test 3 failed: ${error.message}`);
  }

  console.log('\n🎉 Vision integration test completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Deploy to staging environment');
  console.log('2. Run full test suite with real images');
  console.log('3. Monitor cost and performance metrics');
  console.log('4. Collect user feedback on vision accuracy');
}

if (require.main === module) {
  testVisionIntegration()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('\n💥 Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { testVisionIntegration };