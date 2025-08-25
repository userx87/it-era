/**
 * Comprehensive Logging and Debugging System
 * Provides structured logging with multiple levels and integrations
 */

export class Logger {
  constructor(options = {}) {
    this.serviceName = options.serviceName || 'IT-ERA-Chatbot';
    this.logLevel = options.logLevel || 'INFO';
    this.enableConsole = options.enableConsole !== false;
    this.enableStorage = options.enableStorage || false;
    this.maxLogHistory = options.maxLogHistory || 1000;
    
    this.logLevels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3,
      TRACE: 4
    };
    
    this.logHistory = [];
    this.errorCount = 0;
    this.warnCount = 0;
    this.infoCount = 0;
    this.debugCount = 0;
    
    this.sessionLogs = new Map(); // Per-session logging
  }

  /**
   * Log error messages
   */
  error(message, data = {}, sessionId = null) {
    this.errorCount++;
    return this._log('ERROR', message, data, sessionId);
  }

  /**
   * Log warning messages
   */
  warn(message, data = {}, sessionId = null) {
    this.warnCount++;
    return this._log('WARN', message, data, sessionId);
  }

  /**
   * Log info messages
   */
  info(message, data = {}, sessionId = null) {
    this.infoCount++;
    return this._log('INFO', message, data, sessionId);
  }

  /**
   * Log debug messages
   */
  debug(message, data = {}, sessionId = null) {
    this.debugCount++;
    return this._log('DEBUG', message, data, sessionId);
  }

  /**
   * Log trace messages (most verbose)
   */
  trace(message, data = {}, sessionId = null) {
    return this._log('TRACE', message, data, sessionId);
  }

  /**
   * Log API requests and responses
   */
  logApiCall(method, url, statusCode, duration, sessionId = null, requestData = {}, responseData = {}) {
    const logData = {
      type: 'API_CALL',
      method,
      url,
      statusCode,
      duration,
      success: statusCode >= 200 && statusCode < 400,
      requestSize: JSON.stringify(requestData).length,
      responseSize: JSON.stringify(responseData).length,
      requestData: this._sanitizeData(requestData),
      responseData: this._sanitizeData(responseData)
    };

    const level = statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO';
    return this._log(level, `API ${method} ${url} - ${statusCode} (${duration}ms)`, logData, sessionId);
  }

  /**
   * Log AI interactions
   */
  logAiInteraction(model, prompt, response, cost, duration, sessionId = null, metadata = {}) {
    const logData = {
      type: 'AI_INTERACTION',
      model,
      promptLength: prompt?.length || 0,
      responseLength: response?.length || 0,
      cost,
      duration,
      success: !!response,
      metadata: this._sanitizeData(metadata)
    };

    const level = response ? 'INFO' : 'ERROR';
    return this._log(level, `AI ${model} - ${cost ? `€${cost.toFixed(4)}` : 'free'} (${duration}ms)`, logData, sessionId);
  }

  /**
   * Log errors with stack trace
   */
  logError(error, context = {}, sessionId = null) {
    const errorData = {
      type: 'ERROR',
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      context: this._sanitizeData(context)
    };

    return this._log('ERROR', `${error.name}: ${error.message}`, errorData, sessionId);
  }

  /**
   * Log performance metrics
   */
  logPerformance(operation, duration, success, metadata = {}, sessionId = null) {
    const perfData = {
      type: 'PERFORMANCE',
      operation,
      duration,
      success,
      metadata: this._sanitizeData(metadata)
    };

    const level = success ? 'INFO' : 'WARN';
    return this._log(level, `PERF ${operation} - ${success ? 'OK' : 'FAILED'} (${duration}ms)`, perfData, sessionId);
  }

  /**
   * Log user interactions
   */
  logUserInteraction(action, userMessage, botResponse, sessionId, metadata = {}) {
    const interactionData = {
      type: 'USER_INTERACTION',
      action,
      userMessageLength: userMessage?.length || 0,
      botResponseLength: botResponse?.length || 0,
      sessionId,
      metadata: this._sanitizeData(metadata)
    };

    return this._log('INFO', `USER ${action} - Session ${sessionId}`, interactionData, sessionId);
  }

  /**
   * Log security events
   */
  logSecurity(event, severity, details = {}, sessionId = null) {
    const securityData = {
      type: 'SECURITY',
      event,
      severity,
      timestamp: new Date().toISOString(),
      details: this._sanitizeData(details)
    };

    const level = severity === 'CRITICAL' ? 'ERROR' : severity === 'HIGH' ? 'WARN' : 'INFO';
    return this._log(level, `SECURITY ${event} - ${severity}`, securityData, sessionId);
  }

  /**
   * Create a timer for measuring operation duration
   */
  timer(operation, sessionId = null) {
    const startTime = Date.now();
    
    return {
      end: (success = true, metadata = {}) => {
        const duration = Date.now() - startTime;
        return this.logPerformance(operation, duration, success, metadata, sessionId);
      }
    };
  }

  /**
   * Internal logging method
   */
  _log(level, message, data = {}, sessionId = null) {
    // Check if log level should be processed
    if (this.logLevels[level] > this.logLevels[this.logLevel]) {
      return;
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message,
      sessionId,
      data: this._sanitizeData(data),
      id: this._generateLogId()
    };

    // Add to history
    this.logHistory.unshift(logEntry);
    if (this.logHistory.length > this.maxLogHistory) {
      this.logHistory.pop();
    }

    // Add to session-specific logs
    if (sessionId) {
      if (!this.sessionLogs.has(sessionId)) {
        this.sessionLogs.set(sessionId, []);
      }
      const sessionLogHistory = this.sessionLogs.get(sessionId);
      sessionLogHistory.unshift(logEntry);
      
      // Limit session log history
      if (sessionLogHistory.length > 50) {
        sessionLogHistory.pop();
      }
    }

    // Console logging
    if (this.enableConsole) {
      this._logToConsole(logEntry);
    }

    // External storage (if enabled)
    if (this.enableStorage) {
      this._logToStorage(logEntry);
    }

    return logEntry;
  }

  /**
   * Log to console with appropriate formatting
   */
  _logToConsole(logEntry) {
    const { timestamp, level, message, sessionId, data } = logEntry;
    const timeStr = new Date(timestamp).toLocaleTimeString();
    const sessionStr = sessionId ? ` [${sessionId.substr(-6)}]` : '';
    
    const logMessage = `[${timeStr}] ${level}${sessionStr}: ${message}`;
    
    switch (level) {
      case 'ERROR':
        console.error(logMessage, data);
        break;
      case 'WARN':
        console.warn(logMessage, data);
        break;
      case 'DEBUG':
      case 'TRACE':
        console.debug(logMessage, data);
        break;
      default:
        console.log(logMessage, data);
        break;
    }
  }

  /**
   * Log to external storage (placeholder for external integrations)
   */
  async _logToStorage(logEntry) {
    try {
      // This could integrate with:
      // - CloudWatch Logs
      // - Datadog
      // - Elasticsearch
      // - Cloudflare Analytics
      // - Custom webhook
      
      // For now, just store critical errors
      if (logEntry.level === 'ERROR' && this.storageEndpoint) {
        await fetch(this.storageEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logEntry)
        });
      }
    } catch (error) {
      console.error('Failed to log to external storage:', error);
    }
  }

  /**
   * Sanitize sensitive data from logs
   */
  _sanitizeData(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = { ...data };
    const sensitiveFields = [
      'password', 'token', 'key', 'secret', 'auth', 'authorization',
      'cookie', 'session', 'apikey', 'api_key', 'openrouter_api_key'
    ];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    // Truncate very long strings
    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'string' && value.length > 500) {
        sanitized[key] = value.substr(0, 500) + '...[TRUNCATED]';
      }
    }

    return sanitized;
  }

  /**
   * Generate unique log ID
   */
  _generateLogId() {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count = 50, level = null) {
    let logs = this.logHistory.slice(0, count);
    
    if (level) {
      logs = logs.filter(log => log.level === level);
    }
    
    return logs;
  }

  /**
   * Get logs for specific session
   */
  getSessionLogs(sessionId, count = 20) {
    const sessionLogs = this.sessionLogs.get(sessionId);
    return sessionLogs ? sessionLogs.slice(0, count) : [];
  }

  /**
   * Get error logs only
   */
  getErrors(count = 20) {
    return this.logHistory
      .filter(log => log.level === 'ERROR')
      .slice(0, count);
  }

  /**
   * Get logging statistics
   */
  getStats() {
    return {
      totalLogs: this.logHistory.length,
      errorCount: this.errorCount,
      warnCount: this.warnCount,
      infoCount: this.infoCount,
      debugCount: this.debugCount,
      activeSessions: this.sessionLogs.size,
      logLevel: this.logLevel,
      memoryUsage: this.logHistory.length * 1024 // Rough estimate
    };
  }

  /**
   * Search logs
   */
  searchLogs(query, maxResults = 50) {
    const searchTerm = query.toLowerCase();
    return this.logHistory
      .filter(log => 
        log.message.toLowerCase().includes(searchTerm) ||
        JSON.stringify(log.data).toLowerCase().includes(searchTerm)
      )
      .slice(0, maxResults);
  }

  /**
   * Clear old logs
   */
  clearOldLogs(maxAge = 86400000) { // 24 hours
    const cutoff = Date.now() - maxAge;
    const initialCount = this.logHistory.length;
    
    this.logHistory = this.logHistory.filter(log => 
      new Date(log.timestamp).getTime() > cutoff
    );

    // Clear old session logs
    for (const [sessionId, logs] of this.sessionLogs.entries()) {
      const filteredLogs = logs.filter(log => 
        new Date(log.timestamp).getTime() > cutoff
      );
      
      if (filteredLogs.length === 0) {
        this.sessionLogs.delete(sessionId);
      } else {
        this.sessionLogs.set(sessionId, filteredLogs);
      }
    }

    const clearedCount = initialCount - this.logHistory.length;
    if (clearedCount > 0) {
      this.info(`Cleared ${clearedCount} old log entries`);
    }
    
    return clearedCount;
  }

  /**
   * Export logs in JSON format
   */
  exportLogs(filters = {}) {
    let logs = this.logHistory;
    
    if (filters.level) {
      logs = logs.filter(log => log.level === filters.level);
    }
    
    if (filters.sessionId) {
      logs = logs.filter(log => log.sessionId === filters.sessionId);
    }
    
    if (filters.startDate) {
      const start = new Date(filters.startDate);
      logs = logs.filter(log => new Date(log.timestamp) >= start);
    }
    
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      logs = logs.filter(log => new Date(log.timestamp) <= end);
    }
    
    return JSON.stringify({
      exportTimestamp: new Date().toISOString(),
      service: this.serviceName,
      filters,
      logCount: logs.length,
      logs
    }, null, 2);
  }

  /**
   * Set log level dynamically
   */
  setLogLevel(level) {
    if (this.logLevels.hasOwnProperty(level)) {
      this.logLevel = level;
      this.info(`Log level changed to ${level}`);
      return true;
    }
    return false;
  }
}

// Global logger instance
export const logger = new Logger({
  serviceName: 'IT-ERA-Chatbot-API',
  logLevel: 'INFO',
  enableConsole: true,
  enableStorage: false
});