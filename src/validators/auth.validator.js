const Joi = require('joi');

const register = {
  body: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Must be a valid email address',
      'any.required': 'Email is required',
    }),
    username: Joi.string()
      .min(3)
      .max(30)
      .pattern(/^[a-z0-9_]+$/)
      .required()
      .messages({
        'string.min': 'Username must be at least 3 characters',
        'string.max': 'Username cannot exceed 30 characters',
        'string.pattern.base': 'Username can only contain lowercase letters, numbers, and underscores',
        'any.required': 'Username is required',
      }),
    display_name: Joi.string().min(1).max(50).required().messages({
      'any.required': 'Display name is required',
    }),
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters',
        'string.pattern.base':
          'Password must include uppercase, lowercase, number, and special character',
        'any.required': 'Password is required',
      }),
    date_of_birth: Joi.date().max('now').iso().required().messages({
      'any.required': 'Date of birth is required',
      'date.max': 'Date of birth cannot be in the future',
    }),
  }),
};

const login = {
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

const refreshToken = {
  body: Joi.object({
    refresh_token: Joi.string().required(),
  }),
};

const forgotPassword = {
  body: Joi.object({
    email: Joi.string().email().required(),
  }),
};

const resetPassword = {
  body: Joi.object({
    token: Joi.string().required(),
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .required(),
  }),
};

const verifyEmail = {
  body: Joi.object({
    token: Joi.string().required(),
  }),
};

const enable2FA = {
  body: Joi.object({}),
};

const verify2FA = {
  body: Joi.object({
    code: Joi.string().length(6).pattern(/^\d+$/).required().messages({
      'string.length': '2FA code must be 6 digits',
      'string.pattern.base': '2FA code must contain only numbers',
    }),
  }),
};

module.exports = {
  register,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  enable2FA,
  verify2FA,
};
