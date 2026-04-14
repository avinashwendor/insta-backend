const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { uploadToCloudinary } = require('../utils/cloudinaryHelper');
const { audioTrackRepository } = require('../repositories/audio.repository');

const uploadAudio = async (userId, audioData, audioFile) => {
  if (!audioFile) {
    throw ApiError.badRequest('Audio file is required');
  }

  const result = await uploadToCloudinary(audioFile.buffer, {
    folder: 'audio',
    resourceType: 'video', // Cloudinary uses 'video' for audio too
  });

  const track = await audioTrackRepository.create({
    title: audioData.title,
    artist: audioData.artist || 'Unknown',
    audio_url: result.url,
    cover_url: audioData.cover_url || '',
    duration: result.duration || 0,
    genre: audioData.genre,
    is_original: audioData.is_original || false,
    original_reel_id: audioData.original_reel_id,
    uploaded_by: userId,
  });

  logger.info(`Audio uploaded: ${track._id} by user ${userId}`);
  return track;
};

const getTrending = async ({ cursor, limit }) => {
  return audioTrackRepository.getTrending({ cursor, limit });
};

const searchAudio = async (query, options = {}) => {
  if (query) {
    return audioTrackRepository.searchTracks(query, options);
  }
  return audioTrackRepository.getTrending(options);
};

const getByGenre = async (genre, { cursor, limit }) => {
  return audioTrackRepository.getByGenre(genre, { cursor, limit });
};

const getAudioTrack = async (audioId) => {
  const track = await audioTrackRepository.findById(audioId);
  if (!track) throw ApiError.notFound('Audio track not found');
  return track;
};

module.exports = { uploadAudio, getTrending, searchAudio, getByGenre, getAudioTrack };
