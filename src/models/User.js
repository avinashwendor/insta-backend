const mongoose = require('mongoose');
const {
  ACCOUNT_TYPES,
  GENDER_OPTIONS,
  MEMBERSHIP_TIERS,
} = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      lowercase: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      sparse: true,
      trim: true,
    },
    password_hash: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Never returned in queries by default
    },

    // Profile
    display_name: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
      minlength: 1,
      maxlength: 50,
    },
    bio: {
      type: String,
      default: '',
      maxlength: 500,
    },
    avatar_url: {
      type: String,
      default: '',
    },
    cover_url: {
      type: String,
      default: '',
    },
    date_of_birth: Date,
    gender: {
      type: String,
      enum: Object.values(GENDER_OPTIONS),
    },
    website: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },

    // Denormalized counts
    followers_count: { type: Number, default: 0 },
    following_count: { type: Number, default: 0 },
    posts_count: { type: Number, default: 0 },
    reels_count: { type: Number, default: 0 },

    // Account
    account_type: {
      type: String,
      enum: Object.values(ACCOUNT_TYPES),
      default: ACCOUNT_TYPES.PERSONAL,
    },
    is_verified: { type: Boolean, default: false },
    is_private: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true },
    is_banned: { type: Boolean, default: false },
    ban_reason: String,
    ban_expires_at: Date,

    // Interests & Discovery
    interests: [{ type: String, trim: true, lowercase: true }],
    language: { type: String, default: 'en' },

    // OAuth
    oauth_providers: [
      {
        provider: { type: String, required: true },
        provider_id: { type: String, required: true },
        linked_at: { type: Date, default: Date.now },
      },
    ],

    // 2FA
    two_factor_enabled: { type: Boolean, default: false },
    two_factor_secret: { type: String, select: false },

    // Membership
    membership_tier: {
      type: String,
      enum: Object.values(MEMBERSHIP_TIERS),
      default: MEMBERSHIP_TIERS.FREE,
    },
    membership_expires_at: Date,

    // Activity
    last_active_at: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password_hash;
        delete ret.two_factor_secret;
        return ret;
      },
    },
  }
);

// Indexes per db_design.md
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { unique: true, sparse: true });
userSchema.index({ interests: 1 });
userSchema.index({ is_active: 1, created_at: -1 });
userSchema.index(
  { display_name: 'text', username: 'text', bio: 'text' },
  { weights: { username: 10, display_name: 5, bio: 1 } }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
