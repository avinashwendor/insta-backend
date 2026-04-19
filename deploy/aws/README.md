# Deploy INSTAYT backend on AWS

This guide assumes you containerize the API with the repo **`Dockerfile`** and run it on **Amazon ECS on Fargate** behind an **Application Load Balancer**. That pattern fits this stack: Express on HTTP plus **Socket.IO** on the same port.

## What you need in AWS

| Piece | Role |
|--------|------|
| **MongoDB** | [MongoDB Atlas](https://www.mongodb.com/atlas) on AWS, or **Amazon DocumentDB** (Mongo-compatible). Set `MONGODB_URI`. |
| **Secrets** | **AWS Secrets Manager** (or SSM Parameter Store) for `JWT_*`, `MONGODB_URI`, `CLOUDINARY_*`. Never commit real `.env` values. |
| **ECR** | Store the Docker image. |
| **ECS Fargate** | Run the container; map container port **3000** (or your `PORT`) to the target group. |
| **ALB** | Public HTTPS; health check **`GET /api/v1/health`** (HTTP 200). |
| **CloudWatch Logs** | ECS task log driver → `/ecs/instayt-api` (or similar). |

## 1. Local image check

From `backend/`:

```bash
docker build -t instayt-api:local .
docker run --rm -p 3000:3000 \
  -e MONGODB_URI="mongodb://host.docker.internal:27017/instayt" \
  -e JWT_ACCESS_SECRET="dev_access_secret_at_least_32_characters_long" \
  -e JWT_REFRESH_SECRET="dev_refresh_secret_at_least_32_characters_long" \
  instayt-api:local
```

Visit `http://localhost:3000/api/v1/health`. Adjust `MONGODB_URI` if your DB is not on the host.

## 2. Push image to ECR

Set region and repo name if you like, then run:

```bash
export AWS_REGION=us-east-1
export ECR_REPOSITORY=instayt-api
export IMAGE_TAG=v1
chmod +x deploy/aws/build-and-push.sh
./deploy/aws/build-and-push.sh
```

Note the printed image URI (for the ECS task definition).

## 3. Environment variables (production)

Mirror **`backend/.env.example`**. Required at minimum:

- `NODE_ENV=production`
- `PORT=3000` (must match the container port in ECS and the target group)
- `MONGODB_URI`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `CORS_ORIGIN` — set to your **mobile app / web origin** (not `*` if you use credentials)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — uploads stay disabled until these are set

In the ECS task definition, map each key from a secret JSON in Secrets Manager, or use `secrets` with `valueFrom` ARNs.

## 4. Load balancer and WebSockets

- **Health check path:** `/api/v1/health`
- **Idle timeout:** ALB default is **60s**; long-lived Socket.IO connections may benefit from a higher idle timeout (e.g. 300s) or keepalives from the client.
- **Multiple tasks:** If you scale to more than one Fargate task, enable **sticky sessions (session affinity)** on the target group **or** adopt a **Redis**-backed Socket.IO adapter so events work across instances. For the first production cut, a **single task** is the simplest.

## 5. TLS

Terminate TLS on the ALB with an **ACM certificate** in the same region. The container listens on HTTP only.

## 6. Optional next steps

- **CI/CD:** AWS CodePipeline + CodeBuild using the same `docker build` / ECR push pattern.
- **Migrations / seed:** Run `npm run seed` from a developer machine or a **one-off ECS task** with the same image and a task override that runs `node src/scripts/seed.js` (you would need `scripts/` in the image—currently omitted by `.dockerignore` for a smaller API image).
- **App Runner:** Possible for HTTP-only APIs; WebSocket support and tuning are more limited than ECS + ALB—prefer ECS for this backend.

## Reference commands (ECS CLI outline)

Exact cluster/service names are yours to choose:

```bash
aws ecs create-cluster --cluster-name instayt-prod
# Register a task definition JSON (image URI + secrets + portMappings)
aws ecs register-task-definition --cli-input-json file://task-definition.json
aws ecs create-service --cluster instayt-prod --service-name instayt-api \
  --task-definition instayt-api:1 --desired-count 1 --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-aaa],securityGroups=[sg-aaa],assignPublicIp=ENABLED}"
```

Use the console **Create service** wizard the first time; it wires VPC, subnets, security groups, and the ALB target group with fewer mistakes than raw CLI.
