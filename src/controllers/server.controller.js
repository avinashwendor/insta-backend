const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const serverService = require('../services/server.service');

const createServer = asyncHandler(async (req, res) => {
  const server = await serverService.createServer(req.user.id, req.body);
  return ApiResponse.created(res, server);
});

const getMyServers = asyncHandler(async (req, res) => {
  const result = await serverService.getMyServers(req.user.id);
  return ApiResponse.ok(res, result.data, result.meta);
});

const discoverServers = asyncHandler(async (req, res) => {
  const { data, meta } = await serverService.discoverServers({
    cursor: req.query.cursor, limit: req.query.limit,
  });
  return ApiResponse.ok(res, data, meta);
});

const getServer = asyncHandler(async (req, res) => {
  const server = await serverService.getServer(req.params.serverId);
  return ApiResponse.ok(res, server);
});

const updateServer = asyncHandler(async (req, res) => {
  const server = await serverService.updateServer(req.params.serverId, req.user.id, req.body);
  return ApiResponse.ok(res, server);
});

const deleteServer = asyncHandler(async (req, res) => {
  await serverService.deleteServer(req.params.serverId, req.user.id);
  return ApiResponse.ok(res, { message: 'Server deleted' });
});

const joinServer = asyncHandler(async (req, res) => {
  const result = await serverService.joinServer(req.params.serverId, req.user.id);
  return ApiResponse.created(res, result);
});

const leaveServer = asyncHandler(async (req, res) => {
  await serverService.leaveServer(req.params.serverId, req.user.id);
  return ApiResponse.ok(res, { message: 'Left server' });
});

const joinByInvite = asyncHandler(async (req, res) => {
  const result = await serverService.joinByInviteCode(req.params.inviteCode, req.user.id);
  return ApiResponse.created(res, result);
});

const getMembers = asyncHandler(async (req, res) => {
  const { data, meta } = await serverService.getMembers(req.params.serverId, {
    cursor: req.query.cursor, limit: req.query.limit,
  });
  return ApiResponse.ok(res, data, meta);
});

const updateMemberRole = asyncHandler(async (req, res) => {
  const result = await serverService.updateMemberRole(
    req.params.serverId, req.params.userId, req.body.role, req.user.id
  );
  return ApiResponse.ok(res, result);
});

const createChannel = asyncHandler(async (req, res) => {
  const channel = await serverService.createChannel(req.params.serverId, req.user.id, req.body);
  return ApiResponse.created(res, channel);
});

const getChannels = asyncHandler(async (req, res) => {
  const result = await serverService.getChannels(req.params.serverId);
  return ApiResponse.ok(res, result.data, result.meta);
});

const getChannelMessages = asyncHandler(async (req, res) => {
  const { data, meta } = await serverService.getChannelMessages(
    req.params.serverId, req.params.channelId, req.user.id,
    { cursor: req.query.cursor, limit: req.query.limit }
  );
  return ApiResponse.ok(res, data, meta);
});

const sendChannelMessage = asyncHandler(async (req, res) => {
  const message = await serverService.sendChannelMessage(
    req.params.serverId, req.params.channelId, req.user.id, req.body.text
  );
  return ApiResponse.created(res, message);
});

module.exports = {
  createServer, getMyServers, discoverServers, getServer, updateServer, deleteServer,
  joinServer, leaveServer, joinByInvite, getMembers, updateMemberRole,
  createChannel, getChannels, getChannelMessages, sendChannelMessage,
};
