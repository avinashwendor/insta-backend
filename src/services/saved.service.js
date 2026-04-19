const ApiError = require('../utils/ApiError');
const { saveRepository } = require('../repositories/engagement.repository');
const { postRepository } = require('../repositories/post.repository');
const { reelRepository } = require('../repositories/reel.repository');

const USER_POPULATE = { path: 'user_id', select: 'username display_name avatar_url is_verified' };

/**
 * List saves with populated post/reel payloads so clients can render thumbnails.
 */
const getMySaved = async (userId, collectionName, { cursor, limit }) => {
  const { data, meta } = await saveRepository.getUserSaves(userId, collectionName, { cursor, limit });
  if (!data?.length) return { data: [], meta };

  const postIds = data.filter((s) => s.target_type === 'post').map((s) => s.target_id);
  const reelIds = data.filter((s) => s.target_type === 'reel').map((s) => s.target_id);

  const [postsRes, reelsRes] = await Promise.all([
    postIds.length
      ? postRepository.findMany(
        { _id: { $in: postIds }, is_hidden: false },
        { limit: Math.max(postIds.length, 1), populate: [USER_POPULATE] },
      )
      : Promise.resolve({ data: [] }),
    reelIds.length
      ? reelRepository.findMany(
        { _id: { $in: reelIds }, is_hidden: false },
        { limit: Math.max(reelIds.length, 1), populate: [USER_POPULATE] },
      )
      : Promise.resolve({ data: [] }),
  ]);

  const postMap = new Map((postsRes.data || []).map((p) => [p._id.toString(), p]));
  const reelMap = new Map((reelsRes.data || []).map((r) => [r._id.toString(), r]));

  const enriched = data
    .map((s) => {
      const tid = s.target_id?.toString?.() ?? String(s.target_id);
      const post = s.target_type === 'post' ? (postMap.get(tid) || null) : null;
      const reel = s.target_type === 'reel' ? (reelMap.get(tid) || null) : null;
      return { ...s, post, reel };
    })
    .filter((row) => row.post || row.reel);

  return { data: enriched, meta };
};

const getMyCollections = async (userId) => {
  return saveRepository.getCollectionSummaries(userId);
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
