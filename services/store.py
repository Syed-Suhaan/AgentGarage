"""Persistence — S3, DynamoDB, OpenSearch. Requires AWS env (or STORE=memory for tests).

Required when STORE!=memory:
  TRACES_BUCKET SANDBOXES_BUCKET EVALS_BUCKET
  SESSIONS_TABLE JOBS_TABLE EVALS_TABLE
  OPENSEARCH_ENDPOINT
  AWS_REGION
"""
import hashlib
import json
import os
import uuid
from urllib.parse import unquote_plus


def nid(prefix):
    return f"{prefix}_{uuid.uuid4().hex[:10]}"


def _memory():
    return os.environ.get("STORE") == "memory"


def _require_aws():
    if _memory():
        return
    missing = [
        k for k in (
            "TRACES_BUCKET", "SANDBOXES_BUCKET", "EVALS_BUCKET",
            "SESSIONS_TABLE", "JOBS_TABLE", "EVALS_TABLE",
            "OPENSEARCH_ENDPOINT",
        )
        if not os.environ.get(k)
    ]
    if missing:
        raise RuntimeError("missing AWS env: " + ", ".join(missing))


_MEM = {"traces": {}, "sessions": [], "jobs": {}, "evals": {}, "edges": []}


def reset():
    if not _memory():
        raise RuntimeError("store.reset() only allowed when STORE=memory")
    _MEM.clear()
    _MEM.update({"traces": {}, "sessions": [], "jobs": {}, "evals": {}, "edges": []})


def put_trace(trace):
    _require_aws()
    agent_id = trace.get("agent_id") or "refund-agent"
    trace_id = trace["trace_id"]
    key = f"{agent_id}/{trace_id}.json"
    if _memory():
        _MEM["traces"][trace_id] = dict(trace)
        _MEM["sessions"].append({"agent_id": agent_id, "trace_id": trace_id, "s3_key": key})
        return trace
    _s3().put_object(
        Bucket=os.environ["TRACES_BUCKET"], Key=key,
        Body=json.dumps(trace).encode(), ContentType="application/json",
    )
    _table("SESSIONS_TABLE").put_item(Item={
        "agent_id": agent_id,
        "trace_id": trace_id,
        "s3_key": key,
        "started_at": trace.get("started_at") or "",
        "agent_version": trace.get("agent_version") or "",
    })
    return trace


def get_trace(agent_id, trace_id):
    _require_aws()
    if _memory():
        return _MEM["traces"].get(trace_id)
    obj = _s3().get_object(
        Bucket=os.environ["TRACES_BUCKET"],
        Key=f"{agent_id}/{trace_id}.json",
    )
    return json.loads(obj["Body"].read())


def get_trace_from_s3(bucket, key):
    _require_aws()
    key = unquote_plus(key)
    if _memory():
        tid = key.rsplit("/", 1)[-1]
        if tid.endswith(".json"):
            tid = tid[:-5]
        return _MEM["traces"].get(tid)
    obj = _s3().get_object(Bucket=bucket, Key=key)
    return json.loads(obj["Body"].read())


def session_trace_ids(agent_id, limit=3):
    _require_aws()
    if _memory():
        return [s["trace_id"] for s in _MEM["sessions"] if s["agent_id"] == agent_id][:limit]
    from boto3.dynamodb.conditions import Key
    resp = _table("SESSIONS_TABLE").query(
        KeyConditionExpression=Key("agent_id").eq(agent_id),
        Limit=limit,
    )
    return [i["trace_id"] for i in resp.get("Items") or []]


def put_job(rec):
    _require_aws()
    rec = dict(rec)
    rec["id"] = rec.get("id") or rec.get("sandbox_id") or rec.get("scenario_id")
    if _memory():
        _MEM["jobs"][rec["id"]] = rec
        return rec
    _table("JOBS_TABLE").put_item(Item={
        "id": rec["id"],
        "kind": rec.get("kind") or "",
        "agent_id": rec.get("agent_id") or "",
        "doc": json.dumps(rec),
    })
    return rec


def get_job(job_id):
    _require_aws()
    if _memory():
        return _MEM["jobs"].get(job_id)
    item = _table("JOBS_TABLE").get_item(Key={"id": job_id}).get("Item")
    return json.loads(item["doc"]) if item else None


