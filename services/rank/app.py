"""Rank world-model predicted scenarios by risk (Jev or heuristic)."""
from __future__ import annotations

from datetime import datetime, timezone

from services import store
from services.rank import jev


def rank_scenario(scenario: dict) -> dict:
    """Score one predicted scenario and persist risk fields on the job."""
    scores = jev.score_scenario(scenario)
    updated = dict(scenario)
    updated.update(scores)
    updated["ranked_at"] = datetime.now(timezone.utc).isoformat()
    store.put_job(updated)
    return updated


def list_predicted(agent_id: str | None = None) -> list:
    """Predicted scenarios, highest risk_score first."""
    rows = store.list_jobs(kind="scenario")
    out = []
    for sc in rows:
        if sc.get("status") != "predicted":
            continue
        if agent_id and sc.get("agent_id") != agent_id:
            continue
        out.append(sc)
    out.sort(key=lambda r: (-float(r.get("risk_score") or 0), r.get("scenario_id") or ""))
    return out


def highest_risk(agent_id: str | None = None) -> dict | None:
    ranked = list_predicted(agent_id)
    return ranked[0] if ranked else None
