/**
 * Comprehensive Health Monitoring System
 * Monitors all system components and provides detailed health status
 */

export class HealthMonitor {
  constructor(options = {}) {
    this.checkInterval = options.checkInterval || 30000; // 30 seconds
    this.healthChecks = new Map();
    this.healthHistory = [];
    this.maxHistorySize = options.maxHistorySize || 100;
    this.alertThreshold = options.alertThreshold || 3; // Failed checks before alert
    this.isMonitoring = false;
    this.monitoringInterval = null;
    
    this.stats = {
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: 0,
      alertsSent: 0,
      lastCheck: null,
      systemStartTime: Date.now()
    };
  }

  /**
   * Register a health check
   */
  registerHealthCheck(name, checkFunction, options = {}) {
    this.healthChecks.set(name, {
      name,
      checkFunction,
      timeout: options.timeout || 5000,
      critical: options.critical || false,
      failureCount: 0,
      lastResult: null,
      lastCheck: null,
      enabled: options.enabled !== false
    });
    
    console.log(`🩺 Health check registered: ${name} ${options.critical ? '(CRITICAL)' : ''}`);
  }

  /**
   * Start continuous health monitoring
   */
  startMonitoring() {
    if (this.isMonitoring) {
      console.warn('Health monitoring already running');
      return;
    }

    this.isMonitoring = true;
    console.log('🚀 Starting health monitoring...');
    
    // Initial check
    this.runAllHealthChecks();
    
    // Schedule regular checks
    this.monitoringInterval = setInterval(async () => {
      await this.runAllHealthChecks();
    }, this.checkInterval);
  }

  /**
   * Stop health monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    console.log('🛑 Health monitoring stopped');
  }

  /**
   * Run all registered health checks
   */
  async runAllHealthChecks() {
    const checkTime = new Date();
    const results = {};
    let overallHealthy = true;
    let criticalFailures = 0;

    this.stats.lastCheck = checkTime.toISOString();

    for (const [name, check] of this.healthChecks) {
      if (!check.enabled) {
        results[name] = {
          status: 'DISABLED',
          message: 'Health check disabled',
          timestamp: checkTime.toISOString()
        };
        continue;
      }

      try {
        const result = await this.runSingleHealthCheck(name, check);
        results[name] = result;

        if (result.status !== 'HEALTHY') {
          overallHealthy = false;
          if (check.critical) {
            criticalFailures++;
          }
        }
      } catch (error) {
        const errorResult = {
          status: 'ERROR',
          message: `Health check failed: ${error.message}`,
          error: error.code || error.name,
          timestamp: checkTime.toISOString(),
          duration: 0
        };
        
        results[name] = errorResult;
        overallHealthy = false;
        
        if (check.critical) {
          criticalFailures++;
        }
      }
    }

    // Overall system status
    let systemStatus = 'HEALTHY';
    if (criticalFailures > 0) {
      systemStatus = 'CRITICAL';
    } else if (!overallHealthy) {
      systemStatus = 'DEGRADED';
    }

    const healthReport = {
      status: systemStatus,
      timestamp: checkTime.toISOString(),
      uptime: Date.now() - this.stats.systemStartTime,
      checks: results,
      summary: {
        total: this.healthChecks.size,
        healthy: Object.values(results).filter(r => r.status === 'HEALTHY').length,
        unhealthy: Object.values(results).filter(r => r.status !== 'HEALTHY' && r.status !== 'DISABLED').length,
        disabled: Object.values(results).filter(r => r.status === 'DISABLED').length,
        critical: criticalFailures
      }
    };

    // Store in history
    this.healthHistory.unshift(healthReport);
    if (this.healthHistory.length > this.maxHistorySize) {
      this.healthHistory.pop();
    }

    // Handle alerts
    if (systemStatus !== 'HEALTHY') {
      await this.handleHealthAlert(healthReport);
    }

    console.log(`🩺 Health check completed: ${systemStatus} (${healthReport.summary.healthy}/${healthReport.summary.total} healthy)`);
    
    return healthReport;
  }

