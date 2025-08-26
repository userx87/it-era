/**
 * ID System Monitoring Integration Example
 * Demonstrates how to integrate the ID monitoring system with existing IT-ERA infrastructure
 * This example shows how to use the monitoring system in production
 */

import monitoringAPI from './monitoring-api.js';
import idSystemMonitor from './id-system-monitor.js';
import idMonitoringIntegration from './id-integration.js';

// Example integration with existing chatbot worker
class ChatbotWithIDMonitoring {
  constructor() {
    this.monitoring = {
      initialized: false,
      trackingEnabled: true
    };
  }

  async initialize(env) {
    console.log('🔧 Initializing Chatbot with ID Monitoring...');
    
    try {
      // Initialize monitoring API
      await monitoringAPI.initialize();
      this.monitoring.initialized = true;
      
      console.log('✅ Chatbot with ID Monitoring initialized');
    } catch (error) {
      console.error('❌ Failed to initialize monitoring:', error);
      // Continue without monitoring if it fails
      this.monitoring.initialized = false;
    }
  }

  // Enhanced session ID generation with monitoring
  generateSessionId() {
    const startTime = Date.now();
    
    try {
      // Original ID generation logic
      const sessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const generationTime = Date.now() - startTime;
      
      // Track ID generation performance
      if (this.monitoring.initialized && this.monitoring.trackingEnabled) {
        idSystemMonitor.trackIDGeneration(sessionId, generationTime, true, {
          type: 'chat_session',
          method: 'standard_generation'
        });
      }
      
      return sessionId;
      
    } catch (error) {
      const generationTime = Date.now() - startTime;
      
      // Track failed ID generation
      if (this.monitoring.initialized && this.monitoring.trackingEnabled) {
        idSystemMonitor.trackIDGeneration(null, generationTime, false, {
          error: error.message,
          type: 'chat_session'
        });
      }
      
      throw error;
    }
  }

  // Enhanced session storage operations with monitoring
  async getOrCreateSession(sessionId, CHAT_SESSIONS) {
    const startTime = Date.now();
    
    try {
      if (!sessionId) {
        sessionId = this.generateSessionId();
      }
      
      // Retrieve session (READ operation)
      const readStart = Date.now();
      let session = await CHAT_SESSIONS.get(sessionId);
      const readTime = Date.now() - readStart;
      
      if (this.monitoring.initialized) {
        idSystemMonitor.trackStorageOperation('read', sessionId, readTime, true, {
          found: !!session,
          size: session ? session.length : 0
        });
      }

      if (!session) {
        // Create new session
        session = {
          id: sessionId,
          created: Date.now(),
          messages: [],
          context: {},
          step: "greeting",
          leadData: {}
        };
      } else {
        session = JSON.parse(session);
      }
      
      return session;
      
    } catch (error) {
      const operationTime = Date.now() - startTime;
      
      if (this.monitoring.initialized) {
        idSystemMonitor.trackStorageOperation('read', sessionId, operationTime, false, {
          error: error.message
        });
      }
      
      throw error;
    }
  }

  // Enhanced session saving with monitoring
  async saveSession(session, CHAT_SESSIONS) {
    const startTime = Date.now();
    
    try {
      const sessionData = JSON.stringify(session);
      await CHAT_SESSIONS.put(session.id, sessionData, {
        expirationTtl: 3600 // 1 hour
      });
      
      const writeTime = Date.now() - startTime;
      
      if (this.monitoring.initialized) {
        idSystemMonitor.trackStorageOperation('write', session.id, writeTime, true, {
          size: sessionData.length,
          messageCount: session.messages?.length || 0
        });

        // Update storage usage metrics
        // In a real implementation, you'd track these more accurately
        const estimatedTotalIds = 1000; // Placeholder
        const estimatedActiveIds = 800;
        const estimatedExpiredIds = 200;
        const estimatedStorageSize = sessionData.length * estimatedActiveIds;
        
        idSystemMonitor.updateStorageUsage(
          estimatedTotalIds,
          estimatedActiveIds,
          estimatedExpiredIds,
          estimatedStorageSize
        );
      }
      
    } catch (error) {
      const writeTime = Date.now() - startTime;
      
      if (this.monitoring.initialized) {
        idSystemMonitor.trackStorageOperation('write', session.id, writeTime, false, {
          error: error.message,
          size: JSON.stringify(session).length
        });
      }
      
      throw error;
    }
  }

