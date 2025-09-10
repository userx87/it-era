#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configurazione
const SITE_BASE_URL = 'https://userx87.github.io/it-era';
const SITE_DIR = '_site';
const REPORT_FILE = 'navigation-audit-report.json';

// Colori per output console
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

class NavigationAuditor {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            summary: {
                totalPages: 0,
                totalLinks: 0,
                workingLinks: 0,
                brokenLinks: 0,
                internalLinks: 0,
                externalLinks: 0
            },
            pages: [],
            errors: [],
            recommendations: []
        };
    }

    // Trova tutti i file HTML
    findAllHtmlFiles() {
        const htmlFiles = [];
        
        function scanDirectory(dir) {
            const items = fs.readdirSync(dir);
            
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                    scanDirectory(fullPath);
                } else if (stat.isFile() && item.endsWith('.html')) {
                    htmlFiles.push(fullPath);
                }
            }
        }
        
        scanDirectory(SITE_DIR);
        return htmlFiles;
    }

    // Estrae tutti i link da un file HTML
    extractLinksFromHtml(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        const links = [];
        
        // Regex per trovare href e src
        const hrefRegex = /href=["']([^"']+)["']/g;
        const srcRegex = /src=["']([^"']+)["']/g;
        
        let match;
        
        // Estrai href
        while ((match = hrefRegex.exec(content)) !== null) {
            const url = match[1];
            if (!url.startsWith('#') && !url.startsWith('javascript:') && !url.startsWith('mailto:') && !url.startsWith('tel:')) {
                links.push({
                    type: 'href',
                    url: url,
                    context: this.getContext(content, match.index)
                });
            }
        }
        
        // Estrai src (CSS, JS, immagini)
        while ((match = srcRegex.exec(content)) !== null) {
            const url = match[1];
            if (!url.startsWith('data:') && !url.startsWith('javascript:')) {
                links.push({
                    type: 'src',
                    url: url,
                    context: this.getContext(content, match.index)
                });
            }
        }
        
        return links;
    }

    // Ottiene il contesto di un link
    getContext(content, index) {
        const start = Math.max(0, index - 50);
        const end = Math.min(content.length, index + 100);
        return content.substring(start, end).replace(/\s+/g, ' ').trim();
    }

    // Testa se un URL è accessibile
    async testUrl(url) {
        return new Promise((resolve) => {
            // Converti URL relativi in assoluti
            let testUrl = url;
            if (url.startsWith('/it-era/')) {
                testUrl = `${SITE_BASE_URL}${url.substring(7)}`;
            } else if (url.startsWith('/')) {
                testUrl = `${SITE_BASE_URL}${url}`;
            } else if (!url.startsWith('http')) {
                testUrl = `${SITE_BASE_URL}/${url}`;
            }

            const urlObj = new URL(testUrl);
            const client = urlObj.protocol === 'https:' ? https : http;
            
            const req = client.request(testUrl, { method: 'HEAD', timeout: 5000 }, (res) => {
                resolve({
                    url: testUrl,
                    originalUrl: url,
                    status: res.statusCode,
                    success: res.statusCode >= 200 && res.statusCode < 400,
                    redirected: res.statusCode >= 300 && res.statusCode < 400
                });
            });

            req.on('error', (error) => {
                resolve({
                    url: testUrl,
                    originalUrl: url,
                    status: 0,
                    success: false,
                    error: error.message
                });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({
                    url: testUrl,
                    originalUrl: url,
                    status: 0,
                    success: false,
                    error: 'Timeout'
                });
            });

            req.end();
        });
    }

    // Esegue l'audit completo
    async runAudit() {
        console.log(`${colors.bold}${colors.blue}🔍 AUDIT NAVIGAZIONE IT-ERA${colors.reset}`);
        console.log(`${colors.blue}================================${colors.reset}\n`);

        const htmlFiles = this.findAllHtmlFiles();
        this.results.summary.totalPages = htmlFiles.length;

        console.log(`📄 Trovate ${htmlFiles.length} pagine HTML\n`);

        for (const filePath of htmlFiles) {
            const relativePath = path.relative(SITE_DIR, filePath);
            console.log(`${colors.yellow}📝 Analizzando: ${relativePath}${colors.reset}`);

            const links = this.extractLinksFromHtml(filePath);
            const pageResult = {
                file: relativePath,
                url: `${SITE_BASE_URL}/${relativePath}`,
                totalLinks: links.length,
                links: [],
                errors: []
            };

            for (const link of links) {
                this.results.summary.totalLinks++;
                
                if (link.url.startsWith('http')) {
                    this.results.summary.externalLinks++;
                } else {
                    this.results.summary.internalLinks++;
                }

                const testResult = await this.testUrl(link.url);
                
                if (testResult.success) {
                    this.results.summary.workingLinks++;
                    console.log(`  ${colors.green}✅ ${link.url}${colors.reset}`);
                } else {
                    this.results.summary.brokenLinks++;
                    console.log(`  ${colors.red}❌ ${link.url} (${testResult.status || testResult.error})${colors.reset}`);
                    pageResult.errors.push({
                        url: link.url,
                        error: testResult.error || `HTTP ${testResult.status}`,
                        context: link.context
                    });
                }

                pageResult.links.push({
                    ...link,
                    testResult
                });
            }

            this.results.pages.push(pageResult);
            console.log('');
        }

        this.generateRecommendations();
        this.saveReport();
        this.printSummary();
    }

    // Genera raccomandazioni
    generateRecommendations() {
        if (this.results.summary.brokenLinks > 0) {
            this.results.recommendations.push('Correggere tutti i link rotti identificati');
        }
        
        if (this.results.summary.internalLinks < this.results.summary.totalLinks * 0.7) {
            this.results.recommendations.push('Aumentare il numero di link interni per migliorare la navigazione');
        }
    }

    // Salva il report
    saveReport() {
        fs.writeFileSync(REPORT_FILE, JSON.stringify(this.results, null, 2));
        console.log(`${colors.green}📊 Report salvato in: ${REPORT_FILE}${colors.reset}\n`);
    }

    // Stampa il riassunto
    printSummary() {
        console.log(`${colors.bold}${colors.blue}📊 RIASSUNTO AUDIT${colors.reset}`);
        console.log(`${colors.blue}==================${colors.reset}`);
        console.log(`📄 Pagine analizzate: ${this.results.summary.totalPages}`);
        console.log(`🔗 Link totali: ${this.results.summary.totalLinks}`);
        console.log(`${colors.green}✅ Link funzionanti: ${this.results.summary.workingLinks}${colors.reset}`);
        console.log(`${colors.red}❌ Link rotti: ${this.results.summary.brokenLinks}${colors.reset}`);
        console.log(`🏠 Link interni: ${this.results.summary.internalLinks}`);
        console.log(`🌐 Link esterni: ${this.results.summary.externalLinks}`);
        
        const successRate = ((this.results.summary.workingLinks / this.results.summary.totalLinks) * 100).toFixed(1);
        console.log(`📈 Tasso di successo: ${successRate}%`);
    }
}

// Esegui l'audit
const auditor = new NavigationAuditor();
auditor.runAudit().catch(console.error);
