/**
 * Webhooks Controller - External integrations management
 */

import { corsHeaders } from '../utils/cors.js';
import { generateSecureToken } from '../utils/crypto.js';

export class WebhooksController {
  constructor(env) {
    this.env = env;
  }

  /**
   * List all webhooks
   */
  async list(request, user) {
    try {
      const url = new URL(request.url);
      const active = url.searchParams.get('active');

      let query = `
        SELECT 
          w.*,
          u.name as created_by_name
        FROM webhooks w
        LEFT JOIN users u ON w.created_by = u.id
        WHERE 1=1
      `;
      
      const params = [];

      if (active !== null) {
        query += ' AND w.active = ?';
        params.push(active === 'true' ? 1 : 0);
      }

      query += ' ORDER BY w.created_at DESC';

      const results = await this.env.BLOG_DB.prepare(query).bind(...params).all();

      const webhooks = results.results.map(webhook => ({
        ...webhook,
        events: webhook.events ? JSON.parse(webhook.events) : [],
        // Don't expose the secret in the list
        secret: webhook.secret ? '***' : null
      }));

      return new Response(JSON.stringify({
        webhooks
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error listing webhooks:', error);
      return new Response(JSON.stringify({
        error: 'Failed to fetch webhooks',
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
   * Create new webhook
   */
  async create(request, user) {
    try {
      const body = await request.json();
      
      const {
        name,
        url: webhookUrl,
        events = [],
        generate_secret = true
      } = body;

      if (!name || !webhookUrl) {
        return new Response(JSON.stringify({
          error: 'Name and URL are required'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Validate URL
      try {
        new URL(webhookUrl);
      } catch {
        return new Response(JSON.stringify({
          error: 'Invalid URL format'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Validate events
      const validEvents = [
        'post.created', 'post.updated', 'post.published', 'post.deleted',
        'comment.created', 'comment.approved', 'comment.deleted',
        'user.created', 'user.updated', 'user.deleted',
        'media.uploaded', 'media.deleted'
      ];

      const invalidEvents = events.filter(event => !validEvents.includes(event));
      if (invalidEvents.length > 0) {
        return new Response(JSON.stringify({
          error: 'Invalid event types',
          invalid_events: invalidEvents,
          valid_events: validEvents
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      const webhookId = crypto.randomUUID();
      const secret = generate_secret ? generateSecureToken(32) : null;
      const now = new Date().toISOString();

      await this.env.BLOG_DB.prepare(`
        INSERT INTO webhooks (
          id, name, url, events, secret, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        webhookId, name, webhookUrl, JSON.stringify(events),
        secret, user.id, now, now
      ).run();

      // Get created webhook
      const webhook = await this.env.BLOG_DB.prepare(
        'SELECT * FROM webhooks WHERE id = ?'
      ).bind(webhookId).first();

      return new Response(JSON.stringify({
        success: true,
        webhook: {
          ...webhook,
          events: JSON.parse(webhook.events),
          secret: secret // Show secret only on creation
        }
      }), {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error creating webhook:', error);
      return new Response(JSON.stringify({
        error: 'Failed to create webhook',
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
   * Update webhook
   */
  async update(id, request, user) {
    try {
      const body = await request.json();

      // Get existing webhook
      const existingWebhook = await this.env.BLOG_DB.prepare(
        'SELECT * FROM webhooks WHERE id = ?'
      ).bind(id).first();

      if (!existingWebhook) {
        return new Response(JSON.stringify({
          error: 'Webhook not found'
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      const {
        name,
        url: webhookUrl,
        events,
        active,
        regenerate_secret = false
      } = body;

      // Validate URL if provided
      if (webhookUrl) {
        try {
          new URL(webhookUrl);
        } catch {
          return new Response(JSON.stringify({
            error: 'Invalid URL format'
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }
      }

      let newSecret = existingWebhook.secret;
      if (regenerate_secret) {
        newSecret = generateSecureToken(32);
      }

      const now = new Date().toISOString();

      await this.env.BLOG_DB.prepare(`
        UPDATE webhooks SET
          name = COALESCE(?, name),
          url = COALESCE(?, url),
          events = COALESCE(?, events),
          active = COALESCE(?, active),
          secret = ?,
          updated_at = ?
        WHERE id = ?
      `).bind(
        name, webhookUrl,
        events ? JSON.stringify(events) : null,
        active, newSecret, now, id
      ).run();

      // Get updated webhook
      const webhook = await this.env.BLOG_DB.prepare(
        'SELECT * FROM webhooks WHERE id = ?'
      ).bind(id).first();

      return new Response(JSON.stringify({
        success: true,
        webhook: {
          ...webhook,
          events: JSON.parse(webhook.events),
          secret: regenerate_secret ? newSecret : '***' // Show new secret only if regenerated
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error updating webhook:', error);
      return new Response(JSON.stringify({
        error: 'Failed to update webhook',
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
   * Delete webhook
   */
  async delete(id, user) {
    try {
      const webhook = await this.env.BLOG_DB.prepare(
        'SELECT * FROM webhooks WHERE id = ?'
      ).bind(id).first();

      if (!webhook) {
        return new Response(JSON.stringify({
          error: 'Webhook not found'
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      await this.env.BLOG_DB.prepare(
        'DELETE FROM webhooks WHERE id = ?'
      ).bind(id).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'Webhook deleted successfully'
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error deleting webhook:', error);
      return new Response(JSON.stringify({
        error: 'Failed to delete webhook',
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
   * Test webhook
   */
  async test(id, request, user) {
    try {
      const webhook = await this.env.BLOG_DB.prepare(
        'SELECT * FROM webhooks WHERE id = ?'
      ).bind(id).first();

      if (!webhook) {
        return new Response(JSON.stringify({
          error: 'Webhook not found'
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Send test payload
      const testPayload = {
        event: 'webhook.test',
        timestamp: new Date().toISOString(),
        data: {
          message: 'This is a test webhook from IT-ERA Admin Panel'
        }
      };

      const success = await this.sendWebhook(webhook, testPayload);

      if (success) {
        // Update success count
        await this.env.BLOG_DB.prepare(`
          UPDATE webhooks SET 
            success_count = success_count + 1,
            last_triggered = ?
          WHERE id = ?
        `).bind(new Date().toISOString(), id).run();
      } else {
        // Update failure count
        await this.env.BLOG_DB.prepare(`
          UPDATE webhooks SET failure_count = failure_count + 1
          WHERE id = ?
        `).bind(id).run();
      }

      return new Response(JSON.stringify({
        success,
        message: success ? 'Test webhook sent successfully' : 'Test webhook failed'
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error testing webhook:', error);
      return new Response(JSON.stringify({
        error: 'Failed to test webhook',
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
   * Get webhook statistics
   */
  async getStats(request, user) {
    try {
      const [totalWebhooks, activeWebhooks, recentActivity] = await Promise.all([
        // Total webhooks
        this.env.BLOG_DB.prepare('SELECT COUNT(*) as count FROM webhooks').first(),
        
        // Active webhooks
        this.env.BLOG_DB.prepare('SELECT COUNT(*) as count FROM webhooks WHERE active = 1').first(),
        
        // Recent activity
        this.env.BLOG_DB.prepare(`
          SELECT 
            SUM(success_count) as total_success,
            SUM(failure_count) as total_failures
          FROM webhooks
        `).first()
      ]);

      return new Response(JSON.stringify({
        total_webhooks: totalWebhooks.count,
        active_webhooks: activeWebhooks.count,
        total_success: recentActivity.total_success || 0,
        total_failures: recentActivity.total_failures || 0
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error getting webhook stats:', error);
      return new Response(JSON.stringify({
        error: 'Failed to get webhook statistics',
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
   * Trigger webhooks for an event
   */
  async triggerWebhooks(eventType, data) {
    try {
      // Get all active webhooks that listen to this event
      const webhooks = await this.env.BLOG_DB.prepare(`
        SELECT * FROM webhooks 
        WHERE active = 1 
        AND events LIKE ?
      `).bind(`%"${eventType}"%`).all();

      const payload = {
        event: eventType,
        timestamp: new Date().toISOString(),
        data
      };

      // Send webhooks in parallel
      const promises = webhooks.results.map(async (webhook) => {
        const success = await this.sendWebhook(webhook, payload);
        
        // Update webhook stats
        const updateField = success ? 'success_count' : 'failure_count';
        await this.env.BLOG_DB.prepare(`
          UPDATE webhooks SET 
            ${updateField} = ${updateField} + 1,
            last_triggered = ?
          WHERE id = ?
        `).bind(new Date().toISOString(), webhook.id).run();

        return { webhook: webhook.id, success };
      });

      const results = await Promise.all(promises);
      console.log(`Triggered ${results.length} webhooks for event ${eventType}`);

    } catch (error) {
      console.error('Error triggering webhooks:', error);
    }
  }

  /**
   * Send individual webhook
   */
  async sendWebhook(webhook, payload) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'IT-ERA-Webhook/1.0'
      };

      // Add signature if secret is configured
      if (webhook.secret) {
        const signature = await this.generateSignature(webhook.secret, JSON.stringify(payload));
        headers['X-Webhook-Signature'] = `sha256=${signature}`;
      }

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      return response.ok;

    } catch (error) {
      console.error(`Error sending webhook to ${webhook.url}:`, error);
      return false;
    }
  }

  /**
   * Generate webhook signature
   */
  async generateSignature(secret, payload) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );

    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}