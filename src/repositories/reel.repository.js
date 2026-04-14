const BaseRepository = require('./base.repository');
const Reel = require('../models/Reel');

class ReelRepository extends BaseRepository {
  constructor() {
    super(Reel);
  }

  /**
   * Get reels feed (from followed users).
   */
  async getFeedReels(followingIds, options = {}) {
    return this.findMany(
      {
        user_id: { $in: followingIds },
        is_hidden: false,
      },
      {
        ...options,
        sort: { created_at: -1 },
        populate: [
          { path: 'user_id', select: 'username display_name avatar_url is_verified' },
        ],
      }
    );
  }

  /**
   * Get trending reels (highest views + recent).
   */
  async getTrendingReels(options = {}) {
    return this.findMany(
      { is_hidden: false, is_flagged: false },
      {
        ...options,
        sort: { views_count: -1, created_at: -1 },
        populate: [
          { path: 'user_id', select: 'username display_name avatar_url is_verified' },
        ],
      }
    );
  }

  /**
   * Get "for you" personalized feed.
   * In a real system this would use ML. For now: mix of trending + recent public.
   */
  async getForYouReels(excludeUserIds = [], options = {}) {
    return this.findMany(
      {
        is_hidden: false,
        is_flagged: false,
        user_id: { $nin: excludeUserIds },
      },
      {
        ...options,
        sort: { views_count: -1, likes_count: -1, created_at: -1 },
        populate: [
          { path: 'user_id', select: 'username display_name avatar_url is_verified' },
        ],
      }
    );
  }

  /**
   * Get a user's reels.
   */
  async getUserReels(userId, options = {}) {
    return this.findMany(
      { user_id: userId, is_hidden: false },
      {
        ...options,
        sort: { created_at: -1 },
        populate: [
          { path: 'user_id', select: 'username display_name avatar_url is_verified' },
        ],
      }
    );
  }

  /**
   * Get a single reel with user and collaborator details.
   */
  async getReelWithUser(reelId) {
    const query = this.query()
      .where({ _id: reelId, is_hidden: false })
      .populate({
        path: 'user_id',
        select: 'username display_name avatar_url is_verified',
      })
      .populate({
        path: 'collaborators.user_id',
        select: 'username display_name avatar_url',
      });
    return query.execOne();
  }

  /**
   * Get reels using a specific audio track.
   */
  async getReelsByAudio(audioId, options = {}) {
    return this.findMany(
      { 'audio.audio_id': audioId, is_hidden: false },
      {
        ...options,
        sort: { created_at: -1 },
        populate: [
          { path: 'user_id', select: 'username display_name avatar_url is_verified' },
        ],
      }
    );
  }
}

module.exports = {
  reelRepository: new ReelRepository(),
};
