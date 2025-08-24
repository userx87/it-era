const express = require('express');
const { body, query, param } = require('express-validator');
const slugify = require('slugify');
const sanitizeHtml = require('sanitize-html');
const { verifyToken, requireRole, canEditContent, validateRequest } = require('../middleware/auth');
const { asyncHandler, validateObjectId } = require('../middleware/errorHandler');
const database = require('../../config/database');

const router = express.Router();

// Sanitize HTML options
const sanitizeOptions = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'strike',
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
    'span': ['class'],
    'code': ['class'],
    'pre': ['class']
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel']
};

// Helper function to generate unique slug
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

// GET /api/posts - List posts with pagination, filtering, and search
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100'),
    query('status').optional().isIn(['draft', 'published', 'scheduled', 'archived']).withMessage('Invalid status'),
    query('category').optional().isInt({ min: 1 }).withMessage('Category must be a valid ID'),
    query('tag').optional().isInt({ min: 1 }).withMessage('Tag must be a valid ID'),
    query('author').optional().isInt({ min: 1 }).withMessage('Author must be a valid ID'),
    query('service').optional().isIn(['assistenza-it', 'sicurezza-informatica', 'cloud-storage']).withMessage('Invalid service category'),
    query('search').optional().isLength({ min: 2 }).withMessage('Search term must be at least 2 characters'),
    query('featured').optional().isBoolean().withMessage('Featured must be boolean'),
    query('sort').optional().isIn(['created_at', 'updated_at', 'published_at', 'title', 'view_count']).withMessage('Invalid sort field'),
    query('order').optional().isIn(['ASC', 'DESC']).withMessage('Order must be ASC or DESC')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    const conditions = [];
    const params = [];

    // Status filter
    if (req.query.status) {
      conditions.push('p.status = ?');
      params.push(req.query.status);
    }

    // Category filter
    if (req.query.category) {
      conditions.push('EXISTS (SELECT 1 FROM post_categories pc WHERE pc.post_id = p.id AND pc.category_id = ?)');
      params.push(req.query.category);
    }

    // Tag filter
    if (req.query.tag) {
      conditions.push('EXISTS (SELECT 1 FROM post_tags pt WHERE pt.post_id = p.id AND pt.tag_id = ?)');
      params.push(req.query.tag);
    }

    // Author filter
    if (req.query.author) {
      conditions.push('p.author_id = ?');
      params.push(req.query.author);
    }

    // Service category filter
    if (req.query.service) {
      conditions.push('p.service_category = ?');
      params.push(req.query.service);
    }

    // Featured filter
    if (req.query.featured !== undefined) {
      conditions.push('p.is_featured = ?');
      params.push(req.query.featured === 'true' ? 1 : 0);
    }

    // Search filter
    if (req.query.search) {
      conditions.push('(p.title LIKE ? OR p.excerpt LIKE ? OR p.content LIKE ?)');
      const searchTerm = `%${req.query.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Build sort clause
    const sortField = req.query.sort || 'created_at';
    const sortOrder = req.query.order || 'DESC';
    const orderBy = `p.${sortField} ${sortOrder}`;

    // Build final WHERE clause
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total posts
    const countQuery = `
      SELECT COUNT(*) as total
      FROM posts p
      ${whereClause}
    `;

    const { total } = await database.get(countQuery, params);

    // Get posts with related data
    const postsQuery = `
      SELECT 
        p.*,
        u.username as author_username,
        u.full_name as author_full_name,
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
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const posts = await database.all(postsQuery, [...params, limit, offset]);

    // Process posts data
    const processedPosts = posts.map(post => ({
      ...post,
      categories: post.categories ? post.categories.split(',') : [],
      tags: post.tags ? post.tags.split(',') : [],
      target_cities: post.target_cities ? JSON.parse(post.target_cities) : []
    }));

    res.json({
      success: true,
      data: {
        posts: processedPosts,
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

// GET /api/posts/:id - Get single post by ID
router.get('/:id',
  param('id').isInt({ min: 1 }).withMessage('Post ID must be a positive integer'),
  validateRequest,
  asyncHandler(async (req, res) => {
    const postId = req.params.id;

    const query = `
      SELECT 
        p.*,
        u.username as author_username,
        u.full_name as author_full_name,
        u.email as author_email
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.id = ?
    `;

    const post = await database.get(query, [postId]);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post non trovato',
        code: 'POST_NOT_FOUND'
      });
    }

    // Get categories
    const categories = await database.all(
      'SELECT c.id, c.name, c.slug FROM categories c JOIN post_categories pc ON c.id = pc.category_id WHERE pc.post_id = ?',
      [postId]
    );

    // Get tags
    const tags = await database.all(
      'SELECT t.id, t.name, t.slug FROM tags t JOIN post_tags pt ON t.id = pt.tag_id WHERE pt.post_id = ?',
      [postId]
    );

    // Increment view count (only for published posts)
    if (post.status === 'published') {
      await database.run('UPDATE posts SET view_count = view_count + 1 WHERE id = ?', [postId]);
      post.view_count += 1;
    }

    // Process response
    const responsePost = {
      ...post,
      categories,
      tags,
      target_cities: post.target_cities ? JSON.parse(post.target_cities) : []
    };

    res.json({
      success: true,
      data: {
        post: responsePost
      }
    });
  })
);

// POST /api/posts - Create new post
router.post('/',
  verifyToken,
  requireRole(['admin', 'editor', 'author']),
  [
    body('title').isLength({ min: 1, max: 200 }).withMessage('Title is required (max 200 characters)'),
    body('content').isLength({ min: 1 }).withMessage('Content is required'),
    body('excerpt').optional().isLength({ max: 500 }).withMessage('Excerpt max 500 characters'),
    body('status').optional().isIn(['draft', 'published', 'scheduled']).withMessage('Invalid status'),
    body('service_category').optional().isIn(['assistenza-it', 'sicurezza-informatica', 'cloud-storage']).withMessage('Invalid service category'),
    body('categories').optional().isArray().withMessage('Categories must be an array'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('target_cities').optional().isArray().withMessage('Target cities must be an array'),
    body('meta_title').optional().isLength({ max: 200 }).withMessage('Meta title max 200 characters'),
    body('meta_description').optional().isLength({ max: 300 }).withMessage('Meta description max 300 characters'),
    body('scheduled_for').optional().isISO8601().withMessage('Invalid scheduled date format')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const {
      title,
      content,
      excerpt,
      status = 'draft',
      service_category,
      categories = [],
      tags = [],
      target_cities = [],
      meta_title,
      meta_description,
      meta_keywords,
      og_title,
      og_description,
      og_image,
      featured_image,
      scheduled_for,
      is_featured = false,
      allow_comments = true
    } = req.body;

    // Generate unique slug
    const slug = await generateUniqueSlug(title);

    // Sanitize content
    const sanitizedContent = sanitizeHtml(content, sanitizeOptions);

    // Determine published_at based on status
    let publishedAt = null;
    if (status === 'published') {
      publishedAt = new Date().toISOString();
    } else if (status === 'scheduled' && scheduled_for) {
      publishedAt = scheduled_for;
    }

    // Create post
    const result = await database.run(`
      INSERT INTO posts (
        title, slug, excerpt, content, author_id, author_name, status,
        published_at, scheduled_for, meta_title, meta_description, meta_keywords,
        og_title, og_description, og_image, featured_image, service_category,
        target_cities, is_featured, allow_comments
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title, slug, excerpt, sanitizedContent, req.user.id, req.user.full_name,
      status, publishedAt, scheduled_for, meta_title, meta_description, meta_keywords,
      og_title, og_description, og_image, featured_image, service_category,
      JSON.stringify(target_cities), is_featured ? 1 : 0, allow_comments ? 1 : 0
    ]);

    const postId = result.id;

    // Associate categories
    for (const categoryId of categories) {
      await database.run('INSERT INTO post_categories (post_id, category_id) VALUES (?, ?)', [postId, categoryId]);
    }

    // Associate tags
    for (const tagId of tags) {
      await database.run('INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)', [postId, tagId]);
    }

    // Get created post with related data
    const createdPost = await database.get(`
      SELECT p.*, u.username as author_username, u.full_name as author_full_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.id = ?
    `, [postId]);

    res.status(201).json({
      success: true,
      message: 'Post creato con successo',
      data: {
        post: {
          ...createdPost,
          target_cities: JSON.parse(createdPost.target_cities)
        }
      }
    });
  })
);

// PUT /api/posts/:id - Update post
router.put('/:id',
  verifyToken,
  requireRole(['admin', 'editor', 'author']),
  canEditContent,
  [
    param('id').isInt({ min: 1 }).withMessage('Post ID must be a positive integer'),
    body('title').optional().isLength({ min: 1, max: 200 }).withMessage('Title max 200 characters'),
    body('content').optional().isLength({ min: 1 }).withMessage('Content cannot be empty'),
    body('excerpt').optional().isLength({ max: 500 }).withMessage('Excerpt max 500 characters'),
    body('status').optional().isIn(['draft', 'published', 'scheduled', 'archived']).withMessage('Invalid status'),
    body('service_category').optional().isIn(['assistenza-it', 'sicurezza-informatica', 'cloud-storage']).withMessage('Invalid service category'),
    body('categories').optional().isArray().withMessage('Categories must be an array'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('target_cities').optional().isArray().withMessage('Target cities must be an array'),
    body('meta_title').optional().isLength({ max: 200 }).withMessage('Meta title max 200 characters'),
    body('meta_description').optional().isLength({ max: 300 }).withMessage('Meta description max 300 characters'),
    body('scheduled_for').optional().isISO8601().withMessage('Invalid scheduled date format')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const postId = req.params.id;
    const updates = req.body;

    // Get current post
    const currentPost = await database.get('SELECT * FROM posts WHERE id = ?', [postId]);

    if (!currentPost) {
      return res.status(404).json({
        success: false,
        error: 'Post non trovato',
        code: 'POST_NOT_FOUND'
      });
    }

    // Generate new slug if title changed
    if (updates.title && updates.title !== currentPost.title) {
      updates.slug = await generateUniqueSlug(updates.title, postId);
    }

    // Sanitize content if provided
    if (updates.content) {
      updates.content = sanitizeHtml(updates.content, sanitizeOptions);
    }

    // Handle status change to published
    if (updates.status === 'published' && currentPost.status !== 'published') {
      updates.published_at = new Date().toISOString();
    } else if (updates.status === 'scheduled' && updates.scheduled_for) {
      updates.published_at = updates.scheduled_for;
    }

    // Build update query
    const updateFields = [];
    const updateValues = [];

    const allowedFields = [
      'title', 'slug', 'excerpt', 'content', 'status', 'published_at', 'scheduled_for',
      'meta_title', 'meta_description', 'meta_keywords', 'og_title', 'og_description',
      'og_image', 'featured_image', 'service_category', 'is_featured', 'allow_comments'
    ];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(updates[field]);
      }
    }

    // Handle target_cities array
    if (updates.target_cities) {
      updateFields.push('target_cities = ?');
      updateValues.push(JSON.stringify(updates.target_cities));
    }

    if (updateFields.length > 0) {
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(postId);

      await database.run(
        `UPDATE posts SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }

    // Update categories if provided
    if (updates.categories) {
      await database.run('DELETE FROM post_categories WHERE post_id = ?', [postId]);
      for (const categoryId of updates.categories) {
        await database.run('INSERT INTO post_categories (post_id, category_id) VALUES (?, ?)', [postId, categoryId]);
      }
    }

    // Update tags if provided
    if (updates.tags) {
      await database.run('DELETE FROM post_tags WHERE post_id = ?', [postId]);
      for (const tagId of updates.tags) {
        await database.run('INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)', [postId, tagId]);
      }
    }

    // Get updated post
    const updatedPost = await database.get(`
      SELECT p.*, u.username as author_username, u.full_name as author_full_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.id = ?
    `, [postId]);

    res.json({
      success: true,
      message: 'Post aggiornato con successo',
      data: {
        post: {
          ...updatedPost,
          target_cities: updatedPost.target_cities ? JSON.parse(updatedPost.target_cities) : []
        }
      }
    });
  })
);

// DELETE /api/posts/:id - Delete post
router.delete('/:id',
  verifyToken,
  requireRole(['admin', 'editor']),
  param('id').isInt({ min: 1 }).withMessage('Post ID must be a positive integer'),
  validateRequest,
  asyncHandler(async (req, res) => {
    const postId = req.params.id;

    // Check if post exists
    const post = await database.get('SELECT id, title FROM posts WHERE id = ?', [postId]);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post non trovato',
        code: 'POST_NOT_FOUND'
      });
    }

    // Delete post (cascading deletes will handle related records)
    await database.run('DELETE FROM posts WHERE id = ?', [postId]);

    res.json({
      success: true,
      message: 'Post eliminato con successo'
    });
  })
);

