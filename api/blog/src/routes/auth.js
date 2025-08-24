const express = require('express');
const { body } = require('express-validator');
const {
  verifyToken,
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
} = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const database = require('../../config/database');

const router = express.Router();

// POST /api/auth/login
router.post('/login', 
  loginValidation,
  validateRequest,
  checkAccountLockout,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user by email
    const user = await database.get(
      'SELECT id, username, email, password_hash, full_name, role, is_active FROM users WHERE email = ? AND is_active = 1',
      [email]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenziali non valide',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check password
    const isValidPassword = await comparePassword(password, user.password_hash);

    if (!isValidPassword) {
      // Handle failed login attempt
      const { attempts, locked } = await handleFailedLogin(user.id);
      
      const response = {
        success: false,
        error: 'Credenziali non valide',
        code: 'INVALID_CREDENTIALS'
      };

      if (locked) {
        response.error = 'Troppi tentativi falliti. Account temporaneamente bloccato.';
        response.code = 'ACCOUNT_LOCKED';
      } else if (attempts >= 3) {
        response.attemptsRemaining = 5 - attempts;
      }

      return res.status(401).json(response);
    }

    // Reset login attempts on successful login
    await resetLoginAttempts(user.id);

    // Generate JWT token
    const token = generateToken(user);

    // Return user data and token
    res.json({
      success: true,
      message: 'Login effettuato con successo',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role
        },
        token: token,
        expiresIn: '24h'
      }
    });
  })
);

// POST /api/auth/register (only for admins to create new users)
router.post('/register',
  verifyToken,
  registerValidation,
  validateRequest,
  asyncHandler(async (req, res) => {
    // Only admins can create new users
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Solo gli amministratori possono creare nuovi utenti',
        code: 'ADMIN_ONLY'
      });
    }

    const { username, email, password, full_name, role = 'author' } = req.body;

    // Check if user already exists
    const existingUser = await database.get(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Utente già esistente con questa email o username',
        code: 'USER_EXISTS'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create new user
    const result = await database.run(
      'INSERT INTO users (username, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [username, email, passwordHash, full_name, role]
    );

    // Get created user data
    const newUser = await database.get(
      'SELECT id, username, email, full_name, role, created_at FROM users WHERE id = ?',
      [result.id]
    );

    res.status(201).json({
      success: true,
      message: 'Utente creato con successo',
      data: {
        user: newUser
      }
    });
  })
);

// POST /api/auth/change-password
router.post('/change-password',
  verifyToken,
  changePasswordValidation,
  validateRequest,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Get current user with password hash
    const user = await database.get(
      'SELECT id, password_hash FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato',
        code: 'USER_NOT_FOUND'
      });
    }

    // Verify current password
    const isValidPassword = await comparePassword(currentPassword, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Password attuale non corretta',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await database.run(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newPasswordHash, userId]
    );

    res.json({
      success: true,
      message: 'Password cambiata con successo'
    });
  })
);

// GET /api/auth/me
router.get('/me',
  verifyToken,
  asyncHandler(async (req, res) => {
    // Get fresh user data
    const user = await database.get(
      'SELECT id, username, email, full_name, role, last_login, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: {
        user: user
      }
    });
  })
);

// PUT /api/auth/profile
router.put('/profile',
  verifyToken,
  [
    body('full_name')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Nome completo deve essere tra 2-100 caratteri'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Email non valida')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { full_name, email } = req.body;
    const userId = req.user.id;

    // Check if email is already in use by another user
    if (email) {
      const existingUser = await database.get(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Email già in uso da un altro utente',
          code: 'EMAIL_IN_USE'
        });
      }
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (full_name) {
      updates.push('full_name = ?');
      values.push(full_name);
    }

    if (email) {
      updates.push('email = ?');
      values.push(email);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nessun dato da aggiornare',
        code: 'NO_UPDATE_DATA'
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);

    // Update user profile
    await database.run(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Get updated user data
    const updatedUser = await database.get(
      'SELECT id, username, email, full_name, role, updated_at FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: 'Profilo aggiornato con successo',
      data: {
        user: updatedUser
      }
    });
  })
);

// POST /api/auth/logout
router.post('/logout',
  verifyToken,
  asyncHandler(async (req, res) => {
    // In a JWT implementation, logout is typically handled client-side
    // by removing the token. Here we just confirm the logout.
    // You could implement a token blacklist if needed.

    res.json({
      success: true,
      message: 'Logout effettuato con successo'
    });
  })
);

// GET /api/auth/verify
router.get('/verify',
  verifyToken,
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      message: 'Token valido',
      data: {
        user: {
          id: req.user.id,
          username: req.user.username,
          email: req.user.email,
          full_name: req.user.full_name,
          role: req.user.role
        }
      }
    });
  })
);

module.exports = router;