"""Architecture flow against AWS. Needs real env + Bedrock.

  STORE=memory python -m services.api.test_api   # graph/redact only, no Bedrock
  python -m agent.sre                            # one real Bedrock run
"""
import os
import sys

# Default: require AWS. Opt into memory only for local unit checks.
if "--memory" in sys.argv:
    os.environ["STORE"] = "memory"

from services import store
from services.collector import app as collector
from services.graph import app as graph


def test_redact_and_graph_memory():
    os.environ["STORE"] = "memory"
    store.reset()
    secret = collector.redact({"token": "abc", "service": "checkout"})
    assert secret["token"] == "[REDACTED]"
    trace = collector.ingest({
        "agent_id": "sre-agent",
        "spans": [
            {"name": "get_service_health", "tool": "get_service_health", "status": "ok"},
            {"name": "query_service_logs", "tool": "query_service_logs", "status": "ok"},
            {"name": "get_deployment_history", "tool": "get_deployment_history", "status": "ok"},
            {"name": "rollback_deployment", "tool": "rollback_deployment", "status": "ok"},
            {"name": "verify_service", "tool": "verify_service", "status": "ok"},
        ],
    })
    graph.index_trace(trace)
    g = graph.graph("sre-agent")
    assert any(e["kind"] == "observed" for e in g["edges"])
    frontier = graph.unexplored("sre-agent")
    assert frontier[0]["untried_action"] == "tool_timeout"


def test_real_agent_once():
    """Calls Bedrock. Skip if AWS not configured."""
    try:
        import boto3
        boto3.client("sts").get_caller_identity()
    except Exception as e:
        print("skip real agent:", e)
        return
    from agent.sre import run
    out = run(service="checkout")
    assert out["trace"]["spans"], "agent produced no tool spans"
    print("world", out["world"])


if __name__ == "__main__":
    test_redact_and_graph_memory()
    print("memory ok")
    if "--agent" in sys.argv:
        test_real_agent_once()
        print("agent ok")
