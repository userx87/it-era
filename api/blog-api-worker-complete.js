/**
 * IT-ERA Blog API Worker - Complete Admin Panel Backend
 * Full-featured API with authentication, admin dashboard, and blog management
 */

// Mock database - in production this would be a real database
const MOCK_DATABASE = {
  users: [
    {
      id: 1,
      username: 'admin',
      email: 'admin@it-era.it',
      password: 'admin123', // In production this would be hashed
      full_name: 'IT-ERA Administrator',
      role: 'admin',
      created_at: '2024-08-24T00:00:00Z',
      updated_at: '2024-08-24T00:00:00Z'
    },
    {
      id: 2,
      username: 'editor',
      email: 'editor@it-era.it',
      password: 'editor123',
      full_name: 'IT-ERA Editor',
      role: 'editor',
      created_at: '2024-08-24T00:00:00Z',
      updated_at: '2024-08-24T00:00:00Z'
    }
  ],
  posts: [
    {
      id: 1,
      title: 'Come Proteggere la Tua Azienda dal Ransomware nel 2024',
      slug: 'ransomware-protezione-completa-2024',
      content: '<p>Il ransomware rappresenta una delle minacce più serie...</p>',
      excerpt: 'Guida completa alla protezione dal ransomware per aziende.',
      status: 'published',
      category_id: 1,
      author_id: 1,
      seo_title: 'Protezione Ransomware 2024: Guida Completa per Aziende',
      meta_description: 'Scopri come proteggere la tua azienda dal ransomware con strategie efficaci e strumenti professionali.',
      focus_keyword: 'protezione ransomware',
      featured_image: '/images/blog/ransomware-protection.jpg',
      published_at: '2024-08-24T10:00:00Z',
      created_at: '2024-08-24T08:00:00Z',
      updated_at: '2024-08-24T09:00:00Z'
    }
  ],
  categories: [
    {
      id: 1,
      name: 'Sicurezza Informatica',
      slug: 'sicurezza-informatica',
      description: 'Articoli sulla sicurezza informatica aziendale',
      is_active: true,
      post_count: 12
    },
    {
      id: 2,
      name: 'Assistenza IT',
      slug: 'assistenza-it',
      description: 'Guide e consigli per l\'assistenza IT',
      is_active: true,
      post_count: 8
    }
  ],
  tags: [
    { id: 1, name: 'ransomware', slug: 'ransomware', post_count: 3 },
    { id: 2, name: 'sicurezza', slug: 'sicurezza', post_count: 15 },
    { id: 3, name: 'firewall', slug: 'firewall', post_count: 6 }
  ]
};

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }
  
  try {
    // Health check
    if (url.pathname === '/health' && request.method === 'GET') {
      return apiResponse({ 
        status: 'OK', 
        service: 'IT-ERA Blog API', 
        timestamp: new Date().toISOString(),
        version: '2.0.0'
      }, 200, corsHeaders);
    }
    
    // Authentication routes
    if (url.pathname === '/api/auth/login' && request.method === 'POST') {
      return handleLogin(request, corsHeaders);
    }
    
    if (url.pathname === '/api/auth/verify' && request.method === 'GET') {
      return handleVerifyToken(request, corsHeaders);
    }
    
    if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
      return handleLogout(request, corsHeaders);
    }
    
    // Admin dashboard routes
    if (url.pathname === '/admin/api/dashboard' && request.method === 'GET') {
      return handleAdminDashboard(request, corsHeaders);
    }
    
    if (url.pathname === '/admin/api/stats/overview' && request.method === 'GET') {
      return handleOverviewStats(request, corsHeaders);
    }
    
    if (url.pathname === '/admin/api/posts/scheduled' && request.method === 'GET') {
      return handleScheduledPosts(request, corsHeaders);
    }
    
    // Posts API
    if (url.pathname === '/api/posts' && request.method === 'GET') {
      return handleGetPosts(request, corsHeaders);
    }
    
    if (url.pathname === '/api/posts' && request.method === 'POST') {
      return handleCreatePost(request, corsHeaders);
    }
    
    // Categories API
    if (url.pathname === '/api/categories' && request.method === 'GET') {
      return handleGetCategories(request, corsHeaders);
    }
    
    // Tags API
    if (url.pathname === '/api/tags' && request.method === 'GET') {
      return handleGetTags(request, corsHeaders);
    }
    
    // Users API
    if (url.pathname === '/admin/api/users' && request.method === 'GET') {
      return handleGetUsers(request, corsHeaders);
    }
    
    // Analytics API
    if (url.pathname === '/api/analytics/dashboard' && request.method === 'GET') {
      return handleAnalyticsDashboard(request, corsHeaders);
    }
    
    // Media API
    if (url.pathname === '/api/media' && request.method === 'GET') {
      return handleGetMedia(request, corsHeaders);
    }
    
    // Webhooks API
    if (url.pathname === '/api/webhooks/logs' && request.method === 'GET') {
      return handleWebhookLogs(request, corsHeaders);
    }
    
    // Content calendar
    if (url.pathname === '/admin/api/content-calendar' && request.method === 'GET') {
      return handleContentCalendar(request, corsHeaders);
    }
    
    // Settings API
    if (url.pathname === '/admin/api/settings' && request.method === 'GET') {
      return handleGetSettings(request, corsHeaders);
    }
    
    // 404 for unknown routes
    return new Response('Not Found', { 
      status: 404,
      headers: corsHeaders 
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return apiResponse({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    }, 500, corsHeaders);
  }
}

