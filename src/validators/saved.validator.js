const Joi = require('joi');

const listSaved = {
  query: Joi.object({
    collection: Joi.string().max(50),
    cursor: Joi.string(),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

const createCollection = {
  body: Joi.object({
    name: Joi.string().min(1).max(50).required(),
  }),
};

const moveToCollection = {
  params: Joi.object({ saveId: Joi.string().required() }),
  body: Joi.object({
    collection_name: Joi.string().min(1).max(50).required(),
  }),
};

module.exports = { listSaved, createCollection, moveToCollection };
