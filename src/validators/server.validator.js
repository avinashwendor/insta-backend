const Joi = require('joi');

const createServer = {
  body: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(1000).allow(''),
    is_public: Joi.boolean().default(true),
    categories: Joi.array().items(Joi.string().max(50)).max(5),
    rules: Joi.string().max(5000).allow(''),
  }),
};

const updateServer = {
  params: Joi.object({ serverId: Joi.string().required() }),
  body: Joi.object({
    name: Joi.string().min(1).max(100),
    description: Joi.string().max(1000).allow(''),
    is_public: Joi.boolean(),
    categories: Joi.array().items(Joi.string().max(50)).max(5),
    rules: Joi.string().max(5000).allow(''),
  }).min(1),
};

const serverIdParam = {
  params: Joi.object({ serverId: Joi.string().required() }),
};

const createChannel = {
  params: Joi.object({ serverId: Joi.string().required() }),
  body: Joi.object({
    name: Joi.string().min(1).max(50).required(),
    type: Joi.string().valid('text', 'voice', 'announcement').default('text'),
    topic: Joi.string().max(1024).allow(''),
  }),
};

const updateMemberRole = {
  params: Joi.object({
    serverId: Joi.string().required(),
    userId: Joi.string().required(),
  }),
  body: Joi.object({
    role: Joi.string().valid('admin', 'moderator', 'member').required(),
  }),
};

const channelMessages = {
  params: Joi.object({
    serverId: Joi.string().required(),
    channelId: Joi.string().required(),
  }),
  query: Joi.object({
    cursor: Joi.string(),
    limit: Joi.number().integer().min(1).max(100).default(50),
  }),
};

const sendChannelMessage = {
  params: Joi.object({
    serverId: Joi.string().required(),
    channelId: Joi.string().required(),
  }),
  body: Joi.object({
    text: Joi.string().min(1).max(5000).required(),
  }),
};

const joinByInvite = {
  params: Joi.object({ inviteCode: Joi.string().required() }),
};

module.exports = {
  createServer, updateServer, serverIdParam,
  createChannel, updateMemberRole,
  channelMessages, sendChannelMessage, joinByInvite,
};
