# Build + push the reference agent image (linux/arm64) for AgentCore Runtime.
# Run ONCE from any machine with Docker (or CI) BEFORE cdk deploy.
# Usage: ./push_agent_image.sh [mode]   (mode = demo | private, default demo)
set -euo pipefail
MODE="${1:-demo}"
REGION="${CDK_DEFAULT_REGION:-ap-south-2}"
ACCOUNT="${CDK_DEFAULT_ACCOUNT:?set CDK_DEFAULT_ACCOUNT}"
REPO="agentgarage-agent-${MODE}"
URI="${ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com/${REPO}:latest"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

aws ecr describe-repositories --repository-names "$REPO" --region "$REGION" >/dev/null 2>&1 \
  || aws ecr create-repository --repository-name "$REPO" --region "$REGION" >/dev/null

aws ecr get-login-password --region "$REGION" \
  | docker login --username AWS --password-stdin "${ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com"

docker buildx build --platform linux/arm64 -t "$URI" -f "$ROOT/agentcore/Dockerfile" "$ROOT" --push
echo "pushed $URI"
