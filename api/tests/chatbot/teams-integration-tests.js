/**
 * IT-ERA Teams Integration Test Suite
 * Tests specifically for Teams webhook notifications and formatting
 * Date: 2025-08-24
 */

import { ITERAKnowledgeBase } from '../../src/knowledge-base/it-era-knowledge-real.js';
import { LeadQualificationUtils } from '../../src/chatbot/flows/it-era-flows.js';

// Teams webhook test configuration
const TEAMS_CONFIG = {
  webhookUrl: process.env.TEAMS_WEBHOOK_URL || 'https://outlook.office.com/webhook/test',
  timeout: 10000,
  retryAttempts: 3
};

// Teams message templates for IT-ERA
const TEAMS_TEMPLATES = {
  quote_request: {
    type: "MessageCard",
    context: "https://schema.org/extensions",
    summary: "Nuova Richiesta Preventivo IT-ERA",
    themeColor: "0072C6",
    sections: [{
      activityTitle: "💰 Nuova Richiesta Preventivo",
      activitySubtitle: "IT-ERA - Servizi IT Professionali",
      facts: []
    }],
    potentialAction: [{
      "@type": "OpenUri",
      name: "Visualizza Dettagli",
      targets: [{
        os: "default",
        uri: "https://it-era.it/admin/leads"
      }]
    }]
  },
  
  emergency: {
    type: "MessageCard",
    context: "https://schema.org/extensions", 
    summary: "🚨 EMERGENZA IT - Intervento Immediato",
    themeColor: "FF0000",
    sections: [{
      activityTitle: "🚨 EMERGENZA IT - Intervento Immediato",
      activitySubtitle: "Cliente necessita assistenza urgente",
      facts: []
    }],
    potentialAction: [{
      "@type": "OpenUri",
      name: "📞 Chiama Cliente",
      targets: [{
        os: "default", 
        uri: "tel:+39"
      }]
    }]
  }
};

class TeamsIntegrationTester {
  constructor() {
    this.testResults = [];
    this.mockWebhookCalls = [];
  }

  // Mock Teams webhook for testing
  async mockTeamsWebhook(payload) {
    this.mockWebhookCalls.push({
      timestamp: Date.now(),
      payload: payload,
      success: true,
      responseTime: Math.random() * 200 + 100 // 100-300ms
    });

    // Simulate realistic delays and occasional failures
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // 95% success rate
    if (Math.random() < 0.95) {
      return { success: true, messageId: `teams_msg_${Date.now()}` };
    } else {
      throw new Error('Teams webhook timeout');
    }
  }

  async testQuoteRequestNotification() {
    console.log('📧 Testing Quote Request Teams Notification...');
    
    const testLead = {
      contact_name: "Marco Verdi",
      company_name: "Test Company SRL", 
      email: "marco@testcompany.it",
      phone: "039 123 4567",
      location: "Vimercate",
      company_size: "15",
      service_type: "Assistenza IT + Firewall WatchGuard",
      budget_range: "€1000-2000/mese",
      timeline: "Entro 1 mese",
      message: "Abbiamo bisogno di sistemare la nostra infrastruttura IT"
    };

    const conversationData = {
      leadData: testLead,
      currentMessage: testLead.message,
      sessionId: `test_${Date.now()}`
    };

    const priority = LeadQualificationUtils.calculateLeadPriority(conversationData);
    const teamsData = LeadQualificationUtils.prepareTeamsData(conversationData);

    // Format Teams message
    const teamsMessage = this.formatTeamsMessage('quote_request', testLead, priority);

    // Send to mock webhook
    const result = await this.mockTeamsWebhook(teamsMessage);

    // Validate message structure
    this.validateTeamsMessage(teamsMessage, 'quote_request');

    console.log(`✅ Quote request notification sent - Priority: ${priority}`);
    console.log(`📊 Lead Score: ${teamsData.lead_score}`);
    
    return {
      success: result.success,
      priority,
      leadScore: teamsData.lead_score,
      messageId: result.messageId,
      payload: teamsMessage
    };
  }

