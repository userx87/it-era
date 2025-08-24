const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');

const config = require('../config/config');
const database = require('../config/database');
const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const categoriesRoutes = require('./routes/categories');
const tagsRoutes = require('./routes/tags');
const mediaRoutes = require('./routes/media');
const webhookRoutes = require('./routes/webhooks');
const adminRoutes = require('./routes/admin');
const publicRoutes = require('./routes/public');
const analyticsRoutes = require('./routes/analytics');
const { initializeScheduler } = require('./services/scheduler');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// Trust proxy for correct IP addresses
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.ckeditor.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression for better performance
app.use(compression());

// Logging
if (config.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT.windowMs,
  max: config.RATE_LIMIT.max,
  message: {
    error: config.RATE_LIMIT.message,
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Session middleware for admin panel
app.use(session({
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Static files for uploads and admin panel
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/admin', express.static(path.join(__dirname, '../public/admin')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/analytics', analyticsRoutes);

// Admin panel routes
app.use('/admin/api', adminRoutes);

// Public API routes (for frontend consumption)
app.use('/public', publicRoutes);

// Admin panel - serve index.html for all admin routes (SPA routing)
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/index.html'));
});

// Default admin redirect
app.get('/admin', (req, res) => {
  res.redirect('/admin/dashboard');
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Database connection and server startup
async function startServer() {
  try {
    console.log('🔌 Connecting to database...');
    await database.connect();
    
    console.log('📅 Initializing scheduler...');
    await initializeScheduler();
    
    const server = app.listen(config.PORT, () => {
      console.log(`
🚀 IT-ERA Blog Backend Server Started!
📡 Environment: ${config.NODE_ENV}
🌐 Port: ${config.PORT}
📊 Admin Panel: http://localhost:${config.PORT}/admin
🔗 API Docs: http://localhost:${config.PORT}/api/docs
📱 Health Check: http://localhost:${config.PORT}/health
      `);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('🔄 SIGTERM received, shutting down gracefully...');
      server.close(async () => {
        console.log('⏹️ HTTP server closed');
        await database.close();
        console.log('📦 Database connection closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('🔄 SIGINT received, shutting down gracefully...');
      server.close(async () => {
        console.log('⏹️ HTTP server closed');
        await database.close();
        console.log('📦 Database connection closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = app;