/**
 * Security Middleware for IT-ERA
 * Implements security headers, CSP, HSTS, and other security measures
 */

/**
 * Security configuration
 */
const SECURITY_CONFIG = {
  // Content Security Policy
  csp: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for GTM and inline scripts
      "'unsafe-eval'", // Required for some third-party tools
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com",
      "https://googletagmanager.com",
      "https://connect.facebook.net",
      "https://www.facebook.com",
      "https://cdn.jsdelivr.net",
      "https://cdnjs.cloudflare.com",
      "https://stackpath.bootstrapcdn.com"
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for Bootstrap and custom styles
      "https://cdn.jsdelivr.net",
      "https://cdnjs.cloudflare.com",
      "https://stackpath.bootstrapcdn.com",
      "https://fonts.googleapis.com"
    ],
    'font-src': [
      "'self'",
      "https://fonts.gstatic.com",
      "https://cdn.jsdelivr.net",
      "https://cdnjs.cloudflare.com"
    ],
    'img-src': [
      "'self'",
      "data:",
      "https:",
      "https://www.google-analytics.com",
      "https://googletagmanager.com",
      "https://www.facebook.com"
    ],
    'connect-src': [
      "'self'",
      "https://www.google-analytics.com",
      "https://analytics.google.com",
      "https://googletagmanager.com",
      "https://api.it-era.it",
      "https://*.cloudflare.com"
    ],
    'frame-src': [
      "'self'",
      "https://www.googletagmanager.com",
      "https://www.google.com"
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': []
  },
  
  // Permissions Policy (formerly Feature Policy)
  permissionsPolicy: {
    'camera': ['none'],
    'microphone': ['none'],
    'geolocation': ['self'],
    'payment': ['none'],
    'usb': ['none'],
    'accelerometer': ['none'],
    'gyroscope': ['none'],
    'magnetometer': ['none'],
    'clipboard-write': ['self']
  },
  
  // Security headers
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  }
};

/**
 * Build Content Security Policy header value
 * @param {Object} customCsp - Custom CSP directives to merge
 * @returns {string} CSP header value
 */
export function buildCSPHeader(customCsp = {}) {
  const csp = { ...SECURITY_CONFIG.csp, ...customCsp };
  
  return Object.entries(csp)
    .map(([directive, sources]) => {
      if (sources.length === 0) {
        return directive;
      }
      return `${directive} ${sources.join(' ')}`;
    })
    .join('; ');
}

/**
 * Build Permissions Policy header value
 * @param {Object} customPolicy - Custom permissions to merge
 * @returns {string} Permissions Policy header value
 */
export function buildPermissionsPolicyHeader(customPolicy = {}) {
  const policy = { ...SECURITY_CONFIG.permissionsPolicy, ...customPolicy };
  
  return Object.entries(policy)
    .map(([directive, allowlist]) => {
      const allowlistStr = allowlist.map(origin => 
        origin === 'self' ? '"self"' : origin
      ).join(' ');
      return `${directive}=(${allowlistStr})`;
    })
    .join(', ');
}

/**
 * Get all security headers
 * @param {Object} options - Configuration options
 * @returns {Object} Headers object
 */
export function getSecurityHeaders(options = {}) {
  const {
    customCSP = {},
    customPermissions = {},
    customHeaders = {},
    includeHSTS = true
  } = options;
  
  const headers = {
    'Content-Security-Policy': buildCSPHeader(customCSP),
    'Permissions-Policy': buildPermissionsPolicyHeader(customPermissions),
    ...SECURITY_CONFIG.headers,
    ...customHeaders
  };
  
  // Only include HSTS in production
  if (!includeHSTS || process.env.NODE_ENV !== 'production') {
    delete headers['Strict-Transport-Security'];
  }
  
  return headers;
}

/**
 * Middleware function for Express/Node.js applications
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export function securityMiddleware(req, res, next) {
  const headers = getSecurityHeaders();
  
  // Set security headers
  Object.entries(headers).forEach(([name, value]) => {
    res.setHeader(name, value);
  });
  
  // Additional security measures
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  
  next();
}

/**
 * Generate Cloudflare Workers security headers
 * @param {Object} options - Configuration options
 * @returns {Object} Headers for Cloudflare Workers Response
 */
