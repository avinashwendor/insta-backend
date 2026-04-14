const Joi = require('joi');

const createReel = {
  body: Joi.object({
    title: Joi.string().max(100).allow('').default(''),
    description: Joi.string().max(2200).allow('').default(''),
    audio_id: Joi.string(),
    audio_start_offset: Joi.number().min(0).default(0),
    allow_remix: Joi.boolean().default(true),
    allow_duet: Joi.boolean().default(true),
    comments_enabled: Joi.boolean().default(true),
    collaborators: Joi.array().items(
      Joi.object({
        user_id: Joi.string().required(),
        watchtime_split: Joi.number().min(0).max(100).default(50),
        revenue_split: Joi.number().min(0).max(100).default(50),
      })
    ),
  }),
};

const updateReel = {
  params: Joi.object({
    reelId: Joi.string().required(),
  }),
  body: Joi.object({
    title: Joi.string().max(100).allow(''),
    description: Joi.string().max(2200).allow(''),
    allow_remix: Joi.boolean(),
    allow_duet: Joi.boolean(),
    comments_enabled: Joi.boolean(),
  }).min(1),
};

const getReel = {
  params: Joi.object({
    reelId: Joi.string().required(),
  }),
};

const listReels = {
  query: Joi.object({
    cursor: Joi.string(),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

const addComment = {
  params: Joi.object({
    reelId: Joi.string().required(),
  }),
  body: Joi.object({
    text: Joi.string().min(1).max(1000).required(),
  }),
};

const shareReel = {
  params: Joi.object({
    reelId: Joi.string().required(),
  }),
  body: Joi.object({
    share_type: Joi.string().valid('dm', 'external', 'copy_link').required(),
    recipient_id: Joi.string(),
    platform: Joi.string().max(50),
  }),
};

module.exports = {
  createReel,
  updateReel,
  getReel,
  listReels,
  addComment,
  shareReel,
};
