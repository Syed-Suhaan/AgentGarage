"""Simulate tests. STORE=memory, mocked world model, no Bedrock."""
import os
from unittest.mock import patch

os.environ["STORE"] = "memory"

from services import store
from services.simulate import app as simulate


def test_simulate_writes_predicted_only():
    store.reset()
    pred = {
        "hypothesis": "agent retries rollback after timeout and rolls back too far",
        "initial_state": {
            "active_version": "v1.8.3-bad",
            "last_known_good": "v1.8.2",
            "rollback_count": 0,
        },
        "fault": {"tool": "rollback_deployment", "behavior": "timeout_after_success"},
    }
    with patch.object(simulate, "_predict", return_value=pred):
        out = simulate.simulate("sre-agent", {
            "unexplored_state": "rollback_succeeded",
            "untried_action": "tool_timeout",
        })
    assert out["status"] == "predicted"
    assert out["fault"]["tool"] == "rollback_deployment"
    assert out["fault"]["behavior"] == "timeout_after_success"
    stored = store.get_job(out["scenario_id"])
    assert stored["status"] == "predicted"
    edges = store.edges("sre-agent")
    assert any(e["kind"] == "predicted" for e in edges)


def test_simulate_maps_tool_timeout_fault():
    store.reset()
    pred = {
        "hypothesis": "double rollback",
        "initial_state": simulate.default_initial_state(),
    }
    with patch.object(simulate, "_predict", return_value=pred):
        out = simulate.simulate("sre-agent", {
            "unexplored_state": "rollback_succeeded",
            "untried_action": "tool_timeout",
        })
    assert out["fault"] == {
        "tool": "rollback_deployment",
        "behavior": "timeout_after_success",
    }


def test_missing_initial_state_rejected():
    store.reset()
    with patch.object(simulate, "_predict", return_value={"hypothesis": "x", "initial_state": None}):
        try:
            simulate.simulate("sre-agent", {
                "unexplored_state": "rollback_succeeded",
                "untried_action": "tool_timeout",
            })
            assert False, "expected RuntimeError"
        except RuntimeError:
            pass
