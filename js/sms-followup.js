/**
 * IT-ERA SMS Followup System
 * Sistema SMS per followup urgenti e promemoria
 */

class ITERASMSFollowup {
    constructor() {
        this.apiEndpoint = 'https://api.twilio.com/2010-04-01/Accounts';
        this.accountSid = window.ITERA_CONFIG?.twilioAccountSid;
        this.authToken = window.ITERA_CONFIG?.twilioAuthToken;
        this.fromNumber = window.ITERA_CONFIG?.twilioFromNumber || '+393888820041';
        
        this.smsTemplates = {
            emergency_confirmation: {
                message: "🚨 IT-ERA: Emergenza ricevuta! Ti chiamiamo in 15 min al {{PHONE}}. Per urgenze immediate: 039 888 2041",
                delay: 0 // Immediato
            },
            technician_dispatch: {
                message: "⚡ IT-ERA: Tecnico Marco in arrivo! ETA: {{ETA}} min. Contatto diretto: 039 888 2041. Preparare spazio di lavoro.",
                delay: 30 // 30 minuti dopo richiesta
            },
            appointment_reminder: {
                message: "📅 IT-ERA: Promemoria appuntamento domani ore {{TIME}} per {{SERVICE}}. Conferma/modifica: 039 888 2041",
                delay: 1440 // 24 ore prima
            },
            service_completed: {
                message: "✅ IT-ERA: Servizio completato! Lascia recensione: https://g.page/r/... Garanzia 6 mesi. Grazie!",
                delay: 60 // 1 ora dopo completamento
            },
            payment_reminder: {
                message: "💳 IT-ERA: Promemoria pagamento fattura {{INVOICE_NUM}} scadenza {{DUE_DATE}}. Info: 039 888 2041",
                delay: 2880 // 2 giorni prima scadenza
            },
            maintenance_reminder: {
                message: "🛡️ IT-ERA: Manutenzione preventiva consigliata per il tuo sistema. Prenota: 039 888 2041. Sconto 20% questo mese!",
                delay: 43200 // 30 giorni dopo ultimo servizio
            },
            quote_followup: {
                message: "💼 IT-ERA: Preventivo {{COMPANY}} pronto! Sconto 15% se confermi entro 7gg. Discutiamone: 039 888 2041",
                delay: 1440 // 24 ore dopo invio preventivo
            },
            quote_urgency: {
                message: "⏰ IT-ERA: {{COMPANY}}, sconto 15% scade domani! Conferma oggi per risparmiare. Chiama: 039 888 2041",
                delay: 8640 // 6 giorni dopo preventivo
            }
        };
        
        this.scheduledSMS = new Map();
        this.init();
    }
    
    init() {
        this.loadScheduledSMS();
        this.setupEventListeners();
        console.log('📱 IT-ERA SMS Followup System initialized');
    }
    
    setupEventListeners() {
        // Listen for conversion events
        document.addEventListener('itera-conversion', (event) => {
            const { conversionType, data } = event.detail;
            this.scheduleSMSSequence(conversionType, data);
        });
        
        // Listen for service completion events
        document.addEventListener('itera-service-completed', (event) => {
            const { serviceId, customerData } = event.detail;
            this.scheduleServiceCompletedSMS(customerData);
        });
        
        // Listen for appointment scheduled events
        document.addEventListener('itera-appointment-scheduled', (event) => {
            const { appointmentData } = event.detail;
            this.scheduleAppointmentReminder(appointmentData);
        });
    }
    
    scheduleSMSSequence(conversionType, data) {
        if (!data.phone || !this.isValidPhoneNumber(data.phone)) {
            console.warn('Invalid phone number for SMS:', data.phone);
            return;
        }
        
        let smsTypes = [];
        
        switch (conversionType) {
            case 'emergency_repair_request':
                smsTypes = ['emergency_confirmation', 'technician_dispatch'];
                break;
            case 'business_consultation_request':
                smsTypes = ['quote_followup', 'quote_urgency'];
                break;
            case 'computer_repair_request':
                smsTypes = ['appointment_reminder'];
                break;
            case 'server_support_request':
                smsTypes = ['appointment_reminder', 'maintenance_reminder'];
                break;
        }
        
        smsTypes.forEach(smsType => {
            this.scheduleSMS(smsType, data);
        });
    }
    
