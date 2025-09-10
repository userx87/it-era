/**
 * IT-ERA Domain Configuration
 * Manages domain settings for different environments
 */

const domains = {
    production: {
        primary: 'https://it-era.com',
        alternatives: [
            'https://www.it-era.com',
            'https://it-era.it',
            'https://www.it-era.it'
        ],
        vercel: 'https://it-rgxoa648j-andreas-projects-d0af77c4.vercel.app'
    },
    development: {
        primary: 'http://localhost:3000',
        alternatives: [],
        vercel: 'https://it-rgxoa648j-andreas-projects-d0af77c4.vercel.app'
    }
};

/**
 * Get the appropriate domain for the current environment
 */
function getDomain(env = 'production') {
    const config = domains[env] || domains.production;
    
    // Check if custom domain is available, fallback to Vercel
    return process.env.CUSTOM_DOMAIN || config.primary || config.vercel;
}

/**
 * Get canonical URL for a specific path
 */
function getCanonicalUrl(path = '', env = 'production') {
    const domain = getDomain(env);
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${domain}${cleanPath}`;
}

/**
 * Get all domain alternatives for redirects
 */
function getDomainAlternatives(env = 'production') {
    const config = domains[env] || domains.production;
    return config.alternatives || [];
}

/**
 * Check if domain is custom (not Vercel)
 */
function isCustomDomain(env = 'production') {
    const domain = getDomain(env);
    return !domain.includes('vercel.app');
}

module.exports = {
    domains,
    getDomain,
    getCanonicalUrl,
    getDomainAlternatives,
    isCustomDomain
};
