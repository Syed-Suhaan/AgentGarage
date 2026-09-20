# Architecture

## Services and what each does

- Amplify: hosts the dashboard website.
- Cognito: login for dashboard users.
- API Gateway: single HTTP entry point for the dashboard.
- Lambda: small functions for APIs, graph building, scenario ranking, sandbox
  invocation, eval compile. Lambdas never execute agent code.
- Step Functions: runs the sandbox sequence step by step.
- EventBridge: wakes workers when a new trace arrives.
- S3: stores traces, sandbox logs, eval files. Append-only.
- DynamoDB: sessions, jobs, eval index, agent registry. Fast lookups.
- Neptune Serverless: state graph. Answers which paths were seen and which
  were not.
- Bedrock AgentCore Runtime: runs one isolated microVM sandbox per test.
  Dedicated CPU/memory/filesystem per session, sanitized on termination.
  VPC mode, no internet. Killed after.
- Bedrock: world-model predictions plus agent reasoning inside the sandbox.
  Never decides pass or fail.
- redact_fn: allowlist redactor that strips secrets and PII before storage.
- Strands: the reference agent framework (demo image only).
- Secrets Manager: collector keys and demo credentials.
- Kinesis: OTLP ingest buffer between the collector and redact_fn.
- ECS Fargate: runs the OTLP collector only. It never runs agents.

## Flow

1. Customer agents run in their own runtime and export spans to the collector
   over OTLP. The `agent/` code in this repo is the reference demo agent, not
   a customer dependency.
2. redact_fn strips secrets and PII.
3. Redacted trace goes to S3. Session row goes to DynamoDB.
4. Graph builder writes state edges to Neptune.
5. A scan lists legal state-action pairs with no observed run.
6. Bedrock world model predicts what happens on those pairs. Stored as
   predicted.
7. Step Functions invokes one AgentCore Runtime microVM per scenario: the
   registered agent container restores the starting state, injects one fault,
   runs the real agent loop, and returns its world snapshot + spans.
8. A verifier Lambda checks fixed rules in code. Broken rule marks the path
   verified. The verifier never runs agent code.
9. Eval compiler writes the YAML file.
10. Dashboard re-runs eval files against new agent versions.

## Statuses

Observed: ran in production. Predicted: model guess, unconfirmed.
Verified: reproduced in the sandbox against the real agent.
Protected: saved as an eval file.

## Trust split

- The world model proposes. It cannot write evals.
- The sandbox executes the agent in an isolated microVM. It cannot write evals.
- The verifier Lambda applies code-level invariants. It cannot run agents and
  cannot reach the world model.
- Bedrock narrates and reasons. It cannot change statuses.
- Only the rule check in the verifier moves predicted to verified.
- Only the eval compiler, given a failed rule log, moves verified to protected.

## Demo agent

The public demo uses an autonomous AWS SRE remediator for a checkout service.
That domain is already where agents choose tools under real operational risk:
inspect health, read logs, roll back a deploy, then verify. The governing rule
does not change. The world model may only propose. Code-level invariants in the
verifier decide pass or fail.

The competitive benchmark has two tracks: unknown-path discovery and known-test
execution. Published funnel numbers come only from recorded files in
`benchmarks/results/`.

## Bringing your own agent

Private mode accepts traces from any agent that emits OTLP. Set three
resource attributes on spans: `agent.id`, `agent.version`, `prompt.hash`.
No SDK is required.

Sandbox runs execute YOUR agent container in AgentCore Runtime. Register its
ECR URI at deploy time:

```bash
cdk deploy -c mode=private -c agentImageUri=ACCOUNT.dkr.ecr.REGION.amazonaws.com/your-agent:tag
```

Your image must expose `GET /ping` and `POST /invocations` on port 8080
(linux/arm64) and accept the scenario payload documented in
`agentcore/server.py`. Optionally register a BYOK model endpoint + secret
(`model_endpoint`, `model_secret_arn`) in the `agents` table;
`simulation_fn` calls it instead of Bedrock for that agent.

## Packaging

One CDK app in `cdk/` deploys everything above. Two modes from one codebase:

- `mode=demo`: public demo site with the reference agent image, ephemeral data.
- `mode=private`: same stack in a customer account, private networking, no seed,
  customer agent image required.

The website is the same dashboard in both. Judges use the demo URL. Teams that
want it private run one deploy command and own all data.
