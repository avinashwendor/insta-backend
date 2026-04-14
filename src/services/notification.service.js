const ApiError = require('../utils/ApiError');
const { notificationRepository } = require('../repositories/chat.repository');

const getUserNotifications = async (userId, { cursor, limit }) => {
  return notificationRepository.getUserNotifications(userId, { cursor, limit });
};

const getUnreadCount = async (userId) => {
  const count = await notificationRepository.getUnreadCount(userId);
  return { unread_count: count };
};

const markAsRead = async (notifId, userId) => {
  const notif = await notificationRepository.findById(notifId);
  if (!notif) throw ApiError.notFound('Notification not found');
  if (notif.recipient_id.toString() !== userId) {
    throw ApiError.forbidden('Not your notification');
  }
  await notificationRepository.updateById(notifId, { is_read: true });
};

const markAllRead = async (userId) => {
  await notificationRepository.markAllRead(userId);
};

const deleteNotification = async (notifId, userId) => {
  const notif = await notificationRepository.findById(notifId);
  if (!notif) throw ApiError.notFound('Notification not found');
  if (notif.recipient_id.toString() !== userId) {
    throw ApiError.forbidden('Not your notification');
  }
  await notificationRepository.deleteById(notifId);
};

/**
 * Create a notification (used internally by other services).
 */
const createNotification = async ({ recipientId, senderId, type, text, targetType, targetId }) => {
  // Don't notify yourself
  if (recipientId === senderId) return null;

  return notificationRepository.create({
    recipient_id: recipientId,
    sender_id: senderId,
    type,
    content: { text, target_type: targetType, target_id: targetId },
  });
};

module.exports = {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllRead,
  deleteNotification,
  createNotification,
};
