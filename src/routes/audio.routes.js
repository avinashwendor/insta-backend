const { Router } = require('express');
const ctrl = require('../controllers/audio.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { standardLimiter, uploadLimiter } = require('../middleware/rateLimiter');
const { uploadMedia } = require('../middleware/upload');
const v = require('../validators/audio.validator');

const router = Router();
router.use(authenticate);

router.post('/', uploadLimiter, uploadMedia.single('audio'), ctrl.uploadAudio);
router.get('/trending', standardLimiter, ctrl.getTrending);
router.get('/search', standardLimiter, validate(v.searchAudio), ctrl.searchAudio);
router.get('/genre/:genre', standardLimiter, ctrl.getByGenre);
router.get('/:audioId', standardLimiter, validate(v.audioIdParam), ctrl.getAudioTrack);

module.exports = router;