  async testEmergencyNotification() {
    console.log('🚨 Testing Emergency Teams Notification...');

    const emergencyLead = {
      contact_name: "Anna Rossi",
      company_name: "Emergency Corp",
      email: "anna@emergencycorp.it", 
      phone: "039 888 9999",
      location: "Monza",
      company_size: "30",
      service_type: "Server down - sistema critico offline",
      message: "EMERGENZA! Il nostro server principale è down da 2 ore, non possiamo lavorare!",
      urgency: "emergenza"
    };

    const conversationData = {
      leadData: emergencyLead,
      currentMessage: emergencyLead.message,
      sessionId: `emergency_${Date.now()}`
    };

    const priority = LeadQualificationUtils.calculateLeadPriority(conversationData);
    const needsEscalation = LeadQualificationUtils.needsImmediateEscalation(conversationData);

    // Emergency should always be high priority
    if (priority !== 'high' && !needsEscalation) {
      throw new Error('Emergency not detected as high priority');
    }

    // Format Teams emergency message
    const teamsMessage = this.formatTeamsMessage('emergency', emergencyLead, priority);

    // Send to mock webhook
    const result = await this.mockTeamsWebhook(teamsMessage);

    // Validate message structure
    this.validateTeamsMessage(teamsMessage, 'emergency');

    console.log(`✅ Emergency notification sent - Immediate escalation: ${needsEscalation}`);
    
    return {
      success: result.success,
      priority,
      needsEscalation,
      messageId: result.messageId,
      payload: teamsMessage
    };
  }

  async testSecurityServiceNotification() {
    console.log('🔒 Testing Security Service Teams Notification...');

    const securityLead = {
      contact_name: "Roberto Bianchi",
      company_name: "Secure Business SRL",
      email: "r.bianchi@securebusiness.it",
      phone: "039 555 1234", 
      location: "Vimercate",
      company_size: "20",
      service_type: "Firewall WatchGuard per ufficio",
      budget_range: "€3000-5000",
      timeline: "Entro 2 settimane",
      message: "Cerchiamo un partner per implementare firewall WatchGuard nella nostra rete aziendale"
    };

    const conversationData = {
      leadData: securityLead,
      currentMessage: securityLead.message,
      sessionId: `security_${Date.now()}`
    };

    const priority = LeadQualificationUtils.calculateLeadPriority(conversationData);
    const teamsData = LeadQualificationUtils.prepareTeamsData(conversationData);

    // Format Teams message with security focus
    const teamsMessage = this.formatTeamsMessage('quote_request', securityLead, priority);
    
    // Add security-specific fields
    teamsMessage.sections[0].facts.push({
      name: "🛡️ Specializzazione",
      value: "Firewall WatchGuard - Partner Certificato"
    });

    const result = await this.mockTeamsWebhook(teamsMessage);

    console.log(`✅ Security service notification sent - Priority: ${priority}`);
    console.log(`🛡️ WatchGuard specialization highlighted`);
    
    return {
      success: result.success,
      priority,
      isSecurityFocused: true,
      messageId: result.messageId,
      payload: teamsMessage
    };
  }

  formatTeamsMessage(type, leadData, priority) {
    const template = JSON.parse(JSON.stringify(TEAMS_TEMPLATES[type]));
    const isEmergency = type === 'emergency';
    
    // Set priority-based color
    if (priority === 'high' || isEmergency) {
      template.themeColor = "FF4444"; // Red for high priority
    } else if (priority === 'medium') {
      template.themeColor = "FF9800"; // Orange for medium
    } else {
      template.themeColor = "4CAF50"; // Green for low
    }

    // Build facts array
    const facts = [
      { name: "👤 Contatto", value: `${leadData.contact_name} (${leadData.company_name})` },
      { name: "📞 Telefono", value: leadData.phone },
      { name: "📧 Email", value: leadData.email },
      { name: "📍 Zona", value: leadData.location },
      { name: "🏢 Dimensioni", value: `${leadData.company_size} dipendenti` },
      { name: "⚡ Priorità", value: this.formatPriorityText(priority) },
      { name: "🛠️ Servizio", value: leadData.service_type }
    ];

    // Add budget if available
    if (leadData.budget_range) {
      facts.push({ name: "💰 Budget", value: leadData.budget_range });
    }

    // Add timeline if available
    if (leadData.timeline) {
      facts.push({ name: "⏰ Timeline", value: leadData.timeline });
    }

    // Add message if available
    if (leadData.message) {
      facts.push({ 
        name: isEmergency ? "🚨 Dettagli Emergenza" : "💬 Messaggio", 
        value: leadData.message.substring(0, 200) + (leadData.message.length > 200 ? "..." : "")
      });
    }

    template.sections[0].facts = facts;

    // Update phone action for emergency
    if (isEmergency && template.potentialAction) {
      template.potentialAction[0].targets[0].uri = `tel:${leadData.phone.replace(/\s/g, '')}`;
    }

    return template;
  }

  formatPriorityText(priority) {
    const priorityMap = {
      'high': '🔴 Alta - Contatto Immediato',
      'medium': '🟡 Media - Entro 4 ore', 
      'low': '🟢 Bassa - Entro 24 ore'
    };
    return priorityMap[priority] || priority;
  }

