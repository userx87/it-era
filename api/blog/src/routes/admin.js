const express = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const database = require('../../config/database');

const router = express.Router();

// GET /admin/api/dashboard - Admin dashboard data
router.get('/dashboard',
  verifyToken,
  requireRole(['admin', 'editor']),
  asyncHandler(async (req, res) => {
    // Get post statistics
    const postStats = await database.all(`
      SELECT 
        status,
        COUNT(*) as count
      FROM posts 
      GROUP BY status
    `);

    // Get total posts count
    const { totalPosts } = await database.get('SELECT COUNT(*) as totalPosts FROM posts');

    // Get posts by service category
    const serviceStats = await database.all(`
      SELECT 
        service_category,
        COUNT(*) as count
      FROM posts 
      WHERE service_category IS NOT NULL
      GROUP BY service_category
    `);

    // Get recent posts
    const recentPosts = await database.all(`
      SELECT 
        id, title, slug, status, published_at, view_count, author_name, created_at
      FROM posts 
      ORDER BY created_at DESC 
      LIMIT 10
    `);

    // Get popular posts (by views)
    const popularPosts = await database.all(`
      SELECT 
        id, title, slug, view_count, published_at, author_name
      FROM posts 
      WHERE status = 'published' AND view_count > 0
      ORDER BY view_count DESC 
      LIMIT 10
    `);

    // Get category statistics
    const categoryStats = await database.all(`
      SELECT 
        c.name,
        c.post_count,
        COUNT(p.id) as active_posts
      FROM categories c
      LEFT JOIN post_categories pc ON c.id = pc.category_id
      LEFT JOIN posts p ON pc.post_id = p.id AND p.status = 'published'
      WHERE c.is_active = 1
      GROUP BY c.id
      ORDER BY c.post_count DESC
      LIMIT 10
    `);

    // Get tag statistics
    const tagStats = await database.all(`
      SELECT 
        t.name,
        t.usage_count,
        COUNT(p.id) as active_posts
      FROM tags t
      LEFT JOIN post_tags pt ON t.id = pt.tag_id
      LEFT JOIN posts p ON pt.post_id = p.id AND p.status = 'published'
      GROUP BY t.id
      ORDER BY t.usage_count DESC
      LIMIT 10
    `);

    // Get user statistics
    const userStats = await database.all(`
      SELECT 
        u.full_name,
        u.role,
        COUNT(p.id) as post_count,
        MAX(p.created_at) as last_post_date
      FROM users u
      LEFT JOIN posts p ON u.id = p.author_id
      WHERE u.is_active = 1
      GROUP BY u.id
      ORDER BY post_count DESC
    `);

    // Get recent webhook activity
    const webhookActivity = await database.all(`
      SELECT 
        webhook_type,
        status,
        created_at,
        error_message
      FROM webhook_logs 
      ORDER BY created_at DESC 
      LIMIT 20
    `);

    // Get monthly post statistics (last 12 months)
    const monthlyStats = await database.all(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as posts_created,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as posts_published
      FROM posts 
      WHERE created_at >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month DESC
    `);

    // Calculate summary metrics
    const summaryStats = {
      totalPosts,
      publishedPosts: postStats.find(s => s.status === 'published')?.count || 0,
      draftPosts: postStats.find(s => s.status === 'draft')?.count || 0,
      scheduledPosts: postStats.find(s => s.status === 'scheduled')?.count || 0,
      totalViews: await database.get('SELECT SUM(view_count) as total FROM posts WHERE status = "published"').then(r => r.total || 0),
      totalCategories: await database.get('SELECT COUNT(*) as total FROM categories WHERE is_active = 1').then(r => r.total),
      totalTags: await database.get('SELECT COUNT(*) as total FROM tags').then(r => r.total),
      totalMedia: await database.get('SELECT COUNT(*) as total FROM media').then(r => r.total)
    };

    res.json({
      success: true,
      data: {
        summary: summaryStats,
        posts: {
          byStatus: postStats,
          byService: serviceStats,
          recent: recentPosts,
          popular: popularPosts,
          monthly: monthlyStats
        },
        categories: categoryStats,
        tags: tagStats,
        users: userStats,
        webhooks: webhookActivity
      }
    });
  })
);

// GET /admin/api/stats/overview - Quick overview stats
router.get('/stats/overview',
  verifyToken,
  requireRole(['admin', 'editor']),
  asyncHandler(async (req, res) => {
    const timeframe = req.query.timeframe || '30'; // days

    // Get posts created in timeframe
    const postsCreated = await database.get(`
      SELECT COUNT(*) as count 
      FROM posts 
      WHERE created_at >= date('now', '-${timeframe} days')
    `);

    // Get posts published in timeframe
    const postsPublished = await database.get(`
      SELECT COUNT(*) as count 
      FROM posts 
      WHERE published_at >= date('now', '-${timeframe} days')
    `);

    // Get total views in timeframe (approximate based on published posts)
    const totalViews = await database.get(`
      SELECT SUM(view_count) as total 
      FROM posts 
      WHERE status = 'published' AND published_at >= date('now', '-${timeframe} days')
    `);

    // Get active users (those who created posts)
    const activeUsers = await database.get(`
      SELECT COUNT(DISTINCT author_id) as count
      FROM posts 
      WHERE created_at >= date('now', '-${timeframe} days')
    `);

    // Get webhook activity
    const webhookActivity = await database.get(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'processed' THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM webhook_logs 
      WHERE created_at >= date('now', '-${timeframe} days')
    `);

    res.json({
      success: true,
      data: {
        timeframe: `${timeframe} giorni`,
        posts_created: postsCreated.count,
        posts_published: postsPublished.count,
        total_views: totalViews.total || 0,
        active_users: activeUsers.count,
        webhook_activity: {
          total: webhookActivity.total,
          successful: webhookActivity.successful,
          failed: webhookActivity.failed
        }
      }
    });
  })
);

