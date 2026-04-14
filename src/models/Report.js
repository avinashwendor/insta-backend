const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  target_type: { type: String, enum: ['post', 'reel', 'comment', 'user', 'story', 'message'], required: true },
  target_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  reason: {
    type: String,
    enum: ['spam', 'harassment', 'hate_speech', 'violence', 'nudity', 'false_info', 'copyright', 'other'],
    required: true,
  },
  description: { type: String, maxlength: 1000 },
  status: { type: String, enum: ['pending', 'reviewing', 'resolved', 'dismissed'], default: 'pending' },
  reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolution: String,
  resolved_at: Date,
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { transform(_doc, ret) { ret.id = ret._id; delete ret._id; delete ret.__v; return ret; } },
});

reportSchema.index({ status: 1, created_at: -1 });
reportSchema.index({ target_type: 1, target_id: 1 });
reportSchema.index({ reporter_id: 1 });

const Report = mongoose.model('Report', reportSchema);
module.exports = Report;
