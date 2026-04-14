const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['dm', 'group'],
      required: true,
    },
    participants: [
      {
        user_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['member', 'admin'],
          default: 'member',
        },
        joined_at: { type: Date, default: Date.now },
        muted_until: Date,
        font_preference: {
          family: String,
          size: Number,
          color: String,
        },
      },
    ],
    group_name: String,
    group_avatar_url: String,
    last_message: {
      text: String,
      sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      sent_at: Date,
    },
    is_active: { type: Boolean, default: true },
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

conversationSchema.index({ 'participants.user_id': 1, updated_at: -1 });
conversationSchema.index({ updated_at: -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
