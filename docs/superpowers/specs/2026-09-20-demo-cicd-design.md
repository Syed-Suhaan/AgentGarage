# Demo CI/CD (non-CDK) — 2026-09-20

## Intent

Ship the **live demo** (real agent workflow + dashboard + AWS plugs) on every push to `main` via GitHub Actions.

**CDK stays separate** and is finalized later as the customer one-click package (their account, their agents). This demo path does not deploy via CDK.

## Trigger

- **PR / push:** `ci.yml` — build frontend, package Lambda, validate SAM
- **Push to `main`:** `deploy.yml` — deploy demo stack + Amplify

## Architecture

| Piece | Where |
|-------|--------|
| Demo API | SAM `infra/demo` → Lambda (`services.api.app.lambda_handler`) + HTTP API |
| Data plugs | S3 (traces/sandboxes/evals) + DynamoDB (sessions/jobs/evals/agents) |
| Auth | Cognito user pool (demo self-signup) |
| Frontend | Amplify Hosting `us-east-1` (static `web/out`) |
| Region (API) | `ap-south-2` |

No Neptune / AgentCore / Step Functions in v1 demo stack — graph uses in-memory/DDB fallbacks when `NEPTUNE_ENDPOINT` is empty. Can be added later without moving to CDK.

## Auth to AWS

GitHub OIDC → IAM role (`AWS_ROLE_ARN` secret). No long-lived access keys.

## Out of scope

- Customer CDK packaging
- Private mode
- Rebuilding AgentCore images every commit
