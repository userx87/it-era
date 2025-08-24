/**
 * Categories Controller - CRUD operations for blog categories
 */

import { corsHeaders } from '../utils/cors.js';
import { validateCategory } from '../utils/validation.js';

export class CategoriesController {
  constructor(env) {
    this.env = env;
  }

  /**
   * List all categories
   */
  async list(request, user) {
    try {
      const url = new URL(request.url);
      const includeInactive = url.searchParams.get('include_inactive') === 'true';
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const search = url.searchParams.get('search');

      const offset = (page - 1) * limit;

      let query = `
        SELECT c.*, 
               COUNT(p.id) as post_count,
               COUNT(*) OVER() as total_count
        FROM categories c
        LEFT JOIN posts p ON c.id = p.category_id AND p.status = 'published'
        WHERE 1=1
      `;
      
      const params = [];

      if (!includeInactive) {
        query += ' AND c.active = 1';
      }

      if (search) {
        query += ' AND (c.name LIKE ? OR c.description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      query += ' GROUP BY c.id ORDER BY c.name ASC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const results = await this.env.BLOG_DB.prepare(query).bind(...params).all();
      const totalCount = results.results.length > 0 ? results.results[0].total_count : 0;

      return new Response(JSON.stringify({
        categories: results.results || [],
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
      console.error('Error listing categories:', error);
      return new Response(JSON.stringify({
        error: 'Failed to fetch categories',
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
   * Create new category
   */
  async create(request, user) {
    try {
      // Check permissions
      if (!['admin', 'editor'].includes(user.role)) {
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

      const body = await request.json();
      
      // Validate input
      const validation = validateCategory(body);
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
        color = '#007cba',
        parent_id = null
      } = body;

      // Generate slug if not provided
      const finalSlug = slug || this.generateSlug(name);

      // Check slug uniqueness
      const existingCategory = await this.env.BLOG_DB.prepare(
        'SELECT id FROM categories WHERE slug = ?'
      ).bind(finalSlug).first();

      if (existingCategory) {
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

      const categoryId = crypto.randomUUID();
      const now = new Date().toISOString();

      await this.env.BLOG_DB.prepare(`
        INSERT INTO categories (
          id, name, description, slug, color, parent_id,
          created_at, updated_at, active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).bind(
        categoryId, name, description, finalSlug, color, parent_id,
        now, now
      ).run();

      // Get created category
      const category = await this.env.BLOG_DB.prepare(
        'SELECT * FROM categories WHERE id = ?'
      ).bind(categoryId).first();

      return new Response(JSON.stringify({
        success: true,
        category
      }), {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error creating category:', error);
      return new Response(JSON.stringify({
        error: 'Failed to create category',
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
   * Update category
   */
  async update(id, request, user) {
    try {
      // Check permissions
      if (!['admin', 'editor'].includes(user.role)) {
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

      const body = await request.json();

      // Get existing category
      const existingCategory = await this.env.BLOG_DB.prepare(
        'SELECT * FROM categories WHERE id = ?'
      ).bind(id).first();

      if (!existingCategory) {
        return new Response(JSON.stringify({
          error: 'Category not found'
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Validate input
      const validation = validateCategory(body, true);
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

      const { name, description, slug, color, parent_id } = body;

      // Check slug uniqueness if changed
      if (slug && slug !== existingCategory.slug) {
        const slugExists = await this.env.BLOG_DB.prepare(
          'SELECT id FROM categories WHERE slug = ? AND id != ?'
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
        UPDATE categories SET
          name = COALESCE(?, name),
          description = COALESCE(?, description),
          slug = COALESCE(?, slug),
          color = COALESCE(?, color),
          parent_id = COALESCE(?, parent_id),
          updated_at = ?
        WHERE id = ?
      `).bind(
        name, description, slug, color, parent_id, now, id
      ).run();

      // Get updated category
      const category = await this.env.BLOG_DB.prepare(
        'SELECT * FROM categories WHERE id = ?'
      ).bind(id).first();

      return new Response(JSON.stringify({
        success: true,
        category
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error updating category:', error);
      return new Response(JSON.stringify({
        error: 'Failed to update category',
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
   * Delete category
   */
  async delete(id, user) {
    try {
      // Check permissions
      if (!['admin', 'editor'].includes(user.role)) {
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

      const category = await this.env.BLOG_DB.prepare(
        'SELECT * FROM categories WHERE id = ?'
      ).bind(id).first();

      if (!category) {
        return new Response(JSON.stringify({
          error: 'Category not found'
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Check if category has posts
      const postsCount = await this.env.BLOG_DB.prepare(
        'SELECT COUNT(*) as count FROM posts WHERE category_id = ?'
      ).bind(id).first();

      if (postsCount.count > 0) {
        return new Response(JSON.stringify({
          error: 'Cannot delete category with existing posts',
          posts_count: postsCount.count
        }), {
          status: 409,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Check if category has child categories
      const childrenCount = await this.env.BLOG_DB.prepare(
        'SELECT COUNT(*) as count FROM categories WHERE parent_id = ?'
      ).bind(id).first();

      if (childrenCount.count > 0) {
        return new Response(JSON.stringify({
          error: 'Cannot delete category with child categories',
          children_count: childrenCount.count
        }), {
          status: 409,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Soft delete by setting active = 0
      const now = new Date().toISOString();
      await this.env.BLOG_DB.prepare(
        'UPDATE categories SET active = 0, updated_at = ? WHERE id = ?'
      ).bind(now, id).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'Category deleted successfully'
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error deleting category:', error);
      return new Response(JSON.stringify({
        error: 'Failed to delete category',
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