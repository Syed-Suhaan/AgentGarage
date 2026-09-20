"""Shared deployment state for SRE tools. Mutated by tool calls during one agent run."""
from __future__ import annotations

import contextvars

_CTX: contextvars.ContextVar[dict | None] = contextvars.ContextVar("sre_world", default=None)

OLDER = "v1.8.1"
LAST_KNOWN_GOOD = "v1.8.2"
BAD_ACTIVE = "v1.8.3-bad"
DEFAULT_HISTORY = (OLDER, LAST_KNOWN_GOOD, BAD_ACTIVE)


def begin(
    *,
    service="checkout",
    fault=None,
    initial_state=None,
    idempotent=False,
):
    world = {
        "service": service,
        "active_version": BAD_ACTIVE,
        "version_history": list(DEFAULT_HISTORY),
        "last_known_good": LAST_KNOWN_GOOD,
        "rollback_count": 0,
        "operation_tokens": set(),
        "token_results": {},
        "checkout_available": False,
        "health_checked": False,
        "logs_queried": False,
        "deployment_checked": False,
        "verified_after_remediation": False,
        "fault": fault,
        "idempotent": idempotent,
        "spans": [],
        "alarms": ["CheckoutErrorRateHigh", "DeploymentUnhealthy"],
        "logs": [
            f"{BAD_ACTIVE} raised 5xx on /checkout after deploy",
            f"last_known_good={LAST_KNOWN_GOOD}",
        ],
    }
    if initial_state:
        for key in (
            "service",
            "active_version",
            "last_known_good",
            "checkout_available",
            "health_checked",
            "logs_queried",
            "deployment_checked",
            "verified_after_remediation",
            "fault",
        ):
            if key in initial_state:
                world[key] = initial_state[key]
        if "rollback_count" in initial_state:
            world["rollback_count"] = int(initial_state["rollback_count"] or 0)
        if "version_history" in initial_state and initial_state["version_history"]:
            world["version_history"] = list(initial_state["version_history"])
        tokens = initial_state.get("operation_tokens")
        if tokens:
            world["operation_tokens"] = set(tokens)
    return _CTX.set(world)


def current():
    w = _CTX.get()
    if w is None:
        raise RuntimeError("sre world not started; call sre_world.begin() first")
    return w


def end(token):
    _CTX.reset(token)


def snapshot():
    w = current()
    return {
        "service": w["service"],
        "active_version": w["active_version"],
        "last_known_good": w["last_known_good"],
        "rollback_count": w["rollback_count"],
        "checkout_available": w["checkout_available"],
        "health_checked": w["health_checked"],
        "logs_queried": w["logs_queried"],
        "deployment_checked": w["deployment_checked"],
        "verified_after_remediation": w["verified_after_remediation"],
        "version_history": list(w["version_history"]),
    }


class LoopBudgetExceeded(RuntimeError):
    """Raised when a sandbox agent loop exceeds LOOP_BUDGET tool calls.

    The buggy agent can retry forever on ambiguous faults; the budget stops
    the loop so a Lambda sandbox always finishes. Partial spans + world are
    kept, so invariants still render the correct (failing) verdict.
    """


# Worst case wall-clock per tool call is one Bedrock round-trip (~5-15s).
# 12 calls ≈ 1-3 min, safely inside the sandbox Lambda timeout. Clean runs
# use ~6 spans; only pathological retry loops ever hit this.
LOOP_BUDGET = 12


def record_span(tool, args, result, status, duration_ms):
    current()["spans"].append({
        "name": tool,
        "tool": tool,
        "args": args,
        "result": result if isinstance(result, dict) else {"value": result},
        "status": status,
        "duration_ms": duration_ms,
    })
    if len(current()["spans"]) >= LOOP_BUDGET:
        raise LoopBudgetExceeded(f"sandbox loop budget hit ({LOOP_BUDGET} tool calls)")
