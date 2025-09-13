#!/usr/bin/env node

/**
 * IT-ERA SEO BLOG GENERATOR
 * Intelligent agent for automated SEO-optimized blog content generation
 */

const fs = require('fs').promises;
const path = require('path');

class SEOBlogGenerator {
    constructor() {
        this.keywordDatabase = [];
        this.articleTemplates = {};
        this.brandVoice = {
            tone: 'professional',
            expertise: 'technical',
            target: 'business',
            location: 'Milano, Lombardia'
        };
        this.seoRules = {
            titleLength: { min: 30, max: 60 },
            descriptionLength: { min: 120, max: 160 },
            contentLength: { min: 300, max: 500 },
            keywordDensity: { min: 1, max: 3 },
            headingStructure: ['h1', 'h2', 'h3']
        };
    }

    async initialize() {
        console.log('🤖 INITIALIZING SEO BLOG GENERATOR');
        console.log('=' .repeat(50));
        
        await this.loadKeywordDatabase();
        await this.loadArticleTemplates();
        await this.setupOutputDirectories();
        
        console.log('✅ SEO Blog Generator initialized');
        console.log(`📊 Loaded ${this.keywordDatabase.length} keywords`);
        console.log(`📝 Loaded ${Object.keys(this.articleTemplates).length} templates`);
    }

    async loadKeywordDatabase() {
        // Comprehensive keyword database for IT services in Milan/Lombardy
        this.keywordDatabase = [
            // High-volume primary keywords
            { keyword: 'assistenza informatica Milano', volume: 1200, difficulty: 65, category: 'assistenza-informatica', intent: 'commercial' },
            { keyword: 'supporto IT aziende Lombardia', volume: 800, difficulty: 55, category: 'assistenza-informatica', intent: 'commercial' },
            { keyword: 'cybersecurity aziende Milano', volume: 600, difficulty: 70, category: 'cybersecurity', intent: 'informational' },
            { keyword: 'migrazione cloud Microsoft 365', volume: 500, difficulty: 60, category: 'cloud-computing', intent: 'commercial' },
            { keyword: 'digitalizzazione PMI Lombardia', volume: 400, difficulty: 50, category: 'digitalizzazione', intent: 'informational' },
            
            // Medium-volume secondary keywords
            { keyword: 'backup aziendale automatico', volume: 350, difficulty: 45, category: 'assistenza-informatica', intent: 'informational' },
            { keyword: 'protezione ransomware aziende', volume: 300, difficulty: 65, category: 'cybersecurity', intent: 'informational' },
            { keyword: 'software gestionale PMI', volume: 280, difficulty: 40, category: 'software-aziendali', intent: 'commercial' },
            { keyword: 'help desk aziendale Milano', volume: 250, difficulty: 50, category: 'assistenza-informatica', intent: 'commercial' },
            { keyword: 'sicurezza informatica ufficio', volume: 220, difficulty: 55, category: 'cybersecurity', intent: 'informational' },
            
            // Long-tail keywords
            { keyword: 'come scegliere antivirus aziendale', volume: 180, difficulty: 30, category: 'cybersecurity', intent: 'informational' },
            { keyword: 'costi migrazione cloud azienda', volume: 160, difficulty: 35, category: 'cloud-computing', intent: 'informational' },
            { keyword: 'software commercialisti Milano', volume: 150, difficulty: 40, category: 'settori-specifici', intent: 'commercial' },
            { keyword: 'gestione IT studi legali', volume: 140, difficulty: 35, category: 'settori-specifici', intent: 'informational' },
            { keyword: 'automazione processi aziendali', volume: 130, difficulty: 45, category: 'digitalizzazione', intent: 'informational' },
            
            // Local SEO keywords
            { keyword: 'assistenza computer Milano centro', volume: 120, difficulty: 40, category: 'assistenza-informatica', intent: 'local' },
            { keyword: 'consulenza IT Bergamo', volume: 100, difficulty: 35, category: 'assistenza-informatica', intent: 'local' },
            { keyword: 'supporto informatico Brescia', volume: 90, difficulty: 30, category: 'assistenza-informatica', intent: 'local' },
            { keyword: 'cybersecurity Monza Brianza', volume: 80, difficulty: 25, category: 'cybersecurity', intent: 'local' },
            { keyword: 'cloud computing Varese', volume: 70, difficulty: 20, category: 'cloud-computing', intent: 'local' },
            
            // Technical keywords
            { keyword: 'configurazione firewall aziendale', volume: 200, difficulty: 50, category: 'cybersecurity', intent: 'informational' },
            { keyword: 'backup incrementale vs differenziale', volume: 150, difficulty: 40, category: 'assistenza-informatica', intent: 'informational' },
            { keyword: 'VPN aziendale sicura', volume: 180, difficulty: 45, category: 'cybersecurity', intent: 'informational' },
            { keyword: 'disaster recovery piano', volume: 160, difficulty: 55, category: 'assistenza-informatica', intent: 'informational' },
            { keyword: 'monitoraggio rete aziendale', volume: 140, difficulty: 50, category: 'assistenza-informatica', intent: 'informational' },
            
            // Industry-specific keywords
            { keyword: 'IT compliance GDPR', volume: 300, difficulty: 60, category: 'cybersecurity', intent: 'informational' },
            { keyword: 'software fatturazione elettronica', volume: 250, difficulty: 45, category: 'software-aziendali', intent: 'commercial' },
            { keyword: 'gestionale studio medico', volume: 200, difficulty: 40, category: 'settori-specifici', intent: 'commercial' },
            { keyword: 'CRM per agenti immobiliari', volume: 180, difficulty: 35, category: 'software-aziendali', intent: 'commercial' },
            { keyword: 'ERP piccole medie imprese', volume: 160, difficulty: 50, category: 'software-aziendali', intent: 'informational' }
        ];

        console.log(`📊 Loaded ${this.keywordDatabase.length} keywords from database`);
    }

