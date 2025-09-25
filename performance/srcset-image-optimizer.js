#!/usr/bin/env node

/**
 * SRCSET IMAGE OPTIMIZER - HIVE 6
 * Implements responsive images with srcset for better mobile performance
 */

const fs = require('fs');
const path = require('path');

class SrcsetOptimizer {
    constructor() {
        this.projectRoot = '/Users/andreapanzeri/progetti/IT-ERA';
        this.imageOptimizations = [];
    }

    generateResponsiveImageHTML() {
        return {
            logo: `<img
    src="/images/logo-it-era.png"
    srcset="/images/logo-it-era-64w.png 64w,
            /images/logo-it-era-128w.png 128w,
            /images/logo-it-era-256w.png 256w,
            /images/logo-it-era-512w.png 512w"
    sizes="(max-width: 640px) 128px, (max-width: 1024px) 256px, 512px"
    loading="lazy"
    alt="IT-ERA"
    class="h-8 w-auto">`,

            hero: `<img
    src="/images/hero-it-support.jpg"
    srcset="/images/hero-it-support-480w.jpg 480w,
            /images/hero-it-support-768w.jpg 768w,
            /images/hero-it-support-1024w.jpg 1024w,
            /images/hero-it-support-1920w.jpg 1920w"
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1920px"
    loading="lazy"
    alt="IT-ERA Assistenza Informatica"
    class="w-full h-auto">`,

            serviceIcon: `<img
    src="/images/service-icon.png"
    srcset="/images/service-icon-32w.png 32w,
            /images/service-icon-64w.png 64w,
            /images/service-icon-128w.png 128w"
    sizes="(max-width: 640px) 32px, (max-width: 1024px) 64px, 128px"
    loading="lazy"
    alt="Servizio IT"
    class="w-8 h-8">`
        };
    }

    async createImageOptimizationScript() {
        const script = `#!/bin/bash

# RESPONSIVE IMAGE GENERATION SCRIPT
# Creates multiple sizes for each image using ImageMagick

# Function to create responsive versions of an image
create_responsive_versions() {
    local input_file="\\$1"
    local base_name=\\$(basename "\\$input_file" | cut -d. -f1)
    local extension="\\${input_file##*.}"
    local output_dir=\\$(dirname "\\$input_file")

    echo "Processing \\$input_file..."

    # Create different sizes
    convert "\\$input_file" -resize 480x -quality 85 "\\$output_dir/\\${base_name}-480w.\\$extension"
    convert "\\$input_file" -resize 768x -quality 85 "\\$output_dir/\\${base_name}-768w.\\$extension"
    convert "\\$input_file" -resize 1024x -quality 85 "\\$output_dir/\\${base_name}-1024w.\\$extension"
    convert "\\$input_file" -resize 1920x -quality 85 "\\$output_dir/\\${base_name}-1920w.\\$extension"

    # Create WebP versions for modern browsers
    convert "\\$input_file" -resize 480x -quality 85 "\\$output_dir/\\${base_name}-480w.webp"
    convert "\\$input_file" -resize 768x -quality 85 "\\$output_dir/\\${base_name}-768w.webp"
    convert "\\$input_file" -resize 1024x -quality 85 "\\$output_dir/\\${base_name}-1024w.webp"
    convert "\\$input_file" -resize 1920x -quality 85 "\\$output_dir/\\${base_name}-1920w.webp"

    echo "✓ Created responsive versions for \\$base_name"
}

# Process all images in the images directory
find images/ -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" | while read -r image; do
    create_responsive_versions "$image"
done

echo "🎉 Responsive image generation completed!"
echo "Now update your HTML files to use the srcset attributes."`;

        await fs.writeFileSync(
            path.join(this.projectRoot, 'performance', 'generate-responsive-images.sh'),
            script
        );

        // Make script executable
        fs.chmodSync(path.join(this.projectRoot, 'performance', 'generate-responsive-images.sh'), '755');
    }

    async createModernImageTemplate() {
        const template = `<!-- MODERN RESPONSIVE IMAGE WITH WEBP SUPPORT -->
<picture>
  <!-- WebP format for modern browsers -->
  <source
    srcset="/images/hero-480w.webp 480w,
            /images/hero-768w.webp 768w,
            /images/hero-1024w.webp 1024w,
            /images/hero-1920w.webp 1920w"
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1920px"
    type="image/webp">

  <!-- Fallback to JPEG/PNG -->
  <img
    src="/images/hero.jpg"
    srcset="/images/hero-480w.jpg 480w,
            /images/hero-768w.jpg 768w,
            /images/hero-1024w.jpg 1024w,
            /images/hero-1920w.jpg 1920w"
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1920px"
    loading="lazy"
    alt="IT-ERA Assistenza Informatica Professional"
    class="w-full h-auto object-cover"
    width="1920"
    height="600">
</picture>

<!-- CSS for aspect ratio maintenance -->
<style>
.responsive-image {
  aspect-ratio: 16 / 9;
  object-fit: cover;
  width: 100%;
  height: auto;
}

/* Prevent layout shift */
img[loading="lazy"] {
  min-height: 200px;
  background: linear-gradient(90deg, #f0f0f0 0%, #e0e0e0 50%, #f0f0f0 100%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>`;

        await fs.writeFileSync(
            path.join(this.projectRoot, 'performance', 'modern-image-template.html'),
            template
        );
    }

    async execute() {
        console.log('🖼️  CREATING RESPONSIVE IMAGE SYSTEM...');

        try {
            // Generate responsive image configurations
            const responsiveImages = this.generateResponsiveImageHTML();
            await fs.writeFileSync(
                path.join(this.projectRoot, 'performance', 'responsive-images.json'),
                JSON.stringify(responsiveImages, null, 2)
            );

            // Create image optimization script
            await this.createImageOptimizationScript();

            // Create modern image template
            await this.createModernImageTemplate();

            console.log('✅ RESPONSIVE IMAGE SYSTEM CREATED');
            console.log('   📁 responsive-images.json - HTML templates');
            console.log('   🔧 generate-responsive-images.sh - Image generation script');
            console.log('   🎨 modern-image-template.html - WebP implementation');

        } catch (error) {
            console.error('❌ RESPONSIVE IMAGE SYSTEM FAILED:', error);
            throw error;
        }
    }
}

// Execute if run directly
if (require.main === module) {
    const optimizer = new SrcsetOptimizer();
    optimizer.execute().catch(console.error);
}

module.exports = SrcsetOptimizer;