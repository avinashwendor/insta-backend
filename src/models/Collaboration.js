const mongoose = require('mongoose');
const { COLLABORATION_STATUS } = require('../config/constants');

const collaborationSchema = new mongoose.Schema(
  {
    content_type: { type: String, enum: ['post', 'reel'], required: true },
    content_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    inviter_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    invitee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: Object.values(COLLABORATION_STATUS),
      default: COLLABORATION_STATUS.PENDING,
    },
    watchtime_split: {
      inviter_percent: { type: Number, default: 50 },
      invitee_percent: { type: Number, default: 50 },
    },
    revenue_split: {
      inviter_percent: { type: Number, default: 50 },
      invitee_percent: { type: Number, default: 50 },
    },
    message: String,
    responded_at: Date,
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { transform(_doc, ret) { ret.id = ret._id; delete ret._id; delete ret.__v; return ret; } },
  }
);

collaborationSchema.index({ invitee_id: 1, status: 1, created_at: -1 });
collaborationSchema.index({ content_id: 1 });
collaborationSchema.index({ inviter_id: 1, status: 1 });

const Collaboration = mongoose.model('Collaboration', collaborationSchema);
module.exports = Collaboration;
