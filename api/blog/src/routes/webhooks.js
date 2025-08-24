const express = require('express');
const { body } = require('express-validator');
const crypto = require('crypto');
const slugify = require('slugify');
const sanitizeHtml = require('sanitize-html');
const { validateRequest } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const database = require('../../config/database');
const config = require('../../config/config');

const router = express.Router();

// Sanitize HTML options for webhook content
const webhookSanitizeOptions = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'strong', 'b', 'em', 'i', 'u',
    'ul', 'ol', 'li',
    'a', 'img',
    'blockquote', 'pre', 'code',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'div', 'span'
  ],
  allowedAttributes: {
    'a': ['href', 'title', 'target', 'rel'],
    'img': ['src', 'alt', 'title', 'width', 'height'],
    'div': ['class'],
    'span': ['class']
  },
  allowedSchemes: ['http', 'https', 'mailto']
};

// Helper function to verify webhook signature
const verifyWebhookSignature = (payload, signature, secret) => {
  if (!signature || !secret) {
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');

    // Remove 'sha256=' prefix if present
    const providedSignature = signature.replace('sha256=', '');
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    );
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
};

// Helper function to generate unique slug from title
const generateUniqueSlug = async (title, excludeId = null) => {
  let baseSlug = slugify(title, { lower: true, strict: true, locale: 'it' });
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = excludeId 
      ? 'SELECT id FROM posts WHERE slug = ? AND id != ?'
      : 'SELECT id FROM posts WHERE slug = ?';
    
    const params = excludeId ? [slug, excludeId] : [slug];
    const existing = await database.get(query, params);

    if (!existing) {
      break;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

// Helper function to find or create categories/tags
const findOrCreateCategories = async (categoryNames) => {
  const categoryIds = [];
  
  for (const name of categoryNames) {
    let category = await database.get(
      'SELECT id FROM categories WHERE LOWER(name) = LOWER(?)',
      [name.trim()]
    );

    if (!category) {
      // Create new category
      const slug = slugify(name, { lower: true, strict: true, locale: 'it' });
      const result = await database.run(
        'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)',
        [name.trim(), slug, `Categoria creata automaticamente da n8n`]
      );
      categoryIds.push(result.id);
    } else {
      categoryIds.push(category.id);
    }
  }

  return categoryIds;
};

const findOrCreateTags = async (tagNames) => {
  const tagIds = [];
  
  for (const name of tagNames) {
    let tag = await database.get(
      'SELECT id FROM tags WHERE LOWER(name) = LOWER(?)',
      [name.trim()]
    );

    if (!tag) {
      // Create new tag
      const slug = slugify(name, { lower: true, strict: true, locale: 'it' });
      const result = await database.run(
        'INSERT INTO tags (name, slug) VALUES (?, ?)',
        [name.trim(), slug]
      );
      tagIds.push(result.id);
    } else {
      tagIds.push(tag.id);
    }
  }

  return tagIds;
};

// Webhook signature verification middleware
const verifyWebhook = (req, res, next) => {
  if (!config.N8N.enabled) {
    return res.status(503).json({
      success: false,
      error: 'Webhook non abilitato',
      code: 'WEBHOOK_DISABLED'
    });
  }

  const signature = req.get('X-N8N-Signature') || req.get('X-Hub-Signature-256');
  const rawBody = JSON.stringify(req.body);

  if (!verifyWebhookSignature(rawBody, signature, config.N8N.webhookSecret)) {
    return res.status(401).json({
      success: false,
      error: 'Firma webhook non valida',
      code: 'INVALID_WEBHOOK_SIGNATURE'
    });
  }

  next();
};

// POST /api/webhooks/n8n/publish - n8n webhook for publishing posts
router.post('/n8n/publish',
  verifyWebhook,
  [
    body('title').isLength({ min: 1, max: 200 }).withMessage('Titolo richiesto (max 200 caratteri)'),
    body('content').isLength({ min: 1 }).withMessage('Contenuto richiesto'),
    body('author_name').optional().isLength({ max: 100 }).withMessage('Nome autore max 100 caratteri'),
    body('excerpt').optional().isLength({ max: 500 }).withMessage('Estratto max 500 caratteri'),
    body('categories').optional().isArray().withMessage('Categorie deve essere un array'),
    body('tags').optional().isArray().withMessage('Tag deve essere un array'),
    body('status').optional().isIn(['draft', 'published', 'scheduled']).withMessage('Status non valido'),
    body('service_category').optional().isIn(['assistenza-it', 'sicurezza-informatica', 'cloud-storage']).withMessage('Categoria servizio non valida'),
    body('target_cities').optional().isArray().withMessage('Città target deve essere un array'),
    body('scheduled_for').optional().isISO8601().withMessage('Data programmazione non valida'),
    body('meta_title').optional().isLength({ max: 200 }).withMessage('Meta title max 200 caratteri'),
    body('meta_description').optional().isLength({ max: 300 }).withMessage('Meta description max 300 caratteri')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const webhookData = req.body;
    
    // Log webhook received
    const logResult = await database.run(`
      INSERT INTO webhook_logs (webhook_type, payload, status)
      VALUES (?, ?, ?)
    `, ['n8n_publish', JSON.stringify(webhookData), 'pending']);

    const webhookLogId = logResult.id;

    try {
      const {
        title,
        content,
        author_name = config.BLOG.defaultAuthor,
        excerpt,
        categories = [],
        tags = [],
        status = 'published',
        service_category,
        target_cities = [],
        scheduled_for,
        meta_title,
        meta_description,
        meta_keywords,
        og_title,
        og_description,
        og_image,
        featured_image,
        is_featured = false,
        allow_comments = true,
        external_id // ID from external system
      } = webhookData;

      // Check for duplicate based on external_id or title
      let existingPost = null;
      if (external_id) {
        // Look for post with matching external reference
        existingPost = await database.get(
          'SELECT id FROM webhook_logs WHERE webhook_type = ? AND JSON_EXTRACT(payload, "$.external_id") = ? AND status = "processed"',
          ['n8n_publish', external_id]
        );
      }

      if (!existingPost) {
        // Check by title (last 24 hours)
        existingPost = await database.get(
          'SELECT id FROM posts WHERE title = ? AND created_at > datetime("now", "-1 day")',
          [title]
        );
      }

      if (existingPost) {
        await database.run(
          'UPDATE webhook_logs SET status = ?, error_message = ? WHERE id = ?',
          ['failed', 'Post duplicato - già esistente', webhookLogId]
        );

        return res.status(409).json({
          success: false,
          error: 'Post con questo titolo già esistente nelle ultime 24 ore',
          code: 'DUPLICATE_POST'
        });
      }

      // Generate unique slug
      const slug = await generateUniqueSlug(title);

      // Sanitize content
      const sanitizedContent = sanitizeHtml(content, webhookSanitizeOptions);

      // Get default author ID if author_name is provided
      let authorId = 1; // Default to first user
      const author = await database.get(
        'SELECT id FROM users WHERE full_name = ? OR username = ? LIMIT 1',
        [author_name, author_name]
      );
      if (author) {
        authorId = author.id;
      }

      // Determine published_at
      let publishedAt = null;
      if (status === 'published') {
        publishedAt = new Date().toISOString();
      } else if (status === 'scheduled' && scheduled_for) {
        publishedAt = scheduled_for;
      }

      // Create post
      const postResult = await database.run(`
        INSERT INTO posts (
          title, slug, excerpt, content, author_id, author_name, status,
          published_at, scheduled_for, meta_title, meta_description, meta_keywords,
          og_title, og_description, og_image, featured_image, service_category,
          target_cities, is_featured, allow_comments
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        title, slug, excerpt, sanitizedContent, authorId, author_name,
        status, publishedAt, scheduled_for, meta_title, meta_description, meta_keywords,
        og_title, og_description, og_image, featured_image, service_category,
        JSON.stringify(target_cities), is_featured ? 1 : 0, allow_comments ? 1 : 0
      ]);

      const postId = postResult.id;

      // Associate categories
      if (categories.length > 0) {
        const categoryIds = await findOrCreateCategories(categories);
        for (const categoryId of categoryIds) {
          await database.run(
            'INSERT INTO post_categories (post_id, category_id) VALUES (?, ?)',
            [postId, categoryId]
          );
        }
      }

      // Associate tags
      if (tags.length > 0) {
        const tagIds = await findOrCreateTags(tags);
        for (const tagId of tagIds) {
          await database.run(
            'INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)',
            [postId, tagId]
          );
        }
      }

      // Update webhook log as processed
      await database.run(`
        UPDATE webhook_logs SET 
          status = ?, 
          post_id = ?, 
          response_data = ?, 
          processed_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, ['processed', postId, JSON.stringify({ post_id: postId, slug }), webhookLogId]);

      // Get created post
      const createdPost = await database.get(
        'SELECT id, title, slug, status, published_at FROM posts WHERE id = ?',
        [postId]
      );

      res.status(201).json({
        success: true,
        message: 'Post creato con successo tramite webhook',
        data: {
          post: createdPost,
          webhook_log_id: webhookLogId,
          categories_created: categories.length,
          tags_created: tags.length
        }
      });

    } catch (error) {
      console.error('n8n publish webhook error:', error);

      // Update webhook log with error
      await database.run(
        'UPDATE webhook_logs SET status = ?, error_message = ? WHERE id = ?',
        ['failed', error.message, webhookLogId]
      );

      res.status(500).json({
        success: false,
        error: 'Errore durante la creazione del post',
        code: 'WEBHOOK_PROCESSING_ERROR',
        details: error.message
      });
    }
  })
);

// POST /api/webhooks/n8n/update - n8n webhook for updating posts
router.post('/n8n/update',
  verifyWebhook,
  [
    body('post_id').optional().isInt({ min: 1 }).withMessage('Post ID deve essere un intero positivo'),
    body('slug').optional().isLength({ min: 1 }).withMessage('Slug richiesto se post_id non fornito'),
    body('title').optional().isLength({ min: 1, max: 200 }).withMessage('Titolo max 200 caratteri'),
    body('content').optional().isLength({ min: 1 }).withMessage('Contenuto non può essere vuoto'),
    body('status').optional().isIn(['draft', 'published', 'scheduled', 'archived']).withMessage('Status non valido')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const webhookData = req.body;
    const { post_id, slug, external_id } = webhookData;

    // Log webhook received
    const logResult = await database.run(`
      INSERT INTO webhook_logs (webhook_type, payload, status)
      VALUES (?, ?, ?)
    `, ['n8n_update', JSON.stringify(webhookData), 'pending']);

    const webhookLogId = logResult.id;

    try {
      // Find post to update
      let post = null;

      if (post_id) {
        post = await database.get('SELECT * FROM posts WHERE id = ?', [post_id]);
      } else if (slug) {
        post = await database.get('SELECT * FROM posts WHERE slug = ?', [slug]);
      } else if (external_id) {
        // Find by external_id in webhook logs
        const webhookLog = await database.get(
          'SELECT post_id FROM webhook_logs WHERE JSON_EXTRACT(payload, "$.external_id") = ? AND status = "processed" ORDER BY created_at DESC LIMIT 1',
          [external_id]
        );
        if (webhookLog) {
          post = await database.get('SELECT * FROM posts WHERE id = ?', [webhookLog.post_id]);
        }
      }

      if (!post) {
        await database.run(
          'UPDATE webhook_logs SET status = ?, error_message = ? WHERE id = ?',
          ['failed', 'Post non trovato', webhookLogId]
        );

        return res.status(404).json({
          success: false,
          error: 'Post non trovato per l\'aggiornamento',
          code: 'POST_NOT_FOUND'
        });
      }

      // Build update fields
      const updateFields = [];
      const updateValues = [];
      const allowedFields = [
        'title', 'content', 'excerpt', 'status', 'meta_title', 'meta_description',
        'meta_keywords', 'og_title', 'og_description', 'og_image', 'featured_image',
        'service_category', 'is_featured', 'allow_comments', 'scheduled_for'
      ];

      for (const field of allowedFields) {
        if (webhookData[field] !== undefined) {
          if (field === 'content') {
            updateFields.push(`${field} = ?`);
            updateValues.push(sanitizeHtml(webhookData[field], webhookSanitizeOptions));
          } else if (field === 'title' && webhookData[field] !== post.title) {
            // Generate new slug if title changed
            const newSlug = await generateUniqueSlug(webhookData[field], post.id);
            updateFields.push('title = ?', 'slug = ?');
            updateValues.push(webhookData[field], newSlug);
          } else {
            updateFields.push(`${field} = ?`);
            updateValues.push(webhookData[field]);
          }
        }
      }

      // Handle target_cities
      if (webhookData.target_cities) {
        updateFields.push('target_cities = ?');
        updateValues.push(JSON.stringify(webhookData.target_cities));
      }

      // Handle status change to published
      if (webhookData.status === 'published' && post.status !== 'published') {
        updateFields.push('published_at = ?');
        updateValues.push(new Date().toISOString());
      }

      if (updateFields.length > 0) {
        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(post.id);

        await database.run(
          `UPDATE posts SET ${updateFields.join(', ')} WHERE id = ?`,
          updateValues
        );
      }

      // Update categories if provided
      if (webhookData.categories) {
        await database.run('DELETE FROM post_categories WHERE post_id = ?', [post.id]);
        const categoryIds = await findOrCreateCategories(webhookData.categories);
        for (const categoryId of categoryIds) {
          await database.run(
            'INSERT INTO post_categories (post_id, category_id) VALUES (?, ?)',
            [post.id, categoryId]
          );
        }
      }

      // Update tags if provided
      if (webhookData.tags) {
        await database.run('DELETE FROM post_tags WHERE post_id = ?', [post.id]);
        const tagIds = await findOrCreateTags(webhookData.tags);
        for (const tagId of tagIds) {
          await database.run(
            'INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)',
            [post.id, tagId]
          );
        }
      }

      // Update webhook log as processed
      await database.run(`
        UPDATE webhook_logs SET 
          status = ?, 
          post_id = ?, 
          response_data = ?, 
          processed_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, ['processed', post.id, JSON.stringify({ updated: true }), webhookLogId]);

      // Get updated post
      const updatedPost = await database.get(
        'SELECT id, title, slug, status, updated_at FROM posts WHERE id = ?',
        [post.id]
      );

      res.json({
        success: true,
        message: 'Post aggiornato con successo tramite webhook',
        data: {
          post: updatedPost,
          webhook_log_id: webhookLogId
        }
      });

    } catch (error) {
      console.error('n8n update webhook error:', error);

      await database.run(
        'UPDATE webhook_logs SET status = ?, error_message = ? WHERE id = ?',
        ['failed', error.message, webhookLogId]
      );

      res.status(500).json({
        success: false,
        error: 'Errore durante l\'aggiornamento del post',
        code: 'WEBHOOK_PROCESSING_ERROR',
        details: error.message
      });
    }
  })
);

// POST /api/webhooks/n8n/delete - n8n webhook for deleting posts
router.post('/n8n/delete',
  verifyWebhook,
  [
    body('post_id').optional().isInt({ min: 1 }).withMessage('Post ID deve essere un intero positivo'),
    body('slug').optional().isLength({ min: 1 }).withMessage('Slug richiesto se post_id non fornito'),
    body('external_id').optional().isLength({ min: 1 }).withMessage('External ID richiesto se altri parametri non forniti')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { post_id, slug, external_id } = req.body;

    // Log webhook received
    const logResult = await database.run(`
      INSERT INTO webhook_logs (webhook_type, payload, status)
      VALUES (?, ?, ?)
    `, ['n8n_delete', JSON.stringify(req.body), 'pending']);

    const webhookLogId = logResult.id;

    try {
      // Find post to delete
      let post = null;

      if (post_id) {
        post = await database.get('SELECT id, title FROM posts WHERE id = ?', [post_id]);
      } else if (slug) {
        post = await database.get('SELECT id, title FROM posts WHERE slug = ?', [slug]);
      } else if (external_id) {
        const webhookLog = await database.get(
          'SELECT post_id FROM webhook_logs WHERE JSON_EXTRACT(payload, "$.external_id") = ? AND status = "processed" ORDER BY created_at DESC LIMIT 1',
          [external_id]
        );
        if (webhookLog) {
          post = await database.get('SELECT id, title FROM posts WHERE id = ?', [webhookLog.post_id]);
        }
      }

      if (!post) {
        await database.run(
          'UPDATE webhook_logs SET status = ?, error_message = ? WHERE id = ?',
          ['failed', 'Post non trovato', webhookLogId]
        );

        return res.status(404).json({
          success: false,
          error: 'Post non trovato per l\'eliminazione',
          code: 'POST_NOT_FOUND'
        });
      }

      // Delete post
      await database.run('DELETE FROM posts WHERE id = ?', [post.id]);

      // Update webhook log as processed
      await database.run(`
        UPDATE webhook_logs SET 
          status = ?, 
          post_id = ?, 
          response_data = ?, 
          processed_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, ['processed', post.id, JSON.stringify({ deleted: true }), webhookLogId]);

      res.json({
        success: true,
        message: `Post "${post.title}" eliminato con successo tramite webhook`,
        data: {
          deleted_post_id: post.id,
          webhook_log_id: webhookLogId
        }
      });

    } catch (error) {
      console.error('n8n delete webhook error:', error);

      await database.run(
        'UPDATE webhook_logs SET status = ?, error_message = ? WHERE id = ?',
        ['failed', error.message, webhookLogId]
      );

      res.status(500).json({
        success: false,
        error: 'Errore durante l\'eliminazione del post',
        code: 'WEBHOOK_PROCESSING_ERROR',
        details: error.message
      });
    }
  })
);

