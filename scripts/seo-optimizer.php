<?php
/**
 * IT-ERA SEO Optimizer Script
 * Automatically fixes common SEO issues based on audit results
 * 
 * Usage: php seo-optimizer.php [options]
 * Options:
 *   --path=path/to/optimize    Directory to optimize (default: ../web/pages)
 *   --backup                   Create backup before optimization
 *   --dry-run                  Show what would be changed without making changes
 *   --verbose                  Detailed output
 *   --fix-images               Add missing alt tags and optimize images
 *   --fix-meta                 Fix meta tags and descriptions
 *   --add-schema               Add missing structured data
 *   --optimize-speed           Optimize for page speed
 *   --compress-images          Compress and optimize images
 */

class SEOOptimizer {
    private $config;
    private $optimizedFiles = [];
    private $backupDir;
    private $dryRun = false;
    private $verbose = false;
    private $startTime;
    
    public function __construct($dryRun = false, $verbose = false) {
        $this->startTime = microtime(true);
        $this->dryRun = $dryRun;
        $this->verbose = $verbose;
        $this->backupDir = __DIR__ . '/../backup/seo-optimization-' . date('Y-m-d-H-i-s');
        $this->loadConfig();
    }
    
    private function loadConfig() {
        $configPath = __DIR__ . '/../config/seo-rules.json';
        if (!file_exists($configPath)) {
            die("❌ SEO rules config not found: {$configPath}\n");
        }
        
        $this->config = json_decode(file_get_contents($configPath), true);
        if (!$this->config) {
            die("❌ Invalid SEO rules config\n");
        }
    }
    
    public function optimizeDirectory($path = '../web/pages', $options = []) {
        echo "🚀 Starting SEO Optimization for IT-ERA Website\n";
        echo "📂 Optimizing directory: {$path}\n";
        echo "⏰ Started at: " . date('Y-m-d H:i:s') . "\n";
        echo "🔧 Mode: " . ($this->dryRun ? "DRY RUN (no changes will be made)" : "LIVE OPTIMIZATION") . "\n\n";
        
        if (!is_dir($path)) {
            die("❌ Directory not found: {$path}\n");
        }
        
        // Create backup if requested
        if (!empty($options['backup']) && !$this->dryRun) {
            $this->createBackup($path);
        }
        
        $files = $this->getHtmlFiles($path);
        echo "📄 Found " . count($files) . " HTML files to optimize\n\n";
        
        $progressTotal = count($files);
        $progressCurrent = 0;
        
        foreach ($files as $file) {
            $progressCurrent++;
            $this->showProgress($progressCurrent, $progressTotal, basename($file));
            
            $this->optimizeFile($file, $options);
        }
        
        $this->generateOptimizationReport();
        return $this->optimizedFiles;
    }
    
    private function createBackup($sourcePath) {
        echo "💾 Creating backup...\n";
        
        if (!mkdir($this->backupDir, 0755, true)) {
            die("❌ Cannot create backup directory: {$this->backupDir}\n");
        }
        
        $this->copyDirectory($sourcePath, $this->backupDir);
        echo "✅ Backup created: {$this->backupDir}\n\n";
    }
    
    private function copyDirectory($src, $dst) {
        $dir = opendir($src);
        if (!file_exists($dst)) {
            mkdir($dst, 0755, true);
        }
        
        while (($file = readdir($dir)) !== false) {
            if ($file != '.' && $file != '..') {
                if (is_dir($src . '/' . $file)) {
                    $this->copyDirectory($src . '/' . $file, $dst . '/' . $file);
                } else {
                    copy($src . '/' . $file, $dst . '/' . $file);
                }
            }
        }
        closedir($dir);
    }
    
    private function getHtmlFiles($directory) {
        $files = [];
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($directory)
        );
        
        foreach ($iterator as $file) {
            if ($file->isFile() && $file->getExtension() === 'html') {
                $files[] = $file->getRealPath();
            }
        }
        
