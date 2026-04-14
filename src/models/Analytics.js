const mongoose = require('mongoose');

// User Analytics (daily per user)
const userAnalyticsSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  profile_visits: { type: Number, default: 0 },
  impressions: { type: Number, default: 0 },
  reach: { type: Number, default: 0 },
  engagement: {
    likes_received: { type: Number, default: 0 },
    comments_received: { type: Number, default: 0 },
    shares_received: { type: Number, default: 0 },
    saves_received: { type: Number, default: 0 },
  },
  followers_gained: { type: Number, default: 0 },
  followers_lost: { type: Number, default: 0 },
  story_views: { type: Number, default: 0 },
  reel_views: { type: Number, default: 0 },
}, {
  timestamps: { createdAt: 'created_at' },
});
userAnalyticsSchema.index({ user_id: 1, date: -1 }, { unique: true });

// Content Analytics (daily per content)
const contentAnalyticsSchema = new mongoose.Schema({
  content_type: { type: String, enum: ['post', 'reel', 'story'] },
  content_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  date: { type: Date, required: true },
  views: { type: Number, default: 0 },
  unique_views: { type: Number, default: 0 },
  avg_watch_time: { type: Number, default: 0 },
  completion_rate: { type: Number, default: 0 },
  engagement: {
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
  },
  traffic_sources: {
    feed: { type: Number, default: 0 },
    explore: { type: Number, default: 0 },
    profile: { type: Number, default: 0 },
    hashtag: { type: Number, default: 0 },
    external: { type: Number, default: 0 },
  },
  audience: { type: mongoose.Schema.Types.Mixed },
}, {
  timestamps: { createdAt: 'created_at' },
});
contentAnalyticsSchema.index({ content_type: 1, content_id: 1, date: -1 });

// Platform Analytics (daily aggregate)
const platformAnalyticsSchema = new mongoose.Schema({
  date: { type: Date, required: true, unique: true },
  users: { dau: Number, mau: Number, new_signups: Number, active_creators: Number },
  content: { posts_created: Number, reels_created: Number, stories_created: Number, comments_created: Number },
  engagement: { total_likes: Number, total_comments: Number, total_shares: Number, avg_session_duration: Number },
  revenue: { ad_revenue: Number, membership_revenue: Number, total: Number },
  moderation: { reports_received: Number, content_removed: Number, users_banned: Number },
}, {
  timestamps: { createdAt: 'created_at' },
});
platformAnalyticsSchema.index({ date: -1 }, { unique: true });

// Watch Session
const watchSessionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content_type: { type: String, enum: ['post', 'reel', 'story'] },
  content_id: { type: mongoose.Schema.Types.ObjectId },
  watch_duration: Number,
  total_duration: Number,
  completed: { type: Boolean, default: false },
  source: { type: String, enum: ['feed', 'explore', 'profile', 'share_link'] },
  device_type: String,
}, {
  timestamps: { createdAt: 'created_at' },
});
watchSessionSchema.index({ content_id: 1, created_at: -1 });
watchSessionSchema.index({ user_id: 1, created_at: -1 });

const UserAnalytics = mongoose.model('UserAnalytics', userAnalyticsSchema);
const ContentAnalytics = mongoose.model('ContentAnalytics', contentAnalyticsSchema);
const PlatformAnalytics = mongoose.model('PlatformAnalytics', platformAnalyticsSchema);
const WatchSession = mongoose.model('WatchSession', watchSessionSchema);

module.exports = { UserAnalytics, ContentAnalytics, PlatformAnalytics, WatchSession };
