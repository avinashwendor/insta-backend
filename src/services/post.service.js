const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { uploadToCloudinary, getThumbnailUrl } = require('../utils/cloudinaryHelper');
const { extractHashtags, extractMentions } = require('../utils/textParser');
const { postRepository, hashtagRepository } = require('../repositories/post.repository');
const { likeRepository, saveRepository, shareRepository } = require('../repositories/engagement.repository');
const { userRepository, followerRepository } = require('../repositories/user.repository');

/**
 * Post service — create, read, update, delete, feed, explore, engagement.
 */

/**
 * Create a new post.
 * Handles media upload to Cloudinary, hashtag extraction, and mention resolution.
 */
const createPost = async (userId, postData, mediaFiles) => {
  // Upload media files to Cloudinary
  const media = [];
  if (mediaFiles && mediaFiles.length > 0) {
    for (let i = 0; i < mediaFiles.length; i++) {
      const file = mediaFiles[i];
      const isVideo = file.mimetype.startsWith('video/');
      const result = await uploadToCloudinary(file.buffer, {
        folder: 'posts',
        resourceType: isVideo ? 'video' : 'image',
      });

      media.push({
        url: result.url,
        thumbnail_url: isVideo ? getThumbnailUrl(result.url) : result.url,
        type: isVideo ? 'video' : 'image',
        width: result.width,
        height: result.height,
        duration: result.duration,
        alt_text: '',
        order: i,
      });
    }
  }

  // Extract hashtags and mentions from caption
  const hashtags = extractHashtags(postData.caption);
  const mentionUsernames = extractMentions(postData.caption);

  // Resolve mention usernames to user IDs
  const mentions = [];
  for (const username of mentionUsernames) {
    const mentionedUser = await userRepository.findOne({ username });
    if (mentionedUser) {
      mentions.push(mentionedUser._id);
    }
  }

  // Determine post type if not specified
  let postType = postData.type;
  if (!postType && media.length > 0) {
    if (media.length > 1) {
      postType = 'carousel';
    } else {
      postType = media[0].type;
    }
  } else if (!postType) {
    postType = 'text';
  }

  const post = await postRepository.create({
    user_id: userId,
    type: postType,
    caption: postData.caption || '',
    media,
    location: postData.location,
    hashtags,
    mentions,
    collaborators: postData.collaborators || [],
    visibility: postData.visibility || 'public',
    comments_enabled: postData.comments_enabled !== false,
    likes_visible: postData.likes_visible !== false,
  });

  // Update hashtag counts
  if (hashtags.length > 0) {
    await hashtagRepository.upsertAndIncrement(hashtags, 'post');
  }

  // Increment user's post count
  await userRepository.incrementById(userId, { posts_count: 1 });

  logger.info(`Post created: ${post._id} by user ${userId}`);

  return postRepository.getPostWithUser(post._id);
};

/**
 * Get a single post by ID.
 */
const getPost = async (postId, currentUserId) => {
  const post = await postRepository.getPostWithUser(postId);

  if (!post) {
    throw ApiError.notFound('Post not found');
  }

  // Check if current user has liked/saved this post
  const [isLiked, isSaved] = await Promise.all([
    currentUserId
      ? likeRepository.findLike(currentUserId, 'post', postId)
      : null,
    currentUserId
      ? saveRepository.findSave(currentUserId, 'post', postId)
      : null,
  ]);

  const postObj = post.toJSON ? post.toJSON() : post;
  postObj.is_liked = !!isLiked;
  postObj.is_saved = !!isSaved;

  return postObj;
};

/**
 * Update a post (only by the author).
 */
const updatePost = async (postId, userId, updateData) => {
  const post = await postRepository.findById(postId);

  if (!post) {
    throw ApiError.notFound('Post not found');
  }

  if (post.user_id.toString() !== userId) {
    throw ApiError.forbidden('You can only edit your own posts');
  }

  // Re-extract hashtags if caption changed
  if (updateData.caption !== undefined) {
    const oldHashtags = post.hashtags || [];
    const newHashtags = extractHashtags(updateData.caption);
    updateData.hashtags = newHashtags;

    // Update hashtag counts for added/removed tags
    const added = newHashtags.filter((h) => !oldHashtags.includes(h));
    const removed = oldHashtags.filter((h) => !newHashtags.includes(h));

    if (added.length > 0) {
      await hashtagRepository.upsertAndIncrement(added, 'post');
    }
    if (removed.length > 0) {
      await hashtagRepository.decrementCounts(removed, 'post');
    }

    // Re-resolve mentions
    const mentionUsernames = extractMentions(updateData.caption);
    const mentions = [];
    for (const username of mentionUsernames) {
      const user = await userRepository.findOne({ username });
      if (user) mentions.push(user._id);
    }
    updateData.mentions = mentions;
  }

  const updated = await postRepository.updateById(postId, updateData);
  return postRepository.getPostWithUser(updated._id);
};

