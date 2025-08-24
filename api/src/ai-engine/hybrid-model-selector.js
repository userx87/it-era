/**
 * Hybrid AI Model Selector for IT-ERA Chatbot
 * Intelligently switches between GPT-4o Mini and DeepSeek v3.1 based on context
 * Target: <€0.04/conversation, <2s response time
 */

import { AIConfig, selectHybridModel } from './ai-config.js';

class HybridModelSelector {
  constructor() {
    this.sessionMetrics = new Map(); // Track per-session performance
    this.modelPerformance = new Map(); // Track model performance metrics
    this.costTracker = new Map(); // Track costs per session
    
    // Model cost per 1K tokens (approximate EUR values)
    this.modelCosts = {
      'openai/gpt-4o-mini': { input: 0.000150, output: 0.000600 }, // ~€0.031/conversation
      'deepseek/deepseek-chat': { input: 0.000070, output: 0.000280 }, // ~€0.014/conversation
      'anthropic/claude-3-haiku': { input: 0.000250, output: 0.001250 } // Emergency fallback
    };
    
    // Performance targets
    this.targets = AIConfig.OPENROUTER.HYBRID_STRATEGY;
  }

  /**
   * Select optimal model based on conversation context and performance goals
   */
  selectOptimalModel(message, context = {}, sessionId) {
    const sessionMetric = this.getSessionMetrics(sessionId);
    
    // Emergency conditions - always use fastest model
    if (this.isEmergencyCondition(message, context)) {
      return {
        model: 'openai/gpt-4o-mini',
        reason: 'emergency_speed',
        priority: 'high'
      };
    }
    
    // Budget management - check if we're approaching cost limit
    const currentCost = sessionMetric.totalCost;
    if (currentCost > (this.targets.TARGET_COST_PER_CONVERSATION * 0.8)) {
      return {
        model: 'deepseek/deepseek-chat',
        reason: 'cost_optimization',
        priority: 'medium'
      };
    }
    
    // Context-based intelligent selection
    const contextualChoice = this.analyzeConversationContext(message, context);
    if (contextualChoice.confidence > 0.8) {
      return contextualChoice;
    }
    
    // Performance-based selection
    const performanceChoice = this.selectByPerformance(sessionId);
    return performanceChoice;
  }

  /**
   * Analyze conversation context for model selection
   */
  analyzeConversationContext(message, context) {
    const msgLower = message.toLowerCase();
    const hybrid = this.targets;
    
    // Customer service indicators (favor GPT-4o Mini for human interaction)
    const customerServiceScore = this.calculateCustomerServiceScore(msgLower, context);
    
    // Technical documentation indicators (favor DeepSeek for technical content)
    const technicalScore = this.calculateTechnicalScore(msgLower, context);
    
    // Complex reasoning indicators (favor GPT-4o Mini for complex logic)
    const complexityScore = this.calculateComplexityScore(msgLower, context);
    
    // Make selection based on highest scoring category
    if (customerServiceScore > technicalScore && customerServiceScore > 0.6) {
      return {
        model: hybrid.CUSTOMER_CHAT_MODEL,
        reason: 'customer_service',
        confidence: customerServiceScore,
        priority: 'high'
      };
    }
    
    if (technicalScore > customerServiceScore && technicalScore > 0.6) {
      return {
        model: hybrid.TECHNICAL_DOCS_MODEL,
        reason: 'technical_documentation',
        confidence: technicalScore,
        priority: 'medium'
      };
    }
    
    if (complexityScore > 0.7) {
      return {
        model: hybrid.CUSTOMER_CHAT_MODEL,
        reason: 'complex_reasoning',
        confidence: complexityScore,
        priority: 'high'
      };
    }
    
    // Default to cost-effective option
    return {
      model: hybrid.TECHNICAL_DOCS_MODEL,
      reason: 'default_cost_effective',
      confidence: 0.5,
      priority: 'medium'
    };
  }

