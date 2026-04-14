# INSTAYT — API Design (RESTful + WebSocket)

> **Base URL**: `https://api.instayt.com/api/v1`
> **Auth**: Bearer JWT (access token: 15min, refresh token: 30d)
> **Format**: JSON request/response
> **Pagination**: Cursor-based (`?cursor=<id>&limit=20`)
> **Rate Limiting**: Tiered by endpoint sensitivity

---

## Global Standards

### Response Envelope
```json
{
  "success": true,
  "data": { },
  "meta": {
    "cursor": "next_cursor_id",
    "has_more": true,
    "total": 100
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Username must be 3-30 characters",
    "details": [{ "field": "username", "issue": "too_short" }]
  }
}
```

### Error Codes
| Code | HTTP | Description |
|------|------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 422 | Input validation failed |
| `RATE_LIMITED` | 429 | Too many requests |
| `CONFLICT` | 409 | Duplicate resource |
| `SERVER_ERROR` | 500 | Internal server error |

### Rate Limiting Tiers
| Tier | Limit | Endpoints |
|------|-------|-----------|
| Standard | 100 req/min | GET reads |
| Sensitive | 30 req/min | POST creates |
| Auth | 10 req/min | Login, register |
| Upload | 5 req/min | Media uploads |

### Auth Header
```
Authorization: Bearer <access_token>
```

---

## 1. Authentication — `/auth`

| Method | Endpoint | Description | Auth | Rate |
|--------|----------|-------------|------|------|
| POST | `/auth/register` | Create new account | ✗ | Auth |
| POST | `/auth/login` | Email/password login | ✗ | Auth |
| POST | `/auth/logout` | Invalidate session | ✓ | Standard |
| POST | `/auth/refresh-token` | Rotate tokens | ✗ | Auth |
| POST | `/auth/forgot-password` | Send reset email | ✗ | Auth |
| POST | `/auth/reset-password` | Set new password | ✗ | Auth |
| POST | `/auth/verify-email` | Verify email OTP | ✗ | Auth |
| POST | `/auth/oauth/google` | Google OAuth | ✗ | Auth |
| POST | `/auth/oauth/apple` | Apple OAuth | ✗ | Auth |
| POST | `/auth/2fa/enable` | Enable 2FA | ✓ | Sensitive |
| POST | `/auth/2fa/verify` | Verify 2FA code | ✗ | Auth |

### POST `/auth/register`
```json
// Request
{
  "email": "user@example.com",
  "username": "johndoe",
  "display_name": "John Doe",
  "password": "SecureP@ss123",
  "date_of_birth": "1998-05-15"
}

// Response 201
{
  "success": true,
  "data": {
    "user": { "id": "...", "username": "johndoe", "email": "user@example.com" },
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "expires_in": 900
  }
}
```

### POST `/auth/login`
```json
// Request
{ "email": "user@example.com", "password": "SecureP@ss123" }

// Response 200
{
  "success": true,
  "data": {
    "user": { "id": "...", "username": "johndoe" },
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "expires_in": 900
  }
}
```

---

## 2. Users — `/users`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/users/me` | Get current user profile | ✓ |
| PUT | `/users/me` | Update profile | ✓ |
| PUT | `/users/me/avatar` | Upload avatar | ✓ |
| GET | `/users/me/settings` | Get settings | ✓ |
| PUT | `/users/me/settings` | Update settings | ✓ |
| GET | `/users/:userId` | Get user profile | ✓ |
| GET | `/users/:userId/posts` | Get user's posts | ✓ |
| GET | `/users/:userId/reels` | Get user's reels | ✓ |
| GET | `/users/:userId/stories` | Get user's active stories | ✓ |
| POST | `/users/:userId/follow` | Follow user | ✓ |
| DELETE | `/users/:userId/follow` | Unfollow user | ✓ |
| GET | `/users/:userId/followers` | List followers | ✓ |
| GET | `/users/:userId/following` | List following | ✓ |
| POST | `/users/:userId/block` | Block user | ✓ |
| DELETE | `/users/:userId/block` | Unblock user | ✓ |
| GET | `/users/search` | Search users | ✓ |
| GET | `/users/suggestions` | Suggested profiles | ✓ |

