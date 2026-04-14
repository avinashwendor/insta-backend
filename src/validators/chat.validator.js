const Joi = require('joi');

const createConversation = {
  body: Joi.object({
    type: Joi.string().valid('dm', 'group').required(),
    participant_ids: Joi.array().items(Joi.string()).min(1).required(),
    group_name: Joi.string().max(100).when('type', {
      is: 'group',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    initial_message: Joi.object({
      type: Joi.string().valid('text', 'image', 'video').default('text'),
      text: Joi.string().max(5000),
    }),
  }),
};

const sendMessage = {
  params: Joi.object({ convId: Joi.string().required() }),
  body: Joi.object({
    type: Joi.string()
      .valid('text', 'image', 'video', 'audio', 'post_share', 'reel_share', 'story_reply')
      .default('text'),
    content: Joi.object({
      text: Joi.string().max(5000),
      shared_content_id: Joi.string(),
      shared_content_type: Joi.string(),
    }).required(),
    font: Joi.object({
      family: Joi.string().max(50),
      size: Joi.number().min(8).max(72),
      color: Joi.string().max(20),
    }),
  }),
};

const updateFont = {
  params: Joi.object({ convId: Joi.string().required() }),
  body: Joi.object({
    family: Joi.string().max(50),
    size: Joi.number().min(8).max(72),
    color: Joi.string().max(20),
  }).min(1),
};

const convIdParam = {
  params: Joi.object({ convId: Joi.string().required() }),
};

const listMessages = {
  params: Joi.object({ convId: Joi.string().required() }),
  query: Joi.object({
    cursor: Joi.string(),
    limit: Joi.number().integer().min(1).max(100).default(50),
  }),
};

module.exports = { createConversation, sendMessage, updateFont, convIdParam, listMessages };
