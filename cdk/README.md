Customer one-click package (Python CDK). **Not used for the live team demo.**

Demo deploys via GitHub Actions + `infra/demo` (see `docs/cicd.md`).
Do not `cdk deploy` for day-to-day shipping.

This stack packages S3, DynamoDB, Neptune Serverless, Kinesis, ECS Fargate
(OTLP collector), Bedrock AgentCore Runtime, simulation Lambda, API Gateway,
Amplify, Cognito — for customers' accounts when the product is finalized.
