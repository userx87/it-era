const express = require('express');
const { body, param } = require('express-validator');
const slugify = require('slugify');
const { verifyToken, requireRole, validateRequest } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const database = require('../../config/database');

const router = express.Router();

// Helper function to generate unique category slug
const generateUniqueCategorySlug = async (name, excludeId = null) => {
  let baseSlug = slugify(name, { lower: true, strict: true, locale: 'it' });
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = excludeId 
      ? 'SELECT id FROM categories WHERE slug = ? AND id != ?'
      : 'SELECT id FROM categories WHERE slug = ?';
    
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

// GET /api/categories - List all categories
router.get('/',
  asyncHandler(async (req, res) => {
    const includeInactive = req.query.include_inactive === 'true';
    const includeStats = req.query.include_stats === 'true';

    let query = `
      SELECT 
        c.*
        ${includeStats ? ', COUNT(p.id) as active_post_count' : ''}
      FROM categories c
      ${includeStats ? 'LEFT JOIN post_categories pc ON c.id = pc.category_id LEFT JOIN posts p ON pc.post_id = p.id AND p.status = "published"' : ''}
    `;

    if (!includeInactive) {
      query += ' WHERE c.is_active = 1';
    }

    if (includeStats) {
      query += ' GROUP BY c.id';
    }

    query += ' ORDER BY c.name ASC';

    const categories = await database.all(query);

    res.json({
      success: true,
      data: {
        categories: categories.map(cat => ({
          ...cat,
          is_active: !!cat.is_active,
          active_post_count: includeStats ? (cat.active_post_count || 0) : undefined
        }))
      }
    });
  })
);

// GET /api/categories/:id - Get single category
router.get('/:id',
  param('id').isInt({ min: 1 }).withMessage('Category ID must be a positive integer'),
  validateRequest,
  asyncHandler(async (req, res) => {
    const categoryId = req.params.id;

    const category = await database.get(`
      SELECT 
        c.*,
        COUNT(CASE WHEN p.status = 'published' THEN 1 END) as published_posts,
        COUNT(p.id) as total_posts
      FROM categories c
      LEFT JOIN post_categories pc ON c.id = pc.category_id
      LEFT JOIN posts p ON pc.post_id = p.id
      WHERE c.id = ?
      GROUP BY c.id
    `, [categoryId]);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Categoria non trovata',
        code: 'CATEGORY_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: {
        category: {
          ...category,
          is_active: !!category.is_active
        }
      }
    });
  })
);

// POST /api/categories - Create new category
router.post('/',
  verifyToken,
  requireRole(['admin', 'editor']),
  [
    body('name')
      .isLength({ min: 1, max: 100 })
      .withMessage('Nome categoria richiesto (max 100 caratteri)'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Descrizione max 500 caratteri'),
    body('color')
      .optional()
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage('Colore deve essere un codice esadecimale valido (#RRGGBB)'),
    body('is_active')
      .optional()
      .isBoolean()
      .withMessage('is_active deve essere boolean')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { name, description, color = '#0056cc', is_active = true } = req.body;

    // Check if category name already exists
    const existingCategory = await database.get(
      'SELECT id FROM categories WHERE name = ?',
      [name]
    );

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        error: 'Una categoria con questo nome esiste già',
        code: 'CATEGORY_NAME_EXISTS'
      });
    }

    // Generate unique slug
    const slug = await generateUniqueCategorySlug(name);

    // Create category
    const result = await database.run(`
      INSERT INTO categories (name, slug, description, color, is_active)
      VALUES (?, ?, ?, ?, ?)
    `, [name, slug, description, color, is_active ? 1 : 0]);

    // Get created category
    const createdCategory = await database.get(
      'SELECT * FROM categories WHERE id = ?',
      [result.id]
    );

    res.status(201).json({
      success: true,
      message: 'Categoria creata con successo',
      data: {
        category: {
          ...createdCategory,
          is_active: !!createdCategory.is_active
        }
      }
    });
  })
);

