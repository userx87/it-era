<?php
/**
 * IT-ERA Meta Tags Generator
 * Auto-generate meta descriptions, Open Graph, Twitter Cards, and canonical URLs
 * 
 * Usage: php meta-generator.php [--generate-all] [--page=PATH] [--type=META_TYPE]
 */

class MetaGenerator {
    private $config;
    private $baseDir;
    private $verbose;
    
    public function __construct($verbose = false) {
        $this->baseDir = dirname(__DIR__);
        $this->config = require __DIR__ . '/seo-config.php';
        $this->verbose = $verbose;
    }
    
    /**
     * Generate meta tags for all pages
     */
    public function generateAll() {
        $this->log("Generating meta tags for all pages...");
        
        $results = [
            'processed_pages' => 0,
            'meta_tags_generated' => 0,
            'errors' => []
        ];
        
        // Process all HTML files
        $webDir = $this->baseDir . $this->config['paths']['web'];
        $htmlFiles = $this->scanHtmlFiles($webDir);
        
        foreach ($htmlFiles as $file) {
            try {
                // Skip draft pages
                if (strpos($file, '/pages-draft/') !== false) {
                    continue;
                }
                
                $metaCount = $this->generatePageMeta($file);
                
                $results['processed_pages']++;
                $results['meta_tags_generated'] += $metaCount;
                
                if ($this->verbose) {
                    echo "✓ Generated meta tags for: $file\n";
                }
                
            } catch (Exception $e) {
                $results['errors'][] = [
                    'file' => $file,
                    'error' => $e->getMessage()
                ];
                
                if ($this->verbose) {
                    echo "✗ Error processing $file: " . $e->getMessage() . "\n";
                }
            }
        }
        
        $this->log("Meta tags generation completed. Processed {$results['processed_pages']} pages");
        
        return $results;
    }
    
    /**
     * Generate meta tags for a specific page
     */
    public function generatePageMeta($filePath) {
        $content = file_get_contents($filePath);
        if (!$content) {
            throw new Exception("Cannot read file: $filePath");
        }
        
        // Parse existing HTML
        $dom = new DOMDocument();
        libxml_use_internal_errors(true);
        $dom->loadHTML($content);
        libxml_clear_errors();
        
        // Extract page information
        $pageInfo = $this->extractPageInfo($filePath, $dom);
        
        // Generate meta tags
        $metaTags = [
            'title' => $this->generateTitle($pageInfo),
            'description' => $this->generateDescription($pageInfo),
            'keywords' => $this->generateKeywords($pageInfo),
            'canonical' => $this->generateCanonical($pageInfo),
            'robots' => $this->generateRobots($pageInfo),
            'og' => $this->generateOpenGraph($pageInfo),
            'twitter' => $this->generateTwitterCard($pageInfo),
            'additional' => $this->generateAdditionalMeta($pageInfo)
        ];
        
        // Inject meta tags into page
        $this->injectMetaTags($filePath, $metaTags);
        
        // Count total tags generated
        $totalTags = 4; // title, description, keywords, canonical
        $totalTags += count($metaTags['og']);
        $totalTags += count($metaTags['twitter']);
        $totalTags += count($metaTags['additional']);
        
        return $totalTags;
    }
    
    /**
     * Extract page information for meta generation
     */
    private function extractPageInfo($filePath, $dom) {
        $relativePath = str_replace($this->baseDir . $this->config['paths']['web'], '', $filePath);
        $url = $this->config['site']['url'] . $relativePath;
        
        // Extract existing title and description
        $existingTitle = $this->extractTitle($dom);
        $existingDescription = $this->extractDescription($dom);
        
        // Parse filename to extract service and city
        $filename = pathinfo($relativePath, PATHINFO_FILENAME);
        $service = null;
        $city = null;
        
        if (strpos($relativePath, '/pages/') !== false) {
            $parts = explode('-', $filename);
            if (count($parts) >= 3) {
                $service = implode('-', array_slice($parts, 0, -1));
                $city = end($parts);
            }
        }
        
        // Extract content for auto-description
        $bodyContent = $this->extractBodyContent($dom);
        
        return [
            'file_path' => $filePath,
            'relative_path' => $relativePath,
            'url' => $url,
            'filename' => $filename,
            'service' => $service,
            'city' => $city,
            'existing_title' => $existingTitle,
            'existing_description' => $existingDescription,
            'body_content' => $bodyContent,
            'is_homepage' => $relativePath === '/index.html' || $relativePath === '/',
            'last_modified' => filemtime($filePath)
        ];
    }
    
