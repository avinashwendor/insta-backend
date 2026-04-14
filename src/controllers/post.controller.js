const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const postService = require('../services/post.service');
const commentService = require('../services/comment.service');

/**
 * Post controller.
 */

const createPost = asyncHandler(async (req, res) => {
  const post = await postService.createPost(req.user.id, req.body, req.files);
  return ApiResponse.created(res, post);
});

const getPost = asyncHandler(async (req, res) => {
  const post = await postService.getPost(req.params.postId, req.user.id);
  return ApiResponse.ok(res, post);
});

const updatePost = asyncHandler(async (req, res) => {
  const post = await postService.updatePost(req.params.postId, req.user.id, req.body);
  return ApiResponse.ok(res, post);
});

const deletePost = asyncHandler(async (req, res) => {
  await postService.deletePost(req.params.postId, req.user.id);
  return ApiResponse.ok(res, { message: 'Post deleted successfully' });
});

const getFeed = asyncHandler(async (req, res) => {
  const { data, meta } = await postService.getFeed(req.user.id, {
    cursor: req.query.cursor,
    limit: req.query.limit,
  });
  return ApiResponse.ok(res, data, meta);
});

const getExplore = asyncHandler(async (req, res) => {
  const { data, meta } = await postService.getExplore({
    cursor: req.query.cursor,
    limit: req.query.limit,
  });
  return ApiResponse.ok(res, data, meta);
});

const likePost = asyncHandler(async (req, res) => {
  await postService.likePost(req.params.postId, req.user.id);
  return ApiResponse.created(res, { message: 'Post liked' });
});

const unlikePost = asyncHandler(async (req, res) => {
  await postService.unlikePost(req.params.postId, req.user.id);
  return ApiResponse.ok(res, { message: 'Post unliked' });
});

const getPostLikes = asyncHandler(async (req, res) => {
  const { data, meta } = await postService.getPostLikes(req.params.postId, {
    cursor: req.query.cursor,
    limit: req.query.limit,
  });
  return ApiResponse.ok(res, data, meta);
});

const getComments = asyncHandler(async (req, res) => {
  const { data, meta } = await commentService.getComments('post', req.params.postId, {
    cursor: req.query.cursor,
    limit: req.query.limit,
  });
  return ApiResponse.ok(res, data, meta);
});

const addComment = asyncHandler(async (req, res) => {
  const comment = await commentService.addComment(
    'post', req.params.postId, req.user.id, req.body.text
  );
  return ApiResponse.created(res, comment);
});

const savePost = asyncHandler(async (req, res) => {
  await postService.savePost(req.params.postId, req.user.id, req.body.collection_name);
  return ApiResponse.created(res, { message: 'Post saved' });
});

const unsavePost = asyncHandler(async (req, res) => {
  await postService.unsavePost(req.params.postId, req.user.id);
  return ApiResponse.ok(res, { message: 'Post unsaved' });
});

const sharePost = asyncHandler(async (req, res) => {
  await postService.sharePost(req.params.postId, req.user.id, req.body);
  return ApiResponse.created(res, { message: 'Post shared' });
});

const togglePin = asyncHandler(async (req, res) => {
  const result = await postService.togglePin(req.params.postId, req.user.id);
  return ApiResponse.ok(res, result);
});

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
  getComments,
  addComment,
  savePost,
  unsavePost,
  sharePost,
  togglePin,
};
