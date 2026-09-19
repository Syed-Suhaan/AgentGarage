"""Shared ledger for refund tools. Mutated by tool calls during one agent run."""
from __future__ import annotations

import contextvars

_CTX: contextvars.ContextVar[dict | None] = contextvars.ContextVar("refund_world", default=None)


def begin(
    *,
    customer_id="c_1",
    order_id="o_9",
    amount=4200,
    fault=None,
    initial_state=None,
    idempotent=False,
):
    world = {
        "verified": False,
        "order": None,
        "refund_status": "pending",
        "ledger_refunds": 0,
        "refund_keys": set(),
        "email_sent": False,
        "customer_id": customer_id,
        "order_id": order_id,
        "amount": amount,
        "fault": fault,
        "idempotent": idempotent,
        "spans": [],
    }
    if initial_state:
        if initial_state.get("customer_verified"):
            world["verified"] = True
            world["order"] = {"total": amount}
        if "refund_status" in initial_state:
            world["refund_status"] = initial_state["refund_status"]
        world["ledger_refunds"] = int(initial_state.get("ledger_refunds") or 0)
    return _CTX.set(world)


def current():
    w = _CTX.get()
    if w is None:
        raise RuntimeError("refund world not started; call world.begin() first")
    return w


def end(token):
    _CTX.reset(token)


def snapshot():
    w = current()
    return {
        "ledger_refunds": w["ledger_refunds"],
        "refund_status": w["refund_status"],
        "email_sent": w["email_sent"],
        "verified": w["verified"],
    }


def record_span(tool, args, result, status, duration_ms):
    current()["spans"].append({
        "name": tool,
        "tool": tool,
        "args": args,
        "result": result if isinstance(result, dict) else {"value": result},
        "status": status,
        "duration_ms": duration_ms,
    })
