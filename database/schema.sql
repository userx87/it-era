-- IT-ERA Database Schema
-- Creato per il progetto di automazione e assistenza IT di Bulltech Informatica

-- Tabella clienti
CREATE TABLE IF NOT EXISTS clienti (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_cliente VARCHAR(255) NOT NULL,
    ragione_sociale VARCHAR(255),
    codice_fiscale VARCHAR(16),
    partita_iva VARCHAR(16),
    email VARCHAR(255),
    telefono VARCHAR(20),
    indirizzo TEXT,
    citta VARCHAR(100),
    cap VARCHAR(10),
    provincia VARCHAR(2),
    contratto_attivo BOOLEAN DEFAULT 1,
    tipo_contratto VARCHAR(50), -- mensile, orario, progetto
    ore_residue INTEGER DEFAULT 0,
    data_creazione DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_modifica DATETIME DEFAULT CURRENT_TIMESTAMP,
    note TEXT
);

-- Tabella ticket
CREATE TABLE IF NOT EXISTS ticket (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER,
    titolo VARCHAR(255) NOT NULL,
    descrizione TEXT,
    priorita VARCHAR(20) DEFAULT 'media', -- bassa, media, alta, critica
    stato VARCHAR(20) DEFAULT 'aperto', -- aperto, in_lavorazione, risolto, chiuso
    tecnico_assegnato VARCHAR(100),
    categoria VARCHAR(50), -- hardware, software, rete, sicurezza, backup
    ore_stimate DECIMAL(5,2),
    ore_lavorate DECIMAL(5,2) DEFAULT 0,
    data_creazione DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_chiusura DATETIME,
    note_risoluzione TEXT,
    FOREIGN KEY (cliente_id) REFERENCES clienti(id)
);

-- Tabella ore lavorate
CREATE TABLE IF NOT EXISTS ore_lavorate (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER,
    cliente_id INTEGER,
    tecnico VARCHAR(100) NOT NULL,
    ore DECIMAL(5,2) NOT NULL,
    data_lavoro DATE NOT NULL,
    descrizione_attivita TEXT,
    fatturabile BOOLEAN DEFAULT 1,
    tariffa_oraria DECIMAL(8,2),
    importo_calcolato DECIMAL(10,2),
    data_inserimento DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES ticket(id),
    FOREIGN KEY (cliente_id) REFERENCES clienti(id)
);

-- Tabella automazioni
CREATE TABLE IF NOT EXISTS automazioni (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50), -- backup, sync, monitoring, crm, security
    descrizione TEXT,
    script_path VARCHAR(500),
    cron_schedule VARCHAR(100),
    attiva BOOLEAN DEFAULT 1,
    ultima_esecuzione DATETIME,
    prossima_esecuzione DATETIME,
    stato_ultima_esecuzione VARCHAR(20), -- success, error, running
    log_ultima_esecuzione TEXT,
    parametri_config TEXT, -- JSON con parametri configurazione
    email_notifica VARCHAR(255),
    data_creazione DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabella log generale
CREATE TABLE IF NOT EXISTS log_sistema (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    livello VARCHAR(10), -- DEBUG, INFO, WARNING, ERROR, CRITICAL
    componente VARCHAR(100), -- backup, api, web, automation, etc.
    messaggio TEXT NOT NULL,
    dettagli TEXT, -- JSON con dettagli aggiuntivi
    utente VARCHAR(100),
    ip_address VARCHAR(45),
    sessione_id VARCHAR(100)
);

-- Tabella configurazioni API
CREATE TABLE IF NOT EXISTS configurazioni_api (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_api VARCHAR(100) NOT NULL,
    tipo VARCHAR(50), -- hubspot, dynamics, bitdefender, wasabi, etc.
    endpoint_base VARCHAR(500),
    api_key_encrypted TEXT,
    parametri_auth TEXT, -- JSON con dettagli autenticazione
    rate_limit_per_minuto INTEGER DEFAULT 60,
    timeout_secondi INTEGER DEFAULT 30,
    attiva BOOLEAN DEFAULT 1,
    ultima_connessione DATETIME,
    stato_connessione VARCHAR(20) -- ok, error, timeout
);

