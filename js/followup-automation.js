/**
 * IT-ERA Followup Automation System
 * Sistema automatico di followup per massimizzare conversioni
 */

class ITERAFollowupAutomation {
    constructor() {
        this.apiEndpoint = 'https://api.resend.com/emails';
        this.apiKey = window.ITERA_CONFIG?.resendApiKey;
        this.fromEmail = 'info@bulltech.it';
        this.replyTo = 'info@bulltech.it';
        
        this.sequences = {
            emergency_repair: {
                name: 'Emergency Computer Repair',
                triggers: ['emergency_repair_request'],
                emails: [
                    {
                        delay: 0, // Immediato
                        subject: '🚨 EMERGENZA RICEVUTA - Ti chiamiamo in 15 minuti',
                        template: 'emergency_immediate'
                    },
                    {
                        delay: 30, // 30 minuti
                        subject: '⚡ Tecnico in arrivo - Dettagli intervento',
                        template: 'emergency_technician_dispatch'
                    },
                    {
                        delay: 1440, // 24 ore
                        subject: '✅ Come è andato l\'intervento? Lascia una recensione',
                        template: 'emergency_followup_review'
                    },
                    {
                        delay: 10080, // 7 giorni
                        subject: '🛡️ Manutenzione preventiva - Evita futuri problemi',
                        template: 'emergency_prevention_offer'
                    }
                ]
            },
            business_consultation: {
                name: 'Business IT Consultation',
                triggers: ['business_consultation_request'],
                emails: [
                    {
                        delay: 0, // Immediato
                        subject: '💼 Richiesta ricevuta - Preventivo entro 24h',
                        template: 'business_immediate'
                    },
                    {
                        delay: 60, // 1 ora
                        subject: '📋 Analisi preliminare - Domande aggiuntive',
                        template: 'business_analysis'
                    },
                    {
                        delay: 1440, // 24 ore
                        subject: '📊 Preventivo personalizzato allegato',
                        template: 'business_quote'
                    },
                    {
                        delay: 4320, // 3 giorni
                        subject: '🤝 Hai domande sul preventivo? Chiamiamo noi',
                        template: 'business_followup_call'
                    },
                    {
                        delay: 10080, // 7 giorni
                        subject: '🎯 Case study simile - Come abbiamo aiutato [Azienda]',
                        template: 'business_case_study'
                    },
                    {
                        delay: 20160, // 14 giorni
                        subject: '⏰ Offerta speciale scade presto - 20% di sconto',
                        template: 'business_urgency_discount'
                    }
                ]
            },
            computer_repair: {
                name: 'Standard Computer Repair',
                triggers: ['computer_repair_request'],
                emails: [
                    {
                        delay: 0,
                        subject: '🔧 Richiesta ricevuta - Diagnosi gratuita confermata',
                        template: 'repair_immediate'
                    },
                    {
                        delay: 120, // 2 ore
                        subject: '📞 Ti chiamiamo per fissare appuntamento',
                        template: 'repair_appointment'
                    },
                    {
                        delay: 1440, // 24 ore
                        subject: '💡 Consigli per evitare problemi futuri',
                        template: 'repair_prevention_tips'
                    },
                    {
                        delay: 7200, // 5 giorni
                        subject: '⭐ Come è andata la riparazione? Recensione',
                        template: 'repair_review_request'
                    }
                ]
            },
            server_support: {
                name: 'Server Support',
                triggers: ['server_support_request'],
                emails: [
                    {
                        delay: 0,
                        subject: '🖥️ Richiesta server ricevuta - Supporto specializzato',
                        template: 'server_immediate'
                    },
                    {
                        delay: 30,
                        subject: '🔍 Analisi preliminare server - Informazioni aggiuntive',
                        template: 'server_analysis'
                    },
                    {
                        delay: 1440, // 24 ore
                        subject: '📋 Piano di intervento server personalizzato',
                        template: 'server_intervention_plan'
                    },
                    {
                        delay: 10080, // 7 giorni
                        subject: '🛡️ Contratto manutenzione server - Uptime 99.9%',
                        template: 'server_maintenance_contract'
                    }
                ]
            }
        };
        
        this.emailTemplates = {};
        this.activeSequences = new Map();
        
        this.init();
    }
    
    init() {
        this.loadEmailTemplates();
        this.setupEventListeners();
        this.loadActiveSequences();
        
        console.log('🚀 IT-ERA Followup Automation initialized');
    }
    
    setupEventListeners() {
        // Listen for conversion events to trigger sequences
        document.addEventListener('itera-conversion', (event) => {
            const { conversionType, data } = event.detail;
            this.triggerSequence(conversionType, data);
        });
        
        // Listen for form submissions
        document.addEventListener('submit', (event) => {
            const form = event.target;
            if (form.dataset.resend === 'true') {
                const formData = new FormData(form);
                const conversionData = {
                    email: formData.get('email') || formData.get('contact_person'),
                    name: formData.get('full_name') || formData.get('contact_person'),
                    phone: formData.get('phone'),
                    service: form.id,
                    location: this.extractLocation(),
                    timestamp: new Date().toISOString()
                };
                
                // Determine sequence type based on form
                let sequenceType = 'computer_repair'; // default
                if (form.id.includes('emergency')) {
                    sequenceType = 'emergency_repair';
                } else if (form.id.includes('business')) {
                    sequenceType = 'business_consultation';
                } else if (form.id.includes('server')) {
                    sequenceType = 'server_support';
                }
                
                this.triggerSequence(sequenceType, conversionData);
            }
        });
    }
    