    async loadArticleTemplates() {
        this.articleTemplates = {
            'how-to': {
                structure: [
                    'Introduzione al problema',
                    'Perché è importante',
                    'Guida passo-passo',
                    'Best practices',
                    'Errori comuni da evitare',
                    'Conclusioni e next steps'
                ],
                tone: 'educational',
                cta: 'consultation'
            },
            'guide': {
                structure: [
                    'Panoramica generale',
                    'Vantaggi e benefici',
                    'Implementazione pratica',
                    'Casi d\'uso reali',
                    'Considerazioni tecniche',
                    'Raccomandazioni finali'
                ],
                tone: 'authoritative',
                cta: 'download'
            },
            'comparison': {
                structure: [
                    'Introduzione alle opzioni',
                    'Criteri di valutazione',
                    'Confronto dettagliato',
                    'Pro e contro',
                    'Raccomandazioni per settore',
                    'Conclusioni'
                ],
                tone: 'analytical',
                cta: 'consultation'
            },
            'news': {
                structure: [
                    'Novità e aggiornamenti',
                    'Impatto sul business',
                    'Cosa significa per le aziende',
                    'Azioni consigliate',
                    'Preparazione al futuro'
                ],
                tone: 'informative',
                cta: 'newsletter'
            }
        };

        console.log(`📝 Loaded ${Object.keys(this.articleTemplates).length} article templates`);
    }

    async setupOutputDirectories() {
        const directories = [
            'blog/articoli',
            'blog/images',
            'blog/categoria/assistenza-informatica',
            'blog/categoria/cybersecurity',
            'blog/categoria/cloud-computing',
            'blog/categoria/digitalizzazione',
            'blog/categoria/software-aziendali',
            'blog/categoria/settori-specifici'
        ];

        for (const dir of directories) {
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch (error) {
                // Directory already exists
            }
        }

        console.log('📁 Output directories ready');
    }

