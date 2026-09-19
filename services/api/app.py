"""Route handlers for graph, frontier, simulate, replay, evals.

API Gateway entry. Starts Step Functions for sandboxes. Does not run the
agent and does not compile evals.
"""
import json
import os
import re

from agent.refund import run as run_agent
from services import store
from services.collector import app as collector
from services.evals import app as evals
from services.graph import app as graph
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


def start_sandbox(scenario_id):
    """POST /scenarios/{id}/sandbox → Step Functions → Fargate."""
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
    """POST /demo/seed — docs/demo.md step 1: run clean tasks."""
    runs = int((body or {}).get("runs") or 5)
    ids = []
    for i in range(runs):
        result = run_agent(customer_id=f"c_{i + 1}", order_id=f"o_{i + 9}")
        trace = collector.ingest(result["trace"])
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
