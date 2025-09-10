/**
 * Dynamic Sitemap Generator
 * Generates XML sitemap for IT-ERA website
 */

const fs = require('fs').promises;
const path = require('path');

class SitemapGenerator {
    constructor() {
        this.baseUrl = 'https://it-era.it';
        this.pages = [];
        this.lastmod = new Date().toISOString().split('T')[0];
    }

    /**
     * Generate complete sitemap
     */
    async generateSitemap() {
        try {
            // Load data
            const cities = await this.loadCitiesData();
            const services = await this.loadServicesData();

            // Add pages
            this.addStaticPages();
            this.addCityPages(cities);
            this.addServicePages(services);
            this.addServiceCityPages(cities, services);

            // Generate XML
            const xml = this.generateXML();
            
            // Save sitemap
            await this.saveSitemap(xml);
            
            return {
                success: true,
                totalUrls: this.pages.length,
                sitemapPath: '/sitemap.xml'
            };
        } catch (error) {
            console.error('Sitemap generation error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Load cities data
     */
    async loadCitiesData() {
        try {
            const citiesPath = path.join(__dirname, '../data/cities-data.json');
            const data = await fs.readFile(citiesPath, 'utf8');
            const citiesData = JSON.parse(data);
            
            // Convert object to array
            return Object.entries(citiesData).map(([slug, city]) => ({
                slug,
                ...city
            }));
        } catch (error) {
            console.warn('Could not load cities data:', error.message);
            return this.getDefaultCities();
        }
    }

    /**
     * Load services data
     */
    async loadServicesData() {
        try {
            const servicesPath = path.join(__dirname, '../data/services-data.json');
            const data = await fs.readFile(servicesPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.warn('Could not load services data:', error.message);
            return this.getDefaultServices();
        }
    }

    /**
     * Get default cities if data file not available
     */
    getDefaultCities() {
        return [
            { slug: 'milano', name: 'Milano', province: 'MI' },
            { slug: 'bergamo', name: 'Bergamo', province: 'BG' },
            { slug: 'brescia', name: 'Brescia', province: 'BS' },
            { slug: 'como', name: 'Como', province: 'CO' },
            { slug: 'cremona', name: 'Cremona', province: 'CR' },
            { slug: 'mantova', name: 'Mantova', province: 'MN' },
            { slug: 'pavia', name: 'Pavia', province: 'PV' },
            { slug: 'sondrio', name: 'Sondrio', province: 'SO' },
            { slug: 'varese', name: 'Varese', province: 'VA' },
            { slug: 'lecco', name: 'Lecco', province: 'LC' },
            { slug: 'lodi', name: 'Lodi', province: 'LO' },
            { slug: 'monza', name: 'Monza', province: 'MB' }
        ];
    }

    /**
     * Get default services if data file not available
     */
    getDefaultServices() {
        return [
            { slug: 'cloud-storage', name: 'Cloud Storage', category: 'storage' },
            { slug: 'backup-disaster-recovery', name: 'Backup e Disaster Recovery', category: 'backup' },
            { slug: 'cybersecurity', name: 'Cybersecurity', category: 'security' },
            { slug: 'riparazione-pc', name: 'Riparazione PC', category: 'hardware' },
            { slug: 'assistenza-server', name: 'Assistenza Server', category: 'server' },
            { slug: 'microsoft365', name: 'Microsoft 365', category: 'software' },
            { slug: 'voip-telefonia', name: 'VoIP e Telefonia', category: 'communication' }
        ];
    }

    /**
     * Add static pages to sitemap
     */
    addStaticPages() {
        const staticPages = [
            { url: '/', priority: 1.0, changefreq: 'daily' },
            { url: '/servizi', priority: 0.9, changefreq: 'weekly' },
            { url: '/chi-siamo', priority: 0.7, changefreq: 'monthly' },
            { url: '/contatti', priority: 0.8, changefreq: 'monthly' },
            { url: '/privacy-policy', priority: 0.3, changefreq: 'yearly' },
            { url: '/cookie-policy', priority: 0.3, changefreq: 'yearly' },
            { url: '/termini-servizio', priority: 0.3, changefreq: 'yearly' }
        ];

        staticPages.forEach(page => this.addPage(page));
    }

    /**
     * Add city-specific pages
     */
    addCityPages(cities) {
        cities.forEach(city => {
            this.addPage({
                url: `/assistenza-it-${city.slug}`,
                priority: 0.8,
                changefreq: 'weekly',
                lastmod: this.lastmod
            });
        });
    }

    /**
     * Add service pages
     */
    addServicePages(services) {
        services.forEach(service => {
            this.addPage({
                url: `/${service.slug}`,
                priority: 0.7,
                changefreq: 'weekly',
                lastmod: this.lastmod
            });
        });
    }

    /**
     * Add service-city combination pages
     */
    addServiceCityPages(cities, services) {
        cities.forEach(city => {
            services.forEach(service => {
                this.addPage({
                    url: `/${service.slug}-${city.slug}`,
                    priority: 0.6,
                    changefreq: 'monthly',
                    lastmod: this.lastmod
                });
            });
        });
    }

    /**
     * Add a page to the sitemap
     */
    addPage(page) {
        this.pages.push({
            url: page.url,
            lastmod: page.lastmod || this.lastmod,
            changefreq: page.changefreq || 'monthly',
            priority: page.priority || 0.5
        });
    }

    /**
     * Generate XML sitemap
     */
    generateXML() {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        this.pages.forEach(page => {
            xml += '  <url>\n';
            xml += `    <loc>${this.baseUrl}${page.url}</loc>\n`;
            xml += `    <lastmod>${page.lastmod}</lastmod>\n`;
            xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
            xml += `    <priority>${page.priority}</priority>\n`;
            xml += '  </url>\n';
        });

        xml += '</urlset>';
        return xml;
    }

    /**
     * Save sitemap to file
     */
    async saveSitemap(xml) {
        const sitemapPath = path.join(__dirname, '../web/sitemap.xml');
        await fs.writeFile(sitemapPath, xml, 'utf8');
        
        // Also save to public directory if it exists
        try {
            const publicPath = path.join(__dirname, '../public/sitemap.xml');
            await fs.writeFile(publicPath, xml, 'utf8');
        } catch (error) {
            // Public directory doesn't exist, that's okay
        }
    }

    /**
     * Generate robots.txt
     */
    async generateRobotsTxt() {
        const robotsContent = `User-agent: *
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

# Crawl delay for respectful crawling
Crawl-delay: 1`;

        const robotsPath = path.join(__dirname, '../web/robots.txt');
        await fs.writeFile(robotsPath, robotsContent, 'utf8');
        
        return robotsContent;
    }

    /**
     * Get sitemap statistics
     */
    getSitemapStats() {
        const stats = {
            totalUrls: this.pages.length,
            byPriority: {},
            byChangefreq: {},
            lastGenerated: new Date().toISOString()
        };

        this.pages.forEach(page => {
            // Count by priority
            const priority = page.priority.toString();
            stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;

            // Count by changefreq
            stats.byChangefreq[page.changefreq] = (stats.byChangefreq[page.changefreq] || 0) + 1;
        });

        return stats;
    }
}

module.exports = SitemapGenerator;
