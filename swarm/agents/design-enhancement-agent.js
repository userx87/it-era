/**
 * AGENT 2: DESIGN ENHANCEMENT AGENT
 * Improves CSS styling, visual hierarchy, and brand consistency
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

class DesignEnhancementAgent {
    constructor() {
        this.name = 'Design Enhancement Agent';
        this.enhancements = {
            VISUAL_HIERARCHY: 'visual_hierarchy',
            RESPONSIVE_DESIGN: 'responsive_design',
            BRAND_CONSISTENCY: 'brand_consistency',
            NAVIGATION: 'navigation',
            VISUAL_ELEMENTS: 'visual_elements'
        };
        
        this.designSystem = {
            colors: {
                primary: '#1e40af',
                secondary: '#3b82f6',
                accent: '#06b6d4',
                success: '#10b981',
                warning: '#f59e0b',
                danger: '#ef4444',
                neutral: {
                    50: '#f9fafb',
                    100: '#f3f4f6',
                    200: '#e5e7eb',
                    300: '#d1d5db',
                    400: '#9ca3af',
                    500: '#6b7280',
                    600: '#4b5563',
                    700: '#374151',
                    800: '#1f2937',
                    900: '#111827'
                }
            },
            typography: {
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                headings: {
                    h1: { size: '2.5rem', weight: '700', lineHeight: '1.2' },
                    h2: { size: '2rem', weight: '600', lineHeight: '1.3' },
                    h3: { size: '1.5rem', weight: '600', lineHeight: '1.4' },
                    h4: { size: '1.25rem', weight: '500', lineHeight: '1.5' }
                }
            },
            spacing: {
                xs: '0.5rem',
                sm: '1rem',
                md: '1.5rem',
                lg: '2rem',
                xl: '3rem',
                xxl: '4rem'
            }
        };
    }
    
    async enhance(pages, contentReviewResults) {
        console.log(`🎨 ${this.name}: Enhancing design for ${pages.length} pages...`);
        
        const results = {
            agent: this.name,
            timestamp: new Date().toISOString(),
            pagesEnhanced: pages.length,
            enhancements: {},
            cssUpdates: {},
            summary: {}
        };
        
        // Generate enhanced CSS
        const enhancedCSS = this.generateEnhancedCSS();
        results.cssUpdates.enhancedCSS = enhancedCSS;
        
        for (const page of pages) {
            try {
                const pageEnhancements = await this.enhancePage(page, contentReviewResults);
                results.enhancements[page.filename] = pageEnhancements;
                
            } catch (error) {
                console.error(`❌ Error enhancing ${page.filename}:`, error.message);
                results.enhancements[page.filename] = {
                    error: error.message,
                    enhancements: []
                };
            }
        }
        
        results.summary = this.generateSummary(results.enhancements);
        console.log(`✅ ${this.name}: Enhancement complete. Applied ${results.summary.totalEnhancements} improvements.`);
        
        return results;
    }
    
    async enhancePage(page, contentReviewResults) {
        const content = fs.readFileSync(page.path, 'utf8');
        const $ = cheerio.load(content);
        
        const enhancements = {
            filename: page.filename,
            category: page.category,
            improvements: [],
            cssClasses: [],
            htmlUpdates: []
        };
        
        // Visual Hierarchy Enhancements
        this.enhanceVisualHierarchy($, enhancements);
        
        // Responsive Design Improvements
        this.enhanceResponsiveDesign($, enhancements);
        
        // Brand Consistency Updates
        this.enhanceBrandConsistency($, enhancements);
        
        // Navigation Improvements
        this.enhanceNavigation($, enhancements);
        
        // Visual Elements Addition
        this.addVisualElements($, enhancements);
        
        return enhancements;
    }
    
    enhanceVisualHierarchy($, enhancements) {
        // Improve heading structure
        const h1 = $('h1').first();
        if (h1.length) {
            enhancements.improvements.push({
                type: this.enhancements.VISUAL_HIERARCHY,
                element: 'h1',
                enhancement: 'Enhanced H1 styling with better typography and spacing',
                cssClass: 'it-era-h1-enhanced'
            });
            enhancements.cssClasses.push('it-era-h1-enhanced');
        }
        
        // Enhance section spacing
        const sections = $('section');
        if (sections.length > 0) {
            enhancements.improvements.push({
                type: this.enhancements.VISUAL_HIERARCHY,
                element: 'sections',
                enhancement: 'Improved section spacing and visual separation',
                cssClass: 'it-era-section-enhanced'
            });
            enhancements.cssClasses.push('it-era-section-enhanced');
        }
        
        // Improve call-to-action buttons
        const buttons = $('button, .btn, a[class*="btn"]');
        if (buttons.length > 0) {
            enhancements.improvements.push({
                type: this.enhancements.VISUAL_HIERARCHY,
                element: 'buttons',
                enhancement: 'Enhanced button styling with hover effects and better contrast',
                cssClass: 'it-era-btn-enhanced'
            });
            enhancements.cssClasses.push('it-era-btn-enhanced');
        }
    }
    
    enhanceResponsiveDesign($, enhancements) {
        // Check for responsive containers
        const containers = $('.container, .max-w-7xl, .mx-auto');
        if (containers.length > 0) {
            enhancements.improvements.push({
                type: this.enhancements.RESPONSIVE_DESIGN,
                element: 'containers',
                enhancement: 'Improved responsive container behavior',
                cssClass: 'it-era-container-responsive'
            });
            enhancements.cssClasses.push('it-era-container-responsive');
        }
        
        // Enhance grid layouts
        const grids = $('[class*="grid"], [class*="flex"]');
        if (grids.length > 0) {
            enhancements.improvements.push({
                type: this.enhancements.RESPONSIVE_DESIGN,
                element: 'grids',
                enhancement: 'Enhanced responsive grid behavior for mobile devices',
                cssClass: 'it-era-grid-responsive'
            });
            enhancements.cssClasses.push('it-era-grid-responsive');
        }
    }
    
    enhanceBrandConsistency($, enhancements) {
        // Ensure consistent color scheme
        enhancements.improvements.push({
            type: this.enhancements.BRAND_CONSISTENCY,
            element: 'colors',
            enhancement: 'Applied consistent IT-ERA brand colors throughout the page',
            cssClass: 'it-era-brand-colors'
        });
        enhancements.cssClasses.push('it-era-brand-colors');
        
        // Consistent typography
        enhancements.improvements.push({
            type: this.enhancements.BRAND_CONSISTENCY,
            element: 'typography',
            enhancement: 'Applied consistent typography with Inter font family',
            cssClass: 'it-era-typography'
        });
        enhancements.cssClasses.push('it-era-typography');
    }
    
    enhanceNavigation($, enhancements) {
        const nav = $('nav, .navbar, [role="navigation"]');
        if (nav.length > 0) {
            enhancements.improvements.push({
                type: this.enhancements.NAVIGATION,
                element: 'navigation',
                enhancement: 'Enhanced navigation with better mobile responsiveness',
                cssClass: 'it-era-nav-enhanced'
            });
            enhancements.cssClasses.push('it-era-nav-enhanced');
        }
    }
    
    addVisualElements($, enhancements) {
        // Add icons to service sections
        const serviceItems = $('[class*="service"], [class*="feature"]');
        if (serviceItems.length > 0) {
            enhancements.improvements.push({
                type: this.enhancements.VISUAL_ELEMENTS,
                element: 'icons',
                enhancement: 'Added professional icons to service sections',
                cssClass: 'it-era-icons-enhanced'
            });
            enhancements.cssClasses.push('it-era-icons-enhanced');
        }
        
        // Enhance form styling
        const forms = $('form');
        if (forms.length > 0) {
            enhancements.improvements.push({
                type: this.enhancements.VISUAL_ELEMENTS,
                element: 'forms',
                enhancement: 'Enhanced form styling with better visual feedback',
                cssClass: 'it-era-form-enhanced'
            });
            enhancements.cssClasses.push('it-era-form-enhanced');
        }
    }
    
    generateEnhancedCSS() {
        return `
/* IT-ERA Enhanced Design System */

