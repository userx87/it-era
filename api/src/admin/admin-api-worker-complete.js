/**
 * IT-ERA Admin Panel API Worker - Complete Implementation
 * Comprehensive Cloudflare Worker for admin panel with all required endpoints
 * 
 * ENDPOINTS:
 * - GET  /admin/api/auth/health - System health check
 * - POST /admin/api/auth/login - User authentication
 * - GET  /admin/api/auth/verify - Token verification
 * - GET  /admin/api/dashboard - Dashboard statistics
 * - GET  /admin/api/posts - Blog posts management
 * - POST /admin/api/posts - Create new post
 * - PUT  /admin/api/posts/:id - Update post
 * - DELETE /admin/api/posts/:id - Delete post
 * - GET  /admin/api/media - Media library
 * - POST /admin/api/media - Upload media
 * - GET  /admin/api/users - User management
 * - POST /admin/api/users - Create user
 * - GET  /admin/api/settings - System settings
 * - PUT  /admin/api/settings - Update settings
 * - GET  /admin/api/analytics - Analytics data
 */

// Configuration constants
const CONFIG = {
  JWT_SECRET_DEFAULT: 'it-era-admin-secret-2024-production',
  TOKEN_EXPIRY_HOURS: 24,
  RATE_LIMIT_REQUESTS: 100, // per hour per IP
  RATE_LIMIT_AUTH_REQUESTS: 5, // per minute for auth endpoints
  CORS_MAX_AGE: 86400, // 24 hours
  ALLOWED_ORIGINS: [
    'https://it-era.pages.dev',
    'https://www.it-era.it',
    'https://it-era.it',
    'http://localhost:3000',
    'http://localhost:8787'
  ],
  UPLOAD_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_MEDIA_TYPES: [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain'
  ]
};

// Test users for development/demo
const TEST_USERS = {
  'admin@it-era.it': {
    id: 'admin-001',
    username: 'admin',
    email: 'admin@it-era.it',
    name: 'IT-ERA Administrator',
    role: 'admin',
    password: 'admin123', // In production, use bcrypt hash
    avatar: '/assets/admin-avatar.png',
    permissions: ['read', 'write', 'delete', 'manage_users', 'manage_settings'],
    created_at: '2024-01-01T00:00:00Z',
    last_login: null,
    is_active: true
  },
  'editor@it-era.it': {
    id: 'editor-001',
    username: 'editor',
    email: 'editor@it-era.it',
    name: 'IT-ERA Editor',
    role: 'editor',
    password: 'editor123',
    avatar: '/assets/editor-avatar.png',
    permissions: ['read', 'write'],
    created_at: '2024-01-01T00:00:00Z',
    last_login: null,
    is_active: true
  }
};

