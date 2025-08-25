/**
 * Advanced Rate Limiter for IT-ERA Authentication System
 * Implements sophisticated rate limiting with DDoS protection
 */

export class AdvancedRateLimiter {
  constructor(env) {
    this.env = env;
    this.config = {
      // Basic rate limits (requests per window)
      login: { limit: 5, window: 900 },        // 5 login attempts per 15 minutes
      api: { limit: 100, window: 3600 },       // 100 API calls per hour
      token: { limit: 10, window: 300 },       // 10 token requests per 5 minutes
      
      // Burst protection
      burst: { limit: 20, window: 60 },        // 20 requests per minute max
      
      // DDoS protection
      ddos: { limit: 1000, window: 60 },       // 1000 requests per minute triggers DDoS
      
      // Progressive penalties
      progressive: {
        enabled: true,
        multiplier: 2,
        maxMultiplier: 16,
        baseWindow: 300
      }
    };
  }

  /**
   * Check rate limit for a given identifier and action
   */
  async checkRateLimit(identifier, action = 'api', metadata = {}) {
    try {
      const key = this.generateKey(identifier, action);
      const config = this.config[action] || this.config.api;
      
      // Check multiple rate limiting strategies
      const checks = await Promise.all([
        this.checkBasicRateLimit(key, config, metadata),
        this.checkBurstProtection(identifier, metadata),
        this.checkDDoSProtection(identifier, metadata),
        this.checkProgressivePenalty(identifier, action, metadata)
      ]);

      // Find the most restrictive result
      const restrictive = checks.find(check => !check.allowed) || checks[0];
      
      // Log suspicious activity
      if (!restrictive.allowed) {
        await this.logSuspiciousActivity(identifier, action, restrictive, metadata);
      }

      // Update rate limit counters
      if (restrictive.allowed) {
        await this.updateCounters(identifier, action, metadata);
      }

      return this.formatResponse(restrictive, action);

    } catch (error) {
      console.error('Rate limiting error:', error);
      // Fail open for availability, but log the error
      await this.logError('RATE_LIMIT_ERROR', error, { identifier, action });
      return this.createAllowedResponse();
    }
  }

  /**
   * Basic sliding window rate limiting
   */
  async checkBasicRateLimit(key, config, metadata) {
    const windowKey = `${key}:${Math.floor(Date.now() / (config.window * 1000))}`;
    const current = await this.env.AUTH_SESSIONS?.get(windowKey);
    
    let count = 0;
    if (current) {
      const data = JSON.parse(current);
      count = data.count;
    }

    if (count >= config.limit) {
      return {
        allowed: false,
        reason: 'RATE_LIMIT_EXCEEDED',
        remaining: 0,
        resetTime: (Math.floor(Date.now() / (config.window * 1000)) + 1) * config.window * 1000,
        retryAfter: config.window
      };
    }

    return {
      allowed: true,
      remaining: config.limit - count - 1,
      resetTime: (Math.floor(Date.now() / (config.window * 1000)) + 1) * config.window * 1000,
      retryAfter: 0
    };
  }

  /**
   * Burst protection - prevents rapid-fire requests
   */
  async checkBurstProtection(identifier, metadata) {
    const key = `burst:${identifier}`;
    const window = this.config.burst.window;
    const limit = this.config.burst.limit;
    
    // Get recent timestamps
    const timestamps = await this.getRecentTimestamps(key, window);
    
    if (timestamps.length >= limit) {
      const oldestTimestamp = Math.min(...timestamps);
      const timeToWait = window - ((Date.now() - oldestTimestamp) / 1000);
      
      return {
        allowed: false,
        reason: 'BURST_PROTECTION',
        remaining: 0,
        resetTime: Date.now() + (timeToWait * 1000),
        retryAfter: Math.ceil(timeToWait)
      };
    }

    return { allowed: true, remaining: limit - timestamps.length };
  }

  /**
   * DDoS protection - detects and mitigates distributed attacks
   */
  async checkDDoSProtection(identifier, metadata) {
    const window = this.config.ddos.window;
    const limit = this.config.ddos.limit;
    
    // Check if IP is already marked as DDoS source
    const ddosKey = `ddos:${identifier}`;
    const ddosStatus = await this.env.AUTH_SESSIONS?.get(ddosKey);
    
    if (ddosStatus) {
      const data = JSON.parse(ddosStatus);
      return {
        allowed: false,
        reason: 'DDOS_PROTECTION',
        remaining: 0,
        resetTime: data.resetTime,
        retryAfter: Math.ceil((data.resetTime - Date.now()) / 1000)
      };
    }

    // Check current request rate
    const timestamps = await this.getRecentTimestamps(`ddos_check:${identifier}`, window);
    
    if (timestamps.length >= limit) {
      // Mark as DDoS source for extended period
      const banDuration = 3600; // 1 hour
      const resetTime = Date.now() + (banDuration * 1000);
      
      await this.env.AUTH_SESSIONS?.put(ddosKey, JSON.stringify({
        detectedAt: Date.now(),
        resetTime,
        requestCount: timestamps.length
      }), {
        expirationTtl: banDuration
      });

      // Alert security team
      await this.alertSecurityTeam('DDOS_DETECTED', {
        identifier,
        requestCount: timestamps.length,
        timeWindow: window,
        banDuration
      });

      return {
        allowed: false,
        reason: 'DDOS_DETECTED',
        remaining: 0,
        resetTime,
        retryAfter: banDuration
      };
    }

    return { allowed: true, remaining: limit - timestamps.length };
  }

