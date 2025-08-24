# 🚀 Integrazione Chatbot IT-ERA nel Sito Web

## 📋 **INSTALLAZIONE RAPIDA (2 minuti)**

### **STEP 1: Copia il codice di integrazione**

Aggiungi questo codice prima del tag `</body>` in **TUTTE le pagine** del sito:

```html
<!-- IT-ERA Chatbot Integration -->
<script src="https://it-era-chatbot.bulltech.workers.dev/static/universal-chatbot-script.js" defer></script>

<!-- ALTERNATIVA: Codice inline (se preferisci non dipendere da file esterno) -->
<script>
// Inserisci qui tutto il contenuto di universal-chatbot-script.js
</script>
```

### **STEP 2: Configura l'endpoint API**

Nel file `universal-chatbot-script.js`, aggiorna la riga:

```javascript
apiEndpoint: 'https://TUO-WORKER-DEPLOYATO.workers.dev/api/chat',
```

Con il tuo endpoint effettivo del chatbot deployato.

---

## 🎯 **INTEGRAZIONE DETTAGLIATA**

### **1. Homepage (index.html)**
```html
<!DOCTYPE html>
<html>
<head>
    <title>IT-ERA - Servizi IT Professionali Vimercate</title>
    <!-- Altri meta tags -->
</head>
<body>
    <!-- Contenuto della pagina -->
    
    <!-- CHATBOT: Aggiungi prima di </body> -->
    <script src="https://it-era-chatbot.bulltech.workers.dev/static/universal-chatbot-script.js" defer></script>
</body>
</html>
```

### **2. Pagina Servizi**
```html
<!-- servizi.html o servizi/index.html -->
<body>
    <!-- Contenuto servizi -->
    
    <!-- Chatbot con configurazione specifica per servizi -->
    <script>
        // Opzionale: configura comportamento per pagina servizi
        window.ITERAChatbotPageConfig = {
            autoOpen: true, // Si apre automaticamente dopo 10s
            welcomeMessage: '🛠️ Ciao! Quale servizio IT ti interessa?',
            suggestedQuestions: [
                '🔒 Sicurezza informatica',
                '💾 Backup e recovery',
                '🛠️ Assistenza IT',
                '💰 Preventivo gratuito'
            ]
        };
    </script>
    <script src="https://it-era-chatbot.bulltech.workers.dev/static/universal-chatbot-script.js" defer></script>
</body>
</html>
```

### **3. Pagina Contatti**
```html
<!-- contatti.html -->
<body>
    <!-- Form contatti esistente -->
    
    <!-- Chatbot con focus su contatto immediato -->
    <script>
        window.ITERAChatbotPageConfig = {
            autoOpen: false,
            showNotificationAfter: 5000, // Mostra badge dopo 5s
            welcomeMessage: '📞 Vuoi parlarci subito? Chiama 039 888 2041 o chatta qui!'
        };
    </script>
    <script src="https://it-era-chatbot.bulltech.workers.dev/static/universal-chatbot-script.js" defer></script>
</body>
</html>
```

---

## ⚙️ **CONFIGURAZIONE PERSONALIZZATA**

### **Opzioni Principali**
```javascript
const ITERA_CHATBOT_CONFIG = {
    // API
    apiEndpoint: 'https://tuo-worker.workers.dev/api/chat',
    
    // Posizionamento
    position: 'bottom-right', // bottom-left, top-right, custom
    
    // Comportamento
    autoOpen: false,          // true = si apre dopo 10 secondi
    showOnPages: ['all'],     // ['all'] o ['index.html', 'servizi.html']
    hiddenOnMobile: false,    // true = nasconde su mobile
    
    // Stile
    theme: 'it-era',          // it-era, dark, light
    primaryColor: '#2563eb',  // Colore principale IT-ERA
    
    // Tracking
    trackEvents: true,
    gaTrackingId: 'GA_MEASUREMENT_ID', // Google Analytics 4
};
```

### **Configurazione Per Pagina**
Puoi personalizzare il comportamento per pagine specifiche:

```html
<script>
    // Configurazione specifica per questa pagina
    window.ITERAChatbotPageConfig = {
        autoOpen: true,
        welcomeMessage: 'Messaggio personalizzato per questa pagina',
        suggestedQuestions: ['Domanda 1', 'Domanda 2'],
        priority: 'high' // Tutte le richieste da questa pagina sono priorità alta
    };
</script>
<script src="chatbot-script.js"></script>
```

---

## 📱 **RESPONSIVE E MOBILE**

Il chatbot è **completamente responsive**:
- **Desktop**: Finestra 380x500px in basso a destra
- **Tablet**: Si adatta automaticamente
- **Mobile**: Finestra full-width, altezza ridotta

```css
/* Personalizzazioni CSS opzionali */
@media (max-width: 768px) {
    #it-era-chatbot-window {
        height: 400px !important; /* Altezza mobile */
        bottom: 70px !important;   /* Spazio per navbar mobile */
    }
}
```

