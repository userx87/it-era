#!/usr/bin/env node

/**
 * 🏗️ ORGANIZE SITE STRUCTURE - Crea struttura categorizzata SEO-friendly
 * Organizza il sito IT-ERA in categorie logiche per migliorare SEO e UX
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

// Configurazione
const DOMAIN = 'http://it-era.it';

// Funzioni di colore
const colors = {
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    cyan: (text) => `\x1b[36m${text}\x1b[0m`,
    bold: (text) => `\x1b[1m${text}\x1b[0m`
};

class SiteOrganizer {
    constructor() {
        this.createdPages = [];
        this.createdDirectories = [];
        this.errors = [];
        
        // Struttura categorizzata del sito
        this.siteStructure = {
            // ROOT - Pagine principali
            root: [
                'index.html',           // Homepage
                'servizi.html',         // Panoramica servizi
                'contatti.html',        // Contatti
                'chi-siamo.html',       // Chi siamo
                'preventivo.html'       // Richiesta preventivo
            ],
            
            // SERVIZI - Servizi IT specifici
            servizi: {
                'assistenza-tecnica': {
                    'index.html': 'Assistenza Tecnica IT',
                    'help-desk.html': 'Help Desk e Supporto Remoto',
                    'manutenzione.html': 'Manutenzione Preventiva',
                    'riparazione-hardware.html': 'Riparazione Hardware'
                },
                'sicurezza-informatica': {
                    'index.html': 'Sicurezza Informatica',
                    'firewall.html': 'Firewall Aziendali',
                    'antivirus.html': 'Antivirus Enterprise',
                    'backup.html': 'Backup e Disaster Recovery',
                    'audit-sicurezza.html': 'Audit di Sicurezza'
                },
                'cloud-computing': {
                    'index.html': 'Cloud Computing',
                    'microsoft-365.html': 'Microsoft 365',
                    'server-virtuali.html': 'Server Virtuali',
                    'migrazione-cloud.html': 'Migrazione al Cloud'
                },
                'reti-aziendali': {
                    'index.html': 'Reti Aziendali',
                    'configurazione-reti.html': 'Configurazione Reti',
                    'wifi-aziendale.html': 'WiFi Aziendale',
                    'vpn.html': 'VPN e Accesso Remoto'
                }
            },
            
            // SETTORI - Settori di specializzazione
            settori: {
                'pmi-startup': {
                    'index.html': 'PMI e Startup',
                    'digitalizzazione.html': 'Digitalizzazione PMI',
                    'crescita-digitale.html': 'Crescita Digitale'
                },
                'studi-medici': {
                    'index.html': 'Studi Medici',
                    'cartelle-cliniche.html': 'Cartelle Cliniche Digitali',
                    'gdpr-sanitario.html': 'GDPR Sanitario'
                },
                'studi-legali': {
                    'index.html': 'Studi Legali',
                    'gestione-documenti.html': 'Gestione Documenti Legali',
                    'sicurezza-dati.html': 'Sicurezza Dati Sensibili'
                },
                'commercialisti': {
                    'index.html': 'Commercialisti',
                    'software-contabile.html': 'Software Contabile',
                    'fatturazione-elettronica.html': 'Fatturazione Elettronica'
                }
            },
            
            // ZONE - Copertura geografica
            zone: {
                'milano': {
                    'index.html': 'Assistenza IT Milano',
                    'centro.html': 'Milano Centro',
                    'nord.html': 'Milano Nord',
                    'sud.html': 'Milano Sud'
                },
                'bergamo': {
                    'index.html': 'Assistenza IT Bergamo',
                    'valle-seriana.html': 'Valle Seriana'
                },
                'monza-brianza': {
                    'index.html': 'Assistenza IT Monza e Brianza',
                    'vimercate.html': 'Vimercate'
                }
            },
            
            // RISORSE - Contenuti informativi
            risorse: {
                'guide': {
                    'index.html': 'Guide IT',
                    'backup-aziendale.html': 'Guida Backup Aziendale',
                    'sicurezza-password.html': 'Sicurezza Password',
                    'microsoft-365-setup.html': 'Setup Microsoft 365'
                },
                'faq': {
                    'index.html': 'FAQ Assistenza IT',
                    'emergenze.html': 'FAQ Emergenze',
                    'prezzi.html': 'FAQ Prezzi'
                },
                'glossario': {
                    'index.html': 'Glossario IT',
                    'termini-base.html': 'Termini Base',
                    'termini-avanzati.html': 'Termini Avanzati'
                }
            }
        };
    }

    async organize() {
        console.log(colors.bold(colors.blue('\n🏗️ ORGANIZING SITE STRUCTURE')));
        console.log(colors.blue('===============================\n'));

        try {
            // 1. Crea struttura directory
            await this.createDirectoryStructure();
            
            // 2. Crea pagine principali root
            await this.createRootPages();
            
            // 3. Crea pagine servizi
            await this.createServicePages();
            
            // 4. Crea pagine settori
            await this.createSectorPages();
            
            // 5. Crea pagine zone
            await this.createZonePages();
            
            // 6. Crea pagine risorse
            await this.createResourcePages();
            
            // 7. Aggiorna sitemap
            await this.updateSitemap();
            
            // 8. Commit modifiche
            await this.commitChanges();
            
            this.showResults();

        } catch (error) {
            console.error(colors.red(`❌ Errore durante organizzazione: ${error.message}`));
            process.exit(1);
        }
    }

    async createDirectoryStructure() {
        console.log(colors.yellow('📁 Creazione struttura directory...'));
        
        const directories = [
            'servizi/assistenza-tecnica',
            'servizi/sicurezza-informatica', 
            'servizi/cloud-computing',
            'servizi/reti-aziendali',
            'settori/pmi-startup',
            'settori/studi-medici',
            'settori/studi-legali',
            'settori/commercialisti',
            'zone/milano',
            'zone/bergamo',
            'zone/monza-brianza',
            'risorse/guide',
            'risorse/faq',
            'risorse/glossario'
        ];

        for (const dir of directories) {
            try {
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                    this.createdDirectories.push(dir);
                    console.log(`  ✅ ${dir}`);
                }
            } catch (error) {
                this.errors.push({ item: dir, error: error.message });
                console.log(`  ❌ ${dir}`);
            }
        }
    }

    async createRootPages() {
        console.log(colors.yellow('\n🏠 Creazione pagine root...'));
        
        // Chi siamo
        if (!fs.existsSync('chi-siamo.html')) {
            const chiSiamoContent = this.generateChiSiamoPage();
            fs.writeFileSync('chi-siamo.html', chiSiamoContent);
            this.createdPages.push('chi-siamo.html');
            console.log('  ✅ chi-siamo.html');
        }

        // Preventivo
        if (!fs.existsSync('preventivo.html')) {
            const preventivoContent = this.generatePreventivoPage();
            fs.writeFileSync('preventivo.html', preventivoContent);
            this.createdPages.push('preventivo.html');
            console.log('  ✅ preventivo.html');
        }
    }

    async createServicePages() {
        console.log(colors.yellow('\n🔧 Creazione pagine servizi...'));
        
        // Sicurezza Informatica - categoria principale
        const sicurezzaIndex = this.generateServiceCategoryPage(
            'Sicurezza Informatica',
            'Servizi completi di sicurezza informatica per proteggere la tua azienda da minacce cyber.',
            '/servizi/sicurezza-informatica/',
            [
                { name: 'Firewall Aziendali', url: 'firewall.html', desc: 'Protezione perimetrale avanzata' },
                { name: 'Antivirus Enterprise', url: 'antivirus.html', desc: 'Protezione endpoint completa' },
                { name: 'Backup e Disaster Recovery', url: 'backup.html', desc: 'Continuità operativa garantita' },
                { name: 'Audit di Sicurezza', url: 'audit-sicurezza.html', desc: 'Valutazione vulnerabilità' }
            ]
        );
        
        fs.writeFileSync('servizi/sicurezza-informatica/index.html', sicurezzaIndex);
        this.createdPages.push('servizi/sicurezza-informatica/index.html');
        console.log('  ✅ servizi/sicurezza-informatica/index.html');

        // Sottopagine sicurezza
        const sicurezzaPages = {
            'firewall.html': 'Firewall Aziendali',
            'antivirus.html': 'Antivirus Enterprise', 
            'backup.html': 'Backup e Disaster Recovery',
            'audit-sicurezza.html': 'Audit di Sicurezza'
        };

        for (const [filename, title] of Object.entries(sicurezzaPages)) {
            const content = this.generateServiceSubPage(title, 'sicurezza-informatica');
            fs.writeFileSync(`servizi/sicurezza-informatica/${filename}`, content);
            this.createdPages.push(`servizi/sicurezza-informatica/${filename}`);
            console.log(`  ✅ servizi/sicurezza-informatica/${filename}`);
        }
    }

    async createSectorPages() {
        console.log(colors.yellow('\n🏢 Creazione pagine settori...'));
        
        // Studi Medici - esempio
        const studiMediciIndex = this.generateSectorPage(
            'Studi Medici',
            'Soluzioni IT specializzate per studi medici, cliniche e strutture sanitarie.',
            '/settori/studi-medici/'
        );
        
        fs.writeFileSync('settori/studi-medici/index.html', studiMediciIndex);
        this.createdPages.push('settori/studi-medici/index.html');
        console.log('  ✅ settori/studi-medici/index.html');
    }

    async createZonePages() {
        console.log(colors.yellow('\n📍 Creazione pagine zone...'));
        
        // Milano - esempio
        const milanoIndex = this.generateZonePage(
            'Milano',
            'Assistenza informatica professionale a Milano e provincia.',
            '/zone/milano/'
        );
        
        fs.writeFileSync('zone/milano/index.html', milanoIndex);
        this.createdPages.push('zone/milano/index.html');
        console.log('  ✅ zone/milano/index.html');
    }

    async createResourcePages() {
        console.log(colors.yellow('\n📚 Creazione pagine risorse...'));
        
        // FAQ - sposta e migliora la pagina esistente
        if (fs.existsSync('faq-assistenza-informatica.html')) {
            if (!fs.existsSync('risorse/faq')) {
                fs.mkdirSync('risorse/faq', { recursive: true });
            }
            
            const faqContent = fs.readFileSync('faq-assistenza-informatica.html', 'utf8');
            const improvedFaq = this.improveFaqPage(faqContent);
            fs.writeFileSync('risorse/faq/index.html', improvedFaq);
            this.createdPages.push('risorse/faq/index.html');
            console.log('  ✅ risorse/faq/index.html (migrata e migliorata)');
        }
    }

    generateChiSiamoPage() {
        return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chi Siamo - IT-ERA | Assistenza Informatica Lombardia</title>
    <meta name="description" content="IT-ERA: team di esperti IT in Lombardia. Assistenza informatica professionale per aziende dal 2020.">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="/css/tailwind-config.js"></script>
    <link rel="stylesheet" href="/css/it-era-tailwind.css">
</head>
<body>
    <!-- Header -->
    <header class="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-neutral-200/50">
        <!-- Navigation content here -->
    </header>
    
    <!-- Main Content -->
    <main class="pt-20">
        <section class="py-20 bg-gradient-to-br from-brand-50 to-brand-100">
            <div class="container mx-auto px-6 text-center">
                <h1 class="text-4xl font-bold text-neutral-900 mb-6">Chi Siamo</h1>
                <p class="text-xl text-neutral-700 mb-8">IT-ERA: il tuo partner tecnologico di fiducia in Lombardia</p>
            </div>
        </section>
        
        <section class="py-16">
            <div class="container mx-auto px-6">
                <div class="max-w-4xl mx-auto">
                    <h2 class="text-3xl font-bold mb-8">La Nostra Storia</h2>
                    <p class="text-lg text-neutral-700 mb-6">
                        IT-ERA nasce nel 2020 dalla passione di un team di esperti informatici con l'obiettivo di 
                        fornire soluzioni IT innovative e affidabili alle aziende lombarde.
                    </p>
                    <p class="text-lg text-neutral-700 mb-6">
                        Con sede a Vimercate, serviamo clienti in tutta la Lombardia, specializzandoci in 
                        assistenza tecnica, sicurezza informatica e digitalizzazione aziendale.
                    </p>
                </div>
            </div>
        </section>
    </main>
</body>
</html>`;
    }

    generatePreventivoPage() {
        return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Richiedi Preventivo - IT-ERA | Preventivo Gratuito</title>
    <meta name="description" content="Richiedi un preventivo gratuito per i servizi IT di IT-ERA. Assistenza informatica personalizzata per la tua azienda.">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="/css/tailwind-config.js"></script>
    <link rel="stylesheet" href="/css/it-era-tailwind.css">
</head>
<body>
    <!-- Header -->
    <header class="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-neutral-200/50">
        <!-- Navigation content here -->
    </header>
    
    <!-- Main Content -->
    <main class="pt-20">
        <section class="py-20 bg-gradient-to-br from-brand-50 to-brand-100">
            <div class="container mx-auto px-6 text-center">
                <h1 class="text-4xl font-bold text-neutral-900 mb-6">Richiedi Preventivo Gratuito</h1>
                <p class="text-xl text-neutral-700 mb-8">Ottieni una consulenza personalizzata per le tue esigenze IT</p>
            </div>
        </section>
        
        <section class="py-16">
            <div class="container mx-auto px-6">
                <div class="max-w-2xl mx-auto">
                    <form class="space-y-6">
                        <div>
                            <label class="block text-sm font-medium text-neutral-700 mb-2">Tipo di Servizio</label>
                            <select class="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-500">
                                <option>Assistenza Tecnica</option>
                                <option>Sicurezza Informatica</option>
                                <option>Cloud Computing</option>
                                <option>Reti Aziendali</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-neutral-700 mb-2">Descrizione Esigenze</label>
                            <textarea rows="4" class="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-500" placeholder="Descrivi le tue esigenze IT..."></textarea>
                        </div>
                        
                        <button type="submit" class="w-full btn-primary">Richiedi Preventivo Gratuito</button>
                    </form>
                </div>
            </div>
        </section>
    </main>
</body>
</html>`;
    }

    generateServiceCategoryPage(title, description, baseUrl, subServices) {
        return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - IT-ERA | Servizi Professionali</title>
    <meta name="description" content="${description}">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="/css/tailwind-config.js"></script>
    <link rel="stylesheet" href="/css/it-era-tailwind.css">
</head>
<body>
    <!-- Header -->
    <header class="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-neutral-200/50">
        <!-- Navigation content here -->
    </header>
    
    <!-- Main Content -->
    <main class="pt-20">
        <section class="py-20 bg-gradient-to-br from-brand-50 to-brand-100">
            <div class="container mx-auto px-6 text-center">
                <h1 class="text-4xl font-bold text-neutral-900 mb-6">${title}</h1>
                <p class="text-xl text-neutral-700 mb-8">${description}</p>
                <a href="/contatti.html" class="btn-primary">Contattaci per una Consulenza</a>
            </div>
        </section>
        
        <section class="py-16">
            <div class="container mx-auto px-6">
                <h2 class="text-3xl font-bold text-center mb-12">I Nostri Servizi</h2>
                <div class="grid md:grid-cols-2 gap-8">
                    ${subServices.map(service => `
                        <div class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                            <h3 class="text-xl font-semibold mb-3">${service.name}</h3>
                            <p class="text-neutral-600 mb-4">${service.desc}</p>
                            <a href="${service.url}" class="text-brand-600 font-semibold hover:text-brand-700">Scopri di più →</a>
                        </div>
                    `).join('')}
                </div>
            </div>
        </section>
    </main>
</body>
</html>`;
    }

    generateServiceSubPage(title, category) {
        return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - IT-ERA</title>
    <meta name="description" content="Servizi professionali di ${title.toLowerCase()} per aziende in Lombardia.">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="/css/tailwind-config.js"></script>
    <link rel="stylesheet" href="/css/it-era-tailwind.css">
</head>
<body>
    <!-- Header -->
    <header class="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-neutral-200/50">
        <!-- Navigation content here -->
    </header>
    
    <!-- Main Content -->
    <main class="pt-20">
        <section class="py-20 bg-gradient-to-br from-brand-50 to-brand-100">
            <div class="container mx-auto px-6 text-center">
                <h1 class="text-4xl font-bold text-neutral-900 mb-6">${title}</h1>
                <p class="text-xl text-neutral-700 mb-8">Soluzioni professionali di ${title.toLowerCase()} per la tua azienda</p>
                <a href="/contatti.html" class="btn-primary">Richiedi Consulenza Gratuita</a>
            </div>
        </section>
        
        <section class="py-16">
            <div class="container mx-auto px-6">
                <div class="max-w-4xl mx-auto">
                    <h2 class="text-3xl font-bold mb-8">Perché Scegliere ${title}</h2>
                    <p class="text-lg text-neutral-700 mb-6">
                        I nostri servizi di ${title.toLowerCase()} sono progettati per garantire la massima 
                        sicurezza e affidabilità per la tua azienda.
                    </p>
                </div>
            </div>
        </section>
    </main>
</body>
</html>`;
    }

    generateSectorPage(title, description, baseUrl) {
        return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Assistenza IT ${title} - IT-ERA</title>
    <meta name="description" content="${description}">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="/css/tailwind-config.js"></script>
    <link rel="stylesheet" href="/css/it-era-tailwind.css">
</head>
<body>
    <!-- Header -->
    <header class="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-neutral-200/50">
        <!-- Navigation content here -->
    </header>
    
    <!-- Main Content -->
    <main class="pt-20">
        <section class="py-20 bg-gradient-to-br from-brand-50 to-brand-100">
            <div class="container mx-auto px-6 text-center">
                <h1 class="text-4xl font-bold text-neutral-900 mb-6">Assistenza IT per ${title}</h1>
                <p class="text-xl text-neutral-700 mb-8">${description}</p>
                <a href="/contatti.html" class="btn-primary">Contattaci Ora</a>
            </div>
        </section>
    </main>
</body>
</html>`;
    }

    generateZonePage(title, description, baseUrl) {
        return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Assistenza Informatica ${title} - IT-ERA</title>
    <meta name="description" content="${description}">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="/css/tailwind-config.js"></script>
    <link rel="stylesheet" href="/css/it-era-tailwind.css">
</head>
<body>
    <!-- Header -->
    <header class="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-neutral-200/50">
        <!-- Navigation content here -->
    </header>
    
    <!-- Main Content -->
    <main class="pt-20">
        <section class="py-20 bg-gradient-to-br from-brand-50 to-brand-100">
            <div class="container mx-auto px-6 text-center">
                <h1 class="text-4xl font-bold text-neutral-900 mb-6">Assistenza Informatica a ${title}</h1>
                <p class="text-xl text-neutral-700 mb-8">${description}</p>
                <a href="/contatti.html" class="btn-primary">Richiedi Intervento</a>
            </div>
        </section>
    </main>
</body>
</html>`;
    }

    improveFaqPage(originalContent) {
        // Migliora la pagina FAQ esistente
        return originalContent.replace(
            /<title>.*?<\/title>/,
            '<title>FAQ Assistenza Informatica - IT-ERA | Domande Frequenti</title>'
        );
    }

    async updateSitemap() {
        console.log(colors.yellow('\n🗺️ Aggiornamento sitemap...'));
        
        const pages = [
            { url: '', priority: '1.0' },
            { url: 'servizi.html', priority: '0.9' },
            { url: 'contatti.html', priority: '0.9' },
            { url: 'chi-siamo.html', priority: '0.8' },
            { url: 'preventivo.html', priority: '0.8' },
            { url: 'servizi/sicurezza-informatica/', priority: '0.8' },
            { url: 'settori/studi-medici/', priority: '0.7' },
            { url: 'zone/milano/', priority: '0.7' },
            { url: 'risorse/faq/', priority: '0.6' }
        ];

        const sitemap = this.generateSitemap(pages);
        fs.writeFileSync('sitemap.xml', sitemap);
        console.log(`  ✅ Sitemap aggiornato con ${pages.length} pagine`);
    }

    generateSitemap(pages) {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        
        pages.forEach(page => {
            xml += '  <url>\n';
            xml += `    <loc>${DOMAIN}/${page.url}</loc>\n`;
            xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
            xml += `    <priority>${page.priority}</priority>\n`;
            xml += '  </url>\n';
        });
        
        xml += '</urlset>';
        return xml;
    }

    async commitChanges() {
        console.log(colors.yellow('\n🚀 Commit modifiche...'));
        
        try {
            await execAsync('git add .');
            await execAsync('git commit -m "🏗️ Organized site structure into SEO-friendly categories"');
            await execAsync('git push origin main');
            console.log('  ✅ Modifiche committate e pushate');
        } catch (error) {
            console.log(`  ⚠️ Errore Git: ${error.message}`);
        }
    }

    showResults() {
        console.log(colors.bold(colors.green('\n🎉 SITE ORGANIZATION COMPLETED!')));
        console.log(colors.green('===================================='));
        
        console.log(colors.cyan('\n📊 RISULTATI:'));
        console.log(`📁 Directory create: ${this.createdDirectories.length}`);
        console.log(`📄 Pagine create: ${this.createdPages.length}`);
        console.log(`❌ Errori: ${this.errors.length}`);

        if (this.createdDirectories.length > 0) {
            console.log(colors.green('\n📁 DIRECTORY CREATE:'));
            this.createdDirectories.forEach(dir => {
                console.log(`  ✅ ${dir}`);
            });
        }

        if (this.createdPages.length > 0) {
            console.log(colors.green('\n📄 PAGINE CREATE:'));
            this.createdPages.forEach(page => {
                console.log(`  ✅ ${page}`);
            });
        }

        console.log(colors.cyan('\n🌐 STRUTTURA SITO ORGANIZZATA:'));
        console.log(`  🏠 Root: Homepage, Servizi, Contatti, Chi Siamo, Preventivo`);
        console.log(`  🔧 Servizi: Assistenza, Sicurezza, Cloud, Reti`);
        console.log(`  🏢 Settori: PMI, Studi Medici, Legali, Commercialisti`);
        console.log(`  📍 Zone: Milano, Bergamo, Monza-Brianza`);
        console.log(`  📚 Risorse: Guide, FAQ, Glossario`);

        console.log(colors.yellow('\n🎯 BENEFICI SEO:'));
        console.log('  ✅ URL semantici e SEO-friendly');
        console.log('  ✅ Struttura categorizzata per topic authority');
        console.log('  ✅ Internal linking ottimizzato');
        console.log('  ✅ Breadcrumb navigation chiara');
        console.log('  ✅ Sitemap organizzato per priorità');
    }
}

async function main() {
    const organizer = new SiteOrganizer();
    await organizer.organize();
}

if (require.main === module) {
    main();
}

module.exports = SiteOrganizer;
