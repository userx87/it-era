-- IT-ERA Blog System Database Schema
-- PostgreSQL Database Schema for Blog Management System

-- Enable UUID extension for future use
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table first (referenced by blog_posts)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    role VARCHAR(20) DEFAULT 'editor' CHECK (role IN ('admin', 'editor', 'author')),
    bio TEXT,
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Authentication fields
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP WITH TIME ZONE,
    email_verified BOOLEAN DEFAULT FALSE
);

-- Create categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7), -- Hex color code for UI theming
    icon VARCHAR(50), -- Font Awesome icon class
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    display_order INTEGER DEFAULT 0,
    meta_title VARCHAR(60),
    meta_description VARCHAR(160),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_category_slug CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT valid_color_format CHECK (color ~ '^#[0-9a-fA-F]{6}$')
);

-- Create tags table
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(7),
    description TEXT,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_tag_slug CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT valid_tag_color CHECK (color IS NULL OR color ~ '^#[0-9a-fA-F]{6}$')
);

-- Create main blog_posts table
CREATE TABLE blog_posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled', 'archived', 'trash')),
    featured_image VARCHAR(500),
    featured BOOLEAN DEFAULT FALSE,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- SEO Fields
    meta_title VARCHAR(60),
    meta_description VARCHAR(160),
    canonical_url VARCHAR(500),
    
    -- Analytics
    view_count INTEGER DEFAULT 0,
    reading_time INTEGER, -- in minutes
    
    -- Content Management
    version INTEGER DEFAULT 1,
    language VARCHAR(5) DEFAULT 'it',
    
    -- SEO Analysis Results (JSON)
    seo_analysis JSONB,
    
    CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT valid_language CHECK (language IN ('it', 'en')),
    CONSTRAINT scheduled_posts_have_date CHECK (
        (status = 'scheduled' AND scheduled_at IS NOT NULL) OR 
        (status != 'scheduled')
    )
);

