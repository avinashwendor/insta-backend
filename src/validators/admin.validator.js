const Joi = require('joi');

const submitReport = {
  body: Joi.object({
    target_type: Joi.string().valid('post', 'reel', 'comment', 'user', 'story', 'message').required(),
    target_id: Joi.string().required(),
    reason: Joi.string().valid('spam', 'harassment', 'hate_speech', 'violence', 'nudity', 'false_info', 'copyright', 'other').required(),
    description: Joi.string().max(1000),
  }),
};

const resolveReport = {
  params: Joi.object({ reportId: Joi.string().required() }),
  body: Joi.object({
    action: Joi.string().valid('resolve', 'dismiss').required(),
    resolution: Joi.string().max(1000),
    content_action: Joi.string().valid('remove', 'hide', 'none').default('none'),
    user_action: Joi.string().valid('warn', 'ban_temp', 'ban_perm', 'none').default('none'),
    ban_duration_days: Joi.number().integer().min(1).max(365).when('user_action', {
      is: 'ban_temp', then: Joi.required(), otherwise: Joi.optional(),
    }),
  }),
};

const reportIdParam = { params: Joi.object({ reportId: Joi.string().required() }) };

const banUser = {
  params: Joi.object({ userId: Joi.string().required() }),
  body: Joi.object({
    reason: Joi.string().min(1).max(500).required(),
    duration_days: Joi.number().integer().min(1).max(365),
  }),
};

const reviewCampaign = {
  params: Joi.object({ campaignId: Joi.string().required() }),
  body: Joi.object({
    action: Joi.string().valid('approve', 'reject').required(),
    rejection_reason: Joi.string().max(500).when('action', {
      is: 'reject', then: Joi.required(), otherwise: Joi.optional(),
    }),
  }),
};

module.exports = { submitReport, resolveReport, reportIdParam, banUser, reviewCampaign };
