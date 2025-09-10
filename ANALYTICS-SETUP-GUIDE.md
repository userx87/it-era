# 📊 GUIDA CONFIGURAZIONE ANALYTICS - IT-ERA
## Setup Completo per Tracking e Monitoraggio

**Data:** 10 Gennaio 2025  
**Sito:** https://userx87.github.io/it-era/  
**Status:** ✅ **PRONTO PER CONFIGURAZIONE ANALYTICS**

---

## 🎯 ANALYTICS IMPLEMENTATI

### **📍 POSIZIONI NEL CODICE**

#### **1. HEAD SECTION (Righe 29-54):**
```html
<!-- ANALYTICS & TRACKING (HEAD SECTION) -->
<!-- Google Tag Manager -->
<!-- Google Analytics 4 -->
```

#### **2. BODY SECTION (Righe 134-138):**
```html
<!-- Google Tag Manager (noscript) -->
```

#### **3. FOOTER SECTION (Righe 860-1000):**
```html
<!-- ANALYTICS & TRACKING SCRIPTS -->
<!-- THIRD-PARTY INTEGRATIONS -->
<!-- PERFORMANCE & SEO -->
```

---

## 🔧 CONFIGURAZIONE STEP-BY-STEP

### **1. GOOGLE ANALYTICS 4 (GA4)**

