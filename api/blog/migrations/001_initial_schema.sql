-- IT-ERA Blog Database Schema

-- Users table for admin authentication
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'editor' CHECK (role IN ('admin', 'editor', 'author')),
    is_active BOOLEAN DEFAULT 1,
    login_attempts INTEGER DEFAULT 0,
    locked_until DATETIME NULL,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Categories for organizing blog posts
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#0056cc', -- IT-ERA blue
    is_active BOOLEAN DEFAULT 1,
    post_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tags for flexible content categorization
CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    usage_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Main blog posts table
CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    content_type VARCHAR(20) DEFAULT 'html' CHECK (content_type IN ('html', 'markdown')),
    featured_image VARCHAR(255),
    
    -- Author information
    author_id INTEGER NOT NULL,
    author_name VARCHAR(100),
    
    -- Publication status
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled', 'archived')),
    published_at DATETIME NULL,
    scheduled_for DATETIME NULL,
    
    -- SEO fields
    meta_title VARCHAR(200),
    meta_description VARCHAR(300),
    meta_keywords TEXT,
    og_title VARCHAR(200),
    og_description VARCHAR(300),
    og_image VARCHAR(255),
    
    -- Analytics and engagement
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    
    -- Content flags
    is_featured BOOLEAN DEFAULT 0,
    allow_comments BOOLEAN DEFAULT 1,
    is_pinned BOOLEAN DEFAULT 0,
    
    -- IT-ERA service tags
    service_category VARCHAR(50), -- 'assistenza-it', 'sicurezza-informatica', 'cloud-storage'
    target_cities TEXT, -- JSON array of cities this post targets
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Post-Category relationships (many-to-many)
CREATE TABLE IF NOT EXISTS post_categories (
    post_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    PRIMARY KEY (post_id, category_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Post-Tag relationships (many-to-many)
CREATE TABLE IF NOT EXISTS post_tags (
    post_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (post_id, tag_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Comments system
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    parent_id INTEGER NULL, -- For nested comments
    author_name VARCHAR(100) NOT NULL,
    author_email VARCHAR(100) NOT NULL,
    author_website VARCHAR(200),
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'spam')),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- Media/Upload tracking
CREATE TABLE IF NOT EXISTS media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    alt_text VARCHAR(200),
    caption TEXT,
    uploaded_by INTEGER,
    usage_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- n8n webhook logs and integration tracking
CREATE TABLE IF NOT EXISTS webhook_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    webhook_type VARCHAR(50) NOT NULL, -- 'n8n_publish', 'n8n_update', etc.
    payload TEXT NOT NULL, -- JSON payload
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed', 'retry')),
    post_id INTEGER NULL,
    response_data TEXT, -- Response from processing
    error_message TEXT,
    processed_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE SET NULL
);

-- Site settings and configuration
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(20) DEFAULT 'text' CHECK (setting_type IN ('text', 'number', 'boolean', 'json')),
    description TEXT,
    updated_by INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Analytics and statistics
CREATE TABLE IF NOT EXISTS analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_name VARCHAR(100) NOT NULL,
    metric_value INTEGER NOT NULL,
    post_id INTEGER NULL,
    category_id INTEGER NULL,
    date_recorded DATE NOT NULL,
    additional_data TEXT, -- JSON for extra context
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published_at);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_service_category ON posts(service_category);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics(date_recorded);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);

-- Update triggers to maintain updated_at timestamps
CREATE TRIGGER IF NOT EXISTS update_posts_timestamp 
    AFTER UPDATE ON posts FOR EACH ROW
    BEGIN
        UPDATE posts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_categories_timestamp
    AFTER UPDATE ON categories FOR EACH ROW
    BEGIN
        UPDATE categories SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_users_timestamp
    AFTER UPDATE ON users FOR EACH ROW
    BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Triggers to maintain counts
CREATE TRIGGER IF NOT EXISTS increment_category_count
    AFTER INSERT ON post_categories FOR EACH ROW
    BEGIN
        UPDATE categories SET post_count = post_count + 1 WHERE id = NEW.category_id;
    END;

CREATE TRIGGER IF NOT EXISTS decrement_category_count
    AFTER DELETE ON post_categories FOR EACH ROW
    BEGIN
        UPDATE categories SET post_count = post_count - 1 WHERE id = OLD.category_id;
    END;

CREATE TRIGGER IF NOT EXISTS increment_tag_usage
    AFTER INSERT ON post_tags FOR EACH ROW
    BEGIN
        UPDATE tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
    END;

CREATE TRIGGER IF NOT EXISTS decrement_tag_usage
    AFTER DELETE ON post_tags FOR EACH ROW
    BEGIN
        UPDATE tags SET usage_count = usage_count - 1 WHERE id = OLD.tag_id;
    END;