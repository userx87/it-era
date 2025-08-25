/**
 * Comprehensive Retry Handler with Exponential Backoff
 * Handles transient failures with intelligent retry strategies
 */

export class RetryHandler {
  constructor(options = {}) {
    this.maxAttempts = options.maxAttempts || 3;
    this.baseDelayMs = options.baseDelayMs || 1000;
    this.maxDelayMs = options.maxDelayMs || 30000;
    this.backoffMultiplier = options.backoffMultiplier || 2;
    this.jitterMs = options.jitterMs || 100;
    this.retryableErrors = options.retryableErrors || [
      'ETIMEDOUT',
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED',
      'EPIPE',
      'EHOSTUNREACH',
      'EAI_AGAIN'
    ];
    this.nonRetryableErrors = options.nonRetryableErrors || [
      'ENOENT',
      'EACCES',
      'EPERM'
    ];
    
    this.stats = {
      totalAttempts: 0,
      successfulRetries: 0,
      failedRetries: 0,
      retriesByAttempt: {},
      errorTypes: {}
    };
  }

  async execute(asyncFunction, context = {}) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      this.stats.totalAttempts++;
      
      try {
        const result = await asyncFunction();
        
        if (attempt > 1) {
          this.stats.successfulRetries++;
          console.log(`✅ Retry successful on attempt ${attempt}/${this.maxAttempts}`);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        this.updateStats(attempt, error);
        
        console.warn(`❌ Attempt ${attempt}/${this.maxAttempts} failed:`, {
          error: error.message,
          code: error.code,
          context: context.operation || 'unknown'
        });
        
        // Check if error is retryable
        if (!this.isRetryable(error)) {
          console.error('🚫 Non-retryable error encountered:', error.code || error.message);
          throw error;
        }
        
        // Don't wait after last attempt
        if (attempt < this.maxAttempts) {
          const delay = this.calculateDelay(attempt);
          console.log(`⏳ Waiting ${delay}ms before retry ${attempt + 1}...`);
          await this.sleep(delay);
        }
      }
    }
    
    this.stats.failedRetries++;
    console.error(`❌ All ${this.maxAttempts} attempts failed for ${context.operation || 'unknown operation'}`);
    throw new RetryExhaustedException(
      `Failed after ${this.maxAttempts} attempts: ${lastError.message}`,
      lastError,
      this.maxAttempts
    );
  }

  isRetryable(error) {
    // Check for specific non-retryable errors first
    if (this.nonRetryableErrors.includes(error.code)) {
      return false;
    }
    
    // HTTP status codes
    if (error.status) {
      // Don't retry client errors (4xx) except specific ones
      if (error.status >= 400 && error.status < 500) {
        return [408, 429].includes(error.status); // Timeout, Rate limited
      }
      // Retry server errors (5xx)
      if (error.status >= 500) {
        return true;
      }
    }
    
    // Network/connection errors
    if (this.retryableErrors.includes(error.code)) {
      return true;
    }
    
    // AI service specific errors
    if (error.message) {
      const retryableMessages = [
        'timeout',
        'rate limit',
        'service unavailable',
        'internal error',
        'temporary failure',
        'connection reset',
        'socket hang up'
      ];
      
      const message = error.message.toLowerCase();
      return retryableMessages.some(msg => message.includes(msg));
    }
    
    return false;
  }

  calculateDelay(attempt) {
    // Exponential backoff with jitter
    const exponentialDelay = this.baseDelayMs * Math.pow(this.backoffMultiplier, attempt - 1);
    const jitter = Math.random() * this.jitterMs;
    const totalDelay = Math.min(exponentialDelay + jitter, this.maxDelayMs);
    
    return Math.floor(totalDelay);
  }

  updateStats(attempt, error) {
    // Track attempts
    const attemptKey = `attempt_${attempt}`;
    this.stats.retriesByAttempt[attemptKey] = (this.stats.retriesByAttempt[attemptKey] || 0) + 1;
    
    // Track error types
    const errorType = error.code || error.constructor.name || 'unknown';
    this.stats.errorTypes[errorType] = (this.stats.errorTypes[errorType] || 0) + 1;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.totalAttempts > 0 
        ? ((this.stats.totalAttempts - this.stats.failedRetries) / this.stats.totalAttempts * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  reset() {
    this.stats = {
      totalAttempts: 0,
      successfulRetries: 0,
      failedRetries: 0,
      retriesByAttempt: {},
      errorTypes: {}
    };
  }
}

/**
 * Custom Exception for Retry Exhaustion
 */
export class RetryExhaustedException extends Error {
  constructor(message, originalError, maxAttempts) {
    super(message);
    this.name = 'RetryExhaustedException';
    this.originalError = originalError;
    this.maxAttempts = maxAttempts;
  }
}

/**
 * Retry Configuration Presets
 */
export const RetryPresets = {
  // Fast failures for real-time operations
  AGGRESSIVE: {
    maxAttempts: 5,
    baseDelayMs: 500,
    maxDelayMs: 5000,
    backoffMultiplier: 1.5
  },
  
  // Standard retry for most operations
  STANDARD: {
    maxAttempts: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2
  },
  
  // Conservative approach for expensive operations
  CONSERVATIVE: {
    maxAttempts: 2,
    baseDelayMs: 2000,
    maxDelayMs: 15000,
    backoffMultiplier: 3
  },
  
  // For critical operations that must succeed
  PERSISTENT: {
    maxAttempts: 7,
    baseDelayMs: 1000,
    maxDelayMs: 60000,
    backoffMultiplier: 1.8
  }
};

// Global retry handler instances
export const retryHandlers = {
  aggressive: new RetryHandler(RetryPresets.AGGRESSIVE),
  standard: new RetryHandler(RetryPresets.STANDARD),
  conservative: new RetryHandler(RetryPresets.CONSERVATIVE),
  persistent: new RetryHandler(RetryPresets.PERSISTENT)
};