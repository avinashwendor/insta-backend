const Joi = require('joi');
const { VISIBILITY_OPTIONS, POST_TYPES } = require('../config/constants');

const createPost = {
  body: Joi.object({
    caption: Joi.string().max(2200).allow('').default(''),
    type: Joi.string()
      .valid(...Object.values(POST_TYPES))
      .required(),
    visibility: Joi.string()
      .valid(...Object.values(VISIBILITY_OPTIONS))
      .default('public'),
    location: Joi.object({
      name: Joi.string().max(200),
      lat: Joi.number().min(-90).max(90),
      lng: Joi.number().min(-180).max(180),
    }),
    collaborators: Joi.array().items(
      Joi.object({
        user_id: Joi.string().required(),
        watchtime_split: Joi.number().min(0).max(100).default(50),
        revenue_split: Joi.number().min(0).max(100).default(50),
      })
    ),
    comments_enabled: Joi.boolean().default(true),
    likes_visible: Joi.boolean().default(true),
  }),
};

const updatePost = {
  params: Joi.object({
    postId: Joi.string().required(),
  }),
  body: Joi.object({
    caption: Joi.string().max(2200).allow(''),
    visibility: Joi.string().valid(...Object.values(VISIBILITY_OPTIONS)),
    location: Joi.object({
      name: Joi.string().max(200),
      lat: Joi.number().min(-90).max(90),
      lng: Joi.number().min(-180).max(180),
    }),
    comments_enabled: Joi.boolean(),
    likes_visible: Joi.boolean(),
  }).min(1),
};

const getPost = {
  params: Joi.object({
    postId: Joi.string().required(),
  }),
};

const listPosts = {
  query: Joi.object({
    cursor: Joi.string(),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

const addComment = {
  params: Joi.object({
    postId: Joi.string().required(),
  }),
  body: Joi.object({
    text: Joi.string().min(1).max(1000).required(),
  }),
};

const sharePost = {
  params: Joi.object({
    postId: Joi.string().required(),
  }),
  body: Joi.object({
    share_type: Joi.string().valid('dm', 'external', 'copy_link').required(),
    recipient_id: Joi.string().when('share_type', {
      is: 'dm',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    platform: Joi.string().max(50),
  }),
};

const savePost = {
  params: Joi.object({
    postId: Joi.string().required(),
  }),
  body: Joi.object({
    collection_name: Joi.string().max(50).default('All Posts'),
  }),
};

module.exports = {
  createPost,
  updatePost,
  getPost,
  listPosts,
  addComment,
  sharePost,
  savePost,
};
