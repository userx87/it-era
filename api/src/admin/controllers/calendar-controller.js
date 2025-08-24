/**
 * Calendar Controller - Editorial calendar and content planning
 */

import { corsHeaders } from '../utils/cors.js';

export class CalendarController {
  constructor(env) {
    this.env = env;
  }

  /**
   * Get calendar events
   */
  async getCalendar(request, user) {
    try {
      const url = new URL(request.url);
      const start = url.searchParams.get('start');
      const end = url.searchParams.get('end');
      const type = url.searchParams.get('type');

      let query = `
        SELECT 
          ce.*,
          u.name as assigned_name,
          p.title as post_title,
          p.slug as post_slug
        FROM calendar_events ce
        LEFT JOIN users u ON ce.assigned_to = u.id
        LEFT JOIN posts p ON ce.post_id = p.id
        WHERE 1=1
      `;
      
      const params = [];

      if (start) {
        query += ' AND ce.start_date >= ?';
        params.push(start);
      }

      if (end) {
        query += ' AND ce.start_date <= ?';
        params.push(end);
      }

      if (type) {
        query += ' AND ce.event_type = ?';
        params.push(type);
      }

      // Role-based filtering for authors
      if (user.role === 'author') {
        query += ' AND (ce.assigned_to = ? OR ce.created_by = ?)';
        params.push(user.id, user.id);
      }

      query += ' ORDER BY ce.start_date ASC';

      const results = await this.env.BLOG_DB.prepare(query).bind(...params).all();

      const events = results.results.map(event => ({
        ...event,
        metadata: event.metadata ? JSON.parse(event.metadata) : {}
      }));

      return new Response(JSON.stringify({
        events
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error getting calendar:', error);
      return new Response(JSON.stringify({
        error: 'Failed to fetch calendar events',
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
   * Create calendar event
   */
  async createEvent(request, user) {
    try {
      const body = await request.json();
      
      const {
        title,
        description,
        start_date,
        end_date,
        event_type = 'post',
        assigned_to,
        post_id,
        metadata = {}
      } = body;

      if (!title || !start_date) {
        return new Response(JSON.stringify({
          error: 'Title and start date are required'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Validate event type
      const validTypes = ['post', 'campaign', 'deadline', 'meeting'];
      if (!validTypes.includes(event_type)) {
        return new Response(JSON.stringify({
          error: 'Invalid event type'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Validate assigned user if provided
      if (assigned_to) {
        const assignedUser = await this.env.BLOG_DB.prepare(
          'SELECT id FROM users WHERE id = ? AND active = 1'
        ).bind(assigned_to).first();

        if (!assignedUser) {
          return new Response(JSON.stringify({
            error: 'Assigned user not found'
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }
      }

      const eventId = crypto.randomUUID();
      const now = new Date().toISOString();

      await this.env.BLOG_DB.prepare(`
        INSERT INTO calendar_events (
          id, title, description, start_date, end_date, event_type,
          assigned_to, post_id, metadata, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        eventId, title, description, start_date, end_date, event_type,
        assigned_to, post_id, JSON.stringify(metadata), user.id, now, now
      ).run();

      // Get created event with relations
      const event = await this.env.BLOG_DB.prepare(`
        SELECT 
          ce.*,
          u.name as assigned_name,
          p.title as post_title
        FROM calendar_events ce
        LEFT JOIN users u ON ce.assigned_to = u.id
        LEFT JOIN posts p ON ce.post_id = p.id
        WHERE ce.id = ?
      `).bind(eventId).first();

      return new Response(JSON.stringify({
        success: true,
        event: {
          ...event,
          metadata: JSON.parse(event.metadata || '{}')
        }
      }), {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error creating calendar event:', error);
      return new Response(JSON.stringify({
        error: 'Failed to create calendar event',
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
   * Update calendar event
   */
  async updateEvent(id, request, user) {
    try {
      const body = await request.json();

      // Get existing event
      const existingEvent = await this.env.BLOG_DB.prepare(
        'SELECT * FROM calendar_events WHERE id = ?'
      ).bind(id).first();

      if (!existingEvent) {
        return new Response(JSON.stringify({
          error: 'Calendar event not found'
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Check permissions
      if (user.role === 'author' && 
          existingEvent.created_by !== user.id && 
          existingEvent.assigned_to !== user.id) {
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

      const {
        title,
        description,
        start_date,
        end_date,
        event_type,
        status,
        assigned_to,
        post_id,
        metadata
      } = body;

      // Validate status if provided
      if (status) {
        const validStatuses = ['planned', 'in_progress', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
          return new Response(JSON.stringify({
            error: 'Invalid status'
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

      await this.env.BLOG_DB.prepare(`
        UPDATE calendar_events SET
          title = COALESCE(?, title),
          description = COALESCE(?, description),
          start_date = COALESCE(?, start_date),
          end_date = COALESCE(?, end_date),
          event_type = COALESCE(?, event_type),
          status = COALESCE(?, status),
          assigned_to = COALESCE(?, assigned_to),
          post_id = COALESCE(?, post_id),
          metadata = COALESCE(?, metadata),
          updated_at = ?
        WHERE id = ?
      `).bind(
        title, description, start_date, end_date, event_type,
        status, assigned_to, post_id,
        metadata ? JSON.stringify(metadata) : null,
        now, id
      ).run();

      // Get updated event
      const updatedEvent = await this.env.BLOG_DB.prepare(`
        SELECT 
          ce.*,
          u.name as assigned_name,
          p.title as post_title
        FROM calendar_events ce
        LEFT JOIN users u ON ce.assigned_to = u.id
        LEFT JOIN posts p ON ce.post_id = p.id
        WHERE ce.id = ?
      `).bind(id).first();

      return new Response(JSON.stringify({
        success: true,
        event: {
          ...updatedEvent,
          metadata: JSON.parse(updatedEvent.metadata || '{}')
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error updating calendar event:', error);
      return new Response(JSON.stringify({
        error: 'Failed to update calendar event',
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
   * Delete calendar event
   */
  async deleteEvent(id, user) {
    try {
      const event = await this.env.BLOG_DB.prepare(
        'SELECT * FROM calendar_events WHERE id = ?'
      ).bind(id).first();

      if (!event) {
        return new Response(JSON.stringify({
          error: 'Calendar event not found'
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Check permissions
      if (user.role === 'author' && 
          event.created_by !== user.id && 
          event.assigned_to !== user.id) {
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

      await this.env.BLOG_DB.prepare(
        'DELETE FROM calendar_events WHERE id = ?'
      ).bind(id).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'Calendar event deleted successfully'
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error deleting calendar event:', error);
      return new Response(JSON.stringify({
        error: 'Failed to delete calendar event',
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
   * Get calendar statistics
   */
  async getStats(request, user) {
    try {
      const [totalEvents, upcomingEvents, overdueTasks, completedThisMonth] = await Promise.all([
        // Total events
        this.env.BLOG_DB.prepare('SELECT COUNT(*) as count FROM calendar_events').first(),
        
        // Upcoming events (next 7 days)
        this.env.BLOG_DB.prepare(`
          SELECT COUNT(*) as count FROM calendar_events 
          WHERE start_date BETWEEN datetime('now') AND datetime('now', '+7 days')
          AND status != 'completed' AND status != 'cancelled'
        `).first(),
        
        // Overdue tasks
        this.env.BLOG_DB.prepare(`
          SELECT COUNT(*) as count FROM calendar_events 
          WHERE start_date < datetime('now')
          AND status NOT IN ('completed', 'cancelled')
        `).first(),
        
        // Completed this month
        this.env.BLOG_DB.prepare(`
          SELECT COUNT(*) as count FROM calendar_events 
          WHERE status = 'completed'
          AND updated_at >= datetime('now', 'start of month')
        `).first()
      ]);

      return new Response(JSON.stringify({
        total_events: totalEvents.count,
        upcoming_events: upcomingEvents.count,
        overdue_tasks: overdueTasks.count,
        completed_this_month: completedThisMonth.count
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error getting calendar stats:', error);
      return new Response(JSON.stringify({
        error: 'Failed to get calendar statistics',
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
   * Get user's assignments
   */
  async getUserAssignments(request, user) {
    try {
      const url = new URL(request.url);
      const status = url.searchParams.get('status');

      let query = `
        SELECT 
          ce.*,
          p.title as post_title,
          p.slug as post_slug
        FROM calendar_events ce
        LEFT JOIN posts p ON ce.post_id = p.id
        WHERE ce.assigned_to = ?
      `;
      
      const params = [user.id];

      if (status) {
        query += ' AND ce.status = ?';
        params.push(status);
      }

      query += ' ORDER BY ce.start_date ASC';

      const results = await this.env.BLOG_DB.prepare(query).bind(...params).all();

      const assignments = results.results.map(event => ({
        ...event,
        metadata: event.metadata ? JSON.parse(event.metadata) : {}
      }));

      return new Response(JSON.stringify({
        assignments
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error getting user assignments:', error);
      return new Response(JSON.stringify({
        error: 'Failed to fetch user assignments',
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