    triggerSequence(sequenceType, data) {
        if (!this.sequences[sequenceType]) {
            console.warn(`Sequence type ${sequenceType} not found`);
            return;
        }
        
        const sequence = this.sequences[sequenceType];
        const sequenceId = this.generateSequenceId();
        
        console.log(`🎯 Triggering sequence: ${sequence.name} for ${data.email}`);
        
        // Store sequence data
        this.activeSequences.set(sequenceId, {
            type: sequenceType,
            data: data,
            startTime: Date.now(),
            emailsSent: 0,
            status: 'active'
        });
        
        // Schedule all emails in sequence
        sequence.emails.forEach((email, index) => {
            setTimeout(() => {
                this.sendSequenceEmail(sequenceId, index);
            }, email.delay * 60 * 1000); // Convert minutes to milliseconds
        });
        
        // Save to localStorage for persistence
        this.saveActiveSequences();
        
        // Track sequence start
        if (window.ITERAAnalytics) {
            window.ITERAAnalytics.trackEvent('followup_sequence_started', {
                sequence_type: sequenceType,
                sequence_id: sequenceId,
                email: data.email,
                location: data.location
            });
        }
    }
    
    async sendSequenceEmail(sequenceId, emailIndex) {
        const sequenceData = this.activeSequences.get(sequenceId);
        if (!sequenceData || sequenceData.status !== 'active') {
            return;
        }
        
        const sequence = this.sequences[sequenceData.type];
        const emailConfig = sequence.emails[emailIndex];
        const template = this.emailTemplates[emailConfig.template];
        
        if (!template) {
            console.error(`Template ${emailConfig.template} not found`);
            return;
        }
        
        try {
            const personalizedContent = this.personalizeTemplate(template, sequenceData.data);
            
            const emailData = {
                from: this.fromEmail,
                to: [sequenceData.data.email],
                reply_to: this.replyTo,
                subject: this.personalizeSubject(emailConfig.subject, sequenceData.data),
                html: personalizedContent.html,
                text: personalizedContent.text
            };
            
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(emailData)
            });
            
