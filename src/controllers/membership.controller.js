const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const membershipService = require('../services/membership.service');

const getTiers = asyncHandler(async (req, res) => {
  const result = await membershipService.getTiers();
  return ApiResponse.ok(res, result.data, result.meta);
});

const subscribe = asyncHandler(async (req, res) => {
  const txn = await membershipService.subscribe(req.user.id, req.params.membershipId, req.body);
  return ApiResponse.created(res, txn);
});

const getMySubscription = asyncHandler(async (req, res) => {
  const sub = await membershipService.getMySubscription(req.user.id);
  return ApiResponse.ok(res, sub);
});

const getHistory = asyncHandler(async (req, res) => {
  const { data, meta } = await membershipService.getTransactionHistory(req.user.id, {
    cursor: req.query.cursor, limit: req.query.limit,
  });
  return ApiResponse.ok(res, data, meta);
});

module.exports = { getTiers, subscribe, getMySubscription, getHistory };
