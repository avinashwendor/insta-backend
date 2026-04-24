# Deploy INSTAYT backend on AWS

Two supported approaches:

| Approach | Best when |
|----------|-----------|
| **[Elastic Beanstalk](elastic-beanstalk.md)** — zip upload or `eb deploy` | You want **direct code upload**: no Docker, no ECR. AWS runs `npm install` + `npm start`. |
| **ECS Fargate + Docker** (below) | You want **containers**, identical images, or larger-scale rollouts. |

---

## Elastic Beanstalk (simplest: upload code)

Step-by-step: **[elastic-beanstalk.md](elastic-beanstalk.md)**  

Quick zip (from `backend/`):

```bash
zip -r ../instayt-backend-eb.zip . \
  -x "node_modules/*" -x ".git/*" -x ".env" -x "*.md"
```

Then **Elastic Beanstalk → Create environment → Upload** that zip. Set env vars in **Configuration → Software**; health check path **`/api/v1/health`** if you use a load balancer.

---

## ECS Fargate + Docker (optional)

This path uses the repo **`Dockerfile`** and **Amazon ECR** + **ECS on Fargate** behind an **Application Load Balancer**. Fits Express + **Socket.IO** on the same port.

### What you need in AWS

| Piece | Role |
|--------|------|
| **MongoDB** | [MongoDB Atlas](https://www.mongodb.com/atlas) on AWS, or **Amazon DocumentDB**. Set `MONGODB_URI`. |
| **Secrets** | **AWS Secrets Manager** (or SSM) for `JWT_*`, `MONGODB_URI`, `CLOUDINARY_*`. Never commit real `.env` values. |
| **ECR** | Store the Docker image. |
| **ECS Fargate** | Run the container; map container port **3000** (or your `PORT`) to the target group. |
| **ALB** | Public HTTPS; health check **`GET /api/v1/health`**. |
| **CloudWatch Logs** | ECS task log driver. |

### 1. Local image check

From `backend/`:

```bash
docker build -t instayt-api:local .
docker run --rm -p 3000:3000 \
  -e MONGODB_URI="mongodb://host.docker.internal:27017/instayt" \
  -e JWT_ACCESS_SECRET="dev_access_secret_at_least_32_characters_long" \
  -e JWT_REFRESH_SECRET="dev_refresh_secret_at_least_32_characters_long" \
  instayt-api:local
```

Visit `http://localhost:3000/api/v1/health`.

### 2. Push image to ECR

```bash
export AWS_REGION=us-east-1
export ECR_REPOSITORY=instayt-api
export IMAGE_TAG=v1
chmod +x deploy/aws/build-and-push.sh
./deploy/aws/build-and-push.sh
```

### 3. Environment variables (production)

Mirror **`backend/.env.example`**. Required at minimum: `NODE_ENV`, `PORT` (match container/target), `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN`, and Cloudinary keys if you use uploads.

### 4. Load balancer and WebSockets

- Health check path: **`/api/v1/health`**
- Raise ALB **idle timeout** if Socket.IO drops (e.g. 300s).
- **Multiple tasks:** sticky sessions or Redis adapter for Socket.IO; **one task** is simplest to start.

### 5. TLS

Terminate TLS on the ALB with **ACM** in the same region.

### 6. Optional

- **CI/CD:** CodePipeline + CodeBuild with `docker build` / ECR push.
- **Seed:** run `npm run seed` locally against prod DB, or a one-off task (Docker image excludes `scripts/` by default — see `elastic-beanstalk.md`).

Use the ECS **Create service** console wizard the first time.