---

## 🎨 **PERSONALIZZAZIONE STILE**

### **Cambia Colori IT-ERA**
```html
<style>
    /* Override colori chatbot per match con sito */
    #it-era-chatbot-button {
        background: linear-gradient(135deg, #TUO_COLORE_1, #TUO_COLORE_2) !important;
    }
    
    .it-era-chat-header {
        background: linear-gradient(135deg, #TUO_COLORE_1, #TUO_COLORE_2) !important;
    }
    
    .it-era-message.user .it-era-message-bubble {
        background: #TUO_COLORE_1 !important;
    }
</style>
```

### **Posizione Personalizzata**
```css
/* Esempio: posiziona in alto a sinistra */
#it-era-chatbot-container {
    top: 20px !important;
    left: 20px !important;
    bottom: auto !important;
    right: auto !important;
}

#it-era-chatbot-window {
    top: 80px !important;
    left: 20px !important;
    bottom: auto !important;
    right: auto !important;
}
```

---

## 📊 **TRACKING E ANALYTICS**

### **Google Analytics 4 Integration**
```html
<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'GA_MEASUREMENT_ID');
</script>

<!-- Chatbot con tracking -->
<script>
    window.ITERAChatbotPageConfig = {
        trackEvents: true,
        gaTrackingId: 'GA_MEASUREMENT_ID'
    };
</script>
<script src="chatbot-script.js"></script>
```

### **Eventi Tracciati Automaticamente**
- `chatbot_loaded` - Chatbot inizializzato
- `chatbot_opened` - Finestra chat aperta  
- `chatbot_closed` - Finestra chat chiusa
- `message_sent` - Messaggio inviato dall'utente
- `escalation_triggered` - Richiesta escalation (preventivo/emergenza)

---

## 🧪 **TESTING E DEBUG**

### **Test Funzionalità**
```html
<!-- Modalità debug per testing -->
<script>
    // Abilita console logs dettagliati
    window.ITERAChatbotDebug = true;
    
    // Test API endpoint
    console.log('Testing chatbot API...');
    fetch('https://tuo-worker.workers.dev/health')
        .then(r => r.json())
        .then(data => console.log('✅ API Status:', data));
</script>
```

### **Controlli Pre-Deploy**
1. **✅ API Endpoint**: Verifica che risponda su `/health`
2. **✅ CORS**: Testa da dominio it-era.it  
3. **✅ Mobile**: Testa su dispositivi mobili
4. **✅ Load Speed**: Script deve caricare <2 secondi

---

## 🚀 **DEPLOY WORKFLOW**

### **1. Deploy Worker Chatbot**
```bash
# Deploy il worker chatbot
cd /Users/andreapanzeri/progetti/IT-ERA/api
wrangler deploy --config wrangler-chatbot.toml --env production
```

### **2. Upload Script Statico (opzionale)**
```bash
# Upload script come static asset
wrangler r2 object put it-era-assets/chatbot/universal-chatbot-script.js \
    --file src/chatbot/integration/universal-chatbot-script.js
```

### **3. Aggiorna Sito Web**
- Aggiungi script tag in tutte le pagine
- Aggiorna configurazione API endpoint
- Testa funzionamento

### **4. Monitoraggio Post-Deploy**
- Verifica Workers logs per errori
- Controlla Teams notifications
- Monitora conversioni chatbot vs form tradizionali

---

## 📞 **SUPPORTO E TROUBLESHOOTING**

### **Problemi Comuni**

**❌ Chatbot non appare**
```javascript
// Verifica in console browser:
console.log('Chatbot loaded:', !!window.ITERAChatbot);
```

**❌ API non risponde**
```javascript
// Testa endpoint:
fetch('https://tuo-endpoint/health').then(r => r.json()).then(console.log);
```

**❌ Teams notifications non arrivano**
- Verifica webhook URL in wrangler.toml
- Controlla Workers logs per errori
- Testa webhook con curl

### **Debug Console Commands**
```javascript
// Apri chatbot programmaticamente
ITERAChatbot.open();

// Chiudi chatbot
ITERAChatbot.close(); 

// Invia messaggio test
ITERAChatbot.sendMessage('Test preventivo sicurezza');

// Vedi configurazione
console.log(ITERAChatbot.config);
```

---

## ✅ **CHECKLIST FINALE**

Prima di andare in produzione:

- [ ] ✅ Worker chatbot deployato e funzionante
- [ ] ✅ Script integrazione aggiunto in tutte le pagine
- [ ] ✅ API endpoint configurato correttamente
- [ ] ✅ Teams webhook testato e funzionante
- [ ] ✅ Test mobile completato
- [ ] ✅ Google Analytics configurato (opzionale)
- [ ] ✅ CORS configurato per it-era.it
- [ ] ✅ Backup plan per fallback (telefono/email)

**🎉 Il chatbot IT-ERA è pronto per raccogliere lead qualificati 24/7!**