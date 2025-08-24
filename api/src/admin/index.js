/**
 * IT-ERA Admin Panel Backend API
 * Complete admin functionality with JWT authentication
 */

import { JWTAuth } from './auth/jwt-auth.js';
import { AdminDashboard } from './controllers/admin-dashboard.js';
import { PostsController } from './controllers/posts-controller.js';
import { CategoriesController } from './controllers/categories-controller.js';
import { TagsController } from './controllers/tags-controller.js';
import { MediaController } from './controllers/media-controller.js';
import { AnalyticsController } from './controllers/analytics-controller.js';
import { UsersController } from './controllers/users-controller.js';
import { SettingsController } from './controllers/settings-controller.js';
import { CalendarController } from './controllers/calendar-controller.js';
import { WebhooksController } from './controllers/webhooks-controller.js';
import { corsHeaders, handleOptions } from './utils/cors.js';
import { errorHandler } from './utils/error-handler.js';
import { validateRequest } from './utils/validation.js';

export default {
  async fetch(request, env, ctx) {
    try {
      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return handleOptions(request);
      }

      const url = new URL(request.url);
      const path = url.pathname;

      // Initialize controllers with environment
      const jwtAuth = new JWTAuth(env);
      const adminDashboard = new AdminDashboard(env);
      const postsController = new PostsController(env);
      const categoriesController = new CategoriesController(env);
      const tagsController = new TagsController(env);
      const mediaController = new MediaController(env);
      const analyticsController = new AnalyticsController(env);
      const usersController = new UsersController(env);
      const settingsController = new SettingsController(env);
      const calendarController = new CalendarController(env);
      const webhooksController = new WebhooksController(env);

      // Public endpoints (no auth required)
      if (path === '/admin/api/login' && request.method === 'POST') {
        return await jwtAuth.login(request);
      }

      if (path === '/admin/api/register' && request.method === 'POST') {
        return await jwtAuth.register(request);
      }

      if (path === '/admin/api/health') {
        return new Response(JSON.stringify({
          status: 'healthy',
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

      // Protected routes - require authentication
      const authResult = await jwtAuth.authenticate(request);
      if (!authResult.success) {
        return new Response(JSON.stringify({ 
          error: 'Authentication required',
          message: authResult.error 
        }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      const user = authResult.user;

      // Admin Dashboard Routes
      if (path === '/admin/api/dashboard' && request.method === 'GET') {
        return await adminDashboard.getDashboardData(request, user);
      }

      if (path === '/admin/api/dashboard/stats' && request.method === 'GET') {
        return await adminDashboard.getStats(request, user);
      }

      // Posts CRUD Routes
      if (path.startsWith('/admin/api/posts')) {
        return await this.handlePostsRoutes(path, request, postsController, user);
      }

      // Categories Routes
      if (path.startsWith('/admin/api/categories')) {
        return await this.handleCategoriesRoutes(path, request, categoriesController, user);
      }

      // Tags Routes
      if (path.startsWith('/admin/api/tags')) {
        return await this.handleTagsRoutes(path, request, tagsController, user);
      }

      // Media Routes
      if (path.startsWith('/admin/api/media')) {
        return await this.handleMediaRoutes(path, request, mediaController, user);
      }

      // Analytics Routes
      if (path.startsWith('/admin/api/analytics')) {
        return await this.handleAnalyticsRoutes(path, request, analyticsController, user);
      }

      // Users Management Routes (Admin only)
      if (path.startsWith('/admin/api/users')) {
        if (user.role !== 'admin') {
          return new Response(JSON.stringify({
            error: 'Insufficient permissions',
            message: 'Admin role required'
          }), {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }
        return await this.handleUsersRoutes(path, request, usersController, user);
      }

      // Settings Routes (Admin only)
      if (path.startsWith('/admin/api/settings')) {
        if (user.role !== 'admin') {
          return new Response(JSON.stringify({
            error: 'Insufficient permissions'
          }), {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }
        return await this.handleSettingsRoutes(path, request, settingsController, user);
      }

      // Calendar Routes
      if (path.startsWith('/admin/api/calendar')) {
        return await this.handleCalendarRoutes(path, request, calendarController, user);
      }

      // Webhooks Routes (Admin only)
      if (path.startsWith('/admin/api/webhooks')) {
        if (user.role !== 'admin') {
          return new Response(JSON.stringify({
            error: 'Insufficient permissions'
          }), {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }
        return await this.handleWebhooksRoutes(path, request, webhooksController, user);
      }

      // User profile routes
      if (path === '/admin/api/profile' && request.method === 'GET') {
        return new Response(JSON.stringify({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
            created_at: user.created_at,
            last_login: user.last_login
          }
        }), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      if (path === '/admin/api/profile' && request.method === 'PUT') {
        return await usersController.updateProfile(request, user);
      }

      // API documentation
      if (path === '/admin/api' || path === '/admin/api/') {
        return new Response(JSON.stringify({
          name: 'IT-ERA Admin API',
          version: '1.0.0',
          description: 'Complete admin panel backend with authentication',
          endpoints: {
            auth: {
              'POST /admin/api/login': 'User login',
              'POST /admin/api/register': 'User registration',
              'GET /admin/api/profile': 'Get user profile',
              'PUT /admin/api/profile': 'Update user profile'
            },
            dashboard: {
              'GET /admin/api/dashboard': 'Dashboard overview',
              'GET /admin/api/dashboard/stats': 'Dashboard statistics'
            },
            posts: {
              'GET /admin/api/posts': 'List all posts',
              'GET /admin/api/posts/:id': 'Get single post',
              'POST /admin/api/posts': 'Create new post',
              'PUT /admin/api/posts/:id': 'Update post',
              'DELETE /admin/api/posts/:id': 'Delete post',
              'POST /admin/api/posts/:id/publish': 'Publish post',
              'POST /admin/api/posts/:id/draft': 'Set post to draft'
            },
            categories: {
              'GET /admin/api/categories': 'List categories',
              'POST /admin/api/categories': 'Create category',
              'PUT /admin/api/categories/:id': 'Update category',
              'DELETE /admin/api/categories/:id': 'Delete category'
            },
            tags: {
              'GET /admin/api/tags': 'List tags',
              'POST /admin/api/tags': 'Create tag',
              'PUT /admin/api/tags/:id': 'Update tag',
              'DELETE /admin/api/tags/:id': 'Delete tag'
            },
            media: {
              'GET /admin/api/media': 'List media files',
              'POST /admin/api/media': 'Upload media file',
              'DELETE /admin/api/media/:id': 'Delete media file'
            },
            analytics: {
              'GET /admin/api/analytics/overview': 'Analytics overview',
              'GET /admin/api/analytics/posts': 'Post analytics',
              'GET /admin/api/analytics/traffic': 'Traffic analytics'
            },
            users: {
              'GET /admin/api/users': 'List users (admin)',
              'POST /admin/api/users': 'Create user (admin)',
              'PUT /admin/api/users/:id': 'Update user (admin)',
              'DELETE /admin/api/users/:id': 'Delete user (admin)'
            },
            settings: {
              'GET /admin/api/settings': 'Get settings (admin)',
              'PUT /admin/api/settings': 'Update settings (admin)'
            },
            calendar: {
              'GET /admin/api/calendar': 'Get content calendar',
              'POST /admin/api/calendar/events': 'Create calendar event',
              'PUT /admin/api/calendar/events/:id': 'Update calendar event'
            },
            webhooks: {
              'GET /admin/api/webhooks': 'List webhooks (admin)',
              'POST /admin/api/webhooks': 'Create webhook (admin)',
              'DELETE /admin/api/webhooks/:id': 'Delete webhook (admin)'
            }
          }
        }), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // 404 for unknown endpoints
      return new Response(JSON.stringify({
        error: 'Endpoint not found',
        path: path
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      return errorHandler(error);
    }
  },

  // Route handlers for different controllers
  async handlePostsRoutes(path, request, controller, user) {
    const segments = path.split('/');
    const method = request.method;

    if (path === '/admin/api/posts' && method === 'GET') {
      return await controller.list(request, user);
    }
    
    if (path === '/admin/api/posts' && method === 'POST') {
      return await controller.create(request, user);
    }
    
    if (segments.length === 5 && method === 'GET') {
      const id = segments[4];
      return await controller.get(id, user);
    }
    
    if (segments.length === 5 && method === 'PUT') {
      const id = segments[4];
      return await controller.update(id, request, user);
    }
    
    if (segments.length === 5 && method === 'DELETE') {
      const id = segments[4];
      return await controller.delete(id, user);
    }
    
    if (segments.length === 6 && segments[5] === 'publish' && method === 'POST') {
      const id = segments[4];
      return await controller.publish(id, user);
    }
    
    if (segments.length === 6 && segments[5] === 'draft' && method === 'POST') {
      const id = segments[4];
      return await controller.setDraft(id, user);
    }

    return new Response(JSON.stringify({ error: 'Invalid posts route' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  },

  async handleCategoriesRoutes(path, request, controller, user) {
    const segments = path.split('/');
    const method = request.method;

    if (path === '/admin/api/categories' && method === 'GET') {
      return await controller.list(request, user);
    }
    
    if (path === '/admin/api/categories' && method === 'POST') {
      return await controller.create(request, user);
    }
    
    if (segments.length === 5 && method === 'PUT') {
      const id = segments[4];
      return await controller.update(id, request, user);
    }
    
    if (segments.length === 5 && method === 'DELETE') {
      const id = segments[4];
      return await controller.delete(id, user);
    }

    return new Response(JSON.stringify({ error: 'Invalid categories route' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  },

  async handleTagsRoutes(path, request, controller, user) {
    const segments = path.split('/');
    const method = request.method;

    if (path === '/admin/api/tags' && method === 'GET') {
      return await controller.list(request, user);
    }
    
    if (path === '/admin/api/tags' && method === 'POST') {
      return await controller.create(request, user);
    }
    
    if (segments.length === 5 && method === 'PUT') {
      const id = segments[4];
      return await controller.update(id, request, user);
    }
    
    if (segments.length === 5 && method === 'DELETE') {
      const id = segments[4];
      return await controller.delete(id, user);
    }

    return new Response(JSON.stringify({ error: 'Invalid tags route' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  },

  async handleMediaRoutes(path, request, controller, user) {
    const segments = path.split('/');
    const method = request.method;

    if (path === '/admin/api/media' && method === 'GET') {
      return await controller.list(request, user);
    }
    
    if (path === '/admin/api/media' && method === 'POST') {
      return await controller.upload(request, user);
    }
    
    if (segments.length === 5 && method === 'DELETE') {
      const id = segments[4];
      return await controller.delete(id, user);
    }

    return new Response(JSON.stringify({ error: 'Invalid media route' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  },

  async handleAnalyticsRoutes(path, request, controller, user) {
    if (path === '/admin/api/analytics/overview' && request.method === 'GET') {
      return await controller.getOverview(request, user);
    }
    
    if (path === '/admin/api/analytics/posts' && request.method === 'GET') {
      return await controller.getPostAnalytics(request, user);
    }
    
    if (path === '/admin/api/analytics/traffic' && request.method === 'GET') {
      return await controller.getTrafficAnalytics(request, user);
    }

    return new Response(JSON.stringify({ error: 'Invalid analytics route' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  },

  async handleUsersRoutes(path, request, controller, user) {
    const segments = path.split('/');
    const method = request.method;

    if (path === '/admin/api/users' && method === 'GET') {
      return await controller.list(request, user);
    }
    
    if (path === '/admin/api/users' && method === 'POST') {
      return await controller.create(request, user);
    }
    
    if (segments.length === 5 && method === 'PUT') {
      const id = segments[4];
      return await controller.update(id, request, user);
    }
    
    if (segments.length === 5 && method === 'DELETE') {
      const id = segments[4];
      return await controller.delete(id, user);
    }

    return new Response(JSON.stringify({ error: 'Invalid users route' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  },

  async handleSettingsRoutes(path, request, controller, user) {
    if (path === '/admin/api/settings' && request.method === 'GET') {
      return await controller.get(request, user);
    }
    
    if (path === '/admin/api/settings' && request.method === 'PUT') {
      return await controller.update(request, user);
    }

    return new Response(JSON.stringify({ error: 'Invalid settings route' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  },

  async handleCalendarRoutes(path, request, controller, user) {
    const segments = path.split('/');
    const method = request.method;

    if (path === '/admin/api/calendar' && method === 'GET') {
      return await controller.getCalendar(request, user);
    }
    
    if (path === '/admin/api/calendar/events' && method === 'POST') {
      return await controller.createEvent(request, user);
    }
    
    if (segments.length === 6 && segments[4] === 'events' && method === 'PUT') {
      const id = segments[5];
      return await controller.updateEvent(id, request, user);
    }

    return new Response(JSON.stringify({ error: 'Invalid calendar route' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  },

  async handleWebhooksRoutes(path, request, controller, user) {
    const segments = path.split('/');
    const method = request.method;

    if (path === '/admin/api/webhooks' && method === 'GET') {
      return await controller.list(request, user);
    }
    
    if (path === '/admin/api/webhooks' && method === 'POST') {
      return await controller.create(request, user);
    }
    
    if (segments.length === 5 && method === 'DELETE') {
      const id = segments[4];
      return await controller.delete(id, user);
    }

    return new Response(JSON.stringify({ error: 'Invalid webhooks route' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
};