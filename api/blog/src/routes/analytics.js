const express = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const database = require('../../config/database');

const router = express.Router();

// Helper function to record analytics event
const recordAnalytics = async (metricName, value, postId = null, categoryId = null, additionalData = null) => {
  try {
    await database.run(`
      INSERT INTO analytics (metric_name, metric_value, post_id, category_id, date_recorded, additional_data)
      VALUES (?, ?, ?, ?, DATE('now'), ?)
    `, [metricName, value, postId, categoryId, additionalData ? JSON.stringify(additionalData) : null]);
  } catch (error) {
    console.error('Analytics recording error:', error);
  }
};

// POST /api/analytics/track - Track analytics events (public endpoint)
router.post('/track',
  asyncHandler(async (req, res) => {
    const { event, post_id, category_id, value = 1, metadata } = req.body;

    if (!event) {
      return res.status(400).json({
        success: false,
        error: 'Evento richiesto',
        code: 'EVENT_REQUIRED'
      });
    }

    // Validate event types
    const allowedEvents = [
      'page_view', 'post_view', 'post_like', 'post_share',
      'category_view', 'search', 'contact_form', 'newsletter_signup'
    ];

    if (!allowedEvents.includes(event)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo evento non valido',
        code: 'INVALID_EVENT_TYPE'
      });
    }

    // Record the analytics event
    await recordAnalytics(event, value, post_id, category_id, {
      ...metadata,
      ip: req.ip,
      user_agent: req.get('User-Agent'),
      referer: req.get('Referer'),
      timestamp: new Date().toISOString()
    });

    // Update specific counters
    if (event === 'post_view' && post_id) {
      await database.run('UPDATE posts SET view_count = view_count + 1 WHERE id = ?', [post_id]);
    } else if (event === 'post_like' && post_id) {
      await database.run('UPDATE posts SET like_count = like_count + 1 WHERE id = ?', [post_id]);
    }

    res.json({
      success: true,
      message: 'Evento registrato con successo'
    });
  })
);

// GET /api/analytics/dashboard - Analytics dashboard data
router.get('/dashboard',
  verifyToken,
  requireRole(['admin', 'editor']),
  asyncHandler(async (req, res) => {
    const timeframe = req.query.timeframe || '30'; // days

    // Get total page views
    const pageViews = await database.get(`
      SELECT SUM(metric_value) as total
      FROM analytics 
      WHERE metric_name = 'page_view' 
      AND date_recorded >= date('now', '-${timeframe} days')
    `);

    // Get post views
    const postViews = await database.get(`
      SELECT SUM(metric_value) as total
      FROM analytics 
      WHERE metric_name = 'post_view' 
      AND date_recorded >= date('now', '-${timeframe} days')
    `);

    // Get daily views for chart
    const dailyViews = await database.all(`
      SELECT 
        date_recorded,
        SUM(CASE WHEN metric_name = 'page_view' THEN metric_value ELSE 0 END) as page_views,
        SUM(CASE WHEN metric_name = 'post_view' THEN metric_value ELSE 0 END) as post_views
      FROM analytics 
      WHERE date_recorded >= date('now', '-${timeframe} days')
      GROUP BY date_recorded
      ORDER BY date_recorded ASC
    `);

    // Get top posts by views
    const topPosts = await database.all(`
      SELECT 
        p.id, p.title, p.slug,
        SUM(a.metric_value) as total_views
      FROM analytics a
      JOIN posts p ON a.post_id = p.id
      WHERE a.metric_name = 'post_view' 
      AND a.date_recorded >= date('now', '-${timeframe} days')
      GROUP BY p.id
      ORDER BY total_views DESC
      LIMIT 10
    `);

    // Get top categories
    const topCategories = await database.all(`
      SELECT 
        c.name, c.slug,
        SUM(a.metric_value) as total_views
      FROM analytics a
      JOIN categories c ON a.category_id = c.id
      WHERE a.metric_name = 'category_view' 
      AND a.date_recorded >= date('now', '-${timeframe} days')
      GROUP BY c.id
      ORDER BY total_views DESC
      LIMIT 10
    `);

    // Get search queries
    const searchQueries = await database.all(`
      SELECT 
        JSON_EXTRACT(additional_data, '$.query') as query,
        COUNT(*) as search_count
      FROM analytics 
      WHERE metric_name = 'search' 
      AND date_recorded >= date('now', '-${timeframe} days')
      AND JSON_EXTRACT(additional_data, '$.query') IS NOT NULL
      GROUP BY JSON_EXTRACT(additional_data, '$.query')
      ORDER BY search_count DESC
      LIMIT 20
    `);

    // Get traffic sources (from referers)
    const trafficSources = await database.all(`
      SELECT 
        CASE 
          WHEN JSON_EXTRACT(additional_data, '$.referer') IS NULL OR JSON_EXTRACT(additional_data, '$.referer') = '' THEN 'Direct'
          WHEN JSON_EXTRACT(additional_data, '$.referer') LIKE '%google%' THEN 'Google'
          WHEN JSON_EXTRACT(additional_data, '$.referer') LIKE '%facebook%' THEN 'Facebook'
          WHEN JSON_EXTRACT(additional_data, '$.referer') LIKE '%linkedin%' THEN 'LinkedIn'
          WHEN JSON_EXTRACT(additional_data, '$.referer') LIKE '%twitter%' THEN 'Twitter'
          ELSE 'Other'
        END as source,
        COUNT(*) as visits
      FROM analytics 
      WHERE metric_name IN ('page_view', 'post_view')
      AND date_recorded >= date('now', '-${timeframe} days')
      GROUP BY source
      ORDER BY visits DESC
    `);

    // Get engagement metrics
    const engagement = await database.all(`
      SELECT 
        metric_name,
        SUM(metric_value) as total
      FROM analytics 
      WHERE metric_name IN ('post_like', 'post_share', 'newsletter_signup', 'contact_form')
      AND date_recorded >= date('now', '-${timeframe} days')
      GROUP BY metric_name
    `);

    res.json({
      success: true,
      data: {
        timeframe: `${timeframe} giorni`,
        summary: {
          page_views: pageViews.total || 0,
          post_views: postViews.total || 0,
          total_likes: engagement.find(e => e.metric_name === 'post_like')?.total || 0,
          total_shares: engagement.find(e => e.metric_name === 'post_share')?.total || 0,
          newsletter_signups: engagement.find(e => e.metric_name === 'newsletter_signup')?.total || 0,
          contact_forms: engagement.find(e => e.metric_name === 'contact_form')?.total || 0
        },
        charts: {
          daily_views: dailyViews,
          traffic_sources: trafficSources
        },
        top_content: {
          posts: topPosts,
          categories: topCategories
        },
        search_queries: searchQueries,
        engagement: engagement
      }
    });
  })
);

