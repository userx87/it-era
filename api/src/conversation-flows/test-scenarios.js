/**
 * Test Scenarios for IT-ERA AI Conversation Designer
 * Comprehensive test suite for validating conversation flows and lead generation
 * 
 * FEATURES:
 * ✅ Realistic B2B conversation scenarios
 * ✅ Edge cases and error handling tests
 * ✅ Geographic personalization validation
 * ✅ Lead qualification accuracy tests
 * ✅ Intent recognition performance tests
 * ✅ Escalation trigger validation
 * ✅ Teams integration testing
 */

import { AIConversationDesigner } from './ai-conversation-designer-enhanced.js';
import { TeamsIntegrationEnhanced } from './teams-integration-enhanced.js';
import { ConversationAnalytics } from './conversation-analytics.js';

export class ConversationTestSuite {
  constructor(config = {}) {
    this.config = {
      enableLogging: config.enableLogging || true,
      enableAnalytics: config.enableAnalytics || true,
      mockTeamsWebhook: config.mockTeamsWebhook || true,
      ...config
    };

    // Initialize test components
    this.conversationDesigner = new AIConversationDesigner({
      teamsWebhookUrl: 'https://mock-webhook.test',
      debug: this.config.enableLogging
    });

    this.teamsIntegration = new TeamsIntegrationEnhanced({
      generalWebhook: 'https://mock-teams-general.test',
      emergencyWebhook: 'https://mock-teams-emergency.test',
      enableActionButtons: true
    });

    this.analytics = new ConversationAnalytics({
      enableRealtimeMetrics: true,
      storageType: 'memory'
    });

    // Test results tracking
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      scenarios: [],
      performance: {
        averageResponseTime: 0,
        intentAccuracy: 0,
        leadQualificationAccuracy: 0
      }
    };

