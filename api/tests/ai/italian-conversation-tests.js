/**
 * IT-ERA AI Chatbot Italian Conversation Flow Tests
 * Specialized tests for natural Italian conversation, intent recognition, and cultural context
 * Author: Testing Specialist
 * Date: 2025-08-24
 */

// Italian Conversation Test Scenarios
const ITALIAN_TEST_SCENARIOS = {
  natural_greetings: [
    {
      input: "Buongiorno, come va?",
      expectedIntents: ['saluto', 'greeting'],
      mustContain: ['IT-ERA', 'assistere', 'aiutare'],
      culturalContext: 'formal morning greeting'
    },
    {
      input: "Ciao, tutto bene?",
      expectedIntents: ['saluto', 'greeting'], 
      mustContain: ['ciao', 'bene'],
      culturalContext: 'informal greeting'
    },
    {
      input: "Salve, sono interessato ai vostri servizi",
      expectedIntents: ['saluto', 'servizi', 'interesse'],
      mustContain: ['servizi', 'informazioni'],
      culturalContext: 'polite business inquiry'
    }
  ],

  business_inquiries: [
    {
      input: "Ho una piccola azienda e ho bisogno di assistenza informatica",
      expectedIntents: ['assistenza', 'azienda', 'piccola_impresa'],
      mustContain: ['piccola azienda', 'assistenza', 'informatica'],
      leadQualification: 'medium',
      followUpQuestions: ['dipendenti', 'sede', 'servizi specifici']
    },
    {
      input: "Siamo una media impresa con 30 dipendenti, cerchiamo un partner IT affidabile",
      expectedIntents: ['partner_it', 'media_impresa'],
      mustContain: ['30 dipendenti', 'partner', 'affidabile'],
      leadQualification: 'high',
      followUpQuestions: ['sede', 'servizi attuali', 'budget']
    },
    {
      input: "La mia ditta ha problemi con i computer, potete aiutarci?",
      expectedIntents: ['problemi_tecnici', 'assistenza'],
      mustContain: ['problemi', 'computer', 'aiutare'],
      urgencyLevel: 'medium'
    }
  ],

  technical_requests: [
    {
      input: "Il server si blocca spesso, cosa possiamo fare?",
      expectedIntents: ['problema_server', 'assistenza_tecnica'],
      mustContain: ['server', 'problemi', 'assistenza'],
      technicalLevel: 'intermediate',
      urgencyLevel: 'high'
    },
    {
      input: "Abbiamo bisogno di un firewall per la nostra rete aziendale",
      expectedIntents: ['firewall', 'sicurezza', 'rete_aziendale'],
      mustContain: ['firewall', 'rete', 'sicurezza', 'WatchGuard'],
      expertiseHighlight: 'watchguard_partnership'
    },
    {
      input: "Vogliamo fare il backup dei nostri dati, che soluzioni avete?",
      expectedIntents: ['backup', 'protezione_dati'],
      mustContain: ['backup', 'dati', 'soluzioni'],
      serviceCategory: 'data_protection'
    }
  ],

  pricing_questions: [
    {
      input: "Quanto costa l'assistenza tecnica?",
      expectedIntents: ['prezzi', 'assistenza'],
      mustContain: ['€', 'ora', 'assistenza'],
      pricingInfo: 'should_provide_range'
    },
    {
      input: "Che prezzi fate per un contratto annuale?",
      expectedIntents: ['contratto', 'prezzi', 'annuale'],
      mustContain: ['contratto', 'annuale', 'sconto'],
      pricingInfo: 'contract_discount'
    },
    {
      input: "È caro un firewall per 20 persone?",
      expectedIntents: ['firewall', 'prezzo', 'dimensioni_azienda'],
      mustContain: ['20 persone', 'firewall', 'preventivo'],
      contextualPricing: true
    }
  ],

  geographical_context: [
    {
      input: "Siamo a Vimercate, venite anche qui?",
      expectedIntents: ['localizzazione', 'zona_servizio'],
      mustContain: ['Vimercate', 'stessa zona', '10 minuti'],
      geographicPriority: 'maximum',
      locationAdvantage: true
    },
    {
      input: "La nostra sede è a Monza, fate interventi?",
      expectedIntents: ['localizzazione', 'interventi'],
      mustContain: ['Monza', 'interventi', 'trasferta'],
      geographicPriority: 'high',
      travelCost: 'minimal'
    },
    {
      input: "Siamo a Milano, coprite anche quella zona?",
      expectedIntents: ['localizzazione', 'copertura'],
      mustContain: ['Milano', 'zona', 'assistenza'],
      geographicPriority: 'medium',
      remotePreference: true
    }
  ],

  urgency_expressions: [
    {
      input: "È urgente, il sistema non funziona più!",
      expectedIntents: ['emergenza', 'sistema_down'],
      mustContain: ['urgente', 'emergenza', 'immediata'],
      urgencyLevel: 'critical',
      escalationRequired: true
    },
    {
      input: "Abbiamo un problema grave, potete intervenire subito?",
      expectedIntents: ['problema_grave', 'intervento_immediato'], 
      mustContain: ['problema grave', 'subito', 'intervento'],
      urgencyLevel: 'high',
      responseTimeTarget: 2000
    },
    {
      input: "Non è urgentissimo ma quando potete passare?",
      expectedIntents: ['appuntamento', 'sopralluogo'],
      mustContain: ['appuntamento', 'sopralluogo', 'quando'],
      urgencyLevel: 'low',
      schedulingRequired: true
    }
  ],

  colloquial_expressions: [
    {
      input: "Ma voi siete bravi con i computer?",
      expectedIntents: ['competenza', 'fiducia'],
      mustContain: ['esperienza', 'competenti', '10 anni'],
      tonalityResponse: 'reassuring_professional'
    },
    {
      input: "Non ci capisco niente di informatica, mi potete spiegare?",
      expectedIntents: ['spiegazione_semplice', 'assistenza'],
      mustContain: ['spiego', 'semplice', 'aiuto'],
      communicationStyle: 'simple_clear'
    },
    {
      input: "Boh, non so che problemi abbiamo, viene a vedere?",
      expectedIntents: ['sopralluogo', 'diagnosi'],
      mustContain: ['sopralluogo', 'gratuito', 'diagnosi'],
      serviceOffer: 'free_consultation'
    }
  ],

  regional_variations: [
    {
      input: "Ciao ragazzi, avete un attimo per parlare?",
      expectedIntents: ['saluto_informale', 'disponibilità'],
      mustContain: ['disponibili', 'parlare'],
      tonality: 'friendly_professional',
      region: 'lombardia_informal'
    },
    {
      input: "Buondì, sentite, ho bisogno di una mano",
      expectedIntents: ['saluto_locale', 'richiesta_aiuto'],
      mustContain: ['aiutare', 'assistere'],
      tonality: 'warm_local',
      region: 'brianza_dialect'
    }
  ]
};

