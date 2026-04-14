const { Router } = require('express');
const ctrl = require('../controllers/admin.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { standardLimiter, sensitiveLimiter } = require('../middleware/rateLimiter');
const v = require('../validators/admin.validator');
const { ACCOUNT_TYPES } = require('../config/constants');

const router = Router();

// Public: any user can submit a report
router.post(
  '/reports',
  authenticate,
  sensitiveLimiter,
  validate(v.submitReport),
  ctrl.submitReport
);

// Admin-only routes
router.use(authenticate, authorize(ACCOUNT_TYPES.ADMIN));

router.get('/dashboard', standardLimiter, ctrl.getDashboard);
router.get('/reports', standardLimiter, ctrl.getReports);
router.put('/reports/:reportId', sensitiveLimiter, validate(v.resolveReport), ctrl.resolveReport);
router.post('/users/:userId/ban', sensitiveLimiter, validate(v.banUser), ctrl.banUser);
router.delete('/users/:userId/ban', sensitiveLimiter, ctrl.unbanUser);
router.put('/campaigns/:campaignId/review', sensitiveLimiter, validate(v.reviewCampaign), ctrl.reviewCampaign);
router.get('/audit-logs', standardLimiter, ctrl.getAuditLogs);

module.exports = router;
