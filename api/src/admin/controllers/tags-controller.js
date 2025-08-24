/**
 * Tags Controller - CRUD operations for blog tags
 */

import { corsHeaders } from '../utils/cors.js';
import { validateTag } from '../utils/validation.js';

export class TagsController {
  constructor(env) {
    this.env = env;
  }

  /**
   * List all tags
   */
  async list(request, user) {
    try {
      const url = new URL(request.url);
      const includeInactive = url.searchParams.get('include_inactive') === 'true';
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '100');
      const search = url.searchParams.get('search');
      const sort = url.searchParams.get('sort') || 'name';

      const offset = (page - 1) * limit;

      let query = `
        SELECT t.*, 
               COUNT(pt.post_id) as post_count,
               COUNT(*) OVER() as total_count
        FROM tags t
        LEFT JOIN post_tags pt ON t.id = pt.tag_id
        LEFT JOIN posts p ON pt.post_id = p.id AND p.status = 'published'
        WHERE 1=1
      `;
      
      const params = [];

      if (!includeInactive) {
        query += ' AND t.active = 1';
      }

      if (search) {
        query += ' AND (t.name LIKE ? OR t.description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      const orderBy = sort === 'usage' ? 'post_count DESC' : 't.name ASC';
      query += ` GROUP BY t.id ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const results = await this.env.BLOG_DB.prepare(query).bind(...params).all();
      const totalCount = results.results.length > 0 ? results.results[0].total_count : 0;

      return new Response(JSON.stringify({
        tags: results.results || [],
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error listing tags:', error);
      return new Response(JSON.stringify({
        error: 'Failed to fetch tags',
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
   * Create new tag
   */
  async create(request, user) {
    try {
      const body = await request.json();
      
      // Validate input
      const validation = validateTag(body);
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
        name,
        description,
        slug,
        color = '#6c757d'
      } = body;

      // Generate slug if not provided
      const finalSlug = slug || this.generateSlug(name);

      // Check slug uniqueness
      const existingTag = await this.env.BLOG_DB.prepare(
        'SELECT id FROM tags WHERE slug = ?'
      ).bind(finalSlug).first();

      if (existingTag) {
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

      const tagId = crypto.randomUUID();
      const now = new Date().toISOString();

      await this.env.BLOG_DB.prepare(`
        INSERT INTO tags (
          id, name, description, slug, color,
          created_at, updated_at, active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `).bind(
        tagId, name, description, finalSlug, color,
        now, now
      ).run();

      // Get created tag
      const tag = await this.env.BLOG_DB.prepare(
        'SELECT * FROM tags WHERE id = ?'
      ).bind(tagId).first();

      return new Response(JSON.stringify({
        success: true,
        tag
      }), {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error creating tag:', error);
      return new Response(JSON.stringify({
        error: 'Failed to create tag',
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
   * Update tag
   */
  async update(id, request, user) {
    try {
      const body = await request.json();

      // Get existing tag
      const existingTag = await this.env.BLOG_DB.prepare(
        'SELECT * FROM tags WHERE id = ?'
      ).bind(id).first();

      if (!existingTag) {
        return new Response(JSON.stringify({
          error: 'Tag not found'
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Validate input
      const validation = validateTag(body, true);
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

      const { name, description, slug, color } = body;

      // Check slug uniqueness if changed
      if (slug && slug !== existingTag.slug) {
        const slugExists = await this.env.BLOG_DB.prepare(
          'SELECT id FROM tags WHERE slug = ? AND id != ?'
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

      const now = new Date().toISOString();

      await this.env.BLOG_DB.prepare(`
        UPDATE tags SET
          name = COALESCE(?, name),
          description = COALESCE(?, description),
          slug = COALESCE(?, slug),
          color = COALESCE(?, color),
          updated_at = ?
        WHERE id = ?
      `).bind(
        name, description, slug, color, now, id
      ).run();

      // Get updated tag
      const tag = await this.env.BLOG_DB.prepare(
        'SELECT * FROM tags WHERE id = ?'
      ).bind(id).first();

      return new Response(JSON.stringify({
        success: true,
        tag
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error updating tag:', error);
      return new Response(JSON.stringify({
        error: 'Failed to update tag',
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
   * Delete tag
   */
  async delete(id, user) {
    try {
      const tag = await this.env.BLOG_DB.prepare(
        'SELECT * FROM tags WHERE id = ?'
      ).bind(id).first();

      if (!tag) {
        return new Response(JSON.stringify({
          error: 'Tag not found'
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Check if tag is used in posts
      const usageCount = await this.env.BLOG_DB.prepare(
        'SELECT COUNT(*) as count FROM post_tags WHERE tag_id = ?'
      ).bind(id).first();

      if (usageCount.count > 0) {
        // Soft delete - just deactivate
        const now = new Date().toISOString();
        await this.env.BLOG_DB.prepare(
          'UPDATE tags SET active = 0, updated_at = ? WHERE id = ?'
        ).bind(now, id).run();

        return new Response(JSON.stringify({
          success: true,
          message: 'Tag deactivated (was used in posts)'
        }), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Hard delete if not used
      await this.env.BLOG_DB.prepare(
        'DELETE FROM tags WHERE id = ?'
      ).bind(id).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'Tag deleted successfully'
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error deleting tag:', error);
      return new Response(JSON.stringify({
        error: 'Failed to delete tag',
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
   * Get popular tags
   */
  async getPopular(request, user) {
    try {
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get('limit') || '20');

      const results = await this.env.BLOG_DB.prepare(`
        SELECT t.*, COUNT(pt.post_id) as post_count
        FROM tags t
        JOIN post_tags pt ON t.id = pt.tag_id
        JOIN posts p ON pt.post_id = p.id
        WHERE t.active = 1 AND p.status = 'published'
        GROUP BY t.id
        ORDER BY post_count DESC
        LIMIT ?
      `).bind(limit).all();

      return new Response(JSON.stringify({
        tags: results.results || []
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error getting popular tags:', error);
      return new Response(JSON.stringify({
        error: 'Failed to fetch popular tags',
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
   * Search tags
   */
  async search(request, user) {
    try {
      const url = new URL(request.url);
      const query = url.searchParams.get('q');
      const limit = parseInt(url.searchParams.get('limit') || '10');

      if (!query) {
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
        SELECT t.*, COUNT(pt.post_id) as post_count
        FROM tags t
        LEFT JOIN post_tags pt ON t.id = pt.tag_id
        WHERE t.active = 1 AND (t.name LIKE ? OR t.slug LIKE ?)
        GROUP BY t.id
        ORDER BY post_count DESC, t.name ASC
        LIMIT ?
      `).bind(`%${query}%`, `%${query}%`, limit).all();

      return new Response(JSON.stringify({
        tags: results.results || [],
        query
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error searching tags:', error);
      return new Response(JSON.stringify({
        error: 'Failed to search tags',
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
  generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
}