const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const { body, param } = require('express-validator');
const { verifyToken, requireRole, validateRequest } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const database = require('../../config/database');
const config = require('../../config/config');

const router = express.Router();

// Ensure upload directory exists
const ensureUploadDir = async () => {
  const uploadDir = path.join(__dirname, '../../uploads');
  const thumbsDir = path.join(uploadDir, 'thumbnails');
  
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }
  
  try {
    await fs.access(thumbsDir);
  } catch {
    await fs.mkdir(thumbsDir, { recursive: true });
  }
  
  return uploadDir;
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = await ensureUploadDir();
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const sanitizedName = name.replace(/[^a-zA-Z0-9\-_]/g, '').substring(0, 50);
    cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`);
  }
});

// File filter for allowed types
const fileFilter = (req, file, cb) => {
  const allowedTypes = config.BLOG.allowedImageTypes;
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo file non consentito. Tipi permessi: ${allowedTypes.join(', ')}`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10 // Max 10 files per request
  }
});

// Helper function to get file size in bytes
const getFileSize = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch {
    return 0;
  }
};

// GET /api/media - List media files
router.get('/',
  verifyToken,
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search;
    const mimeType = req.query.mime_type;
    const uploadedBy = req.query.uploaded_by;

    // Build query conditions
    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('(original_name LIKE ? OR alt_text LIKE ? OR caption LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (mimeType) {
      conditions.push('mime_type = ?');
      params.push(mimeType);
    }

    if (uploadedBy) {
      conditions.push('uploaded_by = ?');
      params.push(uploadedBy);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const { total } = await database.get(
      `SELECT COUNT(*) as total FROM media ${whereClause}`,
      params
    );

    // Get media files
    const mediaFiles = await database.all(`
      SELECT 
        m.*,
        u.username as uploaded_by_username,
        u.full_name as uploaded_by_name
      FROM media m
      LEFT JOIN users u ON m.uploaded_by = u.id
      ${whereClause}
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    res.json({
      success: true,
      data: {
        media: mediaFiles,
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

// GET /api/media/:id - Get single media file
router.get('/:id',
  verifyToken,
  param('id').isInt({ min: 1 }).withMessage('Media ID must be a positive integer'),
  validateRequest,
  asyncHandler(async (req, res) => {
    const mediaId = req.params.id;

    const media = await database.get(`
      SELECT 
        m.*,
        u.username as uploaded_by_username,
        u.full_name as uploaded_by_name
      FROM media m
      LEFT JOIN users u ON m.uploaded_by = u.id
      WHERE m.id = ?
    `, [mediaId]);

    if (!media) {
      return res.status(404).json({
        success: false,
        error: 'File media non trovato',
        code: 'MEDIA_NOT_FOUND'
      });
    }

    // Check if file still exists on disk
    const filePath = path.join(__dirname, '../../uploads', media.filename);
    try {
      await fs.access(filePath);
      media.file_exists = true;
    } catch {
      media.file_exists = false;
    }

    res.json({
      success: true,
      data: {
        media: media
      }
    });
  })
);

// POST /api/media/upload - Upload media files
router.post('/upload',
  verifyToken,
  requireRole(['admin', 'editor', 'author']),
  upload.array('files', 10),
  [
    body('alt_text').optional().isLength({ max: 200 }).withMessage('Alt text max 200 caratteri'),
    body('caption').optional().isLength({ max: 500 }).withMessage('Caption max 500 caratteri')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nessun file caricato',
        code: 'NO_FILES_UPLOADED'
      });
    }

    const { alt_text, caption } = req.body;
    const uploadedFiles = [];

    try {
      for (const file of req.files) {
        // Get actual file size
        const filePath = path.join(__dirname, '../../uploads', file.filename);
        const fileSize = await getFileSize(filePath);

        // Insert media record
        const result = await database.run(`
          INSERT INTO media (
            filename, original_name, mime_type, file_size, file_path,
            alt_text, caption, uploaded_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          file.filename,
          file.originalname,
          file.mimetype,
          fileSize,
          `/uploads/${file.filename}`,
          alt_text || '',
          caption || '',
          req.user.id
        ]);

        const mediaRecord = await database.get(
          'SELECT * FROM media WHERE id = ?',
          [result.id]
        );

        uploadedFiles.push({
          ...mediaRecord,
          url: `/uploads/${file.filename}`,
          public_url: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`
        });
      }

      res.status(201).json({
        success: true,
        message: `${uploadedFiles.length} file(s) caricati con successo`,
        data: {
          files: uploadedFiles
        }
      });

    } catch (error) {
      // Clean up uploaded files on error
      for (const file of req.files) {
        try {
          const filePath = path.join(__dirname, '../../uploads', file.filename);
          await fs.unlink(filePath);
        } catch (cleanupError) {
          console.error('Error cleaning up file:', cleanupError);
        }
      }
      throw error;
    }
  })
);

// PUT /api/media/:id - Update media metadata
router.put('/:id',
  verifyToken,
  requireRole(['admin', 'editor', 'author']),
  [
    param('id').isInt({ min: 1 }).withMessage('Media ID must be a positive integer'),
    body('alt_text').optional().isLength({ max: 200 }).withMessage('Alt text max 200 caratteri'),
    body('caption').optional().isLength({ max: 500 }).withMessage('Caption max 500 caratteri'),
    body('filename').optional().isLength({ min: 1, max: 255 }).withMessage('Filename deve essere tra 1-255 caratteri')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const mediaId = req.params.id;
    const { alt_text, caption, filename } = req.body;

    // Check if media exists
    const media = await database.get('SELECT * FROM media WHERE id = ?', [mediaId]);

    if (!media) {
      return res.status(404).json({
        success: false,
        error: 'File media non trovato',
        code: 'MEDIA_NOT_FOUND'
      });
    }

    // Build update query
    const updateFields = [];
    const updateValues = [];

    if (alt_text !== undefined) {
      updateFields.push('alt_text = ?');
      updateValues.push(alt_text);
    }

    if (caption !== undefined) {
      updateFields.push('caption = ?');
      updateValues.push(caption);
    }

    // Handle filename change (rename file on disk)
    if (filename && filename !== media.filename) {
      const oldPath = path.join(__dirname, '../../uploads', media.filename);
      const newPath = path.join(__dirname, '../../uploads', filename);

      try {
        await fs.rename(oldPath, newPath);
        updateFields.push('filename = ?', 'file_path = ?');
        updateValues.push(filename, `/uploads/${filename}`);
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: 'Errore nel rinominare il file',
          code: 'FILE_RENAME_ERROR',
          details: error.message
        });
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nessun dato da aggiornare',
        code: 'NO_UPDATE_DATA'
      });
    }

    updateValues.push(mediaId);

    // Update media record
    await database.run(
      `UPDATE media SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Get updated media
    const updatedMedia = await database.get(`
      SELECT 
        m.*,
        u.username as uploaded_by_username,
        u.full_name as uploaded_by_name
      FROM media m
      LEFT JOIN users u ON m.uploaded_by = u.id
      WHERE m.id = ?
    `, [mediaId]);

    res.json({
      success: true,
      message: 'Metadata media aggiornati con successo',
      data: {
        media: {
          ...updatedMedia,
          url: updatedMedia.file_path,
          public_url: `${req.protocol}://${req.get('host')}${updatedMedia.file_path}`
        }
      }
    });
  })
);

// DELETE /api/media/:id - Delete media file
router.delete('/:id',
  verifyToken,
  requireRole(['admin', 'editor']),
  param('id').isInt({ min: 1 }).withMessage('Media ID must be a positive integer'),
  validateRequest,
  asyncHandler(async (req, res) => {
    const mediaId = req.params.id;

    // Get media record
    const media = await database.get('SELECT * FROM media WHERE id = ?', [mediaId]);

    if (!media) {
      return res.status(404).json({
        success: false,
        error: 'File media non trovato',
        code: 'MEDIA_NOT_FOUND'
      });
    }

    // Check if media is used in posts
    const usageCount = await database.get(
      'SELECT COUNT(*) as count FROM posts WHERE featured_image LIKE ? OR content LIKE ?',
      [`%${media.filename}%`, `%${media.filename}%`]
    );

    if (usageCount.count > 0) {
      return res.status(400).json({
        success: false,
        error: `File utilizzato in ${usageCount.count} post(s). Rimuovi i riferimenti prima di eliminarlo.`,
        code: 'MEDIA_IN_USE',
        usage_count: usageCount.count
      });
    }

    try {
      // Delete file from disk
      const filePath = path.join(__dirname, '../../uploads', media.filename);
      await fs.unlink(filePath);
    } catch (error) {
      console.warn('File already deleted from disk or permission error:', error.message);
    }

    // Delete media record
    await database.run('DELETE FROM media WHERE id = ?', [mediaId]);

    res.json({
      success: true,
      message: 'File media eliminato con successo'
    });
  })
);

// POST /api/media/bulk-delete - Delete multiple media files
router.post('/bulk-delete',
  verifyToken,
  requireRole(['admin', 'editor']),
  [
    body('media_ids')
      .isArray({ min: 1, max: 50 })
      .withMessage('media_ids deve essere un array di 1-50 elementi'),
    body('media_ids.*')
      .isInt({ min: 1 })
      .withMessage('Ogni media ID deve essere un intero positivo')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { media_ids } = req.body;

    // Get all media records
    const mediaFiles = await database.all(
      `SELECT * FROM media WHERE id IN (${media_ids.map(() => '?').join(',')})`,
      media_ids
    );

    if (mediaFiles.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Nessun file media trovato',
        code: 'NO_MEDIA_FOUND'
      });
    }

    // Check for usage in posts
    const usedFiles = [];
    for (const media of mediaFiles) {
      const usage = await database.get(
        'SELECT COUNT(*) as count FROM posts WHERE featured_image LIKE ? OR content LIKE ?',
        [`%${media.filename}%`, `%${media.filename}%`]
      );
      
      if (usage.count > 0) {
        usedFiles.push({ ...media, usage_count: usage.count });
      }
    }

    if (usedFiles.length > 0) {
      return res.status(400).json({
        success: false,
        error: `${usedFiles.length} file(s) sono utilizzati nei post e non possono essere eliminati`,
        code: 'SOME_MEDIA_IN_USE',
        used_files: usedFiles.map(f => ({
          id: f.id,
          filename: f.filename,
          usage_count: f.usage_count
        }))
      });
    }

    const deletedFiles = [];
    const errors = [];

    for (const media of mediaFiles) {
      try {
        // Delete file from disk
        const filePath = path.join(__dirname, '../../uploads', media.filename);
        await fs.unlink(filePath);
        deletedFiles.push(media.filename);
      } catch (error) {
        console.warn(`File ${media.filename} already deleted or permission error:`, error.message);
        errors.push({ filename: media.filename, error: error.message });
      }
    }

    // Delete all media records
    await database.run(
      `DELETE FROM media WHERE id IN (${media_ids.map(() => '?').join(',')})`,
      media_ids
    );

    res.json({
      success: true,
      message: `${mediaFiles.length} file(s) media eliminati con successo`,
      data: {
        deleted_count: mediaFiles.length,
        deleted_files: deletedFiles,
        errors: errors
      }
    });
  })
);

