const { Router } = require('express');
const reelController = require('../controllers/reel.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { standardLimiter, sensitiveLimiter, uploadLimiter } = require('../middleware/rateLimiter');
const { uploadMedia } = require('../middleware/upload');
const reelValidator = require('../validators/reel.validator');

const router = Router();

router.use(authenticate);

// Feed & Discovery
router.get('/feed', standardLimiter, validate(reelValidator.listReels), reelController.getReelsFeed);
router.get('/trending', standardLimiter, validate(reelValidator.listReels), reelController.getTrendingReels);
router.get('/for-you', standardLimiter, validate(reelValidator.listReels), reelController.getForYouReels);

// CRUD
router.post(
  '/',
  uploadLimiter,
  uploadMedia.single('video'),
  validate(reelValidator.createReel),
  reelController.createReel
);

router.get('/:reelId', standardLimiter, validate(reelValidator.getReel), reelController.getReel);
router.put('/:reelId', sensitiveLimiter, validate(reelValidator.updateReel), reelController.updateReel);
router.delete('/:reelId', sensitiveLimiter, validate(reelValidator.getReel), reelController.deleteReel);

// Engagement
router.post('/:reelId/like', sensitiveLimiter, validate(reelValidator.getReel), reelController.likeReel);
router.delete('/:reelId/like', sensitiveLimiter, validate(reelValidator.getReel), reelController.unlikeReel);

// Comments
router.get('/:reelId/comments', standardLimiter, validate(reelValidator.getReel), reelController.getComments);
router.post('/:reelId/comments', sensitiveLimiter, validate(reelValidator.addComment), reelController.addComment);

// Save & Share
router.post('/:reelId/save', sensitiveLimiter, validate(reelValidator.getReel), reelController.saveReel);
router.post('/:reelId/share', sensitiveLimiter, validate(reelValidator.shareReel), reelController.shareReel);

module.exports = router;