// Cultural and Linguistic Test Patterns
const CULTURAL_PATTERNS = {
  politeness_levels: {
    formal: ["Gentilmente", "Cortesemente", "Se possibile", "La ringrazio"],
    informal: ["Per favore", "Grazie", "Ciao", "Come va"],
    business: ["Cordiali saluti", "Distinti saluti", "In attesa", "La contatto"]
  },
  
  business_terminology: {
    company_sizes: ["piccola impresa", "media azienda", "grande gruppo", "ditta individuale"],
    urgency_markers: ["urgente", "subito", "il prima possibile", "quando potete"],
    technical_terms: ["server", "rete", "firewall", "backup", "sicurezza informatica"],
    local_references: ["zona Brianza", "Milano Est", "provincia di Monza", "Vimercate"]
  },

  conversation_flow_markers: {
    topic_changes: ["comunque", "tra l'altro", "a proposito", "cambiando discorso"],
    clarifications: ["cioè", "ovvero", "diciamo", "praticamente"],
    confirmations: ["esatto", "perfetto", "giusto", "bene così"],
    hesitations: ["ehm", "allora", "diciamo che", "insomma"]
  }
};

class ItalianConversationTester {
  constructor() {
    this.results = [];
    this.linguisticAnalysis = {
      appropriateFormality: 0,
      culturalSensitivity: 0,
      technicalAccuracy: 0,
      localContext: 0
    };
    this.testSession = null;
  }

