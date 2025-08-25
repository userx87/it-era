/**
 * IT-ERA Chatbot Optimization Test Suite
 * Tests the performance improvements and [IT-ERA] prefix compliance
 */

const CHATBOT_API_URL = 'https://it-era-chatbot.bulltech.workers.dev/api/chat';
const TEST_TIMEOUT = 3000; // 3 seconds max response time

class ChatbotOptimizationTester {
  constructor() {
    this.results = {
      tests: [],
      totalTests: 0,
      passedTests: 0,
      averageResponseTime: 0,
      prefixCompliance: 0
    };
  }

  async runAllTests() {
    console.log('🚀 Starting IT-ERA Chatbot Optimization Tests...\n');

    await this.testGreetingSpeed();
    await this.testGreetingPrefix();
    await this.testProfessionalTone();
    await this.testTimeoutHandling();
    await this.testFallbackMessages();
    
    this.generateReport();
  }

  async testGreetingSpeed() {
    console.log('⚡ Testing Greeting Response Speed...');
    
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), TEST_TIMEOUT);

      const response = await fetch(CHATBOT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
        signal: controller.signal
      });

      const result = await response.json();
      const responseTime = Date.now() - startTime;

      this.logTest('Greeting Speed', {
        passed: responseTime < 2000, // Must be under 2 seconds
        responseTime,
        cached: result.cached,
        message: `Response time: ${responseTime}ms (target: <2000ms)`
      });

    } catch (error) {
      this.logTest('Greeting Speed', {
        passed: false,
        error: error.message,
        message: 'Greeting failed to load within timeout'
      });
    }
  }

  async testGreetingPrefix() {
    console.log('📝 Testing [IT-ERA] Prefix Compliance...');
    
    try {
      const response = await fetch(CHATBOT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      });

      const result = await response.json();
      const hasPrefix = result.response?.startsWith('[IT-ERA]');

      this.logTest('Greeting Prefix', {
        passed: hasPrefix,
        message: hasPrefix ? 
          'Greeting correctly starts with [IT-ERA]' : 
          `Greeting missing [IT-ERA] prefix: "${result.response?.substring(0, 50)}..."`
      });

    } catch (error) {
      this.logTest('Greeting Prefix', {
        passed: false,
        error: error.message
      });
    }
  }

  async testProfessionalTone() {
    console.log('💼 Testing Professional Tone...');
    
    try {
      // Get session first
      const startResponse = await fetch(CHATBOT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      });

      const startResult = await startResponse.json();
      const sessionId = startResult.sessionId;

      // Test professional responses
      const testMessages = [
        { message: 'Ho bisogno di un preventivo', expectPrefix: true },
        { message: 'Cosa fate?', expectPrefix: true },
        { message: 'xyz123invalid', expectPrefix: true } // Error case
      ];

      let professionalCount = 0;

      for (const test of testMessages) {
        const response = await fetch(CHATBOT_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'message',
            message: test.message,
            sessionId
          })
        });

        const result = await response.json();
        const hasPrefix = result.response?.startsWith('[IT-ERA]');
        const isProfessional = !result.response?.includes('scusa') && 
                             !result.response?.includes('scusi') &&
                             !result.response?.toLowerCase().includes('sorry');

        if (hasPrefix && isProfessional) {
          professionalCount++;
        }
      }

      const professionalRate = (professionalCount / testMessages.length) * 100;

      this.logTest('Professional Tone', {
        passed: professionalRate >= 80,
        message: `Professional tone compliance: ${professionalRate.toFixed(1)}%`,
        details: { professionalCount, totalTests: testMessages.length }
      });

    } catch (error) {
      this.logTest('Professional Tone', {
        passed: false,
        error: error.message
      });
    }
  }

  async testTimeoutHandling() {
    console.log('⏱️ Testing Timeout Handling...');
    
    try {
      // Simulate slow request with very short timeout
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 100); // Very short timeout

      const startTime = Date.now();

      try {
        await fetch(CHATBOT_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'start' }),
          signal: controller.signal
        });
      } catch (error) {
        const responseTime = Date.now() - startTime;
        
        this.logTest('Timeout Handling', {
          passed: error.name === 'AbortError' && responseTime < 200,
          message: `Timeout handled correctly in ${responseTime}ms`,
          error: error.name
        });
        return;
      }

      this.logTest('Timeout Handling', {
        passed: false,
        message: 'Request should have timed out but did not'
      });

    } catch (error) {
      this.logTest('Timeout Handling', {
        passed: false,
        error: error.message
      });
    }
  }

  async testFallbackMessages() {
    console.log('🔄 Testing Fallback Messages...');
    
    try {
      // Test with invalid endpoint to trigger fallback
      const response = await fetch(CHATBOT_API_URL + '/invalid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      });

      const hasFallback = response.status !== 200; // Should fail gracefully

      this.logTest('Fallback Messages', {
        passed: hasFallback,
        message: `Fallback triggered with status ${response.status}`,
        status: response.status
      });

    } catch (error) {
      // Network errors should be handled gracefully
      this.logTest('Fallback Messages', {
        passed: true, // Error is expected
        message: 'Network error handled as expected',
        error: error.message
      });
    }
  }

  logTest(testName, result) {
    this.results.tests.push({
      name: testName,
      ...result
    });

    this.results.totalTests++;
    if (result.passed) {
      this.results.passedTests++;
    }

    if (result.responseTime) {
      const currentAvg = this.results.averageResponseTime;
      const count = this.results.tests.filter(t => t.responseTime).length;
      this.results.averageResponseTime = 
        ((currentAvg * (count - 1)) + result.responseTime) / count;
    }

    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`   ${status}: ${testName} - ${result.message}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 IT-ERA CHATBOT OPTIMIZATION TEST REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n📈 SUMMARY:`);
    console.log(`   Total Tests: ${this.results.totalTests}`);
    console.log(`   Passed: ${this.results.passedTests}`);
    console.log(`   Failed: ${this.results.totalTests - this.results.passedTests}`);
    console.log(`   Success Rate: ${((this.results.passedTests / this.results.totalTests) * 100).toFixed(1)}%`);
    
    if (this.results.averageResponseTime > 0) {
      console.log(`   Average Response Time: ${Math.round(this.results.averageResponseTime)}ms`);
    }

    console.log(`\n🎯 OPTIMIZATION GOALS:`);
    console.log(`   ✅ Response time < 2000ms: ${this.results.averageResponseTime < 2000 ? 'ACHIEVED' : 'NEEDS WORK'}`);
    
    const prefixTests = this.results.tests.filter(t => t.name.includes('Prefix'));
    const prefixCompliance = prefixTests.length > 0 ? 
      (prefixTests.filter(t => t.passed).length / prefixTests.length) * 100 : 0;
    console.log(`   ✅ [IT-ERA] prefix compliance: ${prefixCompliance.toFixed(1)}%`);
    
    const toneTests = this.results.tests.filter(t => t.name.includes('Professional'));
    console.log(`   ✅ Professional tone: ${toneTests.length > 0 && toneTests[0].passed ? 'ACHIEVED' : 'NEEDS WORK'}`);

    console.log(`\n🔧 DETAILED RESULTS:`);
    this.results.tests.forEach(test => {
      const status = test.passed ? '✅' : '❌';
      console.log(`   ${status} ${test.name}: ${test.message}`);
    });

    console.log('\n🚀 NEXT STEPS:');
    const failedTests = this.results.tests.filter(t => !t.passed);
    if (failedTests.length === 0) {
      console.log('   🎉 All tests passed! Chatbot is optimized and ready for production.');
    } else {
      failedTests.forEach(test => {
        console.log(`   🔍 Fix: ${test.name} - ${test.message}`);
      });
    }

    console.log('\n' + '='.repeat(60));
  }
}

// Run tests
const tester = new ChatbotOptimizationTester();
tester.runAllTests().catch(console.error);