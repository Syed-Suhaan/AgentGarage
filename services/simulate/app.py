"""Calls the world-model server (Qwen-AgentWorld on g5). Writes predicted scenarios.

Requires WORLD_MODEL_URL. No heuristic fallback.
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
    pred = _world_model(state, action)
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


def _world_model(state, action):
    url = os.environ.get("WORLD_MODEL_URL")
    if not url:
        raise RuntimeError("WORLD_MODEL_URL is required")
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


def lambda_handler(event, context=None):
    body = event if isinstance(event, dict) and "unexplored_state" in event else (
        json.loads(event.get("body") or "{}") if isinstance(event.get("body"), str)
        else (event.get("body") or event)
    )
    agent_id = (
        (event.get("pathParameters") or {}).get("id")
        or body.get("agent_id")
        or "refund-agent"
    )
    return simulate(agent_id, body)
