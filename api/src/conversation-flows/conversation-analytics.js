/**
 * Conversation Analytics for IT-ERA AI Chatbot
 * Advanced analytics and optimization for conversation performance
 * 
 * FEATURES:
 * ✅ Real-time conversation tracking
 * ✅ Lead qualification metrics  
 * ✅ Intent recognition performance
 * ✅ Geographic conversion analysis
 * ✅ A/B testing for conversation flows
 * ✅ Optimization recommendations
 */

export class ConversationAnalytics {
  constructor(config = {}) {
    this.config = {
      storageType: config.storageType || 'memory', // memory, localStorage, cloudflare-kv
      enableRealtimeMetrics: config.enableRealtimeMetrics || true,
      enableABTesting: config.enableABTesting || false,
      retentionDays: config.retentionDays || 30,
      ...config
    };

    this.metrics = this.initializeMetrics();
    this.abTests = this.initializeABTests();
    this.realTimeData = {
      activeConversations: 0,
      currentConversions: 0,
      hourlyMetrics: {}
    };
  }

  /**
   * =====================================================
   * METRICS INITIALIZATION
   * =====================================================
   */

  initializeMetrics() {
    return {
      // Conversation Performance
      conversationMetrics: {
        totalConversations: 0,
        completedConversations: 0,
        averageDuration: 0,
        averageMessageCount: 0,
        bounceRate: 0, // Conversations with < 3 messages
        completionRate: 0 // Conversations reaching contact collection
      },

      // Lead Generation
      leadMetrics: {
        totalLeads: 0,
        qualifiedLeads: 0,
        highPriorityLeads: 0,
        conversionRate: 0,
        leadsBySource: {},
        leadsByGeography: {},
        leadsByService: {}
      },

      // Intent Performance
      intentMetrics: {
        totalIntents: 0,
        intentAccuracy: {},
        misclassifications: 0,
        confidenceDistribution: {
          high: 0, // >0.8
          medium: 0, // 0.5-0.8
          low: 0 // <0.5
        },
        intentToConversionRate: {}
      },

      // Geographic Performance
      geographicMetrics: {
        conversionByZone: {},
        responseTimeByZone: {},
        servicePreferenceByZone: {},
        escalationRateByZone: {}
      },

      // Service Performance
      serviceMetrics: {
        inquiriesByService: {},
        conversionByService: {},
        averageValueByService: {},
        upsellSuccess: {}
      },

      // Temporal Metrics
      temporalMetrics: {
        hourlyConversions: {},
        dailyConversions: {},
        weeklyTrends: {},
        seasonalPatterns: {}
      },

      // Escalation Analytics
      escalationMetrics: {
        totalEscalations: 0,
        escalationRate: 0,
        escalationsByType: {},
        escalationResponseTime: {},
        postEscalationConversion: {}
      },

      // User Experience
      uxMetrics: {
        averageResponseTime: 0,
        userSatisfactionScore: 0,
        dropOffPoints: {},
        flowOptimizationScores: {}
      }
    };
  }

  initializeABTests() {
    return {
      activeTests: {},
      testResults: {},
      testConfiguration: {
        // Example A/B tests for IT-ERA
        greetingVariation: {
          name: 'Greeting Message Variation',
          variants: {
            A: 'Standard IT-ERA greeting',
            B: 'Geographic-personalized greeting', 
            C: 'Service-focused greeting'
          },
          metric: 'conversion_rate',
          status: 'active'
        },
        escalationTiming: {
          name: 'Escalation Trigger Timing',
          variants: {
            A: 'Early escalation (3 messages)',
            B: 'Standard escalation (5 messages)',
            C: 'Late escalation (8 messages)'
          },
          metric: 'lead_quality',
          status: 'planned'
        }
      }
    };
  }

  /**
   * =====================================================
   * CONVERSATION TRACKING
   * =====================================================
   */

  /**
   * Track conversation start
   */
  trackConversationStart(sessionId, metadata = {}) {
    const conversationData = {
      sessionId,
      startTime: Date.now(),
      metadata: {
        userAgent: metadata.userAgent,
        referrer: metadata.referrer,
        geography: metadata.geography,
        source: metadata.source || 'direct',
        ...metadata
      },
      messages: [],
      intents: [],
      leadData: {},
      status: 'active'
    };

    this.storeConversationData(sessionId, conversationData);
    this.updateRealTimeMetrics('conversation_start');
    
    return conversationData;
  }

