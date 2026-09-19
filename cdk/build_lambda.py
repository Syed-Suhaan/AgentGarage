"""Build Lambda zip dir without Docker: pip install + copy services/agent."""
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(__file__).resolve().parent / "build" / "lambda"


def build() -> Path:
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    req = ROOT / "requirements-lambda.txt"
    subprocess.check_call([
        sys.executable, "-m", "pip", "install",
        "-r", str(req),
        "-t", str(OUT),
        "--quiet",
    ])
    for name in ("services", "agent"):
        src = ROOT / name
        dst = OUT / name
        if dst.exists():
            shutil.rmtree(dst)
        shutil.copytree(
            src,
            dst,
            ignore=shutil.ignore_patterns("__pycache__", "*.pyc"),
        )
    print("built", OUT)
    return OUT


if __name__ == "__main__":
    build()