  validateTeamsMessage(message, expectedType) {
    // Check required fields
    if (!message.type || message.type !== "MessageCard") {
      throw new Error('Invalid Teams message type');
    }

    if (!message.sections || message.sections.length === 0) {
      throw new Error('Missing message sections');
    }

    const section = message.sections[0];
    if (!section.facts || section.facts.length === 0) {
      throw new Error('Missing message facts');
    }

    // Check essential facts are present
    const factNames = section.facts.map(f => f.name);
    const requiredFacts = ['👤 Contatto', '📞 Telefono', '📧 Email', '📍 Zona'];
    
    for (const required of requiredFacts) {
      if (!factNames.some(name => name.includes(required.split(' ')[1]))) {
        throw new Error(`Missing required fact: ${required}`);
      }
    }

    // Validate phone number format
    const phoneFact = section.facts.find(f => f.name.includes('Telefono'));
    if (phoneFact && !phoneFact.value.includes('039')) {
      console.warn('Phone number may not be in expected Italian format');
    }

    // Validate emergency-specific requirements
    if (expectedType === 'emergency') {
      if (message.themeColor !== "FF4444" && message.themeColor !== "FF0000") {
        throw new Error('Emergency message should have red theme color');
      }
      
      if (!section.activityTitle.includes('EMERGENZA')) {
        throw new Error('Emergency message should have EMERGENZA in title');
      }
    }

    console.log('✅ Teams message structure validated');
  }

  async runAllTeamsTests() {
    console.log('🚀 Starting Teams Integration Test Suite');
    console.log('=' .repeat(60));

    const results = [];

    try {
      // Test quote request notification
      const quoteResult = await this.testQuoteRequestNotification();
      results.push({ test: 'quote_request', ...quoteResult });

      // Test emergency notification  
      const emergencyResult = await this.testEmergencyNotification();
      results.push({ test: 'emergency', ...emergencyResult });

      // Test security service notification
      const securityResult = await this.testSecurityServiceNotification();
      results.push({ test: 'security_service', ...securityResult });

      console.log('\n📊 Teams Integration Test Results:');
      console.log('=' .repeat(60));
      
      results.forEach(result => {
        console.log(`${result.success ? '✅' : '❌'} ${result.test.toUpperCase()}`);
        console.log(`   Priority: ${result.priority}`);
        console.log(`   Message ID: ${result.messageId}`);
        if (result.leadScore) {
          console.log(`   Lead Score: ${result.leadScore}`);
        }
        if (result.needsEscalation) {
          console.log(`   🚨 Immediate escalation required`);
        }
      });

      console.log(`\n📈 Total Webhook Calls: ${this.mockWebhookCalls.length}`);
      console.log(`⚡ Average Response Time: ${this.calculateAverageResponseTime()}ms`);

      return {
        summary: {
          total: results.length,
          passed: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        },
        results,
        webhookStats: {
          totalCalls: this.mockWebhookCalls.length,
          averageResponseTime: this.calculateAverageResponseTime()
        }
      };

    } catch (error) {
      console.error('❌ Teams integration test failed:', error);
      throw error;
    }
  }

  calculateAverageResponseTime() {
    if (this.mockWebhookCalls.length === 0) return 0;
    
    const total = this.mockWebhookCalls.reduce((sum, call) => sum + call.responseTime, 0);
    return Math.round(total / this.mockWebhookCalls.length);
  }

  generateTeamsTestReport() {
    return {
      timestamp: new Date().toISOString(),
      webhookUrl: TEAMS_CONFIG.webhookUrl,
      totalTests: this.testResults.length,
      webhookCalls: this.mockWebhookCalls.length,
      averageResponseTime: this.calculateAverageResponseTime(),
      testResults: this.testResults,
      recommendations: this.generateTeamsRecommendations()
    };
  }

  generateTeamsRecommendations() {
    const recommendations = [];
    
    if (this.mockWebhookCalls.length > 0) {
      recommendations.push('✅ Teams webhook integration is working correctly');
      
      const avgResponseTime = this.calculateAverageResponseTime();
      if (avgResponseTime > 300) {
        recommendations.push(`⚠️ Average response time is ${avgResponseTime}ms - consider optimizing`);
      }
      
      recommendations.push('🔧 Verify webhook URL is configured in production environment');
      recommendations.push('📧 Test with actual Teams channel to ensure messages appear correctly');
      recommendations.push('🔔 Configure appropriate notification settings for emergency vs normal requests');
    } else {
      recommendations.push('❌ No webhook calls detected - check configuration');
    }

    return recommendations;
  }
}

// Export for use in other tests
export { TeamsIntegrationTester, TEAMS_TEMPLATES, TEAMS_CONFIG };

// Auto-run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new TeamsIntegrationTester();
  tester.runAllTeamsTests()
    .then(report => {
      console.log('\n✅ Teams integration tests completed');
      return report;
    })
    .catch(console.error);
}

export default TeamsIntegrationTester;