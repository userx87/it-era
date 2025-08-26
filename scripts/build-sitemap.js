#!/usr/bin/env node
/**
 * IT-ERA Sitemap Builder - Minimal Implementation
 * Generates sitemap.xml from existing pages structure
 * @version 1.0.0 - DEVI Minimal
 */

import { readdir, writeFile, stat } from 'fs/promises';
import { join, extname } from 'path';

const SITE_URL = 'https://it-era.it';
const OUTPUT_FILE = './public/sitemap.xml';
const WEB_DIR = './web';

// Priority mapping for different page types
const PRIORITIES = {
  'index.html': '1.0',
  'assistenza-it': '0.9',
  'sicurezza-informatica': '0.9',
  'cloud-storage': '0.9',
  'backup-disaster-recovery': '0.8',
  'settore-': '0.8',
  'contatti': '0.7',
  'chi-siamo': '0.7',
  default: '0.6'
};

// Get priority based on filename/path
function getPriority(filePath) {
  const fileName = filePath.toLowerCase();
  
  for (const [key, priority] of Object.entries(PRIORITIES)) {
    if (fileName.includes(key)) {
      return priority;
    }
  }
  
  return PRIORITIES.default;
}

// Convert file path to URL
function pathToUrl(filePath) {
  let url = filePath
    .replace(/\\/g, '/')  // Windows path fix
    .replace(/^\.\/web\//, '/')  // Remove web prefix
    .replace(/\/index\.html$/, '/')  // index.html -> /
    .replace(/\.html$/, '');  // Remove .html extension
  
  // Ensure starts with /
  if (!url.startsWith('/')) {
    url = '/' + url;
  }
  
  // Fix double slashes
  url = url.replace(/\/+/g, '/');
  
  return url === '/' ? '/' : url + '/';
}

// Recursively scan directory for HTML files
async function scanDirectory(dir, files = []) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip certain directories
        if (['node_modules', '.git', 'temp', 'logs'].includes(entry.name)) {
          continue;
        }
        
        await scanDirectory(fullPath, files);
      } else if (entry.isFile() && extname(entry.name) === '.html') {
        // Skip certain files
        if (['404.html', 'test.html', 'demo.html'].includes(entry.name)) {
          continue;
        }
        
        const stats = await stat(fullPath);
        files.push({
          path: fullPath,
          url: pathToUrl(fullPath),
          priority: getPriority(fullPath),
          lastmod: stats.mtime.toISOString().split('T')[0]  // YYYY-MM-DD format
        });
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not scan directory ${dir}:`, error.message);
  }
  
  return files;
}

// Generate XML sitemap
function generateSitemapXML(urls) {
  const header = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  
  const footer = `</urlset>`;
  
  const urlElements = urls
    .sort((a, b) => parseFloat(b.priority) - parseFloat(a.priority))  // Sort by priority desc
    .map(({ url, priority, lastmod }) => `  <url>
    <loc>${SITE_URL}${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <priority>${priority}</priority>
    <changefreq>weekly</changefreq>
  </url>`)
    .join('\n');
  
  return header + '\n' + urlElements + '\n' + footer;
}

// Main execution
async function buildSitemap() {
  try {
    console.log('🔍 Scanning for HTML files...');
    
    const files = await scanDirectory(WEB_DIR);
    
    if (files.length === 0) {
      throw new Error('No HTML files found in web directory');
    }
    
    console.log(`📄 Found ${files.length} HTML files`);
    
    // Generate sitemap
    const sitemapXML = generateSitemapXML(files);
    
    // Write to file
    await writeFile(OUTPUT_FILE, sitemapXML, 'utf8');
    
    console.log(`✅ Sitemap generated: ${OUTPUT_FILE}`);
    console.log(`📊 Total URLs: ${files.length}`);
    
    // Show top URLs for verification
    console.log('\n🔝 Top priority URLs:');
    files
      .sort((a, b) => parseFloat(b.priority) - parseFloat(a.priority))
      .slice(0, 10)
      .forEach(({ url, priority }) => {
        console.log(`   ${url} (${priority})`);
      });
      
  } catch (error) {
    console.error('❌ Sitemap generation failed:', error.message);
    process.exit(1);
  }
}

// Validation mode
async function validateSitemap() {
  try {
    const { readFile } = await import('fs/promises');
    const sitemap = await readFile(OUTPUT_FILE, 'utf8');
    
    // Basic XML validation
    if (!sitemap.includes('<?xml') || !sitemap.includes('<urlset')) {
      throw new Error('Invalid XML format');
    }
    
    const urlCount = (sitemap.match(/<url>/g) || []).length;
    console.log(`✅ Sitemap validation passed: ${urlCount} URLs`);
    
  } catch (error) {
    console.error('❌ Sitemap validation failed:', error.message);
    process.exit(1);
  }
}

// CLI handling
const args = process.argv.slice(2);

if (args.includes('--validate')) {
  validateSitemap();
} else {
  buildSitemap();
}