"""Autonomous Strands refund agent. Bedrock + four tools + OTLP export.

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

from agent import tools, world

PROMPT_BUGGY = """You are an autonomous refund agent.
Goal: refund the customer's order end to end.
You have tools: verify_customer, get_order, issue_refund, send_email.
Decide which tool to call from what you observe. Do not follow a fixed script.
If a tool call times out or errors, retry the same tool.
Do not pass idempotency_key to issue_refund.
When the refund succeeds, send the refund_done email.
"""

PROMPT_FIXED = """You are an autonomous refund agent.
Goal: refund the customer's order end to end.
You have tools: verify_customer, get_order, issue_refund, send_email.
Decide which tool to call from what you observe. Do not follow a fixed script.
Always pass idempotency_key=\"refund-{order_id}\" when calling issue_refund.
If a tool times out, retry with the same idempotency_key.
When the refund succeeds, send the refund_done email.
"""

_TELEMETRY = None


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
            "anthropic.claude-3-5-sonnet-20241022-v2:0",
        ),
        region_name=os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION") or "us-east-1",
        temperature=0.2,
    )


def build_agent(version="1.8.2", prompt_hash=None):
    _setup_otlp()
    system = PROMPT_FIXED if _idempotent(version) else PROMPT_BUGGY
    return Agent(
        model=_model(),
        system_prompt=system,
        tools=[tools.verify_customer, tools.get_order, tools.issue_refund, tools.send_email],
        callback_handler=None,
        trace_attributes={
            "agent.id": "refund-agent",
            "agent.version": version,
            "prompt.hash": prompt_hash or _hash(system),
        },
    )


def run(
    agent_id="refund-agent",
    version="1.8.2",
    fault=None,
    initial_state=None,
    prompt_hash=None,
    customer_id="c_1",
    order_id="o_9",
    amount=4200,
):
    """Run one autonomous refund. Uses Bedrock. Tools hit the in-process ledger."""
    system = PROMPT_FIXED if _idempotent(version) else PROMPT_BUGGY
    ph = prompt_hash or _hash(system)
    token = world.begin(
        customer_id=customer_id,
        order_id=order_id,
        amount=amount,
        fault=fault,
        initial_state=initial_state,
        idempotent=_idempotent(version),
    )
    try:
        agent = build_agent(version=version, prompt_hash=ph)
        goal = (
            f"Refund order {order_id} for customer {customer_id}. "
            f"Amount is {amount} cents. Complete the refund and notify the customer."
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
                "session_id": f"s_{customer_id}",
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
