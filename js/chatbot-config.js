/**
 * IT-ERA Chatbot Configuration
 * Configurazione centralizzata per il sistema chatbot unificato
 */

window.ITERAChatbotConfig = {
    // Configurazione generale
    enabled: true,
    version: '2.0',
    debug: false,
    
    // Configurazione UI
    ui: {
        position: 'bottom-right',
        theme: 'it-era-professional',
        autoOpen: false,
        showWelcome: true,
        minimized: true,
        animations: true
    },
    
    // Configurazione AI
    ai: {
        enabled: true,
        provider: 'openai',
        model: 'gpt-4',
        maxTokens: 300,
        temperature: 0.7,
        timeout: 15000,
        maxRetries: 3,
        fallbackEnabled: true
    },
    
    // Rilevamento emergenze
    emergency: {
        enabled: true,
        autoDetect: true,
        keywords: [
            // Emergenze IT
            'emergenza', 'urgente', 'critico', 'bloccato', 'non funziona',
            'virus', 'hacker', 'rubati', 'perso', 'cancellato', 'rotto',
            'server down', 'rete down', 'backup', 'recupero dati',
            
            // Urgenza business
            'subito', 'immediatamente', 'ora', 'adesso', 'veloce',
            'aiuto', 'help', 'sos', 'panico', 'disperato',
            
            // Impatto business
            'bloccato', 'fermo', 'non posso lavorare', 'tutto fermo',
            'clienti', 'perdite', 'fatturato', 'business', 'produzione'
        ],
        threshold: 3, // Punteggio minimo per emergenza
        autoCall: false, // Non chiamare automaticamente
        showBanner: true
    },
    
    // Orari di lavoro
    businessHours: {
        timezone: 'Europe/Rome',
        weekdays: {
            start: 8,
            end: 18
        },
        saturday: {
            start: 9,
            end: 13
        },
        sunday: false,
        holidays: [] // Array di date in formato YYYY-MM-DD
    },
    
    // Lead capture
    leadCapture: {
        enabled: true,
        threshold: 3, // Dopo 3 messaggi
        fields: ['name', 'email', 'phone'],
        autoSend: true,
        thankYouMessage: true
    },
    
    // Analytics
    analytics: {
        enabled: true,
        trackConversations: true,
        trackEmergencies: true,
        trackLeads: true,
        trackPerformance: true,
        retentionDays: 90
    },
    
    // Integrazione Resend
    resend: {
        enabled: true,
        emergencyNotifications: true,
        leadNotifications: true,
        conversationSummary: false
    },
    
    // Messaggi predefiniti
    messages: {
        welcome: {
            businessHours: "Ciao! 👋 Sono l'assistente IT-ERA. Come posso aiutarti con i tuoi problemi informatici?",
            afterHours: "Ciao! 👋 Sono l'assistente IT-ERA. Siamo fuori orario, ma per emergenze chiama il 039 888 2041"
        },
        
        emergency: {
            detected: `🚨 <strong>EMERGENZA IT RILEVATA</strong><br><br>
                Ho capito che hai un problema urgente. Per le emergenze IT, il nostro team è disponibile 24/7.<br><br>
                <strong>📞 CHIAMA SUBITO: 039 888 2041</strong><br>
                <em>Risposta garantita entro 15 minuti</em><br><br>
                Nel frattempo, puoi anche:<br>
                • 📧 Scrivere a: info@it-era.it<br>
                • 💬 WhatsApp: +39 039 888 2041<br><br>
                <strong>Il nostro team ti contatterà immediatamente!</strong>`,
            
            banner: "Emergenza IT rilevata - Ti chiamiamo subito!"
        },
        
        fallback: `Mi dispiace, al momento non riesco a elaborare la tua richiesta. 😔<br><br>
            Per assistenza immediata, contatta il nostro team:<br><br>
            📞 <strong>Telefono: 039 888 2041</strong><br>
            📧 <strong>Email: info@it-era.it</strong><br><br>
            Siamo qui per aiutarti! 💪`,
        
        leadCapture: `Vedo che sei interessato ai nostri servizi! 😊<br><br>
            Lasciami i tuoi contatti per ricevere:<br>
            ✅ <strong>Consulenza gratuita personalizzata</strong><br>
            ✅ <strong>Preventivo su misura</strong><br>
            ✅ <strong>Chiamata entro 2 ore</strong>`,
        
        leadCaptured: `Perfetto! 🎉<br><br>
            I tuoi dati sono stati inviati al nostro team.<br>
            <strong>Ti chiamiamo entro 2 ore!</strong><br><br>
            Nel frattempo, per urgenze:<br>
            📞 <strong>039 888 2041</strong>`
    },
    
    // Risposte automatiche per parole chiave
    autoResponses: {
        // Saluti
        greetings: {
            keywords: ['ciao', 'salve', 'buongiorno', 'buonasera', 'hello', 'hi'],
            response: "Ciao! 👋 Sono l'assistente IT-ERA. Come posso aiutarti con i tuoi problemi informatici oggi?"
        },
        
        // Servizi
        services: {
            keywords: ['servizi', 'cosa fate', 'che servizi', 'assistenza'],
            response: `IT-ERA offre servizi completi di assistenza informatica:<br><br>
                🔧 <strong>Assistenza IT 24/7</strong><br>
                🛡️ <strong>Cybersecurity e Sicurezza</strong><br>
                ☁️ <strong>Cloud Storage e Backup</strong><br>
                📞 <strong>VoIP e Centralino Cloud</strong><br>
                🏥 <strong>Soluzioni per Studi Medici</strong><br>
                ⚖️ <strong>Soluzioni per Studi Legali</strong><br><br>
                Vuoi saperne di più su un servizio specifico?`
        },
        
        // Prezzi
        pricing: {
            keywords: ['prezzo', 'costo', 'preventivo', 'quanto costa', 'tariffe'],
            response: `Per un preventivo personalizzato, posso metterti in contatto con il nostro team commerciale:<br><br>
                📞 <strong>Chiama: 039 888 2041</strong><br>
                📧 <strong>Email: info@it-era.it</strong><br><br>
                La prima consulenza è sempre <strong>GRATUITA</strong>! 🎉<br><br>
                Vuoi che ti chiami un nostro consulente?`
        },
        
        // Contatti
        contacts: {
            keywords: ['contatti', 'telefono', 'email', 'dove siete', 'indirizzo'],
            response: `Ecco come puoi contattare IT-ERA:<br><br>
                📞 <strong>Telefono: 039 888 2041</strong><br>
                📧 <strong>Email: info@it-era.it</strong><br>
                📍 <strong>Sede: Viale Risorgimento 32, Vimercate MB</strong><br>
                🕒 <strong>Orari: Lun-Ven 8:00-18:00</strong><br>
                🚨 <strong>Emergenze: 24/7</strong><br><br>
                Per emergenze, chiama subito il nostro numero!`
        },
        
        // Problemi tecnici
        problems: {
            keywords: ['problema', 'non funziona', 'errore', 'guasto', 'rotto'],
            response: `Capisco che hai un problema tecnico. Per aiutarti al meglio:<br><br>
                🔍 <strong>Descrivi il problema in dettaglio</strong><br>
                💻 <strong>Che dispositivo stai usando?</strong><br>
                ⚠️ <strong>Quando è iniziato il problema?</strong><br><br>
                Per assistenza immediata:<br>
                📞 <strong>Chiama: 039 888 2041</strong><br><br>
                Il nostro team tecnico ti aiuterà subito!`
        },
        
        // Operatore
        operator: {
            keywords: ['operatore', 'persona', 'umano', 'parlare con qualcuno'],
            response: `Certo! Puoi parlare subito con un nostro operatore:<br><br>
                📞 <strong>Chiama: 039 888 2041</strong><br>
                📧 <strong>Email: info@it-era.it</strong><br><br>
                <strong>Orari operatori:</strong><br>
                🕒 Lun-Ven: 8:00-18:00<br>
                🚨 Emergenze: 24/7<br><br>
                Ti metto in contatto subito!`
        }
    },
    
    // Quick actions per il messaggio di benvenuto
    quickActions: [
        {
            text: "🚨 Emergenza IT",
            message: "Ho un'emergenza informatica urgente",
            type: "emergency"
        },
        {
            text: "💰 Preventivo",
            message: "Vorrei un preventivo per assistenza informatica",
            type: "quote"
        },
        {
            text: "🔧 Supporto",
            message: "Ho bisogno di supporto tecnico",
            type: "support"
        },
        {
            text: "👤 Operatore",
            message: "Voglio parlare con un operatore",
            type: "operator"
        }
    ],
    
    // Configurazione performance
    performance: {
        responseDelay: 1000, // Delay per simulare typing
        typingSpeed: 50, // ms per carattere
        maxMessageLength: 500,
        maxConversationLength: 50,
        cacheResponses: true,
        cacheTTL: 300000 // 5 minuti
    },
    
    // Configurazione sicurezza
    security: {
        sanitizeInput: true,
        maxRequestsPerMinute: 10,
        blockSuspiciousPatterns: true,
        logSuspiciousActivity: true
    }
};

// Esporta configurazione
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.ITERAChatbotConfig;
}
