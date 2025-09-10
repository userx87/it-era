/**
 * SEO Generator Utilities
 * Dynamic SEO metadata and sitemap generation for IT-ERA
 */

const fs = require('fs').promises;
const path = require('path');

class SEOGenerator {
    constructor() {
        this.baseUrl = 'https://it-era.it';
        this.companyData = {
            name: "IT-ERA",
            phone: "+39 039 888 2041",
            email: "info@it-era.it",
            address: {
                street: "Viale Risorgimento 32",
                city: "Vimercate",
                province: "MB",
                region: "Lombardia",
                postalCode: "20871",
                country: "Italia"
            }
        };
    }

    /**
     * Generate page metadata for SEO
     */
    generatePageMetadata(city, service, pageType = 'service') {
        const templates = {
            title: {
                service: `${service.name} ${city.name} | IT-ERA - Assistenza IT Professionale`,
                city: `Assistenza IT ${city.name} | Supporto Tecnico 24/7 | IT-ERA`,
                homepage: `IT-ERA | Assistenza IT Professionale Lombardia | Supporto 24/7`,
                contact: `Contatti IT-ERA | Assistenza IT ${city.name} | Tel: 039 888 2041`
            },
            description: {
                service: `${service.name} professionale a ${city.name}. Supporto IT 24/7, tecnici certificati, SLA garantito. Oltre 500 aziende servite. ☎️ 039 888 2041`,
                city: `Assistenza informatica ${city.name}: supporto IT 24/7, risoluzione problemi in 2 ore, tecnici Microsoft certificati. Servizi per aziende in ${city.province}. ☎️ 039 888 2041`,
                homepage: `Assistenza IT professionale in Lombardia. Supporto tecnico 24/7, cybersecurity, cloud storage. Oltre 500 aziende servite. SLA garantito. ☎️ 039 888 2041`,
                contact: `Contatta IT-ERA per assistenza IT a ${city.name}. Supporto tecnico professionale 24/7, preventivi gratuiti. Tel: 039 888 2041 | Email: info@it-era.it`
            }
        };

        return {
            title: templates.title[pageType] || templates.title.service,
            description: templates.description[pageType] || templates.description.service,
            keywords: this.generateKeywords(city, service),
            canonical: `${this.baseUrl}/${this.generateSlug(city, service, pageType)}`,
            schema: this.generateLocalBusinessSchema(city, service)
        };
    }

    /**
     * Generate SEO-optimized keywords
     */
    generateKeywords(city, service) {
        const primary = [`assistenza IT ${city.name}`, `supporto tecnico ${city.name}`];
        const secondary = service ? [`${service.name} ${city.name}`, `IT aziende ${city.name}`] : [`informatica ${city.name}`];
        const local = [`informatica ${city.province}`, `help desk ${city.name}`];
        const branded = [`IT-ERA ${city.name}`, `assistenza informatica ${city.name}`];
        
        return [...primary, ...secondary, ...local, ...branded].join(', ');
    }

    /**
     * Generate URL slug
     */
    generateSlug(city, service, pageType = 'service') {
        if (pageType === 'city') {
            return `assistenza-it-${city.slug}`;
        } else if (pageType === 'service' && service) {
            return `${service.slug}-${city.slug}`;
        } else if (pageType === 'homepage') {
            return '';
        }
        return `assistenza-it-${city.slug}`;
    }

    /**
     * Generate LocalBusiness Schema
     */
    generateLocalBusinessSchema(city, service) {
        const schema = {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": service ? `IT-ERA - ${service.name} ${city.name}` : `IT-ERA - Assistenza IT ${city.name}`,
            "description": `Assistenza IT professionale a ${city.name}. Supporto tecnico 24/7, cybersecurity e soluzioni cloud per aziende.`,
            "url": `${this.baseUrl}/${this.generateSlug(city, service)}`,
            "telephone": this.companyData.phone,
            "email": this.companyData.email,
            "address": {
                "@type": "PostalAddress",
                "streetAddress": this.companyData.address.street,
                "addressLocality": this.companyData.address.city,
                "addressRegion": this.companyData.address.region,
                "postalCode": this.companyData.address.postalCode,
                "addressCountry": "IT"
            },
            "areaServed": [
                {
                    "@type": "City",
                    "name": city.name,
                    "containedInPlace": {
                        "@type": "AdministrativeArea",
                        "name": "Lombardia"
                    }
                }
            ],
            "serviceType": service ? [service.name, "Assistenza IT", "Supporto Tecnico"] : ["Assistenza IT", "Supporto Tecnico"],
            "priceRange": "€€",
            "openingHours": ["Mo-Fr 08:00-18:00"],
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "reviewCount": "127",
                "bestRating": "5",
                "worstRating": "1"
            }
        };