### GET `/users/:userId`
```json
// Response 200
{
  "success": true,
  "data": {
    "id": "abc123",
    "username": "johndoe",
    "display_name": "John Doe",
    "bio": "Photographer & Creator",
    "avatar_url": "https://cdn.instayt.com/avatars/abc123.jpg",
    "is_verified": true,
    "is_private": false,
    "account_type": "creator",
    "membership_tier": "gold",
    "followers_count": 15420,
    "following_count": 342,
    "posts_count": 89,
    "reels_count": 45,
    "is_following": true,
    "is_followed_by": false,
    "is_blocked": false
  }
}
```

### PUT `/users/me`
```json
// Request
{
  "display_name": "John D.",
  "bio": "Updated bio",
  "website": "https://johndoe.com",
  "location": "San Francisco, CA",
  "interests": ["photography", "travel", "tech"]
}

// Response 200 — updated user object
```

---

## 3. Posts — `/posts`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/posts` | Create post | ✓ |
| GET | `/posts/feed` | Get home feed | ✓ |
| GET | `/posts/explore` | Explore/discover | ✓ |
| GET | `/posts/:postId` | Get single post | ✓ |
| PUT | `/posts/:postId` | Edit post | ✓ |
| DELETE | `/posts/:postId` | Delete post | ✓ |
| POST | `/posts/:postId/like` | Like post | ✓ |
| DELETE | `/posts/:postId/like` | Unlike post | ✓ |
| GET | `/posts/:postId/likes` | List who liked | ✓ |
| GET | `/posts/:postId/comments` | List comments | ✓ |
| POST | `/posts/:postId/comments` | Add comment | ✓ |
| POST | `/posts/:postId/save` | Save post | ✓ |
| DELETE | `/posts/:postId/save` | Unsave post | ✓ |
| POST | `/posts/:postId/share` | Share post | ✓ |
| POST | `/posts/:postId/report` | Report post | ✓ |
| PUT | `/posts/:postId/pin` | Pin to profile | ✓ |

### POST `/posts`
```json
// Request (multipart/form-data)
{
  "caption": "Beautiful sunset at the beach! #sunset #photography",
  "media": [File, File],      // up to 10 images/videos
  "location": { "name": "Venice Beach", "lat": 33.985, "lng": -118.473 },
  "visibility": "public",
  "collaborators": [
    {
      "user_id": "user456",
      "watchtime_split": 50,
      "revenue_split": 50
    }
  ]
}

// Response 201
{
  "success": true,
  "data": {
    "id": "post789",
    "user_id": "abc123",
    "caption": "Beautiful sunset at the beach! #sunset #photography",
    "media": [
      { "url": "...", "thumbnail_url": "...", "type": "image", "width": 1080, "height": 1350 }
    ],
    "hashtags": ["sunset", "photography"],
    "collaborators": [{ "user_id": "user456", "status": "pending" }],
    "likes_count": 0,
    "comments_count": 0,
    "created_at": "2026-04-05T12:00:00Z"
  }
}
```

---

## 4. Stories — `/stories`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/stories` | Create story | ✓ |
| GET | `/stories/feed` | Stories from followed users | ✓ |
| GET | `/stories/:storyId` | Get single story | ✓ |
| DELETE | `/stories/:storyId` | Delete story | ✓ |
| POST | `/stories/:storyId/view` | Mark as viewed | ✓ |
| POST | `/stories/:storyId/react` | React to story | ✓ |
| GET | `/stories/:storyId/viewers` | List viewers (owner only) | ✓ |
| POST | `/stories/highlights` | Create highlight group | ✓ |
| PUT | `/stories/highlights/:highlightId` | Update highlight | ✓ |
| GET | `/stories/highlights/:userId` | Get user highlights | ✓ |

