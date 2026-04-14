const { Router } = require('express');
const serverController = require('../controllers/server.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { standardLimiter, sensitiveLimiter } = require('../middleware/rateLimiter');
const sv = require('../validators/server.validator');

const router = Router();
router.use(authenticate);

router.post('/', sensitiveLimiter, validate(sv.createServer), serverController.createServer);
router.get('/mine', standardLimiter, serverController.getMyServers);
router.get('/discover', standardLimiter, serverController.discoverServers);
router.post('/join/:inviteCode', sensitiveLimiter, validate(sv.joinByInvite), serverController.joinByInvite);

router.get('/:serverId', standardLimiter, validate(sv.serverIdParam), serverController.getServer);
router.put('/:serverId', sensitiveLimiter, validate(sv.updateServer), serverController.updateServer);
router.delete('/:serverId', sensitiveLimiter, validate(sv.serverIdParam), serverController.deleteServer);
router.post('/:serverId/join', sensitiveLimiter, validate(sv.serverIdParam), serverController.joinServer);
router.post('/:serverId/leave', sensitiveLimiter, validate(sv.serverIdParam), serverController.leaveServer);
router.get('/:serverId/members', standardLimiter, validate(sv.serverIdParam), serverController.getMembers);
router.put('/:serverId/members/:userId/role', sensitiveLimiter, validate(sv.updateMemberRole), serverController.updateMemberRole);
router.post('/:serverId/channels', sensitiveLimiter, validate(sv.createChannel), serverController.createChannel);
router.get('/:serverId/channels', standardLimiter, validate(sv.serverIdParam), serverController.getChannels);
router.get('/:serverId/channels/:channelId/messages', standardLimiter, validate(sv.channelMessages), serverController.getChannelMessages);
router.post('/:serverId/channels/:channelId/messages', sensitiveLimiter, validate(sv.sendChannelMessage), serverController.sendChannelMessage);

module.exports = router;
