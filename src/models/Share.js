const mongoose = require('mongoose');

const shareSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    target_type: {
      type: String,
      enum: ['post', 'reel', 'story'],
      required: true,
    },
    target_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    share_type: {
      type: String,
      enum: ['dm', 'external', 'copy_link'],
      required: true,
    },
    recipient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    platform: String, // whatsapp, twitter, etc. for external shares
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

shareSchema.index({ target_type: 1, target_id: 1, created_at: -1 });
shareSchema.index({ user_id: 1, created_at: -1 });

const Share = mongoose.model('Share', shareSchema);

module.exports = Share;