// GET /api/analytics/posts/:id - Analytics for specific post
router.get('/posts/:id',
  verifyToken,
  requireRole(['admin', 'editor', 'author']),
  asyncHandler(async (req, res) => {
    const postId = req.params.id;
    const timeframe = req.query.timeframe || '30';

    // Check if post exists
    const post = await database.get(
      'SELECT id, title, slug, published_at, view_count FROM posts WHERE id = ?',
      [postId]
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post non trovato',
        code: 'POST_NOT_FOUND'
      });
    }

    // Get daily views for this post
    const dailyViews = await database.all(`
      SELECT 
        date_recorded,
        SUM(metric_value) as views
      FROM analytics 
      WHERE post_id = ? 
      AND metric_name = 'post_view'
      AND date_recorded >= date('now', '-${timeframe} days')
      GROUP BY date_recorded
      ORDER BY date_recorded ASC
    `, [postId]);

    // Get engagement metrics for this post
    const engagement = await database.all(`
      SELECT 
        metric_name,
        SUM(metric_value) as total
      FROM analytics 
      WHERE post_id = ?
      AND metric_name IN ('post_like', 'post_share')
      AND date_recorded >= date('now', '-${timeframe} days')
      GROUP BY metric_name
    `, [postId]);

    // Get traffic sources for this post
    const trafficSources = await database.all(`
      SELECT 
        CASE 
          WHEN JSON_EXTRACT(additional_data, '$.referer') IS NULL OR JSON_EXTRACT(additional_data, '$.referer') = '' THEN 'Direct'
          WHEN JSON_EXTRACT(additional_data, '$.referer') LIKE '%google%' THEN 'Google'
          WHEN JSON_EXTRACT(additional_data, '$.referer') LIKE '%facebook%' THEN 'Facebook'
          WHEN JSON_EXTRACT(additional_data, '$.referer') LIKE '%linkedin%' THEN 'LinkedIn'
          WHEN JSON_EXTRACT(additional_data, '$.referer') LIKE '%twitter%' THEN 'Twitter'
          ELSE 'Other'
        END as source,
        COUNT(*) as visits
      FROM analytics 
      WHERE post_id = ?
      AND metric_name = 'post_view'
      AND date_recorded >= date('now', '-${timeframe} days')
      GROUP BY source
      ORDER BY visits DESC
    `, [postId]);

    // Calculate total analytics views vs database view_count
    const totalAnalyticsViews = dailyViews.reduce((sum, day) => sum + day.views, 0);

    res.json({
      success: true,
      data: {
        post: post,
        timeframe: `${timeframe} giorni`,
        analytics: {
          total_views: totalAnalyticsViews,
          database_views: post.view_count,
          total_likes: engagement.find(e => e.metric_name === 'post_like')?.total || 0,
          total_shares: engagement.find(e => e.metric_name === 'post_share')?.total || 0
        },
        charts: {
          daily_views: dailyViews,
          traffic_sources: trafficSources
        }
      }
    });
  })
);

