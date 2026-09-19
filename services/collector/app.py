"""Receives OTLP, applies Cedar redact, writes traces to S3.

Architecture steps 1–3. Does not build the graph (EventBridge does that).
"""
import json
from datetime import datetime, timezone

from services import store

# Cedar stand-in: these keys never go to S3 or a model.
SECRET = {
    "password", "token", "api_key", "apikey", "authorization",
    "secret", "ssn", "credit_card", "creditcard",
}


def ingest(doc):
    trace = redact(normalize(doc))
    if not trace.get("trace_id"):
        trace["trace_id"] = store.nid("tr")
    if not trace.get("started_at"):
        trace["started_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    store.put_trace(trace)
    return trace


def normalize(doc):
    if not isinstance(doc, dict):
        raise ValueError("trace must be an object")
    if "spans" in doc:
        return dict(doc)
    spans = []
    agent_id = agent_version = prompt_hash = None
    for rs in doc.get("resourceSpans") or []:
        attrs = _attrs((rs.get("resource") or {}).get("attributes") or [])
        agent_id = attrs.get("agent.id") or agent_id
        agent_version = attrs.get("agent.version") or agent_version
        prompt_hash = attrs.get("prompt.hash") or prompt_hash
        for ss in rs.get("scopeSpans") or []:
            for sp in ss.get("spans") or []:
                a = _attrs(sp.get("attributes") or [])
                spans.append({
                    "name": sp.get("name"),
                    "tool": a.get("tool") or sp.get("name"),
                    "args": a.get("args") if isinstance(a.get("args"), dict) else {},
                    "result": a.get("result") if isinstance(a.get("result"), dict) else {},
                    "status": "ok" if (sp.get("status") or {}).get("code") in (None, 0, 1, "STATUS_CODE_OK") else "error",
                    "duration_ms": _duration_ms(sp),
                })
    return {
        "agent_id": agent_id or "refund-agent",
        "agent_version": agent_version or "1.8.2",
        "prompt_hash": prompt_hash or "sha256:demo",
        "spans": spans,
    }


def redact(obj):
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            key = k.lower().replace("-", "_")
            out[k] = "[REDACTED]" if key in SECRET else redact(v)
        return out
    if isinstance(obj, list):
        return [redact(x) for x in obj]
    return obj


def _attrs(items):
    out = {}
    for it in items:
        k = it.get("key")
        v = it.get("value") or {}
        out[k] = v.get("stringValue") or v.get("intValue") or v.get("boolValue")
    return out


def _duration_ms(sp):
    try:
        start = int(sp.get("startTimeUnixNano") or 0)
        end = int(sp.get("endTimeUnixNano") or 0)
        if end > start:
            return (end - start) // 1_000_000
    except (TypeError, ValueError):
        pass
    return 0


def lambda_handler(event, context=None):
    raw = event.get("body") or "{}"
    if event.get("isBase64Encoded"):
        import base64
        raw = base64.b64decode(raw).decode()
    doc = json.loads(raw) if isinstance(raw, str) else raw
    trace = ingest(doc)
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"trace_id": trace.get("trace_id")}),
    }
