# 🔐 IT-ERA Plesk Server Credentials

## **SERVER INFORMATION**

**Server IP:** `65.109.30.171`
**Username:** `it-era.it_jk05qj1z25`
**Password:** `c?3Mmjd7VcwZlc5%`
**Domain:** `it-era.it`
**Panel:** Plesk Control Panel  

---

## **🚀 DEPLOYMENT INSTRUCTIONS**

### **1. Initial Server Setup**

```bash
# Connect via SSH (porta 45222)
ssh -p 45222 it-era.it_jk05qj1z25@65.109.30.171

# Or use Plesk File Manager for file uploads
```

### **2. Node.js Application Setup**

1. **Access Plesk Control Panel**
   - URL: `https://65.109.30.171:8443` or `https://it-era.it:8443`
   - Username: `it-era.it_jk05qj1z25`
   - Password: `c?3Mmjd7VcwZlc5%`

2. **Create Node.js Application**
   - Go to "Websites & Domains"
   - Select "it-era.it" domain
   - Click "Node.js" in the development section
   - Create new Node.js application

3. **Application Configuration**
   ```
   Node.js version: 18.x or higher
   Application mode: Production
   Application root: /httpdocs
   Application startup file: server.js
   Application URL: https://it-era.it
   ```

### **3. File Upload Methods**

#### **Method A: Git Deployment (Recommended)**
```bash
# 1. Initialize Git repository in Plesk
# 2. Add remote repository (porta SSH 45222)
git remote add plesk ssh://it-era.it_jk05qj1z25@65.109.30.171:45222/~/git/it-era.git

# 3. Push code
git add .
git commit -m "Initial Node.js deployment"
git push plesk main
```

#### **Method B: File Manager Upload**
1. Access Plesk File Manager
2. Navigate to `/httpdocs/`
3. Upload all project files
4. Extract if uploaded as ZIP

#### **Method C: FTP Upload**
```
FTP Server: 65.109.30.171
Username: it-era.it_jk05qj1z25
Password: c?3Mmjd7VcwZlc5%
Port: 21 (or 990 for FTPS)
Directory: /httpdocs/
```

### **4. Environment Variables**

Set in Plesk Node.js settings:
```
NODE_ENV=production
PORT=3000
SITE_NAME=IT-ERA
DOMAIN=it-era.it
```

### **5. Dependencies Installation**

In Plesk Node.js application:
```bash
npm install
```

Or manually install key dependencies:
```bash
npm install express ejs compression helmet express-rate-limit cors dotenv nodemailer express-validator
```

### **6. SSL Certificate**

1. Go to "SSL/TLS Certificates" in Plesk
2. Enable "Let's Encrypt" for automatic SSL
3. Force HTTPS redirect

---

## **📁 FILE STRUCTURE FOR DEPLOYMENT**

```
/httpdocs/
├── server.js                 # Main application file
├── package.json              # Dependencies and scripts
├── views/                    # EJS templates
│   ├── layout.ejs
│   ├── index.ejs
│   ├── servizi.ejs
│   ├── assistenza-it-city.ejs
│   ├── service-city.ejs
│   └── partials/
│       ├── navigation.ejs
│       └── footer.ejs
├── web/                      # Static assets
│   ├── css/
│   ├── js/
│   ├── images/
│   └── static/
├── data/                     # Configuration data
│   ├── cities-data.json
│   └── seo-data.json
└── scripts/                  # Utility scripts
    └── build-sitemap.js
```

---

## **🔧 PLESK CONFIGURATION STEPS**

### **Step 1: Domain Setup**
1. Verify domain `it-era.it` is configured
2. Set document root to `/httpdocs/`
3. Enable Node.js support

### **Step 2: Node.js Application**
1. Create Node.js app with startup file `server.js`
2. Set environment to Production
3. Configure port (usually 3000)

### **Step 3: Database (if needed)**
1. Create MySQL database for future use
2. Note credentials for application

### **Step 4: SSL & Security**
1. Install Let's Encrypt SSL certificate
2. Enable HTTPS redirect
3. Configure security headers

### **Step 5: Performance**
1. Enable Gzip compression
2. Set up caching rules
3. Configure CDN if available

---

## **🚨 EMERGENCY CONTACTS**

**IT-ERA Support:** 039 888 2041  
**Email:** info@it-era.it  

**Plesk Support:** (if needed)  
**Hosting Provider:** (contact details if available)  

---

## **📋 DEPLOYMENT CHECKLIST**

- [ ] Server access verified
- [ ] Node.js application created in Plesk
- [ ] Files uploaded to `/httpdocs/`
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables configured
- [ ] SSL certificate installed
- [ ] HTTPS redirect enabled
- [ ] Application started and running
- [ ] DNS pointing to server IP
- [ ] All routes tested and working
- [ ] Forms and API endpoints functional
- [ ] SEO elements preserved
- [ ] Performance optimized

---

## **🔄 UPDATE PROCESS**

### **For Code Updates:**
1. Upload new files via File Manager or Git
2. Restart Node.js application in Plesk
3. Clear any caches
4. Test functionality

### **For Dependencies:**
1. Update `package.json`
2. Run `npm install` in Plesk terminal
3. Restart application

### **For Configuration:**
1. Update environment variables in Plesk
2. Restart Node.js application
3. Verify changes

---

## **📊 MONITORING**

### **Application Health:**
- Check Plesk Node.js logs
- Monitor application status
- Set up uptime monitoring

### **Performance:**
- Monitor response times
- Check resource usage
- Optimize as needed

### **Security:**
- Regular security updates
- Monitor access logs
- Keep SSL certificates updated

---

**Last Updated:** 2025-01-10  
**Deployment Status:** Ready for Production  
**Next Steps:** Upload files and configure Node.js application