        // Add coordinates if available
        if (city.coordinates) {
            schema.geo = {
                "@type": "GeoCoordinates",
                "latitude": city.coordinates.lat,
                "longitude": city.coordinates.lng
            };
        }

        return schema;
    }

    /**
     * Generate FAQ Schema
     */
    generateFAQSchema(faqs) {
        return {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map(faq => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": faq.answer
                }
            }))
        };
    }

    /**
     * Generate Service Schema
     */
    generateServiceSchema(service, city) {
        return {
            "@context": "https://schema.org",
            "@type": "Service",
            "name": `${service.name} ${city.name}`,
            "description": service.description,
            "provider": {
                "@type": "LocalBusiness",
                "name": "IT-ERA",
                "telephone": this.companyData.phone,
                "url": this.baseUrl
            },
            "areaServed": {
                "@type": "City",
                "name": city.name
            },
            "serviceType": service.category,
            "offers": {
                "@type": "Offer",
                "availability": "https://schema.org/InStock",
                "priceRange": service.priceRange || "€€",
                "validFrom": new Date().toISOString()
            }
        };
    }

    /**
     * Generate Open Graph metadata
     */
    generateOpenGraphTags(metadata, pageType = 'service') {
        const ogImage = `${this.baseUrl}/images/og-${pageType}.jpg`;
        
        return {
            'og:title': metadata.title,
            'og:description': metadata.description,
            'og:type': 'website',
            'og:url': metadata.canonical,
            'og:image': ogImage,
            'og:image:width': '1200',
            'og:image:height': '630',
            'og:locale': 'it_IT',
            'og:site_name': 'IT-ERA'
        };
    }

    /**
     * Generate Twitter Card metadata
     */
    generateTwitterCardTags(metadata, pageType = 'service') {
        const twitterImage = `${this.baseUrl}/images/twitter-${pageType}.jpg`;
        
        return {
            'twitter:card': 'summary_large_image',
            'twitter:title': metadata.title,
            'twitter:description': metadata.description,
            'twitter:image': twitterImage,
            'twitter:site': '@IT_ERA_Support'
        };
    }

    /**
     * Generate complete meta tags HTML
     */
    generateMetaTagsHTML(city, service, pageType = 'service') {
        const metadata = this.generatePageMetadata(city, service, pageType);
        const ogTags = this.generateOpenGraphTags(metadata, pageType);
        const twitterTags = this.generateTwitterCardTags(metadata, pageType);
        
        let html = `
    <!-- SEO Meta Tags -->
    <title>${metadata.title}</title>
    <meta name="description" content="${metadata.description}">
    <meta name="keywords" content="${metadata.keywords}">
    <link rel="canonical" href="${metadata.canonical}">
    
    <!-- Open Graph Tags -->`;
        
        Object.entries(ogTags).forEach(([property, content]) => {
            html += `\n    <meta property="${property}" content="${content}">`;
        });
        
        html += `\n    
    <!-- Twitter Card Tags -->`;
        
        Object.entries(twitterTags).forEach(([name, content]) => {
            html += `\n    <meta name="${name}" content="${content}">`;
        });
        
        html += `\n    
    <!-- Structured Data -->
    <script type="application/ld+json">
    ${JSON.stringify(metadata.schema, null, 2)}
    </script>`;
        
        return html;
    }

    /**
     * Generate robots.txt content
     */
    generateRobotsTxt() {
        return `User-agent: *
Allow: /

# Sitemap
Sitemap: ${this.baseUrl}/sitemap.xml

# Disallow admin areas
Disallow: /admin/
Disallow: /api/
Disallow: /logs/
Disallow: /node_modules/
Disallow: /.env
Disallow: /package.json

# Allow important resources
Allow: /css/
Allow: /js/
Allow: /images/
Allow: /web/

# Crawl delay
Crawl-delay: 1`;
    }

    /**
     * Generate performance optimization headers
     */
    generatePerformanceHeaders() {
        return {
            'Cache-Control': 'public, max-age=31536000, immutable',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
        };
    }
}

module.exports = SEOGenerator;