// GET /admin/api/posts/scheduled - Get scheduled posts for content calendar
router.get('/posts/scheduled',
  verifyToken,
  requireRole(['admin', 'editor']),
  asyncHandler(async (req, res) => {
    const scheduledPosts = await database.all(`
      SELECT 
        id, title, slug, excerpt, scheduled_for, author_name, service_category,
        created_at, updated_at
      FROM posts 
      WHERE status = 'scheduled' AND scheduled_for IS NOT NULL
      ORDER BY scheduled_for ASC
    `);

    // Group by date for calendar view
    const calendar = {};
    scheduledPosts.forEach(post => {
      const date = post.scheduled_for.split('T')[0]; // Get date part only
      if (!calendar[date]) {
        calendar[date] = [];
      }
      calendar[date].push(post);
    });

    res.json({
      success: true,
      data: {
        scheduled_posts: scheduledPosts,
        calendar: calendar,
        total: scheduledPosts.length
      }
    });
  })
);

// POST /admin/api/posts/bulk-action - Bulk actions on posts
router.post('/posts/bulk-action',
  verifyToken,
  requireRole(['admin', 'editor']),
  asyncHandler(async (req, res) => {
    const { action, post_ids } = req.body;

    if (!action || !post_ids || !Array.isArray(post_ids) || post_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Azione e IDs post richiesti',
        code: 'INVALID_BULK_ACTION'
      });
    }

    const validActions = ['publish', 'unpublish', 'draft', 'archive', 'delete'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        error: `Azione non valida. Azioni permesse: ${validActions.join(', ')}`,
        code: 'INVALID_ACTION'
      });
    }

    let query;
    let params;
    let message;

    switch (action) {
      case 'publish':
        query = `UPDATE posts SET status = 'published', published_at = CURRENT_TIMESTAMP WHERE id IN (${post_ids.map(() => '?').join(',')})`;
        params = post_ids;
        message = `${post_ids.length} post(s) pubblicati`;
        break;

      case 'unpublish':
      case 'draft':
        query = `UPDATE posts SET status = 'draft', published_at = NULL WHERE id IN (${post_ids.map(() => '?').join(',')})`;
        params = post_ids;
        message = `${post_ids.length} post(s) rimossi dalla pubblicazione`;
        break;

      case 'archive':
        query = `UPDATE posts SET status = 'archived' WHERE id IN (${post_ids.map(() => '?').join(',')})`;
        params = post_ids;
        message = `${post_ids.length} post(s) archiviati`;
        break;

      case 'delete':
        // Only admins can bulk delete
        if (req.user.role !== 'admin') {
          return res.status(403).json({
            success: false,
            error: 'Solo gli amministratori possono eliminare post in massa',
            code: 'DELETE_PERMISSION_DENIED'
          });
        }
        query = `DELETE FROM posts WHERE id IN (${post_ids.map(() => '?').join(',')})`;
        params = post_ids;
        message = `${post_ids.length} post(s) eliminati`;
        break;
    }

    // Execute bulk action
    const result = await database.run(query, params);

    res.json({
      success: true,
      message: message,
      data: {
        action: action,
        affected_rows: result.changes,
        post_ids: post_ids
      }
    });
  })
);

