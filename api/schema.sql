-- Database schema per IT-ERA API
-- Da eseguire su Cloudflare D1

-- Tabella contatti/lead
CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  azienda TEXT,
  email TEXT NOT NULL,
  telefono TEXT NOT NULL,
  comune TEXT,
  dipendenti TEXT,
  servizi TEXT, -- JSON array
  urgenza TEXT DEFAULT 'normale',
  messaggio TEXT,
  form_type TEXT DEFAULT 'preventivo',
  ip_address TEXT,
  ticket_id TEXT UNIQUE,
  status TEXT DEFAULT 'new', -- new, contacted, qualified, closed
  assigned_to TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indici per ricerche veloci
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_created ON contacts(created_at);

-- Tabella eventi analytics
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  type TEXT NOT NULL,
  page TEXT,
  referrer TEXT,
  user_agent TEXT,
  browser TEXT,
  device TEXT,
  os TEXT,
  ip_address TEXT,
  country TEXT,
  city TEXT,
  screen_width INTEGER,
  screen_height INTEGER,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  data TEXT, -- JSON per dati extra
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indici per analytics
CREATE INDEX idx_events_session ON events(session_id);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_created ON events(created_at);
CREATE INDEX idx_events_page ON events(page);

-- Tabella preventivi salvati
CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  contact_id INTEGER,
  params TEXT NOT NULL, -- JSON
  pricing TEXT NOT NULL, -- JSON
  notes TEXT,
  status TEXT DEFAULT 'draft', -- draft, sent, accepted, rejected, expired
  valid_until DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contact_id) REFERENCES contacts(id)
);

-- Tabella conversioni/goal
CREATE TABLE IF NOT EXISTS conversions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  goal_name TEXT NOT NULL,
  goal_value REAL DEFAULT 1,
  page TEXT,
  metadata TEXT, -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversions_session ON conversions(session_id);
CREATE INDEX idx_conversions_goal ON conversions(goal_name);
CREATE INDEX idx_conversions_created ON conversions(created_at);

-- Tabella per email log
CREATE TABLE IF NOT EXISTS email_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  status TEXT DEFAULT 'pending', -- pending, sent, failed
  provider TEXT, -- sendgrid, mailgun, ses
  error_message TEXT,
  sent_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contact_id) REFERENCES contacts(id)
);

-- Vista per metriche aggregate giornaliere
CREATE VIEW IF NOT EXISTS daily_metrics AS
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(*) as total_events,
  COUNT(CASE WHEN type = 'page_view' THEN 1 END) as page_views,
  COUNT(CASE WHEN type = 'form_submit' THEN 1 END) as form_submits,
  COUNT(DISTINCT ip_address) as unique_ips,
  COUNT(DISTINCT CASE WHEN device = 'mobile' THEN session_id END) as mobile_sessions,
  COUNT(DISTINCT CASE WHEN device = 'desktop' THEN session_id END) as desktop_sessions
FROM events
GROUP BY DATE(created_at);

-- Vista per top pagine
CREATE VIEW IF NOT EXISTS top_pages AS
SELECT 
  page,
  COUNT(*) as views,
  COUNT(DISTINCT session_id) as unique_views,
  AVG(CASE WHEN type = 'time_on_page' THEN CAST(data AS REAL) END) as avg_time
FROM events
WHERE type IN ('page_view', 'time_on_page')
AND created_at > datetime('now', '-30 days')
GROUP BY page
ORDER BY views DESC
LIMIT 50;
