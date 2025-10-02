/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output configuration for Cloudflare Pages
  output: 'standalone',

  // Cloudflare Pages environment
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://it-era.it',
  },

  // Image optimization (Cloudflare handles this)
  images: {
    unoptimized: true,
  },

  // Disable x-powered-by header
  poweredByHeader: false,

  // Enable React strict mode
  reactStrictMode: true,

  // SWC minification
  swcMinify: true,

  // Experimental features for better Cloudflare compatibility
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Headers configuration
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      // Redirect old contact page
      {
        source: '/contatti-old.html',
        destination: '/contatti.html',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;