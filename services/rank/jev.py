"""Jev (TypeSafe System One) client for scoring predicted scenarios."""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.request

ENDPOINT = "https://api.typesafe.ai/v1/systemone"
MODEL = os.environ.get("JEV_MODEL", "jev-latest")

# Ordered score levels → normalize score / (len-1) to 0..1
LIKELIHOOD = [
    "Unlikely to cause a real agent failure",
    "Possible failure under rare conditions",
    "Likely failure on a common path",
    "Almost certain to break the agent",
]
BLAST = [
    "Local / recoverable only",
    "Customer-visible but reversible",
    "Money or irreversible side effects",
    "Widespread outage or data loss",
]


def score_scenario(scenario: dict) -> dict:
    """Return risk fields. Uses Jev when TYPESAFE_API_KEY is set, else heuristic."""
    if os.environ.get("TYPESAFE_API_KEY"):
        try:
            return _jev_score(scenario)
        except Exception as e:
            out = _heuristic_score(scenario)
            out["rank_source"] = "heuristic_fallback"
            out["rank_error"] = str(e)[:200]
            return out
    return _heuristic_score(scenario)


def _heuristic_score(scenario: dict) -> dict:
    action = (scenario.get("untried_action") or "").lower()
    behavior = ((scenario.get("fault") or {}).get("behavior") or "").lower()
    # Prefer known demo danger paths
    if "timeout" in action or "timeout" in behavior:
        failure, blast = 0.92, 0.85
    elif "duplicate" in action or "duplicate" in behavior:
        failure, blast = 0.78, 0.7
    elif "403" in action or "http_500" in action or "500" in behavior:
        failure, blast = 0.55, 0.45
    else:
        failure, blast = 0.4, 0.35
    risk = round(0.5 * failure + 0.3 * blast + 0.2 * failure, 4)
    return {
        "failure_likelihood": failure,
        "blast_radius": blast,
        "risk_score": risk,
        "jev_confidence": 1.0,
        "jev_model": "heuristic",
        "rank_source": "heuristic",
    }


def _jev_score(scenario: dict) -> dict:
    state = {
        "agent_id": scenario.get("agent_id"),
        "unexplored_state": scenario.get("unexplored_state"),
        "untried_action": scenario.get("untried_action"),
        "fault": scenario.get("fault") or {},
        "hypothesis": scenario.get("hypothesis") or "",
    }
    payload = {
        "model": MODEL,
        "state": state,
        "questions": {
            "failure_likelihood": {
                "type": "score",
                "instructions": (
                    "How likely is this predicted fault to make the real agent "
                    "misbehave if sandboxed?"
                ),
                "criteria": LIKELIHOOD,
            },
            "blast_radius": {
                "type": "score",
                "instructions": (
                    "If the failure is real, how severe is the blast radius "
                    "(money, irreversibility, customer impact)?"
                ),
                "criteria": BLAST,
            },
        },
    }
    data = _post(payload)
    answers = data.get("answers") or {}
    failure = _norm_score(answers.get("failure_likelihood"), len(LIKELIHOOD))
    blast = _norm_score(answers.get("blast_radius"), len(BLAST))
    conf = min(
        _confidence(answers.get("failure_likelihood")),
        _confidence(answers.get("blast_radius")),
    )
    risk = round(0.5 * failure + 0.3 * blast + 0.2 * failure, 4)
    return {
        "failure_likelihood": round(failure, 4),
        "blast_radius": round(blast, 4),
        "risk_score": risk,
        "jev_confidence": round(conf, 4),
        "jev_model": data.get("model") or MODEL,
        "rank_source": "jev",
    }


def _norm_score(answer, n_levels: int) -> float:
    if not isinstance(answer, dict) or n_levels < 2:
        return 0.0
    raw = answer.get("score")
    if raw is None:
        return 0.0
    return max(0.0, min(1.0, float(raw) / (n_levels - 1)))


def _confidence(answer) -> float:
    if not isinstance(answer, dict):
        return 0.0
    c = answer.get("confidence")
    return float(c) if c is not None else 0.0


def _post(payload: dict) -> dict:
    key = os.environ["TYPESAFE_API_KEY"]
    body = json.dumps(payload).encode()
    req = urllib.request.Request(
        ENDPOINT,
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        err = e.read().decode()[:300]
        raise RuntimeError(f"jev http {e.code}: {err}") from e
