/**
 * IT-ERA Admin Authentication Worker
 * Standalone Cloudflare Workers implementation for admin panel authentication
 * 
 * Endpoints:
 * POST /admin/api/auth/login - User login
 * POST /admin/api/auth/verify - Token verification
 * OPTIONS /admin/api/auth/* - CORS preflight
 */

// CORS headers for admin panel
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://it-era.pages.dev',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'true',
  'Content-Type': 'application/json'
};

// Test user credentials for development
const TEST_USERS = {
  'admin@it-era.it': {
    id: 'admin-001',
    email: 'admin@it-era.it',
    name: 'IT-ERA Admin',
    role: 'admin',
    password: 'admin123',
    avatar: '/assets/admin-avatar.png'
  }
};

export default {
  async fetch(request, env) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders
      });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // Route handling
      if (path === '/admin/api/auth/login' && request.method === 'POST') {
        return await handleLogin(request, env);
      } else if (path === '/admin/api/auth/verify' && request.method === 'GET') {
        return await handleVerify(request, env);
      } else if (path === '/admin/api/posts' && request.method === 'GET') {
        return await handlePosts(request, env);
      } else if (path === '/admin/api/dashboard' && request.method === 'GET') {
        return await handleDashboard(request, env);
      } else if (path === '/health' && request.method === 'GET') {
        return await handleHealth(request, env);
      } else {
        return createErrorResponse('Endpoint not found', 404);
      }

    } catch (error) {
      console.error('Worker error:', error);
      return createErrorResponse('Internal server error', 500);
    }
  }
};

/**
 * Handle login request
 */
async function handleLogin(request, env) {
  try {
    console.log('Login request received');
    
    const body = await request.json();
    const { email, password } = body;
    
    console.log('Parsed body:', { email, hasPassword: !!password });

    // Validate input
    if (!email || !password) {
      console.log('Missing email or password');
      return createErrorResponse('Email and password are required', 400);
    }

    // For development/testing - check against test user
    const testUser = TEST_USERS[email.toLowerCase()];
    console.log('Test user found:', !!testUser);
    
    if (!testUser) {
      console.log('User not found:', email);
      return createErrorResponse('Invalid credentials', 401);
    }

    // Verify password (in production, this would hash and compare)
    console.log('Password check:', password, testUser.password);
    if (password !== testUser.password) {
      console.log('Password mismatch');
      return createErrorResponse('Invalid credentials', 401);
    }

    // Generate JWT token
    console.log('Generating JWT token');
    const tokenPayload = {
      sub: testUser.id, // Standard JWT 'sub' claim
      id: testUser.id,
      email: testUser.email,
      name: testUser.name,
      role: testUser.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    console.log('Token payload:', tokenPayload);

    const token = await generateJWT(tokenPayload, env.JWT_SECRET || 'it-era-admin-secret-2024');
    console.log('JWT token generated, length:', token.length);

    // Store session information via hooks
    await storeSessionInfo(testUser, env);

    const response = {
      success: true,
      token: token,
      user: {
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
        avatar: testUser.avatar
      }
    };
    
    console.log('Login successful, returning response');

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    return createErrorResponse('Login failed: ' + error.message, 500);
  }
}

/**
 * Handle token verification
 */
async function handleVerify(request, env) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createErrorResponse('Missing or invalid authorization header', 401);
    }

    const token = authHeader.substring(7);
    const verification = await verifyJWT(token, env.JWT_SECRET || 'it-era-admin-secret-2024');

    if (!verification.success) {
      return createErrorResponse(verification.error, 401);
    }

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: verification.payload.id,
        email: verification.payload.email,
        name: verification.payload.name,
        role: verification.payload.role
      }
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Verification error:', error);
    return createErrorResponse('Token verification failed', 401);
  }
}

/**
 * Generate JWT token using HS256
 */
async function generateJWT(payload, secret) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(unsignedToken)
  );

  const encodedSignature = base64urlEncode(Array.from(new Uint8Array(signature)));
  return `${unsignedToken}.${encodedSignature}`;
}

/**
 * Verify JWT token
 */
async function verifyJWT(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { success: false, error: 'Invalid token format' };
    }

    const [headerB64, payloadB64, signatureB64] = parts;
    const header = JSON.parse(base64urlDecode(headerB64));
    const payload = JSON.parse(base64urlDecode(payloadB64));

    // Verify algorithm
    if (header.alg !== 'HS256') {
      return { success: false, error: 'Invalid algorithm' };
    }

    // Verify signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const unsignedToken = `${headerB64}.${payloadB64}`;
    const signature = base64urlDecodeToArrayBuffer(signatureB64);

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

    return { success: true, payload };
  } catch (error) {
    return { success: false, error: 'Token verification failed' };
  }
}

