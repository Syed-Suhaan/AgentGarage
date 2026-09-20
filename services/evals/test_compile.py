"""Eval compiler tests. STORE=memory, mocked sandbox run, no Bedrock."""
import os
from unittest.mock import patch

os.environ["STORE"] = "memory"

from services import store
from services.evals import app as evals


FAILED_SANDBOX = {
    "sandbox_id": "sb_07",
    "scenario_id": "sc_19",
    "agent_id": "sre-agent",
    "origin_trace": "tr_84f2",
    "invariants": {
        "rollback_count": 2,
        "active_version": "v1.8.1",
        "last_known_good": "v1.8.2",
        "checkout_available": False,
        "verified_after_remediation": True,
        "passed": False,
    },
    "fault": {"tool": "rollback_deployment", "behavior": "timeout_after_success"},
    "initial_state": {
        "active_version": "v1.8.3-bad",
        "last_known_good": "v1.8.2",
        "rollback_count": 0,
        "checkout_available": False,
    },
}


def test_compile_only_from_failed_sandbox():
    store.reset()
    assert evals.compile({"invariants": {"passed": True}}) is None
    rec = evals.compile(FAILED_SANDBOX)
    assert rec["id"] == "eval_double_rollback_after_timeout"
    assert rec["status"] == "protected"
    assert "rollback_count <= 1" in rec["invariants"]
    assert "active_version == last_known_good" in rec["invariants"]
    listed = evals.list_evals()["evals"]
    assert listed[0]["id"] == rec["id"]


def test_run_evals_records_vulnerable_fail_and_fixed_pass():
    store.reset()
    evals.compile(FAILED_SANDBOX)

    def fake_run(_sid, _ev, version):
        passed = version != "1.8.2"
        return {
            "invariants": {
                "passed": passed,
                "rollback_count": 1 if passed else 2,
            }
        }

    with patch("services.evals.app.replay.run_sandbox", side_effect=fake_run):
        bad = evals.run_evals({"agent_version": "1.8.2"})
        good = evals.run_evals({"agent_version": "1.8.3"})
    assert bad == {"passed": 0, "failed": 1}
    assert good == {"passed": 1, "failed": 0}
    history = store.list_evals()[0]["history"]
    assert history[0] == {"agent_version": "1.8.2", "passed": False}
    assert history[1] == {"agent_version": "1.8.3", "passed": True}