// PUT /api/categories/:id - Update category
router.put('/:id',
  verifyToken,
  requireRole(['admin', 'editor']),
  [
    param('id').isInt({ min: 1 }).withMessage('Category ID must be a positive integer'),
    body('name')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Nome categoria max 100 caratteri'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Descrizione max 500 caratteri'),
    body('color')
      .optional()
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage('Colore deve essere un codice esadecimale valido (#RRGGBB)'),
    body('is_active')
      .optional()
      .isBoolean()
      .withMessage('is_active deve essere boolean')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const categoryId = req.params.id;
    const updates = req.body;

    // Check if category exists
    const currentCategory = await database.get(
      'SELECT * FROM categories WHERE id = ?',
      [categoryId]
    );

    if (!currentCategory) {
      return res.status(404).json({
        success: false,
        error: 'Categoria non trovata',
        code: 'CATEGORY_NOT_FOUND'
      });
    }

    // Check if name already exists (excluding current category)
    if (updates.name && updates.name !== currentCategory.name) {
      const existingCategory = await database.get(
        'SELECT id FROM categories WHERE name = ? AND id != ?',
        [updates.name, categoryId]
      );

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          error: 'Una categoria con questo nome esiste già',
          code: 'CATEGORY_NAME_EXISTS'
        });
      }

      // Generate new slug if name changed
      updates.slug = await generateUniqueCategorySlug(updates.name, categoryId);
    }

    // Build update query
    const updateFields = [];
    const updateValues = [];

    const allowedFields = ['name', 'slug', 'description', 'color', 'is_active'];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(field === 'is_active' ? (updates[field] ? 1 : 0) : updates[field]);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nessun dato da aggiornare',
        code: 'NO_UPDATE_DATA'
      });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(categoryId);

    // Update category
    await database.run(
      `UPDATE categories SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Get updated category
    const updatedCategory = await database.get(
      'SELECT * FROM categories WHERE id = ?',
      [categoryId]
    );

    res.json({
      success: true,
      message: 'Categoria aggiornata con successo',
      data: {
        category: {
          ...updatedCategory,
          is_active: !!updatedCategory.is_active
        }
      }
    });
  })
);

// DELETE /api/categories/:id - Delete category
router.delete('/:id',
  verifyToken,
  requireRole(['admin']),
  param('id').isInt({ min: 1 }).withMessage('Category ID must be a positive integer'),
  validateRequest,
  asyncHandler(async (req, res) => {
    const categoryId = req.params.id;

    // Check if category exists
    const category = await database.get(
      'SELECT id, name, post_count FROM categories WHERE id = ?',
      [categoryId]
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Categoria non trovata',
        code: 'CATEGORY_NOT_FOUND'
      });
    }

    // Check if category has associated posts
    const postCount = await database.get(
      'SELECT COUNT(*) as count FROM post_categories WHERE category_id = ?',
      [categoryId]
    );

    if (postCount.count > 0) {
      return res.status(400).json({
        success: false,
        error: `Impossibile eliminare la categoria "${category.name}" perché contiene ${postCount.count} post(s). Rimuovi prima i post o assegnali ad altre categorie.`,
        code: 'CATEGORY_HAS_POSTS',
        postCount: postCount.count
      });
    }

    // Delete category
    await database.run('DELETE FROM categories WHERE id = ?', [categoryId]);

    res.json({
      success: true,
      message: 'Categoria eliminata con successo'
    });
  })
);

// GET /api/categories/:id/posts - Get posts in category
router.get('/:id/posts',
  param('id').isInt({ min: 1 }).withMessage('Category ID must be a positive integer'),
  validateRequest,
  asyncHandler(async (req, res) => {
    const categoryId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status || 'published';

    // Check if category exists
    const category = await database.get(
      'SELECT id, name FROM categories WHERE id = ?',
      [categoryId]
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Categoria non trovata',
        code: 'CATEGORY_NOT_FOUND'
      });
    }

    // Count total posts in category
    const { total } = await database.get(`
      SELECT COUNT(*) as total
      FROM posts p
      JOIN post_categories pc ON p.id = pc.post_id
      WHERE pc.category_id = ? AND p.status = ?
    `, [categoryId, status]);

    // Get posts in category
    const posts = await database.all(`
      SELECT 
        p.id, p.title, p.slug, p.excerpt, p.published_at, p.status,
        p.view_count, p.is_featured, p.author_name
      FROM posts p
      JOIN post_categories pc ON p.id = pc.post_id
      WHERE pc.category_id = ? AND p.status = ?
      ORDER BY p.published_at DESC
      LIMIT ? OFFSET ?
    `, [categoryId, status, limit, offset]);

    res.json({
      success: true,
      data: {
        category: category,
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

// POST /api/categories/:id/toggle-status - Toggle category active status
router.post('/:id/toggle-status',
  verifyToken,
  requireRole(['admin', 'editor']),
  param('id').isInt({ min: 1 }).withMessage('Category ID must be a positive integer'),
  validateRequest,
  asyncHandler(async (req, res) => {
    const categoryId = req.params.id;

    // Get current category
    const category = await database.get(
      'SELECT id, name, is_active FROM categories WHERE id = ?',
      [categoryId]
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Categoria non trovata',
        code: 'CATEGORY_NOT_FOUND'
      });
    }

    // Toggle status
    const newStatus = category.is_active ? 0 : 1;
    
    await database.run(
      'UPDATE categories SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newStatus, categoryId]
    );

    res.json({
      success: true,
      message: `Categoria "${category.name}" ${newStatus ? 'attivata' : 'disattivata'} con successo`,
      data: {
        id: categoryId,
        is_active: !!newStatus
      }
    });
  })
);

module.exports = router;