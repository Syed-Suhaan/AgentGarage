from services.api import app


def test_handlers_return_templates():
    assert app.get_graph("refund-agent")["nodes"]
    assert app.get_unexplored("refund-agent")[0]["unexplored_state"]
    assert app.simulate("refund-agent", {})["scenario_id"] == "sc_19"
    assert app.start_sandbox("sc_19")["status"] == "running"
    assert app.get_sandbox("sb_07")["status"] == "verified_fail"
    assert app.list_evals()["evals"][0]["status"] == "protected"
    assert app.run_evals({}) == {"passed": 1, "failed": 0}
    assert app.seed_demo({"runs": 5}) == {"traces_written": 5}
