const mongoose = require('mongoose');

const collaborationRevenueSchema = new mongoose.Schema(
  {
    collaboration_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Collaboration', required: true },
    content_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    period: { type: String, required: true },
    total_revenue: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    splits: [{
      user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      percentage: Number,
      amount: Number,
      settled: { type: Boolean, default: false },
      settled_at: Date,
    }],
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { transform(_doc, ret) { ret.id = ret._id; delete ret._id; delete ret.__v; return ret; } },
  }
);

collaborationRevenueSchema.index({ content_id: 1, period: 1 }, { unique: true });

const CollaborationRevenue = mongoose.model('CollaborationRevenue', collaborationRevenueSchema);
module.exports = CollaborationRevenue;
