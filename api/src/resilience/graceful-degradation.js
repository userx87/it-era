/**
 * Graceful Degradation System
 * Manages service degradation and maintains functionality during failures
 */

export class GracefulDegradationManager {
  constructor(options = {}) {
    this.services = new Map();
    this.degradationLevels = options.degradationLevels || {
      FULL: 0,      // All services operational
      DEGRADED: 1,  // Some services unavailable
      LIMITED: 2,   // Core services only
      EMERGENCY: 3  // Minimal functionality
    };
    
    this.currentLevel = 'FULL';
    this.serviceStates = {};
    this.fallbackStrategies = {};
    
    this.stats = {
      degradationEvents: 0,
      serviceFailures: {},
      totalDowntime: 0,
      lastDegradation: null
    };
  }

  /**
   * Register a service with degradation strategy
   */
  registerService(serviceName, config = {}) {
    this.services.set(serviceName, {
      name: serviceName,
      priority: config.priority || 'MEDIUM', // HIGH, MEDIUM, LOW
      essential: config.essential || false,
      healthCheck: config.healthCheck,
      fallbackStrategy: config.fallbackStrategy || 'DISABLE',
      dependencies: config.dependencies || [],
      state: 'OPERATIONAL',
      lastCheck: null,
      failures: 0,
      degradationLevel: config.degradationLevel || 'DEGRADED'
    });

    this.serviceStates[serviceName] = 'OPERATIONAL';
    console.log(`🔧 Service registered: ${serviceName} (Priority: ${config.priority})`);
  }

  /**
   * Check all service health and adjust degradation level
   */
  async assessSystemHealth() {
    console.log('🔍 Assessing system health...');
    
    const healthResults = {};
    const failedServices = [];
    const criticalFailures = [];

    // Check each service
    for (const [name, service] of this.services) {
      try {
        const isHealthy = await this.checkServiceHealth(name);
        healthResults[name] = isHealthy;
        
        if (!isHealthy) {
          failedServices.push(name);
          if (service.essential || service.priority === 'HIGH') {
            criticalFailures.push(name);
          }
        }
      } catch (error) {
        console.error(`Health check failed for ${name}:`, error);
        healthResults[name] = false;
        failedServices.push(name);
        
        if (service.essential || service.priority === 'HIGH') {
          criticalFailures.push(name);
        }
      }
    }

    // Determine appropriate degradation level
    const newLevel = this.calculateDegradationLevel(failedServices, criticalFailures);
    
    if (newLevel !== this.currentLevel) {
      await this.changeDegradationLevel(newLevel, { 
        failedServices, 
        criticalFailures,
        healthResults 
      });
    }

    return {
      level: this.currentLevel,
      failedServices,
      criticalFailures,
      healthResults,
      totalServices: this.services.size,
      operationalServices: this.services.size - failedServices.length
    };
  }

  /**
   * Check individual service health
   */
  async checkServiceHealth(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) return false;

    const startTime = Date.now();
    
