const { Router } = require('express');
const notificationController = require('../controllers/notification.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { standardLimiter } = require('../middleware/rateLimiter');
const notifValidator = require('../validators/notification.validator');

const router = Router();
router.use(authenticate);

router.get('/', standardLimiter, validate(notifValidator.listNotifications), notificationController.getNotifications);
router.get('/unread-count', standardLimiter, notificationController.getUnreadCount);
router.put('/read-all', standardLimiter, notificationController.markAllRead);
router.put('/:notifId/read', standardLimiter, validate(notifValidator.notifIdParam), notificationController.markAsRead);
router.delete('/:notifId', standardLimiter, validate(notifValidator.notifIdParam), notificationController.deleteNotification);

module.exports = router;