  /**
   * Progressive penalty - increases penalty time for repeat offenders
   */
  async checkProgressivePenalty(identifier, action, metadata) {
    if (!this.config.progressive.enabled) {
      return { allowed: true };
    }

    const penaltyKey = `penalty:${identifier}:${action}`;
    const penaltyData = await this.env.AUTH_SESSIONS?.get(penaltyKey);
    
    if (!penaltyData) {
      return { allowed: true };
    }

    const penalty = JSON.parse(penaltyData);
    const now = Date.now();
    
    if (now < penalty.resetTime) {
      return {
        allowed: false,
        reason: 'PROGRESSIVE_PENALTY',
        remaining: 0,
        resetTime: penalty.resetTime,
        retryAfter: Math.ceil((penalty.resetTime - now) / 1000),
        penaltyLevel: penalty.level
      };
    }

    return { allowed: true };
  }

  /**
   * Apply progressive penalty for rate limit violations
   */
  async applyProgressivePenalty(identifier, action, currentViolation) {
    if (!this.config.progressive.enabled) return;

    const penaltyKey = `penalty:${identifier}:${action}`;
    const existingPenalty = await this.env.AUTH_SESSIONS?.get(penaltyKey);
    
    let level = 1;
    if (existingPenalty) {
      const data = JSON.parse(existingPenalty);
      level = Math.min(data.level + 1, this.config.progressive.maxMultiplier);
    }

    const penaltyDuration = this.config.progressive.baseWindow * Math.pow(this.config.progressive.multiplier, level - 1);
    const resetTime = Date.now() + (penaltyDuration * 1000);

    await this.env.AUTH_SESSIONS?.put(penaltyKey, JSON.stringify({
      level,
      resetTime,
      appliedAt: Date.now(),
      reason: currentViolation.reason,
      duration: penaltyDuration
    }), {
      expirationTtl: penaltyDuration
    });

    await this.logSecurityEvent('PROGRESSIVE_PENALTY_APPLIED', {
      identifier,
      action,
      level,
      duration: penaltyDuration,
      resetTime: new Date(resetTime).toISOString()
    });
  }

  /**
   * IP reputation scoring
   */
  async updateIPReputation(identifier, action, result) {
    const reputationKey = `reputation:${identifier}`;
    const existing = await this.env.AUTH_SESSIONS?.get(reputationKey);
    
    let reputation = existing ? JSON.parse(existing) : {
      score: 100, // Start with perfect score
      violations: 0,
      lastSeen: Date.now(),
      actions: {}
    };

    // Update reputation based on action result
    if (!result.allowed) {
      reputation.violations++;
      reputation.score = Math.max(0, reputation.score - 10);
      reputation.actions[action] = (reputation.actions[action] || 0) + 1;
    } else {
      // Slowly improve reputation for good behavior
      reputation.score = Math.min(100, reputation.score + 1);
    }

    reputation.lastSeen = Date.now();

    await this.env.AUTH_SESSIONS?.put(reputationKey, JSON.stringify(reputation), {
      expirationTtl: 86400 * 7 // Keep for 7 days
    });

    return reputation.score;
  }

  /**
   * Whitelist management for trusted sources
   */
  async isWhitelisted(identifier, action) {
    const whitelistKey = `whitelist:${identifier}`;
    const result = await this.env.AUTH_SESSIONS?.get(whitelistKey);
    
    if (!result) return false;
    
    const whitelist = JSON.parse(result);
    return whitelist.actions.includes('*') || whitelist.actions.includes(action);
  }

  /**
   * Emergency bypass for critical operations
   */
  async createEmergencyBypass(identifier, duration = 3600, reason = 'EMERGENCY_ACCESS') {
    const bypassKey = `bypass:${identifier}`;
    const resetTime = Date.now() + (duration * 1000);
    
    await this.env.AUTH_SESSIONS?.put(bypassKey, JSON.stringify({
      createdAt: Date.now(),
      resetTime,
      reason,
      duration
    }), {
      expirationTtl: duration
    });

    await this.logSecurityEvent('EMERGENCY_BYPASS_CREATED', {
      identifier,
      duration,
      reason,
      resetTime: new Date(resetTime).toISOString()
    });

    return { success: true, resetTime, reason };
  }

  /**
   * Utility methods
   */
  generateKey(identifier, action) {
    return `rate_limit:${action}:${identifier}`;
  }

  async getRecentTimestamps(key, windowSeconds) {
    try {
      const timestampsData = await this.env.AUTH_SESSIONS?.get(key);
      let timestamps = timestampsData ? JSON.parse(timestampsData) : [];
      
      const cutoff = Date.now() - (windowSeconds * 1000);
      timestamps = timestamps.filter(ts => ts > cutoff);
      
      return timestamps;
    } catch (error) {
      console.error('Error getting timestamps:', error);
      return [];
    }
  }

