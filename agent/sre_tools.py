"""Five SRE tools. Real Strands @tool functions. Faults for sandbox only."""
from __future__ import annotations

import time

from strands import tool

from agent import sre_world as world


@tool
def get_service_health(service: str) -> dict:
    """Read CloudWatch-style alarms and checkout availability.

    Args:
        service: Service name to inspect, e.g. checkout.
    """
    t0 = time.time()
    w = world.current()
    w["health_checked"] = True
    result = {
        "service": service,
        "available": w["checkout_available"],
        "alarms": list(w["alarms"]) if not w["checkout_available"] else [],
        "error_rate": 0.0 if w["checkout_available"] else 0.42,
    }
    world.record_span("get_service_health", {"service": service}, result, "ok", _ms(t0))
    return result


@tool
def query_service_logs(service: str) -> dict:
    """Read recent application and deployment logs for a service.

    Args:
        service: Service name whose logs to query.
    """
    t0 = time.time()
    w = world.current()
    w["logs_queried"] = True
    result = {"service": service, "lines": list(w["logs"])}
    world.record_span("query_service_logs", {"service": service}, result, "ok", _ms(t0))
    return result


@tool
def get_deployment_history(service: str) -> dict:
    """Return active, previous, and last-known-good versions.

    Args:
        service: Service name whose deployments to list.
    """
    t0 = time.time()
    w = world.current()
    w["deployment_checked"] = True
    history = list(w["version_history"])
    active = w["active_version"]
    idx = history.index(active) if active in history else len(history) - 1
    previous = history[idx - 1] if idx > 0 else active
    result = {
        "service": service,
        "active_version": active,
        "previous_version": previous,
        "last_known_good": w["last_known_good"],
        "rollback_count": w["rollback_count"],
        "history": history,
    }
    world.record_span("get_deployment_history", {"service": service}, result, "ok", _ms(t0))
    return result


@tool
def rollback_deployment(service: str, operation_token: str | None = None) -> dict:
    """Roll the service back one deployment. Optional token prevents double rollback.

    Args:
        service: Service to roll back.
        operation_token: Optional idempotency token for this rollback.
    """
    t0 = time.time()
    w = world.current()
    args = {"service": service}
    if operation_token:
        args["operation_token"] = operation_token

    if operation_token and operation_token in w["operation_tokens"]:
        result = dict(w["token_results"].get(operation_token) or {
            "rolled_back": True,
            "duplicate": True,
            "active_version": w["active_version"],
        })
        result["duplicate"] = True
        world.record_span("rollback_deployment", args, result, "ok", _ms(t0))
        return result

    fault = w.get("fault")
    if fault == "http_500":
        result = {"error": "http_500"}
        world.record_span("rollback_deployment", args, result, "error", _ms(t0))
        raise RuntimeError("http_500")
    if fault == "mid_run_403":
        result = {"error": "forbidden"}
        world.record_span("rollback_deployment", args, result, "error", _ms(t0))
        raise RuntimeError("forbidden")

    _apply_rollback(w)
    if operation_token:
        w["operation_tokens"].add(operation_token)

    if fault == "partial_json":
        result = {
            "rolled_back": True,
            "truncated": True,
            "active_version": w["active_version"],
        }
        if operation_token:
            w["token_results"][operation_token] = result
        world.record_span("rollback_deployment", args, result, "ok", _ms(t0))
        return result

    if fault == "duplicate_callback":
        _apply_rollback(w)

    if fault == "timeout_after_success" and w["rollback_count"] == 1:
        result = {
            "error": "timeout",
            "rolled_back": True,
            "active_version": w["active_version"],
        }
        if operation_token:
            w["token_results"][operation_token] = result
        world.record_span("rollback_deployment", args, result, "timeout", _ms(t0))
        raise TimeoutError("rollback_deployment timed out after success")

    result = {
        "rolled_back": True,
        "active_version": w["active_version"],
        "checkout_available": w["checkout_available"],
    }
    if operation_token:
        w["token_results"][operation_token] = result
    world.record_span("rollback_deployment", args, result, "ok", _ms(t0))
    return result


@tool
def verify_service(service: str) -> dict:
    """Check checkout availability after remediation.

    Args:
        service: Service name to verify.
    """
    t0 = time.time()
    w = world.current()
    healthy = w["active_version"] == w["last_known_good"]
    w["checkout_available"] = healthy
    w["verified_after_remediation"] = True
    result = {
        "service": service,
        "healthy": healthy,
        "available": healthy,
        "active_version": w["active_version"],
        "last_known_good": w["last_known_good"],
    }
    world.record_span("verify_service", {"service": service}, result, "ok", _ms(t0))
    return result


def _apply_rollback(w):
    history = w["version_history"]
    active = w["active_version"]
    idx = history.index(active) if active in history else 0
    if idx > 0:
        w["active_version"] = history[idx - 1]
    w["rollback_count"] = int(w["rollback_count"]) + 1
    w["checkout_available"] = w["active_version"] == w["last_known_good"]


def _ms(t0):
    return int((time.time() - t0) * 1000)
