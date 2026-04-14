const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { authLimiter, sensitiveLimiter } = require('../middleware/rateLimiter');
const authValidator = require('../validators/auth.validator');

const router = Router();

// Public auth routes (rate limited with AUTH tier)
router.post(
  '/register',
  authLimiter,
  validate(authValidator.register),
  authController.register
);

router.post(
  '/login',
  authLimiter,
  validate(authValidator.login),
  authController.login
);

router.post(
  '/refresh-token',
  authLimiter,
  validate(authValidator.refreshToken),
  authController.refreshToken
);

router.post(
  '/forgot-password',
  authLimiter,
  validate(authValidator.forgotPassword),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  authLimiter,
  validate(authValidator.resetPassword),
  authController.resetPassword
);

// Protected auth routes
router.post(
  '/logout',
  authenticate,
  authController.logout
);

router.post(
  '/2fa/enable',
  authenticate,
  sensitiveLimiter,
  authController.register // placeholder — 2FA to be fully implemented in later phase
);

module.exports = router;
