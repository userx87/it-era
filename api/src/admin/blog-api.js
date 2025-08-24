/**
 * Public Blog API - Frontend-facing endpoints
 * Separate from admin API for public consumption
 */

import { corsHeaders } from './utils/cors.js';

export class BlogAPI {
  constructor(env) {
    this.env = env;
  }

  async handleRequest(request, env, ctx) {
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
      // Public blog endpoints
      if (path === '/api/posts' && request.method === 'GET') {
        return await this.getPosts(request);
      }

      if (path.match(/^\/api\/posts\/([^/]+)$/) && request.method === 'GET') {
        const slug = path.split('/')[3];
        return await this.getPost(slug, request);
      }

      if (path === '/api/categories' && request.method === 'GET') {
        return await this.getCategories(request);
      }

      if (path === '/api/tags' && request.method === 'GET') {
        return await this.getTags(request);
      }

      if (path === '/api/search' && request.method === 'GET') {
        return await this.searchPosts(request);
      }

      // Track page view
      if (path === '/api/track/view' && request.method === 'POST') {
        return await this.trackPageView(request);
      }

      return new Response(JSON.stringify({
        error: 'Endpoint not found'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Blog API error:', error);
      return new Response(JSON.stringify({
        error: 'Internal server error'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }

  async getPosts(request) {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const category = url.searchParams.get('category');
    const tag = url.searchParams.get('tag');
    const featured = url.searchParams.get('featured') === 'true';

    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        p.id, p.title, p.slug, p.excerpt, p.published_at,
        p.featured, p.view_count, p.featured_image,
        u.name as author_name,
        c.name as category_name, c.slug as category_slug
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'published'
    `;
    
    const params = [];

    if (category) {
      query += ' AND c.slug = ?';
      params.push(category);
    }

    if (featured) {
      query += ' AND p.featured = 1';
    }

    if (tag) {
      query += ' AND EXISTS (SELECT 1 FROM post_tags pt JOIN tags t ON pt.tag_id = t.id WHERE pt.post_id = p.id AND t.slug = ?)';
      params.push(tag);
    }

    query += ' ORDER BY p.published_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const results = await this.env.BLOG_DB.prepare(query).bind(...params).all();

    // Get tags for each post
    const posts = await Promise.all(results.results.map(async (post) => {
      const tags = await this.getPostTags(post.id);
      return {
        ...post,
        tags,
        featured_image_url: post.featured_image ? await this.getMediaUrl(post.featured_image) : null
      };
    }));

    return new Response(JSON.stringify({
      posts,
      pagination: {
        page,
        limit,
        has_more: posts.length === limit
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }

  async getPost(slug, request) {
    const post = await this.env.BLOG_DB.prepare(`
      SELECT 
        p.*,
        u.name as author_name, u.bio as author_bio,
        c.name as category_name, c.slug as category_slug
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.slug = ? AND p.status = 'published'
    `).bind(slug).first();

    if (!post) {
      return new Response(JSON.stringify({
        error: 'Post not found'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Get tags
    const tags = await this.getPostTags(post.id);

    // Get related posts
    const relatedPosts = await this.getRelatedPosts(post.id, post.category_id);

    return new Response(JSON.stringify({
      post: {
        ...post,
        tags,
        featured_image_url: post.featured_image ? await this.getMediaUrl(post.featured_image) : null
      },
      related_posts: relatedPosts
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }

  async getCategories(request) {
    const results = await this.env.BLOG_DB.prepare(`
      SELECT 
        c.*,
        COUNT(p.id) as post_count
      FROM categories c
      LEFT JOIN posts p ON c.id = p.category_id AND p.status = 'published'
      WHERE c.active = 1
      GROUP BY c.id
      ORDER BY c.name ASC
    `).all();

    return new Response(JSON.stringify({
      categories: results.results || []
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }

  async getTags(request) {
    const results = await this.env.BLOG_DB.prepare(`
      SELECT 
        t.*,
        COUNT(pt.post_id) as post_count
      FROM tags t
      LEFT JOIN post_tags pt ON t.id = pt.tag_id
      LEFT JOIN posts p ON pt.post_id = p.id AND p.status = 'published'
      WHERE t.active = 1
      GROUP BY t.id
      HAVING post_count > 0
      ORDER BY post_count DESC
    `).all();

    return new Response(JSON.stringify({
      tags: results.results || []
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }

  async searchPosts(request) {
    const url = new URL(request.url);
    const q = url.searchParams.get('q');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    if (!q) {
      return new Response(JSON.stringify({
        error: 'Search query is required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    const results = await this.env.BLOG_DB.prepare(`
      SELECT 
        p.id, p.title, p.slug, p.excerpt, p.published_at,
        u.name as author_name,
        c.name as category_name, c.slug as category_slug
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'published'
      AND (p.title LIKE ? OR p.content LIKE ? OR p.excerpt LIKE ?)
      ORDER BY p.published_at DESC
      LIMIT ?
    `).bind(`%${q}%`, `%${q}%`, `%${q}%`, limit).all();

    return new Response(JSON.stringify({
      query: q,
      results: results.results || []
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }

  async trackPageView(request) {
    const body = await request.json();
    const { post_id, page_url, page_title } = body;

    const ip = request.headers.get('CF-Connecting-IP') || 
               request.headers.get('X-Forwarded-For') || 
               'unknown';
    const userAgent = request.headers.get('User-Agent') || '';

    // Track the view
    const viewId = crypto.randomUUID();
    await this.env.BLOG_DB.prepare(`
      INSERT INTO page_views (
        id, page_url, page_title, post_id, ip_address, user_agent, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      viewId, page_url, page_title, post_id, ip, userAgent,
      new Date().toISOString()
    ).run();

    // Update post view count if it's a post
    if (post_id) {
      await this.env.BLOG_DB.prepare(
        'UPDATE posts SET view_count = view_count + 1 WHERE id = ?'
      ).bind(post_id).run();
    }

    return new Response(JSON.stringify({
      success: true
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }

  // Helper methods
  async getPostTags(postId) {
    try {
      const results = await this.env.BLOG_DB.prepare(`
        SELECT t.* FROM tags t
        JOIN post_tags pt ON t.id = pt.tag_id
        WHERE pt.post_id = ?
        ORDER BY t.name
      `).bind(postId).all();

      return results.results || [];
    } catch (error) {
      return [];
    }
  }

  async getMediaUrl(mediaId) {
    try {
      const media = await this.env.BLOG_DB.prepare(
        'SELECT url FROM media WHERE id = ?'
      ).bind(mediaId).first();

      return media ? media.url : null;
    } catch (error) {
      return null;
    }
  }

  async getRelatedPosts(postId, categoryId, limit = 3) {
    try {
      const results = await this.env.BLOG_DB.prepare(`
        SELECT 
          p.id, p.title, p.slug, p.excerpt, p.published_at,
          u.name as author_name
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        WHERE p.id != ? AND p.category_id = ? AND p.status = 'published'
        ORDER BY p.published_at DESC
        LIMIT ?
      `).bind(postId, categoryId, limit).all();

      return results.results || [];
    } catch (error) {
      return [];
    }
  }
}