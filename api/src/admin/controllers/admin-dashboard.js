/**
 * Admin Dashboard Controller
 * Provides dashboard statistics and overview data
 */

import { corsHeaders } from '../utils/cors.js';

export class AdminDashboard {
  constructor(env) {
    this.env = env;
  }

  /**
   * Get comprehensive dashboard data
   */
  async getDashboardData(request, user) {
    try {
      const [stats, recentPosts, recentActivity, analytics] = await Promise.all([
        this.getStats(request, user),
        this.getRecentPosts(user),
        this.getRecentActivity(user),
        this.getAnalyticsOverview()
      ]);

      return new Response(JSON.stringify({
        stats: JSON.parse(await stats.text()).stats,
        recent_posts: recentPosts,
        recent_activity: recentActivity,
        analytics: analytics,
        user: {
          name: user.name,
          role: user.role,
          avatar: user.avatar
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error getting dashboard data:', error);
      return new Response(JSON.stringify({
        error: 'Failed to load dashboard data',
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
   * Get dashboard statistics
   */
  async getStats(request, user) {
    try {
      let postsQuery = 'SELECT COUNT(*) as count FROM posts';
      let postsParams = [];

      // Role-based filtering
      if (user.role === 'author') {
        postsQuery += ' WHERE author_id = ?';
        postsParams.push(user.id);
      }

      const [
        totalPosts,
        publishedPosts,
        draftPosts,
        scheduledPosts,
        totalCategories,
        totalTags,
        totalUsers,
        totalMedia
      ] = await Promise.all([
        // Total posts
        this.env.BLOG_DB.prepare(postsQuery).bind(...postsParams).first(),
        
        // Published posts
        this.env.BLOG_DB.prepare(
          postsQuery + (user.role === 'author' ? ' AND' : ' WHERE') + ' status = ?'
        ).bind(...postsParams, 'published').first(),
        
        // Draft posts
        this.env.BLOG_DB.prepare(
          postsQuery + (user.role === 'author' ? ' AND' : ' WHERE') + ' status = ?'
        ).bind(...postsParams, 'draft').first(),
        
        // Scheduled posts
        this.env.BLOG_DB.prepare(
          postsQuery + (user.role === 'author' ? ' AND' : ' WHERE') + ' status = ?'
        ).bind(...postsParams, 'scheduled').first(),
        
        // Categories (admin/editor only)
        user.role !== 'author' ? 
          this.env.BLOG_DB.prepare('SELECT COUNT(*) as count FROM categories WHERE active = 1').first() :
          { count: 0 },
        
        // Tags
        this.env.BLOG_DB.prepare('SELECT COUNT(*) as count FROM tags WHERE active = 1').first(),
        
        // Users (admin only)
        user.role === 'admin' ? 
          this.env.BLOG_DB.prepare('SELECT COUNT(*) as count FROM users WHERE active = 1').first() :
          { count: 0 },
        
        // Media files
        this.env.BLOG_DB.prepare('SELECT COUNT(*) as count FROM media').first()
      ]);

      // Get post views (from analytics)
      const totalViews = await this.getTotalPostViews();

      // Get recent statistics (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentStats = await this.getRecentStats(thirtyDaysAgo.toISOString(), user);

      return new Response(JSON.stringify({
        stats: {
          posts: {
            total: totalPosts.count,
            published: publishedPosts.count,
            draft: draftPosts.count,
            scheduled: scheduledPosts.count
          },
          content: {
            categories: totalCategories.count,
            tags: totalTags.count,
            media: totalMedia.count
          },
          users: {
            total: totalUsers.count
          },
          analytics: {
            total_views: totalViews,
            views_last_30_days: recentStats.views,
            posts_last_30_days: recentStats.posts
          }
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error getting stats:', error);
      return new Response(JSON.stringify({
        error: 'Failed to load statistics',
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
   * Get recent posts
   */
  async getRecentPosts(user) {
    try {
      let query = `
        SELECT p.*, u.name as author_name, c.name as category_name
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        LEFT JOIN categories c ON p.category_id = c.id
      `;
      const params = [];

      if (user.role === 'author') {
        query += ' WHERE p.author_id = ?';
        params.push(user.id);
      }

      query += ' ORDER BY p.created_at DESC LIMIT 10';

      const results = await this.env.BLOG_DB.prepare(query).bind(...params).all();
      return results.results || [];

    } catch (error) {
      console.error('Error getting recent posts:', error);
      return [];
    }
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(user) {
    try {
      // Get recent posts, comments, and other activities
      const activities = [];

      // Recent posts
      let postsQuery = `
        SELECT 'post' as type, id, title as description, status, created_at, author_id
        FROM posts
      `;
      const postsParams = [];

      if (user.role === 'author') {
        postsQuery += ' WHERE author_id = ?';
        postsParams.push(user.id);
      }

      postsQuery += ' ORDER BY created_at DESC LIMIT 20';

      const posts = await this.env.BLOG_DB.prepare(postsQuery).bind(...postsParams).all();

      posts.results.forEach(post => {
        activities.push({
          type: post.type,
          description: `Post "${post.description}" ${post.status === 'published' ? 'published' : 'created'}`,
          timestamp: post.created_at,
          user_id: post.author_id
        });
      });

      // Recent media uploads
      const media = await this.env.BLOG_DB.prepare(`
        SELECT 'media' as type, filename as description, created_at, uploaded_by
        FROM media
        ORDER BY created_at DESC LIMIT 10
      `).all();

      media.results.forEach(item => {
        activities.push({
          type: item.type,
          description: `Media "${item.description}" uploaded`,
          timestamp: item.created_at,
          user_id: item.uploaded_by
        });
      });

      // Sort all activities by timestamp
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return activities.slice(0, 15);

    } catch (error) {
      console.error('Error getting recent activity:', error);
      return [];
    }
  }

  /**
   * Get analytics overview
   */
  async getAnalyticsOverview() {
    try {
      // Get data from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Mock analytics data - in real implementation, this would come from your analytics system
      const analytics = {
        page_views: {
          current_week: 1250,
          previous_week: 980,
          change: 27.6
        },
        unique_visitors: {
          current_week: 890,
          previous_week: 720,
          change: 23.6
        },
        bounce_rate: {
          current_week: 65.4,
          previous_week: 68.2,
          change: -4.1
        },
        avg_session_duration: {
          current_week: 180, // seconds
          previous_week: 165,
          change: 9.1
        },
        top_posts: [
          { title: "Guida completa alla sicurezza informatica", views: 340, url: "/sicurezza-informatica" },
          { title: "Cloud storage per le aziende", views: 280, url: "/cloud-storage" },
          { title: "Assistenza IT a Milano", views: 195, url: "/assistenza-it-milano" },
          { title: "Backup automatico dei dati", views: 150, url: "/backup-dati" },
          { title: "Cybersecurity per PMI", views: 120, url: "/cybersecurity-pmi" }
        ],
        traffic_sources: [
          { source: "Organic Search", percentage: 45.2, visitors: 402 },
          { source: "Direct", percentage: 28.1, visitors: 250 },
          { source: "Social Media", percentage: 15.7, visitors: 140 },
          { source: "Referral", percentage: 8.9, visitors: 79 },
          { source: "Email", percentage: 2.1, visitors: 19 }
        ]
      };

      return analytics;

    } catch (error) {
      console.error('Error getting analytics overview:', error);
      return {};
    }
  }

  /**
   * Helper methods
   */
  async getTotalPostViews() {
    try {
      // This would typically come from your analytics database
      // For now, return a mock value
      return 15420;
    } catch (error) {
      console.error('Error getting total post views:', error);
      return 0;
    }
  }

  async getRecentStats(since, user) {
    try {
      let postsQuery = 'SELECT COUNT(*) as count FROM posts WHERE created_at >= ?';
      const postsParams = [since];

      if (user.role === 'author') {
        postsQuery += ' AND author_id = ?';
        postsParams.push(user.id);
      }

      const recentPosts = await this.env.BLOG_DB.prepare(postsQuery).bind(...postsParams).first();

      return {
        posts: recentPosts.count,
        views: 3240 // Mock value - would come from analytics
      };

    } catch (error) {
      console.error('Error getting recent stats:', error);
      return { posts: 0, views: 0 };
    }
  }
}