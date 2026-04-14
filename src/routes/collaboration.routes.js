const { Router } = require('express');
const ctrl = require('../controllers/collaboration.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { standardLimiter, sensitiveLimiter } = require('../middleware/rateLimiter');
const v = require('../validators/collaboration.validator');

const router = Router();
router.use(authenticate);

router.post('/', sensitiveLimiter, validate(v.createCollaboration), ctrl.create);
router.get('/mine', standardLimiter, ctrl.getMyCollaborations);
router.get('/pending', standardLimiter, ctrl.getPendingInvites);
router.put('/:collabId/respond', sensitiveLimiter, validate(v.respondCollaboration), ctrl.respond);

module.exports = router;