/**
 * Store session information using hooks
 */
async function storeSessionInfo(user, env) {
  try {
    const sessionData = {
      userId: user.id,
      email: user.email,
      loginTime: new Date().toISOString(),
      role: user.role
    };

    console.log('Session info stored for user:', user.id);
    // Note: In production, this would store in KV or D1 database

  } catch (error) {
    console.error('Error storing session info:', error);
    // Don't fail login if session storage fails
  }
}

/**
 * Utility functions
 */
function base64urlEncode(data) {
  if (Array.isArray(data)) {
    // Convert array of bytes to string
    const str = String.fromCharCode.apply(null, data);
    const encoded = btoa(str);
    return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  } else {
    // Handle string data
    const encoded = btoa(data);
    return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }
}

function base64urlDecode(str) {
  const padded = str + '==='.slice(0, (4 - str.length % 4) % 4);
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  return atob(base64);
}

function base64urlDecodeToArrayBuffer(str) {
  const padded = str + '==='.slice(0, (4 - str.length % 4) % 4);
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Handle posts API endpoint
 */
async function handlePosts(request, env) {
  try {
    // Verify authentication
    const authResult = await verifyAuthHeader(request, env);
    if (!authResult.success) {
      return createErrorResponse(authResult.error, 401);
    }

    // Mock posts data for now
    const posts = [
      {
        id: 1,
        title: "IT-ERA Services Update",
        content: "Nuovi servizi disponibili per le aziende di Milano e Lombardia",
        author: "Admin",
        date: "2025-01-25",
        status: "published"
      },
      {
        id: 2,
        title: "Sicurezza Informatica",
        content: "Importanza della sicurezza informatica per le PMI",
        author: "Admin", 
        date: "2025-01-24",
        status: "draft"
      }
    ];

    return new Response(JSON.stringify({
      success: true,
      posts: posts,
      total: posts.length
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Posts API error:', error);
    return createErrorResponse('Failed to fetch posts', 500);
  }
}

/**
 * Handle dashboard API endpoint
 */
async function handleDashboard(request, env) {
  try {
    // Verify authentication
    const authResult = await verifyAuthHeader(request, env);
    if (!authResult.success) {
      return createErrorResponse(authResult.error, 401);
    }

    // Mock dashboard data
    const dashboardData = {
      stats: {
        totalPosts: 2,
        publishedPosts: 1,
        draftPosts: 1,
        totalViews: 1250,
        newLeads: 15
      },
      recentActivity: [
        { action: "New lead from Milano", timestamp: "2025-01-25T10:30:00Z" },
        { action: "Post published", timestamp: "2025-01-25T09:15:00Z" },
        { action: "Admin login", timestamp: "2025-01-25T08:45:00Z" }
      ],
      quickActions: [
        { name: "Create Post", url: "/admin/posts/new" },
        { name: "View Analytics", url: "/admin/analytics" },
        { name: "Manage Settings", url: "/admin/settings" }
      ]
    };

    return new Response(JSON.stringify({
      success: true,
      data: dashboardData
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return createErrorResponse('Failed to fetch dashboard data', 500);
  }
}

/**
 * Handle health check endpoint
 */
async function handleHealth(request, env) {
  try {
    const healthData = {
      status: 'healthy',
      service: 'IT-ERA Admin API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        login: '/admin/api/auth/login',
        verify: '/admin/api/auth/verify',
        posts: '/admin/api/posts',
        dashboard: '/admin/api/dashboard'
      }
    };

    return new Response(JSON.stringify(healthData), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Health check error:', error);
    return createErrorResponse('Health check failed', 500);
  }
}

/**
 * Verify authorization header and extract user info
 */
async function verifyAuthHeader(request, env) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'Missing or invalid authorization header' };
    }

    const token = authHeader.substring(7);
    const verification = await verifyJWT(token, env.JWT_SECRET || 'it-era-admin-secret-2024');

    if (!verification.success) {
      return { success: false, error: verification.error };
    }

    return { success: true, user: verification.payload };
  } catch (error) {
    return { success: false, error: 'Authentication failed' };
  }
}

function createErrorResponse(message, status = 400) {
  return new Response(JSON.stringify({
    success: false,
    error: message
  }), {
    status: status,
    headers: corsHeaders
  });
}