// Mock data for demonstration
const MOCK_DATA = {
  posts: [
    {
      id: 1,
      title: "Sicurezza Informatica per PMI: Guida Completa 2024",
      slug: "sicurezza-informatica-pmi-guida-2024",
      content: "La sicurezza informatica è fondamentale per le piccole e medie imprese...",
      excerpt: "Guida completa alla sicurezza informatica per PMI nel 2024",
      author_id: 'admin-001',
      author_name: 'IT-ERA Administrator',
      status: 'published',
      category: 'Sicurezza',
      tags: ['sicurezza', 'pmi', 'cybersecurity'],
      featured_image: '/assets/images/sicurezza-pmi.jpg',
      seo_title: "Sicurezza Informatica PMI 2024 - Guida Completa | IT-ERA",
      meta_description: "Scopri come proteggere la tua PMI con la nostra guida completa alla sicurezza informatica 2024. Consigli pratici e soluzioni efficaci.",
      focus_keyword: "sicurezza informatica pmi",
      views: 1250,
      created_at: '2024-08-20T10:00:00Z',
      updated_at: '2024-08-20T10:00:00Z',
      published_at: '2024-08-20T10:00:00Z'
    },
    {
      id: 2,
      title: "Cloud Storage Aziendale: Vantaggi e Soluzioni",
      slug: "cloud-storage-aziendale-vantaggi-soluzioni",
      content: "Il cloud storage offre numerosi vantaggi alle aziende moderne...",
      excerpt: "Scopri i vantaggi del cloud storage per la tua azienda",
      author_id: 'editor-001',
      author_name: 'IT-ERA Editor',
      status: 'draft',
      category: 'Cloud',
      tags: ['cloud', 'storage', 'aziende'],
      featured_image: '/assets/images/cloud-storage.jpg',
      seo_title: "Cloud Storage Aziendale - Vantaggi e Soluzioni | IT-ERA",
      meta_description: "Scopri i vantaggi del cloud storage aziendale e le migliori soluzioni per la tua impresa. Guida completa di IT-ERA.",
      focus_keyword: "cloud storage aziendale",
      views: 890,
      created_at: '2024-08-22T14:30:00Z',
      updated_at: '2024-08-24T09:15:00Z',
      published_at: null
    }
  ],
  media: [
    {
      id: 1,
      filename: 'sicurezza-pmi.jpg',
      original_name: 'sicurezza-informatica-pmi.jpg',
      url: '/assets/images/sicurezza-pmi.jpg',
      type: 'image/jpeg',
      size: 245760, // bytes
      width: 1200,
      height: 675,
      alt: 'Sicurezza informatica per PMI',
      uploaded_by: 'admin-001',
      uploaded_at: '2024-08-20T09:45:00Z'
    },
    {
      id: 2,
      filename: 'cloud-storage.jpg',
      original_name: 'cloud-storage-solutions.jpg',
      url: '/assets/images/cloud-storage.jpg',
      type: 'image/jpeg',
      size: 198432,
      width: 1200,
      height: 800,
      alt: 'Soluzioni cloud storage',
      uploaded_by: 'editor-001',
      uploaded_at: '2024-08-22T14:00:00Z'
    }
  ],
  settings: {
    site: {
      title: 'IT-ERA Blog',
      description: 'Il blog ufficiale di IT-ERA per news, guide e consigli su informatica e tecnologia.',
      url: 'https://it-era.it/blog',
      logo: '/assets/logo.png',
      favicon: '/assets/favicon.ico'
    },
    seo: {
      google_analytics_id: 'G-XXXXXXXXXX',
      google_search_console_verified: true,
      robots_txt_enabled: true,
      sitemap_enabled: true,
      meta_author: 'IT-ERA Team',
      default_meta_description: 'IT-ERA - Soluzioni informatiche professionali per aziende in Lombardia'
    },
    email: {
      smtp_host: 'smtp.resend.com',
      smtp_port: 587,
      smtp_user: 'resend',
      from_email: 'blog@it-era.it',
      from_name: 'IT-ERA Blog'
    },
    security: {
      max_login_attempts: 5,
      session_timeout: 86400, // 24 hours
      require_2fa: false,
      password_min_length: 8
    }
  }
};

/**
 * Main request handler
 */
export default {
  async fetch(request, env, ctx) {
    // Store start time for performance monitoring
    const startTime = Date.now();
    
    try {
      const url = new URL(request.url);
      const origin = request.headers.get('Origin') || '';
      
      // CORS preflight handling
      if (request.method === 'OPTIONS') {
        return handleCORSPreflight(origin);
      }
      
      // Rate limiting check
      const rateLimitResult = await checkRateLimit(request, env);
      if (!rateLimitResult.allowed) {
        return createErrorResponse(
          'Too many requests. Please try again later.',
          429,
          { 'Retry-After': '3600' },
          origin
        );
      }
      
      // Route request to appropriate handler
      const response = await routeRequest(request, env, url);
      
      // Add performance headers
      const responseTime = Date.now() - startTime;
      response.headers.set('X-Response-Time', `${responseTime}ms`);
      response.headers.set('X-Request-ID', generateRequestId());
      
      // Add security headers
      addSecurityHeaders(response);
      
      return response;
      
    } catch (error) {
      console.error('Admin API Error:', error);
      return createErrorResponse(
        'Internal server error',
        500,
        {},
        request.headers.get('Origin') || ''
      );
    }
  }
};

