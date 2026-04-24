# “Vercel-style” deploy: what works with Express + Socket.IO

This backend is a **long-lived Node process**: one HTTP server with **Socket.IO** attached (`src/server.js`). That matches **platform-as-a-service (PaaS)** or **your own VM**, not classic **serverless** hosting.

## Can I use Vercel?

**Not in the same way as a Next.js app.** Vercel is built around **serverless functions** and short-lived requests. A single deploy that runs `node src/server.js` with WebSockets on the same port is **not** what Vercel is designed for.

You *could* split the system (REST on Vercel serverless + realtime on **Railway / Fly / Ably**), but that is a **refactor**, not a drop-in deploy.

## Platforms where this repo works with minimal change

These behave like “connect Git or upload → set env vars → run” and support **WebSockets** on a normal Node web process:

| Platform | Notes |
|----------|--------|
| **[Railway](https://railway.app)** | Connect repo or Dockerfile; set `PORT` from platform; WebSockets OK. |
| **[Render](https://render.com)** | **Web Service** (not static site); enable WebSockets in docs; free tier may sleep. |
| **[Fly.io](https://fly.io)** | Run a VM-style **Machine**; full TCP/WebSocket; often uses Docker. |
| **[DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform)** | Web service component; WebSockets supported on appropriate plan. |
| **[Heroku](https://www.heroku.com)** | `web` dyno running `npm start`; WebSockets work; paid tiers for always-on. |

**MongoDB:** Use **MongoDB Atlas** (or the provider’s add-on) — same as AWS. Set `MONGODB_URI` in the dashboard.

**Start command:** `npm start` → `node src/server.js` (already in `package.json`).

**Port:** bind to `process.env.PORT` (already supported in `src/config/index.js`).

## Summary

| Style | Good for this backend? |
|--------|-------------------------|
| **Railway / Render / Fly / DO App Platform** | **Yes** — same model as Elastic Beanstalk: one process, env vars, WS works. |
| **Vercel / Netlify (functions-only)** | **No** — not a drop-in; needs architecture change for Socket.IO. |
| **AWS Elastic Beanstalk** | **Yes** — see [deploy/aws/elastic-beanstalk.md](aws/elastic-beanstalk.md). |
| **AWS ECS + Docker** | **Yes** — see [deploy/aws/README.md](aws/README.md). |

For the closest experience to “Vercel simplicity” **with** WebSockets for *this* codebase, use **Railway** or **Render (Web Service)** first, or stay on **Elastic Beanstalk** if you prefer everything inside AWS.
