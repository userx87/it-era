/**
 * IT-ERA PRICING MANAGER
 * Sistema centralizzato per la gestione dei prezzi dei servizi IT-ERA
 * Assicura coerenza e competitività dei prezzi su tutte le pagine
 */

class ITERAPricingManager {
    constructor() {
        this.config = {
            currency: '€',
            vatIncluded: false,
            vatRate: 0.22,
            updateFrequency: 'monthly',
            competitorAnalysis: true
        };
        
        // Listino prezzi ufficiale IT-ERA
        this.officialPricing = {
            // ASSISTENZA AZIENDALE
            business: {
                consultation: {
                    name: 'Consulenza IT Aziendale',
                    price: 80,
                    unit: 'ora',
                    description: 'Consulenza tecnica specializzata',
                    includes: ['Analisi infrastruttura', 'Raccomandazioni', 'Report dettagliato']
                },
                helpdesk: {
                    name: 'Help Desk Aziendale',
                    price: 150,
                    unit: 'mese/postazione',
                    description: 'Supporto tecnico continuativo',
                    includes: ['Supporto telefonico', 'Assistenza remota', 'Ticket system']
                },
                maintenance: {
                    name: 'Manutenzione Preventiva',
                    price: 200,
                    unit: 'mese',
                    description: 'Manutenzione programmata sistemi',
                    includes: ['Check mensili', 'Aggiornamenti', 'Backup verifiche']
                },
                emergency: {
                    name: 'Intervento Emergenza Aziendale',
                    price: 120,
                    unit: 'ora',
                    description: 'Supporto urgente 24/7',
                    includes: ['Risposta immediata', 'Risoluzione prioritaria', 'Report intervento']
                }
            },
            
            // ASSISTENZA PRIVATI
            home: {
                diagnosis: {
                    name: 'Diagnosi Gratuita',
                    price: 0,
                    unit: 'intervento',
                    description: 'Analisi problema senza impegno',
                    includes: ['Diagnosi completa', 'Preventivo dettagliato', 'Consigli gratuiti']
                },
                standard_repair: {
                    name: 'Riparazione Standard',
                    price: 49,
                    unit: 'intervento',
                    description: 'Riparazione software/hardware base',
                    includes: ['Intervento domicilio', 'Garanzia 6 mesi', 'Supporto post-intervento'],
                    excludes: 'ricambi'
                },
                emergency_home: {
                    name: 'Emergenza Privati',
                    price: 79,
                    unit: 'intervento',
                    description: 'Intervento stesso giorno',
                    includes: ['Intervento entro 4 ore', 'Weekend disponibile', 'Priorità massima']
                },
                virus_removal: {
                    name: 'Rimozione Virus',
                    price: 39,
                    unit: 'intervento',
                    description: 'Pulizia completa malware',
                    includes: ['Scansione approfondita', 'Installazione antivirus', 'Configurazione sicurezza']
                },
                data_recovery: {
                    name: 'Recupero Dati',
                    price: 89,
                    unit: 'intervento',
                    description: 'Recupero file da supporti danneggiati',
                    includes: ['Analisi gratuita', 'Recupero professionale', 'Paghi solo se recuperiamo']
                }
            },
            
            // RIPARAZIONE HARDWARE
            hardware: {
                laptop_screen: {
                    name: 'Sostituzione Schermo Laptop',
                    price: 120,
                    unit: 'riparazione',
                    description: 'Sostituzione display notebook',
                    includes: ['Manodopera', 'Garanzia 12 mesi'],
                    excludes: 'schermo'
                },
                hdd_replacement: {
                    name: 'Sostituzione Hard Disk',
                    price: 60,
                    unit: 'riparazione',
                    description: 'Installazione nuovo HDD/SSD',
                    includes: ['Installazione', 'Trasferimento dati', 'Configurazione'],
                    excludes: 'hard disk'
                },
                ram_upgrade: {
                    name: 'Upgrade RAM',
                    price: 40,
                    unit: 'upgrade',
                    description: 'Potenziamento memoria RAM',
                    includes: ['Installazione', 'Test compatibilità', 'Ottimizzazione'],
                    excludes: 'moduli RAM'
                },
                motherboard_repair: {
                    name: 'Riparazione Scheda Madre',
                    price: 150,
                    unit: 'riparazione',
                    description: 'Riparazione componenti motherboard',
                    includes: ['Diagnosi avanzata', 'Riparazione componenti', 'Test funzionalità']
                }
            },
            
            // ASSEMBLAGGIO COMPUTER
            assembly: {
                basic_pc: {
                    name: 'PC Base Ufficio',
                    price: 450,
                    unit: 'computer',
                    description: 'Computer per uso ufficio',
                    includes: ['Assemblaggio', 'Installazione OS', 'Software base', 'Garanzia 24 mesi']
                },
                gaming_pc: {
                    name: 'PC Gaming',
                    price: 1200,
                    unit: 'computer',
                    description: 'Computer per gaming',
                    includes: ['Assemblaggio professionale', 'Overclock', 'Stress test', 'Garanzia 24 mesi']
                },
                workstation: {
                    name: 'Workstation Professionale',
                    price: 2000,
                    unit: 'computer',
                    description: 'Workstation per professionisti',
                    includes: ['Componenti professionali', 'Certificazioni', 'Supporto prioritario']
                },
                assembly_service: {
                    name: 'Solo Assemblaggio',
                    price: 80,
                    unit: 'servizio',
                    description: 'Assemblaggio componenti forniti dal cliente',
                    includes: ['Assemblaggio professionale', 'Test funzionalità', 'Garanzia assemblaggio']
                }
            },
            
            // SERVIZI SPECIALIZZATI
            specialized: {
                network_setup: {
                    name: 'Configurazione Rete Aziendale',
                    price: 300,
                    unit: 'progetto',
                    description: 'Setup rete aziendale completa',
                    includes: ['Progettazione', 'Configurazione', 'Documentazione', 'Formazione']
                },
                security_audit: {
                    name: 'Audit Sicurezza Informatica',
                    price: 500,
                    unit: 'audit',
                    description: 'Analisi completa sicurezza IT',
                    includes: ['Penetration test', 'Report dettagliato', 'Piano miglioramenti']
                },
                backup_setup: {
                    name: 'Setup Backup Automatico',
                    price: 200,
                    unit: 'setup',
                    description: 'Configurazione sistema backup',
                    includes: ['Configurazione', 'Test ripristino', 'Monitoraggio', 'Formazione']
                },
                migration_service: {
                    name: 'Migrazione Dati/Sistemi',
                    price: 400,
                    unit: 'migrazione',
                    description: 'Migrazione completa sistemi',
                    includes: ['Pianificazione', 'Migrazione dati', 'Test funzionalità', 'Supporto post-migrazione']
                }
            }
        };
        
        // Pacchetti e offerte speciali
        this.packages = {
            business_starter: {
                name: 'Pacchetto Business Starter',
                price: 299,
                unit: 'mese',
                description: 'Pacchetto completo per piccole aziende',
                includes: ['Help desk', 'Manutenzione', 'Backup', 'Antivirus'],
                discount: 20,
                popular: true
            },
            home_care: {
                name: 'Pacchetto Home Care',
                price: 99,
                unit: 'anno',
                description: 'Assistenza annuale per privati',
                includes: ['2 interventi inclusi', 'Supporto telefonico', 'Antivirus premium'],
                discount: 30
            }
        };
        
        this.init();
    }

