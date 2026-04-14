# INSTAYT — Database Design (MongoDB)

> **Stack**: MongoDB Atlas · Mongoose ODM · Redis Cache · AWS S3 (media)
> **Naming**: snake_case for fields, PascalCase for models, plural for collections

---

## 1. Core User System

### 1.1 `users`
```js
{
  _id: ObjectId,
  username: String,          // unique, lowercase, 3-30 chars, alphanumeric + underscores
  email: String,             // unique, validated format
  phone: String,             // optional, E.164 format
  password_hash: String,     // bcrypt (12 rounds)
  salt: String,              // per-user salt

  // Profile
  display_name: String,      // 1-50 chars
  bio: String,               // max 500 chars
  avatar_url: String,        // S3 path
  cover_url: String,         // S3 path
  date_of_birth: Date,
  gender: String,            // enum: male, female, other, prefer_not_to_say
  website: String,
  location: String,

  // Counts (denormalized for read performance)
  followers_count: Number,   // default: 0
  following_count: Number,   // default: 0
  posts_count: Number,       // default: 0
  reels_count: Number,       // default: 0

  // Account
  account_type: String,      // enum: personal, creator, business
  is_verified: Boolean,      // blue badge
  is_private: Boolean,       // default: false
  is_active: Boolean,        // soft delete flag
  is_banned: Boolean,
  ban_reason: String,
  ban_expires_at: Date,

  // Interests & Discovery
  interests: [String],       // tags for content recommendation
  language: String,          // ISO 639-1

  // Auth
  oauth_providers: [{
    provider: String,        // google, apple, facebook
    provider_id: String,
    linked_at: Date
  }],
  two_factor_enabled: Boolean,
  two_factor_secret: String,

  // Membership
  membership_tier: String,   // enum: free, silver, gold, platinum
  membership_expires_at: Date,

  // Timestamps
  last_active_at: Date,
  created_at: Date,
  updated_at: Date
}
```
**Indexes:**
- `{ username: 1 }` — unique
- `{ email: 1 }` — unique
- `{ phone: 1 }` — unique, sparse
- `{ interests: 1 }` — multikey for discovery
- `{ is_active: 1, created_at: -1 }` — admin listing
- `{ display_name: "text", username: "text", bio: "text" }` — full-text search

---

### 1.2 `user_settings`
```js
{
  _id: ObjectId,
  user_id: ObjectId,         // ref: users, unique

  // Privacy
  privacy: {
    show_activity_status: Boolean,    // default: true
    allow_mentions_from: String,      // enum: everyone, followers, nobody
    allow_tags_from: String,
    allow_message_requests: Boolean,
    show_read_receipts: Boolean
  },

  // Notifications
  notifications: {
    likes: Boolean,
    comments: Boolean,
    follows: Boolean,
    mentions: Boolean,
    collaborations: Boolean,
    messages: Boolean,
    server_updates: Boolean,
    marketing: Boolean
  },

  // Display
  display: {
    theme: String,           // enum: light, dark, system
    font_size: String,       // enum: small, medium, large
    language: String
  },

  // Content
  content: {
    autoplay_videos: Boolean,
    data_saver_mode: Boolean,
    default_post_visibility: String   // enum: public, followers
  },

  created_at: Date,
  updated_at: Date
}
```
**Indexes:** `{ user_id: 1 }` — unique

---

### 1.3 `user_sessions`
```js
{
  _id: ObjectId,
  user_id: ObjectId,
  refresh_token_hash: String,
  device: {
    type: String,            // enum: ios, android, web
    name: String,
    os_version: String,
    app_version: String
  },
  ip_address: String,
  location: String,
  is_active: Boolean,
  last_used_at: Date,
  expires_at: Date,          // TTL index
  created_at: Date
}
```
**Indexes:**
- `{ user_id: 1 }` — find all sessions
- `{ refresh_token_hash: 1 }` — unique, token lookup
- `{ expires_at: 1 }` — TTL auto-delete

---

