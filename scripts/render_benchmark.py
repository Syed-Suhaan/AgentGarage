"""Render funnel counts from recorded evidence. Empty results stay empty."""
import json
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RESULTS = ROOT / "benchmarks" / "results"
STAGES = (
    "incidents_discovered",
    "scenarios_proposed",
    "failures_reproduced",
    "evals_created",
    "fixes_verified",
)


def main():
    files = [p for p in RESULTS.glob("*.json") if p.is_file()]
    if not files:
        print("No recorded benchmark runs.")
        print("Funnel values stay unpublished until results/*.json exist.")
        return
    counts = defaultdict(lambda: {s: 0 for s in STAGES})
    for path in files:
        rec = json.loads(path.read_text(encoding="utf-8"))
        platform = rec.get("platform") or "unknown"
        funnel = rec.get("funnel") or {}
        for stage in STAGES:
            if funnel.get(stage):
                counts[platform][stage] += 1
    print("hidden incidents discovered → scenarios proposed → reproduced → evals → fixes verified")
    for platform, stages in sorted(counts.items()):
        line = " → ".join(str(stages[s]) for s in STAGES)
        print(f"{platform}: {line}")


if __name__ == "__main__":
    main()