  /**
   * Calculate customer service relevance score
   */
  calculateCustomerServiceScore(message, context) {
    let score = 0;
    const customerKeywords = [
      // Direct service requests
      'preventivo', 'prezzo', 'costo', 'quanto', 'tariffe',
      // Support requests  
      'aiuto', 'problema', 'assistenza', 'supporto', 'urgente',
      // Human interaction
      'grazie', 'buongiorno', 'salve', 'persona', 'operatore',
      // Business inquiries
      'azienda', 'dipendenti', 'contratto', 'servizio'
    ];
    
    // Count keyword matches
    customerKeywords.forEach(keyword => {
      if (message.includes(keyword)) score += 0.1;
    });
    
    // Context bonuses
    if (context.currentStep === 'greeting') score += 0.2;
    if (context.messageCount <= 3) score += 0.1; // Early conversation
    if (context.escalate || context.priority === 'high') score += 0.3;
    if (context.leadData) score += 0.2; // Lead qualification in progress
    
    return Math.min(score, 1.0);
  }

  /**
   * Calculate technical documentation relevance score
   */
  calculateTechnicalScore(message, context) {
    let score = 0;
    const technicalKeywords = [
      // Infrastructure
      'server', 'firewall', 'rete', 'router', 'switch',
      // Security
      'sicurezza', 'antivirus', 'backup', 'vpn', 'crittografia',
      // Technical processes
      'installazione', 'configurazione', 'manutenzione', 'aggiornamento',
      // Cloud and storage
      'cloud', 'storage', 'sincronizzazione', 'recupero',
      // Specific products
      'watchguard', 'active directory', 'windows server', 'vmware'
    ];
    
    // Count technical keyword matches
    technicalKeywords.forEach(keyword => {
      if (message.includes(keyword)) score += 0.12;
    });
    
    // Context bonuses
    if (context.intent === 'cybersecurity') score += 0.3;
    if (context.intent === 'server') score += 0.3;
    if (context.intent === 'backup') score += 0.2;
    if (context.currentStep === 'service_details') score += 0.2;
    
    return Math.min(score, 1.0);
  }

