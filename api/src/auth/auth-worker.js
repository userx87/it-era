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
    password: 'admin123!',
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
      } else if (path === '/admin/api/auth/verify' && request.method === 'POST') {
        return await handleVerify(request, env);
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
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return createErrorResponse('Email and password are required', 400);
    }

    // For development/testing - check against test user
    const testUser = TEST_USERS[email.toLowerCase()];
    if (!testUser) {
      return createErrorResponse('Invalid credentials', 401);
    }

    // Verify password (in production, this would hash and compare)
    if (password !== testUser.password) {
      return createErrorResponse('Invalid credentials', 401);
    }

    // Generate JWT token
    const tokenPayload = {
      id: testUser.id,
      email: testUser.email,
      name: testUser.name,
      role: testUser.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    const token = await generateJWT(tokenPayload, env.JWT_SECRET || 'it-era-admin-secret-2024');

    // Store session information via hooks
    await storeSessionInfo(testUser, env);

    return new Response(JSON.stringify({
      success: true,
      token: token,
      user: {
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
        avatar: testUser.avatar
      }
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Login error:', error);
    return createErrorResponse('Login failed', 500);
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

  const encodedSignature = base64urlEncode(new Uint8Array(signature));
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

    // Store in memory for coordination
    await fetch('http://localhost:3000/hooks/memory-store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: `auth/session/${user.id}`,
        value: JSON.stringify(sessionData),
        ttl: 86400 // 24 hours
      })
    }).catch(() => {}); // Silent fail if hooks not available

  } catch (error) {
    console.error('Error storing session info:', error);
    // Don't fail login if session storage fails
  }
}

/**
 * Utility functions
 */
function base64urlEncode(str) {
  const encoded = btoa(str);
  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
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

function createErrorResponse(message, status = 400) {
  return new Response(JSON.stringify({
    success: false,
    error: message
  }), {
    status: status,
    headers: corsHeaders
  });
}