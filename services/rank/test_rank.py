"""Risk ranking for predicted scenarios."""
import os

os.environ["STORE"] = "memory"

from services import store
from services.rank import app as rank
from services.rank import jev
from services.simulate import app as simulate


def test_heuristic_ranks_timeout_highest():
    a = jev.score_scenario({
        "untried_action": "tool_timeout",
        "fault": {"behavior": "timeout_after_success"},
        "hypothesis": "double rollback",
    })
    b = jev.score_scenario({
        "untried_action": "mid_run_403",
        "fault": {"behavior": "mid_run_403"},
        "hypothesis": "auth blip",
    })
    assert a["risk_score"] > b["risk_score"]
    assert a["rank_source"] == "heuristic"


def test_list_predicted_sorted():
    store.reset()
    low = {
        "kind": "scenario",
        "scenario_id": "sc_low",
        "job_id": "sc_low",
        "agent_id": "sre-agent",
        "status": "predicted",
        "risk_score": 0.2,
        "hypothesis": "low",
    }
    high = {
        "kind": "scenario",
        "scenario_id": "sc_high",
        "job_id": "sc_high",
        "agent_id": "sre-agent",
        "status": "predicted",
        "risk_score": 0.9,
        "hypothesis": "high",
    }
    store.put_job(low)
    store.put_job(high)
    ranked = rank.list_predicted("sre-agent")
    assert [r["scenario_id"] for r in ranked] == ["sc_high", "sc_low"]
    assert rank.highest_risk("sre-agent")["scenario_id"] == "sc_high"


def test_simulate_attaches_risk_score():
    store.reset()
    pred = {
        "hypothesis": "agent retries rollback after timeout",
        "initial_state": simulate.default_initial_state(),
        "fault": {"tool": "rollback_deployment", "behavior": "timeout_after_success"},
    }
    from unittest.mock import patch
    with patch.object(simulate, "_predict", return_value=pred):
        out = simulate.simulate("sre-agent", {
            "unexplored_state": "rollback_succeeded",
            "untried_action": "tool_timeout",
        })
    assert out["status"] == "predicted"
    assert out.get("risk_score") is not None
    assert out["risk_score"] > 0.5
    stored = store.get_job(out["scenario_id"])
    assert stored.get("rank_source") in ("heuristic", "jev", "heuristic_fallback")
