/**
 * Application-wide constants and enum definitions.
 * Single source of truth for all magic strings used across the codebase.
 */

const ACCOUNT_TYPES = Object.freeze({
  PERSONAL: 'personal',
  CREATOR: 'creator',
  BUSINESS: 'business',
  ADMIN: 'admin',
});

const GENDER_OPTIONS = Object.freeze({
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
  PREFER_NOT_TO_SAY: 'prefer_not_to_say',
});

const MEMBERSHIP_TIERS = Object.freeze({
  FREE: 'free',
  SILVER: 'silver',
  GOLD: 'gold',
  PLATINUM: 'platinum',
});

const FOLLOW_STATUS = Object.freeze({
  ACTIVE: 'active',
  PENDING: 'pending',
});

const CONTENT_TYPES = Object.freeze({
  POST: 'post',
  REEL: 'reel',
  STORY: 'story',
  COMMENT: 'comment',
});

const POST_TYPES = Object.freeze({
  IMAGE: 'image',
  VIDEO: 'video',
  CAROUSEL: 'carousel',
  TEXT: 'text',
});

const VISIBILITY_OPTIONS = Object.freeze({
  PUBLIC: 'public',
  FOLLOWERS: 'followers',
  CLOSE_FRIENDS: 'close_friends',
});

const COLLABORATION_STATUS = Object.freeze({
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  REVOKED: 'revoked',
});

const DEVICE_TYPES = Object.freeze({
  IOS: 'ios',
  ANDROID: 'android',
  WEB: 'web',
});

const OAUTH_PROVIDERS = Object.freeze({
  GOOGLE: 'google',
  APPLE: 'apple',
  FACEBOOK: 'facebook',
});

const NOTIFICATION_TYPES = Object.freeze({
  LIKE: 'like',
  COMMENT: 'comment',
  FOLLOW: 'follow',
  FOLLOW_REQUEST: 'follow_request',
  MENTION: 'mention',
  COLLABORATION_INVITE: 'collaboration_invite',
  COLLAB_ACCEPTED: 'collab_accepted',
  MESSAGE: 'message',
  SERVER_UPDATE: 'server_update',
  AD_REPORT: 'ad_report',
  SYSTEM: 'system',
});

const THEME_OPTIONS = Object.freeze({
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
});

const MENTION_ALLOW = Object.freeze({
  EVERYONE: 'everyone',
  FOLLOWERS: 'followers',
  NOBODY: 'nobody',
});

const ADMIN_ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  ANALYST: 'analyst',
  AD_MANAGER: 'ad_manager',
});

const ERROR_CODES = Object.freeze({
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  CONFLICT: 'CONFLICT',
  SERVER_ERROR: 'SERVER_ERROR',
});

const RATE_LIMIT_TIERS = Object.freeze({
  STANDARD: { windowMs: 60 * 1000, max: 100 },
  SENSITIVE: { windowMs: 60 * 1000, max: 30 },
  AUTH: { windowMs: 60 * 1000, max: 10 },
  UPLOAD: { windowMs: 60 * 1000, max: 5 },
});

const PAGINATION = Object.freeze({
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
});

module.exports = {
  ACCOUNT_TYPES,
  GENDER_OPTIONS,
  MEMBERSHIP_TIERS,
  FOLLOW_STATUS,
  CONTENT_TYPES,
  POST_TYPES,
  VISIBILITY_OPTIONS,
  COLLABORATION_STATUS,
  DEVICE_TYPES,
  OAUTH_PROVIDERS,
  NOTIFICATION_TYPES,
  THEME_OPTIONS,
  MENTION_ALLOW,
  ADMIN_ROLES,
  ERROR_CODES,
  RATE_LIMIT_TIERS,
  PAGINATION,
};
