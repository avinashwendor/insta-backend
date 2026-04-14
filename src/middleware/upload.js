const multer = require('multer');
const ApiError = require('../utils/ApiError');

/**
 * Multer configuration for memory storage.
 * Files are buffered in memory, then uploaded to Cloudinary.
 * Limits file sizes and restricts to image/video MIME types.
 */

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
];

const ALLOWED_MEDIA_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB (Cloudinary free tier limit)

/**
 * File filter that validates MIME types.
 * @param {string[]} allowedTypes - Array of allowed MIME types
 */
const createFileFilter = (allowedTypes) => {
  return (_req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        ApiError.badRequest(
          `Invalid file type: ${file.mimetype}. Allowed: ${allowedTypes.join(', ')}`
        ),
        false
      );
    }
  };
};

/**
 * Upload middleware for images only (avatars, covers).
 * Single file, max 10MB.
 */
const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE },
  fileFilter: createFileFilter(ALLOWED_IMAGE_TYPES),
});

/**
 * Upload middleware for any media (images + videos).
 * Used for posts, stories, reels.
 */
const uploadMedia = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_VIDEO_SIZE },
  fileFilter: createFileFilter(ALLOWED_MEDIA_TYPES),
});

module.exports = {
  uploadImage,
  uploadMedia,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_MEDIA_TYPES,
};
