"""SRE tool tests. No Bedrock."""
from agent import sre_tools as tools
from agent import sre_world as world


def _call(fn, *args, **kwargs):
    inner = getattr(fn, "func", None) or getattr(fn, "__wrapped__", None) or fn
    return inner(*args, **kwargs)


def _run(fault=None, initial_state=None):
    return world.begin(service="checkout", fault=fault, initial_state=initial_state)


def test_normal_rollback_lands_on_last_known_good():
    token = _run()
    try:
        _call(tools.get_service_health, "checkout")
        _call(tools.query_service_logs, "checkout")
        _call(tools.get_deployment_history, "checkout")
        out = _call(tools.rollback_deployment, "checkout")
        verify = _call(tools.verify_service, "checkout")
        snap = world.snapshot()
        assert out["active_version"] == "v1.8.2"
        assert snap["rollback_count"] == 1
        assert snap["active_version"] == snap["last_known_good"]
        assert verify["healthy"] is True
        assert len(world.current()["spans"]) == 5
        assert {s["tool"] for s in world.current()["spans"]} == {
            "get_service_health",
            "query_service_logs",
            "get_deployment_history",
            "rollback_deployment",
            "verify_service",
        }
    finally:
        world.end(token)


def test_timeout_after_success_applies_then_raises():
    token = _run(fault="timeout_after_success")
    try:
        try:
            _call(tools.rollback_deployment, "checkout")
            assert False, "expected TimeoutError"
        except TimeoutError:
            pass
        snap = world.snapshot()
        assert snap["rollback_count"] == 1
        assert snap["active_version"] == "v1.8.2"
        span = world.current()["spans"][-1]
        assert span["status"] == "timeout"
    finally:
        world.end(token)


def test_retry_without_token_rolls_back_too_far():
    token = _run(fault="timeout_after_success")
    try:
        try:
            _call(tools.rollback_deployment, "checkout")
        except TimeoutError:
            pass
        _call(tools.rollback_deployment, "checkout")
        snap = world.snapshot()
        assert snap["rollback_count"] == 2
        assert snap["active_version"] == "v1.8.1"
        assert snap["active_version"] != snap["last_known_good"]
        verify = _call(tools.verify_service, "checkout")
        assert verify["healthy"] is False
    finally:
        world.end(token)


def test_retry_with_same_token_is_noop():
    token = _run(fault="timeout_after_success")
    try:
        try:
            _call(tools.rollback_deployment, "checkout", operation_token="rollback-checkout")
        except TimeoutError:
            pass
        again = _call(tools.rollback_deployment, "checkout", operation_token="rollback-checkout")
        snap = world.snapshot()
        assert snap["rollback_count"] == 1
        assert snap["active_version"] == "v1.8.2"
        assert again.get("duplicate") is True or again.get("error") == "timeout"
        verify = _call(tools.verify_service, "checkout")
        assert verify["healthy"] is True
    finally:
        world.end(token)


def test_verify_healthy_only_at_last_known_good():
    token = _run()
    try:
        before = _call(tools.verify_service, "checkout")
        assert before["healthy"] is False
        _call(tools.rollback_deployment, "checkout")
        after = _call(tools.verify_service, "checkout")
        assert after["healthy"] is True
    finally:
        world.end(token)