### POST `/stories`
```json
// Request (multipart/form-data)
{
  "media": File,
  "caption": "Quick update!",
  "visibility": "close_friends",
  "stickers": [
    { "type": "poll", "data": { "question": "Yes or No?", "options": ["Yes", "No"] },
      "position": { "x": 0.5, "y": 0.7 }, "scale": 1.0, "rotation": 0 }
  ],
  "filter_id": "filter_warm_01"
}
```

---

## 5. Reels — `/reels`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/reels` | Upload reel | ✓ |
| GET | `/reels/feed` | Infinite scroll feed | ✓ |
| GET | `/reels/trending` | Trending reels | ✓ |
| GET | `/reels/for-you` | Personalized feed | ✓ |
| GET | `/reels/:reelId` | Get single reel | ✓ |
| PUT | `/reels/:reelId` | Edit reel | ✓ |
| DELETE | `/reels/:reelId` | Delete reel | ✓ |
| POST | `/reels/:reelId/like` | Like reel | ✓ |
| DELETE | `/reels/:reelId/like` | Unlike reel | ✓ |
| GET | `/reels/:reelId/comments` | List comments | ✓ |
| POST | `/reels/:reelId/comments` | Add comment | ✓ |
| POST | `/reels/:reelId/share` | Share reel | ✓ |
| POST | `/reels/:reelId/save` | Save reel | ✓ |
| POST | `/reels/:reelId/report` | Report reel | ✓ |

### POST `/reels`
```json
// Request (multipart/form-data)
{
  "video": File,
  "title": "Quick tutorial",
  "description": "How to edit photos like a pro #tutorial",
  "audio_id": "audio123",
  "audio_start_offset": 5,
  "allow_remix": true,
  "allow_duet": true,
  "collaborators": [
    { "user_id": "user789", "watchtime_split": 60, "revenue_split": 40 }
  ]
}

// Response 201
{
  "success": true,
  "data": {
    "id": "reel456",
    "video_url": "...",
    "thumbnail_url": "...",
    "processing_status": "processing",
    "audio": { "audio_id": "audio123", "title": "Trending Beat", "artist": "DJ Cool" },
    "collaborators": [{ "user_id": "user789", "status": "pending" }],
    "created_at": "2026-04-05T12:00:00Z"
  }
}
```

---

## 6. Collaborations — `/collaborations`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/collaborations/invite` | Send collab invite | ✓ |
| GET | `/collaborations/pending` | My pending invites | ✓ |
| GET | `/collaborations/active` | My active collabs | ✓ |
| GET | `/collaborations/sent` | My sent invites | ✓ |
| PUT | `/collaborations/:collabId/accept` | Accept invite | ✓ |
| PUT | `/collaborations/:collabId/reject` | Reject invite | ✓ |
| PUT | `/collaborations/:collabId/revoke` | Revoke invite | ✓ |
| PUT | `/collaborations/:collabId/splits` | Update revenue/watchtime split | ✓ |
| GET | `/collaborations/:collabId/analytics` | Joint analytics | ✓ |
| GET | `/collaborations/:collabId/revenue` | Revenue breakdown | ✓ |

### POST `/collaborations/invite`
```json
// Request
{
  "content_type": "reel",
  "content_id": "reel456",
  "invitee_id": "user789",
  "watchtime_split": { "inviter_percent": 60, "invitee_percent": 40 },
  "revenue_split": { "inviter_percent": 50, "invitee_percent": 50 },
  "message": "Hey! Want to collab on this reel?"
}

// Response 201
{
  "success": true,
  "data": {
    "id": "collab001",
    "status": "pending",
    "content_type": "reel",
    "content_id": "reel456",
    "inviter": { "id": "abc123", "username": "johndoe" },
    "invitee": { "id": "user789", "username": "janedoe" },
    "watchtime_split": { "inviter_percent": 60, "invitee_percent": 40 },
    "revenue_split": { "inviter_percent": 50, "invitee_percent": 50 },
    "created_at": "2026-04-05T12:00:00Z"
  }
}
```

