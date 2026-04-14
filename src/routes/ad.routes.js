const { Router } = require('express');
const ctrl = require('../controllers/ad.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { standardLimiter, sensitiveLimiter } = require('../middleware/rateLimiter');
const v = require('../validators/ad.validator');

const router = Router();
router.use(authenticate);

router.post('/campaigns', sensitiveLimiter, validate(v.createCampaign), ctrl.createCampaign);
router.get('/campaigns', standardLimiter, ctrl.getMyCampaigns);
router.get('/campaigns/:campaignId', standardLimiter, validate(v.campaignIdParam), ctrl.getCampaign);
router.put('/campaigns/:campaignId/status', sensitiveLimiter, validate(v.updateCampaignStatus), ctrl.updateStatus);
router.post('/campaigns/:campaignId/submit', sensitiveLimiter, validate(v.campaignIdParam), ctrl.submitForReview);
router.post('/impressions', standardLimiter, validate(v.recordImpression), ctrl.recordImpression);
router.get('/earnings', standardLimiter, ctrl.getMyEarnings);

module.exports = router;
