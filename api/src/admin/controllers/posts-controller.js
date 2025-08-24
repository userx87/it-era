/**
 * Posts Controller - Complete CRUD operations for blog posts
 */

import { corsHeaders } from '../utils/cors.js';
import { validatePost } from '../utils/validation.js';

export class PostsController {
  constructor(env) {
    this.env = env;
  }

  /**
   * List all posts with pagination and filters
   */
  async list(request, user) {
    try {
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '10');
      const status = url.searchParams.get('status');
      const category = url.searchParams.get('category');
      const search = url.searchParams.get('search');
      const sort = url.searchParams.get('sort') || 'created_at';
      const order = url.searchParams.get('order') || 'DESC';

      const offset = (page - 1) * limit;

      // Build query
      let query = `
        SELECT p.*, 
               u.name as author_name,
               c.name as category_name,
               c.slug as category_slug,
               COUNT(*) OVER() as total_count
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE 1=1
      `;
      
      const params = [];

      // Apply filters
      if (status) {
        query += ' AND p.status = ?';
        params.push(status);
      }

      if (category) {
        query += ' AND c.slug = ?';
        params.push(category);
      }

      if (search) {
        query += ' AND (p.title LIKE ? OR p.content LIKE ? OR p.excerpt LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      // Role-based filtering
      if (user.role === 'author') {
        query += ' AND p.author_id = ?';
        params.push(user.id);
      }

      query += ` ORDER BY p.${sort} ${order} LIMIT ? OFFSET ?`;
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

      const totalCount = results.results.length > 0 ? results.results[0].total_count : 0;

      return new Response(JSON.stringify({
        posts,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        },
        filters: { status, category, search, sort, order }
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error listing posts:', error);
      return new Response(JSON.stringify({
        error: 'Failed to fetch posts',
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

  /**
   * Get single post by ID
   */
  async get(id, user) {
    try {
      const post = await this.env.BLOG_DB.prepare(`
        SELECT p.*, 
               u.name as author_name,
               c.name as category_name,
               c.slug as category_slug
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
      `).bind(id).first();

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

      // Check permissions
      if (user.role === 'author' && post.author_id !== user.id) {
        return new Response(JSON.stringify({
          error: 'Access denied'
        }), {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Get post tags
      const tags = await this.getPostTags(post.id);

      // Get featured image URL
      post.featured_image_url = post.featured_image ? 
        await this.getMediaUrl(post.featured_image) : null;

      return new Response(JSON.stringify({
        post: {
          ...post,
          tags
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error getting post:', error);
      return new Response(JSON.stringify({
        error: 'Failed to fetch post',
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

  /**
   * Create new post
   */
  async create(request, user) {
    try {
      const body = await request.json();
      
      // Validate input
      const validation = validatePost(body);
      if (!validation.success) {
        return new Response(JSON.stringify({
          error: 'Validation failed',
          details: validation.errors
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      const {
        title,
        content,
        excerpt,
        slug,
        status = 'draft',
        category_id,
        tags = [],
        featured_image,
        meta_title,
        meta_description,
        scheduled_at
      } = body;

      // Generate slug if not provided
      const finalSlug = slug || this.generateSlug(title);

      // Check slug uniqueness
      const existingPost = await this.env.BLOG_DB.prepare(
        'SELECT id FROM posts WHERE slug = ?'
      ).bind(finalSlug).first();

      if (existingPost) {
        return new Response(JSON.stringify({
          error: 'Slug already exists'
        }), {
          status: 409,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      const postId = crypto.randomUUID();
      const now = new Date().toISOString();
      const publishedAt = status === 'published' ? now : null;

      // Create post
      await this.env.BLOG_DB.prepare(`
        INSERT INTO posts (
          id, title, content, excerpt, slug, status, author_id, category_id,
          featured_image, meta_title, meta_description, scheduled_at,
          published_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        postId, title, content, excerpt, finalSlug, status, user.id, category_id,
        featured_image, meta_title, meta_description, scheduled_at,
        publishedAt, now, now
      ).run();

      // Add tags
      if (tags.length > 0) {
        await this.addPostTags(postId, tags);
      }

      // Get the created post
      const createdPost = await this.env.BLOG_DB.prepare(`
        SELECT p.*, 
               u.name as author_name,
               c.name as category_name
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
      `).bind(postId).first();

      const postTags = await this.getPostTags(postId);

      return new Response(JSON.stringify({
        success: true,
        post: {
          ...createdPost,
          tags: postTags
        }
      }), {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error creating post:', error);
      return new Response(JSON.stringify({
        error: 'Failed to create post',
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

  /**
   * Update post
   */
  async update(id, request, user) {
    try {
      const body = await request.json();

      // Get existing post
      const existingPost = await this.env.BLOG_DB.prepare(
        'SELECT * FROM posts WHERE id = ?'
      ).bind(id).first();

      if (!existingPost) {
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

      // Check permissions
      if (user.role === 'author' && existingPost.author_id !== user.id) {
        return new Response(JSON.stringify({
          error: 'Access denied'
        }), {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Validate input
      const validation = validatePost(body, true); // partial validation for updates
      if (!validation.success) {
        return new Response(JSON.stringify({
          error: 'Validation failed',
          details: validation.errors
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      const {
        title,
        content,
        excerpt,
        slug,
        status,
        category_id,
        tags,
        featured_image,
        meta_title,
        meta_description,
        scheduled_at
      } = body;

      const now = new Date().toISOString();
      let publishedAt = existingPost.published_at;

      // Set published_at if changing to published status
      if (status === 'published' && existingPost.status !== 'published') {
        publishedAt = now;
      } else if (status !== 'published') {
        publishedAt = null;
      }

      // Check slug uniqueness if changed
      if (slug && slug !== existingPost.slug) {
        const slugExists = await this.env.BLOG_DB.prepare(
          'SELECT id FROM posts WHERE slug = ? AND id != ?'
        ).bind(slug, id).first();

        if (slugExists) {
          return new Response(JSON.stringify({
            error: 'Slug already exists'
          }), {
            status: 409,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }
      }

      // Update post
      await this.env.BLOG_DB.prepare(`
        UPDATE posts SET
          title = COALESCE(?, title),
          content = COALESCE(?, content),
          excerpt = COALESCE(?, excerpt),
          slug = COALESCE(?, slug),
          status = COALESCE(?, status),
          category_id = COALESCE(?, category_id),
          featured_image = COALESCE(?, featured_image),
          meta_title = COALESCE(?, meta_title),
          meta_description = COALESCE(?, meta_description),
          scheduled_at = COALESCE(?, scheduled_at),
          published_at = ?,
          updated_at = ?
        WHERE id = ?
      `).bind(
        title, content, excerpt, slug, status, category_id,
        featured_image, meta_title, meta_description, scheduled_at,
        publishedAt, now, id
      ).run();

      // Update tags if provided
      if (tags !== undefined) {
        await this.updatePostTags(id, tags);
      }

      // Get updated post
      const updatedPost = await this.env.BLOG_DB.prepare(`
        SELECT p.*, 
               u.name as author_name,
               c.name as category_name
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
      `).bind(id).first();

      const postTags = await this.getPostTags(id);

      return new Response(JSON.stringify({
        success: true,
        post: {
          ...updatedPost,
          tags: postTags
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error updating post:', error);
      return new Response(JSON.stringify({
        error: 'Failed to update post',
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

  /**
   * Delete post
   */
  async delete(id, user) {
    try {
      const post = await this.env.BLOG_DB.prepare(
        'SELECT * FROM posts WHERE id = ?'
      ).bind(id).first();

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

      // Check permissions
      if (user.role === 'author' && post.author_id !== user.id) {
        return new Response(JSON.stringify({
          error: 'Access denied'
        }), {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Delete post tags
      await this.env.BLOG_DB.prepare(
        'DELETE FROM post_tags WHERE post_id = ?'
      ).bind(id).run();

      // Delete post
      await this.env.BLOG_DB.prepare(
        'DELETE FROM posts WHERE id = ?'
      ).bind(id).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'Post deleted successfully'
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error deleting post:', error);
      return new Response(JSON.stringify({
        error: 'Failed to delete post',
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

  /**
   * Publish post
   */
  async publish(id, user) {
    try {
      const post = await this.env.BLOG_DB.prepare(
        'SELECT * FROM posts WHERE id = ?'
      ).bind(id).first();

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

      // Check permissions
      if (user.role === 'author' && post.author_id !== user.id) {
        return new Response(JSON.stringify({
          error: 'Access denied'
        }), {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      const now = new Date().toISOString();

      await this.env.BLOG_DB.prepare(`
        UPDATE posts SET 
          status = 'published',
          published_at = ?,
          updated_at = ?
        WHERE id = ?
      `).bind(now, now, id).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'Post published successfully'
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error publishing post:', error);
      return new Response(JSON.stringify({
        error: 'Failed to publish post',
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

  /**
   * Set post to draft
   */
  async setDraft(id, user) {
    try {
      const post = await this.env.BLOG_DB.prepare(
        'SELECT * FROM posts WHERE id = ?'
      ).bind(id).first();

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

      // Check permissions
      if (user.role === 'author' && post.author_id !== user.id) {
        return new Response(JSON.stringify({
          error: 'Access denied'
        }), {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      const now = new Date().toISOString();

      await this.env.BLOG_DB.prepare(`
        UPDATE posts SET 
          status = 'draft',
          published_at = NULL,
          updated_at = ?
        WHERE id = ?
      `).bind(now, id).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'Post set to draft successfully'
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error setting post to draft:', error);
      return new Response(JSON.stringify({
        error: 'Failed to set post to draft',
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

  /**
   * Helper methods
   */
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
      console.error('Error getting post tags:', error);
      return [];
    }
  }

  async addPostTags(postId, tags) {
    try {
      for (const tagId of tags) {
        await this.env.BLOG_DB.prepare(
          'INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)'
        ).bind(postId, tagId).run();
      }
    } catch (error) {
      console.error('Error adding post tags:', error);
    }
  }

  async updatePostTags(postId, tags) {
    try {
      // Remove existing tags
      await this.env.BLOG_DB.prepare(
        'DELETE FROM post_tags WHERE post_id = ?'
      ).bind(postId).run();

      // Add new tags
      if (tags.length > 0) {
        await this.addPostTags(postId, tags);
      }
    } catch (error) {
      console.error('Error updating post tags:', error);
    }
  }

  async getMediaUrl(mediaId) {
    try {
      const media = await this.env.BLOG_DB.prepare(
        'SELECT url FROM media WHERE id = ?'
      ).bind(mediaId).first();

      return media ? media.url : null;
    } catch (error) {
      console.error('Error getting media URL:', error);
      return null;
    }
  }

  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
}