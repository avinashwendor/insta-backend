const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const userService = require('../services/user.service');

/**
 * User controller — maps HTTP requests to user service calls.
 */

/**
 * GET /users/me
 */
const getMyProfile = asyncHandler(async (req, res) => {
  const user = await userService.getMyProfile(req.user.id);
  return ApiResponse.ok(res, user);
});

/**
 * PUT /users/me
 */
const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user.id, req.body);
  return ApiResponse.ok(res, user);
});

/**
 * PUT /users/me/avatar
 */
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return ApiResponse.ok(res, { message: 'No file uploaded' });
  }
  const user = await userService.uploadAvatar(req.user.id, req.file.buffer);
  return ApiResponse.ok(res, user);
});

/**
 * GET /users/me/settings
 */
const getSettings = asyncHandler(async (req, res) => {
  const settings = await userService.getSettings(req.user.id);
  return ApiResponse.ok(res, settings);
});

/**
 * PUT /users/me/settings
 */
const updateSettings = asyncHandler(async (req, res) => {
  const settings = await userService.updateSettings(req.user.id, req.body);
  return ApiResponse.ok(res, settings);
});

/**
 * GET /users/:userId
 */
const getUserProfile = asyncHandler(async (req, res) => {
  const profile = await userService.getUserProfile(
    req.params.userId,
    req.user.id
  );
  return ApiResponse.ok(res, profile);
});

/**
 * GET /users/:userId/followers
 */
const getFollowers = asyncHandler(async (req, res) => {
  const { data, meta } = await userService.getFollowers(req.params.userId, {
    cursor: req.query.cursor,
    limit: req.query.limit,
  });
  return ApiResponse.ok(res, data, meta);
});

/**
 * GET /users/:userId/following
 */
const getFollowing = asyncHandler(async (req, res) => {
  const { data, meta } = await userService.getFollowing(req.params.userId, {
    cursor: req.query.cursor,
    limit: req.query.limit,
  });
  return ApiResponse.ok(res, data, meta);
});

/**
 * POST /users/:userId/follow
 */
const followUser = asyncHandler(async (req, res) => {
  const result = await userService.followUser(req.user.id, req.params.userId);
  return ApiResponse.created(res, result);
});

/**
 * DELETE /users/:userId/follow
 */
const unfollowUser = asyncHandler(async (req, res) => {
  await userService.unfollowUser(req.user.id, req.params.userId);
  return ApiResponse.ok(res, { message: 'Unfollowed successfully' });
});

/**
 * POST /users/:userId/block
 */
const blockUser = asyncHandler(async (req, res) => {
  await userService.blockUser(req.user.id, req.params.userId);
  return ApiResponse.created(res, { message: 'User blocked' });
});

/**
 * DELETE /users/:userId/block
 */
const unblockUser = asyncHandler(async (req, res) => {
  await userService.unblockUser(req.user.id, req.params.userId);
  return ApiResponse.ok(res, { message: 'User unblocked' });
});

/**
 * GET /users/search?q=...
 */
const searchUsers = asyncHandler(async (req, res) => {
  const { data, meta } = await userService.searchUsers(req.query.q, {
    cursor: req.query.cursor,
    limit: req.query.limit,
  });
  return ApiResponse.ok(res, data, meta);
});

/**
 * GET /users/suggestions
 */
const getSuggestions = asyncHandler(async (req, res) => {
  const result = await userService.getSuggestions(req.user.id);
  return ApiResponse.ok(res, result.data, result.meta);
});

module.exports = {
  getMyProfile,
  updateProfile,
  uploadAvatar,
  getSettings,
  updateSettings,
  getUserProfile,
  getFollowers,
  getFollowing,
  followUser,
  unfollowUser,
  blockUser,
  unblockUser,
  searchUsers,
  getSuggestions,
};
