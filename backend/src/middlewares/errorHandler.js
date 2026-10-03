/**
 * Centralized API Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || null;
  let code = err.code || 'INTERNAL_ERROR';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
    errors = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message
    }));
  }

  // Mongoose bad ObjectId / CastError
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for resource ID: ${err.value}`;
    code = 'INVALID_ID';
  }

  // MongoDB duplicate key error (11000)
  if (err.code === 11000) {
    statusCode = 400;
    code = 'DUPLICATE_KEY';
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
    code = 'INVALID_TOKEN';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired';
    code = 'TOKEN_EXPIRED';
  }

  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message || err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    code,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
