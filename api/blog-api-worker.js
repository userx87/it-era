/**
 * IT-ERA Blog API Worker per Cloudflare
 * Endpoint online per n8n per creare articoli blog
 */

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  }
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    })
  }
  
  try {
    // Routes
    if (url.pathname === '/health' && request.method === 'GET') {
      return handleHealth()
    }
    
    if (url.pathname === '/api/posts' && request.method === 'POST') {
      return handleCreatePost(request)
    }
    
    if (url.pathname === '/api/posts' && request.method === 'GET') {
      return handleListPosts(request)
    }
    
    // 404 for unknown routes
    return new Response('Not Found', { 
      status: 404,
      headers: corsHeaders 
    })
    
  } catch (error) {
    console.error('API Error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    })
  }
}

async function handleHealth() {
  return new Response(JSON.stringify({
    status: 'OK',
    service: 'IT-ERA Blog API',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  })
}

async function handleCreatePost(request) {
  try {
    const data = await request.json()
    
    // Validazione campi obbligatori
    const { title, slug, content, seo_title, meta_description, focus_keyword } = data
    if (!title || !slug || !content) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields',
        required: ['title', 'slug', 'content'],
        optional_seo: ['seo_title', 'meta_description', 'focus_keyword'],
        received: Object.keys(data)
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }
    
    // Validazione SEO (raccomandazioni)
    const seoWarnings = []
    if (!seo_title) seoWarnings.push('seo_title mancante - usando title')
    if (!meta_description) seoWarnings.push('meta_description mancante - usando excerpt')
    if (!focus_keyword) seoWarnings.push('focus_keyword mancante - SEO non ottimizzato')
    if (seo_title && seo_title.length > 60) seoWarnings.push('seo_title troppo lungo (>60 caratteri)')
    if (meta_description && meta_description.length > 160) seoWarnings.push('meta_description troppo lunga (>160 caratteri)')
    
    // Genera l'articolo HTML
    const articleHtml = generateArticleHtml(data)
    
    // In un ambiente reale, qui salveresti su GitHub o altro storage
    // Per ora simula il salvataggio
    const response = {
      success: true,
      message: 'Articolo creato con successo',
      article: {
        title: data.title,
        seo_title: data.seo_title || data.title,
        slug: data.slug,
        url: `https://it-era.pages.dev/blog/${data.slug}.html`,
        published_date: new Date().toISOString().split('T')[0],
        category: data.category || 'General',
        tags: Array.isArray(data.tags) ? data.tags : [],
        author: data.author || 'IT-ERA Team',
        focus_keyword: data.focus_keyword,
        meta_description: data.meta_description || data.excerpt || data.title,
        status: 'published'
      },
      seo: {
        title_length: (data.seo_title || data.title).length,
        description_length: (data.meta_description || data.excerpt || '').length,
        focus_keyword: data.focus_keyword || 'non specificata',
        warnings: seoWarnings
      },
      html_preview: articleHtml.substring(0, 500) + '...'
    }
    
    // TODO: Integrare con GitHub API per salvare il file
    // await saveToGitHub(data.slug + '.html', articleHtml)
    
    return new Response(JSON.stringify(response), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid JSON or server error',
      message: error.message
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}

async function handleListPosts(request) {
  // Simula lista articoli (in produzione da database/GitHub)
  const articles = [
    {
      title: "Come Proteggere la Tua Azienda dal Ransomware nel 2024",
      slug: "ransomware-protezione-completa-2024",
      url: "https://it-era.pages.dev/blog/ransomware-protezione-completa-2024.html",
      category: "Sicurezza",
      published: "2024-08-24"
    },
    {
      title: "Firewall WatchGuard: Configurazione Ottimale per Aziende",
      slug: "firewall-watchguard-configurazione-ottimale",
      url: "https://it-era.pages.dev/blog/firewall-watchguard-configurazione-ottimale.html",
      category: "Sicurezza",
      published: "2024-08-24"
    },
    {
      title: "GDPR Compliance Checklist per PMI",
      slug: "gdpr-compliance-checklist-pmi", 
      url: "https://it-era.pages.dev/blog/gdpr-compliance-checklist-pmi.html",
      category: "Compliance",
      published: "2024-08-24"
    }
  ]
  
  return new Response(JSON.stringify({
    success: true,
    total: articles.length,
    articles
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  })
}

function generateArticleHtml(data) {
  const {
    title,
    seo_title,
    slug,
    content,
    excerpt,
    author,
    category,
    tags,
    meta_description,
    focus_keyword,
    featured_image
  } = data
  
  // SEO ottimizzato
  const finalSeoTitle = seo_title || title
  const finalMetaDescription = meta_description || excerpt || title
  const keywords = focus_keyword ? [focus_keyword, ...(Array.isArray(tags) ? tags : [])] : (Array.isArray(tags) ? tags : [])
  
  const publishedDate = new Date().toISOString().split('T')[0]
  const displayDate = new Date().toLocaleDateString('it-IT')
  
  return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- SEO Meta Tags -->
    <title>${finalSeoTitle} | IT-ERA Blog</title>
    <meta name="description" content="${finalMetaDescription}">
    <meta name="keywords" content="${keywords.join(', ')}">
    <meta name="author" content="${author || 'IT-ERA Team'}">
    ${focus_keyword ? `<meta name="focus-keyword" content="${focus_keyword}">` : ''}
    
    <!-- Canonical URL -->
    <link rel="canonical" href="https://it-era.pages.dev/blog/${slug}.html">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${finalSeoTitle}">
    <meta property="og:description" content="${finalMetaDescription}">
    <meta property="og:image" content="${featured_image || '/images/blog/default.jpg'}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="IT-ERA">
    <meta property="og:url" content="https://it-era.pages.dev/blog/${slug}.html">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${finalSeoTitle}">
    <meta name="twitter:description" content="${finalMetaDescription}">
    <meta name="twitter:image" content="${featured_image || '/images/blog/default.jpg'}">
    
    <!-- Article Meta -->
    <meta property="article:author" content="${author || 'IT-ERA Team'}">
    <meta property="article:published_time" content="${publishedDate}">
    ${category ? `<meta property="article:section" content="${category}">` : ''}
    ${Array.isArray(tags) ? tags.map(tag => `<meta property="article:tag" content="${tag}">`).join('\\n    ') : ''}
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    
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
        
        /* Chatbot Styles */
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
                    <h1 class="display-5 fw-bold mb-3">${title}</h1>
                    ${excerpt ? `<p class="lead mb-4">${excerpt}</p>` : ''}
                    
                    <div class="article-meta">
                        <div class="row align-items-center text-white">
                            <div class="col-md-6 text-md-start">
                                <i class="fas fa-user me-2"></i>${author || 'IT-ERA Team'}
                            </div>
                            <div class="col-md-6 text-md-end">
                                <i class="fas fa-calendar me-2"></i>${displayDate}
                                ${category ? ` | <i class="fas fa-folder me-2"></i>${category}` : ''}
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
                        ${content}
                    </article>
                    
                    <!-- CTA Section -->
                    <div class="cta-section text-center">
                        <h4><i class="fas fa-rocket me-2"></i>Hai bisogno di supporto IT?</h4>
                        <p class="mb-3">IT-ERA offre soluzioni personalizzate per la tua azienda. Contattaci per una consulenza gratuita.</p>
                        <div class="row">
                            <div class="col-md-6 mb-2">
                                <a href="/contatti.html" class="btn btn-primary">
                                    <i class="fas fa-envelope me-2"></i>Contattaci
                                </a>
                            </div>
                            <div class="col-md-6">
                                <a href="tel:0398882041" class="btn btn-outline-primary">
                                    <i class="fas fa-phone me-2"></i>039 888 2041
                                </a>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Tags -->
                    ${Array.isArray(tags) && tags.length > 0 ? `
                    <div class="mt-4 pt-4 border-top">
                        <h5><i class="fas fa-tags me-2"></i>Tag:</h5>
                        ${tags.map(tag => `<a href="/blog/?tag=${tag}" class="tag-badge">${tag}</a>`).join('')}
                    </div>
                    ` : ''}
                    
                    <!-- Related Articles -->
                    <div class="mt-5 pt-4 border-top">
                        <h4><i class="fas fa-newspaper me-2"></i>Articoli Correlati</h4>
                        <div class="row mt-3">
                            <div class="col-md-6 mb-3">
                                <a href="/blog/ransomware-protezione-completa-2024.html" class="text-decoration-none">
                                    <div class="card h-100">
                                        <div class="card-body">
                                            <h6 class="card-title">Proteggere la Tua Azienda dal Ransomware nel 2024</h6>
                                            <p class="card-text small text-muted">Guida completa alla protezione aziendale...</p>
                                        </div>
                                    </div>
                                </a>
                            </div>
                            <div class="col-md-6 mb-3">
                                <a href="/blog/firewall-watchguard-configurazione-ottimale.html" class="text-decoration-none">
                                    <div class="card h-100">
                                        <div class="card-body">
                                            <h6 class="card-title">Firewall WatchGuard: Configurazione Ottimale</h6>
                                            <p class="card-text small text-muted">Setup professionale per la sicurezza aziendale...</p>
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
    <div id="it-era-chatbot-container">
        <button id="it-era-chatbot-button" title="Chatta con IT-ERA">
            <svg viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>
        </button>
    </div>
    
    <script>
    document.getElementById('it-era-chatbot-button').addEventListener('click', function() {
        // In produzione, apre il chatbot completo
        alert('Chatbot IT-ERA\\n\\nPer assistenza immediata:\\n📞 039 888 2041\\n✉️ info@it-era.it');
    });
    </script>

    <!-- Structured Data -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "${finalSeoTitle}",
        "alternativeHeadline": "${title}",
        "description": "${finalMetaDescription}",
        "author": {
            "@type": "Organization",
            "name": "${author || 'IT-ERA Team'}",
            "url": "https://it-era.pages.dev"
        },
        "datePublished": "${publishedDate}",
        "dateModified": "${publishedDate}",
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
            "@id": "https://it-era.pages.dev/blog/${slug}.html"
        },
        "image": "${featured_image || '/images/blog/default.jpg'}",
        "keywords": "${keywords.join(', ')}",
        ${focus_keyword ? `"about": "${focus_keyword}",` : ''}
        ${category ? `"articleSection": "${category}",` : ''}
        "inLanguage": "it-IT",
        "wordCount": ${content ? content.replace(/<[^>]*>/g, '').split(' ').length : 0}
    }
    </script>
</body>
</html>`
}