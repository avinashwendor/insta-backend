const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const {
  userRepository,
  userSettingRepository,
  userSessionRepository,
} = require('../repositories/user.repository');

/**
 * Authentication service — handles registration, login, token management.
 * All business logic for auth flows lives here.
 */

/**
 * Generate JWT access token.
 * @param {object} user - User document
 * @returns {string}
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id || user.id,
      username: user.username,
      email: user.email,
      accountType: user.account_type,
    },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpiresIn }
  );
};

/**
 * Generate JWT refresh token.
 * @param {object} user - User document
 * @returns {string}
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id || user.id },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );
};

/**
 * Hash a refresh token for secure storage.
 * @param {string} token
 * @returns {string}
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Calculate refresh token expiry date.
 * @returns {Date}
 */
const getRefreshTokenExpiry = () => {
  const days = parseInt(config.jwt.refreshExpiresIn, 10) || 30;
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  return expiry;
};

/**
 * Register a new user.
 * Creates user, default settings, and initial session.
 */
const register = async ({ email, username, display_name, password, date_of_birth }, deviceInfo) => {
  // Check for duplicates
  const { emailTaken, usernameTaken } = await userRepository.checkDuplicates(email, username);

  if (emailTaken) {
    throw ApiError.conflict('Email is already registered');
  }
  if (usernameTaken) {
    throw ApiError.conflict('Username is already taken');
  }

  // Hash password
  const password_hash = await bcrypt.hash(password, config.bcrypt.saltRounds);

  // Create user
  const user = await userRepository.create({
    email,
    username,
    display_name,
    password_hash,
    date_of_birth: new Date(date_of_birth),
  });

  // Create default settings
  await userSettingRepository.create({ user_id: user._id });

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store session
  await userSessionRepository.create({
    user_id: user._id,
    refresh_token_hash: hashToken(refreshToken),
    device: deviceInfo || {},
    ip_address: deviceInfo?.ip || '',
    expires_at: getRefreshTokenExpiry(),
  });

  logger.info(`User registered: ${username} (${email})`);

  return {
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: 900, // 15 minutes in seconds
  };
};

/**
 * Login with email and password.
 */
const login = async ({ email, password }, deviceInfo) => {
  const user = await userRepository.findByEmailWithPassword(email);

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.is_active) {
    throw ApiError.forbidden('Account has been deactivated');
  }

  if (user.is_banned) {
    const banMessage = user.ban_expires_at
      ? `Account banned until ${user.ban_expires_at.toISOString()}`
      : 'Account permanently banned';
    throw ApiError.forbidden(`${banMessage}. Reason: ${user.ban_reason || 'Unspecified'}`);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await userSessionRepository.create({
    user_id: user._id,
    refresh_token_hash: hashToken(refreshToken),
    device: deviceInfo || {},
    ip_address: deviceInfo?.ip || '',
    expires_at: getRefreshTokenExpiry(),
  });

  // Update last active
  await userRepository.updateById(user._id, { last_active_at: new Date() });

  logger.info(`User logged in: ${user.username}`);

  return {
    user: {
      id: user._id,
      username: user.username,
    },
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: 900,
  };
};

/**
 * Logout — invalidate the current session's refresh token.
 */
const logout = async (refreshToken) => {
  if (!refreshToken) {
    throw ApiError.badRequest('Refresh token is required');
  }

  const tokenHash = hashToken(refreshToken);
  const session = await userSessionRepository.findByRefreshTokenHash(tokenHash);

  if (session) {
    await userSessionRepository.deactivateSession(session._id);
    logger.info(`Session deactivated for user: ${session.user_id}`);
  }
};

/**
 * Refresh access token using a valid refresh token.
 * Implements token rotation: old refresh token is invalidated, new one is issued.
 */
const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw ApiError.badRequest('Refresh token is required');
  }

  // Verify JWT signature
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
  } catch (error) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  // Look up session
  const tokenHash = hashToken(refreshToken);
  const session = await userSessionRepository.findByRefreshTokenHash(tokenHash);

  if (!session) {
    // Token reuse detected — invalidate all user sessions for safety
    await userSessionRepository.deactivateAllUserSessions(decoded.id);
    logger.warn(`Refresh token reuse detected for user: ${decoded.id}`);
    throw ApiError.unauthorized('Session expired. Please login again.');
  }

  // Get user
  const user = await userRepository.findById(decoded.id);

  if (!user || !user.is_active) {
    await userSessionRepository.deactivateSession(session._id);
    throw ApiError.unauthorized('User account is inactive');
  }

  // Rotate tokens
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  // Invalidate old session, create new one
  await userSessionRepository.deactivateSession(session._id);
  await userSessionRepository.create({
    user_id: user._id,
    refresh_token_hash: hashToken(newRefreshToken),
    device: session.device,
    ip_address: session.ip_address,
    expires_at: getRefreshTokenExpiry(),
  });

  return {
    access_token: newAccessToken,
    refresh_token: newRefreshToken,
    expires_in: 900,
  };
};

/**
 * Forgot password — in a real system, sends a reset email.
 * For now, generates a token and logs it to the console.
 */
const forgotPassword = async (email) => {
  const user = await userRepository.findOne({ email, is_active: true });

  // Always return success to prevent email enumeration
  if (!user) {
    logger.info(`Password reset requested for unknown email: ${email}`);
    return;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Store the hashed reset token on the user (in a real app, use a separate collection with TTL)
  await userRepository.updateById(user._id, {
    password_reset_token: resetTokenHash,
    password_reset_expires: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
  });

  // In production: send email with resetToken
  logger.info(`Password reset token for ${email}: ${resetToken}`);
};

/**
 * Reset password using a valid reset token.
 */
const resetPassword = async (token, newPassword) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const user = await userRepository.findOne({
    password_reset_token: tokenHash,
    password_reset_expires: { $gt: new Date() },
  });

  if (!user) {
    throw ApiError.badRequest('Invalid or expired reset token');
  }

  const password_hash = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);

  await userRepository.updateById(user._id, {
    password_hash,
    password_reset_token: undefined,
    password_reset_expires: undefined,
  });

  // Invalidate all sessions (force re-login after password change)
  await userSessionRepository.deactivateAllUserSessions(user._id);

  logger.info(`Password reset for user: ${user.username}`);
};

module.exports = {
  register,
  login,
  logout,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
};
