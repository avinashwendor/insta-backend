const Joi = require('joi');

const subscribe = {
  params: Joi.object({ membershipId: Joi.string().required() }),
  body: Joi.object({
    payment_gateway: Joi.string().valid('stripe', 'razorpay').required(),
    billing_period: Joi.string().valid('monthly', 'yearly').default('monthly'),
  }),
};

const membershipIdParam = { params: Joi.object({ membershipId: Joi.string().required() }) };

const recordWatch = {
  body: Joi.object({
    content_type: Joi.string().valid('post', 'reel', 'story').required(),
    content_id: Joi.string().required(),
    watch_duration: Joi.number().min(0).required(),
    total_duration: Joi.number().min(0).required(),
    completed: Joi.boolean().default(false),
    source: Joi.string().valid('feed', 'explore', 'profile', 'share_link'),
  }),
};

const dateRange = {
  query: Joi.object({
    start_date: Joi.date().iso(),
    end_date: Joi.date().iso(),
    interval: Joi.string().valid('day', 'week', 'month').default('day'),
  }),
};

module.exports = { subscribe, membershipIdParam, recordWatch, dateRange };
