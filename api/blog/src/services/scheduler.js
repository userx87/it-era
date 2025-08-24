const cron = require('node-cron');
const database = require('../../config/database');
const config = require('../../config/config');

class ContentScheduler {
  constructor() {
    this.tasks = new Map();
    this.isRunning = false;
  }

  // Initialize the scheduler
  async initialize() {
    if (this.isRunning) {
      console.warn('Scheduler already running');
      return;
    }

    console.log('📅 Initializing content scheduler...');

    // Schedule check every minute for published posts
    this.tasks.set('publish-scheduled', cron.schedule('* * * * *', async () => {
      await this.publishScheduledPosts();
    }, {
      scheduled: false
    }));

    // Daily cleanup task (runs at 2 AM)
    this.tasks.set('daily-cleanup', cron.schedule('0 2 * * *', async () => {
      await this.performDailyMaintenance();
    }, {
      scheduled: false
    }));

    // Weekly analytics aggregation (runs Sunday at 3 AM)
    this.tasks.set('weekly-analytics', cron.schedule('0 3 * * 0', async () => {
      await this.aggregateWeeklyAnalytics();
    }, {
      scheduled: false
    }));

    // Start all scheduled tasks
    this.startAllTasks();
    this.isRunning = true;

    console.log('✅ Content scheduler initialized with', this.tasks.size, 'tasks');
  }

  // Start all scheduled tasks
  startAllTasks() {
    this.tasks.forEach((task, name) => {
      task.start();
      console.log(`📅 Started scheduled task: ${name}`);
    });
  }

  // Stop all scheduled tasks
  stopAllTasks() {
    this.tasks.forEach((task, name) => {
      task.stop();
      console.log(`⏹️ Stopped scheduled task: ${name}`);
    });
    this.isRunning = false;
  }