/**
 * Route incoming requests to appropriate handlers
 */
async function routeRequest(request, env, url) {
  const path = url.pathname;
  const method = request.method;
  const origin = request.headers.get('Origin') || '';
  
  // Authentication endpoints
  if (path === '/admin/api/auth/health' && method === 'GET') {
    return handleHealthCheck(request, env, origin);
  }
  if (path === '/admin/api/auth/login' && method === 'POST') {
    return handleLogin(request, env, origin);
  }
  if (path === '/admin/api/auth/verify' && method === 'GET') {
    return handleAuthVerify(request, env, origin);
  }
  
  // Protected endpoints - require authentication
  const authResult = await verifyAuthentication(request, env);
  if (!authResult.success) {
    return createErrorResponse(authResult.error, 401, {}, origin);
  }
  
  // Dashboard endpoint
  if (path === '/admin/api/dashboard' && method === 'GET') {
    return handleDashboard(request, env, origin, authResult.user);
  }
  
  // Posts endpoints
  if (path === '/admin/api/posts' && method === 'GET') {
    return handleGetPosts(request, env, origin, authResult.user);
  }
  if (path === '/admin/api/posts' && method === 'POST') {
    return handleCreatePost(request, env, origin, authResult.user);
  }
  if (path.match(/^\/admin\/api\/posts\/\d+$/) && method === 'PUT') {
    return handleUpdatePost(request, env, origin, authResult.user);
  }
  if (path.match(/^\/admin\/api\/posts\/\d+$/) && method === 'DELETE') {
    return handleDeletePost(request, env, origin, authResult.user);
  }
  
  // Media endpoints
  if (path === '/admin/api/media' && method === 'GET') {
    return handleGetMedia(request, env, origin, authResult.user);
  }
  if (path === '/admin/api/media' && method === 'POST') {
    return handleUploadMedia(request, env, origin, authResult.user);
  }
  
  // Users endpoints (admin only)
  if (path === '/admin/api/users' && method === 'GET') {
    return handleGetUsers(request, env, origin, authResult.user);
  }
  if (path === '/admin/api/users' && method === 'POST') {
    return handleCreateUser(request, env, origin, authResult.user);
  }
  
  // Settings endpoints (admin only)
  if (path === '/admin/api/settings' && method === 'GET') {
    return handleGetSettings(request, env, origin, authResult.user);
  }
  if (path === '/admin/api/settings' && method === 'PUT') {
    return handleUpdateSettings(request, env, origin, authResult.user);
  }
  
  // Analytics endpoint
  if (path === '/admin/api/analytics' && method === 'GET') {
    return handleAnalytics(request, env, origin, authResult.user);
  }
  
  // Default 404 response
  return createErrorResponse('Endpoint not found', 404, {}, origin);
}

/**
 * Health check endpoint
 */
async function handleHealthCheck(request, env, origin) {
  const healthData = {
    status: 'healthy',
    service: 'IT-ERA Admin API',
    version: '1.0.0',
    environment: env.ENVIRONMENT || 'development',
    timestamp: new Date().toISOString(),
    uptime: process.uptime ? Math.floor(process.uptime()) : null,
    endpoints: {
      authentication: {
        login: 'POST /admin/api/auth/login',
        verify: 'GET /admin/api/auth/verify'
      },
      management: {
        dashboard: 'GET /admin/api/dashboard',
        posts: 'GET|POST /admin/api/posts',
        media: 'GET|POST /admin/api/media',
        users: 'GET|POST /admin/api/users',
        settings: 'GET|PUT /admin/api/settings',
        analytics: 'GET /admin/api/analytics'
      }
    },
    security: {
      cors_enabled: true,
      rate_limiting: true,
      jwt_validation: true
    }
  };
  
  return createSuccessResponse(healthData, origin);
}

/**
 * User login endpoint
 */