  async updateCounters(identifier, action, metadata) {
    // Update basic counter
    const key = this.generateKey(identifier, action);
    const config = this.config[action] || this.config.api;
    const windowKey = `${key}:${Math.floor(Date.now() / (config.window * 1000))}`;
    
    const current = await this.env.AUTH_SESSIONS?.get(windowKey);
    const count = current ? JSON.parse(current).count + 1 : 1;
    
    await this.env.AUTH_SESSIONS?.put(windowKey, JSON.stringify({
      count,
      identifier,
      action,
      lastUpdate: Date.now()
    }), {
      expirationTtl: config.window
    });

    // Update burst protection timestamps
    const burstKey = `burst:${identifier}`;
    const timestamps = await this.getRecentTimestamps(burstKey, this.config.burst.window);
    timestamps.push(Date.now());
    
    await this.env.AUTH_SESSIONS?.put(burstKey, JSON.stringify(timestamps), {
      expirationTtl: this.config.burst.window
    });

    // Update DDoS protection timestamps
    const ddosKey = `ddos_check:${identifier}`;
    const ddosTimestamps = await this.getRecentTimestamps(ddosKey, this.config.ddos.window);
    ddosTimestamps.push(Date.now());
    
    await this.env.AUTH_SESSIONS?.put(ddosKey, JSON.stringify(ddosTimestamps), {
      expirationTtl: this.config.ddos.window
    });
  }

  formatResponse(result, action) {
    return {
      allowed: result.allowed,
      remaining: result.remaining || 0,
      resetTime: result.resetTime || Date.now() + 3600000,
      retryAfter: result.retryAfter || 0,
      action,
      reason: result.reason,
      headers: {
        'X-RateLimit-Limit': this.config[action]?.limit || 100,
        'X-RateLimit-Remaining': result.remaining || 0,
        'X-RateLimit-Reset': Math.floor((result.resetTime || Date.now() + 3600000) / 1000),
        'X-RateLimit-RetryAfter': result.retryAfter || 0
      }
    };
  }

  createAllowedResponse() {
    return {
      allowed: true,
      remaining: 999,
      resetTime: Date.now() + 3600000,
      retryAfter: 0,
      headers: {
        'X-RateLimit-Limit': 1000,
        'X-RateLimit-Remaining': 999,
        'X-RateLimit-Reset': Math.floor((Date.now() + 3600000) / 1000),
        'X-RateLimit-RetryAfter': 0
      }
    };
  }

  async logSuspiciousActivity(identifier, action, result, metadata) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event: 'RATE_LIMIT_VIOLATION',
      identifier,
      action,
      reason: result.reason,
      remaining: result.remaining,
      resetTime: result.resetTime,
      metadata,
      userAgent: metadata.userAgent,
      ipAddress: identifier
    };

    const logKey = `security_log:${Date.now()}:${crypto.randomUUID()}`;
    await this.env.AUTH_SESSIONS?.put(logKey, JSON.stringify(logEntry), {
      expirationTtl: 86400 * 30 // Keep logs for 30 days
    });

    // Apply progressive penalty
    await this.applyProgressivePenalty(identifier, action, result);
    
    // Update IP reputation
    await this.updateIPReputation(identifier, action, result);
  }

  async alertSecurityTeam(alertType, data) {
    // This would integrate with your alerting system
    console.warn(`🚨 SECURITY ALERT: ${alertType}`, data);
    
    // Store alert for dashboard
    const alertKey = `alert:${Date.now()}:${crypto.randomUUID()}`;
    await this.env.AUTH_SESSIONS?.put(alertKey, JSON.stringify({
      type: alertType,
      timestamp: new Date().toISOString(),
      data,
      severity: this.getAlertSeverity(alertType)
    }), {
      expirationTtl: 86400 * 7 // Keep alerts for 7 days
    });
  }

  getAlertSeverity(alertType) {
    const severityMap = {
      'DDOS_DETECTED': 'CRITICAL',
      'PROGRESSIVE_PENALTY_APPLIED': 'HIGH',
      'BURST_PROTECTION': 'MEDIUM',
      'RATE_LIMIT_EXCEEDED': 'LOW'
    };
    return severityMap[alertType] || 'MEDIUM';
  }

  async logSecurityEvent(event, data) {
    const logEntry = {
      event,
      data,
      timestamp: new Date().toISOString(),
      service: 'advanced-rate-limiter'
    };

    const key = `security_event:${Date.now()}:${crypto.randomUUID()}`;
    await this.env.AUTH_SESSIONS?.put(key, JSON.stringify(logEntry), {
      expirationTtl: 86400 * 30
    });
  }

  async logError(errorType, error, context) {
    const errorEntry = {
      type: errorType,
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    };

    const key = `error_log:${Date.now()}:${crypto.randomUUID()}`;
    await this.env.AUTH_SESSIONS?.put(key, JSON.stringify(errorEntry), {
      expirationTtl: 86400 * 7
    });
  }
}

export default AdvancedRateLimiter;