const mongoose = require('mongoose');

// Membership Tier
const membershipSchema = new mongoose.Schema({
  name: { type: String, required: true },
  tier_level: { type: Number, required: true },
  price_monthly: Number,
  price_yearly: Number,
  features: [{
    name: String,
    description: String,
    is_enabled: { type: Boolean, default: true },
  }],
  badge_url: String,
  is_active: { type: Boolean, default: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { transform(_doc, ret) { ret.id = ret._id; delete ret._id; delete ret.__v; return ret; } },
});

// Membership Transaction
const membershipTransactionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  membership_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Membership', required: true },
  type: { type: String, enum: ['subscribe', 'renew', 'upgrade', 'downgrade', 'cancel', 'refund'] },
  amount: Number,
  currency: { type: String, default: 'USD' },
  payment_gateway: { type: String, enum: ['stripe', 'razorpay'] },
  gateway_transaction_id: { type: String, unique: true, sparse: true },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
  period_start: Date,
  period_end: Date,
}, {
  timestamps: { createdAt: 'created_at' },
  toJSON: { transform(_doc, ret) { ret.id = ret._id; delete ret._id; delete ret.__v; return ret; } },
});

membershipTransactionSchema.index({ user_id: 1, created_at: -1 });
membershipTransactionSchema.index({ gateway_transaction_id: 1 }, { unique: true, sparse: true });

const Membership = mongoose.model('Membership', membershipSchema);
const MembershipTransaction = mongoose.model('MembershipTransaction', membershipTransactionSchema);

module.exports = { Membership, MembershipTransaction };
