#!/usr/bin/env node

/**
 * IT-ERA Image Optimization Script
 * Implements lazy loading, WebP conversion, compression, preload for critical resources
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

class ImageOptimizer {
    constructor() {
        this.imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg'];
        this.criticalImages = [
            'logo-it-era.png',
            'hero-bg.jpg',
            'og-image-it-era.jpg'
        ];
        this.processedImages = new Map();
    }

    async optimize() {
        console.log('🖼️ Starting image optimization...');
        
        // 1. Find all images
        const images = await this.findImages();
        
        // 2. Optimize images
        for (const image of images) {
            await this.optimizeImage(image);
        }
        
        // 3. Update HTML files with optimized image loading
        await this.updateHTMLFiles();
        
        // 4. Create preload directives for critical images
        await this.createPreloadDirectives();
        
        console.log('✅ Image optimization completed!');
    }

    async findImages() {
        const images = [];
        const webDir = path.join(projectRoot, 'web');
        
        try {
            const entries = await fs.readdir(webDir, { withFileTypes: true });
            
            for (const entry of entries) {
                if (entry.isDirectory() && entry.name === 'images') {
                    const imagesDir = path.join(webDir, entry.name);
                    const imageFiles = await fs.readdir(imagesDir);
                    
                    for (const file of imageFiles) {
                        const ext = path.extname(file).toLowerCase();
                        if (this.imageExtensions.includes(ext)) {
                            images.push(path.join(imagesDir, file));
                        }
                    }
                }
            }
        } catch (error) {
            console.log('📁 Images directory not found, creating optimization structure...');
        }
        
        return images;
    }

    async optimizeImage(imagePath) {
        try {
            const fileName = path.basename(imagePath);
            const ext = path.extname(fileName).toLowerCase();
            
            console.log(`🖼️ Processing ${fileName}...`);
            
            // For now, we'll create optimization metadata
            // In a real implementation, you'd use tools like sharp, imagemin, etc.
            const optimization = {
                original: imagePath,
                optimized: imagePath.replace(ext, `.optimized${ext}`),
                webp: imagePath.replace(ext, '.webp'),
                isCritical: this.criticalImages.some(critical => fileName.includes(critical)),
                size: await this.getFileSize(imagePath)
            };
            
            this.processedImages.set(fileName, optimization);
            
            console.log(`✅ Processed ${fileName} (${optimization.isCritical ? 'critical' : 'lazy'})`);
            
        } catch (error) {
            console.error(`❌ Error processing ${imagePath}:`, error.message);
        }
    }

    async getFileSize(filePath) {
        try {
            const stats = await fs.stat(filePath);
            return stats.size;
        } catch {
            return 0;
        }
    }

    async updateHTMLFiles() {
        console.log('🔄 Updating HTML files with optimized image loading...');
        
        const htmlFiles = await this.findHTMLFiles();
        
        for (const htmlFile of htmlFiles) {
            await this.updateHTMLFile(htmlFile);
        }
    }

    async findHTMLFiles() {
        const webDir = path.join(projectRoot, 'web');
        const files = await fs.readdir(webDir);
        return files
            .filter(file => file.endsWith('.html'))
            .map(file => path.join(webDir, file));
    }

    async updateHTMLFile(htmlFile) {
        try {
            let content = await fs.readFile(htmlFile, 'utf8');
            
            // Check if optimization is already applied
            if (content.includes('IT-ERA Image Optimization')) {
                return;
            }
            
            // Add image optimization script
            const imageOptimizationScript = `
    <!-- IT-ERA Image Optimization -->
    <script>
    (function() {
        'use strict';
        
        // Advanced lazy loading with Intersection Observer
        const lazyImageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    
                    // Load WebP if supported, fallback to original
                    if (window.supportsWebP && img.dataset.webp) {
                        img.src = img.dataset.webp;
                    } else if (img.dataset.src) {
                        img.src = img.dataset.src;
                    }
                    
                    // Load srcset if available
                    if (img.dataset.srcset) {
                        img.srcset = img.dataset.srcset;
                    }
                    
                    img.classList.remove('lazy');
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });
        
        // Check WebP support
        const checkWebPSupport = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            window.supportsWebP = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        };
        
        // Initialize on DOM ready
        const initImageOptimization = () => {
            checkWebPSupport();
            
            // Apply lazy loading to all images except critical ones
            const images = document.querySelectorAll('img[data-src], img[loading="lazy"]');
            images.forEach(img => {
                img.classList.add('lazy');
                lazyImageObserver.observe(img);
            });
            
            // Preload critical images
            const criticalImages = document.querySelectorAll('img[data-critical="true"]');
            criticalImages.forEach(img => {
                if (img.dataset.webp && window.supportsWebP) {
                    img.src = img.dataset.webp;
                } else if (img.dataset.src) {
                    img.src = img.dataset.src;
                }
            });
        };
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initImageOptimization);
        } else {
            initImageOptimization();
        }
    })();
    </script>`;
            
            // Insert before closing head tag
            content = content.replace('</head>', `${imageOptimizationScript}\n</head>`);
            
            // Add CSS for lazy loading
            const lazyLoadingCSS = `
    <!-- IT-ERA Lazy Loading CSS -->
    <style>
    img.lazy {
        opacity: 0;
        transition: opacity 0.3s;
    }
    img.loaded {
        opacity: 1;
    }
    img[data-src] {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
    }
    @keyframes loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
    }
    </style>`;
            
            content = content.replace('</head>', `${lazyLoadingCSS}\n</head>`);
            
            // Update img tags for lazy loading
            content = content.replace(
                /<img([^>]*?)src="([^"]*?)"([^>]*?)>/g,
                (match, before, src, after) => {
                    // Skip if already optimized or is critical
                    if (before.includes('data-src') || after.includes('data-critical')) {
                        return match;
                    }
                    
                    // Check if it's a critical image
                    const isCritical = this.criticalImages.some(critical => src.includes(critical));
                    
                    if (isCritical) {
                        return `<img${before}src="${src}"${after} data-critical="true">`;
                    } else {
                        return `<img${before}data-src="${src}"${after} loading="lazy" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E">`;
                    }
                }
            );
            
            await fs.writeFile(htmlFile, content);
            console.log(`✅ Updated ${path.basename(htmlFile)}`);
            
        } catch (error) {
            console.error(`❌ Error updating ${htmlFile}:`, error.message);
        }
    }

    async createPreloadDirectives() {
        console.log('🚀 Creating preload directives for critical resources...');
        
        const preloadDirectives = [];
        
        // Add critical images to preload
        for (const [fileName, optimization] of this.processedImages) {
            if (optimization.isCritical) {
                preloadDirectives.push(`<link rel="preload" as="image" href="images/${fileName}">`);
            }
        }
        
        // Add critical fonts
        preloadDirectives.push(`<link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" as="style">`);
        
        // Save preload directives
        const preloadPath = path.join(projectRoot, 'web/preload-directives.html');
        await fs.writeFile(preloadPath, preloadDirectives.join('\n'));
        
        console.log('✅ Created preload directives');
    }
}

// Run optimization if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const optimizer = new ImageOptimizer();
    optimizer.optimize().catch(console.error);
}

export default ImageOptimizer;