#### **Setup:**
1. Vai su [Google Analytics](https://analytics.google.com/)
2. Crea una nuova proprietà GA4
3. Ottieni il **Measurement ID** (formato: G-XXXXXXXXXX)
4. Sostituisci `GA_MEASUREMENT_ID` nel codice

#### **Codice da Attivare:**
```html
<!-- Nel HEAD (righe 41-54) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX', {
    'page_title': 'IT-ERA Homepage',
    'page_location': window.location.href,
    'content_group1': 'Homepage'
  });
</script>
```

#### **Eventi Personalizzati Inclusi:**
- ✅ **Chiamate telefoniche** (click su tel:)
- ✅ **Invio form** contatti
- ✅ **Apertura chatbot**
- ✅ **Visite pagina servizi**

---

### **2. GOOGLE TAG MANAGER (GTM)**

#### **Setup:**
1. Vai su [Google Tag Manager](https://tagmanager.google.com/)
2. Crea un nuovo container
3. Ottieni il **Container ID** (formato: GTM-XXXXXXX)
4. Sostituisci `GTM-XXXXXXX` nel codice

#### **Codice da Attivare:**
```html
<!-- Nel HEAD (righe 29-40) -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>

<!-- Nel BODY (righe 134-138) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
```

---

### **3. FACEBOOK PIXEL**

#### **Setup:**
1. Vai su [Facebook Business Manager](https://business.facebook.com/)
2. Crea un Pixel
3. Ottieni il **Pixel ID**
4. Sostituisci `YOUR_PIXEL_ID` nel codice

#### **Codice da Attivare (righe 890-905):**
```html
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'YOUR_PIXEL_ID');
  fbq('track', 'PageView');
</script>
```

---

### **4. MICROSOFT CLARITY**

#### **Setup:**
1. Vai su [Microsoft Clarity](https://clarity.microsoft.com/)
2. Crea un nuovo progetto
3. Ottieni il **Clarity ID**
4. Sostituisci `YOUR_CLARITY_ID` nel codice

#### **Codice da Attivare (righe 907-915):**
```html
<script type="text/javascript">
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "YOUR_CLARITY_ID");
</script>
```

---

### **5. HOTJAR**

#### **Setup:**
1. Vai su [Hotjar](https://www.hotjar.com/)
2. Crea un nuovo sito
3. Ottieni il **Hotjar ID**
4. Sostituisci `YOUR_HOTJAR_ID` nel codice

#### **Codice da Attivare (righe 917-928):**
```html
<script>
    (function(h,o,t,j,a,r){
        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
        h._hjSettings={hjid:YOUR_HOTJAR_ID,hjsv:6};
        a=o.getElementsByTagName('head')[0];
        r=o.createElement('script');r.async=1;
        r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
        a.appendChild(r);
    })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
</script>
```

---

## 🤖 CHAT INTEGRATIONS

### **1. TAWK.TO LIVE CHAT**

#### **Setup:**
1. Vai su [Tawk.to](https://www.tawk.to/)
2. Crea un account e ottieni il **Widget ID**
3. Sostituisci `YOUR_TAWK_ID` nel codice

#### **Codice da Attivare (righe 970-981):**
```html
<script type="text/javascript">
var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
(function(){
var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
s1.async=true;
s1.src='https://embed.tawk.to/YOUR_TAWK_ID/default';
s1.charset='UTF-8';
s1.setAttribute('crossorigin','*');
s0.parentNode.insertBefore(s1,s0);
})();
</script>
```

### **2. CRISP CHAT**

#### **Setup:**
1. Vai su [Crisp](https://crisp.chat/)
2. Crea un account e ottieni il **Website ID**
3. Sostituisci `YOUR_CRISP_ID` nel codice

#### **Codice da Attivare (righe 989-991):**
```html
<script type="text/javascript">window.$crisp=[];window.CRISP_WEBSITE_ID="YOUR_CRISP_ID";(function(){d=document;s=d.createElement("script");s.src="https://client.crisp.chat/l.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();</script>
```

---

## 📊 EVENTI PERSONALIZZATI INCLUSI

### **Custom Event Tracking (righe 860-889):**

#### **1. Chiamate Telefoniche:**
```javascript
// Track phone clicks
document.querySelectorAll('a[href^="tel:"]').forEach(function(link) {
    link.addEventListener('click', function() {
        gtag('event', 'phone_call', { 'event_category': 'contact' });
    });
});
```

#### **2. Invio Form:**
```javascript
// Track contact form submissions
document.querySelectorAll('form').forEach(function(form) {
    form.addEventListener('submit', function() {
        gtag('event', 'form_submit', { 'event_category': 'contact' });
    });
});
```

#### **3. Interazioni Chatbot:**
```javascript
// Track chatbot interactions
const chatbotButton = document.getElementById('chatbot-button');
if (chatbotButton) {
    chatbotButton.addEventListener('click', function() {
        gtag('event', 'chatbot_open', { 'event_category': 'engagement' });
    });
}
```

#### **4. Visite Pagina Servizi:**
```javascript
// Track service page visits
document.querySelectorAll('a[href*="/servizi"]').forEach(function(link) {
    link.addEventListener('click', function() {
        gtag('event', 'services_view', { 'event_category': 'navigation' });
    });
});
```

---

## 🔍 SEO E STRUCTURED DATA

### **Local Business Schema (righe 1000-1030):**
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "IT-ERA",
  "description": "Assistenza informatica professionale per aziende in Lombardia",
  "url": "https://userx87.github.io/it-era/",
  "telephone": "+39-039-888-2041",
  "email": "info@it-era.it",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Vimercate",
    "addressRegion": "Lombardia",
    "addressCountry": "IT"
  }
}
```

---

## ⚡ ISTRUZIONI ATTIVAZIONE

### **Per Attivare un Analytics:**

1. **Rimuovi i commenti HTML** `<!-- -->` dal codice
2. **Sostituisci gli ID placeholder** con i tuoi ID reali
3. **Testa il funzionamento** con gli strumenti di debug
4. **Verifica i dati** nelle dashboard analytics

### **Esempio - Attivazione Google Analytics:**

**Prima (Disattivato):**
```html
<!-- 
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
-->
```

**Dopo (Attivato):**
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-ABC123XYZ"></script>
```

---

## 🎯 RACCOMANDAZIONI

### **Setup Consigliato per IT-ERA:**

1. **✅ Google Analytics 4** - Per analytics completi
2. **✅ Google Tag Manager** - Per gestione tag centralizzata
3. **✅ Microsoft Clarity** - Per heatmaps e session recordings
4. **✅ Tawk.to o Crisp** - Per live chat professionale
5. **⚠️ Facebook Pixel** - Solo se fai advertising su Facebook

### **Priorità di Implementazione:**
1. **Google Analytics 4** (essenziale)
2. **Microsoft Clarity** (gratuito e potente)
3. **Live Chat** (per conversioni)
4. **Facebook Pixel** (se necessario)
5. **Hotjar** (per analisi avanzate)

---

## 📞 **SUPPORTO**

Per assistenza nella configurazione degli analytics, contatta IT-ERA:
- **📞 Telefono:** 039 888 2041
- **📧 Email:** info@it-era.it
- **🌐 Sito:** https://userx87.github.io/it-era/

**🎯 ANALYTICS SETUP COMPLETO - PRONTO PER CONFIGURAZIONE!**
