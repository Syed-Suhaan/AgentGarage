# Autonomous SRE Benchmark Implementation Plan

Design reference:
`docs/superpowers/specs/2026-09-20-autonomous-sre-benchmark-design.md`

## Delivery Strategy

Build one deterministic vertical slice before expanding the incident corpus:

```text
clean SRE run
→ observed graph
→ unexplored rollback-timeout path
→ predicted scenario
→ real-agent sandbox reproduction
→ code-verified failure
→ permanent eval
→ fixed-version pass
```

Keep the existing refund modules intact until the SRE path passes end to end.
This avoids destroying a working fallback and avoids overwriting current
uncommitted work in `agent/refund.py`. Add SRE-specific modules, switch consumers
incrementally, and remove refund code only in a later cleanup change.

## Phase 0: Preserve the Baseline

### Files

- `agent/refund.py`
- `services/api/test_api.py`
- `scripts/live_flow_test.py`
- current working tree

### Work

1. Record the current unit-test, frontend-test, and build results.
2. Save representative clean refund trace, graph, scenario, sandbox, and eval
   payloads as migration references.
3. Do not reset, overwrite, or fold unrelated working-tree changes into this
   migration.
4. Implement the migration in small commits so the refund demo remains a
   recoverable fallback until the SRE live-flow test passes.

### Verification

```powershell
$env:STORE="memory"; python -m services.api.test_api
Set-Location web; npm test -- --run
Set-Location web; npm run build
```

## Phase 1: Deterministic SRE World and Tools

### Add

- `agent/sre_world.py`
- `agent/sre_tools.py`
- `agent/test_sre_world.py`
- `agent/test_sre_tools.py`

### State model

`sre_world.begin()` accepts `service`, `fault`, `initial_state`, and
`idempotent`. Its state contains:

- `service`
- `active_version`
- `version_history`
- `last_known_good`
- `rollback_count`
- `operation_tokens`
- `checkout_available`
- `health_checked`
- `logs_queried`
- `deployment_checked`
- `verified_after_remediation`
- `fault`
- `spans`

Use a three-version deterministic fixture:

```text
v1.8.1       older compatible version
v1.8.2       last-known-good version
v1.8.3-bad   active degraded version
```

The first rollback moves `v1.8.3-bad` to `v1.8.2`. An unsafe second rollback
moves `v1.8.2` to `v1.8.1`, making the invariant failure unambiguous.

### Tools

Implement real Strands `@tool` functions:

- `get_service_health(service)`
- `query_service_logs(service)`
- `get_deployment_history(service)`
- `rollback_deployment(service, operation_token=None)`
- `verify_service(service)`

`rollback_deployment` must apply its side effect before raising
`TimeoutError` for `timeout_after_success`. Reusing an operation token returns
the prior result without another rollback.

### Unit tests

- A normal rollback lands exactly on `last_known_good`.
- Timeout-after-success changes state and then raises.
- Retrying without a token increments `rollback_count` to two and moves one
  version too far.
- Retrying with the same token is a no-op.
- `verify_service` reports healthy only at the last-known-good version.
- Every tool records a deterministic span.

## Phase 2: Autonomous SRE Agent

### Add

- `agent/sre.py`

### Update

- `agent/__init__.py`
- `agent/README.md`

### Agent behavior

Keep the current Bedrock/Strands integration, OTLP setup, version gate, prompt
hash, and trace shape.

The vulnerable prompt:

- gives the goal "restore checkout safely";
- lists available tools without prescribing an action sequence;
- tells the agent to retry a timed-out remediation;
- does not require an operation token or state recheck.

The fixed prompt:

- requires a stable operation token;
- requires `get_deployment_history` after an ambiguous timeout;
- retries only when state shows the rollback did not apply; and
- requires `verify_service` before reporting success.

Expose `run(agent_id="sre-agent", version="1.8.2", service="checkout", ...)`.
Keep `1.8.2` vulnerable and treat later versions as fixed so the existing eval
flow remains compatible.

### Verification

- Mock the Strands model for deterministic prompt/tool tests.
- Keep one optional Bedrock smoke test that asserts tool spans exist.
- Do not use Bedrock in normal unit tests.

