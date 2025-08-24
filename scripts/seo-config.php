<?php
/**
 * IT-ERA SEO System Configuration
 * Configuration file for SEO indexing and monitoring system
 */

return [
    // Site configuration
    'site' => [
        'url' => 'https://it-era.pages.dev',
        'name' => 'IT-ERA - Assistenza Informatica Professionale',
        'description' => 'Servizi di assistenza informatica, sicurezza informatica e cloud storage per aziende e privati in Lombardia',
        'contact' => [
            'phone' => '039 888 2041',
            'email' => 'info@it-era.it',
            'address' => 'Viale Risorgimento 32, Vimercate MB',
            'vat' => '10524040966'
        ]
    ],

    // Directory paths
    'paths' => [
        'web' => '/web',
        'pages' => '/web/pages',
        'pages_draft' => '/web/pages-draft',
        'sitemap' => '/web/sitemap.xml',
        'logs' => '/scripts/logs',
        'reports' => '/scripts/reports'
    ],

    // Google APIs
    'google' => [
        'indexing_api_key' => '', // Add your Google Indexing API key
        'search_console_key' => '', // Add your Search Console API key
        'analytics_key' => '', // Add your Analytics API key
        'service_account_file' => '/scripts/google-service-account.json'
    ],

    // Sitemap configuration
    'sitemap' => [
        'max_urls_per_file' => 50000,
        'change_frequency' => [
            'home' => 'daily',
            'services' => 'weekly',
            'pages' => 'monthly',
            'blog' => 'daily'
        ],
        'priority' => [
            'home' => 1.0,
            'main_services' => 0.9,
            'city_pages' => 0.8,
            'other_pages' => 0.7
        ]
    ],

    // SEO monitoring
    'monitoring' => [
        'timeout' => 30,
        'user_agent' => 'IT-ERA SEO Bot/1.0',
        'check_intervals' => [
            'sitemap' => 3600, // 1 hour
            'pages' => 86400, // 24 hours
            'health' => 3600 // 1 hour
        ]
    ],

    // Services and their colors/themes
    'services' => [
        'assistenza-it' => [
            'name' => 'Assistenza IT',
            'color' => '#0056cc',
            'priority' => 0.9
        ],
        'sicurezza-informatica' => [
            'name' => 'Sicurezza Informatica',
            'color' => '#dc3545',
            'priority' => 0.9
        ],
        'cloud-storage' => [
            'name' => 'Cloud Storage',
            'color' => '#17a2b8',
            'priority' => 0.8
        ]
    ],

    // Cities and regions
    'locations' => [
        'main_cities' => ['milano', 'monza', 'como', 'bergamo', 'lecco'],
        'priority_regions' => ['lombardia', 'brianza']
    ]
];