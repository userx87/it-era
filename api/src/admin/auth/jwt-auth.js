/**
 * JWT Authentication System for IT-ERA Admin Panel
 * Handles user authentication, token generation, and validation
 */

import { corsHeaders } from '../utils/cors.js';
import { hashPassword, verifyPassword } from '../utils/crypto.js';

export class JWTAuth {
  constructor(env) {
    this.env = env;
    this.secret = env.JWT_SECRET || 'it-era-admin-secret-2024';
    this.issuer = 'it-era.it';
    this.audience = 'it-era-admin';
  }

  /**
   * Generate JWT token
   */
  async generateToken(payload, expiresIn = '24h') {
    const now = Math.floor(Date.now() / 1000);
    
    // Convert expiresIn to seconds
    let exp = now;
    if (expiresIn === '24h') exp += 24 * 60 * 60;
    else if (expiresIn === '7d') exp += 7 * 24 * 60 * 60;
    else if (expiresIn === '30d') exp += 30 * 24 * 60 * 60;
    else exp += 3600; // default 1 hour

    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const jwtPayload = {
      ...payload,
      iss: this.issuer,
      aud: this.audience,
      iat: now,
      exp: exp
    };

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(this.secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const encodedHeader = this.base64urlEncode(JSON.stringify(header));
    const encodedPayload = this.base64urlEncode(JSON.stringify(jwtPayload));
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;

    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(unsignedToken)
    );

    const encodedSignature = this.base64urlEncode(new Uint8Array(signature));
    return `${unsignedToken}.${encodedSignature}`;
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { success: false, error: 'Invalid token format' };
      }

      const [headerB64, payloadB64, signatureB64] = parts;
      const header = JSON.parse(this.base64urlDecode(headerB64));
      const payload = JSON.parse(this.base64urlDecode(payloadB64));

      // Verify algorithm
      if (header.alg !== 'HS256') {
        return { success: false, error: 'Invalid algorithm' };
      }

      // Verify signature
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

      const isValid = await crypto.subtle.verify(
        'HMAC',
        key,
        signature,
        encoder.encode(unsignedToken)
      );

      if (!isValid) {
        return { success: false, error: 'Invalid signature' };
      }

      // Verify expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return { success: false, error: 'Token expired' };
      }

      // Verify issuer and audience
      if (payload.iss !== this.issuer || payload.aud !== this.audience) {
        return { success: false, error: 'Invalid token claims' };
      }

      return { success: true, payload };
    } catch (error) {
      return { success: false, error: 'Token verification failed' };
    }
  }

  /**
   * User login
   */
  async login(request) {
    try {
      const body = await request.json();
      const { email, password } = body;

      if (!email || !password) {
        return new Response(JSON.stringify({
          error: 'Email and password are required'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Get user from database
      const user = await this.getUserByEmail(email);
      if (!user) {
        return new Response(JSON.stringify({
          error: 'Invalid credentials'
        }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Verify password
      const passwordValid = await verifyPassword(password, user.password_hash);
      if (!passwordValid) {
        return new Response(JSON.stringify({
          error: 'Invalid credentials'
        }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Update last login
      await this.updateLastLogin(user.id);

      // Generate token
      const token = await this.generateToken({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      });

      return new Response(JSON.stringify({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      return new Response(JSON.stringify({
        error: 'Login failed',
        message: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }

  /**
   * User registration
   */
  async register(request) {
    try {
      const body = await request.json();
      const { email, password, name } = body;

      if (!email || !password || !name) {
        return new Response(JSON.stringify({
          error: 'Email, password, and name are required'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Check if user already exists
      const existingUser = await this.getUserByEmail(email);
      if (existingUser) {
        return new Response(JSON.stringify({
          error: 'User already exists'
        }), {
          status: 409,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Validate password strength
      if (password.length < 8) {
        return new Response(JSON.stringify({
          error: 'Password must be at least 8 characters long'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      const userId = await this.createUser({
        email,
        name,
        password_hash: passwordHash,
        role: 'author' // Default role
      });

      // Generate token
      const token = await this.generateToken({
        id: userId,
        email,
        name,
        role: 'author'
      });

      return new Response(JSON.stringify({
        success: true,
        token,
        user: {
          id: userId,
          email,
          name,
          role: 'author'
        }
      }), {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      return new Response(JSON.stringify({
        error: 'Registration failed',
        message: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }

  /**
   * Authenticate request
   */
  async authenticate(request) {
    try {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { success: false, error: 'Missing or invalid authorization header' };
      }

      const token = authHeader.substring(7);
      const verification = await this.verifyToken(token);
      
      if (!verification.success) {
        return verification;
      }

      // Get fresh user data
      const user = await this.getUserById(verification.payload.id);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      return { success: true, user };
    } catch (error) {
      return { success: false, error: 'Authentication failed' };
    }
  }

  /**
   * Database operations
   */
  async getUserByEmail(email) {
    try {
      const result = await this.env.BLOG_DB.prepare(
        'SELECT * FROM users WHERE email = ? AND active = 1'
      ).bind(email).first();
      
      return result;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }

  async getUserById(id) {
    try {
      const result = await this.env.BLOG_DB.prepare(
        'SELECT * FROM users WHERE id = ? AND active = 1'
      ).bind(id).first();
      
      return result;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  async createUser(userData) {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      
      await this.env.BLOG_DB.prepare(`
        INSERT INTO users (id, email, name, password_hash, role, created_at, updated_at, active)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `).bind(
        id,
        userData.email,
        userData.name,
        userData.password_hash,
        userData.role,
        now,
        now
      ).run();
      
      return id;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateLastLogin(userId) {
    try {
      const now = new Date().toISOString();
      await this.env.BLOG_DB.prepare(
        'UPDATE users SET last_login = ? WHERE id = ?'
      ).bind(now, userId).run();
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  /**
   * Utility functions
   */
  base64urlEncode(str) {
    const encoded = btoa(str);
    return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
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
}