### GET `/collaborations/:collabId/revenue`
```json
// Response 200
{
  "success": true,
  "data": {
    "collaboration_id": "collab001",
    "content_id": "reel456",
    "total_revenue": 15000,
    "currency": "USD",
    "periods": [
      {
        "period": "2026-03",
        "total": 8500,
        "splits": [
          { "user_id": "abc123", "username": "johndoe", "percentage": 50, "amount": 4250, "settled": true },
          { "user_id": "user789", "username": "janedoe", "percentage": 50, "amount": 4250, "settled": true }
        ]
      }
    ]
  }
}
```

---

## 7. Comments — `/comments`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| PUT | `/comments/:commentId` | Edit comment | ✓ |
| DELETE | `/comments/:commentId` | Delete comment | ✓ |
| POST | `/comments/:commentId/reply` | Reply to comment | ✓ |
| GET | `/comments/:commentId/replies` | List replies | ✓ |
| POST | `/comments/:commentId/like` | Like comment | ✓ |
| DELETE | `/comments/:commentId/like` | Unlike comment | ✓ |
| POST | `/comments/:commentId/report` | Report comment | ✓ |

### POST `/comments/:commentId/reply`
```json
// Request
{ "text": "@johndoe exactly! Great point 🔥" }

// Response 201
{
  "success": true,
  "data": {
    "id": "comment789",
    "parent_comment_id": "comment123",
    "user": { "id": "user456", "username": "janedoe", "avatar_url": "..." },
    "text": "@johndoe exactly! Great point 🔥",
    "mentions": ["abc123"],
    "likes_count": 0,
    "created_at": "2026-04-05T12:05:00Z"
  }
}
```

---

## 8. Chat — `/chat`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/chat/conversations` | List conversations | ✓ |
| POST | `/chat/conversations` | Create conversation | ✓ |
| GET | `/chat/conversations/:convId` | Get conversation details | ✓ |
| GET | `/chat/conversations/:convId/messages` | List messages | ✓ |
| POST | `/chat/conversations/:convId/messages` | Send message | ✓ |
| DELETE | `/chat/conversations/:convId/messages/:msgId` | Delete message | ✓ |
| PUT | `/chat/conversations/:convId/font` | Update font preference | ✓ |
| POST | `/chat/conversations/:convId/read` | Mark as read | ✓ |

### POST `/chat/conversations`
```json
// Request
{
  "type": "dm",
  "participant_ids": ["user456"],
  "initial_message": { "type": "text", "text": "Hey! Loved your latest reel" }
}
```

### POST `/chat/conversations/:convId/messages`
```json
// Request
{
  "type": "post_share",
  "content": {
    "text": "Check this out!",
    "shared_content_id": "post789",
    "shared_content_type": "post"
  },
  "font": { "family": "Comic Sans MS", "size": 16, "color": "#FF5733" }
}
```

### WebSocket Events — `wss://api.instayt.com/ws`
```
// Client → Server
{ "event": "join_conversation", "data": { "conversation_id": "conv123" } }
{ "event": "typing_start", "data": { "conversation_id": "conv123" } }
{ "event": "typing_stop", "data": { "conversation_id": "conv123" } }

// Server → Client
{ "event": "new_message", "data": { "conversation_id": "conv123", "message": {...} } }
{ "event": "message_read", "data": { "conversation_id": "conv123", "user_id": "...", "read_at": "..." } }
{ "event": "user_typing", "data": { "conversation_id": "conv123", "user_id": "..." } }
{ "event": "user_online", "data": { "user_id": "..." } }
{ "event": "user_offline", "data": { "user_id": "..." } }
```

---

## 9. Audio — `/audio`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/audio/library` | Browse music library | ✓ |
| GET | `/audio/search` | Search audio tracks | ✓ |
| GET | `/audio/trending` | Trending audio | ✓ |
| GET | `/audio/:audioId` | Get audio details | ✓ |
| GET | `/audio/:audioId/reels` | Reels using this audio | ✓ |
| POST | `/audio/upload` | Upload custom audio | ✓ |
| POST | `/audio/:audioId/remix` | Create remix | ✓ |