  // Enhanced caching with monitoring
  async getCachedResponse(cacheKey) {
    const startTime = Date.now();
    
    try {
      const cachedData = await this.cache?.get(cacheKey);
      const responseTime = Date.now() - startTime;
      const hit = !!cachedData;
      
      if (this.monitoring.initialized) {
        idSystemMonitor.trackCacheOperation('get', cacheKey, hit, responseTime, {
          cacheKey: cacheKey.substring(0, 50) // Truncate for privacy
        });
      }
      
      return cachedData;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (this.monitoring.initialized) {
        idSystemMonitor.trackCacheOperation('get', cacheKey, false, responseTime, {
          error: error.message
        });
      }
      
      return null;
    }
  }

  // Enhanced duplicate detection with monitoring
  checkForDuplicateSession(sessionId, existingSessions) {
    try {
      const isDuplicate = existingSessions.includes(sessionId);
      const prevented = isDuplicate; // In real implementation, you'd prevent the duplicate
      
      if (this.monitoring.initialized) {
        idSystemMonitor.trackDuplicateDetection(sessionId, isDuplicate, prevented, {
          existingCount: existingSessions.length,
          checkMethod: 'simple_includes'
        });
      }
      
      return { isDuplicate, prevented };
      
    } catch (error) {
      if (this.monitoring.initialized) {
        idSystemMonitor.trackDuplicateDetection(sessionId, false, false, {
          error: error.message,
          checkMethod: 'simple_includes'
        });
      }
      
      return { isDuplicate: false, prevented: false };
    }
  }

  // Handle monitoring API requests (integrate with existing worker)
  async handleMonitoringRequest(request) {
    if (!this.monitoring.initialized) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Monitoring not initialized'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    return await monitoringAPI.handleRequest(request, url.pathname, url.searchParams);
  }
}

// Example usage in Cloudflare Worker
const chatbotWithMonitoring = new ChatbotWithIDMonitoring();

