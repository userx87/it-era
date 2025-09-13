/**
 * IT-ERA Call Followup System
 * Sistema di chiamate automatiche e promemoria per il team
 */

class ITERACallFollowup {
    constructor() {
        this.callSchedules = {
            emergency_immediate: {
                delay: 0, // Immediato
                priority: 'CRITICAL',
                message: '🚨 EMERGENZA: {{NAME}} - {{PHONE}} - {{PROBLEM}} a {{LOCATION}}',
                assignTo: 'emergency_team',
                maxAttempts: 3,
                retryInterval: 5 // minuti
            },
            emergency_followup: {
                delay: 15, // 15 minuti dopo prima chiamata
                priority: 'HIGH',
                message: '⚡ FOLLOWUP EMERGENZA: Verificare stato intervento {{NAME}} - {{PHONE}}',
                assignTo: 'emergency_team',
                maxAttempts: 2,
                retryInterval: 10
            },
            business_consultation: {
                delay: 60, // 1 ora
                priority: 'MEDIUM',
                message: '💼 CONSULENZA: {{COMPANY}} - {{NAME}} - {{PHONE}} - Analisi preliminare',
                assignTo: 'sales_team',
                maxAttempts: 3,
                retryInterval: 120 // 2 ore
            },
            quote_followup: {
                delay: 4320, // 3 giorni dopo invio preventivo
                priority: 'MEDIUM',
                message: '📊 FOLLOWUP PREVENTIVO: {{COMPANY}} - {{NAME}} - {{PHONE}} - Discutere offerta',
                assignTo: 'sales_team',
                maxAttempts: 2,
                retryInterval: 1440 // 24 ore
            },
            appointment_confirmation: {
                delay: 1440, // 24 ore prima
                priority: 'MEDIUM',
                message: '📅 CONFERMA APPUNTAMENTO: {{NAME}} - {{PHONE}} - {{SERVICE}} domani ore {{TIME}}',
                assignTo: 'support_team',
                maxAttempts: 2,
                retryInterval: 120
            },
            service_quality_check: {
                delay: 1440, // 24 ore dopo servizio
                priority: 'LOW',
                message: '⭐ QUALITY CHECK: {{NAME}} - {{PHONE}} - Verificare soddisfazione servizio {{SERVICE}}',
                assignTo: 'support_team',
                maxAttempts: 1,
                retryInterval: 0
            },
            payment_reminder: {
                delay: 2880, // 2 giorni prima scadenza
                priority: 'MEDIUM',
                message: '💳 PAGAMENTO: {{COMPANY}} - {{NAME}} - {{PHONE}} - Fattura {{INVOICE}} scade {{DUE_DATE}}',
                assignTo: 'admin_team',
                maxAttempts: 2,
                retryInterval: 1440
            }
        };
        
        this.teamMembers = {
            emergency_team: [
                { name: 'Marco Rossi', phone: '+393331234567', role: 'Senior Technician' },
                { name: 'Luca Bianchi', phone: '+393337654321', role: 'Hardware Specialist' }
            ],
            sales_team: [
                { name: 'Andrea Verdi', phone: '+393339876543', role: 'Sales Manager' },
                { name: 'Giulia Neri', phone: '+393336543210', role: 'Business Consultant' }
            ],
            support_team: [
                { name: 'Paolo Gialli', phone: '+393332468135', role: 'Support Manager' },
                { name: 'Sara Blu', phone: '+393338642097', role: 'Customer Success' }
            ],
            admin_team: [
                { name: 'Roberto Viola', phone: '+393335792468', role: 'Admin Manager' }
            ]
        };
        
        this.scheduledCalls = new Map();
        this.callHistory = [];
        
        this.init();
    }
    
    init() {
        this.loadScheduledCalls();
        this.setupEventListeners();
        this.startCallScheduler();
        console.log('📞 IT-ERA Call Followup System initialized');
    }
    