---

## 10. Servers (Discord-style) — `/servers`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/servers` | Create server | ✓ |
| GET | `/servers/mine` | My servers | ✓ |
| GET | `/servers/discover` | Discover public servers | ✓ |
| GET | `/servers/:serverId` | Get server details | ✓ |
| PUT | `/servers/:serverId` | Update server | ✓ |
| DELETE | `/servers/:serverId` | Delete server | ✓ |
| POST | `/servers/:serverId/join` | Join server | ✓ |
| POST | `/servers/:serverId/leave` | Leave server | ✓ |
| GET | `/servers/:serverId/members` | List members | ✓ |
| PUT | `/servers/:serverId/members/:userId/role` | Update member role | ✓ |
| POST | `/servers/:serverId/channels` | Create channel | ✓ |
| GET | `/servers/:serverId/channels` | List channels | ✓ |
| GET | `/servers/:serverId/channels/:channelId/messages` | Channel messages | ✓ |
| POST | `/servers/:serverId/channels/:channelId/messages` | Send channel message | ✓ |
| POST | `/servers/join/:inviteCode` | Join via invite code | ✓ |

---

## 11. Notifications — `/notifications`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/notifications` | List notifications | ✓ |
| GET | `/notifications/unread-count` | Unread count | ✓ |
| PUT | `/notifications/:notifId/read` | Mark as read | ✓ |
| PUT | `/notifications/read-all` | Mark all as read | ✓ |
| DELETE | `/notifications/:notifId` | Delete notification | ✓ |

### WebSocket Events
```
// Server → Client
{ "event": "notification", "data": { "id": "...", "type": "like", "text": "johndoe liked your post", ... } }
```

---

## 12. Ads & Monetization — `/ads`

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| POST | `/ads/campaigns` | Create ad campaign | ✓ | Business |
| GET | `/ads/campaigns` | List my campaigns | ✓ | Business |
| GET | `/ads/campaigns/:campaignId` | Campaign details | ✓ | Business |
| PUT | `/ads/campaigns/:campaignId` | Update campaign | ✓ | Business |
| PUT | `/ads/campaigns/:campaignId/pause` | Pause campaign | ✓ | Business |
| PUT | `/ads/campaigns/:campaignId/resume` | Resume campaign | ✓ | Business |
| DELETE | `/ads/campaigns/:campaignId` | Delete campaign | ✓ | Business |
| GET | `/ads/campaigns/:campaignId/metrics` | Campaign metrics | ✓ | Business |
| POST | `/ads/impressions` | Track impression (internal) | ✓ | System |
| GET | `/ads/my-earnings` | Creator ad earnings | ✓ | Creator |
| GET | `/ads/my-earnings/history` | Earnings history | ✓ | Creator |
| POST | `/ads/my-earnings/withdraw` | Request payout | ✓ | Creator |

---

## 13. Memberships — `/memberships`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/memberships/tiers` | List available tiers | ✓ |
| GET | `/memberships/my-subscription` | Current subscription | ✓ |
| POST | `/memberships/subscribe` | Subscribe to tier | ✓ |
| PUT | `/memberships/upgrade` | Upgrade tier | ✓ |
| PUT | `/memberships/downgrade` | Downgrade tier | ✓ |
| POST | `/memberships/cancel` | Cancel subscription | ✓ |
| GET | `/memberships/transactions` | Payment history | ✓ |

### POST `/memberships/subscribe`
```json
// Request
{
  "tier_id": "tier_gold",
  "billing_period": "yearly",
  "payment_method": "stripe",
  "payment_token": "tok_xxx"
}

// Response 201
{
  "success": true,
  "data": {
    "subscription_id": "sub_001",
    "tier": "gold",
    "status": "active",
    "period_start": "2026-04-05",
    "period_end": "2027-04-05",
    "amount": 9999,
    "currency": "USD"
  }
}
```

---

