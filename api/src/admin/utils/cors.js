/**
 * CORS utilities for admin API
 */

/**
 * Production-grade CORS configuration for IT-ERA Admin API
 * Implements secure cross-origin resource sharing with strict policies
 */

const ALLOWED_ORIGINS = {
  production: [
    'https://www.it-era.it',
    'https://it-era.it',
    'https://it-era.pages.dev',
    'https://admin.it-era.it'
  ],
  staging: [
    'https://www.it-era.it',
    'https://it-era.it',
    'https://it-era-staging.pages.dev',
    'https://admin-staging.it-era.it'
  ],
  development: [
    'http://localhost:3000',
    'http://localhost:8788',
    'http://127.0.0.1:5500',
    'http://localhost:5173',
    'http://localhost:4173'
  ]
};

/**
 * Get secure CORS headers based on origin and environment
 */
export function getSecureCorsHeaders(origin = null, environment = 'production') {
  const allowedOrigins = [
    ...ALLOWED_ORIGINS.production,
    ...(environment === 'development' ? ALLOWED_ORIGINS.development : []),
    ...(environment === 'staging' ? ALLOWED_ORIGINS.staging : [])
  ];

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
      'X-Rate-Limit-Reset',
      'X-Processing-Time'
    ].join(', '),
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
    
    // Security headers
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  };
}

// Legacy export for backwards compatibility
export const corsHeaders = getSecureCorsHeaders();

export function handleOptions(request) {
  // Handle CORS preflight requests
  return new Response(null, {
    status: 200,
    headers: corsHeaders
  });
}

export function addCorsHeaders(response) {
  // Add CORS headers to existing response
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}