### 1.4 `followers`
```js
{
  _id: ObjectId,
  follower_id: ObjectId,     // who follows
  following_id: ObjectId,    // who is being followed
  status: String,            // enum: active, pending (for private accounts)
  created_at: Date
}
```
**Indexes:**
- `{ follower_id: 1, following_id: 1 }` — unique compound
- `{ following_id: 1, created_at: -1 }` — list followers
- `{ follower_id: 1, created_at: -1 }` — list following

---

### 1.5 `blocked_users`
```js
{
  _id: ObjectId,
  blocker_id: ObjectId,
  blocked_id: ObjectId,
  reason: String,
  created_at: Date
}
```
**Indexes:** `{ blocker_id: 1, blocked_id: 1 }` — unique compound

---

## 2. Content System

### 2.1 `posts`
```js
{
  _id: ObjectId,
  user_id: ObjectId,         // ref: users (author)
  type: String,              // enum: image, video, carousel, text

  // Content
  caption: String,           // max 2200 chars
  media: [{
    url: String,             // S3 path
    thumbnail_url: String,
    type: String,            // enum: image, video
    width: Number,
    height: Number,
    duration: Number,        // seconds (video only)
    alt_text: String,        // accessibility
    order: Number
  }],

  // Metadata
  location: {
    name: String,
    lat: Number,
    lng: Number
  },
  hashtags: [String],        // extracted from caption
  mentions: [ObjectId],      // ref: users mentioned

  // Collaboration
  collaborators: [{
    user_id: ObjectId,
    status: String,          // enum: pending, accepted, rejected
    watchtime_split: Number, // percentage (0-100)
    revenue_split: Number,   // percentage (0-100)
    accepted_at: Date
  }],

  // Engagement (denormalized counts)
  likes_count: Number,
  comments_count: Number,
  shares_count: Number,
  saves_count: Number,
  views_count: Number,

  // Settings
  visibility: String,        // enum: public, followers, close_friends
  comments_enabled: Boolean, // default: true
  likes_visible: Boolean,    // default: true
  is_pinned: Boolean,

  // Moderation
  is_flagged: Boolean,
  is_hidden: Boolean,
  flag_reason: String,

  // Ads
  is_sponsored: Boolean,
  ad_campaign_id: ObjectId,

  created_at: Date,
  updated_at: Date
}
```
**Indexes:**
- `{ user_id: 1, created_at: -1 }` — user's posts feed
- `{ hashtags: 1 }` — hashtag search
- `{ "collaborators.user_id": 1, "collaborators.status": 1 }` — collab posts
- `{ created_at: -1 }` — global feed
- `{ "location.lat": 1, "location.lng": 1 }` — 2dsphere geospatial
- `{ is_sponsored: 1 }` — sponsored content filter

---

### 2.2 `stories`
```js
{
  _id: ObjectId,
  user_id: ObjectId,
  media: {
    url: String,
    thumbnail_url: String,
    type: String,            // enum: image, video
    duration: Number,        // display duration (seconds)
    width: Number,
    height: Number
  },
  caption: String,
  stickers: [{
    type: String,            // enum: poll, question, quiz, mention, hashtag, location, link
    data: Mixed,             // flexible schema per sticker type
    position: { x: Number, y: Number },
    scale: Number,
    rotation: Number
  }],
  filter_id: String,
  mentions: [ObjectId],

  // Engagement
  viewers: [{
    user_id: ObjectId,
    viewed_at: Date
  }],
  reactions: [{
    user_id: ObjectId,
    emoji: String,
    created_at: Date
  }],
  views_count: Number,

  // Lifecycle
  visibility: String,        // enum: public, followers, close_friends
  is_highlight: Boolean,
  highlight_group: String,
  expires_at: Date,          // TTL: created_at + 24 hours
  created_at: Date
}
```
**Indexes:**
- `{ user_id: 1, created_at: -1 }` — user's stories
- `{ expires_at: 1 }` — TTL auto-delete (24h)
- `{ is_highlight: 1, user_id: 1 }` — highlights query

---