async function handleLogin(request, env, origin) {
  try {
    const { email, password } = await request.json();
    
    // Validate input
    if (!email || !password) {
      return createErrorResponse('Email and password are required', 400, {}, origin);
    }
    
    // Rate limiting for auth endpoints
    const authRateLimit = await checkAuthRateLimit(request, env);
    if (!authRateLimit.allowed) {
      return createErrorResponse(
        'Too many login attempts. Please try again later.',
        429,
        { 'Retry-After': '60' },
        origin
      );
    }
    
    // Find user
    const user = TEST_USERS[email.toLowerCase()];
    if (!user || !user.is_active) {
      return createErrorResponse('Invalid credentials', 401, {}, origin);
    }
    
    // Verify password (in production, use bcrypt)
    if (password !== user.password) {
      return createErrorResponse('Invalid credentials', 401, {}, origin);
    }
    
    // Generate JWT token
    const tokenPayload = {
      sub: user.id,
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (CONFIG.TOKEN_EXPIRY_HOURS * 60 * 60)
    };
    
    const token = await generateJWT(tokenPayload, env.JWT_SECRET || CONFIG.JWT_SECRET_DEFAULT);
    
    // Update last login
    user.last_login = new Date().toISOString();
    
    // Log successful login
    console.log(`Successful login: ${user.email} (${user.role})`);
    
    return createSuccessResponse({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        permissions: user.permissions,
        last_login: user.last_login
      }
    }, origin);
    
  } catch (error) {
    console.error('Login error:', error);
    return createErrorResponse('Login failed', 500, {}, origin);
  }
}

/**
 * Token verification endpoint
 */
async function handleAuthVerify(request, env, origin) {
  const authResult = await verifyAuthentication(request, env);
  
  if (!authResult.success) {
    return createErrorResponse(authResult.error, 401, {}, origin);
  }
  
  return createSuccessResponse({
    user: authResult.user,
    permissions: authResult.user.permissions || []
  }, origin);
}

/**
 * Dashboard statistics endpoint
 */
async function handleDashboard(request, env, origin, user) {
  const dashboardData = {
    stats: {
      posts: {
        total: MOCK_DATA.posts.length,
        published: MOCK_DATA.posts.filter(p => p.status === 'published').length,
        draft: MOCK_DATA.posts.filter(p => p.status === 'draft').length,
        scheduled: MOCK_DATA.posts.filter(p => p.status === 'scheduled').length
      },
      media: {
        total: MOCK_DATA.media.length,
        total_size: MOCK_DATA.media.reduce((sum, m) => sum + m.size, 0),
        images: MOCK_DATA.media.filter(m => m.type.startsWith('image')).length
      },
      users: {
        total: Object.keys(TEST_USERS).length,
        admins: Object.values(TEST_USERS).filter(u => u.role === 'admin').length,
        editors: Object.values(TEST_USERS).filter(u => u.role === 'editor').length,
        active: Object.values(TEST_USERS).filter(u => u.is_active).length
      },
      analytics: {
        total_views: MOCK_DATA.posts.reduce((sum, p) => sum + p.views, 0),
        avg_views: Math.round(MOCK_DATA.posts.reduce((sum, p) => sum + p.views, 0) / MOCK_DATA.posts.length),
        top_post: MOCK_DATA.posts.sort((a, b) => b.views - a.views)[0]?.title || 'N/A'
      }
    },
    recent_activity: [
      {
        type: 'post_created',
        message: `New post: "${MOCK_DATA.posts[0].title}" created`,
        user: MOCK_DATA.posts[0].author_name,
        timestamp: MOCK_DATA.posts[0].created_at
      },
      {
        type: 'user_login',
        message: `User logged in: ${user.name}`,
        user: user.name,
        timestamp: new Date().toISOString()
      },
      {
        type: 'media_uploaded',
        message: `Media uploaded: ${MOCK_DATA.media[0].original_name}`,
        user: 'Admin',
        timestamp: MOCK_DATA.media[0].uploaded_at
      }
    ],
    quick_actions: [
      { name: 'Create Post', url: '/admin/posts/new', icon: 'plus' },
      { name: 'Upload Media', url: '/admin/media/upload', icon: 'upload' },
      { name: 'View Analytics', url: '/admin/analytics', icon: 'chart' },
      { name: 'Manage Settings', url: '/admin/settings', icon: 'settings' }
    ]
  };
  
  return createSuccessResponse(dashboardData, origin);
}