    /**
     * Generate optimized page title
     */
    private function generateTitle($pageInfo) {
        // Use existing title if it's good
        if (!empty($pageInfo['existing_title']) && strlen($pageInfo['existing_title']) <= 60) {
            return $pageInfo['existing_title'];
        }
        
        if ($pageInfo['is_homepage']) {
            return $this->config['site']['name'] . ' - Assistenza Informatica Professionale in Lombardia';
        }
        
        if ($pageInfo['service'] && $pageInfo['city']) {
            $serviceData = $this->config['services'][$pageInfo['service']] ?? null;
            if ($serviceData) {
                $serviceName = $serviceData['name'];
                $cityName = ucfirst(str_replace('-', ' ', $pageInfo['city']));
                
                // Different title patterns for variety
                $patterns = [
                    "$serviceName a $cityName - IT-ERA",
                    "$serviceName $cityName | IT-ERA",
                    "$serviceName Professionale a $cityName - IT-ERA",
                    "IT-ERA: $serviceName a $cityName"
                ];
                
                // Choose pattern based on city name hash for consistency
                $index = crc32($pageInfo['city']) % count($patterns);
                return $patterns[$index];
            }
        }
        
        // Fallback
        return trim($pageInfo['existing_title'] ?: 'IT-ERA - Servizi IT Professionali');
    }
    
    /**
     * Generate meta description
     */
    private function generateDescription($pageInfo) {
        // Use existing description if it's good
        if (!empty($pageInfo['existing_description']) && 
            strlen($pageInfo['existing_description']) >= 120 && 
            strlen($pageInfo['existing_description']) <= 160) {
            return $pageInfo['existing_description'];
        }
        
        if ($pageInfo['is_homepage']) {
            return 'IT-ERA offre servizi professionali di assistenza informatica, sicurezza informatica e cloud storage in Lombardia. Supporto tecnico qualificato per aziende e privati. Preventivo gratuito.';
        }
        
        if ($pageInfo['service'] && $pageInfo['city']) {
            $serviceData = $this->config['services'][$pageInfo['service']] ?? null;
            if ($serviceData) {
                $serviceName = $serviceData['name'];
                $cityName = ucfirst(str_replace('-', ' ', $pageInfo['city']));
                
                $descriptions = [
                    'assistenza-it' => "Assistenza informatica professionale a $cityName. Riparazione computer, supporto tecnico, installazione software e manutenzione sistemi IT. Servizio rapido e qualificato.",
                    'sicurezza-informatica' => "Sicurezza informatica avanzata a $cityName. Protezione antivirus, backup dati, firewall e consulenza cybersecurity per aziende. Soluzioni su misura.",
                    'cloud-storage' => "Servizi cloud storage sicuri a $cityName. Backup automatico, sincronizzazione dati e accesso remoto. Soluzioni cloud professionali per aziende e privati."
                ];
                
                return $descriptions[$pageInfo['service']] ?? "Servizi IT professionali a $cityName - $serviceName di qualità con IT-ERA. Soluzioni tecnologiche avanzate per le tue esigenze.";
            }
        }
        
        // Generate from content if available
        if (!empty($pageInfo['body_content'])) {
            $description = $this->generateDescriptionFromContent($pageInfo['body_content']);
            if (strlen($description) >= 120) {
                return $description;
            }
        }
        
        // Fallback
        return 'IT-ERA offre soluzioni informatiche professionali per aziende e privati. Assistenza tecnica qualificata, sicurezza informatica e servizi cloud. Contattaci per un preventivo gratuito.';
    }
    
    /**
     * Generate keywords meta tag
     */
    private function generateKeywords($pageInfo) {
        $keywords = ['IT-ERA', 'assistenza informatica', 'servizi IT', 'Lombardia'];
        
        if ($pageInfo['service']) {
            $serviceKeywords = [
                'assistenza-it' => ['assistenza computer', 'riparazione PC', 'supporto tecnico', 'installazione software', 'manutenzione IT'],
                'sicurezza-informatica' => ['sicurezza informatica', 'antivirus', 'backup dati', 'firewall', 'cybersecurity', 'protezione dati'],
                'cloud-storage' => ['cloud storage', 'backup cloud', 'sincronizzazione dati', 'accesso remoto', 'archiviazione cloud']
            ];
            
            $keywords = array_merge($keywords, $serviceKeywords[$pageInfo['service']] ?? []);
        }
        
        if ($pageInfo['city']) {
            $cityName = str_replace('-', ' ', $pageInfo['city']);
            $keywords[] = $cityName;
            $keywords[] = "IT $cityName";
        }
        
        return implode(', ', array_unique($keywords));
    }
    
