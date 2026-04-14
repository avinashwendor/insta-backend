const { Router } = require('express');
const userController = require('../controllers/user.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { standardLimiter, sensitiveLimiter } = require('../middleware/rateLimiter');
const { uploadImage } = require('../middleware/upload');
const userValidator = require('../validators/user.validator');

const router = Router();

// All user routes require authentication
router.use(authenticate);

// ─── Current User ────────────────────────────────────────────

router.get('/me', standardLimiter, userController.getMyProfile);

router.put(
  '/me',
  sensitiveLimiter,
  validate(userValidator.updateProfile),
  userController.updateProfile
);

router.put(
  '/me/avatar',
  sensitiveLimiter,
  uploadImage.single('avatar'),
  userController.uploadAvatar
);

router.get('/me/settings', standardLimiter, userController.getSettings);

router.put(
  '/me/settings',
  sensitiveLimiter,
  validate(userValidator.updateSettings),
  userController.updateSettings
);

// ─── Discovery ───────────────────────────────────────────────

router.get(
  '/search',
  standardLimiter,
  validate(userValidator.searchUsers),
  userController.searchUsers
);

router.get('/suggestions', standardLimiter, userController.getSuggestions);

// ─── Other Users (parameterized) ─────────────────────────────

router.get(
  '/:userId',
  standardLimiter,
  validate(userValidator.getUserParam),
  userController.getUserProfile
);

router.get(
  '/:userId/followers',
  standardLimiter,
  validate(userValidator.listFollows),
  userController.getFollowers
);

router.get(
  '/:userId/following',
  standardLimiter,
  validate(userValidator.listFollows),
  userController.getFollowing
);

router.post(
  '/:userId/follow',
  sensitiveLimiter,
  validate(userValidator.getUserParam),
  userController.followUser
);

router.delete(
  '/:userId/follow',
  sensitiveLimiter,
  validate(userValidator.getUserParam),
  userController.unfollowUser
);

router.post(
  '/:userId/block',
  sensitiveLimiter,
  validate(userValidator.getUserParam),
  userController.blockUser
);

router.delete(
  '/:userId/block',
  sensitiveLimiter,
  validate(userValidator.getUserParam),
  userController.unblockUser
);

module.exports = router;
