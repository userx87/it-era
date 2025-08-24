require('dotenv').config();

const config = {
  // Server Configuration
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  DB_PATH: process.env.DB_PATH || './database.sqlite',
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  
  // Session Configuration
  SESSION_SECRET: process.env.SESSION_SECRET || 'your-super-secret-session-key',
  
  // Email Configuration (for n8n webhooks)
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@it-era.it',
  
  // IT-ERA Specific Configuration
  COMPANY: {
    name: 'IT-ERA',
    phone: '039 888 2041',
    address: 'Viale Risorgimento 32, Vimercate MB',
    email: 'info@it-era.it',
    piva: '10524040966',
    website: 'https://it-era.it'
  },
  
  // Blog Configuration
  BLOG: {
    postsPerPage: 10,
    maxUploadSize: '5MB',
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    uploadPath: './uploads/',
    defaultAuthor: 'IT-ERA Team'
  },
  
  // n8n Webhook Configuration
  N8N: {
    webhookSecret: process.env.N8N_WEBHOOK_SECRET || 'change-me-in-production',
    enabled: process.env.N8N_ENABLED === 'true'
  },
  
  // Rate Limiting
  RATE_LIMIT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
    message: 'Troppe richieste da questo IP, riprova più tardi.'
  },
  
  // Security
  SECURITY: {
    bcryptRounds: 12,
    maxLoginAttempts: 5,
    lockoutDuration: 30 * 60 * 1000 // 30 minutes
  }
};

module.exports = config;