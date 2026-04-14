const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const chatService = require('../services/chat.service');

const createConversation = asyncHandler(async (req, res) => {
  const conv = await chatService.createConversation(req.user.id, req.body);
  return ApiResponse.created(res, conv);
});

const getConversations = asyncHandler(async (req, res) => {
  const { data, meta } = await chatService.getUserConversations(req.user.id, {
    cursor: req.query.cursor, limit: req.query.limit,
  });
  return ApiResponse.ok(res, data, meta);
});

const getConversation = asyncHandler(async (req, res) => {
  const conv = await chatService.getConversation(req.params.convId, req.user.id);
  return ApiResponse.ok(res, conv);
});

const getMessages = asyncHandler(async (req, res) => {
  const { data, meta } = await chatService.getMessages(req.params.convId, req.user.id, {
    cursor: req.query.cursor, limit: req.query.limit,
  });
  return ApiResponse.ok(res, data, meta);
});

const sendMessage = asyncHandler(async (req, res) => {
  const message = await chatService.sendMessage(req.params.convId, req.user.id, req.body);
  return ApiResponse.created(res, message);
});

const deleteMessage = asyncHandler(async (req, res) => {
  await chatService.deleteMessage(req.params.msgId, req.user.id);
  return ApiResponse.ok(res, { message: 'Message deleted' });
});

const updateFont = asyncHandler(async (req, res) => {
  const result = await chatService.updateFontPreference(req.params.convId, req.user.id, req.body);
  return ApiResponse.ok(res, result);
});

const markAsRead = asyncHandler(async (req, res) => {
  await chatService.markAsRead(req.params.convId, req.user.id);
  return ApiResponse.ok(res, { message: 'Marked as read' });
});

module.exports = {
  createConversation, getConversations, getConversation,
  getMessages, sendMessage, deleteMessage, updateFont, markAsRead,
};
