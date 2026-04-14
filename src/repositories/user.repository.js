const BaseRepository = require('./base.repository');
const User = require('../models/User');
const UserSetting = require('../models/UserSetting');
const UserSession = require('../models/UserSession');
const Follower = require('../models/Follower');
const BlockedUser = require('../models/BlockedUser');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  /**
   * Find user by email, including password hash for auth.
   * @param {string} email
   * @returns {Promise<object|null>}
   */
  async findByEmailWithPassword(email) {
    return this.model.findOne({ email }).select('+password_hash').lean();
  }

  /**
   * Find user by username.
   * @param {string} username
   * @returns {Promise<object|null>}
   */
  async findByUsername(username) {
    return this.findOne({ username });
  }

  /**
   * Check if email or username is already taken.
   * @param {string} email
   * @param {string} username
   * @returns {Promise<{ emailTaken: boolean, usernameTaken: boolean }>}
   */
  async checkDuplicates(email, username) {
    const [emailExists, usernameExists] = await Promise.all([
      this.findOne({ email }),
      this.findOne({ username }),
    ]);
    return {
      emailTaken: !!emailExists,
      usernameTaken: !!usernameExists,
    };
  }

  /**
   * Full-text search for users by username, display_name, or bio.
   * @param {string} searchQuery
   * @param {object} options - { cursor, limit }
   * @returns {Promise<{ data: Array, meta: object }>}
   */
  async searchUsers(searchQuery, options = {}) {
    return this.findMany(
      {
        $text: { $search: searchQuery },
        is_active: true,
      },
      {
        ...options,
        select: 'username display_name avatar_url bio is_verified account_type',
        sort: { score: { $meta: 'textScore' } },
      }
    );
  }

  /**
   * Get suggested users for a user (simple: recent active users they don't follow).
   * @param {string} userId - Current user ID
   * @param {string[]} followingIds - IDs of users already followed
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  async getSuggestions(userId, followingIds, limit = 20) {
    const excludeIds = [userId, ...followingIds];
    return this.findMany(
      {
        _id: { $nin: excludeIds },
        is_active: true,
        is_banned: false,
      },
      {
        limit,
        select: 'username display_name avatar_url bio is_verified followers_count',
        sort: { followers_count: -1, created_at: -1 },
      }
    );
  }
}

// ─── Settings Repository ─────────────────────────────────────

class UserSettingRepository extends BaseRepository {
  constructor() {
    super(UserSetting);
  }

  async findByUserId(userId) {
    return this.findOne({ user_id: userId });
  }

  /**
   * Create or update settings using upsert.
   * @param {string} userId
   * @param {object} settingsData
   * @returns {Promise<object>}
   */
  async upsertByUserId(userId, settingsData) {
    return this.model.findOneAndUpdate(
      { user_id: userId },
      { $set: settingsData },
      { new: true, upsert: true, runValidators: true }
    );
  }
}

// ─── Session Repository ──────────────────────────────────────

class UserSessionRepository extends BaseRepository {
  constructor() {
    super(UserSession);
  }

  async findByRefreshTokenHash(hash) {
    return this.findOne({ refresh_token_hash: hash, is_active: true });
  }

  async deactivateSession(sessionId) {
    return this.updateById(sessionId, { is_active: false });
  }

  async deactivateAllUserSessions(userId) {
    return this.model.updateMany(
      { user_id: userId },
      { $set: { is_active: false } }
    );
  }

  async getActiveSessionsByUser(userId) {
    return this.findMany(
      { user_id: userId, is_active: true },
      { sort: { last_used_at: -1 } }
    );
  }
}

// ─── Follower Repository ─────────────────────────────────────

class FollowerRepository extends BaseRepository {
  constructor() {
    super(Follower);
  }

  /**
   * Check if follower follows following.
   * @param {string} followerId
   * @param {string} followingId
   * @returns {Promise<object|null>}
   */
  async findFollow(followerId, followingId) {
    return this.findOne({ follower_id: followerId, following_id: followingId });
  }

  /**
   * Get followers of a user with pagination.
   */
  async getFollowers(userId, options = {}) {
    return this.findMany(
      { following_id: userId, status: 'active' },
      {
        ...options,
        sort: { created_at: -1 },
        populate: [
          {
            path: 'follower_id',
            select: 'username display_name avatar_url is_verified',
          },
        ],
      }
    );
  }

  /**
   * Get users that a user follows with pagination.
   */
  async getFollowing(userId, options = {}) {
    return this.findMany(
      { follower_id: userId, status: 'active' },
      {
        ...options,
        sort: { created_at: -1 },
        populate: [
          {
            path: 'following_id',
            select: 'username display_name avatar_url is_verified',
          },
        ],
      }
    );
  }

  /**
   * Get all active following IDs for a user (for feed, suggestions).
   * @param {string} userId
   * @returns {Promise<string[]>}
   */
  async getFollowingIds(userId) {
    const result = await this.findMany(
      { follower_id: userId, status: 'active' },
      { select: 'following_id', limit: 10000 }
    );
    return result.data.map((f) => f.following_id.toString());
  }

  async removeFollow(followerId, followingId) {
    return this.model.findOneAndDelete({
      follower_id: followerId,
      following_id: followingId,
    });
  }

  /**
   * Get pending follow requests for a user (private accounts).
   */
  async getPendingRequests(userId, options = {}) {
    return this.findMany(
      { following_id: userId, status: 'pending' },
      {
        ...options,
        sort: { created_at: -1 },
        populate: [
          {
            path: 'follower_id',
            select: 'username display_name avatar_url is_verified',
          },
        ],
      }
    );
  }
}

// ─── Blocked User Repository ─────────────────────────────────

class BlockedUserRepository extends BaseRepository {
  constructor() {
    super(BlockedUser);
  }

  async findBlock(blockerId, blockedId) {
    return this.findOne({ blocker_id: blockerId, blocked_id: blockedId });
  }

  async removeBlock(blockerId, blockedId) {
    return this.model.findOneAndDelete({
      blocker_id: blockerId,
      blocked_id: blockedId,
    });
  }

  /**
   * Get all blocked user IDs for a user.
   * @param {string} userId
   * @returns {Promise<string[]>}
   */
  async getBlockedIds(userId) {
    const result = await this.findMany(
      { blocker_id: userId },
      { select: 'blocked_id', limit: 10000 }
    );
    return result.data.map((b) => b.blocked_id.toString());
  }
}

module.exports = {
  userRepository: new UserRepository(),
  userSettingRepository: new UserSettingRepository(),
  userSessionRepository: new UserSessionRepository(),
  followerRepository: new FollowerRepository(),
  blockedUserRepository: new BlockedUserRepository(),
};
