const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { conversationRepository, messageRepository } = require('../repositories/chat.repository');

const createConversation = async (userId, { type, participant_ids, group_name, initial_message }) => {
  const allParticipantIds = [userId, ...participant_ids.filter((id) => id !== userId)];

  // For DMs, check if conversation already exists
  if (type === 'dm') {
    if (participant_ids.length !== 1) {
      throw ApiError.badRequest('DM conversations require exactly one other participant');
    }
    const existing = await conversationRepository.findDmBetween(userId, participant_ids[0]);
    if (existing) return existing;
  }

  const participants = allParticipantIds.map((id) => ({
    user_id: id,
    role: id === userId && type === 'group' ? 'admin' : 'member',
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

  return messageRepository.findById(message._id);
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
