const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { extractMentions } = require('../utils/textParser');
const { commentRepository, likeRepository } = require('../repositories/engagement.repository');
const { postRepository } = require('../repositories/post.repository');
const { reelRepository } = require('../repositories/reel.repository');
const { userRepository } = require('../repositories/user.repository');

/**
 * Comment service — CRUD, replies, likes.
 * Comments are polymorphic: they can belong to a post or a reel.
 */

/**
 * Resolve the content repository by type.
 */
const getContentRepo = (contentType) => {
  if (contentType === 'post') return postRepository;
  if (contentType === 'reel') return reelRepository;
  throw ApiError.badRequest(`Invalid content type: ${contentType}`);
};

/**
 * Add a comment to a post or reel.
 */
const addComment = async (contentType, contentId, userId, text) => {
  const contentRepo = getContentRepo(contentType);
  const content = await contentRepo.findById(contentId);

  if (!content) {
    throw ApiError.notFound(`${contentType} not found`);
  }

  // Check if comments are enabled
  if (content.comments_enabled === false) {
    throw ApiError.forbidden('Comments are disabled on this content');
  }

  // Extract and resolve mentions
  const mentionUsernames = extractMentions(text);
  const mentions = [];
  for (const username of mentionUsernames) {
    const user = await userRepository.findOne({ username });
    if (user) mentions.push(user._id);
  }

  const comment = await commentRepository.create({
    content_type: contentType,
    content_id: contentId,
    user_id: userId,
    text,
    mentions,
  });

  // Increment comment count on the content
  await contentRepo.incrementById(contentId, { comments_count: 1 });

  logger.info(`Comment added to ${contentType} ${contentId} by user ${userId}`);

  return commentRepository.getCommentWithUser(comment._id);
};

/**
 * Get comments for a post or reel.
 */
const getComments = async (contentType, contentId, { cursor, limit }) => {
  return commentRepository.getContentComments(contentType, contentId, { cursor, limit });
};

/**
 * Update a comment (only by author).
 */
const updateComment = async (commentId, userId, text) => {
  const comment = await commentRepository.findById(commentId);

  if (!comment) throw ApiError.notFound('Comment not found');
  if (comment.user_id.toString() !== userId) {
    throw ApiError.forbidden('You can only edit your own comments');
  }

  // Re-extract mentions
  const mentionUsernames = extractMentions(text);
  const mentions = [];
  for (const username of mentionUsernames) {
    const user = await userRepository.findOne({ username });
    if (user) mentions.push(user._id);
  }

  await commentRepository.updateById(commentId, { text, mentions });
  return commentRepository.getCommentWithUser(commentId);
};

/**
 * Delete a comment (by author or content owner).
 */
const deleteComment = async (commentId, userId) => {
  const comment = await commentRepository.findById(commentId);

  if (!comment) throw ApiError.notFound('Comment not found');

  // Allow deletion by comment author or content owner
  const contentRepo = getContentRepo(comment.content_type);
  const content = await contentRepo.findById(comment.content_id);
  const isAuthor = comment.user_id.toString() === userId;
  const isContentOwner = content && content.user_id.toString() === userId;

  if (!isAuthor && !isContentOwner) {
    throw ApiError.forbidden('You can only delete your own comments or comments on your content');
  }

  await commentRepository.deleteById(commentId);
  await contentRepo.incrementById(comment.content_id, { comments_count: -1 });

  // If this was a reply, decrement parent's reply count
  if (comment.parent_comment_id) {
    await commentRepository.incrementById(comment.parent_comment_id, { replies_count: -1 });
  }

  logger.info(`Comment deleted: ${commentId} by user ${userId}`);
};

/**
 * Reply to a comment.
 */
const replyToComment = async (parentCommentId, userId, text) => {
  const parentComment = await commentRepository.findById(parentCommentId);

  if (!parentComment) throw ApiError.notFound('Parent comment not found');

  // Extract mentions
  const mentionUsernames = extractMentions(text);
  const mentions = [];
  for (const username of mentionUsernames) {
    const user = await userRepository.findOne({ username });
    if (user) mentions.push(user._id);
  }

  const reply = await commentRepository.create({
    content_type: parentComment.content_type,
    content_id: parentComment.content_id,
    user_id: userId,
    parent_comment_id: parentCommentId,
    text,
    mentions,
  });

  // Increment parent reply count
  await commentRepository.incrementById(parentCommentId, { replies_count: 1 });

  // Increment content comment count
  const contentRepo = getContentRepo(parentComment.content_type);
  await contentRepo.incrementById(parentComment.content_id, { comments_count: 1 });

  return commentRepository.getCommentWithUser(reply._id);
};

/**
 * Get replies to a comment.
 */
const getReplies = async (commentId, { cursor, limit }) => {
  return commentRepository.getReplies(commentId, { cursor, limit });
};

/**
 * Like a comment.
 */
const likeComment = async (commentId, userId) => {
  const comment = await commentRepository.findById(commentId);
  if (!comment) throw ApiError.notFound('Comment not found');

  const existing = await likeRepository.findLike(userId, 'comment', commentId);
  if (existing) throw ApiError.conflict('Already liked this comment');

  await likeRepository.create({ user_id: userId, target_type: 'comment', target_id: commentId });
  await commentRepository.incrementById(commentId, { likes_count: 1 });
};

/**
 * Unlike a comment.
 */
const unlikeComment = async (commentId, userId) => {
  const removed = await likeRepository.removeLike(userId, 'comment', commentId);
  if (!removed) throw ApiError.notFound('Like not found');
  await commentRepository.incrementById(commentId, { likes_count: -1 });
};

module.exports = {
  addComment,
  getComments,
  updateComment,
  deleteComment,
  replyToComment,
  getReplies,
  likeComment,
  unlikeComment,
};
