const express = require('express');
const { query, param } = require('express-validator');
const { validateRequest } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const database = require('../../config/database');

const router = express.Router();

// GET /public/posts - Public posts API for frontend
router.get('/posts',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1-50'),
    query('category').optional().isLength({ min: 1 }).withMessage('Category slug required'),
    query('tag').optional().isLength({ min: 1 }).withMessage('Tag slug required'),
    query('service').optional().isIn(['assistenza-it', 'sicurezza-informatica', 'cloud-storage']).withMessage('Invalid service category'),
    query('search').optional().isLength({ min: 2 }).withMessage('Search term must be at least 2 characters'),
    query('featured').optional().isBoolean().withMessage('Featured must be boolean'),
    query('city').optional().isLength({ min: 2 }).withMessage('City must be at least 2 characters'),
    query('sort').optional().isIn(['created_at', 'published_at', 'title', 'view_count']).withMessage('Invalid sort field'),
    query('order').optional().isIn(['ASC', 'DESC']).withMessage('Order must be ASC or DESC')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Build WHERE clause for published posts only
    const conditions = ['p.status = "published"'];
    const params = [];

    // Category filter by slug
    if (req.query.category) {
      conditions.push('EXISTS (SELECT 1 FROM post_categories pc JOIN categories c ON pc.category_id = c.id WHERE pc.post_id = p.id AND c.slug = ?)');
      params.push(req.query.category);
    }

    // Tag filter by slug
    if (req.query.tag) {
      conditions.push('EXISTS (SELECT 1 FROM post_tags pt JOIN tags t ON pt.tag_id = t.id WHERE pt.post_id = p.id AND t.slug = ?)');
      params.push(req.query.tag);
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

    // City filter (search in target_cities JSON)
    if (req.query.city) {
      conditions.push('(p.target_cities LIKE ? OR p.target_cities IS NULL)');
      params.push(`%"${req.query.city}"%`);
    }

    // Search filter
    if (req.query.search) {
      conditions.push('(p.title LIKE ? OR p.excerpt LIKE ? OR p.content LIKE ?)');
      const searchTerm = `%${req.query.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Build sort clause
    const sortField = req.query.sort || 'published_at';
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
        p.id, p.title, p.slug, p.excerpt, p.featured_image,
        p.published_at, p.view_count, p.like_count, p.author_name,
        p.service_category, p.is_featured, p.target_cities,
        p.meta_title, p.meta_description,
        GROUP_CONCAT(DISTINCT c.name) as categories,
        GROUP_CONCAT(DISTINCT c.slug) as category_slugs,
        GROUP_CONCAT(DISTINCT t.name) as tags,
        GROUP_CONCAT(DISTINCT t.slug) as tag_slugs
      FROM posts p
      LEFT JOIN post_categories pc ON p.id = pc.post_id
      LEFT JOIN categories c ON pc.category_id = c.id AND c.is_active = 1
      LEFT JOIN post_tags pt ON p.id = pt.post_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      ${whereClause}
      GROUP BY p.id
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const posts = await database.all(postsQuery, [...params, limit, offset]);

    // Process posts data
    const processedPosts = posts.map(post => {
      const categories = post.categories ? 
        post.categories.split(',').map((name, i) => ({
          name: name,
          slug: post.category_slugs.split(',')[i]
        })) : [];

      const tags = post.tags ? 
        post.tags.split(',').map((name, i) => ({
          name: name,
          slug: post.tag_slugs.split(',')[i]
        })) : [];

      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        featured_image: post.featured_image,
        published_at: post.published_at,
        view_count: post.view_count,
        like_count: post.like_count,
        author_name: post.author_name,
        service_category: post.service_category,
        is_featured: !!post.is_featured,
        target_cities: post.target_cities ? JSON.parse(post.target_cities) : [],
        categories: categories,
        tags: tags,
        seo: {
          title: post.meta_title || post.title,
          description: post.meta_description || post.excerpt
        }
      };
    });

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

// GET /public/posts/:slug - Get single post by slug for frontend
router.get('/posts/:slug',
  param('slug').isLength({ min: 1 }).withMessage('Post slug required'),
  validateRequest,
  asyncHandler(async (req, res) => {
    const slug = req.params.slug;

    const query = `
      SELECT 
        p.*,
        GROUP_CONCAT(DISTINCT c.id || ':' || c.name || ':' || c.slug) as categories_data,
        GROUP_CONCAT(DISTINCT t.id || ':' || t.name || ':' || t.slug) as tags_data
      FROM posts p
      LEFT JOIN post_categories pc ON p.id = pc.post_id
      LEFT JOIN categories c ON pc.category_id = c.id AND c.is_active = 1
      LEFT JOIN post_tags pt ON p.id = pt.post_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE p.slug = ? AND p.status = 'published'
      GROUP BY p.id
    `;

    const post = await database.get(query, [slug]);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post non trovato o non pubblicato',
        code: 'POST_NOT_FOUND'
      });
    }

    // Process categories and tags
    const categories = post.categories_data ? 
      post.categories_data.split(',').map(item => {
        const [id, name, slug] = item.split(':');
        return { id: parseInt(id), name, slug };
      }) : [];

    const tags = post.tags_data ? 
      post.tags_data.split(',').map(item => {
        const [id, name, slug] = item.split(':');
        return { id: parseInt(id), name, slug };
      }) : [];

    // Increment view count
    await database.run('UPDATE posts SET view_count = view_count + 1 WHERE id = ?', [post.id]);

    // Get related posts (same category or service)
    const relatedPosts = await database.all(`
      SELECT DISTINCT
        p.id, p.title, p.slug, p.excerpt, p.featured_image, p.published_at, p.author_name
      FROM posts p
      LEFT JOIN post_categories pc ON p.id = pc.post_id
      WHERE p.status = 'published' 
      AND p.id != ?
      AND (
        p.service_category = ? 
        OR pc.category_id IN (${categories.map(() => '?').join(',') || 'NULL'})
      )
      ORDER BY p.published_at DESC
      LIMIT 5
    `, [post.id, post.service_category, ...categories.map(c => c.id)]);

    // Process response
    const responsePost = {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      featured_image: post.featured_image,
      published_at: post.published_at,
      view_count: post.view_count + 1, // Include the increment
      like_count: post.like_count,
      author_name: post.author_name,
      service_category: post.service_category,
      is_featured: !!post.is_featured,
      allow_comments: !!post.allow_comments,
      target_cities: post.target_cities ? JSON.parse(post.target_cities) : [],
      categories,
      tags,
      seo: {
        title: post.meta_title || post.title,
        description: post.meta_description || post.excerpt,
        keywords: post.meta_keywords,
        og_title: post.og_title || post.title,
        og_description: post.og_description || post.excerpt,
        og_image: post.og_image || post.featured_image
      },
      related_posts: relatedPosts
    };

    res.json({
      success: true,
      data: {
        post: responsePost
      }
    });
  })
);

// GET /public/categories - Get all active categories
router.get('/categories',
  asyncHandler(async (req, res) => {
    const includeStats = req.query.include_stats === 'true';

    let query = `
      SELECT 
        c.id, c.name, c.slug, c.description, c.color
        ${includeStats ? ', COUNT(p.id) as post_count' : ''}
      FROM categories c
      ${includeStats ? 'LEFT JOIN post_categories pc ON c.id = pc.category_id LEFT JOIN posts p ON pc.post_id = p.id AND p.status = "published"' : ''}
      WHERE c.is_active = 1
    `;

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
          post_count: includeStats ? (cat.post_count || 0) : undefined
        }))
      }
    });
  })
);

// GET /public/tags - Get popular tags
router.get('/tags',
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    const minUsage = parseInt(req.query.min_usage) || 1;

    const tags = await database.all(`
      SELECT 
        t.id, t.name, t.slug,
        COUNT(p.id) as post_count
      FROM tags t
      LEFT JOIN post_tags pt ON t.id = pt.tag_id
      LEFT JOIN posts p ON pt.post_id = p.id AND p.status = 'published'
      GROUP BY t.id
      HAVING post_count >= ?
      ORDER BY post_count DESC, t.name ASC
      LIMIT ?
    `, [minUsage, limit]);

    res.json({
      success: true,
      data: {
        tags: tags
      }
    });
  })
);

// GET /public/search - Search posts
router.get('/search',
  [
    query('q').isLength({ min: 2 }).withMessage('Query must be at least 2 characters'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
    query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1-20')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const searchQuery = req.query.q;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Search in titles, excerpts, and content
    const searchCondition = `
      (p.title LIKE ? OR p.excerpt LIKE ? OR p.content LIKE ? OR
       EXISTS (SELECT 1 FROM post_categories pc JOIN categories c ON pc.category_id = c.id WHERE pc.post_id = p.id AND c.name LIKE ?) OR
       EXISTS (SELECT 1 FROM post_tags pt JOIN tags t ON pt.tag_id = t.id WHERE pt.post_id = p.id AND t.name LIKE ?))
    `;

    const searchTerm = `%${searchQuery}%`;
    const searchParams = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm];

    // Count total results
    const { total } = await database.get(`
      SELECT COUNT(*) as total
      FROM posts p
      WHERE p.status = 'published' AND ${searchCondition}
    `, searchParams);

    // Get search results
    const posts = await database.all(`
      SELECT 
        p.id, p.title, p.slug, p.excerpt, p.featured_image,
        p.published_at, p.view_count, p.author_name, p.service_category,
        GROUP_CONCAT(DISTINCT c.name) as categories
      FROM posts p
      LEFT JOIN post_categories pc ON p.id = pc.post_id
      LEFT JOIN categories c ON pc.category_id = c.id AND c.is_active = 1
      WHERE p.status = 'published' AND ${searchCondition}
      GROUP BY p.id
      ORDER BY 
        CASE WHEN p.title LIKE ? THEN 1 ELSE 2 END,
        p.published_at DESC
      LIMIT ? OFFSET ?
    `, [...searchParams, searchTerm, limit, offset]);

    const processedPosts = posts.map(post => ({
      ...post,
      categories: post.categories ? post.categories.split(',') : [],
      highlight: {
        title: post.title.includes(searchQuery.replace('%', '')) ? post.title : null,
        excerpt: post.excerpt && post.excerpt.includes(searchQuery.replace('%', '')) ? post.excerpt : null
      }
    }));

    res.json({
      success: true,
      data: {
        query: searchQuery,
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

// GET /public/featured - Get featured posts
router.get('/featured',
  [
    query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1-20'),
    query('service').optional().isIn(['assistenza-it', 'sicurezza-informatica', 'cloud-storage']).withMessage('Invalid service category')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 5;
    const service = req.query.service;

    let whereClause = 'WHERE p.status = "published" AND p.is_featured = 1';
    const params = [];

    if (service) {
      whereClause += ' AND p.service_category = ?';
      params.push(service);
    }

    const featuredPosts = await database.all(`
      SELECT 
        p.id, p.title, p.slug, p.excerpt, p.featured_image,
        p.published_at, p.view_count, p.author_name, p.service_category,
        GROUP_CONCAT(DISTINCT c.name) as categories
      FROM posts p
      LEFT JOIN post_categories pc ON p.id = pc.post_id
      LEFT JOIN categories c ON pc.category_id = c.id AND c.is_active = 1
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.published_at DESC
      LIMIT ?
    `, [...params, limit]);

    const processedPosts = featuredPosts.map(post => ({
      ...post,
      categories: post.categories ? post.categories.split(',') : []
    }));

    res.json({
      success: true,
      data: {
        featured_posts: processedPosts
      }
    });
  })
);

// GET /public/sitemap - Generate sitemap data
router.get('/sitemap',
  asyncHandler(async (req, res) => {
    // Get all published posts
    const posts = await database.all(`
      SELECT slug, title, published_at, updated_at
      FROM posts 
      WHERE status = 'published'
      ORDER BY published_at DESC
    `);

    // Get all active categories
    const categories = await database.all(`
      SELECT slug, name, updated_at
      FROM categories 
      WHERE is_active = 1
    `);

    // Get popular tags
    const tags = await database.all(`
      SELECT t.slug, t.name
      FROM tags t
      JOIN post_tags pt ON t.id = pt.tag_id
      JOIN posts p ON pt.post_id = p.id
      WHERE p.status = 'published'
      GROUP BY t.id
      HAVING COUNT(*) >= 2
    `);

    res.json({
      success: true,
      data: {
        posts: posts.map(post => ({
          slug: post.slug,
          title: post.title,
          lastmod: post.updated_at || post.published_at,
          priority: '0.8'
        })),
        categories: categories.map(cat => ({
          slug: cat.slug,
          name: cat.name,
          lastmod: cat.updated_at,
          priority: '0.6'
        })),
        tags: tags.map(tag => ({
          slug: tag.slug,
          name: tag.name,
          priority: '0.4'
        }))
      }
    });
  })
);

// GET /public/stats - Public statistics
router.get('/stats',
  asyncHandler(async (req, res) => {
    // Get public statistics
    const stats = await database.all(`
      SELECT 
        'total_posts' as metric, COUNT(*) as value
      FROM posts WHERE status = 'published'
      UNION ALL
      SELECT 
        'total_views' as metric, SUM(view_count) as value
      FROM posts WHERE status = 'published'
      UNION ALL
      SELECT 
        'active_categories' as metric, COUNT(*) as value
      FROM categories WHERE is_active = 1
      UNION ALL
      SELECT 
        'total_tags' as metric, COUNT(DISTINCT t.id) as value
      FROM tags t
      JOIN post_tags pt ON t.id = pt.tag_id
      JOIN posts p ON pt.post_id = p.id
      WHERE p.status = 'published'
    `);

    const statsObject = {};
    stats.forEach(stat => {
      statsObject[stat.metric] = stat.value || 0;
    });

    // Get service breakdown
    const serviceStats = await database.all(`
      SELECT 
        service_category,
        COUNT(*) as post_count
      FROM posts 
      WHERE status = 'published' AND service_category IS NOT NULL
      GROUP BY service_category
    `);

    res.json({
      success: true,
      data: {
        ...statsObject,
        services: serviceStats.reduce((acc, service) => {
          acc[service.service_category] = service.post_count;
          return acc;
        }, {}),
        last_updated: new Date().toISOString()
      }
    });
  })
);

module.exports = router;