    scheduleSMS(smsType, data) {
        const template = this.smsTemplates[smsType];
        if (!template) {
            console.warn(`SMS template ${smsType} not found`);
            return;
        }
        
        const smsId = this.generateSMSId();
        const sendTime = Date.now() + (template.delay * 60 * 1000);
        
        const smsData = {
            id: smsId,
            type: smsType,
            to: this.formatPhoneNumber(data.phone),
            message: this.personalizeMessage(template.message, data),
            sendTime: sendTime,
            status: 'scheduled',
            data: data
        };
        
        this.scheduledSMS.set(smsId, smsData);
        this.saveScheduledSMS();
        
        // Schedule the actual sending
        setTimeout(() => {
            this.sendSMS(smsId);
        }, template.delay * 60 * 1000);
        
        console.log(`📱 SMS scheduled: ${smsType} to ${data.phone} in ${template.delay} minutes`);
        
        // Track SMS scheduled
        if (window.ITERAAnalytics) {
            window.ITERAAnalytics.trackEvent('sms_scheduled', {
                sms_type: smsType,
                phone: this.maskPhoneNumber(data.phone),
                delay_minutes: template.delay
            });
        }
    }
    
    async sendSMS(smsId) {
        const smsData = this.scheduledSMS.get(smsId);
        if (!smsData || smsData.status !== 'scheduled') {
            return;
        }
        
        try {
            // Update status to sending
            smsData.status = 'sending';
            this.saveScheduledSMS();
            
            const response = await fetch(`${this.apiEndpoint}/${this.accountSid}/Messages.json`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + btoa(`${this.accountSid}:${this.authToken}`),
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    From: this.fromNumber,
                    To: smsData.to,
                    Body: smsData.message
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                smsData.status = 'sent';
                smsData.messageSid = result.sid;
                smsData.sentAt = new Date().toISOString();
                
                console.log(`✅ SMS sent successfully: ${smsId}`);
                
                // Track SMS sent
                if (window.ITERAAnalytics) {
                    window.ITERAAnalytics.trackEvent('sms_sent', {
                        sms_id: smsId,
                        sms_type: smsData.type,
                        message_sid: result.sid
                    });
                }
                
            } else {
                throw new Error(`SMS API error: ${response.statusText}`);
            }
            
        } catch (error) {
            console.error('Error sending SMS:', error);
            smsData.status = 'failed';
            smsData.error = error.message;
            
            // Track SMS failed
            if (window.ITERAAnalytics) {
                window.ITERAAnalytics.trackEvent('sms_failed', {
                    sms_id: smsId,
                    sms_type: smsData.type,
                    error: error.message
                });
            }
        }
        
        this.saveScheduledSMS();
    }
    
    personalizeMessage(message, data) {
        const replacements = {
            '{{PHONE}}': data.phone || '',
            '{{NAME}}': data.name || data.full_name || 'Cliente',
            '{{COMPANY}}': data.company_name || data.company || '',
            '{{SERVICE}}': data.service_type || data.service || 'servizio IT',
            '{{LOCATION}}': data.location || '',
            '{{ETA}}': this.calculateETA(data.location),
            '{{TIME}}': data.appointment_time || '14:00',
            '{{INVOICE_NUM}}': data.invoice_number || 'INV-001',
            '{{DUE_DATE}}': data.due_date || this.formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
            '{{CURRENT_DATE}}': this.formatDate(new Date()),
            '{{OFFER_EXPIRY}}': this.formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
        };
        
        let personalizedMessage = message;
        Object.entries(replacements).forEach(([placeholder, value]) => {
            personalizedMessage = personalizedMessage.replace(new RegExp(placeholder, 'g'), value);
        });
        
        return personalizedMessage;
    }
    
