const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const savedService = require('../services/saved.service');

const getMySaved = asyncHandler(async (req, res) => {
  const { data, meta } = await savedService.getMySaved(
    req.user.id, req.query.collection, { cursor: req.query.cursor, limit: req.query.limit }
  );
  return ApiResponse.ok(res, data, meta);
});

const getMyCollections = asyncHandler(async (req, res) => {
  const collections = await savedService.getMyCollections(req.user.id);
  return ApiResponse.ok(res, collections);
});

const moveToCollection = asyncHandler(async (req, res) => {
  const result = await savedService.moveToCollection(req.params.saveId, req.user.id, req.body.collection_name);
  return ApiResponse.ok(res, result);
});

module.exports = { getMySaved, getMyCollections, moveToCollection };
