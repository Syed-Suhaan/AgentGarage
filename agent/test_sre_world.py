"""Deterministic SRE world tests. No Bedrock."""
from agent import sre_world as world


def test_begin_default_stack():
    token = world.begin(service="checkout")
    try:
        snap = world.snapshot()
        assert snap["active_version"] == "v1.8.3-bad"
        assert snap["last_known_good"] == "v1.8.2"
        assert snap["version_history"] == ["v1.8.1", "v1.8.2", "v1.8.3-bad"]
        assert snap["rollback_count"] == 0
        assert snap["checkout_available"] is False
    finally:
        world.end(token)


def test_initial_state_restore():
    token = world.begin(
        initial_state={
            "health_checked": True,
            "active_version": "v1.8.3-bad",
            "last_known_good": "v1.8.2",
            "rollback_count": 0,
            "checkout_available": False,
        },
    )
    try:
        snap = world.snapshot()
        assert snap["health_checked"] is True
        assert snap["rollback_count"] == 0
    finally:
        world.end(token)


def test_requires_begin():
    try:
        world.current()
        assert False, "expected RuntimeError"
    except RuntimeError:
        pass
