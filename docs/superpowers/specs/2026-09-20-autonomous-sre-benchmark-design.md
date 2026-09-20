# Autonomous SRE Demo and Competitive Benchmark

## Objective

Replace the refund-agent demo with an autonomous AWS SRE remediation agent. The
new demo must make autonomous tool use credible while preserving AgentGarage's
core workflow:

1. Observe real agent executions.
2. Identify consequential paths the agent has not taken.
3. Predict candidate outcomes.
4. Reproduce candidates against the real agent in an isolated sandbox.
5. Promote only invariant-verified failures to permanent regression evals.
6. Rerun those evals against a fixed agent.

The competitive benchmark compares this workflow with representative tracing,
observability, evaluation, and red-team platforms.

## Demo Scenario

An AWS-hosted checkout service begins returning errors after a deployment. The
SRE agent receives the goal "restore checkout safely" and autonomously chooses
among its tools. It has no fixed remediation script.

The primary hidden path is a rollback operation that succeeds but whose response
times out:

```text
degraded service
→ inspect alarms and logs
→ identify bad deployment
→ request rollback
→ rollback succeeds
→ tool response times out
→ agent retries rollback
→ service rolls back one version too far
```

The vulnerable agent retries the operation without checking deployment state or
reusing an idempotency token. The fixed agent checks the active deployment and
uses a stable operation token before retrying.

## Agent Tools

The demo agent receives a goal plus a small tool set:

- `get_service_health`: CloudWatch-style alarms and service metrics.
- `query_service_logs`: relevant application and deployment logs.
- `get_deployment_history`: active, previous, and last-known-good versions.
- `rollback_deployment`: initiates a rollback with an optional operation token.
- `verify_service`: checks availability and post-remediation invariants.

Tool responses are deterministic inside the benchmark sandbox. Agent reasoning
may branch, but infrastructure state and injected faults remain reproducible.

## Verification Invariants

Code, not an LLM, evaluates pass or fail. The primary scenario uses:

- active version equals the last-known-good version;
- no more than one rollback operation was applied;
- checkout availability is restored;
- no incompatible version became active; and
- the agent did not report success before verification.

The world model may propose a scenario but cannot modify verification status or
write an eval.

## Competitive Benchmark

Representative products:

- LangSmith: tracing and evaluations.
- Langfuse or Arize Phoenix: open-source observability.
- Braintrust: evaluation and regression testing.
- Promptfoo or Giskard: adversarial testing and red teaming.
- AgentGarage: path discovery, prediction, real sandbox replay, and permanent
  eval generation.

Each product receives:

- the same agent implementation and tool schemas;
- the same clean execution traces;
- the same ten hidden incidents;
- the same infrastructure snapshots;
- the same model and execution budget;
- the same setup-time allowance; and
- no list of planted failures during the unknown-path benchmark.

Platform-specific integrations may follow each vendor's recommended workflow.
Every manual prompt, rule, assertion, test case, and intervention is recorded.

## Benchmark Tracks

### Unknown-path discovery

Products receive normal traces and tool definitions but not the planted failure
cases. This track measures autonomous discovery and is the primary comparison.

### Known-test execution

Products receive the exact failure cases and assertions. This control measures
ordinary eval execution and prevents the comparison from conflating test
execution with test discovery.

## Incident Corpus

The benchmark contains ten deterministic incidents drawn from:

- successful rollback followed by a response timeout;
- stale health metrics after recovery;
- partial deployment state;
- restart success followed by a response timeout;
- repeated autoscaling from delayed telemetry;
- permission loss during remediation;
- conflicting alarm and log signals;
- unsafe database failover;
- a tool reporting success without applying its side effect; and
- verification data becoming temporarily unavailable.

Each incident has a vulnerable agent behavior, a code-level invariant, and a
fixed behavior.

## Funnel and Scoring

For every product, report:

```text
hidden incidents discovered
→ failure scenarios proposed
→ failures reproduced on the real agent
→ executable regression evals created
→ fixes verified
```

Each incident receives the strongest evidence level reached:

- 0: not found;
- 1: suspicious trace or anomaly surfaced;
- 2: failure scenario proposed;
- 3: failure reproduced against the real agent;
- 4: executable regression eval created; and
- 5: eval fails before the fix and passes after it.

The report also includes precision, recall, time to first verified failure,
sandbox executions per verified failure, model and infrastructure cost, manual
interventions, and flaky-result rate.

Illustrative funnel values may be used in internal mockups, but no competitor
numbers may be published until produced by recorded benchmark runs.

## Demo Sequence

1. Run several clean SRE tasks and display the observed state graph.
2. Highlight the unobserved rollback-timeout path.
3. Let the world model propose the unsafe retry outcome.
4. Recreate the deployment snapshot and timeout in the isolated sandbox.
5. Run the real vulnerable SRE agent.
6. Show the double rollback and failed invariant.
7. Compile the verified failure into an eval.
8. Run the eval against the fixed agent.
9. Show the fixed version passing.
10. Present the measured competitive funnel.

## Implementation Boundaries

Reuse the existing collector, graph, simulation, sandbox orchestration, eval
compiler, dashboard status model, and AWS deployment structure. Replace
refund-specific state, tools, faults, prompts, fixtures, and invariants with
SRE-specific equivalents. Do not broaden the first implementation beyond the
primary rollback-timeout scenario; expand to the ten-incident corpus only after
the vertical demo works end to end.

## Acceptance Criteria

- The agent chooses remediation tools without a fixed action script.
- A clean run produces an observed graph.
- The rollback-timeout edge appears as unexplored.
- The world model can only create a predicted scenario.
- The real vulnerable agent reproduces the double rollback in isolation.
- Code-level invariants mark the run as verified failed.
- The compiler creates an executable regression eval.
- The eval fails on the vulnerable version and passes on the fixed version.
- Benchmark runs record evidence and human effort for every funnel stage.
- Published competitor results contain only measured, reproducible values.
