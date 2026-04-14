const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const audioService = require('../services/audio.service');

const uploadAudio = asyncHandler(async (req, res) => {
  const track = await audioService.uploadAudio(req.user.id, req.body, req.file);
  return ApiResponse.created(res, track);
});

const getTrending = asyncHandler(async (req, res) => {
  const { data, meta } = await audioService.getTrending({
    cursor: req.query.cursor, limit: req.query.limit,
  });
  return ApiResponse.ok(res, data, meta);
});

const searchAudio = asyncHandler(async (req, res) => {
  const { data, meta } = await audioService.searchAudio(req.query.q, {
    cursor: req.query.cursor, limit: req.query.limit,
  });
  return ApiResponse.ok(res, data, meta);
});

const getByGenre = asyncHandler(async (req, res) => {
  const { data, meta } = await audioService.getByGenre(req.params.genre, {
    cursor: req.query.cursor, limit: req.query.limit,
  });
  return ApiResponse.ok(res, data, meta);
});

const getAudioTrack = asyncHandler(async (req, res) => {
  const track = await audioService.getAudioTrack(req.params.audioId);
  return ApiResponse.ok(res, track);
});

module.exports = { uploadAudio, getTrending, searchAudio, getByGenre, getAudioTrack };
