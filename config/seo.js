/**
 * IT-ERA SEO Configuration
 * Manages SEO settings, structured data, and meta tags
 */

const { getDomain } = require('./domains');

const seoConfig = {
    // Business Information
    business: {
        name: 'IT-ERA',
        legalName: 'IT-ERA S.r.l.',
        description: 'Assistenza informatica professionale 24/7 per aziende in Lombardia. Supporto tecnico specializzato, cybersecurity e soluzioni IT professionali.',
        foundingDate: '2020-01-01',
        email: 'info@it-era.it',
        phone: '+39 039 888 2041',
        whatsapp: '+39 039 888 2041',
        address: {
            streetAddress: 'Via Roma 123',
            addressLocality: 'Vimercate',
            addressRegion: 'Lombardia',
            postalCode: '20871',
            addressCountry: 'IT'
        },
        geo: {
            latitude: '45.6167',
            longitude: '9.3667'
        },
        serviceArea: 'Lombardia, Italia',
        priceRange: '€€',
        openingHours: [
            'Mo-Fr 08:00-18:00',
            'Sa 09:00-13:00'
        ]
    },

    // Services
    services: [
        {
            name: 'Assistenza Tecnica IT',
            description: 'Supporto tecnico professionale on-site e remoto per aziende',
            category: 'IT Support'
        },
        {
            name: 'Cybersecurity',
            description: 'Protezione avanzata contro minacce informatiche e data breach',
            category: 'Security'
        },
        {
            name: 'Cloud Storage',
            description: 'Soluzioni cloud sicure per backup e archiviazione dati',
            category: 'Cloud Services'
        },
        {
            name: 'Microsoft 365',
            description: 'Implementazione e gestione suite Microsoft per aziende',
            category: 'Software Solutions'
        },
        {
            name: 'Networking',
            description: 'Progettazione e gestione reti aziendali e VoIP',
            category: 'Network Solutions'
        },
        {
            name: 'Backup e Disaster Recovery',
            description: 'Strategie di backup e ripristino per continuità aziendale',
            category: 'Data Protection'
        }
    ],

    // Cities served
    cities: [
        'Milano', 'Bergamo', 'Brescia', 'Como', 'Varese', 'Monza',
        'Pavia', 'Cremona', 'Mantova', 'Lecco', 'Sondrio', 'Lodi'
    ],

    // Social Media
    socialMedia: {
        facebook: 'https://www.facebook.com/itera',
        linkedin: 'https://www.linkedin.com/company/it-era',
        twitter: 'https://twitter.com/itera',
        instagram: 'https://www.instagram.com/itera'
    },

    // Default meta tags
    defaultMeta: {
        keywords: 'assistenza informatica, IT support, cybersecurity, Lombardia, Milano, Bergamo, supporto tecnico, cloud storage, Microsoft 365',
        author: 'IT-ERA Team',
        robots: 'index, follow',
        language: 'it-IT',
        themeColor: '#0066cc'
    }
};

/**
 * Generate structured data for Local Business
 */
function generateLocalBusinessSchema(env = 'production') {
    const baseUrl = getDomain(env);
    
    return {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        '@id': `${baseUrl}/#organization`,
        name: seoConfig.business.name,
        legalName: seoConfig.business.legalName,
        description: seoConfig.business.description,
        foundingDate: seoConfig.business.foundingDate,
        url: baseUrl,
        logo: `${baseUrl}/images/logo.png`,
        image: `${baseUrl}/images/og-image.jpg`,
        telephone: seoConfig.business.phone,
        email: seoConfig.business.email,
        address: {
            '@type': 'PostalAddress',
            ...seoConfig.business.address
        },
        geo: {
            '@type': 'GeoCoordinates',
            ...seoConfig.business.geo
        },
        areaServed: {
            '@type': 'State',
            name: seoConfig.business.serviceArea
        },
        openingHours: seoConfig.business.openingHours,
        priceRange: seoConfig.business.priceRange,
        sameAs: Object.values(seoConfig.socialMedia),
        hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: 'Servizi IT',
            itemListElement: seoConfig.services.map((service, index) => ({
                '@type': 'Offer',
                itemOffered: {
                    '@type': 'Service',
                    name: service.name,
                    description: service.description,
                    category: service.category
                }
            }))
        }
    };
}

/**
 * Generate structured data for Organization
 */
