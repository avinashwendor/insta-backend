const mongoose = require('mongoose');

const hashtagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    posts_count: { type: Number, default: 0 },
    reels_count: { type: Number, default: 0 },
    is_trending: { type: Boolean, default: false },
    is_banned: { type: Boolean, default: false },
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

hashtagSchema.index({ name: 1 }, { unique: true });
hashtagSchema.index({ is_trending: 1, posts_count: -1 });

const Hashtag = mongoose.model('Hashtag', hashtagSchema);

module.exports = Hashtag;
