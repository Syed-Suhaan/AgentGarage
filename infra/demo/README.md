# Live demo infrastructure (non-CDK)

SAM/CloudFormation for the **team demo** deployed by GitHub Actions.

- `template.yaml` — API Lambda, HTTP API, S3, DynamoDB, Cognito (`ap-south-2`)
- `amplify.yaml` — Amplify app + `main` branch (`us-east-1`)

Customer packaging lives in `/cdk` and is separate. See `docs/cicd.md`.