### 2.3 `reels`
```js
{
  _id: ObjectId,
  user_id: ObjectId,

  // Video
  video_url: String,
  thumbnail_url: String,
  duration: Number,          // seconds, max 90
  width: Number,
  height: Number,

  // Content
  title: String,             // max 100 chars
  description: String,       // max 2200 chars
  hashtags: [String],
  mentions: [ObjectId],

  // Audio
  audio: {
    audio_id: ObjectId,      // ref: audio_tracks
    title: String,
    artist: String,
    is_original: Boolean,
    start_offset: Number,    // seconds
    duration: Number
  },

  // Collaboration (same as posts)
  collaborators: [{
    user_id: ObjectId,
    status: String,
    watchtime_split: Number,
    revenue_split: Number,
    accepted_at: Date
  }],

  // Engagement
  likes_count: Number,
  comments_count: Number,
  shares_count: Number,
  saves_count: Number,
  views_count: Number,
  avg_watch_time: Number,    // seconds

  // Settings
  comments_enabled: Boolean,
  allow_remix: Boolean,
  allow_duet: Boolean,

  // Moderation
  is_flagged: Boolean,
  is_hidden: Boolean,

  // Ads
  is_sponsored: Boolean,
  ad_campaign_id: ObjectId,

  created_at: Date,
  updated_at: Date
}
```
**Indexes:**
- `{ user_id: 1, created_at: -1 }`
- `{ "audio.audio_id": 1 }` — reels using same audio
- `{ hashtags: 1 }`
- `{ views_count: -1, created_at: -1 }` — trending
- `{ "collaborators.user_id": 1 }` — collab reels

---

### 2.4 `comments`
```js
{
  _id: ObjectId,
  content_type: String,      // enum: post, reel
  content_id: ObjectId,      // ref: posts or reels
  user_id: ObjectId,
  parent_comment_id: ObjectId, // null for top-level, ref: comments for replies

  text: String,              // max 1000 chars
  mentions: [ObjectId],

  // Engagement
  likes_count: Number,
  replies_count: Number,

  // Moderation
  is_flagged: Boolean,
  is_hidden: Boolean,

  created_at: Date,
  updated_at: Date
}
```
**Indexes:**
- `{ content_type: 1, content_id: 1, created_at: -1 }` — top-level comments
- `{ parent_comment_id: 1, created_at: 1 }` — replies
- `{ user_id: 1 }` — user's comments

---

### 2.5 `likes`
```js
{
  _id: ObjectId,
  user_id: ObjectId,
  target_type: String,       // enum: post, reel, comment, story
  target_id: ObjectId,
  created_at: Date
}
```
**Indexes:** `{ user_id: 1, target_type: 1, target_id: 1 }` — unique compound (one like per user per target)

---

### 2.6 `saves`
```js
{
  _id: ObjectId,
  user_id: ObjectId,
  target_type: String,       // enum: post, reel
  target_id: ObjectId,
  collection_name: String,   // user-defined folder, default: "All Posts"
  created_at: Date
}
```
**Indexes:**
- `{ user_id: 1, target_type: 1, target_id: 1 }` — unique compound
- `{ user_id: 1, collection_name: 1, created_at: -1 }` — browse by collection

---

### 2.7 `shares`
```js
{
  _id: ObjectId,
  user_id: ObjectId,
  target_type: String,       // enum: post, reel, story
  target_id: ObjectId,
  share_type: String,        // enum: dm, external, copy_link
  recipient_id: ObjectId,    // null for external shares
  platform: String,          // for external: whatsapp, twitter, etc.
  created_at: Date
}
```
**Indexes:** `{ target_type: 1, target_id: 1, created_at: -1 }`

---

### 2.8 `hashtags`
```js
{
  _id: ObjectId,
  name: String,              // unique, lowercase, no # prefix
  posts_count: Number,
  reels_count: Number,
  is_trending: Boolean,
  is_banned: Boolean,
  created_at: Date,
  updated_at: Date
}
```
**Indexes:**
- `{ name: 1 }` — unique
- `{ is_trending: 1, posts_count: -1 }` — trending page

---

## 3. Collaboration System