    try {
      if (service.healthCheck) {
        const result = await Promise.race([
          service.healthCheck(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Health check timeout')), 5000)
          )
        ]);
        
        const duration = Date.now() - startTime;
        service.lastCheck = new Date().toISOString();
        service.failures = 0; // Reset on success
        
        console.log(`✅ ${serviceName} healthy (${duration}ms)`);
        return result !== false;
      }
      
      // If no health check, assume operational
      return true;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      service.failures++;
      service.lastCheck = new Date().toISOString();
      
      console.error(`❌ ${serviceName} unhealthy after ${duration}ms:`, error.message);
      
      // Track failure statistics
      if (!this.stats.serviceFailures[serviceName]) {
        this.stats.serviceFailures[serviceName] = 0;
      }
      this.stats.serviceFailures[serviceName]++;
      
      return false;
    }
  }

  /**
   * Calculate appropriate degradation level
   */
  calculateDegradationLevel(failedServices, criticalFailures) {
    // If no failures, system is fully operational
    if (failedServices.length === 0) {
      return 'FULL';
    }

    // If critical services failed, emergency mode
    if (criticalFailures.length > 0) {
      return 'EMERGENCY';
    }

    // Calculate failure percentage
    const failurePercentage = (failedServices.length / this.services.size) * 100;
    
    if (failurePercentage > 50) {
      return 'LIMITED';
    } else if (failurePercentage > 20) {
      return 'DEGRADED';
    }

    return 'FULL';
  }

  /**
   * Change degradation level and apply strategies
   */
  async changeDegradationLevel(newLevel, context = {}) {
    const previousLevel = this.currentLevel;
    this.currentLevel = newLevel;
    this.stats.degradationEvents++;
    this.stats.lastDegradation = new Date().toISOString();

    console.log(`🚨 System degradation level changed: ${previousLevel} → ${newLevel}`);

    // Apply degradation strategies for each service
    for (const [serviceName, service] of this.services) {
      const shouldDegrade = this.shouldDegradeService(service, newLevel, context);
      
      if (shouldDegrade) {
        await this.degradeService(serviceName, service);
      } else if (service.state === 'DEGRADED' && newLevel === 'FULL') {
        await this.restoreService(serviceName, service);
      }
    }

    // Notify about degradation
    await this.notifyDegradation(newLevel, previousLevel, context);
  }

  /**
   * Determine if a service should be degraded
   */
  shouldDegradeService(service, systemLevel, context) {
    // Service is already failed
    if (context.failedServices?.includes(service.name)) {
      return true;
    }

    // Apply degradation based on system level and service priority
    switch (systemLevel) {
      case 'EMERGENCY':
        return service.priority !== 'HIGH' && !service.essential;
        
      case 'LIMITED':
        return service.priority === 'LOW';
        
      case 'DEGRADED':
        return false; // Keep services running but monitor closely
        
      default:
        return false;
    }
  }

  /**
   * Degrade a service
   */
  async degradeService(serviceName, service) {
    if (service.state === 'DEGRADED') return;

    console.log(`⬇️ Degrading service: ${serviceName}`);
    
    service.state = 'DEGRADED';
    this.serviceStates[serviceName] = 'DEGRADED';

    // Apply fallback strategy
    switch (service.fallbackStrategy) {
      case 'DISABLE':
        console.log(`🚫 Service ${serviceName} disabled`);
        break;
        
      case 'CACHE_ONLY':
        console.log(`💾 Service ${serviceName} switched to cache-only mode`);
        break;
        
      case 'STATIC_RESPONSE':
        console.log(`📋 Service ${serviceName} switched to static responses`);
        break;
        
      case 'REDUCED_FEATURES':
        console.log(`⚡ Service ${serviceName} running with reduced features`);
        break;
        
      default:
        console.log(`🔧 Service ${serviceName} applying fallback strategy: ${service.fallbackStrategy}`);
        break;
    }
  }

  /**
   * Restore a service to full functionality
   */
  async restoreService(serviceName, service) {
    if (service.state === 'OPERATIONAL') return;

    console.log(`⬆️ Restoring service: ${serviceName}`);
    
    service.state = 'OPERATIONAL';
    this.serviceStates[serviceName] = 'OPERATIONAL';
  }

  /**
   * Get service capabilities based on current degradation level
   */
  getServiceCapabilities(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) {
      return { available: false, reason: 'Service not registered' };
    }

    const state = service.state;
    
    if (state === 'OPERATIONAL') {
      return { 
        available: true, 
        fullFunctionality: true,
        degradationLevel: this.currentLevel
      };
    }

    if (state === 'DEGRADED') {
      return {
        available: true,
        fullFunctionality: false,
        limitedMode: true,
        fallbackStrategy: service.fallbackStrategy,
        degradationLevel: this.currentLevel
      };
    }

    return { 
      available: false, 
      reason: 'Service degraded or unavailable',
      degradationLevel: this.currentLevel
    };
  }

  /**
   * Execute operation with degradation awareness
   */
  async executeWithDegradation(serviceName, operation, fallbackOperation = null) {
    const capabilities = this.getServiceCapabilities(serviceName);
    
    if (capabilities.fullFunctionality) {
      // Full service available
      try {
        return await operation();
      } catch (error) {
        // If operation fails, mark service for degradation
        console.error(`Service ${serviceName} operation failed:`, error);
        await this.markServiceUnhealthy(serviceName, error);
        
        if (fallbackOperation) {
          return await fallbackOperation();
        }
        throw error;
      }
    }
    
    if (capabilities.available && capabilities.limitedMode) {
      // Limited service available
      console.warn(`Using degraded service: ${serviceName}`);
      
      if (fallbackOperation) {
        return await fallbackOperation();
      } else {
        throw new Error(`Service ${serviceName} is in limited mode and no fallback provided`);
      }
    }
    
    // Service unavailable
    if (fallbackOperation) {
      console.warn(`Service ${serviceName} unavailable, using fallback`);
      return await fallbackOperation();
    }
    
    throw new Error(`Service ${serviceName} is unavailable and no fallback provided`);
  }

  /**
   * Mark service as unhealthy
   */
  async markServiceUnhealthy(serviceName, error) {
    const service = this.services.get(serviceName);
    if (!service) return;

    service.failures++;
    console.error(`Service ${serviceName} marked unhealthy (failure ${service.failures}):`, error.message);
    
    // Trigger health assessment if too many failures
    if (service.failures >= 3) {
      setTimeout(() => this.assessSystemHealth(), 1000);
    }
  }

  /**
   * Force service recovery attempt
   */
  async attemptServiceRecovery(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) return false;

    console.log(`🔄 Attempting recovery for service: ${serviceName}`);
    
    try {
      const isHealthy = await this.checkServiceHealth(serviceName);
      
      if (isHealthy) {
        await this.restoreService(serviceName, service);
        await this.assessSystemHealth(); // Re-assess overall system
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Recovery attempt failed for ${serviceName}:`, error);
      return false;
    }
  }

  /**
   * Notify about degradation events
   */
  async notifyDegradation(newLevel, previousLevel, context) {
    const notification = {
      timestamp: new Date().toISOString(),
      degradationLevel: newLevel,
      previousLevel,
      failedServices: context.failedServices || [],
      criticalFailures: context.criticalFailures || [],
      impact: this.getDegradationImpact(newLevel)
    };

    console.log('📢 Degradation notification:', notification);
    
    // Here you could send notifications to:
    // - Operations team
    // - Monitoring systems
    // - User-facing status pages
    // - Customer support
  }

  /**
   * Get impact description for degradation level
   */
  getDegradationImpact(level) {
    const impacts = {
      FULL: 'All services operational',
      DEGRADED: 'Some services may have reduced performance',
      LIMITED: 'Only core services available',
      EMERGENCY: 'Minimal functionality only'
    };
    
    return impacts[level] || 'Unknown impact';
  }

  /**
   * Get current system status
   */
  getSystemStatus() {
    const operationalServices = Array.from(this.services.values())
      .filter(s => s.state === 'OPERATIONAL').length;
      
    return {
      degradationLevel: this.currentLevel,
      impact: this.getDegradationImpact(this.currentLevel),
      services: {
        total: this.services.size,
        operational: operationalServices,
        degraded: this.services.size - operationalServices
      },
      serviceStates: { ...this.serviceStates },
      stats: { ...this.stats }
    };
  }

  /**
   * Reset all services to operational state
   */
  async resetAllServices() {
    console.log('🔄 Resetting all services to operational state...');
    
    for (const [serviceName, service] of this.services) {
      service.state = 'OPERATIONAL';
      service.failures = 0;
      this.serviceStates[serviceName] = 'OPERATIONAL';
    }
    
    this.currentLevel = 'FULL';
    console.log('✅ All services reset to operational state');
  }
}

// Global degradation manager instance
export const gracefulDegradation = new GracefulDegradationManager();