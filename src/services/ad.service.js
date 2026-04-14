const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const {
  adCampaignRepository,
  adImpressionRepository,
  adRevenueRepository,
} = require('../repositories/monetization.repository');

const createCampaign = async (userId, data) => {
  const campaign = await adCampaignRepository.create({
    ...data,
    advertiser_id: userId,
    status: 'draft',
  });
  logger.info(`Ad campaign created: ${campaign._id}`);
  return campaign;
};

const getMyCampaigns = async (userId, { cursor, limit }) => {
  return adCampaignRepository.getUserCampaigns(userId, { cursor, limit });
};

const getCampaign = async (campaignId, userId) => {
  const campaign = await adCampaignRepository.findById(campaignId);
  if (!campaign) throw ApiError.notFound('Campaign not found');
  if (campaign.advertiser_id.toString() !== userId) {
    throw ApiError.forbidden('Not your campaign');
  }
  return campaign;
};

const updateCampaignStatus = async (campaignId, userId, status) => {
  const campaign = await getCampaign(campaignId, userId);
  if (!['active', 'paused'].includes(status)) throw ApiError.badRequest('Invalid status');
  return adCampaignRepository.updateById(campaignId, { status });
};

const submitForReview = async (campaignId, userId) => {
  const campaign = await getCampaign(campaignId, userId);
  if (campaign.status !== 'draft') throw ApiError.conflict('Campaign can only be submitted from draft');
  return adCampaignRepository.updateById(campaignId, { status: 'pending_review' });
};

const recordImpression = async (userId, { campaign_id, event_type, placement }) => {
  await adImpressionRepository.create({
    campaign_id,
    user_id: userId,
    event_type,
    placement,
  });

  const incField = event_type === 'click' ? 'metrics.clicks' : 'metrics.impressions';
  await adCampaignRepository.model.findByIdAndUpdate(campaign_id, { $inc: { [incField]: 1 } });
};

const getMyEarnings = async (userId, { cursor, limit }) => {
  return adRevenueRepository.getCreatorEarnings(userId, { cursor, limit });
};

module.exports = {
  createCampaign, getMyCampaigns, getCampaign,
  updateCampaignStatus, submitForReview, recordImpression, getMyEarnings,
};
