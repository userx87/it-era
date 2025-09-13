/**
 * Configurazione Resend.com per IT-ERA
 * IMPORTANTE: Sostituire con la chiave API reale
 */

// Configurazione Resend
window.RESEND_CONFIG = {
    // SOSTITUIRE CON LA CHIAVE REALE DA RESEND.COM
    apiKey: 're_123456789_YOUR_RESEND_API_KEY_HERE',
    
    // Email settings
    fromEmail: 'noreply@it-era.it',
    toEmail: 'info@it-era.it',
    
    // API settings
    apiUrl: 'https://api.resend.com/emails',
    timeout: 15000,
    
    // Fallback settings
    fallbackEmail: 'info@it-era.it',
    fallbackPhone: '039 888 2041'
};

// Funzione per aggiornare la configurazione nell'integrazione
if (window.ITERAResendIntegration) {
    // Se l'integrazione è già caricata, aggiorna la config
    const integration = new ITERAResendIntegration();
    integration.config.resendApiKey = window.RESEND_CONFIG.apiKey;
    integration.config.fromEmail = window.RESEND_CONFIG.fromEmail;
    integration.config.toEmail = window.RESEND_CONFIG.toEmail;
    integration.config.resendApiUrl = window.RESEND_CONFIG.apiUrl;
    integration.config.timeout = window.RESEND_CONFIG.timeout;
}

console.log('🔧 Resend configuration loaded for IT-ERA');