// GET /admin/api/content-calendar - Content calendar view
router.get('/content-calendar',
  verifyToken,
  requireRole(['admin', 'editor']),
  asyncHandler(async (req, res) => {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;

    // Get posts for the specified month
    const posts = await database.all(`
      SELECT 
        id, title, slug, status, 
        CASE 
          WHEN status = 'scheduled' THEN scheduled_for
          WHEN status = 'published' THEN published_at
          ELSE created_at
        END as calendar_date,
        author_name, service_category, is_featured
      FROM posts 
      WHERE strftime('%Y-%m', 
        CASE 
          WHEN status = 'scheduled' THEN scheduled_for
          WHEN status = 'published' THEN published_at
          ELSE created_at
        END
      ) = ?
      ORDER BY calendar_date ASC
    `, [`${year}-${month.toString().padStart(2, '0')}`]);

    // Group posts by day
    const calendar = {};
    posts.forEach(post => {
      const date = post.calendar_date.split('T')[0];
      const day = parseInt(date.split('-')[2]);
      
      if (!calendar[day]) {
        calendar[day] = [];
      }
      calendar[day].push(post);
    });

    // Get summary for the month
    const summary = {
      total_posts: posts.length,
      published: posts.filter(p => p.status === 'published').length,
      scheduled: posts.filter(p => p.status === 'scheduled').length,
      drafts: posts.filter(p => p.status === 'draft').length,
      by_service: {
        'assistenza-it': posts.filter(p => p.service_category === 'assistenza-it').length,
        'sicurezza-informatica': posts.filter(p => p.service_category === 'sicurezza-informatica').length,
        'cloud-storage': posts.filter(p => p.service_category === 'cloud-storage').length
      }
    };

    res.json({
      success: true,
      data: {
        year: year,
        month: month,
        calendar: calendar,
        summary: summary,
        posts: posts
      }
    });
  })
);

