# INSTAYT Backend API

Production-grade Node.js backend for the INSTAYT social media platform.

## Tech Stack

- **Runtime**: Node.js ≥ 20
- **Framework**: Express.js 5
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (access + refresh tokens with rotation)
- **Media**: Cloudinary (25GB free tier)
- **Real-time**: Socket.IO (WebSocket)
- **Validation**: Joi
- **Security**: Helmet, CORS, rate limiting (4 tiers)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your MongoDB URI and optionally Cloudinary credentials

# 3. Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Paste output into JWT_ACCESS_SECRET and JWT_REFRESH_SECRET in .env

# 4. Seed database (creates admin user + membership tiers)
npm run seed

# 5. Start development server
npm run dev
```

## API Endpoints

**Base URL**: `http://localhost:3000/api/v1`

| Module | Routes | Description |
|--------|--------|-------------|
| Health | 1 | `GET /health` |
| Auth | 6 | Registration, login, logout, token refresh, password reset |
| Users | 14 | Profile, settings, avatar, follow/unfollow, block, search |
| Posts | 15 | CRUD, feed, explore, like, comment, save, share, pin |
| Stories | 9 | CRUD, feed, view tracking, reactions, highlights |
| Reels | 13 | CRUD, feed, trending, for-you, engagement |
| Comments | 6 | Edit, delete, threaded replies, like |
| Chat | 8 | Conversations, messages, font prefs, read receipts |
| Notifications | 5 | List, unread count, mark read, delete |
| Servers | 15 | Discord-style servers with channels, roles, messaging |
| Collaborations | 4 | Revenue/watchtime split invitations |
| Ads | 7 | Campaign management, impressions, earnings |
| Memberships | 4 | Tier listing, subscribe, transaction history |
| Analytics | 3 | User analytics, content analytics, watch sessions |
| Audio | 5 | Upload, trending, search, genre browse |
| Saved | 3 | Collections, browse, move items |
| Admin | 8 | Moderation, bans, campaign review, audit logs |
| **Total** | **127** | |

## Architecture

```
src/
├── config/         # Environment, database, Cloudinary, constants
├── controllers/    # HTTP request/response mapping (no business logic)
├── middleware/      # Auth, validation, rate limiting, error handling
├── models/          # Mongoose schemas (27 models)
├── repositories/    # Data access via QueryBuilder (no raw queries)
├── routes/          # Express route definitions
├── scripts/         # Database seed, utilities
├── services/        # Business logic layer
├── utils/           # Shared utilities (ApiError, logger, QueryBuilder)
├── validators/      # Joi validation schemas
├── websocket/       # Socket.IO real-time event handlers
├── app.js           # Express app configuration
└── server.js        # Entry point (HTTP + WebSocket)
```

## Scripts

```bash
npm run dev      # Start with hot reload (nodemon)
npm start        # Production start
npm run seed     # Seed database with admin + tiers
npm run lint     # Run ESLint
npm run lint:fix # Auto-fix lint issues
```

## Default Credentials (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@instayt.com | Admin@1234 |

## WebSocket Events

Connect with `socket.io-client`, passing JWT in auth:

```js
const socket = io('http://localhost:3000', {
  auth: { token: 'your_access_token' }
});
```

| Event | Direction | Description |
|-------|-----------|-------------|
| `join_conversation` | Client → Server | Join chat room |
| `leave_conversation` | Client → Server | Leave chat room |
| `typing_start` | Client → Server | Start typing indicator |
| `typing_stop` | Client → Server | Stop typing indicator |
| `user_typing` | Server → Client | User is typing |
| `user_online` | Server → Client | User came online |
| `user_offline` | Server → Client | User went offline |
| `join_channel` | Client → Server | Join server channel |

## Environment Variables

See [.env.example](.env.example) for all required variables.

## Deploying to AWS

- **Upload code (no Docker):** **[deploy/aws/elastic-beanstalk.md](deploy/aws/elastic-beanstalk.md)** — zip the `backend` project, upload to **Elastic Beanstalk**, set env vars, done. Uses root **`Procfile`**.
- **Containers:** **[deploy/aws/README.md](deploy/aws/README.md)** — **Dockerfile**, **ECR**, **ECS Fargate**, **ALB**. Helper: **`deploy/aws/build-and-push.sh`**.

## Deploying like Vercel (Railway, Render, etc.)

**Vercel** is a poor fit for *this* app as-is (serverless, not one long-lived Node + Socket.IO process). **Railway, Render, Fly.io,** and similar **PaaS** web services work with minimal changes. See **[deploy/paas.md](deploy/paas.md)**.

## License

ISC