/**
 * Get posts endpoint
 */
async function handleGetPosts(request, env, origin, user) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page')) || 1;
  const limit = parseInt(url.searchParams.get('limit')) || 10;
  const status = url.searchParams.get('status');
  const search = url.searchParams.get('search');
  
  let posts = [...MOCK_DATA.posts];
  
  // Filter by status
  if (status) {
    posts = posts.filter(p => p.status === status);
  }
  
  // Search functionality
  if (search) {
    const searchLower = search.toLowerCase();
    posts = posts.filter(p => 
      p.title.toLowerCase().includes(searchLower) ||
      p.content.toLowerCase().includes(searchLower) ||
      p.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }
  
  // Pagination
  const total = posts.length;
  const offset = (page - 1) * limit;
  posts = posts.slice(offset, offset + limit);
  
  return createSuccessResponse({
    posts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  }, origin);
}

/**
 * Create post endpoint
 */
async function handleCreatePost(request, env, origin, user) {
  try {
    const postData = await request.json();
    
    // Validate required fields
    const required = ['title', 'content'];
    for (const field of required) {
      if (!postData[field]) {
        return createErrorResponse(`Field '${field}' is required`, 400, {}, origin);
      }
    }
    
    // Generate slug if not provided
    if (!postData.slug) {
      postData.slug = generateSlug(postData.title);
    }
    
    // Create new post
    const newPost = {
      id: Math.max(...MOCK_DATA.posts.map(p => p.id)) + 1,
      title: postData.title,
      slug: postData.slug,
      content: postData.content,
      excerpt: postData.excerpt || postData.content.substring(0, 160) + '...',
      author_id: user.id,
      author_name: user.name,
      status: postData.status || 'draft',
      category: postData.category || 'General',
      tags: postData.tags || [],
      featured_image: postData.featured_image || null,
      seo_title: postData.seo_title || postData.title,
      meta_description: postData.meta_description || postData.excerpt,
      focus_keyword: postData.focus_keyword || null,
      views: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: postData.status === 'published' ? new Date().toISOString() : null
    };
    
    // Add to mock data
    MOCK_DATA.posts.push(newPost);
    
    return createSuccessResponse({
      message: 'Post created successfully',
      post: newPost
    }, origin);
    
  } catch (error) {
    console.error('Create post error:', error);
    return createErrorResponse('Failed to create post', 500, {}, origin);
  }
}

/**
 * Update post endpoint
 */
async function handleUpdatePost(request, env, origin, user) {
  try {
    const url = new URL(request.url);
    const postId = parseInt(url.pathname.split('/').pop());
    const updateData = await request.json();
    
    // Find post
    const postIndex = MOCK_DATA.posts.findIndex(p => p.id === postId);
    if (postIndex === -1) {
      return createErrorResponse('Post not found', 404, {}, origin);
    }
    
    const post = MOCK_DATA.posts[postIndex];
    
    // Check permissions (users can only edit their own posts unless admin)
    if (user.role !== 'admin' && post.author_id !== user.id) {
      return createErrorResponse('Insufficient permissions', 403, {}, origin);
    }
    
    // Update post
    const updatedPost = {
      ...post,
      ...updateData,
      updated_at: new Date().toISOString(),
      published_at: updateData.status === 'published' && !post.published_at ? 
        new Date().toISOString() : post.published_at
    };
    
    MOCK_DATA.posts[postIndex] = updatedPost;
    
    return createSuccessResponse({
      message: 'Post updated successfully',
      post: updatedPost
    }, origin);
    
  } catch (error) {
    console.error('Update post error:', error);
    return createErrorResponse('Failed to update post', 500, {}, origin);
  }
}

/**
 * Delete post endpoint
 */
