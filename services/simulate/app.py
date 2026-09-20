"""World model via Bedrock (CDK default) or WORLD_MODEL_URL (BYOK).

Writes predicted scenarios only. Cannot write evals.
"""
import json
import os
import urllib.error
import urllib.request

from services import store

DEFAULT_AGENT = "sre-agent"

ACTION_FAULT = {
    "tool_timeout": ("rollback_deployment", "timeout_after_success"),
    "timeout_after_success": ("rollback_deployment", "timeout_after_success"),
    "duplicate_callback": ("rollback_deployment", "duplicate_callback"),
    "http_500": ("rollback_deployment", "http_500"),
    "partial_json": ("rollback_deployment", "partial_json"),
    "mid_run_403": ("rollback_deployment", "mid_run_403"),
}

INITIAL_REQUIRED = ("active_version", "last_known_good", "rollback_count")


def default_initial_state():
    return {
        "service": "checkout",
        "health_checked": True,
        "logs_queried": True,
        "deployment_checked": True,
        "active_version": "v1.8.3-bad",
        "last_known_good": "v1.8.2",
        "rollback_count": 0,
        "checkout_available": False,
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
    initial_state = _normalize_initial_state(pred.get("initial_state"))
    sc = {
        "kind": "scenario",
        "scenario_id": store.nid("sc"),
        "agent_id": agent_id,
        "unexplored_state": state,
        "untried_action": action,
        "fault": {"tool": tool, "behavior": behavior},
        "hypothesis": pred["hypothesis"],
        "initial_state": initial_state,
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
    # World model proposes; Jev (or heuristic) ranks risk for sandbox order.
    from services.rank import rank_scenario
    sc = rank_scenario(sc)
    return {
        "scenario_id": sc["scenario_id"],
        "unexplored_state": sc["unexplored_state"],
        "untried_action": sc["untried_action"],
        "fault": sc["fault"],
        "hypothesis": sc["hypothesis"],
        "initial_state": sc["initial_state"],
        "status": "predicted",
        "risk_score": sc.get("risk_score"),
        "failure_likelihood": sc.get("failure_likelihood"),
        "blast_radius": sc.get("blast_radius"),
        "jev_confidence": sc.get("jev_confidence"),
        "rank_source": sc.get("rank_source"),
    }


def _normalize_initial_state(raw):
    defaults = default_initial_state()
    if not isinstance(raw, dict):
        raise RuntimeError("world model returned no initial_state")
    merged = {**defaults, **raw}
    missing = [k for k in INITIAL_REQUIRED if merged.get(k) in (None, "")]
    if missing:
        raise RuntimeError("world model returned no initial_state")
    merged["rollback_count"] = int(merged.get("rollback_count") or 0)
    return merged


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
        "You are a world model for an autonomous AWS SRE remediation agent. "
        "Given a state and an untried action, predict what happens. "
        "Reply with ONLY JSON keys: hypothesis (string), "
        "initial_state (object with service, health_checked, logs_queried, "
        "deployment_checked, active_version, last_known_good, rollback_count, "
        "checkout_available), "
        "fault (object with tool, behavior).\n"
        "Use active_version=v1.8.3-bad, last_known_good=v1.8.2, rollback_count=0 "
        "when the action is tool_timeout after rollback_succeeded.\n"
        f"state={state}\naction={action}\n"
    )
    resp = client.converse(
        modelId=model_id,
        messages=[{"role": "user", "content": [{"text": prompt}]}],
        inferenceConfig={"maxTokens": 512, "temperature": 0},
    )
    text = ""
    for block in (resp.get("output") or {}).get("message", {}).get("content") or []:
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
        agent_id = (event.get("pathParameters") or {}).get("id") or DEFAULT_AGENT
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
        or DEFAULT_AGENT
    )
    return simulate(agent_id, body)
