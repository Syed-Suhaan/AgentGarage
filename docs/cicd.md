# Live demo CI/CD (not CDK)

> **Orchestrator lock (2026-09-20):** Do not `cdk deploy` for the team demo.
> Frontend + backend ship only through these GitHub Actions workflows.

CDK under `cdk/` is the **customer** one-click package — leave it for the end of the project.

This path deploys the **team live demo** on every push to `main`:

1. SAM stack `agentgarage-demo` in `ap-south-2` (Lambda API + S3 + DynamoDB + Cognito)
2. Amplify stack `agentgarage-demo-amplify` in `us-east-1` (custom headers: HTML `no-cache`, `/_next/static/**` long-cache)
3. Zip-upload of `web/out` via `scripts/deploy_amplify.py`, then CloudFront `/*` invalidation

## One-time AWS setup

### 1. GitHub OIDC provider (account-wide, once)

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list ffffffffffffffffffffffffffffffffffffffff
```

(Skip if the provider already exists.)

### 2. IAM role for this repo

Trust policy (replace `ACCOUNT_ID` and keep the repo name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:Syed-Suhaan/AgentGarage:*"
        }
      }
    }
  ]
}
```

Attach a deploy policy that can manage CloudFormation, SAM/S3 artifacts, Lambda, API Gateway, DynamoDB, Cognito, Amplify, IAM (for SAM roles), and pass roles. For a hackathon, `AdministratorAccess` on a dedicated demo account is fine.

### 3. GitHub secrets

In the repo → **Settings → Secrets and variables → Actions**:

| Name | Value |
|------|--------|
| `AWS_ACCESS_KEY_ID` | IAM user access key (demo deploy user) |
| `AWS_SECRET_ACCESS_KEY` | Matching secret |

Hackathon default: IAM user `AgentGarageGitHubDeployUser` with `AdministratorAccess`.
OIDC role `AgentGarageGitHubDeploy` exists for a later switch; workflows currently use access keys.

### 4. Bootstrap SAM publishing bucket (first deploy)

`sam deploy --resolve-s3` creates this automatically on first run from Actions.

## Workflows

| File | When | What |
|------|------|------|
| `.github/workflows/ci.yml` | PR + push | `web` build, Lambda package, `sam validate` |
| `.github/workflows/deploy.yml` | push to `main` | SAM deploy → Amplify stack → frontend upload |

## Local deploy (optional)

```bash
python cdk/build_lambda.py
sam deploy --template-file infra/demo/template.yaml --stack-name agentgarage-demo \
  --region ap-south-2 --capabilities CAPABILITY_IAM --resolve-s3 --no-confirm-changeset

# then Amplify host + scripts/deploy_amplify.py with stack outputs as NEXT_PUBLIC_*
```

## CDK

Do **not** wire these workflows to `cdk deploy`. Customer packaging stays in `cdk/` until the product is finalized.
