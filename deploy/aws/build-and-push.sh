#!/usr/bin/env bash
# Build the API image and push to Amazon ECR.
# Prerequisites: AWS CLI v2, Docker, permissions for ecr:GetAuthorizationToken and ecr:PutImage.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

REGION="${AWS_REGION:-us-east-1}"
REPOSITORY_NAME="${ECR_REPOSITORY:-instayt-api}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
REGISTRY="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
URI="${REGISTRY}/${REPOSITORY_NAME}:${IMAGE_TAG}"

echo "Ensuring ECR repository exists: ${REPOSITORY_NAME}"
aws ecr describe-repositories --repository-names "${REPOSITORY_NAME}" --region "${REGION}" >/dev/null 2>&1 \
  || aws ecr create-repository --repository-name "${REPOSITORY_NAME}" --region "${REGION}" >/dev/null

echo "Logging in to ECR"
aws ecr get-login-password --region "${REGION}" | docker login --username AWS --password-stdin "${REGISTRY}"

echo "Building ${URI}"
docker build -t "${REPOSITORY_NAME}:${IMAGE_TAG}" .

echo "Pushing ${URI}"
docker tag "${REPOSITORY_NAME}:${IMAGE_TAG}" "${URI}"
docker push "${URI}"

echo "Done. Image: ${URI}"