// Helper function for API responses
function apiResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
}

// Authentication handlers
async function handleLogin(request, corsHeaders) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return apiResponse({
        success: false,
        error: 'Email and password are required'
      }, 400, corsHeaders);
    }
    
    // Find user by email
    const user = MOCK_DATABASE.users.find(u => u.email === email);
    
    if (!user || user.password !== password) {
      return apiResponse({
        success: false,
        error: 'Invalid email or password'
      }, 401, corsHeaders);
    }
    
    // Generate session token (in production use JWT or similar)
    const token = generateSessionToken();
    
    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;
    
    return apiResponse({
      success: true,
      data: {
        user: userWithoutPassword,
        token: token
      }
    }, 200, corsHeaders);
    
  } catch (error) {
    return apiResponse({
      success: false,
      error: 'Invalid JSON or server error'
    }, 400, corsHeaders);
  }
}

async function handleVerifyToken(request, corsHeaders) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return apiResponse({
      success: false,
      error: 'No token provided'
    }, 401, corsHeaders);
  }
  
  const token = authHeader.substring(7);
  
  // For demo purposes, accept any token that starts with 'session_'
  if (!token.startsWith('session_')) {
    return apiResponse({
      success: false,
      error: 'Invalid token'
    }, 401, corsHeaders);
  }
  
  // Return admin user for demo
  const user = MOCK_DATABASE.users[0];
  const { password: _, ...userWithoutPassword } = user;
  
  return apiResponse({
    success: true,
    data: {
      user: userWithoutPassword
    }
  }, 200, corsHeaders);
}

async function handleLogout(request, corsHeaders) {
  // For demo purposes, just return success
  // In production, you would invalidate the JWT or remove from database
  return apiResponse({
    success: true,
    message: 'Logged out successfully'
  }, 200, corsHeaders);
}

