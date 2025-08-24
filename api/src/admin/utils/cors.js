/**
 * CORS utilities for admin API
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'true'
};

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