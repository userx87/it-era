/**
 * AGENT 4: TECHNICAL IMPLEMENTATION AGENT
 * Applies CSS changes, updates navigation, implements responsive design
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

class TechnicalImplementationAgent {
    constructor() {
        this.name = 'Technical Implementation Agent';
        this.implementations = {
            CSS_UPDATES: 'css_updates',
            HTML_MODIFICATIONS: 'html_modifications',
            NAVIGATION_UPDATES: 'navigation_updates',
            RESPONSIVE_FIXES: 'responsive_fixes',
            JAVASCRIPT_INTEGRATION: 'javascript_integration'
        };
    }
    
    async implement(pages, allAgentResults) {
        console.log(`⚙️ ${this.name}: Implementing changes for ${pages.length} pages...`);
        
        const results = {
            agent: this.name,
            timestamp: new Date().toISOString(),
            pagesImplemented: pages.length,
            implementations: {},
            filesModified: [],
            summary: {}
        };
        
        // First, create enhanced CSS file
        await this.createEnhancedCSS(allAgentResults.design);
        
        for (const page of pages) {
            try {
                const pageImplementations = await this.implementPage(page, allAgentResults);
                results.implementations[page.filename] = pageImplementations;
                
                if (pageImplementations.modified) {
                    results.filesModified.push(page.filename);
                }
                
            } catch (error) {
                console.error(`❌ Error implementing ${page.filename}:`, error.message);
                results.implementations[page.filename] = {
                    error: error.message,
                    modified: false
                };
            }
        }
        
        results.summary = this.generateSummary(results.implementations);
        console.log(`✅ ${this.name}: Implementation complete. Modified ${results.filesModified.length} pages.`);
        
        return results;
    }
    
    async implementPage(page, allAgentResults) {
        const content = fs.readFileSync(page.path, 'utf8');
        const $ = cheerio.load(content);
        
        const implementations = {
            filename: page.filename,
            category: page.category,
            changes: [],
            modified: false
        };
        
        // Get results from other agents
        const contentReview = allAgentResults.contentReview.issues[page.filename] || [];
        const designEnhancements = allAgentResults.design.enhancements[page.filename] || {};
        const contentEnhancements = allAgentResults.content.enhancements[page.filename] || {};
        
        // Apply CSS enhancements
        this.applyCSSEnhancements($, implementations, designEnhancements);
        
        // Apply HTML modifications
        this.applyHTMLModifications($, implementations, contentEnhancements);
        
        // Update navigation
        this.updateNavigation($, implementations);
        
        // Apply responsive fixes
        this.applyResponsiveFixes($, implementations);
        
        // Ensure JavaScript integration
        this.ensureJavaScriptIntegration($, implementations);
        
        // Save modified page if changes were made
        if (implementations.changes.length > 0) {
            const modifiedContent = $.html();
            fs.writeFileSync(page.path, modifiedContent, 'utf8');
            implementations.modified = true;
        }
        
        return implementations;
    }
    
    applyCSSEnhancements($, implementations, designEnhancements) {
        if (!designEnhancements.cssClasses) return;
        
        // Add enhanced CSS classes to appropriate elements
        designEnhancements.cssClasses.forEach(cssClass => {
            switch (cssClass) {
                case 'it-era-h1-enhanced':
                    $('h1').first().addClass(cssClass);
                    break;
                case 'it-era-section-enhanced':
                    $('section').addClass(cssClass);
                    break;
                case 'it-era-btn-enhanced':
                    $('button, .btn, a[class*="btn"]').addClass(cssClass);
                    break;
                case 'it-era-container-responsive':
                    $('.container, .max-w-7xl, .mx-auto').addClass(cssClass);
                    break;
                case 'it-era-grid-responsive':
                    $('[class*="grid"], [class*="flex"]').addClass(cssClass);
                    break;
                case 'it-era-nav-enhanced':
                    $('nav, .navbar, [role="navigation"]').addClass(cssClass);
                    break;
                case 'it-era-form-enhanced':
                    $('form').addClass(cssClass);
                    break;
            }
        });
        
        // Add typography class to body
        $('body').addClass('it-era-typography it-era-brand-colors');
        
        implementations.changes.push({
            type: this.implementations.CSS_UPDATES,
            description: `Applied ${designEnhancements.cssClasses.length} CSS enhancement classes`,
            classes: designEnhancements.cssClasses
        });
    }
    
    applyHTMLModifications($, implementations, contentEnhancements) {
        if (!contentEnhancements.newSections) return;
        
        contentEnhancements.newSections.forEach(section => {
            const sectionHTML = `
                <section class="it-era-section-enhanced">
                    <div class="it-era-container-responsive">
                        <h2>${section.title}</h2>
                        ${section.content}
                    </div>
                </section>
            `;
            
            // Insert section based on position
            switch (section.position) {
                case 'after_hero':
                    const hero = $('.hero, .jumbotron, section').first();
                    if (hero.length) {
                        hero.after(sectionHTML);
                    } else {
                        $('main').prepend(sectionHTML);
                    }
                    break;
                case 'before_contact':
                    const contactSection = $('#contact, .contact, form').first().closest('section');
                    if (contactSection.length) {
                        contactSection.before(sectionHTML);
                    } else {
                        $('main').append(sectionHTML);
                    }
                    break;
                default:
                    $('main').append(sectionHTML);
            }
        });
        
        implementations.changes.push({
            type: this.implementations.HTML_MODIFICATIONS,
            description: `Added ${contentEnhancements.newSections.length} new content sections`,
            sections: contentEnhancements.newSections.map(s => s.title)
        });
    }
    
    updateNavigation($, implementations) {
        const nav = $('nav, .navbar, [role="navigation"]').first();
        
        if (nav.length) {
            // Ensure navigation has proper structure
            if (!nav.hasClass('it-era-nav-enhanced')) {
                nav.addClass('it-era-nav-enhanced');
                
                // Add mobile menu toggle if not present
                if (!nav.find('.navbar-toggler, .mobile-menu-toggle').length) {
                    const mobileToggle = `
                        <button class="mobile-menu-toggle d-md-none" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                            <span class="navbar-toggler-icon"></span>
                        </button>
                    `;
                    nav.prepend(mobileToggle);
                }
                
                implementations.changes.push({
                    type: this.implementations.NAVIGATION_UPDATES,
                    description: 'Enhanced navigation with mobile responsiveness',
                    modifications: ['Added mobile toggle', 'Applied enhanced styling']
                });
            }
        }
    }
    
    applyResponsiveFixes($, implementations) {
        // Ensure viewport meta tag
        if (!$('meta[name="viewport"]').length) {
            $('head').append('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
            
            implementations.changes.push({
                type: this.implementations.RESPONSIVE_FIXES,
                description: 'Added viewport meta tag for mobile responsiveness'
            });
        }
        
        // Add responsive classes to images
        $('img').each((i, img) => {
            const $img = $(img);
            if (!$img.hasClass('img-responsive') && !$img.hasClass('img-fluid')) {
                $img.addClass('img-fluid');
            }
        });
        
        // Ensure tables are responsive
        $('table').each((i, table) => {
            const $table = $(table);
            if (!$table.parent().hasClass('table-responsive')) {
                $table.wrap('<div class="table-responsive"></div>');
            }
        });
        
        implementations.changes.push({
            type: this.implementations.RESPONSIVE_FIXES,
            description: 'Applied responsive fixes to images and tables'
        });
    }
    
    ensureJavaScriptIntegration($, implementations) {
        const requiredScripts = [
            '/js/resend-config.js',
            '/js/resend-integration.js',
            '/js/components-loader.js'
        ];
        
        const existingScripts = [];
        $('script[src]').each((i, script) => {
            existingScripts.push($(script).attr('src'));
        });
        
        const missingScripts = requiredScripts.filter(script => 
            !existingScripts.includes(script)
        );
        
        if (missingScripts.length > 0) {
            const scriptsHTML = missingScripts.map(script => 
                `<script src="${script}"></script>`
            ).join('\n    ');
            
            // Add before closing body tag
            $('body').append(`\n    ${scriptsHTML}`);
            
            implementations.changes.push({
                type: this.implementations.JAVASCRIPT_INTEGRATION,
                description: `Added ${missingScripts.length} missing JavaScript files`,
                scripts: missingScripts
            });
        }
        
        // Ensure forms have proper data attributes
        $('form').each((i, form) => {
            const $form = $(form);
            if (!$form.attr('data-resend')) {
                $form.attr('data-resend', 'true');
            }
        });
    }
    
    async createEnhancedCSS(designResults) {
        if (!designResults.cssUpdates || !designResults.cssUpdates.enhancedCSS) return;
        
        const cssPath = path.join('./css', 'it-era-enhanced.css');
        const enhancedCSS = designResults.cssUpdates.enhancedCSS;
        
        // Ensure css directory exists
        const cssDir = path.dirname(cssPath);
        if (!fs.existsSync(cssDir)) {
            fs.mkdirSync(cssDir, { recursive: true });
        }
        
        fs.writeFileSync(cssPath, enhancedCSS, 'utf8');
        console.log(`✅ Created enhanced CSS file: ${cssPath}`);
    }
    
    generateSummary(allImplementations) {
        const summary = {
            totalImplementations: 0,
            implementationsByType: {},
            pagesModified: 0,
            filesCreated: ['css/it-era-enhanced.css']
        };
        
        Object.values(allImplementations).forEach(pageImplementations => {
            if (pageImplementations.changes && pageImplementations.changes.length > 0) {
                if (pageImplementations.modified) {
                    summary.pagesModified++;
                }
                summary.totalImplementations += pageImplementations.changes.length;
                
                pageImplementations.changes.forEach(change => {
                    summary.implementationsByType[change.type] = 
                        (summary.implementationsByType[change.type] || 0) + 1;
                });
            }
        });
        
        return summary;
    }
}

module.exports = new TechnicalImplementationAgent();
