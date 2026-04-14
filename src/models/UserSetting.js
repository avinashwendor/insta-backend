const mongoose = require('mongoose');
const { THEME_OPTIONS, MENTION_ALLOW } = require('../config/constants');

const userSettingSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    privacy: {
      show_activity_status: { type: Boolean, default: true },
      allow_mentions_from: {
        type: String,
        enum: Object.values(MENTION_ALLOW),
        default: MENTION_ALLOW.EVERYONE,
      },
      allow_tags_from: {
        type: String,
        enum: Object.values(MENTION_ALLOW),
        default: MENTION_ALLOW.EVERYONE,
      },
      allow_message_requests: { type: Boolean, default: true },
      show_read_receipts: { type: Boolean, default: true },
    },

    notifications: {
      likes: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
      follows: { type: Boolean, default: true },
      mentions: { type: Boolean, default: true },
      collaborations: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
      server_updates: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false },
    },

    display: {
      theme: {
        type: String,
        enum: Object.values(THEME_OPTIONS),
        default: THEME_OPTIONS.SYSTEM,
      },
      font_size: {
        type: String,
        enum: ['small', 'medium', 'large'],
        default: 'medium',
      },
      language: { type: String, default: 'en' },
    },

    content: {
      autoplay_videos: { type: Boolean, default: true },
      data_saver_mode: { type: Boolean, default: false },
      default_post_visibility: {
        type: String,
        enum: ['public', 'followers'],
        default: 'public',
      },
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const UserSetting = mongoose.model('UserSetting', userSettingSchema);

module.exports = UserSetting;