  async runItalianConversationTests() {
    console.log('🇮🇹 IT-ERA AI ITALIAN CONVERSATION FLOW TESTS');
    console.log('=' .repeat(80));

    try {
      await this.testNaturalGreetings();
      await this.testBusinessInquiries();
      await this.testTechnicalRequests();
      await this.testPricingQuestions();
      await this.testGeographicalContext();
      await this.testUrgencyExpressions();
      await this.testColloquialExpressions();
      await this.testRegionalVariations();
      await this.testConversationFlow();
      await this.testCulturalSensitivity();

      this.generateLinguisticReport();

    } catch (error) {
      console.error('❌ Italian conversation tests failed:', error);
      throw error;
    }
  }

  async testNaturalGreetings() {
    console.log('\n👋 NATURAL ITALIAN GREETINGS');
    console.log('-' .repeat(40));

    for (const scenario of ITALIAN_TEST_SCENARIOS.natural_greetings) {
      await this.runConversationTest('Natural Greeting', scenario);
      await this.delay(500);
    }

    console.log('✅ Natural greetings tests completed\n');
  }

  async testBusinessInquiries() {
    console.log('\n🏢 BUSINESS INQUIRIES IN ITALIAN');
    console.log('-' .repeat(40));

    for (const scenario of ITALIAN_TEST_SCENARIOS.business_inquiries) {
      const result = await this.runConversationTest('Business Inquiry', scenario);
      
      // Check lead qualification accuracy
      if (scenario.leadQualification && result.success) {
        await this.validateLeadQualification(result, scenario.leadQualification);
      }
      
      await this.delay(500);
    }

    console.log('✅ Business inquiries tests completed\n');
  }

  async testTechnicalRequests() {
    console.log('\n🔧 TECHNICAL REQUESTS IN ITALIAN');
    console.log('-' .repeat(40));

    for (const scenario of ITALIAN_TEST_SCENARIOS.technical_requests) {
      const result = await this.runConversationTest('Technical Request', scenario);
      
      // Special validation for WatchGuard expertise
      if (scenario.expertiseHighlight === 'watchguard_partnership' && result.success) {
        await this.validateWatchGuardExpertise(result);
      }
      
      await this.delay(500);
    }

    console.log('✅ Technical requests tests completed\n');
  }

  async testPricingQuestions() {
    console.log('\n💰 PRICING QUESTIONS IN ITALIAN');
    console.log('-' .repeat(40));

    for (const scenario of ITALIAN_TEST_SCENARIOS.pricing_questions) {
      const result = await this.runConversationTest('Pricing Question', scenario);
      
      // Validate pricing information is provided appropriately
      if (scenario.pricingInfo && result.success) {
        await this.validatePricingResponse(result, scenario.pricingInfo);
      }
      
      await this.delay(500);
    }

    console.log('✅ Pricing questions tests completed\n');
  }

  async testGeographicalContext() {
    console.log('\n🗺️  GEOGRAPHICAL CONTEXT UNDERSTANDING');
    console.log('-' .repeat(40));

    for (const scenario of ITALIAN_TEST_SCENARIOS.geographical_context) {
      const result = await this.runConversationTest('Geographical Context', scenario);
      
      // Validate location-based prioritization
      if (scenario.geographicPriority && result.success) {
        await this.validateGeographicPriority(result, scenario);
      }
      
      await this.delay(500);
    }

    console.log('✅ Geographical context tests completed\n');
  }

  async testUrgencyExpressions() {
    console.log('\n🚨 URGENCY DETECTION IN ITALIAN');
    console.log('-' .repeat(40));

    for (const scenario of ITALIAN_TEST_SCENARIOS.urgency_expressions) {
      const result = await this.runConversationTest('Urgency Expression', scenario);
      
      // Validate urgency level detection
      if (scenario.urgencyLevel && result.success) {
        await this.validateUrgencyDetection(result, scenario);
      }
      
      await this.delay(500);
    }

    console.log('✅ Urgency expressions tests completed\n');
  }

  async testColloquialExpressions() {
    console.log('\n💬 COLLOQUIAL ITALIAN EXPRESSIONS');
    console.log('-' .repeat(40));

    for (const scenario of ITALIAN_TEST_SCENARIOS.colloquial_expressions) {
      const result = await this.runConversationTest('Colloquial Expression', scenario);
      
      // Validate appropriate tone and communication style
      if (scenario.communicationStyle && result.success) {
        await this.validateCommunicationStyle(result, scenario);
      }
      
      await this.delay(500);
    }

    console.log('✅ Colloquial expressions tests completed\n');
  }

