const { Router } = require('express');
const ctrl = require('../controllers/membership.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { standardLimiter, sensitiveLimiter } = require('../middleware/rateLimiter');
const v = require('../validators/monetization.validator');

const router = Router();
router.use(authenticate);

router.get('/tiers', standardLimiter, ctrl.getTiers);
router.get('/my-subscription', standardLimiter, ctrl.getMySubscription);
router.post('/subscribe/:membershipId', sensitiveLimiter, validate(v.subscribe), ctrl.subscribe);
router.get('/transactions', standardLimiter, ctrl.getHistory);

module.exports = router;
