const BaseRepository = require('./base.repository');
const Post = require('../models/Post');
const Hashtag = require('../models/Hashtag');

class PostRepository extends BaseRepository {
  constructor() {
    super(Post);
  }

  /**
   * Get posts for home feed: posts from followed users, newest first.
   */
  async getFeedPosts(followingIds, options = {}) {
    return this.findMany(
      {
        user_id: { $in: followingIds },
        is_hidden: false,
        visibility: { $in: ['public', 'followers'] },
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
   * Get explore/discover posts: public, non-hidden, trending.
   */
  async getExplorePosts(options = {}) {
    return this.findMany(
      {
        is_hidden: false,
        visibility: 'public',
        is_flagged: false,
      },
      {
        ...options,
        sort: { likes_count: -1, created_at: -1 },
        populate: [
          { path: 'user_id', select: 'username display_name avatar_url is_verified' },
        ],
      }
    );
  }

  /**
   * Get all posts by a specific user.
   */
  async getUserPosts(userId, options = {}) {
    return this.findMany(
      { user_id: userId, is_hidden: false },
      {
        ...options,
        sort: { is_pinned: -1, created_at: -1 },
        populate: [
          { path: 'user_id', select: 'username display_name avatar_url is_verified' },
        ],
      }
    );
  }

  /**
   * Get a single post with user details populated.
   */
  async getPostWithUser(postId) {
    const query = this.query()
      .where({ _id: postId, is_hidden: false })
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
   * Get posts by hashtag.
   */
  async getPostsByHashtag(hashtag, options = {}) {
    return this.findMany(
      {
        hashtags: hashtag,
        is_hidden: false,
        visibility: 'public',
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
}

// ─── Hashtag Repository ──────────────────────────────────────

class HashtagRepository extends BaseRepository {
  constructor() {
    super(Hashtag);
  }

  /**
   * Upsert hashtags and increment their counts.
   * Creates new hashtags if they don't exist.
   * @param {string[]} names - Hashtag names (without #)
   * @param {string} contentType - 'post' or 'reel'
   */
  async upsertAndIncrement(names, contentType) {
    if (!names || names.length === 0) return;

    const incField = contentType === 'post' ? 'posts_count' : 'reels_count';

    const operations = names.map((name) => ({
      updateOne: {
        filter: { name },
        update: {
          $inc: { [incField]: 1 },
          $setOnInsert: { name },
        },
        upsert: true,
      },
    }));

    await this.model.bulkWrite(operations);
  }

  /**
   * Decrement hashtag counts when content is deleted.
   */
  async decrementCounts(names, contentType) {
    if (!names || names.length === 0) return;

    const incField = contentType === 'post' ? 'posts_count' : 'reels_count';

    const operations = names.map((name) => ({
      updateOne: {
        filter: { name },
        update: { $inc: { [incField]: -1 } },
      },
    }));

    await this.model.bulkWrite(operations);
  }

  /**
   * Get trending hashtags.
   */
  async getTrending(limit = 20) {
    return this.findMany(
      { is_trending: true, is_banned: false },
      { limit, sort: { posts_count: -1 } }
    );
  }

  /**
   * Search hashtags by prefix.
   */
  async searchByPrefix(prefix, limit = 10) {
    return this.findMany(
      {
        name: { $regex: `^${prefix}`, $options: 'i' },
        is_banned: false,
      },
      { limit, sort: { posts_count: -1 } }
    );
  }
}

module.exports = {
  postRepository: new PostRepository(),
  hashtagRepository: new HashtagRepository(),
};
