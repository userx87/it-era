#!/usr/bin/env node

/**
 * Build script for GitHub Pages deployment
 * Processes templates and prepares static files
 */

const fs = require('fs');
const path = require('path');

// Load deployment configuration
const config = require('../deployment.config.js');

const sourceDir = path.join(__dirname, '..', config.build.sourceDir);
const buildDir = path.join(__dirname, '..', config.platforms['github-pages'].outputDir);

// Get pages metadata from config
const pages = {};
for (const [filename, metadata] of Object.entries(config.pages)) {
  pages[filename] = {
    ...metadata,
    url: `${config.platforms['github-pages'].url}/${filename === 'index.html' ? '' : filename}`
  };
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function copyDirectory(src, dest) {
  ensureDirectoryExists(dest);
  
  const items = fs.readdirSync(src);
  
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    const stat = fs.statSync(srcPath);
    
    if (stat.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function processTemplate(content, metadata) {
  let processed = content;

  // Replace page template variables
  processed = processed.replace(/\{\{page\.title\}\}/g, metadata.title || 'IT-ERA');
  processed = processed.replace(/\{\{page\.description\}\}/g, metadata.description || '');
  processed = processed.replace(/\{\{page\.keywords\}\}/g, metadata.keywords || '');
  processed = processed.replace(/\{\{page\.url\}\}/g, metadata.url || '');
  processed = processed.replace(/\{\{page\.bodyClass\}\}/g, '');
  processed = processed.replace(/\{\{page\.customCSS\}\}/g, '');
  processed = processed.replace(/\{\{page\.customJS\}\}/g, '');

  // Replace Handlebars partials with static content
  processed = processed.replace(/\{\{>\s*components\/layout\/header\}\}/g, getStaticHeader());
  processed = processed.replace(/\{\{>\s*content\}\}/g, getStaticContent(metadata));
  processed = processed.replace(/\{\{>\s*components\/layout\/footer\}\}/g, getStaticFooter());
  processed = processed.replace(/\{\{>\s*components\/widgets\/chat-widget\}\}/g, '');

  // Remove remaining Handlebars conditionals and partials
  processed = processed.replace(/\{\{#if[^}]*\}\}/g, '');
  processed = processed.replace(/\{\{\/if\}\}/g, '');
  processed = processed.replace(/\{\{#unless[^}]*\}\}/g, '');
  processed = processed.replace(/\{\{\/unless\}\}/g, '');
  processed = processed.replace(/\{\{>[^}]*\}\}/g, '');

  // Remove any remaining Handlebars expressions
  processed = processed.replace(/\{\{[^}]*\}\}/g, '');

  // Remove empty lines created by template removal
  processed = processed.replace(/^\s*<link[^>]*href="[^"]*\{\{[^}]*\}\}[^"]*"[^>]*>\s*$/gm, '');
  processed = processed.replace(/^\s*<script[^>]*src="[^"]*\{\{[^}]*\}\}[^"]*"[^>]*>\s*$/gm, '');
  processed = processed.replace(/class="\s*"/g, '');
  processed = processed.replace(/class=""/g, '');

  // Clean up empty lines and extra whitespace
  processed = processed.replace(/^\s*\n/gm, '');
  processed = processed.replace(/\n\s*\n\s*\n/g, '\n\n');

  // Fix relative paths for GitHub Pages (use base path)
  const basePath = '/it-era';
  processed = processed.replace(/href="\/(?!\/)/g, `href="${basePath}/`);
  processed = processed.replace(/src="\/(?!\/)/g, `src="${basePath}/`);
  processed = processed.replace(/url\(\/(?!\/)/g, `url(${basePath}/`);

  // Replace main.css with combined.min.css for complete styling
  processed = processed.replace(/\/css\/main\.css/g, '/css/combined.min.css');

  // Remove empty CSS/JS references
  processed = processed.replace(/<link[^>]*href="[^"]*\/\.css"[^>]*>/g, '');
  processed = processed.replace(/<script[^>]*src="[^"]*\/\.js"[^>]*><\/script>/g, '');

  return processed;
}

function getStaticHeader() {
  return `
    <!-- Navigation Header -->
    <header class="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
      <nav class="container mx-auto px-4 py-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <img src="/it-era/images/logo-it-era.png" alt="IT-ERA Logo" class="h-10 w-auto">
            <span class="ml-3 text-xl font-bold text-gray-900">IT-ERA</span>
          </div>
          <div class="hidden md:flex space-x-6">
            <a href="/it-era/" class="text-gray-700 hover:text-blue-600">Home</a>
            <a href="/it-era/servizi.html" class="text-gray-700 hover:text-blue-600">Servizi</a>
            <a href="/it-era/contatti.html" class="text-gray-700 hover:text-blue-600">Contatti</a>
          </div>
          <div class="md:hidden">
            <button class="text-gray-700">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </div>
      </nav>
    </header>
  `;
}

function getStaticFooter() {
  return `
    <!-- Footer -->
    <footer class="bg-gray-900 text-white py-12">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 class="text-lg font-semibold mb-4">IT-ERA</h3>
            <p class="text-gray-400">Assistenza informatica professionale per aziende in Lombardia.</p>
          </div>
          <div>
            <h4 class="text-md font-semibold mb-4">Servizi</h4>
            <ul class="space-y-2 text-gray-400">
              <li><a href="/it-era/servizi.html" class="hover:text-white">Assistenza IT</a></li>
              <li><a href="/it-era/servizi.html" class="hover:text-white">Sicurezza Informatica</a></li>
              <li><a href="/it-era/servizi.html" class="hover:text-white">Cloud Computing</a></li>
            </ul>
          </div>
          <div>
            <h4 class="text-md font-semibold mb-4">Contatti</h4>
            <ul class="space-y-2 text-gray-400">
              <li>📞 039 888 2041</li>
              <li>📧 info@it-era.it</li>
              <li>📍 Vimercate, Lombardia</li>
            </ul>
          </div>
          <div>
            <h4 class="text-md font-semibold mb-4">Seguici</h4>
            <div class="flex space-x-4">
              <a href="#" class="text-gray-400 hover:text-white">LinkedIn</a>
              <a href="#" class="text-gray-400 hover:text-white">Facebook</a>
            </div>
          </div>
        </div>
        <div class="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 IT-ERA. Tutti i diritti riservati.</p>
        </div>
      </div>
    </footer>
  `;
}

function getStaticContent(metadata) {
  const filename = metadata.url.split('/').pop();

  if (filename === '' || filename === 'index.html') {
    return getHomepageContent();
  } else if (filename === 'servizi.html') {
    return getServicesContent();
  } else if (filename === 'contatti.html') {
    return getContactsContent();
  }

  return '<div class="container mx-auto px-4 py-8"><h1>Pagina in costruzione</h1></div>';
}

function getHomepageContent() {
  return `
    <!-- Hero Section -->
    <section class="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20 mt-16">
      <div class="container mx-auto px-4 text-center">
        <h1 class="text-4xl md:text-6xl font-bold mb-6">
          Assistenza IT Professionale in Lombardia
        </h1>
        <p class="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
          Supporto informatico 24/7 per la tua azienda. Risolviamo i tuoi problemi IT in tempi record.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/it-era/contatti.html" class="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
            Contattaci Ora
          </a>
          <a href="/it-era/servizi.html" class="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition">
            I Nostri Servizi
          </a>
        </div>
      </div>
    </section>

    <!-- Services Preview -->
    <section class="py-16">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-12">I Nostri Servizi</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="text-center p-6 border rounded-lg hover:shadow-lg transition">
            <div class="text-4xl mb-4">🔧</div>
            <h3 class="text-xl font-semibold mb-3">Assistenza Tecnica</h3>
            <p class="text-gray-600">Supporto IT completo per la tua azienda con interventi rapidi e risolutivi.</p>
          </div>
          <div class="text-center p-6 border rounded-lg hover:shadow-lg transition">
            <div class="text-4xl mb-4">🔒</div>
            <h3 class="text-xl font-semibold mb-3">Sicurezza Informatica</h3>
            <p class="text-gray-600">Protezione avanzata contro cyber minacce e backup automatici dei dati.</p>
          </div>
          <div class="text-center p-6 border rounded-lg hover:shadow-lg transition">
            <div class="text-4xl mb-4">☁️</div>
            <h3 class="text-xl font-semibold mb-3">Cloud Computing</h3>
            <p class="text-gray-600">Migrazione al cloud e gestione infrastrutture moderne e scalabili.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact CTA -->
    <section class="bg-gray-100 py-16">
      <div class="container mx-auto px-4 text-center">
        <h2 class="text-3xl font-bold mb-6">Hai bisogno di assistenza IT?</h2>
        <p class="text-xl text-gray-600 mb-8">Contattaci per una consulenza gratuita</p>
        <a href="tel:+390398882041" class="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
          📞 039 888 2041
        </a>
      </div>
    </section>
  `;
}

function getServicesContent() {
  return `
    <div class="pt-20">
      <div class="container mx-auto px-4 py-12">
        <h1 class="text-4xl font-bold text-center mb-12">I Nostri Servizi IT</h1>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div class="bg-white p-8 rounded-lg shadow-lg">
            <h2 class="text-2xl font-bold mb-4">🔧 Assistenza Tecnica</h2>
            <ul class="space-y-3 text-gray-700">
              <li>• Help desk e supporto remoto</li>
              <li>• Riparazione hardware e software</li>
              <li>• Manutenzione preventiva</li>
              <li>• Gestione reti aziendali</li>
            </ul>
          </div>

          <div class="bg-white p-8 rounded-lg shadow-lg">
            <h2 class="text-2xl font-bold mb-4">🔒 Sicurezza Informatica</h2>
            <ul class="space-y-3 text-gray-700">
              <li>• Firewall e antivirus aziendali</li>
              <li>• Backup automatici</li>
              <li>• Protezione da ransomware</li>
              <li>• Audit di sicurezza</li>
            </ul>
          </div>

          <div class="bg-white p-8 rounded-lg shadow-lg">
            <h2 class="text-2xl font-bold mb-4">☁️ Cloud Computing</h2>
            <ul class="space-y-3 text-gray-700">
              <li>• Migrazione al cloud</li>
              <li>• Microsoft 365</li>
              <li>• Server virtuali</li>
              <li>• Disaster recovery</li>
            </ul>
          </div>

          <div class="bg-white p-8 rounded-lg shadow-lg">
            <h2 class="text-2xl font-bold mb-4">📞 VoIP e Telefonia</h2>
            <ul class="space-y-3 text-gray-700">
              <li>• Centralini VoIP</li>
              <li>• Telefonia aziendale</li>
              <li>• Videoconferenze</li>
              <li>• Integrazione sistemi</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getContactsContent() {
  return `
    <div class="pt-20">
      <div class="container mx-auto px-4 py-12">
        <h1 class="text-4xl font-bold text-center mb-12">Contattaci</h1>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 class="text-2xl font-bold mb-6">Informazioni di Contatto</h2>
            <div class="space-y-4">
              <div class="flex items-center">
                <span class="text-2xl mr-4">📞</span>
                <div>
                  <p class="font-semibold">Telefono</p>
                  <a href="tel:+390398882041" class="text-blue-600 hover:underline">039 888 2041</a>
                </div>
              </div>

              <div class="flex items-center">
                <span class="text-2xl mr-4">📧</span>
                <div>
                  <p class="font-semibold">Email</p>
                  <a href="mailto:info@it-era.it" class="text-blue-600 hover:underline">info@it-era.it</a>
                </div>
              </div>

              <div class="flex items-center">
                <span class="text-2xl mr-4">📍</span>
                <div>
                  <p class="font-semibold">Sede</p>
                  <p class="text-gray-600">Vimercate, Lombardia</p>
                </div>
              </div>

              <div class="flex items-center">
                <span class="text-2xl mr-4">🕒</span>
                <div>
                  <p class="font-semibold">Orari</p>
                  <p class="text-gray-600">Lun-Ven: 9:00-18:00</p>
                  <p class="text-gray-600">Emergenze: 24/7</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 class="text-2xl font-bold mb-6">Richiedi Informazioni</h2>
            <form class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-2">Nome *</label>
                <input type="text" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Email *</label>
                <input type="email" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Telefono</label>
                <input type="tel" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Messaggio *</label>
                <textarea required rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
              </div>

              <button type="submit" class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition">
                Invia Messaggio
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildSite() {
  console.log('🏗️ Building site for GitHub Pages...');
  
  // Clean build directory
  if (fs.existsSync(buildDir)) {
    fs.rmSync(buildDir, { recursive: true });
  }
  
  // Copy all files
  console.log('📁 Copying files...');
  copyDirectory(sourceDir, buildDir);
  
  // Process HTML files
  console.log('🔧 Processing templates...');
  for (const [filename, metadata] of Object.entries(pages)) {
    const filePath = path.join(buildDir, filename);
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const processed = processTemplate(content, metadata);
      fs.writeFileSync(filePath, processed);
      console.log(`✅ Processed ${filename}`);
    }
  }
  
  // Create .nojekyll file
  fs.writeFileSync(path.join(buildDir, '.nojekyll'), '');
  
  // Create deployment info
  const deploymentInfo = {
    timestamp: new Date().toISOString(),
    site_url: 'https://userx87.github.io/it-era',
    build_type: 'github-pages',
    pages_processed: Object.keys(pages).length,
    total_files: countFiles(buildDir)
  };
  
  fs.writeFileSync(
    path.join(buildDir, 'deployment-info.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  // Update sitemap
  createSitemap();
  
  console.log('✅ Build completed successfully!');
  console.log(`📊 Processed ${Object.keys(pages).length} pages`);
  console.log(`📁 Total files: ${deploymentInfo.total_files}`);
}

function countFiles(dir) {
  let count = 0;
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      count += countFiles(itemPath);
    } else {
      count++;
    }
  }
  
  return count;
}

function createSitemap() {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Object.entries(pages).map(([filename, metadata]) => `  <url>
    <loc>${metadata.url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${filename === 'index.html' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;

  fs.writeFileSync(path.join(buildDir, 'sitemap.xml'), sitemap);
  console.log('✅ Sitemap created');
}

// Run build
if (require.main === module) {
  try {
    buildSite();
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}
