const cloudinary = require('cloudinary').v2;
const config = require('./index');
const logger = require('../utils/logger');

/**
 * Configure Cloudinary SDK.
 * Only initializes if credentials are provided — allows the app
 * to run without Cloudinary for local dev (media uploads will fail gracefully).
 */
const initializeCloudinary = () => {
  const { cloudName, apiKey, apiSecret } = config.cloudinary;

  if (!cloudName || !apiKey || !apiSecret) {
    logger.warn(
      'Cloudinary credentials not configured. Media uploads will be unavailable.'
    );
    return;
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  logger.info('Cloudinary configured successfully');
};

module.exports = { cloudinary, initializeCloudinary };
