const express = require('express');
const { body, param } = require('express-validator');
const slugify = require('slugify');
const { verifyToken, requireRole, validateRequest } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const database = require('../../config/database');

const router = express.Router();

// Helper function to generate unique tag slug
const generateUniqueTagSlug = async (name, excludeId = null) => {
  let baseSlug = slugify(name, { lower: true, strict: true, locale: 'it' });
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = excludeId 
      ? 'SELECT id FROM tags WHERE slug = ? AND id != ?'
      : 'SELECT id FROM tags WHERE slug = ?';
    
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

// GET /api/tags - List all tags
router.get('/',
  asyncHandler(async (req, res) => {
    const includeStats = req.query.include_stats === 'true';
    const minUsage = parseInt(req.query.min_usage) || 0;
    const search = req.query.search;

    let query = `
      SELECT 
        t.*
        ${includeStats ? ', COUNT(p.id) as active_post_count' : ''}
      FROM tags t
      ${includeStats ? 'LEFT JOIN post_tags pt ON t.id = pt.tag_id LEFT JOIN posts p ON pt.post_id = p.id AND p.status = "published"' : ''}
    `;

    const conditions = [];
    const params = [];

    if (minUsage > 0) {
      conditions.push('t.usage_count >= ?');
      params.push(minUsage);
    }

    if (search) {
      conditions.push('t.name LIKE ?');
      params.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    if (includeStats) {
      query += ' GROUP BY t.id';
    }

    query += ' ORDER BY t.usage_count DESC, t.name ASC';

    const tags = await database.all(query, params);

    res.json({
      success: true,
      data: {
        tags: tags.map(tag => ({
          ...tag,
          active_post_count: includeStats ? (tag.active_post_count || 0) : undefined
        }))
      }
    });
  })
);

// GET /api/tags/popular - Get most popular tags
router.get('/popular',
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 20;

    const tags = await database.all(`
      SELECT 
        t.*,
        COUNT(p.id) as active_post_count
      FROM tags t
      LEFT JOIN post_tags pt ON t.id = pt.tag_id
      LEFT JOIN posts p ON pt.post_id = p.id AND p.status = 'published'
      GROUP BY t.id
      HAVING active_post_count > 0
      ORDER BY active_post_count DESC, t.name ASC
      LIMIT ?
    `, [limit]);

    res.json({
      success: true,
      data: {
        tags: tags
      }
    });
  })
);

// GET /api/tags/:id - Get single tag
router.get('/:id',
  param('id').isInt({ min: 1 }).withMessage('Tag ID must be a positive integer'),
  validateRequest,
  asyncHandler(async (req, res) => {
    const tagId = req.params.id;

    const tag = await database.get(`
      SELECT 
        t.*,
        COUNT(CASE WHEN p.status = 'published' THEN 1 END) as published_posts,
        COUNT(p.id) as total_posts
      FROM tags t
      LEFT JOIN post_tags pt ON t.id = pt.tag_id
      LEFT JOIN posts p ON pt.post_id = p.id
      WHERE t.id = ?
      GROUP BY t.id
    `, [tagId]);

    if (!tag) {
      return res.status(404).json({
        success: false,
        error: 'Tag non trovato',
        code: 'TAG_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: {
        tag: tag
      }
    });
  })
);

// POST /api/tags - Create new tag
router.post('/',
  verifyToken,
  requireRole(['admin', 'editor', 'author']),
  [
    body('name')
      .isLength({ min: 1, max: 50 })
      .withMessage('Nome tag richiesto (max 50 caratteri)')
      .custom(value => {
        // Ensure tag name doesn't contain special characters except hyphens and spaces
        if (!/^[a-zA-ZÀ-ÿ0-9\s\-]+$/.test(value)) {
          throw new Error('Il nome del tag può contenere solo lettere, numeri, spazi e trattini');
        }
        return true;
      }),
    body('description')
      .optional()
      .isLength({ max: 200 })
      .withMessage('Descrizione max 200 caratteri')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    // Normalize tag name
    const normalizedName = name.trim().toLowerCase();

    // Check if tag already exists (case insensitive)
    const existingTag = await database.get(
      'SELECT id FROM tags WHERE LOWER(name) = ?',
      [normalizedName]
    );

    if (existingTag) {
      return res.status(400).json({
        success: false,
        error: 'Un tag con questo nome esiste già',
        code: 'TAG_NAME_EXISTS'
      });
    }

    // Generate unique slug
    const slug = await generateUniqueTagSlug(name);

    // Create tag
    const result = await database.run(`
      INSERT INTO tags (name, slug, description)
      VALUES (?, ?, ?)
    `, [name.trim(), slug, description]);

    // Get created tag
    const createdTag = await database.get(
      'SELECT * FROM tags WHERE id = ?',
      [result.id]
    );

    res.status(201).json({
      success: true,
      message: 'Tag creato con successo',
      data: {
        tag: createdTag
      }
    });
  })
);

