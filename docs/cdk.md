# CDK template

One command sets up the full AgentGarage stack in any AWS account.
Python CDK: `cdk/app.py` + `cdk/stacks/*.py` (no TypeScript).

## Prerequisites

- AWS CLI with an admin-level profile.
- Node 20 plus the CDK CLI: `npm install -g aws-cdk`.
- Python 3.12 + `pip install -r cdk/requirements.txt` (`aws-cdk-lib`, `constructs`).
- An AWS region with Bedrock model access enabled for narration/simulation.
- Neptune + Kinesis quotas in the target region (no `g5.xlarge` quota needed).
- A domain or the default Amplify URL for the dashboard.

## Deploy

```bash
cd cdk
pip install -r requirements.txt
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
account. Bedrock calls stay in-region. The world model is Bedrock-native
with an optional BYOK override per agent row.

## What the stack creates

Networking: one VPC with public and private subnets, 1 NAT, VPC endpoints
for S3 and DynamoDB (Gateway) + Kinesis (Interface). SGs for Neptune,
Fargate, Lambdas.

Storage: KMS key; three S3 buckets (traces, sandbox logs, evals) with KMS
encryption and versioning (demo: 1-day expiry; private: no expiry + RETAIN);
four DynamoDB on-demand tables (sessions, jobs, evals, agents with BYOK
fields `model_endpoint, model_secret_arn, image_uri`; TTL only in demo for
sessions/jobs); Secrets Manager entries for the collector key (+ demo creds
in demo).

Graph: one Neptune Serverless cluster (min ~1 NCU demo, higher in private),
IAM-auth, KMS, private subnets, ingress only from query/builder Lambdas.
Property graph: vertices `state`, edges `action` with
`agent_id, status, count`. Query Lambda serves the dashboard; builder Lambda
parses traces on arrival.

Intake: ECS Fargate collector service + ALB (public + API key in demo;
internal ALB in private) -> Kinesis Data Stream (on-demand, KMS, 24h demo /
7d private) -> Cedar `redact_fn` (EventSourceMapping batch 100,
bisect-on-error, SQS DLQ) -> S3 traces + DynamoDB sessions. CloudWatch lag
alarms on iterator age.

Compute: ECS cluster + Fargate sandbox task defs (no internet egress,
killed after run, logs to sandbox-logs bucket, zero model IAM).
`simulation_fn` Lambda: default `bedrock:InvokeModel` in-region; if the
`agents` row has `model_override {endpoint, secret_arn}`, call the customer
endpoint via Secrets Manager. Writes `predicted` scenarios (e.g. `sc_19`
shape) to DDB/S3. IAM: simulation gets `bedrock:InvokeModel` + scoped
`secretsmanager:GetSecretValue`; sandbox gets none (trust split preserved).
No EC2 world-model host.

Orchestration: one Step Functions state machine for the sandbox sequence
(restore start state -> inject fault -> `ecs:RunTask` agent image, default
or `agents.image_uri` -> rule-check Lambda `predicted -> verified` ->
eval-compiler Lambda `verified -> protected`, YAML to evals bucket + DDB
index); one EventBridge rule from S3 trace arrival to the state machine.

API: API Gateway `RestApi` + Cognito authorizer; 8 routes from
`schemas/api_routes.json` wired to Lambdas (graph/simulate hit the
Neptune-query + simulation Lambdas). Least-privilege per function.

Access: Cognito user pool (self-signup demo; admin-only + `adminEmail`
private), API Gateway with Cognito authorizer, IAM roles per function
following least privilege, Secrets Manager entries for the collector key
and demo credentials.

Frontend: Amplify app (`web/`) wired to the API Gateway URL at deploy time
via `API_URL`.

## Outputs

After deploy, the terminal prints:

- Dashboard URL (Amplify)
- API URL
- Collector OTLP endpoint and API key secret ARN
- Neptune endpoint
- Kinesis stream name
- Bedrock model IDs

Point any OpenTelemetry-instrumented agent at the collector endpoint and
traces start flowing.

## Bringing your own agent

Private mode accepts traces from any agent that emits OTLP. Set three
resource attributes on spans: `agent.id`, `agent.version`, `prompt.hash`.
No SDK is required. The Strands agent in `agent/` is one example, not a
dependency.

Sandbox runs execute the agent code provided at seed time. For arbitrary
agents, package the agent as a container image and register its URI in the
`agents` table (`image_uri`). The sandbox pulls that image instead of the
default. Optionally register a BYOK model endpoint + secret
(`model_endpoint`, `model_secret_arn`); `simulation_fn` calls it instead of
Bedrock for that agent.

## Repo map

```text
cdk/
  app.py                 # entry, reads mode context, wires nested stacks
  cdk.json               # {"app": "python app.py", "context": {"mode": "demo"}}
  requirements.txt       # aws-cdk-lib, constructs
  stacks/
    network.py           # VPC, subnets, endpoints, SGs
    storage.py           # S3, DDB, KMS, Secrets
    graph.py             # Neptune Serverless + query/builder Lambdas (ex-search.py)
    search.py            # back-compat shim re-exporting Graph as Search
    intake.py            # collector ECS + Kinesis + redact Lambda
    compute.py           # Fargate sandbox + Bedrock/BYOK simulation_fn (no EC2)
    orchestration.py     # Step Functions + EventBridge
    api.py               # Gateway + Lambda handlers (8 routes)
    frontend.py          # Amplify + Cognito
```