  /**
   * Track message in conversation
   */
  trackMessage(sessionId, messageData) {
    const conversation = this.getConversationData(sessionId);
    if (!conversation) return;

    const messageRecord = {
      timestamp: Date.now(),
      type: messageData.type || 'user', // user, assistant, system
      content: messageData.content,
      intent: messageData.intent,
      confidence: messageData.confidence,
      flowStep: messageData.flowStep,
      responseTime: messageData.responseTime
    };

    conversation.messages.push(messageRecord);
    conversation.lastActivity = Date.now();

    // Track intent if present
    if (messageData.intent) {
      this.trackIntent(sessionId, messageData.intent, messageData.confidence);
    }

    this.updateConversationData(sessionId, conversation);
  }

  /**
   * Track intent recognition
   */
  trackIntent(sessionId, intentData, confidence) {
    const conversation = this.getConversationData(sessionId);
    if (!conversation) return;

    const intentRecord = {
      intent: intentData.intent,
      confidence: confidence,
      timestamp: Date.now(),
      context: intentData.context
    };

    conversation.intents.push(intentRecord);
    
    // Update intent metrics
    this.updateIntentMetrics(intentData.intent, confidence);
    this.updateConversationData(sessionId, conversation);
  }

  /**
   * Track lead data collection
   */
  trackLeadData(sessionId, leadData, qualificationScore) {
    const conversation = this.getConversationData(sessionId);
    if (!conversation) return;

    conversation.leadData = {
      ...conversation.leadData,
      ...leadData,
      qualificationScore,
      collectionTime: Date.now()
    };

    conversation.status = 'lead_collected';
    
    this.updateLeadMetrics(leadData, qualificationScore);
    this.updateConversationData(sessionId, conversation);
  }

  /**
   * Track escalation
   */
  trackEscalation(sessionId, escalationData) {
    const conversation = this.getConversationData(sessionId);
    if (!conversation) return;

    const escalation = {
      type: escalationData.type,
      priority: escalationData.priority,
      reason: escalationData.reason,
      timestamp: Date.now(),
      responseTime: escalationData.responseTime
    };

    conversation.escalation = escalation;
    conversation.status = 'escalated';

    this.updateEscalationMetrics(escalationData);
    this.updateConversationData(sessionId, conversation);
  }

  /**
   * Track conversation completion
   */
  trackConversationEnd(sessionId, outcome) {
    const conversation = this.getConversationData(sessionId);
    if (!conversation) return;

    conversation.endTime = Date.now();
    conversation.duration = conversation.endTime - conversation.startTime;
    conversation.messageCount = conversation.messages.length;
    conversation.outcome = outcome; // completed, bounced, escalated, converted
    conversation.status = 'completed';

    this.updateConversationMetrics(conversation);
    this.updateRealTimeMetrics('conversation_end', outcome);
    
    return this.generateConversationSummary(conversation);
  }

  /**
   * =====================================================
   * METRICS UPDATES
   * =====================================================
   */

  updateIntentMetrics(intent, confidence) {
    this.metrics.intentMetrics.totalIntents++;
    
    if (!this.metrics.intentMetrics.intentAccuracy[intent]) {
      this.metrics.intentMetrics.intentAccuracy[intent] = {
        count: 0,
        totalConfidence: 0,
        averageConfidence: 0
      };
    }

    const intentMetric = this.metrics.intentMetrics.intentAccuracy[intent];
    intentMetric.count++;
    intentMetric.totalConfidence += confidence;
    intentMetric.averageConfidence = intentMetric.totalConfidence / intentMetric.count;

    // Update confidence distribution
    if (confidence > 0.8) {
      this.metrics.intentMetrics.confidenceDistribution.high++;
    } else if (confidence > 0.5) {
      this.metrics.intentMetrics.confidenceDistribution.medium++;
    } else {
      this.metrics.intentMetrics.confidenceDistribution.low++;
    }
  }

  updateLeadMetrics(leadData, qualificationScore) {
    this.metrics.leadMetrics.totalLeads++;
    
    if (qualificationScore > 70) {
      this.metrics.leadMetrics.qualifiedLeads++;
    }
    
    if (qualificationScore > 85) {
      this.metrics.leadMetrics.highPriorityLeads++;
    }

    // Geographic tracking
    if (leadData.location) {
      const zone = this.normalizeGeography(leadData.location);
      this.metrics.leadMetrics.leadsByGeography[zone] = 
        (this.metrics.leadMetrics.leadsByGeography[zone] || 0) + 1;
    }

    // Service tracking
    if (leadData.service_interest) {
      this.metrics.leadMetrics.leadsByService[leadData.service_interest] =
        (this.metrics.leadMetrics.leadsByService[leadData.service_interest] || 0) + 1;
    }

    this.calculateConversionRate();
  }