def put_sandbox_log(rec):
    _require_aws()
    rec = dict(rec)
    sid = rec["sandbox_id"]
    rec["id"] = sid
    rec["kind"] = "sandbox"
    bucket = os.environ.get("SANDBOXES_BUCKET") or "agentgarage"
    rec["log_s3"] = f"s3://{bucket}/{sid}/log.jsonl"
    if not _memory():
        _s3().put_object(
            Bucket=os.environ["SANDBOXES_BUCKET"],
            Key=f"{sid}/log.jsonl",
            Body="".join(json.dumps(s) + "\n" for s in rec.get("log") or []).encode(),
        )
        slim = {k: v for k, v in rec.items() if k != "log"}
        _s3().put_object(
            Bucket=os.environ["SANDBOXES_BUCKET"],
            Key=f"{sid}/result.json",
            Body=json.dumps(slim).encode(),
            ContentType="application/json",
        )
    put_job(rec)
    return rec


def put_eval(rec):
    _require_aws()
    eid = rec["id"]
    body = json.dumps(rec, indent=2)
    if _memory():
        _MEM["evals"][eid] = rec
        return rec
    _s3().put_object(
        Bucket=os.environ["EVALS_BUCKET"],
        Key=f"{eid}.yaml",
        Body=body.encode(),
        ContentType="application/yaml",
    )
    _table("EVALS_TABLE").put_item(Item={"eval_id": eid, "doc": json.dumps(rec)})
    return rec


def list_evals():
    _require_aws()
    if _memory():
        return list(_MEM["evals"].values())
    resp = _table("EVALS_TABLE").scan()
    return [json.loads(i["doc"]) for i in resp.get("Items") or []]


def put_edge(edge):
    _require_aws()
    edge = dict(edge)
    eid = _edge_id(edge)
    if _memory():
        _MEM["edges"] = [e for e in _MEM["edges"] if _edge_id(e) != eid]
        _MEM["edges"].append(edge)
        return edge
    _os("PUT", f"/state-graph/_doc/{eid}", {
        "agent_id": edge["agent_id"],
        "from_state": edge["from"],
        "action": edge["action"],
        "to_state": edge.get("to") or "unknown",
        "kind": edge.get("kind") or "observed",
        "source": edge.get("source") or "",
    })
    return edge


def edges(agent_id):
    _require_aws()
    if _memory():
        return [e for e in _MEM["edges"] if e.get("agent_id") == agent_id]
    data = _os("POST", "/state-graph/_search", {
        "size": 10000,
        "query": {"term": {"agent_id": {"value": agent_id}}},
    })
    out = []
    for hit in (data.get("hits") or {}).get("hits") or []:
        s = hit.get("_source") or {}
        out.append({
            "from": s.get("from_state"),
            "action": s.get("action"),
            "to": s.get("to_state"),
            "kind": s.get("kind"),
            "source": s.get("source"),
        })
    return out


def _edge_id(e):
    raw = "|".join([e["agent_id"], e["from"], e["action"], e.get("to") or ""])
    return hashlib.sha256(raw.encode()).hexdigest()[:40]


def _s3():
    import boto3
    return boto3.client("s3")


def _table(name):
    import boto3
    return boto3.resource("dynamodb").Table(os.environ[name])


def _os(method, path, body):
    import boto3
    import urllib.request
    from botocore.auth import SigV4Auth
    from botocore.awsrequest import AWSRequest

    session = boto3.Session()
    creds = session.get_credentials().get_frozen_credentials()
    region = session.region_name or os.environ.get("AWS_REGION") or "us-east-1"
    endpoint = os.environ["OPENSEARCH_ENDPOINT"].rstrip("/")
    if not endpoint.startswith("http"):
        endpoint = "https://" + endpoint
    url = endpoint + path
    data = json.dumps(body).encode()
    req = AWSRequest(method=method, url=url, data=data, headers={"Content-Type": "application/json"})
    SigV4Auth(creds, "es", region).add_auth(req)
    http = urllib.request.Request(url, data=data, method=method, headers=dict(req.headers))
    with urllib.request.urlopen(http, timeout=10) as resp:
        raw = resp.read().decode()
        return json.loads(raw) if raw else {}
