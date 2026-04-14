const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const collaborationService = require('../services/collaboration.service');

const create = asyncHandler(async (req, res) => {
  const result = await collaborationService.createCollaboration(req.user.id, req.body);
  return ApiResponse.created(res, result);
});

const respond = asyncHandler(async (req, res) => {
  const result = await collaborationService.respondToCollaboration(
    req.params.collabId, req.user.id, req.body.action
  );
  return ApiResponse.ok(res, result);
});

const getMyCollaborations = asyncHandler(async (req, res) => {
  const { data, meta } = await collaborationService.getMyCollaborations(req.user.id, {
    cursor: req.query.cursor, limit: req.query.limit,
  });
  return ApiResponse.ok(res, data, meta);
});

const getPendingInvites = asyncHandler(async (req, res) => {
  const { data, meta } = await collaborationService.getPendingInvites(req.user.id, {
    cursor: req.query.cursor, limit: req.query.limit,
  });
  return ApiResponse.ok(res, data, meta);
});

module.exports = { create, respond, getMyCollaborations, getPendingInvites };
