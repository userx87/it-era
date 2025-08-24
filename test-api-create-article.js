#!/usr/bin/env node
/**
 * Test API per creare articoli blog tramite n8n
 */

const fs = require('fs');
const path = require('path');

// Dati dell'articolo da creare
const articleData = {
    title: "Test API - Automazione IT con n8n",
    slug: "test-api-automazione-it-n8n",
    content: `<h2>Introduzione all'Automazione IT</h2>
<p>L'automazione IT rappresenta una rivoluzione nel modo in cui le aziende gestiscono i propri sistemi informatici. Con strumenti come n8n, è possibile creare workflow automatizzati che migliorano l'efficienza operativa.</p>

<h3>Vantaggi dell'Automazione</h3>
<ul>
    <li><strong>Riduzione degli errori umani</strong> - Processi standardizzati e ripetibili</li>
    <li><strong>Maggiore velocità di esecuzione</strong> - Automatizzazione delle task ripetitive</li>
    <li><strong>Risparmio di tempo e risorse</strong> - Focus su attività strategiche</li>
    <li><strong>Miglior controllo dei processi</strong> - Monitoraggio e logging centralizzati</li>
</ul>

<h3>Implementazione con n8n</h3>
<p>n8n è uno strumento potente per l'automazione dei workflow che permette di:</p>
<ul>
    <li>Integrare diversi servizi e API</li>
    <li>Creare workflow visivi drag-and-drop</li>
    <li>Automatizzare processi aziendali complessi</li>
    <li>Monitorare l'esecuzione in tempo reale</li>
</ul>

<div class="alert alert-info">
    <h4>💡 Esempio Pratico</h4>
    <p>Automatizza la creazione di ticket di supporto quando arriva una email di emergenza, notifica il team via Slack e crea un reminder in calendario.</p>
</div>

<h3>Best Practices per l'Automazione</h3>
<ol>
    <li><strong>Inizia con processi semplici</strong> - Testa e perfeziona</li>
    <li><strong>Documenta ogni workflow</strong> - Facilita manutenzione</li>
    <li><strong>Implementa error handling</strong> - Gestisci eccezioni</li>
    <li><strong>Monitora le performance</strong> - Ottimizza continuamente</li>
</ol>

<blockquote class="blockquote">
    <p>"L'automazione IT non è un lusso, ma una necessità per rimanere competitivi nel mercato digitale."</p>
    <footer class="blockquote-footer">IT-ERA Team</footer>
</blockquote>

<h3>Conclusioni</h3>
<p>L'automazione IT con strumenti come n8n rappresenta il futuro della gestione aziendale. IT-ERA ti supporta nell'implementazione di soluzioni personalizzate.</p>

<div class="cta-section">
    <h4>🚀 Vuoi automatizzare i tuoi processi IT?</h4>
    <p>Contatta IT-ERA per una consulenza gratuita.</p>
    <a href="/contatti.html" class="btn btn-primary">Richiedi Consulenza</a>
</div>`,
    excerpt: "Scopri come l'automazione IT con n8n può trasformare i processi aziendali e migliorare l'efficienza operativa della tua impresa.",
    author: "IT-ERA Team", 
    category: "Automazione",
    tags: ["automazione", "n8n", "workflow", "efficienza", "API"],
    meta_description: "Guida completa all'automazione IT con n8n per aziende moderne. Scopri vantaggi, implementazione e best practices per ottimizzare i processi.",
    featured_image: "/images/blog/automazione-it-n8n.jpg",
    published_date: new Date().toISOString().split('T')[0]
};

// Simula la creazione dell'articolo
console.log('🚀 Testing API Article Creation...\n');

