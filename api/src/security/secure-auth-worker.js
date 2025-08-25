/**
 * Secure Authentication Worker for IT-ERA
 * Enterprise-grade authentication with comprehensive security measures
 */

import JWTSecurityManager from './jwt-config.js';
import AdvancedRateLimiter from './rate-limiter.js';
import SessionManager from './session-manager.js';

export default {
  async fetch(request, env, ctx) {
    const startTime = Date.now();
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const method = request.method;
    const path = url.pathname;
    
    // Initialize security managers
    const jwtManager = new JWTSecurityManager(env);
    const rateLimiter = new AdvancedRateLimiter(env);
    const sessionManager = new SessionManager(env);
    
    // Get client information for security
    const clientInfo = {
      ipAddress: request.headers.get('CF-Connecting-IP') || 
                 request.headers.get('X-Forwarded-For') || 
                 'unknown',
      userAgent: request.headers.get('User-Agent') || 'unknown',
      origin: origin
    };

    try {
      // Security headers for all responses
      const securityHeaders = {
        ...jwtManager.getSecurityHeaders(),
        ...jwtManager.getCorsHeaders(origin)
      };

      // Handle CORS preflight
      if (method === 'OPTIONS') {
        return new Response(null, {
          status: 200,
          headers: securityHeaders
        });
      }

      // Rate limiting check
      const rateLimitResult = await rateLimiter.checkRateLimit(
        clientInfo.ipAddress,
        this.getActionFromPath(path),
        clientInfo
      );

      if (!rateLimitResult.allowed) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter
        }), {
          status: 429,
          headers: {
            ...securityHeaders,
            ...rateLimitResult.headers,
            'Retry-After': rateLimitResult.retryAfter.toString()
          }
        });
      }

      // Route handling with security
      let response;
      
      switch (path) {
        case '/api/auth/login':
          response = await this.handleSecureLogin(request, env, jwtManager, sessionManager, clientInfo);
          break;
          
        case '/api/auth/refresh':
          response = await this.handleTokenRefresh(request, env, jwtManager, clientInfo);
          break;
          
        case '/api/auth/verify':
          response = await this.handleTokenVerification(request, env, jwtManager);
          break;
          
        case '/api/auth/logout':
          response = await this.handleSecureLogout(request, env, jwtManager, sessionManager);
          break;
          
        case '/api/auth/sessions':
          response = await this.handleSessionManagement(request, env, jwtManager, sessionManager);
          break;
          
        case '/api/auth/security-status':
          response = await this.handleSecurityStatus(request, env, jwtManager, rateLimiter, sessionManager);
          break;
          
        default:
          response = this.createErrorResponse('Endpoint not found', 404, securityHeaders);
      }

      // Add security headers to response
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      // Add rate limiting headers
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      // Add performance headers
      const processingTime = Date.now() - startTime;
      response.headers.set('X-Processing-Time', processingTime.toString());
      response.headers.set('X-Request-ID', crypto.randomUUID());

      return response;

    } catch (error) {
      console.error('Secure auth worker error:', error);
      
      // Log security error
      await this.logSecurityError(error, clientInfo, path);
      
      return this.createErrorResponse('Internal server error', 500, jwtManager.getSecurityHeaders());
    }
  },

  /**
   * Handle secure login with comprehensive validation
   */
  async handleSecureLogin(request, env, jwtManager, sessionManager, clientInfo) {
    try {
      if (request.method !== 'POST') {
        return this.createErrorResponse('Method not allowed', 405);
      }

      const body = await request.json();
      const { email, password, rememberMe = false, deviceInfo = {} } = body;

      // Input validation
      if (!email || !password) {
        return this.createErrorResponse('Email and password are required', 400);
      }

      if (password.length < 8) {
        return this.createErrorResponse('Password must be at least 8 characters', 400);
      }

      // Enhanced user validation (mock for demo)
      const user = await this.validateUser(email, password, env);
      if (!user.valid) {
        // Log failed login attempt
        await this.logSecurityEvent('LOGIN_FAILED', {
          email,
          reason: user.reason,
          ...clientInfo
        }, env);
        
        return this.createErrorResponse('Invalid credentials', 401);
      }

      // Create session
      const sessionResult = await sessionManager.createSession(user.id, {
        ...clientInfo,
        deviceInfo,
        loginMethod: 'password',
        metadata: {
          rememberMe,
          loginTime: new Date().toISOString()
        }
      });

      if (!sessionResult.success) {
        return this.createErrorResponse('Session creation failed', 500);
      }

      // Generate tokens
      const tokenOptions = {
        type: 'access',
        ...clientInfo,
        deviceInfo,
        sessionId: sessionResult.sessionId
      };

      const accessTokenResult = await jwtManager.generateToken({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions || [],
        sessionId: sessionResult.sessionId
      }, tokenOptions);

      const refreshTokenResult = await jwtManager.generateToken({
        id: user.id,
        email: user.email,
        sessionId: sessionResult.sessionId
      }, {
        ...tokenOptions,
        type: 'refresh',
        expiresIn: rememberMe ? 86400 * 30 : 86400 * 7 // 30 days if remember me, 7 days otherwise
      });

      // Log successful login
      await this.logSecurityEvent('LOGIN_SUCCESS', {
        userId: user.id,
        email: user.email,
        sessionId: sessionResult.sessionId,
        rememberMe,
        ...clientInfo
      }, env);

      return new Response(JSON.stringify({
        success: true,
        accessToken: accessTokenResult.token,
        refreshToken: refreshTokenResult.token,
        expiresAt: accessTokenResult.expiresAt,
        sessionId: sessionResult.sessionId,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: user.permissions || []
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Secure login error:', error);
      return this.createErrorResponse('Login failed', 500);
    }
  },

  /**
   * Handle secure token refresh
   */
  async handleTokenRefresh(request, env, jwtManager, clientInfo) {
    try {
      if (request.method !== 'POST') {
        return this.createErrorResponse('Method not allowed', 405);
      }

      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return this.createErrorResponse('Refresh token required', 401);
      }

      const refreshToken = authHeader.substring(7);
      const refreshResult = await jwtManager.refreshToken(refreshToken, clientInfo);

      if (!refreshResult.success) {
        await this.logSecurityEvent('TOKEN_REFRESH_FAILED', {
          reason: refreshResult.error,
          ...clientInfo
        }, env);
        
        return this.createErrorResponse(refreshResult.error, 401);
      }

      await this.logSecurityEvent('TOKEN_REFRESHED', {
        rotated: refreshResult.tokenRotated,
        ...clientInfo
      }, env);

      return new Response(JSON.stringify({
        success: true,
        accessToken: refreshResult.accessToken,
        refreshToken: refreshResult.refreshToken,
        expiresAt: refreshResult.expiresAt,
        tokenRotated: refreshResult.tokenRotated
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Token refresh error:', error);
      return this.createErrorResponse('Token refresh failed', 500);
    }
  },

  /**
   * Handle token verification
   */
  async handleTokenVerification(request, env, jwtManager) {
    try {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return this.createErrorResponse('Access token required', 401);
      }

      const token = authHeader.substring(7);
      const verification = await jwtManager.verifyToken(token);

      if (!verification.success) {
        return this.createErrorResponse(verification.error, 401);
      }

      return new Response(JSON.stringify({
        success: true,
        valid: true,
        payload: verification.payload,
        expiresAt: verification.payload.exp * 1000
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Token verification error:', error);
      return this.createErrorResponse('Token verification failed', 500);
    }
  },

  /**
   * Handle secure logout
   */
  async handleSecureLogout(request, env, jwtManager, sessionManager) {
    try {
      if (request.method !== 'POST') {
        return this.createErrorResponse('Method not allowed', 405);
      }

      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const verification = await jwtManager.verifyToken(token);
        
        if (verification.success) {
          // Revoke token
          await jwtManager.revokeToken(verification.payload.jti, 'USER_LOGOUT');
          
          // Destroy session
          if (verification.payload.session_id) {
            await sessionManager.destroySession(verification.payload.session_id, 'USER_LOGOUT');
          }
          
          // Log logout
          await this.logSecurityEvent('USER_LOGOUT', {
            userId: verification.payload.sub,
            sessionId: verification.payload.session_id
          }, env);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Logged out successfully'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Logout error:', error);
      return this.createErrorResponse('Logout failed', 500);
    }
  },

  /**
   * Handle session management
   */
  async handleSessionManagement(request, env, jwtManager, sessionManager) {
    try {
      // Verify authentication
      const authResult = await this.verifyAuthentication(request, jwtManager);
      if (!authResult.success) {
        return this.createErrorResponse(authResult.error, 401);
      }

      const userId = authResult.payload.sub;
      
      if (request.method === 'GET') {
        // Get user sessions
        const sessionsResult = await sessionManager.getUserSessions(userId);
        return new Response(JSON.stringify(sessionsResult), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } else if (request.method === 'DELETE') {
        // Terminate specific session
        const body = await request.json();
        const { sessionId } = body;
        
        if (sessionId) {
          await sessionManager.destroySession(sessionId, 'USER_TERMINATED');
        }
        
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return this.createErrorResponse('Method not allowed', 405);

    } catch (error) {
      console.error('Session management error:', error);
      return this.createErrorResponse('Session management failed', 500);
    }
  },

  /**
   * Handle security status endpoint
   */
  async handleSecurityStatus(request, env, jwtManager, rateLimiter, sessionManager) {
    try {
      // Verify authentication
      const authResult = await this.verifyAuthentication(request, jwtManager);
      if (!authResult.success) {
        return this.createErrorResponse(authResult.error, 401);
      }

      const userId = authResult.payload.sub;
      
      // Get security status
      const [sessionsResult] = await Promise.all([
        sessionManager.getUserSessions(userId)
      ]);

      const securityStatus = {
        user: {
          id: userId,
          email: authResult.payload.email,
          role: authResult.payload.role
        },
        sessions: {
          active: sessionsResult.success ? sessionsResult.sessions.length : 0,
          limit: 3,
          sessions: sessionsResult.success ? sessionsResult.sessions : []
        },
        security: {
          lastLogin: authResult.payload.iat * 1000,
          tokenExpiry: authResult.payload.exp * 1000,
          sessionId: authResult.payload.session_id
        }
      };

      return new Response(JSON.stringify({
        success: true,
        status: securityStatus
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Security status error:', error);
      return this.createErrorResponse('Security status failed', 500);
    }
  },

  /**
   * Utility methods
   */
  async verifyAuthentication(request, jwtManager) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'Authentication required' };
    }

    const token = authHeader.substring(7);
    return await jwtManager.verifyToken(token);
  },

  async validateUser(email, password, env) {
    // Mock user validation - replace with real database lookup
    const mockUsers = {
      'admin@it-era.it': {
        id: 'user-001',
        email: 'admin@it-era.it',
        name: 'IT-ERA Admin',
        role: 'admin',
        password: 'admin123', // In real app, this would be hashed
        permissions: ['admin', 'read', 'write', 'delete']
      }
    };

    const user = mockUsers[email.toLowerCase()];
    if (!user) {
      return { valid: false, reason: 'USER_NOT_FOUND' };
    }

    // In production, use proper password hashing
    if (user.password !== password) {
      return { valid: false, reason: 'INVALID_PASSWORD' };
    }

    return { valid: true, ...user };
  },

  getActionFromPath(path) {
    if (path.includes('login')) return 'login';
    if (path.includes('refresh')) return 'token';
    return 'api';
  },

  createErrorResponse(message, status = 400, additionalHeaders = {}) {
    return new Response(JSON.stringify({
      success: false,
      error: message
    }), {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...additionalHeaders
      }
    });
  },

  async logSecurityEvent(event, data, env) {
    try {
      const logEntry = {
        event,
        data,
        timestamp: new Date().toISOString(),
        service: 'secure-auth-worker'
      };

      const logKey = `security_log:${Date.now()}:${crypto.randomUUID()}`;
      await env.AUTH_SESSIONS?.put(logKey, JSON.stringify(logEntry), {
        expirationTtl: 86400 * 30 // 30 days
      });
    } catch (error) {
      console.error('Security logging error:', error);
    }
  },

  async logSecurityError(error, clientInfo, path) {
    console.error('Security error:', {
      message: error.message,
      stack: error.stack,
      clientInfo,
      path,
      timestamp: new Date().toISOString()
    });
  }
};