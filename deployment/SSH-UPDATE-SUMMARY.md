# 📋 SSH Deployment Update Summary

**Data aggiornamento:** 2025-09-10  
**Porta SSH corretta:** 4522  

---

## 🔄 **File Aggiornati**

### **1. Credenziali Plesk** (`deployment/plesk-credentials.md`)
- ✅ Aggiornata porta SSH da 22 a **4522**
- ✅ Corretti comandi SSH di connessione
- ✅ Aggiornato comando Git con porta SSH

### **2. Script Deploy** (`deployment/deploy.sh`)
- ✅ Aggiornato comando SCP con porta **4522**
- ✅ Corretta sintassi: `scp -P 4522`

### **3. Deploy JavaScript** (`scripts/deploy-to-plesk.js`)
- ✅ Aggiornato commento SCP con porta **4522**

### **4. Guida Step-by-Step** (`deployment/PLESK-STEP-BY-STEP.md`)
- ✅ Aggiunta sezione **SSH Method** come opzione raccomandata
- ✅ Mantenuto FTP come alternativo
- ✅ Riorganizzate le opzioni di deployment

---

## 🆕 **Nuovi File Creati**

### **1. Guida SSH Completa** (`deployment/SSH-DEPLOYMENT-GUIDE.md`)
- 📋 Guida completa per deployment via SSH
- 🔐 Istruzioni di connessione dettagliate
- 📦 Procedure di deployment Node.js
- 🔧 Troubleshooting e comandi di emergenza
- 📊 Checklist di deployment

### **2. Script Deploy Automatico** (`scripts/deploy-ssh.sh`)
- 🚀 Script bash completo per deployment automatico
- 💾 Backup automatico prima del deploy
- 📁 Upload files via SCP
- 📦 Installazione dipendenze automatica
- 🔄 Restart Node.js application
- 🧪 Test automatico del deployment
- 🎨 Output colorato e user-friendly

### **3. Riepilogo Modifiche** (`deployment/SSH-UPDATE-SUMMARY.md`)
- 📋 Questo file di riepilogo

---

## 🛠 **Come Usare il Nuovo Sistema**

### **Deployment Automatico (Raccomandato)**
```bash
# Esegui lo script automatico
./scripts/deploy-ssh.sh
```

### **Deployment Manuale**
```bash
# 1. Connetti via SSH
ssh -p 4522 it-era.it_jk05qj1z25@65.109.30.171

# 2. Naviga nella directory
cd /var/www/vhosts/it-era.it/httpdocs/

# 3. Upload files (da locale)
scp -P 4522 -r * it-era.it_jk05qj1z25@65.109.30.171:/var/www/vhosts/it-era.it/httpdocs/

# 4. Installa dipendenze
npm install --production

# 5. Restart applicazione
pkill -f "node server.js"
nohup node server.js > app.log 2>&1 &
```

---

## 📊 **Informazioni Server**

| Parametro | Valore |
|-----------|--------|
| **IP Server** | 65.109.30.171 |
| **Porta SSH** | **45222** ✅ |
| **Username** | it-era.it_jk05qj1z25 |
| **Password** | c?3Mmjd7VcwZlc5% |
| **Path Web** | /var/www/vhosts/it-era.it/httpdocs/ |
| **Sito Live** | https://it-era.it |

---

## ✅ **Stato Connessioni**

| Servizio | Porta | Stato | Note |
|----------|-------|-------|------|
| **SSH** | 4522 | ⚠️ Filtrata | Potrebbe richiedere VPN/Whitelist |
| **HTTP** | 80 | ✅ Attivo | Redirect a HTTPS |
| **HTTPS** | 443 | ✅ Attivo | Sito funzionante |
| **FTP** | 21 | ✅ Aperta | Alternativa per upload |
| **Plesk Panel** | 8443 | ⚠️ Filtrata | Accesso via browser |

---

## 🚨 **Note Importanti**

1. **Porta SSH 4522** è filtrata dal firewall
   - Potrebbe essere necessario accesso da IP specifici
   - Contattare provider per whitelist se necessario

2. **Sito già funzionante** su https://it-era.it
   - Node.js è già attivo e configurato
   - Deploy può essere fatto quando SSH sarà accessibile

3. **Alternative di accesso:**
   - Pannello Plesk: https://it-era.it:8443 (se accessibile)
   - FTP: porta 21 (per upload files)
   - File Manager Plesk (via browser)

---

## 📞 **Prossimi Passi**

1. **Testare connessione SSH** dalla tua rete
2. **Configurare whitelist IP** se necessario
3. **Eseguire primo deployment** con script automatico
4. **Verificare funzionamento** del sito post-deploy

---

**Tutti i file di documentazione sono stati aggiornati con le informazioni corrette della porta SSH 4522.**