### 3.1 `collaborations`
```js
{
  _id: ObjectId,
  content_type: String,      // enum: post, reel
  content_id: ObjectId,
  inviter_id: ObjectId,      // who sent the invite
  invitee_id: ObjectId,      // who received the invite

  status: String,            // enum: pending, accepted, rejected, revoked
  watchtime_split: {
    inviter_percent: Number,  // default: 50
    invitee_percent: Number   // default: 50
  },
  revenue_split: {
    inviter_percent: Number,  // default: 50
    invitee_percent: Number   // default: 50
  },
  message: String,           // optional invite message

  responded_at: Date,
  created_at: Date,
  updated_at: Date
}
```
**Indexes:**
- `{ invitee_id: 1, status: 1, created_at: -1 }` — pending invites
- `{ content_id: 1 }` — collabs for a content
- `{ inviter_id: 1, status: 1 }` — sent invites

---

### 3.2 `collaboration_revenue`
```js
{
  _id: ObjectId,
  collaboration_id: ObjectId,
  content_id: ObjectId,
  period: String,            // "YYYY-MM" format
  total_revenue: Number,     // in cents
  currency: String,          // ISO 4217
  splits: [{
    user_id: ObjectId,
    percentage: Number,
    amount: Number,          // in cents
    settled: Boolean,
    settled_at: Date
  }],
  created_at: Date,
  updated_at: Date
}
```
**Indexes:** `{ content_id: 1, period: 1 }` — unique compound

---

### 3.3 `collaboration_watchtime`
```js
{
  _id: ObjectId,
  collaboration_id: ObjectId,
  content_id: ObjectId,
  date: Date,                // day granularity
  total_watch_seconds: Number,
  attributed: [{
    user_id: ObjectId,
    percentage: Number,
    seconds: Number
  }],
  created_at: Date
}
```
**Indexes:** `{ content_id: 1, date: -1 }`

---

## 4. Media & Audio

### 4.1 `media_uploads`
```js
{
  _id: ObjectId,
  user_id: ObjectId,
  file_key: String,          // S3 key
  file_url: String,          // CDN URL
  file_type: String,         // MIME type
  file_size: Number,         // bytes
  dimensions: { width: Number, height: Number },
  duration: Number,          // seconds (video/audio)
  thumbnail_url: String,
  processing_status: String, // enum: pending, processing, completed, failed
  processing_error: String,
  variants: [{               // transcoded versions
    quality: String,         // enum: 360p, 480p, 720p, 1080p
    url: String,
    file_size: Number
  }],
  created_at: Date
}
```
**Indexes:**
- `{ user_id: 1, created_at: -1 }`
- `{ processing_status: 1 }` — job queue

---

### 4.2 `audio_tracks`
```js
{
  _id: ObjectId,
  title: String,
  artist: String,
  album: String,
  genre: String,
  duration: Number,
  audio_url: String,
  cover_art_url: String,
  waveform_data: [Number],
  source: String,            // enum: library, user_upload, remix
  uploaded_by: ObjectId,     // null for library tracks
  usage_count: Number,       // how many reels use this
  is_available: Boolean,
  created_at: Date
}
```
**Indexes:**
- `{ title: "text", artist: "text" }` — search
- `{ usage_count: -1 }` — trending audio
- `{ genre: 1 }`

---

### 4.3 `audio_remixes`
```js
{
  _id: ObjectId,
  original_audio_id: ObjectId,
  remixed_by: ObjectId,
  remix_audio_url: String,
  title: String,
  modifications: String,     // description of changes
  usage_count: Number,
  created_at: Date
}
```
**Indexes:** `{ original_audio_id: 1 }` — remixes of an audio

---

### 4.4 `filters`
```js
{
  _id: ObjectId,
  name: String,
  category: String,          // enum: beauty, mood, artistic, ar
  preview_url: String,
  filter_data: Mixed,        // shader/AR config
  creator_id: ObjectId,      // null for platform filters
  usage_count: Number,
  is_active: Boolean,
  created_at: Date
}
```

---

## 5. Messaging & Social

