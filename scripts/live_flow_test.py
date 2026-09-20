"""End-to-end live API test against deployed AgentGarage."""
import json
import os
import sys
import time
import urllib.error
import urllib.request

import boto3

API = "https://49r4z8chma.execute-api.ap-south-2.amazonaws.com/prod"
POOL = "ap-south-2_ZtABAKCU7"
CLIENT = "2fc3ij52vhq8qd82u8dcl3j4k"
REGION = "ap-south-2"
USER = "demotest"
PASS = "DemoTest123!"


def token():
    r = boto3.client("cognito-idp", region_name=REGION).admin_initiate_auth(
        UserPoolId=POOL,
        ClientId=CLIENT,
        AuthFlow="ADMIN_USER_PASSWORD_AUTH",
        AuthParameters={"USERNAME": USER, "PASSWORD": PASS},
    )
    return r["AuthenticationResult"]["IdToken"]


def call(method, path, body=None, tok=None):
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(
        API + path,
        data=data,
        method=method,
        headers={
            "Content-Type": "application/json",
            "Authorization": tok,
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=300) as resp:
            raw = resp.read().decode()
            out = json.loads(raw) if raw else {}
            print(f"OK {method} {path} -> {json.dumps(out)[:240]}")
            return resp.status, out
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        print(f"FAIL {method} {path} {e.code} {err[:500]}")
        return e.code, {"error": err}


def main():
    print("auth...")
    tok = token()
    results = []

    # 1. seed clean runs (Bedrock agent — slow)
    runs = int(os.environ.get("SEED_RUNS") or 1)
    print(f"\n1. POST /demo/seed runs={runs}")
    code, seed = call("POST", "/demo/seed", {"runs": runs}, tok)
    results.append(("seed", code == 200 and seed.get("traces_written") == runs, seed))
    if code != 200:
        return fail(results)

    # wait for EventBridge graph builder
    print("waiting 15s for graph builder...")
    time.sleep(15)

    # 2. graph
    print("\n2. GET /agent/sre-agent/graph")
    code, graph = call("GET", "/agent/sre-agent/graph", tok=tok)
    has_edges = bool(graph.get("edges"))
    results.append(("graph", code == 200 and has_edges, {"nodes": len(graph.get("nodes") or []), "edges": len(graph.get("edges") or [])}))

    # 3. unexplored
    print("\n3. GET /agent/sre-agent/unexplored")
    code, frontier = call("GET", "/agent/sre-agent/unexplored", tok=tok)
    first = frontier[0] if isinstance(frontier, list) and frontier else {}
    ok_front = code == 200 and first.get("untried_action") == "tool_timeout"
    results.append(("unexplored", ok_front, first))

    body = {
        "unexplored_state": first.get("unexplored_state") or "rollback_succeeded",
        "untried_action": first.get("untried_action") or "tool_timeout",
    }

    # 4. simulate
    print("\n4. POST /agent/sre-agent/simulate")
    code, sc = call("POST", "/agent/sre-agent/simulate", body, tok)
    sid = sc.get("scenario_id")
    results.append(("simulate", code == 200 and sc.get("status") == "predicted" and bool(sid), sc))
    if not sid:
        return fail(results)

    # 5. sandbox start
    print(f"\n5. POST /scenarios/{sid}/sandbox")
    code, started = call("POST", f"/scenarios/{sid}/sandbox", {}, tok)
    sb = started.get("sandbox_id")
    results.append(("sandbox_start", code == 200 and started.get("status") == "running" and bool(sb), started))
    if not sb:
        return fail(results)

    # 6. poll sandbox (SFN + Bedrock agent)
    print(f"\n6. poll GET /sandboxes/{sb}")
    status = None
    detail = {}
    for i in range(40):
        time.sleep(15)
        code, detail = call("GET", f"/sandboxes/{sb}", tok=tok)
        status = detail.get("status")
        print(f"  poll {i+1}: {status}")
        if status and status not in ("running", None):
            break
    results.append((
        "sandbox_result",
        status == "verified_fail"
        and (detail.get("invariants") or {}).get("passed") is False
        and int((detail.get("invariants") or {}).get("rollback_count") or 0) >= 2,
        detail,
    ))

    # 7. evals list
    print("\n7. GET /evals")
    code, evs = call("GET", "/evals", tok=tok)
    evals = (evs.get("evals") if isinstance(evs, dict) else None) or []
    results.append(("evals_list", code == 200 and len(evals) >= 1 and evals[0].get("status") == "protected", {"count": len(evals)}))

    # 8. re-run evals on fixed version
    print("\n8. POST /evals/run agent_version=1.8.3")
    code, run = call("POST", "/evals/run", {"agent_version": "1.8.3"}, tok)
    results.append(("evals_run_fixed", code == 200 and run.get("passed", 0) >= 1, run))

    print("\n=== SUMMARY ===")
    ok = True
    for name, passed, data in results:
        mark = "PASS" if passed else "FAIL"
        if not passed:
            ok = False
        print(f"{mark} {name}: {json.dumps(data)[:200]}")
    return 0 if ok else 1


def fail(results):
    print("\n=== SUMMARY (aborted) ===")
    for name, passed, data in results:
        print(f"{'PASS' if passed else 'FAIL'} {name}: {json.dumps(data)[:200]}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
