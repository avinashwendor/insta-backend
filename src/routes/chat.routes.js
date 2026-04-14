const { Router } = require('express');
const chatController = require('../controllers/chat.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { standardLimiter, sensitiveLimiter } = require('../middleware/rateLimiter');
const chatValidator = require('../validators/chat.validator');

const router = Router();
router.use(authenticate);

router.get('/conversations', standardLimiter, chatController.getConversations);
router.post('/conversations', sensitiveLimiter, validate(chatValidator.createConversation), chatController.createConversation);
router.get('/conversations/:convId', standardLimiter, validate(chatValidator.convIdParam), chatController.getConversation);
router.get('/conversations/:convId/messages', standardLimiter, validate(chatValidator.listMessages), chatController.getMessages);
router.post('/conversations/:convId/messages', sensitiveLimiter, validate(chatValidator.sendMessage), chatController.sendMessage);
router.delete('/conversations/:convId/messages/:msgId', sensitiveLimiter, chatController.deleteMessage);
router.put('/conversations/:convId/font', sensitiveLimiter, validate(chatValidator.updateFont), chatController.updateFont);
router.post('/conversations/:convId/read', standardLimiter, validate(chatValidator.convIdParam), chatController.markAsRead);

module.exports = router;
