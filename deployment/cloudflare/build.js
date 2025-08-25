#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const SOURCE_DIR = path.join(__dirname, '../../admin');
const BUILD_DIR = path.join(__dirname, 'dist');

async function copyRecursive(src, dest) {
  const stats = await fs.stat(src);
  
  if (stats.isDirectory()) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src);
    
    for (const entry of entries) {
      await copyRecursive(
        path.join(src, entry),
        path.join(dest, entry)
      );
    }
  } else {
    await fs.copyFile(src, dest);
  }
}

async function updateConfig() {
  const configPath = path.join(BUILD_DIR, 'js', 'config.js');
  let configContent = await fs.readFile(configPath, 'utf8');
  
  // Update API URLs based on environment
  const environment = process.env.ENVIRONMENT || 'production';
  const apiBaseUrl = process.env.API_BASE_URL || 'https://it-era-admin-auth-production.bulltech.workers.dev';
  
  // Replace the API_BASE_URL in config
  configContent = configContent.replace(
    /API_BASE_URL:\s*['"'][^'"]*['"]/,
    `API_BASE_URL: '${apiBaseUrl}'`
  );
  
  // Replace the ADMIN_API_BASE_URL in config  
  configContent = configContent.replace(
    /ADMIN_API_BASE_URL:\s*['"'][^'"]*['"]/,
    `ADMIN_API_BASE_URL: '${apiBaseUrl}'`
  );
  
  await fs.writeFile(configPath, configContent, 'utf8');
  console.log(`✅ Updated config for ${environment} environment`);
}

async function updateIndexHTML() {
  const indexPath = path.join(BUILD_DIR, 'index.html');
  let indexContent = await fs.readFile(indexPath, 'utf8');
  
  // Update the CONFIG object in index.html
  const apiBaseUrl = process.env.API_BASE_URL || 'https://it-era-admin-auth-production.bulltech.workers.dev';
  
  indexContent = indexContent.replace(
    /API_BASE_URL:\s*['"'][^'"]*['"]/,
    `API_BASE_URL: '${apiBaseUrl}'`
  );
  
  await fs.writeFile(indexPath, indexContent, 'utf8');
  console.log('✅ Updated index.html configuration');
}

async function createHeaders() {
  const headersContent = `/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()

/js/*
  Cache-Control: public, max-age=31536000, immutable

/css/*
  Cache-Control: public, max-age=31536000, immutable

/*.html
  Cache-Control: public, max-age=300`;
  
  await fs.writeFile(path.join(BUILD_DIR, '_headers'), headersContent);
  console.log('✅ Created _headers file');
}

async function createRedirects() {
  const redirectsContent = `/admin /index.html 200
/admin/* /index.html 200
/* /index.html 404`;
  
  await fs.writeFile(path.join(BUILD_DIR, '_redirects'), redirectsContent);
  console.log('✅ Created _redirects file');
}

async function build() {
  try {
    console.log('🚀 Starting build process...');
    
    // Clean build directory
    await fs.rm(BUILD_DIR, { recursive: true, force: true });
    console.log('🧹 Cleaned build directory');
    
    // Copy source files
    await copyRecursive(SOURCE_DIR, BUILD_DIR);
    console.log('📋 Copied source files');
    
    // Update configuration files
    await updateConfig();
    await updateIndexHTML();
    
    // Create Cloudflare-specific files
    await createHeaders();
    await createRedirects();
    
    console.log('✅ Build completed successfully!');
    console.log(`📦 Build output: ${BUILD_DIR}`);
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Run build
build();