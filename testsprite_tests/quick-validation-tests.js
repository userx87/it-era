/**
 * Quick Validation Tests for IT-ERA Chatbot Swarm
 * Focused on critical functionality validation
 */

const axios = require('axios');

async function runQuickValidation() {
  const baseUrl = 'https://it-era-chatbot-staging.bulltech.workers.dev';
  const results = {
    timestamp: new Date().toISOString(),
    system: 'IT-ERA Chatbot Swarm',
    environment: 'Staging',
    tests: []
  };

  console.log('🔍 Quick Validation Test Suite for IT-ERA Chatbot Swarm\n');

  // 1. Health Check
  try {
    const health = await axios.get(`${baseUrl}/health`, { timeout: 5000 });
    results.tests.push({
      name: 'System Health',
      status: health.data.status === 'ok' ? 'PASS' : 'FAIL',
      details: `Service: ${health.data.service}, AI: ${health.data.ai?.enabled}`
    });
    console.log(`✅ System Health: ${health.data.status} - AI Enabled: ${health.data.ai?.enabled}`);
  } catch (error) {
    results.tests.push({
      name: 'System Health',
      status: 'FAIL',
      details: error.message
    });
    console.log(`❌ System Health: FAIL - ${error.message}`);
  }

  // 2. Basic Chat Functionality
  try {
    const chatStart = await axios.post(`${baseUrl}/api/chat`, {
      action: 'start'
    }, { timeout: 8000 });
    
    const sessionId = chatStart.data.sessionId;
    
    const chatMessage = await axios.post(`${baseUrl}/api/chat`, {
      action: 'message',
      message: 'Che servizi offrite?',
      sessionId
    }, { timeout: 8000 });

    const chatWorking = chatStart.data.success && chatMessage.data.success && chatMessage.data.response;
    results.tests.push({
      name: 'Basic Chat Flow',
      status: chatWorking ? 'PASS' : 'FAIL',
      details: `Session: ${!!sessionId}, Response: ${!!chatMessage.data.response}, Source: ${chatMessage.data.source}`
    });
    console.log(`${chatWorking ? '✅' : '❌'} Basic Chat Flow: ${chatWorking ? 'PASS' : 'FAIL'} - Source: ${chatMessage.data.source}`);

    // 3. Business Rules Test (Configuration Block)
    try {
      const configBlock = await axios.post(`${baseUrl}/api/chat`, {
        action: 'message',
        message: 'Come configuro il firewall?',
        sessionId
      }, { timeout: 8000 });

      const isBlocked = !configBlock.data.response.toLowerCase().includes('configura') &&
                        configBlock.data.response.toLowerCase().includes('tecnici');
      
      results.tests.push({
        name: 'Business Rules - Configuration Block',
        status: isBlocked ? 'PASS' : 'FAIL',
        details: `Technical steps blocked: ${isBlocked}, Response redirected to services`
      });
      console.log(`${isBlocked ? '✅' : '❌'} Business Rules Test: ${isBlocked ? 'PASS' : 'FAIL'}`);
    } catch (error) {
      results.tests.push({
        name: 'Business Rules - Configuration Block',
        status: 'ERROR',
        details: error.message
      });
      console.log(`❌ Business Rules Test: ERROR - ${error.message}`);
    }

    // 4. High-Value Lead Test
    try {
      const leadTest = await axios.post(`${baseUrl}/api/chat`, {
        action: 'message',
        message: 'Siamo una PMI con 50 dipendenti. Ci serve un firewall e backup completo. Budget disponibile.',
        sessionId
      }, { timeout: 8000 });

      const hasLeadResponse = leadTest.data.response.toLowerCase().includes('preventivo') ||
                             leadTest.data.response.toLowerCase().includes('sopralluogo');
      
      results.tests.push({
        name: 'Lead Qualification - High Value PMI',
        status: hasLeadResponse ? 'PASS' : 'FAIL',
        details: `Professional response: ${hasLeadResponse}, Source: ${leadTest.data.source}`
      });
      console.log(`${hasLeadResponse ? '✅' : '❌'} Lead Qualification: ${hasLeadResponse ? 'PASS' : 'FAIL'}`);
    } catch (error) {
      results.tests.push({
        name: 'Lead Qualification - High Value PMI',
        status: 'ERROR',
        details: error.message
      });
      console.log(`❌ Lead Qualification: ERROR - ${error.message}`);
    }

  } catch (error) {
    results.tests.push({
      name: 'Basic Chat Flow',
      status: 'FAIL',
      details: error.message
    });
    console.log(`❌ Basic Chat Flow: FAIL - ${error.message}`);
  }

  // 5. Performance Quick Check
  const startTime = Date.now();
  try {
    await axios.post(`${baseUrl}/api/chat`, {
      action: 'start'
    }, { timeout: 5000 });
    
    const responseTime = Date.now() - startTime;
    const isUnder3Sec = responseTime < 3000;
    
    results.tests.push({
      name: 'Performance Check',
      status: isUnder3Sec ? 'PASS' : 'WARNING',
      details: `Response time: ${responseTime}ms (target: <2000ms)`
    });
    console.log(`${isUnder3Sec ? '✅' : '⚠️'} Performance Check: ${responseTime}ms`);
  } catch (error) {
    results.tests.push({
      name: 'Performance Check',
      status: 'FAIL',
      details: error.message
    });
    console.log(`❌ Performance Check: FAIL - ${error.message}`);
  }

  // Generate Summary
  const passed = results.tests.filter(t => t.status === 'PASS').length;
  const total = results.tests.length;
  const passRate = ((passed / total) * 100).toFixed(1);

  results.summary = {
    total,
    passed,
    failed: results.tests.filter(t => t.status === 'FAIL').length,
    errors: results.tests.filter(t => t.status === 'ERROR').length,
    warnings: results.tests.filter(t => t.status === 'WARNING').length,
    passRate: `${passRate}%`
  };

  console.log('\n' + '='.repeat(60));
  console.log('📊 QUICK VALIDATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed} (${passRate}%)`);
  console.log(`Failed: ${results.summary.failed}`);
  console.log(`Errors: ${results.summary.errors}`);
  console.log(`Warnings: ${results.summary.warnings}`);
  console.log('='.repeat(60));

  return results;
}

if (require.main === module) {
  runQuickValidation()
    .then(results => {
      console.log('\n📋 Validation complete. System status summary:');
      
      if (results.summary.passed >= 4) {
        console.log('🟢 System operational - Core functionality working');
      } else if (results.summary.passed >= 2) {
        console.log('🟡 System partially operational - Some issues detected');
      } else {
        console.log('🔴 System has critical issues - Requires attention');
      }
      
      // Write results to file
      require('fs').writeFileSync(
        '/Users/andreapanzeri/progetti/IT-ERA/testsprite_tests/quick-validation-results.json',
        JSON.stringify(results, null, 2)
      );
      
      process.exit(results.summary.failed === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    });
}

module.exports = { runQuickValidation };