### 5.1 `conversations`
```js
{
  _id: ObjectId,
  type: String,              // enum: dm, group
  participants: [{
    user_id: ObjectId,
    role: String,            // enum: member, admin (groups only)
    joined_at: Date,
    muted_until: Date,
    font_preference: {
      family: String,
      size: Number,
      color: String
    }
  }],
  group_name: String,        // groups only
  group_avatar_url: String,
  last_message: {
    text: String,
    sender_id: ObjectId,
    sent_at: Date
  },
  is_active: Boolean,
  created_at: Date,
  updated_at: Date
}
```
**Indexes:**
- `{ "participants.user_id": 1, updated_at: -1 }` — user's inbox
- `{ updated_at: -1 }` — recent conversations

---

### 5.2 `messages`
```js
{
  _id: ObjectId,
  conversation_id: ObjectId,
  sender_id: ObjectId,
  type: String,              // enum: text, image, video, audio, post_share, reel_share, story_reply
  content: {
    text: String,
    media_url: String,
    thumbnail_url: String,
    shared_content_id: ObjectId,
    shared_content_type: String
  },
  font: {
    family: String,
    size: Number,
    color: String
  },
  reactions: [{
    user_id: ObjectId,
    emoji: String,
    created_at: Date
  }],
  read_by: [{
    user_id: ObjectId,
    read_at: Date
  }],
  is_deleted: Boolean,
  created_at: Date
}
```
**Indexes:**
- `{ conversation_id: 1, created_at: -1 }` — message history
- `{ sender_id: 1, created_at: -1 }`

---

### 5.3 `notifications`
```js
{
  _id: ObjectId,
  recipient_id: ObjectId,
  sender_id: ObjectId,
  type: String,              // enum: like, comment, follow, follow_request, mention,
                             //       collaboration_invite, collab_accepted, message,
                             //       server_update, ad_report, system
  content: {
    text: String,            // rendered notification text
    target_type: String,     // post, reel, comment, story, collaboration
    target_id: ObjectId
  },
  is_read: Boolean,
  is_pushed: Boolean,        // FCM push sent
  created_at: Date
}
```
**Indexes:**
- `{ recipient_id: 1, is_read: 1, created_at: -1 }` — unread notifications
- `{ created_at: 1 }` — TTL cleanup (90 days)

---

### 5.4 `servers` (Discord-style)
```js
{
  _id: ObjectId,
  name: String,
  description: String,
  icon_url: String,
  banner_url: String,
  owner_id: ObjectId,
  member_count: Number,
  invite_code: String,       // unique, shareable
  is_public: Boolean,
  categories: [String],
  rules: String,
  created_at: Date,
  updated_at: Date
}
```

### 5.5 `server_channels`
```js
{
  _id: ObjectId,
  server_id: ObjectId,
  name: String,
  type: String,              // enum: text, voice, announcement
  topic: String,
  position: Number,
  is_archived: Boolean,
  created_at: Date
}
```

### 5.6 `server_members`
```js
{
  _id: ObjectId,
  server_id: ObjectId,
  user_id: ObjectId,
  role: String,              // enum: owner, admin, moderator, member
  nickname: String,
  joined_at: Date
}
```
**Indexes:** `{ server_id: 1, user_id: 1 }` — unique compound

---

## 6. Monetization & Ads

### 6.1 `ad_campaigns`
```js
{
  _id: ObjectId,
  advertiser_id: ObjectId,   // ref: users (business accounts)
  name: String,
  type: String,              // enum: banner, interstitial, native, sponsored_post, sponsored_reel
  platform: String,          // enum: admob, meta_audience, internal
  target_audience: {
    age_range: { min: Number, max: Number },
    genders: [String],
    locations: [String],     // country/city codes
    interests: [String]
  },
  budget: {
    total: Number,           // cents
    daily_limit: Number,
    bid_type: String,        // enum: cpm, cpc, cpa
    bid_amount: Number
  },
  schedule: {
    start_date: Date,
    end_date: Date
  },
  creative: {
    media_url: String,
    caption: String,
    cta_text: String,        // call to action
    cta_url: String
  },
  status: String,            // enum: draft, pending_review, active, paused, completed, rejected
  rejection_reason: String,
  metrics: {
    impressions: Number,
    clicks: Number,
    spend: Number            // cents
  },
  created_at: Date,
  updated_at: Date
}
```
**Indexes:**
- `{ advertiser_id: 1, status: 1 }`
- `{ status: 1, "schedule.start_date": 1, "schedule.end_date": 1 }`