## 14. Analytics — `/analytics`

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/analytics/me/overview` | Dashboard overview | ✓ | Creator |
| GET | `/analytics/me/engagement` | Engagement metrics | ✓ | Creator |
| GET | `/analytics/me/reach` | Reach & impressions | ✓ | Creator |
| GET | `/analytics/me/audience` | Audience demographics | ✓ | Creator |
| GET | `/analytics/me/growth` | Follower growth | ✓ | Creator |
| GET | `/analytics/me/top-content` | Best performing content | ✓ | Creator |
| GET | `/analytics/content/:contentId` | Content performance | ✓ | Creator |
| GET | `/analytics/content/:contentId/retention` | Watch retention curve | ✓ | Creator |

### GET `/analytics/me/overview?period=30d`
```json
{
  "success": true,
  "data": {
    "period": "30d",
    "summary": {
      "total_reach": 125000,
      "total_impressions": 340000,
      "total_engagement": 18500,
      "engagement_rate": 5.4,
      "followers_gained": 1200,
      "followers_lost": 150,
      "net_follower_change": 1050,
      "profile_visits": 8900,
      "ad_earnings": 4500
    },
    "daily": [
      { "date": "2026-04-04", "reach": 4200, "impressions": 11000, "engagement": 620 }
    ],
    "top_content": [
      { "id": "reel456", "type": "reel", "views": 45000, "engagement_rate": 8.2 }
    ]
  }
}
```

---

## 15. Media — `/media`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/media/upload` | Direct upload | ✓ |
| POST | `/media/upload-url` | Get presigned S3 URL | ✓ |
| GET | `/media/:mediaId/status` | Processing status | ✓ |

### POST `/media/upload-url`
```json
// Request
{ "file_name": "video.mp4", "file_type": "video/mp4", "file_size": 52428800 }

// Response 200
{
  "success": true,
  "data": {
    "upload_url": "https://s3.amazonaws.com/instayt-media/...",
    "media_id": "media_001",
    "expires_in": 3600
  }
}
```

---

## 16. Snap (Camera) — `/snap`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/snap/filters` | List available filters | ✓ |
| GET | `/snap/filters/:filterId` | Get filter config | ✓ |
| POST | `/snap/capture` | Upload snap capture | ✓ |

---

## 17. Saved Collections — `/saved`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/saved` | List all saved items | ✓ |
| GET | `/saved/collections` | List collections | ✓ |
| POST | `/saved/collections` | Create collection | ✓ |
| PUT | `/saved/collections/:collectionId` | Rename collection | ✓ |
| DELETE | `/saved/collections/:collectionId` | Delete collection | ✓ |
| PUT | `/saved/:saveId/move` | Move to collection | ✓ |

---

## 18. Admin Panel — `/admin`

> All admin endpoints require `Authorization: Bearer <admin_token>` and role-based permissions.

### Dashboard
| Method | Endpoint | Description | Min Role |
|--------|----------|-------------|----------|
| GET | `/admin/dashboard` | Platform overview metrics | analyst |
| GET | `/admin/dashboard/real-time` | Live stats (DAU, active) | analyst |

### User Management
| Method | Endpoint | Description | Min Role |
|--------|----------|-------------|----------|
| GET | `/admin/users` | List/search users | moderator |
| GET | `/admin/users/:userId` | User detail | moderator |
| PUT | `/admin/users/:userId/verify` | Verify user (blue badge) | admin |
| PUT | `/admin/users/:userId/ban` | Ban user | admin |
| PUT | `/admin/users/:userId/unban` | Unban user | admin |
| PUT | `/admin/users/:userId/warn` | Send warning | moderator |
| DELETE | `/admin/users/:userId` | Delete user account | super_admin |

### Content Moderation
| Method | Endpoint | Description | Min Role |
|--------|----------|-------------|----------|
| GET | `/admin/reports` | Moderation queue | moderator |
| GET | `/admin/reports/:reportId` | Report details | moderator |
| PUT | `/admin/reports/:reportId/resolve` | Resolve report | moderator |
| PUT | `/admin/reports/:reportId/dismiss` | Dismiss report | moderator |
| POST | `/admin/content/:contentId/remove` | Remove content | moderator |
| POST | `/admin/content/:contentId/restore` | Restore content | admin |