    /**
     * Generate canonical URL
     */
    private function generateCanonical($pageInfo) {
        // Remove any query parameters or anchors for canonical
        $canonical = strtok($pageInfo['url'], '?');
        $canonical = strtok($canonical, '#');
        
        // Ensure it ends with .html for consistency
        if (!str_ends_with($canonical, '.html') && !str_ends_with($canonical, '/')) {
            $canonical .= '.html';
        }
        
        return $canonical;
    }
    
    /**
     * Generate robots meta tag
     */
    private function generateRobots($pageInfo) {
        // Most pages should be indexed
        if (strpos($pageInfo['relative_path'], '/pages-draft/') !== false) {
            return 'noindex, nofollow';
        }
        
        return 'index, follow';
    }
    
    /**
     * Generate Open Graph tags
     */
    private function generateOpenGraph($pageInfo) {
        $og = [
            'og:type' => $pageInfo['is_homepage'] ? 'website' : 'article',
            'og:site_name' => $this->config['site']['name'],
            'og:url' => $pageInfo['url'],
            'og:title' => $this->generateTitle($pageInfo),
            'og:description' => $this->generateDescription($pageInfo),
            'og:locale' => 'it_IT'
        ];
        
        // Add image if available
        $ogImage = $this->findPageImage($pageInfo);
        if ($ogImage) {
            $og['og:image'] = $ogImage;
            $og['og:image:width'] = '1200';
            $og['og:image:height'] = '630';
            $og['og:image:alt'] = $this->generateTitle($pageInfo);
        }
        
        // Add specific properties for service pages
        if ($pageInfo['service'] && $pageInfo['city']) {
            $og['article:author'] = $this->config['site']['name'];
            $og['article:published_time'] = date('c', $pageInfo['last_modified']);
            $og['article:modified_time'] = date('c', $pageInfo['last_modified']);
        }
        
        return $og;
    }
    
    /**
     * Generate Twitter Card tags
     */
    private function generateTwitterCard($pageInfo) {
        $twitter = [
            'twitter:card' => 'summary_large_image',
            'twitter:site' => '@ITERA_IT', // Add if available
            'twitter:title' => $this->generateTitle($pageInfo),
            'twitter:description' => $this->generateDescription($pageInfo)
        ];
        
        // Add image if available
        $twitterImage = $this->findPageImage($pageInfo);
        if ($twitterImage) {
            $twitter['twitter:image'] = $twitterImage;
            $twitter['twitter:image:alt'] = $this->generateTitle($pageInfo);
        }
        
        return $twitter;
    }
    
    /**
     * Generate additional meta tags
     */
    private function generateAdditionalMeta($pageInfo) {
        $additional = [
            'viewport' => 'width=device-width, initial-scale=1',
            'charset' => 'UTF-8',
            'author' => $this->config['site']['name'],
            'generator' => 'IT-ERA SEO System',
            'theme-color' => '#0056cc'
        ];
        
        // Add service-specific theme color
        if ($pageInfo['service'] && isset($this->config['services'][$pageInfo['service']]['color'])) {
            $additional['theme-color'] = $this->config['services'][$pageInfo['service']]['color'];
        }
        
        // Add geo tags for location-specific pages
        if ($pageInfo['city']) {
            $additional['geo.region'] = 'IT-25'; // Lombardy region code
            $additional['geo.placename'] = ucfirst(str_replace('-', ' ', $pageInfo['city']));
        }
        
        return $additional;
    }
    
