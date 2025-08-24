#!/usr/bin/env python3
"""
Landing Page Generator Utilities
Utility classes and functions for the comprehensive landing page generator.

Author: Claude Code
Version: 2.0
Date: 2025-01-24
"""

import os
import re
import json
import logging
from pathlib import Path
from typing import List, Dict, Tuple, Optional
from urllib.parse import urlparse
import html
import xml.etree.ElementTree as ET

logger = logging.getLogger(__name__)

class SEOOptimizer:
    """SEO optimization utilities"""
    
    def __init__(self):
        self.title_max_length = 60
        self.description_max_length = 160
        self.keywords_max_count = 10
        
    def optimize_title(self, title: str, city: str, service: str) -> str:
        """Optimize page title for SEO"""
        if len(title) <= self.title_max_length:
            return title
            
        # Truncate intelligently
        base_title = f"{service} {city}"
        if len(base_title) <= self.title_max_length - 10:
            return f"{base_title} | IT-ERA"
        else:
            return base_title[:self.title_max_length]
    
    def optimize_description(self, description: str) -> str:
        """Optimize meta description for SEO"""
        if len(description) <= self.description_max_length:
            return description
            
        # Truncate at word boundary
        truncated = description[:self.description_max_length - 3]
        last_space = truncated.rfind(' ')
        if last_space > self.description_max_length - 20:
            return truncated[:last_space] + "..."
        else:
            return truncated + "..."
    
    def generate_keywords(self, city: str, service: str, region: str = "Lombardia") -> List[str]:
        """Generate SEO keywords"""
        base_keywords = [
            f"{service.lower()} {city.lower()}",
            f"{service.lower()} {region.lower()}",
            f"servizi it {city.lower()}",
            f"consulenza informatica {city.lower()}",
            f"supporto tecnico {city.lower()}"
        ]
        
        return base_keywords[:self.keywords_max_count]

class ContactFormIntegrator:
    """Contact form integration utilities"""
    
    def __init__(self, email: str = "andrea@bulltech.it"):
        self.primary_email = email
        
    def generate_contact_form_html(self, city: str, service: str) -> str:
        """Generate contact form HTML with proper integration"""
        
        form_html = f'''
        <form id="contact-form-{city.lower()}" class="contact-form" method="POST" action="/api/contact">
            <input type="hidden" name="city" value="{city}">
            <input type="hidden" name="service" value="{service}">
            <input type="hidden" name="source" value="{service.lower()}-{city.lower()}-landing">
            
            <div class="form-group">
                <label for="name">Nome *</label>
                <input type="text" id="name" name="name" required>
            </div>
            
            <div class="form-group">
                <label for="email">Email *</label>
                <input type="email" id="email" name="email" required>
            </div>
            
            <div class="form-group">
                <label for="phone">Telefono</label>
                <input type="tel" id="phone" name="phone">
            </div>
            
            <div class="form-group">
                <label for="company">Azienda</label>
                <input type="text" id="company" name="company">
            </div>
            
            <div class="form-group">
                <label for="message">Messaggio *</label>
                <textarea id="message" name="message" rows="5" required 
                          placeholder="Descrivici le tue esigenze di {service.lower()} per {city}..."></textarea>
            </div>
            
            <!-- Honeypot field for spam protection -->
            <input type="text" name="website" style="display: none;" tabindex="-1" autocomplete="off">
            
            <div class="form-group">
                <button type="submit" class="btn-primary">
                    Richiedi Consulenza Gratuita
                </button>
            </div>
            
            <div class="form-privacy">
                <small>I tuoi dati sono protetti secondo GDPR. 
                Contatto: <a href="mailto:{self.primary_email}">{self.primary_email}</a></small>
            </div>
        </form>
        '''
        
        return form_html
    
    def generate_contact_js(self) -> str:
        """Generate JavaScript for contact form handling"""
        
        js_code = '''
        document.addEventListener('DOMContentLoaded', function() {
            const contactForms = document.querySelectorAll('.contact-form');
            
            contactForms.forEach(function(form) {
                form.addEventListener('submit', function(e) {
                    e.preventDefault();
                    
                    const formData = new FormData(form);
                    const submitBtn = form.querySelector('button[type="submit"]');
                    const originalText = submitBtn.textContent;
                    
                    // Show loading state
                    submitBtn.textContent = 'Invio in corso...';
                    submitBtn.disabled = true;
                    
                    fetch(form.action, {
                        method: 'POST',
                        body: formData
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            form.innerHTML = '<div class="success-message">✅ Grazie! Ti contatteremo entro 24 ore.</div>';
                        } else {
                            throw new Error(data.message || 'Errore durante l\'invio');
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        submitBtn.textContent = originalText;
                        submitBtn.disabled = false;
                        alert('Errore durante l\'invio. Riprova o contattaci direttamente.');
                    });
                });
            });
        });
        '''
        
        return js_code

