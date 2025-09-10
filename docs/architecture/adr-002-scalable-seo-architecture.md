# ADR-002: Scalable SEO Architecture for Multi-City Pages

## Status
Proposed

## Context
The project has 100+ city-specific pages for IT services across Lombardy. The current architecture needs to scale efficiently while maintaining SEO best practices and avoiding content duplication penalties.

## Decision
Implement a template-based architecture with dynamic content generation and comprehensive SEO optimization for location-based pages.

## Rationale

### Current Challenges
- 100+ individual HTML files with potential content duplication
- Manual maintenance of location-specific pages
- Inconsistent SEO implementation across pages
- No systematic internal linking strategy

### Scalability Requirements
- Easy addition of new cities/services
- Consistent SEO implementation
- Automated internal linking
- Content variation to avoid duplication

## Technical Architecture

### 1. Template-Based Page Generation

```javascript
// Page generation system
class LocationPageGenerator {
  constructor(baseTemplate, locationData, serviceData) {
    this.baseTemplate = baseTemplate;
    this.locationData = locationData;
    this.serviceData = serviceData;
  }

  generatePage(city, service) {
    const pageData = {
      city: this.locationData[city],
      service: this.serviceData[service],
      nearbyCities: this.getNearbyCities(city),
      relatedServices: this.getRelatedServices(service)
    };
    
    return this.renderTemplate(pageData);
  }

  renderTemplate(data) {
    return this.baseTemplate
      .replace(/{{city}}/g, data.city.name)
      .replace(/{{province}}/g, data.city.province)
      .replace(/{{service}}/g, data.service.name)
      .replace(/{{description}}/g, this.generateUniqueDescription(data))
      .replace(/{{schema}}/g, this.generateSchema(data));
  }
}
```

### 2. SEO Optimization System

```javascript
// SEO metadata generation
class SEOGenerator {
  generateMetadata(city, service) {
    return {
      title: this.generateTitle(city, service),
      description: this.generateDescription(city, service),
      keywords: this.generateKeywords(city, service),
      schema: this.generateLocalBusinessSchema(city, service),
      canonicalUrl: this.generateCanonicalUrl(city, service)
    };
  }

  generateTitle(city, service) {
    const templates = [
      `${service.name} ${city.name} | IT-ERA - Assistenza Tecnica Specializzata`,
      `${service.name} a ${city.name} | Supporto IT Professionale | IT-ERA`,
      `Servizi ${service.name} ${city.name} | IT-ERA - Esperti IT Lombardia`
    ];
    
    // Rotate templates to avoid duplication
    return templates[this.getTemplateIndex(city, service)];
  }

  generateLocalBusinessSchema(city, service) {
    return {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "IT-ERA",
      "description": `${service.description} a ${city.name}`,
      "areaServed": {
        "@type": "City",
        "name": city.name,
        "containedInPlace": {
          "@type": "AdministrativeArea",
          "name": city.province
        }
      },
      "serviceArea": {
        "@type": "GeoCircle",
        "geoMidpoint": {
          "@type": "GeoCoordinates",
          "latitude": city.coordinates.lat,
          "longitude": city.coordinates.lng
        },
        "geoRadius": "25000"
      }
    };
  }
}
```

### 3. Content Variation System

```javascript
// Content diversity to avoid duplication
class ContentVariationEngine {
  generateUniqueContent(city, service) {
    const variations = {
      introductions: [
        `IT-ERA è il partner tecnologico di fiducia per le aziende di ${city.name}.`,
        `Scopri i servizi ${service.name} personalizzati per ${city.name}.`,
        `${city.name}: affidati agli esperti IT-ERA per ${service.name}.`
      ],
      
      benefits: this.generateLocalizedBenefits(city, service),
      callToActions: this.generateLocalizedCTAs(city, service)
    };

    return {
      introduction: this.selectVariation(variations.introductions, city, service),
      benefits: variations.benefits,
      cta: this.selectVariation(variations.callToActions, city, service)
    };
  }

  generateLocalizedBenefits(city, service) {
    const localContext = this.getLocalBusinessContext(city);
    return service.benefits.map(benefit => 
      this.localizeContent(benefit, city, localContext)
    );
  }
}
```

### 4. Internal Linking Strategy

```javascript
// Automated internal linking system
class InternalLinkingEngine {
  generateInternalLinks(currentCity, currentService) {
    return {
      relatedServices: this.getRelatedServiceLinks(currentCity),
      nearbyLocations: this.getNearbyLocationLinks(currentService, currentCity),
      hierarchical: this.getHierarchicalLinks(currentCity, currentService),
      contextual: this.getContextualLinks(currentCity, currentService)
    };
  }

  getRelatedServiceLinks(city) {
    const relatedServices = this.serviceData.getRelatedServices(currentService);
    return relatedServices.map(service => ({
      url: `/${service.slug}-${city.slug}.html`,
      anchor: `${service.name} ${city.name}`,
      title: `Scopri i nostri servizi ${service.name} a ${city.name}`
    }));
  }

  getNearbyLocationLinks(service, currentCity) {
    const nearbycities = this.locationData.getNearbyCities(currentCity, 30);
    return nearbyCities.map(city => ({
      url: `/${service.slug}-${city.slug}.html`,
      anchor: `${service.name} ${city.name}`,
      title: `${service.name} anche a ${city.name}`
    }));
  }
}
```

### 5. Build System Integration

```javascript
// Automated page generation
const generateAllPages = async () => {
  const cities = await loadCityData();
  const services = await loadServiceData();
  
  const generator = new LocationPageGenerator(baseTemplate, cities, services);
  const seoGenerator = new SEOGenerator();
  const contentEngine = new ContentVariationEngine();
  
  for (const city of cities) {
    for (const service of services) {
      const pageContent = generator.generatePage(city, service);
      const seoData = seoGenerator.generateMetadata(city, service);
      const uniqueContent = contentEngine.generateUniqueContent(city, service);
      
      const finalPage = combinePageElements(pageContent, seoData, uniqueContent);
      
      await writeFile(`./web/${service.slug}-${city.slug}.html`, finalPage);
      
      console.log(`Generated: ${service.slug}-${city.slug}.html`);
    }
  }
  
  await generateSitemap(cities, services);
  console.log('All pages generated successfully');
};
```

## File Structure

```
/templates
  ├── base-layout.hbs
  ├── service-page.hbs
  └── partials/
      ├── hero-section.hbs
      ├── service-details.hbs
      └── local-info.hbs

/data
  ├── cities.json
  ├── services.json
  └── content-variations.json

/scripts
  ├── generate-pages.js
  ├── seo-generator.js
  └── content-variations.js
```

## Consequences

### Positive
- Scalable architecture for 1000+ pages
- Consistent SEO implementation
- Automated content generation
- Reduced maintenance overhead
- Better content uniqueness

### Negative
- Initial setup complexity
- Build process dependencies
- Need for content review process

## Implementation Plan

### Phase 1: Data Structure (1 week)
- Create city and service data files
- Define template structure
- Set up basic generation scripts

### Phase 2: Template System (2 weeks)
- Implement template engine
- Create page generation logic
- Add SEO metadata generation

### Phase 3: Content Variation (2 weeks)
- Implement content variation engine
- Create unique content for each location
- Add internal linking system

### Phase 4: Build Integration (1 week)
- Integrate with CI/CD pipeline
- Add automated testing
- Deploy generated pages

## Success Metrics
- 100+ unique pages generated automatically
- Consistent SEO scores across all pages
- No content duplication penalties
- Improved organic traffic for location-based searches