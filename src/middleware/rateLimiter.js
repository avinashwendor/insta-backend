const rateLimit = require('express-rate-limit');
const { RATE_LIMIT_TIERS } = require('../config/constants');

/**
 * Creates an in-memory rate limiter for a given tier.
 * Tiers are defined in constants.js matching the API spec.
 *
 * @param {string} tierName - Key from RATE_LIMIT_TIERS: 'STANDARD', 'SENSITIVE', 'AUTH', 'UPLOAD'
 * @returns {Function} Express middleware
 */
const createRateLimiter = (tierName) => {
  const tier = RATE_LIMIT_TIERS[tierName];

  if (!tier) {
    throw new Error(`Unknown rate limit tier: ${tierName}`);
  }

  return rateLimit({
    windowMs: tier.windowMs,
    max: tier.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: `Too many requests. Limit: ${tier.max} per ${tier.windowMs / 1000}s`,
      },
    },
  });
};

// Pre-built limiters for common use
const standardLimiter = createRateLimiter('STANDARD');
const sensitiveLimiter = createRateLimiter('SENSITIVE');
const authLimiter = createRateLimiter('AUTH');
const uploadLimiter = createRateLimiter('UPLOAD');

module.exports = {
  createRateLimiter,
  standardLimiter,
  sensitiveLimiter,
  authLimiter,
  uploadLimiter,
};