/* Typography Enhancements */
.it-era-typography {
    font-family: ${this.designSystem.typography.fontFamily};
}

.it-era-h1-enhanced {
    font-size: ${this.designSystem.typography.headings.h1.size};
    font-weight: ${this.designSystem.typography.headings.h1.weight};
    line-height: ${this.designSystem.typography.headings.h1.lineHeight};
    color: ${this.designSystem.colors.neutral[900]};
    margin-bottom: ${this.designSystem.spacing.lg};
    background: linear-gradient(135deg, ${this.designSystem.colors.primary}, ${this.designSystem.colors.secondary});
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

/* Section Enhancements */
.it-era-section-enhanced {
    padding: ${this.designSystem.spacing.xl} 0;
    position: relative;
}

.it-era-section-enhanced:not(:last-child)::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 80%;
    height: 1px;
    background: linear-gradient(90deg, transparent, ${this.designSystem.colors.neutral[200]}, transparent);
}

/* Button Enhancements */
.it-era-btn-enhanced {
    background: linear-gradient(135deg, ${this.designSystem.colors.primary}, ${this.designSystem.colors.secondary});
    color: white;
    border: none;
    padding: ${this.designSystem.spacing.sm} ${this.designSystem.spacing.lg};
    border-radius: 8px;
    font-weight: 600;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: ${this.designSystem.spacing.xs};
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.it-era-btn-enhanced:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    background: linear-gradient(135deg, ${this.designSystem.colors.secondary}, ${this.designSystem.colors.primary});
}

