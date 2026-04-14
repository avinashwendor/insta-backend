const Joi = require('joi');

const updateComment = {
  params: Joi.object({
    commentId: Joi.string().required(),
  }),
  body: Joi.object({
    text: Joi.string().min(1).max(1000).required(),
  }),
};

const getComment = {
  params: Joi.object({
    commentId: Joi.string().required(),
  }),
};

const replyToComment = {
  params: Joi.object({
    commentId: Joi.string().required(),
  }),
  body: Joi.object({
    text: Joi.string().min(1).max(1000).required(),
  }),
};

const listReplies = {
  params: Joi.object({
    commentId: Joi.string().required(),
  }),
  query: Joi.object({
    cursor: Joi.string(),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

module.exports = {
  updateComment,
  getComment,
  replyToComment,
  listReplies,
};
