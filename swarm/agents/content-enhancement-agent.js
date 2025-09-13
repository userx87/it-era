/**
 * AGENT 3: CONTENT ENHANCEMENT AGENT
 * Rewrites and expands content, removes pricing, improves CTAs
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

class ContentEnhancementAgent {
    constructor() {
        this.name = 'Content Enhancement Agent';
        this.enhancements = {
            CONTENT_EXPANSION: 'content_expansion',
            PRICING_REMOVAL: 'pricing_removal',
            CTA_IMPROVEMENT: 'cta_improvement',
            SERVICE_DETAILS: 'service_details',
            BENEFITS_ADDITION: 'benefits_addition'
        };
        
        this.contentTemplates = {
            businessITSupport: {
                benefits: [
                    'Supporto tecnico professionale 24/7',
                    'Riduzione dei tempi di inattività',
                    'Sicurezza informatica avanzata',
                    'Backup automatici e recupero dati',
                    'Consulenza strategica IT personalizzata'
                ],
                services: [
                    'Assistenza tecnica remota e on-site',
                    'Gestione infrastruttura IT aziendale',
                    'Implementazione soluzioni cloud',
                    'Sicurezza informatica e protezione dati',
                    'Formazione del personale'
                ]
            },
            hardwareRepair: {
                benefits: [
                    'Diagnosi accurata e tempestiva',
                    'Riparazioni certificate e garantite',
                    'Componenti originali di qualità',
                    'Servizio rapido e professionale',
                    'Preventivi trasparenti senza sorprese'
                ],
                services: [
                    'Riparazione computer desktop e laptop',
                    'Sostituzione componenti hardware',
                    'Upgrade e potenziamento sistemi',
                    'Recupero dati da dispositivi danneggiati',
                    'Manutenzione preventiva'
                ]
            },
            computerAssembly: {
                benefits: [
                    'Configurazioni personalizzate su misura',
                    'Componenti selezionati per performance ottimali',
                    'Garanzia completa su assemblaggio',
                    'Test approfonditi pre-consegna',
                    'Supporto post-vendita dedicato'
                ],
                services: [
                    'Assemblaggio PC gaming e workstation',
                    'Configurazioni per ufficio e business',
                    'Server personalizzati per aziende',
                    'Upgrade e potenziamento sistemi esistenti',
                    'Consulenza tecnica specializzata'
                ]
            }
        };
        
        this.genericPricingText = {
            'contact_for_quote': 'Contatta per preventivo personalizzato',
            'custom_pricing': 'Prezzi personalizzati in base alle esigenze',
            'free_consultation': 'Consulenza gratuita e preventivo su misura',
            'competitive_rates': 'Tariffe competitive e trasparenti'
        };
    }
    
    async enhance(pages, contentReviewResults) {
        console.log(`✍️ ${this.name}: Enhancing content for ${pages.length} pages...`);
        
        const results = {
            agent: this.name,
            timestamp: new Date().toISOString(),
            pagesEnhanced: pages.length,
            enhancements: {},
            contentUpdates: {},
            summary: {}
        };
        
        for (const page of pages) {
            try {
                const pageEnhancements = await this.enhancePage(page, contentReviewResults);
                results.enhancements[page.filename] = pageEnhancements;
                
            } catch (error) {
                console.error(`❌ Error enhancing content for ${page.filename}:`, error.message);
                results.enhancements[page.filename] = {
                    error: error.message,
                    enhancements: []
                };
            }
        }
        
        results.summary = this.generateSummary(results.enhancements);
        console.log(`✅ ${this.name}: Content enhancement complete. Applied ${results.summary.totalEnhancements} improvements.`);
        
        return results;
    }
    
    async enhancePage(page, contentReviewResults) {
        const content = fs.readFileSync(page.path, 'utf8');
        const $ = cheerio.load(content);
        
        const enhancements = {
            filename: page.filename,
            category: page.category,
            improvements: [],
            contentUpdates: [],
            newSections: []
        };
        
        // Get content review issues for this page
        const pageIssues = contentReviewResults.issues[page.filename] || [];
        
        // Expand thin content
        this.expandContent($, enhancements, page.category);
        
        // Remove/replace pricing information
        this.removePricingContent($, enhancements, pageIssues);
        
        // Improve call-to-action sections
        this.improveCTAs($, enhancements);
        
        // Add service details
        this.addServiceDetails($, enhancements, page.category);
        
        // Add benefits section
        this.addBenefitsSection($, enhancements, page.category);
        
        return enhancements;
    }
    
    expandContent($, enhancements, category) {
        const mainContent = $('main');
        const currentWordCount = this.getWordCount(mainContent.text());
        
        if (currentWordCount < 500) {
            const expandedContent = this.generateExpandedContent(category);
            
            enhancements.improvements.push({
                type: this.enhancements.CONTENT_EXPANSION,
                element: 'main_content',
                enhancement: `Expanded content from ${currentWordCount} to ~800 words`,
                newContent: expandedContent
            });
            
            enhancements.contentUpdates.push({
                selector: 'main',
                action: 'append',
                content: expandedContent
            });
        }
    }
    
    removePricingContent($, enhancements, pageIssues) {
        const pricingIssues = pageIssues.filter(issue => issue.type === 'pricing_issues');
        
        pricingIssues.forEach(issue => {
            // Replace specific prices with generic text
            const genericText = this.genericPricingText.contact_for_quote;
            
            enhancements.improvements.push({
                type: this.enhancements.PRICING_REMOVAL,
                element: 'pricing',
                enhancement: `Replaced "${issue.message}" with generic pricing text`,
                replacement: genericText
            });
            
            enhancements.contentUpdates.push({
                selector: 'body',
                action: 'replace_text',
                find: issue.message.match(/"([^"]+)"/)?.[1] || '',
                replace: genericText
            });
        });
    }
    
    improveCTAs($, enhancements) {
        const existingCTAs = $('button, .btn, a[class*="btn"]');
        
        const improvedCTAs = [
            {
                text: '📞 Richiedi Consulenza Gratuita',
                class: 'btn-primary btn-lg it-era-cta-enhanced',
                action: 'tel:+390398882041'
            },
            {
                text: '✉️ Preventivo Personalizzato',
                class: 'btn-secondary btn-lg it-era-cta-enhanced',
                action: '#contact-form'
            }
        ];
        
        enhancements.improvements.push({
            type: this.enhancements.CTA_IMPROVEMENT,
            element: 'cta_buttons',
            enhancement: 'Enhanced call-to-action buttons with better copy and styling',
            newCTAs: improvedCTAs
        });
        
        enhancements.contentUpdates.push({
            selector: '.cta-section, .contact-section',
            action: 'enhance_ctas',
            ctas: improvedCTAs
        });
    }
    
    addServiceDetails($, enhancements, category) {
        const template = this.contentTemplates[this.mapCategoryToTemplate(category)];
        
        if (template) {
            const serviceDetailsHTML = this.generateServiceDetailsHTML(template.services);
            
            enhancements.improvements.push({
                type: this.enhancements.SERVICE_DETAILS,
                element: 'service_details',
                enhancement: 'Added comprehensive service details section',
                newSection: serviceDetailsHTML
            });
            
            enhancements.newSections.push({
                title: 'I Nostri Servizi',
                content: serviceDetailsHTML,
                position: 'after_hero'
            });
        }
    }
    
    addBenefitsSection($, enhancements, category) {
        const template = this.contentTemplates[this.mapCategoryToTemplate(category)];
        
        if (template) {
            const benefitsHTML = this.generateBenefitsHTML(template.benefits);
            
            enhancements.improvements.push({
                type: this.enhancements.BENEFITS_ADDITION,
                element: 'benefits',
                enhancement: 'Added benefits section highlighting key advantages',
                newSection: benefitsHTML
            });
            
            enhancements.newSections.push({
                title: 'Perché Scegliere IT-ERA',
                content: benefitsHTML,
                position: 'before_contact'
            });
        }
    }
    
    generateExpandedContent(category) {
        const templates = {
            'business-it-support': `
                <section class="content-expansion">
                    <h2>Supporto IT Professionale per la Tua Azienda</h2>
                    <p>Nel mondo digitale di oggi, un'infrastruttura IT affidabile è fondamentale per il successo aziendale. 
                    IT-ERA offre soluzioni complete di supporto informatico progettate per mantenere la tua azienda operativa 
                    e competitiva.</p>
                    
                    <h3>La Nostra Esperienza al Tuo Servizio</h3>
                    <p>Con anni di esperienza nel settore IT, il nostro team di esperti comprende le sfide uniche che 
                    le aziende moderne affrontano. Offriamo supporto proattivo che previene i problemi prima che possano 
                    impattare la tua produttività.</p>
                </section>
            `,
            'hardware-repair': `
                <section class="content-expansion">
                    <h2>Riparazione Hardware Professionale</h2>
                    <p>Quando i tuoi dispositivi si guastano, ogni minuto conta. IT-ERA offre servizi di riparazione 
                    hardware rapidi e affidabili per minimizzare i tempi di inattività e ripristinare la tua produttività.</p>
                    
                    <h3>Diagnosi Accurata e Riparazione Certificata</h3>
                    <p>Utilizziamo strumenti diagnostici avanzati per identificare rapidamente la causa del problema. 
                    Le nostre riparazioni sono eseguite con componenti originali e coperte da garanzia completa.</p>
                </section>
            `
        };
        
        return templates[category] || templates['business-it-support'];
    }
    
    generateServiceDetailsHTML(services) {
        return `
            <div class="service-details-grid">
                ${services.map(service => `
                    <div class="service-item">
                        <div class="service-icon">🔧</div>
                        <h4>${service}</h4>
                        <p>Servizio professionale con garanzia di qualità e supporto dedicato.</p>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    generateBenefitsHTML(benefits) {
        return `
            <div class="benefits-grid">
                ${benefits.map(benefit => `
                    <div class="benefit-item">
                        <div class="benefit-icon">✅</div>
                        <span>${benefit}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    mapCategoryToTemplate(category) {
        const mapping = {
            'business-it-support': 'businessITSupport',
            'hardware-repair': 'hardwareRepair',
            'computer-assembly': 'computerAssembly',
            'specialized-services': 'businessITSupport',
            'home-it-support': 'hardwareRepair'
        };
        
        return mapping[category] || 'businessITSupport';
    }
    
    getWordCount(text) {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }
    
    generateSummary(allEnhancements) {
        const summary = {
            totalEnhancements: 0,
            enhancementsByType: {},
            pagesEnhanced: 0,
            contentAdded: 0
        };
        
        Object.values(allEnhancements).forEach(pageEnhancements => {
            if (pageEnhancements.improvements && pageEnhancements.improvements.length > 0) {
                summary.pagesEnhanced++;
                summary.totalEnhancements += pageEnhancements.improvements.length;
                
                pageEnhancements.improvements.forEach(improvement => {
                    summary.enhancementsByType[improvement.type] = 
                        (summary.enhancementsByType[improvement.type] || 0) + 1;
                });
                
                summary.contentAdded += pageEnhancements.newSections?.length || 0;
            }
        });
        
        return summary;
    }
}

module.exports = new ContentEnhancementAgent();
