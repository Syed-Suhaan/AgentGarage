"""Build Lambda package (cdk/build_lambda.py) then zip for SAM/CI."""
from __future__ import annotations

import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "cdk"))

from build_lambda import OUT, build  # noqa: E402


def zip_lambda(dest: Path) -> Path:
    build()
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists():
        dest.unlink()
    with zipfile.ZipFile(dest, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in OUT.rglob("*"):
            if f.is_file():
                zf.write(f, f.relative_to(OUT).as_posix())
    print("zip", dest, dest.stat().st_size)
    return dest


if __name__ == "__main__":
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "infra" / "demo" / "build" / "api.zip"
    zip_lambda(out)