    setupEventListeners() {
        // Listen for conversion events
        document.addEventListener('itera-conversion', (event) => {
            const { conversionType, data } = event.detail;
            this.scheduleCallSequence(conversionType, data);
        });
        
        // Listen for service events
        document.addEventListener('itera-service-completed', (event) => {
            const { serviceData } = event.detail;
            this.scheduleCall('service_quality_check', serviceData);
        });
        
        // Listen for appointment events
        document.addEventListener('itera-appointment-scheduled', (event) => {
            const { appointmentData } = event.detail;
            this.scheduleCall('appointment_confirmation', appointmentData);
        });
        
        // Listen for invoice events
        document.addEventListener('itera-invoice-created', (event) => {
            const { invoiceData } = event.detail;
            this.scheduleCall('payment_reminder', invoiceData);
        });
    }
    
    scheduleCallSequence(conversionType, data) {
        let callTypes = [];
        
        switch (conversionType) {
            case 'emergency_repair_request':
                callTypes = ['emergency_immediate', 'emergency_followup'];
                break;
            case 'business_consultation_request':
                callTypes = ['business_consultation', 'quote_followup'];
                break;
            case 'computer_repair_request':
                callTypes = ['appointment_confirmation'];
                break;
            case 'server_support_request':
                callTypes = ['business_consultation'];
                break;
        }
        
        callTypes.forEach(callType => {
            this.scheduleCall(callType, data);
        });
    }
    
    scheduleCall(callType, data) {
        const schedule = this.callSchedules[callType];
        if (!schedule) {
            console.warn(`Call schedule ${callType} not found`);
            return;
        }
        
        const callId = this.generateCallId();
        const scheduledTime = Date.now() + (schedule.delay * 60 * 1000);
        
        const callData = {
            id: callId,
            type: callType,
            scheduledTime: scheduledTime,
            priority: schedule.priority,
            message: this.personalizeMessage(schedule.message, data),
            assignedTo: this.assignTeamMember(schedule.assignTo),
            customerData: data,
            status: 'scheduled',
            attempts: 0,
            maxAttempts: schedule.maxAttempts,
            retryInterval: schedule.retryInterval,
            createdAt: new Date().toISOString()
        };
        
        this.scheduledCalls.set(callId, callData);
        this.saveScheduledCalls();
        
        console.log(`📞 Call scheduled: ${callType} for ${data.name || data.company_name} at ${new Date(scheduledTime).toLocaleString()}`);
        
        // Track call scheduled
        if (window.ITERAAnalytics) {
            window.ITERAAnalytics.trackEvent('call_scheduled', {
                call_type: callType,
                priority: schedule.priority,
                assigned_to: callData.assignedTo.name,
                delay_minutes: schedule.delay
            });
        }
        
        // Send immediate notification for critical calls
        if (schedule.priority === 'CRITICAL') {
            this.sendImmediateNotification(callData);
        }
    }
    
    assignTeamMember(teamName) {
        const team = this.teamMembers[teamName];
        if (!team || team.length === 0) {
            return { name: 'Unassigned', phone: '', role: '' };
        }
        
        // Simple round-robin assignment
        const timestamp = Date.now();
        const index = Math.floor(timestamp / 1000) % team.length;
        return team[index];
    }
    
    personalizeMessage(message, data) {
        const replacements = {
            '{{NAME}}': data.name || data.full_name || data.contact_person || 'Cliente',
            '{{COMPANY}}': data.company_name || data.company || '',
            '{{PHONE}}': data.phone || '',
            '{{PROBLEM}}': data.problem_details || data.problem_description || 'problema IT',
            '{{LOCATION}}': data.location || '',
            '{{SERVICE}}': data.service_type || data.service || 'servizio IT',
            '{{TIME}}': data.appointment_time || '14:00',
            '{{INVOICE}}': data.invoice_number || 'INV-001',
            '{{DUE_DATE}}': data.due_date || this.formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
            '{{CURRENT_DATE}}': this.formatDate(new Date())
        };
        
        let personalizedMessage = message;
        Object.entries(replacements).forEach(([placeholder, value]) => {
            personalizedMessage = personalizedMessage.replace(new RegExp(placeholder, 'g'), value);
        });
        
        return personalizedMessage;
    }
    