  async testRegionalVariations() {
    console.log('\n🏛️  REGIONAL VARIATIONS (LOMBARDIA/BRIANZA)');
    console.log('-' .repeat(40));

    for (const scenario of ITALIAN_TEST_SCENARIOS.regional_variations) {
      const result = await this.runConversationTest('Regional Variation', scenario);
      
      // Validate cultural and regional sensitivity
      if (scenario.region && result.success) {
        await this.validateRegionalSensitivity(result, scenario);
      }
      
      await this.delay(500);
    }

    console.log('✅ Regional variations tests completed\n');
  }

  async testConversationFlow() {
    console.log('\n🔄 MULTI-TURN CONVERSATION FLOW');
    console.log('-' .repeat(40));

    // Test a complete multi-turn conversation
    const conversationFlow = [
      "Ciao, ho sentito che siete bravi con l'informatica",
      "Siamo una piccola azienda a Monza",
      "Abbiamo 15 dipendenti",
      "Ci servono assistenza IT e un firewall",
      "Quanto verrebbe a costare tutto?",
      "Potreste venire a fare un sopralluogo?",
      "Perfetto, quando possiamo vederci?"
    ];

    console.log('   Testing complete conversation flow...');

    let contextCarryover = true;
    let conversationData = {};

    for (let i = 0; i < conversationFlow.length; i++) {
      const message = conversationFlow[i];
      console.log(`     Turn ${i + 1}: "${message}"`);
      
      const response = await this.sendMessage(message);
      
      if (!response.success) {
        contextCarryover = false;
        console.log(`     ❌ Failed at turn ${i + 1}`);
        break;
      }

      // Check if context from previous turns is maintained
      if (i > 0) {
        const maintainsContext = this.checkContextContinuity(response, conversationData);
        if (!maintainsContext) {
          contextCarryover = false;
          console.log(`     ⚠️  Context lost at turn ${i + 1}`);
        }
      }

      // Extract conversation data for next turn
      conversationData = this.extractConversationData(response, conversationData);
      
      await this.delay(300);
    }

    if (contextCarryover) {
      console.log('     ✅ Multi-turn context maintained successfully');
      this.linguisticAnalysis.conversationFlow = 1;
    } else {
      console.log('     ❌ Context continuity issues detected');
      this.linguisticAnalysis.conversationFlow = 0;
    }

    console.log('✅ Conversation flow tests completed\n');
  }

  async testCulturalSensitivity() {
    console.log('\n🎭 CULTURAL SENSITIVITY TESTING');
    console.log('-' .repeat(40));

    const culturalTests = [
      {
        input: "Non sono pratico di queste cose tecniche",
        expectation: "Patient explanation without condescension",
        culturalAspect: "technical_humility"
      },
      {
        input: "Vorremmo rimanere nel territorio per l'assistenza",
        expectation: "Emphasize local presence and proximity",
        culturalAspect: "local_preference"
      },
      {
        input: "È importante avere un referente che parli italiano",
        expectation: "Reassure about Italian language support",
        culturalAspect: "language_preference"
      },
      {
        input: "Abbiamo sempre lavorato con fornitori della zona",
        expectation: "Highlight local experience and references",
        culturalAspect: "regional_loyalty"
      }
    ];

    for (const test of culturalTests) {
      console.log(`   Testing cultural sensitivity: ${test.culturalAspect}`);
      
      const response = await this.sendMessage(test.input);
      
      if (response.success) {
        const culturallyAppropriate = this.assessCulturalAppropriateness(response, test);
        
        if (culturallyAppropriate) {
          console.log(`     ✅ Culturally appropriate response`);
          this.linguisticAnalysis.culturalSensitivity++;
        } else {
          console.log(`     ⚠️  Could improve cultural sensitivity`);
        }
      }
      
      await this.delay(300);
    }

    const totalCulturalTests = culturalTests.length;
    this.linguisticAnalysis.culturalSensitivity = this.linguisticAnalysis.culturalSensitivity / totalCulturalTests;

    console.log('✅ Cultural sensitivity tests completed\n');
  }

