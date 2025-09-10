# 🚀 IT-ERA SSH Deployment Guide

## **SERVER SSH ACCESS**

**Server IP:** `65.109.30.171`
**SSH Port:** `45222`
**Username:** `it-era.it_jk05qj1z25`
**Password:** `c?3Mmjd7VcwZlc5%`

---

## **🔐 SSH CONNECTION**

### **Connect to Server**
```bash
# Connect via SSH (porta 45222)
ssh -p 45222 it-era.it_jk05qj1z25@65.109.30.171
```

### **First Time Connection**
Se è la prima volta che ti connetti, accetta il fingerprint del server:
```
The authenticity of host '[65.109.30.171]:4522' can't be established.
Are you sure you want to continue connecting (yes/no)? yes
```

---

## **📁 NODE.JS DEPLOYMENT**

### **1. Check Current Status**
```bash
# Check if Node.js is running
ps aux | grep node

# Check current directory
pwd
ls -la

# Check Node.js version
node --version
npm --version
```

### **2. Navigate to Web Directory**
```bash
# Go to web root
cd /var/www/vhosts/it-era.it/httpdocs/

# Or check if it's in a different location
find /var/www -name "server.js" 2>/dev/null
```

### **3. Deploy New Code**

#### **Method A: Direct Upload via SCP**
```bash
# From local machine, upload files
scp -P 4522 -r * it-era.it_jk05qj1z25@65.109.30.171:/var/www/vhosts/it-era.it/httpdocs/
```

#### **Method B: Git Deployment**
```bash
# On server, if git is available
git pull origin main

# Or clone fresh
git clone https://github.com/your-repo/IT-ERA.git
```

#### **Method C: Manual File Transfer**
```bash
# Upload individual files
scp -P 4522 server.js it-era.it_jk05qj1z25@65.109.30.171:/var/www/vhosts/it-era.it/httpdocs/
scp -P 4522 package.json it-era.it_jk05qj1z25@65.109.30.171:/var/www/vhosts/it-era.it/httpdocs/
```

### **4. Install Dependencies**
```bash
# Install Node.js packages
npm install --production

# Or if using yarn
yarn install --production
```

### **5. Restart Node.js Application**
```bash
# Stop current process
pkill -f "node"

# Start new process with app.js (Plesk entry point)
nohup ~/.nodenv/versions/18/bin/node app.js > app.log 2>&1 &

# Or start with server.js (alternative)
nohup ~/.nodenv/versions/18/bin/node server.js > app.log 2>&1 &

# Or if using PM2
pm2 restart it-era
pm2 status
```

---

## **🔧 TROUBLESHOOTING**

### **SSH Connection Issues**
```bash
# Test connection with verbose output
ssh -v -p 4522 it-era.it_jk05qj1z25@65.109.30.171

# Check if port is open
telnet 65.109.30.171 4522
```

### **Node.js Issues**
```bash
# Check logs
tail -f app.log

# Check if port is in use
netstat -tulpn | grep :3000

# Check process
ps aux | grep node
```

### **File Permissions**
```bash
# Set correct permissions
chmod 644 *.js *.json
chmod 755 scripts/
chmod -R 644 views/
```

---

## **📋 DEPLOYMENT CHECKLIST**

- [ ] SSH connection established (porta 4522)
- [ ] Navigate to correct directory
- [ ] Backup current files (if needed)
- [ ] Upload new files
- [ ] Install/update dependencies
- [ ] Update environment variables
- [ ] Restart Node.js application
- [ ] Test website functionality
- [ ] Check logs for errors

---

## **🚨 EMERGENCY COMMANDS**

### **Quick Restart**
```bash
# Kill all node processes and restart
pkill -f node && nohup node server.js > app.log 2>&1 &
```

### **Rollback**
```bash
# If you have a backup
cp backup/server.js ./
npm install
pkill -f node && nohup node server.js > app.log 2>&1 &
```

### **Check Status**
```bash
# Quick status check
curl -I https://it-era.it
ps aux | grep node
tail -5 app.log
```

---

## **📞 SUPPORT**

Se hai problemi con il deployment:
1. Controlla i log: `tail -f app.log`
2. Verifica la connessione: `curl -I https://it-era.it`
3. Riavvia l'applicazione se necessario
4. Contatta il supporto tecnico se persistono problemi

**Ultima modifica:** 2025-09-10
