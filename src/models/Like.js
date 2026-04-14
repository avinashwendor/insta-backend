const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    target_type: {
      type: String,
      enum: ['post', 'reel', 'comment', 'story'],
      required: true,
    },
    target_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
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

// One like per user per target
likeSchema.index(
  { user_id: 1, target_type: 1, target_id: 1 },
  { unique: true }
);
// List who liked a target
likeSchema.index({ target_type: 1, target_id: 1, created_at: -1 });

const Like = mongoose.model('Like', likeSchema);

module.exports = Like;
