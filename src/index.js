/**
 * IT-ERA Main Application Entry Point
 * Handles routing, security, and analytics for the main site
 */

import { addSecurityHeadersToResponse } from './middleware/security.js';
import { detectEnvironment, shouldLoadAnalytics } from './lib/analytics.js';

/**
 * Main request handler for Cloudflare Workers/Pages Functions
 * @param {Request} request - Incoming request
 * @param {Object} env - Environment bindings
 * @param {Object} ctx - Execution context
 * @returns {Response} Response with security headers and analytics
 */
export default async function handler(request, env, ctx) {
  const url = new URL(request.url);
  
  try {
    // Handle API routes
    if (url.pathname.startsWith('/api/')) {
      return await handleAPIRoute(request, env, ctx);
    }
    
    // Handle static files
    if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$/)) {
      return await handleStaticFile(request, env, ctx);
    }
    
    // Handle sitemap.xml
    if (url.pathname === '/sitemap.xml') {
      return await handleSitemap(request, env);
    }
    
    // Handle robots.txt
    if (url.pathname === '/robots.txt') {
      return await handleRobots(request, env);
    }
    
    // Handle main site pages
    return await handlePageRequest(request, env, ctx);
    
  } catch (error) {
    console.error('Handler error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

/**
 * Handle API routes
 */
async function handleAPIRoute(request, env, ctx) {
  // Placeholder for API routing
  // This would integrate with existing API workers
  return new Response('API endpoints handled by separate workers', {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Handle static files with appropriate caching
 */
async function handleStaticFile(request, env, ctx) {
  // Use default Cloudflare Pages static file handling
  const response = await env.ASSETS.fetch(request);
  
  // Add security headers to static files
  return addSecurityHeadersToResponse(response, {
    customHeaders: {
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  });
}

/**
 * Handle sitemap.xml requests
 */
async function handleSitemap(request, env) {
  try {
    // Try to get sitemap from KV cache first
    const cachedSitemap = await env.SITE_CONFIG?.get('sitemap.xml');
    
    if (cachedSitemap) {
      return new Response(cachedSitemap, {
        headers: {
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=86400'
        }
      });
    }
    
    // Fallback to static sitemap.xml file
    const response = await env.ASSETS.fetch(request);
    return addSecurityHeadersToResponse(response);
    
  } catch (error) {
    console.error('Sitemap error:', error);
    return new Response('Sitemap not found', { status: 404 });
  }
}

/**
 * Handle robots.txt requests
 */
async function handleRobots(request, env) {
  const robotsContent = `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${env.SITE_URL || 'https://it-era.it'}/sitemap.xml

# Disallow admin areas
Disallow: /admin/
Disallow: /api/admin/
Disallow: /_*
Disallow: /test*

# Allow important pages
Allow: /pages/
Allow: /blog/
Allow: /assets/`;

  return new Response(robotsContent, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400'
    }
  });
}

/**
 * Handle main page requests with analytics injection
 */
async function handlePageRequest(request, env, ctx) {
  try {
    // Get the page from static assets
    const response = await env.ASSETS.fetch(request);
    
    if (!response.ok) {
      return response;
    }
    
    const contentType = response.headers.get('Content-Type');
    
    // Only process HTML pages
    if (!contentType || !contentType.includes('text/html')) {
      return addSecurityHeadersToResponse(response);
    }
    
    // Read HTML content
    let html = await response.text();
    
    // Inject analytics if in production environment
    html = await injectAnalytics(html, env);
    
    // Create new response with modified HTML
    const modifiedResponse = new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
    
    // Add security headers
    return addSecurityHeadersToResponse(modifiedResponse);
    
  } catch (error) {
    console.error('Page handling error:', error);
    return new Response('Page not found', { status: 404 });
  }
}

/**
 * Inject analytics scripts based on environment
 */
async function injectAnalytics(html, env) {
  const environment = env.ENVIRONMENT || 'production';
  
  // Only inject analytics in production and staging
  if (environment === 'development') {
    return html;
  }
  
  const analyticsScript = `
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${env.GA4_ID || 'G-T5VWN9EH21'}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${env.GA4_ID || 'G-T5VWN9EH21'}', {
    page_title: document.title,
    page_location: window.location.href,
    anonymize_ip: true
  });
</script>

<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${env.GTM_ID || 'GTM-KPF3JZT'}');</script>
<!-- End Google Tag Manager -->`;

  const noscriptGTM = `
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${env.GTM_ID || 'GTM-KPF3JZT'}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`;
  
  // Inject analytics script in head
  html = html.replace('</head>', `${analyticsScript}\n</head>`);
  
  // Inject GTM noscript after opening body tag
  html = html.replace('<body>', `<body>\n${noscriptGTM}`);
  
  return html;
}

// Export for environments that need named exports
export { handler };