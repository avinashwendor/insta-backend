const Joi = require('joi');

const listNotifications = {
  query: Joi.object({
    cursor: Joi.string(),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

const notifIdParam = {
  params: Joi.object({ notifId: Joi.string().required() }),
};

module.exports = { listNotifications, notifIdParam };
