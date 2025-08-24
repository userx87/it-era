/**
 * Enhanced Teams Integration for IT-ERA AI Chatbot
 * Advanced webhook notifications with rich formatting and intelligent routing
 * 
 * FEATURES:
 * ✅ Rich Teams cards with actionable buttons
 * ✅ Priority-based message routing to different channels  
 * ✅ Lead qualification visual indicators
 * ✅ Geographic zone recognition and targeting
 * ✅ Service-specific routing and expertise matching
 * ✅ Escalation tracking and response monitoring
 * ✅ Analytics integration and performance metrics
 */

export class TeamsIntegrationEnhanced {
  constructor(config = {}) {
    this.config = {
      // Teams webhook URLs for different priorities/teams
      webhooks: {
        emergency: config.emergencyWebhook,
        high_priority: config.highPriorityWebhook, 
        sales_team: config.salesWebhook,
        technical_team: config.technicalWebhook,
        general: config.generalWebhook || config.teamsWebhookUrl
      },
      
      // Notification settings
      enableRichCards: config.enableRichCards || true,
      enableActionButtons: config.enableActionButtons || true,
      enableFollowUpReminders: config.enableFollowUpReminders || true,
      
      // Response tracking
      responseTimeouts: {
        emergency: 2 * 60 * 60 * 1000, // 2 hours
        high_priority: 4 * 60 * 60 * 1000, // 4 hours  
        medium_priority: 8 * 60 * 60 * 1000, // 8 hours
        low_priority: 24 * 60 * 60 * 1000 // 24 hours
      },
      
      ...config
    };

    // Initialize tracking
    this.sentNotifications = new Map();
    this.responseTracking = new Map();
    
    // Team expertise mapping
    this.teamExpertise = this.initializeTeamExpertise();
    
    // Message templates
    this.messageTemplates = this.initializeMessageTemplates();
  }

  /**
   * =====================================================
   * INITIALIZATION
   * =====================================================
   */

  initializeTeamExpertise() {
    return {
      cybersecurity: {
        primaryTeam: 'technical_team',
        specialists: ['Marco (WatchGuard)', 'Luca (Security)'],
        escalationLevel: 'high'
      },
      
      server_infrastructure: {
        primaryTeam: 'technical_team', 
        specialists: ['Andrea (Server)', 'Giuseppe (Cloud)'],
        escalationLevel: 'high'
      },
      
      it_support: {
        primaryTeam: 'general',
        specialists: ['Tecnico di turno'],
        escalationLevel: 'medium'
      },
      
      sales_inquiries: {
        primaryTeam: 'sales_team',
        specialists: ['Commerciale senior'],
        escalationLevel: 'medium'
      },
      
      emergency: {
        primaryTeam: 'emergency',
        specialists: ['Responsabile tecnico', 'Reperibilità'],
        escalationLevel: 'immediate'
      }
    };
  }

  initializeMessageTemplates() {
    return {
      lead_notification: {
        emergency: this.createEmergencyLeadTemplate(),
        high_priority: this.createHighPriorityLeadTemplate(),
        medium_priority: this.createMediumPriorityLeadTemplate(),
        low_priority: this.createLowPriorityLeadTemplate()
      },
      
      follow_up_reminder: this.createFollowUpTemplate(),
      escalation_alert: this.createEscalationAlertTemplate(),
      conversion_report: this.createConversionReportTemplate()
    };
  }

  /**
   * =====================================================
   * MAIN NOTIFICATION METHODS
   * =====================================================
   */

