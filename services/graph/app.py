"""Builds state edges into Neptune. Finds untried state-action pairs.

Architecture steps 4–5. Trigger: EventBridge on a new trace in S3.
"""
from urllib.parse import unquote_plus

from services import store

START = "service_degraded"
DEFAULT_AGENT = "sre-agent"

# Legal next state after (state, tool).
NEXT = {
    ("service_degraded", "get_service_health"): "health_inspected",
    ("health_inspected", "query_service_logs"): "logs_queried",
    ("logs_queried", "get_deployment_history"): "bad_deployment_identified",
    ("bad_deployment_identified", "rollback_deployment"): "rollback_succeeded",
    ("rollback_failed", "rollback_deployment"): "rollback_succeeded",
    ("rollback_succeeded", "verify_service"): "service_restored",
    ("rollback_timeout", "rollback_deployment"): "rollback_succeeded",
}

# Tools/faults the agent may try from each state.
LEGAL = {
    "service_degraded": ["get_service_health"],
    "health_inspected": ["query_service_logs"],
    "logs_queried": ["get_deployment_history"],
    "bad_deployment_identified": [
        "rollback_deployment",
        "duplicate_callback",
        "http_500",
        "partial_json",
        "mid_run_403",
    ],
    "rollback_succeeded": ["verify_service", "tool_timeout"],
    "rollback_failed": ["rollback_deployment", "verify_service"],
    "service_restored": [],
    "rollback_timeout": ["rollback_deployment"],
}

# Demo path: timeout after rollback succeeded is the path we highlight first.
RANK = {"tool_timeout": 0, "duplicate_callback": 1}


def index_trace(trace):
    """Write observed edges for one redacted trace."""
    agent_id = trace.get("agent_id") or DEFAULT_AGENT
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


def _ensure_edges(agent_id):
    """Rebuild in-memory edges from persisted traces when the edge index is
    empty. The SAM demo has no Neptune and no EventBridge graph builder, so a
    fresh Lambda container would otherwise return an empty graph even though
    traces exist in S3/DynamoDB. Demo-scale only."""
    if store.edges(agent_id):
        return
    try:
        traces = store.list_traces(agent_id, limit=50)
    except Exception:
        return
    for trace in traces:
        try:
            index_trace(trace)
        except Exception:
            continue


def graph(agent_id):
    """GET /agent/{id}/graph"""
    _ensure_edges(agent_id)
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
    if tool == "rollback_deployment" and status == "timeout":
        return "rollback_timeout"
    if tool == "rollback_deployment" and status != "ok":
        return "rollback_failed"
    return NEXT.get((state, tool), state)


def lambda_handler(event, context=None):
    """API Gateway (graph/unexplored) or S3/EventBridge (index)."""
    path = event.get("path") or event.get("rawPath") or ""
    params = event.get("pathParameters") or {}
    agent_id = params.get("id") or DEFAULT_AGENT
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
