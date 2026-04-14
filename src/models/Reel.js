const mongoose = require('mongoose');
const { COLLABORATION_STATUS } = require('../config/constants');

const reelSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Video
    video_url: { type: String, required: true },
    thumbnail_url: String,
    duration: { type: Number, max: 90 },
    width: Number,
    height: Number,

    // Content
    title: { type: String, default: '', maxlength: 100 },
    description: { type: String, default: '', maxlength: 2200 },
    hashtags: [{ type: String, trim: true, lowercase: true }],
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Audio
    audio: {
      audio_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AudioTrack' },
      title: String,
      artist: String,
      is_original: { type: Boolean, default: true },
      start_offset: { type: Number, default: 0 },
      duration: Number,
    },

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
    avg_watch_time: { type: Number, default: 0 },

    // Settings
    comments_enabled: { type: Boolean, default: true },
    allow_remix: { type: Boolean, default: true },
    allow_duet: { type: Boolean, default: true },

    // Moderation
    is_flagged: { type: Boolean, default: false },
    is_hidden: { type: Boolean, default: false },

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
reelSchema.index({ user_id: 1, created_at: -1 });
reelSchema.index({ 'audio.audio_id': 1 });
reelSchema.index({ hashtags: 1 });
reelSchema.index({ views_count: -1, created_at: -1 });
reelSchema.index({ 'collaborators.user_id': 1 });
reelSchema.index({ is_hidden: 1, created_at: -1 });

const Reel = mongoose.model('Reel', reelSchema);

module.exports = Reel;
