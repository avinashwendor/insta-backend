const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const storyService = require('../services/story.service');

/**
 * Story controller.
 */

const createStory = asyncHandler(async (req, res) => {
  const story = await storyService.createStory(req.user.id, req.body, req.file);
  return ApiResponse.created(res, story);
});

const getStory = asyncHandler(async (req, res) => {
  const story = await storyService.getStory(req.params.storyId);
  return ApiResponse.ok(res, story);
});

const deleteStory = asyncHandler(async (req, res) => {
  await storyService.deleteStory(req.params.storyId, req.user.id);
  return ApiResponse.ok(res, { message: 'Story deleted' });
});

const getStoryFeed = asyncHandler(async (req, res) => {
  const { data, meta } = await storyService.getStoryFeed(req.user.id, {
    cursor: req.query.cursor,
    limit: req.query.limit,
  });
  return ApiResponse.ok(res, data, meta);
});

const viewStory = asyncHandler(async (req, res) => {
  await storyService.viewStory(req.params.storyId, req.user.id);
  return ApiResponse.ok(res, { message: 'Story marked as viewed' });
});

const reactToStory = asyncHandler(async (req, res) => {
  await storyService.reactToStory(req.params.storyId, req.user.id, req.body.emoji);
  return ApiResponse.created(res, { message: 'Reaction added' });
});

const getStoryViewers = asyncHandler(async (req, res) => {
  const viewers = await storyService.getStoryViewers(req.params.storyId, req.user.id);
  return ApiResponse.ok(res, viewers);
});

const createHighlight = asyncHandler(async (req, res) => {
  const result = await storyService.createHighlight(
    req.user.id, req.body.group_name, req.body.story_ids
  );
  return ApiResponse.created(res, result);
});

const getUserHighlights = asyncHandler(async (req, res) => {
  const highlights = await storyService.getUserHighlights(req.params.userId);
  return ApiResponse.ok(res, highlights);
});

module.exports = {
  createStory,
  getStory,
  deleteStory,
  getStoryFeed,
  viewStory,
  reactToStory,
  getStoryViewers,
  createHighlight,
  getUserHighlights,
};
