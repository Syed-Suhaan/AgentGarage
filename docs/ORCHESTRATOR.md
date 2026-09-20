# Orchestrator decisions (AgentGarage)

Last updated: 2026-09-20

## Deploy path (locked)

| Path | Purpose | Who deploys it |
|------|---------|----------------|
| `.github/workflows` + `infra/demo` | **Live team demo** (API + Amplify frontend) | GitHub Actions on push to `main` |
| `cdk/` | **Customer one-click package** only | Never for the team demo |

**Do not run `cdk deploy` for the demo.** CDK may still be edited/synthed for packaging work, but shipping frontend + backend to our AWS account goes through Actions → SAM (`agentgarage-demo`) + Amplify (`agentgarage-demo-amplify`).

See `docs/cicd.md` for OIDC setup and workflow details.

## Active agent guidance

- SRE / benchmark work: land code on `main`; Actions deploys it. No local CDK deploy loops.
- Model: Bedrock may be unavailable; prefer configurable model API keys in demo Lambda env when needed — still via SAM/GHA, not CDK.
