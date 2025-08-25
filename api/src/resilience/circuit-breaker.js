/**
 * Circuit Breaker Pattern Implementation
 * Protects external services from cascading failures
 */

export class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.timeout = options.timeout || 60000; // 1 minute
    this.resetTimeout = options.resetTimeout || 30000; // 30 seconds
    this.monitoringPeriod = options.monitoringPeriod || 10000; // 10 seconds
    
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now();
    this.successCount = 0;
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      circuitOpenEvents: 0,
      circuitHalfOpenEvents: 0,
      circuitClosedEvents: 0
    };
  }

  async execute(asyncFunction, fallbackFunction = null) {
    this.stats.totalRequests++;
    
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        console.warn(`Circuit breaker OPEN - executing fallback`);
        return this.executeFallback(fallbackFunction);
      } else {
        this.state = 'HALF_OPEN';
        this.stats.circuitHalfOpenEvents++;
        console.log('Circuit breaker entering HALF_OPEN state');
      }
    }

    try {
      const result = await this.callWithTimeout(asyncFunction);
      return this.onSuccess(result);
    } catch (error) {
      return this.onFailure(error, fallbackFunction);
    }
  }

  async callWithTimeout(asyncFunction) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Circuit breaker timeout')), this.timeout);
    });

    return Promise.race([asyncFunction(), timeoutPromise]);
  }

  onSuccess(result) {
    this.failureCount = 0;
    this.stats.successfulRequests++;
    
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= 3) { // Require 3 successes to close
        this.state = 'CLOSED';
        this.successCount = 0;
        this.stats.circuitClosedEvents++;
        console.log('Circuit breaker CLOSED - service recovered');
      }
    }
    
    return result;
  }

  onFailure(error, fallbackFunction) {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.stats.failedRequests++;
    
    console.error(`Circuit breaker failure ${this.failureCount}/${this.failureThreshold}:`, error.message);
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
      this.stats.circuitOpenEvents++;
      console.error('Circuit breaker OPEN - service unavailable');
    }
    
    return this.executeFallback(fallbackFunction);
  }

  executeFallback(fallbackFunction) {
    if (fallbackFunction) {
      try {
        return fallbackFunction();
      } catch (fallbackError) {
        console.error('Fallback function failed:', fallbackError);
        throw new Error('Both primary service and fallback failed');
      }
    }
    throw new Error('Service unavailable and no fallback provided');
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      nextAttempt: this.nextAttempt,
      stats: { ...this.stats }
    };
  }

  reset() {
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED';
    this.nextAttempt = Date.now();
    this.successCount = 0;
    console.log('Circuit breaker manually reset');
  }

  isHealthy() {
    return this.state === 'CLOSED';
  }
}

/**
 * Circuit Breaker Manager - Manages multiple circuit breakers
 */
export class CircuitBreakerManager {
  constructor() {
    this.breakers = new Map();
  }

  getBreaker(serviceName, options = {}) {
    if (!this.breakers.has(serviceName)) {
      this.breakers.set(serviceName, new CircuitBreaker({
        failureThreshold: 3,
        timeout: 5000,
        resetTimeout: 30000,
        ...options
      }));
    }
    return this.breakers.get(serviceName);
  }

  getAllStates() {
    const states = {};
    for (const [name, breaker] of this.breakers) {
      states[name] = breaker.getState();
    }
    return states;
  }

  getHealthStatus() {
    const healthy = [];
    const unhealthy = [];
    
    for (const [name, breaker] of this.breakers) {
      if (breaker.isHealthy()) {
        healthy.push(name);
      } else {
        unhealthy.push({
          service: name,
          state: breaker.getState()
        });
      }
    }
    
    return {
      healthy,
      unhealthy,
      overallHealth: unhealthy.length === 0 ? 'HEALTHY' : 'DEGRADED'
    };
  }

  resetAll() {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
    console.log('All circuit breakers reset');
  }
}

// Global circuit breaker manager instance
export const circuitBreakerManager = new CircuitBreakerManager();