  async runConversationTest(testName, scenario) {
    console.log(`   Testing: ${scenario.input}`);
    
    const startTime = Date.now();
    const response = await this.sendMessage(scenario.input);
    const responseTime = Date.now() - startTime;

    const testResult = {
      testName,
      scenario,
      response,
      responseTime,
      success: false,
      linguisticScore: 0
    };

    if (!response.success) {
      console.log(`     ❌ Request failed: ${response.error}`);
      this.results.push(testResult);
      return testResult;
    }

    // Validate expected intents
    let intentMatch = false;
    if (scenario.expectedIntents) {
      intentMatch = scenario.expectedIntents.some(intent =>
        response.intent?.includes(intent) ||
        response.response?.toLowerCase().includes(intent)
      );
    }

    // Validate required content
    let contentMatch = true;
    if (scenario.mustContain) {
      contentMatch = scenario.mustContain.every(content =>
        response.response?.toLowerCase().includes(content.toLowerCase())
      );
    }

    // Calculate linguistic score
    const linguisticScore = this.calculateLinguisticScore(response, scenario);
    testResult.linguisticScore = linguisticScore;

    // Overall success evaluation
    testResult.success = response.success && (intentMatch || !scenario.expectedIntents) && contentMatch;

    if (testResult.success) {
      console.log(`     ✅ ${testName} passed (${responseTime}ms) - Linguistic Score: ${linguisticScore.toFixed(2)}`);
    } else {
      console.log(`     ❌ ${testName} failed (${responseTime}ms)`);
      if (!intentMatch && scenario.expectedIntents) {
        console.log(`       Intent mismatch: expected ${scenario.expectedIntents.join(', ')}`);
      }
      if (!contentMatch) {
        const missingContent = scenario.mustContain.filter(content =>
          !response.response?.toLowerCase().includes(content.toLowerCase())
        );
        console.log(`       Missing content: ${missingContent.join(', ')}`);
      }
    }

    this.results.push(testResult);
    return testResult;
  }

  // Validation methods for specific scenarios
  async validateLeadQualification(result, expectedLevel) {
    const actualPriority = result.response.priority || 'unknown';
    console.log(`     📊 Lead qualification: expected ${expectedLevel}, got ${actualPriority}`);
  }

  async validateWatchGuardExpertise(result) {
    const mentions = ['watchguard', 'partner', 'certificat', 'specializzat'];
    const expertiseMentioned = mentions.some(term =>
      result.response.response?.toLowerCase().includes(term)
    );
    
    if (expertiseMentioned) {
      console.log(`     🏆 WatchGuard expertise properly highlighted`);
      this.linguisticAnalysis.technicalAccuracy += 0.25;
    }
  }

  async validatePricingResponse(result, pricingType) {
    const hasPricing = result.response.response?.includes('€') ||
                       result.response.response?.includes('preventivo') ||
                       result.response.response?.includes('costo');
    
    if (hasPricing) {
      console.log(`     💰 Pricing information provided appropriately`);
      this.linguisticAnalysis.technicalAccuracy += 0.25;
    }
  }

  async validateGeographicPriority(result, scenario) {
    const locationTerms = ['zona', 'minuti', 'vicini', 'stesso'];
    const locationAwareness = locationTerms.some(term =>
      result.response.response?.toLowerCase().includes(term)
    );
    
    if (locationAwareness) {
      console.log(`     🗺️  Geographic context properly recognized`);
      this.linguisticAnalysis.localContext += 0.33;
    }
  }

  async validateUrgencyDetection(result, scenario) {
    const isUrgent = result.response.escalate || 
                     result.response.priority === 'high' ||
                     result.response.response?.toLowerCase().includes('immediata');
    
    if (scenario.urgencyLevel === 'critical' && isUrgent) {
      console.log(`     🚨 Urgency properly detected and escalated`);
    } else if (scenario.urgencyLevel === 'low' && !isUrgent) {
      console.log(`     📅 Non-urgent request handled appropriately`);
    }
  }

  async validateCommunicationStyle(result, scenario) {
    const response = result.response.response?.toLowerCase() || '';
    
    if (scenario.communicationStyle === 'simple_clear') {
      const isSimple = !response.includes('tecnico') && 
                      (response.includes('semplice') || response.includes('spiego'));
      if (isSimple) {
        console.log(`     💡 Simple communication style adopted`);
        this.linguisticAnalysis.culturalSensitivity += 0.25;
      }
    }
  }

