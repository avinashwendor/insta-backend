const mongoose = require('mongoose');
const { VISIBILITY_OPTIONS } = require('../config/constants');

const storySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    media: {
      url: { type: String, required: true },
      thumbnail_url: String,
      type: { type: String, enum: ['image', 'video'], required: true },
      duration: Number,
      width: Number,
      height: Number,
    },
    caption: {
      type: String,
      default: '',
      maxlength: 500,
    },
    stickers: [
      {
        type: {
          type: String,
          enum: ['poll', 'question', 'quiz', 'mention', 'hashtag', 'location', 'link'],
        },
        data: mongoose.Schema.Types.Mixed,
        position: { x: Number, y: Number },
        scale: { type: Number, default: 1.0 },
        rotation: { type: Number, default: 0 },
      },
    ],
    filter_id: String,
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Engagement
    viewers: [
      {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        viewed_at: { type: Date, default: Date.now },
      },
    ],
    reactions: [
      {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        emoji: String,
        created_at: { type: Date, default: Date.now },
      },
    ],
    views_count: { type: Number, default: 0 },

    // Lifecycle
    visibility: {
      type: String,
      enum: Object.values(VISIBILITY_OPTIONS),
      default: VISIBILITY_OPTIONS.PUBLIC,
    },
    is_highlight: { type: Boolean, default: false },
    highlight_group: String,
    expires_at: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL auto-delete after expiry
    },
  },
  {
    timestamps: { createdAt: 'created_at' },
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
storySchema.index({ user_id: 1, created_at: -1 });
storySchema.index({ is_highlight: 1, user_id: 1 });

const Story = mongoose.model('Story', storySchema);

module.exports = Story;