// GET /api/webhooks/logs - Get webhook logs (admin only)
router.get('/logs',
  // Note: This would need auth middleware in production
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const type = req.query.type;

    let whereClause = '';
    const params = [];

    if (status) {
      whereClause = 'WHERE status = ?';
      params.push(status);
    }

    if (type) {
      whereClause += whereClause ? ' AND ' : 'WHERE ';
      whereClause += 'webhook_type = ?';
      params.push(type);
    }

    // Get total count
    const { total } = await database.get(
      `SELECT COUNT(*) as total FROM webhook_logs ${whereClause}`,
      params
    );

    // Get logs
    const logs = await database.all(`
      SELECT 
        id, webhook_type, status, post_id, error_message,
        created_at, processed_at,
        LENGTH(payload) as payload_size
      FROM webhook_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    res.json({
      success: true,
      data: {
        logs: logs,
        pagination: {
          page,
          limit,
          total: parseInt(total),
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  })
);

// POST /api/webhooks/retry/:id - Retry failed webhook
router.post('/retry/:id',
  // Note: This would need auth middleware in production
  asyncHandler(async (req, res) => {
    const logId = req.params.id;

    const log = await database.get(
      'SELECT * FROM webhook_logs WHERE id = ? AND status = "failed"',
      [logId]
    );

    if (!log) {
      return res.status(404).json({
        success: false,
        error: 'Log webhook non trovato o non in stato failed',
        code: 'WEBHOOK_LOG_NOT_FOUND'
      });
    }

    // Reset status to retry
    await database.run(
      'UPDATE webhook_logs SET status = ?, error_message = NULL WHERE id = ?',
      ['retry', logId]
    );

    res.json({
      success: true,
      message: 'Webhook marcato per nuovo tentativo',
      data: {
        log_id: logId
      }
    });
  })
);

module.exports = router;