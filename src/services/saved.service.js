const ApiError = require('../utils/ApiError');
const { saveRepository } = require('../repositories/engagement.repository');

const getMySaved = async (userId, collectionName, { cursor, limit }) => {
  return saveRepository.getUserSaves(userId, collectionName, { cursor, limit });
};

const getMyCollections = async (userId) => {
  const collections = await saveRepository.getUserCollections(userId);
  return collections;
};

const moveToCollection = async (saveId, userId, newCollectionName) => {
  const save = await saveRepository.findById(saveId);
  if (!save) throw ApiError.notFound('Saved item not found');
  if (save.user_id.toString() !== userId) {
    throw ApiError.forbidden('Not your saved item');
  }
  return saveRepository.updateById(saveId, { collection_name: newCollectionName });
};

module.exports = { getMySaved, getMyCollections, moveToCollection };
