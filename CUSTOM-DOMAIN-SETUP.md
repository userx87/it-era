# 🌐 IT-ERA Custom Domain Setup Guide

This guide walks you through setting up a custom domain for the IT-ERA website on Vercel.

---

## 🎯 **Recommended Domains**

### **Primary Options:**
- **it-era.com** (Recommended - Professional, memorable)
- **it-era.it** (Alternative - Italian TLD)
- **itera.com** (If available - Shorter)

### **Alternative Options:**
- **assistenza-it-lombardia.com**
- **it-support-lombardia.com**
- **era-it.com**

---

## 🔧 **Step 1: Purchase Domain**

### **Recommended Registrars:**
1. **Namecheap** - Affordable, good support
2. **Google Domains** - Reliable, integrated with Google services
3. **Cloudflare** - Best for advanced users, great performance
4. **GoDaddy** - Popular, widely available

### **Domain Purchase Checklist:**
- ✅ Choose `.com` for international reach
- ✅ Consider `.it` for Italian market focus
- ✅ Enable domain privacy protection
- ✅ Set auto-renewal to prevent expiration

---

## 🚀 **Step 2: Configure Domain in Vercel**

### **Add Domain to Vercel:**
1. Go to [Vercel Dashboard](https://vercel.com/andreas-projects-d0af77c4/it-era)
2. Navigate to **Settings** → **Domains**
3. Click **Add Domain**
4. Enter your domain (e.g., `it-era.com`)
5. Click **Add**

### **Configure DNS Records:**
Vercel will provide DNS configuration. Add these records to your domain registrar:

```
Type: A
Name: @
Value: 76.76.19.61

Type: CNAME  
Name: www
Value: cname.vercel-dns.com
```

### **Alternative: Use Vercel Nameservers (Recommended):**
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

---

## 🔒 **Step 3: SSL Certificate**

### **Automatic SSL (Recommended):**
- Vercel automatically provisions SSL certificates
- No additional configuration needed
- Certificates auto-renew

### **Custom SSL (Advanced):**
- Upload your own SSL certificate if needed
- Configure in Vercel Dashboard → Settings → SSL

---

## ⚙️ **Step 4: Update Environment Variables**

### **Set Custom Domain Environment Variable:**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add new variable:
   - **Name:** `CUSTOM_DOMAIN`
   - **Value:** `https://it-era.com` (your domain)
   - **Environment:** Production

### **Redeploy Application:**
```bash
vercel --prod
```

---

## 🧪 **Step 5: Test Domain Configuration**

### **DNS Propagation Check:**
```bash
# Check A record
dig it-era.com A

# Check CNAME record  
dig www.it-era.com CNAME

# Check SSL certificate
curl -I https://it-era.com
```

### **Online Tools:**
- **DNS Checker:** https://dnschecker.org/
- **SSL Test:** https://www.ssllabs.com/ssltest/
- **Speed Test:** https://pagespeed.web.dev/

---

## 🔄 **Step 6: Configure Redirects**

### **WWW to Non-WWW Redirect:**
Add to `vercel.json`:
```json
{
  "redirects": [
    {
      "source": "https://www.it-era.com/:path*",
      "destination": "https://it-era.com/:path*",
      "permanent": true
    }
  ]
}
```

### **HTTP to HTTPS Redirect:**
Automatic with Vercel - no configuration needed.

---

## 📊 **Step 7: Update Analytics**

### **Google Analytics:**
1. Update tracking code in `views/partials/head-scripts.ejs`
2. Add new property for custom domain
3. Update goals and conversions

### **Google Search Console:**
1. Add new property for custom domain
2. Verify domain ownership
3. Submit updated sitemap: `https://it-era.com/sitemap.xml`

---

## 🎯 **Step 8: SEO Updates**

### **Update Canonical URLs:**
The application automatically uses the custom domain when `CUSTOM_DOMAIN` environment variable is set.

### **Update Social Media:**
- Update Facebook Page URL
- Update LinkedIn Company Page
- Update Google My Business website
- Update business cards and marketing materials

---

## 🔍 **Step 9: Monitoring & Verification**

### **Domain Health Checks:**
```bash
# Test main pages
curl -I https://it-era.com/
curl -I https://it-era.com/servizi
curl -I https://it-era.com/contatti

# Test city pages
curl -I https://it-era.com/assistenza-it-milano
curl -I https://it-era.com/assistenza-it-bergamo

# Test sitemap
curl https://it-era.com/sitemap.xml
```

### **Performance Monitoring:**
- **Google PageSpeed Insights:** Test new domain
- **GTmetrix:** Monitor loading times
- **Uptime Robot:** Set up monitoring alerts

---

## 🚨 **Troubleshooting**

### **Common Issues:**

#### **DNS Not Propagating:**
- Wait 24-48 hours for full propagation
- Clear DNS cache: `sudo dscacheutil -flushcache`
- Use different DNS servers for testing

#### **SSL Certificate Issues:**
- Wait for automatic provisioning (up to 24 hours)
- Check domain verification in Vercel dashboard
- Ensure DNS records are correct

#### **404 Errors:**
- Verify Vercel deployment is successful
- Check domain configuration in Vercel dashboard
- Ensure DNS points to correct Vercel servers

#### **Redirect Loops:**
- Check redirect configuration in `vercel.json`
- Verify environment variables are set correctly
- Clear browser cache and cookies

---

## 📞 **Support Resources**

### **Vercel Documentation:**
- [Custom Domains](https://vercel.com/docs/concepts/projects/domains)
- [DNS Configuration](https://vercel.com/docs/concepts/projects/domains/dns)
- [SSL Certificates](https://vercel.com/docs/concepts/projects/domains/ssl)

### **Domain Registrar Support:**
- **Namecheap:** https://www.namecheap.com/support/
- **Google Domains:** https://support.google.com/domains/
- **Cloudflare:** https://support.cloudflare.com/

---

## ✅ **Post-Setup Checklist**

After domain setup is complete:

- [ ] Domain resolves correctly (A and CNAME records)
- [ ] SSL certificate is active and valid
- [ ] All main pages load correctly
- [ ] City pages work properly
- [ ] Sitemap.xml is accessible
- [ ] Analytics tracking is working
- [ ] Search Console is configured
- [ ] Social media profiles are updated
- [ ] Business listings show new domain
- [ ] Email signatures updated
- [ ] Marketing materials updated

---

## 🎉 **Success!**

Once all steps are completed, your IT-ERA website will be accessible at your custom domain with:

- ✅ **Professional branding** with custom domain
- ✅ **SSL security** with automatic certificates
- ✅ **SEO benefits** from branded domain
- ✅ **Better user trust** and credibility
- ✅ **Improved marketing** effectiveness

---

**🌐 Your IT-ERA website is now ready with a professional custom domain!**

*For technical support, contact the development team or refer to Vercel documentation.*
