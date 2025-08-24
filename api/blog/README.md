# IT-ERA Blog Backend System

Un sistema completo di gestione blog con pannello amministrativo per IT-ERA, progettato per supportare servizi IT, sicurezza informatica e cloud storage in Lombardia.

## 🚀 Caratteristiche Principali

### Backend API
- **Authentication & Authorization**: JWT-based con ruoli (admin, editor, author)
- **CRUD Posts**: Gestione completa articoli con draft/publish/schedule workflow
- **Category & Tag Management**: Sistema di classificazione flessibile
- **Media Library**: Upload e gestione immagini con metadata
- **SEO Optimization**: Campi meta, Open Graph, sitemap automatica
- **Analytics Integration**: Tracking visualizzazioni e engagement
- **n8n Webhook Integration**: Pubblicazione automatica via workflow
- **Content Scheduling**: Pubblicazione programmata con cron jobs

### Admin Panel
- **Dashboard**: Statistiche, post recenti, analytics
- **WYSIWYG Editor**: CKEditor 5 con upload immagini
- **Content Calendar**: Vista calendario per pianificare contenuti
- **Bulk Operations**: Azioni su multipli post contemporaneamente
- **Media Manager**: Libreria media con preview e metadata
- **User Management**: Gestione utenti e permessi (solo admin)
- **SEO Tools**: Analisi SEO e ottimizzazione contenuti
- **Responsive Design**: Bootstrap 5 con tema IT-ERA

### Sicurezza
- **Rate Limiting**: Protezione da abusi API
- **Input Sanitization**: Pulizia contenuti HTML
- **CSRF Protection**: Token CSRF per form
- **Account Lockout**: Blocco temporaneo dopo tentativi falliti
- **Helmet.js**: Headers di sicurezza HTTP

## 📋 Requisiti di Sistema

- **Node.js**: >= 18.x
- **NPM**: >= 9.x
- **SQLite**: Database incluso (nessuna installazione richiesta)

## ⚡ Installazione Rapida

### 1. Clone e Setup
```bash
cd /Users/andreapanzeri/progetti/IT-ERA/api/blog
npm install
```

### 2. Configurazione Environment
```bash
cp .env.example .env
# Modifica le variabili in .env secondo le tue necessità
```

### 3. Database Setup
```bash
# Crea il database e le tabelle
npm run migrate

# Popola con dati di esempio
npm run seed
```

### 4. Avvio Server
```bash
# Sviluppo (con nodemon)
npm run dev

# Produzione
npm start
```

Il server sarà disponibile su:
- **API**: http://localhost:3000/api
- **Admin Panel**: http://localhost:3000/admin
- **Health Check**: http://localhost:3000/health

## 🔐 Credenziali di Default

Dopo il seeding, puoi accedere con:

**Administrator**
- Email: `admin@it-era.it`
- Password: `admin123!`

**Editor**
- Email: `editor@it-era.it`
- Password: `editor123!`

> ⚠️ **IMPORTANTE**: Cambia queste password in produzione!

## 📊 Struttura Database

### Tabelle Principali
- **users**: Utenti del sistema con ruoli
- **posts**: Articoli del blog con contenuto e metadata
- **categories**: Categorie per organizzare i contenuti
- **tags**: Tag per classificazione flessibile
- **media**: File multimediali caricati
- **analytics**: Dati di utilizzo e statistiche
- **webhook_logs**: Log delle integrazioni n8n
- **settings**: Configurazioni del sistema

### Relazioni
- Post ↔ Categorie (many-to-many)
- Post ↔ Tag (many-to-many)
- Post → Utente (many-to-one)
- Media → Utente (many-to-one)

## 🛣️ API Endpoints

### Authentication
```
POST /api/auth/login          # Login utente
POST /api/auth/logout         # Logout utente
GET  /api/auth/me            # Informazioni utente corrente
PUT  /api/auth/profile       # Aggiorna profilo
POST /api/auth/change-password # Cambia password
```

### Posts
```
GET    /api/posts             # Lista post con filtri
GET    /api/posts/:id         # Singolo post
POST   /api/posts             # Crea nuovo post
PUT    /api/posts/:id         # Aggiorna post
DELETE /api/posts/:id         # Elimina post
POST   /api/posts/:id/publish # Pubblica post
```

### Categories & Tags
```
GET    /api/categories        # Lista categorie
POST   /api/categories        # Crea categoria
PUT    /api/categories/:id    # Aggiorna categoria
DELETE /api/categories/:id    # Elimina categoria

GET    /api/tags              # Lista tag
POST   /api/tags              # Crea tag
POST   /api/tags/bulk-create  # Crea multipli tag
```

### Media
```
GET    /api/media             # Lista media
POST   /api/media/upload      # Upload file
PUT    /api/media/:id         # Aggiorna metadata
DELETE /api/media/:id         # Elimina file
```

### Webhooks (n8n Integration)
```
POST /api/webhooks/n8n/publish # Pubblica via n8n
POST /api/webhooks/n8n/update  # Aggiorna via n8n
POST /api/webhooks/n8n/delete  # Elimina via n8n
```

