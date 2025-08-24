/**
 * IT-ERA Admin API - Simplified Worker per Login
 */

// Utenti hardcoded per test
const USERS = {
  'admin@it-era.it': {
    id: 1,
    username: 'admin',
    email: 'admin@it-era.it',
    password_hash: 'admin123!', // In produzione usare bcrypt
    full_name: 'IT-ERA Administrator',
    role: 'admin',
    is_active: true
  },
  'editor@it-era.it': {
    id: 2,
    username: 'editor', 
    email: 'editor@it-era.it',
    password_hash: 'editor123!',
    full_name: 'IT-ERA Editor',
    role: 'editor',
    is_active: true
  }
};

// JWT Secret (in produzione usare env var)
const JWT_SECRET = 'it-era-blog-super-secret-key-2024';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

// Simple JWT implementation
function createJWT(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signature = btoa(JWT_SECRET + encodedHeader + encodedPayload); // Simplified
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    
    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }
    
    return payload;
  } catch (error) {
    return null;
  }
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }
  
  try {
    // Health check
    if (path === '/health' && request.method === 'GET') {
      return new Response(JSON.stringify({
        status: 'OK',
        service: 'IT-ERA Admin API',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // Login endpoint
    if (path === '/api/auth/login' && request.method === 'POST') {
      return await handleLogin(request);
    }
    
    // Verify token endpoint
    if (path === '/api/auth/verify' && request.method === 'GET') {
      return await handleVerify(request);
    }
    
    // Dashboard endpoint
    if (path === '/admin/api/dashboard' && request.method === 'GET') {
      return await handleDashboard(request);
    }
    
    // Stats endpoint
    if (path === '/admin/api/stats/overview' && request.method === 'GET') {
      return await handleStats(request);
    }
    
    // Create post endpoint (from existing API)
    if (path === '/api/posts' && request.method === 'POST') {
      return await handleCreatePost(request);
    }
    
    // List posts endpoint
    if (path === '/api/posts' && request.method === 'GET') {
      return await handleListPosts(request);
    }
    
    return new Response('Not Found', {
      status: 404,
      headers: corsHeaders
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

async function handleLogin(request) {
  let data;
  try {
    const bodyText = await request.text();
    console.log('Raw body:', bodyText);
    data = JSON.parse(bodyText);
    console.log('Parsed data:', data);
    const { email, password } = data;
    
    if (!email || !password) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Email and password required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    const user = USERS[email];
    if (!user || !user.is_active) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid email or password'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // Simple password check (in produzione usare bcrypt)
    if (user.password_hash !== password) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid email or password'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // Create JWT token
    const tokenPayload = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      iat: Math.floor(Date.now() / 1000)
    };
    
    const token = createJWT(tokenPayload);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role
        }
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid request data'
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

async function handleVerify(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({
      success: false,
      error: 'No token provided'
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
  
  const token = authHeader.substring(7);
  const payload = verifyJWT(token);
  
  if (!payload) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid or expired token'
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
  
  return new Response(JSON.stringify({
    success: true,
    data: {
      user: payload
    }
  }), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

async function handleDashboard(request) {
  // Verify token
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Unauthorized'
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
  
  return new Response(JSON.stringify({
    success: true,
    data: {
      posts: {
        total: 12,
        published: 8,
        draft: 3,
        scheduled: 1
      },
      views: {
        today: 234,
        week: 1567,
        month: 6789
      },
      users: {
        total: 3,
        admins: 1,
        editors: 1,
        authors: 1
      },
      categories: 6,
      tags: 24,
      recent_posts: [
        {
          id: 1,
          title: 'Come Proteggere la Tua Azienda dal Ransomware',
          status: 'published',
          views: 156,
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 2,
          title: 'VPN Aziendale: Guida Completa',
          status: 'published', 
          views: 89,
          created_at: new Date(Date.now() - 172800000).toISOString()
        }
      ]
    }
  }), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

async function handleStats(request) {
  return new Response(JSON.stringify({
    success: true,
    data: {
      page_views: [120, 156, 189, 234, 201, 178, 234],
      post_views: [45, 67, 89, 123, 98, 76, 156],
      new_users: [2, 1, 3, 0, 1, 2, 1],
      bounce_rate: 0.32
    }
  }), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

// Include existing post creation functionality
async function handleCreatePost(request) {
  try {
    const data = await request.json();
    const { title, slug, content, seo_title, meta_description, focus_keyword } = data;
    
    if (!title || !slug || !content) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields',
        required: ['title', 'slug', 'content']
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // Simulate post creation
    const response = {
      success: true,
      message: 'Articolo creato con successo',
      article: {
        id: Math.floor(Math.random() * 1000) + 1,
        title,
        seo_title: seo_title || title,
        slug,
        url: `https://it-era.pages.dev/blog/${slug}.html`,
        published_date: new Date().toISOString().split('T')[0],
        category: data.category || 'General',
        tags: Array.isArray(data.tags) ? data.tags : [],
        author: data.author || 'IT-ERA Team',
        focus_keyword: focus_keyword,
        meta_description: meta_description || data.excerpt || title,
        status: 'published'
      },
      seo: {
        title_length: (seo_title || title).length,
        description_length: (meta_description || data.excerpt || '').length,
        focus_keyword: focus_keyword || 'non specificata',
        warnings: []
      }
    };
    
    return new Response(JSON.stringify(response), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid request data'
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

async function handleListPosts() {
  const posts = [
    {
      id: 1,
      title: "Come Proteggere la Tua Azienda dal Ransomware nel 2024",
      slug: "ransomware-protezione-completa-2024",
      status: "published",
      published_date: "2024-08-24"
    },
    {
      id: 2,
      title: "VPN Aziendale: Guida Completa per PMI",
      slug: "vpn-aziendale-guida-completa-pmi-2024", 
      status: "published",
      published_date: "2024-08-24"
    }
  ];
  
  return new Response(JSON.stringify({
    success: true,
    total: posts.length,
    posts
  }), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}