"""World model via Bedrock (CDK default) or WORLD_MODEL_URL (BYOK).

Writes predicted scenarios only. Cannot write evals.
"""
import json
import os
import urllib.error
import urllib.request

from services import store

ACTION_FAULT = {
    "tool_timeout": ("issue_refund", "timeout_after_success"),
    "timeout_after_success": ("issue_refund", "timeout_after_success"),
    "duplicate_callback": ("issue_refund", "duplicate_callback"),
    "http_500": ("issue_refund", "http_500"),
    "partial_json": ("issue_refund", "partial_json"),
    "mid_run_403": ("issue_refund", "mid_run_403"),
}


def simulate(agent_id, body):
    body = body or {}
    state = body.get("unexplored_state")
    action = body.get("untried_action")
    if not state or not action:
        raise ValueError("unexplored_state and untried_action required")
    pred = _predict(state, action)
    tool, behavior = ACTION_FAULT.get(action, (action, action))
    if pred.get("fault"):
        tool = pred["fault"].get("tool") or tool
        behavior = pred["fault"].get("behavior") or behavior
    if not pred.get("hypothesis"):
        raise RuntimeError("world model returned no hypothesis")
    if not pred.get("initial_state"):
        raise RuntimeError("world model returned no initial_state")
    sc = {
        "kind": "scenario",
        "scenario_id": store.nid("sc"),
        "agent_id": agent_id,
        "unexplored_state": state,
        "untried_action": action,
        "fault": {"tool": tool, "behavior": behavior},
        "hypothesis": pred["hypothesis"],
        "initial_state": pred["initial_state"],
        "status": "predicted",
    }
    sc["id"] = sc["scenario_id"]
    sc["job_id"] = sc["scenario_id"]
    store.put_job(sc)
    store.put_edge({
        "agent_id": agent_id,
        "from": state,
        "action": action,
        "to": "unknown",
        "kind": "predicted",
        "source": sc["scenario_id"],
    })
    return {
        "scenario_id": sc["scenario_id"],
        "unexplored_state": sc["unexplored_state"],
        "untried_action": sc["untried_action"],
        "fault": sc["fault"],
        "hypothesis": sc["hypothesis"],
        "initial_state": sc["initial_state"],
        "status": "predicted",
    }


def _predict(state, action):
    url = os.environ.get("WORLD_MODEL_URL")
    if url:
        return _http_world_model(url, state, action)
    if os.environ.get("BEDROCK_MODEL_ID"):
        return _bedrock_world_model(state, action)
    raise RuntimeError("set WORLD_MODEL_URL or BEDROCK_MODEL_ID")


def _http_world_model(url, state, action):
    payload = json.dumps({"state": state, "action": action}).encode()
    req = urllib.request.Request(
        url, data=payload, headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode())
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError) as e:
        raise RuntimeError(f"world model call failed: {e}") from e
    if not isinstance(data, dict):
        raise RuntimeError("world model returned non-object")
    return data


def _bedrock_world_model(state, action):
    import boto3
    model_id = os.environ["BEDROCK_MODEL_ID"]
    region = os.environ.get("BEDROCK_REGION") or os.environ.get("AWS_REGION") or "us-east-1"
    client = boto3.client("bedrock-runtime", region_name=region)
    prompt = (
        "You are a world model for an autonomous refund agent. "
        "Given a state and an untried action, predict what happens. "
        "Reply with ONLY JSON keys: hypothesis (string), "
        "initial_state (object with customer_verified, refund_status, ledger_refunds), "
        "fault (object with tool, behavior).\n"
        f"state={state}\naction={action}\n"
    )
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 512,
        "messages": [{"role": "user", "content": prompt}],
    }
    resp = client.invoke_model(
        modelId=model_id,
        contentType="application/json",
        accept="application/json",
        body=json.dumps(body).encode(),
    )
    payload = json.loads(resp["body"].read())
    text = ""
    for block in payload.get("content") or []:
        if block.get("type") == "text":
            text += block.get("text") or ""
    text = text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.startswith("json"):
            text = text[4:].strip()
    data = json.loads(text)
    if not isinstance(data, dict):
        raise RuntimeError("bedrock world model returned non-object")
    return data


def lambda_handler(event, context=None):
    if event.get("httpMethod") or event.get("requestContext"):
        raw = event.get("body") or "{}"
        if event.get("isBase64Encoded"):
            import base64
            raw = base64.b64decode(raw).decode()
        body = json.loads(raw) if isinstance(raw, str) else raw
        agent_id = (event.get("pathParameters") or {}).get("id") or "refund-agent"
        out = simulate(agent_id, body)
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(out),
        }
    body = event if isinstance(event, dict) else {}
    agent_id = (
        (event.get("pathParameters") or {}).get("id")
        or body.get("agent_id")
        or "refund-agent"
    )
    return simulate(agent_id, body)
