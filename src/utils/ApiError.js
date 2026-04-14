const { ERROR_CODES } = require('../config/constants');

/**
 * Custom API error class for consistent error handling.
 * Maps application error codes to HTTP status codes.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} code - Application error code from ERROR_CODES
   * @param {string} message - Human-readable error message
   * @param {Array} [details] - Optional field-level error details
   */
  constructor(statusCode, code, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details = null) {
    return new ApiError(400, ERROR_CODES.VALIDATION_ERROR, message, details);
  }

  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, ERROR_CODES.UNAUTHORIZED, message);
  }

  static forbidden(message = 'Insufficient permissions') {
    return new ApiError(403, ERROR_CODES.FORBIDDEN, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, ERROR_CODES.NOT_FOUND, message);
  }

  static conflict(message = 'Resource already exists') {
    return new ApiError(409, ERROR_CODES.CONFLICT, message);
  }

  static validationError(message, details = null) {
    return new ApiError(422, ERROR_CODES.VALIDATION_ERROR, message, details);
  }

  static rateLimited(message = 'Too many requests') {
    return new ApiError(429, ERROR_CODES.RATE_LIMITED, message);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, ERROR_CODES.SERVER_ERROR, message);
  }
}

module.exports = ApiError;
