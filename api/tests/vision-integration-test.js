/**
 * Vision Integration Test Suite
 * Tests GPT 4.1 Mini vision capabilities with IT support scenarios
 */

const { VisionTestScenarios, VisionTestUtils } = require('../examples/vision-test-scenarios.js');

describe('GPT 4.1 Mini Vision Integration', () => {
  const API_ENDPOINT = process.env.CHATBOT_API_URL || 'https://it-era-chatbot.bulltech.workers.dev/api/chat';
  let testResults = [];

  beforeAll(() => {
    console.log('🧪 Starting GPT 4.1 Mini Vision Test Suite');
    console.log(`📡 Testing against: ${API_ENDPOINT}`);
  });

  afterAll(() => {
    // Generate test report
    const successful = testResults.filter(r => r.success).length;
    const totalCost = testResults.reduce((sum, r) => sum + (r.cost || 0), 0);
    const avgResponseTime = testResults.reduce((sum, r) => sum + (r.responseTime || 0), 0) / testResults.length;

    console.log('\n📊 Vision Integration Test Results:');
    console.log(`✅ Successful: ${successful}/${testResults.length}`);
    console.log(`💰 Total cost: €${totalCost.toFixed(6)}`);
    console.log(`⏱️ Avg response time: ${Math.round(avgResponseTime)}ms`);
    console.log(`👁️ Vision usage: ${testResults.filter(r => r.visionUsed).length}/${testResults.length}`);
  });

  describe('Error Analysis Scenarios', () => {
    test('should analyze error screenshots correctly', async () => {
      const result = await VisionTestUtils.runVisionTest(API_ENDPOINT, 'errorAnalysis');
      testResults.push(result);
      
      expect(result.success).toBe(true);
      expect(result.visionUsed).toBe(true);
      expect(result.responseTime).toBeLessThan(6000); // Max 6 seconds
      expect(result.cost).toBeGreaterThan(0);
      expect(result.cost).toBeLessThan(0.100); // Max €0.10
    });

    test('should handle critical system errors with escalation', async () => {
      const criticalErrorTest = {
        ...VisionTestScenarios.errorAnalysis,
        testMessage: 'URGENTE: Il server è down con questo errore critico!',
        expectedAnalysis: {
          ...VisionTestScenarios.errorAnalysis.expectedAnalysis,
          priority: 'immediate',
          escalation: true
        }
      };

      const testRequest = VisionTestUtils.createTestRequest('errorAnalysis');
      testRequest.message = criticalErrorTest.testMessage;

      try {
        const response = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testRequest)
        });

        const result = await response.json();
        testResults.push({
          scenario: 'criticalError',
          success: result.success,
          visionUsed: result.visionUsed,
          cost: result.cost || 0,
          responseTime: result.responseTime || 0,
          escalated: result.escalate
        });

        expect(result.success).toBe(true);
        expect(result.escalate).toBe(true); // Should escalate critical errors
      } catch (error) {
        fail(`Critical error test failed: ${error.message}`);
      }
    });
  });

  describe('Hardware Identification Scenarios', () => {
    test('should identify hardware components', async () => {
      const result = await VisionTestUtils.runVisionTest(API_ENDPOINT, 'hardwareId');
      testResults.push(result);
      
      expect(result.success).toBe(true);
      expect(result.visionUsed).toBe(true);
      expect(result.response).toMatch(/(componente|hardware|ventola|server)/i);
    });

    test('should provide repair recommendations', async () => {
      const testRequest = VisionTestUtils.createTestRequest('hardwareId');
      testRequest.message = 'Questo componente è rotto, conviene ripararlo o sostituirlo?';

      try {
        const response = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testRequest)
        });

        const result = await response.json();
        testResults.push({
          scenario: 'hardwareRepair',
          success: result.success,
          visionUsed: result.visionUsed,
          cost: result.cost || 0,
          responseTime: result.responseTime || 0
        });

        expect(result.success).toBe(true);
        expect(result.response).toMatch(/(riparazione|sostituzione|preventivo)/i);
      } catch (error) {
        fail(`Hardware repair test failed: ${error.message}`);
      }
    });
  });

  describe('Network Analysis Scenarios', () => {
    test('should analyze network diagrams', async () => {
      const result = await VisionTestUtils.runVisionTest(API_ENDPOINT, 'networkAnalysis');
      testResults.push(result);
      
      expect(result.success).toBe(true);
      expect(result.visionUsed).toBe(true);
      expect(result.response).toMatch(/(rete|configurazione|topologia|firewall)/i);
    });

    test('should recommend WatchGuard solutions when appropriate', async () => {
      const testRequest = VisionTestUtils.createTestRequest('networkAnalysis');
      testRequest.message = 'La nostra rete ha problemi di sicurezza. Serve un firewall enterprise?';

      try {
        const response = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testRequest)
        });

        const result = await response.json();
        testResults.push({
          scenario: 'watchguardRecommendation',
          success: result.success,
          visionUsed: result.visionUsed,
          cost: result.cost || 0,
          responseTime: result.responseTime || 0
        });

        expect(result.success).toBe(true);
        // Should mention IT-ERA's WatchGuard specialization
        expect(result.response).toMatch(/(WatchGuard|firewall|partner|certificato)/i);
      } catch (error) {
        fail(`WatchGuard recommendation test failed: ${error.message}`);
      }
    });
  });

  describe('Security Incident Scenarios', () => {
    test('should handle security alerts with immediate escalation', async () => {
      const result = await VisionTestUtils.runVisionTest(API_ENDPOINT, 'securityIncident');
      testResults.push(result);
      
      expect(result.success).toBe(true);
      expect(result.visionUsed).toBe(true);
      expect(result.escalated).toBe(true); // Security incidents should always escalate
      expect(result.response).toMatch(/(sicurezza|emergenza|immediato|critico)/i);
    });

    test('should provide immediate containment steps', async () => {
      const testRequest = VisionTestUtils.createTestRequest('securityIncident');
      
      try {
        const response = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testRequest)
        });

        const result = await response.json();
        
        expect(result.success).toBe(true);
        expect(result.escalate).toBe(true);
        expect(result.response).toMatch(/(isolamento|backup|procedura|immediata)/i);
      } catch (error) {
        fail(`Security containment test failed: ${error.message}`);
      }
    });
  });

  describe('Multi-Image Analysis', () => {
    test('should handle multiple related images', async () => {
      const result = await VisionTestUtils.runVisionTest(API_ENDPOINT, 'multipleImages');
      testResults.push(result);
      
      expect(result.success).toBe(true);
      expect(result.visionUsed).toBe(true);
      // Should cost more due to multiple images
      expect(result.cost).toBeGreaterThan(0.030);
    });

    test('should provide comprehensive analysis across images', async () => {
      const testRequest = VisionTestUtils.createTestRequest('multipleImages');
      
      try {
        const response = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testRequest)
        });

        const result = await response.json();
        
        expect(result.success).toBe(true);
        expect(result.imageCount).toBe(3);
        // Response should reference multiple aspects
        expect(result.response).toMatch(/(immagini|foto|diverse|problema)/i);
      } catch (error) {
        fail(`Multi-image analysis test failed: ${error.message}`);
      }
    });
  });

  describe('Performance & Cost Tests', () => {
    test('should stay within cost limits', async () => {
      // Test multiple scenarios to ensure cost efficiency
      const scenarios = ['errorAnalysis', 'hardwareId', 'equipmentId'];
      
      for (const scenario of scenarios) {
        const result = await VisionTestUtils.runVisionTest(API_ENDPOINT, scenario);
        testResults.push(result);
        
        expect(result.cost).toBeLessThan(0.100); // Max €0.10 per session
        expect(result.responseTime).toBeLessThan(8000); // Max 8 seconds
      }
    });

    test('should use appropriate models for different scenarios', async () => {
      const testRequest = VisionTestUtils.createTestRequest('errorAnalysis');
      
      try {
        const response = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testRequest)
        });

        const result = await response.json();
        
        expect(result.success).toBe(true);
        expect(result.model).toMatch(/(gpt-4o-mini|gpt-4o)/i); // Should use vision-capable model
        expect(result.visionUsed).toBe(true);
      } catch (error) {
        fail(`Model selection test failed: ${error.message}`);
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid image formats gracefully', async () => {
      const testRequest = {
        action: 'message',
        message: 'Analizza questo file',
        images: [{
          name: 'test.txt',
          type: 'text/plain',
          size: 1024,
          dataUrl: 'data:text/plain;base64,VGVzdCBmaWxl',
          data: 'VGVzdCBmaWxl'
        }],
        hasVision: true,
        sessionId: `test_${Date.now()}`,
        timestamp: Date.now()
      };

      try {
        const response = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testRequest)
        });

        const result = await response.json();
        
        // Should handle gracefully, not crash
        expect(result.success).toBe(true);
        // Should fallback to text-only processing
        expect(result.visionUsed).toBe(false);
      } catch (error) {
        fail(`Error handling test failed: ${error.message}`);
      }
    });

    test('should handle oversized images', async () => {
      const testRequest = VisionTestUtils.createTestRequest('errorAnalysis');
      testRequest.images[0].size = 25 * 1024 * 1024; // 25MB, over limit

      try {
        const response = await fetch(API_ENDPOINT, {
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testRequest)
        });

        const result = await response.json();
        
        // Should handle gracefully
        expect(result.success).toBe(true);
        // Might process without vision or provide error message
      } catch (error) {
        fail(`Oversized image test failed: ${error.message}`);
      }
    });
  });
});

// Helper function for manual testing
if (require.main === module) {
  console.log('🚀 Running manual vision test...');
  
  const apiEndpoint = process.argv[2] || 'https://it-era-chatbot.bulltech.workers.dev/api/chat';
  
  VisionTestUtils.runAllTests(apiEndpoint)
    .then(results => {
      console.log('\n✅ Manual test completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Manual test failed:', error);
      process.exit(1);
    });
}