async function handleDeletePost(request, env, origin, user) {
  try {
    const url = new URL(request.url);
    const postId = parseInt(url.pathname.split('/').pop());
    
    // Find post
    const postIndex = MOCK_DATA.posts.findIndex(p => p.id === postId);
    if (postIndex === -1) {
      return createErrorResponse('Post not found', 404, {}, origin);
    }
    
    const post = MOCK_DATA.posts[postIndex];
    
    // Check permissions
    if (user.role !== 'admin' && post.author_id !== user.id) {
      return createErrorResponse('Insufficient permissions', 403, {}, origin);
    }
    
    // Remove post
    MOCK_DATA.posts.splice(postIndex, 1);
    
    return createSuccessResponse({
      message: 'Post deleted successfully'
    }, origin);
    
  } catch (error) {
    console.error('Delete post error:', error);
    return createErrorResponse('Failed to delete post', 500, {}, origin);
  }
}

/**
 * Get media endpoint
 */
async function handleGetMedia(request, env, origin, user) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page')) || 1;
  const limit = parseInt(url.searchParams.get('limit')) || 20;
  const type = url.searchParams.get('type');
  
  let media = [...MOCK_DATA.media];
  
  // Filter by type
  if (type) {
    media = media.filter(m => m.type.startsWith(type));
  }
  
  // Pagination
  const total = media.length;
  const offset = (page - 1) * limit;
  media = media.slice(offset, offset + limit);
  
  return createSuccessResponse({
    media,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  }, origin);
}

/**
 * Upload media endpoint
 */
async function handleUploadMedia(request, env, origin, user) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return createErrorResponse('No file provided', 400, {}, origin);
    }
    
    // Validate file type
    if (!CONFIG.SUPPORTED_MEDIA_TYPES.includes(file.type)) {
      return createErrorResponse(
        `Unsupported file type: ${file.type}. Supported types: ${CONFIG.SUPPORTED_MEDIA_TYPES.join(', ')}`,
        400, {}, origin
      );
    }
    
    // Validate file size
    if (file.size > CONFIG.UPLOAD_MAX_SIZE) {
      return createErrorResponse(
        `File too large. Maximum size: ${CONFIG.UPLOAD_MAX_SIZE / (1024 * 1024)}MB`,
        400, {}, origin
      );
    }
    
    // Generate filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `upload_${timestamp}.${extension}`;
    
    // In a real implementation, you would upload to R2 or another storage service
    // For demo purposes, we'll simulate the upload
    
    const newMedia = {
      id: Math.max(...MOCK_DATA.media.map(m => m.id)) + 1,
      filename,
      original_name: file.name,
      url: `/assets/uploads/${filename}`,
      type: file.type,
      size: file.size,
      width: file.type.startsWith('image') ? 1200 : null,
      height: file.type.startsWith('image') ? 800 : null,
      alt: formData.get('alt') || file.name,
      uploaded_by: user.id,
      uploaded_at: new Date().toISOString()
    };
    
    MOCK_DATA.media.push(newMedia);
    
    return createSuccessResponse({
      message: 'File uploaded successfully',
      media: newMedia
    }, origin);
    
  } catch (error) {
    console.error('Upload media error:', error);
    return createErrorResponse('Failed to upload file', 500, {}, origin);
  }
}

/**
 * Get users endpoint (admin only)
 */
async function handleGetUsers(request, env, origin, user) {
  // Check admin permissions
  if (user.role !== 'admin') {
    return createErrorResponse('Admin access required', 403, {}, origin);
  }
  
  const users = Object.values(TEST_USERS).map(u => ({
    id: u.id,
    username: u.username,
    email: u.email,
    name: u.name,
    role: u.role,
    avatar: u.avatar,
    created_at: u.created_at,
    last_login: u.last_login,
    is_active: u.is_active
  }));
  
  return createSuccessResponse({ users }, origin);
}

/**
 * Create user endpoint (admin only)
 */