class TemplateValidator:
    """Template validation utilities"""
    
    def __init__(self):
        self.required_placeholders = ['{{CITY}}', '{{SERVICE_TYPE}}']
        self.required_html_elements = ['<title>', '<meta name="description"', '<h1', '<footer']
        self.required_seo_elements = ['canonical', 'og:title', 'og:description', 'schema.org']
    
    def validate_html_structure(self, content: str) -> Tuple[bool, List[str]]:
        """Validate HTML structure"""
        issues = []
        
        # Check for required HTML elements
        for element in self.required_html_elements:
            if element not in content:
                issues.append(f"Missing required HTML element: {element}")
        
        # Check for proper HTML structure
        if not content.strip().startswith('<!DOCTYPE') and not content.strip().startswith('<html'):
            issues.append("Missing DOCTYPE or HTML declaration")
        
        # Check for balanced tags (basic check)
        open_tags = re.findall(r'<([a-zA-Z][^>]*?)>', content)
        close_tags = re.findall(r'</([a-zA-Z][^>]*?)>', content)
        
        if len(open_tags) < len(close_tags):
            issues.append("Possible unclosed HTML tags detected")
        
        return len(issues) == 0, issues
    
    def validate_seo_optimization(self, content: str) -> Tuple[int, List[str]]:
        """Validate SEO optimization and return score 0-100"""
        issues = []
        score = 100
        
        # Check title
        title_match = re.search(r'<title[^>]*>(.*?)</title>', content, re.IGNORECASE)
        if not title_match:
            issues.append("Missing page title")
            score -= 20
        else:
            title = title_match.group(1).strip()
            if len(title) < 30:
                issues.append("Title too short (< 30 characters)")
                score -= 10
            elif len(title) > 60:
                issues.append("Title too long (> 60 characters)")
                score -= 5
        
        # Check meta description
        desc_match = re.search(r'<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"\']*)["\']', content, re.IGNORECASE)
        if not desc_match:
            issues.append("Missing meta description")
            score -= 20
        else:
            desc = desc_match.group(1).strip()
            if len(desc) < 120:
                issues.append("Meta description too short (< 120 characters)")
                score -= 10
            elif len(desc) > 160:
                issues.append("Meta description too long (> 160 characters)")
                score -= 5
        
        # Check H1
        h1_matches = re.findall(r'<h1[^>]*>(.*?)</h1>', content, re.IGNORECASE)
        if not h1_matches:
            issues.append("Missing H1 tag")
            score -= 15
        elif len(h1_matches) > 1:
            issues.append("Multiple H1 tags found (should be unique)")
            score -= 10
        
        # Check for SEO elements
        for element in self.required_seo_elements:
            if element.lower() not in content.lower():
                issues.append(f"Missing SEO element: {element}")
                score -= 5
        
        # Check for internal links
        internal_links = re.findall(r'<a[^>]*href=["\']([^"\']*)["\']', content, re.IGNORECASE)
        internal_count = len([link for link in internal_links if link.startswith('/') or 'it-era' in link])
        if internal_count < 3:
            issues.append("Insufficient internal links (< 3)")
            score -= 10
        
        return max(0, score), issues
    
    def validate_placeholders_replaced(self, content: str) -> Tuple[bool, List[str]]:
        """Check if all placeholders have been replaced"""
        remaining_placeholders = re.findall(r'\{\{[^}]+\}\}', content)
        if remaining_placeholders:
            return False, [f"Unreplaced placeholders: {remaining_placeholders}"]
        return True, []

