const { Router } = require('express');
const commentController = require('../controllers/comment.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { standardLimiter, sensitiveLimiter } = require('../middleware/rateLimiter');
const commentValidator = require('../validators/comment.validator');

const router = Router();

router.use(authenticate);

// Comment operations (standalone — adding comments is via /posts/:id/comments and /reels/:id/comments)
router.put('/:commentId', sensitiveLimiter, validate(commentValidator.updateComment), commentController.updateComment);
router.delete('/:commentId', sensitiveLimiter, validate(commentValidator.getComment), commentController.deleteComment);

// Replies
router.post('/:commentId/reply', sensitiveLimiter, validate(commentValidator.replyToComment), commentController.replyToComment);
router.get('/:commentId/replies', standardLimiter, validate(commentValidator.listReplies), commentController.getReplies);

// Like
router.post('/:commentId/like', sensitiveLimiter, validate(commentValidator.getComment), commentController.likeComment);
router.delete('/:commentId/like', sensitiveLimiter, validate(commentValidator.getComment), commentController.unlikeComment);

module.exports = router;