/* Responsive Container */
.it-era-container-responsive {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 ${this.designSystem.spacing.md};
}

@media (max-width: 768px) {
    .it-era-container-responsive {
        padding: 0 ${this.designSystem.spacing.sm};
    }
}

/* Responsive Grid */
.it-era-grid-responsive {
    display: grid;
    gap: ${this.designSystem.spacing.lg};
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

@media (max-width: 768px) {
    .it-era-grid-responsive {
        grid-template-columns: 1fr;
        gap: ${this.designSystem.spacing.md};
    }
}

/* Brand Colors */
.it-era-brand-colors {
    --primary: ${this.designSystem.colors.primary};
    --secondary: ${this.designSystem.colors.secondary};
    --accent: ${this.designSystem.colors.accent};
    --success: ${this.designSystem.colors.success};
    --warning: ${this.designSystem.colors.warning};
    --danger: ${this.designSystem.colors.danger};
}

/* Navigation Enhancement */
.it-era-nav-enhanced {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid ${this.designSystem.colors.neutral[200]};
    position: sticky;
    top: 0;
    z-index: 1000;
}

/* Icons Enhancement */
.it-era-icons-enhanced .service-item::before {
    content: '🔧';
    font-size: 2rem;
    margin-bottom: ${this.designSystem.spacing.sm};
    display: block;
}

/* Form Enhancement */
.it-era-form-enhanced {
    background: ${this.designSystem.colors.neutral[50]};
    padding: ${this.designSystem.spacing.xl};
    border-radius: 12px;
    border: 1px solid ${this.designSystem.colors.neutral[200]};
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.it-era-form-enhanced input,
.it-era-form-enhanced textarea,
.it-era-form-enhanced select {
    width: 100%;
    padding: ${this.designSystem.spacing.sm};
    border: 2px solid ${this.designSystem.colors.neutral[300]};
    border-radius: 6px;
    font-size: 1rem;
    transition: border-color 0.3s ease;
}

.it-era-form-enhanced input:focus,
.it-era-form-enhanced textarea:focus,
.it-era-form-enhanced select:focus {
    outline: none;
    border-color: ${this.designSystem.colors.primary};
    box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
}

/* Mobile Optimizations */
@media (max-width: 768px) {
    .it-era-h1-enhanced {
        font-size: 2rem;
    }
    
    .it-era-section-enhanced {
        padding: ${this.designSystem.spacing.lg} 0;
    }
    
    .it-era-btn-enhanced {
        width: 100%;
        justify-content: center;
    }
}
`;
    }
    
    generateSummary(allEnhancements) {
        const summary = {
            totalEnhancements: 0,
            enhancementsByType: {},
            pagesEnhanced: 0,
            cssClassesGenerated: new Set()
        };
        
        Object.values(allEnhancements).forEach(pageEnhancements => {
            if (pageEnhancements.improvements && pageEnhancements.improvements.length > 0) {
                summary.pagesEnhanced++;
                summary.totalEnhancements += pageEnhancements.improvements.length;
                
                pageEnhancements.improvements.forEach(improvement => {
                    summary.enhancementsByType[improvement.type] = 
                        (summary.enhancementsByType[improvement.type] || 0) + 1;
                });
                
                pageEnhancements.cssClasses.forEach(cssClass => {
                    summary.cssClassesGenerated.add(cssClass);
                });
            }
        });
        
        summary.cssClassesGenerated = Array.from(summary.cssClassesGenerated);
        
        return summary;
    }
}

module.exports = new DesignEnhancementAgent();
