const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    content_type: {
      type: String,
      enum: ['post', 'reel'],
      required: true,
    },
    content_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'content_type_model',
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    parent_comment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },

    text: {
      type: String,
      required: [true, 'Comment text is required'],
      maxlength: 1000,
    },
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Engagement
    likes_count: { type: Number, default: 0 },
    replies_count: { type: Number, default: 0 },

    // Moderation
    is_flagged: { type: Boolean, default: false },
    is_hidden: { type: Boolean, default: false },
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

// Virtual to resolve refPath for content_id population
commentSchema.virtual('content_type_model').get(function () {
  return this.content_type === 'post' ? 'Post' : 'Reel';
});

// Indexes per db_design.md
commentSchema.index({ content_type: 1, content_id: 1, created_at: -1 });
commentSchema.index({ parent_comment_id: 1, created_at: 1 });
commentSchema.index({ user_id: 1 });

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
