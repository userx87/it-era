#!/usr/bin/env node

/**
 * IT-ERA Vercel Deployment Optimizer
 * Reduces file count for Vercel free tier deployment
 */

const fs = require('fs-extra');
const path = require('path');

// Simple color functions
const colors = {
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    gray: (text) => `\x1b[90m${text}\x1b[0m`
};

class VercelOptimizer {
    constructor() {
        this.projectRoot = process.cwd();
        this.publicDir = path.join(this.projectRoot, 'public');
        
        this.stats = {
            originalFiles: 0,
            optimizedFiles: 0,
            reduction: 0
        };
    }
    
    async optimize() {
        console.log(colors.blue('\n🚀 Vercel Deployment Optimizer Starting...\n'));
        
        try {
            await this.countOriginalFiles();
            await this.createDynamicRouting();
            await this.optimizeAssets();
            await this.updateVercelConfig();
            await this.generateReport();
            
            console.log(colors.green('\n✅ Optimization completed successfully!\n'));
        } catch (error) {
            console.error(colors.red('\n❌ Optimization failed:'), error.message);
            process.exit(1);
        }
    }
    
    async countOriginalFiles() {
        console.log(colors.blue('📊 Counting original files...'));
        
        const countFiles = async (dir) => {
            let count = 0;
            const items = await fs.readdir(dir);
            
            for (const item of items) {
                const itemPath = path.join(dir, item);
                const stat = await fs.stat(itemPath);
                
                if (stat.isDirectory()) {
                    count += await countFiles(itemPath);
                } else {
                    count++;
                }
            }
            
            return count;
        };
        
        this.stats.originalFiles = await countFiles(this.publicDir);
        console.log(colors.gray(`Original files: ${this.stats.originalFiles}`));
    }
    
