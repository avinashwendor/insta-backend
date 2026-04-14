const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const reelService = require('../services/reel.service');
const commentService = require('../services/comment.service');

/**
 * Reel controller.
 */

const createReel = asyncHandler(async (req, res) => {
  const reel = await reelService.createReel(req.user.id, req.body, req.file);
  return ApiResponse.created(res, reel);
});

const getReel = asyncHandler(async (req, res) => {
  const reel = await reelService.getReel(req.params.reelId, req.user.id);
  return ApiResponse.ok(res, reel);
});

const updateReel = asyncHandler(async (req, res) => {
  const reel = await reelService.updateReel(req.params.reelId, req.user.id, req.body);
  return ApiResponse.ok(res, reel);
});

const deleteReel = asyncHandler(async (req, res) => {
  await reelService.deleteReel(req.params.reelId, req.user.id);
  return ApiResponse.ok(res, { message: 'Reel deleted' });
});

const getReelsFeed = asyncHandler(async (req, res) => {
  const { data, meta } = await reelService.getReelsFeed(req.user.id, {
    cursor: req.query.cursor,
    limit: req.query.limit,
  });
  return ApiResponse.ok(res, data, meta);
});

const getTrendingReels = asyncHandler(async (req, res) => {
  const { data, meta } = await reelService.getTrendingReels({
    cursor: req.query.cursor,
    limit: req.query.limit,
  });
  return ApiResponse.ok(res, data, meta);
});

const getForYouReels = asyncHandler(async (req, res) => {
  const { data, meta } = await reelService.getForYouReels(req.user.id, {
    cursor: req.query.cursor,
    limit: req.query.limit,
  });
  return ApiResponse.ok(res, data, meta);
});

const likeReel = asyncHandler(async (req, res) => {
  await reelService.likeReel(req.params.reelId, req.user.id);
  return ApiResponse.created(res, { message: 'Reel liked' });
});

const unlikeReel = asyncHandler(async (req, res) => {
  await reelService.unlikeReel(req.params.reelId, req.user.id);
  return ApiResponse.ok(res, { message: 'Reel unliked' });
});

const getComments = asyncHandler(async (req, res) => {
  const { data, meta } = await commentService.getComments('reel', req.params.reelId, {
    cursor: req.query.cursor,
    limit: req.query.limit,
  });
  return ApiResponse.ok(res, data, meta);
});

const addComment = asyncHandler(async (req, res) => {
  const comment = await commentService.addComment(
    'reel', req.params.reelId, req.user.id, req.body.text
  );
  return ApiResponse.created(res, comment);
});

const saveReel = asyncHandler(async (req, res) => {
  await reelService.saveReel(req.params.reelId, req.user.id);
  return ApiResponse.created(res, { message: 'Reel saved' });
});

const shareReel = asyncHandler(async (req, res) => {
  await reelService.shareReel(req.params.reelId, req.user.id, req.body);
  return ApiResponse.created(res, { message: 'Reel shared' });
});

module.exports = {
  createReel,
  getReel,
  updateReel,
  deleteReel,
  getReelsFeed,
  getTrendingReels,
  getForYouReels,
  likeReel,
  unlikeReel,
  getComments,
  addComment,
  saveReel,
  shareReel,
};