    init() {
        console.log('💰 IT-ERA Pricing Manager initialized');
        this.loadRegionalPricing();
        this.setupPriceUpdaters();
    }

    /**
     * Ottieni prezzo per servizio specifico
     */
    getPrice(category, service, options = {}) {
        const serviceData = this.officialPricing[category]?.[service];
        if (!serviceData) {
            console.warn(`⚠️ Service not found: ${category}.${service}`);
            return null;
        }
        
        let price = serviceData.price;
        
        // Applica modificatori regionali
        if (options.location) {
            price = this.applyRegionalModifier(price, options.location);
        }
        
        // Applica sconti
        if (options.discount) {
            price = price * (1 - options.discount / 100);
        }
        
        // Applica IVA se richiesta
        if (options.includeVat && !this.config.vatIncluded) {
            price = price * (1 + this.config.vatRate);
        }
        
        return {
            ...serviceData,
            finalPrice: Math.round(price),
            originalPrice: serviceData.price,
            currency: this.config.currency,
            vatIncluded: this.config.vatIncluded || options.includeVat
        };
    }

    /**
     * Ottieni prezzi per categoria
     */
    getCategoryPricing(category, options = {}) {
        const categoryData = this.officialPricing[category];
        if (!categoryData) {
            console.warn(`⚠️ Category not found: ${category}`);
            return {};
        }
        
        const pricing = {};
        for (const [serviceKey, serviceData] of Object.entries(categoryData)) {
            pricing[serviceKey] = this.getPrice(category, serviceKey, options);
        }
        
        return pricing;
    }