    // Initialize test scenarios
    this.initializeTestScenarios();
  }

  /**
   * =====================================================
   * TEST SCENARIOS DEFINITION
   * =====================================================
   */

  initializeTestScenarios() {
    this.scenarios = {
      // Basic conversation flows
      basic_flows: [
        {
          name: 'Standard B2B Greeting Flow',
          category: 'basic',
          priority: 'high',
          conversation: [
            { user: 'Ciao, abbiamo bisogno di assistenza IT' },
            { user: 'È per un\'azienda' },
            { user: 'Ci serve un contratto di assistenza' },
            { user: 'Siamo a Vimercate' }
          ],
          expectedOutcome: 'lead_qualification',
          expectedIntents: ['greeting', 'business_qualification', 'it_support', 'geographic'],
          expectedPriority: 'high'
        },

        {
          name: 'Emergency IT Request',
          category: 'emergency',
          priority: 'critical',
          conversation: [
            { user: 'EMERGENZA - il nostro server è down!' },
            { user: 'Siamo bloccati, non possiamo lavorare' },
            { user: 'Azienda Metallo Spa a Monza' }
          ],
          expectedOutcome: 'emergency_escalation',
          expectedIntents: ['emergency', 'server_down', 'geographic'],
          expectedPriority: 'emergency'
        },

        {
          name: 'Firewall Security Inquiry',
          category: 'security',
          priority: 'high',
          conversation: [
            { user: 'Ciao, vorrei informazioni sui firewall' },
            { user: 'È per un\'azienda di 25 dipendenti' },
            { user: 'Siamo ad Agrate Brianza' },
            { user: 'Ci hanno detto che siete partner WatchGuard' }
          ],
          expectedOutcome: 'security_consultation',
          expectedIntents: ['security_focus', 'business_qualification', 'geographic', 'watchguard'],
          expectedPriority: 'high'
        }
      ],

      // Geographic personalization tests
      geographic_tests: [
        {
          name: 'Vimercate Zone Premium Treatment',
          category: 'geographic',
          conversation: [
            { user: 'Ciao, siamo un\'azienda di Vimercate' },
            { user: 'Abbiamo 15 PC che hanno problemi' }
          ],
          expectedGeographic: 'vimercate_zone',
          expectedPriority: 'high',
          expectedPersonalization: 'premium_zone_messaging'
        },

        {
          name: 'Milano Extended Zone',
          category: 'geographic',
          conversation: [
            { user: 'Salve, siamo a Milano zona Est' },
            { user: 'Cerchiamo assistenza IT per 30 dipendenti' }
          ],
          expectedGeographic: 'milano_zone',
          expectedPriority: 'medium',
          expectedPersonalization: 'extended_zone_messaging'
        },

        {
          name: 'Out of Zone Inquiry',
          category: 'geographic',
          conversation: [
            { user: 'Ciao, siamo a Roma' },
            { user: 'Potete seguirci da remoto?' }
          ],
          expectedGeographic: 'other_zones',
          expectedPriority: 'low',
          expectedPersonalization: 'remote_service_messaging'
        }
      ],

      // Lead qualification accuracy tests
      lead_qualification_tests: [
        {
          name: 'High-Value Enterprise Lead',
          category: 'qualification',
          leadData: {
            company_name: 'TechCorp Solutions',
            location: 'Vimercate',
            company_size: '50+ PC',
            service_interest: 'Sicurezza informatica completa',
            timeline: 'Entro 1 mese',
            budget_range: 'Oltre 30.000€'
          },
          expectedScore: 90,
          expectedQualification: 'high_priority',
          expectedEscalation: true
        },

        {
          name: 'Medium SMB Lead',
          category: 'qualification',
          leadData: {
            company_name: 'Studio Commercialista Rossi',
            location: 'Monza',
            company_size: '6-15 PC',
            service_interest: 'Contratto assistenza',
            timeline: 'Entro 3 mesi'
          },
          expectedScore: 65,
          expectedQualification: 'medium_priority',
          expectedEscalation: false
        },

        {
          name: 'Low-Value Micro Business',
          category: 'qualification',
          leadData: {
            company_name: 'Freelance Design',
            location: 'Milano',
            company_size: '1-5 PC',
            service_interest: 'Riparazione occasionale',
            timeline: 'Non urgente'
          },
          expectedScore: 35,
          expectedQualification: 'low_priority',
          expectedEscalation: false
        }
      ],

      // Intent recognition accuracy tests
      intent_recognition_tests: [
        {
          name: 'Security Intent Recognition',
          category: 'intent',
          testCases: [
            { 
              input: 'Abbiamo problemi di sicurezza informatica',
              expectedIntent: 'security_focus',
              expectedConfidence: 0.8
            },
            {
              input: 'Ci serve un firewall professionale',
              expectedIntent: 'security_focus',
              expectedConfidence: 0.9
            },
            {
              input: 'Siamo stati attaccati da un ransomware',
              expectedIntent: 'emergency',
              expectedConfidence: 0.95
            }
          ]
        },

        {
          name: 'Support Intent Recognition',
          category: 'intent',
          testCases: [
            {
              input: 'Vorremmo un contratto di assistenza',
              expectedIntent: 'it_support',
              expectedConfidence: 0.8
            },
            {
              input: 'Abbiamo bisogno di supporto tecnico continuativo',
              expectedIntent: 'it_support', 
              expectedConfidence: 0.85
            },
            {
              input: 'I nostri computer vanno sempre in crash',
              expectedIntent: 'it_support',
              expectedConfidence: 0.7
            }
          ]
        },

        {
          name: 'Emergency Intent Recognition',
          category: 'intent',
          testCases: [
            {
              input: 'EMERGENZA: server completamente down!',
              expectedIntent: 'emergency',
              expectedConfidence: 0.95
            },
            {
              input: 'Siamo stati hackerati, serve aiuto immediato',
              expectedIntent: 'emergency',
              expectedConfidence: 0.9
            },
            {
              input: 'Sistema bloccato, non possiamo lavorare',
              expectedIntent: 'emergency',
              expectedConfidence: 0.85
            }
          ]
        }
      ],

      // Edge cases and error handling
      edge_cases: [
        {
          name: 'Private User Handling',
          category: 'edge_case',
          conversation: [
            { user: 'Ciao, ho il computer rotto' },
            { user: 'È per uso personale, sono un privato' }
          ],
          expectedOutcome: 'redirect_to_bulltech',
          expectedMessage: 'IT-ERA è specializzata in servizi B2B'
        },

        {
          name: 'Incomplete Data Handling',
          category: 'edge_case',
          conversation: [
            { user: 'Vorrei un preventivo' },
            { user: 'Boh non so' },
            { user: 'Forse' }
          ],
          expectedOutcome: 'data_collection_retry',
          expectedFallback: true
        },

        {
          name: 'Multiple Intent Confusion',
          category: 'edge_case',
          conversation: [
            { user: 'Abbiamo bisogno di firewall backup server assistenza cloud tutto insieme' }
          ],
          expectedOutcome: 'intent_clarification',
          expectedResponse: 'structured_options'
        }
      ],

      // Teams integration tests
      teams_integration_tests: [
        {
          name: 'Emergency Teams Notification',
          category: 'teams_integration',
          leadData: {
            company_name: 'Emergency Corp',
            phone: '+39 334 123 4567',
            location: 'Vimercate',
            emergency_type: 'Server down'
          },
          escalationType: 'emergency',
          expectedWebhook: 'emergency',
          expectedColor: 'FF0000',
          expectedPriority: 'CRITICAL'
        },

        {
          name: 'High Priority Lead Notification',
          category: 'teams_integration',
          leadData: {
            company_name: 'BigTech Srl',
            contact_name: 'Marco Bianchi',
            phone: '+39 339 987 6543',
            email: 'marco@bigtech.it',
            location: 'Agrate Brianza',
            company_size: '31-50 PC',
            service_interest: 'Firewall WatchGuard'
          },
          expectedWebhook: 'technical_team',
          expectedColor: 'FFA500',
          expectedPriority: 'HIGH'
        }
      ],

      // Performance benchmarks
      performance_tests: [
        {
          name: 'Response Time Benchmark',
          category: 'performance',
          iterations: 100,
          maxResponseTime: 200, // milliseconds
          testType: 'response_speed'
        },

        {
          name: 'Concurrent Conversations',
          category: 'performance', 
          concurrentSessions: 10,
          messagesPerSession: 5,
          testType: 'load_testing'
        },

        {
          name: 'Memory Usage Tracking',
          category: 'performance',
          duration: 60000, // 1 minute
          testType: 'memory_usage'
        }
      ]
    };
  }

  /**
   * =====================================================
   * TEST EXECUTION ENGINE
   * =====================================================
   */

  /**
   * Run all test scenarios
   */
  async runAllTests() {
    console.log('🚀 Starting IT-ERA Conversation Designer Test Suite...');
    this.testResults.startTime = Date.now();

    try {
      // Run basic conversation flow tests
      await this.runBasicFlowTests();
      
      // Run geographic personalization tests
      await this.runGeographicTests();
      
      // Run lead qualification tests
      await this.runLeadQualificationTests();
      
      // Run intent recognition tests
      await this.runIntentRecognitionTests();
      
      // Run edge case tests
      await this.runEdgeCaseTests();
      
      // Run Teams integration tests
      await this.runTeamsIntegrationTests();
      
      // Run performance tests
      await this.runPerformanceTests();

      // Generate final report
      return this.generateTestReport();

    } catch (error) {
      console.error('❌ Test suite execution failed:', error);
      return this.generateErrorReport(error);
    }
  }

  /**
   * Run basic conversation flow tests
   */
  async runBasicFlowTests() {
    console.log('📝 Running basic conversation flow tests...');
    
    for (const scenario of this.scenarios.basic_flows) {
      await this.runConversationScenario(scenario);
    }
  }

  /**
   * Run single conversation scenario
   */
  async runConversationScenario(scenario) {
    const testStart = Date.now();
    let context = {};
    let conversationHistory = [];
    
    try {
      console.log(`  Testing: ${scenario.name}`);
      
      for (let i = 0; i < scenario.conversation.length; i++) {
        const message = scenario.conversation[i];
        const startTime = Date.now();
        
        const response = await this.conversationDesigner.processMessage(
          message.user, 
          context
        );
        
        const responseTime = Date.now() - startTime;
        
        // Update context for next message
        context = response.conversationContext;
        
        conversationHistory.push({
          input: message.user,
          response: response.message,
          intent: response.intent,
          confidence: response.confidence,
          responseTime
        });

        // Simulate thinking time between messages
        await this.sleep(100);
      }

      // Validate scenario expectations
      const validationResult = this.validateScenarioExpectations(
        scenario, 
        conversationHistory, 
        context
      );

      const testResult = {
        scenario: scenario.name,
        category: scenario.category,
        duration: Date.now() - testStart,
        passed: validationResult.passed,
        details: validationResult.details,
        conversationHistory,
        context
      };

      this.recordTestResult(testResult);
      
      if (validationResult.passed) {
        console.log(`    ✅ ${scenario.name} - PASSED`);
      } else {
        console.log(`    ❌ ${scenario.name} - FAILED`);
        console.log(`       Reason: ${validationResult.reason}`);
      }

    } catch (error) {
      console.log(`    ❌ ${scenario.name} - ERROR: ${error.message}`);
      this.recordTestResult({
        scenario: scenario.name,
        category: scenario.category,
        duration: Date.now() - testStart,
        passed: false,
        error: error.message
      });
    }
  }

  /**
   * Run geographic personalization tests
   */
  async runGeographicTests() {
    console.log('🌍 Running geographic personalization tests...');
    
    for (const scenario of this.scenarios.geographic_tests) {
      await this.runGeographicScenario(scenario);
    }
  }

  async runGeographicScenario(scenario) {
    const testStart = Date.now();
    
    try {
      console.log(`  Testing: ${scenario.name}`);
      
      let context = {};
      for (const message of scenario.conversation) {
        const response = await this.conversationDesigner.processMessage(
          message.user,
          context
        );
        context = response.conversationContext;
      }

      // Validate geographic personalization
      const geographic = this.conversationDesigner.detectGeographic('', context);
      const personalizations = this.conversationDesigner.geographicPersonalization;
      
      const passed = geographic.zone === scenario.expectedGeographic;
      
      this.recordTestResult({
        scenario: scenario.name,
        category: 'geographic',
        duration: Date.now() - testStart,
        passed,
        details: {
          expectedZone: scenario.expectedGeographic,
          actualZone: geographic.zone,
          personalizationApplied: !!personalizations[geographic.zone]
        }
      });
      
      console.log(`    ${passed ? '✅' : '❌'} ${scenario.name}`);
      
    } catch (error) {
      console.log(`    ❌ ${scenario.name} - ERROR: ${error.message}`);
      this.recordTestResult({
        scenario: scenario.name,
        category: 'geographic',
        passed: false,
        error: error.message
      });
    }
  }

  /**
   * Run lead qualification tests
   */
  async runLeadQualificationTests() {
    console.log('🎯 Running lead qualification tests...');
    
    for (const scenario of this.scenarios.lead_qualification_tests) {
      await this.runLeadQualificationScenario(scenario);
    }
  }

  async runLeadQualificationScenario(scenario) {
    const testStart = Date.now();
    
    try {
      console.log(`  Testing: ${scenario.name}`);
      
      // Calculate actual lead score
      const actualScore = this.conversationDesigner.calculateLeadScore({
        leadData: scenario.leadData
      });
      
      // Check score accuracy (within 10 points tolerance)
      const scoreAccuracy = Math.abs(actualScore - scenario.expectedScore) <= 10;
      
      // Validate escalation logic
      const escalation = this.conversationDesigner.evaluateEscalation(
        { leadData: scenario.leadData },
        [],
        actualScore
      );
      
      const escalationCorrect = escalation.required === scenario.expectedEscalation;
      
      const passed = scoreAccuracy && escalationCorrect;
      
      this.recordTestResult({
        scenario: scenario.name,
        category: 'qualification',
        duration: Date.now() - testStart,
        passed,
        details: {
          expectedScore: scenario.expectedScore,
          actualScore,
          scoreAccuracy,
          expectedEscalation: scenario.expectedEscalation,
          actualEscalation: escalation.required,
          escalationCorrect
        }
      });
      
      console.log(`    ${passed ? '✅' : '❌'} ${scenario.name} (Score: ${actualScore}/${scenario.expectedScore})`);
      
    } catch (error) {
      console.log(`    ❌ ${scenario.name} - ERROR: ${error.message}`);
      this.recordTestResult({
        scenario: scenario.name,
        category: 'qualification',
        passed: false,
        error: error.message
      });
    }
  }

  /**
   * Run intent recognition tests
   */
  async runIntentRecognitionTests() {
    console.log('🧠 Running intent recognition tests...');
    
    for (const scenario of this.scenarios.intent_recognition_tests) {
      await this.runIntentRecognitionScenario(scenario);
    }
  }

  async runIntentRecognitionScenario(scenario) {
    console.log(`  Testing: ${scenario.name}`);
    
    let totalAccuracy = 0;
    let correctPredictions = 0;
    
    for (const testCase of scenario.testCases) {
      try {
        const intents = this.conversationDesigner.recognizeIntents(testCase.input);
        const topIntent = intents[0];
        
        const intentCorrect = topIntent?.intent === testCase.expectedIntent;
        const confidenceAccurate = topIntent?.confidence >= testCase.expectedConfidence - 0.1;
        
        if (intentCorrect) correctPredictions++;
        if (intentCorrect && confidenceAccurate) totalAccuracy += 1;
        
        console.log(`    ${intentCorrect ? '✅' : '❌'} "${testCase.input}" -> ${topIntent?.intent} (${topIntent?.confidence?.toFixed(2)})`);
        
      } catch (error) {
        console.log(`    ❌ "${testCase.input}" - ERROR: ${error.message}`);
      }
    }
    
    const accuracy = totalAccuracy / scenario.testCases.length;
    const passed = accuracy >= 0.8; // 80% accuracy threshold
    
    this.recordTestResult({
      scenario: scenario.name,
      category: 'intent_recognition',
      passed,
      details: {
        accuracy,
        correctPredictions,
        totalTests: scenario.testCases.length
      }
    });
    
    console.log(`    Overall accuracy: ${(accuracy * 100).toFixed(1)}%`);
  }

  /**
   * Run Teams integration tests
   */
  async runTeamsIntegrationTests() {
    console.log('📢 Running Teams integration tests...');
    
    for (const scenario of this.scenarios.teams_integration_tests) {
      await this.runTeamsIntegrationScenario(scenario);
    }
  }

  async runTeamsIntegrationScenario(scenario) {
    const testStart = Date.now();
    
    try {
      console.log(`  Testing: ${scenario.name}`);
      
      // Mock conversation context
      const conversationContext = {
        sessionId: 'test-session-' + Date.now(),
        messageCount: 5,
        leadData: scenario.leadData
      };
      
      const escalationData = {
        type: scenario.escalationType || 'standard',
        priority: scenario.expectedPriority?.toLowerCase() || 'medium'
      };
      
      // Test Teams message creation
      const teamsMessage = await this.teamsIntegration.createLeadMessage(
        scenario.leadData,
        conversationContext,
        escalationData,
        escalationData.priority
      );
      
      // Validate message structure
      const validationResult = this.validateTeamsMessage(teamsMessage, scenario);
      
      this.recordTestResult({
        scenario: scenario.name,
        category: 'teams_integration',
        duration: Date.now() - testStart,
        passed: validationResult.passed,
        details: validationResult.details
      });
      
      console.log(`    ${validationResult.passed ? '✅' : '❌'} ${scenario.name}`);
      
    } catch (error) {
      console.log(`    ❌ ${scenario.name} - ERROR: ${error.message}`);
      this.recordTestResult({
        scenario: scenario.name,
        category: 'teams_integration',
        passed: false,
        error: error.message
      });
    }
  }

  /**
   * Run performance tests
   */
  async runPerformanceTests() {
    console.log('⚡ Running performance tests...');
    
    for (const scenario of this.scenarios.performance_tests) {
      await this.runPerformanceScenario(scenario);
    }
  }

  async runPerformanceScenario(scenario) {
    console.log(`  Testing: ${scenario.name}`);
    
    switch (scenario.testType) {
      case 'response_speed':
        await this.testResponseSpeed(scenario);
        break;
      case 'load_testing':
        await this.testConcurrentLoad(scenario);
        break;
      case 'memory_usage':
        await this.testMemoryUsage(scenario);
        break;
    }
  }

  /**
   * =====================================================
   * VALIDATION METHODS
   * =====================================================
   */

  validateScenarioExpectations(scenario, conversationHistory, context) {
    let passed = true;
    let details = {};
    let reason = '';

    // Validate expected intents
    if (scenario.expectedIntents) {
      const detectedIntents = conversationHistory
        .map(h => h.intent)
        .filter(intent => intent);
      
      const intentMatches = scenario.expectedIntents.filter(expected => 
        detectedIntents.includes(expected)
      ).length;
      
      details.intentAccuracy = intentMatches / scenario.expectedIntents.length;
      
      if (details.intentAccuracy < 0.7) {
        passed = false;
        reason = `Low intent accuracy: ${details.intentAccuracy}`;
      }
    }

    // Validate expected outcome
    if (scenario.expectedOutcome) {
      const finalStep = context.currentFlow;
      details.outcomeMatch = finalStep === scenario.expectedOutcome;
      
      if (!details.outcomeMatch) {
        passed = false;
        reason = `Outcome mismatch: expected ${scenario.expectedOutcome}, got ${finalStep}`;
      }
    }

    // Validate expected priority
    if (scenario.expectedPriority) {
      const leadScore = context.qualificationScore || 0;
      const actualPriority = this.scoreToPriority(leadScore);
      details.priorityMatch = actualPriority === scenario.expectedPriority;
      
      if (!details.priorityMatch) {
        passed = false;
        reason = `Priority mismatch: expected ${scenario.expectedPriority}, got ${actualPriority}`;
      }
    }

    return { passed, details, reason };
  }

  validateTeamsMessage(message, scenario) {
    let passed = true;
    let details = {};

    // Validate message structure
    if (!message['@type'] || message['@type'] !== 'MessageCard') {
      passed = false;
      details.structureError = 'Invalid MessageCard structure';
    }

    // Validate theme color
    if (scenario.expectedColor && message.themeColor !== scenario.expectedColor) {
      passed = false;
      details.colorError = `Expected ${scenario.expectedColor}, got ${message.themeColor}`;
    }

    // Validate presence of required sections
    if (!message.sections || message.sections.length === 0) {
      passed = false;
      details.sectionsError = 'Missing required sections';
    }

    return { passed, details };
  }

  /**
   * =====================================================
   * PERFORMANCE TEST METHODS
   * =====================================================
   */

  async testResponseSpeed(scenario) {
    const responseTimes = [];
    
    for (let i = 0; i < scenario.iterations; i++) {
      const startTime = Date.now();
      
      await this.conversationDesigner.processMessage(
        'Ciao, abbiamo bisogno di assistenza IT',
        {}
      );
      
      const responseTime = Date.now() - startTime;
      responseTimes.push(responseTime);
    }
    
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const passed = avgResponseTime <= scenario.maxResponseTime;
    
    this.recordTestResult({
      scenario: scenario.name,
      category: 'performance',
      passed,
      details: {
        averageResponseTime: avgResponseTime,
        maxResponseTime: scenario.maxResponseTime,
        iterations: scenario.iterations
      }
    });
    
    console.log(`    Average response time: ${avgResponseTime.toFixed(2)}ms ${passed ? '✅' : '❌'}`);
  }

  async testConcurrentLoad(scenario) {
    const promises = [];
    
    for (let i = 0; i < scenario.concurrentSessions; i++) {
      const sessionPromise = this.runSessionLoad(scenario.messagesPerSession);
      promises.push(sessionPromise);
    }
    
    const results = await Promise.all(promises);
    const successfulSessions = results.filter(r => r.success).length;
    const passed = successfulSessions === scenario.concurrentSessions;
    
    this.recordTestResult({
      scenario: scenario.name,
      category: 'performance',
      passed,
      details: {
        concurrentSessions: scenario.concurrentSessions,
        successfulSessions,
        failureRate: (scenario.concurrentSessions - successfulSessions) / scenario.concurrentSessions
      }
    });
    
    console.log(`    Concurrent sessions: ${successfulSessions}/${scenario.concurrentSessions} ${passed ? '✅' : '❌'}`);
  }

  async runSessionLoad(messageCount) {
    try {
      let context = {};
      const messages = [
        'Ciao',
        'È per un\'azienda', 
        'Abbiamo bisogno di assistenza IT',
        'Siamo a Vimercate',
        'Vorrei un preventivo'
      ];
      
      for (let i = 0; i < Math.min(messageCount, messages.length); i++) {
        const response = await this.conversationDesigner.processMessage(
          messages[i],
          context
        );
        context = response.conversationContext;
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * =====================================================
   * UTILITY METHODS
   * =====================================================
   */

  recordTestResult(result) {
    this.testResults.total++;
    if (result.passed) {
      this.testResults.passed++;
    } else {
      this.testResults.failed++;
    }
    
    this.testResults.scenarios.push(result);
  }

  scoreToPriority(score) {
    if (score >= 85) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * =====================================================
   * REPORTING
   * =====================================================
   */

  generateTestReport() {
    const duration = Date.now() - this.testResults.startTime;
    const successRate = this.testResults.total > 0 ? 
      (this.testResults.passed / this.testResults.total * 100) : 0;

    // Calculate performance metrics
    const performanceResults = this.testResults.scenarios.filter(s => s.category === 'performance');
    const avgResponseTime = performanceResults.reduce((sum, r) => 
      sum + (r.details?.averageResponseTime || 0), 0) / Math.max(performanceResults.length, 1);

    // Calculate intent accuracy
    const intentResults = this.testResults.scenarios.filter(s => s.category === 'intent_recognition');
    const avgIntentAccuracy = intentResults.reduce((sum, r) => 
      sum + (r.details?.accuracy || 0), 0) / Math.max(intentResults.length, 1);

    // Calculate lead qualification accuracy
    const qualificationResults = this.testResults.scenarios.filter(s => s.category === 'qualification');
    const avgQualificationAccuracy = qualificationResults.filter(r => r.passed).length / 
      Math.max(qualificationResults.length, 1);

    const report = {
      summary: {
        totalTests: this.testResults.total,
        passed: this.testResults.passed,
        failed: this.testResults.failed,
        successRate: successRate.toFixed(1) + '%',
        duration: duration + 'ms'
      },
      
      performance: {
        averageResponseTime: avgResponseTime.toFixed(2) + 'ms',
        intentAccuracy: (avgIntentAccuracy * 100).toFixed(1) + '%',
        leadQualificationAccuracy: (avgQualificationAccuracy * 100).toFixed(1) + '%'
      },
      
      categoryResults: this.calculateCategoryResults(),
      
      failedTests: this.testResults.scenarios.filter(s => !s.passed),
      
      recommendations: this.generateTestRecommendations()
    };

    console.log('\n📊 IT-ERA Conversation Designer Test Results:');
    console.log(`   Total Tests: ${report.summary.totalTests}`);
    console.log(`   Passed: ${report.summary.passed} (${report.summary.successRate})`);
    console.log(`   Failed: ${report.summary.failed}`);
    console.log(`   Duration: ${report.summary.duration}`);
    console.log(`   Avg Response Time: ${report.performance.averageResponseTime}`);
    console.log(`   Intent Accuracy: ${report.performance.intentAccuracy}`);
    console.log(`   Lead Qualification: ${report.performance.leadQualificationAccuracy}`);

    if (report.failedTests.length > 0) {
      console.log('\n❌ Failed Tests:');
      report.failedTests.forEach(test => {
        console.log(`   - ${test.scenario}: ${test.error || 'Validation failed'}`);
      });
    }

    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach(rec => {
        console.log(`   - ${rec}`);
      });
    }

    return report;
  }

  calculateCategoryResults() {
    const categories = {};
    
    this.testResults.scenarios.forEach(scenario => {
      if (!categories[scenario.category]) {
        categories[scenario.category] = { total: 0, passed: 0 };
      }
      categories[scenario.category].total++;
      if (scenario.passed) categories[scenario.category].passed++;
    });

    Object.keys(categories).forEach(category => {
      const data = categories[category];
      data.successRate = ((data.passed / data.total) * 100).toFixed(1) + '%';
    });

    return categories;
  }

  generateTestRecommendations() {
    const recommendations = [];
    const results = this.testResults;
    
    if (results.failed > results.total * 0.1) {
      recommendations.push('Consider reviewing conversation flows - high failure rate detected');
    }
    
    const intentTests = results.scenarios.filter(s => s.category === 'intent_recognition');
    const lowIntentAccuracy = intentTests.filter(s => s.details?.accuracy < 0.8);
    
    if (lowIntentAccuracy.length > 0) {
      recommendations.push('Improve intent recognition patterns - some intents showing low accuracy');
    }

    const performanceTests = results.scenarios.filter(s => s.category === 'performance');
    const slowResponses = performanceTests.filter(s => s.details?.averageResponseTime > 150);
    
    if (slowResponses.length > 0) {
      recommendations.push('Optimize response time - some operations exceed 150ms threshold');
    }

    return recommendations;
  }

  generateErrorReport(error) {
    return {
      success: false,
      error: error.message,
      stack: error.stack,
      testResults: this.testResults,
      timestamp: Date.now()
    };
  }
}

// Example usage and test runner
export async function runITERAConversationTests(config = {}) {
  const testSuite = new ConversationTestSuite(config);
  return await testSuite.runAllTests();
}

export default ConversationTestSuite;