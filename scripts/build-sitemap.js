#!/usr/bin/env node
/**
 * IT-ERA Sitemap Generator
 * Generates XML sitemap for all pages and services
 */

const fs = require('fs');
const path = require('path');
const config = require('../src/config/integrations.json');

class ITERASitemapGenerator {
  constructor() {
    this.baseUrl = 'https://it-era.it';
    this.outputPath = path.join(__dirname, '../public/sitemap.xml');
    this.urls = [];
    this.priorities = config.seo.sitemap.priority;
  }

  addUrl(url, priority = 0.5, changefreq = 'weekly', lastmod = null) {
    this.urls.push({
      url: url.startsWith('http') ? url : `${this.baseUrl}${url}`,
      priority,
      changefreq,
      lastmod: lastmod || new Date().toISOString().split('T')[0]
    });
  }

  generateStaticPages() {
    // Homepage
    this.addUrl('/', this.priorities.homepage, 'weekly');

    // Main service pages
    const services = [
      '/assistenza-it',
      '/sicurezza-informatica', 
      '/cloud-storage',
      '/backup-disaster-recovery',
      '/voip-telefonia-cloud',
      '/microsoft-365',
      '/firewall-watchguard',
      '/gdpr-compliance',
      '/smart-working',
      '/riparazione-pc'
    ];

    services.forEach(service => {
      this.addUrl(service, this.priorities.services, 'weekly');
    });

    // Sector pages
    const sectors = [
      '/pages/settori-commercialisti',
      '/pages/settori-studi-legali', 
      '/pages/settori-medici',
      '/pages/settori-pmi'
    ];

    sectors.forEach(sector => {
      this.addUrl(sector, this.priorities.sectors, 'weekly');
    });

    // General pages
    const pages = [
      '/contatti',
      '/blog',
      '/privacy-policy',
      '/cookie-policy'
    ];

    pages.forEach(page => {
      this.addUrl(page, 0.6, 'monthly');
    });
  }

  generateCityPages() {
    const cities = [
      'milano', 'monza', 'bergamo', 'brescia', 'como', 'varese', 'lecco',
      'cremona', 'mantova', 'pavia', 'sondrio', 'lodi', 'vimercate', 
      'seregno', 'desio', 'limbiate', 'nova-milanese', 'cesano-maderno',
      'seveso', 'carate-brianza', 'besana-in-brianza', 'triuggio',
      'lissone', 'muggio', 'vedano-al-lambro', 'biassono', 'macherio'
    ];

    const services = [
      'assistenza-it', 'sicurezza-informatica', 'cloud-storage',
      'backup-disaster-recovery', 'voip-telefonia-cloud', 'microsoft-365'
    ];

    cities.forEach(city => {
      services.forEach(service => {
        this.addUrl(`/${service}/${city}`, this.priorities.cities, 'monthly');
      });

      // Sector pages per city
      const sectors = ['commercialisti', 'studi-legali', 'medici', 'pmi'];
      sectors.forEach(sector => {
        this.addUrl(`/${sector}/${city}`, this.priorities.sectors, 'monthly');
      });
    });
  }

  generateBlogPages() {
    // Blog main page
    this.addUrl('/blog', this.priorities.blog, 'weekly');
    
    // Sample blog posts (extend with real blog posts)
    const blogPosts = [
      '/blog/sicurezza-informatica-pmi',
      '/blog/backup-disaster-recovery-guida',
      '/blog/cloud-storage-vantaggi',
      '/blog/cybersecurity-studi-legali',
      '/blog/gdpr-compliance-checklist'
    ];

    blogPosts.forEach(post => {
      this.addUrl(post, this.priorities.blog, 'monthly');
    });
  }

  generateXML() {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    this.urls.forEach(urlObj => {
      xml += '  <url>\n';
      xml += `    <loc>${urlObj.url}</loc>\n`;
      xml += `    <lastmod>${urlObj.lastmod}</lastmod>\n`;
      xml += `    <changefreq>${urlObj.changefreq}</changefreq>\n`;
      xml += `    <priority>${urlObj.priority}</priority>\n`;
      xml += '  </url>\n';
    });

    xml += '</urlset>';
    return xml;
  }

  async build() {
    console.log('🗺️  Building IT-ERA sitemap...');
    
    try {
      // Generate all URL types
      this.generateStaticPages();
      this.generateCityPages();
      this.generateBlogPages();

      // Generate XML
      const xml = this.generateXML();

      // Ensure public directory exists
      const publicDir = path.dirname(this.outputPath);
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      // Write sitemap
      fs.writeFileSync(this.outputPath, xml, 'utf8');

      console.log(`✅ Sitemap generated: ${this.urls.length} URLs`);
      console.log(`📍 Output: ${this.outputPath}`);
      
      // Generate sitemap index if needed
      this.generateSitemapIndex();

    } catch (error) {
      console.error('❌ Sitemap generation failed:', error);
      process.exit(1);
    }
  }

  generateSitemapIndex() {
    // For large sites, split into multiple sitemaps
    if (this.urls.length > 50000) {
      console.log('⚠️  Large sitemap detected. Consider splitting into multiple files.');
    }

    // Generate robots.txt reference
    const robotsPath = path.join(__dirname, '../public/robots.txt');
    let robotsContent = `User-agent: *\n`;
    robotsContent += `Allow: /\n`;
    robotsContent += `Disallow: /admin\n`;
    robotsContent += `Disallow: /api\n`;
    robotsContent += `Disallow: /test\n\n`;
    robotsContent += `Sitemap: ${this.baseUrl}/sitemap.xml\n`;

    fs.writeFileSync(robotsPath, robotsContent, 'utf8');
    console.log(`✅ Robots.txt updated: ${robotsPath}`);
  }
}

// CLI execution
if (require.main === module) {
  const generator = new ITERASitemapGenerator();
  generator.build();
}

module.exports = ITERASitemapGenerator;