export function getCloudflareSecurityHeaders(options = {}) {
  const headers = getSecurityHeaders(options);
  
  // Convert to Headers object for Cloudflare Workers
  const cfHeaders = new Headers();
  Object.entries(headers).forEach(([name, value]) => {
    cfHeaders.set(name, value);
  });
  
  return cfHeaders;
}

/**
 * Security middleware for Cloudflare Workers
 * @param {Request} request - Cloudflare Workers request
 * @param {Response} response - Cloudflare Workers response
 * @param {Object} options - Configuration options
 * @returns {Response} Response with security headers
 */
export function addSecurityHeadersToResponse(response, options = {}) {
  const newResponse = new Response(response.body, response);
  const headers = getSecurityHeaders(options);
  
  // Add security headers to response
  Object.entries(headers).forEach(([name, value]) => {
    newResponse.headers.set(name, value);
  });
  
  return newResponse;
}

/**
 * Generate _headers file content for Cloudflare Pages
 * @param {Object} options - Configuration options
 * @returns {string} _headers file content
 */
export function generateCloudflareHeadersFile(options = {}) {
  const headers = getSecurityHeaders(options);
  
  let content = '# Security Headers for IT-ERA\n';
  content += '# Generated automatically - Do not edit manually\n\n';
  content += '/*\n';
  
  Object.entries(headers).forEach(([name, value]) => {
    content += `  ${name}: ${value}\n`;
  });
  
  // Additional Cloudflare-specific optimizations
  content += `  Cache-Control: public, max-age=3600\n`;
  content += `  X-Robots-Tag: index, follow\n`;
  
  return content;
}

/**
 * Validate security configuration
 * @param {Object} config - Security configuration to validate
 * @returns {Object} Validation result
 */
export function validateSecurityConfig(config = SECURITY_CONFIG) {
  const issues = [];
  
  // Check CSP configuration
  if (!config.csp['default-src'] || config.csp['default-src'].length === 0) {
    issues.push('CSP default-src directive is missing or empty');
  }
  
  if (config.csp['script-src'] && config.csp['script-src'].includes("'unsafe-eval'")) {
    issues.push('CSP allows unsafe-eval which may be a security risk');
  }
  
  if (config.csp['object-src'] && !config.csp['object-src'].includes("'none'")) {
    issues.push('CSP should set object-src to none for security');
  }
  
  // Check security headers
  const requiredHeaders = ['X-Content-Type-Options', 'X-Frame-Options', 'X-XSS-Protection'];
  requiredHeaders.forEach(header => {
    if (!config.headers[header]) {
      issues.push(`Missing required security header: ${header}`);
    }
  });
  
  return {
    isValid: issues.length === 0,
    issues,
    warnings: issues.filter(issue => issue.includes('may be')),
    errors: issues.filter(issue => !issue.includes('may be'))
  };
}

/**
 * Get security audit report
 * @returns {Object} Security audit report
 */
export function getSecurityAuditReport() {
  const config = validateSecurityConfig();
  const headers = getSecurityHeaders();
  
  return {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    configuration: {
      validation: config,
      headers: Object.keys(headers),
      csp: {
        directives: Object.keys(SECURITY_CONFIG.csp).length,
        strictness: config.issues.length === 0 ? 'High' : 'Medium'
      }
    },
    recommendations: [
      'Regularly review and update CSP directives',
      'Monitor security headers in production',
      'Consider implementing Content-Security-Policy-Report-Only for testing',
      'Review third-party script sources periodically'
    ]
  };
}

export default {
  buildCSPHeader,
  buildPermissionsPolicyHeader,
  getSecurityHeaders,
  securityMiddleware,
  getCloudflareSecurityHeaders,
  addSecurityHeadersToResponse,
  generateCloudflareHeadersFile,
  validateSecurityConfig,
  getSecurityAuditReport
};