const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const adminService = require('../services/admin.service');

// Reports (public-facing: submit)
const submitReport = asyncHandler(async (req, res) => {
  const report = await adminService.submitReport(req.user.id, req.body);
  return ApiResponse.created(res, report);
});

// Admin-only
const getReports = asyncHandler(async (req, res) => {
  const { data, meta } = await adminService.getReports({
    cursor: req.query.cursor, limit: req.query.limit,
  });
  return ApiResponse.ok(res, data, meta);
});

const resolveReport = asyncHandler(async (req, res) => {
  const result = await adminService.resolveReport(req.params.reportId, req.user.id, req.body);
  return ApiResponse.ok(res, result);
});

const banUser = asyncHandler(async (req, res) => {
  await adminService.banUser(req.params.userId, req.user.id, req.body);
  return ApiResponse.ok(res, { message: 'User banned' });
});

const unbanUser = asyncHandler(async (req, res) => {
  await adminService.unbanUser(req.params.userId, req.user.id);
  return ApiResponse.ok(res, { message: 'User unbanned' });
});

const reviewCampaign = asyncHandler(async (req, res) => {
  const result = await adminService.reviewCampaign(req.params.campaignId, req.user.id, req.body);
  return ApiResponse.ok(res, result);
});

const getDashboard = asyncHandler(async (_req, res) => {
  const stats = await adminService.getDashboardStats();
  return ApiResponse.ok(res, stats);
});

const getAuditLogs = asyncHandler(async (req, res) => {
  const { data, meta } = await adminService.getAuditLogs({
    cursor: req.query.cursor, limit: req.query.limit,
  });
  return ApiResponse.ok(res, data, meta);
});

module.exports = {
  submitReport, getReports, resolveReport,
  banUser, unbanUser, reviewCampaign,
  getDashboard, getAuditLogs,
};
