const Joi = require('joi');
const {
  ACCOUNT_TYPES,
  GENDER_OPTIONS,
  THEME_OPTIONS,
  MENTION_ALLOW,
} = require('../config/constants');

const updateProfile = {
  body: Joi.object({
    display_name: Joi.string().min(1).max(50),
    bio: Joi.string().max(500).allow(''),
    website: Joi.string().uri().allow(''),
    location: Joi.string().max(100).allow(''),
    gender: Joi.string().valid(...Object.values(GENDER_OPTIONS)),
    date_of_birth: Joi.date().max('now').iso(),
    interests: Joi.array().items(Joi.string().trim().lowercase()).max(20),
    account_type: Joi.string().valid(...Object.values(ACCOUNT_TYPES)),
    is_private: Joi.boolean(),
    language: Joi.string().min(2).max(5),
  }).min(1), // At least one field must be provided
};

const updateSettings = {
  body: Joi.object({
    privacy: Joi.object({
      show_activity_status: Joi.boolean(),
      allow_mentions_from: Joi.string().valid(...Object.values(MENTION_ALLOW)),
      allow_tags_from: Joi.string().valid(...Object.values(MENTION_ALLOW)),
      allow_message_requests: Joi.boolean(),
      show_read_receipts: Joi.boolean(),
    }),
    notifications: Joi.object({
      likes: Joi.boolean(),
      comments: Joi.boolean(),
      follows: Joi.boolean(),
      mentions: Joi.boolean(),
      collaborations: Joi.boolean(),
      messages: Joi.boolean(),
      server_updates: Joi.boolean(),
      marketing: Joi.boolean(),
    }),
    display: Joi.object({
      theme: Joi.string().valid(...Object.values(THEME_OPTIONS)),
      font_size: Joi.string().valid('small', 'medium', 'large'),
      language: Joi.string().min(2).max(5),
    }),
    content: Joi.object({
      autoplay_videos: Joi.boolean(),
      data_saver_mode: Joi.boolean(),
      default_post_visibility: Joi.string().valid('public', 'followers'),
    }),
  }).min(1),
};

const getUserParam = {
  params: Joi.object({
    userId: Joi.string().required(),
  }),
};

const searchUsers = {
  query: Joi.object({
    q: Joi.string().min(1).max(100).required(),
    cursor: Joi.string(),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

const listFollows = {
  params: Joi.object({
    userId: Joi.string().required(),
  }),
  query: Joi.object({
    cursor: Joi.string(),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

module.exports = {
  updateProfile,
  updateSettings,
  getUserParam,
  searchUsers,
  listFollows,
};
