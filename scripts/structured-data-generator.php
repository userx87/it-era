<?php
/**
 * IT-ERA Structured Data Generator
 * Auto-generate Schema.org markup for SEO enhancement
 * 
 * Usage: php structured-data-generator.php [--generate-all] [--page=URL] [--type=SCHEMA_TYPE]
 */

class StructuredDataGenerator {
    private $config;
    private $baseDir;
    private $verbose;
    
    public function __construct($verbose = false) {
        $this->baseDir = dirname(__DIR__);
        $this->config = require __DIR__ . '/seo-config.php';
        $this->verbose = $verbose;
    }
    
    /**
     * Generate structured data for all pages
     */
    public function generateAll() {
        $this->log("Generating structured data for all pages...");
        
        $results = [
            'processed_pages' => 0,
            'schemas_generated' => 0,
            'errors' => []
        ];
        
        // Generate organization schema (for all pages)
        $organizationSchema = $this->generateOrganizationSchema();
        
        // Process all HTML files
        $webDir = $this->baseDir . $this->config['paths']['web'];
        $htmlFiles = $this->scanHtmlFiles($webDir);
        
        foreach ($htmlFiles as $file) {
            try {
                // Skip draft pages
                if (strpos($file, '/pages-draft/') !== false) {
                    continue;
                }
                
                $schemas = $this->generatePageSchema($file);
                $this->injectSchemaIntoPage($file, array_merge([$organizationSchema], $schemas));
                
                $results['processed_pages']++;
                $results['schemas_generated'] += count($schemas) + 1; // +1 for organization
                
                if ($this->verbose) {
                    echo "✓ Generated schema for: $file\n";
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
        
        $this->log("Structured data generation completed. Processed {$results['processed_pages']} pages");
        
        return $results;
    }
    
    /**
     * Generate organization schema (IT-ERA company info)
     */
    public function generateOrganizationSchema() {
        return [
            '@context' => 'https://schema.org',
            '@type' => 'Organization',
            '@id' => $this->config['site']['url'] . '#organization',
            'name' => $this->config['site']['name'],
            'description' => $this->config['site']['description'],
            'url' => $this->config['site']['url'],
            'logo' => $this->config['site']['url'] . '/assets/images/logo-it-era.png',
            'contactPoint' => [
                '@type' => 'ContactPoint',
                'telephone' => $this->config['site']['contact']['phone'],
                'contactType' => 'customer service',
                'email' => $this->config['site']['contact']['email'],
                'availableLanguage' => 'Italian'
            ],
            'address' => [
                '@type' => 'PostalAddress',
                'streetAddress' => $this->config['site']['contact']['address'],
                'addressLocality' => 'Vimercate',
                'addressRegion' => 'MB',
                'addressCountry' => 'IT'
            ],
            'taxID' => $this->config['site']['contact']['vat'],
            'sameAs' => [
                // Add social media URLs if available
            ]
        ];
    }
    
    /**
     * Generate LocalBusiness schema for city-specific pages
     */
    public function generateLocalBusinessSchema($city, $service) {
        $serviceNames = [
            'assistenza-it' => 'Assistenza Informatica',
            'sicurezza-informatica' => 'Sicurezza Informatica',
            'cloud-storage' => 'Servizi Cloud Storage'
        ];
        
        $serviceName = $serviceNames[$service] ?? 'Servizi IT';
        
        return [
            '@context' => 'https://schema.org',
            '@type' => 'LocalBusiness',
            'name' => "IT-ERA - $serviceName a " . ucfirst(str_replace('-', ' ', $city)),
            'description' => "$serviceName professionale a " . ucfirst(str_replace('-', ' ', $city)) . " - IT-ERA offre soluzioni IT avanzate per aziende e privati",
            'url' => $this->config['site']['url'] . "/pages/$service-$city.html",
            'telephone' => $this->config['site']['contact']['phone'],
            'email' => $this->config['site']['contact']['email'],
            'address' => [
                '@type' => 'PostalAddress',
                'addressLocality' => ucfirst(str_replace('-', ' ', $city)),
                'addressRegion' => 'Lombardia',
                'addressCountry' => 'IT'
            ],
            'geo' => [
                '@type' => 'GeoCoordinates',
                // Add coordinates based on city if available
            ],
            'openingHours' => 'Mo-Fr 09:00-18:00',
            'priceRange' => '€€',
            'serviceArea' => [
                '@type' => 'City',
                'name' => ucfirst(str_replace('-', ' ', $city))
            ]
        ];
    }
    
    /**
     * Generate Service schema
     */
    public function generateServiceSchema($service, $city = null) {
        $serviceData = $this->config['services'][$service] ?? null;
        if (!$serviceData) {
            return null;
        }
        
        $serviceName = $serviceData['name'];
        $location = $city ? " a " . ucfirst(str_replace('-', ' ', $city)) : " in Lombardia";
        
        $descriptions = [
            'assistenza-it' => "Servizi professionali di assistenza informatica$location. Riparazione computer, installazione software, supporto tecnico e manutenzione sistemi IT.",
            'sicurezza-informatica' => "Soluzioni avanzate di sicurezza informatica$location. Protezione antivirus, backup dati, firewall e consulenza cybersecurity per aziende.",
            'cloud-storage' => "Servizi cloud storage sicuri e affidabili$location. Backup automatico, sincronizzazione dati e accesso remoto per aziende e privati."
        ];
        
        return [
            '@context' => 'https://schema.org',
            '@type' => 'Service',
            'name' => $serviceName . $location,
            'description' => $descriptions[$service] ?? "$serviceName professionale",
            'provider' => [
                '@type' => 'Organization',
                'name' => $this->config['site']['name'],
                'url' => $this->config['site']['url']
            ],
            'serviceType' => $serviceName,
            'areaServed' => $city ? [
                '@type' => 'City',
                'name' => ucfirst(str_replace('-', ' ', $city))
            ] : [
                '@type' => 'State',
                'name' => 'Lombardia'
            ],
            'offers' => [
                '@type' => 'Offer',
                'availability' => 'https://schema.org/InStock',
                'businessFunction' => 'https://schema.org/Sell'
            ]
        ];
    }
    
    /**
     * Generate BreadcrumbList schema
     */
    public function generateBreadcrumbSchema($pagePath) {
        $breadcrumbs = [
            [
                '@type' => 'ListItem',
                'position' => 1,
                'name' => 'Home',
                'item' => $this->config['site']['url']
            ]
        ];
        
        // Parse page path to generate breadcrumbs
        $relativePath = str_replace($this->baseDir . $this->config['paths']['web'], '', $pagePath);
        $segments = explode('/', trim($relativePath, '/'));
        
        if (count($segments) > 1 && $segments[0] === 'pages') {
            $filename = $segments[1] ?? '';
            $parts = explode('-', pathinfo($filename, PATHINFO_FILENAME));
            
            if (count($parts) >= 2) {
                $service = implode('-', array_slice($parts, 0, -1));
                $city = end($parts);
                
                // Add service breadcrumb
                $serviceData = $this->config['services'][$service] ?? null;
                if ($serviceData) {
                    $breadcrumbs[] = [
                        '@type' => 'ListItem',
                        'position' => 2,
                        'name' => $serviceData['name'],
                        'item' => $this->config['site']['url'] . '/#' . $service
                    ];
                    
                    // Add city breadcrumb
                    $breadcrumbs[] = [
                        '@type' => 'ListItem',
                        'position' => 3,
                        'name' => $serviceData['name'] . ' a ' . ucfirst(str_replace('-', ' ', $city)),
                        'item' => $this->config['site']['url'] . $relativePath
                    ];
                }
            }
        }
        
        if (count($breadcrumbs) > 1) {
            return [
                '@context' => 'https://schema.org',
                '@type' => 'BreadcrumbList',
                'itemListElement' => $breadcrumbs
            ];
        }
        
        return null;
    }
    
    /**
     * Generate WebPage schema
     */
    public function generateWebPageSchema($pagePath, $title, $description) {
        $relativePath = str_replace($this->baseDir . $this->config['paths']['web'], '', $pagePath);
        $url = $this->config['site']['url'] . $relativePath;
        
        return [
            '@context' => 'https://schema.org',
            '@type' => 'WebPage',
            '@id' => $url . '#webpage',
            'url' => $url,
            'name' => $title,
            'description' => $description,
            'isPartOf' => [
                '@type' => 'WebSite',
                '@id' => $this->config['site']['url'] . '#website'
            ],
            'about' => [
                '@type' => 'Organization',
                '@id' => $this->config['site']['url'] . '#organization'
            ],
            'dateModified' => date('c', filemtime($pagePath)),
            'inLanguage' => 'it-IT'
        ];
    }
    
    /**
     * Generate WebSite schema
     */
    public function generateWebSiteSchema() {
        return [
            '@context' => 'https://schema.org',
            '@type' => 'WebSite',
            '@id' => $this->config['site']['url'] . '#website',
            'name' => $this->config['site']['name'],
            'description' => $this->config['site']['description'],
            'url' => $this->config['site']['url'],
            'publisher' => [
                '@type' => 'Organization',
                '@id' => $this->config['site']['url'] . '#organization'
            ],
            'inLanguage' => 'it-IT',
            'potentialAction' => [
                '@type' => 'SearchAction',
                'target' => $this->config['site']['url'] . '/search?q={search_term_string}',
                'query-input' => 'required name=search_term_string'
            ]
        ];
    }
    
    /**
     * Generate FAQ schema for service pages
     */
    public function generateFAQSchema($service) {
        $faqs = [
            'assistenza-it' => [
                [
                    'question' => 'Che tipo di assistenza informatica offrite?',
                    'answer' => 'Offriamo assistenza completa per computer, server, reti aziendali, installazione software, risoluzione problemi hardware e software, e supporto tecnico on-site e remoto.'
                ],
                [
                    'question' => 'Quanto costa l\'assistenza informatica?',
                    'answer' => 'I nostri prezzi sono competitivi e trasparenti. Offriamo preventivi gratuiti e contratti di assistenza personalizzati in base alle esigenze aziendali.'
                ],
                [
                    'question' => 'Fornite assistenza anche nei weekend?',
                    'answer' => 'Sì, offriamo servizi di assistenza urgente 24/7 per problemi critici che potrebbero compromettere l\'operatività aziendale.'
                ]
            ],
            'sicurezza-informatica' => [
                [
                    'question' => 'Come proteggere la mia azienda dai cyber attacchi?',
                    'answer' => 'Implementiamo soluzioni multi-livello: firewall avanzati, antivirus enterprise, backup automatici, formazione del personale e monitoraggio continuo delle minacce.'
                ],
                [
                    'question' => 'Quanto spesso devo aggiornare i sistemi di sicurezza?',
                    'answer' => 'I sistemi di sicurezza devono essere aggiornati costantemente. Offriamo servizi di monitoraggio 24/7 e aggiornamenti automatici per mantenere sempre alta la protezione.'
                ]
            ],
            'cloud-storage' => [
                [
                    'question' => 'Il cloud storage è sicuro per i dati aziendali?',
                    'answer' => 'Sì, utilizziamo tecnologie di crittografia avanzate e datacenter certificati per garantire la massima sicurezza dei vostri dati.'
                ],
                [
                    'question' => 'Posso accedere ai miei dati da qualsiasi dispositivo?',
                    'answer' => 'Certamente. Le nostre soluzioni cloud permettono accesso sicuro ai dati da computer, tablet e smartphone, ovunque vi troviate.'
                ]
            ]
        ];
        
        $serviceFaqs = $faqs[$service] ?? [];
        if (empty($serviceFaqs)) {
            return null;
        }
        
        $faqItems = [];
        foreach ($serviceFaqs as $faq) {
            $faqItems[] = [
                '@type' => 'Question',
                'name' => $faq['question'],
                'acceptedAnswer' => [
                    '@type' => 'Answer',
                    'text' => $faq['answer']
                ]
            ];
        }
        
        return [
            '@context' => 'https://schema.org',
            '@type' => 'FAQPage',
            'mainEntity' => $faqItems
        ];
    }
    
    /**
     * Generate appropriate schemas for a specific page
     */
    public function generatePageSchema($pagePath) {
        $schemas = [];
        
        // Extract page info
        $content = file_get_contents($pagePath);
        if (!$content) {
            return $schemas;
        }
        
        // Parse HTML to extract title and description
        $dom = new DOMDocument();
        libxml_use_internal_errors(true);
        $dom->loadHTML($content);
        libxml_clear_errors();
        
        $title = $this->extractTitle($dom);
        $description = $this->extractDescription($dom);
        
        // Generate WebPage schema for all pages
        if ($title) {
            $schemas[] = $this->generateWebPageSchema($pagePath, $title, $description);
        }
        
        // Check if it's homepage
        $relativePath = str_replace($this->baseDir . $this->config['paths']['web'], '', $pagePath);
        if ($relativePath === '/index.html' || $relativePath === '/') {
            $schemas[] = $this->generateWebSiteSchema();
        }
        
        // Generate breadcrumb schema
        $breadcrumb = $this->generateBreadcrumbSchema($pagePath);
        if ($breadcrumb) {
            $schemas[] = $breadcrumb;
        }
        
        // Check if it's a service/city page
        if (strpos($relativePath, '/pages/') !== false) {
            $filename = pathinfo($relativePath, PATHINFO_FILENAME);
            $parts = explode('-', $filename);
            
            if (count($parts) >= 3) {
                $service = implode('-', array_slice($parts, 0, -1));
                $city = end($parts);
                
                if (isset($this->config['services'][$service])) {
                    // Generate LocalBusiness schema
                    $schemas[] = $this->generateLocalBusinessSchema($city, $service);
                    
                    // Generate Service schema
                    $serviceSchema = $this->generateServiceSchema($service, $city);
                    if ($serviceSchema) {
                        $schemas[] = $serviceSchema;
                    }
                    
                    // Generate FAQ schema
                    $faqSchema = $this->generateFAQSchema($service);
                    if ($faqSchema) {
                        $schemas[] = $faqSchema;
                    }
                }
            }
        }
        
        return $schemas;
    }
    
    /**
     * Inject schema markup into HTML page
     */
    public function injectSchemaIntoPage($filePath, $schemas) {
        if (empty($schemas)) {
            return false;
        }
        
        $content = file_get_contents($filePath);
        if (!$content) {
            return false;
        }
        
        // Remove existing schema markup
        $content = preg_replace('/<script[^>]*type=["\']application\/ld\+json["\'][^>]*>.*?<\/script>/is', '', $content);
        
        // Generate schema script tags
        $schemaScripts = [];
        foreach ($schemas as $schema) {
            $jsonLd = json_encode($schema, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            $schemaScripts[] = '<script type="application/ld+json">' . "\n" . $jsonLd . "\n" . '</script>';
        }
        
        // Find the best place to inject (before </head> or at the end of <head>)
        $schemaMarkup = "\n" . implode("\n", $schemaScripts) . "\n";
        
        if (strpos($content, '</head>') !== false) {
            $content = str_replace('</head>', $schemaMarkup . '</head>', $content);
        } else {
            // Fallback: add after <html> tag
            $content = preg_replace('/(<html[^>]*>)/i', '$1' . $schemaMarkup, $content);
        }
        
        // Write back to file
        return file_put_contents($filePath, $content) !== false;
    }
    
    /**
     * Generate schema for specific page URL
     */
    public function generateForPage($url) {
        // Convert URL to file path
        $relativePath = str_replace($this->config['site']['url'], '', $url);
        $filePath = $this->baseDir . $this->config['paths']['web'] . $relativePath;
        
        if (!file_exists($filePath)) {
            throw new Exception("Page not found: $filePath");
        }
        
        $schemas = $this->generatePageSchema($filePath);
        $organizationSchema = $this->generateOrganizationSchema();
        
        $allSchemas = array_merge([$organizationSchema], $schemas);
        
        if ($this->injectSchemaIntoPage($filePath, $allSchemas)) {
            $this->log("Schema generated for page: $url");
            return count($allSchemas);
        } else {
            throw new Exception("Failed to inject schema into page: $filePath");
        }
    }
    
    /**
     * Validate generated schema markup
     */
    public function validateSchema($schemas) {
        $errors = [];
        
        foreach ($schemas as $i => $schema) {
            // Basic validation
            if (!isset($schema['@context'])) {
                $errors[] = "Schema $i: Missing @context";
            }
            
            if (!isset($schema['@type'])) {
                $errors[] = "Schema $i: Missing @type";
            }
            
            // Type-specific validation
            $type = $schema['@type'] ?? '';
            
            switch ($type) {
                case 'Organization':
                    if (!isset($schema['name'])) {
                        $errors[] = "Organization schema: Missing name";
                    }
                    break;
                    
                case 'LocalBusiness':
                    if (!isset($schema['name']) || !isset($schema['address'])) {
                        $errors[] = "LocalBusiness schema: Missing required fields";
                    }
                    break;
                    
                case 'WebPage':
                    if (!isset($schema['url']) || !isset($schema['name'])) {
                        $errors[] = "WebPage schema: Missing required fields";
                    }
                    break;
            }
        }
        
        return $errors;
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
    
    private function log($message) {
        $timestamp = date('[Y-m-d H:i:s]');
        $logMessage = "$timestamp $message" . PHP_EOL;
        
        if ($this->verbose) {
            echo $logMessage;
        }
        
        $logFile = $this->baseDir . $this->config['paths']['logs'] . '/structured-data.log';
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
        echo "IT-ERA Structured Data Generator\n";
        echo "Usage: php structured-data-generator.php [options]\n";
        echo "Options:\n";
        echo "  --generate-all     Generate schema for all pages\n";
        echo "  --page=URL         Generate schema for specific page\n";
        echo "  --type=SCHEMA      Generate specific schema type only\n";
        echo "  --validate         Validate existing schema markup\n";
        echo "  --verbose          Show detailed output\n";
        echo "  --help             Show this help message\n";
        exit(0);
    }
    
    $verbose = isset($options['verbose']);
    
    try {
        $generator = new StructuredDataGenerator($verbose);
        
        if (isset($options['generate-all'])) {
            $results = $generator->generateAll();
            echo "Structured data generation completed:\n";
            echo "Pages processed: {$results['processed_pages']}\n";
            echo "Schemas generated: {$results['schemas_generated']}\n";
            echo "Errors: " . count($results['errors']) . "\n";
            
        } elseif (isset($options['page'])) {
            $count = $generator->generateForPage($options['page']);
            echo "Generated $count schemas for page: {$options['page']}\n";
            
        } else {
            echo "No action specified. Use --help for usage information.\n";
            exit(1);
        }
        
    } catch (Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
        exit(1);
    }
}