// POST /api/posts/:id/publish - Quick publish post
router.post('/:id/publish',
  verifyToken,
  requireRole(['admin', 'editor', 'author']),
  canEditContent,
  param('id').isInt({ min: 1 }).withMessage('Post ID must be a positive integer'),
  validateRequest,
  asyncHandler(async (req, res) => {
    const postId = req.params.id;

    const post = await database.get('SELECT id, status FROM posts WHERE id = ?', [postId]);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post non trovato',
        code: 'POST_NOT_FOUND'
      });
    }

    if (post.status === 'published') {
      return res.status(400).json({
        success: false,
        error: 'Post già pubblicato',
        code: 'ALREADY_PUBLISHED'
      });
    }

    // Update post to published
    await database.run(
      'UPDATE posts SET status = ?, published_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['published', postId]
    );

    res.json({
      success: true,
      message: 'Post pubblicato con successo'
    });
  })
);

// POST /api/posts/:id/unpublish - Unpublish post
router.post('/:id/unpublish',
  verifyToken,
  requireRole(['admin', 'editor']),
  param('id').isInt({ min: 1 }).withMessage('Post ID must be a positive integer'),
  validateRequest,
  asyncHandler(async (req, res) => {
    const postId = req.params.id;

    await database.run(
      'UPDATE posts SET status = ?, published_at = NULL WHERE id = ?',
      ['draft', postId]
    );

    res.json({
      success: true,
      message: 'Post rimosso dalla pubblicazione'
    });
  })
);

module.exports = router;