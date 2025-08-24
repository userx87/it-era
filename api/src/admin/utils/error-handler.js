/**
 * Centralized error handling for admin API
 */

import { corsHeaders } from './cors.js';

export function errorHandler(error, request = null) {
  console.error('API Error:', error);

  // Determine error type and appropriate response
  let status = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';

  if (error.name === 'ValidationError') {
    status = 400;
    message = error.message;
    code = 'VALIDATION_ERROR';
  } else if (error.name === 'AuthenticationError') {
    status = 401;
    message = 'Authentication required';
    code = 'AUTH_REQUIRED';
  } else if (error.name === 'AuthorizationError') {
    status = 403;
    message = 'Insufficient permissions';
    code = 'INSUFFICIENT_PERMISSIONS';
  } else if (error.name === 'NotFoundError') {
    status = 404;
    message = 'Resource not found';
    code = 'NOT_FOUND';
  } else if (error.name === 'ConflictError') {
    status = 409;
    message = error.message;
    code = 'CONFLICT';
  } else if (error.name === 'RateLimitError') {
    status = 429;
    message = 'Too many requests';
    code = 'RATE_LIMIT';
  }

  const errorResponse = {
    error: true,
    code,
    message,
    timestamp: new Date().toISOString()
  };

  // Add request context in development
  if (process.env.NODE_ENV === 'development' && request) {
    errorResponse.request = {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries())
    };
    errorResponse.stack = error.stack;
  }

  return new Response(JSON.stringify(errorResponse), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

export class ValidationError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class AuthenticationError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  constructor(resource = 'Resource') {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends Error {
  constructor(message = 'Too many requests') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export function asyncHandler(fn) {
  return async (req, env, ctx) => {
    try {
      return await fn(req, env, ctx);
    } catch (error) {
      return errorHandler(error, req);
    }
  };
}

export function validateRequired(data, fields) {
  const missing = [];
  
  for (const field of fields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      missing.push(field);
    }
  }

  if (missing.length > 0) {
    throw new ValidationError(`Missing required fields: ${missing.join(', ')}`);
  }
}

export function validateTypes(data, schema) {
  const errors = [];

  for (const [field, expectedType] of Object.entries(schema)) {
    if (data[field] !== undefined) {
      const actualType = typeof data[field];
      
      if (expectedType === 'array' && !Array.isArray(data[field])) {
        errors.push(`${field} must be an array`);
      } else if (expectedType !== 'array' && actualType !== expectedType) {
        errors.push(`${field} must be of type ${expectedType}, got ${actualType}`);
      }
    }
  }

  if (errors.length > 0) {
    throw new ValidationError('Type validation failed', errors);
  }
}

export function sanitizeError(error) {
  // Remove sensitive information from error messages
  const sensitivePatterns = [
    /password/gi,
    /token/gi,
    /secret/gi,
    /key/gi,
    /auth/gi
  ];

  let message = error.message;
  
  sensitivePatterns.forEach(pattern => {
    message = message.replace(pattern, '[REDACTED]');
  });

  return {
    ...error,
    message
  };
}