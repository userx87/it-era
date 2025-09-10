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
  
  // Replace template variables
  processed = processed.replace(/\{\{page\.title\}\}/g, metadata.title || 'IT-ERA');
  processed = processed.replace(/\{\{page\.description\}\}/g, metadata.description || '');
  processed = processed.replace(/\{\{page\.keywords\}\}/g, metadata.keywords || '');
  processed = processed.replace(/\{\{page\.url\}\}/g, metadata.url || '');
  
  // Fix relative paths for GitHub Pages
  processed = processed.replace(/href="\/(?!\/)/g, 'href="./');
  processed = processed.replace(/src="\/(?!\/)/g, 'src="./');
  processed = processed.replace(/url\(\/(?!\/)/g, 'url(./');
  
  return processed;
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
