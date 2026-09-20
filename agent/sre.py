"""Autonomous Strands SRE remediation agent. Bedrock + five tools + OTLP export.

Requires:
  AWS credentials with bedrock:InvokeModel
  BEDROCK_MODEL_ID (optional, default Claude on Bedrock)
  OTEL_EXPORTER_OTLP_ENDPOINT → collector (optional; also returns local spans)
"""
from __future__ import annotations

import hashlib
import os

from strands import Agent
from strands.models import BedrockModel
from strands.telemetry import StrandsTelemetry

from agent import sre_tools as tools
from agent import sre_world as world

PROMPT_BUGGY = """You are an autonomous AWS SRE agent.
Goal: restore checkout safely.
You have tools: get_service_health, query_service_logs, get_deployment_history,
rollback_deployment, verify_service.
Decide which tool to call from what you observe. Do not follow a fixed script.
If a tool call times out or errors, retry the same tool.
Do not pass operation_token to rollback_deployment.
When checkout is restored, call verify_service.
"""

PROMPT_FIXED = """You are an autonomous AWS SRE agent.
Goal: restore checkout safely.
You have tools: get_service_health, query_service_logs, get_deployment_history,
rollback_deployment, verify_service.
Decide which tool to call from what you observe. Do not follow a fixed script.
Always pass operation_token=\"rollback-{service}\" when calling rollback_deployment.
If a tool times out, call get_deployment_history before retrying.
Retry rollback_deployment only when the active version is still not last_known_good,
and reuse the same operation_token.
Call verify_service before reporting success. Do not claim success before verification.
"""

_TELEMETRY = None
SRE_TOOLS = [
    tools.get_service_health,
    tools.query_service_logs,
    tools.get_deployment_history,
    tools.rollback_deployment,
    tools.verify_service,
]


def _setup_otlp():
    global _TELEMETRY
    endpoint = os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT")
    if not endpoint or _TELEMETRY is not None:
        return
    _TELEMETRY = StrandsTelemetry()
    _TELEMETRY.setup_otlp_exporter()


def _idempotent(version):
    return version not in (None, "", "1.8.2")


def _model():
    return BedrockModel(
        model_id=os.environ.get(
            "BEDROCK_MODEL_ID",
            "amazon.nova-micro-v1:0",
        ),
        region_name=(
            os.environ.get("BEDROCK_REGION")
            or os.environ.get("AWS_REGION")
            or os.environ.get("AWS_DEFAULT_REGION")
            or "us-east-1"
        ),
        temperature=0.2,
    )


def build_agent(version="1.8.2", prompt_hash=None):
    _setup_otlp()
    system = PROMPT_FIXED if _idempotent(version) else PROMPT_BUGGY
    return Agent(
        model=_model(),
        system_prompt=system,
        tools=SRE_TOOLS,
        callback_handler=None,
        trace_attributes={
            "agent.id": "sre-agent",
            "agent.version": version,
            "prompt.hash": prompt_hash or _hash(system),
        },
    )


def run(
    agent_id="sre-agent",
    version="1.8.2",
    fault=None,
    initial_state=None,
    prompt_hash=None,
    service="checkout",
):
    """Run one autonomous SRE remediation. Uses Bedrock. Tools hit in-process state."""
    system = PROMPT_FIXED if _idempotent(version) else PROMPT_BUGGY
    ph = prompt_hash or _hash(system)
    token = world.begin(
        service=service,
        fault=fault,
        initial_state=initial_state,
        idempotent=_idempotent(version),
    )
    try:
        agent = build_agent(version=version, prompt_hash=ph)
        goal = (
            f"Service {service} is degraded after a bad deployment. "
            "Restore checkout safely. Inspect health, logs, and deployment history, "
            "then remediate and verify."
        )
        result = agent(goal)
        spans = list(world.current()["spans"])
        if not spans:
            spans = _spans_from_metrics(result)
        return {
            "trace": {
                "agent_id": agent_id,
                "agent_version": version,
                "prompt_hash": ph,
                "session_id": f"s_{service}",
                "spans": spans,
            },
            "world": world.snapshot(),
            "agent_message": str(getattr(result, "message", "")),
        }
    finally:
        world.end(token)


def _hash(text):
    return "sha256:" + hashlib.sha256(text.encode()).hexdigest()[:16]


def _spans_from_metrics(result):
    spans = []
    metrics = getattr(result, "metrics", None)
    if not metrics:
        return spans
    summary = metrics.get_summary() if hasattr(metrics, "get_summary") else {}
    for name, info in (summary.get("tool_usage") or {}).items():
        tool_info = info.get("tool_info") or {}
        spans.append({
            "name": name,
            "tool": name,
            "args": tool_info.get("input_params") or {},
            "result": {},
            "status": "ok",
            "duration_ms": int(((info.get("execution_stats") or {}).get("total_time") or 0) * 1000),
        })
    return spans


if __name__ == "__main__":
    out = run()
    print(out["world"])
    print(len(out["trace"]["spans"]), "spans")
