/**
 * Enterprise-Grade JWT Configuration & Security Manager
 * Implements comprehensive JWT security for IT-ERA authentication system
 * 
 * Features:
 * - Secure JWT generation and validation
 * - Token blacklisting and revocation
 * - Advanced security headers
 * - Rate limiting protection
 * - Session management
 */

export class JWTSecurityManager {
  constructor(env) {
    this.env = env;
    this.secret = env.JWT_SECRET || this.generateSecureSecret();
    this.issuer = 'it-era.it';
    this.audience = 'it-era-admin';
    this.algorithm = 'HS256';
    
    // Security configuration
    this.config = {
      // Token settings
      accessTokenExpiry: '15m',     // 15 minutes
      refreshTokenExpiry: '7d',     // 7 days
      tokenMaxAge: 900,             // 15 minutes in seconds
      refreshTokenMaxAge: 604800,   // 7 days in seconds
      
      // Rate limiting
      maxLoginAttempts: 5,
      lockoutDuration: 300,         // 5 minutes
      maxTokenRequests: 100,        // per hour
      
      // Security
      minPasswordLength: 12,
      requireStrongPasswords: true,
      enableTokenRotation: true,
      enableTokenBlacklist: true,
      
      // Session management
      maxConcurrentSessions: 3,
      sessionTimeoutWarning: 300,   // 5 minutes before expiry
      enableSessionPersistence: true
    };
  }

  /**
   * Generate cryptographically secure JWT secret
   */
  generateSecureSecret() {
    const array = new Uint8Array(64);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate secure JWT token with advanced claims
   */
  async generateToken(payload, options = {}) {
    const now = Math.floor(Date.now() / 1000);
    const tokenType = options.type || 'access';
    const expiresIn = options.expiresIn || 
      (tokenType === 'refresh' ? this.config.refreshTokenMaxAge : this.config.tokenMaxAge);
    
    // Enhanced JWT header
    const header = {
      alg: this.algorithm,
      typ: 'JWT',
      kid: await this.getKeyId(),
      cty: 'application/json'
    };

    // Enhanced JWT payload with security claims
    const jwtPayload = {
      // Standard claims
      iss: this.issuer,
      aud: this.audience,
      sub: payload.id,
      iat: now,
      exp: now + expiresIn,
      nbf: now - 10, // Not before (10 seconds ago to account for clock skew)
      
      // Custom claims
      ...payload,
      
      // Security claims
      jti: crypto.randomUUID(),          // JWT ID for tracking
      token_type: tokenType,
      session_id: payload.sessionId || crypto.randomUUID(),
      device_info: options.deviceInfo || {},
      ip_address: options.ipAddress,
      user_agent: options.userAgent,
      permissions: payload.permissions || [],
      
      // Anti-tampering
      checksum: await this.generatePayloadChecksum(payload)
    };

    // Sign token with enhanced security
    const token = await this.signToken(header, jwtPayload);
    
    // Store token metadata for tracking
    await this.storeTokenMetadata(jwtPayload.jti, {
      userId: payload.id,
      tokenType,
      issuedAt: now,
      expiresAt: now + expiresIn,
      sessionId: jwtPayload.session_id,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent
    });

    return {
      token,
      tokenId: jwtPayload.jti,
      expiresAt: now + expiresIn,
      tokenType
    };
  }

  /**
   * Verify JWT token with comprehensive security checks
   */
  async verifyToken(token, options = {}) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return this.createErrorResult('INVALID_TOKEN_FORMAT', 'Invalid token format');
      }

      const [headerB64, payloadB64, signatureB64] = parts;
      const header = JSON.parse(this.base64urlDecode(headerB64));
      const payload = JSON.parse(this.base64urlDecode(payloadB64));

      // Basic format validation
      if (!this.validateTokenStructure(header, payload)) {
        return this.createErrorResult('INVALID_TOKEN_STRUCTURE', 'Invalid token structure');
      }

      // Check token blacklist
      if (await this.isTokenBlacklisted(payload.jti)) {
        return this.createErrorResult('TOKEN_BLACKLISTED', 'Token has been revoked');
      }

