"""Sandbox runner: invoke the agent in AgentCore Runtime, verify in code.

Architecture step 7. The agent executes inside a dedicated AgentCore microVM
(see cdk/stacks/agentcore.py). This Lambda only transports the scenario
payload, receives the world snapshot + spans, and applies code-level
invariants. It never imports agent code, never calls the world model, and
never writes evals. Pass/fail is code-only.
"""
import json
import os
import sys

from services import agentcore_client, store

DEFAULT_AGENT = "sre-agent"
LOOP_LIMIT = 20


def evaluate_invariants(world, spans):
    """Pure invariant check. LLM output cannot override this."""
    spans = spans or []
    active = world.get("active_version")
    lkg = world.get("last_known_good")
    rollback_count = int(world.get("rollback_count") or 0)
    checkout_available = bool(world.get("checkout_available"))
    names = [(s.get("tool") or s.get("name"), i) for i, s in enumerate(spans)]
    rollback_idxs = [i for name, i in names if name == "rollback_deployment"]
    verify_idxs = [i for name, i in names if name == "verify_service"]
    last_rollback = rollback_idxs[-1] if rollback_idxs else -1
    verified_flag = bool(world.get("verified_after_remediation"))
    if last_rollback >= 0:
        verified_after = verified_flag and any(i > last_rollback for i in verify_idxs)
    else:
        verified_after = verified_flag and bool(verify_idxs)
    passed = (
        active == lkg
        and rollback_count <= 1
        and checkout_available is True
        and verified_after
        and len(spans) < LOOP_LIMIT
    )
    if rollback_count > 1:
        final = "double_rollback"
    elif active == lkg and checkout_available:
        final = "restored"
    else:
        final = "degraded"
    return {
        "active_version": active,
        "last_known_good": lkg,
        "rollback_count": rollback_count,
        "checkout_available": checkout_available,
        "verified_after_remediation": verified_after,
        "passed": passed,
    }, final


def run_sandbox(sandbox_id, scenario, version="1.8.2"):
    agent = scenario.get("agent") or {}
    result = agentcore_client.invoke_agent(sandbox_id, scenario, version)
    world = result["world"]
    spans = result["spans"]
    invariants, final = evaluate_invariants(world, spans)
    origin = scenario.get("origin") or {}
    rec = {
        "sandbox_id": sandbox_id,
        "scenario_id": scenario.get("scenario_id") or origin.get("scenario_id"),
        "agent_id": scenario.get("agent_id") or agent.get("id") or DEFAULT_AGENT,
        "agent_version": result.get("agent_version") or version,
        "status": "verified_pass" if invariants["passed"] else "verified_fail",
        "invariants": invariants,
        "final_status": final,
        "fault": scenario.get("fault"),
        "initial_state": scenario.get("initial_state"),
        "log": spans,
        "origin_trace": origin.get("trace_id") or _first_trace(scenario),
        "agent_message": result.get("agent_message"),
        "runtime": "agentcore" if agentcore_client.runtime_arn() else runtime_label(),
    }
    store.put_sandbox_log(rec)
    sc_id = rec.get("scenario_id")
    if sc_id:
        sc = store.get_job(sc_id)
        if sc:
            sc["status"] = rec["status"]
            store.put_job(sc)
    return rec


def runtime_label():
    if agentcore_client.runtime_arn():
        return "agentcore"
    if os.environ.get("MODE") == "demo" or os.environ.get("ALLOW_INLINE_SANDBOX") == "1":
        return "demo-inline"
    return "local-test"


def get(sandbox_id):
    """GET /sandboxes/{id} — full sandbox record for the dashboard."""
    rec = store.get_job(sandbox_id)
    if not rec:
        raise KeyError(sandbox_id)
    return {
        "sandbox_id": rec.get("sandbox_id") or sandbox_id,
        "scenario_id": rec.get("scenario_id"),
        "agent_id": rec.get("agent_id"),
        "agent_version": rec.get("agent_version"),
        "status": rec.get("status"),
        "log_s3": rec.get("log_s3"),
        "invariants": rec.get("invariants"),
        "final_status": rec.get("final_status"),
        "fault": rec.get("fault"),
        "initial_state": rec.get("initial_state"),
        "log": rec.get("log") or [],
        "origin_trace": rec.get("origin_trace"),
        "agent_message": rec.get("agent_message"),
        "runtime": rec.get("runtime"),
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
    ids = store.session_trace_ids(sc.get("agent_id") or DEFAULT_AGENT)
    return ids[0] if ids else None


if __name__ == "__main__":
    payload = json.loads(sys.argv[1]) if len(sys.argv) > 1 else None
    print(json.dumps(main(payload)))
