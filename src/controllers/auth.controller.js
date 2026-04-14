const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const authService = require('../services/auth.service');

/**
 * Auth controller — thin layer that maps HTTP requests to service calls.
 * No business logic here.
 */

/**
 * POST /auth/register
 */
const register = asyncHandler(async (req, res) => {
  const deviceInfo = {
    ip: req.ip,
    type: req.headers['x-device-type'] || 'web',
    name: req.headers['user-agent'],
  };

  const result = await authService.register(req.body, deviceInfo);
  return ApiResponse.created(res, result);
});

/**
 * POST /auth/login
 */
const login = asyncHandler(async (req, res) => {
  const deviceInfo = {
    ip: req.ip,
    type: req.headers['x-device-type'] || 'web',
    name: req.headers['user-agent'],
  };

  const result = await authService.login(req.body, deviceInfo);
  return ApiResponse.ok(res, result);
});

/**
 * POST /auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  const { refresh_token } = req.body;
  await authService.logout(refresh_token);
  return ApiResponse.ok(res, { message: 'Logged out successfully' });
});

/**
 * POST /auth/refresh-token
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { refresh_token } = req.body;
  const result = await authService.refreshAccessToken(refresh_token);
  return ApiResponse.ok(res, result);
});

/**
 * POST /auth/forgot-password
 */
const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  return ApiResponse.ok(res, {
    message: 'If an account with that email exists, a reset link has been sent',
  });
});

/**
 * POST /auth/reset-password
 */
const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body.token, req.body.password);
  return ApiResponse.ok(res, { message: 'Password reset successfully' });
});

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
};
