const logger = require('../utils/logger');
const config = require('../config');

/**
 * Global error handling middleware.
 * Converts all errors into the standard error response envelope.
 * Must be registered as the LAST middleware in Express.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let code = err.code || 'SERVER_ERROR';
  let message = err.message || 'Internal server error';
  let details = err.details || null;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 422;
    code = 'VALIDATION_ERROR';
    message = 'Database validation failed';
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      issue: e.message,
    }));
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    code = 'CONFLICT';
    const field = Object.keys(err.keyPattern)[0];
    message = `Duplicate value for field: ${field}`;
    details = [{ field, issue: 'already_exists' }];
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Log server errors with stack trace, client errors without
  if (statusCode >= 500) {
    logger.error(`${code}: ${message}`, err);
  } else {
    logger.warn(`${code}: ${message} [${req.method} ${req.originalUrl}]`);
  }

  const response = {
    success: false,
    error: {
      code,
      message: config.env === 'production' && statusCode >= 500
        ? 'Internal server error'
        : message,
    },
  };

  if (details) {
    response.error.details = details;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
