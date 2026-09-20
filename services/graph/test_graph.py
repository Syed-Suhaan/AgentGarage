"""Graph builder tests. STORE=memory, no Bedrock."""
import os

os.environ["STORE"] = "memory"

from services import store
from services.graph import app as graph

CLEAN_SPANS = [
    {"name": "get_service_health", "tool": "get_service_health", "status": "ok"},
    {"name": "query_service_logs", "tool": "query_service_logs", "status": "ok"},
    {"name": "get_deployment_history", "tool": "get_deployment_history", "status": "ok"},
    {"name": "rollback_deployment", "tool": "rollback_deployment", "status": "ok"},
    {"name": "verify_service", "tool": "verify_service", "status": "ok"},
]


def _clean_trace(trace_id="tr_84f2"):
    return {
        "trace_id": trace_id,
        "agent_id": "sre-agent",
        "spans": CLEAN_SPANS,
    }


def test_clean_trace_observed_path():
    store.reset()
    graph.index_trace(_clean_trace())
    g = graph.graph("sre-agent")
    pairs = {(e["from"], e["action"], e["to"]) for e in g["edges"] if e["kind"] == "observed"}
    assert ("service_degraded", "get_service_health", "health_inspected") in pairs
    assert ("health_inspected", "query_service_logs", "logs_queried") in pairs
    assert ("logs_queried", "get_deployment_history", "bad_deployment_identified") in pairs
    assert ("bad_deployment_identified", "rollback_deployment", "rollback_succeeded") in pairs
    assert ("rollback_succeeded", "verify_service", "service_restored") in pairs


def test_duplicate_traces_do_not_duplicate_edges():
    store.reset()
    graph.index_trace(_clean_trace("tr_a"))
    graph.index_trace(_clean_trace("tr_b"))
    g = graph.graph("sre-agent")
    observed = [e for e in g["edges"] if e["kind"] == "observed"]
    keys = [(e["from"], e["action"], e["to"]) for e in observed]
    assert len(keys) == len(set(keys))


def test_frontier_ranks_tool_timeout_first():
    store.reset()
    graph.index_trace(_clean_trace())
    frontier = graph.unexplored("sre-agent")
    assert frontier
    assert frontier[0]["untried_action"] == "tool_timeout"
    assert frontier[0]["unexplored_state"] == "rollback_succeeded"


def test_timeout_transitions_to_rollback_timeout():
    assert graph._next("bad_deployment_identified", "rollback_deployment", "timeout") == "rollback_timeout"
    assert graph._next("rollback_timeout", "rollback_deployment", "ok") == "rollback_succeeded"


def test_lambda_defaults_to_sre_agent():
    store.reset()
    graph.index_trace(_clean_trace())
    resp = graph.lambda_handler({"path": "/agent/sre-agent/unexplored", "pathParameters": {}})
    import json
    body = json.loads(resp["body"])
    assert body[0]["untried_action"] == "tool_timeout"


if __name__ == "__main__":
    test_clean_trace_observed_path()
    test_duplicate_traces_do_not_duplicate_edges()
    test_frontier_ranks_tool_timeout_first()
    test_timeout_transitions_to_rollback_timeout()
    test_lambda_defaults_to_sre_agent()
    print("graph ok")
