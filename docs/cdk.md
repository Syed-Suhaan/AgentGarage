# CDK template

One command sets up the full AgentGarage stack in any AWS account.

## Prerequisites

- AWS CLI with an admin-level profile.
- Node 20 plus the CDK CLI: `npm install -g aws-cdk`.
- An AWS region with Bedrock model access enabled for narration.
- For the world model: one `g5.xlarge` quota in the target region.
- A domain or the default Amplify URL for the dashboard.

## Deploy

```bash
cd cdk
npm install
cdk bootstrap aws://ACCOUNT/REGION
cdk deploy -c mode=demo
```

Private install:

```bash
cdk deploy -c mode=private -c adminEmail=you@company.com
```

Tear down:

```bash
cdk destroy
```

## Modes

`mode=demo` creates a public-facing stack: Cognito user pool with self
sign-up, a public collector endpoint behind an API key, the seeded refund
agent, and 24-hour TTLs on traces. Built for judges and trials.

`mode=private` creates the same resources with private networking: the
collector sits behind an internal load balancer inside the VPC, sign-up is
admin-only, TTLs are off, and no seed data is loaded. Nothing leaves the
account. Bedrock calls stay in-region. The world model runs on the account's
own GPU instance.

## What the stack creates

Networking: one VPC with public and private subnets, NAT for Bedrock and
ECR pulls, VPC endpoints for S3 and DynamoDB.

Storage: three S3 buckets (traces, sandbox logs, evals) with KMS encryption
and versioning; four DynamoDB tables (sessions, jobs, evals, agents) on
on-demand billing.

Compute: ECS cluster with the OTLP collector service; Fargate task
definitions for sandbox runs; one EC2 `g5.xlarge` for the world model with
the model pulled at boot from Hugging Face; Lambda functions for the API,
graph builder, frontier scan, simulation, and eval compiler.

Orchestration: one Step Functions state machine for the sandbox sequence;
one EventBridge rule from trace arrival to graph builder.

Search: one OpenSearch domain holding the state graph index.

Access: Cognito user pool, API Gateway with Cognito authorizer, IAM roles
per function following least privilege, Secrets Manager entries for the
collector key and demo credentials.

Frontend: Amplify app wired to the API Gateway URL at deploy time.

## Outputs

After deploy, the terminal prints:

- Dashboard URL
- Collector OTLP endpoint and API key secret ARN
- OpenSearch dashboard link
- World-model health endpoint (VPC-internal in private mode)

Point any OpenTelemetry-instrumented agent at the collector endpoint and
traces start flowing.

## Bringing your own agent

Private mode accepts traces from any agent that emits OTLP. Set three
resource attributes on spans: `agent.id`, `agent.version`, `prompt.hash`.
No SDK is required. The Strands agent in `agent/` is one example, not a
dependency.

Sandbox runs execute the agent code provided at seed time. For arbitrary  
agents, package the agent as a container image and register its URI in the  
`agents` table. The sandbox pulls that image instead of the default.

## Repo map

```text
cdk/
  bin/agentgarage.ts      # app entry, reads mode context
  lib/
    AgentGarageStack.ts   # wires nested stacks
    nested/
      Network.ts
      Storage.ts          # S3, DynamoDB, KMS
      Search.ts           # OpenSearch domain + index
      Intake.ts           # collector service + redact function
      Compute.ts          # Fargate definitions, EC2 world model
      Orchestration.ts    # Step Functions + EventBridge
      Api.ts              # Gateway + Lambda handlers
      Frontend.ts         # Amplify + Cognito
```

