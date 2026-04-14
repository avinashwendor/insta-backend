const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const adService = require('../services/ad.service');

const createCampaign = asyncHandler(async (req, res) => {
  const campaign = await adService.createCampaign(req.user.id, req.body);
  return ApiResponse.created(res, campaign);
});

const getMyCampaigns = asyncHandler(async (req, res) => {
  const { data, meta } = await adService.getMyCampaigns(req.user.id, {
    cursor: req.query.cursor, limit: req.query.limit,
  });
  return ApiResponse.ok(res, data, meta);
});

const getCampaign = asyncHandler(async (req, res) => {
  const campaign = await adService.getCampaign(req.params.campaignId, req.user.id);
  return ApiResponse.ok(res, campaign);
});

const updateStatus = asyncHandler(async (req, res) => {
  const campaign = await adService.updateCampaignStatus(req.params.campaignId, req.user.id, req.body.status);
  return ApiResponse.ok(res, campaign);
});

const submitForReview = asyncHandler(async (req, res) => {
  const campaign = await adService.submitForReview(req.params.campaignId, req.user.id);
  return ApiResponse.ok(res, campaign);
});

const recordImpression = asyncHandler(async (req, res) => {
  await adService.recordImpression(req.user.id, req.body);
  return ApiResponse.created(res, { message: 'Impression recorded' });
});

const getMyEarnings = asyncHandler(async (req, res) => {
  const { data, meta } = await adService.getMyEarnings(req.user.id, {
    cursor: req.query.cursor, limit: req.query.limit,
  });
  return ApiResponse.ok(res, data, meta);
});

module.exports = { createCampaign, getMyCampaigns, getCampaign, updateStatus, submitForReview, recordImpression, getMyEarnings };
