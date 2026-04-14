/**
 * Wraps async route handlers to catch rejected promises
 * and forward them to Express error handling middleware.
 * Eliminates try/catch boilerplate in every controller method.
 *
 * @param {Function} fn - Async Express route handler
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