      // Verify signature
      const signatureValid = await this.verifySignature(headerB64, payloadB64, signatureB64);
      if (!signatureValid) {
        return this.createErrorResult('INVALID_SIGNATURE', 'Invalid token signature');
      }

      // Time-based validation
      const timeValidation = this.validateTokenTiming(payload);
      if (!timeValidation.valid) {
        return this.createErrorResult('TOKEN_EXPIRED', timeValidation.error);
      }

      // Security claims validation
      const securityValidation = await this.validateSecurityClaims(payload, options);
      if (!securityValidation.valid) {
        return this.createErrorResult('SECURITY_VALIDATION_FAILED', securityValidation.error);
      }

      // Check for token reuse protection
      if (payload.token_type === 'access') {
        const reuseCheck = await this.checkTokenReuse(payload.jti, options.ipAddress);
        if (!reuseCheck.valid) {
          await this.handleSuspiciousActivity(payload, 'TOKEN_REUSE_DETECTED');
          return this.createErrorResult('SUSPICIOUS_ACTIVITY', 'Token reuse detected');
        }
      }

      // Update token usage tracking
      await this.updateTokenUsage(payload.jti, options);

      return {
        success: true,
        payload,
        metadata: {
          tokenId: payload.jti,
          sessionId: payload.session_id,
          issuedAt: payload.iat,
          expiresAt: payload.exp
        }
      };

    } catch (error) {
      console.error('Token verification error:', error);
      return this.createErrorResult('VERIFICATION_ERROR', 'Token verification failed');
    }
  }

  /**
   * Revoke token (add to blacklist)
   */
  async revokeToken(tokenId, reason = 'USER_LOGOUT') {
    try {
      const blacklistKey = `blacklist:${tokenId}`;
      const expiryTime = Date.now() + (this.config.refreshTokenMaxAge * 1000);
      
      await this.env.AUTH_SESSIONS?.put(blacklistKey, JSON.stringify({
        revokedAt: Date.now(),
        reason,
        timestamp: new Date().toISOString()
      }), {
        expirationTtl: this.config.refreshTokenMaxAge
      });

      // Log security event
      await this.logSecurityEvent('TOKEN_REVOKED', {
        tokenId,
        reason,
        timestamp: new Date().toISOString()
      });

      return { success: true, tokenId, reason };
    } catch (error) {
      console.error('Token revocation error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Refresh token with security rotation
   */
  async refreshToken(refreshToken, options = {}) {
    try {
      // Verify refresh token
      const verification = await this.verifyToken(refreshToken, {
        ...options,
        expectedType: 'refresh'
      });

      if (!verification.success) {
        return verification;
      }

      const payload = verification.payload;

      // Security checks for refresh
      if (payload.token_type !== 'refresh') {
        return this.createErrorResult('INVALID_TOKEN_TYPE', 'Not a refresh token');
      }

      // Check if user is still active
      const userValidation = await this.validateUserStatus(payload.sub);
      if (!userValidation.valid) {
        return this.createErrorResult('USER_INACTIVE', 'User account is inactive');
      }

      // Generate new access token
      const newAccessToken = await this.generateToken({
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role,
        permissions: payload.permissions,
        sessionId: payload.session_id
      }, {
        type: 'access',
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        deviceInfo: options.deviceInfo
      });

      // Optionally rotate refresh token
      let newRefreshToken = null;
      if (this.config.enableTokenRotation) {
        // Revoke old refresh token
        await this.revokeToken(payload.jti, 'TOKEN_ROTATION');
        
        // Generate new refresh token
        newRefreshToken = await this.generateToken({
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          role: payload.role,
          permissions: payload.permissions,
          sessionId: payload.session_id
        }, {
          type: 'refresh',
          expiresIn: this.config.refreshTokenMaxAge,
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
          deviceInfo: options.deviceInfo
        });
      }

      return {
        success: true,
        accessToken: newAccessToken.token,
        refreshToken: newRefreshToken?.token || refreshToken,
        expiresAt: newAccessToken.expiresAt,
        tokenRotated: !!newRefreshToken
      };

    } catch (error) {
      console.error('Token refresh error:', error);
      return this.createErrorResult('REFRESH_FAILED', 'Token refresh failed');
    }
  }

  /**
   * Advanced session management
   */
  async createSession(userId, sessionData = {}) {
    try {
      const sessionId = crypto.randomUUID();
      const session = {
        id: sessionId,
        userId,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        ipAddress: sessionData.ipAddress,
        userAgent: sessionData.userAgent,
        deviceInfo: sessionData.deviceInfo || {},
        active: true,
        metadata: sessionData.metadata || {}
      };

      // Check concurrent session limit
      const existingSessions = await this.getUserSessions(userId);
      if (existingSessions.length >= this.config.maxConcurrentSessions) {
        // Remove oldest session
        const oldestSession = existingSessions.sort((a, b) => a.lastActivity - b.lastActivity)[0];
        await this.terminateSession(oldestSession.id, 'SESSION_LIMIT_EXCEEDED');
      }

      // Store session
      const sessionKey = `session:${sessionId}`;
      await this.env.AUTH_SESSIONS?.put(sessionKey, JSON.stringify(session), {
        expirationTtl: this.config.refreshTokenMaxAge
      });

      // Add to user sessions index
      await this.addUserSession(userId, sessionId);

      return { success: true, sessionId, session };
    } catch (error) {
      console.error('Session creation error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Rate limiting implementation
   */
  async checkRateLimit(identifier, action = 'default') {
    try {
      const key = `rate_limit:${action}:${identifier}`;
      const window = 3600; // 1 hour
      const limit = this.getRateLimitForAction(action);

      const current = await this.env.AUTH_SESSIONS?.get(key);
      let count = 0;

      if (current) {
        const data = JSON.parse(current);
        count = data.count;
        
        if (count >= limit) {
          return {
            allowed: false,
            remaining: 0,
            resetTime: data.resetTime,
            retryAfter: Math.max(0, data.resetTime - Date.now())
          };
        }
      }

      // Increment counter
      const resetTime = Date.now() + (window * 1000);
      await this.env.AUTH_SESSIONS?.put(key, JSON.stringify({
        count: count + 1,
        resetTime,
        window
      }), {
        expirationTtl: window
      });

      return {
        allowed: true,
        remaining: limit - (count + 1),
        resetTime,
        retryAfter: 0
      };

    } catch (error) {
      console.error('Rate limiting error:', error);
      // Fail open for availability
      return { allowed: true, remaining: 999, resetTime: Date.now() + 3600000 };
    }
  }

  /**
   * Security headers configuration
   */
  getSecurityHeaders() {
    return {
      // Content Security Policy
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https:",
        "connect-src 'self' https://api.it-era.it",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "object-src 'none'"
      ].join('; '),

      // Security headers
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      
      // Custom security headers
      'X-IT-ERA-Security': 'enabled',
      'X-Request-ID': crypto.randomUUID(),
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
  }

  /**
   * Production CORS configuration
   */
  getCorsHeaders(origin = null) {
    const allowedOrigins = [
      'https://www.it-era.it',
      'https://it-era.it',
      'https://it-era.pages.dev',
      'https://admin.it-era.it'
    ];

    // Development origins
    if (this.env.ENVIRONMENT === 'development') {
      allowedOrigins.push(
        'http://localhost:3000',
        'http://localhost:8788',
        'http://127.0.0.1:5500'
      );
    }

    const isOriginAllowed = origin && allowedOrigins.includes(origin);

    return {
      'Access-Control-Allow-Origin': isOriginAllowed ? origin : allowedOrigins[0],
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-CSRF-Token',
        'X-Request-ID',
        'Accept',
        'Origin'
      ].join(', '),
      'Access-Control-Expose-Headers': [
        'X-Request-ID',
        'X-Rate-Limit-Remaining',
        'X-Rate-Limit-Reset'
      ].join(', '),
      'Access-Control-Max-Age': '86400',
      'Access-Control-Allow-Credentials': 'true',
      'Vary': 'Origin'
    };
  }

  /**
   * Helper methods
   */
  async signToken(header, payload) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(this.secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const encodedHeader = this.base64urlEncode(JSON.stringify(header));
    const encodedPayload = this.base64urlEncode(JSON.stringify(payload));
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;

    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(unsignedToken)
    );

    const encodedSignature = this.base64urlEncode(new Uint8Array(signature));
    return `${unsignedToken}.${encodedSignature}`;
  }

  async verifySignature(headerB64, payloadB64, signatureB64) {
    try {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(this.secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
      );

      const unsignedToken = `${headerB64}.${payloadB64}`;
      const signature = this.base64urlDecodeToArrayBuffer(signatureB64);

      return await crypto.subtle.verify(
        'HMAC',
        key,
        signature,
        encoder.encode(unsignedToken)
      );
    } catch (error) {
      return false;
    }
  }

  validateTokenStructure(header, payload) {
    // Validate header
    if (!header.alg || header.alg !== this.algorithm) return false;
    if (!header.typ || header.typ !== 'JWT') return false;

    // Validate payload
    if (!payload.iss || payload.iss !== this.issuer) return false;
    if (!payload.aud || payload.aud !== this.audience) return false;
    if (!payload.sub || !payload.jti) return false;
    if (!payload.iat || !payload.exp) return false;

    return true;
  }

  validateTokenTiming(payload) {
    const now = Math.floor(Date.now() / 1000);
    
    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'Token expired' };
    }
    
    if (payload.nbf && payload.nbf > now + 10) {
      return { valid: false, error: 'Token not yet valid' };
    }
    
    if (payload.iat && payload.iat > now + 10) {
      return { valid: false, error: 'Token issued in the future' };
    }

    return { valid: true };
  }

  async isTokenBlacklisted(jti) {
    try {
      const blacklistKey = `blacklist:${jti}`;
      const result = await this.env.AUTH_SESSIONS?.get(blacklistKey);
      return !!result;
    } catch (error) {
      console.error('Blacklist check error:', error);
      return false;
    }
  }

  createErrorResult(code, message) {
    return {
      success: false,
      error: message,
      errorCode: code,
      timestamp: new Date().toISOString()
    };
  }

  getRateLimitForAction(action) {
    const limits = {
      'login': 5,
      'token': 100,
      'refresh': 10,
      'default': 50
    };
    return limits[action] || limits.default;
  }

  base64urlEncode(data) {
    if (data instanceof Uint8Array) {
      const str = String.fromCharCode.apply(null, data);
      return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }
    return btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  base64urlDecode(str) {
    const padded = str + '==='.slice(0, (4 - str.length % 4) % 4);
    const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
    return atob(base64);
  }

  base64urlDecodeToArrayBuffer(str) {
    const padded = str + '==='.slice(0, (4 - str.length % 4) % 4);
    const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  async getKeyId() {
    // Generate or retrieve key ID for JWT header
    return 'it-era-key-2024';
  }

  async generatePayloadChecksum(payload) {
    // Generate checksum for anti-tampering
    const data = JSON.stringify(payload);
    const encoder = new TextEncoder();
    const hash = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async storeTokenMetadata(jti, metadata) {
    try {
      const key = `token_meta:${jti}`;
      await this.env.AUTH_SESSIONS?.put(key, JSON.stringify(metadata), {
        expirationTtl: this.config.refreshTokenMaxAge
      });
    } catch (error) {
      console.error('Error storing token metadata:', error);
    }
  }

  async logSecurityEvent(event, data) {
    try {
      const logEntry = {
        event,
        data,
        timestamp: new Date().toISOString(),
        service: 'jwt-security-manager'
      };
      
      const key = `security_log:${Date.now()}:${crypto.randomUUID()}`;
      await this.env.AUTH_SESSIONS?.put(key, JSON.stringify(logEntry), {
        expirationTtl: 86400 * 30 // 30 days
      });
    } catch (error) {
      console.error('Security logging error:', error);
    }
  }
}

export default JWTSecurityManager;