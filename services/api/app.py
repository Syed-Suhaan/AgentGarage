"""Route handlers for graph, frontier, simulate, replay, evals.

API Gateway entry. Starts Step Functions for sandboxes. Does not run the
agent and does not compile evals.
"""
import json
import os
import re

from services import agentcore_client, store
from services.collector import app as collector
from services.evals import app as evals
from services.graph import app as graph
from services.rank import highest_risk, list_predicted
from services.replay import app as replay
from services.simulate import app as simulate_svc

CORS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "content-type,authorization,x-api-key",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
}


def get_graph(agent_id):
    return graph.graph(agent_id)


def get_unexplored(agent_id):
    return graph.unexplored(agent_id)


def simulate(agent_id, body):
    return simulate_svc.simulate(agent_id, body)


def list_scenarios(agent_id):
    """Predicted scenarios ranked by risk_score (highest first)."""
    rows = list_predicted(agent_id)
    return {
        "scenarios": [
            {
                "scenario_id": s.get("scenario_id"),
                "unexplored_state": s.get("unexplored_state"),
                "untried_action": s.get("untried_action"),
                "fault": s.get("fault"),
                "hypothesis": s.get("hypothesis"),
                "initial_state": s.get("initial_state"),
                "status": s.get("status"),
                "risk_score": s.get("risk_score"),
                "failure_likelihood": s.get("failure_likelihood"),
                "blast_radius": s.get("blast_radius"),
                "jev_confidence": s.get("jev_confidence"),
                "rank_source": s.get("rank_source"),
            }
            for s in rows
        ]
    }


def next_sandbox(agent_id):
    """Highest-risk predicted scenario ready for sandbox."""
    top = highest_risk(agent_id)
    if not top:
        return {"scenario_id": None}
    return {
        "scenario_id": top.get("scenario_id"),
        "risk_score": top.get("risk_score"),
        "hypothesis": top.get("hypothesis"),
        "rank_source": top.get("rank_source"),
    }


def start_sandbox(scenario_id):
    """POST /scenarios/{id}/sandbox → Step Functions → AgentCore Runtime."""
    arn = os.environ.get("STATE_MACHINE_ARN")
    if not arn:
        raise RuntimeError("STATE_MACHINE_ARN is required")
    sc = store.get_job(scenario_id)
    if not sc:
        raise KeyError(scenario_id)
    sid = store.nid("sb")
    store.put_job({
        "id": sid,
        "kind": "sandbox",
        "sandbox_id": sid,
        "scenario_id": scenario_id,
        "agent_id": sc.get("agent_id"),
        "status": "running",
    })
    import boto3
    boto3.client("stepfunctions").start_execution(
        stateMachineArn=arn,
        name=sid[:80],
        input=json.dumps({
            "sandbox_id": sid,
            "scenario_id": scenario_id,
            "agent_version": "1.8.2",
        }),
    )
    return {"sandbox_id": sid, "status": "running"}


def get_sandbox(sandbox_id):
    return replay.get(sandbox_id)


def list_evals():
    return evals.list_evals()


def run_evals(body):
    return evals.run_evals(body)


def seed_demo(body):
    """POST /demo/seed — run clean tasks inside AgentCore Runtime, ingest traces."""
    import uuid

    runs = int((body or {}).get("runs") or 5)
    ids = []
    for _ in range(runs):
        result = agentcore_client.invoke_agent(
            f"seed-{uuid.uuid4().hex[:8]}",
            {
                "agent_id": "sre-agent",
                "agent": {"id": "sre-agent"},
                "initial_state": {"service": "checkout"},
                "fault": {},
            },
            "1.8.2",
        )
        trace = collector.ingest({
            "agent_id": result.get("agent_id") or "sre-agent",
            "agent_version": result.get("agent_version") or "1.8.2",
            "spans": result["spans"],
        })
        ids.append(trace["trace_id"])
    return {"traces_written": len(ids)}


def dispatch(method, path, body=None):
    method = (method or "GET").upper()
    path = path.split("?")[0]
    if not path.startswith("/"):
        path = "/" + path
    path = path.rstrip("/") or "/"
    if method == "OPTIONS":
        return 204, {}
    routes = (
        ("GET", r"^/agent/([^/]+)/graph$", lambda m: get_graph(m.group(1))),
        ("GET", r"^/agent/([^/]+)/unexplored$", lambda m: get_unexplored(m.group(1))),
        ("POST", r"^/agent/([^/]+)/simulate$", lambda m: simulate(m.group(1), body)),
        ("GET", r"^/agent/([^/]+)/scenarios$", lambda m: list_scenarios(m.group(1))),
        ("GET", r"^/agent/([^/]+)/scenarios/next$", lambda m: next_sandbox(m.group(1))),
        ("POST", r"^/scenarios/([^/]+)/sandbox$", lambda m: start_sandbox(m.group(1))),
        ("GET", r"^/sandboxes/([^/]+)$", lambda m: get_sandbox(m.group(1))),
        ("GET", r"^/evals$", lambda m: list_evals()),
        ("POST", r"^/evals/run$", lambda m: run_evals(body)),
        ("POST", r"^/demo/seed$", lambda m: seed_demo(body)),
    )
    for meth, pattern, fn in routes:
        if method == meth:
            m = re.match(pattern, path)
            if m:
                return 200, fn(m)
    return 404, {"error": "not found"}


def lambda_handler(event, context=None):
    method, path, body = _from_event(event)
    try:
        status, out = dispatch(method, path, body)
    except KeyError:
        status, out = 404, {"error": "not found"}
    except (ValueError, TypeError) as e:
        status, out = 400, {"error": str(e)}
    except RuntimeError as e:
        status, out = 503, {"error": str(e)}
    return {
        "statusCode": status,
        "headers": CORS,
        "body": "" if status == 204 else json.dumps(out),
    }


def _from_event(event):
    ctx = event.get("requestContext") or {}
    http = ctx.get("http") or {}
    method = event.get("httpMethod") or http.get("method") or "GET"
    path = event.get("path") or event.get("rawPath") or "/"
    stage = ctx.get("stage")
    if stage and stage != "$default" and path.startswith("/" + stage):
        path = path[len(stage) + 1:] or "/"
    raw = event.get("body")
    if event.get("isBase64Encoded") and raw:
        import base64
        raw = base64.b64decode(raw).decode()
    body = None
    if raw:
        body = json.loads(raw) if isinstance(raw, str) else raw
    return method, path, body
