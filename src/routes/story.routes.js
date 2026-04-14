const { Router } = require('express');
const storyController = require('../controllers/story.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { standardLimiter, sensitiveLimiter, uploadLimiter } = require('../middleware/rateLimiter');
const { uploadMedia } = require('../middleware/upload');
const storyValidator = require('../validators/story.validator');

const router = Router();

router.use(authenticate);

// Feed
router.get('/feed', standardLimiter, storyController.getStoryFeed);

// Highlights
router.post(
  '/highlights',
  sensitiveLimiter,
  validate(storyValidator.createHighlight),
  storyController.createHighlight
);
router.get('/highlights/:userId', standardLimiter, storyController.getUserHighlights);

// CRUD
router.post(
  '/',
  uploadLimiter,
  uploadMedia.single('media'),
  validate(storyValidator.createStory),
  storyController.createStory
);

router.get('/:storyId', standardLimiter, validate(storyValidator.getStory), storyController.getStory);
router.delete('/:storyId', sensitiveLimiter, validate(storyValidator.getStory), storyController.deleteStory);

// Engagement
router.post('/:storyId/view', standardLimiter, validate(storyValidator.getStory), storyController.viewStory);
router.post('/:storyId/react', sensitiveLimiter, validate(storyValidator.reactToStory), storyController.reactToStory);
router.get('/:storyId/viewers', standardLimiter, validate(storyValidator.getStory), storyController.getStoryViewers);

module.exports = router;