-- Create many-to-many relationship tables
CREATE TABLE post_categories (
    post_id INTEGER REFERENCES blog_posts(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (post_id, category_id)
);

CREATE TABLE post_tags (
    post_id INTEGER REFERENCES blog_posts(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (post_id, tag_id)
);

-- Create comments table (optional feature)
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES blog_posts(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    author_name VARCHAR(100) NOT NULL,
    author_email VARCHAR(255) NOT NULL,
    author_website VARCHAR(255),
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'spam')),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_email CHECK (author_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create blog analytics table
CREATE TABLE blog_analytics (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES blog_posts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,2),
    avg_time_on_page INTEGER, -- seconds
    referrer_domain VARCHAR(255),
    traffic_source VARCHAR(50), -- 'organic', 'direct', 'social', 'referral'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(post_id, date, traffic_source)
);

-- Create media library table
CREATE TABLE media_library (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL, -- bytes
    mime_type VARCHAR(100) NOT NULL,
    width INTEGER, -- for images
    height INTEGER, -- for images
    alt_text TEXT,
    caption TEXT,
    uploaded_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create post revisions table (for version control)
CREATE TABLE post_revisions (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES blog_posts(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Store changes as JSON for comparison
    changes JSONB
);

-- Create system settings table
CREATE TABLE blog_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    description TEXT,
    type VARCHAR(20) DEFAULT 'string' CHECK (type IN ('string', 'number', 'boolean', 'json')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create webhook logs table for n8n integration
CREATE TABLE webhook_logs (
    id SERIAL PRIMARY KEY,
    webhook_type VARCHAR(50) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    payload JSONB,
    response JSONB,
    status_code INTEGER,
    success BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    execution_time INTEGER, -- milliseconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance

-- Blog posts indexes
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_created_at ON blog_posts(created_at DESC);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at DESC) WHERE status = 'published';
CREATE INDEX idx_blog_posts_featured ON blog_posts(featured, status) WHERE featured = TRUE;
CREATE INDEX idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX idx_blog_posts_scheduled ON blog_posts(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_blog_posts_search ON blog_posts USING gin(to_tsvector('italian', title || ' ' || content));

-- Categories indexes
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_display_order ON categories(display_order);

-- Tags indexes
CREATE INDEX idx_tags_slug ON tags(slug);
CREATE INDEX idx_tags_usage_count ON tags(usage_count DESC);

-- Comments indexes
CREATE INDEX idx_comments_post_status ON comments(post_id, status);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_status ON comments(status);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

-- Analytics indexes
CREATE INDEX idx_blog_analytics_post_date ON blog_analytics(post_id, date DESC);
CREATE INDEX idx_blog_analytics_date ON blog_analytics(date DESC);
CREATE INDEX idx_blog_analytics_traffic_source ON blog_analytics(traffic_source);

-- Media library indexes
CREATE INDEX idx_media_library_mime_type ON media_library(mime_type);
CREATE INDEX idx_media_library_uploaded_by ON media_library(uploaded_by);
CREATE INDEX idx_media_library_created_at ON media_library(created_at DESC);

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Relationship table indexes (automatically created for PRIMARY KEYs, but adding for clarity)
CREATE INDEX idx_post_categories_category ON post_categories(category_id);
CREATE INDEX idx_post_tags_tag ON post_tags(tag_id);

-- Webhook logs indexes
CREATE INDEX idx_webhook_logs_type ON webhook_logs(webhook_type);
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_logs_success ON webhook_logs(success);

-- Create database views for commonly used queries

-- View for published posts with full metadata
CREATE VIEW published_posts_full AS
SELECT 
    p.*,
    u.first_name || ' ' || u.last_name as author_name,
    u.avatar_url as author_avatar,
    u.bio as author_bio,
    ARRAY_AGG(DISTINCT c.name ORDER BY c.name) FILTER (WHERE c.name IS NOT NULL) as categories,
    ARRAY_AGG(DISTINCT c.slug ORDER BY c.name) FILTER (WHERE c.slug IS NOT NULL) as category_slugs,
    ARRAY_AGG(DISTINCT t.name ORDER BY t.name) FILTER (WHERE t.name IS NOT NULL) as tags,
    ARRAY_AGG(DISTINCT t.slug ORDER BY t.name) FILTER (WHERE t.slug IS NOT NULL) as tag_slugs,
    COALESCE(a.total_views, 0) as total_views
FROM blog_posts p
LEFT JOIN users u ON p.author_id = u.id
LEFT JOIN post_categories pc ON p.id = pc.post_id
LEFT JOIN categories c ON pc.category_id = c.id
LEFT JOIN post_tags pt ON p.id = pt.post_id
LEFT JOIN tags t ON pt.tag_id = t.id
LEFT JOIN (
    SELECT post_id, SUM(views) as total_views 
    FROM blog_analytics 
    GROUP BY post_id
) a ON p.id = a.post_id
WHERE p.status = 'published'
GROUP BY p.id, u.first_name, u.last_name, u.avatar_url, u.bio, a.total_views;

-- View for post analytics summary
CREATE VIEW post_analytics_summary AS
SELECT 
    p.id,
    p.title,
    p.slug,
    p.published_at,
    COALESCE(SUM(ba.views), 0) as total_views,
    COALESCE(SUM(ba.unique_visitors), 0) as total_unique_visitors,
    COALESCE(AVG(ba.avg_time_on_page), 0) as avg_time_on_page,
    COUNT(DISTINCT ba.date) as days_tracked
FROM blog_posts p
LEFT JOIN blog_analytics ba ON p.id = ba.post_id
WHERE p.status = 'published'
GROUP BY p.id, p.title, p.slug, p.published_at
ORDER BY total_views DESC;

-- View for category statistics
CREATE VIEW category_statistics AS
SELECT 
    c.*,
    COUNT(pc.post_id) as post_count,
    COUNT(CASE WHEN p.status = 'published' THEN 1 END) as published_post_count,
    COALESCE(SUM(ba.views), 0) as total_category_views
FROM categories c
LEFT JOIN post_categories pc ON c.id = pc.category_id
LEFT JOIN blog_posts p ON pc.post_id = p.id
LEFT JOIN blog_analytics ba ON p.id = ba.post_id AND p.status = 'published'
GROUP BY c.id
ORDER BY published_post_count DESC;

-- Functions and Triggers

-- Function to automatically update tag usage counts
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE tags SET usage_count = GREATEST(usage_count - 1, 0) WHERE id = OLD.tag_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for tag usage count
CREATE TRIGGER trigger_update_tag_usage
    AFTER INSERT OR DELETE ON post_tags
    FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

-- Function to automatically update post updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at fields
CREATE TRIGGER trigger_blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically generate reading time
CREATE OR REPLACE FUNCTION calculate_reading_time()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate reading time based on word count (assuming 200 words per minute)
    NEW.reading_time = GREATEST(
        1, 
        ROUND(
            array_length(
                string_to_array(
                    regexp_replace(NEW.content, '<[^>]*>', '', 'g'), 
                    ' '
                ), 1
            ) / 200.0
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for reading time calculation
CREATE TRIGGER trigger_calculate_reading_time
    BEFORE INSERT OR UPDATE OF content ON blog_posts
    FOR EACH ROW EXECUTE FUNCTION calculate_reading_time();

-- Insert default categories for IT-ERA services
INSERT INTO categories (name, slug, description, color, icon, display_order) VALUES
('Assistenza IT', 'assistenza-it', 'Articoli su assistenza tecnica e supporto informatico', '#0056cc', 'fas fa-tools', 1),
('Sicurezza Informatica', 'sicurezza-informatica', 'Consigli e aggiornamenti sulla sicurezza IT', '#dc3545', 'fas fa-shield-alt', 2),
('Cloud Storage', 'cloud-storage', 'Soluzioni cloud e backup dei dati', '#17a2b8', 'fas fa-cloud', 3),
('News Tecnologiche', 'news-tecnologiche', 'Ultime novità dal mondo della tecnologia', '#28a745', 'fas fa-newspaper', 4),
('Guide e Tutorial', 'guide-tutorial', 'Guide pratiche e tutorial passo-passo', '#ffc107', 'fas fa-book-open', 5);

-- Insert default tags
INSERT INTO tags (name, slug, description) VALUES
('Windows', 'windows', 'Articoli relativi al sistema operativo Windows'),
('Linux', 'linux', 'Contenuti su distribuzioni e sistemi Linux'),
('macOS', 'macos', 'Articoli per sistemi Apple macOS'),
('Backup', 'backup', 'Strategie e soluzioni di backup'),
('Antivirus', 'antivirus', 'Software antivirus e protezione malware'),
('Firewall', 'firewall', 'Configurazione e gestione firewall'),
('VPN', 'vpn', 'Reti private virtuali e sicurezza connessioni'),
('Office', 'office', 'Suite Microsoft Office e alternative'),
('Server', 'server', 'Gestione e manutenzione server'),
('Network', 'network', 'Reti e infrastrutture di rete'),
('Hardware', 'hardware', 'Componenti hardware e manutenzione'),
('Software', 'software', 'Applicazioni e programmi software'),
('Lombardia', 'lombardia', 'Servizi specifici per la regione Lombardia'),
('Milano', 'milano', 'Servizi IT a Milano e provincia'),
('Monza', 'monza', 'Assistenza IT Monza e Brianza'),
('Bergamo', 'bergamo', 'Supporto tecnico provincia di Bergamo'),
('Como', 'como', 'Servizi informatici Como e laghi');

-- Insert default admin user (password should be changed immediately)
-- Note: This is a placeholder - in production, create admin user via API with proper password hashing
INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active, email_verified) VALUES
('admin', 'info@it-era.it', '$2b$12$placeholder_hash_change_immediately', 'IT', 'ERA', 'admin', TRUE, TRUE);

-- Insert initial blog settings
INSERT INTO blog_settings (key, value, description, type) VALUES
('blog_title', 'Blog IT-ERA', 'Titolo principale del blog', 'string'),
('blog_description', 'Aggiornamenti su assistenza IT, sicurezza informatica e tecnologia per aziende in Lombardia', 'Descrizione del blog per SEO', 'string'),
('posts_per_page', '12', 'Numero di post per pagina', 'number'),
('allow_comments', 'true', 'Abilita commenti sui post', 'boolean'),
('moderate_comments', 'true', 'Modera commenti prima della pubblicazione', 'boolean'),
('auto_publish_scheduled', 'true', 'Pubblicazione automatica post programmati', 'boolean'),
('seo_auto_generate', 'true', 'Generazione automatica meta tag SEO', 'boolean'),
('backup_enabled', 'true', 'Abilita backup automatico contenuti', 'boolean'),
('analytics_enabled', 'true', 'Abilita tracking analytics', 'boolean'),
('sitemap_auto_update', 'true', 'Aggiornamento automatico sitemap', 'boolean');

-- Create full-text search configuration for Italian
CREATE TEXT SEARCH CONFIGURATION italian_blog (COPY = italian);

-- Grant permissions (adjust based on your user setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO blog_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO blog_user;