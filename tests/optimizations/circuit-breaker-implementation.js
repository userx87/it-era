/**
 * IMMEDIATE FIX #2: Circuit Breaker Pattern
 * Deploy: 24 hours
 * Impact: Fast-fail for broken services, better UX
 */

class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.timeout = options.timeout || 60000; // 1 minute
    this.resetTimeout = options.resetTimeout || 30000; // 30 seconds
    this.monitoringPeriod = options.monitoringPeriod || 10000; // 10 seconds
    this.expectedErrors = options.expectedErrors || [];
    
    // State tracking
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailTime = null;
    this.successCount = 0;
    this.nextAttempt = null;
    
    // Metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      timeouts: 0,
      circuitOpenCount: 0,
      lastReset: Date.now()
    };

    // Auto-reset timer
    this.resetTimer = null;
  }

  async execute(operation, fallback = null) {
    this.metrics.totalRequests++;

    // Check if circuit should be closed
    if (this.state === 'OPEN') {
      if (this.canAttemptReset()) {
        this.state = 'HALF_OPEN';
        console.log('🔄 Circuit breaker moving to HALF_OPEN state');
      } else {
        this.metrics.circuitOpenCount++;
        console.warn('⛔ Circuit breaker is OPEN - using fallback');
        return this.handleFallback(fallback, 'Circuit breaker is OPEN');
      }
    }

    try {
      const result = await this.executeWithTimeout(operation);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      return this.handleFallback(fallback, error.message);
    }
  }

  async executeWithTimeout(operation, customTimeout = null) {
    const timeout = customTimeout || this.timeout;
    
    return new Promise(async (resolve, reject) => {
      const timer = setTimeout(() => {
        this.metrics.timeouts++;
        reject(new Error(`Operation timeout after ${timeout}ms`));
      }, timeout);

      try {
        const result = await operation();
        clearTimeout(timer);
        resolve(result);
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  onSuccess() {
    this.failureCount = 0;
    this.successCount++;
    this.metrics.successfulRequests++;

    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      console.log('✅ Circuit breaker reset to CLOSED state');
    }
  }

  onFailure(error) {
    this.failureCount++;
    this.lastFailTime = Date.now();
    this.metrics.failedRequests++;

    console.warn(`🚨 Circuit breaker failure ${this.failureCount}/${this.failureThreshold}:`, error.message);

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
      console.error('⛔ Circuit breaker opened due to failures');
      
      // Schedule automatic reset attempt
      this.scheduleReset();
    }
  }

  canAttemptReset() {
    return this.state === 'OPEN' && Date.now() >= this.nextAttempt;
  }

  scheduleReset() {
    if (this.resetTimer) clearTimeout(this.resetTimer);
    
    this.resetTimer = setTimeout(() => {
      if (this.state === 'OPEN') {
        console.log('🔄 Circuit breaker attempting automatic reset...');
        // The next request will trigger HALF_OPEN state
      }
    }, this.resetTimeout);
  }

  handleFallback(fallback, reason) {
    if (typeof fallback === 'function') {
      try {
        return fallback(reason);
      } catch (error) {
        console.error('Fallback execution failed:', error);
        throw new Error(`Primary operation failed: ${reason}, Fallback also failed: ${error.message}`);
      }
    }
    
    if (fallback !== null) {
      return fallback;
    }

    throw new Error(`Circuit breaker blocked operation: ${reason}`);
  }

  // Manual controls
  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailTime = null;
    this.nextAttempt = null;
    
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
    
    console.log('🔄 Circuit breaker manually reset');
  }

  forceOpen() {
    this.state = 'OPEN';
    this.nextAttempt = Date.now() + this.resetTimeout;
    console.log('⛔ Circuit breaker manually opened');
  }

  getMetrics() {
    const uptime = Date.now() - this.metrics.lastReset;
    const successRate = this.metrics.totalRequests > 0 
      ? (this.metrics.successfulRequests / this.metrics.totalRequests * 100).toFixed(2)
      : 0;

    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      failureThreshold: this.failureThreshold,
      nextAttempt: this.nextAttempt,
      uptime: uptime,
      successRate: `${successRate}%`,
      ...this.metrics
    };
  }
}