    startCallScheduler() {
        // Check for due calls every minute
        setInterval(() => {
            this.processDueCalls();
        }, 60000);
        
        // Process any calls that are already due
        this.processDueCalls();
    }
    
    processDueCalls() {
        const now = Date.now();
        
        this.scheduledCalls.forEach((callData, callId) => {
            if (callData.status === 'scheduled' && callData.scheduledTime <= now) {
                this.triggerCall(callId);
            }
        });
    }
    
    triggerCall(callId) {
        const callData = this.scheduledCalls.get(callId);
        if (!callData) return;
        
        callData.status = 'active';
        callData.attempts++;
        callData.lastAttempt = new Date().toISOString();
        
        // Create notification for team member
        this.createCallNotification(callData);
        
        // Add to call history
        this.callHistory.push({
            ...callData,
            triggeredAt: new Date().toISOString()
        });
        
        this.saveScheduledCalls();
        
        console.log(`📞 Call triggered: ${callData.type} assigned to ${callData.assignedTo.name}`);
        
        // Track call triggered
        if (window.ITERAAnalytics) {
            window.ITERAAnalytics.trackEvent('call_triggered', {
                call_id: callId,
                call_type: callData.type,
                priority: callData.priority,
                assigned_to: callData.assignedTo.name,
                attempt: callData.attempts
            });
        }
    }
    
