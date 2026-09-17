# Architecture

## Services and what each does

- Amplify: hosts the dashboard website.
- Cognito: login for dashboard users.
- API Gateway: single HTTP entry point for the dashboard.
- Lambda: small functions for APIs, graph building, scenario ranking, eval compile.
- Step Functions: runs the sandbox sequence step by step.
- EventBridge: wakes workers when a new trace arrives.
- S3: stores traces, sandbox logs, eval files. Append-only.
- DynamoDB: sessions, jobs, eval index. Fast lookups.
- OpenSearch: state graph. Answers which paths were seen and which were not.
- Fargate: runs one isolated sandbox per test. No internet. Killed after.
- EC2 g5.xlarge: hosts Qwen-AgentWorld. Returns next-state predictions.
- Bedrock: summaries and labels. Never decides pass or fail.
- Cedar: rules for which fields get stored and which reach a model.
- Strands: the demo agent framework and the sandbox runner.
- Secrets Manager: collector keys and demo credentials.

## Flow

1. Agent runs. Spans go to the collector over OTLP.
2. Cedar policy strips secrets and PII.
3. Redacted trace goes to S3. Session row goes to DynamoDB.
4. Graph builder writes state edges to OpenSearch.
5. A scan lists legal state-action pairs with no observed run.
6. Qwen-AgentWorld predicts what happens on those pairs. Stored as predicted.
7. Step Functions starts one Fargate sandbox per scenario: restore the real
   starting state, inject one fault, run the same agent, check fixed rules in code.
8. Broken rule marks the path verified. Eval compiler writes the YAML file.
9. Dashboard re-runs eval files against new agent versions.

## Statuses

Observed: ran in production. Predicted: model guess, unconfirmed.
Verified: reproduced in the sandbox against the real agent.
Protected: saved as an eval file.

## Trust split

- The world model proposes. It cannot write evals.
- The sandbox executes. It cannot reach Bedrock or the world model.
- Bedrock narrates. It cannot change statuses.
- Only the rule check in the sandbox moves predicted to verified.
- Only the eval compiler, given a failed rule log, moves verified to protected.

## Packaging

One CDK app in `cdk/` deploys everything above. Two modes from one codebase:

- `mode=demo`: public demo site with the seeded agent, ephemeral data.
- `mode=private`: same stack in a customer account, private networking, no seed.

The website is the same dashboard in both. Judges use the demo URL. Teams that
want it private run one deploy command and own all data.
