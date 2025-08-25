/**
 * Advanced Session Management System for IT-ERA
 * Implements secure session handling with Redis-like KV storage
 */

export class SessionManager {
  constructor(env) {
    this.env = env;
    this.config = {
      // Session configuration
      sessionTimeout: 3600,        // 1 hour default
      maxSessions: 3,              // Max concurrent sessions per user
      sessionWarning: 300,         // Warning 5 minutes before expiry
      
      // Security settings
      sessionRotation: true,       // Rotate session IDs on privilege change
      secureTransport: true,       // Require HTTPS
      strictSameSite: true,        // Strict SameSite cookies
      
      // Storage settings
      keyPrefix: 'session:',
      indexPrefix: 'user_sessions:',
      metaPrefix: 'session_meta:'
    };
  }

  /**
   * Create new session with security metadata
   */
  async createSession(userId, sessionData = {}) {
    try {
      const sessionId = this.generateSecureSessionId();
      const now = Date.now();
      
      const session = {
        id: sessionId,
        userId,
        createdAt: now,
        lastActivity: now,
        expiresAt: now + (this.config.sessionTimeout * 1000),
        
        // Security metadata
        ipAddress: sessionData.ipAddress,
        userAgent: sessionData.userAgent,
        deviceFingerprint: sessionData.deviceFingerprint,
        
        // Session state
        authenticated: true,
        permissions: sessionData.permissions || [],
        roles: sessionData.roles || [],
        
        // Activity tracking
        loginMethod: sessionData.loginMethod || 'password',
        loginTime: now,
        pageViews: 0,
        requestCount: 0,
        
        // Security flags
        suspicious: false,
        locked: false,
        rotated: false,
        
        // Custom data
        metadata: sessionData.metadata || {}
      };

      // Check concurrent session limit
      await this.enforceSessionLimit(userId, sessionId);
      
      // Store session
      await this.storeSession(session);
      
      // Create session index for user
      await this.addToUserIndex(userId, sessionId);
      
      // Log session creation
      await this.logSessionEvent('SESSION_CREATED', sessionId, {
        userId,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent
      });

      return {
        success: true,
        sessionId,
        expiresAt: session.expiresAt,
        session: this.sanitizeSessionForClient(session)
      };

    } catch (error) {
      console.error('Session creation error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Retrieve and validate session
   */
  async getSession(sessionId, options = {}) {
    try {
      if (!this.isValidSessionId(sessionId)) {
        return { success: false, error: 'Invalid session ID format' };
      }

      const sessionKey = this.config.keyPrefix + sessionId;
      const sessionData = await this.env.AUTH_SESSIONS?.get(sessionKey);
      
      if (!sessionData) {
        return { success: false, error: 'Session not found' };
      }

      const session = JSON.parse(sessionData);
      const now = Date.now();

      // Check expiration
      if (session.expiresAt < now) {
        await this.destroySession(sessionId, 'EXPIRED');
        return { success: false, error: 'Session expired' };
      }

      // Check if session is locked
      if (session.locked) {
        return { success: false, error: 'Session locked due to suspicious activity' };
      }

      // Update last activity
      if (options.updateActivity !== false) {
        session.lastActivity = now;
        session.requestCount = (session.requestCount || 0) + 1;
        
        // Extend session if needed
        if (options.extendSession) {
          session.expiresAt = now + (this.config.sessionTimeout * 1000);
        }
        
        await this.storeSession(session);
      }

      // Check for suspicious activity
      await this.checkSuspiciousActivity(session, options);

      return {
        success: true,
        session: this.sanitizeSessionForClient(session),
        expiresAt: session.expiresAt,
        lastActivity: session.lastActivity
      };

    } catch (error) {
      console.error('Session retrieval error:', error);
      return { success: false, error: 'Session validation failed' };
    }
  }

  /**
   * Update session data
   */
  async updateSession(sessionId, updates = {}) {
    try {
      const sessionResult = await this.getSession(sessionId, { updateActivity: false });
      if (!sessionResult.success) {
        return sessionResult;
      }

      const session = await this.getFullSession(sessionId);
      const originalPermissions = [...(session.permissions || [])];
      
      // Apply updates
      Object.assign(session, {
        ...updates,
        lastModified: Date.now()
      });

      // Check if permissions changed (requires rotation)
      const permissionsChanged = !this.arraysEqual(originalPermissions, session.permissions);
      if (permissionsChanged && this.config.sessionRotation) {
        session.rotated = true;
        await this.logSessionEvent('SESSION_PRIVILEGES_CHANGED', sessionId, {
          oldPermissions: originalPermissions,
          newPermissions: session.permissions
        });
      }

      await this.storeSession(session);

      return {
        success: true,
        session: this.sanitizeSessionForClient(session),
        rotationRequired: permissionsChanged && this.config.sessionRotation
      };

    } catch (error) {
      console.error('Session update error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Destroy session securely
   */
  async destroySession(sessionId, reason = 'USER_LOGOUT') {
    try {
      const session = await this.getFullSession(sessionId);
      if (!session) {
        return { success: true }; // Already destroyed
      }

      // Remove from storage
      const sessionKey = this.config.keyPrefix + sessionId;
      await this.env.AUTH_SESSIONS?.delete(sessionKey);

      // Remove from user index
      await this.removeFromUserIndex(session.userId, sessionId);

      // Store destruction record for audit
      await this.storeSessionDestruction(sessionId, session.userId, reason);

      // Log session destruction
      await this.logSessionEvent('SESSION_DESTROYED', sessionId, {
        userId: session.userId,
        reason,
        duration: Date.now() - session.createdAt
      });

      return { success: true, reason };

    } catch (error) {
      console.error('Session destruction error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Lock session due to suspicious activity
   */
  async lockSession(sessionId, reason = 'SUSPICIOUS_ACTIVITY') {
    try {
      const session = await this.getFullSession(sessionId);
      if (!session) {
        return { success: false, error: 'Session not found' };
      }

      session.locked = true;
      session.lockReason = reason;
      session.lockedAt = Date.now();
      session.suspicious = true;

      await this.storeSession(session);

      await this.logSessionEvent('SESSION_LOCKED', sessionId, {
        userId: session.userId,
        reason,
        ipAddress: session.ipAddress
      });

      // Alert security team for certain reasons
      if (['BRUTE_FORCE', 'SUSPICIOUS_IP', 'PRIVILEGE_ESCALATION'].includes(reason)) {
        await this.alertSecurityTeam('SESSION_SECURITY_INCIDENT', {
          sessionId,
          userId: session.userId,
          reason,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent
        });
      }

      return { success: true, locked: true, reason };

    } catch (error) {
      console.error('Session lock error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all sessions for a user
   */
  async getUserSessions(userId) {
    try {
      const indexKey = this.config.indexPrefix + userId;
      const sessionIds = await this.env.AUTH_SESSIONS?.get(indexKey);
      
      if (!sessionIds) {
        return { success: true, sessions: [] };
      }

      const sessionIdList = JSON.parse(sessionIds);
      const sessions = [];

      for (const sessionId of sessionIdList) {
        const sessionResult = await this.getSession(sessionId, { updateActivity: false });
        if (sessionResult.success) {
          sessions.push({
            ...sessionResult.session,
            current: sessionId === this.getCurrentSessionId()
          });
        }
      }

      return { success: true, sessions };

    } catch (error) {
      console.error('User sessions retrieval error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enforce maximum concurrent sessions
   */
  async enforceSessionLimit(userId, excludeSessionId = null) {
    try {
      const sessionsResult = await this.getUserSessions(userId);
      if (!sessionsResult.success) return;

      const activeSessions = sessionsResult.sessions
        .filter(s => s.id !== excludeSessionId)
        .sort((a, b) => b.lastActivity - a.lastActivity);

      if (activeSessions.length >= this.config.maxSessions) {
        // Destroy oldest sessions
        const sessionsToDestroy = activeSessions.slice(this.config.maxSessions - 1);
        
        for (const session of sessionsToDestroy) {
          await this.destroySession(session.id, 'SESSION_LIMIT_EXCEEDED');
        }

        await this.logSessionEvent('SESSION_LIMIT_ENFORCED', excludeSessionId, {
          userId,
          destroyedSessions: sessionsToDestroy.length,
          maxSessions: this.config.maxSessions
        });
      }

    } catch (error) {
      console.error('Session limit enforcement error:', error);
    }
  }

  /**
   * Check for suspicious session activity
   */
  async checkSuspiciousActivity(session, options = {}) {
    try {
      const suspiciousIndicators = [];
      
      // IP address changes
      if (options.ipAddress && session.ipAddress !== options.ipAddress) {
        suspiciousIndicators.push('IP_CHANGE');
        await this.logSessionEvent('SESSION_IP_CHANGE', session.id, {
          oldIP: session.ipAddress,
          newIP: options.ipAddress,
          userId: session.userId
        });
      }

      // User agent changes
      if (options.userAgent && session.userAgent !== options.userAgent) {
        suspiciousIndicators.push('USER_AGENT_CHANGE');
      }

      // Unusual activity patterns
      const timeSinceLastActivity = Date.now() - session.lastActivity;
      if (timeSinceLastActivity > 86400000 && session.requestCount > 1000) { // 24 hours
        suspiciousIndicators.push('UNUSUAL_ACTIVITY_PATTERN');
      }

      // Geographic impossibility (if location data available)
      if (options.location && session.location) {
        const distance = this.calculateDistance(session.location, options.location);
        const timeDiff = (Date.now() - session.lastActivity) / 1000 / 3600; // hours
        const maxPossibleSpeed = distance / timeDiff; // km/h
        
        if (maxPossibleSpeed > 1000) { // Impossible to travel this fast
          suspiciousIndicators.push('GEOGRAPHIC_IMPOSSIBILITY');
        }
      }

      // If suspicious activity detected
      if (suspiciousIndicators.length > 0) {
        session.suspicious = true;
        session.suspiciousIndicators = suspiciousIndicators;
        
        // Lock session if high-risk indicators
        const highRiskIndicators = ['GEOGRAPHIC_IMPOSSIBILITY', 'MULTIPLE_SIMULTANEOUS_LOCATIONS'];
        if (suspiciousIndicators.some(i => highRiskIndicators.includes(i))) {
          await this.lockSession(session.id, 'SUSPICIOUS_ACTIVITY');
        }
      }

      return suspiciousIndicators;

    } catch (error) {
      console.error('Suspicious activity check error:', error);
      return [];
    }
  }

  /**
   * Session cleanup - remove expired sessions
   */
  async cleanupExpiredSessions() {
    try {
      const now = Date.now();
      let cleanedCount = 0;

      // This would typically use a more efficient approach like scanning
      // For now, we'll rely on TTL in KV storage to handle cleanup
      
      await this.logSessionEvent('SESSION_CLEANUP_COMPLETED', null, {
        cleanedCount,
        timestamp: new Date().toISOString()
      });

      return { success: true, cleanedCount };

    } catch (error) {
      console.error('Session cleanup error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Utility methods
   */
  generateSecureSessionId() {
    const timestamp = Date.now().toString(36);
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const random = Array.from(randomBytes, byte => byte.toString(36)).join('');
    return `ses_${timestamp}_${random}`;
  }

  isValidSessionId(sessionId) {
    return typeof sessionId === 'string' && 
           sessionId.startsWith('ses_') && 
           sessionId.length > 20;
  }

  async storeSession(session) {
    const sessionKey = this.config.keyPrefix + session.id;
    await this.env.AUTH_SESSIONS?.put(sessionKey, JSON.stringify(session), {
      expirationTtl: Math.max(this.config.sessionTimeout, 3600)
    });
  }

  async getFullSession(sessionId) {
    const sessionKey = this.config.keyPrefix + sessionId;
    const sessionData = await this.env.AUTH_SESSIONS?.get(sessionKey);
    return sessionData ? JSON.parse(sessionData) : null;
  }

  async addToUserIndex(userId, sessionId) {
    const indexKey = this.config.indexPrefix + userId;
    const existing = await this.env.AUTH_SESSIONS?.get(indexKey);
    let sessionIds = existing ? JSON.parse(existing) : [];
    
    if (!sessionIds.includes(sessionId)) {
      sessionIds.push(sessionId);
      await this.env.AUTH_SESSIONS?.put(indexKey, JSON.stringify(sessionIds), {
        expirationTtl: this.config.sessionTimeout * 2
      });
    }
  }

  async removeFromUserIndex(userId, sessionId) {
    const indexKey = this.config.indexPrefix + userId;
    const existing = await this.env.AUTH_SESSIONS?.get(indexKey);
    
    if (existing) {
      let sessionIds = JSON.parse(existing);
      sessionIds = sessionIds.filter(id => id !== sessionId);
      
      if (sessionIds.length > 0) {
        await this.env.AUTH_SESSIONS?.put(indexKey, JSON.stringify(sessionIds), {
          expirationTtl: this.config.sessionTimeout * 2
        });
      } else {
        await this.env.AUTH_SESSIONS?.delete(indexKey);
      }
    }
  }

  sanitizeSessionForClient(session) {
    const {
      deviceFingerprint,
      suspicious,
      suspiciousIndicators,
      locked,
      lockReason,
      ...clientSession
    } = session;
    
    return clientSession;
  }

  async storeSessionDestruction(sessionId, userId, reason) {
    const destructionKey = `destruction:${sessionId}`;
    await this.env.AUTH_SESSIONS?.put(destructionKey, JSON.stringify({
      sessionId,
      userId,
      reason,
      destroyedAt: Date.now()
    }), {
      expirationTtl: 86400 * 7 // Keep for 7 days for audit
    });
  }

  arraysEqual(a, b) {
    return a.length === b.length && a.every((val, index) => val === b[index]);
  }

  calculateDistance(location1, location2) {
    // Simple distance calculation (would use proper geolocation in production)
    const lat1 = location1.latitude * Math.PI / 180;
    const lat2 = location2.latitude * Math.PI / 180;
    const deltaLat = (location2.latitude - location1.latitude) * Math.PI / 180;
    const deltaLng = (location2.longitude - location1.longitude) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return 6371 * c; // Distance in km
  }

  getCurrentSessionId() {
    // This would be provided by the request context
    return null;
  }

  async logSessionEvent(event, sessionId, data) {
    const logEntry = {
      event,
      sessionId,
      data,
      timestamp: new Date().toISOString(),
      service: 'session-manager'
    };

    const logKey = `session_log:${Date.now()}:${crypto.randomUUID()}`;
    await this.env.AUTH_SESSIONS?.put(logKey, JSON.stringify(logEntry), {
      expirationTtl: 86400 * 30 // 30 days
    });
  }

  async alertSecurityTeam(alertType, data) {
    console.warn(`🚨 SESSION SECURITY ALERT: ${alertType}`, data);
    
    const alertKey = `session_alert:${Date.now()}:${crypto.randomUUID()}`;
    await this.env.AUTH_SESSIONS?.put(alertKey, JSON.stringify({
      type: alertType,
      timestamp: new Date().toISOString(),
      data,
      severity: 'HIGH'
    }), {
      expirationTtl: 86400 * 7
    });
  }
}

export default SessionManager;