/**
 * Delete a post.
 */
const deletePost = async (postId, userId) => {
  const post = await postRepository.findById(postId);

  if (!post) {
    throw ApiError.notFound('Post not found');
  }

  if (post.user_id.toString() !== userId) {
    throw ApiError.forbidden('You can only delete your own posts');
  }

  // Decrement hashtag counts
  if (post.hashtags && post.hashtags.length > 0) {
    await hashtagRepository.decrementCounts(post.hashtags, 'post');
  }

  await postRepository.deleteById(postId);
  await userRepository.incrementById(userId, { posts_count: -1 });

  logger.info(`Post deleted: ${postId} by user ${userId}`);
};

/**
 * Get home feed — posts from users the current user follows.
 */
const getFeed = async (userId, { cursor, limit }) => {
  const followingIds = await followerRepository.getFollowingIds(userId);
  // Include own posts in feed
  followingIds.push(userId);
  return postRepository.getFeedPosts(followingIds, { cursor, limit });
};

/**
 * Get explore/discover posts.
 */
const getExplore = async ({ cursor, limit }) => {
  return postRepository.getExplorePosts({ cursor, limit });
};

/**
 * Like a post.
 */
const likePost = async (postId, userId) => {
  const post = await postRepository.findById(postId);
  if (!post) throw ApiError.notFound('Post not found');

  const existingLike = await likeRepository.findLike(userId, 'post', postId);
  if (existingLike) throw ApiError.conflict('Already liked this post');

  await likeRepository.create({
    user_id: userId,
    target_type: 'post',
    target_id: postId,
  });

  await postRepository.incrementById(postId, { likes_count: 1 });
};

/**
 * Unlike a post.
 */
const unlikePost = async (postId, userId) => {
  const removed = await likeRepository.removeLike(userId, 'post', postId);
  if (!removed) throw ApiError.notFound('Like not found');

  await postRepository.incrementById(postId, { likes_count: -1 });
};

/**
 * Get users who liked a post.
 */
const getPostLikes = async (postId, { cursor, limit }) => {
  return likeRepository.getLikers('post', postId, { cursor, limit });
};

/**
 * Save a post to a collection.
 */
const savePost = async (postId, userId, collectionName) => {
  const post = await postRepository.findById(postId);
  if (!post) throw ApiError.notFound('Post not found');

  const existingSave = await saveRepository.findSave(userId, 'post', postId);
  if (existingSave) throw ApiError.conflict('Already saved this post');

  await saveRepository.create({
    user_id: userId,
    target_type: 'post',
    target_id: postId,
    collection_name: collectionName || 'All Posts',
  });

  await postRepository.incrementById(postId, { saves_count: 1 });
};

/**
 * Unsave a post.
 */
const unsavePost = async (postId, userId) => {
  const removed = await saveRepository.removeSave(userId, 'post', postId);
  if (!removed) throw ApiError.notFound('Save not found');

  await postRepository.incrementById(postId, { saves_count: -1 });
};

/**
 * Share a post.
 */
const sharePost = async (postId, userId, shareData) => {
  const post = await postRepository.findById(postId);
  if (!post) throw ApiError.notFound('Post not found');

  await shareRepository.create({
    user_id: userId,
    target_type: 'post',
    target_id: postId,
    share_type: shareData.share_type,
    recipient_id: shareData.recipient_id || null,
    platform: shareData.platform || null,
  });

  await postRepository.incrementById(postId, { shares_count: 1 });
};

/**
 * Pin/unpin a post.
 */
const togglePin = async (postId, userId) => {
  const post = await postRepository.findById(postId);
  if (!post) throw ApiError.notFound('Post not found');
  if (post.user_id.toString() !== userId) {
    throw ApiError.forbidden('You can only pin your own posts');
  }

  const updated = await postRepository.updateById(postId, {
    is_pinned: !post.is_pinned,
  });

  return { is_pinned: updated.is_pinned };
};

module.exports = {
  createPost,
  getPost,
  updatePost,
  deletePost,
  getFeed,
  getExplore,
  likePost,
  unlikePost,
  getPostLikes,
  savePost,
  unsavePost,
  sharePost,
  togglePin,
};