### Public API (per Frontend)
```
GET /public/posts             # Post pubblici
GET /public/posts/:slug       # Post per slug
GET /public/categories        # Categorie attive
GET /public/tags              # Tag popolari
GET /public/search            # Ricerca contenuti
```

## 🎨 Personalizzazione IT-ERA

### Colori Brand
```css
--it-era-blue: #0056cc;      /* Assistenza IT */
--it-era-red: #dc3545;       /* Sicurezza Informatica */
--it-era-cyan: #17a2b8;      /* Cloud Storage */
--it-era-dark: #1a1a2e;      /* IT-ERA Dark */
```

### Servizi Supportati
- **Assistenza IT**: Supporto tecnico e sistemistico
- **Sicurezza Informatica**: Cybersecurity e protezione dati  
- **Cloud Storage**: Soluzioni di archiviazione cloud

### Targeting Geografico
Il sistema supporta targeting per città lombarde con campi dedicati per ottimizzazione SEO locale.

## 🔧 Configurazione Avanzata

### n8n Webhook Integration
Per integrare con n8n workflow:

1. Configura `N8N_WEBHOOK_SECRET` nel `.env`
2. Usa gli endpoint webhook con firma HMAC SHA-256
3. Payload esempio:
```json
{
  "title": "Titolo Post",
  "content": "<p>Contenuto HTML</p>",
  "categories": ["Assistenza IT"],
  "tags": ["Windows", "Support"],
  "service_category": "assistenza-it",
  "target_cities": ["Milano", "Monza"],
  "status": "published"
}
```

### Scheduling Content
Il sistema include un scheduler automatico che:
- Pubblica post programmati ogni minuto
- Esegue manutenzione giornaliera (2:00 AM)
- Aggrega analytics settimanali (Domenica 3:00 AM)

### Email Notifications
Configura SMTP nel server per notifiche:
- Nuovi post pubblicati
- Errori webhook
- Tentativi di login falliti

## 🧪 Testing

```bash
# Esegui tutti i test
npm test

# Test in watch mode
npm run test:watch

# Test con coverage
npm run test:coverage
```

Test disponibili:
- Unit tests per API endpoints
- Integration tests per workflow
- Authentication tests
- Database tests

## 🚀 Deployment

### Produzione Locale
```bash
# Build per produzione
npm run build

# Avvia in modalità produzione
NODE_ENV=production npm start
```

### Docker (Opzionale)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables Produzione
```bash
NODE_ENV=production
JWT_SECRET=your-super-secure-jwt-secret-32-chars-min
SESSION_SECRET=your-super-secure-session-secret
N8N_WEBHOOK_SECRET=your-n8n-webhook-secret
DB_PATH=/app/data/database.sqlite
```

## 📈 Monitoraggio

### Analytics
Il sistema traccia automaticamente:
- Visualizzazioni pagine e post
- Ricerche degli utenti
- Sorgenti di traffico
- Engagement sui contenuti

### Logs
- Request logs via Morgan
- Error logs in console e file
- Webhook activity logs
- Performance metrics

### Health Checks
- `GET /health`: Status server e database
- `GET /api/analytics/realtime`: Metriche in tempo reale

## 🛠️ Manutenzione

### Backup Database
```bash
# Backup manuale
cp database.sqlite backup-$(date +%Y%m%d).sqlite

# Backup automatizzato (crontab)
0 2 * * * cp /path/to/database.sqlite /backups/backup-$(date +\%Y\%m\%d).sqlite
```

### Pulizia Cache
```bash
# Pulisci analytics vecchi (>2 anni)
curl -X DELETE http://localhost:3000/api/analytics/cleanup?days=730 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Aggiornamenti
```bash
# Aggiorna dipendenze
npm update

# Controlla vulnerabilità
npm audit

# Fix automatico vulnerabilità minori
npm audit fix
```

## 🆘 Troubleshooting

### Database Issues
```bash
# Reset completo database
rm database.sqlite
npm run migrate
npm run seed
```

### Permission Issues
```bash
# Fix permessi upload directory
chmod 755 uploads/
chmod 644 uploads/*
```

### Memory Issues
```bash
# Aumenta memoria Node.js
node --max-old-space-size=4096 src/server.js
```

## 📚 Documentazione API Completa

Per documentazione API dettagliata, avvia il server e visita:
- **Swagger UI**: http://localhost:3000/api/docs (se abilitato)
- **Postman Collection**: Disponibile in `/docs/postman/`

## 🤝 Contribuire

1. Fork del progetto
2. Crea feature branch (`git checkout -b feature/nuova-feature`)
3. Commit modifiche (`git commit -m 'Aggiungi nuova feature'`)
4. Push al branch (`git push origin feature/nuova-feature`)
5. Apri Pull Request

## 📞 Supporto

Per supporto tecnico:
- **Email**: info@it-era.it
- **Telefono**: 039 888 2041
- **GitHub Issues**: Per bug e feature request

## 📄 Licenza

Copyright © 2024 IT-ERA - Tutti i diritti riservati.

---

**Made with ❤️ by IT-ERA Team**  
*Soluzioni IT professionali in Lombardia*