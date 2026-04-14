const Joi = require('joi');

const createCollaboration = {
  body: Joi.object({
    content_type: Joi.string().valid('post', 'reel').required(),
    content_id: Joi.string().required(),
    invitee_id: Joi.string().required(),
    message: Joi.string().max(500),
    watchtime_split: Joi.object({
      inviter_percent: Joi.number().min(0).max(100).required(),
      invitee_percent: Joi.number().min(0).max(100).required(),
    }),
    revenue_split: Joi.object({
      inviter_percent: Joi.number().min(0).max(100).required(),
      invitee_percent: Joi.number().min(0).max(100).required(),
    }),
  }),
};

const respondCollaboration = {
  params: Joi.object({ collabId: Joi.string().required() }),
  body: Joi.object({ action: Joi.string().valid('accept', 'reject').required() }),
};

const collabIdParam = { params: Joi.object({ collabId: Joi.string().required() }) };

module.exports = { createCollaboration, respondCollaboration, collabIdParam };