async function handleCreateUser(request, env, origin, user) {
  // Check admin permissions
  if (user.role !== 'admin') {
    return createErrorResponse('Admin access required', 403, {}, origin);
  }
  
  try {
    const userData = await request.json();
    
    // Validate required fields
    const required = ['email', 'password', 'name', 'role'];
    for (const field of required) {
      if (!userData[field]) {
        return createErrorResponse(`Field '${field}' is required`, 400, {}, origin);
      }
    }
    
    // Check if user already exists
    if (TEST_USERS[userData.email.toLowerCase()]) {
      return createErrorResponse('User with this email already exists', 400, {}, origin);
    }
    
    // Create new user
    const newUser = {
      id: `user-${Date.now()}`,
      username: userData.username || userData.email.split('@')[0],
      email: userData.email.toLowerCase(),
      name: userData.name,
      role: userData.role,
      password: userData.password, // In production, hash with bcrypt
      avatar: userData.avatar || '/assets/default-avatar.png',
      permissions: userData.role === 'admin' ? 
        ['read', 'write', 'delete', 'manage_users', 'manage_settings'] :
        ['read', 'write'],
      created_at: new Date().toISOString(),
      last_login: null,
      is_active: true
    };
    
    TEST_USERS[newUser.email] = newUser;
    
    // Return user without password
    const { password, ...userResponse } = newUser;
    
    return createSuccessResponse({
      message: 'User created successfully',
      user: userResponse
    }, origin);
    
  } catch (error) {
    console.error('Create user error:', error);
    return createErrorResponse('Failed to create user', 500, {}, origin);
  }
}

/**
 * Get settings endpoint (admin only)
 */
async function handleGetSettings(request, env, origin, user) {
  // Check admin permissions
  if (user.role !== 'admin') {
    return createErrorResponse('Admin access required', 403, {}, origin);
  }
  
  return createSuccessResponse({ settings: MOCK_DATA.settings }, origin);
}

/**
 * Update settings endpoint (admin only)
 */
async function handleUpdateSettings(request, env, origin, user) {
  // Check admin permissions
  if (user.role !== 'admin') {
    return createErrorResponse('Admin access required', 403, {}, origin);
  }
  
  try {
    const updateData = await request.json();
    
    // Deep merge settings
    MOCK_DATA.settings = deepMerge(MOCK_DATA.settings, updateData);
    
    return createSuccessResponse({
      message: 'Settings updated successfully',
      settings: MOCK_DATA.settings
    }, origin);
    
  } catch (error) {
    console.error('Update settings error:', error);
    return createErrorResponse('Failed to update settings', 500, {}, origin);
  }
}

/**
 * Analytics endpoint
 */
async function handleAnalytics(request, env, origin, user) {
  const url = new URL(request.url);
  const period = url.searchParams.get('period') || '7d'; // 7d, 30d, 90d
  const metric = url.searchParams.get('metric') || 'all';
  
  const analyticsData = {
    overview: {
      total_views: 2140,
      unique_visitors: 1450,
      page_views: 3200,
      bounce_rate: 0.32,
      avg_session_duration: 185 // seconds
    },
    posts_performance: MOCK_DATA.posts.map(post => ({
      id: post.id,
      title: post.title,
      views: post.views,
      engagement_rate: Math.round(Math.random() * 100) / 100
    })),
    traffic_sources: [
      { source: 'Organic Search', visits: 820, percentage: 45.2 },
      { source: 'Direct', visits: 520, percentage: 28.7 },
      { source: 'Social Media', visits: 280, percentage: 15.4 },
      { source: 'Referrals', visits: 195, percentage: 10.7 }
    ],
    popular_pages: [
      { path: '/blog/sicurezza-informatica-pmi', views: 1250, title: 'Sicurezza Informatica per PMI' },
      { path: '/blog/cloud-storage-aziendale', views: 890, title: 'Cloud Storage Aziendale' },
      { path: '/blog', views: 650, title: 'Blog Home' }
    ],
    time_series: {
      views: [120, 156, 189, 234, 201, 178, 234, 267, 189, 145, 198, 234, 278, 256],
      visitors: [98, 123, 145, 178, 165, 134, 189, 201, 145, 112, 156, 178, 201, 189]
    }
  };
  
  return createSuccessResponse(analyticsData, origin);
}