    createCallNotification(callData) {
        // Create browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(`📞 ${callData.priority} Call Required`, {
                body: callData.message,
                icon: '/images/it-era-icon.png',
                tag: callData.id,
                requireInteraction: true
            });
            
            notification.onclick = () => {
                this.openCallInterface(callData);
                notification.close();
            };
        }
        
        // Send to team member's phone (if SMS integration available)
        if (window.ITERASMS && callData.assignedTo.phone) {
            const smsMessage = `📞 CALL REQUIRED: ${callData.message}. Respond ASAP. Call customer: ${callData.customerData.phone}`;
            
            window.ITERASMS.scheduleSMS('team_notification', {
                phone: callData.assignedTo.phone,
                name: callData.assignedTo.name,
                message: smsMessage
            });
        }
        
        // Create visual notification in dashboard
        this.createDashboardNotification(callData);
    }
    
    createDashboardNotification(callData) {
        const notification = document.createElement('div');
        notification.className = `call-notification priority-${callData.priority.toLowerCase()}`;
        notification.innerHTML = `
            <div class="call-notification-header">
                <span class="priority-badge ${callData.priority.toLowerCase()}">${callData.priority}</span>
                <span class="call-type">${callData.type.replace(/_/g, ' ').toUpperCase()}</span>
                <button class="close-btn" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="call-notification-body">
                <p class="call-message">${callData.message}</p>
                <div class="call-actions">
                    <button onclick="ITERACallFollowup.markCallCompleted('${callData.id}')" class="btn-complete">✅ Completed</button>
                    <button onclick="ITERACallFollowup.snoozeCall('${callData.id}', 30)" class="btn-snooze">⏰ Snooze 30min</button>
                    <button onclick="ITERACallFollowup.escalateCall('${callData.id}')" class="btn-escalate">🚨 Escalate</button>
                </div>
            </div>
            <div class="call-notification-footer">
                <small>Assigned to: ${callData.assignedTo.name} | ${callData.assignedTo.role}</small>
            </div>
        `;
        
        // Add to notifications container
        let container = document.getElementById('call-notifications');
        if (!container) {
            container = document.createElement('div');
            container.id = 'call-notifications';
            container.className = 'call-notifications-container';
            document.body.appendChild(container);
        }
        
        container.appendChild(notification);
        
        // Auto-remove low priority notifications after 5 minutes
        if (callData.priority === 'LOW') {
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300000);
        }
    }
    
    markCallCompleted(callId) {
        const callData = this.scheduledCalls.get(callId);
        if (callData) {
            callData.status = 'completed';
            callData.completedAt = new Date().toISOString();
            this.saveScheduledCalls();
            
            // Remove notification
            const notification = document.querySelector(`[data-call-id="${callId}"]`);
            if (notification) notification.remove();
            
            // Track completion
            if (window.ITERAAnalytics) {
                window.ITERAAnalytics.trackEvent('call_completed', {
                    call_id: callId,
                    call_type: callData.type,
                    attempts: callData.attempts
                });
            }
        }
    }
    
    snoozeCall(callId, minutes) {
        const callData = this.scheduledCalls.get(callId);
        if (callData) {
            callData.scheduledTime = Date.now() + (minutes * 60 * 1000);
            callData.status = 'scheduled';
            this.saveScheduledCalls();
            
            // Remove current notification
            const notification = document.querySelector(`[data-call-id="${callId}"]`);
            if (notification) notification.remove();
            
            console.log(`📞 Call snoozed: ${callId} for ${minutes} minutes`);
        }
    }
    
    escalateCall(callId) {
        const callData = this.scheduledCalls.get(callId);
        if (callData) {
            callData.priority = 'CRITICAL';
            callData.escalated = true;
            callData.escalatedAt = new Date().toISOString();
            
            // Reassign to emergency team
            callData.assignedTo = this.assignTeamMember('emergency_team');
            
            this.saveScheduledCalls();
            this.sendImmediateNotification(callData);
            
            console.log(`🚨 Call escalated: ${callId}`);
        }
    }
    
    sendImmediateNotification(callData) {
        // Send immediate SMS to assigned team member
        if (window.ITERASMS && callData.assignedTo.phone) {
            const urgentMessage = `🚨 URGENT CALL: ${callData.message}. Customer: ${callData.customerData.phone}. Respond immediately!`;
            
            window.ITERASMS.scheduleSMS('urgent_team_notification', {
                phone: callData.assignedTo.phone,
                name: callData.assignedTo.name,
                message: urgentMessage
            });
        }
        
        // Create high-priority browser notification
        if ('Notification' in window) {
            if (Notification.permission !== 'granted') {
                Notification.requestPermission();
            } else {
                new Notification('🚨 URGENT CALL REQUIRED', {
                    body: callData.message,
                    icon: '/images/it-era-urgent.png',
                    tag: 'urgent-' + callData.id,
                    requireInteraction: true
                });
            }
        }
    }
    
    formatDate(date) {
        return date.toLocaleDateString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
    
    generateCallId() {
        return 'call_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    saveScheduledCalls() {
        try {
            const data = Array.from(this.scheduledCalls.entries());
            localStorage.setItem('itera_scheduled_calls', JSON.stringify(data));
            localStorage.setItem('itera_call_history', JSON.stringify(this.callHistory));
        } catch (error) {
            console.error('Error saving scheduled calls:', error);
        }
    }
    
    loadScheduledCalls() {
        try {
            const callsData = localStorage.getItem('itera_scheduled_calls');
            if (callsData) {
                const callsArray = JSON.parse(callsData);
                this.scheduledCalls = new Map(callsArray);
            }
            
            const historyData = localStorage.getItem('itera_call_history');
            if (historyData) {
                this.callHistory = JSON.parse(historyData);
            }
        } catch (error) {
            console.error('Error loading scheduled calls:', error);
        }
    }
    
    // Admin methods
    getScheduledCalls() {
        return Array.from(this.scheduledCalls.entries());
    }
    
    getCallStats() {
        const stats = {
            total: this.scheduledCalls.size,
            scheduled: 0,
            active: 0,
            completed: 0,
            failed: 0,
            byPriority: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
            byType: {}
        };
        
        this.scheduledCalls.forEach((callData) => {
            stats[callData.status]++;
            stats.byPriority[callData.priority]++;
            
            if (!stats.byType[callData.type]) {
                stats.byType[callData.type] = 0;
            }
            stats.byType[callData.type]++;
        });
        
        return stats;
    }
    
    getCallHistory() {
        return this.callHistory;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.ITERACallFollowup = new ITERACallFollowup();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ITERACallFollowup;
}