function generateOrganizationSchema(env = 'production') {
    const baseUrl = getDomain(env);
    
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': `${baseUrl}/#organization`,
        name: seoConfig.business.name,
        legalName: seoConfig.business.legalName,
        url: baseUrl,
        logo: `${baseUrl}/images/logo.png`,
        contactPoint: {
            '@type': 'ContactPoint',
            telephone: seoConfig.business.phone,
            contactType: 'customer service',
            availableLanguage: 'Italian'
        },
        address: {
            '@type': 'PostalAddress',
            ...seoConfig.business.address
        },
        sameAs: Object.values(seoConfig.socialMedia)
    };
}

/**
 * Generate structured data for Website
 */
function generateWebsiteSchema(env = 'production') {
    const baseUrl = getDomain(env);
    
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': `${baseUrl}/#website`,
        url: baseUrl,
        name: seoConfig.business.name,
        description: seoConfig.business.description,
        publisher: {
            '@id': `${baseUrl}/#organization`
        },
        potentialAction: {
            '@type': 'SearchAction',
            target: `${baseUrl}/search?q={search_term_string}`,
            'query-input': 'required name=search_term_string'
        }
    };
}

/**
 * Generate structured data for Service pages
 */
function generateServiceSchema(serviceName, city, env = 'production') {
    const baseUrl = getDomain(env);
    const service = seoConfig.services.find(s => 
        s.name.toLowerCase().includes(serviceName.toLowerCase())
    );
    
    if (!service) return null;
    
    return {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: `${service.name} ${city}`,
        description: `${service.description} a ${city}, Lombardia`,
        provider: {
            '@id': `${baseUrl}/#organization`
        },
        areaServed: {
            '@type': 'City',
            name: city,
            containedInPlace: {
                '@type': 'State',
                name: 'Lombardia'
            }
        },
        serviceType: service.category,
        url: `${baseUrl}/assistenza-it-${city.toLowerCase()}`
    };
}

/**
 * Generate breadcrumb structured data
 */
function generateBreadcrumbSchema(breadcrumbs, env = 'production') {
    const baseUrl = getDomain(env);
    
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((crumb, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: crumb.name,
            item: `${baseUrl}${crumb.url}`
        }))
    };
}

/**
 * Get SEO meta tags for a page
 */
function getPageMeta(pageType, data = {}, env = 'production') {
    const baseUrl = getDomain(env);
    const meta = { ...seoConfig.defaultMeta };
    
    switch (pageType) {
        case 'homepage':
            meta.title = 'IT-ERA - Assistenza IT Professionale in Lombardia';
            meta.description = 'Assistenza informatica 24/7 per aziende in Lombardia. Supporto tecnico specializzato, cybersecurity e soluzioni IT professionali.';
            meta.canonicalUrl = baseUrl;
            break;
            
        case 'services':
            meta.title = 'Servizi IT Professionali - IT-ERA';
            meta.description = 'Scopri tutti i nostri servizi IT: assistenza tecnica, cybersecurity, cloud storage, backup e disaster recovery.';
            meta.canonicalUrl = `${baseUrl}/servizi`;
            break;
            
        case 'contact':
            meta.title = 'Contatti - IT-ERA Assistenza IT';
            meta.description = 'Contatta IT-ERA per assistenza informatica professionale. Supporto 24/7, interventi rapidi in tutta la Lombardia.';
            meta.canonicalUrl = `${baseUrl}/contatti`;
            break;
            
        case 'city':
            const cityName = data.cityName || 'Lombardia';
            meta.title = `Assistenza IT ${cityName} - Supporto Tecnico Professionale`;
            meta.description = `Assistenza informatica professionale a ${cityName}. Supporto tecnico 24/7, cybersecurity e soluzioni IT per aziende.`;
            meta.keywords = `assistenza IT ${cityName}, supporto tecnico ${cityName}, informatica ${cityName}, cybersecurity ${cityName}`;
            meta.canonicalUrl = `${baseUrl}/assistenza-it-${cityName.toLowerCase()}`;
            break;
    }
    
    return meta;
}

module.exports = {
    seoConfig,
    generateLocalBusinessSchema,
    generateOrganizationSchema,
    generateWebsiteSchema,
    generateServiceSchema,
    generateBreadcrumbSchema,
    getPageMeta
};
