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

  async findDmBetween(userA, userB) {
    return this.findOne({
      type: 'dm',
      is_active: true,
      'participants.user_id': { $all: [userA, userB] },
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
          { path: 'sender_id', select: 'username display_name avatar_url' },
        ],
      }
    );
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
