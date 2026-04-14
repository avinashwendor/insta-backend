const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { uploadToCloudinary, getThumbnailUrl } = require('../utils/cloudinaryHelper');
const { extractHashtags, extractMentions } = require('../utils/textParser');
const { reelRepository } = require('../repositories/reel.repository');
const { hashtagRepository } = require('../repositories/post.repository');
const { likeRepository, saveRepository, shareRepository } = require('../repositories/engagement.repository');
const { userRepository, followerRepository } = require('../repositories/user.repository');

/**
 * Reel service — upload, feed, trending, engagement.
 */

/**
 * Create a new reel.
 */
const createReel = async (userId, reelData, videoFile) => {
  if (!videoFile) {
    throw ApiError.badRequest('Video file is required for reels');
  }

  const result = await uploadToCloudinary(videoFile.buffer, {
    folder: 'reels',
    resourceType: 'video',
  });

  const hashtags = extractHashtags(reelData.description);
  const mentionUsernames = extractMentions(reelData.description);

  // Resolve mentions
  const mentions = [];
  for (const username of mentionUsernames) {
    const user = await userRepository.findOne({ username });
    if (user) mentions.push(user._id);
  }

  const reel = await reelRepository.create({
    user_id: userId,
    video_url: result.url,
    thumbnail_url: getThumbnailUrl(result.url),
    duration: result.duration || 0,
    width: result.width,
    height: result.height,
    title: reelData.title || '',
    description: reelData.description || '',
    hashtags,
    mentions,
    audio: reelData.audio_id
      ? {
          audio_id: reelData.audio_id,
          is_original: false,
          start_offset: reelData.audio_start_offset || 0,
        }
      : { is_original: true },
    collaborators: reelData.collaborators || [],
    allow_remix: reelData.allow_remix !== false,
    allow_duet: reelData.allow_duet !== false,
    comments_enabled: reelData.comments_enabled !== false,
  });

  // Update hashtag counts
  if (hashtags.length > 0) {
    await hashtagRepository.upsertAndIncrement(hashtags, 'reel');
  }

  // Increment user reel count
  await userRepository.incrementById(userId, { reels_count: 1 });

  logger.info(`Reel created: ${reel._id} by user ${userId}`);
  return reelRepository.getReelWithUser(reel._id);
};

/**
 * Get a single reel.
 */
const getReel = async (reelId, currentUserId) => {
  const reel = await reelRepository.getReelWithUser(reelId);
  if (!reel) throw ApiError.notFound('Reel not found');

  const [isLiked, isSaved] = await Promise.all([
    currentUserId ? likeRepository.findLike(currentUserId, 'reel', reelId) : null,
    currentUserId ? saveRepository.findSave(currentUserId, 'reel', reelId) : null,
  ]);

  const reelObj = reel.toJSON ? reel.toJSON() : reel;
  reelObj.is_liked = !!isLiked;
  reelObj.is_saved = !!isSaved;

  return reelObj;
};

/**
 * Update a reel.
 */
const updateReel = async (reelId, userId, updateData) => {
  const reel = await reelRepository.findById(reelId);
  if (!reel) throw ApiError.notFound('Reel not found');
  if (reel.user_id.toString() !== userId) {
    throw ApiError.forbidden('You can only edit your own reels');
  }

  if (updateData.description !== undefined) {
    const oldHashtags = reel.hashtags || [];
    const newHashtags = extractHashtags(updateData.description);
    updateData.hashtags = newHashtags;

    const added = newHashtags.filter((h) => !oldHashtags.includes(h));
    const removed = oldHashtags.filter((h) => !newHashtags.includes(h));

    if (added.length > 0) await hashtagRepository.upsertAndIncrement(added, 'reel');
    if (removed.length > 0) await hashtagRepository.decrementCounts(removed, 'reel');
  }

  await reelRepository.updateById(reelId, updateData);
  return reelRepository.getReelWithUser(reelId);
};

/**
 * Delete a reel.
 */
const deleteReel = async (reelId, userId) => {
  const reel = await reelRepository.findById(reelId);
  if (!reel) throw ApiError.notFound('Reel not found');
  if (reel.user_id.toString() !== userId) {
    throw ApiError.forbidden('You can only delete your own reels');
  }

  if (reel.hashtags && reel.hashtags.length > 0) {
    await hashtagRepository.decrementCounts(reel.hashtags, 'reel');
  }

  await reelRepository.deleteById(reelId);
  await userRepository.incrementById(userId, { reels_count: -1 });
  logger.info(`Reel deleted: ${reelId} by user ${userId}`);
};

/**
 * Get reels feed (from followed users).
 */
const getReelsFeed = async (userId, { cursor, limit }) => {
  const followingIds = await followerRepository.getFollowingIds(userId);
  followingIds.push(userId);
  return reelRepository.getFeedReels(followingIds, { cursor, limit });
};

/**
 * Get trending reels.
 */
const getTrendingReels = async ({ cursor, limit }) => {
  return reelRepository.getTrendingReels({ cursor, limit });
};

/**
 * Get personalized "for you" feed.
 */
const getForYouReels = async (userId, { cursor, limit }) => {
  return reelRepository.getForYouReels([userId], { cursor, limit });
};

/**
 * Like a reel.
 */
const likeReel = async (reelId, userId) => {
  const reel = await reelRepository.findById(reelId);
  if (!reel) throw ApiError.notFound('Reel not found');

  const existing = await likeRepository.findLike(userId, 'reel', reelId);
  if (existing) throw ApiError.conflict('Already liked this reel');

  await likeRepository.create({ user_id: userId, target_type: 'reel', target_id: reelId });
  await reelRepository.incrementById(reelId, { likes_count: 1 });
};

/**
 * Unlike a reel.
 */
const unlikeReel = async (reelId, userId) => {
  const removed = await likeRepository.removeLike(userId, 'reel', reelId);
  if (!removed) throw ApiError.notFound('Like not found');
  await reelRepository.incrementById(reelId, { likes_count: -1 });
};

/**
 * Save a reel.
 */
const saveReel = async (reelId, userId) => {
  const reel = await reelRepository.findById(reelId);
  if (!reel) throw ApiError.notFound('Reel not found');

  const existing = await saveRepository.findSave(userId, 'reel', reelId);
  if (existing) throw ApiError.conflict('Already saved this reel');

  await saveRepository.create({ user_id: userId, target_type: 'reel', target_id: reelId });
  await reelRepository.incrementById(reelId, { saves_count: 1 });
};

/**
 * Share a reel.
 */
const shareReel = async (reelId, userId, shareData) => {
  const reel = await reelRepository.findById(reelId);
  if (!reel) throw ApiError.notFound('Reel not found');

  await shareRepository.create({
    user_id: userId,
    target_type: 'reel',
    target_id: reelId,
    share_type: shareData.share_type,
    recipient_id: shareData.recipient_id || null,
    platform: shareData.platform || null,
  });

  await reelRepository.incrementById(reelId, { shares_count: 1 });
};

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
  saveReel,
  shareReel,
};
