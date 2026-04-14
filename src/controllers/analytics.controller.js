const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const analyticsService = require('../services/analytics.service');

const getMyAnalytics = asyncHandler(async (req, res) => {
  const result = await analyticsService.getUserAnalytics(
    req.user.id, req.query.start_date, req.query.end_date
  );
  return ApiResponse.ok(res, result.data, result.meta);
});

const getContentAnalytics = asyncHandler(async (req, res) => {
  const result = await analyticsService.getContentAnalytics(
    req.params.contentType, req.params.contentId,
    req.query.start_date, req.query.end_date
  );
  return ApiResponse.ok(res, result.data, result.meta);
});

const recordWatch = asyncHandler(async (req, res) => {
  await analyticsService.recordWatchSession(req.user.id, req.body);
  return ApiResponse.created(res, { message: 'Watch session recorded' });
});

module.exports = { getMyAnalytics, getContentAnalytics, recordWatch };