-- Tabella backup jobs
CREATE TABLE IF NOT EXISTS backup_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_job VARCHAR(255) NOT NULL,
    cliente_id INTEGER,
    tipo_backup VARCHAR(50), -- file, database, system, cloud
    sorgente_path VARCHAR(500),
    destinazione_path VARCHAR(500),
    tipo_destinazione VARCHAR(50), -- local, ftp, smb, wasabi, s3
    schedule_cron VARCHAR(100),
    retention_giorni INTEGER DEFAULT 30,
    compressione BOOLEAN DEFAULT 1,
    crittografia BOOLEAN DEFAULT 1,
    attivo BOOLEAN DEFAULT 1,
    ultima_esecuzione DATETIME,
    dimensione_ultimo_backup BIGINT,
    stato_ultimo_backup VARCHAR(20),
    log_ultimo_backup TEXT,
    FOREIGN KEY (cliente_id) REFERENCES clienti(id)
);

-- Tabella contratti e offerte
CREATE TABLE IF NOT EXISTS contratti (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER,
    numero_contratto VARCHAR(50),
    tipo VARCHAR(50), -- assistenza_mensile, progetto, monte_ore
    stato VARCHAR(20) DEFAULT 'bozza', -- bozza, attivo, scaduto, annullato
    data_inizio DATE,
    data_fine DATE,
    ore_incluse INTEGER,
    ore_utilizzate INTEGER DEFAULT 0,
    tariffa_oraria DECIMAL(8,2),
    importo_mensile DECIMAL(10,2),
    importo_totale DECIMAL(12,2),
    descrizione_servizi TEXT,
    sla_ore_risposta INTEGER, -- ore di risposta garantite
    data_creazione DATETIME DEFAULT CURRENT_TIMESTAMP,
    file_contratto_path VARCHAR(500),
    FOREIGN KEY (cliente_id) REFERENCES clienti(id)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_ticket_cliente ON ticket(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ticket_stato ON ticket(stato);
CREATE INDEX IF NOT EXISTS idx_ore_data ON ore_lavorate(data_lavoro);
CREATE INDEX IF NOT EXISTS idx_ore_tecnico ON ore_lavorate(tecnico);
CREATE INDEX IF NOT EXISTS idx_log_timestamp ON log_sistema(timestamp);
CREATE INDEX IF NOT EXISTS idx_log_componente ON log_sistema(componente);
CREATE INDEX IF NOT EXISTS idx_backup_cliente ON backup_jobs(cliente_id);
CREATE INDEX IF NOT EXISTS idx_contratti_cliente ON contratti(cliente_id);

-- Trigger per aggiornamento automatico data_modifica
CREATE TRIGGER IF NOT EXISTS update_clienti_timestamp 
    AFTER UPDATE ON clienti
    BEGIN
        UPDATE clienti SET data_modifica = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Trigger per calcolo automatico importo ore lavorate
CREATE TRIGGER IF NOT EXISTS calcola_importo_ore 
    AFTER INSERT ON ore_lavorate
    WHEN NEW.tariffa_oraria IS NOT NULL
    BEGIN
        UPDATE ore_lavorate 
        SET importo_calcolato = NEW.ore * NEW.tariffa_oraria 
        WHERE id = NEW.id;
    END;

-- Vista riassuntiva ticket per cliente
CREATE VIEW IF NOT EXISTS vista_ticket_cliente AS
SELECT 
    c.nome_cliente,
    c.id as cliente_id,
    COUNT(t.id) as totale_ticket,
    SUM(CASE WHEN t.stato = 'aperto' THEN 1 ELSE 0 END) as ticket_aperti,
    SUM(CASE WHEN t.stato = 'in_lavorazione' THEN 1 ELSE 0 END) as ticket_in_lavorazione,
    SUM(CASE WHEN t.stato = 'risolto' THEN 1 ELSE 0 END) as ticket_risolti,
    SUM(t.ore_lavorate) as ore_totali_lavorate,
    AVG(t.ore_lavorate) as ore_medie_per_ticket
FROM clienti c
LEFT JOIN ticket t ON c.id = t.cliente_id
GROUP BY c.id, c.nome_cliente;

-- Vista monte ore clienti
CREATE VIEW IF NOT EXISTS vista_monte_ore AS
SELECT 
    c.nome_cliente,
    c.id as cliente_id,
    c.ore_residue,
    COALESCE(SUM(o.ore), 0) as ore_utilizzate_mese_corrente,
    COALESCE(SUM(CASE WHEN o.fatturabile = 1 THEN o.ore ELSE 0 END), 0) as ore_fatturabili_mese
FROM clienti c
LEFT JOIN ore_lavorate o ON c.id = o.cliente_id 
    AND strftime('%Y-%m', o.data_lavoro) = strftime('%Y-%m', 'now')
GROUP BY c.id, c.nome_cliente, c.ore_residue;