    calculateETA(location) {
        // Simple ETA calculation based on location
        const etaMap = {
            'Milano': '45-60',
            'Bergamo': '30-45',
            'Brescia': '60-75',
            'Como': '60-75',
            'Varese': '75-90'
        };
        
        return etaMap[location] || '60-90';
    }
    
    formatDate(date) {
        return date.toLocaleDateString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
    
    isValidPhoneNumber(phone) {
        // Basic Italian phone number validation
        const phoneRegex = /^(\+39|0039|39)?[\s]?([0-9]{2,4}[\s]?[0-9]{6,8})$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    }
    
    formatPhoneNumber(phone) {
        // Format to international format
        let cleaned = phone.replace(/[\s\-\(\)]/g, '');
        
        if (cleaned.startsWith('0039')) {
            return '+' + cleaned.substring(2);
        } else if (cleaned.startsWith('39')) {
            return '+' + cleaned;
        } else if (cleaned.startsWith('0')) {
            return '+39' + cleaned.substring(1);
        } else if (cleaned.startsWith('+39')) {
            return cleaned;
        }
        
        return '+39' + cleaned;
    }
    
    maskPhoneNumber(phone) {
        // Mask phone number for privacy in analytics
        if (phone.length > 6) {
            return phone.substring(0, 3) + '***' + phone.substring(phone.length - 3);
        }
        return '***';
    }
    
    scheduleAppointmentReminder(appointmentData) {
        const reminderData = {
            ...appointmentData,
            appointment_time: appointmentData.time,
            service: appointmentData.service_type
        };
        
        this.scheduleSMS('appointment_reminder', reminderData);
    }
    
    scheduleServiceCompletedSMS(customerData) {
        this.scheduleSMS('service_completed', customerData);
    }
    
    scheduleMaintenanceReminder(customerData, daysFromNow = 30) {
        const template = this.smsTemplates.maintenance_reminder;
        const customTemplate = {
            ...template,
            delay: daysFromNow * 24 * 60 // Convert days to minutes
        };
        
        this.smsTemplates.maintenance_reminder_custom = customTemplate;
        this.scheduleSMS('maintenance_reminder_custom', customerData);
    }
    
    generateSMSId() {
        return 'sms_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    saveScheduledSMS() {
        try {
            const data = Array.from(this.scheduledSMS.entries());
            localStorage.setItem('itera_scheduled_sms', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving scheduled SMS:', error);
        }
    }
    
    loadScheduledSMS() {
        try {
            const data = localStorage.getItem('itera_scheduled_sms');
            if (data) {
                const smsArray = JSON.parse(data);
                this.scheduledSMS = new Map(smsArray);
                
                // Reschedule pending SMS after page reload
                this.scheduledSMS.forEach((smsData, smsId) => {
                    if (smsData.status === 'scheduled' && smsData.sendTime > Date.now()) {
                        const delay = smsData.sendTime - Date.now();
                        setTimeout(() => {
                            this.sendSMS(smsId);
                        }, delay);
                    }
                });
            }
        } catch (error) {
            console.error('Error loading scheduled SMS:', error);
        }
    }
    
    // Admin methods
    getScheduledSMS() {
        return Array.from(this.scheduledSMS.entries());
    }
    
    getSMSStats() {
        const stats = {
            total: this.scheduledSMS.size,
            scheduled: 0,
            sent: 0,
            failed: 0,
            byType: {}
        };
        
        this.scheduledSMS.forEach((smsData) => {
            stats[smsData.status]++;
            
            if (!stats.byType[smsData.type]) {
                stats.byType[smsData.type] = 0;
            }
            stats.byType[smsData.type]++;
        });
        
        return stats;
    }
    
    cancelSMS(smsId) {
        const smsData = this.scheduledSMS.get(smsId);
        if (smsData && smsData.status === 'scheduled') {
            smsData.status = 'cancelled';
            this.saveScheduledSMS();
            return true;
        }
        return false;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (window.ITERA_CONFIG?.twilioAccountSid) {
        window.ITERASMS = new ITERASMSFollowup();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ITERASMSFollowup;
}
