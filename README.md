# IT-ERA - Ecosistema di Automazione e Assistenza IT

**IT-ERA** è un sistema completo di automazione e assistenza IT sviluppato per Bulltech Informatica. Fornisce un ecosistema integrato per la gestione di clienti, ticket, backup automatici, integrazioni API e monitoraggio sicurezza.

## 🎯 Caratteristiche Principali

### Automazione IT
- Backup automatici con supporto per FTP, SMB, Wasabi/S3
- Sincronizzazioni programmate con cronjob
- Integrazioni API con HubSpot, Dynamics 365, Bitdefender
- Monitoring continuo e alert di sicurezza

### Gestione Commerciale
- Sistema ticket integrato
- Tracciamento ore lavorate per cliente
- Gestione contratti e monte ore
- Report automatici settimanali

### Dashboard Web
- Interfaccia web per gestione ticket
- Dashboard real-time con statistiche
- API REST per integrazioni esterne
- Sistema di logging centralizzato

## 🏗️ Architettura

```
IT-ERA/
├── automations/          # Script di automazione
│   ├── backup/          # Gestione backup
│   ├── sync/            # Sincronizzazioni
│   ├── crm/             # Automazioni CRM
│   ├── security/        # Monitoraggio sicurezza
│   └── monitoring/      # Controlli sistema
├── database/            # Database SQLite e schema
├── api/                 # Integrazioni API esterne
├── web/                 # Applicazione web Flask
│   ├── templates/       # Template HTML
│   ├── static/          # CSS, JS, immagini
│   └── dashboards/      # Dashboard specializzate
├── config/              # Configurazioni e logging
├── scripts/             # Script utility
├── docker/              # Containerizzazione
├── logs/                # File di log
└── docs/                # Documentazione
```

## 🚀 Installazione

### Prerequisiti
- Python 3.11+
- SQLite3
- Git
- Docker (opzionale)

### Installazione Standard

1. **Clone del progetto**
   ```bash
   cd /Users/andreapanzeri/progetti
   # Il progetto è già configurato in IT-ERA/
   ```

2. **Installazione dipendenze**
   ```bash
   cd IT-ERA
   pip3 install -r requirements.txt
   ```

3. **Inizializzazione database**
   ```bash
   python3 database/init_db.py
   ```

4. **Configurazione variabili ambiente**
   ```bash
   cp config/env.example config/.env
   # Modifica config/.env con le tue credenziali
   ```

### Installazione Docker

1. **Build container**
   ```bash
   cd IT-ERA/docker
   docker-compose build
   ```

2. **Avvio stack completo**
   ```bash
   docker-compose up -d
   ```

3. **Verifica installazione**
   ```bash
   docker-compose ps
   curl http://localhost:5000/health
   ```

## ⚙️ Configurazione

### Database
Il sistema utilizza SQLite di default con schema ottimizzato per:
- Gestione clienti e contratti
- Sistema ticket avanzato
- Tracciamento ore lavorate
- Log centralizzato
- Configurazioni API

### API Integrations
Configura le integrazioni API modificando la tabella `configurazioni_api` o usando environment variables:

```bash
# HubSpot
export HUBSPOT_API_TOKEN="your_token_here"

# Bitdefender
export BITDEFENDER_API_KEY="your_key_here"

# Dynamics 365
export DYNAMICS_TENANT_ID="your_tenant_id"
export DYNAMICS_CLIENT_ID="your_client_id"
export DYNAMICS_CLIENT_SECRET="your_secret"

# Wasabi/S3
export WASABI_ACCESS_KEY="your_access_key"
export WASABI_SECRET_KEY="your_secret_key"
export WASABI_BUCKET="your_bucket_name"

# Email notifications
export SMTP_SERVER="smtp.gmail.com"
export SMTP_PORT="587"
export SMTP_USER="your_email@domain.com"
export SMTP_PASSWORD="your_app_password"
```

### Cronjob Automatici
Installa i cronjob per le automazioni:

```bash
# Aggiungi al crontab
crontab -e

# Controllo orario
0 * * * * cd /Users/andreapanzeri/progetti/IT-ERA && python3 automations/sync/sync_manager.py hourly

# Sincronizzazione giornaliera alle 6:00
0 6 * * * cd /Users/andreapanzeri/progetti/IT-ERA && python3 automations/sync/sync_manager.py daily

# Report settimanale ogni lunedì alle 8:00
0 8 * * 1 cd /Users/andreapanzeri/progetti/IT-ERA && python3 automations/sync/sync_manager.py weekly
```

## 🖥️ Utilizzo

### Avvio Applicazione Web
```bash
cd web
python3 app.py
# Apri http://localhost:5000
```

### Gestione Backup
```bash
# Lista job di backup
python3 automations/backup/backup_manager.py list

# Esegui backup specifico
python3 automations/backup/backup_manager.py execute 1

# Avvia scheduler backup
python3 automations/backup/backup_manager.py run
```

### Sincronizzazioni Manuali
```bash
# Sincronizza tutti i CRM
python3 api/integrations.py sync-all

# Solo HubSpot
python3 api/integrations.py sync-hubspot

# Monitora sicurezza
python3 api/integrations.py monitor-security

# Genera report settimanale
python3 api/integrations.py weekly-report
```

