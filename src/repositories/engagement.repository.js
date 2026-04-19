const mongoose = require('mongoose');
const BaseRepository = require('./base.repository');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const Save = require('../models/Save');
const Share = require('../models/Share');
const { PAGINATION } = require('../config/constants');

/** Coerce string ids to ObjectIds for `$in` queries on engagement targets. */
function toObjectIdList(ids) {
  if (!ids?.length) return [];
  const out = [];
  for (const id of ids) {
    const s = String(id);
    if (mongoose.Types.ObjectId.isValid(s)) {
      out.push(new mongoose.Types.ObjectId(s));
    }
  }
  return out;
}

// ─── Comment Repository ──────────────────────────────────────

class CommentRepository extends BaseRepository {
  constructor() {
    super(Comment);
  }

  /**
   * Get top-level comments for a content item.
   */
  async getContentComments(contentType, contentId, options = {}) {
    return this.findMany(
      {
        content_type: contentType,
        content_id: contentId,
        parent_comment_id: null,
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
   * Get replies to a comment.
   */
  async getReplies(parentCommentId, options = {}) {
    return this.findMany(
      {
        parent_comment_id: parentCommentId,
        is_hidden: false,
      },
      {
        ...options,
        sort: { created_at: 1 }, // Oldest first for replies
        populate: [
          { path: 'user_id', select: 'username display_name avatar_url is_verified' },
        ],
      }
    );
  }

  /**
   * Get a comment with user details.
   */
  async getCommentWithUser(commentId) {
    const query = this.query()
      .where({ _id: commentId, is_hidden: false })
      .populate({
        path: 'user_id',
        select: 'username display_name avatar_url is_verified',
      });
    return query.execOne();
  }
}

// ─── Like Repository ─────────────────────────────────────────

class LikeRepository extends BaseRepository {
  constructor() {
    super(Like);
  }

  /**
   * Check if a user has liked a target.
   */
  async findLike(userId, targetType, targetId) {
    return this.findOne({
      user_id: userId,
      target_type: targetType,
      target_id: targetId,
    });
  }

  /**
   * Remove a like.
   */
  async removeLike(userId, targetType, targetId) {
    return this.model.findOneAndDelete({
      user_id: userId,
      target_type: targetType,
      target_id: targetId,
    });
  }

  /**
   * Get users who liked a target, with pagination.
   */
  async getLikers(targetType, targetId, options = {}) {
    return this.findMany(
      { target_type: targetType, target_id: targetId },
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
   * Batch: likes by this user for many targets (feed / explore hydration).
   */
  async findLikesByUserForTargets(userId, targetType, targetIds) {
    const oidList = toObjectIdList(targetIds);
    if (!oidList.length) return [];
    const limit = Math.min(oidList.length, PAGINATION.MAX_LIMIT);
    const { data } = await this.findMany(
      {
        user_id: userId,
        target_type: targetType,
        target_id: { $in: oidList },
      },
      {
        limit,
        sort: { created_at: -1 },
        select: 'target_id',
      },
    );
    return data;
  }
}

// ─── Save Repository ─────────────────────────────────────────

class SaveRepository extends BaseRepository {
  constructor() {
    super(Save);
  }

  async findSave(userId, targetType, targetId) {
    return this.findOne({
      user_id: userId,
      target_type: targetType,
      target_id: targetId,
    });
  }

  async removeSave(userId, targetType, targetId) {
    return this.model.findOneAndDelete({
      user_id: userId,
      target_type: targetType,
      target_id: targetId,
    });
  }

  /**
   * Batch: saves by this user for many targets (feed / explore hydration).
   */
  async findSavesByUserForTargets(userId, targetType, targetIds) {
    const oidList = toObjectIdList(targetIds);
    if (!oidList.length) return [];
    const limit = Math.min(oidList.length, PAGINATION.MAX_LIMIT);
    const { data } = await this.findMany(
      {
        user_id: userId,
        target_type: targetType,
        target_id: { $in: oidList },
      },
      {
        limit,
        sort: { created_at: -1 },
        select: 'target_id',
      },
    );
    return data;
  }

  /**
   * Get all saved items for a user, optionally filtered by collection.
   */
  async getUserSaves(userId, collectionName, options = {}) {
    const filter = { user_id: userId };
    if (collectionName) {
      filter.collection_name = collectionName;
    }
    return this.findMany(filter, {
      ...options,
      sort: { created_at: -1 },
    });
  }

  /**
   * Get distinct collection names for a user.
   */
  async getUserCollections(userId) {
    return this.model.distinct('collection_name', { user_id: userId });
  }

  /**
   * Collection names with save counts (for Saved → Collections UI).
   */
  async getCollectionSummaries(userId) {
    const names = (await this.model.distinct('collection_name', { user_id: userId })).filter(Boolean);
    const summaries = await Promise.all(
      names.map(async (name) => ({
        name,
        count: await this.countDocuments({ user_id: userId, collection_name: name }),
      })),
    );
    return summaries.sort((a, b) => a.name.localeCompare(b.name));
  }
}

// ─── Share Repository ────────────────────────────────────────

class ShareRepository extends BaseRepository {
  constructor() {
    super(Share);
  }
}

module.exports = {
  commentRepository: new CommentRepository(),
  likeRepository: new LikeRepository(),
  saveRepository: new SaveRepository(),
  shareRepository: new ShareRepository(),
};
