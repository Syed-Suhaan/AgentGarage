"""Fargate task. Restores state, injects one fault, runs real Strands agent, checks invariants.

Architecture step 7. Does not call the world model. Does not write evals.
Pass/fail is code-only (ledger rules). Agent loop uses Bedrock as its model.
"""
import json
import os
import sys

from agent.refund import run
from services import store

# schemas/vocab.json
ALLOWED_FINAL = {"refunded", "failed", "pending"}


def run_sandbox(sandbox_id, scenario, version="1.8.2"):
    fault = (scenario.get("fault") or {}).get("behavior")
    agent = scenario.get("agent") or {}
    result = run(
        agent_id=scenario.get("agent_id") or agent.get("id") or "refund-agent",
        version=version,
        fault=fault,
        initial_state=scenario.get("initial_state"),
        prompt_hash=agent.get("prompt_hash", "sha256:demo"),
    )
    world = result["world"]
    spans = result["trace"]["spans"]
    refund_calls = world["ledger_refunds"]
    if refund_calls > 1:
        final = "double_refunded"
    elif world["refund_status"] == "refunded":
        final = "refunded"
    else:
        final = world["refund_status"] or "pending"
    passed = (
        refund_calls <= 1
        and len(spans) < 20
        and final in ALLOWED_FINAL
    )
    origin = scenario.get("origin") or {}
    rec = {
        "sandbox_id": sandbox_id,
        "scenario_id": scenario.get("scenario_id") or origin.get("scenario_id"),
        "agent_id": scenario.get("agent_id") or agent.get("id") or "refund-agent",
        "status": "verified_pass" if passed else "verified_fail",
        "invariants": {"refund_calls": refund_calls, "passed": passed},
        "final_status": final,
        "fault": scenario.get("fault"),
        "initial_state": scenario.get("initial_state"),
        "log": spans,
        "origin_trace": origin.get("trace_id") or _first_trace(scenario),
    }
    store.put_sandbox_log(rec)
    sc_id = rec.get("scenario_id")
    if sc_id:
        sc = store.get_job(sc_id)
        if sc:
            sc["status"] = rec["status"]
            store.put_job(sc)
    return rec


def get(sandbox_id):
    """GET /sandboxes/{id}"""
    rec = store.get_job(sandbox_id)
    if not rec:
        raise KeyError(sandbox_id)
    return {
        "sandbox_id": rec.get("sandbox_id") or sandbox_id,
        "status": rec.get("status"),
        "log_s3": rec.get("log_s3"),
        "invariants": rec.get("invariants"),
    }


def main(payload=None):
    payload = payload or json.loads(os.environ.get("SANDBOX_INPUT") or "{}")
    sc = payload.get("scenario") or store.get_job(payload["scenario_id"])
    if not sc:
        raise KeyError(payload.get("scenario_id"))
    return run_sandbox(
        payload["sandbox_id"],
        sc,
        payload.get("agent_version") or "1.8.2",
    )


def lambda_handler(event, context=None):
    return main(event)


def _first_trace(sc):
    ids = store.session_trace_ids(sc.get("agent_id") or "refund-agent")
    return ids[0] if ids else None


if __name__ == "__main__":
    payload = json.loads(sys.argv[1]) if len(sys.argv) > 1 else None
    print(json.dumps(main(payload)))
