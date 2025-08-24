/**
 * Hybrid Failover System for IT-ERA Chatbot
 * Automatic failover and error handling for GPT-4o Mini + DeepSeek strategy
 * Ensures < 2s response time and high availability
 */

import { AIConfig } from './ai-config.js';
import hybridPerformanceMonitor from './hybrid-performance-monitor.js';

class HybridFailoverSystem {
  constructor() {
    this.failoverHistory = new Map(); // Track failover patterns per session
    this.modelHealth = new Map(); // Track model health status
    this.circuitBreakers = new Map(); // Circuit breaker per model
    this.failoverRules = this.initializeFailoverRules();
    
    // Circuit breaker configuration
    this.circuitBreakerConfig = {
      failureThreshold: 5, // Failures before opening circuit
      timeout: 30000, // 30s timeout before retry
      recoveryAttempts: 3
    };
    
    // Initialize model health tracking
    this.initializeModelHealth();
  }

  /**
   * Initialize failover rules based on context
   */
  initializeFailoverRules() {
    return {
      // Customer service contexts - prioritize speed and reliability
      customerService: {
        primary: 'openai/gpt-4o-mini',
        secondary: 'deepseek/deepseek-chat',
        emergency: 'anthropic/claude-3-haiku',
        maxResponseTime: 2000,
        priority: 'high'
      },
      
      // Technical documentation - prioritize accuracy
      technical: {
        primary: 'deepseek/deepseek-chat',
        secondary: 'openai/gpt-4o-mini',
        emergency: 'anthropic/claude-3-haiku',
        maxResponseTime: 3000,
        priority: 'medium'
      },
      
      // Emergency situations - prioritize speed above all
      emergency: {
        primary: 'anthropic/claude-3-haiku',
        secondary: 'openai/gpt-4o-mini',
        emergency: 'deepseek/deepseek-chat',
        maxResponseTime: 1500,
        priority: 'immediate'
      },
      
      // Default fallback
      default: {
        primary: 'openai/gpt-4o-mini',
        secondary: 'deepseek/deepseek-chat',
        emergency: 'anthropic/claude-3-haiku',
        maxResponseTime: 2000,
        priority: 'medium'
      }
    };
  }

  /**
   * Initialize model health tracking
   */
  initializeModelHealth() {
    const models = [
      'openai/gpt-4o-mini',
      'deepseek/deepseek-chat',
      'anthropic/claude-3-haiku'
    ];
    
    models.forEach(model => {
      this.modelHealth.set(model, {
        status: 'healthy',
        lastCheck: Date.now(),
        consecutiveFailures: 0,
        successCount: 0,
        totalRequests: 0,
        avgResponseTime: 0,
        lastSuccess: Date.now()
      });
      
      this.circuitBreakers.set(model, {
        state: 'closed', // closed, open, half-open
        failures: 0,
        lastFailure: 0,
        nextAttempt: 0
      });
    });
  }

  /**
   * Get optimal model with failover logic
   */
  async getOptimalModelWithFailover(message, context, sessionId) {
    const startTime = Date.now();
    
    try {
      // Determine context type for failover rules
      const contextType = this.determineContextType(message, context);
      const rules = this.failoverRules[contextType] || this.failoverRules.default;
      
      // Check circuit breakers and model health
      const availableModels = this.getAvailableModels(rules);
      
      if (availableModels.length === 0) {
        console.error('🚨 All models unavailable - emergency fallback');
        return await this.handleEmergencyFallback(message, context, sessionId);
      }
      
      // Try models in order of preference
      for (const model of availableModels) {
        try {
          const modelAttempt = await this.attemptModelRequest(model, message, context, sessionId, rules.maxResponseTime);
          
          if (modelAttempt.success) {
            // Track success and update health
            this.recordModelSuccess(model, modelAttempt.responseTime);
            return {
              model,
              success: true,
              responseTime: modelAttempt.responseTime,
              failoverUsed: availableModels[0] !== model,
              contextType,
              response: modelAttempt.response
            };
          }
        } catch (error) {
          console.warn(`⚠️ Model ${model} failed:`, error.message);
          this.recordModelFailure(model, error);
          continue; // Try next model
        }
      }
      
      // If all models failed, use emergency fallback
      return await this.handleEmergencyFallback(message, context, sessionId);
      
    } catch (error) {
      console.error('🚨 Failover system critical error:', error);
      return await this.handleEmergencyFallback(message, context, sessionId);
    }
  }

  /**
   * Determine context type for failover rules
   */
  determineContextType(message, context) {
    const msgLower = message.toLowerCase();
    
    // Emergency keywords
    const emergencyKeywords = ['emergenza', 'urgente', 'server down', 'malware', 'critico'];
    if (emergencyKeywords.some(kw => msgLower.includes(kw)) || context.priority === 'high') {
      return 'emergency';
    }
    
    // Customer service keywords
    const customerKeywords = ['preventivo', 'prezzo', 'aiuto', 'grazie', 'buongiorno', 'assistenza'];
    if (customerKeywords.some(kw => msgLower.includes(kw)) || context.currentStep === 'greeting') {
      return 'customerService';
    }
    
    // Technical keywords
    const technicalKeywords = ['server', 'firewall', 'backup', 'configurazione', 'installazione'];
    if (technicalKeywords.some(kw => msgLower.includes(kw))) {
      return 'technical';
    }
    
    return 'default';
  }