// Admin dashboard handlers
async function handleAdminDashboard(request, corsHeaders) {
  if (!await isAuthenticated(request)) {
    return apiResponse({
      success: false,
      error: 'Authentication required'
    }, 401, corsHeaders);
  }
  
  const stats = {
    posts: {
      total: MOCK_DATABASE.posts.length,
      published: MOCK_DATABASE.posts.filter(p => p.status === 'published').length,
      draft: MOCK_DATABASE.posts.filter(p => p.status === 'draft').length,
      scheduled: MOCK_DATABASE.posts.filter(p => p.status === 'scheduled').length
    },
    categories: {
      total: MOCK_DATABASE.categories.length,
      active: MOCK_DATABASE.categories.filter(c => c.is_active).length
    },
    tags: {
      total: MOCK_DATABASE.tags.length
    },
    users: {
      total: MOCK_DATABASE.users.length,
      admins: MOCK_DATABASE.users.filter(u => u.role === 'admin').length,
      editors: MOCK_DATABASE.users.filter(u => u.role === 'editor').length
    },
    recent_posts: MOCK_DATABASE.posts.slice(0, 5).map(post => ({
      id: post.id,
      title: post.title,
      status: post.status,
      created_at: post.created_at
    })),
    analytics: {
      page_views: 15420,
      unique_visitors: 8750,
      bounce_rate: 0.42,
      avg_time_on_site: 180
    }
  };
  
  return apiResponse({
    success: true,
    data: stats
  }, 200, corsHeaders);
}

async function handleOverviewStats(request, corsHeaders) {
  if (!await isAuthenticated(request)) {
    return apiResponse({
      success: false,
      error: 'Authentication required'
    }, 401, corsHeaders);
  }
  
  const stats = {
    posts_published: 25,
    page_views: 15420,
    unique_visitors: 8750,
    bounce_rate: 42,
    top_pages: [
      { path: '/pages/assistenza-it-milano.html', views: 2340 },
      { path: '/pages/sicurezza-informatica-milano.html', views: 1890 },
      { path: '/pages/cloud-storage-milano.html', views: 1520 }
    ],
    recent_activity: [
      { action: 'Post Published', item: 'Protezione Ransomware 2024', time: '2 hours ago' },
      { action: 'User Login', item: 'admin@it-era.it', time: '4 hours ago' },
      { action: 'Category Created', item: 'Cloud Computing', time: '1 day ago' }
    ]
  };
  
  return apiResponse({
    success: true,
    data: stats
  }, 200, corsHeaders);
}

async function handleScheduledPosts(request, corsHeaders) {
  if (!await isAuthenticated(request)) {
    return apiResponse({
      success: false,
      error: 'Authentication required'
    }, 401, corsHeaders);
  }
  
  const scheduledPosts = MOCK_DATABASE.posts.filter(p => p.status === 'scheduled');
  
  return apiResponse({
    success: true,
    data: {
      scheduled_posts: scheduledPosts,
      total: scheduledPosts.length
    }
  }, 200, corsHeaders);
}

// Posts handlers
async function handleGetPosts(request, corsHeaders) {
  if (!await isAuthenticated(request)) {
    return apiResponse({
      success: false,
      error: 'Authentication required'
    }, 401, corsHeaders);
  }
  
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const offset = parseInt(url.searchParams.get('offset') || '0');
  
  const posts = MOCK_DATABASE.posts.slice(offset, offset + limit);
  
  return apiResponse({
    success: true,
    data: {
      posts,
      pagination: {
        limit,
        offset,
        total: MOCK_DATABASE.posts.length,
        has_more: offset + limit < MOCK_DATABASE.posts.length
      }
    }
  }, 200, corsHeaders);
}