## Phase 3: SRE Graph and Frontier

### Update

- `services/graph/app.py`
- `services/api/test_api.py`

### Add

- `services/graph/test_graph.py`

### State vocabulary

```text
service_degraded
health_inspected
logs_queried
bad_deployment_identified
rollback_succeeded
rollback_failed
rollback_timeout
service_restored
```

The clean path ends at `service_restored`. The primary unexplored pair is:

```text
(rollback_succeeded, tool_timeout)
```

Retain `tool_timeout` as a synthetic frontier action and rank it first. It maps
to a `rollback_deployment` fault in simulation rather than pretending to be a
real agent tool.

### Tests

- A clean trace produces the complete observed SRE path.
- Duplicate traces do not duplicate graph edges.
- The frontier ranks `tool_timeout` first.
- A timed-out rollback transitions to `rollback_timeout`.
- Default routing uses `sre-agent`.

## Phase 4: Sandbox Verification

### Update

- `services/replay/app.py`

### Add

- `services/replay/test_invariants.py`

### Invariants

Extract a pure `evaluate_invariants(world, spans)` function. It returns detailed
fields plus `passed`:

- `active_version == last_known_good`
- `rollback_count <= 1`
- `checkout_available is True`
- `verify_service` occurred after the final rollback
- total tool calls remain below the loop limit

The sandbox status remains `verified_pass` or `verified_fail`. Bedrock and the
world model never participate in invariant evaluation.

### Tests

- Vulnerable timeout retry fails with two rollbacks.
- Fixed retry passes with one rollback.
- Wrong active version fails even when rollback count is one.
- Missing post-remediation verification fails.
- A model claim of success cannot override failed invariants.

## Phase 5: Prediction and Eval Compilation

### Update

- `services/simulate/app.py`
- `services/evals/app.py`

### Add

- `services/simulate/test_simulate.py`
- `services/evals/test_compile.py`

### Prediction

Map:

```python
"tool_timeout": ("rollback_deployment", "timeout_after_success")
```

The world-model prompt describes the exact deployment snapshot schema. Validate
returned `initial_state` before storing a scenario. Continue storing only
`predicted` status.

### Eval

Compile the primary failure as:

```text
eval_double_rollback_after_timeout
```

Its invariant payload includes:

- `rollback_count <= 1`
- `active_version == last_known_good`
- `checkout_available == true`
- `verified_after_remediation == true`

Tests prove that only a failed verified sandbox can create this protected eval,
that it fails on `1.8.2`, and that it passes on the fixed version.

## Phase 6: API, Storage Defaults, and Deployment Wiring

### Update

- `services/api/app.py`
- `services/collector/app.py`
- `services/store.py`
- `scripts/live_flow_test.py`
- any CDK environment values that contain `refund-agent`

### Work

1. Seed clean runs through `agent.sre.run`.
2. Change domain defaults to `sre-agent`.
3. Keep API routes generic: `/agent/{id}/graph`,
   `/agent/{id}/unexplored`, `/scenarios/{id}/sandbox`, and `/evals`.
4. Keep Step Functions, Fargate, S3, DynamoDB, OpenSearch, and API Gateway
   structure unchanged.
5. Update the live-flow script to assert the SRE frontier, double rollback,
   protected eval, and fixed-version pass.

### Verification

Run the complete local memory path first, then deploy and execute:

```powershell
python scripts/live_flow_test.py
```

Capture IDs and timestamps for the trace, scenario, sandbox, and eval so every
demo claim has an evidence chain.

## Phase 7: Schemas and Fixtures

### Update

- `schemas/vocab.json`
- `schemas/scenario_schema.json`
- `schemas/eval_schema.json`
- `schemas/trace_schema.json`
- `schemas/templates/graph_sample.json`
- `schemas/templates/trace_84f2.json`
- `schemas/templates/unexplored_sample.json`
- `schemas/templates/scenario_19.json`

### Replace

- `schemas/templates/eval_duplicate_refund.json` with an SRE-named fixture

Schemas must encode deployment versions, rollback count, operation token,
checkout health, and post-remediation verification. Validate every fixture
against its schema in CI.

## Phase 8: Dashboard Migration

### Update

