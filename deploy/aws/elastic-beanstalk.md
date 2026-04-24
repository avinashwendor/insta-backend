# Deploy with Elastic Beanstalk (upload code — no Docker)

This is the **“upload project and run”** path on AWS: Elastic Beanstalk unpacks your zip, runs `npm install`, then starts **`npm start`** (see root **`Procfile`**). No ECR, no ECS task definitions.

You still need **MongoDB** (e.g. **MongoDB Atlas**) reachable from the internet or from your VPC.

---

## 1. Prepare a zip (from your laptop)

From the **`backend/`** folder (must include `package.json`, `package-lock.json`, `src/`, `Procfile`):

```bash
cd backend
zip -r ../instayt-backend-eb.zip . \
  -x "node_modules/*" \
  -x ".git/*" \
  -x ".env" \
  -x "*.md"
```

Do **not** upload `node_modules` or `.env`. AWS will run `npm install` and you set secrets in the console.

---

## 2. Create the environment (AWS console)

1. Open **AWS Console → Elastic Beanstalk → Create application**.
2. **Application name:** e.g. `instayt-api`.
3. **Environment name:** e.g. `instayt-api-prod`.
4. **Platform:** **Node.js** → pick **Node.js 20** on **Amazon Linux 2023** (or latest Node 20 offered).
5. **Application code:** choose **“Upload your code”** → upload **`instayt-backend-eb.zip`**.
6. **Presets:** **High availability** if you want a load balancer + HTTPS; **Single instance** is cheapest for testing (no ALB, you get a public URL on HTTP only).

Click **Create environment** and wait until health is **Ok** (first deploy can take several minutes).

---

## 3. Set environment variables

In the environment: **Configuration → Software → Environment properties** → **Edit**, add the same keys as **`backend/.env.example`** (at minimum):

| Property | Notes |
|----------|--------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Your Atlas / DocumentDB connection string |
| `JWT_ACCESS_SECRET` | Long random string |
| `JWT_REFRESH_SECRET` | Different long random string |
| `JWT_ACCESS_EXPIRES_IN` | e.g. `15m` or `30d` |
| `JWT_REFRESH_EXPIRES_IN` | e.g. `30d` |
| `CORS_ORIGIN` | Your app origin(s), not `*` in production if you use credentials |
| `CLOUDINARY_*` | Optional until you need uploads |

**Port:** Elastic Beanstalk sets **`PORT`** automatically. This app already reads `process.env.PORT` (see `src/config/index.js`), so **do not hard-code 3000** in production on EB — leave **`PORT` unset** in the console so the platform value is used, or set it only if EB docs require it for your platform version.

Apply changes; EB will restart the app.

---

## 4. Health check (if you use a load balancer)

With an **Application Load Balancer**, set the process health check to:

- **Path:** `/api/v1/health`
- **HTTP code:** `200`

**Configuration → Load balancer** → edit the **default process** → health check path.

---

## 5. HTTPS (recommended)

- Request a certificate in **ACM** (same region as the load balancer).
- In EB **Configuration → Load balancer**, add **HTTPS listener** on **443** and attach the ACM certificate.
- Optional: redirect HTTP → HTTPS in the EB console if offered.

---

## 6. Socket.IO

- Use an **Application Load Balancer** (not the legacy Classic load balancer) for WebSocket-friendly behavior.
- If you scale to **multiple instances**, enable **stickiness** on the target group or use a **Redis** Socket.IO adapter. For one instance, no extra setup.

---

## 7. Updates after the first deploy

**Option A — Console:** **Upload and deploy** → upload a new zip.

**Option B — EB CLI** (from `backend/`):

```bash
pip install awsebcli   # or: brew install aws-elasticbeanstalk
eb init                # link to the application you created
eb deploy
```

`.ebignore` reduces what gets uploaded with `eb deploy`.

---

## 8. Seed the database

Run **`npm run seed`** once from your machine with **`MONGODB_URI`** pointing at the **same** production database (or run the seed script in a secure one-off way). Do not commit production URIs to Git.

---

## When to use Docker (ECS) instead

Use **ECS + Dockerfile** if you need identical images everywhere, stricter rollbacks, or heavy container tooling. For “zip and run,” **Elastic Beanstalk** is the direct path.

For the **Docker / ECS** path, see **[README.md](README.md)** in this folder.
