"""Architecture flow against AWS. Needs real env + Bedrock.

  STORE=memory python -m services.api.test_api   # graph/redact only, no Bedrock
  python -m agent.refund                         # one real Bedrock run
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
    secret = collector.redact({"token": "abc", "order_id": "o_9"})
    assert secret["token"] == "[REDACTED]"
    trace = collector.ingest({
        "agent_id": "refund-agent",
        "spans": [
            {"name": "verify_customer", "tool": "verify_customer", "status": "ok"},
            {"name": "get_order", "tool": "get_order", "status": "ok"},
            {"name": "issue_refund", "tool": "issue_refund", "status": "ok"},
            {"name": "send_email", "tool": "send_email", "status": "ok"},
        ],
    })
    graph.index_trace(trace)
    g = graph.graph("refund-agent")
    assert any(e["kind"] == "observed" for e in g["edges"])
    frontier = graph.unexplored("refund-agent")
    assert frontier[0]["untried_action"] == "tool_timeout"


def test_real_agent_once():
    """Calls Bedrock. Skip if AWS not configured."""
    try:
        import boto3
        boto3.client("sts").get_caller_identity()
    except Exception as e:
        print("skip real agent:", e)
        return
    from agent.refund import run
    out = run(customer_id="c_smoke", order_id="o_smoke")
    assert out["trace"]["spans"], "agent produced no tool spans"
    print("world", out["world"])


if __name__ == "__main__":
    test_redact_and_graph_memory()
    print("memory ok")
    if "--agent" in sys.argv:
        test_real_agent_once()
        print("agent ok")