// Example worker integration
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Initialize monitoring on first request
    if (!chatbotWithMonitoring.monitoring.initialized) {
      try {
        await chatbotWithMonitoring.initialize(env);
      } catch (error) {
        console.warn('Monitoring initialization failed, continuing without monitoring');
      }
    }
    
    // Route monitoring API requests
    if (url.pathname.startsWith('/api/monitoring')) {
      return await chatbotWithMonitoring.handleMonitoringRequest(request);
    }
    
    // Enhanced health check with ID system monitoring
    if (url.pathname === '/health') {
      let healthData = {
        status: 'ok',
        service: 'IT-ERA Chatbot API with ID Monitoring',
        timestamp: new Date().toISOString()
      };
      
      if (chatbotWithMonitoring.monitoring.initialized) {
        try {
          const idSystemHealth = idSystemMonitor.getDashboardData();
          const integrationStatus = idMonitoringIntegration.getSystemStatus();
          
          healthData.monitoring = {
            enabled: true,
            idSystemHealth: idSystemHealth.health.systemStatus,
            totalIDsGenerated: idSystemHealth.performance.idGeneration.totalGenerated,
            uptime: idSystemHealth.uptime.formatted,
            alerts: idSystemHealth.alerts.total,
            integration: integrationStatus.integration.overall
          };
          
          // Adjust overall status based on monitoring data
          if (idSystemHealth.health.systemStatus === 'critical' || idSystemHealth.alerts.bySeverity.critical > 0) {
            healthData.status = 'degraded';
          }
          
        } catch (error) {
          healthData.monitoring = {
            enabled: false,
            error: 'Failed to retrieve monitoring data'
          };
        }
      } else {
        healthData.monitoring = {
          enabled: false,
          reason: 'Monitoring not initialized'
        };
      }
      
      return new Response(JSON.stringify(healthData), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Regular chatbot API handling with monitoring integration
    if (request.method === 'POST' && url.pathname === '/api/chat') {
      try {
        const data = await request.json();
        const { action, sessionId } = data;
        
        if (action === 'start') {
          // Create session with monitoring
          let session = await chatbotWithMonitoring.getOrCreateSession(null, env.CHAT_SESSIONS);
          
          // Check for duplicate sessions (example)
          const existingSessions = []; // In real implementation, get from storage
          chatbotWithMonitoring.checkForDuplicateSession(session.id, existingSessions);
          
          // Save session with monitoring
          await chatbotWithMonitoring.saveSession(session, env.CHAT_SESSIONS);
          
          return new Response(JSON.stringify({
            success: true,
            sessionId: session.id,
            response: "Ciao! Sono l'assistente virtuale di IT-ERA. Come posso aiutarti oggi?",
            monitoring: {
              enabled: chatbotWithMonitoring.monitoring.initialized,
              sessionTracked: chatbotWithMonitoring.monitoring.trackingEnabled
            }
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // Handle other actions...
        return new Response(JSON.stringify({
          success: false,
          error: 'Action not implemented in example'
        }), {
          status: 501,
          headers: { 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        console.error('Chatbot error:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Internal server error'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Endpoint not found',
      availableEndpoints: ['/health', '/api/chat', '/api/monitoring/*']
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Usage examples for different scenarios

/**
 * Example 1: Basic monitoring integration
 */
export class BasicMonitoringIntegration {
  static async trackSimpleIDGeneration() {
    // Start monitoring
    await idSystemMonitor.startMonitoring();
    
    // Generate and track IDs
    for (let i = 0; i < 10; i++) {
      const startTime = Date.now();
      const id = `test_${Date.now()}_${i}`;
      const generationTime = Date.now() - startTime;
      
      idSystemMonitor.trackIDGeneration(id, generationTime, true, {
        testRun: true,
        iteration: i
      });
    }
    
    // Get dashboard data
    const dashboard = idSystemMonitor.getDashboardData();
    console.log('Basic monitoring result:', dashboard.performance.idGeneration);
  }
}

/**
 * Example 2: Advanced monitoring with alerting
 */
export class AdvancedMonitoringExample {
  static async setupAdvancedMonitoring() {
    // Initialize full integration
    await idMonitoringIntegration.initialize();
    
    // Simulate various scenarios
    await this.simulateNormalOperations();
    await this.simulatePerformanceIssues();
    await this.simulateDuplicateDetection();
    
    // Generate comprehensive report
    const report = await idMonitoringIntegration.generateAutomatedReport();
    console.log('Advanced monitoring report generated:', report.title);
  }
  
  static async simulateNormalOperations() {
    console.log('Simulating normal operations...');
    
    for (let i = 0; i < 50; i++) {
      const sessionId = `normal_${i}`;
      const generationTime = 20 + Math.random() * 30; // 20-50ms
      
      idSystemMonitor.trackIDGeneration(sessionId, generationTime, true, {
        scenario: 'normal_operations'
      });
      
      // Simulate storage operations
      const readTime = 10 + Math.random() * 20;
      const writeTime = 15 + Math.random() * 25;
      
      idSystemMonitor.trackStorageOperation('read', sessionId, readTime, true);
      idSystemMonitor.trackStorageOperation('write', sessionId, writeTime, true);
      
      // Simulate cache operations
      const cacheHit = Math.random() > 0.2; // 80% hit rate
      idSystemMonitor.trackCacheOperation('get', `cache_${i}`, cacheHit, 5 + Math.random() * 10);
    }
  }
  
  static async simulatePerformanceIssues() {
    console.log('Simulating performance issues...');
    
    // Simulate slow ID generation
    for (let i = 0; i < 5; i++) {
      const sessionId = `slow_${i}`;
      const generationTime = 200 + Math.random() * 300; // 200-500ms (slow)
      
      idSystemMonitor.trackIDGeneration(sessionId, generationTime, true, {
        scenario: 'performance_degradation',
        cause: 'simulated_slowness'
      });
    }
    
    // Simulate storage failures
    for (let i = 0; i < 3; i++) {
      const sessionId = `failed_${i}`;
      idSystemMonitor.trackStorageOperation('write', sessionId, 1000, false, {
        scenario: 'storage_failure',
        error: 'Simulated storage timeout'
      });
    }
  }
  
  static async simulateDuplicateDetection() {
    console.log('Simulating duplicate detection...');
    
    // Simulate duplicate IDs
    const duplicateId = 'duplicate_test_123';
    
    idSystemMonitor.trackDuplicateDetection(duplicateId, true, true, {
      scenario: 'duplicate_prevention',
      preventionMethod: 'collision_detection'
    });
    
    idSystemMonitor.trackDuplicateDetection(duplicateId, true, false, {
      scenario: 'duplicate_failure',
      reason: 'prevention_system_failed'
    });
  }
}

/**
 * Example 3: Metrics export for external systems
 */
export class MetricsExportExample {
  static async exportMetricsForMonitoring() {
    // Start monitoring
    await idSystemMonitor.startMonitoring();
    
    // Generate some data
    await BasicMonitoringIntegration.trackSimpleIDGeneration();
    
    // Export metrics in different formats
    const jsonMetrics = idSystemMonitor.exportMetrics();
    console.log('JSON metrics exported:', Object.keys(jsonMetrics));
    
    // Get dashboard data
    const dashboard = idSystemMonitor.getDashboardData();
    console.log('Dashboard data available:', Object.keys(dashboard));
    
    // Get unified metrics
    const unifiedMetrics = idMonitoringIntegration.getUnifiedMetrics();
    console.log('Unified metrics available:', Object.keys(unifiedMetrics));
    
    return {
      json: jsonMetrics,
      dashboard: dashboard,
      unified: unifiedMetrics
    };
  }
}

export { ChatbotWithIDMonitoring, chatbotWithMonitoring };
export default chatbotWithMonitoring;