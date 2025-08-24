<?php
/**
 * IT-ERA SEO Audit Script
 * Comprehensive SEO analysis tool for the website
 * 
 * Usage: php seo-audit.php [options]
 * Options:
 *   --path=path/to/scan    Directory to scan (default: ../web/pages)
 *   --output=format        Output format: json|html|csv (default: html)
 *   --save-report          Save report to file
 *   --verbose              Detailed output
 *   --check-duplicates     Check for duplicate content
 *   --validate-links       Validate internal links
 */

class SEOAuditor {
    private $config;
    private $results = [];
    private $errors = [];
    private $warnings = [];
    private $suggestions = [];
    private $scannedFiles = [];
    private $duplicateContent = [];
    private $startTime;
    
    public function __construct() {
        $this->startTime = microtime(true);
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
    
    public function auditDirectory($path = '../web/pages', $options = []) {
        echo "🔍 Starting SEO Audit for IT-ERA Website\n";
        echo "📂 Scanning directory: {$path}\n";
        echo "⏰ Started at: " . date('Y-m-d H:i:s') . "\n\n";
        
        if (!is_dir($path)) {
            die("❌ Directory not found: {$path}\n");
        }
        
        $files = $this->getHtmlFiles($path);
        echo "📄 Found " . count($files) . " HTML files to analyze\n\n";
        
        $progressTotal = count($files);
        $progressCurrent = 0;
        
        foreach ($files as $file) {
            $progressCurrent++;
            $this->showProgress($progressCurrent, $progressTotal, basename($file));
            
            $this->auditFile($file, $options);
        }
        
        if (!empty($options['check-duplicates'])) {
            $this->checkDuplicateContent();
        }
        
        if (!empty($options['validate-links'])) {
            $this->validateInternalLinks($path);
        }
        
        $this->generateSummary();
        return $this->results;
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
    
    private function auditFile($filePath, $options = []) {
        $content = file_get_contents($filePath);
        $fileName = basename($filePath);
        
        if (!$content) {
            $this->errors[] = "Cannot read file: {$fileName}";
            return;
        }
        
        $this->scannedFiles[] = $filePath;
        
        // Parse HTML
        $dom = new DOMDocument();
        libxml_use_internal_errors(true);
        $dom->loadHTML($content, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();
        
        $xpath = new DOMXPath($dom);
        
        $fileResults = [
            'file' => $fileName,
            'path' => $filePath,
            'size' => strlen($content),
            'word_count' => $this->countWords($content),
            'issues' => [],
            'score' => 0
        ];
        
        // Run all audit checks
        $this->auditTitleTag($dom, $xpath, $fileResults);
        $this->auditMetaDescription($dom, $xpath, $fileResults);
        $this->auditHeadingStructure($dom, $xpath, $fileResults);
        $this->auditImages($dom, $xpath, $fileResults);
        $this->auditInternalLinks($dom, $xpath, $fileResults);
        $this->auditSchemaMarkup($content, $fileResults);
        $this->auditOpenGraph($dom, $xpath, $fileResults);
        $this->auditTwitterCards($dom, $xpath, $fileResults);
        $this->auditCanonicalUrl($dom, $xpath, $fileResults);
        $this->auditContentQuality($content, $fileResults);
        $this->auditMobileFriendliness($dom, $xpath, $fileResults);
        $this->auditPageSpeed($content, $fileResults);
        $this->auditLocalSEO($content, $fileResults, $fileName);
        
        // Calculate overall score
        $fileResults['score'] = $this->calculateScore($fileResults);
        
        $this->results[] = $fileResults;
        
        if (!empty($options['verbose'])) {
            $this->displayFileResults($fileResults);
        }
    }
    
    private function auditTitleTag($dom, $xpath, &$results) {
        $titles = $xpath->query('//title');
        $config = $this->config['title_tag'];
        
        if ($titles->length === 0) {
            $results['issues'][] = [
                'type' => 'error',
                'category' => 'title',
                'message' => 'Missing title tag',
                'priority' => 'high'
            ];
            return;
        }
        
        if ($titles->length > 1) {
            $results['issues'][] = [
                'type' => 'warning',
                'category' => 'title',
                'message' => 'Multiple title tags found',
                'priority' => 'medium'
            ];
        }
        
        $title = trim($titles->item(0)->textContent);
        $titleLength = strlen($title);
        
        if (empty($title)) {
            $results['issues'][] = [
                'type' => 'error',
                'category' => 'title',
                'message' => 'Empty title tag',
                'priority' => 'high'
            ];
            return;
        }
        
        if ($titleLength < $config['min_length']) {
            $results['issues'][] = [
                'type' => 'warning',
                'category' => 'title',
                'message' => "Title too short ({$titleLength} chars, min {$config['min_length']})",
                'priority' => 'medium',
                'current_value' => $title
            ];
        }
        
        if ($titleLength > $config['max_length']) {
            $results['issues'][] = [
                'type' => 'warning',
                'category' => 'title',
                'message' => "Title too long ({$titleLength} chars, max {$config['max_length']})",
                'priority' => 'medium',
                'current_value' => $title
            ];
        }
        
        // Check if title follows expected patterns
        $hasCity = $this->containsItalianCity($title);
        if (!$hasCity) {
            $results['issues'][] = [
                'type' => 'suggestion',
                'category' => 'title',
                'message' => 'Title should include city name for local SEO',
                'priority' => 'low'
            ];
        }
        
        $results['title'] = $title;
        $results['title_length'] = $titleLength;
    }
    
    private function auditMetaDescription($dom, $xpath, &$results) {
        $descriptions = $xpath->query('//meta[@name="description"]');
        $config = $this->config['meta_description'];
        
        if ($descriptions->length === 0) {
            $results['issues'][] = [
                'type' => 'error',
                'category' => 'meta_description',
                'message' => 'Missing meta description',
                'priority' => 'high'
            ];
            return;
        }
        
        $description = trim($descriptions->item(0)->getAttribute('content'));
        $descriptionLength = strlen($description);
        
        if (empty($description)) {
            $results['issues'][] = [
                'type' => 'error',
                'category' => 'meta_description',
                'message' => 'Empty meta description',
                'priority' => 'high'
            ];
            return;
        }
        
        if ($descriptionLength < $config['min_length']) {
            $results['issues'][] = [
                'type' => 'warning',
                'category' => 'meta_description',
                'message' => "Meta description too short ({$descriptionLength} chars, min {$config['min_length']})",
                'priority' => 'medium'
            ];
        }
        
        if ($descriptionLength > $config['max_length']) {
            $results['issues'][] = [
                'type' => 'warning',
                'category' => 'meta_description',
                'message' => "Meta description too long ({$descriptionLength} chars, max {$config['max_length']})",
                'priority' => 'medium'
            ];
        }
        
        // Check for required elements
        if (!preg_match('/\b(?:039|388|2041)\b/', $description)) {
            $results['issues'][] = [
                'type' => 'suggestion',
                'category' => 'meta_description',
                'message' => 'Meta description should include phone number for local SEO',
                'priority' => 'low'
            ];
        }
        
        $results['meta_description'] = $description;
        $results['meta_description_length'] = $descriptionLength;
    }
    
    private function auditHeadingStructure($dom, $xpath, &$results) {
        $h1Tags = $xpath->query('//h1');
        $h2Tags = $xpath->query('//h2');
        $h3Tags = $xpath->query('//h3');
        $h4Tags = $xpath->query('//h4');
        $h5Tags = $xpath->query('//h5');
        $h6Tags = $xpath->query('//h6');
        
        // H1 checks
        if ($h1Tags->length === 0) {
            $results['issues'][] = [
                'type' => 'error',
                'category' => 'headings',
                'message' => 'Missing H1 tag',
                'priority' => 'high'
            ];
        } elseif ($h1Tags->length > 1) {
            $results['issues'][] = [
                'type' => 'warning',
                'category' => 'headings',
                'message' => "Multiple H1 tags found ({$h1Tags->length})",
                'priority' => 'medium'
            ];
        } else {
            $h1Text = trim($h1Tags->item(0)->textContent);
            if (strlen($h1Text) > 70) {
                $results['issues'][] = [
                    'type' => 'warning',
                    'category' => 'headings',
                    'message' => 'H1 tag too long (' . strlen($h1Text) . ' chars)',
                    'priority' => 'medium'
                ];
            }
        }
        
        // H2 structure
        if ($h2Tags->length < 3) {
            $results['issues'][] = [
                'type' => 'suggestion',
                'category' => 'headings',
                'message' => 'Consider adding more H2 tags for better content structure',
                'priority' => 'low'
            ];
        } elseif ($h2Tags->length > 8) {
            $results['issues'][] = [
                'type' => 'suggestion',
                'category' => 'headings',
                'message' => 'Too many H2 tags - consider restructuring content',
                'priority' => 'low'
            ];
        }
        
        $results['heading_structure'] = [
            'h1' => $h1Tags->length,
            'h2' => $h2Tags->length,
            'h3' => $h3Tags->length,
            'h4' => $h4Tags->length,
            'h5' => $h5Tags->length,
            'h6' => $h6Tags->length
        ];
    }
    
    private function auditImages($dom, $xpath, &$results) {
        $images = $xpath->query('//img');
        $config = $this->config['image_optimization'];
        
        $imageIssues = [];
        $imagesWithoutAlt = 0;
        $imagesWithEmptyAlt = 0;
        $imagesTotal = $images->length;
        
        foreach ($images as $img) {
            $src = $img->getAttribute('src');
            $alt = $img->getAttribute('alt');
            
            if (empty($alt)) {
                $imagesWithoutAlt++;
                $imageIssues[] = "Image without alt text: {$src}";
            } elseif (trim($alt) === '') {
                $imagesWithEmptyAlt++;
                $imageIssues[] = "Image with empty alt text: {$src}";
            } elseif (strlen($alt) > $config['alt_tags']['max_length']) {
                $imageIssues[] = "Alt text too long (" . strlen($alt) . " chars): {$src}";
            }
            
            // Check for generic alt text
            $genericAlts = ['image', 'photo', 'picture', 'img', 'icon'];
            if (in_array(strtolower(trim($alt)), $genericAlts)) {
                $imageIssues[] = "Generic alt text: {$src}";
            }
            
            // Check file naming
            $filename = basename($src);
            if (preg_match('/^(img|image|photo|picture)[\d_-]*\./', $filename)) {
                $imageIssues[] = "Generic filename: {$src}";
            }
            
            // Check lazy loading
            if (!$img->hasAttribute('loading') && !$img->hasAttribute('data-src')) {
                $imageIssues[] = "Image not optimized for lazy loading: {$src}";
            }
        }
        
        if ($imagesWithoutAlt > 0) {
            $results['issues'][] = [
                'type' => 'error',
                'category' => 'images',
                'message' => "{$imagesWithoutAlt} images without alt text",
                'priority' => 'high'
            ];
        }
        
        if ($imagesWithEmptyAlt > 0) {
            $results['issues'][] = [
                'type' => 'warning',
                'category' => 'images',
                'message' => "{$imagesWithEmptyAlt} images with empty alt text",
                'priority' => 'medium'
            ];
        }
        
        if (count($imageIssues) > 5) {
            $results['issues'][] = [
                'type' => 'suggestion',
                'category' => 'images',
                'message' => 'Multiple image optimization issues found',
                'priority' => 'low',
                'details' => array_slice($imageIssues, 0, 5)
            ];
        }
        
        $results['images'] = [
            'total' => $imagesTotal,
            'without_alt' => $imagesWithoutAlt,
            'with_empty_alt' => $imagesWithEmptyAlt,
            'issues' => count($imageIssues)
        ];
    }
    
    private function auditInternalLinks($dom, $xpath, &$results) {
        $links = $xpath->query('//a[@href]');
        $config = $this->config['internal_linking'];
        
        $internalLinks = 0;
        $externalLinks = 0;
        $linkIssues = [];
        
        foreach ($links as $link) {
            $href = $link->getAttribute('href');
            $text = trim($link->textContent);
            
            // Skip empty links
            if (empty($href) || $href === '#') {
                continue;
            }
            
            // Classify links
            if (preg_match('/^(https?:\/\/|\/\/)/i', $href)) {
                if (strpos($href, 'it-era') === false) {
                    $externalLinks++;
                } else {
                    $internalLinks++;
                }
            } elseif (preg_match('/^[#\/]/', $href)) {
                $internalLinks++;
            }
            
            // Check anchor text
            if (empty($text)) {
                $linkIssues[] = "Empty anchor text: {$href}";
            } elseif (in_array(strtolower($text), ['clicca qui', 'leggi tutto', 'continua', 'link'])) {
                $linkIssues[] = "Generic anchor text '{$text}': {$href}";
            }
            
            // Check for external links without proper attributes
            if (preg_match('/^https?:\/\/(?!.*it-era)/i', $href)) {
                if (!$link->hasAttribute('rel') || strpos($link->getAttribute('rel'), 'noopener') === false) {
                    $linkIssues[] = "External link missing security attributes: {$href}";
                }
            }
        }
        
        if ($internalLinks < $config['min_internal_links']) {
            $results['issues'][] = [
                'type' => 'suggestion',
                'category' => 'internal_links',
                'message' => "Too few internal links ({$internalLinks}, min {$config['min_internal_links']})",
                'priority' => 'low'
            ];
        }
        
        if ($internalLinks > $config['max_internal_links']) {
            $results['issues'][] = [
                'type' => 'suggestion',
                'category' => 'internal_links',
                'message' => "Too many internal links ({$internalLinks}, max {$config['max_internal_links']})",
                'priority' => 'low'
            ];
        }
        
        $results['links'] = [
            'internal' => $internalLinks,
            'external' => $externalLinks,
            'issues' => count($linkIssues)
        ];
    }
    
    private function auditSchemaMarkup($content, &$results) {
        $schemaScripts = [];
        preg_match_all('/<script[^>]*type=["\']application\/ld\+json["\'][^>]*>(.*?)<\/script>/is', $content, $matches);
        
        if (empty($matches[1])) {
            $results['issues'][] = [
                'type' => 'error',
                'category' => 'schema',
                'message' => 'No structured data (schema markup) found',
                'priority' => 'high'
            ];
            return;
        }
        
        $requiredTypes = $this->config['schema_markup']['required_types'];
        $foundTypes = [];
        
        foreach ($matches[1] as $schemaJson) {
            $schema = json_decode(trim($schemaJson), true);
            if ($schema && isset($schema['@type'])) {
                $foundTypes[] = $schema['@type'];
                
                // Validate schema structure
                if ($schema['@type'] === 'LocalBusiness') {
                    if (!isset($schema['name']) || !isset($schema['address'])) {
                        $results['issues'][] = [
                            'type' => 'warning',
                            'category' => 'schema',
                            'message' => 'LocalBusiness schema missing required fields',
                            'priority' => 'medium'
                        ];
                    }
                }
            } else {
                $results['issues'][] = [
                    'type' => 'error',
                    'category' => 'schema',
                    'message' => 'Invalid JSON-LD schema markup',
                    'priority' => 'high'
                ];
            }
        }
        
        $missingTypes = array_diff($requiredTypes, $foundTypes);
        if (!empty($missingTypes)) {
            $results['issues'][] = [
                'type' => 'suggestion',
                'category' => 'schema',
                'message' => 'Missing recommended schema types: ' . implode(', ', $missingTypes),
                'priority' => 'low'
            ];
        }
        
        $results['schema'] = [
            'found_types' => $foundTypes,
            'missing_types' => $missingTypes
        ];
    }
    
    private function auditOpenGraph($dom, $xpath, &$results) {
        $requiredOgTags = $this->config['social_media']['open_graph']['required_tags'];
        $foundOgTags = [];
        $missingOgTags = [];
        
        foreach ($requiredOgTags as $tagName) {
            $property = str_replace('og:', '', $tagName);
            $tags = $xpath->query("//meta[@property='{$tagName}']");
            
            if ($tags->length > 0) {
                $foundOgTags[$tagName] = $tags->item(0)->getAttribute('content');
            } else {
                $missingOgTags[] = $tagName;
            }
        }
        
        if (!empty($missingOgTags)) {
            $results['issues'][] = [
                'type' => 'warning',
                'category' => 'open_graph',
                'message' => 'Missing Open Graph tags: ' . implode(', ', $missingOgTags),
                'priority' => 'medium'
            ];
        }
        
        $results['open_graph'] = [
            'found' => array_keys($foundOgTags),
            'missing' => $missingOgTags
        ];
    }
    
    private function auditTwitterCards($dom, $xpath, &$results) {
        $requiredTwitterTags = $this->config['social_media']['twitter_cards']['required_tags'];
        $foundTwitterTags = [];
        $missingTwitterTags = [];
        
        foreach ($requiredTwitterTags as $tagName) {
            $tags = $xpath->query("//meta[@name='{$tagName}']");
            
            if ($tags->length > 0) {
                $foundTwitterTags[$tagName] = $tags->item(0)->getAttribute('content');
            } else {
                $missingTwitterTags[] = $tagName;
            }
        }
        
        if (!empty($missingTwitterTags)) {
            $results['issues'][] = [
                'type' => 'suggestion',
                'category' => 'twitter_cards',
                'message' => 'Missing Twitter Card tags: ' . implode(', ', $missingTwitterTags),
                'priority' => 'low'
            ];
        }
        
        $results['twitter_cards'] = [
            'found' => array_keys($foundTwitterTags),
            'missing' => $missingTwitterTags
        ];
    }
    
    private function auditCanonicalUrl($dom, $xpath, &$results) {
        $canonical = $xpath->query('//link[@rel="canonical"]');
        
        if ($canonical->length === 0) {
            $results['issues'][] = [
                'type' => 'error',
                'category' => 'canonical',
                'message' => 'Missing canonical URL',
                'priority' => 'high'
            ];
        } elseif ($canonical->length > 1) {
            $results['issues'][] = [
                'type' => 'error',
                'category' => 'canonical',
                'message' => 'Multiple canonical URLs found',
                'priority' => 'high'
            ];
        } else {
            $canonicalUrl = $canonical->item(0)->getAttribute('href');
            if (empty($canonicalUrl)) {
                $results['issues'][] = [
                    'type' => 'error',
                    'category' => 'canonical',
                    'message' => 'Empty canonical URL',
                    'priority' => 'high'
                ];
            }
            $results['canonical_url'] = $canonicalUrl;
        }
    }
    
    private function auditContentQuality($content, &$results) {
        $config = $this->config['content_quality'];
        $wordCount = $this->countWords($content);
        
        if ($wordCount < $config['word_count']['min']) {
            $results['issues'][] = [
                'type' => 'warning',
                'category' => 'content',
                'message' => "Content too short ({$wordCount} words, min {$config['word_count']['min']})",
                'priority' => 'medium'
            ];
        } elseif ($wordCount > $config['word_count']['max']) {
            $results['issues'][] = [
                'type' => 'suggestion',
                'category' => 'content',
                'message' => "Content very long ({$wordCount} words, consider splitting)",
                'priority' => 'low'
            ];
        }
        
        // Check for duplicate content patterns
        $contentHash = md5(preg_replace('/\s+/', ' ', strip_tags($content)));
        if (!isset($this->duplicateContent[$contentHash])) {
            $this->duplicateContent[$contentHash] = [];
        }
        $this->duplicateContent[$contentHash][] = $results['file'];
    }
    
    private function auditMobileFriendliness($dom, $xpath, &$results) {
        $viewport = $xpath->query('//meta[@name="viewport"]');
        
        if ($viewport->length === 0) {
            $results['issues'][] = [
                'type' => 'error',
                'category' => 'mobile',
                'message' => 'Missing viewport meta tag',
                'priority' => 'high'
            ];
        } else {
            $viewportContent = $viewport->item(0)->getAttribute('content');
            if (strpos($viewportContent, 'width=device-width') === false) {
                $results['issues'][] = [
                    'type' => 'warning',
                    'category' => 'mobile',
                    'message' => 'Viewport not optimized for mobile',
                    'priority' => 'medium'
                ];
            }
        }
        
        // Get HTML content for CSS check
        $htmlContent = $dom->saveHTML();
        
        // Check for mobile-specific CSS
        $responsiveCSS = preg_match('/@media\s*\([^)]*max-width|min-width/i', $htmlContent);
        if (!$responsiveCSS) {
            $results['issues'][] = [
                'type' => 'suggestion',
                'category' => 'mobile',
                'message' => 'No responsive CSS detected',
                'priority' => 'low'
            ];
        }
    }
    
    private function auditPageSpeed($content, &$results) {
        $issues = [];
        
        // Check for large inline styles
        if (preg_match('/<style[^>]*>(.{5000,})<\/style>/is', $content)) {
            $issues[] = 'Large inline CSS detected (consider external file)';
        }
        
        // Check for large inline scripts
        if (preg_match('/<script[^>]*>(.{3000,})<\/script>/is', $content)) {
            $issues[] = 'Large inline JavaScript detected';
        }
        
        // Check for unoptimized images
        $imageCount = preg_match_all('/<img[^>]*>/i', $content);
        if ($imageCount > 10) {
            $issues[] = "Many images detected ({$imageCount}) - consider optimization";
        }
        
        // Check for external resources
        $externalCSS = preg_match_all('/<link[^>]*href=["\']https?:\/\//i', $content);
        $externalJS = preg_match_all('/<script[^>]*src=["\']https?:\/\//i', $content);
        
        if ($externalCSS + $externalJS > 5) {
            $issues[] = 'Many external resources (' . ($externalCSS + $externalJS) . ') may impact loading speed';
        }
        
        if (!empty($issues)) {
            $results['issues'][] = [
                'type' => 'suggestion',
                'category' => 'page_speed',
                'message' => 'Page speed optimization opportunities found',
                'priority' => 'low',
                'details' => $issues
            ];
        }
        
        $results['page_speed'] = [
            'external_css' => $externalCSS,
            'external_js' => $externalJS,
            'image_count' => $imageCount
        ];
    }
    
    private function auditLocalSEO($content, &$results, $fileName) {
        $napConsistency = $this->config['local_seo']['nap_consistency'];
        $issues = [];
        
        // Check NAP (Name, Address, Phone) consistency
        $hasName = stripos($content, $napConsistency['name']) !== false;
        $hasAddress = stripos($content, 'Viale Risorgimento 32') !== false;
        $hasPhone = stripos($content, '039 888 2041') !== false;
        
        if (!$hasName) {
            $issues[] = 'Business name not found in content';
        }
        if (!$hasAddress) {
            $issues[] = 'Business address not found in content';
        }
        if (!$hasPhone) {
            $issues[] = 'Phone number not found in content';
        }
        
        // Check for local keywords
        $cityInFilename = $this->extractCityFromFilename($fileName);
        $cityInContent = $this->containsItalianCity($content);
        
        if ($cityInFilename && !$cityInContent) {
            $issues[] = "City from filename ({$cityInFilename}) not prominently featured in content";
        }
        
        if (!empty($issues)) {
            $results['issues'][] = [
                'type' => 'suggestion',
                'category' => 'local_seo',
                'message' => 'Local SEO optimization opportunities',
                'priority' => 'medium',
                'details' => $issues
            ];
        }
        
        $results['local_seo'] = [
            'has_name' => $hasName,
            'has_address' => $hasAddress,
            'has_phone' => $hasPhone,
            'city_in_filename' => $cityInFilename,
            'city_in_content' => $cityInContent
        ];
    }
    
    private function checkDuplicateContent() {
        echo "\n🔍 Checking for duplicate content...\n";
        
        foreach ($this->duplicateContent as $hash => $files) {
            if (count($files) > 1) {
                echo "⚠️  Duplicate content found:\n";
                foreach ($files as $file) {
                    echo "   - {$file}\n";
                }
                echo "\n";
            }
        }
    }
    
    private function validateInternalLinks($basePath) {
        echo "\n🔗 Validating internal links...\n";
        // This would require a more complex implementation to check if linked files exist
        // For now, we'll skip the implementation but keep the structure
    }
    
    private function calculateScore($fileResults) {
        $totalPoints = 100;
        $deductions = 0;
        
        foreach ($fileResults['issues'] as $issue) {
            switch ($issue['priority']) {
                case 'high':
                    $deductions += 15;
                    break;
                case 'medium':
                    $deductions += 8;
                    break;
                case 'low':
                    $deductions += 3;
                    break;
            }
        }
        
        return max(0, $totalPoints - $deductions);
    }
    
    private function generateSummary() {
        $totalFiles = count($this->results);
        $totalIssues = 0;
        $totalScore = 0;
        $issuesByCategory = [];
        $issuesByPriority = ['high' => 0, 'medium' => 0, 'low' => 0];
        
        foreach ($this->results as $result) {
            $totalScore += $result['score'];
            $totalIssues += count($result['issues']);
            
            foreach ($result['issues'] as $issue) {
                $issuesByCategory[$issue['category']] = ($issuesByCategory[$issue['category']] ?? 0) + 1;
                $issuesByPriority[$issue['priority']]++;
            }
        }
        
        $averageScore = $totalFiles > 0 ? round($totalScore / $totalFiles, 1) : 0;
        $executionTime = round(microtime(true) - $this->startTime, 2);
        
        echo "\n" . str_repeat("=", 80) . "\n";
        echo "📊 SEO AUDIT SUMMARY\n";
        echo str_repeat("=", 80) . "\n";
        echo "🕒 Execution time: {$executionTime}s\n";
        echo "📄 Files analyzed: {$totalFiles}\n";
        echo "🎯 Average SEO Score: {$averageScore}/100\n";
        echo "⚠️  Total issues found: {$totalIssues}\n\n";
        
        echo "Issues by Priority:\n";
        echo "🔴 High: {$issuesByPriority['high']}\n";
        echo "🟡 Medium: {$issuesByPriority['medium']}\n";
        echo "🟢 Low: {$issuesByPriority['low']}\n\n";
        
        if (!empty($issuesByCategory)) {
            echo "Issues by Category:\n";
            arsort($issuesByCategory);
            foreach ($issuesByCategory as $category => $count) {
                echo "• {$category}: {$count}\n";
            }
            echo "\n";
        }
        
        // Top priority recommendations
        echo "🏆 TOP RECOMMENDATIONS:\n";
        if ($issuesByPriority['high'] > 0) {
            echo "1. Fix {$issuesByPriority['high']} high-priority issues immediately\n";
        }
        if (!isset($issuesByCategory['title']) && $issuesByPriority['medium'] > 0) {
            echo "2. Optimize title tags and meta descriptions\n";
        }
        if (isset($issuesByCategory['images'])) {
            echo "3. Add missing alt text to images\n";
        }
        if (isset($issuesByCategory['schema'])) {
            echo "4. Implement structured data markup\n";
        }
        echo "\n";
        
        $this->generateRecommendationsPriority();
    }
    
    private function generateRecommendationsPriority() {
        echo "📋 IMMEDIATE ACTION ITEMS:\n";
        echo str_repeat("-", 50) . "\n";
        
        $criticalFiles = array_filter($this->results, function($result) {
            foreach ($result['issues'] as $issue) {
                if ($issue['priority'] === 'high') return true;
            }
            return false;
        });
        
        if (!empty($criticalFiles)) {
            echo "🚨 Files needing immediate attention:\n";
            foreach (array_slice($criticalFiles, 0, 10) as $result) {
                $highIssues = array_filter($result['issues'], function($issue) {
                    return $issue['priority'] === 'high';
                });
                echo "• {$result['file']} (Score: {$result['score']}, " . count($highIssues) . " critical issues)\n";
            }
        }
        
        echo "\n💡 QUICK WINS (Low effort, high impact):\n";
        echo "1. Add missing title tags and meta descriptions\n";
        echo "2. Fix images without alt text\n";
        echo "3. Add canonical URLs where missing\n";
        echo "4. Implement basic structured data\n";
        echo "5. Ensure mobile viewport is configured\n";
    }
    
    private function countWords($content) {
        $text = strip_tags($content);
        $text = preg_replace('/\s+/', ' ', $text);
        return str_word_count($text);
    }
    
    private function containsItalianCity($content) {
        $cities = ['milano', 'roma', 'torino', 'napoli', 'palermo', 'genova', 'bologna', 'firenze', 'bari', 'catania', 'venezia', 'verona', 'messina', 'padova', 'trieste', 'brescia', 'reggio', 'modena', 'prato', 'cagliari', 'parma', 'livorno', 'perugia', 'foggia', 'ravenna', 'rimini', 'salerno', 'ferrara', 'sassari', 'monza', 'bergamo', 'pescara', 'trento', 'vicenza', 'terni', 'bolzano', 'novara', 'piacenza', 'ancona', 'andria', 'udine', 'como', 'lecco', 'vimercate', 'seregno', 'lissone'];
        
        foreach ($cities as $city) {
            if (stripos($content, $city) !== false) {
                return $city;
            }
        }
        return false;
    }
    
    private function extractCityFromFilename($filename) {
        // Extract city from filename pattern like "assistenza-it-milano.html"
        if (preg_match('/(?:assistenza-it|cloud-storage|sicurezza-informatica)-([a-z-]+)\.html$/i', $filename, $matches)) {
            return $matches[1];
        }
        return null;
    }
    
    private function showProgress($current, $total, $filename) {
        $percentage = round(($current / $total) * 100);
        $bar = str_repeat("█", round($percentage / 5));
        $spaces = str_repeat("░", 20 - round($percentage / 5));
        
        printf("\r🔍 Progress: [%s%s] %d%% - %s", $bar, $spaces, $percentage, substr($filename, 0, 30));
        
        if ($current === $total) {
            echo "\n";
        }
    }
    
    private function displayFileResults($results) {
        echo "\n📄 {$results['file']} (Score: {$results['score']}/100)\n";
        if (!empty($results['issues'])) {
            foreach ($results['issues'] as $issue) {
                $icon = $issue['priority'] === 'high' ? '🔴' : ($issue['priority'] === 'medium' ? '🟡' : '🟢');
                echo "  {$icon} {$issue['message']}\n";
            }
        } else {
            echo "  ✅ No issues found\n";
        }
    }
    
    public function exportResults($format = 'html', $filename = null) {
        if (!$filename) {
            $filename = 'seo-audit-' . date('Y-m-d-H-i-s');
        }
        
        switch ($format) {
            case 'json':
                return $this->exportJSON($filename);
            case 'csv':
                return $this->exportCSV($filename);
            case 'html':
            default:
                return $this->exportHTML($filename);
        }
    }
    
    private function exportHTML($filename) {
        $html = $this->generateHTMLReport();
        $filepath = __DIR__ . "/../reports/{$filename}.html";
        
        if (!is_dir(dirname($filepath))) {
            mkdir(dirname($filepath), 0755, true);
        }
        
        file_put_contents($filepath, $html);
        return $filepath;
    }
    
    private function exportJSON($filename) {
        $filepath = __DIR__ . "/../reports/{$filename}.json";
        
        if (!is_dir(dirname($filepath))) {
            mkdir(dirname($filepath), 0755, true);
        }
        
        file_put_contents($filepath, json_encode($this->results, JSON_PRETTY_PRINT));
        return $filepath;
    }
    
    private function generateHTMLReport() {
        $totalFiles = count($this->results);
        $totalScore = array_sum(array_column($this->results, 'score'));
        $averageScore = $totalFiles > 0 ? round($totalScore / $totalFiles, 1) : 0;
        
        $html = '<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SEO Audit Report - IT-ERA</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #0d6efd, #0a58ca); color: white; border-radius: 8px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #0d6efd; }
        .score-good { color: #28a745; }
        .score-warning { color: #ffc107; }
        .score-danger { color: #dc3545; }
        .files-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .files-table th, .files-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .files-table th { background: #f8f9fa; font-weight: bold; }
        .files-table tr:hover { background: #f8f9fa; }
        .issue { margin: 5px 0; padding: 8px 12px; border-radius: 4px; font-size: 0.9em; }
        .issue-high { background: #f8d7da; color: #721c24; border-left: 4px solid #dc3545; }
        .issue-medium { background: #fff3cd; color: #856404; border-left: 4px solid #ffc107; }
        .issue-low { background: #d4edda; color: #155724; border-left: 4px solid #28a745; }
        .recommendations { background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .chart { margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 SEO Audit Report</h1>
            <p>IT-ERA Website Analysis - ' . date('d/m/Y H:i') . '</p>
        </div>
        
        <div class="summary">
            <div class="metric">
                <div class="metric-value">' . $totalFiles . '</div>
                <div>Files Analyzed</div>
            </div>
            <div class="metric">
                <div class="metric-value score-' . ($averageScore >= 80 ? 'good' : ($averageScore >= 60 ? 'warning' : 'danger')) . '">' . $averageScore . '/100</div>
                <div>Average Score</div>
            </div>
            <div class="metric">
                <div class="metric-value">' . array_sum(array_map(function($r) { return count($r['issues']); }, $this->results)) . '</div>
                <div>Total Issues</div>
            </div>
        </div>
        
        <div class="recommendations">
            <h3>🎯 Key Recommendations</h3>
            <ol>
                <li><strong>Priority 1:</strong> Fix missing title tags and meta descriptions</li>
                <li><strong>Priority 2:</strong> Add alt text to all images</li>
                <li><strong>Priority 3:</strong> Implement structured data markup</li>
                <li><strong>Priority 4:</strong> Optimize page loading speed</li>
                <li><strong>Priority 5:</strong> Improve internal linking structure</li>
            </ol>
        </div>
        
        <h2>📄 Detailed Results</h2>
        <table class="files-table">
            <thead>
                <tr>
                    <th>File</th>
                    <th>Score</th>
                    <th>Issues</th>
                    <th>Word Count</th>
                </tr>
            </thead>
            <tbody>';
        
        foreach ($this->results as $result) {
            $scoreClass = $result['score'] >= 80 ? 'score-good' : ($result['score'] >= 60 ? 'score-warning' : 'score-danger');
            
            $html .= '<tr>
                <td><strong>' . htmlspecialchars($result['file']) . '</strong></td>
                <td><span class="' . $scoreClass . '">' . $result['score'] . '/100</span></td>
                <td>' . count($result['issues']) . '</td>
                <td>' . ($result['word_count'] ?? 'N/A') . '</td>
            </tr>';
            
            if (!empty($result['issues'])) {
                $html .= '<tr><td colspan="4"><div style="padding: 10px 0;">';
                foreach ($result['issues'] as $issue) {
                    $html .= '<div class="issue issue-' . $issue['priority'] . '">' . htmlspecialchars($issue['message']) . '</div>';
                }
                $html .= '</div></td></tr>';
            }
        }
        
        $html .= '</tbody></table>
        
        <div style="margin-top: 40px; text-align: center; color: #666;">
            <p>Report generated by IT-ERA SEO Audit Tool</p>
            <p>For technical support: <a href="mailto:info@it-era.it">info@it-era.it</a></p>
        </div>
    </div>
</body>
</html>';
        
        return $html;
    }
}

// Command line interface
function showUsage() {
    echo "IT-ERA SEO Audit Tool\n";
    echo "Usage: php seo-audit.php [options]\n\n";
    echo "Options:\n";
    echo "  --path=PATH           Directory to scan (default: ../web/pages)\n";
    echo "  --output=FORMAT       Output format: html|json|csv (default: html)\n";
    echo "  --save-report         Save report to file\n";
    echo "  --verbose             Show detailed output during scan\n";
    echo "  --check-duplicates    Check for duplicate content\n";
    echo "  --validate-links      Validate internal links (experimental)\n";
    echo "  --help               Show this help message\n\n";
    echo "Examples:\n";
    echo "  php seo-audit.php\n";
    echo "  php seo-audit.php --path=../web/pages --output=html --save-report\n";
    echo "  php seo-audit.php --verbose --check-duplicates\n";
}

if (php_sapi_name() === 'cli') {
    // Parse command line arguments
    $options = [];
    $path = '../web/pages';
    $outputFormat = 'html';
    $saveReport = false;
    
    foreach ($argv as $arg) {
        if (strpos($arg, '--') === 0) {
            if ($arg === '--help') {
                showUsage();
                exit(0);
            } elseif ($arg === '--save-report') {
                $saveReport = true;
            } elseif ($arg === '--verbose') {
                $options['verbose'] = true;
            } elseif ($arg === '--check-duplicates') {
                $options['check-duplicates'] = true;
            } elseif ($arg === '--validate-links') {
                $options['validate-links'] = true;
            } elseif (strpos($arg, '--path=') === 0) {
                $path = substr($arg, 7);
            } elseif (strpos($arg, '--output=') === 0) {
                $outputFormat = substr($arg, 9);
            }
        }
    }
    
    // Create and run auditor
    $auditor = new SEOAuditor();
    $results = $auditor->auditDirectory($path, $options);
    
    if ($saveReport) {
        $reportFile = $auditor->exportResults($outputFormat);
        echo "\n💾 Report saved: {$reportFile}\n";
    }
    
    echo "\n✅ SEO Audit completed!\n";
}
?>