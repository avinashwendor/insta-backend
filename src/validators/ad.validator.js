const Joi = require('joi');

const createCampaign = {
  body: Joi.object({
    name: Joi.string().min(1).max(200).required(),
    type: Joi.string().valid('banner', 'interstitial', 'native', 'sponsored_post', 'sponsored_reel').required(),
    target_audience: Joi.object({
      age_range: Joi.object({ min: Joi.number().min(13).max(100), max: Joi.number().min(13).max(100) }),
      genders: Joi.array().items(Joi.string()),
      locations: Joi.array().items(Joi.string()),
      interests: Joi.array().items(Joi.string()),
    }),
    budget: Joi.object({
      total: Joi.number().min(1).required(),
      daily_limit: Joi.number().min(1),
      bid_type: Joi.string().valid('cpm', 'cpc', 'cpa').required(),
      bid_amount: Joi.number().min(0.01).required(),
    }).required(),
    schedule: Joi.object({
      start_date: Joi.date().min('now').required(),
      end_date: Joi.date().greater(Joi.ref('start_date')).required(),
    }).required(),
    creative: Joi.object({
      media_url: Joi.string().uri(),
      caption: Joi.string().max(2200),
      cta_text: Joi.string().max(30),
      cta_url: Joi.string().uri(),
    }),
  }),
};

const updateCampaignStatus = {
  params: Joi.object({ campaignId: Joi.string().required() }),
  body: Joi.object({ status: Joi.string().valid('active', 'paused').required() }),
};

const campaignIdParam = { params: Joi.object({ campaignId: Joi.string().required() }) };

const recordImpression = {
  body: Joi.object({
    campaign_id: Joi.string().required(),
    event_type: Joi.string().valid('impression', 'click', 'conversion').required(),
    placement: Joi.string().valid('feed', 'stories', 'reels', 'explore'),
  }),
};

module.exports = { createCampaign, updateCampaignStatus, campaignIdParam, recordImpression };
