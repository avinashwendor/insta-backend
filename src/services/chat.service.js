const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { conversationRepository, messageRepository } = require('../repositories/chat.repository');

const toComparableId = (id) => (id?.toString?.() ?? String(id));

const createConversation = async (userId, { type, participant_ids, group_name, initial_message }) => {
  const uidStr = toComparableId(userId);
  const others = (participant_ids || [])
    .map((id) => toComparableId(id))
    .filter((id) => id && id !== uidStr);

  // For DMs, check if conversation already exists (normalize IDs so lookup always hits).
  if (type === 'dm') {
    if (!participant_ids || participant_ids.length !== 1) {
      throw ApiError.badRequest('DM conversations require exactly one other participant');
    }
    if (others.length !== 1) {
      throw ApiError.badRequest('Cannot start a DM with yourself');
    }
    const existing = await conversationRepository.findDmBetween(uidStr, others[0]);
    if (existing) return existing;
  }

  const userOid = mongoose.Types.ObjectId.isValid(uidStr) ? new mongoose.Types.ObjectId(uidStr) : userId;
  const otherOids = others.map((s) => (mongoose.Types.ObjectId.isValid(s) ? new mongoose.Types.ObjectId(s) : s));
  const allParticipantIds = [userOid, ...otherOids];

  const participants = allParticipantIds.map((id) => ({
    user_id: id,
    role: toComparableId(id) === uidStr && type === 'group' ? 'admin' : 'member',
  }));

  const conversation = await conversationRepository.create({
    type,
    participants,
    group_name: type === 'group' ? group_name : undefined,
  });

  // Send initial message if provided
  if (initial_message && initial_message.text) {
    const message = await messageRepository.create({
      conversation_id: conversation._id,
      sender_id: userId,
      type: initial_message.type || 'text',
      content: { text: initial_message.text },
    });
    await conversationRepository.updateLastMessage(conversation._id, initial_message.text, userId);
  }

  logger.info(`Conversation created: ${conversation._id} by user ${userId}`);
  return conversation;
};

const getUserConversations = async (userId, { cursor, limit }) => {
  return conversationRepository.getUserConversations(userId, { cursor, limit });
};

const getConversation = async (convId, userId) => {
  const conv = await conversationRepository.findById(convId);
  if (!conv) throw ApiError.notFound('Conversation not found');

  const isParticipant = conv.participants.some(
    (p) => p.user_id.toString() === userId
  );
  if (!isParticipant) throw ApiError.forbidden('You are not a participant in this conversation');

  return conv;
};

const getMessages = async (convId, userId, { cursor, limit }) => {
  // Verify participation
  await getConversation(convId, userId);
  return messageRepository.getConversationMessages(convId, { cursor, limit });
};

const sendMessage = async (convId, userId, messageData) => {
  await getConversation(convId, userId);

  const message = await messageRepository.create({
    conversation_id: convId,
    sender_id: userId,
    type: messageData.type || 'text',
    content: messageData.content,
    font: messageData.font,
  });

  const previewText = messageData.content.text || `[${messageData.type}]`;
  await conversationRepository.updateLastMessage(convId, previewText, userId);

  const populated = await messageRepository.findByIdWithSender(message._id);
  return populated ?? message;
};

const deleteMessage = async (msgId, userId) => {
  const message = await messageRepository.findById(msgId);
  if (!message) throw ApiError.notFound('Message not found');
  if (message.sender_id.toString() !== userId) {
    throw ApiError.forbidden('You can only delete your own messages');
  }

  await messageRepository.updateById(msgId, { is_deleted: true });
};

const updateFontPreference = async (convId, userId, font) => {
  const conv = await conversationRepository.findById(convId);
  if (!conv) throw ApiError.notFound('Conversation not found');

  const participantIndex = conv.participants.findIndex(
    (p) => p.user_id.toString() === userId
  );
  if (participantIndex === -1) throw ApiError.forbidden('Not a participant');

  const updatePath = `participants.${participantIndex}.font_preference`;
  await conversationRepository.model.findByIdAndUpdate(convId, {
    $set: { [updatePath]: font },
  });

  return { message: 'Font preference updated' };
};

const markAsRead = async (convId, userId) => {
  await getConversation(convId, userId);

  // Mark all unread messages as read by this user
  await messageRepository.model.updateMany(
    {
      conversation_id: convId,
      'read_by.user_id': { $ne: userId },
      sender_id: { $ne: userId },
    },
    { $push: { read_by: { user_id: userId, read_at: new Date() } } }
  );
};

module.exports = {
  createConversation,
  getUserConversations,
  getConversation,
  getMessages,
  sendMessage,
  deleteMessage,
  updateFontPreference,
  markAsRead,
};
