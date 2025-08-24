/**
 * Analytics Controller - Comprehensive analytics and reporting
 */

import { corsHeaders } from '../utils/cors.js';

export class AnalyticsController {
  constructor(env) {
    this.env = env;
  }

  /**
   * Get analytics overview
   */
  async getOverview(request, user) {
    try {
      const url = new URL(request.url);
      const period = url.searchParams.get('period') || '30'; // days
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));

      const [pageViews, events, topPosts, trafficSources] = await Promise.all([
        this.getPageViewsStats(startDate),
        this.getEventsStats(startDate),
        this.getTopPosts(startDate, 10),
        this.getTrafficSources(startDate)
      ]);

      return new Response(JSON.stringify({
        period_days: parseInt(period),
        start_date: startDate.toISOString(),
        page_views: pageViews,
        events: events,
        top_posts: topPosts,
        traffic_sources: trafficSources
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error getting analytics overview:', error);
      return new Response(JSON.stringify({
        error: 'Failed to fetch analytics overview',
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
   * Get post-specific analytics
   */
  async getPostAnalytics(request, user) {
    try {
      const url = new URL(request.url);
      const postId = url.searchParams.get('post_id');
      const period = parseInt(url.searchParams.get('period') || '30');

      if (!postId) {
        return new Response(JSON.stringify({
          error: 'Post ID is required'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - period);

      const [postViews, dailyViews, referrers, userEngagement] = await Promise.all([
        this.getPostViewsStats(postId, startDate),
        this.getDailyPostViews(postId, startDate),
        this.getPostReferrers(postId, startDate),
        this.getPostEngagement(postId, startDate)
      ]);

      return new Response(JSON.stringify({
        post_id: postId,
        period_days: period,
        views: postViews,
        daily_views: dailyViews,
        referrers: referrers,
        engagement: userEngagement
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error getting post analytics:', error);
      return new Response(JSON.stringify({
        error: 'Failed to fetch post analytics',
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
   * Get traffic analytics
   */
  async getTrafficAnalytics(request, user) {
    try {
      const url = new URL(request.url);
      const period = parseInt(url.searchParams.get('period') || '30');
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - period);

      const [dailyTraffic, deviceStats, browserStats, locationStats] = await Promise.all([
        this.getDailyTraffic(startDate),
        this.getDeviceStats(startDate),
        this.getBrowserStats(startDate),
        this.getLocationStats(startDate)
      ]);

      return new Response(JSON.stringify({
        period_days: period,
        daily_traffic: dailyTraffic,
        devices: deviceStats,
        browsers: browserStats,
        locations: locationStats
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error getting traffic analytics:', error);
      return new Response(JSON.stringify({
        error: 'Failed to fetch traffic analytics',
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
   * Track analytics event
   */
  async trackEvent(request) {
    try {
      const body = await request.json();
      const {
        event_type,
        page_url,
        page_title,
        referrer,
        post_id,
        metadata = {}
      } = body;

      if (!event_type || !page_url) {
        return new Response(JSON.stringify({
          error: 'Event type and page URL are required'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Get client info
      const ip = request.headers.get('CF-Connecting-IP') || 
                 request.headers.get('X-Forwarded-For') || 
                 'unknown';
      const userAgent = request.headers.get('User-Agent') || '';

      const eventId = crypto.randomUUID();
      const sessionId = this.generateSessionId(ip, userAgent);

      await this.env.BLOG_DB.prepare(`
        INSERT INTO analytics_events (
          id, event_type, page_url, page_title, referrer,
          user_agent, ip_address, session_id, post_id, metadata,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        eventId, event_type, page_url, page_title, referrer,
        userAgent, ip, sessionId, post_id, JSON.stringify(metadata),
        new Date().toISOString()
      ).run();

      // If it's a page view, also add to page_views table
      if (event_type === 'page_view') {
        const viewId = crypto.randomUUID();
        await this.env.BLOG_DB.prepare(`
          INSERT INTO page_views (
            id, page_url, page_title, post_id, session_id,
            ip_address, user_agent, referrer, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          viewId, page_url, page_title, post_id, sessionId,
          ip, userAgent, referrer, new Date().toISOString()
        ).run();

        // Update post view count if it's a post page
        if (post_id) {
          await this.env.BLOG_DB.prepare(
            'UPDATE posts SET view_count = view_count + 1 WHERE id = ?'
          ).bind(post_id).run();
        }
      }

      return new Response(JSON.stringify({
        success: true,
        event_id: eventId
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error tracking event:', error);
      return new Response(JSON.stringify({
        error: 'Failed to track event',
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
   * Helper methods for analytics data
   */
  async getPageViewsStats(startDate) {
    try {
      const results = await this.env.BLOG_DB.prepare(`
        SELECT 
          COUNT(*) as total_views,
          COUNT(DISTINCT session_id) as unique_visitors,
          COUNT(DISTINCT page_url) as unique_pages
        FROM page_views 
        WHERE created_at >= ?
      `).bind(startDate.toISOString()).first();

      return results || { total_views: 0, unique_visitors: 0, unique_pages: 0 };

    } catch (error) {
      console.error('Error getting page views stats:', error);
      return { total_views: 0, unique_visitors: 0, unique_pages: 0 };
    }
  }

  async getEventsStats(startDate) {
    try {
      const results = await this.env.BLOG_DB.prepare(`
        SELECT 
          event_type,
          COUNT(*) as count
        FROM analytics_events 
        WHERE created_at >= ?
        GROUP BY event_type
        ORDER BY count DESC
      `).bind(startDate.toISOString()).all();

      return results.results || [];

    } catch (error) {
      console.error('Error getting events stats:', error);
      return [];
    }
  }

  async getTopPosts(startDate, limit = 10) {
    try {
      const results = await this.env.BLOG_DB.prepare(`
        SELECT 
          p.id,
          p.title,
          p.slug,
          COUNT(pv.id) as view_count,
          p.published_at
        FROM posts p
        JOIN page_views pv ON p.id = pv.post_id
        WHERE pv.created_at >= ? AND p.status = 'published'
        GROUP BY p.id
        ORDER BY view_count DESC
        LIMIT ?
      `).bind(startDate.toISOString(), limit).all();

      return results.results || [];

    } catch (error) {
      console.error('Error getting top posts:', error);
      return [];
    }
  }

  async getTrafficSources(startDate) {
    try {
      const results = await this.env.BLOG_DB.prepare(`
        SELECT 
          CASE 
            WHEN referrer IS NULL OR referrer = '' THEN 'Direct'
            WHEN referrer LIKE '%google%' THEN 'Google'
            WHEN referrer LIKE '%facebook%' THEN 'Facebook'
            WHEN referrer LIKE '%twitter%' THEN 'Twitter'
            WHEN referrer LIKE '%linkedin%' THEN 'LinkedIn'
            ELSE 'Other'
          END as source,
          COUNT(*) as visits
        FROM page_views 
        WHERE created_at >= ?
        GROUP BY source
        ORDER BY visits DESC
      `).bind(startDate.toISOString()).all();

      return results.results || [];

    } catch (error) {
      console.error('Error getting traffic sources:', error);
      return [];
    }
  }

  async getDailyTraffic(startDate) {
    try {
      const results = await this.env.BLOG_DB.prepare(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as views,
          COUNT(DISTINCT session_id) as visitors
        FROM page_views 
        WHERE created_at >= ?
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `).bind(startDate.toISOString()).all();

      return results.results || [];

    } catch (error) {
      console.error('Error getting daily traffic:', error);
      return [];
    }
  }

  async getDeviceStats(startDate) {
    try {
      // Parse user agent to determine device type
      const results = await this.env.BLOG_DB.prepare(`
        SELECT 
          CASE 
            WHEN user_agent LIKE '%Mobile%' THEN 'Mobile'
            WHEN user_agent LIKE '%Tablet%' THEN 'Tablet'
            ELSE 'Desktop'
          END as device_type,
          COUNT(*) as count
        FROM page_views 
        WHERE created_at >= ?
        GROUP BY device_type
        ORDER BY count DESC
      `).bind(startDate.toISOString()).all();

      return results.results || [];

    } catch (error) {
      console.error('Error getting device stats:', error);
      return [];
    }
  }

  async getBrowserStats(startDate) {
    try {
      const results = await this.env.BLOG_DB.prepare(`
        SELECT 
          CASE 
            WHEN user_agent LIKE '%Chrome%' THEN 'Chrome'
            WHEN user_agent LIKE '%Firefox%' THEN 'Firefox'
            WHEN user_agent LIKE '%Safari%' THEN 'Safari'
            WHEN user_agent LIKE '%Edge%' THEN 'Edge'
            ELSE 'Other'
          END as browser,
          COUNT(*) as count
        FROM page_views 
        WHERE created_at >= ?
        GROUP BY browser
        ORDER BY count DESC
      `).bind(startDate.toISOString()).all();

      return results.results || [];

    } catch (error) {
      console.error('Error getting browser stats:', error);
      return [];
    }
  }

  async getLocationStats(startDate) {
    try {
      // This would typically use IP geolocation
      // For now, return mock data
      return [
        { country: 'Italy', visits: 450 },
        { country: 'United States', visits: 120 },
        { country: 'Germany', visits: 89 },
        { country: 'France', visits: 67 },
        { country: 'United Kingdom', visits: 45 }
      ];

    } catch (error) {
      console.error('Error getting location stats:', error);
      return [];
    }
  }

  generateSessionId(ip, userAgent) {
    // Generate session ID based on IP and user agent
    const data = ip + userAgent + Math.floor(Date.now() / (1000 * 60 * 30)); // 30-minute sessions
    return btoa(data).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }
}