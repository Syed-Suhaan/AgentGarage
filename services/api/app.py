"""Mock API. Each handler returns its template file. No AWS calls yet."""
import json
from pathlib import Path

TEMPLATES = Path(__file__).resolve().parents[2] / "schemas" / "templates"


def _load(name):
    return json.loads((TEMPLATES / name).read_text())


def get_graph(agent_id):
    return _load("graph_sample.json")


def get_unexplored(agent_id):
    return _load("unexplored_sample.json")


def simulate(agent_id, body):
    return _load("scenario_19.json")


def start_sandbox(scenario_id):
    return {"sandbox_id": "sb_07", "status": "running"}


def get_sandbox(sandbox_id):
    return {
        "sandbox_id": "sb_07",
        "status": "verified_fail",
        "log_s3": "s3://agentgarage/sandboxes/sb_07/log.jsonl",
        "invariants": {"refund_calls": 2, "passed": False},
    }


def list_evals():
    return {"evals": [_load("eval_duplicate_refund.json")]}


def run_evals(body):
    return {"passed": 1, "failed": 0}


def seed_demo(body):
    return {"traces_written": body.get("runs", 5)}