### Gestione Database
```bash
# Verifica integrità
python3 -c "
import sqlite3
conn = sqlite3.connect('database/it_era.db')
print(conn.execute('PRAGMA integrity_check').fetchone()[0])
"

# Backup database
python3 -c "
import sqlite3, datetime
conn = sqlite3.connect('database/it_era.db')
backup_name = f'backup_{datetime.datetime.now().strftime(\"%Y%m%d_%H%M%S\")}.sql'
with open(backup_name, 'w') as f:
    for line in conn.iterdump():
        f.write(f'{line}\\n')
print(f'Backup salvato: {backup_name}')
"
```

## 📊 Dashboard e Monitoring

### Dashboard Web (http://localhost:5000)
- Statistiche real-time clienti e ticket
- Gestione ticket con workflow completo
- Registrazione ore lavorate
- Monitor backup e sincronizzazioni

### API Endpoints
- `GET /api/stats` - Statistiche sistema
- `POST /api/sync/trigger` - Trigger sincronizzazioni
- `GET /health` - Health check

### Logging
I log sono disponibili in:
- `logs/[component].log` - Log per componente
- `logs/errors.log` - Solo errori
- Database tabella `log_sistema` - Log strutturati

## 🔧 Sviluppo e Personalizzazione

### Aggiungere Nuove Integrazioni API
1. Estendi la classe `APIManager` in `api/integrations.py`
2. Implementa metodi specifici per l'API
3. Aggiungi configurazione in tabella `configurazioni_api`
4. Testa l'integrazione

### Nuovi Tipi di Backup
1. Estendi `BackupManager` in `automations/backup/backup_manager.py`
2. Implementa nuovo metodo `_transfer_[tipo]()`
3. Aggiungi tipo in tabella `backup_jobs`

### Personalizzare Dashboard
1. Modifica template in `web/templates/`
2. Aggiungi nuove route in `web/app.py`
3. Estendi API per nuove funzionalità

## 📋 Esempi d'Uso

### Creare Job di Backup
```python
from automations.backup.backup_manager import BackupManager

backup_manager = BackupManager()

# Backup giornaliero documenti cliente
job_id = backup_manager.create_backup_job(
    nome_job="Backup_Cliente_ABC",
    cliente_id=1,
    tipo_backup="file",
    sorgente_path="/path/to/client/docs",
    destinazione_path="/backup/location",
    tipo_destinazione="local",
    schedule_cron="0 2 * * *",  # Alle 2:00 ogni giorno
    retention_giorni=30,
    compressione=True,
    crittografia=True
)
```

### Integrazione HubSpot
```python
from api.integrations import HubSpotAPI

hubspot = HubSpotAPI()

# Sincronizza contatti
hubspot.sync_contacts_to_db()

# Crea nuovo contatto
contact_id = hubspot.create_contact({
    'email': 'nuovo@cliente.it',
    'firstname': 'Mario',
    'lastname': 'Rossi',
    'company': 'Azienda SRL'
})
```

### Monitoraggio Sicurezza
```python
from api.integrations import IntegrationOrchestrator

orchestrator = IntegrationOrchestrator()

# Controlla alert sicurezza
alerts = orchestrator.monitor_security_alerts()
print(f"Trovati {len(alerts)} alert di sicurezza")

# Genera report settimanale
report = orchestrator.generate_weekly_report()
```

## 🔒 Sicurezza

### Crittografia
- Backup crittografati con Fernet (AES 128)
- API key memorizzate in forma crittografata
- Comunicazioni HTTPS in produzione

### Accesso
- Autenticazione per dashboard web
- Controllo accessi per API
- Logging completo delle attività

### Backup
- Retention policy configurabile
- Crittografia automatica
- Verifica integrità

## 🐛 Troubleshooting

### Problemi Comuni

**Database locked**
```bash
# Verifica processi che usano il database
lsof database/it_era.db

# Riavvia se necessario
pkill -f "python.*it_era"
```

**Errori API**
```bash
# Controlla configurazioni
python3 -c "
from api.integrations import HubSpotAPI
api = HubSpotAPI()
print('Config:', api.config)
"
```

**Log non funzionanti**
```bash
# Verifica permessi directory logs
ls -la logs/
chmod 755 logs/
```

### Log Debug
Abilita debug logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 📞 Supporto

Per supporto e sviluppi personalizzati:
- **Bulltech Informatica**
- **Email**: support@bulltech.it
- **Sistema Ticket**: Usa la dashboard IT-ERA

## 📄 License

Proprietario - Bulltech Informatica
Tutti i diritti riservati.

---

## 🚀 Quick Start

Per iniziare immediatamente:

```bash
# 1. Inizializza sistema
cd /Users/andreapanzeri/progetti/IT-ERA
python3 database/init_db.py

# 2. Avvia web app
python3 web/app.py

# 3. Apri browser
open http://localhost:5000

# 4. Configura primo cronjob
python3 automations/sync/sync_manager.py hourly
```

**Il sistema è ora pronto per l'uso!**

## 📈 Roadmap

### Versione 1.1
- [ ] Integrazione WhatsApp API
- [ ] Dashboard Grafana avanzate
- [ ] Backup incrementali
- [ ] Notifiche Slack/Teams

### Versione 1.2
- [ ] Mobile app companion
- [ ] Machine learning per predizioni
- [ ] Integrazione LDAP/Active Directory
- [ ] API pubbliche per partner

---

*Generato automaticamente dal sistema IT-ERA*