  async validateRegionalSensitivity(result, scenario) {
    const response = result.response.response || '';
    
    // Check for appropriate tone matching regional variation
    if (scenario.tonality === 'friendly_professional') {
      const friendlyTerms = ['certo', 'volentieri', 'disponibili'];
      const isFriendly = friendlyTerms.some(term => response.toLowerCase().includes(term));
      
      if (isFriendly) {
        console.log(`     🤝 Appropriate regional tone adopted`);
        this.linguisticAnalysis.culturalSensitivity += 0.33;
      }
    }
  }

  checkContextContinuity(response, conversationData) {
    // Check if previous conversation elements are referenced
    const responseText = response.response?.toLowerCase() || '';
    
    if (conversationData.companySize && responseText.includes('dipendenti')) {
      return true;
    }
    if (conversationData.location && responseText.includes(conversationData.location.toLowerCase())) {
      return true;
    }
    if (conversationData.services && conversationData.services.some(s => responseText.includes(s))) {
      return true;
    }
    
    return false;
  }

  extractConversationData(response, existingData) {
    const responseText = response.response?.toLowerCase() || '';
    const newData = { ...existingData };
    
    // Extract company size
    const sizeMatch = responseText.match(/(\d+) dipendenti/);
    if (sizeMatch) {
      newData.companySize = sizeMatch[1];
    }
    
    // Extract location
    if (responseText.includes('monza')) newData.location = 'Monza';
    if (responseText.includes('vimercate')) newData.location = 'Vimercate';
    if (responseText.includes('milano')) newData.location = 'Milano';
    
    // Extract services
    const services = [];
    if (responseText.includes('firewall')) services.push('firewall');
    if (responseText.includes('assistenza')) services.push('assistenza');
    if (responseText.includes('backup')) services.push('backup');
    if (services.length > 0) newData.services = services;
    
    return newData;
  }

  calculateLinguisticScore(response, scenario) {
    let score = 0;
    const responseText = response.response?.toLowerCase() || '';
    
    // Formality appropriateness (0-1)
    if (scenario.culturalContext === 'formal morning greeting') {
      if (responseText.includes('buongiorno') || responseText.includes('gentile')) {
        score += 0.25;
      }
    } else if (scenario.culturalContext === 'informal greeting') {
      if (responseText.includes('ciao') || responseText.includes('tutto bene')) {
        score += 0.25;
      }
    }
    
    // Technical terminology accuracy (0-1)
    const technicalTerms = ['server', 'firewall', 'rete', 'backup', 'sicurezza'];
    const technicalAccuracy = technicalTerms.filter(term => 
      scenario.input.includes(term) && responseText.includes(term)
    ).length / technicalTerms.length;
    score += technicalAccuracy * 0.25;
    
    // Local context integration (0-1)
    const localTerms = ['vimercate', 'monza', 'brianza', 'zona', '039 888'];
    const localIntegration = localTerms.some(term => responseText.includes(term)) ? 0.25 : 0;
    score += localIntegration;
    
    // Natural language flow (0-1)
    const naturalFlow = this.assessNaturalLanguageFlow(responseText);
    score += naturalFlow * 0.25;
    
    return Math.min(1, score);
  }

  assessNaturalLanguageFlow(text) {
    // Check for natural Italian conversational markers
    const naturalMarkers = [
      'certamente', 'ovviamente', 'naturalmente',
      'perfetto', 'bene', 'ottimo',
      'possiamo', 'posso', 'riusciamo',
      'aiutarla', 'assisterla', 'supportarla'
    ];
    
    const markersFound = naturalMarkers.filter(marker => text.includes(marker)).length;
    return Math.min(1, markersFound / 3); // At least 3 natural markers for full score
  }

  assessCulturalAppropriateness(response, test) {
    const responseText = response.response?.toLowerCase() || '';
    
    switch (test.culturalAspect) {
      case 'technical_humility':
        return responseText.includes('spiego') || responseText.includes('semplice');
      case 'local_preference':
        return responseText.includes('zona') || responseText.includes('territorio');
      case 'language_preference':
        return responseText.includes('italiano') || responseText.includes('lingua');
      case 'regional_loyalty':
        return responseText.includes('zona') || responseText.includes('referenze');
      default:
        return true;
    }
  }