        sort($files);
        return $files;
    }
    
    private function optimizeFile($filePath, $options) {
        $originalContent = file_get_contents($filePath);
        $content = $originalContent;
        $fileName = basename($filePath);
        
        if (!$content) {
            $this->log("⚠️  Cannot read file: {$fileName}");
            return;
        }
        
        // Track optimizations for this file
        $optimizations = [];
        
        // Parse HTML
        $dom = new DOMDocument();
        libxml_use_internal_errors(true);
        $dom->loadHTML($content, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();
        
        $xpath = new DOMXPath($dom);
        $modified = false;
        
        // Apply optimizations based on options
        if (!empty($options['fix-meta'])) {
            $modified = $this->fixMetaTags($dom, $xpath, $filePath, $optimizations) || $modified;
        }
        
        if (!empty($options['fix-images'])) {
            $modified = $this->fixImageOptimization($dom, $xpath, $filePath, $optimizations) || $modified;
        }
        
        if (!empty($options['add-schema'])) {
            $modified = $this->addStructuredData($dom, $xpath, $filePath, $optimizations) || $modified;
        }
        
        if (!empty($options['optimize-speed'])) {
            $modified = $this->optimizePageSpeed($dom, $xpath, $content, $optimizations) || $modified;
        }
        
        // Save optimized content
        if ($modified && !$this->dryRun) {
            $optimizedContent = $dom->saveHTML();
            
            // Additional content-level optimizations
            $optimizedContent = $this->optimizeCSS($optimizedContent, $optimizations);
            $optimizedContent = $this->optimizeJavaScript($optimizedContent, $optimizations);
            $optimizedContent = $this->addLazyLoading($optimizedContent, $optimizations);
            
            file_put_contents($filePath, $optimizedContent);
        }
        
        if (!empty($optimizations)) {
            $this->optimizedFiles[$filePath] = $optimizations;
            
            if ($this->verbose) {
                $this->displayOptimizations($fileName, $optimizations);
            }
        }
    }
    
    private function fixMetaTags($dom, $xpath, $filePath, &$optimizations) {
        $modified = false;
        $fileName = basename($filePath);
        $cityFromFilename = $this->extractCityFromFilename($fileName);
        
        // Fix title tag
        $titles = $xpath->query('//title');
        if ($titles->length === 0) {
            // Add missing title tag
            $head = $xpath->query('//head')->item(0);
            if ($head) {
                $title = $dom->createElement('title');
                $titleText = $this->generateOptimalTitle($fileName, $cityFromFilename);
                $title->textContent = $titleText;
                $head->appendChild($title);
                
                $optimizations[] = "Added missing title tag: {$titleText}";
                $modified = true;
            }
        } else {
            // Optimize existing title
            $title = $titles->item(0);
            $currentTitle = trim($title->textContent);
            $config = $this->config['title_tag'];
            
            if (strlen($currentTitle) > $config['max_length'] || strlen($currentTitle) < $config['min_length']) {
                $newTitle = $this->generateOptimalTitle($fileName, $cityFromFilename);
                if ($newTitle !== $currentTitle) {
                    $title->textContent = $newTitle;
                    $optimizations[] = "Optimized title tag length: {$newTitle}";
                    $modified = true;
                }
            }
        }
        
        // Fix meta description
        $descriptions = $xpath->query('//meta[@name="description"]');
        if ($descriptions->length === 0) {
            // Add missing meta description
            $head = $xpath->query('//head')->item(0);
            if ($head) {
                $metaDesc = $dom->createElement('meta');
                $metaDesc->setAttribute('name', 'description');
                $descriptionText = $this->generateOptimalDescription($fileName, $cityFromFilename);
                $metaDesc->setAttribute('content', $descriptionText);
                $head->appendChild($metaDesc);
                
                $optimizations[] = "Added missing meta description";
                $modified = true;
            }
        } else {
            // Optimize existing description
            $description = $descriptions->item(0);
            $currentDesc = trim($description->getAttribute('content'));
            $config = $this->config['meta_description'];
            
            if (strlen($currentDesc) > $config['max_length'] || strlen($currentDesc) < $config['min_length']) {
                $newDesc = $this->generateOptimalDescription($fileName, $cityFromFilename);
                $description->setAttribute('content', $newDesc);
                $optimizations[] = "Optimized meta description length";
                $modified = true;
            }
        }
        
        // Add canonical URL if missing
        $canonicals = $xpath->query('//link[@rel="canonical"]');
        if ($canonicals->length === 0) {
            $head = $xpath->query('//head')->item(0);
            if ($head) {
                $canonical = $dom->createElement('link');
                $canonical->setAttribute('rel', 'canonical');
                $canonicalUrl = $this->generateCanonicalUrl($fileName);
                $canonical->setAttribute('href', $canonicalUrl);
                $head->appendChild($canonical);
                
                $optimizations[] = "Added canonical URL: {$canonicalUrl}";
                $modified = true;
            }
        }
        
        // Add viewport meta tag if missing
        $viewports = $xpath->query('//meta[@name="viewport"]');
        if ($viewports->length === 0) {
            $head = $xpath->query('//head')->item(0);
            if ($head) {
                $viewport = $dom->createElement('meta');
                $viewport->setAttribute('name', 'viewport');
                $viewport->setAttribute('content', 'width=device-width, initial-scale=1.0');
                $head->appendChild($viewport);
                
                $optimizations[] = "Added mobile viewport meta tag";
                $modified = true;
            }
        }
        
        return $modified;
    }
    
    private function fixImageOptimization($dom, $xpath, $filePath, &$optimizations) {
        $images = $xpath->query('//img');
        $modified = false;
        $fixedImages = 0;
        
        foreach ($images as $img) {
            $src = $img->getAttribute('src');
            $alt = $img->getAttribute('alt');
            $imageModified = false;
            
            // Add missing alt text
            if (empty($alt)) {
                $generatedAlt = $this->generateAltText($src, basename($filePath));
                $img->setAttribute('alt', $generatedAlt);
                $imageModified = true;
                $fixedImages++;
            }
            
            // Optimize existing alt text
            elseif (in_array(strtolower(trim($alt)), ['image', 'photo', 'picture', 'img'])) {
                $betterAlt = $this->generateAltText($src, basename($filePath));
                $img->setAttribute('alt', $betterAlt);
                $imageModified = true;
            }
            
            // Add lazy loading
            if (!$img->hasAttribute('loading') && !$img->hasAttribute('data-src')) {
                $img->setAttribute('loading', 'lazy');
                $imageModified = true;
            }
            
            // Add responsive attributes if missing
            if (!$img->hasAttribute('width') && !$img->hasAttribute('height')) {
                // Add default responsive attributes
                $img->setAttribute('style', ($img->getAttribute('style') ?: '') . ' max-width: 100%; height: auto;');
                $imageModified = true;
            }
            
            if ($imageModified) {
                $modified = true;
            }
        }
        
        if ($fixedImages > 0) {
            $optimizations[] = "Fixed alt text for {$fixedImages} images";
        }
        
        return $modified;
    }
    
    private function addStructuredData($dom, $xpath, $filePath, &$optimizations) {
        $fileName = basename($filePath);
        $cityFromFilename = $this->extractCityFromFilename($fileName);
        
        // Check if structured data already exists
        $existingSchema = $xpath->query('//script[@type="application/ld+json"]');
        if ($existingSchema->length > 0) {
            return false; // Already has structured data
        }
        
        $head = $xpath->query('//head')->item(0);
        if (!$head) {
            return false;
        }
        
        // Generate appropriate structured data based on file type
        $schemaData = $this->generateStructuredData($fileName, $cityFromFilename);
        
        if ($schemaData) {
            $script = $dom->createElement('script');
            $script->setAttribute('type', 'application/ld+json');
            $script->textContent = json_encode($schemaData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            $head->appendChild($script);
            
            $optimizations[] = "Added structured data markup ({$schemaData['@type']})";
            return true;
        }
        
        return false;
    }
    
    private function optimizePageSpeed($dom, $xpath, $content, &$optimizations) {
        $modified = false;
        
        // Add preload for critical CSS
        $cssLinks = $xpath->query('//link[@rel="stylesheet"][@href]');
        $head = $xpath->query('//head')->item(0);
        
        if ($cssLinks->length > 0 && $head) {
            foreach ($cssLinks as $index => $link) {
                if ($index < 2) { // Only preload first 2 CSS files (critical)
                    $preload = $dom->createElement('link');
                    $preload->setAttribute('rel', 'preload');
                    $preload->setAttribute('href', $link->getAttribute('href'));
                    $preload->setAttribute('as', 'style');
                    $head->insertBefore($preload, $head->firstChild);
                    $modified = true;
                }
            }
            
            if ($modified) {
                $optimizations[] = "Added CSS preload for critical resources";
            }
        }
        
        // Add DNS prefetch for external domains
        $externalDomains = $this->extractExternalDomains($content);
        foreach ($externalDomains as $domain) {
            $dnsPrefetch = $dom->createElement('link');
            $dnsPrefetch->setAttribute('rel', 'dns-prefetch');
            $dnsPrefetch->setAttribute('href', '//' . $domain);
            if ($head) {
                $head->appendChild($dnsPrefetch);
                $modified = true;
            }
        }
        
        if (!empty($externalDomains)) {
            $optimizations[] = "Added DNS prefetch for " . count($externalDomains) . " external domains";
        }
        
        return $modified;
    }
    
    private function optimizeCSS($content, &$optimizations) {
        // Minify inline CSS
        $content = preg_replace_callback('/<style[^>]*>(.*?)<\/style>/is', function($matches) {
            $css = $matches[1];
            // Simple CSS minification
            $css = preg_replace('/\/\*.*?\*\//s', '', $css); // Remove comments
            $css = preg_replace('/\s+/', ' ', $css); // Compress whitespace
            $css = str_replace(['; ', ' {', '{ ', ' }', '} ', ': '], [';', '{', '{', '}', '}', ':'], $css);
            return "<style{$matches[0]}>" . trim($css) . "</style>";
        }, $content);
        
        // Remove unused CSS (basic implementation)
        if (strpos($content, '<style') !== false) {
            $optimizations[] = "Minified inline CSS";
        }
        
        return $content;
    }
    
    private function optimizeJavaScript($content, &$optimizations) {
        // Add async/defer to external scripts
        $scriptCount = 0;
        $content = preg_replace_callback('/<script([^>]*src=[^>]*)>/i', function($matches) use (&$scriptCount) {
            $attributes = $matches[1];
            if (strpos($attributes, 'async') === false && strpos($attributes, 'defer') === false) {
                $attributes .= ' defer';
                $scriptCount++;
            }
            return "<script{$attributes}>";
        }, $content);
        
        if ($scriptCount > 0) {
            $optimizations[] = "Added defer attribute to {$scriptCount} external scripts";
        }
        
        return $content;
    }
    
    private function addLazyLoading($content, &$optimizations) {
        // Add lazy loading to images (if not already present)
        $imageCount = 0;
        $content = preg_replace_callback('/<img([^>]*src=[^>]*)>/i', function($matches) use (&$imageCount) {
            $attributes = $matches[1];
            if (strpos($attributes, 'loading=') === false) {
                // Don't add lazy loading to the first image (above the fold)
                if ($imageCount > 0) {
                    $attributes .= ' loading="lazy"';
                }
                $imageCount++;
            }
            return "<img{$attributes}>";
        }, $content);
        
        if ($imageCount > 1) {
            $optimizations[] = "Added lazy loading to " . ($imageCount - 1) . " images";
        }
        
        return $content;
    }
    
    private function generateOptimalTitle($fileName, $city = null) {
        $serviceType = $this->getServiceTypeFromFilename($fileName);
        $city = $city ?: 'Lombardia';
        
        $patterns = [
            'assistenza-it' => "Assistenza IT {$city} | Supporto Tecnico 24/7 | IT-ERA",
            'cloud-storage' => "Cloud Storage {$city} | Archiviazione Cloud Sicura | IT-ERA",
            'sicurezza-informatica' => "Sicurezza Informatica {$city} | Protezione Dati | IT-ERA"
        ];
        
        return $patterns[$serviceType] ?? "Servizi IT {$city} | Soluzioni Professionali | IT-ERA";
    }
    
    private function generateOptimalDescription($fileName, $city = null) {
        $serviceType = $this->getServiceTypeFromFilename($fileName);
        $city = $city ?: 'Lombardia';
        
        $patterns = [
            'assistenza-it' => "Assistenza IT professionale a {$city}. Supporto tecnico 24/7, risoluzione problemi, help desk specializzato. ☎ 039 888 2041",
            'cloud-storage' => "Servizi Cloud Storage sicuri a {$city}. Archiviazione dati, backup automatico, sincronizzazione multi-dispositivo. ☎ 039 888 2041",
            'sicurezza-informatica' => "Sicurezza informatica avanzata a {$city}. Protezione dati, antivirus aziendale, firewall. ☎ 039 888 2041"
        ];
        
        return $patterns[$serviceType] ?? "Soluzioni IT complete a {$city}. Consulenza, assistenza e servizi professionali per aziende. ☎ 039 888 2041";
    }
    
    private function generateCanonicalUrl($fileName) {
        return "https://it-era.it/pages/{$fileName}";
    }
    
    private function generateAltText($src, $fileName) {
        $city = $this->extractCityFromFilename($fileName) ?: 'Lombardia';
        $serviceType = $this->getServiceTypeFromFilename($fileName);
        
        // Extract meaningful info from image filename
        $imageName = basename($src, pathinfo($src, PATHINFO_EXTENSION));
        $imageName = str_replace(['-', '_'], ' ', $imageName);
        
        if (strpos($imageName, 'hero') !== false || strpos($imageName, 'banner') !== false) {
            return "Servizi {$serviceType} professionali a {$city} - IT-ERA";
        }
        
        if (strpos($imageName, 'team') !== false || strpos($imageName, 'staff') !== false) {
            return "Team specializzato IT-ERA per {$serviceType} a {$city}";
        }
        
        if (strpos($imageName, 'office') !== false || strpos($imageName, 'sede') !== false) {
            return "Sede IT-ERA per servizi {$serviceType} a {$city}";
        }
        
        return "Servizi {$serviceType} IT-ERA a {$city}";
    }
    
    private function generateStructuredData($fileName, $city) {
        $serviceType = $this->getServiceTypeFromFilename($fileName);
        $city = $city ?: 'Milano';
        
        $baseSchema = [
            '@context' => 'https://schema.org',
            '@type' => 'LocalBusiness',
            'name' => "IT-ERA - {$serviceType} {$city}",
            'description' => $this->generateOptimalDescription($fileName, $city),
            'url' => $this->generateCanonicalUrl($fileName),
            'telephone' => '+39-039-888-2041',
            'email' => 'info@it-era.it',
            'address' => [
                '@type' => 'PostalAddress',
                'streetAddress' => 'Viale Risorgimento 32',
                'addressLocality' => 'Vimercate',
                'addressRegion' => 'MB',
                'postalCode' => '20871',
                'addressCountry' => 'IT'
            ],
            'geo' => [
                '@type' => 'GeoCoordinates',
                'latitude' => '45.6306',
                'longitude' => '9.3694'
            ],
            'openingHours' => 'Mo-Su 00:00-24:00',
            'serviceArea' => [
                '@type' => 'Place',
                'name' => "{$city}, Lombardia, Italia"
            ]
        ];
        
        // Add specific service offerings based on page type
        if ($serviceType === 'assistenza-it') {
            $baseSchema['@type'] = 'ProfessionalService';
            $baseSchema['serviceType'] = 'IT Support';
            $baseSchema['hasOfferCatalog'] = [
                '@type' => 'OfferCatalog',
                'name' => 'Servizi Assistenza IT',
                'itemListElement' => [
                    [
                        '@type' => 'Offer',
                        'itemOffered' => [
                            '@type' => 'Service',
                            'name' => 'Help Desk 24/7',
                            'description' => 'Supporto tecnico telefonico e remoto'
                        ]
                    ]
                ]
            ];
        }
        
        return $baseSchema;
    }
    
    private function extractExternalDomains($content) {
        $domains = [];
        preg_match_all('/https?:\/\/([^\/\s"\']+)/i', $content, $matches);
        
        foreach ($matches[1] as $domain) {
            if (!strpos($domain, 'it-era') && !in_array($domain, $domains)) {
                $domains[] = $domain;
            }
        }
        
        return array_slice($domains, 0, 5); // Limit to 5 domains
    }
    
    private function extractCityFromFilename($filename) {
        if (preg_match('/(?:assistenza-it|cloud-storage|sicurezza-informatica)-([a-z-]+)\.html$/i', $filename, $matches)) {
            return ucwords(str_replace('-', ' ', $matches[1]));
        }
        return null;
    }
    
    private function getServiceTypeFromFilename($filename) {
        if (strpos($filename, 'assistenza-it') === 0) {
            return 'assistenza-it';
        } elseif (strpos($filename, 'cloud-storage') === 0) {
            return 'cloud-storage';
        } elseif (strpos($filename, 'sicurezza-informatica') === 0) {
            return 'sicurezza-informatica';
        }
        return 'servizi-it';
    }
    
    private function showProgress($current, $total, $filename) {
        $percentage = round(($current / $total) * 100);
        $bar = str_repeat("█", round($percentage / 5));
        $spaces = str_repeat("░", 20 - round($percentage / 5));
        
        $mode = $this->dryRun ? 'ANALYZING' : 'OPTIMIZING';
        printf("\r🔧 {$mode}: [%s%s] %d%% - %s", $bar, $spaces, $percentage, substr($filename, 0, 30));
        
        if ($current === $total) {
            echo "\n";
        }
    }
    
    private function displayOptimizations($filename, $optimizations) {
        echo "\n📄 {$filename}:\n";
        foreach ($optimizations as $optimization) {
            echo "  ✅ {$optimization}\n";
        }
    }
    
    private function generateOptimizationReport() {
        $totalFiles = count($this->optimizedFiles);
        $totalOptimizations = array_sum(array_map('count', $this->optimizedFiles));
        $executionTime = round(microtime(true) - $this->startTime, 2);
        
        echo "\n" . str_repeat("=", 80) . "\n";
        echo "🎯 SEO OPTIMIZATION " . ($this->dryRun ? "ANALYSIS" : "COMPLETED") . "\n";
        echo str_repeat("=", 80) . "\n";
        echo "🕒 Execution time: {$executionTime}s\n";
        echo "📄 Files " . ($this->dryRun ? "analyzed" : "optimized") . ": {$totalFiles}\n";
        echo "⚡ Total optimizations " . ($this->dryRun ? "suggested" : "applied") . ": {$totalOptimizations}\n";
        
        if (!empty($this->backupDir) && !$this->dryRun) {
            echo "💾 Backup created: {$this->backupDir}\n";
        }
        
        echo "\n📊 Optimization Categories:\n";
        $categories = [];
        foreach ($this->optimizedFiles as $optimizations) {
            foreach ($optimizations as $opt) {
                if (strpos($opt, 'title') !== false) $categories['Title Tags']++;
                elseif (strpos($opt, 'meta description') !== false) $categories['Meta Descriptions']++;
                elseif (strpos($opt, 'alt text') !== false || strpos($opt, 'images') !== false) $categories['Image Optimization']++;
                elseif (strpos($opt, 'structured data') !== false || strpos($opt, 'schema') !== false) $categories['Structured Data']++;
                elseif (strpos($opt, 'canonical') !== false) $categories['Canonical URLs']++;
                elseif (strpos($opt, 'viewport') !== false) $categories['Mobile Optimization']++;
                elseif (strpos($opt, 'CSS') !== false || strpos($opt, 'script') !== false) $categories['Page Speed']++;
                else $categories['Other']++;
            }
        }
        
        foreach ($categories as $category => $count) {
            echo "• {$category}: {$count}\n";
        }
        
        echo "\n🎉 " . ($this->dryRun ? "ANALYSIS COMPLETE!" : "OPTIMIZATION COMPLETE!") . "\n";
        
        if ($this->dryRun) {
            echo "\n💡 To apply these optimizations, run without --dry-run flag\n";
        } else {
            echo "\n✅ Your website is now more SEO optimized!\n";
            echo "🔍 Run SEO audit again to verify improvements\n";
        }
    }
    
    private function log($message) {
        if ($this->verbose) {
            echo $message . "\n";
        }
    }
    
    public function compressImages($directory, $quality = 80) {
        if (!extension_loaded('gd')) {
            echo "⚠️  GD extension not available for image compression\n";
            return false;
        }
        
        echo "🖼️  Starting image compression...\n";
        
        $imageFiles = [];
        $extensions = ['jpg', 'jpeg', 'png', 'webp'];
        
        foreach ($extensions as $ext) {
            $files = glob("{$directory}/**/*.{$ext}", GLOB_BRACE | GLOB_IGNORECASE);
            $imageFiles = array_merge($imageFiles, $files);
        }
        
        if (empty($imageFiles)) {
            echo "📷 No images found for compression\n";
            return false;
        }
        
        $compressed = 0;
        $totalSavings = 0;
        
        foreach ($imageFiles as $imagePath) {
            $originalSize = filesize($imagePath);
            
            if ($this->compressImage($imagePath, $quality)) {
                $newSize = filesize($imagePath);
                $savings = $originalSize - $newSize;
                $totalSavings += $savings;
                $compressed++;
                
                if ($this->verbose) {
                    $percent = round(($savings / $originalSize) * 100, 1);
                    echo "✅ Compressed " . basename($imagePath) . " (-{$percent}%)\n";
                }
            }
        }
        
        if ($compressed > 0) {
            $totalSavingsKB = round($totalSavings / 1024, 2);
            echo "🎉 Compressed {$compressed} images, saved {$totalSavingsKB}KB total\n";
        }
        
        return $compressed > 0;
    }
    
    private function compressImage($imagePath, $quality) {
        if ($this->dryRun) {
            return true; // Simulate compression in dry-run mode
        }
        
        $info = getimagesize($imagePath);
        if ($info === false) {
            return false;
        }
        
        $originalSize = filesize($imagePath);
        if ($originalSize < 50000) { // Skip files smaller than 50KB
            return false;
        }
        
        switch ($info['mime']) {
            case 'image/jpeg':
                $image = imagecreatefromjpeg($imagePath);
                if ($image) {
                    imagejpeg($image, $imagePath, $quality);
                    imagedestroy($image);
                    return true;
                }
                break;
                
            case 'image/png':
                $image = imagecreatefrompng($imagePath);
                if ($image) {
                    // PNG compression level (0-9, where 9 is maximum compression)
                    $pngQuality = round((100 - $quality) / 10);
                    imagepng($image, $imagePath, $pngQuality);
                    imagedestroy($image);
                    return true;
                }
                break;
        }
        
        return false;
    }
    
    public function generateSitemap($directory, $baseUrl = 'https://it-era.it') {
        echo "🗺️  Generating XML sitemap...\n";
        
        $files = $this->getHtmlFiles($directory);
        $urls = [];
        
        foreach ($files as $file) {
            $relativePath = str_replace(dirname($directory) . '/', '', $file);
            $url = $baseUrl . '/' . $relativePath;
            
            // Get last modified date
            $lastmod = date('Y-m-d', filemtime($file));
            
            // Determine change frequency and priority based on file type
            $changefreq = 'monthly';
            $priority = '0.8';
            
            if (strpos(basename($file), 'index') !== false) {
                $changefreq = 'weekly';
                $priority = '1.0';
            } elseif (strpos(basename($file), 'milano') !== false) {
                $priority = '0.9';
            }
            
            $urls[] = [
                'loc' => $url,
                'lastmod' => $lastmod,
                'changefreq' => $changefreq,
                'priority' => $priority
            ];
        }
        
        // Generate sitemap XML
        $sitemap = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $sitemap .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
        
        foreach ($urls as $url) {
            $sitemap .= "  <url>\n";
            $sitemap .= "    <loc>{$url['loc']}</loc>\n";
            $sitemap .= "    <lastmod>{$url['lastmod']}</lastmod>\n";
            $sitemap .= "    <changefreq>{$url['changefreq']}</changefreq>\n";
            $sitemap .= "    <priority>{$url['priority']}</priority>\n";
            $sitemap .= "  </url>\n";
        }
        
        $sitemap .= '</urlset>';
        
        // Save sitemap
        $sitemapPath = dirname($directory) . '/sitemap.xml';
        if (!$this->dryRun) {
            file_put_contents($sitemapPath, $sitemap);
        }
        
        echo "✅ Sitemap generated with " . count($urls) . " URLs: {$sitemapPath}\n";
        return $sitemapPath;
    }
}

// Command line interface
function showUsage() {
    echo "IT-ERA SEO Optimizer Tool\n";
    echo "Usage: php seo-optimizer.php [options]\n\n";
    echo "Options:\n";
    echo "  --path=PATH           Directory to optimize (default: ../web/pages)\n";
    echo "  --backup              Create backup before optimization\n";
    echo "  --dry-run             Show what would be changed without making changes\n";
    echo "  --verbose             Show detailed output during optimization\n";
    echo "  --fix-images          Add missing alt tags and optimize images\n";
    echo "  --fix-meta            Fix meta tags and descriptions\n";
    echo "  --add-schema          Add missing structured data\n";
    echo "  --optimize-speed      Optimize for page speed\n";
    echo "  --compress-images     Compress and optimize images\n";
    echo "  --generate-sitemap    Generate XML sitemap\n";
    echo "  --all                 Apply all optimizations\n";
    echo "  --help               Show this help message\n\n";
    echo "Examples:\n";
    echo "  php seo-optimizer.php --dry-run --all\n";
    echo "  php seo-optimizer.php --backup --fix-meta --fix-images\n";
    echo "  php seo-optimizer.php --path=../web/pages --all --verbose\n";
}

if (php_sapi_name() === 'cli') {
    // Parse command line arguments
    $options = [];
    $path = '../web/pages';
    $dryRun = false;
    $verbose = false;
    $backup = false;
    
    foreach ($argv as $arg) {
        if (strpos($arg, '--') === 0) {
            if ($arg === '--help') {
                showUsage();
                exit(0);
            } elseif ($arg === '--dry-run') {
                $dryRun = true;
            } elseif ($arg === '--verbose') {
                $verbose = true;
            } elseif ($arg === '--backup') {
                $backup = true;
            } elseif ($arg === '--fix-images') {
                $options['fix-images'] = true;
            } elseif ($arg === '--fix-meta') {
                $options['fix-meta'] = true;
            } elseif ($arg === '--add-schema') {
                $options['add-schema'] = true;
            } elseif ($arg === '--optimize-speed') {
                $options['optimize-speed'] = true;
            } elseif ($arg === '--compress-images') {
                $options['compress-images'] = true;
            } elseif ($arg === '--generate-sitemap') {
                $options['generate-sitemap'] = true;
            } elseif ($arg === '--all') {
                $options['fix-images'] = true;
                $options['fix-meta'] = true;
                $options['add-schema'] = true;
                $options['optimize-speed'] = true;
            } elseif (strpos($arg, '--path=') === 0) {
                $path = substr($arg, 7);
            }
        }
    }
    
    // Add backup to options if requested
    if ($backup) {
        $options['backup'] = true;
    }
    
    // Create and run optimizer
    $optimizer = new SEOOptimizer($dryRun, $verbose);
    
    // Run main optimization
    if (!empty(array_filter($options, function($k) { return !in_array($k, ['compress-images', 'generate-sitemap']); }, ARRAY_FILTER_USE_KEY))) {
        $results = $optimizer->optimizeDirectory($path, $options);
    }
    
    // Run additional optimizations
    if (!empty($options['compress-images'])) {
        $optimizer->compressImages($path);
    }
    
    if (!empty($options['generate-sitemap'])) {
        $optimizer->generateSitemap($path);
    }
    
    echo "\n" . ($dryRun ? "🔍 SEO Analysis completed!" : "✅ SEO Optimization completed!") . "\n";
}
?>