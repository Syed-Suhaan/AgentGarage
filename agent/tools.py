"""Four refund tools. Real Strands @tool functions. Faults for sandbox only."""
from __future__ import annotations

import time

from strands import tool

from agent import world


@tool
def verify_customer(customer_id: str) -> dict:
    """Verify the customer identity before processing a refund.

    Args:
        customer_id: Customer id to verify.
    """
    t0 = time.time()
    w = world.current()
    result = {"verified": True}
    w["verified"] = True
    world.record_span("verify_customer", {"customer_id": customer_id}, result, "ok", _ms(t0))
    return result


@tool
def get_order(order_id: str) -> dict:
    """Load order details needed to issue a refund.

    Args:
        order_id: Order id to load.
    """
    t0 = time.time()
    w = world.current()
    result = {"total": w["amount"], "order_id": order_id}
    w["order"] = {"total": w["amount"]}
    world.record_span("get_order", {"order_id": order_id}, result, "ok", _ms(t0))
    return result


@tool
def issue_refund(order_id: str, amount: int, idempotency_key: str | None = None) -> dict:
    """Issue a refund for an order. Posts to the payment ledger.

    Args:
        order_id: Order to refund.
        amount: Amount in cents.
        idempotency_key: Optional key to prevent double refunds on retry.
    """
    t0 = time.time()
    w = world.current()
    args = {"order_id": order_id, "amount": amount}
    if idempotency_key:
        args["idempotency_key"] = idempotency_key

    key = idempotency_key
    if key and key in w["refund_keys"]:
        result = {"refunded": True, "duplicate": True}
        world.record_span("issue_refund", args, result, "ok", _ms(t0))
        return result

    fault = w.get("fault")
    if fault == "http_500":
        result = {"error": "http_500"}
        world.record_span("issue_refund", args, result, "error", _ms(t0))
        raise RuntimeError("http_500")
    if fault == "mid_run_403":
        result = {"error": "forbidden"}
        world.record_span("issue_refund", args, result, "error", _ms(t0))
        raise RuntimeError("forbidden")

    if fault == "partial_json":
        w["ledger_refunds"] += 1
        if key:
            w["refund_keys"].add(key)
        w["refund_status"] = "refunded"
        result = {"refunded": True, "truncated": True}
        world.record_span("issue_refund", args, result, "ok", _ms(t0))
        return result

    w["ledger_refunds"] += 1
    if key:
        w["refund_keys"].add(key)
    if fault == "duplicate_callback":
        w["ledger_refunds"] += 1

    # Demo bug path: ledger posts, then client sees timeout → agent retries.
    if fault == "timeout_after_success" and w["ledger_refunds"] == 1:
        result = {"error": "timeout"}
        world.record_span("issue_refund", args, result, "timeout", _ms(t0))
        raise TimeoutError("issue_refund timed out after success")

    w["refund_status"] = "refunded"
    result = {"refunded": True}
    world.record_span("issue_refund", args, result, "ok", _ms(t0))
    return result


@tool
def send_email(to: str, template: str) -> dict:
    """Send a customer email after the refund completes.

    Args:
        to: Customer id or email.
        template: Email template name, e.g. refund_done.
    """
    t0 = time.time()
    w = world.current()
    result = {"sent": True}
    w["email_sent"] = True
    world.record_span("send_email", {"to": to, "template": template}, result, "ok", _ms(t0))
    return result


def _ms(t0):
    return int((time.time() - t0) * 1000)
