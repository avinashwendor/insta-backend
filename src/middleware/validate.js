const ApiError = require('../utils/ApiError');

/**
 * Joi validation middleware factory.
 * Validates request body, query, or params against a Joi schema.
 *
 * @param {object} schema - Object with optional keys: body, query, params
 *                          each being a Joi schema
 * @returns {Function} Express middleware
 */
const validate = (schema) => {
  return (req, _res, next) => {
    const validationErrors = [];

    for (const source of ['body', 'query', 'params']) {
      if (schema[source]) {
        const { error, value } = schema[source].validate(req[source], {
          abortEarly: false,
          stripUnknown: true,
          convert: true,
        });

        if (error) {
          const details = error.details.map((detail) => ({
            field: detail.path.join('.'),
            issue: detail.message.replace(/"/g, ''),
          }));
          validationErrors.push(...details);
        } else {
          // Replace with sanitized/coerced values
          req[source] = value;
        }
      }
    }

    if (validationErrors.length > 0) {
      throw ApiError.validationError(
        'Validation failed',
        validationErrors
      );
    }

    next();
  };
};

module.exports = validate;