async function handleCreatePost(request, corsHeaders) {
  if (!await isAuthenticated(request)) {
    return apiResponse({
      success: false,
      error: 'Authentication required'
    }, 401, corsHeaders);
  }
  
  try {
    const postData = await request.json();
    
    // Validate required fields
    if (!postData.title || !postData.content) {
      return apiResponse({
        success: false,
        error: 'Title and content are required'
      }, 400, corsHeaders);
    }
    
    const newPost = {
      id: MOCK_DATABASE.posts.length + 1,
      title: postData.title,
      slug: postData.slug || generateSlug(postData.title),
      content: postData.content,
      excerpt: postData.excerpt || '',
      status: postData.status || 'draft',
      category_id: postData.category_id || null,
      author_id: 1, // Current user ID
      seo_title: postData.seo_title || postData.title,
      meta_description: postData.meta_description || '',
      focus_keyword: postData.focus_keyword || '',
      featured_image: postData.featured_image || '',
      published_at: postData.status === 'published' ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    MOCK_DATABASE.posts.push(newPost);
    
    return apiResponse({
      success: true,
      data: {
        post: newPost
      }
    }, 201, corsHeaders);
    
  } catch (error) {
    return apiResponse({
      success: false,
      error: 'Invalid JSON'
    }, 400, corsHeaders);
  }
}

// Categories handlers
async function handleGetCategories(request, corsHeaders) {
  if (!await isAuthenticated(request)) {
    return apiResponse({
      success: false,
      error: 'Authentication required'
    }, 401, corsHeaders);
  }
  
  return apiResponse({
    success: true,
    data: {
      categories: MOCK_DATABASE.categories,
      total: MOCK_DATABASE.categories.length
    }
  }, 200, corsHeaders);
}

// Tags handlers
async function handleGetTags(request, corsHeaders) {
  if (!await isAuthenticated(request)) {
    return apiResponse({
      success: false,
      error: 'Authentication required'
    }, 401, corsHeaders);
  }
  
  return apiResponse({
    success: true,
    data: {
      tags: MOCK_DATABASE.tags,
      total: MOCK_DATABASE.tags.length
    }
  }, 200, corsHeaders);
}

// Users handlers
async function handleGetUsers(request, corsHeaders) {
  if (!await isAuthenticated(request) || !await isAdmin(request)) {
    return apiResponse({
      success: false,
      error: 'Admin access required'
    }, 403, corsHeaders);
  }
  
  const users = MOCK_DATABASE.users.map(({ password, ...user }) => user);
  
  return apiResponse({
    success: true,
    data: {
      users,
      total: users.length
    }
  }, 200, corsHeaders);
}

// Analytics handlers
async function handleAnalyticsDashboard(request, corsHeaders) {
  if (!await isAuthenticated(request)) {
    return apiResponse({
      success: false,
      error: 'Authentication required'
    }, 401, corsHeaders);
  }
  
  const analyticsData = {
    overview: {
      page_views: 15420,
      unique_visitors: 8750,
      bounce_rate: 0.42,
      avg_session_duration: 180
    },
    traffic_sources: [
      { source: 'Google', visitors: 4250, percentage: 48.5 },
      { source: 'Direct', visitors: 2890, percentage: 33.0 },
      { source: 'Social Media', visitors: 980, percentage: 11.2 },
      { source: 'Other', visitors: 630, percentage: 7.3 }
    ],
    top_pages: [
      { path: '/pages/assistenza-it-milano.html', views: 2340, percentage: 15.2 },
      { path: '/pages/sicurezza-informatica-milano.html', views: 1890, percentage: 12.3 },
      { path: '/pages/cloud-storage-milano.html', views: 1520, percentage: 9.9 }
    ],
    monthly_trends: Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2024, i).toLocaleString('it-IT', { month: 'short' }),
      page_views: Math.floor(Math.random() * 5000) + 10000,
      unique_visitors: Math.floor(Math.random() * 3000) + 6000
    }))
  };
  
  return apiResponse({
    success: true,
    data: analyticsData
  }, 200, corsHeaders);
}

// Media handlers
async function handleGetMedia(request, corsHeaders) {
  if (!await isAuthenticated(request)) {
    return apiResponse({
      success: false,
      error: 'Authentication required'
    }, 401, corsHeaders);
  }
  
  const mediaFiles = [
    {
      id: 1,
      filename: 'ransomware-protection.jpg',
      original_name: 'Protezione Ransomware.jpg',
      mime_type: 'image/jpeg',
      size: 245760,
      url: '/images/blog/ransomware-protection.jpg',
      alt_text: 'Protezione dal ransomware',
      created_at: '2024-08-24T08:00:00Z'
    },
    {
      id: 2,
      filename: 'firewall-setup.jpg',
      original_name: 'Configurazione Firewall.jpg',
      mime_type: 'image/jpeg',
      size: 198340,
      url: '/images/blog/firewall-setup.jpg',
      alt_text: 'Configurazione firewall aziendale',
      created_at: '2024-08-24T09:00:00Z'
    }
  ];
  
  return apiResponse({
    success: true,
    data: {
      media: mediaFiles,
      total: mediaFiles.length
    }
  }, 200, corsHeaders);
}

