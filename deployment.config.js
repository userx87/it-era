/**
 * IT-ERA Deployment Configuration
 * Unified configuration for all deployment platforms
 */

module.exports = {
  // Site information
  site: {
    name: 'IT-ERA',
    title: 'IT-ERA - Assistenza IT Professionale in Lombardia',
    description: 'Assistenza informatica professionale per aziende in Lombardia. Supporto IT, sicurezza informatica, cloud e digitalizzazione.',
    keywords: 'assistenza informatica, IT support, Lombardia, Milano, Bergamo, sicurezza informatica',
    author: 'IT-ERA Team',
    language: 'it'
  },

  // Deployment platforms
  platforms: {
    'github-pages': {
      url: 'https://userx87.github.io/it-era',
      buildCommand: 'npm run build:github-pages',
      outputDir: '_site',
      baseUrl: '/it-era/',
      staticOnly: true
    },
    'vercel': {
      url: 'https://it-era.vercel.app',
      buildCommand: 'npm run build',
      outputDir: 'public',
      baseUrl: '/',
      serverless: true,
      functions: ['api/index.js']
    },
    'cloudflare-pages': {
      url: 'https://it-era.pages.dev',
      buildCommand: 'npm run build',
      outputDir: 'public',
      baseUrl: '/',
      edge: true
    }
  },

  // Build configuration
  build: {
    sourceDir: 'public',
    excludePatterns: [
      '*.php',
      '*.tmp',
      '*.log',
      'node_modules',
      '.git',
      '.env*',
      'tests'
    ],
    processTemplates: true,
    optimizeAssets: true,
    generateSitemap: true
  },

  // SEO configuration
  seo: {
    generateRobotsTxt: true,
    generateSitemap: true,
    enableOpenGraph: true,
    enableTwitterCards: true,
    enableStructuredData: true
  },

  // Performance optimization
  performance: {
    minifyHTML: false, // Keep readable for debugging
    minifyCSS: true,
    minifyJS: true,
    optimizeImages: true,
    enableCaching: true,
    cacheMaxAge: 31536000 // 1 year for static assets
  },

  // Security headers
  security: {
    contentSecurityPolicy: true,
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    xXSSProtection: '1; mode=block',
    strictTransportSecurity: true
  },

  // Pages metadata
  pages: {
    'index.html': {
      title: 'IT-ERA - Assistenza IT Professionale in Lombardia',
      description: 'Assistenza informatica professionale per aziende in Lombardia. Supporto IT, sicurezza informatica, cloud e digitalizzazione.',
      keywords: 'assistenza informatica, IT support, Lombardia, Milano, Bergamo, sicurezza informatica',
      priority: 1.0,
      changefreq: 'weekly'
    },
    'servizi.html': {
      title: 'Servizi IT Professionali - IT-ERA',
      description: 'Scopri i nostri servizi IT: assistenza tecnica, sicurezza informatica, cloud computing e digitalizzazione aziendale.',
      keywords: 'servizi IT, assistenza tecnica, sicurezza informatica, cloud computing',
      priority: 0.9,
      changefreq: 'weekly'
    },
    'contatti.html': {
      title: 'Contatti - IT-ERA',
      description: 'Contatta IT-ERA per assistenza informatica professionale. Siamo presenti in tutta la Lombardia.',
      keywords: 'contatti, assistenza informatica, IT support, Lombardia',
      priority: 0.8,
      changefreq: 'monthly'
    }
  },

  // Environment-specific overrides
  environments: {
    development: {
      minify: false,
      sourceMap: true,
      debug: true
    },
    staging: {
      minify: true,
      sourceMap: false,
      debug: false
    },
    production: {
      minify: true,
      sourceMap: false,
      debug: false,
      analytics: true
    }
  }
};
