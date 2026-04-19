const mongoose = require('mongoose');
const BaseRepository = require('./base.repository');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

class ConversationRepository extends BaseRepository {
  constructor() { super(Conversation); }

  async getUserConversations(userId, options = {}) {
    return this.findMany(
      { 'participants.user_id': userId, is_active: true },
      {
        ...options,
        sort: { updated_at: -1 },
        populate: [
          { path: 'participants.user_id', select: 'username display_name avatar_url is_verified' },
        ],
      }
    );
  }

  /**
   * Find an existing 1:1 DM between two users.
   * Uses $elemMatch (not $all on a dotted path) so ObjectId/string IDs match reliably.
   */
  async findDmBetween(userA, userB) {
    const toOid = (id) => {
      const s = id?.toString?.() ?? String(id);
      return mongoose.Types.ObjectId.isValid(s) ? new mongoose.Types.ObjectId(s) : id;
    };
    const a = toOid(userA);
    const b = toOid(userB);
    return this.findOne({
      type: 'dm',
      is_active: true,
      $and: [
        { participants: { $elemMatch: { user_id: a } } },
        { participants: { $elemMatch: { user_id: b } } },
      ],
    });
  }

  async updateLastMessage(convId, text, senderId) {
    return this.updateById(convId, {
      last_message: { text, sender_id: senderId, sent_at: new Date() },
    });
  }
}

class MessageRepository extends BaseRepository {
  constructor() { super(Message); }

  async getConversationMessages(conversationId, options = {}) {
    return this.findMany(
      { conversation_id: conversationId, is_deleted: false },
      {
        ...options,
        sort: { created_at: -1 },
        populate: [
          { path: 'sender_id', select: 'username display_name avatar_url is_verified' },
        ],
      }
    );
  }

  /** Single message with populated sender (used after send). */
  async findByIdWithSender(id) {
    return this.query()
      .where({ _id: id })
      .populate({ path: 'sender_id', select: 'username display_name avatar_url is_verified' })
      .lean()
      .execOne();
  }
}

class NotificationRepository extends BaseRepository {
  constructor() { super(Notification); }

  async getUserNotifications(userId, options = {}) {
    return this.findMany(
      { recipient_id: userId },
      {
        ...options,
        sort: { created_at: -1 },
        populate: [
          { path: 'sender_id', select: 'username display_name avatar_url is_verified' },
        ],
      }
    );
  }

  async getUnreadCount(userId) {
    return this.countDocuments({ recipient_id: userId, is_read: false });
  }

  async markAllRead(userId) {
    return this.model.updateMany(
      { recipient_id: userId, is_read: false },
      { $set: { is_read: true } }
    );
  }
}

module.exports = {
  conversationRepository: new ConversationRepository(),
  messageRepository: new MessageRepository(),
  notificationRepository: new NotificationRepository(),
};