  async sendMessage(message) {
    const requestData = {
      action: 'message',
      message: message,
      sessionId: this.testSession
    };

    try {
      const response = await fetch('http://localhost:8788/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://www.it-era.it'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.sessionId && !this.testSession) {
        this.testSession = result.sessionId;
      }

      return result;
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        networkError: true
      };
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateLinguisticReport() {
    console.log('\n📊 ITALIAN CONVERSATION LINGUISTIC ANALYSIS REPORT');
    console.log('=' .repeat(80));

    const totalTests = this.results.length;
    const successfulTests = this.results.filter(r => r.success).length;
    const successRate = (successfulTests / totalTests) * 100;

    const avgLinguisticScore = this.results
      .reduce((sum, r) => sum + r.linguisticScore, 0) / totalTests;

    console.log(`📋 SUMMARY`);
    console.log(`   Total Italian Tests: ${totalTests}`);
    console.log(`   Successful Tests: ${successfulTests} (${successRate.toFixed(1)}%)`);
    console.log(`   Average Linguistic Score: ${avgLinguisticScore.toFixed(2)}/1.00`);

    console.log(`\n🎯 LINGUISTIC ANALYSIS`);
    console.log(`   Cultural Sensitivity: ${(this.linguisticAnalysis.culturalSensitivity * 100).toFixed(1)}%`);
    console.log(`   Technical Accuracy: ${(this.linguisticAnalysis.technicalAccuracy * 100).toFixed(1)}%`);
    console.log(`   Local Context: ${(this.linguisticAnalysis.localContext * 100).toFixed(1)}%`);
    console.log(`   Conversation Flow: ${(this.linguisticAnalysis.conversationFlow * 100).toFixed(1)}%`);

    console.log(`\n🎭 CULTURAL COMPETENCY EVALUATION`);
    
    const culturalScore = (
      this.linguisticAnalysis.culturalSensitivity +
      this.linguisticAnalysis.localContext +
      (this.linguisticAnalysis.conversationFlow || 0)
    ) / 3;

    if (culturalScore >= 0.8) {
      console.log(`   🏆 EXCELLENT: Culturally competent Italian conversation (${(culturalScore * 100).toFixed(1)}%)`);
    } else if (culturalScore >= 0.6) {
      console.log(`   ✅ GOOD: Appropriate Italian communication (${(culturalScore * 100).toFixed(1)}%)`);
    } else if (culturalScore >= 0.4) {
      console.log(`   ⚠️  FAIR: Basic Italian understanding (${(culturalScore * 100).toFixed(1)}%)`);
    } else {
      console.log(`   ❌ POOR: Cultural and linguistic improvements needed (${(culturalScore * 100).toFixed(1)}%)`);
    }

    console.log(`\n📝 RECOMMENDATIONS FOR ITALIAN CONVERSATION`);

    const recommendations = [];

    if (this.linguisticAnalysis.culturalSensitivity < 0.7) {
      recommendations.push('🎭 Improve cultural sensitivity in responses');
    }

    if (this.linguisticAnalysis.technicalAccuracy < 0.8) {
      recommendations.push('🔧 Better integration of technical terminology in Italian');
    }

    if (this.linguisticAnalysis.localContext < 0.8) {
      recommendations.push('🗺️  Strengthen local Lombardia/Brianza references');
    }

    if (avgLinguisticScore < 0.7) {
      recommendations.push('💬 Overall improvement in natural Italian conversation flow');
    }

    if (successRate < 90) {
      recommendations.push('🎯 Address failing conversation scenarios');
    }

    if (recommendations.length === 0) {
      recommendations.push('🎉 Italian conversation handling is excellent!');
    }

    recommendations.forEach(rec => console.log(`   ${rec}`));

    console.log(`\n🇮🇹 ITALIAN CONVERSATION SCORE: ${(avgLinguisticScore * 100).toFixed(0)}/100`);
    console.log('🏁 Italian Conversation Tests Complete!');
  }
}

// Export for use in other test environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    ItalianConversationTester, 
    ITALIAN_TEST_SCENARIOS, 
    CULTURAL_PATTERNS 
  };
}

// Browser-friendly export
if (typeof window !== 'undefined') {
  window.ItalianConversationTester = ItalianConversationTester;
}

// Auto-run if called directly
if (typeof require !== 'undefined' && require.main === module) {
  (async () => {
    const tester = new ItalianConversationTester();
    await tester.runItalianConversationTests();
  })().catch(console.error);
}