// PUT /api/tags/:id - Update tag
router.put('/:id',
  verifyToken,
  requireRole(['admin', 'editor']),
  [
    param('id').isInt({ min: 1 }).withMessage('Tag ID must be a positive integer'),
    body('name')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Nome tag max 50 caratteri')
      .custom(value => {
        if (value && !/^[a-zA-ZÀ-ÿ0-9\s\-]+$/.test(value)) {
          throw new Error('Il nome del tag può contenere solo lettere, numeri, spazi e trattini');
        }
        return true;
      }),
    body('description')
      .optional()
      .isLength({ max: 200 })
      .withMessage('Descrizione max 200 caratteri')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const tagId = req.params.id;
    const updates = req.body;

    // Check if tag exists
    const currentTag = await database.get(
      'SELECT * FROM tags WHERE id = ?',
      [tagId]
    );

    if (!currentTag) {
      return res.status(404).json({
        success: false,
        error: 'Tag non trovato',
        code: 'TAG_NOT_FOUND'
      });
    }

    // Check if name already exists (excluding current tag)
    if (updates.name && updates.name.toLowerCase() !== currentTag.name.toLowerCase()) {
      const existingTag = await database.get(
        'SELECT id FROM tags WHERE LOWER(name) = ? AND id != ?',
        [updates.name.toLowerCase(), tagId]
      );

      if (existingTag) {
        return res.status(400).json({
          success: false,
          error: 'Un tag con questo nome esiste già',
          code: 'TAG_NAME_EXISTS'
        });
      }

      // Generate new slug if name changed
      updates.slug = await generateUniqueTagSlug(updates.name, tagId);
      updates.name = updates.name.trim();
    }

    // Build update query
    const updateFields = [];
    const updateValues = [];

    const allowedFields = ['name', 'slug', 'description'];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(updates[field]);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nessun dato da aggiornare',
        code: 'NO_UPDATE_DATA'
      });
    }

    updateValues.push(tagId);

    // Update tag
    await database.run(
      `UPDATE tags SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Get updated tag
    const updatedTag = await database.get(
      'SELECT * FROM tags WHERE id = ?',
      [tagId]
    );

    res.json({
      success: true,
      message: 'Tag aggiornato con successo',
      data: {
        tag: updatedTag
      }
    });
  })
);

// DELETE /api/tags/:id - Delete tag
router.delete('/:id',
  verifyToken,
  requireRole(['admin', 'editor']),
  param('id').isInt({ min: 1 }).withMessage('Tag ID must be a positive integer'),
  validateRequest,
  asyncHandler(async (req, res) => {
    const tagId = req.params.id;

    // Check if tag exists
    const tag = await database.get(
      'SELECT id, name, usage_count FROM tags WHERE id = ?',
      [tagId]
    );

    if (!tag) {
      return res.status(404).json({
        success: false,
        error: 'Tag non trovato',
        code: 'TAG_NOT_FOUND'
      });
    }

    // Check if tag is used by posts
    const postCount = await database.get(
      'SELECT COUNT(*) as count FROM post_tags WHERE tag_id = ?',
      [tagId]
    );

    if (postCount.count > 0) {
      return res.status(400).json({
        success: false,
        error: `Impossibile eliminare il tag "${tag.name}" perché è utilizzato da ${postCount.count} post(s). Rimuovi prima il tag dai post.`,
        code: 'TAG_IN_USE',
        postCount: postCount.count
      });
    }

    // Delete tag
    await database.run('DELETE FROM tags WHERE id = ?', [tagId]);

    res.json({
      success: true,
      message: 'Tag eliminato con successo'
    });
  })
);

// GET /api/tags/:id/posts - Get posts with this tag
router.get('/:id/posts',
  param('id').isInt({ min: 1 }).withMessage('Tag ID must be a positive integer'),
  validateRequest,
  asyncHandler(async (req, res) => {
    const tagId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status || 'published';

    // Check if tag exists
    const tag = await database.get(
      'SELECT id, name FROM tags WHERE id = ?',
      [tagId]
    );

    if (!tag) {
      return res.status(404).json({
        success: false,
        error: 'Tag non trovato',
        code: 'TAG_NOT_FOUND'
      });
    }

    // Count total posts with this tag
    const { total } = await database.get(`
      SELECT COUNT(*) as total
      FROM posts p
      JOIN post_tags pt ON p.id = pt.post_id
      WHERE pt.tag_id = ? AND p.status = ?
    `, [tagId, status]);

    // Get posts with this tag
    const posts = await database.all(`
      SELECT 
        p.id, p.title, p.slug, p.excerpt, p.published_at, p.status,
        p.view_count, p.is_featured, p.author_name
      FROM posts p
      JOIN post_tags pt ON p.id = pt.post_id
      WHERE pt.tag_id = ? AND p.status = ?
      ORDER BY p.published_at DESC
      LIMIT ? OFFSET ?
    `, [tagId, status, limit, offset]);

    res.json({
      success: true,
      data: {
        tag: tag,
        posts: posts,
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

// POST /api/tags/bulk-create - Create multiple tags at once
router.post('/bulk-create',
  verifyToken,
  requireRole(['admin', 'editor', 'author']),
  [
    body('tags')
      .isArray({ min: 1, max: 20 })
      .withMessage('Tags deve essere un array di 1-20 elementi'),
    body('tags.*')
      .isLength({ min: 1, max: 50 })
      .withMessage('Ogni tag deve essere 1-50 caratteri')
      .custom(value => {
        if (!/^[a-zA-ZÀ-ÿ0-9\s\-]+$/.test(value)) {
          throw new Error('I nomi dei tag possono contenere solo lettere, numeri, spazi e trattini');
        }
        return true;
      })
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { tags } = req.body;

    // Normalize and deduplicate tag names
    const normalizedTags = [...new Set(tags.map(tag => tag.trim()))];

    // Check for existing tags
    const existingTags = await database.all(`
      SELECT name FROM tags WHERE name IN (${normalizedTags.map(() => '?').join(',')})
    `, normalizedTags);

    const existingNames = existingTags.map(t => t.name.toLowerCase());
    const newTags = normalizedTags.filter(tag => !existingNames.includes(tag.toLowerCase()));

    const createdTags = [];

    // Create new tags
    for (const tagName of newTags) {
      const slug = await generateUniqueTagSlug(tagName);
      
      const result = await database.run(`
        INSERT INTO tags (name, slug)
        VALUES (?, ?)
      `, [tagName, slug]);

      const createdTag = await database.get(
        'SELECT * FROM tags WHERE id = ?',
        [result.id]
      );

      createdTags.push(createdTag);
    }

    res.status(201).json({
      success: true,
      message: `Creati ${createdTags.length} nuovi tag. ${existingNames.length} tag esistevano già.`,
      data: {
        created: createdTags,
        existing: existingTags,
        skipped: existingNames.length
      }
    });
  })
);

// POST /api/tags/merge - Merge tags (move all posts from one tag to another)
router.post('/merge',
  verifyToken,
  requireRole(['admin', 'editor']),
  [
    body('source_tag_id')
      .isInt({ min: 1 })
      .withMessage('Source tag ID deve essere un intero positivo'),
    body('target_tag_id')
      .isInt({ min: 1 })
      .withMessage('Target tag ID deve essere un intero positivo'),
    body('delete_source')
      .optional()
      .isBoolean()
      .withMessage('delete_source deve essere boolean')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { source_tag_id, target_tag_id, delete_source = true } = req.body;

    if (source_tag_id === target_tag_id) {
      return res.status(400).json({
        success: false,
        error: 'I tag sorgente e destinazione devono essere diversi',
        code: 'SAME_TAG_MERGE'
      });
    }

    // Check if both tags exist
    const [sourceTag, targetTag] = await Promise.all([
      database.get('SELECT id, name FROM tags WHERE id = ?', [source_tag_id]),
      database.get('SELECT id, name FROM tags WHERE id = ?', [target_tag_id])
    ]);

    if (!sourceTag) {
      return res.status(404).json({
        success: false,
        error: 'Tag sorgente non trovato',
        code: 'SOURCE_TAG_NOT_FOUND'
      });
    }

    if (!targetTag) {
      return res.status(404).json({
        success: false,
        error: 'Tag destinazione non trovato',
        code: 'TARGET_TAG_NOT_FOUND'
      });
    }

    // Get all posts that have the source tag but not the target tag
    const postsToMigrate = await database.all(`
      SELECT pt1.post_id
      FROM post_tags pt1
      WHERE pt1.tag_id = ?
      AND NOT EXISTS (
        SELECT 1 FROM post_tags pt2 
        WHERE pt2.post_id = pt1.post_id AND pt2.tag_id = ?
      )
    `, [source_tag_id, target_tag_id]);

    // Move posts from source to target tag
    for (const { post_id } of postsToMigrate) {
      await database.run(
        'UPDATE post_tags SET tag_id = ? WHERE post_id = ? AND tag_id = ?',
        [target_tag_id, post_id, source_tag_id]
      );
    }

    // Remove any remaining references to source tag (duplicates)
    await database.run('DELETE FROM post_tags WHERE tag_id = ?', [source_tag_id]);

    let deletedSource = false;
    if (delete_source) {
      await database.run('DELETE FROM tags WHERE id = ?', [source_tag_id]);
      deletedSource = true;
    }

    res.json({
      success: true,
      message: `Merge completato: ${postsToMigrate.length} post spostati da "${sourceTag.name}" a "${targetTag.name}"${deletedSource ? '. Tag sorgente eliminato.' : '.'}`,
      data: {
        sourceTag: sourceTag.name,
        targetTag: targetTag.name,
        movedPosts: postsToMigrate.length,
        sourceDeleted: deletedSource
      }
    });
  })
);

module.exports = router;