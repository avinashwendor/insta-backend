const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const commentService = require('../services/comment.service');

/**
 * Comment controller — edit, delete, reply, like (standalone routes).
 * Adding comments to posts/reels is handled by their respective controllers.
 */

const updateComment = asyncHandler(async (req, res) => {
  const comment = await commentService.updateComment(
    req.params.commentId, req.user.id, req.body.text
  );
  return ApiResponse.ok(res, comment);
});

const deleteComment = asyncHandler(async (req, res) => {
  await commentService.deleteComment(req.params.commentId, req.user.id);
  return ApiResponse.ok(res, { message: 'Comment deleted' });
});

const replyToComment = asyncHandler(async (req, res) => {
  const reply = await commentService.replyToComment(
    req.params.commentId, req.user.id, req.body.text
  );
  return ApiResponse.created(res, reply);
});

const getReplies = asyncHandler(async (req, res) => {
  const { data, meta } = await commentService.getReplies(req.params.commentId, {
    cursor: req.query.cursor,
    limit: req.query.limit,
  });
  return ApiResponse.ok(res, data, meta);
});

const likeComment = asyncHandler(async (req, res) => {
  await commentService.likeComment(req.params.commentId, req.user.id);
  return ApiResponse.created(res, { message: 'Comment liked' });
});

const unlikeComment = asyncHandler(async (req, res) => {
  await commentService.unlikeComment(req.params.commentId, req.user.id);
  return ApiResponse.ok(res, { message: 'Comment unliked' });
});

module.exports = {
  updateComment,
  deleteComment,
  replyToComment,
  getReplies,
  likeComment,
  unlikeComment,
};