  /**
   * Calculate complexity score for reasoning-heavy tasks
   */
  calculateComplexityScore(message, context) {
    let score = 0;
    
    // Complex language indicators
    if (message.length > 100) score += 0.2;
    if (message.includes('perché') || message.includes('come mai')) score += 0.2;
    if (message.includes('differenza') || message.includes('confronto')) score += 0.2;
    if (message.includes('quale') && message.includes('meglio')) score += 0.2;
    
    // Multi-part questions
    const questionMarks = (message.match(/\?/g) || []).length;
    if (questionMarks > 1) score += 0.2;
    
    // Context complexity
    if (context.messageCount > 5) score += 0.1; // Extended conversation
    if (context.leadData && Object.keys(context.leadData).length > 3) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  /**
   * Check for emergency conditions requiring fastest response
   */
  isEmergencyCondition(message, context) {
    const emergencyKeywords = [
      'emergenza', 'urgente', 'critico', 'bloccato',
      'server down', 'non funziona', 'malware', 'virus'
    ];
    
    const msgLower = message.toLowerCase();
    const hasEmergencyKeyword = emergencyKeywords.some(keyword => msgLower.includes(keyword));
    
    return hasEmergencyKeyword || 
           context.priority === 'high' || 
           context.escalate || 
           context.needsImmediateHandoff;
  }

  /**
   * Select model based on historical performance
   */
  selectByPerformance(sessionId) {
    const sessionMetric = this.getSessionMetrics(sessionId);
    
    // If we have performance data, use the better performing model
    if (sessionMetric.modelPerformance.size > 0) {
      let bestModel = null;
      let bestScore = -1;
      
      for (const [model, perf] of sessionMetric.modelPerformance.entries()) {
        const score = this.calculatePerformanceScore(perf);
        if (score > bestScore) {
          bestScore = score;
          bestModel = model;
        }
      }
      
      if (bestModel) {
        return {
          model: bestModel,
          reason: 'performance_history',
          confidence: 0.7,
          priority: 'medium'
        };
      }
    }
    
    // Default to primary model
    return {
      model: this.targets.CUSTOMER_CHAT_MODEL,
      reason: 'default_primary',
      confidence: 0.6,
      priority: 'medium'
    };
  }

  /**
   * Calculate performance score for a model
   */
  calculatePerformanceScore(performance) {
    const responseTimeScore = Math.max(0, 1 - (performance.avgResponseTime / this.targets.TARGET_RESPONSE_TIME_MS));
    const costEfficiencyScore = Math.max(0, 1 - (performance.avgCost / this.targets.TARGET_COST_PER_CONVERSATION));
    const successRateScore = performance.successRate;
    
    // Weighted average
    return (responseTimeScore * 0.4) + (costEfficiencyScore * 0.4) + (successRateScore * 0.2);
  }

  /**
   * Track model performance for adaptive selection
   */
  trackModelPerformance(sessionId, model, responseTime, cost, success) {
    const sessionMetric = this.getSessionMetrics(sessionId);
    
    if (!sessionMetric.modelPerformance.has(model)) {
      sessionMetric.modelPerformance.set(model, {
        totalRequests: 0,
        totalResponseTime: 0,
        totalCost: 0,
        successCount: 0,
        avgResponseTime: 0,
        avgCost: 0,
        successRate: 0
      });
    }
    
    const modelPerf = sessionMetric.modelPerformance.get(model);
    modelPerf.totalRequests++;
    modelPerf.totalResponseTime += responseTime;
    modelPerf.totalCost += cost;
    if (success) modelPerf.successCount++;
    
    // Update averages
    modelPerf.avgResponseTime = modelPerf.totalResponseTime / modelPerf.totalRequests;
    modelPerf.avgCost = modelPerf.totalCost / modelPerf.totalRequests;
    modelPerf.successRate = modelPerf.successCount / modelPerf.totalRequests;
    
    // Update session total cost
    sessionMetric.totalCost += cost;
  }

  /**
   * Get session metrics
   */
  getSessionMetrics(sessionId) {
    if (!this.sessionMetrics.has(sessionId)) {
      this.sessionMetrics.set(sessionId, {
        totalCost: 0,
        modelPerformance: new Map(),
        startTime: Date.now(),
        requestCount: 0
      });
    }
    return this.sessionMetrics.get(sessionId);
  }

  /**
   * Get cost estimate for a model
   */
  estimateCost(model, message, estimatedResponseTokens = 200) {
    const costs = this.modelCosts[model];
    if (!costs) return 0;
    
    const inputTokens = Math.ceil(message.length / 4); // Rough token estimation
    const inputCost = inputTokens * costs.input;
    const outputCost = estimatedResponseTokens * costs.output;
    
    return inputCost + outputCost;
  }

  /**
   * Check if we should switch models mid-conversation
   */
  shouldSwitchModel(sessionId, currentModel, newMessage, context) {
    const sessionMetric = this.getSessionMetrics(sessionId);
    
    // Don't switch too frequently (minimum 2 messages with same model)
    if (sessionMetric.requestCount < 2) return false;
    
    // Switch if cost is getting too high
    if (sessionMetric.totalCost > (this.targets.TARGET_COST_PER_CONVERSATION * 0.9)) {
      return this.targets.TECHNICAL_DOCS_MODEL !== currentModel;
    }
    
    // Switch if current model is underperforming
    if (sessionMetric.modelPerformance.has(currentModel)) {
      const currentPerf = sessionMetric.modelPerformance.get(currentModel);
      const perfScore = this.calculatePerformanceScore(currentPerf);
      return perfScore < 0.6;
    }
    
    return false;
  }

  /**
   * Get hybrid strategy status and recommendations
   */
  getStrategyStatus() {
    const totalSessions = this.sessionMetrics.size;
    let totalCost = 0;
    let avgResponseTime = 0;
    let successfulSessions = 0;
    
    const modelUsage = new Map();
    
    for (const [sessionId, metric] of this.sessionMetrics.entries()) {
      totalCost += metric.totalCost;
      
      for (const [model, perf] of metric.modelPerformance.entries()) {
        avgResponseTime += perf.avgResponseTime;
        if (perf.successRate > 0.8) successfulSessions++;
        
        if (!modelUsage.has(model)) {
          modelUsage.set(model, 0);
        }
        modelUsage.set(model, modelUsage.get(model) + perf.totalRequests);
      }
    }
    
    const avgCostPerConversation = totalSessions > 0 ? totalCost / totalSessions : 0;
    const avgResponseTimeMs = totalSessions > 0 ? avgResponseTime / totalSessions : 0;
    const successRate = totalSessions > 0 ? successfulSessions / totalSessions : 0;
    
    return {
      status: 'active',
      performance: {
        totalSessions,
        avgCostPerConversation: Number(avgCostPerConversation.toFixed(4)),
        avgResponseTimeMs: Math.round(avgResponseTimeMs),
        successRate: Number((successRate * 100).toFixed(2)),
        targetCostMet: avgCostPerConversation <= this.targets.TARGET_COST_PER_CONVERSATION,
        targetResponseTimeMet: avgResponseTimeMs <= this.targets.TARGET_RESPONSE_TIME_MS
      },
      modelUsage: Object.fromEntries(modelUsage),
      recommendations: this.generateRecommendations(avgCostPerConversation, avgResponseTimeMs, successRate)
    };
  }

  /**
   * Generate optimization recommendations
   */
  generateRecommendations(avgCost, avgResponseTime, successRate) {
    const recommendations = [];
    
    if (avgCost > this.targets.TARGET_COST_PER_CONVERSATION) {
      recommendations.push({
        type: 'cost_optimization',
        message: `Cost per conversation (€${avgCost.toFixed(4)}) exceeds target (€${this.targets.TARGET_COST_PER_CONVERSATION}). Consider using DeepSeek more frequently.`,
        action: 'increase_deepseek_usage'
      });
    }
    
    if (avgResponseTime > this.targets.TARGET_RESPONSE_TIME_MS) {
      recommendations.push({
        type: 'performance_optimization', 
        message: `Response time (${avgResponseTime}ms) exceeds target (${this.targets.TARGET_RESPONSE_TIME_MS}ms). Consider optimizing prompts or switching models.`,
        action: 'optimize_response_time'
      });
    }
    
    if (successRate < 0.9) {
      recommendations.push({
        type: 'quality_improvement',
        message: `Success rate (${(successRate * 100).toFixed(1)}%) could be improved. Review model selection criteria.`,
        action: 'review_selection_criteria'
      });
    }
    
    if (avgCost <= this.targets.TARGET_COST_PER_CONVERSATION && avgResponseTime <= this.targets.TARGET_RESPONSE_TIME_MS) {
      recommendations.push({
        type: 'success',
        message: 'Hybrid strategy is meeting all performance targets!',
        action: 'maintain_current_strategy'
      });
    }
    
    return recommendations;
  }

  /**
   * Clean up old session data
   */
  cleanup() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    for (const [sessionId, metric] of this.sessionMetrics.entries()) {
      if (metric.startTime < oneHourAgo) {
        this.sessionMetrics.delete(sessionId);
      }
    }
    
    console.log('🧹 Hybrid Model Selector cleanup completed');
  }
}

// Create singleton instance
const hybridModelSelector = new HybridModelSelector();

export { hybridModelSelector, HybridModelSelector };
export default hybridModelSelector;