// GET /admin/api/seo-analysis - SEO analysis of posts
router.get('/seo-analysis',
  verifyToken,
  requireRole(['admin', 'editor']),
  asyncHandler(async (req, res) => {
    // Get posts with SEO issues
    const seoIssues = await database.all(`
      SELECT 
        id, title, slug, status, published_at, author_name,
        CASE WHEN meta_title IS NULL OR meta_title = '' THEN 1 ELSE 0 END as missing_meta_title,
        CASE WHEN meta_description IS NULL OR meta_description = '' THEN 1 ELSE 0 END as missing_meta_description,
        CASE WHEN excerpt IS NULL OR excerpt = '' THEN 1 ELSE 0 END as missing_excerpt,
        CASE WHEN featured_image IS NULL OR featured_image = '' THEN 1 ELSE 0 END as missing_featured_image,
        LENGTH(title) as title_length,
        LENGTH(meta_title) as meta_title_length,
        LENGTH(meta_description) as meta_description_length
      FROM posts 
      WHERE status = 'published'
      ORDER BY published_at DESC
    `);

    // Analyze SEO issues
    const analysis = {
      total_posts: seoIssues.length,
      missing_meta_title: seoIssues.filter(p => p.missing_meta_title).length,
      missing_meta_description: seoIssues.filter(p => p.missing_meta_description).length,
      missing_excerpt: seoIssues.filter(p => p.missing_excerpt).length,
      missing_featured_image: seoIssues.filter(p => p.missing_featured_image).length,
      title_too_long: seoIssues.filter(p => p.title_length > 60).length,
      title_too_short: seoIssues.filter(p => p.title_length < 30).length,
      meta_title_too_long: seoIssues.filter(p => p.meta_title_length > 60).length,
      meta_description_too_long: seoIssues.filter(p => p.meta_description_length > 160).length,
      meta_description_too_short: seoIssues.filter(p => p.meta_description_length < 120).length
    };

    // Get posts that need attention (multiple SEO issues)
    const needsAttention = seoIssues.filter(post => {
      const issues = post.missing_meta_title + post.missing_meta_description + 
                    post.missing_excerpt + post.missing_featured_image;
      return issues >= 2;
    });

    res.json({
      success: true,
      data: {
        analysis: analysis,
        needs_attention: needsAttention.slice(0, 20), // Top 20 posts needing attention
        seo_score: Math.round(((seoIssues.length - needsAttention.length) / seoIssues.length) * 100) || 0
      }
    });
  })
);

// GET /admin/api/export/posts - Export posts data
router.get('/export/posts',
  verifyToken,
  requireRole(['admin']),
  asyncHandler(async (req, res) => {
    const format = req.query.format || 'json';
    const status = req.query.status;
    const service = req.query.service;

    let whereClause = '';
    const params = [];

    if (status) {
      whereClause = 'WHERE p.status = ?';
      params.push(status);
    }

    if (service) {
      whereClause += whereClause ? ' AND ' : 'WHERE ';
      whereClause += 'p.service_category = ?';
      params.push(service);
    }

    const posts = await database.all(`
      SELECT 
        p.*,
        u.username as author_username,
        GROUP_CONCAT(DISTINCT c.name) as categories,
        GROUP_CONCAT(DISTINCT t.name) as tags
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN post_categories pc ON p.id = pc.post_id
      LEFT JOIN categories c ON pc.category_id = c.id
      LEFT JOIN post_tags pt ON p.id = pt.post_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `, params);

    const processedPosts = posts.map(post => ({
      ...post,
      categories: post.categories ? post.categories.split(',') : [],
      tags: post.tags ? post.tags.split(',') : [],
      target_cities: post.target_cities ? JSON.parse(post.target_cities) : []
    }));

    if (format === 'csv') {
      // Convert to CSV format
      const csvHeader = 'ID,Title,Slug,Status,Author,Published At,View Count,Service Category,Categories,Tags\n';
      const csvRows = processedPosts.map(post => 
        `${post.id},"${post.title}","${post.slug}","${post.status}","${post.author_name}","${post.published_at || ''}",${post.view_count},"${post.service_category || '"}","${post.categories.join(';')}","${post.tags.join(';')}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="posts-export.csv"');
      res.send(csvHeader + csvRows);
    } else {
      res.json({
        success: true,
        data: {
          posts: processedPosts,
          total: processedPosts.length,
          exported_at: new Date().toISOString()
        }
      });
    }
  })
);

module.exports = router;