  updateEscalationMetrics(escalationData) {
    this.metrics.escalationMetrics.totalEscalations++;
    
    const type = escalationData.type;
    this.metrics.escalationMetrics.escalationsByType[type] =
      (this.metrics.escalationMetrics.escalationsByType[type] || 0) + 1;

    if (escalationData.responseTime) {
      if (!this.metrics.escalationMetrics.escalationResponseTime[type]) {
        this.metrics.escalationMetrics.escalationResponseTime[type] = {
          total: 0,
          count: 0,
          average: 0
        };
      }
      
      const responseMetric = this.metrics.escalationMetrics.escalationResponseTime[type];
      responseMetric.total += escalationData.responseTime;
      responseMetric.count++;
      responseMetric.average = responseMetric.total / responseMetric.count;
    }
  }

  updateConversationMetrics(conversation) {
    this.metrics.conversationMetrics.totalConversations++;
    
    if (conversation.outcome === 'completed' || conversation.outcome === 'converted') {
      this.metrics.conversationMetrics.completedConversations++;
    }

    // Update averages
    const totalConversations = this.metrics.conversationMetrics.totalConversations;
    
    // Duration
    this.metrics.conversationMetrics.averageDuration = 
      ((this.metrics.conversationMetrics.averageDuration * (totalConversations - 1)) + 
       conversation.duration) / totalConversations;

    // Message count
    this.metrics.conversationMetrics.averageMessageCount = 
      ((this.metrics.conversationMetrics.averageMessageCount * (totalConversations - 1)) + 
       conversation.messageCount) / totalConversations;

    // Completion rate
    this.metrics.conversationMetrics.completionRate = 
      this.metrics.conversationMetrics.completedConversations / totalConversations;

    // Bounce rate (conversations with < 3 messages)
    if (conversation.messageCount < 3) {
      this.metrics.conversationMetrics.bounceRate = 
        ((this.metrics.conversationMetrics.bounceRate * (totalConversations - 1)) + 1) / 
        totalConversations;
    }
  }

  updateRealTimeMetrics(eventType, data = {}) {
    const now = Date.now();
    const hour = new Date().getHours();

    if (!this.realTimeData.hourlyMetrics[hour]) {
      this.realTimeData.hourlyMetrics[hour] = {
        conversations: 0,
        conversions: 0,
        escalations: 0
      };
    }

    switch (eventType) {
      case 'conversation_start':
        this.realTimeData.activeConversations++;
        this.realTimeData.hourlyMetrics[hour].conversations++;
        break;
        
      case 'conversation_end':
        this.realTimeData.activeConversations = Math.max(0, this.realTimeData.activeConversations - 1);
        if (data === 'converted') {
          this.realTimeData.currentConversions++;
          this.realTimeData.hourlyMetrics[hour].conversions++;
        }
        break;
        
      case 'escalation':
        this.realTimeData.hourlyMetrics[hour].escalations++;
        break;
    }
  }

  /**
   * =====================================================
   * ANALYTICS QUERIES
   * =====================================================
   */

  /**
   * Get comprehensive analytics dashboard
   */
  getAnalyticsDashboard() {
    return {
      overview: {
        totalConversations: this.metrics.conversationMetrics.totalConversations,
        conversionRate: this.metrics.leadMetrics.conversionRate,
        averageDuration: this.metrics.conversationMetrics.averageDuration,
        activeConversations: this.realTimeData.activeConversations
      },
      
      performance: {
        completionRate: this.metrics.conversationMetrics.completionRate,
        bounceRate: this.metrics.conversationMetrics.bounceRate,
        escalationRate: this.metrics.escalationMetrics.escalationRate,
        intentAccuracy: this.calculateOverallIntentAccuracy()
      },

      leads: {
        totalLeads: this.metrics.leadMetrics.totalLeads,
        qualifiedLeads: this.metrics.leadMetrics.qualifiedLeads,
        highPriorityLeads: this.metrics.leadMetrics.highPriorityLeads,
        leadsByGeography: this.metrics.leadMetrics.leadsByGeography,
        leadsByService: this.metrics.leadMetrics.leadsByService
      },

      realTime: {
        activeNow: this.realTimeData.activeConversations,
        conversionsToday: this.realTimeData.currentConversions,
        hourlyMetrics: this.realTimeData.hourlyMetrics
      },

      optimization: this.generateOptimizationRecommendations()
    };
  }

