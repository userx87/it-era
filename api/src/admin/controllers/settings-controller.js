/**
 * Settings Controller - System configuration management
 */

import { corsHeaders } from '../utils/cors.js';
import { validateSettings } from '../utils/validation.js';

export class SettingsController {
  constructor(env) {
    this.env = env;
  }

  /**
   * Get all settings
   */
  async get(request, user) {
    try {
      const url = new URL(request.url);
      const group = url.searchParams.get('group');

      let query = 'SELECT key, value, type, description, group_name FROM settings';
      const params = [];

      if (group) {
        query += ' WHERE group_name = ?';
        params.push(group);
      }

      query += ' ORDER BY group_name, key';

      const results = await this.env.BLOG_DB.prepare(query).bind(...params).all();

      // Parse settings values according to their types
      const settings = {};
      const grouped = {};

      for (const setting of results.results) {
        let value = setting.value;

        // Parse value according to type
        switch (setting.type) {
          case 'number':
            value = parseFloat(setting.value);
            break;
          case 'boolean':
            value = setting.value === 'true';
            break;
          case 'json':
            try {
              value = JSON.parse(setting.value);
            } catch {
              value = setting.value;
            }
            break;
          default:
            value = setting.value;
        }

        settings[setting.key] = value;

        // Group settings
        if (!grouped[setting.group_name]) {
          grouped[setting.group_name] = {};
        }
        grouped[setting.group_name][setting.key] = {
          value,
          type: setting.type,
          description: setting.description
        };
      }

      return new Response(JSON.stringify({
        settings: settings,
        grouped: grouped
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error getting settings:', error);
      return new Response(JSON.stringify({
        error: 'Failed to fetch settings',
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
   * Update settings
   */
  async update(request, user) {
    try {
      const body = await request.json();

      // Validate settings
      const validation = validateSettings(body);
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

      const now = new Date().toISOString();
      const updatePromises = [];

      // Update each setting
      for (const [key, value] of Object.entries(body)) {
        // Convert value to string for storage
        let stringValue;
        let type = 'string';

        if (typeof value === 'boolean') {
          stringValue = value.toString();
          type = 'boolean';
        } else if (typeof value === 'number') {
          stringValue = value.toString();
          type = 'number';
        } else if (typeof value === 'object' && value !== null) {
          stringValue = JSON.stringify(value);
          type = 'json';
        } else {
          stringValue = value.toString();
          type = 'string';
        }

        // Check if setting exists
        const existingSetting = await this.env.BLOG_DB.prepare(
          'SELECT key FROM settings WHERE key = ?'
        ).bind(key).first();

        if (existingSetting) {
          // Update existing setting
          updatePromises.push(
            this.env.BLOG_DB.prepare(`
              UPDATE settings 
              SET value = ?, type = ?, updated_at = ?
              WHERE key = ?
            `).bind(stringValue, type, now, key).run()
          );
        } else {
          // Create new setting
          updatePromises.push(
            this.env.BLOG_DB.prepare(`
              INSERT INTO settings (key, value, type, group_name, updated_at)
              VALUES (?, ?, ?, 'general', ?)
            `).bind(key, stringValue, type, now).run()
          );
        }
      }

      // Execute all updates
      await Promise.all(updatePromises);

      // Log the change
      await this.logSettingsChange(user.id, body, request);

      return new Response(JSON.stringify({
        success: true,
        message: 'Settings updated successfully'
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error updating settings:', error);
      return new Response(JSON.stringify({
        error: 'Failed to update settings',
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
   * Reset settings to defaults
   */
  async reset(request, user) {
    try {
      const body = await request.json();
      const { keys } = body;

      if (!keys || !Array.isArray(keys)) {
        return new Response(JSON.stringify({
          error: 'Keys array is required'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Default settings
      const defaults = {
        site_title: 'IT-ERA Blog',
        site_description: 'Blog aziendale IT-ERA - Assistenza informatica e sicurezza',
        site_url: 'https://it-era.it',
        posts_per_page: 10,
        allow_comments: true,
        require_comment_approval: true,
        admin_email: 'info@it-era.it',
        date_format: 'Y-m-d',
        time_format: 'H:i',
        timezone: 'Europe/Rome'
      };

      const now = new Date().toISOString();

      for (const key of keys) {
        if (defaults.hasOwnProperty(key)) {
          const value = defaults[key];
          const type = typeof value === 'boolean' ? 'boolean' : 
                      typeof value === 'number' ? 'number' : 'string';
          const stringValue = value.toString();

          await this.env.BLOG_DB.prepare(`
            UPDATE settings 
            SET value = ?, type = ?, updated_at = ?
            WHERE key = ?
          `).bind(stringValue, type, now, key).run();
        }
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Settings reset to defaults'
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error resetting settings:', error);
      return new Response(JSON.stringify({
        error: 'Failed to reset settings',
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
   * Get available setting groups
   */
  async getGroups(request, user) {
    try {
      const results = await this.env.BLOG_DB.prepare(`
        SELECT 
          group_name,
          COUNT(*) as setting_count
        FROM settings 
        GROUP BY group_name 
        ORDER BY group_name
      `).all();

      const groups = results.results.map(group => ({
        name: group.group_name,
        label: this.getGroupLabel(group.group_name),
        count: group.setting_count
      }));

      return new Response(JSON.stringify({
        groups
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error getting setting groups:', error);
      return new Response(JSON.stringify({
        error: 'Failed to fetch setting groups',
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
   * Export settings
   */
  async export(request, user) {
    try {
      const results = await this.env.BLOG_DB.prepare(
        'SELECT key, value, type, group_name FROM settings ORDER BY group_name, key'
      ).all();

      const exportData = {
        exported_at: new Date().toISOString(),
        exported_by: user.email,
        settings: results.results
      };

      return new Response(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="it-era-settings-${new Date().toISOString().split('T')[0]}.json"`,
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error exporting settings:', error);
      return new Response(JSON.stringify({
        error: 'Failed to export settings',
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
   * Import settings
   */
  async import(request, user) {
    try {
      const body = await request.json();
      const { settings } = body;

      if (!settings || !Array.isArray(settings)) {
        return new Response(JSON.stringify({
          error: 'Invalid import format'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      const now = new Date().toISOString();
      let imported = 0;
      let errors = [];

      for (const setting of settings) {
        try {
          const { key, value, type, group_name } = setting;

          await this.env.BLOG_DB.prepare(`
            INSERT OR REPLACE INTO settings (key, value, type, group_name, updated_at)
            VALUES (?, ?, ?, ?, ?)
          `).bind(key, value, type, group_name, now).run();

          imported++;
        } catch (error) {
          errors.push(`Failed to import ${setting.key}: ${error.message}`);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        imported,
        errors: errors.length > 0 ? errors : null
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error importing settings:', error);
      return new Response(JSON.stringify({
        error: 'Failed to import settings',
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
  async logSettingsChange(userId, changes, request) {
    try {
      const ip = request.headers.get('CF-Connecting-IP') || 
                 request.headers.get('X-Forwarded-For') || 
                 'unknown';
      const userAgent = request.headers.get('User-Agent') || '';

      await this.env.BLOG_DB.prepare(`
        INSERT INTO activity_log (
          id, user_id, action, resource_type, new_values,
          ip_address, user_agent, created_at
        ) VALUES (?, ?, 'update', 'settings', ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        userId,
        JSON.stringify(changes),
        ip,
        userAgent,
        new Date().toISOString()
      ).run();
    } catch (error) {
      console.error('Error logging settings change:', error);
    }
  }

  getGroupLabel(groupName) {
    const labels = {
      general: 'General',
      comments: 'Comments',
      appearance: 'Appearance',
      security: 'Security',
      performance: 'Performance',
      integrations: 'Integrations',
      email: 'Email',
      social: 'Social Media'
    };

    return labels[groupName] || groupName.charAt(0).toUpperCase() + groupName.slice(1);
  }
}