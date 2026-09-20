"""Validate recorded benchmark evidence files. Does not invent competitor numbers."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RESULTS = ROOT / "benchmarks" / "results"
SCHEMA_KEYS = (
    "platform",
    "incident_id",
    "track",
    "started_at",
    "ended_at",
    "funnel",
    "manual_interventions",
)


def main():
    files = [p for p in RESULTS.glob("*.json") if p.is_file()]
    if not files:
        print("no recorded runs in benchmarks/results; nothing to validate")
        return 0
    errors = 0
    for path in files:
        rec = json.loads(path.read_text(encoding="utf-8"))
        missing = [k for k in SCHEMA_KEYS if k not in rec]
        if missing:
            print(f"FAIL {path.name}: missing {missing}")
            errors += 1
            continue
        funnel = rec.get("funnel") or {}
        if funnel.get("fixes_verified") and not funnel.get("evals_created"):
            print(f"FAIL {path.name}: cannot verify a fix without an eval")
            errors += 1
            continue
        print(f"OK {path.name}")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