// Webhook handlers
async function handleWebhookLogs(request, corsHeaders) {
  if (!await isAuthenticated(request)) {
    return apiResponse({
      success: false,
      error: 'Authentication required'
    }, 401, corsHeaders);
  }
  
  const webhookLogs = [
    {
      id: 1,
      event_type: 'post.published',
      status: 'success',
      response_code: 200,
      url: 'https://example.com/webhook',
      payload: '{"post_id": 1, "title": "Test Post"}',
      created_at: '2024-08-24T10:30:00Z'
    },
    {
      id: 2,
      event_type: 'post.created',
      status: 'failed',
      response_code: 500,
      url: 'https://example.com/webhook',
      error: 'Internal Server Error',
      created_at: '2024-08-24T09:15:00Z'
    }
  ];
  
  return apiResponse({
    success: true,
    data: {
      logs: webhookLogs,
      total: webhookLogs.length
    }
  }, 200, corsHeaders);
}

// Content calendar handlers
async function handleContentCalendar(request, corsHeaders) {
  if (!await isAuthenticated(request)) {
    return apiResponse({
      success: false,
      error: 'Authentication required'
    }, 401, corsHeaders);
  }
  
  const url = new URL(request.url);
  const year = parseInt(url.searchParams.get('year') || new Date().getFullYear());
  const month = parseInt(url.searchParams.get('month') || (new Date().getMonth() + 1));
  
  const calendarEvents = [
    {
      date: '2024-08-25',
      posts: [
        { id: 1, title: 'Backup Strategies for SMBs', status: 'scheduled' }
      ]
    },
    {
      date: '2024-08-27',
      posts: [
        { id: 2, title: 'Cloud Migration Guide', status: 'draft' }
      ]
    }
  ];
  
  return apiResponse({
    success: true,
    data: {
      year,
      month,
      events: calendarEvents
    }
  }, 200, corsHeaders);
}

// Settings handlers
async function handleGetSettings(request, corsHeaders) {
  if (!await isAuthenticated(request) || !await isAdmin(request)) {
    return apiResponse({
      success: false,
      error: 'Admin access required'
    }, 403, corsHeaders);
  }
  
  const settings = {
    site_title: 'IT-ERA Blog',
    site_description: 'Il blog di IT-ERA per news e guide su tecnologia e sicurezza informatica',
    contact_email: 'info@it-era.it',
    contact_phone: '039 888 2041',
    company_address: 'Viale Risorgimento 32, Vimercate MB',
    seo_settings: {
      default_meta_description: 'IT-ERA - Soluzioni IT professionali per aziende',
      google_analytics_id: 'GA-XXXXXXXXX',
      google_tag_manager_id: 'GTM-XXXXXXX'
    },
    email_settings: {
      smtp_host: 'smtp.resend.com',
      smtp_port: 587,
      from_email: 'noreply@it-era.it',
      from_name: 'IT-ERA Blog'
    }
  };
  
  return apiResponse({
    success: true,
    data: settings
  }, 200, corsHeaders);
}

// Authentication helpers
async function isAuthenticated(request) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.substring(7);
  
  // For demo purposes, we'll accept any token that starts with 'session_'
  // In production, you would validate JWT tokens or check a real database
  return token.startsWith('session_');
}

async function isAdmin(request) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.substring(7);
  
  // For demo purposes, all authenticated users are admins
  // In production, you would decode the JWT or check user roles
  return token.startsWith('session_');
}

async function getCurrentUser(request) {
  // For demo purposes, return the admin user
  // In production, you would decode the JWT or query the database
  return MOCK_DATABASE.users[0]; // Return admin user
}

// Utility functions
function generateSessionToken() {
  return 'session_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
}