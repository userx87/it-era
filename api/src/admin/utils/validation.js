/**
 * Input validation utilities for admin API
 */

export function validatePost(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate || data.title !== undefined) {
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      errors.push('Title is required and must be a non-empty string');
    } else if (data.title.length > 200) {
      errors.push('Title must be less than 200 characters');
    }
  }

  if (!isUpdate || data.content !== undefined) {
    if (!data.content || typeof data.content !== 'string' || data.content.trim().length === 0) {
      errors.push('Content is required and must be a non-empty string');
    }
  }

  if (data.slug !== undefined) {
    if (data.slug && (typeof data.slug !== 'string' || !/^[a-z0-9-]+$/.test(data.slug))) {
      errors.push('Slug must contain only lowercase letters, numbers, and hyphens');
    }
  }

  if (data.status !== undefined) {
    if (!['draft', 'published', 'scheduled', 'archived'].includes(data.status)) {
      errors.push('Status must be one of: draft, published, scheduled, archived');
    }
  }

  if (data.excerpt !== undefined && data.excerpt) {
    if (typeof data.excerpt !== 'string') {
      errors.push('Excerpt must be a string');
    } else if (data.excerpt.length > 500) {
      errors.push('Excerpt must be less than 500 characters');
    }
  }

  if (data.meta_title !== undefined && data.meta_title) {
    if (typeof data.meta_title !== 'string') {
      errors.push('Meta title must be a string');
    } else if (data.meta_title.length > 60) {
      errors.push('Meta title should be less than 60 characters for SEO');
    }
  }

  if (data.meta_description !== undefined && data.meta_description) {
    if (typeof data.meta_description !== 'string') {
      errors.push('Meta description must be a string');
    } else if (data.meta_description.length > 160) {
      errors.push('Meta description should be less than 160 characters for SEO');
    }
  }

  if (data.tags !== undefined) {
    if (!Array.isArray(data.tags)) {
      errors.push('Tags must be an array');
    } else if (data.tags.some(tag => typeof tag !== 'string')) {
      errors.push('All tags must be strings');
    }
  }

  if (data.scheduled_at !== undefined && data.scheduled_at) {
    const scheduledDate = new Date(data.scheduled_at);
    if (isNaN(scheduledDate.getTime())) {
      errors.push('Scheduled date must be a valid ISO date string');
    }
  }

  return {
    success: errors.length === 0,
    errors
  };
}

export function validateCategory(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate || data.name !== undefined) {
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push('Name is required and must be a non-empty string');
    } else if (data.name.length > 100) {
      errors.push('Name must be less than 100 characters');
    }
  }

  if (data.slug !== undefined) {
    if (data.slug && (typeof data.slug !== 'string' || !/^[a-z0-9-]+$/.test(data.slug))) {
      errors.push('Slug must contain only lowercase letters, numbers, and hyphens');
    }
  }

  if (data.description !== undefined && data.description) {
    if (typeof data.description !== 'string') {
      errors.push('Description must be a string');
    } else if (data.description.length > 500) {
      errors.push('Description must be less than 500 characters');
    }
  }

  if (data.color !== undefined && data.color) {
    if (typeof data.color !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(data.color)) {
      errors.push('Color must be a valid hex color code');
    }
  }

  return {
    success: errors.length === 0,
    errors
  };
}

export function validateTag(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate || data.name !== undefined) {
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push('Name is required and must be a non-empty string');
    } else if (data.name.length > 50) {
      errors.push('Name must be less than 50 characters');
    }
  }

  if (data.slug !== undefined) {
    if (data.slug && (typeof data.slug !== 'string' || !/^[a-z0-9-]+$/.test(data.slug))) {
      errors.push('Slug must contain only lowercase letters, numbers, and hyphens');
    }
  }

  if (data.color !== undefined && data.color) {
    if (typeof data.color !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(data.color)) {
      errors.push('Color must be a valid hex color code');
    }
  }

  return {
    success: errors.length === 0,
    errors
  };
}

export function validateUser(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate || data.name !== undefined) {
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push('Name is required and must be a non-empty string');
    } else if (data.name.length > 100) {
      errors.push('Name must be less than 100 characters');
    }
  }

  if (!isUpdate || data.email !== undefined) {
    if (!data.email || typeof data.email !== 'string') {
      errors.push('Email is required and must be a string');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Email must be a valid email address');
    }
  }

  if (data.role !== undefined) {
    if (!['admin', 'editor', 'author'].includes(data.role)) {
      errors.push('Role must be one of: admin, editor, author');
    }
  }

  if (data.password !== undefined && data.password) {
    if (typeof data.password !== 'string') {
      errors.push('Password must be a string');
    } else if (data.password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.password)) {
      errors.push('Password must contain at least one uppercase letter, one lowercase letter, and one number');
    }
  }

  return {
    success: errors.length === 0,
    errors
  };
}

export function validateSettings(data) {
  const errors = [];

  if (data.site_title !== undefined) {
    if (!data.site_title || typeof data.site_title !== 'string' || data.site_title.trim().length === 0) {
      errors.push('Site title is required');
    } else if (data.site_title.length > 100) {
      errors.push('Site title must be less than 100 characters');
    }
  }

  if (data.site_description !== undefined) {
    if (data.site_description && typeof data.site_description !== 'string') {
      errors.push('Site description must be a string');
    } else if (data.site_description && data.site_description.length > 500) {
      errors.push('Site description must be less than 500 characters');
    }
  }

  if (data.posts_per_page !== undefined) {
    if (!Number.isInteger(data.posts_per_page) || data.posts_per_page < 1 || data.posts_per_page > 100) {
      errors.push('Posts per page must be an integer between 1 and 100');
    }
  }

  if (data.allow_comments !== undefined) {
    if (typeof data.allow_comments !== 'boolean') {
      errors.push('Allow comments must be a boolean');
    }
  }

  if (data.require_approval !== undefined) {
    if (typeof data.require_approval !== 'boolean') {
      errors.push('Require approval must be a boolean');
    }
  }

  if (data.site_url !== undefined) {
    if (data.site_url && (typeof data.site_url !== 'string' || !/^https?:\/\/.+/.test(data.site_url))) {
      errors.push('Site URL must be a valid URL');
    }
  }

  return {
    success: errors.length === 0,
    errors
  };
}

export function validateRequest(request, requiredFields = []) {
  const errors = [];

  // Check Content-Type for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    const contentType = request.headers.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      errors.push('Content-Type must be application/json');
    }
  }

  return {
    success: errors.length === 0,
    errors
  };
}

export function sanitizeInput(input) {
  if (typeof input === 'string') {
    return input.trim();
  }
  return input;
}

export function sanitizeHtml(html) {
  // Basic HTML sanitization - in production, use a proper HTML sanitizer
  if (typeof html !== 'string') return html;
  
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}