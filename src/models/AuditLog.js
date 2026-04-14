const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  admin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  target_type: String,
  target_id: { type: mongoose.Schema.Types.ObjectId },
  details: { type: mongoose.Schema.Types.Mixed },
  ip_address: String,
}, {
  timestamps: { createdAt: 'created_at' },
  toJSON: { transform(_doc, ret) { ret.id = ret._id; delete ret._id; delete ret.__v; return ret; } },
});

auditLogSchema.index({ admin_id: 1, created_at: -1 });
auditLogSchema.index({ created_at: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