    async createDynamicRouting() {
        console.log(colors.blue('🔄 Creating dynamic routing system...'));
        
        // Create API route for dynamic page serving
        const apiDir = path.join(this.projectRoot, 'api');
        await fs.ensureDir(apiDir);
        
        const dynamicPageHandler = `
const fs = require('fs');
const path = require('path');

// Page data mapping
const pageData = {
    // Core pages
    'assistenza-informatica': {
        title: 'Assistenza Informatica Professionale',
        description: 'Assistenza IT professionale in Lombardia. Supporto tecnico 24/7 per la tua azienda.',
        template: 'service'
    },
    'cybersecurity': {
        title: 'Cybersecurity Aziendale',
        description: 'Protezione avanzata per i tuoi dati e sistemi aziendali.',
        template: 'service'
    },
    'cloud-storage': {
        title: 'Cloud Storage Professionale',
        description: 'Archiviazione sicura e accessibile ovunque per la tua azienda.',
        template: 'service'
    },
    'backup-disaster-recovery': {
        title: 'Backup e Disaster Recovery',
        description: 'Backup automatico e disaster recovery per la continuità aziendale.',
        template: 'service'
    }
};

// City data mapping
const cityData = {
    'milano': { name: 'Milano', province: 'MI' },
    'bergamo': { name: 'Bergamo', province: 'BG' },
    'brescia': { name: 'Brescia', province: 'BS' },
    'varese': { name: 'Varese', province: 'VA' },
    'como': { name: 'Como', province: 'CO' },
    'cremona': { name: 'Cremona', province: 'CR' },
    'mantova': { name: 'Mantova', province: 'MN' },
    'pavia': { name: 'Pavia', province: 'PV' },
    'sondrio': { name: 'Sondrio', province: 'SO' },
    'lecco': { name: 'Lecco', province: 'LC' },
    'lodi': { name: 'Lodi', province: 'LO' },
    'monza': { name: 'Monza', province: 'MB' }
};

// Base HTML template
const baseTemplate = \`<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}} | IT-ERA</title>
    <meta name="description" content="{{description}}">
    <meta name="keywords" content="{{keywords}}">
    
    <!-- CSS -->
    <link rel="stylesheet" href="/css/main.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
</head>
<body>
    <!-- Header -->
    <header class="itera-header">
        <div class="container">
            <div class="header-content">
                <div class="header-brand">
                    <a href="/" class="brand-link">
                        <span class="brand-text">IT-ERA</span>
                    </a>
                </div>
                <nav class="header-nav">
                    <ul class="nav-list">
                        <li><a href="/assistenza-informatica" class="nav-link">Assistenza IT</a></li>
                        <li><a href="/cybersecurity" class="nav-link">Cybersecurity</a></li>
                        <li><a href="/cloud-storage" class="nav-link">Cloud Storage</a></li>
                        <li><a href="/backup-disaster-recovery" class="nav-link">Backup & DR</a></li>
                        <li><a href="/claude-flow/dashboard.html" class="nav-link nav-link--claude">
                            <i class="fas fa-robot"></i> Claude Flow
                        </a></li>
                    </ul>
                </nav>
                <div class="header-actions">
                    <a href="/contatti" class="btn btn-primary">Contattaci</a>
                </div>
            </div>
        </div>
    </header>
    
    <!-- Main Content -->
    <main role="main">
        {{content}}
    </main>
    
    <!-- Footer -->
    <footer class="itera-footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h3>IT-ERA</h3>
                    <p>Assistenza IT professionale in Lombardia</p>
                    <p>📞 039 888 2041 | ✉️ info@it-era.it</p>
                </div>
                <div class="footer-section">
                    <h3>Servizi</h3>
                    <ul>
                        <li><a href="/assistenza-informatica">Assistenza IT</a></li>
                        <li><a href="/cybersecurity">Cybersecurity</a></li>
                        <li><a href="/cloud-storage">Cloud Storage</a></li>
                        <li><a href="/backup-disaster-recovery">Backup & DR</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h3>AI & Automazione</h3>
                    <ul>
                        <li><a href="/claude-flow/dashboard.html">Claude Flow Dashboard</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2024 IT-ERA. Tutti i diritti riservati.</p>
            </div>
        </div>
    </footer>
    
    <!-- JavaScript -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="/js/main.js"></script>
</body>
</html>\`;

module.exports = (req, res) => {
    const { slug } = req.query;
    
    // Handle different page types
    if (slug && slug.length > 0) {
        const pagePath = slug.join('/');
        
        // Check if it's a city page (format: service-city)
        const cityPageMatch = pagePath.match(/^([^-]+)-(.+)$/);
        if (cityPageMatch) {
            const [, service, city] = cityPageMatch;
            
            if (pageData[service] && cityData[city]) {
                const pageInfo = pageData[service];
                const cityInfo = cityData[city];
                
                const title = \`\${pageInfo.title} \${cityInfo.name}\`;
                const description = \`\${pageInfo.description} Servizio disponibile a \${cityInfo.name} (\${cityInfo.province}).\`;
                const keywords = \`\${service}, \${city}, lombardia, assistenza it\`;
                
                const content = \`
                <div class="container py-5">
                    <div class="row">
                        <div class="col-12">
                            <h1>\${title}</h1>
                            <p class="lead">\${description}</p>
                            
                            <div class="row mt-5">
                                <div class="col-md-8">
                                    <h2>I Nostri Servizi a \${cityInfo.name}</h2>
                                    <p>Offriamo servizi di \${service.replace('-', ' ')} professionali a \${cityInfo.name} e in tutta la provincia di \${cityInfo.province}.</p>
                                    
                                    <h3>Perché Scegliere IT-ERA</h3>
                                    <ul>
                                        <li>Supporto tecnico 24/7</li>
                                        <li>Tecnici certificati</li>
                                        <li>Intervento rapido</li>
                                        <li>Prezzi competitivi</li>
                                    </ul>
                                </div>
                                <div class="col-md-4">
                                    <div class="card">
                                        <div class="card-body">
                                            <h5 class="card-title">Contattaci</h5>
                                            <p class="card-text">Richiedi un preventivo gratuito per \${cityInfo.name}</p>
                                            <p><strong>📞 039 888 2041</strong></p>
                                            <p><strong>✉️ info@it-era.it</strong></p>
                                            <a href="/contatti" class="btn btn-primary">Richiedi Preventivo</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                \`;
                
                const html = baseTemplate
                    .replace('{{title}}', title)
                    .replace('{{description}}', description)
                    .replace('{{keywords}}', keywords)
                    .replace('{{content}}', content);
                
                res.setHeader('Content-Type', 'text/html');
                return res.status(200).send(html);
            }
        }
        
        // Check if it's a service page
        if (pageData[pagePath]) {
            const pageInfo = pageData[pagePath];
            
            const content = \`
            <div class="container py-5">
                <div class="row">
                    <div class="col-12">
                        <h1>\${pageInfo.title}</h1>
                        <p class="lead">\${pageInfo.description}</p>
                        
                        <div class="row mt-5">
                            <div class="col-md-8">
                                <h2>I Nostri Servizi</h2>
                                <p>Offriamo servizi professionali di \${pageInfo.title.toLowerCase()} per aziende di ogni dimensione.</p>
                                
                                <h3>Caratteristiche del Servizio</h3>
                                <ul>
                                    <li>Supporto tecnico professionale</li>
                                    <li>Disponibilità 24/7</li>
                                    <li>Tecnici certificati</li>
                                    <li>Intervento rapido</li>
                                </ul>
                            </div>
                            <div class="col-md-4">
                                <div class="card">
                                    <div class="card-body">
                                        <h5 class="card-title">Richiedi Informazioni</h5>
                                        <p class="card-text">Contattaci per un preventivo personalizzato</p>
                                        <p><strong>📞 039 888 2041</strong></p>
                                        <p><strong>✉️ info@it-era.it</strong></p>
                                        <a href="/contatti" class="btn btn-primary">Contattaci</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            \`;
            
            const html = baseTemplate
                .replace('{{title}}', pageInfo.title)
                .replace('{{description}}', pageInfo.description)
                .replace('{{keywords}}', pagePath + ', lombardia, assistenza it')
                .replace('{{content}}', content);
            
            res.setHeader('Content-Type', 'text/html');
            return res.status(200).send(html);
        }
    }
    
    // 404 page
    const notFoundContent = \`
    <div class="container py-5">
        <div class="row">
            <div class="col-12 text-center">
                <h1>Pagina Non Trovata</h1>
                <p class="lead">La pagina che stai cercando non esiste.</p>
                <a href="/" class="btn btn-primary">Torna alla Homepage</a>
            </div>
        </div>
    </div>
    \`;
    
    const html = baseTemplate
        .replace('{{title}}', 'Pagina Non Trovata')
        .replace('{{description}}', 'La pagina richiesta non è stata trovata.')
        .replace('{{keywords}}', 'errore, 404')
        .replace('{{content}}', notFoundContent);
    
    res.setHeader('Content-Type', 'text/html');
    return res.status(404).send(html);
};
`;
        
        await fs.writeFile(
            path.join(apiDir, '[...slug].js'),
            dynamicPageHandler
        );
        
        console.log(colors.green('✅ Dynamic routing created'));
    }
    
