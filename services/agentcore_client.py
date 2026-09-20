"""Invoke a customer agent inside Bedrock AgentCore Runtime.

Production path: boto3 bedrock-agentcore InvokeAgentRuntime against the
Runtime ARN provisioned by cdk/stacks/agentcore.py. The agent executes in a
dedicated microVM; this process never imports or runs agent code.

Local-test fallback: when AGENTCORE_RUNTIME_ARN is unset AND STORE=memory
(unit tests), the reference SRE agent runs in-process. Anything else raises
instead of silently faking a sandbox result.

Demo-inline fallback: when AGENTCORE_RUNTIME_ARN is unset but the process
runs in demo mode (MODE=demo or ALLOW_INLINE_SANDBOX=1), the reference SRE
agent also runs in-process via Bedrock + fault injection. This executes the
real agent code with real invariants — not a canned result — so judges can
run new dangerous paths on the SAM demo stack without a provisioned
AgentCore Runtime. Production (AgentCore microVM) remains the path whenever
the ARN is set.
"""
from __future__ import annotations

import json
import os
import uuid


def runtime_arn() -> str:
    return os.environ.get("AGENTCORE_RUNTIME_ARN") or ""


def runtime_region() -> str:
    return (
        os.environ.get("AGENTCORE_REGION")
        or os.environ.get("BEDROCK_REGION")
        or os.environ.get("AWS_REGION")
        or os.environ.get("AWS_DEFAULT_REGION")
        or "us-east-1"
    )


def _allow_inline() -> bool:
    return (
        os.environ.get("STORE") == "memory"
        or os.environ.get("MODE") == "demo"
        or os.environ.get("ALLOW_INLINE_SANDBOX") == "1"
    )


def invoke_agent(sandbox_id: str, scenario: dict, agent_version: str) -> dict:
    """Run one scenario in the real sandbox. Returns {world, spans, ...}."""
    arn = runtime_arn()
    if arn:
        return _invoke_remote(arn, sandbox_id, scenario, agent_version)
    if _allow_inline():
        return _invoke_local(scenario, agent_version)
    raise RuntimeError(
        "AGENTCORE_RUNTIME_ARN is not set; refusing to fake a sandbox result"
    )


def _invoke_remote(arn: str, sandbox_id: str, scenario: dict, agent_version: str) -> dict:
    import boto3

    client = boto3.client("bedrock-agentcore", region_name=runtime_region())
    payload = json.dumps({
        "sandbox_id": sandbox_id,
        "scenario": scenario,
        "agent_version": agent_version,
    }).encode()
    # AgentCore requires runtimeSessionId length in [33, 256].
    session_id = sandbox_id if len(sandbox_id) >= 33 else f"{sandbox_id}-{uuid.uuid4().hex}"
    session_id = session_id[:256]
    resp = client.invoke_agent_runtime(
        agentRuntimeArn=arn,
        runtimeSessionId=session_id,
        payload=payload,
    )
    body = resp.get("response") or resp.get("payload") or b""
    if hasattr(body, "read"):
        body = body.read()
    if isinstance(body, (bytes, bytearray)):
        body = bytes(body).decode() or "{}"
    data = json.loads(body) if isinstance(body, str) else dict(body)
    if not isinstance(data, dict):
        raise RuntimeError("agent runtime returned non-object")
    if data.get("error") and not data.get("spans"):
        raise RuntimeError(f"agent runtime error: {data['error']}")
    return {
        "world": data.get("world") or {},
        "spans": data.get("spans") or [],
        "agent_message": data.get("agent_message", ""),
        "agent_id": data.get("agent_id") or (scenario.get("agent") or {}).get("id") or "sre-agent",
        "agent_version": data.get("agent_version") or agent_version,
    }


def _invoke_local(scenario: dict, agent_version: str) -> dict:
    from agent.sre import run as run_sre_agent

    agent = scenario.get("agent") or {}
    initial_state = scenario.get("initial_state") or {}
    result = run_sre_agent(
        agent_id=scenario.get("agent_id") or agent.get("id") or "sre-agent",
        version=agent_version,
        fault=(scenario.get("fault") or {}).get("behavior"),
        initial_state=initial_state,
        prompt_hash=agent.get("prompt_hash", "sha256:demo"),
        service=initial_state.get("service") or "checkout",
    )
    return {
        "world": result["world"],
        "spans": result["trace"]["spans"],
        "agent_message": result.get("agent_message", ""),
        "agent_id": result["trace"]["agent_id"],
        "agent_version": result["trace"]["agent_version"],
    }