    /**
     * Generate description from page content
     */
    private function generateDescriptionFromContent($content) {
        // Clean and extract meaningful text
        $text = strip_tags($content);
        $text = preg_replace('/\s+/', ' ', $text);
        $text = trim($text);
        
        // Find the first meaningful paragraph
        $sentences = preg_split('/[.!?]+/', $text);
        $description = '';
        
        foreach ($sentences as $sentence) {
            $sentence = trim($sentence);
            if (strlen($sentence) > 20) { // Skip very short sentences
                $description .= $sentence . '. ';
                if (strlen($description) >= 120) {
                    break;
                }
            }
        }
        
        // Trim to optimal length
        if (strlen($description) > 160) {
            $description = substr($description, 0, 157) . '...';
        }
        
        return trim($description);
    }
    
    /**
     * Find appropriate image for page
     */
    private function findPageImage($pageInfo) {
        // Service-specific images
        $serviceImages = [
            'assistenza-it' => '/assets/images/assistenza-it-og.jpg',
            'sicurezza-informatica' => '/assets/images/sicurezza-informatica-og.jpg',
            'cloud-storage' => '/assets/images/cloud-storage-og.jpg'
        ];
        
        if ($pageInfo['service'] && isset($serviceImages[$pageInfo['service']])) {
            return $this->config['site']['url'] . $serviceImages[$pageInfo['service']];
        }
        
        // Default image
        return $this->config['site']['url'] . '/assets/images/it-era-og.jpg';
    }
    
    /**
     * Inject meta tags into HTML page
     */
    private function injectMetaTags($filePath, $metaTags) {
        $content = file_get_contents($filePath);
        if (!$content) {
            throw new Exception("Cannot read file: $filePath");
        }
        
        $dom = new DOMDocument();
        libxml_use_internal_errors(true);
        $dom->loadHTML($content);
        libxml_clear_errors();
        
        $head = $dom->getElementsByTagName('head')->item(0);
        if (!$head) {
            throw new Exception("No <head> tag found in: $filePath");
        }
        
        // Remove existing meta tags (except viewport and charset)
        $existingMetas = $dom->getElementsByTagName('meta');
        $toRemove = [];
        foreach ($existingMetas as $meta) {
            $name = $meta->getAttribute('name');
            $property = $meta->getAttribute('property');
            
            if (in_array($name, ['description', 'keywords', 'author', 'robots']) ||
                str_starts_with($property, 'og:') ||
                str_starts_with($name, 'twitter:')) {
                $toRemove[] = $meta;
            }
        }
        
        foreach ($toRemove as $meta) {
            $meta->parentNode->removeChild($meta);
        }
        
        // Remove existing title and canonical
        $titles = $dom->getElementsByTagName('title');
        if ($titles->length > 0) {
            $titles->item(0)->parentNode->removeChild($titles->item(0));
        }
        
        $links = $dom->getElementsByTagName('link');
        foreach ($links as $link) {
            if ($link->getAttribute('rel') === 'canonical') {
                $link->parentNode->removeChild($link);
            }
        }
        
        // Add new title
        $titleElement = $dom->createElement('title', htmlspecialchars($metaTags['title']));
        $head->appendChild($titleElement);
        
        // Add meta tags
        $this->addMetaTag($dom, $head, 'name', 'description', $metaTags['description']);
        $this->addMetaTag($dom, $head, 'name', 'keywords', $metaTags['keywords']);
        $this->addMetaTag($dom, $head, 'name', 'robots', $metaTags['robots']);
        
        // Add additional meta tags
        foreach ($metaTags['additional'] as $name => $content) {
            if ($name === 'charset') {
                $meta = $dom->createElement('meta');
                $meta->setAttribute('charset', $content);
                $head->appendChild($meta);
            } elseif ($name === 'viewport') {
                // Only add if not exists
                $viewportExists = false;
                $metas = $dom->getElementsByTagName('meta');
                foreach ($metas as $meta) {
                    if ($meta->getAttribute('name') === 'viewport') {
                        $viewportExists = true;
                        break;
                    }
                }
                if (!$viewportExists) {
                    $this->addMetaTag($dom, $head, 'name', $name, $content);
                }
            } else {
                $this->addMetaTag($dom, $head, 'name', $name, $content);
            }
        }
        
        // Add Open Graph tags
        foreach ($metaTags['og'] as $property => $content) {
            $this->addMetaTag($dom, $head, 'property', $property, $content);
        }
        
        // Add Twitter Card tags
        foreach ($metaTags['twitter'] as $name => $content) {
            $this->addMetaTag($dom, $head, 'name', $name, $content);
        }
        
        // Add canonical link
        $canonical = $dom->createElement('link');
        $canonical->setAttribute('rel', 'canonical');
        $canonical->setAttribute('href', $metaTags['canonical']);
        $head->appendChild($canonical);
        
        // Save the modified HTML
        $newContent = $dom->saveHTML();
        
        // Fix some DOM encoding issues
        $newContent = html_entity_decode($newContent, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        
        return file_put_contents($filePath, $newContent) !== false;
    }
    
    /**
     * Add meta tag to DOM
     */
    private function addMetaTag($dom, $head, $attributeName, $attributeValue, $content) {
        $meta = $dom->createElement('meta');
        $meta->setAttribute($attributeName, $attributeValue);
        $meta->setAttribute('content', htmlspecialchars($content));
        $head->appendChild($meta);
    }
    
    /**
     * Helper methods
     */
    
    private function scanHtmlFiles($dir) {
        $files = [];
        
        if (!is_dir($dir)) {
            return $files;
        }
        
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::SELF_FIRST
        );
        
        foreach ($iterator as $file) {
            if ($file->isFile() && $file->getExtension() === 'html') {
                $files[] = $file->getPathname();
            }
        }
        
        return $files;
    }
    
