# Competitive benchmark harness

This folder stores the protocol, planted incidents, and measured evidence for
comparing AgentGarage with tracing, observability, evaluation, and red-team
platforms.

No competitor number is published unless it can be regenerated from a file in
`results/`.

## Tracks

- `unknown-path`: products receive clean traces and tool schemas, not the planted
  failures.
- `known-test`: products receive the exact incidents and invariants.

## Platforms

- LangSmith
- Langfuse or Arize Phoenix
- Braintrust
- Promptfoo or Giskard
- AgentGarage

## How to record a run

1. Copy `evidence.schema.json` into `results/<platform>-<incident>-<date>.json`.
2. Fill every funnel stage with evidence or an explicit `null`.
3. Do not infer a later stage from an earlier one.
4. Render:

```powershell
python scripts/render_benchmark.py
```
