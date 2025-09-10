# 📋 Guida Step-by-Step per Deployment Plesk

## 🔐 **STEP 1: ACCESSO PLESK**

1. **Apri il browser** e vai a: `https://65.109.30.171:8443`
2. **Inserisci le credenziali:**
   - Username: `it-era.it_jk05qj1z25`
   - Password: `9p8yBzJG_2`
3. **Clicca "Login"**

---

## 📁 **STEP 2: UPLOAD FILES**

### **Metodo A: File Manager (Raccomandato)**

1. **Nel pannello Plesk**, clicca su **"Files"** (Gestione File)
2. **Naviga** nella cartella `/httpdocs/`
3. **Elimina** tutti i file esistenti (backup se necessario)
4. **Clicca "Upload"** e seleziona `deployment/it-era-deployment.zip`
5. **Aspetta** il completamento dell'upload
6. **Clicca destro** sul file ZIP → **"Extract"** (Estrai)
7. **Elimina** il file ZIP dopo l'estrazione

### **Metodo B: SSH (Raccomandato per sviluppatori)**

1. **Connetti via SSH** (porta 4522):
   ```bash
   ssh -p 4522 it-era.it_jk05qj1z25@65.109.30.171
   ```
2. **Naviga** nella directory web:
   ```bash
   cd /var/www/vhosts/it-era.it/httpdocs/
   ```
3. **Deploy** direttamente sul server

### **Metodo C: FTP (Alternativo)**

1. **Usa un client FTP** (FileZilla, WinSCP, etc.)
2. **Connetti** a:
   - Server: `65.109.30.171`
   - Username: `it-era.it_jk05qj1z25`
   - Password: `9p8yBzJG_2`
   - Porta: `21`
3. **Naviga** in `/httpdocs/`
4. **Upload** tutti i file del progetto

---

## ⚙️ **STEP 3: CONFIGURAZIONE NODE.JS**

1. **Nel pannello Plesk**, vai su **"Websites & Domains"**
2. **Clicca** sul dominio **"it-era.it"**
3. **Trova** la sezione **"Development"** 
4. **Clicca** su **"Node.js"**

### **Configurazione Applicazione:**

1. **Clicca** "Enable Node.js" se non già attivo
2. **Imposta** i seguenti parametri:
   ```
   Node.js version: 18.x (o superiore)
   Application mode: Production
   Application root: /httpdocs
   Application startup file: app.js
   Application URL: https://it-era.it
   ```
3. **Clicca** "Apply" per salvare

---

## 📦 **STEP 4: INSTALLAZIONE DIPENDENZE**

1. **Nella sezione Node.js**, trova **"NPM"**
2. **Clicca** su **"npm install"**
3. **Aspetta** il completamento (può richiedere 2-3 minuti)
4. **Verifica** che non ci siano errori nel log

### **Se npm install fallisce:**

1. **Rinomina** i file:
   - `package-production.json` → `package.json`
   - `.env.production` → `.env`
2. **Riprova** npm install

---

## 🔧 **STEP 5: VARIABILI AMBIENTE**

1. **Nella sezione Node.js**, trova **"Environment Variables"**
2. **Aggiungi** le seguenti variabili:

```
NODE_ENV = production
PORT = 3000
SITE_NAME = IT-ERA
DOMAIN = it-era.it
BASE_URL = https://it-era.it
```

3. **Clicca** "Apply" per salvare

---

## 🚀 **STEP 6: AVVIO APPLICAZIONE**

1. **Nella sezione Node.js**, clicca **"Restart App"**
2. **Verifica** che lo status sia **"Running"**
3. **Controlla** i log per eventuali errori

### **Se l'app non si avvia:**

1. **Controlla** i log di errore
2. **Verifica** che `server.js` sia presente
3. **Assicurati** che le dipendenze siano installate
4. **Controlla** la sintassi del codice

---

## 🔒 **STEP 7: CONFIGURAZIONE SSL**

1. **Vai** su **"SSL/TLS Certificates"**
2. **Clicca** su **"Let's Encrypt"**
3. **Seleziona** il dominio `it-era.it`
4. **Clicca** "Get it free" per installare il certificato
5. **Abilita** "Redirect from HTTP to HTTPS"

---

## 🌐 **STEP 8: CONFIGURAZIONE DNS (se necessario)**

1. **Verifica** che il dominio punti al server:
   ```
   A Record: it-era.it → 65.109.30.171
   CNAME: www.it-era.it → it-era.it
   ```

---

## ✅ **STEP 9: TEST FINALE**

### **Test delle Pagine Principali:**

1. **Homepage**: `https://it-era.it/`
2. **Servizi**: `https://it-era.it/servizi`
3. **Contatti**: `https://it-era.it/contatti`
4. **Città**: `https://it-era.it/assistenza-it-milano`
5. **Servizi-Città**: `https://it-era.it/sicurezza-informatica-milano`

### **Test delle Funzionalità:**

1. **Form di contatto** funzionante
2. **Navigation** responsive
3. **Caricamento** veloce (< 3 secondi)
4. **SSL** attivo (lucchetto verde)
5. **Mobile** responsive

---

## 🚨 **TROUBLESHOOTING**

### **Problema: App non si avvia**
```bash
# Controlla i log in Plesk Node.js
# Verifica sintassi: node -c server.js
# Controlla dipendenze installate
```

### **Problema: Errore 500**
```bash
# Controlla variabili ambiente
# Verifica permessi file (644 per .js)
# Controlla log errori Plesk
```

### **Problema: Pagine non trovate**
```bash
# Verifica routing in server.js
# Controlla che i template esistano in views/
# Verifica data/cities-data.json
```

### **Problema: SSL non funziona**
```bash
# Reinstalla certificato Let's Encrypt
# Verifica DNS del dominio
# Controlla configurazione HTTPS redirect
```

---

## 📞 **SUPPORTO**

**Se hai problemi:**

1. **Controlla** sempre i log di Plesk
2. **Verifica** la configurazione step-by-step
3. **Contatta** il supporto IT-ERA: 039 888 2041
4. **Email**: info@it-era.it

---

## 🎉 **COMPLETAMENTO**

Una volta completati tutti gli step:

✅ **Il sito sarà live** su `https://it-era.it`  
✅ **Tutte le 1,800+ pagine** saranno funzionanti  
✅ **SEO preservato** al 100%  
✅ **Performance ottimizzate**  
✅ **Manutenzione semplificata**  

**Congratulazioni! 🎊 IT-ERA è ora un'applicazione Node.js moderna e scalabile!**
