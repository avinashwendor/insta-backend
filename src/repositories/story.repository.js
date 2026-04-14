const BaseRepository = require('./base.repository');
const Story = require('../models/Story');

class StoryRepository extends BaseRepository {
  constructor() {
    super(Story);
  }

  /**
   * Get active (non-expired) stories from followed users.
   */
  async getFeedStories(followingIds, options = {}) {
    return this.findMany(
      {
        user_id: { $in: followingIds },
        expires_at: { $gt: new Date() },
        is_highlight: false,
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
   * Get a user's active stories.
   */
  async getUserStories(userId) {
    return this.findMany(
      {
        user_id: userId,
        expires_at: { $gt: new Date() },
        is_highlight: false,
      },
      {
        sort: { created_at: -1 },
        populate: [
          { path: 'user_id', select: 'username display_name avatar_url is_verified' },
        ],
      }
    );
  }

  /**
   * Get a user's highlight stories grouped by highlight_group.
   */
  async getUserHighlights(userId) {
    return this.findMany(
      { user_id: userId, is_highlight: true },
      {
        sort: { highlight_group: 1, created_at: 1 },
        limit: 500,
      }
    );
  }

  /**
   * Add a viewer to a story (idempotent — won't add duplicate viewers).
   */
  async addViewer(storyId, userId) {
    return this.model.findOneAndUpdate(
      {
        _id: storyId,
        'viewers.user_id': { $ne: userId },
      },
      {
        $push: { viewers: { user_id: userId, viewed_at: new Date() } },
        $inc: { views_count: 1 },
      },
      { new: true }
    );
  }

  /**
   * Add a reaction to a story.
   */
  async addReaction(storyId, userId, emoji) {
    return this.model.findByIdAndUpdate(
      storyId,
      {
        $push: {
          reactions: { user_id: userId, emoji, created_at: new Date() },
        },
      },
      { new: true }
    );
  }

  /**
   * Promote stories to highlights.
   */
  async promoteToHighlight(storyIds, groupName) {
    return this.model.updateMany(
      { _id: { $in: storyIds } },
      {
        $set: {
          is_highlight: true,
          highlight_group: groupName,
          // Remove TTL expiry for highlights
          expires_at: new Date('2099-12-31'),
        },
      }
    );
  }
}

module.exports = {
  storyRepository: new StoryRepository(),
};