  /**
   * Send lead notification to Teams
   */
  async sendLeadNotification(leadData, conversationContext, escalationData) {
    try {
      // Determine priority and routing
      const priority = this.determinePriority(leadData, escalationData);
      const targetTeam = this.determineTargetTeam(leadData, escalationData);
      const webhook = this.config.webhooks[targetTeam] || this.config.webhooks.general;
      
      if (!webhook) {
        throw new Error(`No webhook configured for team: ${targetTeam}`);
      }

      // Create rich Teams message
      const teamsMessage = await this.createLeadMessage(
        leadData, 
        conversationContext, 
        escalationData, 
        priority
      );

      // Send notification
      const response = await this.sendToTeams(webhook, teamsMessage);
      
      // Track notification
      const notificationId = this.trackNotification({
        leadData,
        priority,
        targetTeam,
        webhook,
        sentAt: Date.now(),
        expectedResponse: Date.now() + this.config.responseTimeouts[priority]
      });

      // Schedule follow-up if enabled
      if (this.config.enableFollowUpReminders) {
        this.scheduleFollowUp(notificationId, priority);
      }

      return {
        success: true,
        notificationId,
        priority,
        targetTeam,
        sentAt: Date.now()
      };

    } catch (error) {
      console.error('Teams notification error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send emergency notification
   */
  async sendEmergencyNotification(emergencyData, conversationContext) {
    const webhook = this.config.webhooks.emergency || this.config.webhooks.general;
    
    const emergencyMessage = {
      "@type": "MessageCard",
      "summary": `🚨 EMERGENZA IT - ${emergencyData.company_name || 'URGENTE'}`,
      "themeColor": "FF0000", // Red for emergency
      "sections": [{
        "activityTitle": "🚨 EMERGENZA INFORMATICA",
        "activitySubtitle": `${emergencyData.company_name || 'Cliente'} - INTERVENTO IMMEDIATO`,
        "activityImage": "https://img.icons8.com/color/96/000000/error--v1.png",
        "facts": [
          {
            "name": "🏢 Azienda",
            "value": emergencyData.company_name || 'Da contattare'
          },
          {
            "name": "📞 Telefono", 
            "value": emergencyData.phone || 'Non fornito'
          },
          {
            "name": "📍 Zona",
            "value": emergencyData.location || 'Da definire'
          },
          {
            "name": "🚨 Tipo emergenza",
            "value": emergencyData.emergency_type || 'Problema critico'
          },
          {
            "name": "⏰ Ricevuta alle",
            "value": new Date().toLocaleString('it-IT')
          },
          {
            "name": "📱 Session ID",
            "value": conversationContext.sessionId
          }
        ],
        "text": `**ATTENZIONE**: Richiesta di intervento immediato ricevuta dal chatbot. Cliente in attesa di contatto urgente.`
      }],
      "potentialAction": [{
        "@type": "ActionCard",
        "name": "Azioni Immediate",
        "actions": [{
          "@type": "HttpPOST",
          "name": "📞 Preso in carico",
          "target": `${this.config.callbackUrl || 'http://localhost'}/webhook/emergency-response`,
          "body": JSON.stringify({
            sessionId: conversationContext.sessionId,
            action: 'emergency_taken',
            timestamp: Date.now()
          })
        }, {
          "@type": "OpenUri",
          "name": "📱 Chiama subito",
          "targets": [{
            "os": "default",
            "uri": `tel:${emergencyData.phone}`
          }]
        }]
      }]
    };

    return await this.sendToTeams(webhook, emergencyMessage);
  }

  /**
   * =====================================================
   * MESSAGE CREATION
   * =====================================================
   */

  /**
   * Create comprehensive lead message for Teams
   */
  async createLeadMessage(leadData, conversationContext, escalationData, priority) {
    const template = this.messageTemplates.lead_notification[priority];
    const geographic = this.analyzeGeographic(leadData.location);
    const serviceExpertise = this.getServiceExpertise(leadData.service_interest);
    
    // Calculate lead score and quality indicators
    const leadScore = this.calculateLeadScore(leadData, conversationContext);
    const qualityIndicators = this.getQualityIndicators(leadScore, leadData);

    const message = {
      "@type": "MessageCard",
      "summary": `${this.getPriorityEmoji(priority)} Nuovo Lead IT-ERA: ${leadData.company_name || 'Lead qualificato'}`,
      "themeColor": this.getPriorityColor(priority),
      "sections": [
        {
          "activityTitle": `${this.getPriorityEmoji(priority)} **NUOVO LEAD ${priority.toUpperCase()}**`,
          "activitySubtitle": `${leadData.company_name || 'Lead B2B'} - ${geographic.zone} - Score: ${leadScore}/100`,
          "activityImage": this.getLeadTypeIcon(leadData),
          "facts": [
            {
              "name": "🏢 Azienda",
              "value": leadData.company_name || 'Non specificata'
            },
            {
              "name": "👤 Contatto",
              "value": `${leadData.contact_name || 'N/A'}${leadData.email ? ` (${leadData.email})` : ''}`
            },
            {
              "name": "📞 Telefono",
              "value": leadData.phone || 'Da richiedere'
            },
            {
              "name": "📍 Zona",
              "value": `${leadData.location || 'Non specificata'} ${geographic.zoneEmoji}`
            },
            {
              "name": "🎯 Servizio richiesto", 
              "value": leadData.service_interest || 'Da definire'
            },
            {
              "name": "👥 Dimensioni azienda",
              "value": leadData.company_size || 'N/A'
            },
            {
              "name": "⏰ Timeline",
              "value": leadData.timeline || 'Non specificata'
            },
            {
              "name": "📊 Lead Score",
              "value": `${leadScore}/100 ${qualityIndicators.scoreEmoji}`
            },
            {
              "name": "🎪 Conversation ID",
              "value": conversationContext.sessionId?.substring(0, 8).toUpperCase() || 'N/A'
            }
          ],
          "text": this.generateLeadSummaryText(leadData, geographic, qualityIndicators)
        },
        
        // Service expertise section
        ...(serviceExpertise.specialists ? [{
          "activityTitle": "👨‍💻 **Team Suggerito**",
          "facts": [
            {
              "name": "Specialisti",
              "value": serviceExpertise.specialists.join(', ')
            },
            {
              "name": "Expertise",
              "value": serviceExpertise.expertise || leadData.service_interest
            }
          ]
        }] : []),

        // Geographic insights section
        {
          "activityTitle": "📍 **Analisi Geografica**",
          "facts": [
            {
              "name": "Zona operativa",
              "value": geographic.operationalZone
            },
            {
              "name": "Tempi intervento",
              "value": geographic.responseTime
            },
            {
              "name": "Priorità geografica",
              "value": geographic.priority
            }
          ]
        }
      ],
      "potentialAction": this.createActionButtons(leadData, conversationContext, priority)
    };

    return message;
  }

  /**
   * =====================================================
   * MESSAGE TEMPLATES
   * =====================================================
   */

  createEmergencyLeadTemplate() {
    return {
      color: "FF0000",
      emoji: "🚨", 
      title: "EMERGENZA IT",
      urgency: "MASSIMA"
    };
  }

  createHighPriorityLeadTemplate() {
    return {
      color: "FFA500",
      emoji: "🔥",
      title: "LEAD ALTA PRIORITÀ", 
      urgency: "ALTA"
    };
  }

  createMediumPriorityLeadTemplate() {
    return {
      color: "FFD700",
      emoji: "⭐",
      title: "LEAD QUALIFICATO",
      urgency: "MEDIA"
    };
  }

  createLowPriorityLeadTemplate() {
    return {
      color: "87CEEB",
      emoji: "📝",
      title: "NUOVO CONTATTO",
      urgency: "BASSA"
    };
  }

  /**
   * =====================================================
   * UTILITY METHODS
   * =====================================================
   */

  determinePriority(leadData, escalationData) {
    if (escalationData?.type === 'emergency') return 'emergency';
    if (escalationData?.priority === 'immediate') return 'emergency';
    if (escalationData?.priority === 'high') return 'high_priority';
    
    // Score-based priority
    const score = this.calculateLeadScore(leadData);
    if (score >= 85) return 'high_priority';
    if (score >= 60) return 'medium_priority';
    return 'low_priority';
  }

  determineTargetTeam(leadData, escalationData) {
    // Emergency routing
    if (escalationData?.type === 'emergency') return 'emergency';
    
    // Service-based routing
    const service = leadData.service_interest?.toLowerCase() || '';
    if (service.includes('sicurezza') || service.includes('firewall')) return 'technical_team';
    if (service.includes('server') || service.includes('cloud')) return 'technical_team';
    if (service.includes('preventivo') || service.includes('vendita')) return 'sales_team';
    
    return 'general';
  }

  calculateLeadScore(leadData, conversationContext = {}) {
    let score = 0;

    // Company size (30 points max)
    if (leadData.company_size?.includes('50+')) score += 30;
    else if (leadData.company_size?.includes('31-50')) score += 25;
    else if (leadData.company_size?.includes('16-30')) score += 20;
    else if (leadData.company_size?.includes('6-15')) score += 15;
    else if (leadData.company_size?.includes('1-5')) score += 10;

    // Geographic (25 points max)
    const location = leadData.location?.toLowerCase() || '';
    if (['vimercate', 'agrate', 'concorezzo'].some(city => location.includes(city))) {
      score += 25;
    } else if (['monza', 'brianza'].some(area => location.includes(area))) {
      score += 20;
    } else if (location.includes('milano')) {
      score += 15;
    }

    // Service type (20 points max)
    const service = leadData.service_interest?.toLowerCase() || '';
    if (service.includes('sicurezza') || service.includes('firewall')) score += 20;
    else if (service.includes('server') || service.includes('cloud')) score += 18;
    else if (service.includes('assistenza') || service.includes('contratto')) score += 15;

    // Timeline urgency (15 points max)
    const timeline = leadData.timeline?.toLowerCase() || '';
    if (timeline.includes('urgent') || timeline.includes('emergenza')) score += 15;
    else if (timeline.includes('1 mese')) score += 10;
    else if (timeline.includes('3 mesi')) score += 5;

    // Complete contact data (10 points max)
    if (leadData.contact_name) score += 3;
    if (leadData.phone) score += 4;
    if (leadData.email) score += 3;

    return Math.min(score, 100);
  }

  analyzeGeographic(location) {
    if (!location) return {
      zone: 'Non specificata',
      zoneEmoji: '❓',
      operationalZone: 'Da definire',
      responseTime: 'Da valutare',
      priority: 'Standard'
    };

    const loc = location.toLowerCase();
    
    if (['vimercate', 'agrate', 'concorezzo'].some(city => loc.includes(city))) {
      return {
        zone: 'Vimercate Area (Premium)',
        zoneEmoji: '🎯',
        operationalZone: 'Zona primaria',
        responseTime: 'Stesso giorno garantito',
        priority: 'MASSIMA'
      };
    }
    
    if (['monza', 'arcore', 'brianza'].some(area => loc.includes(area))) {
      return {
        zone: 'Monza/Brianza',
        zoneEmoji: '🏆',
        operationalZone: 'Zona coperta',
        responseTime: 'Entro 24-48 ore',
        priority: 'ALTA'
      };
    }
    
    if (loc.includes('milano')) {
      return {
        zone: 'Milano',
        zoneEmoji: '🏙️',
        operationalZone: 'Zona estesa',
        responseTime: 'Entro 72 ore',
        priority: 'MEDIA'
      };
    }

    return {
      zone: 'Altre zone',
      zoneEmoji: '🌍',
      operationalZone: 'Fuori zona principale',
      responseTime: 'Assistenza remota prioritaria',
      priority: 'BASSA'
    };
  }

  getServiceExpertise(serviceInterest) {
    if (!serviceInterest) return {};
    
    const service = serviceInterest.toLowerCase();
    
    if (service.includes('sicurezza') || service.includes('firewall')) {
      return {
        specialists: ['Marco Rossi (WatchGuard)', 'Luca Bianchi (Security)'],
        expertise: 'Cybersecurity e Firewall',
        priority: 'ALTA'
      };
    }
    
    if (service.includes('server') || service.includes('cloud')) {
      return {
        specialists: ['Andrea Verdi (Infrastrutture)', 'Giuseppe Neri (Cloud)'],
        expertise: 'Server e Infrastrutture',
        priority: 'ALTA'  
      };
    }
    
    return {
      specialists: ['Team IT-ERA'],
      expertise: 'Assistenza generale',
      priority: 'STANDARD'
    };
  }

  getQualityIndicators(score, leadData) {
    let scoreEmoji = '🟢';
    let qualityText = 'OTTIMO';
    
    if (score >= 85) {
      scoreEmoji = '🔥';
      qualityText = 'ECCELLENTE';
    } else if (score >= 70) {
      scoreEmoji = '🟢';
      qualityText = 'MOLTO BUONO';
    } else if (score >= 50) {
      scoreEmoji = '🟡';
      qualityText = 'BUONO';
    } else {
      scoreEmoji = '🔴';
      qualityText = 'DA VALUTARE';
    }

    return { scoreEmoji, qualityText, score };
  }

  generateLeadSummaryText(leadData, geographic, qualityIndicators) {
    const completeness = this.calculateDataCompleteness(leadData);
    
    return `**Lead ${qualityIndicators.qualityText}** ricevuto dal chatbot IT-ERA. 
    
**Completezza dati:** ${completeness}% 
**Zona:** ${geographic.priority} priorità
**Azione richiesta:** ${this.getRequiredAction(leadData, qualityIndicators)}

*Generato automaticamente dal sistema AI Conversation Designer*`;
  }

  calculateDataCompleteness(leadData) {
    const fields = ['company_name', 'contact_name', 'phone', 'email', 'location', 'service_interest'];
    const completedFields = fields.filter(field => leadData[field] && leadData[field].trim()).length;
    return Math.round((completedFields / fields.length) * 100);
  }

  getRequiredAction(leadData, qualityIndicators) {
    if (qualityIndicators.score >= 85) return 'CONTATTO IMMEDIATO';
    if (qualityIndicators.score >= 70) return 'Contatto entro 2-4 ore';
    if (qualityIndicators.score >= 50) return 'Follow-up entro 8 ore';
    return 'Qualificazione aggiuntiva';
  }

  createActionButtons(leadData, conversationContext, priority) {
    const buttons = [];

    // Call button if phone available
    if (leadData.phone) {
      buttons.push({
        "@type": "OpenUri",
        "name": "📞 Chiama subito",
        "targets": [{
          "os": "default",
          "uri": `tel:${leadData.phone}`
        }]
      });
    }

    // Email button if email available  
    if (leadData.email) {
      buttons.push({
        "@type": "OpenUri",
        "name": "📧 Invia email",
        "targets": [{
          "os": "default",
          "uri": `mailto:${leadData.email}?subject=Re: Richiesta servizi IT-ERA&body=Gentile ${leadData.contact_name || 'Cliente'},%0D%0AGrazie per aver contattato IT-ERA...`
        }]
      });
    }

    // CRM integration button
    if (this.config.crmIntegrationUrl) {
      buttons.push({
        "@type": "HttpPOST",
        "name": "💼 Aggiungi a CRM",
        "target": this.config.crmIntegrationUrl,
        "body": JSON.stringify({
          leadData,
          conversationId: conversationContext.sessionId,
          source: 'ai-chatbot'
        })
      });
    }

    // Response tracking button
    buttons.push({
      "@type": "HttpPOST", 
      "name": "✅ Preso in carico",
      "target": `${this.config.callbackUrl || 'http://localhost'}/webhook/lead-response`,
      "body": JSON.stringify({
        sessionId: conversationContext.sessionId,
        action: 'lead_taken',
        priority: priority,
        timestamp: Date.now()
      })
    });

    return [{
      "@type": "ActionCard",
      "name": "Azioni Disponibili",
      "actions": buttons
    }];
  }

  getPriorityEmoji(priority) {
    const emojis = {
      emergency: '🚨',
      high_priority: '🔥',
      medium_priority: '⭐',
      low_priority: '📝'
    };
    return emojis[priority] || '📝';
  }

  getPriorityColor(priority) {
    const colors = {
      emergency: 'FF0000',
      high_priority: 'FFA500', 
      medium_priority: 'FFD700',
      low_priority: '87CEEB'
    };
    return colors[priority] || '87CEEB';
  }

  getLeadTypeIcon(leadData) {
    const service = leadData.service_interest?.toLowerCase() || '';
    
    if (service.includes('sicurezza') || service.includes('firewall')) {
      return 'https://img.icons8.com/color/96/000000/security-checked.png';
    }
    if (service.includes('server') || service.includes('cloud')) {
      return 'https://img.icons8.com/color/96/000000/server.png';
    }
    if (service.includes('assistenza')) {
      return 'https://img.icons8.com/color/96/000000/technical-support.png';
    }
    
    return 'https://img.icons8.com/color/96/000000/business.png';
  }

  /**
   * =====================================================
   * NOTIFICATION TRACKING
   * =====================================================
   */

  trackNotification(notificationData) {
    const notificationId = `teams_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    this.sentNotifications.set(notificationId, {
      ...notificationData,
      id: notificationId,
      status: 'sent',
      responses: []
    });

    return notificationId;
  }

  scheduleFollowUp(notificationId, priority) {
    const timeout = this.config.responseTimeouts[priority];
    
    setTimeout(() => {
      this.sendFollowUpReminder(notificationId);
    }, timeout);
  }

  async sendFollowUpReminder(notificationId) {
    const notification = this.sentNotifications.get(notificationId);
    if (!notification || notification.responded) return;

    const followUpMessage = {
      "@type": "MessageCard",
      "summary": "🔔 Follow-up: Lead IT-ERA non gestito",
      "themeColor": "FFA500",
      "sections": [{
        "activityTitle": "🔔 **FOLLOW-UP REMINDER**",
        "activitySubtitle": `Lead ${notification.leadData.company_name || 'IT-ERA'} in attesa di risposta`,
        "facts": [
          {
            "name": "Lead originale",
            "value": notification.leadData.company_name || 'N/A'
          },
          {
            "name": "Priorità",
            "value": notification.priority.toUpperCase()
          },
          {
            "name": "Inviato",
            "value": new Date(notification.sentAt).toLocaleString('it-IT')
          },
          {
            "name": "In attesa da",
            "value": this.getTimeDifference(notification.sentAt)
          }
        ],
        "text": "⚠️ Questo lead non ha ancora ricevuto risposta nei tempi previsti. Verifica se è stato preso in carico."
      }]
    };

    const webhook = this.config.webhooks[notification.targetTeam] || this.config.webhooks.general;
    await this.sendToTeams(webhook, followUpMessage);
  }

  /**
   * =====================================================
   * TEAMS COMMUNICATION
   * =====================================================
   */

  async sendToTeams(webhook, message) {
    if (!webhook) {
      throw new Error('Teams webhook URL not configured');
    }

    try {
      const response = await fetch(webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message)
      });

      if (!response.ok) {
        throw new Error(`Teams webhook failed: ${response.status} ${response.statusText}`);
      }

      return {
        success: true,
        status: response.status,
        sentAt: Date.now()
      };

    } catch (error) {
      console.error('Teams webhook error:', error);
      throw error;
    }
  }

  /**
   * =====================================================
   * UTILITY METHODS
   * =====================================================
   */

  getTimeDifference(timestamp) {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes} minuti`;
  }

  /**
   * Handle webhook responses (for tracking)
   */
  handleWebhookResponse(data) {
    const { sessionId, action, timestamp } = data;
    
    // Find notification by session ID
    for (const [notificationId, notification] of this.sentNotifications) {
      if (notification.leadData.sessionId === sessionId) {
        notification.responded = true;
        notification.responseTime = timestamp - notification.sentAt;
        notification.responses.push({
          action,
          timestamp,
          responseTime: notification.responseTime
        });
        break;
      }
    }
  }

  /**
   * Get notification statistics
   */
  getNotificationStats() {
    const notifications = Array.from(this.sentNotifications.values());
    
    return {
      total: notifications.length,
      responded: notifications.filter(n => n.responded).length,
      pending: notifications.filter(n => !n.responded).length,
      averageResponseTime: this.calculateAverageResponseTime(notifications),
      responseRateByPriority: this.calculateResponseRateByPriority(notifications)
    };
  }

  calculateAverageResponseTime(notifications) {
    const responded = notifications.filter(n => n.responded && n.responseTime);
    if (responded.length === 0) return 0;
    
    const totalTime = responded.reduce((sum, n) => sum + n.responseTime, 0);
    return Math.round(totalTime / responded.length / (60 * 1000)); // Minutes
  }

  calculateResponseRateByPriority(notifications) {
    const byPriority = {};
    
    notifications.forEach(n => {
      if (!byPriority[n.priority]) {
        byPriority[n.priority] = { total: 0, responded: 0 };
      }
      byPriority[n.priority].total++;
      if (n.responded) byPriority[n.priority].responded++;
    });

    Object.keys(byPriority).forEach(priority => {
      const data = byPriority[priority];
      data.rate = data.total > 0 ? data.responded / data.total : 0;
    });

    return byPriority;
  }

  createFollowUpTemplate() {
    return {
      color: "FFA500",
      title: "Follow-up Reminder",
      urgency: "REMINDER"
    };
  }

  createEscalationAlertTemplate() {
    return {
      color: "FF0000", 
      title: "Escalation Alert",
      urgency: "ALERT"
    };
  }

  createConversionReportTemplate() {
    return {
      color: "00FF00",
      title: "Conversion Report", 
      urgency: "INFO"
    };
  }
}

export default TeamsIntegrationEnhanced;