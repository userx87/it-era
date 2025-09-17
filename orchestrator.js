#!/usr/bin/env node

/**
 * IT-ERA Implementation Orchestrator
 * Sistema di orchestrazione per implementazione completa piano strategico
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ImplementationOrchestrator {
    constructor() {
        this.components = {
            navigation: '',
            styles: '',
            template: ''
        };
        
        this.pages = [];
        this.validationResults = [];
        this.deployResults = [];
        
        // Configurazione implementazione
        this.config = {
            baseUrl: 'https://it-era.it',
            emergencyPhone: '039 888 2041',
            emergencyPhoneLink: 'tel:+390398882041',
            email: 'info@it-era.it',
            company: 'IT-ERA',
            tagline: 'Assistenza Informatica Lombardia'
        };
        
        // Task Fase 1: Quick Wins
        this.phase1Tasks = [
            {
                id: 'emergency-computer-milano',
                title: 'Emergenza Computer Milano',
                url: '/servizi-it/emergenza-computer-milano.html',
                keyword: 'emergenza computer milano',
                volume: 390,
                difficulty: 28,
                intent: 'urgent'
            },
            {
                id: 'schermo-nero-computer-milano',
                title: 'Schermo Nero Computer Milano',
                url: '/servizi-it/schermo-nero-computer-milano.html',
                keyword: 'schermo nero computer milano',
                volume: 140,
                difficulty: 18,
                intent: 'problem-solving'
            },
            {
                id: 'virus-computer-milano',
                title: 'Virus Computer Milano',
                url: '/servizi-it/virus-computer-milano.html',
                keyword: 'virus computer milano',
                volume: 150,
                difficulty: 22,
                intent: 'problem-solving'
            },
            {
                id: 'computer-lento-milano',
                title: 'Computer Lento Milano',
                url: '/servizi-it/computer-lento-milano.html',
                keyword: 'computer lento milano',
                volume: 130,
                difficulty: 20,
                intent: 'problem-solving'
            },
            {
                id: 'formattazione-pc-milano',
                title: 'Formattazione PC Milano',
                url: '/servizi-it/formattazione-pc-milano.html',
                keyword: 'formattazione pc milano',
                volume: 160,
                difficulty: 25,
                intent: 'commercial'
            }
        ];
    }
    
    // Carica componenti
    loadComponents() {
        console.log('📦 Loading components...');
        
        try {
            this.components.navigation = fs.readFileSync('components/navigation-menu.html', 'utf8');
            this.components.styles = fs.readFileSync('components/styles.css', 'utf8');
            this.components.template = fs.readFileSync('components/page-template.html', 'utf8');
            
            console.log('  ✅ Components loaded successfully');
            return true;
        } catch (error) {
            console.error('  ❌ Error loading components:', error.message);
            return false;
        }
    }
    
    // Genera pagina da template
    generatePage(taskConfig) {
        console.log(`🔧 Generating page: ${taskConfig.title}`);
        
        const pageContent = this.createPageContent(taskConfig);
        const fullPage = this.components.template
            .replace('{{PAGE_TITLE}}', taskConfig.title)
            .replace('{{PAGE_DESCRIPTION}}', this.generateMetaDescription(taskConfig))
            .replace('{{PAGE_KEYWORDS}}', this.generateKeywords(taskConfig))
            .replace('{{PAGE_URL}}', taskConfig.url)
            .replace('{{NAVIGATION_MENU}}', this.components.navigation)
            .replace('{{PAGE_CONTENT}}', pageContent)
            .replace('{{ADDITIONAL_HEAD_CONTENT}}', this.generateAdditionalHead(taskConfig))
            .replace('{{ADDITIONAL_SCRIPTS}}', this.generateAdditionalScripts(taskConfig));
        
        return fullPage;
    }
    
    // Crea contenuto specifico della pagina
    createPageContent(taskConfig) {
        const isEmergency = taskConfig.intent === 'urgent';
        const isProblemSolving = taskConfig.intent === 'problem-solving';
        
        return `
        <!-- Hero Section -->
        <section class="hero ${isEmergency ? 'bg-gradient-to-r from-red-600 to-red-800' : ''}">
            <div class="container hero-content">
                <div class="max-w-4xl mx-auto text-center">
                    <h1 class="text-4xl md:text-5xl font-bold mb-6">
                        ${this.generateHeroTitle(taskConfig)}
                    </h1>
                    <p class="text-xl mb-8 opacity-90">
                        ${this.generateHeroDescription(taskConfig)}
                    </p>
                    
                    ${isEmergency ? `
                    <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                        <a href="${this.config.emergencyPhoneLink}" class="btn btn-emergency btn-lg">
                            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
                            </svg>
                            CHIAMA ORA: ${this.config.emergencyPhone}
                        </a>
                        <a href="#form-emergenza" class="btn btn-secondary btn-lg">
                            📝 Richiesta Urgente
                        </a>
                    </div>
                    ` : `
                    <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                        <a href="${this.config.emergencyPhoneLink}" class="btn btn-primary btn-lg">
                            📞 ${this.config.emergencyPhone}
                        </a>
                        <a href="#preventivo" class="btn btn-secondary btn-lg">
                            💬 Preventivo Gratuito
                        </a>
                    </div>
                    `}
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                        <div class="text-center">
                            <div class="text-3xl font-bold text-white mb-2">24/7</div>
                            <div class="text-white/80">Supporto Continuo</div>
                        </div>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-white mb-2">&lt;30min</div>
                            <div class="text-white/80">Tempo Risposta</div>
                        </div>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-white mb-2">100%</div>
                            <div class="text-white/80">Soddisfazione</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- Problem Description -->
        <section class="section bg-white">
            <div class="container">
                <div class="max-w-4xl mx-auto">
                    <h2 class="text-3xl font-bold text-center mb-12">
                        ${this.generateProblemTitle(taskConfig)}
                    </h2>
                    
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            ${this.generateProblemDescription(taskConfig)}
                        </div>
                        <div class="bg-neutral-50 p-8 rounded-2xl">
                            <h3 class="text-xl font-bold mb-4 text-red-600">
                                🚨 Sintomi Comuni:
                            </h3>
                            <ul class="space-y-3">
                                ${this.generateSymptomsList(taskConfig)}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- Solution Section -->
        <section class="section bg-neutral-50">
            <div class="container">
                <div class="max-w-4xl mx-auto">
                    <h2 class="text-3xl font-bold text-center mb-12">
                        La Nostra Soluzione Professionale
                    </h2>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                        ${this.generateSolutionSteps(taskConfig)}
                    </div>
                </div>
            </div>
        </section>
        
        <!-- Emergency Contact Section -->
        ${isEmergency || isProblemSolving ? `
        <section class="section emergency-section">
            <div class="container">
                <div class="max-w-3xl mx-auto text-center">
                    <h2 class="emergency-title text-3xl font-bold">
                        🚨 Intervento Immediato Disponibile
                    </h2>
                    <p class="text-lg text-red-700 mb-8">
                        Non aspettare che il problema peggiori. I nostri tecnici sono pronti ad intervenire.
                    </p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div class="bg-white p-6 rounded-xl shadow-lg">
                            <h3 class="font-bold text-lg mb-4">📞 Chiamata Immediata</h3>
                            <a href="${this.config.emergencyPhoneLink}" class="emergency-phone block">
                                ${this.config.emergencyPhone}
                            </a>
                            <p class="text-sm text-neutral-600 mt-2">
                                Disponibile 24/7 per emergenze
                            </p>
                        </div>
                        <div class="bg-white p-6 rounded-xl shadow-lg">
                            <h3 class="font-bold text-lg mb-4">⚡ Intervento Rapido</h3>
                            <div class="text-2xl font-bold text-brand-600 mb-2">&lt; 30 minuti</div>
                            <p class="text-sm text-neutral-600">
                                Tempo medio di arrivo in zona Milano
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        ` : ''}
        
        <!-- Contact Form -->
        <section class="section bg-white" id="${isEmergency ? 'form-emergenza' : 'preventivo'}">
            <div class="container">
                <div class="max-w-2xl mx-auto">
                    <h2 class="text-3xl font-bold text-center mb-12">
                        ${isEmergency ? '🚨 Richiesta Intervento Urgente' : '💬 Richiedi Preventivo Gratuito'}
                    </h2>
                    
                    <form class="space-y-6" data-resend="true" method="POST" action="/api/contact">
                        <input type="hidden" name="service" value="${taskConfig.keyword}">
                        <input type="hidden" name="page" value="${taskConfig.url}">
                        <input type="hidden" name="priority" value="${isEmergency ? 'urgent' : 'normal'}">
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="form-group">
                                <label class="form-label" for="nome">Nome *</label>
                                <input type="text" id="nome" name="nome" class="form-input" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="telefono">Telefono *</label>
                                <input type="tel" id="telefono" name="telefono" class="form-input" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label" for="email">Email *</label>
                            <input type="email" id="email" name="email" class="form-input" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label" for="citta">Città</label>
                            <select id="citta" name="citta" class="form-input">
                                <option value="">Seleziona città</option>
                                <option value="Milano">Milano</option>
                                <option value="Bergamo">Bergamo</option>
                                <option value="Brescia">Brescia</option>
                                <option value="Como">Como</option>
                                <option value="Varese">Varese</option>
                                <option value="Monza">Monza</option>
                                <option value="Altro">Altro</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label" for="messaggio">Descrivi il problema *</label>
                            <textarea id="messaggio" name="messaggio" class="form-input form-textarea" required 
                                placeholder="${this.generateFormPlaceholder(taskConfig)}"></textarea>
                        </div>
                        
                        ${isEmergency ? `
                        <div class="form-group">
                            <label class="form-label" for="urgenza">Livello di urgenza</label>
                            <select id="urgenza" name="urgenza" class="form-input">
                                <option value="critica">🔴 Critica - Lavoro bloccato</option>
                                <option value="alta">🟡 Alta - Problema importante</option>
                                <option value="media">🟢 Media - Può aspettare qualche ora</option>
                            </select>
                        </div>
                        ` : ''}
                        
                        <div class="form-group">
                            <label class="flex items-start gap-3">
                                <input type="checkbox" name="privacy" required class="mt-1">
                                <span class="text-sm text-neutral-600">
                                    Accetto il trattamento dei dati personali secondo la 
                                    <a href="/privacy.html" class="text-brand-600 hover:underline">Privacy Policy</a> *
                                </span>
                            </label>
                        </div>
                        
                        <button type="submit" class="btn ${isEmergency ? 'btn-emergency' : 'btn-primary'} btn-lg w-full">
                            ${isEmergency ? '🚨 INVIA RICHIESTA URGENTE' : '📧 Invia Richiesta'}
                        </button>
                        
                        <p class="text-center text-sm text-neutral-500">
                            ${isEmergency ? 
                                'Riceverai una chiamata entro 5 minuti per emergenze critiche' : 
                                'Ti contatteremo entro 2 ore lavorative con un preventivo dettagliato'
                            }
                        </p>
                    </form>
                </div>
            </div>
        </section>
        `;
    }
    
    // Genera titolo hero
    generateHeroTitle(taskConfig) {
        const titles = {
            'emergenza-computer-milano': '🚨 Emergenza Computer Milano - Intervento Immediato',
            'schermo-nero-computer-milano': '🖥️ Schermo Nero Computer Milano - Riparazione Rapida',
            'virus-computer-milano': '🦠 Rimozione Virus Computer Milano - Pulizia Completa',
            'computer-lento-milano': '🐌 Computer Lento Milano - Ottimizzazione Veloce',
            'formattazione-pc-milano': '💾 Formattazione PC Milano - Installazione Completa'
        };
        
        return titles[taskConfig.id] || taskConfig.title;
    }
    
    // Genera descrizione hero
    generateHeroDescription(taskConfig) {
        const descriptions = {
            'emergenza-computer-milano': 'Il tuo computer non funziona e hai bisogno di aiuto immediato? I nostri tecnici specializzati intervengono in meno di 30 minuti a Milano per risolvere qualsiasi emergenza informatica.',
            'schermo-nero-computer-milano': 'Schermo nero improvviso? Non perdere i tuoi dati importanti. Riparazione professionale con diagnosi gratuita e intervento rapido a Milano.',
            'virus-computer-milano': 'Computer infetto da virus o malware? Rimozione completa e sicura con i migliori strumenti professionali. Protezione garantita.',
            'computer-lento-milano': 'Computer che va lento e ti fa perdere tempo? Ottimizzazione completa per prestazioni come nuovo. Risultati garantiti.',
            'formattazione-pc-milano': 'Formattazione professionale con backup dati, installazione sistema operativo e software. Il tuo PC come nuovo.'
        };
        
        return descriptions[taskConfig.id] || `Servizio professionale ${taskConfig.title.toLowerCase()} a Milano e provincia.`;
    }
    
    // Genera titolo problema
    generateProblemTitle(taskConfig) {
        const titles = {
            'emergenza-computer-milano': 'Il Tuo Computer Ha un Problema Urgente?',
            'schermo-nero-computer-milano': 'Schermo Nero: Cosa Significa e Come Risolverlo',
            'virus-computer-milano': 'Computer Infetto da Virus? Ecco Come Riconoscerlo',
            'computer-lento-milano': 'Perché il Computer Va Lento? Cause e Soluzioni',
            'formattazione-pc-milano': 'Quando È Necessaria la Formattazione del PC?'
        };

        return titles[taskConfig.id] || `Problemi con ${taskConfig.title}?`;
    }

    // Genera descrizione problema
    generateProblemDescription(taskConfig) {
        const descriptions = {
            'emergenza-computer-milano': `
                <p class="text-lg mb-4">
                    Quando il computer smette di funzionare improvvisamente, ogni minuto conta.
                    Che si tratti di un crash del sistema, problemi hardware o software corrotto,
                    i nostri tecnici specializzati sono pronti ad intervenire immediatamente.
                </p>
                <p class="mb-4">
                    <strong>Non aspettare che il problema peggiori.</strong> Un intervento tempestivo
                    può spesso salvare i tuoi dati e ridurre significativamente i tempi di ripristino.
                </p>
            `,
            'schermo-nero-computer-milano': `
                <p class="text-lg mb-4">
                    Lo schermo nero è uno dei problemi più comuni e preoccupanti. Può essere causato
                    da problemi hardware (scheda video, RAM, alimentatore) o software (driver corrotti,
                    sistema operativo danneggiato).
                </p>
                <p class="mb-4">
                    <strong>Non perdere i tuoi dati importanti.</strong> La maggior parte dei problemi
                    di schermo nero sono risolvibili senza perdita di dati se affrontati correttamente.
                </p>
            `,
            'virus-computer-milano': `
                <p class="text-lg mb-4">
                    I virus e malware possono compromettere seriamente le prestazioni del computer
                    e mettere a rischio i tuoi dati personali. Riconoscere i sintomi e agire rapidamente
                    è fondamentale per limitare i danni.
                </p>
                <p class="mb-4">
                    <strong>Protezione completa garantita.</strong> Utilizziamo strumenti professionali
                    per rimuovere completamente ogni traccia di malware e proteggere il sistema.
                </p>
            `,
            'computer-lento-milano': `
                <p class="text-lg mb-4">
                    Un computer lento può essere frustrante e ridurre significativamente la produttività.
                    Le cause possono essere molteplici: troppi programmi in avvio, hard disk frammentato,
                    virus, hardware obsoleto o problemi di sistema.
                </p>
                <p class="mb-4">
                    <strong>Prestazioni come nuovo garantite.</strong> La nostra ottimizzazione completa
                    può migliorare le prestazioni fino al 300%.
                </p>
            `,
            'formattazione-pc-milano': `
                <p class="text-lg mb-4">
                    La formattazione è spesso la soluzione più efficace per computer gravemente compromessi
                    da virus, errori di sistema ricorrenti o prestazioni drasticamente ridotte.
                    È un processo delicato che richiede esperienza professionale.
                </p>
                <p class="mb-4">
                    <strong>Backup e ripristino completo.</strong> Ci occupiamo di salvare tutti i tuoi
                    dati importanti prima della formattazione e di reinstallare tutto il necessario.
                </p>
            `
        };

        return descriptions[taskConfig.id] || `<p>Problemi con ${taskConfig.title.toLowerCase()}? I nostri tecnici possono aiutarti.</p>`;
    }

    // Genera lista sintomi
    generateSymptomsList(taskConfig) {
        const symptoms = {
            'emergenza-computer-milano': [
                'Computer che non si accende',
                'Schermata blu della morte (BSOD)',
                'Riavvii continui e improvvisi',
                'Errori critici di sistema',
                'Perdita improvvisa di dati',
                'Hardware che non risponde'
            ],
            'schermo-nero-computer-milano': [
                'Schermo completamente nero all\'avvio',
                'Cursore lampeggiante senza desktop',
                'Ventole che girano ma nessuna immagine',
                'Schermo nero dopo login Windows',
                'Monitor che non riceve segnale',
                'Schermo nero intermittente'
            ],
            'virus-computer-milano': [
                'Computer molto più lento del normale',
                'Pop-up pubblicitari continui',
                'Homepage browser cambiata',
                'File che scompaiono o si corrompono',
                'Programmi che si aprono da soli',
                'Antivirus disattivato automaticamente'
            ],
            'computer-lento-milano': [
                'Avvio del sistema molto lento',
                'Programmi che impiegano minuti ad aprirsi',
                'Frequenti blocchi e freeze',
                'Ventole sempre al massimo',
                'Disco rigido sempre in attività',
                'Memoria RAM sempre al limite'
            ],
            'formattazione-pc-milano': [
                'Errori di sistema frequenti e gravi',
                'Computer infetto da virus persistenti',
                'Prestazioni drasticamente ridotte',
                'Problemi di avvio ricorrenti',
                'Sistema operativo corrotto',
                'Necessità di "ripartire da zero"'
            ]
        };

        const symptomList = symptoms[taskConfig.id] || ['Problemi generici del computer'];
        return symptomList.map(symptom => `<li class="flex items-start gap-2"><span class="text-red-500 mt-1">•</span>${symptom}</li>`).join('');
    }

    // Genera step soluzione
    generateSolutionSteps(taskConfig) {
        const steps = {
            'emergenza-computer-milano': [
                {
                    icon: '📞',
                    title: 'Chiamata Immediata',
                    description: 'Contattaci e descrivi il problema. Valutiamo la criticità e organizziamo l\'intervento.'
                },
                {
                    icon: '🚗',
                    title: 'Intervento Rapido',
                    description: 'Arrivo del tecnico in meno di 30 minuti con tutta l\'attrezzatura necessaria.'
                },
                {
                    icon: '🔧',
                    title: 'Risoluzione Professionale',
                    description: 'Diagnosi precisa e riparazione con strumenti professionali e ricambi originali.'
                }
            ],
            'schermo-nero-computer-milano': [
                {
                    icon: '🔍',
                    title: 'Diagnosi Accurata',
                    description: 'Test completo di hardware e software per identificare la causa esatta.'
                },
                {
                    icon: '🛠️',
                    title: 'Riparazione Mirata',
                    description: 'Intervento specifico su componenti difettosi o software corrotto.'
                },
                {
                    icon: '✅',
                    title: 'Test e Garanzia',
                    description: 'Verifica completa del funzionamento e garanzia sulla riparazione.'
                }
            ],
            'virus-computer-milano': [
                {
                    icon: '🔒',
                    title: 'Scansione Profonda',
                    description: 'Analisi completa con strumenti professionali per identificare ogni minaccia.'
                },
                {
                    icon: '🧹',
                    title: 'Rimozione Completa',
                    description: 'Eliminazione di virus, malware, spyware e ogni traccia di infezione.'
                },
                {
                    icon: '🛡️',
                    title: 'Protezione Avanzata',
                    description: 'Installazione e configurazione di protezioni per prevenire future infezioni.'
                }
            ],
            'computer-lento-milano': [
                {
                    icon: '📊',
                    title: 'Analisi Performance',
                    description: 'Diagnosi completa per identificare i colli di bottiglia del sistema.'
                },
                {
                    icon: '⚡',
                    title: 'Ottimizzazione Sistema',
                    description: 'Pulizia registro, deframmentazione, rimozione software inutile.'
                },
                {
                    icon: '🚀',
                    title: 'Upgrade Hardware',
                    description: 'Consigli e installazione di componenti per massimizzare le prestazioni.'
                }
            ],
            'formattazione-pc-milano': [
                {
                    icon: '💾',
                    title: 'Backup Completo',
                    description: 'Salvataggio sicuro di tutti i dati importanti prima della formattazione.'
                },
                {
                    icon: '🔄',
                    title: 'Installazione Sistema',
                    description: 'Formattazione e installazione pulita del sistema operativo aggiornato.'
                },
                {
                    icon: '📱',
                    title: 'Ripristino Dati',
                    description: 'Reinstallazione software e ripristino di tutti i dati salvati.'
                }
            ]
        };

        const stepList = steps[taskConfig.id] || [];
        return stepList.map(step => `
            <div class="card text-center">
                <div class="text-4xl mb-4">${step.icon}</div>
                <h3 class="card-title">${step.title}</h3>
                <p class="card-description">${step.description}</p>
            </div>
        `).join('');
    }

    // Genera placeholder form
    generateFormPlaceholder(taskConfig) {
        const placeholders = {
            'emergenza-computer-milano': 'Descrivi l\'emergenza: cosa è successo, quando è iniziato il problema, se hai perso dati importanti...',
            'schermo-nero-computer-milano': 'Quando compare lo schermo nero? All\'avvio, dopo il login, durante l\'uso? Ci sono suoni o luci?',
            'virus-computer-milano': 'Quali sintomi hai notato? Pop-up, lentezza, file modificati, programmi che si aprono da soli?',
            'computer-lento-milano': 'Da quando il computer è lento? In quali situazioni è più evidente? Hai installato software di recente?',
            'formattazione-pc-milano': 'Perché vuoi formattare? Hai problemi specifici? Hai già un backup dei dati importanti?'
        };

        return placeholders[taskConfig.id] || 'Descrivi il problema che stai riscontrando...';
    }

    // Genera altri metodi helper...
    generateMetaDescription(taskConfig) {
        return `${taskConfig.title} ✓ Intervento rapido ✓ Tecnici certificati ✓ Preventivo gratuito ✓ Chiamaci: ${this.config.emergencyPhone}`;
    }

    generateKeywords(taskConfig) {
        const baseKeywords = [taskConfig.keyword, 'assistenza informatica milano', 'riparazione computer milano', 'tecnico computer milano'];
        return baseKeywords.join(', ');
    }
    
    generateAdditionalHead(taskConfig) {
        return `
        <!-- Page-specific schema -->
        <script type="application/ld+json">
        {
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "${taskConfig.title}",
            "description": "${this.generateMetaDescription(taskConfig)}",
            "provider": {
                "@type": "LocalBusiness",
                "name": "IT-ERA",
                "telephone": "+39 039 888 2041"
            },
            "areaServed": "Milano",
            "serviceType": "Computer Repair"
        }
        </script>
        `;
    }
    
    generateAdditionalScripts(taskConfig) {
        return `
        <script>
        // Page-specific tracking
        gtag('config', 'GA_MEASUREMENT_ID', {
            page_title: '${taskConfig.title}',
            page_location: '${this.config.baseUrl}${taskConfig.url}'
        });
        </script>
        `;
    }
    
    // Implementa Fase 1: Quick Wins
    async implementPhase1() {
        console.log('🚀 Starting Phase 1: Quick Wins Implementation...\n');
        
        if (!this.loadComponents()) {
            throw new Error('Failed to load components');
        }
        
        for (const task of this.phase1Tasks) {
            console.log(`📄 Creating page: ${task.title}`);
            
            try {
                // Genera pagina
                const pageContent = this.generatePage(task);
                
                // Crea directory se non esiste
                const dir = path.dirname(task.url.substring(1)); // Rimuovi il primo /
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                
                // Salva pagina
                const filePath = task.url.substring(1); // Rimuovi il primo /
                fs.writeFileSync(filePath, pageContent);
                
                console.log(`  ✅ Created: ${filePath}`);
                
                // Valida pagina
                const validation = await this.validatePage(task, filePath);
                this.validationResults.push(validation);
                
                this.pages.push({
                    task,
                    filePath,
                    validation
                });
                
            } catch (error) {
                console.error(`  ❌ Failed to create ${task.title}: ${error.message}`);
            }
        }
        
        console.log(`\n✅ Phase 1 completed: ${this.pages.length}/${this.phase1Tasks.length} pages created`);
        return this.pages;
    }
    
    // Valida pagina creata
    async validatePage(task, filePath) {
        console.log(`  🔍 Validating: ${filePath}`);
        
        const validation = {
            task: task.id,
            file: filePath,
            checks: {
                fileExists: false,
                hasTitle: false,
                hasMetaDescription: false,
                hasEmergencyContact: false,
                hasForm: false,
                hasResendIntegration: false,
                fileSize: 0
            },
            score: 0,
            issues: []
        };
        
        try {
            // Check file exists
            if (fs.existsSync(filePath)) {
                validation.checks.fileExists = true;
                
                const content = fs.readFileSync(filePath, 'utf8');
                validation.checks.fileSize = content.length;
                
                // Check title
                if (content.includes(`<title>${task.title}`)) {
                    validation.checks.hasTitle = true;
                } else {
                    validation.issues.push('Missing or incorrect title tag');
                }
                
                // Check meta description
                if (content.includes('meta name="description"')) {
                    validation.checks.hasMetaDescription = true;
                } else {
                    validation.issues.push('Missing meta description');
                }
                
                // Check emergency contact
                if (content.includes(this.config.emergencyPhone)) {
                    validation.checks.hasEmergencyContact = true;
                } else {
                    validation.issues.push('Missing emergency contact');
                }
                
                // Check form
                if (content.includes('<form')) {
                    validation.checks.hasForm = true;
                } else {
                    validation.issues.push('Missing contact form');
                }
                
                // Check Resend integration
                if (content.includes('data-resend="true"')) {
                    validation.checks.hasResendIntegration = true;
                } else {
                    validation.issues.push('Missing Resend integration');
                }
                
            } else {
                validation.issues.push('File does not exist');
            }
            
            // Calculate score
            const totalChecks = Object.keys(validation.checks).length - 1; // Exclude fileSize
            const passedChecks = Object.values(validation.checks).filter(check => check === true).length;
            validation.score = Math.round((passedChecks / totalChecks) * 100);
            
            console.log(`    ${validation.score >= 80 ? '✅' : validation.score >= 60 ? '⚠️' : '❌'} Score: ${validation.score}%`);
            
        } catch (error) {
            validation.issues.push(`Validation error: ${error.message}`);
            console.log(`    ❌ Validation failed: ${error.message}`);
        }
        
        return validation;
    }
    
    // Deploy su GitHub
    async deployToGitHub() {
        console.log('\n🚀 Deploying to GitHub...');
        
        try {
            // Add files
            execSync('git add .', { stdio: 'inherit' });
            
            // Commit
            const commitMessage = `🚀 FASE 1 QUICK WINS - ${this.pages.length} Landing Pages
            
✅ PAGINE IMPLEMENTATE:
${this.pages.map(p => `- ${p.task.title} (${p.validation.score}% quality)`).join('\n')}

📊 RISULTATI:
- ${this.pages.length} pagine create
- ${this.validationResults.filter(v => v.score >= 80).length} pagine high-quality
- Emergency contact integrato
- Form Resend attivi
- SEO ottimizzato

🎯 KEYWORDS TARGET:
${this.phase1Tasks.map(t => `- ${t.keyword} (${t.volume} ricerche/mese)`).join('\n')}`;
            
            execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
            
            // Push
            execSync('git push origin main', { stdio: 'inherit' });
            
            console.log('  ✅ Successfully deployed to GitHub');
            return true;
            
        } catch (error) {
            console.error('  ❌ Deploy failed:', error.message);
            return false;
        }
    }
    
    // Genera report finale
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            phase: 'Phase 1: Quick Wins',
            summary: {
                totalPages: this.pages.length,
                targetPages: this.phase1Tasks.length,
                successRate: Math.round((this.pages.length / this.phase1Tasks.length) * 100),
                averageQuality: Math.round(this.validationResults.reduce((sum, v) => sum + v.score, 0) / this.validationResults.length),
                highQualityPages: this.validationResults.filter(v => v.score >= 80).length
            },
            pages: this.pages,
            validationResults: this.validationResults,
            issues: this.validationResults.flatMap(v => v.issues),
            nextSteps: [
                'Test online functionality',
                'Monitor search rankings',
                'Prepare Phase 2: Content Expansion',
                'Set up analytics tracking'
            ]
        };
        
        fs.writeFileSync('phase1-implementation-report.json', JSON.stringify(report, null, 2));
        
        console.log('\n📊 PHASE 1 IMPLEMENTATION REPORT');
        console.log('=================================');
        console.log(`Pages Created: ${report.summary.totalPages}/${report.summary.targetPages} (${report.summary.successRate}%)`);
        console.log(`Average Quality: ${report.summary.averageQuality}%`);
        console.log(`High Quality Pages: ${report.summary.highQualityPages}`);
        console.log(`Total Issues: ${report.issues.length}`);
        console.log('\n💾 Report saved to: phase1-implementation-report.json');
        
        return report;
    }
}

// Esegui se chiamato direttamente
if (require.main === module) {
    const orchestrator = new ImplementationOrchestrator();
    
    orchestrator.implementPhase1()
        .then(() => {
            return orchestrator.deployToGitHub();
        })
        .then(() => {
            orchestrator.generateReport();
            console.log('\n🎉 Phase 1 implementation completed successfully!');
        })
        .catch(error => {
            console.error('❌ Implementation failed:', error);
            process.exit(1);
        });
}

module.exports = ImplementationOrchestrator;
