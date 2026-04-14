const mongoose = require('mongoose');
const { DEVICE_TYPES } = require('../config/constants');

const userSessionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    refresh_token_hash: {
      type: String,
      required: true,
      unique: true,
    },
    device: {
      type: {
        type: String,
        enum: Object.values(DEVICE_TYPES),
        default: DEVICE_TYPES.WEB,
      },
      name: String,
      os_version: String,
      app_version: String,
    },
    ip_address: String,
    location: String,
    is_active: { type: Boolean, default: true },
    last_used_at: { type: Date, default: Date.now },
    expires_at: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL auto-delete
    },
  },
  {
    timestamps: { createdAt: 'created_at' },
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.refresh_token_hash;
        return ret;
      },
    },
  }
);

userSessionSchema.index({ user_id: 1 });
userSessionSchema.index({ refresh_token_hash: 1 }, { unique: true });

const UserSession = mongoose.model('UserSession', userSessionSchema);

module.exports = UserSession;