// Template HTML dell'articolo
const articleTemplate = `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${articleData.meta_description}">
    <meta name="keywords" content="${articleData.tags.join(', ')}">
    <meta name="author" content="${articleData.author}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${articleData.title}">
    <meta property="og:description" content="${articleData.excerpt}">
    <meta property="og:image" content="${articleData.featured_image}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="IT-ERA">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${articleData.title}">
    <meta name="twitter:description" content="${articleData.excerpt}">
    <meta name="twitter:image" content="${articleData.featured_image}">
    
    <title>${articleData.title} | IT-ERA Blog</title>
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    
    <!-- IT-ERA Styles -->
    <style>
        :root {
            --it-era-blue: #0056cc;
            --it-era-dark: #1a1a2e;
            --it-era-light: #f8f9fa;
        }
        
        .navbar { background: var(--it-era-blue) !important; }
        .btn-primary { background: var(--it-era-blue); border-color: var(--it-era-blue); }
        .btn-primary:hover { background: #0045a3; border-color: #0045a3; }
        
        .article-header {
            background: linear-gradient(135deg, var(--it-era-blue), #0045a3);
            color: white;
            padding: 4rem 0 2rem;
        }
        
        .article-meta {
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            padding: 1rem;
            margin: 1rem 0;
        }
        
        .article-content {
            font-size: 1.1rem;
            line-height: 1.8;
        }
        
        .article-content h2 {
            color: var(--it-era-blue);
            margin-top: 2rem;
        }
        
        .article-content h3 {
            color: var(--it-era-dark);
            margin-top: 1.5rem;
        }
        
        .cta-section {
            background: var(--it-era-light);
            border-left: 4px solid var(--it-era-blue);
            padding: 2rem;
            margin: 2rem 0;
            border-radius: 5px;
        }
        
        .related-articles {
            background: var(--it-era-light);
            padding: 2rem;
            border-radius: 10px;
            margin: 3rem 0;
        }
        
        .tag-badge {
            background: var(--it-era-blue);
            color: white;
            padding: 0.3rem 0.6rem;
            border-radius: 15px;
            font-size: 0.8rem;
            margin-right: 0.5rem;
            text-decoration: none;
        }
        
        .tag-badge:hover {
            background: #0045a3;
            color: white;
        }
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-dark">
        <div class="container">
            <a class="navbar-brand fw-bold" href="/">
                <i class="fas fa-laptop-code me-2"></i>IT-ERA
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="/">🏠 Home</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/pages/assistenza-it-milano.html">🔧 Servizi</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/perche-scegliere-it-era.html">💼 Perché IT-ERA</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link active" href="/blog/">📝 Blog</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/contatti.html">📞 Contatti</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <!-- Article Header -->
    <section class="article-header">
        <div class="container">
            <div class="row">
                <div class="col-lg-8 mx-auto text-center">
                    <h1 class="display-5 fw-bold mb-3">${articleData.title}</h1>
                    <p class="lead mb-4">${articleData.excerpt}</p>
                    
                    <div class="article-meta">
                        <div class="row align-items-center">
                            <div class="col-md-6 text-md-start">
                                <i class="fas fa-user me-2"></i>${articleData.author}
                            </div>
                            <div class="col-md-6 text-md-end">
                                <i class="fas fa-calendar me-2"></i>${new Date(articleData.published_date).toLocaleDateString('it-IT')}
                            </div>
                        </div>
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
                        ${articleData.content}
                    </article>
                    
                    <!-- Tags -->
                    <div class="mt-4 pt-4 border-top">
                        <h5>Tag:</h5>
                        ${articleData.tags.map(tag => `<a href="/blog/?tag=${tag}" class="tag-badge">${tag}</a>`).join('')}
                    </div>
                    
                    <!-- Related Articles -->
                    <div class="related-articles">
                        <h4><i class="fas fa-newspaper me-2"></i>Articoli Correlati</h4>
                        <div class="row mt-3">
                            <div class="col-md-6">
                                <a href="/blog/ransomware-protezione-completa-2024.html" class="text-decoration-none">
                                    <div class="card">
                                        <div class="card-body">
                                            <h6 class="card-title">Proteggere la Tua Azienda dal Ransomware nel 2024</h6>
                                        </div>
                                    </div>
                                </a>
                            </div>
                            <div class="col-md-6">
                                <a href="/blog/cloud-backup-veeam-guida-completa.html" class="text-decoration-none">
                                    <div class="card">
                                        <div class="card-body">
                                            <h6 class="card-title">Guida Completa al Cloud Backup con Veeam</h6>
                                        </div>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- IT-ERA Chatbot -->
    <style id="it-era-chatbot-styles">
    #it-era-chatbot-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 10000;
    }
    
    #it-era-chatbot-button {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #0056cc, #0045a3);
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
    }
    
    #it-era-chatbot-button:hover {
        transform: scale(1.05);
    }
    
    #it-era-chatbot-button svg {
        width: 24px;
        height: 24px;
        fill: white;
    }
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

    <!-- Structured Data -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "${articleData.title}",
        "description": "${articleData.excerpt}",
        "author": {
            "@type": "Organization",
            "name": "${articleData.author}"
        },
        "datePublished": "${articleData.published_date}",
        "dateModified": "${articleData.published_date}",
        "publisher": {
            "@type": "Organization",
            "name": "IT-ERA",
            "logo": {
                "@type": "ImageObject",
                "url": "https://it-era.pages.dev/images/logo.png"
            }
        },
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": "https://it-era.pages.dev/blog/${articleData.slug}.html"
        },
        "keywords": "${articleData.tags.join(', ')}"
    }
    </script>
</body>
</html>`;

// Salva l'articolo
const filePath = path.join(__dirname, 'web', 'blog', `${articleData.slug}.html`);

try {
    fs.writeFileSync(filePath, articleTemplate);
    
    console.log('✅ Articolo creato con successo!');
    console.log(`📁 File: ${filePath}`);
    console.log(`🌐 URL: https://it-era.pages.dev/blog/${articleData.slug}.html`);
    console.log(`📝 Titolo: ${articleData.title}`);
    console.log(`📂 Categoria: ${articleData.category}`);
    console.log(`🏷️ Tags: ${articleData.tags.join(', ')}`);
    console.log('\n🚀 API Test completato con successo!');
    console.log('\nPer deploy su Cloudflare Pages esegui:');
    console.log('npx wrangler pages deploy web --project-name=it-era --branch=production');
    
} catch (error) {
    console.error('❌ Errore nella creazione dell\'articolo:', error.message);
}