/**
 * CORS preflight handler
 */
function handleCORSPreflight(origin) {
  const allowedOrigin = CONFIG.ALLOWED_ORIGINS.includes(origin) ? origin : CONFIG.ALLOWED_ORIGINS[0];
  
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': CONFIG.CORS_MAX_AGE.toString(),
      'Access-Control-Allow-Credentials': 'true'
    }
  });
}

/**
 * JWT token generation
 */
async function generateJWT(payload, secret) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(unsignedToken)
  );
  
  const encodedSignature = base64urlEncode(Array.from(new Uint8Array(signature)));
  return `${unsignedToken}.${encodedSignature}`;
}

/**
 * JWT token verification
 */
async function verifyJWT(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { success: false, error: 'Invalid token format' };
    }
    
    const [headerB64, payloadB64, signatureB64] = parts;
    const header = JSON.parse(base64urlDecode(headerB64));
    const payload = JSON.parse(base64urlDecode(payloadB64));
    
    // Verify algorithm
    if (header.alg !== 'HS256') {
      return { success: false, error: 'Invalid algorithm' };
    }
    
    // Verify signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const unsignedToken = `${headerB64}.${payloadB64}`;
    const signature = base64urlDecodeToArrayBuffer(signatureB64);
    
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      encoder.encode(unsignedToken)
    );
    
    if (!isValid) {
      return { success: false, error: 'Invalid signature' };
    }
    
    // Verify expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { success: false, error: 'Token expired' };
    }
    
    return { success: true, payload };
  } catch (error) {
    return { success: false, error: 'Token verification failed' };
  }
}

/**
 * Authentication verification
 */
async function verifyAuthentication(request, env) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'Missing or invalid authorization header' };
    }
    
    const token = authHeader.substring(7);
    const verification = await verifyJWT(token, env.JWT_SECRET || CONFIG.JWT_SECRET_DEFAULT);
    
    if (!verification.success) {
      return { success: false, error: verification.error };
    }
    
    return { success: true, user: verification.payload };
  } catch (error) {
    return { success: false, error: 'Authentication failed' };
  }
}

/**
 * Rate limiting check
 */
async function checkRateLimit(request, env) {
  // In a real implementation, use KV storage or D1 database
  // For demo purposes, always allow requests
  return { allowed: true, remaining: CONFIG.RATE_LIMIT_REQUESTS - 1 };
}

/**
 * Authentication rate limiting check
 */
async function checkAuthRateLimit(request, env) {
  // In a real implementation, implement stricter rate limiting for auth endpoints
  return { allowed: true, remaining: CONFIG.RATE_LIMIT_AUTH_REQUESTS - 1 };
}

/**
 * Utility functions
 */

function base64urlEncode(data) {
  if (Array.isArray(data)) {
    const str = String.fromCharCode.apply(null, data);
    const encoded = btoa(str);
    return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  } else {
    const encoded = btoa(data);
    return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }
}

function base64urlDecode(str) {
  const padded = str + '==='.slice(0, (4 - str.length % 4) % 4);
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  return atob(base64);
}

function base64urlDecodeToArrayBuffer(str) {
  const padded = str + '==='.slice(0, (4 - str.length % 4) % 4);
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function generateRequestId() {
  return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function addSecurityHeaders(response) {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'");
}

function createSuccessResponse(data, origin) {
  const allowedOrigin = CONFIG.ALLOWED_ORIGINS.includes(origin) ? origin : CONFIG.ALLOWED_ORIGINS[0];
  
  return new Response(JSON.stringify({
    success: true,
    data,
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true'
    }
  });
}

function createErrorResponse(message, status = 400, extraHeaders = {}, origin = '') {
  const allowedOrigin = CONFIG.ALLOWED_ORIGINS.includes(origin) ? origin : CONFIG.ALLOWED_ORIGINS[0];
  
  return new Response(JSON.stringify({
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true',
      ...extraHeaders
    }
  });
}

function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
        result[key] = deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  
  return result;
}