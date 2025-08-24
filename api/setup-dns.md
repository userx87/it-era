# Configurazione DNS per IT-ERA Email System

## 🔧 Setup DNS su Cloudflare

### Opzione 1: Sottodominio API (Consigliata)

1. Vai su **Cloudflare Dashboard** → **it-era.it** → **DNS**

2. Aggiungi nuovo record:
   - **Type**: CNAME
   - **Name**: api
   - **Target**: it-era-contact-api.andrea-panzeri.workers.dev
   - **Proxy status**: ✅ Proxied (arancione)
   - **TTL**: Auto

3. Clicca **Save**

### Opzione 2: Usa Route su www

Il Worker risponderà automaticamente su:
- `https://www.it-era.it/api/contact`

Non richiede configurazione DNS aggiuntiva.

## ✅ Verifica Configurazione

### Test DNS:
```bash
nslookup api.it-era.it
dig api.it-era.it
```

### Test Endpoint:
```bash
curl -X POST https://api.it-era.it/api/contact \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

## 📧 Configurazione SendGrid

### Domini Verificati:
- ✅ it-era.it (configurato e verificato)

### Record DNS SendGrid (già configurati):
- SPF: `v=spf1 include:sendgrid.net ~all`
- DKIM: Chiavi pubbliche configurate
- DMARC: Policy configurata

## 🚀 Endpoints Finali

### Principale:
```
https://api.it-era.it/api/contact
```

### Alternative:
```
https://www.it-era.it/api/contact
https://it-era-contact-api.andrea-panzeri.workers.dev/api/contact
```

## 📝 Note

- Il proxy Cloudflare deve essere **attivo** (icona arancione)
- I cambiamenti DNS possono richiedere 5-10 minuti
- Il fallback su workers.dev funziona sempre