- `web/src/lib/api.ts`
- `web/src/lib/types.ts`
- `web/src/lib/graph-reference-data.ts`
- `web/src/app/dashboard/page.tsx`
- `web/src/app/dashboard/graph/page.tsx`
- `web/src/app/dashboard/gaps/page.tsx`
- `web/src/app/dashboard/traces/page.tsx`
- `web/src/app/dashboard/settings/page.tsx`
- `web/src/app/dashboard/sandboxes/[sandboxId]/sandbox-detail.tsx`
- dashboard navigation/topbar copy

### Work

1. Replace `refund-agent` with `sre-agent`.
2. Replace mock graph, frontier, scenario, sandbox, and eval payloads.
3. Render invariants generically from key/value data rather than hardcoding
   `refund_calls`; this prevents the next domain change from requiring another
   UI rewrite.
4. Tell the SRE story consistently: degraded service, rollback timeout, unsafe
   retry, verified double rollback, protected eval, fixed release.
5. Keep existing status colors and observed/predicted/verified/protected trust
   semantics unchanged.

### Verification

```powershell
Set-Location web
npm test -- --run
npm run lint
npm run build
```

Manually verify graph, gaps, sandbox detail, eval history, loading, empty, and
error states against both mock and deployed APIs.

## Phase 9: Competitive Benchmark Harness

Do this only after the vertical slice is stable.

### Add

- `benchmarks/README.md`
- `benchmarks/protocol.json`
- `benchmarks/incidents/*.json`
- `benchmarks/evidence.schema.json`
- `benchmarks/results/.gitkeep`
- `scripts/run_benchmark.py`
- `scripts/render_benchmark.py`

### Protocol

Each platform run records:

- platform and version;
- incident and random seed;
- setup start/end;
- model and infrastructure budget;
- traces and tool definitions supplied;
- manual prompts, rules, assertions, and interventions;
- scenario proposed;
- real-agent reproduction evidence;
- executable eval artifact;
- vulnerable-version result;
- fixed-version result;
- wall-clock time and cost.

The renderer calculates:

```text
incidents discovered
→ scenarios proposed
→ failures reproduced
→ evals created
→ fixes verified
```

It also calculates precision, recall, time to first verified failure, sandbox
runs per verified failure, manual actions, cost, and flake rate.

### Platform policy

Run one representative product from each category:

- LangSmith
- Langfuse or Arize Phoenix
- Braintrust
- Promptfoo or Giskard
- AgentGarage

Use each vendor's recommended integration. Store raw evidence or links for every
funnel transition. Never infer unsupported stages and never publish illustrative
numbers as measurements.

### Incident rollout

1. Primary rollback timeout.
2. Stale health metrics.
3. Partial rollout state.
4. Restart succeeds but response times out.
5. Repeated scaling from delayed telemetry.
6. Permission loss during remediation.
7. Conflicting alarms and logs.
8. Unsafe database failover.
9. Success response without side effect.
10. Verification data temporarily unavailable.

Each incident requires a deterministic environment, vulnerable behavior, fixed
behavior, and code-level invariant before it enters the benchmark.

## Phase 10: Documentation and Demo Evidence

### Update

- `docs/overview.md`
- `docs/architecture.md`
- `docs/demo.md`
- `docs/roadmap.md`
- service READMEs

Document:

- why autonomous SRE remediation is credible;
- the trust boundary between prediction and verification;
- the benchmark's known-test and unknown-path tracks;
- exact benchmark versions, budgets, seeds, and run dates; and
- links or IDs for raw evidence.

## Required Gates

The first release is complete only when:

1. Unit tests deterministically demonstrate the vulnerable and fixed tool
   behavior.
2. A clean run generates the expected SRE graph.
3. The frontier exposes rollback timeout first.
4. Simulation creates only a predicted scenario.
5. Sandbox replay reproduces two rollbacks on `1.8.2`.
6. Code invariants mark that replay `verified_fail`.
7. Eval compilation creates a protected SRE eval.
8. The same eval passes on the fixed version.
9. The dashboard shows the full evidence chain.
10. The deployed live-flow test passes twice consecutively.

The competitive benchmark is publishable only when every displayed number can
be regenerated from stored run evidence.
