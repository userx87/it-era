/**
 * Users Controller - User management (Admin only)
 */

import { corsHeaders } from '../utils/cors.js';
import { validateUser } from '../utils/validation.js';
import { hashPassword } from '../utils/crypto.js';

export class UsersController {
  constructor(env) {
    this.env = env;
  }

  /**
   * List all users (Admin only)
   */
  async list(request, user) {
    try {
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const role = url.searchParams.get('role');
      const search = url.searchParams.get('search');
      const includeInactive = url.searchParams.get('include_inactive') === 'true';

      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          id, email, name, role, avatar, bio, website,
          social_links, active, email_verified, last_login,
          created_at, updated_at,
          COUNT(*) OVER() as total_count
        FROM users
        WHERE 1=1
      `;
      
      const params = [];

      if (!includeInactive) {
        query += ' AND active = 1';
      }

      if (role) {
        query += ' AND role = ?';
        params.push(role);
      }

      if (search) {
        query += ' AND (name LIKE ? OR email LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const results = await this.env.BLOG_DB.prepare(query).bind(...params).all();

      // Get post counts for each user
      const users = await Promise.all(results.results.map(async (u) => {
        const postCount = await this.env.BLOG_DB.prepare(
          'SELECT COUNT(*) as count FROM posts WHERE author_id = ?'
        ).bind(u.id).first();

        return {
          ...u,
          post_count: postCount.count,
          social_links: u.social_links ? JSON.parse(u.social_links) : {}
        };
      }));

      const totalCount = results.results.length > 0 ? results.results[0].total_count : 0;

      return new Response(JSON.stringify({
        users,
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
      console.error('Error listing users:', error);
      return new Response(JSON.stringify({
        error: 'Failed to fetch users',
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
   * Create new user (Admin only)
   */
  async create(request, user) {
    try {
      const body = await request.json();
      
      // Validate input
      const validation = validateUser(body);
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
        email,
        name,
        password,
        role = 'author',
        bio,
        website,
        social_links = {}
      } = body;

      // Check if user already exists
      const existingUser = await this.env.BLOG_DB.prepare(
        'SELECT id FROM users WHERE email = ?'
      ).bind(email).first();

      if (existingUser) {
        return new Response(JSON.stringify({
          error: 'User with this email already exists'
        }), {
          status: 409,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      const userId = crypto.randomUUID();
      const now = new Date().toISOString();

      await this.env.BLOG_DB.prepare(`
        INSERT INTO users (
          id, email, name, password_hash, role, bio, website,
          social_links, active, email_verified, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?)
      `).bind(
        userId, email, name, passwordHash, role, bio, website,
        JSON.stringify(social_links), now, now
      ).run();

      // Get created user (without password)
      const newUser = await this.env.BLOG_DB.prepare(`
        SELECT 
          id, email, name, role, bio, website, social_links,
          active, email_verified, created_at
        FROM users WHERE id = ?
      `).bind(userId).first();

      return new Response(JSON.stringify({
        success: true,
        user: {
          ...newUser,
          social_links: JSON.parse(newUser.social_links || '{}')
        }
      }), {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error creating user:', error);
      return new Response(JSON.stringify({
        error: 'Failed to create user',
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
   * Update user (Admin only)
   */
  async update(id, request, user) {
    try {
      const body = await request.json();

      // Get existing user
      const existingUser = await this.env.BLOG_DB.prepare(
        'SELECT * FROM users WHERE id = ?'
      ).bind(id).first();

      if (!existingUser) {
        return new Response(JSON.stringify({
          error: 'User not found'
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Validate input
      const validation = validateUser(body, true);
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
        email,
        name,
        password,
        role,
        bio,
        website,
        social_links,
        active
      } = body;

      // Check email uniqueness if changed
      if (email && email !== existingUser.email) {
        const emailExists = await this.env.BLOG_DB.prepare(
          'SELECT id FROM users WHERE email = ? AND id != ?'
        ).bind(email, id).first();

        if (emailExists) {
          return new Response(JSON.stringify({
            error: 'Email already in use'
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
      let passwordHash = null;

      // Hash new password if provided
      if (password) {
        passwordHash = await hashPassword(password);
      }

      await this.env.BLOG_DB.prepare(`
        UPDATE users SET
          email = COALESCE(?, email),
          name = COALESCE(?, name),
          password_hash = COALESCE(?, password_hash),
          role = COALESCE(?, role),
          bio = COALESCE(?, bio),
          website = COALESCE(?, website),
          social_links = COALESCE(?, social_links),
          active = COALESCE(?, active),
          updated_at = ?
        WHERE id = ?
      `).bind(
        email, name, passwordHash, role, bio, website,
        social_links ? JSON.stringify(social_links) : null,
        active, now, id
      ).run();

      // Get updated user
      const updatedUser = await this.env.BLOG_DB.prepare(`
        SELECT 
          id, email, name, role, bio, website, social_links,
          active, email_verified, last_login, created_at, updated_at
        FROM users WHERE id = ?
      `).bind(id).first();

      return new Response(JSON.stringify({
        success: true,
        user: {
          ...updatedUser,
          social_links: JSON.parse(updatedUser.social_links || '{}')
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error updating user:', error);
      return new Response(JSON.stringify({
        error: 'Failed to update user',
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
   * Delete user (Admin only)
   */
  async delete(id, user) {
    try {
      const targetUser = await this.env.BLOG_DB.prepare(
        'SELECT * FROM users WHERE id = ?'
      ).bind(id).first();

      if (!targetUser) {
        return new Response(JSON.stringify({
          error: 'User not found'
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Prevent deleting self
      if (id === user.id) {
        return new Response(JSON.stringify({
          error: 'Cannot delete your own account'
        }), {
          status: 409,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Check if user has posts
      const postCount = await this.env.BLOG_DB.prepare(
        'SELECT COUNT(*) as count FROM posts WHERE author_id = ?'
      ).bind(id).first();

      if (postCount.count > 0) {
        // Soft delete - just deactivate
        const now = new Date().toISOString();
        await this.env.BLOG_DB.prepare(
          'UPDATE users SET active = 0, updated_at = ? WHERE id = ?'
        ).bind(now, id).run();

        return new Response(JSON.stringify({
          success: true,
          message: 'User deactivated (has posts)'
        }), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Hard delete if no posts
      await this.env.BLOG_DB.prepare(
        'DELETE FROM users WHERE id = ?'
      ).bind(id).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'User deleted successfully'
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error deleting user:', error);
      return new Response(JSON.stringify({
        error: 'Failed to delete user',
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
   * Update user profile (self)
   */
  async updateProfile(request, user) {
    try {
      const body = await request.json();

      const {
        name,
        bio,
        website,
        social_links,
        current_password,
        new_password
      } = body;

      // If changing password, verify current password
      if (new_password) {
        if (!current_password) {
          return new Response(JSON.stringify({
            error: 'Current password is required to change password'
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

        const { verifyPassword } = await import('../utils/crypto.js');
        const isValidPassword = await verifyPassword(current_password, user.password_hash);
        
        if (!isValidPassword) {
          return new Response(JSON.stringify({
            error: 'Current password is incorrect'
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }
      }

      const now = new Date().toISOString();
      let passwordHash = null;

      if (new_password) {
        passwordHash = await hashPassword(new_password);
      }

      await this.env.BLOG_DB.prepare(`
        UPDATE users SET
          name = COALESCE(?, name),
          bio = COALESCE(?, bio),
          website = COALESCE(?, website),
          social_links = COALESCE(?, social_links),
          password_hash = COALESCE(?, password_hash),
          updated_at = ?
        WHERE id = ?
      `).bind(
        name, bio, website,
        social_links ? JSON.stringify(social_links) : null,
        passwordHash, now, user.id
      ).run();

      // Get updated user
      const updatedUser = await this.env.BLOG_DB.prepare(`
        SELECT 
          id, email, name, role, bio, website, social_links,
          active, email_verified, last_login, created_at, updated_at
        FROM users WHERE id = ?
      `).bind(user.id).first();

      return new Response(JSON.stringify({
        success: true,
        user: {
          ...updatedUser,
          social_links: JSON.parse(updatedUser.social_links || '{}')
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error updating profile:', error);
      return new Response(JSON.stringify({
        error: 'Failed to update profile',
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
   * Get user statistics
   */
  async getUserStats(request, user) {
    try {
      const [totalUsers, activeUsers, usersByRole, recentUsers] = await Promise.all([
        // Total users
        this.env.BLOG_DB.prepare('SELECT COUNT(*) as count FROM users').first(),
        
        // Active users
        this.env.BLOG_DB.prepare('SELECT COUNT(*) as count FROM users WHERE active = 1').first(),
        
        // Users by role
        this.env.BLOG_DB.prepare(`
          SELECT role, COUNT(*) as count 
          FROM users WHERE active = 1 
          GROUP BY role
        `).all(),
        
        // Recent users (last 30 days)
        this.env.BLOG_DB.prepare(`
          SELECT COUNT(*) as count 
          FROM users 
          WHERE created_at >= datetime('now', '-30 days')
        `).first()
      ]);

      return new Response(JSON.stringify({
        total_users: totalUsers.count,
        active_users: activeUsers.count,
        recent_users: recentUsers.count,
        by_role: usersByRole.results || []
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error getting user stats:', error);
      return new Response(JSON.stringify({
        error: 'Failed to get user statistics',
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
}