"""Shared Lambda packaging: prebuilt cdk/build/lambda (no Docker required)."""
from pathlib import Path

from aws_cdk import aws_lambda as _lambda

BUILD = Path(__file__).resolve().parent / "build" / "lambda"


def backend_code() -> _lambda.Code:
    if not BUILD.exists():
        raise RuntimeError(
            f"missing {BUILD}; run: python cdk/build_lambda.py"
        )
    return _lambda.Code.from_asset(str(BUILD))
