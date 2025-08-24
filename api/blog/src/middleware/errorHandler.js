const config = require('../../config/config');

// Custom error class
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Database error handler
const handleDatabaseError = (err) => {
  let message = 'Errore del database';
  let code = 'DATABASE_ERROR';
  
  // SQLite specific errors
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    message = 'Questo valore esiste già nel sistema';
    code = 'DUPLICATE_ENTRY';
  } else if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    message = 'Operazione non valida: riferimento mancante';
    code = 'FOREIGN_KEY_CONSTRAINT';
  } else if (err.code === 'SQLITE_CONSTRAINT_CHECK') {
    message = 'Valore non valido per questo campo';
    code = 'CHECK_CONSTRAINT';
  } else if (err.code === 'SQLITE_CONSTRAINT_NOTNULL') {
    message = 'Campo obbligatorio mancante';
    code = 'NOT_NULL_CONSTRAINT';
  }

  return new AppError(message, 400, code);
};

// JWT error handler
const handleJWTError = (err) => {
  if (err.name === 'JsonWebTokenError') {
    return new AppError('Token non valido', 401, 'INVALID_TOKEN');
  } else if (err.name === 'TokenExpiredError') {
    return new AppError('Token scaduto', 401, 'EXPIRED_TOKEN');
  }
  return new AppError('Errore di autenticazione', 401, 'AUTH_ERROR');
};

// Validation error handler
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Dati non validi: ${errors.join('. ')}`;
  return new AppError(message, 400, 'VALIDATION_ERROR');
};

// Cast error handler (for invalid ObjectIds, etc.)
const handleCastError = (err) => {
  const message = `Risorsa non trovata`;
  return new AppError(message, 404, 'CAST_ERROR');
};

// Send error response in development
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    error: err.message,
    code: err.code || 'INTERNAL_ERROR',
    stack: err.stack,
    details: err
  });
};

// Send error response in production
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code || 'OPERATIONAL_ERROR'
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR:', err);
    
    res.status(500).json({
      success: false,
      error: 'Si è verificato un errore interno',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error Handler:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Database errors
  if (err.code && err.code.startsWith('SQLITE_')) {
    error = handleDatabaseError(error);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    error = handleJWTError(error);
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error = handleValidationError(error);
  }

  // Cast errors
  if (err.name === 'CastError') {
    error = handleCastError(error);
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = new AppError('File troppo grande. Massimo 5MB consentiti.', 413, 'FILE_TOO_LARGE');
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = new AppError('Troppi file o campo file non valido.', 400, 'INVALID_FILE_FIELD');
  }

  // Set default error if not already set
  if (!error.statusCode) {
    error.statusCode = 500;
    error.isOperational = false;
  }

  // Send error response
  if (config.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

// 404 Not Found handler
const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Endpoint ${req.originalUrl} non trovato`, 404, 'NOT_FOUND');
  next(error);
};

// Rate limit error handler
const rateLimitHandler = (req, res) => {
  res.status(429).json({
    success: false,
    error: 'Troppe richieste. Riprova più tardi.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: Math.round(req.rateLimit.resetTime / 1000)
  });
};

// Validation middleware for common patterns
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const value = req.params[paramName];
    if (!/^\d+$/.test(value)) {
      return next(new AppError('ID non valido', 400, 'INVALID_ID'));
    }
    next();
  };
};

// Check if resource exists
const checkResourceExists = (model, paramName = 'id', errorMessage = 'Risorsa non trovata') => {
  return asyncHandler(async (req, res, next) => {
    const id = req.params[paramName];
    const resource = await model.findById(id);
    
    if (!resource) {
      return next(new AppError(errorMessage, 404, 'RESOURCE_NOT_FOUND'));
    }
    
    req.resource = resource;
    next();
  });
};

// CORS error handler
const corsErrorHandler = (err, req, res, next) => {
  if (err && err.type === 'cors') {
    return res.status(403).json({
      success: false,
      error: 'Accesso negato da CORS policy',
      code: 'CORS_ERROR'
    });
  }
  next(err);
};

module.exports = {
  AppError,
  asyncHandler,
  errorHandler,
  notFoundHandler,
  rateLimitHandler,
  validateObjectId,
  checkResourceExists,
  corsErrorHandler,
  handleDatabaseError,
  handleJWTError,
  handleValidationError
};