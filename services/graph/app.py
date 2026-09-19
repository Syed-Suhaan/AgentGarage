"""Builds state edges into OpenSearch. Finds untried state-action pairs.

Architecture steps 4–5. Trigger: EventBridge on a new trace in S3.
"""
from urllib.parse import unquote_plus

from services import store

START = "customer_unverified"

# Legal next state after (state, tool).
NEXT = {
    ("customer_unverified", "verify_customer"): "customer_verified",
    ("customer_verified", "get_order"): "refund_pending",
    ("refund_pending", "issue_refund"): "refund_succeeded",
    ("refund_failed", "issue_refund"): "refund_succeeded",
    ("refund_succeeded", "send_email"): "email_sent",
    ("tool_timeout", "issue_refund"): "refund_succeeded",
}

# Tools/faults the agent may try from each state (vocab.json + demo path).
LEGAL = {
    "customer_unverified": ["verify_customer"],
    "customer_verified": ["get_order"],
    "order_loaded": ["issue_refund"],
    "refund_pending": ["issue_refund", "duplicate_callback", "http_500", "partial_json", "mid_run_403"],
    "refund_succeeded": ["send_email", "tool_timeout"],
    "refund_failed": ["issue_refund", "send_email"],
    "email_sent": [],
    "tool_timeout": ["issue_refund"],
}

# docs/demo.md: timeout after refund succeeded is the path we highlight first.
RANK = {"tool_timeout": 0, "duplicate_callback": 1}


def index_trace(trace):
    """Write observed edges for one redacted trace."""
    agent_id = trace.get("agent_id") or "refund-agent"
    state = START
    for span in trace.get("spans") or []:
        tool = span.get("tool") or span.get("name")
        nxt = _next(state, tool, span.get("status") or "ok")
        store.put_edge({
            "agent_id": agent_id,
            "from": state,
            "action": tool,
            "to": nxt,
            "kind": "observed",
            "source": trace.get("trace_id"),
        })
        state = nxt


def graph(agent_id):
    """GET /agent/{id}/graph"""
    nodes = {}
    edges = []
    seen = set()
    for e in store.edges(agent_id):
        nodes[e.get("from")] = True
        nodes[e.get("to")] = True
        ek = (e.get("from"), e.get("action"), e.get("to"), e.get("kind"))
        if ek in seen:
            continue
        seen.add(ek)
        edges.append({
            "from": e.get("from"),
            "action": e.get("action"),
            "to": e.get("to"),
            "kind": e.get("kind"),
            "source": e.get("source"),
        })
    return {
        "nodes": [{"id": n, "label": n} for n in nodes if n],
        "edges": edges,
    }


def unexplored(agent_id):
    """GET /agent/{id}/unexplored — legal pairs with no observed run."""
    g = graph(agent_id)
    observed = {(e["from"], e["action"]) for e in g["edges"] if e["kind"] == "observed"}
    support = store.session_trace_ids(agent_id)
    out = []
    for state in [n["id"] for n in g["nodes"]]:
        for action in LEGAL.get(state, []):
            if (state, action) in observed:
                continue
            out.append({
                "unexplored_state": state,
                "untried_action": action,
                "support_traces": support,
            })
    out.sort(key=lambda r: RANK.get(r["untried_action"], 9))
    return out


def _next(state, tool, status):
    if tool == "issue_refund" and status == "timeout":
        return "tool_timeout"
    if tool == "issue_refund" and status != "ok":
        return "refund_failed"
    return NEXT.get((state, tool), state)


def lambda_handler(event, context=None):
    """API Gateway (graph/unexplored) or S3/EventBridge (index)."""
    path = event.get("path") or event.get("rawPath") or ""
    params = event.get("pathParameters") or {}
    agent_id = params.get("id") or "refund-agent"
    if "/unexplored" in path:
        body = unexplored(agent_id)
        return _api(200, body)
    if "/graph" in path:
        return _api(200, graph(agent_id))

    n = 0
    for rec in event.get("Records") or []:
        s3 = rec.get("s3") or {}
        bucket = (s3.get("bucket") or {}).get("name")
        key = (s3.get("object") or {}).get("key")
        if bucket and key:
            trace = store.get_trace_from_s3(bucket, unquote_plus(key))
            if trace:
                index_trace(trace)
                n += 1
    detail = event.get("detail") or {}
    bucket = (detail.get("bucket") or {}).get("name")
    key = (detail.get("object") or {}).get("key")
    if bucket and key:
        trace = store.get_trace_from_s3(bucket, unquote_plus(key))
        if trace:
            index_trace(trace)
            n += 1
    return {"indexed": n}


def _api(status, body):
    import json
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps(body),
    }