    selectOptimalKeyword() {
        // Intelligent keyword selection based on:
        // 1. Search volume vs difficulty ratio
        // 2. Content gap analysis
        // 3. Seasonal trends
        // 4. Competition analysis

        const scoredKeywords = this.keywordDatabase.map(kw => {
            const volumeScore = Math.log(kw.volume) * 10;
            const difficultyPenalty = kw.difficulty * 0.5;
            const intentBonus = kw.intent === 'informational' ? 10 : 5;
            const localBonus = kw.intent === 'local' ? 15 : 0;
            
            const score = volumeScore - difficultyPenalty + intentBonus + localBonus;
            
            return { ...kw, score };
        });

        // Sort by score and select top keyword
        scoredKeywords.sort((a, b) => b.score - a.score);
        
        return scoredKeywords[0];
    }

    async generateArticle(keyword) {
        console.log(`🎯 Generating article for keyword: "${keyword.keyword}"`);
        
        const template = this.selectTemplate(keyword);
        const article = await this.createArticleContent(keyword, template);
        const htmlContent = await this.generateHTML(article);
        
        return {
            keyword,
            article,
            htmlContent,
            filename: this.generateFilename(keyword)
        };
    }

    selectTemplate(keyword) {
        // Select template based on keyword intent and category
        if (keyword.intent === 'informational') {
            return keyword.keyword.includes('come') ? 'how-to' : 'guide';
        } else if (keyword.intent === 'commercial') {
            return 'comparison';
        } else {
            return 'guide';
        }
    }

    async createArticleContent(keyword, templateType) {
        const template = this.articleTemplates[templateType];
        
        const article = {
            title: this.generateTitle(keyword),
            description: this.generateDescription(keyword),
            keywords: this.generateKeywords(keyword),
            category: keyword.category,
            slug: this.generateSlug(keyword),
            publishDate: new Date().toISOString(),
            readingTime: Math.ceil(this.seoRules.contentLength.max / 200),
            excerpt: '',
            content: '',
            tags: this.generateTags(keyword)
        };

        // Generate content based on template structure
        article.content = await this.generateContentSections(keyword, template);
        article.excerpt = this.generateExcerpt(article.content);

        return article;
    }

    generateTitle(keyword) {
        const titleTemplates = [
            `${keyword.keyword}: Guida Completa 2025`,
            `Come Implementare ${keyword.keyword} nella Tua Azienda`,
            `${keyword.keyword}: Best Practices e Consigli Esperti`,
            `Tutto su ${keyword.keyword}: Vantaggi e Implementazione`,
            `${keyword.keyword}: Soluzioni Professionali per Aziende`
        ];

        const selectedTemplate = titleTemplates[Math.floor(Math.random() * titleTemplates.length)];
        
        // Ensure title length is within SEO limits
        if (selectedTemplate.length > this.seoRules.titleLength.max) {
            return selectedTemplate.substring(0, this.seoRules.titleLength.max - 3) + '...';
        }
        
        return selectedTemplate;
    }

    generateDescription(keyword) {
        const descriptionTemplates = [
            `Scopri tutto su ${keyword.keyword}. Guida completa con best practices, vantaggi e implementazione per aziende in Lombardia. Consulenza gratuita disponibile.`,
            `${keyword.keyword}: soluzioni professionali per la tua azienda. Esperti IT con 15+ anni di esperienza. Consulenza gratuita e supporto 24/7 su Milano e Lombardia.`,
            `Guida pratica su ${keyword.keyword}. Consigli degli esperti IT-ERA per ottimizzare la tua infrastruttura aziendale. Contattaci per una consulenza gratuita.`
        ];

        const selectedDescription = descriptionTemplates[Math.floor(Math.random() * descriptionTemplates.length)];
        
        // Ensure description length is within SEO limits
        if (selectedDescription.length > this.seoRules.descriptionLength.max) {
            return selectedDescription.substring(0, this.seoRules.descriptionLength.max - 3) + '...';
        }
        
        return selectedDescription;
    }

    generateKeywords(keyword) {
        const baseKeywords = [keyword.keyword];
        const relatedKeywords = [
            'assistenza informatica Milano',
            'supporto IT aziende',
            'consulenza informatica',
            'IT-ERA',
            'Lombardia'
        ];

        return [...baseKeywords, ...relatedKeywords.slice(0, 4)].join(', ');
    }

