const Joi = require('joi');

const searchAudio = {
  query: Joi.object({
    q: Joi.string().min(1).max(100),
    genre: Joi.string().max(50),
    cursor: Joi.string(),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

const audioIdParam = {
  params: Joi.object({ audioId: Joi.string().required() }),
};

module.exports = { searchAudio, audioIdParam };
