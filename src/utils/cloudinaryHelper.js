const { cloudinary } = require('../config/cloudinary');
const ApiError = require('./ApiError');
const logger = require('./logger');

/**
 * Cloudinary upload/delete helpers.
 * All media operations go through these functions.
 */

/**
 * Upload a file buffer to Cloudinary.
 * @param {Buffer} fileBuffer - The file buffer from Multer
 * @param {object} options - Upload options
 * @param {string} options.folder - Cloudinary folder path (e.g. 'avatars', 'posts')
 * @param {string} [options.resourceType='auto'] - 'image', 'video', or 'auto'
 * @param {string} [options.publicId] - Custom public ID
 * @param {object} [options.transformation] - Cloudinary transformation options
 * @returns {Promise<{ url: string, publicId: string, width: number, height: number, format: string, bytes: number, duration: number|null }>}
 */
const uploadToCloudinary = (fileBuffer, options) => {
  return new Promise((resolve, reject) => {
    const { folder, resourceType = 'auto', publicId, transformation } = options;

    const uploadOptions = {
      folder: `instayt/${folder}`,
      resource_type: resourceType,
      quality: 'auto',
      fetch_format: 'auto',
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    if (transformation) {
      uploadOptions.transformation = transformation;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          logger.error('Cloudinary upload failed:', error.message);
          return reject(ApiError.internal('Media upload failed'));
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
          duration: result.duration || null,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete a file from Cloudinary by its public ID.
 * @param {string} publicId - Cloudinary public ID
 * @param {string} [resourceType='image'] - 'image', 'video', or 'raw'
 * @returns {Promise<void>}
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    logger.info(`Cloudinary asset deleted: ${publicId}`);
  } catch (error) {
    // Log but don't throw — media deletion failure should not block operations
    logger.error(`Cloudinary delete failed for ${publicId}:`, error.message);
  }
};

/**
 * Generate a thumbnail URL via Cloudinary URL transformation.
 * @param {string} originalUrl - The original Cloudinary URL
 * @param {number} [width=400] - Thumbnail width
 * @param {number} [height=400] - Thumbnail height
 * @returns {string}
 */
const getThumbnailUrl = (originalUrl, width = 400, height = 400) => {
  if (!originalUrl || !originalUrl.includes('cloudinary')) {
    return originalUrl;
  }
  // Insert transformation before the version segment
  return originalUrl.replace(
    '/upload/',
    `/upload/w_${width},h_${height},c_fill,g_auto,q_auto/`
  );
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  getThumbnailUrl,
};
