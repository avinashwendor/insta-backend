const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const notificationService = require('../services/notification.service');

const getNotifications = asyncHandler(async (req, res) => {
  const { data, meta } = await notificationService.getUserNotifications(req.user.id, {
    cursor: req.query.cursor, limit: req.query.limit,
  });
  return ApiResponse.ok(res, data, meta);
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const result = await notificationService.getUnreadCount(req.user.id);
  return ApiResponse.ok(res, result);
});

const markAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAsRead(req.params.notifId, req.user.id);
  return ApiResponse.ok(res, { message: 'Marked as read' });
});

const markAllRead = asyncHandler(async (req, res) => {
  await notificationService.markAllRead(req.user.id);
  return ApiResponse.ok(res, { message: 'All notifications marked as read' });
});

const deleteNotification = asyncHandler(async (req, res) => {
  await notificationService.deleteNotification(req.params.notifId, req.user.id);
  return ApiResponse.ok(res, { message: 'Notification deleted' });
});

module.exports = { getNotifications, getUnreadCount, markAsRead, markAllRead, deleteNotification };
