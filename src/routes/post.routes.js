const { Router } = require('express');
const postController = require('../controllers/post.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { standardLimiter, sensitiveLimiter, uploadLimiter } = require('../middleware/rateLimiter');
const { uploadMedia } = require('../middleware/upload');
const postValidator = require('../validators/post.validator');

const router = Router();

router.use(authenticate);

// Feed & Discovery
router.get('/feed', standardLimiter, validate(postValidator.listPosts), postController.getFeed);
router.get('/explore', standardLimiter, validate(postValidator.listPosts), postController.getExplore);

// CRUD
router.post(
  '/',
  uploadLimiter,
  uploadMedia.array('media', 10),
  validate(postValidator.createPost),
  postController.createPost
);

router.get('/:postId', standardLimiter, validate(postValidator.getPost), postController.getPost);
router.put('/:postId', sensitiveLimiter, validate(postValidator.updatePost), postController.updatePost);
router.delete('/:postId', sensitiveLimiter, validate(postValidator.getPost), postController.deletePost);

// Engagement
router.post('/:postId/like', sensitiveLimiter, validate(postValidator.getPost), postController.likePost);
router.delete('/:postId/like', sensitiveLimiter, validate(postValidator.getPost), postController.unlikePost);
router.get('/:postId/likes', standardLimiter, validate(postValidator.getPost), postController.getPostLikes);

// Comments
router.get('/:postId/comments', standardLimiter, validate(postValidator.getPost), postController.getComments);
router.post('/:postId/comments', sensitiveLimiter, validate(postValidator.addComment), postController.addComment);

// Save
router.post('/:postId/save', sensitiveLimiter, validate(postValidator.savePost), postController.savePost);
router.delete('/:postId/save', sensitiveLimiter, validate(postValidator.getPost), postController.unsavePost);

// Share
router.post('/:postId/share', sensitiveLimiter, validate(postValidator.sharePost), postController.sharePost);

// Pin
router.put('/:postId/pin', sensitiveLimiter, validate(postValidator.getPost), postController.togglePin);

module.exports = router;
