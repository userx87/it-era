#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧹 Pulizia file HTML duplicati...');

// Rimuovi file HTML dalla cartella public (eccetto template)
const publicDir = path.join(__dirname, 'public');
const filesToKeep = [
  'index.html',
  'contatti.html', 
  'servizi.html',
  'sitemap.xml',
  'robots.txt',
  '_redirects',
  '_headers'
];

function cleanDirectory(dir) {
  const files = fs.readdirSync(dir);
  let removed = 0;
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (file === 'pages-generated' || file === 'pages') {
        console.log(`📁 Rimuovendo directory: ${file}`);
        fs.rmSync(filePath, { recursive: true, force: true });
        removed++;
      }
    } else if (file.endsWith('.html') && !filesToKeep.includes(file)) {
      console.log(`🗑️  Rimuovendo: ${file}`);
      fs.unlinkSync(filePath);
      removed++;
    }
  });
  
  return removed;
}

const removed = cleanDirectory(publicDir);
console.log(`✅ Rimossi ${removed} file/directory duplicati`);
console.log('🚀 Ora tutte le pagine saranno servite dinamicamente');