// GET /api/analytics/export - Export analytics data
router.get('/export',
  verifyToken,
  requireRole(['admin']),
  asyncHandler(async (req, res) => {
    const format = req.query.format || 'json';
    const timeframe = req.query.timeframe || '30';
    const metric = req.query.metric;

    let whereClause = `WHERE date_recorded >= date('now', '-${timeframe} days')`;
    const params = [];

    if (metric) {
      whereClause += ' AND metric_name = ?';
      params.push(metric);
    }

    const analytics = await database.all(`
      SELECT 
        a.*,
        p.title as post_title,
        p.slug as post_slug,
        c.name as category_name
      FROM analytics a
      LEFT JOIN posts p ON a.post_id = p.id
      LEFT JOIN categories c ON a.category_id = c.id
      ${whereClause}
      ORDER BY a.date_recorded DESC, a.created_at DESC
    `, params);

    if (format === 'csv') {
      const csvHeader = 'Date,Metric,Value,Post Title,Category,Additional Data\n';
      const csvRows = analytics.map(row => 
        `${row.date_recorded},"${row.metric_name}",${row.metric_value},"${row.post_title || ''}","${row.category_name || '"}","${row.additional_data || ''}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="analytics-export.csv"');
      res.send(csvHeader + csvRows);
    } else {
      res.json({
        success: true,
        data: {
          analytics: analytics,
          total: analytics.length,
          timeframe: `${timeframe} giorni`,
          exported_at: new Date().toISOString()
        }
      });
    }
  })
);

// POST /api/analytics/custom-event - Track custom analytics event
router.post('/custom-event',
  verifyToken,
  requireRole(['admin', 'editor']),
  asyncHandler(async (req, res) => {
    const { metric_name, metric_value = 1, post_id, category_id, description, metadata } = req.body;

    if (!metric_name) {
      return res.status(400).json({
        success: false,
        error: 'Nome metrica richiesto',
        code: 'METRIC_NAME_REQUIRED'
      });
    }

    // Record custom event
    await recordAnalytics(metric_name, metric_value, post_id, category_id, {
      ...metadata,
      description,
      recorded_by: req.user.username,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Evento personalizzato registrato con successo'
    });
  })
);

// GET /api/analytics/realtime - Real-time analytics (recent activity)
router.get('/realtime',
  verifyToken,
  requireRole(['admin', 'editor']),
  asyncHandler(async (req, res) => {
    const minutes = parseInt(req.query.minutes) || 60; // Default last 60 minutes

    // Get recent activity
    const recentActivity = await database.all(`
      SELECT 
        a.*,
        p.title as post_title,
        p.slug as post_slug
      FROM analytics a
      LEFT JOIN posts p ON a.post_id = p.id
      WHERE a.created_at >= datetime('now', '-${minutes} minutes')
      ORDER BY a.created_at DESC
      LIMIT 100
    `);

    // Get activity counts by minute for the chart
    const activityByMinute = await database.all(`
      SELECT 
        strftime('%H:%M', created_at) as minute,
        COUNT(*) as events
      FROM analytics 
      WHERE created_at >= datetime('now', '-${minutes} minutes')
      GROUP BY strftime('%H:%M', created_at)
      ORDER BY minute ASC
    `);

    // Get most active posts in the timeframe
    const activePosts = await database.all(`
      SELECT 
        p.id, p.title, p.slug,
        COUNT(*) as events
      FROM analytics a
      JOIN posts p ON a.post_id = p.id
      WHERE a.created_at >= datetime('now', '-${minutes} minutes')
      GROUP BY p.id
      ORDER BY events DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        timeframe: `${minutes} minuti`,
        recent_activity: recentActivity,
        activity_by_minute: activityByMinute,
        active_posts: activePosts,
        total_events: recentActivity.length
      }
    });
  })
);

// DELETE /api/analytics/cleanup - Clean up old analytics data
router.delete('/cleanup',
  verifyToken,
  requireRole(['admin']),
  asyncHandler(async (req, res) => {
    const days = parseInt(req.query.days) || 365; // Default keep 1 year

    // Count records to be deleted
    const { count } = await database.get(
      'SELECT COUNT(*) as count FROM analytics WHERE date_recorded < date("now", ?)',
      [`-${days} days`]
    );

    // Delete old records
    const result = await database.run(
      'DELETE FROM analytics WHERE date_recorded < date("now", ?)',
      [`-${days} days`]
    );

    res.json({
      success: true,
      message: `Pulizia completata: ${result.changes} record eliminati`,
      data: {
        records_deleted: result.changes,
        retention_days: days
      }
    });
  })
);

module.exports = router;