  // Publish posts that are scheduled for now or earlier
  async publishScheduledPosts() {
    try {
      const now = new Date().toISOString();
      
      // Find posts scheduled for publication
      const scheduledPosts = await database.all(`
        SELECT id, title, slug, scheduled_for
        FROM posts 
        WHERE status = 'scheduled' 
        AND scheduled_for IS NOT NULL 
        AND scheduled_for <= ?
        ORDER BY scheduled_for ASC
      `, [now]);

      if (scheduledPosts.length === 0) {
        return;
      }

      console.log(`📅 Publishing ${scheduledPosts.length} scheduled post(s)...`);

      for (const post of scheduledPosts) {
        try {
          // Update post status to published
          await database.run(`
            UPDATE posts 
            SET status = 'published', 
                published_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [post.id]);

          console.log(`✅ Published post: "${post.title}" (${post.slug})`);

          // Record analytics event
          await database.run(`
            INSERT INTO analytics (metric_name, metric_value, post_id, date_recorded, additional_data)
            VALUES (?, ?, ?, DATE('now'), ?)
          `, [
            'auto_published', 
            1, 
            post.id, 
            JSON.stringify({
              scheduled_for: post.scheduled_for,
              published_at: now,
              type: 'scheduled_publication'
            })
          ]);

        } catch (error) {
          console.error(`❌ Failed to publish post ${post.id}:`, error);
        }
      }

    } catch (error) {
      console.error('❌ Error in publishScheduledPosts:', error);
    }
  }

  // Daily maintenance tasks
  async performDailyMaintenance() {
    try {
      console.log('🧹 Performing daily maintenance...');

      // Update category post counts
      await this.updateCategoryCounts();

      // Update tag usage counts
      await this.updateTagCounts();

      // Clean up old analytics data (older than 2 years)
      await this.cleanupOldAnalytics();

      // Update media usage counts
      await this.updateMediaUsage();

      console.log('✅ Daily maintenance completed');

    } catch (error) {
      console.error('❌ Error in daily maintenance:', error);
    }
  }

  // Update category post counts
  async updateCategoryCounts() {
    try {
      await database.run(`
        UPDATE categories 
        SET post_count = (
          SELECT COUNT(*) 
          FROM post_categories pc 
          JOIN posts p ON pc.post_id = p.id 
          WHERE pc.category_id = categories.id 
          AND p.status = 'published'
        )
      `);
      console.log('✅ Updated category post counts');
    } catch (error) {
      console.error('❌ Error updating category counts:', error);
    }
  }

  // Update tag usage counts
  async updateTagCounts() {
    try {
      await database.run(`
        UPDATE tags 
        SET usage_count = (
          SELECT COUNT(*) 
          FROM post_tags pt 
          JOIN posts p ON pt.post_id = p.id 
          WHERE pt.tag_id = tags.id 
          AND p.status = 'published'
        )
      `);
      console.log('✅ Updated tag usage counts');
    } catch (error) {
      console.error('❌ Error updating tag counts:', error);
    }
  }

  // Clean up old analytics data
  async cleanupOldAnalytics() {
    try {
      const result = await database.run(`
        DELETE FROM analytics 
        WHERE date_recorded < date('now', '-2 years')
      `);
      
      if (result.changes > 0) {
        console.log(`✅ Cleaned up ${result.changes} old analytics records`);
      }
    } catch (error) {
      console.error('❌ Error cleaning up analytics:', error);
    }
  }

  // Update media usage counts
  async updateMediaUsage() {
    try {
      // Update usage_count for media files
      await database.run(`
        UPDATE media 
        SET usage_count = (
          SELECT COUNT(*) 
          FROM posts p 
          WHERE p.status = 'published' 
          AND (p.featured_image LIKE '%' || media.filename || '%' 
               OR p.content LIKE '%' || media.filename || '%')
        )
      `);
      console.log('✅ Updated media usage counts');
    } catch (error) {
      console.error('❌ Error updating media usage:', error);
    }
  }

  // Weekly analytics aggregation
  async aggregateWeeklyAnalytics() {
    try {
      console.log('📊 Performing weekly analytics aggregation...');

      // Create weekly summary records
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const weeklyStats = await database.all(`
        SELECT 
          metric_name,
          SUM(metric_value) as total_value,
          COUNT(*) as event_count,
          AVG(metric_value) as avg_value
        FROM analytics 
        WHERE date_recorded >= date('now', '-7 days')
        GROUP BY metric_name
      `);

      for (const stat of weeklyStats) {
        await database.run(`
          INSERT INTO analytics (
            metric_name, 
            metric_value, 
            date_recorded, 
            additional_data
          ) VALUES (?, ?, DATE('now'), ?)
        `, [
          `weekly_${stat.metric_name}`,
          stat.total_value,
          JSON.stringify({
            event_count: stat.event_count,
            avg_value: stat.avg_value,
            period: 'weekly',
            generated_at: new Date().toISOString()
          })
        ]);
      }

      // Generate popular content report
      await this.generatePopularContentReport();

      console.log('✅ Weekly analytics aggregation completed');

    } catch (error) {
      console.error('❌ Error in weekly analytics:', error);
    }
  }

  // Generate popular content report
  async generatePopularContentReport() {
    try {
      const popularPosts = await database.all(`
        SELECT 
          p.id, p.title, p.slug, p.service_category,
          SUM(a.metric_value) as total_views
        FROM analytics a
        JOIN posts p ON a.post_id = p.id
        WHERE a.metric_name = 'post_view'
        AND a.date_recorded >= date('now', '-7 days')
        GROUP BY p.id
        ORDER BY total_views DESC
        LIMIT 10
      `);

      if (popularPosts.length > 0) {
        await database.run(`
          INSERT INTO analytics (
            metric_name, 
            metric_value, 
            date_recorded, 
            additional_data
          ) VALUES (?, ?, DATE('now'), ?)
        `, [
          'weekly_popular_content',
          popularPosts.length,
          JSON.stringify({
            top_posts: popularPosts,
            generated_at: new Date().toISOString(),
            period: 'weekly'
          })
        ]);
      }

    } catch (error) {
      console.error('❌ Error generating popular content report:', error);
    }
  }

  // Manual trigger for scheduled post publishing
  async publishNow(postId) {
    try {
      const post = await database.get(
        'SELECT id, title, slug, status FROM posts WHERE id = ? AND status = "scheduled"',
        [postId]
      );

      if (!post) {
        throw new Error('Post non trovato o non programmato');
      }

      await database.run(`
        UPDATE posts 
        SET status = 'published', 
            published_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [postId]);

      console.log(`✅ Manually published post: "${post.title}" (${post.slug})`);

      return { success: true, post };

    } catch (error) {
      console.error(`❌ Error manually publishing post ${postId}:`, error);
      throw error;
    }
  }

  // Get scheduler status
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeTasks: Array.from(this.tasks.keys()),
      taskCount: this.tasks.size
    };
  }

  // Get upcoming scheduled posts
  async getUpcomingScheduled(limit = 10) {
    try {
      const upcoming = await database.all(`
        SELECT 
          id, title, slug, scheduled_for, author_name, service_category
        FROM posts 
        WHERE status = 'scheduled' 
        AND scheduled_for IS NOT NULL 
        ORDER BY scheduled_for ASC 
        LIMIT ?
      `, [limit]);

      return upcoming;

    } catch (error) {
      console.error('❌ Error fetching upcoming scheduled posts:', error);
      return [];
    }
  }

  // Reschedule a post
  async reschedulePost(postId, newScheduleTime) {
    try {
      const result = await database.run(`
        UPDATE posts 
        SET scheduled_for = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND status = 'scheduled'
      `, [newScheduleTime, postId]);

      if (result.changes === 0) {
        throw new Error('Post non trovato o non programmato');
      }

      console.log(`✅ Rescheduled post ${postId} to ${newScheduleTime}`);
      return { success: true };

    } catch (error) {
      console.error(`❌ Error rescheduling post ${postId}:`, error);
      throw error;
    }
  }
}

// Create singleton instance
const scheduler = new ContentScheduler();

// Initialize scheduler function
const initializeScheduler = async () => {
  try {
    await scheduler.initialize();
  } catch (error) {
    console.error('❌ Failed to initialize scheduler:', error);
    throw error;
  }
};

// Graceful shutdown
const shutdownScheduler = async () => {
  try {
    scheduler.stopAllTasks();
    console.log('📅 Scheduler shutdown completed');
  } catch (error) {
    console.error('❌ Error shutting down scheduler:', error);
  }
};

module.exports = {
  scheduler,
  initializeScheduler,
  shutdownScheduler
};