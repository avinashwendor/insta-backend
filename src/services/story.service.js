const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { uploadToCloudinary, getThumbnailUrl } = require('../utils/cloudinaryHelper');
const { storyRepository } = require('../repositories/story.repository');
const { followerRepository } = require('../repositories/user.repository');

/**
 * Story service — create, view, react, highlights.
 */

const STORY_DURATION_HOURS = 24;

/**
 * Create a new story.
 */
const createStory = async (userId, storyData, mediaFile) => {
  if (!mediaFile) {
    throw ApiError.badRequest('Media file is required for stories');
  }

  const isVideo = mediaFile.mimetype.startsWith('video/');
  const result = await uploadToCloudinary(mediaFile.buffer, {
    folder: 'stories',
    resourceType: isVideo ? 'video' : 'image',
  });

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + STORY_DURATION_HOURS);

  const story = await storyRepository.create({
    user_id: userId,
    media: {
      url: result.url,
      thumbnail_url: isVideo ? getThumbnailUrl(result.url) : result.url,
      type: isVideo ? 'video' : 'image',
      duration: result.duration || (isVideo ? 15 : 5),
      width: result.width,
      height: result.height,
    },
    caption: storyData.caption || '',
    stickers: storyData.stickers || [],
    filter_id: storyData.filter_id,
    visibility: storyData.visibility || 'public',
    expires_at: expiresAt,
  });

  logger.info(`Story created: ${story._id} by user ${userId}`);
  return story;
};

/**
 * Get a single story.
 */
const getStory = async (storyId) => {
  const story = await storyRepository.findById(storyId);

  if (!story) {
    throw ApiError.notFound('Story not found');
  }

  return story;
};

/**
 * Delete a story (only by owner).
 */
const deleteStory = async (storyId, userId) => {
  const story = await storyRepository.findById(storyId);

  if (!story) {
    throw ApiError.notFound('Story not found');
  }

  if (story.user_id.toString() !== userId) {
    throw ApiError.forbidden('You can only delete your own stories');
  }

  await storyRepository.deleteById(storyId);
  logger.info(`Story deleted: ${storyId} by user ${userId}`);
};

/**
 * Get stories feed — active stories from followed users.
 */
const getStoryFeed = async (userId, { cursor, limit }) => {
  const followingIds = await followerRepository.getFollowingIds(userId);
  return storyRepository.getFeedStories(followingIds, { cursor, limit });
};

/**
 * Mark a story as viewed by the current user.
 */
const viewStory = async (storyId, userId) => {
  const story = await storyRepository.findById(storyId);

  if (!story) {
    throw ApiError.notFound('Story not found');
  }

  await storyRepository.addViewer(storyId, userId);
};

/**
 * React to a story.
 */
const reactToStory = async (storyId, userId, emoji) => {
  const story = await storyRepository.findById(storyId);

  if (!story) {
    throw ApiError.notFound('Story not found');
  }

  await storyRepository.addReaction(storyId, userId, emoji);
};

/**
 * Get story viewers (owner only).
 */
const getStoryViewers = async (storyId, userId) => {
  const story = await storyRepository.findById(storyId);

  if (!story) {
    throw ApiError.notFound('Story not found');
  }

  if (story.user_id.toString() !== userId) {
    throw ApiError.forbidden('Only the story owner can view viewers');
  }

  return story.viewers || [];
};

/**
 * Create a highlight group from existing stories.
 */
const createHighlight = async (userId, groupName, storyIds) => {
  await storyRepository.promoteToHighlight(storyIds, groupName);
  logger.info(`Highlight created: "${groupName}" with ${storyIds.length} stories`);
  return { group_name: groupName, story_count: storyIds.length };
};

/**
 * Get a user's highlights.
 */
const getUserHighlights = async (userId) => {
  const result = await storyRepository.getUserHighlights(userId);
  // Group by highlight_group
  const groups = {};
  for (const story of result.data) {
    const group = story.highlight_group || 'Ungrouped';
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(story);
  }
  return groups;
};

/**
 * Get a user's active stories.
 */
const getUserStories = async (userId) => {
  return storyRepository.getUserStories(userId);
};

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
  getUserStories,
};