  /**
   * Get geographic performance analysis
   */
  getGeographicAnalysis() {
    const analysis = {
      conversionByZone: {},
      averageQualificationByZone: {},
      servicePreferenceByZone: {},
      optimizationOpportunities: []
    };

    // Calculate conversion rates by zone
    Object.keys(this.metrics.leadMetrics.leadsByGeography).forEach(zone => {
      const leads = this.metrics.leadMetrics.leadsByGeography[zone];
      const conversations = this.getConversationCountByZone(zone);
      analysis.conversionByZone[zone] = conversations > 0 ? leads / conversations : 0;
    });

    // Identify optimization opportunities
    const avgConversion = this.metrics.leadMetrics.conversionRate;
    Object.entries(analysis.conversionByZone).forEach(([zone, rate]) => {
      if (rate < avgConversion * 0.8) {
        analysis.optimizationOpportunities.push({
          zone,
          currentRate: rate,
          targetRate: avgConversion,
          improvement: avgConversion - rate,
          recommendation: this.generateZoneOptimizationRecommendation(zone, rate)
        });
      }
    });

    return analysis;
  }

  /**
   * Get intent performance analysis
   */
  getIntentAnalysis() {
    const analysis = {
      topIntents: {},
      conversionByIntent: {},
      confidenceAnalysis: {},
      misclassificationPatterns: []
    };

    // Top intents by frequency
    Object.entries(this.metrics.intentMetrics.intentAccuracy).forEach(([intent, data]) => {
      analysis.topIntents[intent] = data.count;
      analysis.confidenceAnalysis[intent] = {
        averageConfidence: data.averageConfidence,
        reliability: this.calculateIntentReliability(intent)
      };
    });

    // Calculate conversion rates by intent
    Object.keys(analysis.topIntents).forEach(intent => {
      analysis.conversionByIntent[intent] = this.calculateIntentConversionRate(intent);
    });

    return analysis;
  }

  /**
   * =====================================================
   * OPTIMIZATION RECOMMENDATIONS
   * =====================================================
   */

