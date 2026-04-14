const jwt = require('jsonwebtoken');
const config = require('../config');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * JWT authentication middleware.
 * Extracts Bearer token from Authorization header, verifies it,
 * and attaches the decoded user payload to req.user.
 */
const authenticate = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Missing or malformed authorization header');
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    throw ApiError.unauthorized('Token not provided');
  }

  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret);
    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      accountType: decoded.accountType,
    };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Access token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw ApiError.unauthorized('Invalid access token');
    }
    throw ApiError.unauthorized('Authentication failed');
  }
});

/**
 * Optional authentication — attaches user if token present,
 * but does not reject requests without a token.
 */
const optionalAuth = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, config.jwt.accessSecret);
      req.user = {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
        accountType: decoded.accountType,
      };
    } catch (_verifyError) {
      // Silently ignore invalid tokens for optional auth
      req.user = null;
    }
  }
  next();
});

module.exports = { authenticate, optionalAuth };
