const ApiError = require('../utils/ApiError');

/**
 * Role-based authorization middleware factory.
 * Must be used AFTER authenticate middleware.
 *
 * @param  {...string} allowedAccountTypes - Account types that can access this route
 *                                          (e.g., 'creator', 'business')
 * @returns {Function} Express middleware
 */
const authorize = (...allowedAccountTypes) => {
  return (req, _res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    if (
      allowedAccountTypes.length > 0 &&
      !allowedAccountTypes.includes(req.user.accountType)
    ) {
      throw ApiError.forbidden(
        `Access restricted to ${allowedAccountTypes.join(', ')} accounts`
      );
    }

    next();
  };
};

module.exports = authorize;
