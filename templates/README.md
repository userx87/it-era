# IT-ERA Template System - Documentazione

## 📋 Panoramica

Il sistema di template IT-ERA è stato completamente rinnovato per essere **modulare**, **performante** e **ottimizzato per le conversioni**. Il template principale `assistenza-informatica.html` serve come base per tutte le pagine di servizio.

## 🏗️ Struttura del Template

### File Principali
```
templates/
├── assistenza-informatica.html     # Template principale
├── css/
│   └── assistenza-informatica.css  # Stili modulari
├── js/
│   └── assistenza-informatica.js   # JavaScript modulare
├── components/
│   ├── navigation-modern.html      # Componente navigazione
│   ├── seo-head.html              # Meta tags SEO
│   ├── footer.html                # Footer aziendale
│   ├── analytics.html             # Codici tracking
│   └── chat-widget.html           # Widget chat
└── README.md                      # Questa documentazione
```

## 🔧 Variabili Template

Il template utilizza variabili Handlebars per la personalizzazione:

### Variabili Obbligatorie
- `{{CITY}}` - Nome della città (es. "Milano")
- `{{CITY_SLUG}}` - Slug della città (es. "milano")
- `{{REGION}}` - Nome della regione (es. "Lombardia")
- `{{CURRENT_YEAR}}` - Anno corrente

### Esempio di Utilizzo
```html
<!-- Prima -->
<title>Assistenza IT {{CITY}} | Supporto Professionale</title>

<!-- Dopo la compilazione -->
<title>Assistenza IT Milano | Supporto Professionale</title>
```

## 🎯 Correzioni Implementate

### 1. **Tempi di Risposta Realistici**
- ❌ **Prima**: "15 minuti" (irrealistico da Vimercate)
- ✅ **Dopo**: "2 ore" per risposta garantita, "intervento rapido" per emergenze

### 2. **CTA Corrette per Problemi IT**
- ❌ **Prima**: "Risolvi ora → 039 888 2041"
- ✅ **Dopo**: "Scopri il servizio → Assistenza Server"

### 3. **Prezzi Più Accessibili**
- ❌ **Prima**: €49/€89/€149 fissi
- ✅ **Dopo**: "Da €29", "Da €59", "Su Misura" con preventivi personalizzati

### 4. **Architettura Modulare**
- ❌ **Prima**: CSS e JS inline
- ✅ **Dopo**: File separati e componenti riutilizzabili

## 📊 Sezioni del Template

### 1. **Hero Section**
- Headline impattante con città
- CTA emergenza e preventivo
- Trust indicators realistici
- Background animato

### 2. **Problemi IT**
- 3 categorie principali: Server, Email, Sicurezza
- CTA che puntano a landing page specifiche
- Icone colorate e descrizioni dettagliate

### 3. **Pricing**
- 3 piani con prezzi "Da X€" invece di fissi
- Piano Premium evidenziato
- CTA per preventivo gratuito invece di "Attiva"

### 4. **Form Preventivo**
- Form completo con validazione
- Campi per settore e numero postazioni
- Benefici del preventivo gratuito

### 5. **Settori Specializzati**
- 6 settori principali con icone
- Descrizioni specifiche per ogni settore
- Link a landing page dedicate

### 6. **Testimonial**
- 3 recensioni con nomi e aziende
- Stelle di valutazione
- Credibilità locale

## 🚀 Come Utilizzare il Template

### 1. **Compilazione Base**
```bash
# Sostituisci le variabili con i valori reali
sed 's/{{CITY}}/Milano/g' assistenza-informatica.html > milano-assistenza-it.html
sed -i 's/{{CITY_SLUG}}/milano/g' milano-assistenza-it.html
sed -i 's/{{REGION}}/Lombardia/g' milano-assistenza-it.html
sed -i 's/{{CURRENT_YEAR}}/2024/g' milano-assistenza-it.html
```

### 2. **Personalizzazione Avanzata**
- Modifica i colori in `css/assistenza-informatica.css`
- Aggiungi funzionalità in `js/assistenza-informatica.js`
- Personalizza la navigazione in `components/navigation-modern.html`

### 3. **SEO Locale**
- Aggiorna i meta tag per ogni città
- Modifica lo schema.org con dati locali
- Personalizza le immagini OG per città

## 📈 Ottimizzazioni SEO

### Meta Tags
- Title ottimizzato con città e servizio
- Description con emoji e benefit chiari
- Keywords locali e di servizio
- Canonical URL per evitare duplicati

### Schema.org
- LocalBusiness con dati completi
- Servizi con prezzi indicativi
- Recensioni aggregate
- Orari di apertura 24/7

### Performance
- CSS critico inline
- Preconnect per risorse esterne
- Lazy loading per immagini
- JavaScript non bloccante

## 🎨 Personalizzazione Colori

### Variabili CSS Principali
```css
:root {
    --primary: #1e40af;        /* Blu IT-ERA */
    --secondary: #059669;      /* Verde successo */
    --accent: #dc2626;         /* Rosso emergenza */
    --warning: #f59e0b;        /* Giallo attenzione */
    --success: #10b981;        /* Verde conferma */
}
```

### Modifica Rapida
Per cambiare il tema colori, modifica solo le variabili CSS in `assistenza-informatica.css`.

## 📱 Responsive Design

Il template è completamente responsive con:
- **Mobile First**: Ottimizzato per smartphone
- **Tablet**: Layout adattivo per tablet
- **Desktop**: Esperienza completa per desktop
- **Touch Friendly**: Pulsanti e link ottimizzati per touch

## 🔍 Analytics e Tracking

### Eventi Tracciati
- Clic su telefono
- Invio form preventivo
- Scroll depth (25%, 50%, 75%, 100%)
- Tempo sulla pagina
- Clic su CTA specifiche

### Configurazione
```javascript
// Tracking personalizzato
window.ITERA.assistenzaInformatica.trackInteraction('custom_event', 'label', 'value');
```

## 🛠️ Manutenzione

### Aggiornamenti Regolari
1. **Prezzi**: Aggiorna i prezzi indicativi se necessario
2. **Testimonial**: Ruota le recensioni periodicamente  
3. **Settori**: Aggiungi nuovi settori se richiesto
4. **Immagini**: Ottimizza le immagini OG per città

### Monitoraggio Performance
- Controlla Core Web Vitals
- Monitora conversion rate
- Analizza heatmap utenti
- Testa su dispositivi reali

## 📞 Supporto

Per domande o personalizzazioni:
- **Email**: info@it-era.it
- **Telefono**: 039 888 2041
- **Documentazione**: Questo file README.md

---

**Versione Template**: 2.0.0  
**Ultimo Aggiornamento**: Dicembre 2024  
**Compatibilità**: Tutti i browser moderni, IE11+
