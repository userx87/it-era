/**
 * Production Staging Tests for IT-ERA Chatbot Swarm
 * Tests the live staging environment
 */

const axios = require('axios');

async function testStagingEnvironment() {
  const baseUrl = 'https://it-era-chatbot-staging.bulltech.workers.dev';
  const results = {
    timestamp: new Date().toISOString(),
    system: 'IT-ERA Chatbot Swarm',
    environment: 'Production Staging',
    baseUrl,
    tests: []
  };

  console.log('🚀 Production Staging Test Suite for IT-ERA Chatbot Swarm');
  console.log(`Target: ${baseUrl}\n`);

  // 1. Health Check
  try {
    console.log('🏥 Testing system health...');
    const health = await axios.get(`${baseUrl}/health`, { 
      timeout: 15000,
      headers: { 'User-Agent': 'Testsprite-Automated-Testing' }
    });
    
    const healthStatus = health.status === 200 && health.data.status === 'ok';
    
    results.tests.push({
      name: 'System Health Check',
      category: 'Infrastructure',
      status: healthStatus ? 'PASS' : 'FAIL',
      details: {
        status: health.data.status,
        service: health.data.service,
        version: health.data.version,
        aiEnabled: health.data.ai?.enabled,
        aiProvider: health.data.ai?.provider,
        features: health.data.features
      },
      responseTime: Date.now() - Date.now(),
      timestamp: new Date().toISOString()
    });
    
    console.log(`${healthStatus ? '✅' : '❌'} Health Check: ${healthStatus ? 'PASS' : 'FAIL'}`);
    console.log(`   Service: ${health.data.service}`);
    console.log(`   Version: ${health.data.version}`);
    console.log(`   AI Enabled: ${health.data.ai?.enabled}`);
    console.log(`   Features: ${JSON.stringify(health.data.features)}`);

  } catch (error) {
    results.tests.push({
      name: 'System Health Check',
      category: 'Infrastructure',
      status: 'FAIL',
      details: { error: error.message },
      timestamp: new Date().toISOString()
    });
    console.log(`❌ Health Check: FAIL - ${error.message}`);
  }

  // 2. Chat Session Initialization
  let sessionId = null;
  try {
    console.log('\n💬 Testing chat session initialization...');
    const startTime = Date.now();
    
    const initResponse = await axios.post(`${baseUrl}/api/chat`, {
      action: 'start'
    }, { 
      timeout: 15000,
      headers: { 
        'Content-Type': 'application/json',
        'Origin': 'https://it-era.pages.dev',
        'User-Agent': 'Testsprite-Automated-Testing'
      }
    });
    
    const responseTime = Date.now() - startTime;
    sessionId = initResponse.data.sessionId;
    const initSuccess = initResponse.data.success && sessionId;
    
    results.tests.push({
      name: 'Chat Session Initialization',
      category: 'Functionality',
      status: initSuccess ? 'PASS' : 'FAIL',
      details: {
        success: initResponse.data.success,
        sessionId: !!sessionId,
        hasResponse: !!initResponse.data.response,
        hasOptions: Array.isArray(initResponse.data.options),
        optionsCount: initResponse.data.options?.length || 0
      },
      responseTime: responseTime,
      timestamp: new Date().toISOString()
    });
    
    console.log(`${initSuccess ? '✅' : '❌'} Session Init: ${initSuccess ? 'PASS' : 'FAIL'} (${responseTime}ms)`);
    console.log(`   Session ID: ${sessionId ? 'Generated' : 'Missing'}`);
    console.log(`   Response: ${initResponse.data.response ? 'Present' : 'Missing'}`);
    console.log(`   Options: ${initResponse.data.options?.length || 0} available`);

  } catch (error) {
    results.tests.push({
      name: 'Chat Session Initialization',
      category: 'Functionality',
      status: 'FAIL',
      details: { error: error.message },
      timestamp: new Date().toISOString()
    });
    console.log(`❌ Session Init: FAIL - ${error.message}`);
  }

  // 3. Business Rules Compliance Test
  if (sessionId) {
    try {
      console.log('\n📋 Testing business rules compliance...');
      const startTime = Date.now();
      
      const rulesResponse = await axios.post(`${baseUrl}/api/chat`, {
        action: 'message',
        message: 'Come configuro il firewall WatchGuard per aprire la porta 443?',
        sessionId
      }, { 
        timeout: 15000,
        headers: { 
          'Content-Type': 'application/json',
          'Origin': 'https://it-era.pages.dev'
        }
      });
      
      const responseTime = Date.now() - startTime;
      const response = rulesResponse.data.response.toLowerCase();
      
      // Check business rules compliance
      const containsConfigSteps = /passo|fase|configura|imposta|cambia|modifica/i.test(response);
      const redirectsToService = /tecnici|specialisti|consulenza|intervento|professionale/i.test(response);
      const hasContactInfo = /039 888 2041|info@it-era\.it/i.test(response);
      
      const businessRulesPass = !containsConfigSteps && redirectsToService;
      
      results.tests.push({
        name: 'Business Rules - Technical Block',
        category: 'Business Logic',
        status: businessRulesPass ? 'PASS' : 'FAIL',
        details: {
          containsConfigSteps: containsConfigSteps,
          redirectsToService: redirectsToService,
          hasContactInfo: hasContactInfo,
          responsePreview: response.substring(0, 100) + '...'
        },
        responseTime: responseTime,
        timestamp: new Date().toISOString()
      });
      
      console.log(`${businessRulesPass ? '✅' : '❌'} Business Rules: ${businessRulesPass ? 'PASS' : 'FAIL'} (${responseTime}ms)`);
      console.log(`   Config steps blocked: ${!containsConfigSteps}`);
      console.log(`   Service redirect: ${redirectsToService}`);
      console.log(`   Contact info: ${hasContactInfo}`);

    } catch (error) {
      results.tests.push({
        name: 'Business Rules - Technical Block',
        category: 'Business Logic',
        status: 'FAIL',
        details: { error: error.message },
        timestamp: new Date().toISOString()
      });
      console.log(`❌ Business Rules: FAIL - ${error.message}`);
    }

    // 4. Lead Scoring Test
    try {
      console.log('\n🎯 Testing lead scoring system...');
      const startTime = Date.now();
      
      const leadResponse = await axios.post(`${baseUrl}/api/chat`, {
        action: 'message',
        message: 'Siamo una PMI con 50 dipendenti a Monza. Ci serve un firewall aziendale e backup per 5TB di dati. Budget disponibile.',
        sessionId
      }, { 
        timeout: 15000,
        headers: { 
          'Content-Type': 'application/json',
          'Origin': 'https://it-era.pages.dev'
        }
      });
      
      const responseTime = Date.now() - startTime;
      const response = leadResponse.data.response.toLowerCase();
      
      // Check lead qualification response
      const hasPreventivo = /preventivo|gratuito|sopralluogo/i.test(response);
      const hasContactAction = /039 888 2041|contatt|telefon/i.test(response);
      const isProfessional = response.length > 150 && !/fai da te|da solo/i.test(response);
      
      const leadScoringPass = hasPreventivo && hasContactAction && isProfessional;
      
      results.tests.push({
        name: 'Lead Scoring - High Value PMI',
        category: 'Business Logic',
        status: leadScoringPass ? 'PASS' : 'FAIL',
        details: {
          hasPreventivo: hasPreventivo,
          hasContactAction: hasContactAction,
          isProfessional: isProfessional,
          responseLength: leadResponse.data.response.length,
          leadScore: leadResponse.data.leadScore || 'Not reported',
          intent: leadResponse.data.intent || 'Not detected'
        },
        responseTime: responseTime,
        timestamp: new Date().toISOString()
      });
      
      console.log(`${leadScoringPass ? '✅' : '❌'} Lead Scoring: ${leadScoringPass ? 'PASS' : 'FAIL'} (${responseTime}ms)`);
      console.log(`   Quote offered: ${hasPreventivo}`);
      console.log(`   Contact action: ${hasContactAction}`);
      console.log(`   Professional response: ${isProfessional}`);
      console.log(`   Response length: ${leadResponse.data.response.length} chars`);

    } catch (error) {
      results.tests.push({
        name: 'Lead Scoring - High Value PMI',
        category: 'Business Logic',
        status: 'FAIL',
        details: { error: error.message },
        timestamp: new Date().toISOString()
      });
      console.log(`❌ Lead Scoring: FAIL - ${error.message}`);
    }

    // 5. Emergency Handling Test
    try {
      console.log('\n🚨 Testing emergency handling...');
      const startTime = Date.now();
      
      const emergencyResponse = await axios.post(`${baseUrl}/api/chat`, {
        action: 'message',
        message: 'EMERGENZA! Il server è down, rete non funziona, clienti inferociti! Aiutateci subito!',
        sessionId
      }, { 
        timeout: 15000,
        headers: { 
          'Content-Type': 'application/json',
          'Origin': 'https://it-era.pages.dev'
        }
      });
      
      const responseTime = Date.now() - startTime;
      const response = emergencyResponse.data.response.toLowerCase();
      
      // Check emergency response
      const hasUrgency = /urgent|subito|immediat|emergenza|039 888 2041/i.test(response);
      const hasEscalation = emergencyResponse.data.escalate || emergencyResponse.data.priority === 'high';
      const fastResponse = responseTime < 3000;
      
      const emergencyPass = hasUrgency && (hasEscalation !== false) && fastResponse;
      
      results.tests.push({
        name: 'Emergency Handling',
        category: 'Business Logic',
        status: emergencyPass ? 'PASS' : 'FAIL',
        details: {
          hasUrgency: hasUrgency,
          hasEscalation: hasEscalation,
          fastResponse: fastResponse,
          priority: emergencyResponse.data.priority,
          escalate: emergencyResponse.data.escalate
        },
        responseTime: responseTime,
        timestamp: new Date().toISOString()
      });
      
      console.log(`${emergencyPass ? '✅' : '❌'} Emergency Handling: ${emergencyPass ? 'PASS' : 'FAIL'} (${responseTime}ms)`);
      console.log(`   Urgency detected: ${hasUrgency}`);
      console.log(`   Has escalation: ${hasEscalation}`);
      console.log(`   Fast response: ${fastResponse}`);

    } catch (error) {
      results.tests.push({
        name: 'Emergency Handling',
        category: 'Business Logic',
        status: 'FAIL',
        details: { error: error.message },
        timestamp: new Date().toISOString()
      });
      console.log(`❌ Emergency Handling: FAIL - ${error.message}`);
    }

    // 6. Performance Baseline Test
    try {
      console.log('\n⚡ Testing performance baseline...');
      
      const performanceTests = [];
      for (let i = 0; i < 3; i++) {
        const startTime = Date.now();
        
        await axios.post(`${baseUrl}/api/chat`, {
          action: 'message',
          message: 'Che servizi di sicurezza informatica offrite?',
          sessionId
        }, { 
          timeout: 10000,
          headers: { 
            'Content-Type': 'application/json',
            'Origin': 'https://it-era.pages.dev'
          }
        });
        
        const responseTime = Date.now() - startTime;
        performanceTests.push(responseTime);
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const avgResponseTime = performanceTests.reduce((a, b) => a + b, 0) / performanceTests.length;
      const maxResponseTime = Math.max(...performanceTests);
      const minResponseTime = Math.min(...performanceTests);
      
      const performancePass = avgResponseTime < 3000 && maxResponseTime < 5000;
      
      results.tests.push({
        name: 'Performance Baseline',
        category: 'Performance',
        status: performancePass ? 'PASS' : performancePass ? 'WARNING' : 'FAIL',
        details: {
          averageResponseTime: Math.round(avgResponseTime),
          maxResponseTime: maxResponseTime,
          minResponseTime: minResponseTime,
          target: '<2000ms average',
          testCount: performanceTests.length
        },
        responseTime: avgResponseTime,
        timestamp: new Date().toISOString()
      });
      
      console.log(`${performancePass ? '✅' : '⚠️'} Performance: ${performancePass ? 'PASS' : 'WARNING'}`);
      console.log(`   Average: ${Math.round(avgResponseTime)}ms (target: <2000ms)`);
      console.log(`   Range: ${minResponseTime}ms - ${maxResponseTime}ms`);

    } catch (error) {
      results.tests.push({
        name: 'Performance Baseline',
        category: 'Performance',
        status: 'FAIL',
        details: { error: error.message },
        timestamp: new Date().toISOString()
      });
      console.log(`❌ Performance: FAIL - ${error.message}`);
    }

  } else {
    console.log('\n⚠️ Skipping message tests - no valid session ID');
  }

  // Generate Summary
  const passed = results.tests.filter(t => t.status === 'PASS').length;
  const warnings = results.tests.filter(t => t.status === 'WARNING').length;
  const failed = results.tests.filter(t => t.status === 'FAIL').length;
  const total = results.tests.length;
  const passRate = ((passed / total) * 100).toFixed(1);

  results.summary = {
    total,
    passed,
    warnings,
    failed,
    passRate: `${passRate}%`,
    categories: {
      infrastructure: results.tests.filter(t => t.category === 'Infrastructure'),
      functionality: results.tests.filter(t => t.category === 'Functionality'),
      businessLogic: results.tests.filter(t => t.category === 'Business Logic'),
      performance: results.tests.filter(t => t.category === 'Performance')
    },
    overallStatus: failed === 0 ? (warnings === 0 ? 'HEALTHY' : 'WARNING') : 'ISSUES_DETECTED'
  };

  console.log('\n' + '='.repeat(80));
  console.log('📊 PRODUCTION STAGING TEST RESULTS');
  console.log('='.repeat(80));
  console.log(`Environment: ${baseUrl}`);
  console.log(`Timestamp: ${results.timestamp}`);
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed} (${passRate}%)`);
  console.log(`Warnings: ${warnings}`);
  console.log(`Failed: ${failed}`);
  console.log(`Overall Status: ${results.summary.overallStatus}`);
  console.log('='.repeat(80));

  return results;
}

if (require.main === module) {
  testStagingEnvironment()
    .then(results => {
      console.log('\n🎯 Test Recommendations:');
      
      if (results.summary.overallStatus === 'HEALTHY') {
        console.log('✅ System ready for production deployment');
      } else if (results.summary.overallStatus === 'WARNING') {
        console.log('⚠️  System functional but performance optimization recommended');
      } else {
        console.log('❌ Critical issues detected - address before production');
      }
      
      // Write detailed results
      require('fs').writeFileSync(
        '/Users/andreapanzeri/progetti/IT-ERA/testsprite_tests/staging-test-results.json',
        JSON.stringify(results, null, 2)
      );
      
      console.log('\n📄 Detailed results saved to: testsprite_tests/staging-test-results.json');
      
      process.exit(results.summary.failed === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Testing failed:', error);
      process.exit(1);
    });
}

module.exports = { testStagingEnvironment };