  /**
   * Run a single health check with timeout
   */
  async runSingleHealthCheck(name, check) {
    const startTime = Date.now();
    this.stats.totalChecks++;

    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Health check timeout')), check.timeout);
      });

      // Run the health check with timeout
      const result = await Promise.race([
        check.checkFunction(),
        timeoutPromise
      ]);

      const duration = Date.now() - startTime;
      
      // Success
      check.failureCount = 0;
      check.lastCheck = new Date().toISOString();
      this.stats.passedChecks++;

      const healthResult = {
        status: result?.status || 'HEALTHY',
        message: result?.message || 'OK',
        data: result?.data || {},
        duration,
        timestamp: check.lastCheck
      };

      check.lastResult = healthResult;
      return healthResult;

    } catch (error) {
      const duration = Date.now() - startTime;
      check.failureCount++;
      check.lastCheck = new Date().toISOString();
      this.stats.failedChecks++;

      const errorResult = {
        status: 'UNHEALTHY',
        message: error.message || 'Health check failed',
        error: error.code || error.name,
        duration,
        timestamp: check.lastCheck,
        failureCount: check.failureCount
      };

      check.lastResult = errorResult;
      return errorResult;
    }
  }

  /**
   * Handle health alerts
   */
  async handleHealthAlert(healthReport) {
    this.stats.alertsSent++;
    
    console.error(`🚨 HEALTH ALERT: System status is ${healthReport.status}`, {
      critical: healthReport.summary.critical,
      unhealthy: healthReport.summary.unhealthy,
      total: healthReport.summary.total
    });

    // Here you could integrate with alerting systems like:
    // - Slack/Teams webhooks
    // - Email notifications  
    // - PagerDuty
    // - CloudWatch/DataDog
    
    // For now, just log the alert
    const criticalServices = Object.entries(healthReport.checks)
      .filter(([name, result]) => result.status !== 'HEALTHY' && this.healthChecks.get(name)?.critical)
      .map(([name, result]) => ({ service: name, status: result.status, message: result.message }));

    if (criticalServices.length > 0) {
      console.error('🔥 CRITICAL SERVICES DOWN:', criticalServices);
    }
  }

  /**
   * Get current health status
   */
  async getCurrentHealth() {
    if (this.healthHistory.length === 0) {
      return await this.runAllHealthChecks();
    }
    return this.healthHistory[0];
  }

  /**
   * Get health statistics
   */
  getHealthStats() {
    const uptime = Date.now() - this.stats.systemStartTime;
    const uptimeHours = (uptime / (1000 * 60 * 60)).toFixed(2);
    
    return {
      ...this.stats,
      uptime,
      uptimeHours: `${uptimeHours} hours`,
      successRate: this.stats.totalChecks > 0 
        ? ((this.stats.passedChecks / this.stats.totalChecks) * 100).toFixed(2) + '%'
        : '0%',
      isMonitoring: this.isMonitoring,
      registeredChecks: this.healthChecks.size
    };
  }

  /**
   * Get health history
   */
  getHealthHistory(limit = 10) {
    return this.healthHistory.slice(0, limit);
  }

  /**
   * Enable/disable a health check
   */
  toggleHealthCheck(name, enabled) {
    const check = this.healthChecks.get(name);
    if (check) {
      check.enabled = enabled;
      console.log(`Health check ${name} ${enabled ? 'enabled' : 'disabled'}`);
      return true;
    }
    return false;
  }

  /**
   * Remove a health check
   */
  removeHealthCheck(name) {
    const removed = this.healthChecks.delete(name);
    if (removed) {
      console.log(`Health check ${name} removed`);
    }
    return removed;
  }
}

/**
 * Pre-built health checks for common services
 */
export const CommonHealthChecks = {
  
  // Memory usage check
  memoryUsage: (maxUsageMB = 512) => async () => {
    if (typeof process === 'undefined') {
      return { status: 'HEALTHY', message: 'Memory check not available in this environment' };
    }
    
    const usage = process.memoryUsage();
    const usedMB = Math.round(usage.heapUsed / 1024 / 1024);
    
    if (usedMB > maxUsageMB) {
      return {
        status: 'UNHEALTHY',
        message: `High memory usage: ${usedMB}MB > ${maxUsageMB}MB`,
        data: { usedMB, maxMB: maxUsageMB, ...usage }
      };
    }
    
    return {
      status: 'HEALTHY',
      message: `Memory usage: ${usedMB}MB`,
      data: { usedMB, maxMB: maxUsageMB, ...usage }
    };
  },

  // Database connection check
  database: (connectionFn) => async () => {
    try {
      await connectionFn();
      return { status: 'HEALTHY', message: 'Database connection OK' };
    } catch (error) {
      return {
        status: 'UNHEALTHY',
        message: `Database connection failed: ${error.message}`,
        data: { error: error.code }
      };
    }
  },

  // HTTP endpoint check
  httpEndpoint: (url, timeout = 5000) => async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return {
          status: 'HEALTHY',
          message: `HTTP endpoint OK (${response.status})`,
          data: { status: response.status, url }
        };
      } else {
        return {
          status: 'UNHEALTHY',
          message: `HTTP endpoint failed (${response.status})`,
          data: { status: response.status, url }
        };
      }
    } catch (error) {
      return {
        status: 'UNHEALTHY',
        message: `HTTP endpoint error: ${error.message}`,
        data: { error: error.name, url }
      };
    }
  },

  // AI service check
  aiService: (aiEngine) => async () => {
    try {
      if (!aiEngine) {
        return { status: 'UNHEALTHY', message: 'AI engine not initialized' };
      }
      
      const healthCheck = await aiEngine.healthCheck();
      return {
        status: healthCheck.status === 'healthy' ? 'HEALTHY' : 'UNHEALTHY',
        message: healthCheck.message || 'AI service check completed',
        data: healthCheck
      };
    } catch (error) {
      return {
        status: 'UNHEALTHY',
        message: `AI service error: ${error.message}`,
        data: { error: error.code }
      };
    }
  }
};

// Global health monitor instance
export const healthMonitor = new HealthMonitor();