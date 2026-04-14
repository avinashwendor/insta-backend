const Joi = require('joi');
const { VISIBILITY_OPTIONS } = require('../config/constants');

const createStory = {
  body: Joi.object({
    caption: Joi.string().max(500).allow('').default(''),
    visibility: Joi.string()
      .valid(...Object.values(VISIBILITY_OPTIONS))
      .default('public'),
    stickers: Joi.array().items(
      Joi.object({
        type: Joi.string()
          .valid('poll', 'question', 'quiz', 'mention', 'hashtag', 'location', 'link')
          .required(),
        data: Joi.object().required(),
        position: Joi.object({
          x: Joi.number().min(0).max(1).required(),
          y: Joi.number().min(0).max(1).required(),
        }).required(),
        scale: Joi.number().min(0.1).max(5).default(1.0),
        rotation: Joi.number().min(-360).max(360).default(0),
      })
    ),
    filter_id: Joi.string().max(50),
  }),
};

const getStory = {
  params: Joi.object({
    storyId: Joi.string().required(),
  }),
};

const reactToStory = {
  params: Joi.object({
    storyId: Joi.string().required(),
  }),
  body: Joi.object({
    emoji: Joi.string().max(10).required(),
  }),
};

const createHighlight = {
  body: Joi.object({
    group_name: Joi.string().min(1).max(50).required(),
    story_ids: Joi.array().items(Joi.string()).min(1).required(),
  }),
};

const updateHighlight = {
  params: Joi.object({
    highlightId: Joi.string().required(),
  }),
  body: Joi.object({
    group_name: Joi.string().min(1).max(50),
    add_story_ids: Joi.array().items(Joi.string()),
    remove_story_ids: Joi.array().items(Joi.string()),
  }).min(1),
};

module.exports = {
  createStory,
  getStory,
  reactToStory,
  createHighlight,
  updateHighlight,
};
