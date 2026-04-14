const mongoose = require('mongoose');

// Ad Campaign
const adCampaignSchema = new mongoose.Schema({
  advertiser_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['banner', 'interstitial', 'native', 'sponsored_post', 'sponsored_reel'] },
  platform: { type: String, enum: ['admob', 'meta_audience', 'internal'], default: 'internal' },
  target_audience: {
    age_range: { min: Number, max: Number },
    genders: [String],
    locations: [String],
    interests: [String],
  },
  budget: {
    total: Number,
    daily_limit: Number,
    bid_type: { type: String, enum: ['cpm', 'cpc', 'cpa'] },
    bid_amount: Number,
  },
  schedule: { start_date: Date, end_date: Date },
  creative: { media_url: String, caption: String, cta_text: String, cta_url: String },
  status: {
    type: String,
    enum: ['draft', 'pending_review', 'active', 'paused', 'completed', 'rejected'],
    default: 'draft',
  },
  rejection_reason: String,
  metrics: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    spend: { type: Number, default: 0 },
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { transform(_doc, ret) { ret.id = ret._id; delete ret._id; delete ret.__v; return ret; } },
});

adCampaignSchema.index({ advertiser_id: 1, status: 1 });
adCampaignSchema.index({ status: 1, 'schedule.start_date': 1, 'schedule.end_date': 1 });

// Ad Impression
const adImpressionSchema = new mongoose.Schema({
  campaign_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AdCampaign', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  event_type: { type: String, enum: ['impression', 'click', 'conversion'], required: true },
  placement: { type: String, enum: ['feed', 'stories', 'reels', 'explore'] },
  device_type: String,
  ip_address: String,
}, {
  timestamps: { createdAt: 'created_at' },
});

adImpressionSchema.index({ campaign_id: 1, created_at: -1 });
adImpressionSchema.index({ user_id: 1, campaign_id: 1 });

// Ad Revenue (creator earnings)
const adRevenueSchema = new mongoose.Schema({
  creator_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content_type: String,
  content_id: { type: mongoose.Schema.Types.ObjectId },
  period: String,
  impressions: { type: Number, default: 0 },
  earnings: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  is_paid: { type: Boolean, default: false },
  paid_at: Date,
}, {
  timestamps: { createdAt: 'created_at' },
  toJSON: { transform(_doc, ret) { ret.id = ret._id; delete ret._id; delete ret.__v; return ret; } },
});

adRevenueSchema.index({ creator_id: 1, period: 1 });

const AdCampaign = mongoose.model('AdCampaign', adCampaignSchema);
const AdImpression = mongoose.model('AdImpression', adImpressionSchema);
const AdRevenue = mongoose.model('AdRevenue', adRevenueSchema);

module.exports = { AdCampaign, AdImpression, AdRevenue };
