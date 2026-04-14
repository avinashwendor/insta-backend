const { Router } = require('express');
const ctrl = require('../controllers/analytics.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { standardLimiter } = require('../middleware/rateLimiter');
const v = require('../validators/monetization.validator');

const router = Router();
router.use(authenticate);

router.get('/me', standardLimiter, validate(v.dateRange), ctrl.getMyAnalytics);
router.get('/content/:contentType/:contentId', standardLimiter, validate(v.dateRange), ctrl.getContentAnalytics);
router.post('/watch', standardLimiter, validate(v.recordWatch), ctrl.recordWatch);

module.exports = router;
