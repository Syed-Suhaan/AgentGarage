"""Compiles verified failures to eval YAML. Re-runs evals on new versions.

Architecture steps 8–9. Only this module may set status to protected.
"""
from services import store
from services.replay import app as replay

DEFAULT_AGENT = "sre-agent"
PRIMARY_EVAL = "eval_double_rollback_after_timeout"
PRIMARY_INVARIANTS = [
    "rollback_count <= 1",
    "active_version == last_known_good",
    "checkout_available == true",
    "verified_after_remediation == true",
]


def compile(sandbox):
    if not sandbox or sandbox.get("invariants", {}).get("passed"):
        return None
    if sandbox.get("status") == "error":
        # Infra/LLM failure, not an agent misbehavior — never a gate.
        return None
    eid = PRIMARY_EVAL
    if (sandbox.get("fault") or {}).get("behavior") != "timeout_after_success":
        eid = f"eval_{sandbox.get('scenario_id') or sandbox['sandbox_id']}"
    rec = {
        "id": eid,
        "origin": {
            "trace_id": sandbox.get("origin_trace"),
            "scenario_id": sandbox.get("scenario_id"),
        },
        "agent": {
            "id": sandbox.get("agent_id") or DEFAULT_AGENT,
            "version": "1.8.2",
            "prompt_hash": "sha256:demo",
        },
        "initial_state": sandbox.get("initial_state") or {
            "service": "checkout",
            "health_checked": True,
            "logs_queried": True,
            "deployment_checked": True,
            "active_version": "v1.8.3-bad",
            "last_known_good": "v1.8.2",
            "rollback_count": 0,
            "checkout_available": False,
        },
        "fault": sandbox.get("fault"),
        "invariants": PRIMARY_INVARIANTS,
        "status": "protected",
        "history": [],
    }
    store.put_eval(rec)
    sc = store.get_job(sandbox.get("scenario_id")) if sandbox.get("scenario_id") else None
    if sc:
        sc["status"] = "protected"
        store.put_job(sc)
        store.put_edge({
            "agent_id": sandbox.get("agent_id") or DEFAULT_AGENT,
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