    /**
     * Genera HTML per tabella prezzi
     */
    generatePricingTable(category, options = {}) {
        const pricing = this.getCategoryPricing(category, options);
        
        let html = `
            <div class="pricing-table">
                <h3 class="text-2xl font-bold mb-6">Listino Prezzi ${this.getCategoryName(category)}</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        `;
        
        for (const [serviceKey, service] of Object.entries(pricing)) {
            if (!service) continue;
            
            const isPopular = this.packages[serviceKey]?.popular;
            
            html += `
                <div class="pricing-card bg-white border-2 ${isPopular ? 'border-blue-500' : 'border-gray-200'} rounded-2xl p-6 relative">
                    ${isPopular ? '<div class="absolute -top-4 left-1/2 transform -translate-x-1/2"><span class="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">Più Richiesto</span></div>' : ''}
                    
                    <div class="text-center mb-6">
                        <h4 class="text-xl font-bold text-gray-900 mb-2">${service.name}</h4>
                        <div class="text-3xl font-bold text-blue-600 mb-2">
                            ${service.currency}${service.finalPrice}
                        </div>
                        <div class="text-gray-600">${service.unit}</div>
                        ${service.originalPrice !== service.finalPrice ? `<div class="text-sm text-gray-500 line-through">${service.currency}${service.originalPrice}</div>` : ''}
                    </div>
                    
                    <p class="text-gray-600 mb-4">${service.description}</p>
                    
                    <ul class="space-y-2 mb-6">
                        ${service.includes.map(item => `
                            <li class="flex items-center text-sm">
                                <svg class="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                </svg>
                                ${item}
                            </li>
                        `).join('')}
                        ${service.excludes ? `
                            <li class="flex items-center text-sm text-gray-500">
                                <svg class="w-4 h-4 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                                </svg>
                                Escluso: ${service.excludes}
                            </li>
                        ` : ''}
                    </ul>
                    
                    <button class="w-full btn-primary ${isPopular ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'} text-white">
                        Richiedi Preventivo
                    </button>
                </div>
            `;
        }
        
        html += `
                </div>
                <div class="mt-8 text-center text-sm text-gray-600">
                    <p>* Prezzi ${this.config.vatIncluded ? 'IVA inclusa' : 'IVA esclusa'}</p>
                    <p>* Preventivi gratuiti e personalizzati disponibili</p>
                </div>
            </div>
        `;
        
        return html;
    }

    /**
     * Applica modificatori regionali ai prezzi
     */
    applyRegionalModifier(price, location) {
        const modifiers = {
            'Milano': 1.1,      // +10% per Milano
            'Bergamo': 1.0,     // Prezzo base
            'Brescia': 1.0,     // Prezzo base
            'Como': 1.05,       // +5%
            'Varese': 1.05,     // +5%
            'Monza': 1.08,      // +8%
            'Pavia': 0.95,      // -5%
            'Cremona': 0.95,    // -5%
            'Mantova': 0.95,    // -5%
            'Lecco': 1.0,       // Prezzo base
            'Sondrio': 0.9,     // -10%
            'Lodi': 0.95        // -5%
        };
        
        const modifier = modifiers[location] || 1.0;
        return Math.round(price * modifier);
    }

    /**
     * Carica prezzi specifici per regione
     */
    loadRegionalPricing() {
        // Implementa logica per caricare prezzi regionali
        console.log('📍 Regional pricing loaded');
    }

    /**
     * Setup aggiornatori automatici prezzi
     */
    setupPriceUpdaters() {
        // Cerca elementi con data-price attribute
        const priceElements = document.querySelectorAll('[data-price]');
        
        priceElements.forEach(element => {
            const [category, service] = element.dataset.price.split('.');
            const location = element.dataset.location;
            
            const priceData = this.getPrice(category, service, { location });
            if (priceData) {
                element.textContent = `${priceData.currency}${priceData.finalPrice}`;
                element.title = priceData.description;
            }
        });
        
        console.log(`💰 Updated ${priceElements.length} price elements`);
    }

    /**
     * Ottieni nome categoria
     */
    getCategoryName(category) {
        const names = {
            'business': 'Assistenza Aziendale',
            'home': 'Assistenza Privati',
            'hardware': 'Riparazione Hardware',
            'assembly': 'Assemblaggio Computer',
            'specialized': 'Servizi Specializzati'
        };
        
        return names[category] || category;
    }

    /**
     * Verifica competitività prezzi
     */
    checkCompetitiveness(category, service) {
        // Implementa logica per confronto con competitor
        // Per ora ritorna sempre competitivo
        return {
            competitive: true,
            position: 'market-average',
            recommendation: 'maintain'
        };
    }

    /**
     * Genera report prezzi
     */
    generatePricingReport() {
        const report = {
            timestamp: new Date().toISOString(),
            categories: Object.keys(this.officialPricing).length,
            services: Object.values(this.officialPricing).reduce((total, cat) => total + Object.keys(cat).length, 0),
            packages: Object.keys(this.packages).length,
            lastUpdate: this.config.updateFrequency,
            vatIncluded: this.config.vatIncluded,
            currency: this.config.currency
        };
        
        console.log('📊 Pricing Report:', report);
        return report;
    }
}

// Auto-inizializzazione
document.addEventListener('DOMContentLoaded', () => {
    window.ITERAPricing = new ITERAPricingManager();
});

// Export per uso in altri moduli
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ITERAPricingManager;
}
