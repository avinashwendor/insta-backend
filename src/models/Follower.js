const mongoose = require('mongoose');
const { FOLLOW_STATUS } = require('../config/constants');

const followerSchema = new mongoose.Schema(
  {
    follower_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    following_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(FOLLOW_STATUS),
      default: FOLLOW_STATUS.ACTIVE,
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

// Unique compound: one follow relationship per pair
followerSchema.index({ follower_id: 1, following_id: 1 }, { unique: true });
// List followers of a user, newest first
followerSchema.index({ following_id: 1, created_at: -1 });
// List who a user follows, newest first
followerSchema.index({ follower_id: 1, created_at: -1 });

const Follower = mongoose.model('Follower', followerSchema);

module.exports = Follower;