---

### 6.2 `ad_impressions`
```js
{
  _id: ObjectId,
  campaign_id: ObjectId,
  user_id: ObjectId,
  event_type: String,        // enum: impression, click, conversion
  placement: String,         // enum: feed, stories, reels, explore
  device_type: String,
  ip_address: String,
  created_at: Date
}
```
**Indexes:**
- `{ campaign_id: 1, created_at: -1 }`
- `{ user_id: 1, campaign_id: 1 }` — frequency capping

---

### 6.3 `ad_revenue`
```js
{
  _id: ObjectId,
  creator_id: ObjectId,
  content_type: String,
  content_id: ObjectId,
  period: String,            // "YYYY-MM"
  impressions: Number,
  earnings: Number,          // cents
  currency: String,
  is_paid: Boolean,
  paid_at: Date,
  created_at: Date
}
```

---

### 6.4 `memberships`
```js
{
  _id: ObjectId,
  name: String,              // Silver, Gold, Platinum
  tier_level: Number,        // 1, 2, 3
  price_monthly: Number,     // cents
  price_yearly: Number,
  features: [{
    name: String,
    description: String,
    is_enabled: Boolean
  }],
  badge_url: String,
  is_active: Boolean,
  created_at: Date,
  updated_at: Date
}
```

### 6.5 `membership_transactions`
```js
{
  _id: ObjectId,
  user_id: ObjectId,
  membership_id: ObjectId,
  type: String,              // enum: subscribe, renew, upgrade, downgrade, cancel, refund
  amount: Number,
  currency: String,
  payment_gateway: String,   // enum: stripe, razorpay
  gateway_transaction_id: String,
  status: String,            // enum: pending, completed, failed, refunded
  period_start: Date,
  period_end: Date,
  created_at: Date
}
```
**Indexes:**
- `{ user_id: 1, created_at: -1 }`
- `{ gateway_transaction_id: 1 }` — unique

---

## 7. Analytics

### 7.1 `user_analytics`
```js
{
  _id: ObjectId,
  user_id: ObjectId,
  date: Date,                // day granularity
  profile_visits: Number,
  impressions: Number,       // how many times user's content was shown
  reach: Number,             // unique users who saw content
  engagement: {
    likes_received: Number,
    comments_received: Number,
    shares_received: Number,
    saves_received: Number
  },
  followers_gained: Number,
  followers_lost: Number,
  story_views: Number,
  reel_views: Number,
  created_at: Date
}
```
**Indexes:** `{ user_id: 1, date: -1 }` — unique compound

---

### 7.2 `content_analytics`
```js
{
  _id: ObjectId,
  content_type: String,
  content_id: ObjectId,
  date: Date,
  views: Number,
  unique_views: Number,
  avg_watch_time: Number,    // seconds
  completion_rate: Number,   // percentage who watched to end
  engagement: {
    likes: Number,
    comments: Number,
    shares: Number,
    saves: Number
  },
  traffic_sources: {
    feed: Number,
    explore: Number,
    profile: Number,
    hashtag: Number,
    external: Number
  },
  audience: {
    age_groups: Mixed,       // { "18-24": 30, "25-34": 45, ... }
    genders: Mixed,
    top_locations: [{ location: String, count: Number }]
  },
  created_at: Date
}
```
**Indexes:** `{ content_type: 1, content_id: 1, date: -1 }`

---

### 7.3 `platform_analytics`
```js
{
  _id: ObjectId,
  date: Date,                // unique per day
  users: {
    dau: Number,
    mau: Number,
    new_signups: Number,
    active_creators: Number
  },
  content: {
    posts_created: Number,
    reels_created: Number,
    stories_created: Number,
    comments_created: Number
  },
  engagement: {
    total_likes: Number,
    total_comments: Number,
    total_shares: Number,
    avg_session_duration: Number
  },
  revenue: {
    ad_revenue: Number,
    membership_revenue: Number,
    total: Number
  },
  moderation: {
    reports_received: Number,
    content_removed: Number,
    users_banned: Number
  },
  created_at: Date
}
```
**Indexes:** `{ date: -1 }` — unique