    async optimizeAssets() {
        console.log(colors.blue('📦 Optimizing assets...'));
        
        // Keep only essential files
        const essentialFiles = [
            'index.html',
            'contatti.html',
            'css/main.css',
            'js/main.js',
            'favicon.ico',
            'claude-flow/' // Keep entire Claude Flow directory
        ];
        
        // Create optimized public directory
        const optimizedDir = path.join(this.projectRoot, 'public-optimized');
        await fs.ensureDir(optimizedDir);
        
        // Copy essential files
        for (const file of essentialFiles) {
            const srcPath = path.join(this.publicDir, file);
            const destPath = path.join(optimizedDir, file);
            
            if (await fs.pathExists(srcPath)) {
                await fs.copy(srcPath, destPath);
            }
        }
        
        console.log(colors.green('✅ Assets optimized'));
    }
    
    async updateVercelConfig() {
        console.log(colors.blue('⚙️ Updating Vercel configuration...'));
        
        const vercelConfig = {
            version: 2,
            builds: [
                {
                    src: "api/index.js",
                    use: "@vercel/node"
                },
                {
                    src: "api/[...slug].js",
                    use: "@vercel/node"
                },
                {
                    src: "public-optimized/**/*",
                    use: "@vercel/static"
                }
            ],
            routes: [
                {
                    src: "/claude-flow/(.*)",
                    dest: "/public-optimized/claude-flow/$1"
                },
                {
                    src: "/(css|js|images)/(.*)",
                    dest: "/public-optimized/$1/$2",
                    headers: {
                        "Cache-Control": "public, max-age=31536000, immutable"
                    }
                },
                {
                    src: "/favicon.ico",
                    dest: "/public-optimized/favicon.ico"
                },
                {
                    src: "/api/(.*)",
                    dest: "/api/index.js"
                },
                {
                    src: "/(assistenza-informatica|cybersecurity|cloud-storage|backup-disaster-recovery)$",
                    dest: "/api/[...slug].js"
                },
                {
                    src: "/(assistenza-informatica|cybersecurity|cloud-storage|backup-disaster-recovery)-([a-z-]+)$",
                    dest: "/api/[...slug].js"
                },
                {
                    src: "/contatti",
                    dest: "/public-optimized/contatti.html"
                },
                {
                    src: "/",
                    dest: "/public-optimized/index.html"
                },
                {
                    src: "/(.*)",
                    dest: "/api/[...slug].js"
                }
            ],
            env: {
                NODE_ENV: "production"
            }
        };
        
        await fs.writeJson(
            path.join(this.projectRoot, 'vercel.json'),
            vercelConfig,
            { spaces: 2 }
        );
        
        console.log(colors.green('✅ Vercel configuration updated'));
    }
    
    async generateReport() {
        // Count optimized files
        const countFiles = async (dir) => {
            if (!await fs.pathExists(dir)) return 0;
            
            let count = 0;
            const items = await fs.readdir(dir);
            
            for (const item of items) {
                const itemPath = path.join(dir, item);
                const stat = await fs.stat(itemPath);
                
                if (stat.isDirectory()) {
                    count += await countFiles(itemPath);
                } else {
                    count++;
                }
            }
            
            return count;
        };
        
        const optimizedDir = path.join(this.projectRoot, 'public-optimized');
        this.stats.optimizedFiles = await countFiles(optimizedDir);
        this.stats.optimizedFiles += 2; // Add API files
        
        this.stats.reduction = ((this.stats.originalFiles - this.stats.optimizedFiles) / this.stats.originalFiles * 100).toFixed(1);
        
        console.log(colors.blue('\n📊 Optimization Report:'));
        console.log(colors.gray(`Original files: ${this.stats.originalFiles}`));
        console.log(colors.green(`Optimized files: ${this.stats.optimizedFiles}`));
        console.log(colors.green(`Reduction: ${this.stats.reduction}%`));
        console.log(colors.blue(`Vercel free tier compatible: ${this.stats.optimizedFiles < 5000 ? '✅ YES' : '❌ NO'}`));
    }
}

// Run optimizer if called directly
if (require.main === module) {
    const optimizer = new VercelOptimizer();
    optimizer.optimize().catch(console.error);
}

module.exports = VercelOptimizer;
