/**
 * Teams Webhook Integration for IT-ERA Chatbot
 * Handles Microsoft Teams notifications for lead escalation
 */

class TeamsWebhook {
  constructor() {
    this.defaultWebhookUrl = "https://bulltechit.webhook.office.com/webhookb2/621e560e-86d9-478c-acfc-496624a88b79@f6ba30ad-37c0-41bf-a994-e434c59b4b2a/IncomingWebhook/fb2b1700f71c4806bdcbf0fc873952d0/c0aa99b7-8edb-41b4-b139-0ec4dd7864d5/V2l2_rh4MbAzeQQ4SpDifcMFLsktri3ocfMcQGZ6OHUmI1";
  }

  /**
   * Collect lead data from conversation context
   */
  collectLeadData(context, userMessage) {
    const leadData = context.leadData || {};
    
    return {
      // Basic lead information
      nome: leadData.contact_name || 'Lead da Chat AI',
      email: leadData.email || 'Non fornito',
      telefono: leadData.phone || 'Non fornito',
      azienda: leadData.company_name || 'Non specificata',
      comune: leadData.location || 'Non specificato',
      settore: leadData.sector || 'Non specificato',
      dipendenti: leadData.company_size || 'Non specificato',
      
      // Service information
      servizio: leadData.service_type || 'Non specificato',
      budget: leadData.budget_range || 'Non specificato',
      timeline: leadData.timeline || 'Non specificata',
      urgenza: leadData.urgency || 'normale',
      
      // Conversation context
      messaggio: userMessage?.message || 'Richiesta di contatto',
      sessionId: context.sessionId || 'unknown',
      messaggiScambiati: context.messageCount || 0,
      tipoEscalation: context.escalationType || 'user_request',
      priorita: context.priority || 'medium',
      
      // Timestamps
      dataRichiesta: new Date().toLocaleString('it-IT'),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate lead score for Teams display
   */
  calculateLeadScore(leadData) {
    let score = 0;
    
    // Geographic scoring - Massima priorità per Brianza
    const location = (leadData.comune || '').toLowerCase();
    if (location.includes('vimercate') || location.includes('agrate') || location.includes('concorezzo')) {
      score += 35;
    } else if (location.includes('monza') || location.includes('brianza') || location.includes('arcore')) {
      score += 25;
    } else if (location.includes('milano est') || location.includes('bergamo')) {
      score += 15;
    } else if (location.includes('milano')) {
      score += 8;
    }
    
    // Company size scoring
    const employees = (leadData.dipendenti || '').toLowerCase();
    if (employees.includes('50+') || employees.includes('100')) score += 30;
    else if (employees.includes('20-50') || employees.includes('25-50')) score += 25;
    else if (employees.includes('10-25') || employees.includes('15-')) score += 20;
    else if (employees.includes('5-15') || employees.includes('5-10')) score += 15;
    else if (employees.includes('1-5')) score += 5;
    
    // Budget scoring
    const budget = (leadData.budget || '').toLowerCase();
    if (budget.includes('30.000') || budget.includes('30000')) score += 25;
    else if (budget.includes('15.000') || budget.includes('15000')) score += 20;
    else if (budget.includes('5.000') || budget.includes('5000')) score += 15;
    else if (budget.includes('valutare')) score += 10;
    
    // Service scoring - Alto margine
    const service = (leadData.servizio || '').toLowerCase();
    if (service.includes('sicurezza') || service.includes('firewall') || service.includes('cybersecurity')) {
      score += 20;
    } else if (service.includes('server') || service.includes('cloud') || service.includes('backup')) {
      score += 18;
    } else if (service.includes('assistenza') || service.includes('contratto')) {
      score += 15;
    }
    
    // Urgency scoring
    const urgency = (leadData.urgenza || '').toLowerCase();
    if (urgency.includes('urgent') || urgency.includes('immediat') || urgency.includes('subito')) {
      score += 30;
    } else if (urgency.includes('settimana')) {
      score += 20;
    } else if (urgency.includes('mese')) {
      score += 10;
    }
    
    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Get lead quality indicator
   */
  getLeadQualityIndicator(score) {
    if (score >= 80) return { emoji: '🔥', label: 'PREMIUM', color: '#FF0000' };
    if (score >= 60) return { emoji: '⭐', label: 'ALTA', color: '#FF6600' };
    if (score >= 35) return { emoji: '✅', label: 'MEDIA', color: '#0078D4' };
    return { emoji: '📝', label: 'BASSA', color: '#00BCF2' };
  }

  /**
   * Create Teams card message - ENHANCED
   */
  createTeamsCard(leadData) {
    const urgencyColor = this.getUrgencyColor(leadData.priorita);
    const serviceIcon = this.getServiceIcon(leadData.servizio);
    const leadScore = this.calculateLeadScore(leadData);
    const qualityIndicator = this.getLeadQualityIndicator(leadScore);
    
    return {
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      "summary": `Nuovo Lead da AI Chatbot: ${leadData.azienda}`,
      "themeColor": urgencyColor,
      "sections": [
        {
          "activityTitle": `${qualityIndicator.emoji} LEAD QUALITÀ ${qualityIndicator.label} (${leadScore}/100) - ${leadData.servizio}`,
          "activitySubtitle": `${leadData.azienda} • ${leadData.settore} • ${leadData.comune} • Score: ${leadScore}`,
          "activityImage": "https://it-era.it/favicon-32x32.png",
          "facts": [
            {
              "name": "👤 Contatto:",
              "value": leadData.nome
            },
            {
              "name": "🏢 Azienda:",
              "value": `${leadData.azienda} (${leadData.dipendenti} dipendenti)`
            },
            {
              "name": "📍 Località:",
              "value": `${leadData.comune} • ${leadData.settore}`
            },
            {
              "name": "📧 Email:",
              "value": leadData.email
            },
            {
              "name": "📱 Telefono:",
              "value": leadData.telefono
            },
            {
              "name": "🎯 Servizio:",
              "value": leadData.servizio
            },
            {
              "name": "💰 Budget:",
              "value": leadData.budget
            },
            {
              "name": "⏰ Timeline:",
              "value": leadData.timeline
            },
            {
              "name": "🚨 Urgenza:",
              "value": leadData.urgenza
            },
            {
              "name": "💬 Messaggi:",
              "value": `${leadData.messaggiScambiati} nel chatbot`
            },
            {
              "name": "📅 Data Richiesta:",
              "value": leadData.dataRichiesta
            },
            {
              "name": `${qualityIndicator.emoji} Lead Score:`,
              "value": `**${leadScore}/100** - Qualità ${qualityIndicator.label}`
            }
          ],
          "text": `**Messaggio/Note:**\n${leadData.messaggio}`
        }
      ],
      "potentialAction": [
        {
          "@type": "OpenUri",
          "name": "📞 Chiama Subito",
          "targets": [
            {
              "os": "default",
              "uri": `tel:${leadData.telefono}`
            }
          ]
        },
        {
          "@type": "OpenUri", 
          "name": "📧 Invia Email",
          "targets": [
            {
              "os": "default",
              "uri": `mailto:${leadData.email}?subject=IT-ERA: Risposta alla tua richiesta ${leadData.servizio}&body=Gentile ${leadData.nome},%0A%0AGrazie per averci contattato tramite il nostro chatbot.%0A%0A[Personalizza il messaggio]%0A%0ACordiali saluti,%0ATeam IT-ERA`
            }
          ]
        },
        {
          "@type": "OpenUri",
          "name": "🌐 Vai al Chatbot",
          "targets": [
            {
              "os": "default", 
              "uri": "https://it-era.it"
            }
          ]
        }
      ]
    };
  }

  /**
   * Get urgency color for Teams card
   */
  getUrgencyColor(priority) {
    const colors = {
      'immediate': '#FF0000', // Red
      'high': '#FF6600',     // Orange
      'medium': '#0078D4',   // Blue
      'low': '#00BCF2'       // Light Blue
    };
    return colors[priority] || colors.medium;
  }

  /**
   * Get service icon
   */
  getServiceIcon(service) {
    const icons = {
      'Sito Web': '🌐',
      'E-commerce': '🛒',
      'App Mobile': '📱',
      'Server/Cloud': '☁️',
      'Cybersecurity': '🔒',
      'Assistenza IT': '🔧'
    };
    return icons[service] || '💼';
  }

  /**
   * Send notification to Teams
   */
  async sendTeamsNotification(leadData, webhookUrl = null) {
    const url = webhookUrl || this.defaultWebhookUrl;
    
    if (!url) {
      console.warn('Teams webhook URL not configured');
      return { success: false, error: 'Webhook URL not configured' };
    }

    try {
      const card = this.createTeamsCard(leadData);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(card)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Teams API Error: ${response.status} - ${errorText}`);
      }

      console.log(`Teams notification sent successfully for: ${leadData.azienda}`);
      return { 
        success: true, 
        data: {
          company: leadData.azienda,
          service: leadData.servizio,
          priority: leadData.priorita,
          timestamp: leadData.timestamp
        }
      };

    } catch (error) {
      console.error('Teams notification failed:', error);
      return { 
        success: false, 
        error: error.message,
        leadData: leadData.azienda 
      };
    }
  }

  /**
   * Send simple test notification
   */
  async sendTestNotification(webhookUrl = null) {
    const testData = {
      nome: 'Test Lead',
      azienda: 'Test Company',
      settore: 'Testing',
      comune: 'Milano',
      email: 'test@example.com',
      telefono: '+39 123 456 789',
      servizio: 'Sito Web',
      budget: '€5.000-€15.000',
      timeline: '2-3 mesi',
      urgenza: 'medium',
      messaggio: 'Questo è un test del sistema di notifiche Teams',
      sessionId: 'test_session',
      messaggiScambiati: 5,
      tipoEscalation: 'test',
      priorita: 'medium',
      dipendenti: '10-25',
      dataRichiesta: new Date().toLocaleString('it-IT'),
      timestamp: new Date().toISOString()
    };

    return await this.sendTeamsNotification(testData, webhookUrl);
  }
}

// Export singleton instance
const teamsWebhook = new TeamsWebhook();

// Make available globally for chatbot-worker.js
globalThis.TeamsWebhook = teamsWebhook;

export default teamsWebhook;