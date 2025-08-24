const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const config = require('../../config/config');
const database = require('../../config/database');

// JWT token verification middleware
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token di accesso richiesto',
        code: 'TOKEN_REQUIRED'
      });
    }

    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      
      // Get fresh user data from database
      const user = await database.get(
        'SELECT id, username, email, full_name, role, is_active, last_login FROM users WHERE id = ? AND is_active = 1',
        [decoded.id]
      );

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Utente non trovato o disattivato',
          code: 'USER_NOT_FOUND'
        });
      }

      req.user = user;
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token scaduto',
          code: 'TOKEN_EXPIRED'
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: 'Token non valido',
          code: 'TOKEN_INVALID'
        });
      } else {
        throw jwtError;
      }
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      code: 'AUTH_ERROR'
    });
  }
};

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Autenticazione richiesta',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Permessi insufficienti',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: userRole
      });
    }

    next();
  };
};

// Check if user can edit specific content
const canEditContent = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Admins can edit everything
    if (userRole === 'admin') {
      return next();
    }

    // Check if user is the author of the post
    const post = await database.get(
      'SELECT author_id FROM posts WHERE id = ?',
      [postId]
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post non trovato',
        code: 'POST_NOT_FOUND'
      });
    }

    if (post.author_id !== userId && userRole !== 'editor') {
      return res.status(403).json({
        success: false,
        error: 'Non puoi modificare questo contenuto',
        code: 'EDIT_FORBIDDEN'
      });
    }

    next();
  } catch (error) {
    console.error('Content permission check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore controllo permessi',
      code: 'PERMISSION_CHECK_ERROR'
    });
  }
};

// Login rate limiting and account lockout
const checkAccountLockout = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await database.get(
      'SELECT id, login_attempts, locked_until FROM users WHERE email = ?',
      [email]
    );

    if (user && user.locked_until) {
      const lockoutTime = new Date(user.locked_until);
      const now = new Date();

      if (now < lockoutTime) {
        const remainingTime = Math.ceil((lockoutTime - now) / (1000 * 60)); // minutes
        return res.status(429).json({
          success: false,
          error: `Account bloccato. Riprova tra ${remainingTime} minuti.`,
          code: 'ACCOUNT_LOCKED',
          remainingTime: remainingTime
        });
      } else {
        // Reset lockout if expired
        await database.run(
          'UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = ?',
          [user.id]
        );
      }
    }

    next();
  } catch (error) {
    console.error('Account lockout check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore controllo account',
      code: 'LOCKOUT_CHECK_ERROR'
    });
  }
};

// Handle failed login attempts
const handleFailedLogin = async (userId) => {
  try {
    const user = await database.get(
      'SELECT login_attempts FROM users WHERE id = ?',
      [userId]
    );

    const attempts = (user.login_attempts || 0) + 1;
    let lockUntil = null;

    if (attempts >= config.SECURITY.maxLoginAttempts) {
      lockUntil = new Date(Date.now() + config.SECURITY.lockoutDuration).toISOString();
    }

    await database.run(
      'UPDATE users SET login_attempts = ?, locked_until = ? WHERE id = ?',
      [attempts, lockUntil, userId]
    );

    return { attempts, locked: !!lockUntil };
  } catch (error) {
    console.error('Failed login handler error:', error);
    throw error;
  }
};

// Reset login attempts on successful login
const resetLoginAttempts = async (userId) => {
  try {
    await database.run(
      'UPDATE users SET login_attempts = 0, locked_until = NULL, last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [userId]
    );
  } catch (error) {
    console.error('Reset login attempts error:', error);
    throw error;
  }
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );
};

// Hash password
const hashPassword = async (password) => {
  return await bcrypt.hash(password, config.SECURITY.bcryptRounds);
};

// Compare password
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Validation rules
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email non valida'),
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password richiesta')
];

const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username deve contenere 3-50 caratteri alfanumerici'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email non valida'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password deve contenere almeno 8 caratteri, una maiuscola, una minuscola e un numero'),
  body('full_name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome completo richiesto (2-100 caratteri)')
];

const changePasswordValidation = [
  body('currentPassword')
    .isLength({ min: 1 })
    .withMessage('Password attuale richiesta'),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Nuova password deve contenere almeno 8 caratteri, una maiuscola, una minuscola e un numero')
];

// Validate request
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Dati non validi',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }
  next();
};

module.exports = {
  verifyToken,
  requireRole,
  canEditContent,
  checkAccountLockout,
  handleFailedLogin,
  resetLoginAttempts,
  generateToken,
  hashPassword,
  comparePassword,
  loginValidation,
  registerValidation,
  changePasswordValidation,
  validateRequest
};