  /**
   * Get available models based on circuit breaker status
   */
  getAvailableModels(rules) {
    const modelOrder = [rules.primary, rules.secondary, rules.emergency];
    const availableModels = [];
    const now = Date.now();
    
    for (const model of modelOrder) {
      const circuitBreaker = this.circuitBreakers.get(model);
      const health = this.modelHealth.get(model);
      
      // Skip if circuit breaker is open and timeout hasn't elapsed
      if (circuitBreaker.state === 'open' && now < circuitBreaker.nextAttempt) {
        console.log(`⚡ Model ${model} circuit breaker open, skipping`);
        continue;
      }
      
      // Skip if model has been consistently failing
      if (health.consecutiveFailures >= 5 && (now - health.lastSuccess) > 300000) { // 5 minutes
        console.log(`❌ Model ${model} marked unhealthy, skipping`);
        continue;
      }
      
      availableModels.push(model);
      
      // If circuit breaker was open, move to half-open for testing
      if (circuitBreaker.state === 'open') {
        circuitBreaker.state = 'half-open';
        console.log(`🔄 Model ${model} circuit breaker moved to half-open for testing`);
      }
    }
    
    return availableModels;
  }

  /**
   * Attempt model request with timeout
   */
  async attemptModelRequest(model, message, context, sessionId, maxResponseTime) {
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Model ${model} timeout after ${maxResponseTime}ms`));
      }, maxResponseTime);
      
      // Simulate model request (this would be replaced with actual OpenRouter call)
      this.simulateModelRequest(model, message, context)
        .then(response => {
          clearTimeout(timeout);
          const responseTime = Date.now() - startTime;
          resolve({
            success: true,
            response,
            responseTime,
            model
          });
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * Simulate model request (placeholder for actual implementation)
   */
  async simulateModelRequest(model, message, context) {
    // This would be replaced with actual OpenRouter API call
    const baseDelay = {
      'openai/gpt-4o-mini': 800,
      'deepseek/deepseek-chat': 1200,
      'anthropic/claude-3-haiku': 500
    }[model] || 1000;
    
    // Simulate variable response time
    const delay = baseDelay + Math.random() * 500;
    
    // Simulate occasional failures (5% failure rate for testing)
    if (Math.random() < 0.05) {
      await new Promise(resolve => setTimeout(resolve, delay));
      throw new Error(`Simulated ${model} API error`);
    }
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return {
      message: `Response from ${model}: ${message.substring(0, 50)}...`,
      model,
      cost: this.getModelCost(model),
      confidence: 0.8 + Math.random() * 0.2
    };
  }

  /**
   * Get estimated model cost
   */
  getModelCost(model) {
    const costs = {
      'openai/gpt-4o-mini': 0.012,
      'deepseek/deepseek-chat': 0.008,
      'anthropic/claude-3-haiku': 0.015
    };
    return costs[model] || 0.010;
  }

  /**
   * Record model success
   */
  recordModelSuccess(model, responseTime) {
    const health = this.modelHealth.get(model);
    const circuitBreaker = this.circuitBreakers.get(model);
    
    // Update health metrics
    health.successCount++;
    health.totalRequests++;
    health.consecutiveFailures = 0; // Reset failure count
    health.lastSuccess = Date.now();
    health.avgResponseTime = (health.avgResponseTime + responseTime) / 2;
    health.status = 'healthy';
    
    // Reset circuit breaker
    circuitBreaker.state = 'closed';
    circuitBreaker.failures = 0;
    
    console.log(`✅ Model ${model} success: ${responseTime}ms`);
  }

  /**
   * Record model failure
   */
  recordModelFailure(model, error) {
    const health = this.modelHealth.get(model);
    const circuitBreaker = this.circuitBreakers.get(model);
    
    // Update health metrics
    health.consecutiveFailures++;
    health.totalRequests++;
    health.lastCheck = Date.now();
    
    // Update circuit breaker
    circuitBreaker.failures++;
    circuitBreaker.lastFailure = Date.now();
    
    // Open circuit breaker if threshold reached
    if (circuitBreaker.failures >= this.circuitBreakerConfig.failureThreshold) {
      circuitBreaker.state = 'open';
      circuitBreaker.nextAttempt = Date.now() + this.circuitBreakerConfig.timeout;
      console.log(`🔴 Model ${model} circuit breaker opened after ${circuitBreaker.failures} failures`);
    }
    
    // Mark model as unhealthy if too many consecutive failures
    if (health.consecutiveFailures >= 3) {
      health.status = 'unhealthy';
    }
    
    console.log(`❌ Model ${model} failure: ${error.message} (${health.consecutiveFailures} consecutive)`);
  }

  /**
   * Handle emergency fallback when all models fail
   */
  async handleEmergencyFallback(message, context, sessionId) {
    console.error('🚨 Emergency fallback activated - all AI models failed');
    
    // Track emergency fallback
    hybridPerformanceMonitor.trackRequest(
      'emergency_fallback',
      0,
      0,
      false,
      { sessionId, reason: 'all_models_failed', message: message.substring(0, 50) }
    );
    
    // Return pre-defined emergency response
    return {
      model: 'emergency_fallback',
      success: false,
      responseTime: 0,
      failoverUsed: true,
      contextType: 'emergency',
      response: {
        message: "Mi dispiace, sto avendo problemi tecnici. Ti metto immediatamente in contatto con un nostro tecnico che potrà assisterti al meglio. Un momento per favore...",
        intent: 'technical_emergency',
        escalate: true,
        escalationType: 'technical_failure',
        priority: 'immediate',
        emergency: true,
        options: [
          "📞 Chiamata immediata: 039 888 2041",
          "📧 Email urgente: info@it-era.it",
          "🆘 Riprova tra 2 minuti"
        ]
      }
    };
  }

  /**
   * Get failover system status
   */
  getSystemStatus() {
    const modelStatuses = {};
    const circuitBreakerStatuses = {};
    
    for (const [model, health] of this.modelHealth.entries()) {
      const circuitBreaker = this.circuitBreakers.get(model);
      
      modelStatuses[model] = {
        status: health.status,
        consecutiveFailures: health.consecutiveFailures,
        successRate: health.totalRequests > 0 ? 
          Number(((health.successCount / health.totalRequests) * 100).toFixed(2)) : 0,
        avgResponseTime: Math.round(health.avgResponseTime),
        lastSuccess: new Date(health.lastSuccess).toISOString()
      };
      
      circuitBreakerStatuses[model] = {
        state: circuitBreaker.state,
        failures: circuitBreaker.failures,
        nextAttempt: circuitBreaker.nextAttempt > Date.now() ? 
          new Date(circuitBreaker.nextAttempt).toISOString() : null
      };
    }
    
    return {
      status: 'active',
      modelHealth: modelStatuses,
      circuitBreakers: circuitBreakerStatuses,
      failoverRules: Object.keys(this.failoverRules),
      emergencyFallbackAvailable: true,
      lastHealthCheck: new Date().toISOString()
    };
  }

  /**
   * Reset circuit breaker for a model (admin function)
   */
  resetCircuitBreaker(model) {
    const circuitBreaker = this.circuitBreakers.get(model);
    const health = this.modelHealth.get(model);
    
    if (circuitBreaker && health) {
      circuitBreaker.state = 'closed';
      circuitBreaker.failures = 0;
      circuitBreaker.nextAttempt = 0;
      
      health.consecutiveFailures = 0;
      health.status = 'healthy';
      
      console.log(`🔄 Circuit breaker reset for model ${model}`);
      return true;
    }
    
    return false;
  }

  /**
   * Test model connectivity
   */
  async testModelConnectivity(model) {
    try {
      const result = await this.attemptModelRequest(
        model, 
        'Test connection', 
        { test: true }, 
        'connectivity_test', 
        5000
      );
      
      this.recordModelSuccess(model, result.responseTime);
      return {
        model,
        status: 'healthy',
        responseTime: result.responseTime,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      this.recordModelFailure(model, error);
      return {
        model,
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Run health check on all models
   */
  async runHealthCheck() {
    const results = {};
    const models = Array.from(this.modelHealth.keys());
    
    console.log('🔍 Running failover system health check...');
    
    for (const model of models) {
      results[model] = await this.testModelConnectivity(model);
    }
    
    return {
      timestamp: new Date().toISOString(),
      results,
      overallHealth: Object.values(results).every(r => r.status === 'healthy') ? 'healthy' : 'degraded'
    };
  }

  /**
   * Get failover recommendations
   */
  getFailoverRecommendations() {
    const recommendations = [];
    
    for (const [model, health] of this.modelHealth.entries()) {
      const circuitBreaker = this.circuitBreakers.get(model);
      
      // Unhealthy model recommendations
      if (health.status === 'unhealthy') {
        recommendations.push({
          type: 'model_health',
          severity: 'high',
          model,
          message: `Model ${model} is unhealthy with ${health.consecutiveFailures} consecutive failures`,
          action: 'Check model API status and reset circuit breaker if needed'
        });
      }
      
      // Circuit breaker recommendations
      if (circuitBreaker.state === 'open') {
        recommendations.push({
          type: 'circuit_breaker',
          severity: 'medium',
          model,
          message: `Circuit breaker open for ${model}`,
          action: 'Wait for timeout or manually reset if issue is resolved'
        });
      }
      
      // Performance recommendations
      if (health.avgResponseTime > 3000) {
        recommendations.push({
          type: 'performance',
          severity: 'low',
          model,
          message: `Slow response time for ${model}: ${Math.round(health.avgResponseTime)}ms`,
          action: 'Consider adjusting model priority or timeout settings'
        });
      }
    }
    
    return recommendations;
  }
}

// Create singleton instance
const hybridFailoverSystem = new HybridFailoverSystem();

export { hybridFailoverSystem, HybridFailoverSystem };
export default hybridFailoverSystem;