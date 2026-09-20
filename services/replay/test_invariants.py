"""Invariant tests. No Bedrock."""
from services.replay.app import evaluate_invariants


def _spans(*tools, extra=None):
    out = [{"name": t, "tool": t, "status": "ok"} for t in tools]
    if extra:
        out.extend(extra)
    return out


def test_vulnerable_timeout_retry_fails():
    world = {
        "active_version": "v1.8.1",
        "last_known_good": "v1.8.2",
        "rollback_count": 2,
        "checkout_available": False,
        "verified_after_remediation": True,
    }
    spans = _spans(
        "get_service_health",
        "query_service_logs",
        "get_deployment_history",
        "rollback_deployment",
        "rollback_deployment",
        "verify_service",
    )
    inv, final = evaluate_invariants(world, spans)
    assert inv["passed"] is False
    assert inv["rollback_count"] == 2
    assert final == "double_rollback"


def test_fixed_retry_passes():
    world = {
        "active_version": "v1.8.2",
        "last_known_good": "v1.8.2",
        "rollback_count": 1,
        "checkout_available": True,
        "verified_after_remediation": True,
    }
    spans = _spans(
        "get_service_health",
        "get_deployment_history",
        "rollback_deployment",
        "get_deployment_history",
        "verify_service",
    )
    inv, final = evaluate_invariants(world, spans)
    assert inv["passed"] is True
    assert final == "restored"


def test_wrong_version_fails_even_with_one_rollback():
    world = {
        "active_version": "v1.8.1",
        "last_known_good": "v1.8.2",
        "rollback_count": 1,
        "checkout_available": False,
        "verified_after_remediation": True,
    }
    spans = _spans("rollback_deployment", "verify_service")
    inv, _ = evaluate_invariants(world, spans)
    assert inv["passed"] is False


def test_missing_post_remediation_verify_fails():
    world = {
        "active_version": "v1.8.2",
        "last_known_good": "v1.8.2",
        "rollback_count": 1,
        "checkout_available": True,
        "verified_after_remediation": False,
    }
    spans = _spans("rollback_deployment")
    inv, _ = evaluate_invariants(world, spans)
    assert inv["passed"] is False
    assert inv["verified_after_remediation"] is False


def test_model_claim_cannot_override_failed_invariants():
    world = {
        "active_version": "v1.8.1",
        "last_known_good": "v1.8.2",
        "rollback_count": 2,
        "checkout_available": False,
        "verified_after_remediation": True,
        "agent_message": "checkout restored successfully",
    }
    spans = _spans("rollback_deployment", "rollback_deployment", "verify_service")
    inv, _ = evaluate_invariants(world, spans)
    assert inv["passed"] is False


def test_verify_before_last_rollback_fails():
    world = {
        "active_version": "v1.8.2",
        "last_known_good": "v1.8.2",
        "rollback_count": 1,
        "checkout_available": True,
        "verified_after_remediation": True,
    }
    spans = _spans("verify_service", "rollback_deployment")
    inv, _ = evaluate_invariants(world, spans)
    assert inv["passed"] is False
