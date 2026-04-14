const mongoose = require('mongoose');
const {
  POST_TYPES,
  VISIBILITY_OPTIONS,
  COLLABORATION_STATUS,
} = require('../config/constants');

const postSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(POST_TYPES),
      required: true,
    },

    // Content
    caption: {
      type: String,
      default: '',
      maxlength: 2200,
    },
    media: [
      {
        url: { type: String, required: true },
        thumbnail_url: String,
        type: { type: String, enum: ['image', 'video'], required: true },
        width: Number,
        height: Number,
        duration: Number,
        alt_text: { type: String, default: '' },
        order: Number,
      },
    ],

    // Metadata
    location: {
      name: String,
      lat: Number,
      lng: Number,
    },
    hashtags: [{ type: String, trim: true, lowercase: true }],
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Collaboration
    collaborators: [
      {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: {
          type: String,
          enum: Object.values(COLLABORATION_STATUS),
          default: COLLABORATION_STATUS.PENDING,
        },
        watchtime_split: { type: Number, min: 0, max: 100 },
        revenue_split: { type: Number, min: 0, max: 100 },
        accepted_at: Date,
      },
    ],

    // Engagement (denormalized)
    likes_count: { type: Number, default: 0 },
    comments_count: { type: Number, default: 0 },
    shares_count: { type: Number, default: 0 },
    saves_count: { type: Number, default: 0 },
    views_count: { type: Number, default: 0 },

    // Settings
    visibility: {
      type: String,
      enum: Object.values(VISIBILITY_OPTIONS),
      default: VISIBILITY_OPTIONS.PUBLIC,
    },
    comments_enabled: { type: Boolean, default: true },
    likes_visible: { type: Boolean, default: true },
    is_pinned: { type: Boolean, default: false },

    // Moderation
    is_flagged: { type: Boolean, default: false },
    is_hidden: { type: Boolean, default: false },
    flag_reason: String,

    // Ads
    is_sponsored: { type: Boolean, default: false },
    ad_campaign_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AdCampaign' },
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

// Indexes per db_design.md
postSchema.index({ user_id: 1, created_at: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ 'collaborators.user_id': 1, 'collaborators.status': 1 });
postSchema.index({ created_at: -1 });
postSchema.index({ is_sponsored: 1 });
postSchema.index({ visibility: 1, is_hidden: 1, created_at: -1 });

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