class PerformanceAnalyzer:
    """Performance analysis utilities"""
    
    def analyze_page_size(self, content: str) -> Dict[str, any]:
        """Analyze page size and performance metrics"""
        size_bytes = len(content.encode('utf-8'))
        size_kb = size_bytes / 1024
        
        # Analyze various metrics
        images = len(re.findall(r'<img[^>]*>', content))
        external_scripts = len(re.findall(r'<script[^>]*src=["\']https?://[^"\']*["\']', content))
        inline_scripts = len(re.findall(r'<script[^>]*>.*?</script>', content, re.DOTALL))
        css_files = len(re.findall(r'<link[^>]*rel=["\']stylesheet["\']', content))
        
        # Performance rating
        if size_kb < 100:
            size_rating = "Excellent"
        elif size_kb < 200:
            size_rating = "Good"
        elif size_kb < 500:
            size_rating = "Fair"
        else:
            size_rating = "Poor"
        
        return {
            'size_bytes': size_bytes,
            'size_kb': round(size_kb, 2),
            'size_rating': size_rating,
            'images_count': images,
            'external_scripts': external_scripts,
            'inline_scripts': inline_scripts,
            'css_files': css_files,
            'performance_score': max(0, 100 - (size_kb / 10) - (external_scripts * 5))
        }

def create_robots_txt(web_dir: Path) -> bool:
    """Create robots.txt file"""
    try:
        robots_content = """User-agent: *
Allow: /

# Sitemaps
Sitemap: https://it-era.pages.dev/sitemap.xml

# Crawl-delay for polite crawling
Crawl-delay: 1

# Allow all major search engines
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Slurp
Allow: /

# Block access to sensitive areas
Disallow: /api/
Disallow: /admin/
Disallow: /_headers
Disallow: /_redirects
Disallow: /functions/

# Allow access to important files
Allow: /sitemap.xml
Allow: /robots.txt
"""
        
        robots_path = web_dir / "robots.txt"
        with open(robots_path, 'w', encoding='utf-8') as f:
            f.write(robots_content)
        
        logger.info(f"Created robots.txt at {robots_path}")
        return True
        
    except Exception as e:
        logger.error(f"Error creating robots.txt: {e}")
        return False

def create_htaccess(web_dir: Path) -> bool:
    """Create .htaccess file for Apache servers"""
    try:
        htaccess_content = r"""# IT-ERA Landing Pages .htaccess
# Performance and SEO optimizations

# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Browser caching
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/gif "access plus 1 month"
    ExpiresByType image/webp "access plus 1 month"
    ExpiresByType text/html "access plus 1 day"
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# SEO-friendly redirects for old URLs
RewriteEngine On

# Redirect www to non-www (if needed)
RewriteCond %{HTTP_HOST} ^www\.(.*)$ [NC]
RewriteRule ^(.*)$ https://%1/$1 [R=301,L]

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Custom error pages
ErrorDocument 404 /404.html
ErrorDocument 500 /500.html
"""
        
        htaccess_path = web_dir / ".htaccess"
        with open(htaccess_path, 'w', encoding='utf-8') as f:
            f.write(htaccess_content)
        
        logger.info(f"Created .htaccess at {htaccess_path}")
        return True
        
    except Exception as e:
        logger.error(f"Error creating .htaccess: {e}")
        return False

def validate_template_file(template_path: Path) -> Tuple[bool, List[str]]:
    """Validate a single template file"""
    issues = []
    
    if not template_path.exists():
        return False, [f"Template file not found: {template_path}"]
    
    try:
        with open(template_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return False, [f"Error reading template: {e}"]
    
    # Check for required placeholders
    required_placeholders = ['{{CITY}}', '{{SERVICE_TYPE}}']
    for placeholder in required_placeholders:
        if placeholder not in content:
            issues.append(f"Missing required placeholder: {placeholder}")
    
    # Check for basic HTML structure
    if not any(tag in content for tag in ['<html', '<head', '<body']):
        issues.append("Missing basic HTML structure")
    
    # Check for SEO elements
    if '<title>' not in content:
        issues.append("Missing title tag")
    
    if 'meta name="description"' not in content:
        issues.append("Missing meta description")
    
    return len(issues) == 0, issues

# Export all utilities
__all__ = [
    'SEOOptimizer',
    'ContactFormIntegrator', 
    'TemplateValidator',
    'PerformanceAnalyzer',
    'create_robots_txt',
    'create_htaccess',
    'validate_template_file'
]