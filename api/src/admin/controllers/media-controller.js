/**
 * Media Controller - File upload and management
 */

import { corsHeaders } from '../utils/cors.js';

export class MediaController {
  constructor(env) {
    this.env = env;
  }

  /**
   * List media files
   */
  async list(request, user) {
    try {
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const type = url.searchParams.get('type'); // image, document, video, etc.
      const search = url.searchParams.get('search');

      const offset = (page - 1) * limit;

      let query = `
        SELECT m.*, u.name as uploader_name,
               COUNT(*) OVER() as total_count
        FROM media m
        LEFT JOIN users u ON m.uploaded_by = u.id
        WHERE 1=1
      `;
      
      const params = [];

      if (type) {
        query += ' AND m.type = ?';
        params.push(type);
      }

      if (search) {
        query += ' AND (m.filename LIKE ? OR m.alt_text LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      query += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const results = await this.env.BLOG_DB.prepare(query).bind(...params).all();
      const totalCount = results.results.length > 0 ? results.results[0].total_count : 0;

      return new Response(JSON.stringify({
        media: results.results || [],
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error listing media:', error);
      return new Response(JSON.stringify({
        error: 'Failed to fetch media files',
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
   * Upload media file
   */
  async upload(request, user) {
    try {
      const formData = await request.formData();
      const file = formData.get('file');
      const alt_text = formData.get('alt_text') || '';
      const caption = formData.get('caption') || '';
      
      if (!file) {
        return new Response(JSON.stringify({
          error: 'No file provided'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Validate file
      const validation = this.validateFile(file);
      if (!validation.success) {
        return new Response(JSON.stringify({
          error: 'File validation failed',
          details: validation.errors
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Generate unique filename
      const fileExtension = this.getFileExtension(file.name);
      const uniqueFilename = `${crypto.randomUUID()}.${fileExtension}`;
      const originalFilename = file.name;

      // Upload to R2 storage (or handle file storage)
      const uploadResult = await this.uploadFileToStorage(file, uniqueFilename);
      
      if (!uploadResult.success) {
        return new Response(JSON.stringify({
          error: 'Failed to upload file',
          message: uploadResult.error
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Save media record to database
      const mediaId = crypto.randomUUID();
      const now = new Date().toISOString();
      const fileType = this.getFileType(file.type);

      await this.env.BLOG_DB.prepare(`
        INSERT INTO media (
          id, filename, original_filename, url, type, mime_type,
          size, alt_text, caption, uploaded_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        mediaId, uniqueFilename, originalFilename, uploadResult.url,
        fileType, file.type, file.size, alt_text, caption,
        user.id, now
      ).run();

      // Get created media record
      const media = await this.env.BLOG_DB.prepare(
        'SELECT * FROM media WHERE id = ?'
      ).bind(mediaId).first();

      return new Response(JSON.stringify({
        success: true,
        media
      }), {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error uploading media:', error);
      return new Response(JSON.stringify({
        error: 'Failed to upload file',
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
   * Update media metadata
   */
  async update(id, request, user) {
    try {
      const body = await request.json();
      
      // Get existing media
      const media = await this.env.BLOG_DB.prepare(
        'SELECT * FROM media WHERE id = ?'
      ).bind(id).first();

      if (!media) {
        return new Response(JSON.stringify({
          error: 'Media file not found'
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Check permissions
      if (user.role === 'author' && media.uploaded_by !== user.id) {
        return new Response(JSON.stringify({
          error: 'Access denied'
        }), {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      const { alt_text, caption } = body;

      await this.env.BLOG_DB.prepare(`
        UPDATE media SET
          alt_text = COALESCE(?, alt_text),
          caption = COALESCE(?, caption)
        WHERE id = ?
      `).bind(alt_text, caption, id).run();

      // Get updated media
      const updatedMedia = await this.env.BLOG_DB.prepare(
        'SELECT * FROM media WHERE id = ?'
      ).bind(id).first();

      return new Response(JSON.stringify({
        success: true,
        media: updatedMedia
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error updating media:', error);
      return new Response(JSON.stringify({
        error: 'Failed to update media',
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
   * Delete media file
   */
  async delete(id, user) {
    try {
      const media = await this.env.BLOG_DB.prepare(
        'SELECT * FROM media WHERE id = ?'
      ).bind(id).first();

      if (!media) {
        return new Response(JSON.stringify({
          error: 'Media file not found'
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Check permissions
      if (user.role === 'author' && media.uploaded_by !== user.id) {
        return new Response(JSON.stringify({
          error: 'Access denied'
        }), {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Check if media is used in posts
      const usageCount = await this.env.BLOG_DB.prepare(
        'SELECT COUNT(*) as count FROM posts WHERE featured_image = ?'
      ).bind(id).first();

      if (usageCount.count > 0) {
        return new Response(JSON.stringify({
          error: 'Cannot delete media file used in posts',
          usage_count: usageCount.count
        }), {
          status: 409,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Delete from storage
      await this.deleteFileFromStorage(media.filename);

      // Delete from database
      await this.env.BLOG_DB.prepare(
        'DELETE FROM media WHERE id = ?'
      ).bind(id).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'Media file deleted successfully'
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error deleting media:', error);
      return new Response(JSON.stringify({
        error: 'Failed to delete media file',
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
   * Get media usage statistics
   */
  async getStats(request, user) {
    try {
      const [totalCount, totalSize, typeStats] = await Promise.all([
        // Total file count
        this.env.BLOG_DB.prepare(
          'SELECT COUNT(*) as count FROM media'
        ).first(),
        
        // Total storage size
        this.env.BLOG_DB.prepare(
          'SELECT SUM(size) as total_size FROM media'
        ).first(),
        
        // Files by type
        this.env.BLOG_DB.prepare(`
          SELECT type, COUNT(*) as count, SUM(size) as total_size
          FROM media
          GROUP BY type
          ORDER BY count DESC
        `).all()
      ]);

      return new Response(JSON.stringify({
        total_files: totalCount.count,
        total_size: totalSize.total_size || 0,
        by_type: typeStats.results || []
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error getting media stats:', error);
      return new Response(JSON.stringify({
        error: 'Failed to get media statistics',
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
   * Helper methods
   */
  validateFile(file) {
    const errors = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'text/csv'
    ];

    if (file.size > maxSize) {
      errors.push('File size exceeds 10MB limit');
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push('File type not allowed');
    }

    return {
      success: errors.length === 0,
      errors
    };
  }

  getFileType(mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType === 'application/pdf') return 'document';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
    if (mimeType.includes('spreadsheet') || mimeType.includes('csv')) return 'document';
    return 'file';
  }

  getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
  }

  async uploadFileToStorage(file, filename) {
    try {
      // In a real implementation, this would upload to Cloudflare R2, AWS S3, etc.
      // For now, we'll simulate the upload
      
      // Convert file to array buffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Store in R2 (if available) or return a mock URL
      if (this.env.MEDIA_BUCKET) {
        await this.env.MEDIA_BUCKET.put(filename, arrayBuffer, {
          httpMetadata: {
            contentType: file.type,
          }
        });
        
        return {
          success: true,
          url: `https://media.it-era.it/${filename}`
        };
      }

      // Mock storage - in production, implement proper file storage
      return {
        success: true,
        url: `https://cdn.it-era.it/media/${filename}`
      };

    } catch (error) {
      console.error('Storage upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deleteFileFromStorage(filename) {
    try {
      if (this.env.MEDIA_BUCKET) {
        await this.env.MEDIA_BUCKET.delete(filename);
      }
      // In mock implementation, nothing to delete from storage
    } catch (error) {
      console.error('Storage delete error:', error);
    }
  }
}