"""Compiles verified failures to eval YAML. Re-runs evals on new versions.

Architecture steps 8–9. Only this module may set status to protected.
"""
from services import store
from services.replay import app as replay


def compile(sandbox):
    if not sandbox or sandbox.get("invariants", {}).get("passed"):
        return None
    eid = "eval_duplicate_refund_after_timeout"
    if (sandbox.get("fault") or {}).get("behavior") != "timeout_after_success":
        eid = f"eval_{sandbox.get('scenario_id') or sandbox['sandbox_id']}"
    rec = {
        "id": eid,
        "origin": {
            "trace_id": sandbox.get("origin_trace"),
            "scenario_id": sandbox.get("scenario_id"),
        },
        "agent": {
            "id": sandbox.get("agent_id") or "refund-agent",
            "version": "1.8.2",
            "prompt_hash": "sha256:demo",
        },
        "initial_state": sandbox.get("initial_state") or {
            "customer_verified": True,
            "refund_status": "pending",
            "ledger_refunds": 0,
        },
        "fault": sandbox.get("fault"),
        "invariants": ["refund_calls <= 1", "final_status != double_refunded"],
        "status": "protected",
        "history": [],
    }
    store.put_eval(rec)
    sc = store.get_job(sandbox.get("scenario_id")) if sandbox.get("scenario_id") else None
    if sc:
        sc["status"] = "protected"
        store.put_job(sc)
        store.put_edge({
            "agent_id": sandbox.get("agent_id") or "refund-agent",
            "from": sc.get("unexplored_state"),
            "action": sc.get("untried_action"),
            "to": "unknown",
            "kind": "verified",
            "source": sc.get("scenario_id"),
        })
    return rec


def list_evals():
    """GET /evals"""
    return {"evals": store.list_evals()}


def run_evals(body):
    """POST /evals/run — docs/demo.md step 6."""
    version = (body or {}).get("agent_version") or "1.8.3"
    passed = failed = 0
    for ev in store.list_evals():
        rec = replay.run_sandbox(store.nid("sb"), ev, version)
        ok = rec["invariants"]["passed"]
        ev.setdefault("history", []).append(
            {"agent_version": version, "passed": ok}
        )
        store.put_eval(ev)
        if ok:
            passed += 1
        else:
            failed += 1
    return {"passed": passed, "failed": failed}


def lambda_handler(event, context=None):
    """Step Functions last step: sandbox result in, eval YAML out."""
    sandbox = event
    if event.get("sandbox_id") and not event.get("invariants"):
        sandbox = store.get_job(event["sandbox_id"])
    return compile(sandbox) or {"compiled": False}