  generateOptimizationRecommendations() {
    const recommendations = [];

    // Conversation flow optimization
    if (this.metrics.conversationMetrics.bounceRate > 0.3) {
      recommendations.push({
        category: 'Conversation Flow',
        priority: 'High',
        issue: 'High bounce rate detected',
        recommendation: 'Optimize greeting message and initial engagement',
        expectedImprovement: '15-25% reduction in bounce rate'
      });
    }

    // Intent recognition optimization
    const lowConfidenceIntents = Object.entries(this.metrics.intentMetrics.intentAccuracy)
      .filter(([_, data]) => data.averageConfidence < 0.6);
    
    if (lowConfidenceIntents.length > 0) {
      recommendations.push({
        category: 'Intent Recognition',
        priority: 'Medium', 
        issue: `${lowConfidenceIntents.length} intents with low confidence`,
        recommendation: 'Add more training phrases and refine intent patterns',
        expectedImprovement: '20-30% improvement in intent accuracy'
      });
    }

    // Geographic optimization
    const underperformingZones = this.getUnderperformingZones();
    if (underperformingZones.length > 0) {
      recommendations.push({
        category: 'Geographic Targeting',
        priority: 'Medium',
        issue: `${underperformingZones.length} zones with low conversion`,
        recommendation: 'Create zone-specific messaging and service positioning',
        expectedImprovement: '10-20% improvement in zone conversion'
      });
    }

    // Escalation optimization
    if (this.metrics.escalationMetrics.escalationRate > 0.4) {
      recommendations.push({
        category: 'Escalation Management',
        priority: 'Low',
        issue: 'High escalation rate may indicate bot limitations',
        recommendation: 'Review escalation triggers and improve self-service capabilities',
        expectedImprovement: '5-15% reduction in premature escalations'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { High: 3, Medium: 2, Low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * =====================================================
   * A/B TESTING
   * =====================================================
   */

  /**
   * Initialize A/B test
   */
  startABTest(testName, variants, metric) {
    this.abTests.activeTests[testName] = {
      startDate: Date.now(),
      variants,
      metric,
      assignments: {},
      results: {},
      status: 'active'
    };

    return testName;
  }

  /**
   * Assign user to A/B test variant
   */
  assignABTestVariant(sessionId, testName) {
    const test = this.abTests.activeTests[testName];
    if (!test) return null;

    const variants = Object.keys(test.variants);
    const variantIndex = this.hashSessionId(sessionId) % variants.length;
    const assignedVariant = variants[variantIndex];

    test.assignments[sessionId] = {
      variant: assignedVariant,
      assignedAt: Date.now()
    };

    return assignedVariant;
  }

  /**
   * Record A/B test result
   */
  recordABTestResult(sessionId, testName, metricValue) {
    const test = this.abTests.activeTests[testName];
    if (!test || !test.assignments[sessionId]) return;

    const variant = test.assignments[sessionId].variant;
    if (!test.results[variant]) {
      test.results[variant] = {
        count: 0,
        totalValue: 0,
        averageValue: 0
      };
    }

    test.results[variant].count++;
    test.results[variant].totalValue += metricValue;
    test.results[variant].averageValue = 
      test.results[variant].totalValue / test.results[variant].count;
  }

  /**
   * =====================================================
   * UTILITY METHODS
   * =====================================================
   */

  calculateConversionRate() {
    const totalConversations = this.metrics.conversationMetrics.totalConversations;
    if (totalConversations === 0) return 0;
    
    this.metrics.leadMetrics.conversionRate = 
      this.metrics.leadMetrics.totalLeads / totalConversations;
  }

  calculateOverallIntentAccuracy() {
    const accuracyData = Object.values(this.metrics.intentMetrics.intentAccuracy);
    if (accuracyData.length === 0) return 0;

    const totalWeightedConfidence = accuracyData.reduce((sum, data) => 
      sum + (data.averageConfidence * data.count), 0);
    const totalCount = accuracyData.reduce((sum, data) => sum + data.count, 0);

    return totalCount > 0 ? totalWeightedConfidence / totalCount : 0;
  }

  normalizeGeography(location) {
    const loc = location.toLowerCase();
    
    if (['vimercate', 'agrate', 'concorezzo'].some(city => loc.includes(city))) {
      return 'vimercate_zone';
    } else if (['monza', 'arcore', 'villasanta'].some(city => loc.includes(city))) {
      return 'monza_zone';
    } else if (loc.includes('milano')) {
      return 'milano_zone';
    } else if (loc.includes('brianza')) {
      return 'brianza_zone';
    }
    
    return 'other_zones';
  }

  hashSessionId(sessionId) {
    let hash = 0;
    for (let i = 0; i < sessionId.length; i++) {
      const char = sessionId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Storage methods (implement based on storage type)
  storeConversationData(sessionId, data) {
    // Implementation depends on storage type (memory, localStorage, KV)
    if (this.config.storageType === 'memory') {
      this._memoryStorage = this._memoryStorage || {};
      this._memoryStorage[sessionId] = data;
    }
  }

  getConversationData(sessionId) {
    if (this.config.storageType === 'memory') {
      return this._memoryStorage?.[sessionId] || null;
    }
  }

  updateConversationData(sessionId, data) {
    this.storeConversationData(sessionId, data);
  }

  generateConversationSummary(conversation) {
    return {
      sessionId: conversation.sessionId,
      duration: conversation.duration,
      messageCount: conversation.messageCount,
      outcome: conversation.outcome,
      leadGenerated: !!conversation.leadData.contact_name,
      qualificationScore: conversation.leadData.qualificationScore || 0,
      intentsDetected: conversation.intents.length,
      escalated: !!conversation.escalation
    };
  }

  getUnderperformingZones() {
    const avgConversion = this.metrics.leadMetrics.conversionRate;
    const threshold = avgConversion * 0.8;
    
    return Object.entries(this.metrics.geographicMetrics.conversionByZone)
      .filter(([_, rate]) => rate < threshold)
      .map(([zone]) => zone);
  }

  generateZoneOptimizationRecommendation(zone, currentRate) {
    const recommendations = {
      vimercate_zone: 'Emphasize proximity and same-day service guarantee',
      monza_zone: 'Highlight rapid response times and local presence',
      milano_zone: 'Focus on enterprise solutions and remote capabilities',
      other_zones: 'Promote remote services and specialized expertise'
    };

    return recommendations[zone] || 'Create zone-specific value proposition';
  }

  calculateIntentConversionRate(intent) {
    // This would require cross-referencing intent occurrences with lead generation
    // Implementation depends on data structure and storage
    return 0.5; // Placeholder
  }

  calculateIntentReliability(intent) {
    const data = this.metrics.intentMetrics.intentAccuracy[intent];
    if (!data) return 0;

    // Reliability based on confidence and frequency
    return Math.min((data.averageConfidence + (Math.log(data.count) / 10)), 1);
  }

  getConversationCountByZone(zone) {
    // This would require querying stored conversation data
    // Placeholder implementation
    return 10;
  }
}

export default ConversationAnalytics;