// GET /api/media/stats - Get media usage statistics
router.get('/stats',
  verifyToken,
  requireRole(['admin', 'editor']),
  asyncHandler(async (req, res) => {
    // Get total counts by type
    const stats = await database.all(`
      SELECT 
        mime_type,
        COUNT(*) as count,
        SUM(file_size) as total_size
      FROM media 
      GROUP BY mime_type
      ORDER BY count DESC
    `);

    // Get total counts
    const totals = await database.get(`
      SELECT 
        COUNT(*) as total_files,
        SUM(file_size) as total_size,
        AVG(file_size) as avg_size
      FROM media
    `);

    // Get recent uploads
    const recentUploads = await database.all(`
      SELECT 
        m.*,
        u.username as uploaded_by_username
      FROM media m
      LEFT JOIN users u ON m.uploaded_by = u.id
      ORDER BY m.created_at DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        by_type: stats,
        totals: {
          ...totals,
          total_size_mb: Math.round(totals.total_size / (1024 * 1024) * 100) / 100,
          avg_size_kb: Math.round(totals.avg_size / 1024 * 100) / 100
        },
        recent_uploads: recentUploads
      }
    });
  })
);

// Error handler for multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    let message = 'Errore upload file';
    let code = 'UPLOAD_ERROR';

    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File troppo grande. Dimensione massima: 5MB';
        code = 'FILE_TOO_LARGE';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Troppi file. Massimo 10 file per volta';
        code = 'TOO_MANY_FILES';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Campo file non previsto';
        code = 'UNEXPECTED_FILE_FIELD';
        break;
    }

    return res.status(400).json({
      success: false,
      error: message,
      code: code
    });
  }

  if (error.message && error.message.includes('Tipo file non consentito')) {
    return res.status(400).json({
      success: false,
      error: error.message,
      code: 'INVALID_FILE_TYPE'
    });
  }

  next(error);
});

module.exports = router;