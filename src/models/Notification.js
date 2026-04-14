const mongoose = require('mongoose');
const { NOTIFICATION_TYPES } = require('../config/constants');

const notificationSchema = new mongoose.Schema(
  {
    recipient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      required: true,
    },
    content: {
      text: String,
      target_type: String,
      target_id: { type: mongoose.Schema.Types.ObjectId },
    },
    is_read: { type: Boolean, default: false },
    is_pushed: { type: Boolean, default: false },
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

notificationSchema.index({ recipient_id: 1, is_read: 1, created_at: -1 });
notificationSchema.index({ created_at: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // 90 days TTL

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