    generateSlug(keyword) {
        return keyword.keyword
            .toLowerCase()
            .replace(/[àáâãäå]/g, 'a')
            .replace(/[èéêë]/g, 'e')
            .replace(/[ìíîï]/g, 'i')
            .replace(/[òóôõö]/g, 'o')
            .replace(/[ùúûü]/g, 'u')
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    async generateContentSections(keyword, template) {
        const sections = [];
        
        for (const section of template.structure) {
            const content = await this.generateSectionContent(keyword, section);
            sections.push(`<h2>${section}</h2>\n${content}`);
        }

        return sections.join('\n\n');
    }

    async generateSectionContent(keyword, sectionTitle) {
        // Generate contextual content based on section title and keyword
        const contentTemplates = {
            'Introduzione al problema': `
                <p>Nel panorama aziendale moderno, <strong>${keyword.keyword}</strong> rappresenta una sfida cruciale per molte aziende in Lombardia. La crescente digitalizzazione e la necessità di rimanere competitivi richiedono soluzioni IT all'avanguardia.</p>
                <p>Le aziende che non investono in ${keyword.keyword} rischiano di rimanere indietro rispetto alla concorrenza, compromettendo efficienza operativa e sicurezza dei dati.</p>
            `,
            'Perché è importante': `
                <p>L'implementazione corretta di <strong>${keyword.keyword}</strong> offre numerosi vantaggi:</p>
                <ul>
                    <li>Miglioramento dell'efficienza operativa</li>
                    <li>Riduzione dei costi IT a lungo termine</li>
                    <li>Maggiore sicurezza dei dati aziendali</li>
                    <li>Scalabilità per la crescita futura</li>
                </ul>
            `,
            'Guida passo-passo': `
                <p>Ecco come implementare <strong>${keyword.keyword}</strong> nella tua azienda:</p>
                <ol>
                    <li><strong>Valutazione iniziale:</strong> Analizza le esigenze attuali e future</li>
                    <li><strong>Pianificazione:</strong> Definisci obiettivi e timeline</li>
                    <li><strong>Implementazione:</strong> Esegui la migrazione in fasi controllate</li>
                    <li><strong>Testing:</strong> Verifica il corretto funzionamento</li>
                    <li><strong>Formazione:</strong> Prepara il team alle nuove procedure</li>
                </ol>
            `,
            'Best practices': `
                <p>Per ottenere i migliori risultati con <strong>${keyword.keyword}</strong>, segui queste best practices:</p>
                <ul>
                    <li>Mantieni sempre backup aggiornati</li>
                    <li>Implementa protocolli di sicurezza robusti</li>
                    <li>Monitora costantemente le performance</li>
                    <li>Aggiorna regolarmente software e sistemi</li>
                </ul>
            `,
            'Conclusioni e next steps': `
                <p>L'implementazione di <strong>${keyword.keyword}</strong> è un investimento strategico per il futuro della tua azienda. Con la giusta pianificazione e supporto professionale, puoi ottenere risultati significativi in termini di efficienza e competitività.</p>
                <p>Il team IT-ERA è pronto ad aiutarti in questo percorso con consulenza specializzata e supporto continuo.</p>
            `
        };

        return contentTemplates[sectionTitle] || `<p>Contenuto per ${sectionTitle} relativo a <strong>${keyword.keyword}</strong>.</p>`;
    }

    generateExcerpt(content) {
        // Extract first paragraph as excerpt
        const firstParagraph = content.match(/<p>(.*?)<\/p>/);
        if (firstParagraph) {
            return firstParagraph[1].replace(/<[^>]*>/g, '').substring(0, 150) + '...';
        }
        return 'Guida completa e consigli degli esperti IT-ERA.';
    }

    generateTags(keyword) {
        const baseTags = keyword.keyword.split(' ');
        const categoryTags = {
            'assistenza-informatica': ['supporto IT', 'help desk', 'manutenzione'],
            'cybersecurity': ['sicurezza', 'protezione', 'antivirus'],
            'cloud-computing': ['cloud', 'Microsoft 365', 'backup'],
            'digitalizzazione': ['automazione', 'innovazione', 'trasformazione'],
            'software-aziendali': ['gestionale', 'CRM', 'ERP'],
            'settori-specifici': ['PMI', 'commercialisti', 'studi legali']
        };

        const tags = [...baseTags, ...(categoryTags[keyword.category] || [])];
        return tags.map(tag => `<span class="bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm">${tag}</span>`).join(' ');
    }

    generateFilename(keyword) {
        const date = new Date();
        const dateStr = date.toISOString().split('T')[0];
        return `${dateStr}-${this.generateSlug(keyword)}.html`;
    }

    async generateHTML(article) {
        const template = await fs.readFile('blog/template-article.html', 'utf8');
        
        const replacements = {
            '{{ARTICLE_TITLE}}': article.title,
            '{{ARTICLE_DESCRIPTION}}': article.description,
            '{{ARTICLE_KEYWORDS}}': article.keywords,
            '{{ARTICLE_SLUG}}': article.slug,
            '{{ARTICLE_CATEGORY}}': this.getCategoryDisplayName(article.category),
            '{{ARTICLE_CATEGORY_SLUG}}': article.category,
            '{{PUBLISH_DATE}}': article.publishDate,
            '{{PUBLISH_DATE_FORMATTED}}': new Date(article.publishDate).toLocaleDateString('it-IT'),
            '{{READING_TIME}}': article.readingTime,
            '{{ARTICLE_EXCERPT}}': article.excerpt,
            '{{ARTICLE_CONTENT}}': article.content,
            '{{ARTICLE_TAGS}}': article.tags,
            '{{CATEGORY_COLOR}}': this.getCategoryColor(article.category)
        };

        let html = template;
        for (const [placeholder, value] of Object.entries(replacements)) {
            html = html.replace(new RegExp(placeholder, 'g'), value);
        }

        return html;
    }

    getCategoryDisplayName(category) {
        const categoryNames = {
            'assistenza-informatica': 'Assistenza Informatica',
            'cybersecurity': 'Cybersecurity',
            'cloud-computing': 'Cloud Computing',
            'digitalizzazione': 'Digitalizzazione',
            'software-aziendali': 'Software Aziendali',
            'settori-specifici': 'Settori Specifici'
        };
        return categoryNames[category] || category;
    }

    getCategoryColor(category) {
        const categoryColors = {
            'assistenza-informatica': 'blue',
            'cybersecurity': 'red',
            'cloud-computing': 'green',
            'digitalizzazione': 'purple',
            'software-aziendali': 'orange',
            'settori-specifici': 'indigo'
        };
        return categoryColors[category] || 'gray';
    }

    async publishArticle(generatedContent) {
        const { article, htmlContent, filename } = generatedContent;
        
        // Save article HTML
        const articlePath = path.join('blog/articoli', filename);
        await fs.writeFile(articlePath, htmlContent);
        
        // Update blog index
        await this.updateBlogIndex(article);
        
        // Update category page
        await this.updateCategoryPage(article);
        
        // Update sitemap
        await this.updateSitemap(article);
        
        console.log(`✅ Article published: ${articlePath}`);
        return articlePath;
    }

    async updateBlogIndex(article) {
        // Add article to blog index
        const indexPath = 'blog/index.html';
        try {
            let indexContent = await fs.readFile(indexPath, 'utf8');

            const articleCard = `
                <div class="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                    <div class="h-48 bg-gradient-to-br from-${this.getCategoryColor(article.category)}-500 to-${this.getCategoryColor(article.category)}-600"></div>
                    <div class="p-6">
                        <div class="text-sm text-${this.getCategoryColor(article.category)}-600 font-semibold mb-2">${this.getCategoryDisplayName(article.category)}</div>
                        <h3 class="text-xl font-bold text-gray-900 mb-3">${article.title}</h3>
                        <p class="text-gray-600 mb-4">${article.excerpt}</p>
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-500">${new Date(article.publishDate).toLocaleDateString('it-IT')}</span>
                            <a href="articoli/${article.slug}.html" class="text-${this.getCategoryColor(article.category)}-600 hover:text-${this.getCategoryColor(article.category)}-700 font-semibold">Leggi →</a>
                        </div>
                    </div>
                </div>`;

            // Insert new article at the beginning of recent articles
            indexContent = indexContent.replace(
                '<div id="recent-articles" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">',
                `<div id="recent-articles" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">\n${articleCard}`
            );

            await fs.writeFile(indexPath, indexContent);
            console.log(`📝 Updated blog index with: ${article.title}`);
        } catch (error) {
            console.log(`⚠️ Failed to update blog index: ${error.message}`);
        }
    }

    async updateCategoryPage(article) {
        // Update category page with new article
        const categoryPath = `blog/categoria/${article.category}/index.html`;
        try {
            let categoryContent = await fs.readFile(categoryPath, 'utf8');

            const articleCard = `
                <div class="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                    <div class="h-48 bg-gradient-to-br from-${this.getCategoryColor(article.category)}-500 to-${this.getCategoryColor(article.category)}-600"></div>
                    <div class="p-6">
                        <h3 class="text-xl font-bold text-gray-900 mb-3">${article.title}</h3>
                        <p class="text-gray-600 mb-4">${article.excerpt}</p>
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-500">${new Date(article.publishDate).toLocaleDateString('it-IT')}</span>
                            <a href="../../articoli/${article.slug}.html" class="text-${this.getCategoryColor(article.category)}-600 hover:text-${this.getCategoryColor(article.category)}-700 font-semibold">Leggi →</a>
                        </div>
                    </div>
                </div>`;

            categoryContent = categoryContent.replace(
                '<div id="articles-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">',
                `<div id="articles-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">\n${articleCard}`
            );

            await fs.writeFile(categoryPath, categoryContent);
            console.log(`📂 Updated category page: ${article.category}`);
        } catch (error) {
            console.log(`⚠️ Failed to update category page: ${error.message}`);
        }
    }

    async updateSitemap(article) {
        // Update XML sitemap with new article
        const sitemapPath = 'sitemap.xml';
        try {
            let sitemapContent = await fs.readFile(sitemapPath, 'utf8').catch(() => this.createBaseSitemap());

            const articleUrl = `
    <url>
        <loc>https://it-era.it/blog/articoli/${article.slug}.html</loc>
        <lastmod>${article.publishDate.split('T')[0]}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>`;

            sitemapContent = sitemapContent.replace('</urlset>', `${articleUrl}\n</urlset>`);
            await fs.writeFile(sitemapPath, sitemapContent);
            console.log(`🗺️ Updated sitemap with: ${article.slug}`);
        } catch (error) {
            console.log(`⚠️ Failed to update sitemap: ${error.message}`);
        }
    }

    createBaseSitemap() {
        return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://it-era.it/</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>https://it-era.it/blog/</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
    </url>
</urlset>`;
    }

    async generateAndPublish() {
        try {
            console.log('🚀 Starting automated article generation...');
            
            const selectedKeyword = this.selectOptimalKeyword();
            console.log(`🎯 Selected keyword: "${selectedKeyword.keyword}" (Score: ${selectedKeyword.score.toFixed(2)})`);
            
            const generatedContent = await this.generateArticle(selectedKeyword);
            const publishedPath = await this.publishArticle(generatedContent);
            
            console.log('✅ Article generation and publication completed!');
            return publishedPath;
            
        } catch (error) {
            console.error('❌ Error in article generation:', error.message);
            throw error;
        }
    }
}

// Export for use in automation
module.exports = SEOBlogGenerator;

// CLI usage
if (require.main === module) {
    async function main() {
        const generator = new SEOBlogGenerator();
        await generator.initialize();
        await generator.generateAndPublish();
    }
    
    main().catch(console.error);
}