---

### 7.4 `watch_sessions`
```js
{
  _id: ObjectId,
  user_id: ObjectId,
  content_type: String,
  content_id: ObjectId,
  watch_duration: Number,    // seconds
  total_duration: Number,    // content total length
  completed: Boolean,
  source: String,            // enum: feed, explore, profile, share_link
  device_type: String,
  created_at: Date
}
```
**Indexes:**
- `{ content_id: 1, created_at: -1 }` — content watch analytics
- `{ user_id: 1, created_at: -1 }` — user watch history

---

## 8. Moderation & Admin

### 8.1 `reports`
```js
{
  _id: ObjectId,
  reporter_id: ObjectId,
  target_type: String,       // enum: user, post, reel, story, comment, message, server
  target_id: ObjectId,
  reason: String,            // enum: spam, harassment, nudity, violence, misinformation,
                             //       copyright, hate_speech, self_harm, other
  description: String,
  status: String,            // enum: pending, reviewing, resolved, dismissed
  reviewed_by: ObjectId,     // ref: admin_users
  resolution: String,
  created_at: Date,
  resolved_at: Date
}
```
**Indexes:**
- `{ status: 1, created_at: 1 }` — moderation queue
- `{ target_type: 1, target_id: 1 }` — reports per content

---

### 8.2 `moderation_actions`
```js
{
  _id: ObjectId,
  admin_id: ObjectId,
  action: String,            // enum: warn, mute, ban, unban, remove_content,
                             //       restore_content, verify_user, unverify_user
  target_type: String,
  target_id: ObjectId,
  reason: String,
  report_id: ObjectId,       // linked report if applicable
  metadata: Mixed,           // action-specific data
  created_at: Date
}
```

### 8.3 `audit_logs`
```js
{
  _id: ObjectId,
  actor_id: ObjectId,
  actor_type: String,        // enum: user, admin, system
  action: String,
  resource_type: String,
  resource_id: ObjectId,
  changes: Mixed,            // { field: { old: X, new: Y } }
  ip_address: String,
  created_at: Date
}
```
**Indexes:** `{ actor_id: 1, created_at: -1 }`

---

### 8.4 `admin_users`
```js
{
  _id: ObjectId,
  email: String,             // unique
  password_hash: String,
  display_name: String,
  role: String,              // enum: super_admin, admin, moderator, analyst, ad_manager
  permissions: [String],     // granular: users.ban, content.remove, analytics.view, etc.
  is_active: Boolean,
  last_login_at: Date,
  created_at: Date,
  updated_at: Date
}
```

### 8.5 `admin_configs`
```js
{
  _id: ObjectId,
  key: String,               // unique, e.g. "max_story_duration", "membership_tiers"
  value: Mixed,
  description: String,
  updated_by: ObjectId,
  updated_at: Date
}
```

---

## Entity Relationship Summary

```
users ─┬─< posts (1:N)
       ├─< reels (1:N)
       ├─< stories (1:N)
       ├─< followers (M:N via junction)
       ├─< blocked_users (M:N via junction)
       ├── user_settings (1:1)
       ├─< user_sessions (1:N)
       ├─< saves (1:N)
       ├─< likes (1:N)
       ├─< shares (1:N)
       ├─< comments (1:N)
       ├─< notifications (1:N)
       ├─< conversations (M:N via participants)
       ├─< memberships (1:N via transactions)
       └─< user_analytics (1:N per day)

posts/reels ─┬─< comments (1:N)
             ├─< likes (1:N)
             ├─< saves (1:N)
             ├─< shares (1:N)
             ├─< collaborations (1:N)
             └─< content_analytics (1:N per day)

collaborations ─┬── collaboration_revenue (1:N per period)
                └── collaboration_watchtime (1:N per day)

conversations ─< messages (1:N)

servers ─┬─< server_channels (1:N)
         └─< server_members (1:N)

ad_campaigns ─< ad_impressions (1:N)
```
