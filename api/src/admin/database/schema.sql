-- IT-ERA Admin Panel Database Schema
-- Complete database structure for blog and admin functionality

-- Users table for authentication and user management
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK (role IN ('admin', 'editor', 'author')) DEFAULT 'author',
    avatar TEXT,
    bio TEXT,
    website TEXT,
    social_links TEXT, -- JSON string
    active INTEGER DEFAULT 1,
    email_verified INTEGER DEFAULT 0,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Categories table for post categorization
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#007cba',
    parent_id TEXT,
    image TEXT,
    meta_title TEXT,
    meta_description TEXT,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Tags table for post tagging
CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#6c757d',
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Media table for file uploads
CREATE TABLE IF NOT EXISTS media (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT CHECK (type IN ('image', 'video', 'audio', 'document', 'file')) NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,
    alt_text TEXT,
    caption TEXT,
    uploaded_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Posts table for blog content
CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    status TEXT CHECK (status IN ('draft', 'published', 'scheduled', 'archived')) DEFAULT 'draft',
    type TEXT DEFAULT 'post',
    author_id TEXT NOT NULL,
    category_id TEXT,
    featured_image TEXT,
    meta_title TEXT,
    meta_description TEXT,
    canonical_url TEXT,
    scheduled_at DATETIME,
    published_at DATETIME,
    view_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    featured INTEGER DEFAULT 0,
    allow_comments INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (featured_image) REFERENCES media(id) ON DELETE SET NULL
);

-- Post-Tag relationship table (many-to-many)
CREATE TABLE IF NOT EXISTS post_tags (
    post_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    PRIMARY KEY (post_id, tag_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Comments table for post comments
CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    parent_id TEXT,
    author_name TEXT NOT NULL,
    author_email TEXT NOT NULL,
    author_url TEXT,
    author_ip TEXT,
    author_user_agent TEXT,
    content TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'approved', 'spam', 'trash')) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- Settings table for site configuration
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    type TEXT CHECK (type IN ('string', 'number', 'boolean', 'json')) DEFAULT 'string',
    description TEXT,
    group_name TEXT DEFAULT 'general',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    page_url TEXT,
    page_title TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_address TEXT,
    session_id TEXT,
    user_id TEXT,
    post_id TEXT,
    metadata TEXT, -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE SET NULL
);

-- Page views table for analytics
CREATE TABLE IF NOT EXISTS page_views (
    id TEXT PRIMARY KEY,
    page_url TEXT NOT NULL,
    page_title TEXT,
    post_id TEXT,
    session_id TEXT,
    user_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    referrer TEXT,
    view_duration INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Calendar events table for editorial calendar
CREATE TABLE IF NOT EXISTS calendar_events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_date DATETIME NOT NULL,
    end_date DATETIME,
    event_type TEXT CHECK (event_type IN ('post', 'campaign', 'deadline', 'meeting')) DEFAULT 'post',
    status TEXT CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')) DEFAULT 'planned',
    assigned_to TEXT,
    post_id TEXT,
    metadata TEXT, -- JSON string for additional data
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Webhooks table for external integrations
CREATE TABLE IF NOT EXISTS webhooks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    events TEXT NOT NULL, -- JSON array of event types
    secret TEXT,
    active INTEGER DEFAULT 1,
    last_triggered DATETIME,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- API keys table for external access
CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    permissions TEXT NOT NULL, -- JSON array of permissions
    user_id TEXT NOT NULL,
    last_used DATETIME,
    expires_at DATETIME,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Sessions table for user session management
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    expires_at DATETIME NOT NULL,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Activity log table for audit trail
CREATE TABLE IF NOT EXISTS activity_log (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    old_values TEXT, -- JSON
    new_values TEXT, -- JSON
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Email subscribers table for newsletter
CREATE TABLE IF NOT EXISTS email_subscribers (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    status TEXT CHECK (status IN ('subscribed', 'unsubscribed', 'bounced')) DEFAULT 'subscribed',
    source TEXT DEFAULT 'website',
    tags TEXT, -- JSON array
    metadata TEXT, -- JSON object
    subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at DATETIME,
    last_email_sent DATETIME
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);

CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);

CREATE INDEX IF NOT EXISTS idx_media_uploader ON media(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_type ON media(type);

CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_post_id ON analytics_events(post_id);

CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_post_id ON page_views(post_id);

CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_assigned ON calendar_events(assigned_to);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);

-- Insert default settings
INSERT OR IGNORE INTO settings (key, value, type, description, group_name) VALUES
('site_title', 'IT-ERA Blog', 'string', 'Site title', 'general'),
('site_description', 'Blog aziendale IT-ERA - Assistenza informatica e sicurezza', 'string', 'Site description', 'general'),
('site_url', 'https://it-era.it', 'string', 'Site base URL', 'general'),
('posts_per_page', '10', 'number', 'Number of posts per page', 'general'),
('allow_comments', 'true', 'boolean', 'Allow comments on posts', 'comments'),
('require_comment_approval', 'true', 'boolean', 'Require comment approval', 'comments'),
('admin_email', 'info@it-era.it', 'string', 'Administrator email', 'general'),
('date_format', 'Y-m-d', 'string', 'Date format', 'general'),
('time_format', 'H:i', 'string', 'Time format', 'general'),
('timezone', 'Europe/Rome', 'string', 'Site timezone', 'general');

-- Insert default admin user (password: 'admin123')
-- Note: In production, change this password immediately
INSERT OR IGNORE INTO users (
    id, email, name, password_hash, role, active, email_verified, created_at
) VALUES (
    'admin-user-id',
    'admin@it-era.it',
    'Administrator',
    'YWRtaW4xMjM=', -- This should be properly hashed in production
    'admin',
    1,
    1,
    datetime('now')
);

-- Insert default categories
INSERT OR IGNORE INTO categories (id, name, slug, description, color, created_at) VALUES
('cat-assistenza', 'Assistenza IT', 'assistenza-it', 'Guide e consigli per l''assistenza informatica', '#0056cc', datetime('now')),
('cat-sicurezza', 'Sicurezza Informatica', 'sicurezza-informatica', 'Articoli sulla cybersecurity e protezione dati', '#dc3545', datetime('now')),
('cat-cloud', 'Cloud Storage', 'cloud-storage', 'Soluzioni cloud e backup', '#17a2b8', datetime('now')),
('cat-tutorial', 'Tutorial', 'tutorial', 'Guide passo-passo e tutorial', '#28a745', datetime('now')),
('cat-news', 'News', 'news', 'Ultime notizie dal mondo IT', '#ffc107', datetime('now'));

-- Insert default tags
INSERT OR IGNORE INTO tags (id, name, slug, color, created_at) VALUES
('tag-windows', 'Windows', 'windows', '#0078d4', datetime('now')),
('tag-linux', 'Linux', 'linux', '#f7941e', datetime('now')),
('tag-macos', 'macOS', 'macos', '#000000', datetime('now')),
('tag-backup', 'Backup', 'backup', '#007acc', datetime('now')),
('tag-antivirus', 'Antivirus', 'antivirus', '#ff4444', datetime('now')),
('tag-networking', 'Networking', 'networking', '#0066cc', datetime('now')),
('tag-troubleshooting', 'Troubleshooting', 'troubleshooting', '#ff6600', datetime('now'));