### Analytics & Revenue
| Method | Endpoint | Description | Min Role |
|--------|----------|-------------|----------|
| GET | `/admin/analytics/platform` | Platform metrics (DAU/MAU/retention) | analyst |
| GET | `/admin/analytics/content` | Content creation stats | analyst |
| GET | `/admin/analytics/engagement` | Engagement trends | analyst |
| GET | `/admin/analytics/revenue` | Revenue breakdown | admin |
| GET | `/admin/analytics/growth` | User growth trends | analyst |

### Ad Campaign Management
| Method | Endpoint | Description | Min Role |
|--------|----------|-------------|----------|
| GET | `/admin/ads/campaigns` | All campaigns | ad_manager |
| PUT | `/admin/ads/campaigns/:campaignId/approve` | Approve campaign | ad_manager |
| PUT | `/admin/ads/campaigns/:campaignId/reject` | Reject campaign | ad_manager |
| GET | `/admin/ads/revenue-report` | Ad revenue report | admin |

### Membership Management
| Method | Endpoint | Description | Min Role |
|--------|----------|-------------|----------|
| GET | `/admin/memberships/stats` | Subscription stats | analyst |
| GET | `/admin/memberships/transactions` | All transactions | admin |
| POST | `/admin/memberships/tiers` | Create tier | super_admin |
| PUT | `/admin/memberships/tiers/:tierId` | Update tier | super_admin |

### Server Management
| Method | Endpoint | Description | Min Role |
|--------|----------|-------------|----------|
| GET | `/admin/servers` | List all servers | moderator |
| PUT | `/admin/servers/:serverId/suspend` | Suspend server | admin |
| DELETE | `/admin/servers/:serverId` | Delete server | super_admin |

### System Configuration
| Method | Endpoint | Description | Min Role |
|--------|----------|-------------|----------|
| GET | `/admin/configs` | List all configs | admin |
| PUT | `/admin/configs/:key` | Update config value | super_admin |
| GET | `/admin/audit-logs` | System audit trail | super_admin |

### GET `/admin/dashboard`
```json
{
  "success": true,
  "data": {
    "users": { "total": 2500000, "dau": 450000, "mau": 1800000, "new_today": 3200 },
    "content": { "total_posts": 15000000, "total_reels": 8000000, "created_today": 45000 },
    "engagement": {
      "likes_today": 2800000,
      "comments_today": 320000,
      "shares_today": 95000,
      "avg_session_minutes": 28
    },
    "revenue": {
      "ad_revenue_today": 125000,
      "membership_revenue_today": 45000,
      "total_mtd": 4500000
    },
    "moderation": {
      "pending_reports": 342,
      "resolved_today": 128,
      "users_banned_today": 12
    }
  }
}
```

---

## Admin Panel Roles & Permissions Matrix

| Permission | super_admin | admin | moderator | analyst | ad_manager |
|-----------|:-----------:|:-----:|:---------:|:-------:|:----------:|
| View dashboard | ✓ | ✓ | ✓ | ✓ | ✓ |
| View analytics | ✓ | ✓ | ✓ | ✓ | ✗ |
| View users | ✓ | ✓ | ✓ | ✗ | ✗ |
| Ban/unban users | ✓ | ✓ | ✗ | ✗ | ✗ |
| Delete users | ✓ | ✗ | ✗ | ✗ | ✗ |
| Verify users | ✓ | ✓ | ✗ | ✗ | ✗ |
| Moderate content | ✓ | ✓ | ✓ | ✗ | ✗ |
| Manage ads | ✓ | ✓ | ✗ | ✗ | ✓ |
| View revenue | ✓ | ✓ | ✗ | ✗ | ✗ |
| Manage configs | ✓ | ✗ | ✗ | ✗ | ✗ |
| View audit logs | ✓ | ✗ | ✗ | ✗ | ✗ |
| Manage memberships | ✓ | ✗ | ✗ | ✗ | ✗ |