            if (response.ok) {
                // Update sequence progress
                sequenceData.emailsSent = emailIndex + 1;
                this.saveActiveSequences();
                
                console.log(`✅ Sequence email ${emailIndex + 1} sent to ${sequenceData.data.email}`);
                
                // Track email sent
                if (window.ITERAAnalytics) {
                    window.ITERAAnalytics.trackEvent('followup_email_sent', {
                        sequence_id: sequenceId,
                        email_index: emailIndex,
                        template: emailConfig.template,
                        recipient: sequenceData.data.email
                    });
                }
                
                // Mark sequence as complete if last email
                if (emailIndex === sequence.emails.length - 1) {
                    sequenceData.status = 'completed';
                    this.saveActiveSequences();
                    
                    if (window.ITERAAnalytics) {
                        window.ITERAAnalytics.trackEvent('followup_sequence_completed', {
                            sequence_id: sequenceId,
                            sequence_type: sequenceData.type,
                            emails_sent: sequenceData.emailsSent
                        });
                    }
                }
                
            } else {
                console.error('Failed to send sequence email:', response.statusText);
            }
            
        } catch (error) {
            console.error('Error sending sequence email:', error);
        }
    }
    
    personalizeTemplate(template, data) {
        let html = template.html;
        let text = template.text;
        
        // Replace placeholders
        const replacements = {
            '{{NAME}}': data.name || 'Cliente',
            '{{EMAIL}}': data.email,
            '{{PHONE}}': data.phone || '',
            '{{LOCATION}}': data.location || '',
            '{{SERVICE}}': data.service || '',
            '{{COMPANY}}': data.company_name || '',
            '{{CURRENT_DATE}}': new Date().toLocaleDateString('it-IT'),
            '{{CURRENT_TIME}}': new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
        };
        
        Object.entries(replacements).forEach(([placeholder, value]) => {
            html = html.replace(new RegExp(placeholder, 'g'), value);
            text = text.replace(new RegExp(placeholder, 'g'), value);
        });
        
        return { html, text };
    }
    
    personalizeSubject(subject, data) {
        return subject
            .replace('{{NAME}}', data.name || 'Cliente')
            .replace('{{LOCATION}}', data.location || '')
            .replace('{{COMPANY}}', data.company_name || '');
    }
    
    loadEmailTemplates() {
        // Templates will be loaded from separate files
        // For now, we'll define basic templates inline
        this.emailTemplates = {
            emergency_immediate: {
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 20px; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px;">🚨 EMERGENZA RICEVUTA</h1>
                        <p style="margin: 10px 0 0 0; font-size: 18px;">Ti chiamiamo entro 15 minuti!</p>
                    </div>
                    <div style="padding: 20px; background: white;">
                        <p>Ciao {{NAME}},</p>
                        <p><strong>La tua richiesta di emergenza è stata ricevuta alle {{CURRENT_TIME}}.</strong></p>
                        <p>Il nostro tecnico specializzato ti contatterà entro 15 minuti al numero <strong>{{PHONE}}</strong> per:</p>
                        <ul>
                            <li>✅ Confermare i dettagli del problema</li>
                            <li>✅ Programmare l'intervento immediato</li>
                            <li>✅ Fornirti il tempo esatto di arrivo</li>
                        </ul>
                        <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
                            <p style="margin: 0; font-weight: bold;">📞 Per emergenze immediate: 039 888 2041</p>
                        </div>
                        <p>Grazie per aver scelto IT-ERA per la tua emergenza informatica.</p>
                        <p>Il Team IT-ERA</p>
                    </div>
                </div>`,
                text: `EMERGENZA RICEVUTA - Ti chiamiamo entro 15 minuti!\n\nCiao {{NAME}},\n\nLa tua richiesta di emergenza è stata ricevuta alle {{CURRENT_TIME}}.\n\nIl nostro tecnico ti contatterà entro 15 minuti al {{PHONE}}.\n\nPer emergenze immediate: 039 888 2041\n\nIl Team IT-ERA`
            },
            business_immediate: {
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #1e40af, #1d4ed8); color: white; padding: 20px; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px;">💼 RICHIESTA RICEVUTA</h1>
                        <p style="margin: 10px 0 0 0; font-size: 18px;">Preventivo entro 24 ore</p>
                    </div>
                    <div style="padding: 20px; background: white;">
                        <p>Gentile {{NAME}},</p>
                        <p>Grazie per aver richiesto una consulenza IT per <strong>{{COMPANY}}</strong>.</p>
                        <p>Il nostro team di consulenti analizzerà le vostre esigenze e vi invierà un preventivo dettagliato entro 24 ore.</p>
                        <h3>Prossimi passi:</h3>
                        <ol>
                            <li>📋 Analisi preliminare delle esigenze (entro 2 ore)</li>
                            <li>📊 Preparazione preventivo personalizzato (entro 24 ore)</li>
                            <li>📞 Chiamata di presentazione e chiarimenti</li>
                        </ol>
                        <div style="background: #eff6ff; border-left: 4px solid #1e40af; padding: 15px; margin: 20px 0;">
                            <p style="margin: 0; font-weight: bold;">📞 Per informazioni immediate: 039 888 2041</p>
                        </div>
                        <p>Cordiali saluti,<br>Il Team IT-ERA</p>
                    </div>
                </div>`,
                text: `RICHIESTA RICEVUTA - Preventivo entro 24 ore\n\nGentile {{NAME}},\n\nGrazie per aver richiesto una consulenza IT per {{COMPANY}}.\n\nVi invieremo un preventivo dettagliato entro 24 ore.\n\nPer informazioni: 039 888 2041\n\nIl Team IT-ERA`
            }
        };
    }
    
    generateSequenceId() {
        return 'seq_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    extractLocation() {
        // Extract location from current page URL or title
        const title = document.title;
        const cities = ['Milano', 'Bergamo', 'Brescia', 'Como', 'Varese', 'Pavia', 'Cremona', 'Mantova', 'Lecco', 'Lodi', 'Sondrio', 'Monza'];
        
        for (const city of cities) {
            if (title.includes(city)) {
                return city;
            }
        }
        
        return 'Lombardia';
    }
    
    saveActiveSequences() {
        try {
            const data = Array.from(this.activeSequences.entries());
            localStorage.setItem('itera_active_sequences', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving active sequences:', error);
        }
    }
    
    loadActiveSequences() {
        try {
            const data = localStorage.getItem('itera_active_sequences');
            if (data) {
                const sequences = JSON.parse(data);
                this.activeSequences = new Map(sequences);
            }
        } catch (error) {
            console.error('Error loading active sequences:', error);
        }
    }
    
    // Admin methods for monitoring
    getActiveSequences() {
        return Array.from(this.activeSequences.entries());
    }
    
    getSequenceStats() {
        const stats = {
            total: this.activeSequences.size,
            active: 0,
            completed: 0,
            byType: {}
        };
        
        this.activeSequences.forEach((sequence) => {
            if (sequence.status === 'active') stats.active++;
            if (sequence.status === 'completed') stats.completed++;
            
            if (!stats.byType[sequence.type]) {
                stats.byType[sequence.type] = 0;
            }
            stats.byType[sequence.type]++;
        });
        
        return stats;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (window.ITERA_CONFIG?.resendApiKey) {
        window.ITERAFollowup = new ITERAFollowupAutomation();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ITERAFollowupAutomation;
}
