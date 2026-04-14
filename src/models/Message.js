const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'audio', 'post_share', 'reel_share', 'story_reply'],
      default: 'text',
    },
    content: {
      text: String,
      media_url: String,
      thumbnail_url: String,
      shared_content_id: { type: mongoose.Schema.Types.ObjectId },
      shared_content_type: String,
    },
    font: {
      family: String,
      size: Number,
      color: String,
    },
    reactions: [
      {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        emoji: String,
        created_at: { type: Date, default: Date.now },
      },
    ],
    read_by: [
      {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        read_at: { type: Date, default: Date.now },
      },
    ],
    is_deleted: { type: Boolean, default: false },
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

messageSchema.index({ conversation_id: 1, created_at: -1 });
messageSchema.index({ sender_id: 1, created_at: -1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
