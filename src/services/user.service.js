const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinaryHelper');
const {
  userRepository,
  userSettingRepository,
  followerRepository,
  blockedUserRepository,
} = require('../repositories/user.repository');
const { FOLLOW_STATUS } = require('../config/constants');

/**
 * User service — profile management, follow/unfollow, block, search.
 */

/**
 * Get current user's full profile.
 */
const getMyProfile = async (userId) => {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return user;
};

/**
 * Get another user's public profile.
 * Includes relationship status (is_following, is_followed_by, is_blocked).
 */
const getUserProfile = async (targetUserId, currentUserId) => {
  const user = await userRepository.findById(targetUserId);

  if (!user || !user.is_active) {
    throw ApiError.notFound('User not found');
  }

  // Check relationship statuses in parallel
  const [isFollowing, isFollowedBy, isBlocked] = await Promise.all([
    currentUserId
      ? followerRepository.findFollow(currentUserId, targetUserId)
      : null,
    currentUserId
      ? followerRepository.findFollow(targetUserId, currentUserId)
      : null,
    currentUserId
      ? blockedUserRepository.findBlock(currentUserId, targetUserId)
      : null,
  ]);

  return {
    id: user._id,
    username: user.username,
    display_name: user.display_name,
    bio: user.bio,
    avatar_url: user.avatar_url,
    cover_url: user.cover_url,
    is_verified: user.is_verified,
    is_private: user.is_private,
    account_type: user.account_type,
    membership_tier: user.membership_tier,
    followers_count: user.followers_count,
    following_count: user.following_count,
    posts_count: user.posts_count,
    reels_count: user.reels_count,
    website: user.website,
    is_following: !!(isFollowing && isFollowing.status === FOLLOW_STATUS.ACTIVE),
    is_followed_by: !!(isFollowedBy && isFollowedBy.status === FOLLOW_STATUS.ACTIVE),
    is_blocked: !!isBlocked,
  };
};

/**
 * Update current user's profile.
 */
const updateProfile = async (userId, updateData) => {
  const user = await userRepository.updateById(userId, updateData);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return user;
};

/**
 * Upload avatar image.
 */
const uploadAvatar = async (userId, fileBuffer) => {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const result = await uploadToCloudinary(fileBuffer, {
    folder: 'avatars',
    resourceType: 'image',
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
    ],
  });

  const updatedUser = await userRepository.updateById(userId, {
    avatar_url: result.url,
  });

  return updatedUser;
};

/**
 * Get user settings.
 */
const getSettings = async (userId) => {
  let settings = await userSettingRepository.findByUserId(userId);

  // Create default settings if they don't exist
  if (!settings) {
    settings = await userSettingRepository.create({ user_id: userId });
  }

  return settings;
};

/**
 * Update user settings (deep merge for nested objects).
 */
const updateSettings = async (userId, settingsData) => {
  // Flatten nested objects for $set to work correctly with dot notation
  const flattenedUpdate = {};

  for (const [section, values] of Object.entries(settingsData)) {
    if (typeof values === 'object' && values !== null) {
      for (const [key, value] of Object.entries(values)) {
        flattenedUpdate[`${section}.${key}`] = value;
      }
    }
  }

  const settings = await userSettingRepository.upsertByUserId(userId, flattenedUpdate);
  return settings;
};

/**
 * Follow a user.
 * If target is private, creates a pending follow request.
 */
const followUser = async (currentUserId, targetUserId) => {
  if (currentUserId === targetUserId) {
    throw ApiError.badRequest('Cannot follow yourself');
  }

  const targetUser = await userRepository.findById(targetUserId);

  if (!targetUser || !targetUser.is_active) {
    throw ApiError.notFound('User not found');
  }

  // Check if blocked
  const isBlocked = await blockedUserRepository.findBlock(targetUserId, currentUserId);
  if (isBlocked) {
    throw ApiError.forbidden('Cannot follow this user');
  }

  // Check existing follow
  const existingFollow = await followerRepository.findFollow(currentUserId, targetUserId);
  if (existingFollow) {
    if (existingFollow.status === FOLLOW_STATUS.ACTIVE) {
      throw ApiError.conflict('Already following this user');
    }
    if (existingFollow.status === FOLLOW_STATUS.PENDING) {
      throw ApiError.conflict('Follow request already pending');
    }
  }

  // Determine status based on target's privacy setting
  const status = targetUser.is_private ? FOLLOW_STATUS.PENDING : FOLLOW_STATUS.ACTIVE;

  const follow = await followerRepository.create({
    follower_id: currentUserId,
    following_id: targetUserId,
    status,
  });

  // Update counts only if immediately active
  if (status === FOLLOW_STATUS.ACTIVE) {
    await Promise.all([
      userRepository.incrementById(currentUserId, { following_count: 1 }),
      userRepository.incrementById(targetUserId, { followers_count: 1 }),
    ]);
  }

  logger.info(
    `User ${currentUserId} ${status === FOLLOW_STATUS.PENDING ? 'requested to follow' : 'followed'} ${targetUserId}`
  );

  return { status: follow.status };
};

