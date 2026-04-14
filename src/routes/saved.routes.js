const { Router } = require('express');
const ctrl = require('../controllers/saved.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { standardLimiter, sensitiveLimiter } = require('../middleware/rateLimiter');
const v = require('../validators/saved.validator');

const router = Router();
router.use(authenticate);

router.get('/', standardLimiter, validate(v.listSaved), ctrl.getMySaved);
router.get('/collections', standardLimiter, ctrl.getMyCollections);
router.put('/:saveId/move', sensitiveLimiter, validate(v.moveToCollection), ctrl.moveToCollection);

module.exports = router;
