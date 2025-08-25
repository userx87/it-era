// Admin Panel Configuration
const CONFIG = {
    API_BASE_URL: 'https://it-era-admin-auth-production.bulltech.workers.dev',
    ADMIN_API_BASE_URL: 'https://it-era-admin-auth-production.bulltech.workers.dev',
    
    // IT-ERA Brand Colors
    COLORS: {
        PRIMARY: '#0056cc',      // IT Blue
        SECONDARY: '#dc3545',    // Security Red  
        SUCCESS: '#28a745',      // Success Green
        INFO: '#17a2b8',         // Cloud Cyan
        WARNING: '#ffc107',      // Warning Yellow
        DANGER: '#dc3545',       // Danger Red
        DARK: '#1a1a2e'         // IT-ERA Dark
    },
    
    // Service Categories
    SERVICES: {
        'assistenza-it': {
            name: 'Assistenza IT',
            color: '#0056cc',
            icon: 'bi-tools'
        },
        'sicurezza-informatica': {
            name: 'Sicurezza Informatica',
            color: '#dc3545',
            icon: 'bi-shield-check'
        },
        'cloud-storage': {
            name: 'Cloud Storage',
            color: '#17a2b8',
            icon: 'bi-cloud'
        }
    },
    
    // Post Statuses
    POST_STATUSES: {
        'draft': {
            name: 'Bozza',
            class: 'status-draft',
            icon: 'bi-file-text'
        },
        'published': {
            name: 'Pubblicato',
            class: 'status-published',
            icon: 'bi-check-circle'
        },
        'scheduled': {
            name: 'Programmato',
            class: 'status-scheduled',
            icon: 'bi-clock'
        },
        'archived': {
            name: 'Archiviato',
            class: 'status-archived',
            icon: 'bi-archive'
        }
    },
    
    // User Roles
    USER_ROLES: {
        'admin': {
            name: 'Administrator',
            color: '#dc3545'
        },
        'editor': {
            name: 'Editor',
            color: '#0056cc'
        },
        'author': {
            name: 'Author',
            color: '#28a745'
        }
    },
    
    // Pagination
    PAGINATION: {
        DEFAULT_LIMIT: 10,
        MAX_LIMIT: 50
    },
    
    // File Upload
    UPLOAD: {
        MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
        ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        MAX_FILES: 10
    },
    
    // Chart Configuration
    CHART_OPTIONS: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    precision: 0
                }
            }
        }
    },
    
    // Italian translations for date formatting
    DATE_LOCALE: 'it-IT',
    
    // Notification settings
    NOTIFICATIONS: {
        DEFAULT_TIMEOUT: 5000,
        SUCCESS_TIMEOUT: 3000,
        ERROR_TIMEOUT: 8000
    },
    
    // Editor configuration
    EDITOR_CONFIG: {
        toolbar: [
            'heading', '|',
            'bold', 'italic', 'underline', 'strikethrough', '|',
            'bulletedList', 'numberedList', '|',
            'outdent', 'indent', '|',
            'blockQuote', 'insertTable', '|',
            'link', 'imageUpload', '|',
            'code', 'codeBlock', '|',
            'undo', 'redo', '|',
            'findAndReplace', 'selectAll'
        ],
        heading: {
            options: [
                { model: 'paragraph', title: 'Paragrafo', class: 'ck-heading_paragraph' },
                { model: 'heading1', view: 'h1', title: 'Titolo 1', class: 'ck-heading_heading1' },
                { model: 'heading2', view: 'h2', title: 'Titolo 2', class: 'ck-heading_heading2' },
                { model: 'heading3', view: 'h3', title: 'Titolo 3', class: 'ck-heading_heading3' },
                { model: 'heading4', view: 'h4', title: 'Titolo 4', class: 'ck-heading_heading4' }
            ]
        },
        image: {
            toolbar: [
                'imageTextAlternative', 'imageStyle:full', 'imageStyle:side'
            ]
        },
        table: {
            contentToolbar: [
                'tableColumn', 'tableRow', 'mergeTableCells'
            ]
        },
        link: {
            decorators: {
                openInNewTab: {
                    mode: 'manual',
                    label: 'Apri in nuova finestra',
                    attributes: {
                        target: '_blank',
                        rel: 'noopener noreferrer'
                    }
                }
            }
        }
    }
};