    private function extractTitle($dom) {
        $titles = $dom->getElementsByTagName('title');
        if ($titles->length > 0) {
            return trim($titles->item(0)->textContent);
        }
        return '';
    }
    
    private function extractDescription($dom) {
        $metas = $dom->getElementsByTagName('meta');
        foreach ($metas as $meta) {
            if ($meta->getAttribute('name') === 'description') {
                return trim($meta->getAttribute('content'));
            }
        }
        return '';
    }
    
    private function extractBodyContent($dom) {
        $body = $dom->getElementsByTagName('body')->item(0);
        if ($body) {
            // Remove script and style tags
            $scripts = $body->getElementsByTagName('script');
            foreach ($scripts as $script) {
                $script->parentNode->removeChild($script);
            }
            
            $styles = $body->getElementsByTagName('style');
            foreach ($styles as $style) {
                $style->parentNode->removeChild($style);
            }
            
            return $body->textContent;
        }
        return '';
    }
    
    private function log($message) {
        $timestamp = date('[Y-m-d H:i:s]');
        $logMessage = "$timestamp $message" . PHP_EOL;
        
        if ($this->verbose) {
            echo $logMessage;
        }
        
        $logFile = $this->baseDir . $this->config['paths']['logs'] . '/meta-generator.log';
        $this->ensureDirectoryExists(dirname($logFile));
        file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
    }
    
    private function ensureDirectoryExists($dir) {
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
    }
}

// Command line execution
if (php_sapi_name() === 'cli') {
    $options = getopt('', ['generate-all', 'page:', 'type:', 'validate', 'verbose', 'help']);
    
    if (isset($options['help'])) {
        echo "IT-ERA Meta Tags Generator\n";
        echo "Usage: php meta-generator.php [options]\n";
        echo "Options:\n";
        echo "  --generate-all     Generate meta tags for all pages\n";
        echo "  --page=PATH        Generate meta tags for specific page\n";
        echo "  --type=META_TYPE   Generate specific type only (og, twitter, etc.)\n";
        echo "  --validate         Validate existing meta tags\n";
        echo "  --verbose          Show detailed output\n";
        echo "  --help             Show this help message\n";
        exit(0);
    }
    
    $verbose = isset($options['verbose']);
    
    try {
        $generator = new MetaGenerator($verbose);
        
        if (isset($options['generate-all'])) {
            $results = $generator->generateAll();
            echo "Meta tags generation completed:\n";
            echo "Pages processed: {$results['processed_pages']}\n";
            echo "Meta tags generated: {$results['meta_tags_generated']}\n";
            echo "Errors: " . count($results['errors']) . "\n";
            
        } elseif (isset($options['page'])) {
            $filePath = $options['page'];
            if (!file_exists($filePath)) {
                // Try relative to web directory
                $filePath = dirname(__DIR__) . '/web' . $options['page'];
            }
            
            if (!file_exists($filePath)) {
                throw new Exception("Page not found: {$options['page']}");
            }
            
            $count = $generator->generatePageMeta($filePath);
            echo "Generated $count meta tags for page: {$options['page']}\n";
            
        } else {
            echo "No action specified. Use --help for usage information.\n";
            exit(1);
        }
        
    } catch (Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
        exit(1);
    }
}