/**
 * Unfollow a user.
 */
const unfollowUser = async (currentUserId, targetUserId) => {
  const follow = await followerRepository.findFollow(currentUserId, targetUserId);

  if (!follow) {
    throw ApiError.notFound('Not following this user');
  }

  const wasActive = follow.status === FOLLOW_STATUS.ACTIVE;

  await followerRepository.removeFollow(currentUserId, targetUserId);

  // Decrement counts only if the follow was active
  if (wasActive) {
    await Promise.all([
      userRepository.incrementById(currentUserId, { following_count: -1 }),
      userRepository.incrementById(targetUserId, { followers_count: -1 }),
    ]);
  }

  logger.info(`User ${currentUserId} unfollowed ${targetUserId}`);
};

/**
 * Get followers of a user.
 */
const getFollowers = async (userId, { cursor, limit }) => {
  return followerRepository.getFollowers(userId, { cursor, limit });
};

/**
 * Get users that a user follows.
 */
const getFollowing = async (userId, { cursor, limit }) => {
  return followerRepository.getFollowing(userId, { cursor, limit });
};

/**
 * Block a user.
 * Also removes any existing follow relationship in both directions.
 */
const blockUser = async (currentUserId, targetUserId) => {
  if (currentUserId === targetUserId) {
    throw ApiError.badRequest('Cannot block yourself');
  }

  const existingBlock = await blockedUserRepository.findBlock(currentUserId, targetUserId);
  if (existingBlock) {
    throw ApiError.conflict('User is already blocked');
  }

  // Remove follow relationships in both directions
  const [forwardFollow, reverseFollow] = await Promise.all([
    followerRepository.findFollow(currentUserId, targetUserId),
    followerRepository.findFollow(targetUserId, currentUserId),
  ]);

  const countUpdates = [];

  if (forwardFollow && forwardFollow.status === FOLLOW_STATUS.ACTIVE) {
    countUpdates.push(
      userRepository.incrementById(currentUserId, { following_count: -1 }),
      userRepository.incrementById(targetUserId, { followers_count: -1 })
    );
  }

  if (reverseFollow && reverseFollow.status === FOLLOW_STATUS.ACTIVE) {
    countUpdates.push(
      userRepository.incrementById(targetUserId, { following_count: -1 }),
      userRepository.incrementById(currentUserId, { followers_count: -1 })
    );
  }

  await Promise.all([
    blockedUserRepository.create({
      blocker_id: currentUserId,
      blocked_id: targetUserId,
    }),
    followerRepository.removeFollow(currentUserId, targetUserId),
    followerRepository.removeFollow(targetUserId, currentUserId),
    ...countUpdates,
  ]);

  logger.info(`User ${currentUserId} blocked ${targetUserId}`);
};

/**
 * Unblock a user.
 */
const unblockUser = async (currentUserId, targetUserId) => {
  const block = await blockedUserRepository.findBlock(currentUserId, targetUserId);

  if (!block) {
    throw ApiError.notFound('User is not blocked');
  }

  await blockedUserRepository.removeBlock(currentUserId, targetUserId);

  logger.info(`User ${currentUserId} unblocked ${targetUserId}`);
};

/**
 * Search users by text query.
 */
const searchUsers = async (query, { cursor, limit }) => {
  return userRepository.searchUsers(query, { cursor, limit });
};

/**
 * Get suggested profiles for the current user.
 */
const getSuggestions = async (userId) => {
  const followingIds = await followerRepository.getFollowingIds(userId);
  const blockedIds = await blockedUserRepository.getBlockedIds(userId);
  const excludeIds = [...followingIds, ...blockedIds];

  return userRepository.getSuggestions(userId, excludeIds, 20);
};

module.exports = {
  getMyProfile,
  getUserProfile,
  updateProfile,
  uploadAvatar,
  getSettings,
  updateSettings,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  blockUser,
  unblockUser,
  searchUsers,
  getSuggestions,
};
