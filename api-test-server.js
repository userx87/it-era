#!/usr/bin/env node
/**
 * Server di test locale per API creazione articoli blog
 * Simula l'endpoint che verrà usato da n8n
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());

// Endpoint per creare articoli
app.post('/api/posts', (req, res) => {
    console.log('📨 Received POST request to /api/posts');
    console.log('🔑 Headers:', req.headers);
    console.log('📋 Body:', JSON.stringify(req.body, null, 2));
    
    const {
        title,
        slug,
        content,
        excerpt,
        author,
        category,
        tags,
        meta_description,
        featured_image
    } = req.body;
    
    // Validazione
    if (!title || !slug || !content) {
        return res.status(400).json({
            error: 'Missing required fields: title, slug, content',
            received: Object.keys(req.body)
        });
    }
    
    const publishedDate = new Date().toISOString().split('T')[0];
    
    // Template HTML articolo
    const articleTemplate = `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${meta_description || excerpt || title}">
    <meta name="keywords" content="${Array.isArray(tags) ? tags.join(', ') : ''}">
    <meta name="author" content="${author || 'IT-ERA Team'}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${excerpt || title}">
    <meta property="og:image" content="${featured_image || '/images/blog/default.jpg'}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="IT-ERA">
    
    <title>${title} | IT-ERA Blog</title>
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    
    <style>
        :root { --it-era-blue: #0056cc; }
        .navbar { background: var(--it-era-blue) !important; }
        .article-header {
            background: linear-gradient(135deg, var(--it-era-blue), #0045a3);
            color: white;
            padding: 4rem 0 2rem;
        }
        .article-content { font-size: 1.1rem; line-height: 1.8; }
        .cta-section {
            background: #f8f9fa;
            border-left: 4px solid var(--it-era-blue);
            padding: 2rem;
            margin: 2rem 0;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-dark">
        <div class="container">
            <a class="navbar-brand fw-bold" href="/"><i class="fas fa-laptop-code me-2"></i>IT-ERA</a>
            <div class="navbar-nav ms-auto">
                <a class="nav-link" href="/">🏠 Home</a>
                <a class="nav-link" href="/pages/assistenza-it-milano.html">🔧 Servizi</a>
                <a class="nav-link active" href="/blog/">📝 Blog</a>
                <a class="nav-link" href="/contatti.html">📞 Contatti</a>
            </div>
        </div>
    </nav>

    <!-- Article Header -->
    <section class="article-header">
        <div class="container">
            <div class="row">
                <div class="col-lg-8 mx-auto text-center">
                    <h1 class="display-5 fw-bold mb-3">${title}</h1>
                    ${excerpt ? `<p class="lead mb-4">${excerpt}</p>` : ''}
                    <div class="text-white-50">
                        <i class="fas fa-user me-2"></i>${author || 'IT-ERA Team'}
                        <span class="mx-3">|</span>
                        <i class="fas fa-calendar me-2"></i>${new Date(publishedDate).toLocaleDateString('it-IT')}
                        ${category ? `<span class="mx-3">|</span><i class="fas fa-folder me-2"></i>${category}` : ''}
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Article Content -->
    <section class="py-5">
        <div class="container">
            <div class="row">
                <div class="col-lg-8 mx-auto">
                    <article class="article-content">
                        ${content}
                    </article>
                    
                    <!-- CTA -->
                    <div class="cta-section text-center">
                        <h4>🚀 Hai bisogno di supporto IT?</h4>
                        <p>IT-ERA offre soluzioni personalizzate per la tua azienda.</p>
                        <a href="/contatti.html" class="btn btn-primary">Contattaci</a>
                        <p class="mt-2 mb-0">
                            <i class="fas fa-phone me-2"></i>039 888 2041 | 
                            <i class="fas fa-envelope me-2"></i>info@it-era.it
                        </p>
                    </div>
                    
                    ${Array.isArray(tags) && tags.length > 0 ? `
                    <div class="mt-4 pt-4 border-top">
                        <h5>Tag:</h5>
                        ${tags.map(tag => `<span class="badge bg-primary me-2">${tag}</span>`).join('')}
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
    </section>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- IT-ERA Chatbot -->
    <style id="it-era-chatbot-styles">
    #it-era-chatbot-container {
        position: fixed; bottom: 20px; right: 20px; z-index: 10000;
    }
    #it-era-chatbot-button {
        width: 60px; height: 60px; border-radius: 50%;
        background: linear-gradient(135deg, #0056cc, #0045a3);
        border: none; cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex; align-items: center; justify-content: center;
    }
    #it-era-chatbot-button svg { width: 24px; height: 24px; fill: white; }
    </style>
    
    <div id="it-era-chatbot-container">
        <button id="it-era-chatbot-button" title="Chatta con IT-ERA">
            <svg viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>
        </button>
    </div>
    
    <script>
    document.getElementById('it-era-chatbot-button').addEventListener('click', function() {
        alert('Chatbot IT-ERA - Per assistenza chiama 039 888 2041 o scrivi a info@it-era.it');
    });
    </script>
</body>
</html>`;
    
    // Salva l'articolo
    const filePath = path.join(__dirname, 'web', 'blog', `${slug}.html`);
    
    try {
        fs.writeFileSync(filePath, articleTemplate);
        
        const response = {
            success: true,
            message: 'Articolo creato con successo',
            article: {
                title,
                slug,
                url: `https://it-era.pages.dev/blog/${slug}.html`,
                file_path: filePath,
                published_date: publishedDate,
                category: category || 'General',
                tags: Array.isArray(tags) ? tags : [],
                author: author || 'IT-ERA Team'
            }
        };
        
        console.log('✅ Articolo salvato:', filePath);
        res.status(201).json(response);
        
    } catch (error) {
        console.error('❌ Errore:', error.message);
        res.status(500).json({
            success: false,
            error: 'Errore interno del server',
            details: error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'IT-ERA Blog API Test',
        timestamp: new Date().toISOString()
    });
});

// Lista articoli esistenti
app.get('/api/posts', (req, res) => {
    const blogDir = path.join(__dirname, 'web', 'blog');
    const articles = fs.readdirSync(blogDir)
        .filter(file => file.endsWith('.html') && file !== 'index.html')
        .map(file => ({
            file: file,
            url: `https://it-era.pages.dev/blog/${file}`,
            slug: file.replace('.html', '')
        }));
    
    res.json({
        total: articles.length,
        articles
    });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`🚀 IT-ERA Blog API Test Server running on http://localhost:${PORT}`);
    console.log('📖 Endpoints:');
    console.log('   POST /api/posts - Crea nuovo articolo');
    console.log('   GET  /api/posts - Lista articoli esistenti');
    console.log('   GET  /health   - Health check');
    console.log('\n🧪 Per testare con curl:');
    console.log(`curl -X POST http://localhost:${PORT}/api/posts -H "Content-Type: application/json" -d '{"title":"Test","slug":"test-slug","content":"<p>Test content</p>"}'`);
});