// Circuit breakers for different services
class ChatbotCircuitBreakers {
  constructor() {
    // AI Service Circuit Breaker
    this.aiCircuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      timeout: 3000,        // 3 seconds max for AI
      resetTimeout: 30000,  // 30 seconds recovery
      expectedErrors: ['timeout', 'rate_limit', 'model_overloaded']
    });

    // Swarm Orchestration Circuit Breaker  
    this.swarmCircuitBreaker = new CircuitBreaker({
      failureThreshold: 2,  // More sensitive
      timeout: 2500,        // 2.5 seconds max for swarm
      resetTimeout: 60000,  // 1 minute recovery
      expectedErrors: ['agent_timeout', 'consensus_failed', 'coordination_error']
    });

    // External API Circuit Breaker (Teams, Email, etc.)
    this.externalApiCircuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      timeout: 5000,        // 5 seconds for external APIs
      resetTimeout: 120000, // 2 minutes recovery
      expectedErrors: ['network_error', 'service_unavailable', 'timeout']
    });

    // KV Storage Circuit Breaker
    this.kvCircuitBreaker = new CircuitBreaker({
      failureThreshold: 10, // More tolerant
      timeout: 1000,        // 1 second max for KV
      resetTimeout: 15000,  // 15 seconds recovery
      expectedErrors: ['storage_error', 'quota_exceeded']
    });
  }

  // Enhanced AI call with circuit breaker
  async executeAICall(operation, fallback = null) {
    return await this.aiCircuitBreaker.execute(operation, fallback);
  }

  // Enhanced Swarm call with circuit breaker
  async executeSwarmCall(operation, fallback = null) {
    return await this.swarmCircuitBreaker.execute(operation, fallback);
  }

  // Enhanced external API call with circuit breaker
  async executeExternalCall(operation, fallback = null) {
    return await this.externalApiCircuitBreaker.execute(operation, fallback);
  }

  // Enhanced KV operation with circuit breaker
  async executeKVOperation(operation, fallback = null) {
    return await this.kvCircuitBreaker.execute(operation, fallback);
  }

  // Get comprehensive metrics
  getAllMetrics() {
    return {
      ai: this.aiCircuitBreaker.getMetrics(),
      swarm: this.swarmCircuitBreaker.getMetrics(),
      externalApi: this.externalApiCircuitBreaker.getMetrics(),
      kv: this.kvCircuitBreaker.getMetrics()
    };
  }

  // Health check for all services
  getHealthStatus() {
    const metrics = this.getAllMetrics();
    
    return {
      overall: Object.values(metrics).every(m => m.state !== 'OPEN') ? 'healthy' : 'degraded',
      services: {
        ai: { status: metrics.ai.state, successRate: metrics.ai.successRate },
        swarm: { status: metrics.swarm.state, successRate: metrics.swarm.successRate },
        externalApi: { status: metrics.externalApi.state, successRate: metrics.externalApi.successRate },
        kv: { status: metrics.kv.state, successRate: metrics.kv.successRate }
      }
    };
  }

  // Reset all circuit breakers
  resetAll() {
    this.aiCircuitBreaker.reset();
    this.swarmCircuitBreaker.reset();
    this.externalApiCircuitBreaker.reset();
    this.kvCircuitBreaker.reset();
    console.log('🔄 All circuit breakers reset');
  }
}

// Global instance
let globalCircuitBreakers = null;

function initializeCircuitBreakers() {
  if (!globalCircuitBreakers) {
    globalCircuitBreakers = new ChatbotCircuitBreakers();
    console.log('✅ Circuit breakers initialized');
  }
  return globalCircuitBreakers;
}

// Enhanced response generation with circuit breakers
async function generateResponseWithCircuitBreakers(message, intent, context = {}, env = null, sessionId = null) {
  const circuitBreakers = initializeCircuitBreakers();
  const startTime = Date.now();

  try {
    // Try Swarm with circuit breaker
    if (swarmIntegration && env && sessionId) {
      try {
        const swarmResponse = await circuitBreakers.executeSwarmCall(
          async () => {
            return await swarmIntegration.processMessage(sessionId, message, {
              messages: context.messages || [],
              context: context,
              intent: intent
            });
          },
          null // No fallback, let it fail fast
        );

        if (swarmResponse && swarmResponse.response) {
          console.log('✅ Swarm response via circuit breaker');
          return {
            message: swarmResponse.response,
            options: swarmResponse.suggestedActions || getDefaultOptions(intent),
            source: 'swarm_protected',
            fallback: false,
            metadata: swarmResponse.metadata,
            leadScore: swarmResponse.leadScore,
            processingTime: Date.now() - startTime
          };
        }
      } catch (error) {
        console.warn('Swarm circuit breaker failed:', error.message);
      }
    }

    // Try AI with circuit breaker
    if (CONFIG.AI_ENABLED && aiEngine && env) {
      try {
        const aiResponse = await circuitBreakers.executeAICall(
          async () => {
            return await generateAIResponseWithTimeout(message, context, sessionId, 2000);
          },
          null // No fallback, let it fail fast
        );

        if (aiResponse && aiResponse.message) {
          console.log('✅ AI response via circuit breaker');
          return {
            ...aiResponse,
            source: 'ai_protected',
            fallback: false,
            processingTime: Date.now() - startTime
          };
        }
      } catch (error) {
        console.warn('AI circuit breaker failed:', error.message);
      }
    }

    // Fallback to rule-based (always available)
    console.log('🔄 Using rule-based fallback');
    const fallbackResponse = generateFallbackResponse(message, intent, context);
    return {
      ...fallbackResponse,
      source: 'fallback_protected',
      fallback: true,
      processingTime: Date.now() - startTime
    };

  } catch (error) {
    console.error('All response generation failed:', error);
    
    // Emergency fallback
    return {
      message: "Mi dispiace, tutti i nostri sistemi sono temporaneamente sovraccarichi. Ti prego di contattarci direttamente al 039 888 2041.",
      options: ["📞 Chiama 039 888 2041", "📧 info@it-era.it", "🔄 Riprova tra un minuto"],
      source: 'emergency_fallback',
      fallback: true,
      error: true,
      processingTime: Date.now() - startTime
    };
  }
}

export {
  CircuitBreaker,
  ChatbotCircuitBreakers,
  initializeCircuitBreakers,
  generateResponseWithCircuitBreakers
};