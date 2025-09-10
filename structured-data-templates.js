// Template per Structured Data JSON-LD per IT-ERA

// LocalBusiness per homepage
const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://userx87.github.io/it-era/#organization",
    "name": "IT-ERA",
    "alternateName": "IT-ERA Assistenza Informatica",
    "description": "Assistenza informatica professionale per aziende in Lombardia. Supporto IT, sicurezza informatica, cloud e digitalizzazione.",
    "url": "https://userx87.github.io/it-era/",
    "logo": "https://userx87.github.io/it-era/images/logo-it-era.png",
    "image": "https://userx87.github.io/it-era/images/og-image.jpg",
    "telephone": "+39 039 888 2041",
    "email": "info@it-era.it",
    "address": {
        "@type": "PostalAddress",
        "streetAddress": "Via Roma",
        "addressLocality": "Vimercate",
        "addressRegion": "Lombardia",
        "postalCode": "20871",
        "addressCountry": "IT"
    },
    "geo": {
        "@type": "GeoCoordinates",
        "latitude": "45.6311",
        "longitude": "9.3678"
    },
    "areaServed": [
        {
            "@type": "State",
            "name": "Lombardia"
        },
        {
            "@type": "City", 
            "name": "Milano"
        },
        {
            "@type": "City",
            "name": "Bergamo"
        },
        {
            "@type": "City",
            "name": "Vimercate"
        },
        {
            "@type": "City",
            "name": "Monza"
        }
    ],
    "serviceType": [
        "Assistenza Informatica",
        "Supporto IT",
        "Sicurezza Informatica",
        "Cloud Computing",
        "Consulenza IT",
        "Cybersecurity"
    ],
    "priceRange": "€€",
    "openingHours": [
        "Mo-Fr 09:00-18:00"
    ],
    "sameAs": [
        "https://www.facebook.com/itera",
        "https://www.linkedin.com/company/it-era",
        "https://www.instagram.com/itera"
    ]
};

// Organization schema
const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://userx87.github.io/it-era/#organization",
    "name": "IT-ERA",
    "url": "https://userx87.github.io/it-era/",
    "logo": "https://userx87.github.io/it-era/images/logo-it-era.png",
    "description": "Assistenza informatica professionale per aziende in Lombardia",
    "telephone": "+39 039 888 2041",
    "email": "info@it-era.it",
    "address": {
        "@type": "PostalAddress",
        "addressLocality": "Vimercate",
        "addressRegion": "Lombardia",
        "addressCountry": "IT"
    }
};

// Service schema per pagina servizi
const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Assistenza Informatica Professionale",
    "description": "Servizi completi di assistenza IT per aziende: supporto tecnico, sicurezza informatica, cloud computing e digitalizzazione.",
    "provider": {
        "@type": "LocalBusiness",
        "name": "IT-ERA",
        "url": "https://userx87.github.io/it-era/"
    },
    "areaServed": {
        "@type": "State",
        "name": "Lombardia"
    },
    "serviceType": "IT Support",
    "category": "Computer Services",
    "offers": {
        "@type": "Offer",
        "description": "Assistenza IT professionale 24/7",
        "priceRange": "€€"
    }
};

// FAQ Schema per pagina contatti
const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
        {
            "@type": "Question",
            "name": "Quali servizi IT offrite?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Offriamo assistenza tecnica completa, sicurezza informatica, cloud computing, backup e disaster recovery, consulenza IT e supporto Microsoft 365."
            }
        },
        {
            "@type": "Question", 
            "name": "In quali zone operate?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Operiamo in tutta la Lombardia, con focus su Milano, Bergamo, Monza, Vimercate e provincia."
            }
        },
        {
            "@type": "Question",
            "name": "Offrite supporto 24/7?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Sì, offriamo supporto IT 24/7 per emergenze e assistenza tecnica urgente."
            }
        },
        {
            "@type": "Question",
            "name": "Come posso richiedere un preventivo?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Puoi contattarci al 039 888 2041, via email a info@it-era.it o compilando il form di contatto sul nostro sito."
            }
        }
    ]
};

// WebSite schema con SearchAction
const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://userx87.github.io/it-era/#website",
    "url": "https://userx87.github.io/it-era/",
    "name": "IT-ERA - Assistenza Informatica Lombardia",
    "description": "Assistenza informatica professionale per aziende in Lombardia",
    "publisher": {
        "@id": "https://userx87.github.io/it-era/#organization"
    },
    "potentialAction": {
        "@type": "SearchAction",
        "target": "https://userx87.github.io/it-era/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
    }
};

// BreadcrumbList per pagine interne
const breadcrumbSchema = (pageName, pageUrl) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
        {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://userx87.github.io/it-era/"
        },
        {
            "@type": "ListItem",
            "position": 2,
            "name": pageName,
            "item": pageUrl
        }
    ]
});

module.exports = {
    localBusinessSchema,
    organizationSchema,
    serviceSchema,
    faqSchema,
    websiteSchema,
    breadcrumbSchema
};
