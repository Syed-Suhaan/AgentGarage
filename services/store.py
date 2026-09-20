"""Persistence for the CDK stack: S3 + DynamoDB + Neptune.

Env (set by CDK):
  TRACES_BUCKET SANDBOXES_BUCKET|SANDBOX_BUCKET EVALS_BUCKET
  SESSIONS_TABLE JOBS_TABLE EVALS_TABLE AGENTS_TABLE
  NEPTUNE_ENDPOINT  AWS_REGION
  STORE=memory for unit tests only
"""
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
            "TRACES_BUCKET", "EVALS_BUCKET",
            "SESSIONS_TABLE", "JOBS_TABLE", "EVALS_TABLE",
        )
        if not os.environ.get(k)
    ]
    if missing:
        raise RuntimeError("missing AWS env: " + ", ".join(missing))


def _sandbox_bucket():
    return os.environ.get("SANDBOXES_BUCKET") or os.environ.get("SANDBOX_BUCKET") or "agentgarage"


_MEM = {"traces": {}, "sessions": [], "jobs": {}, "evals": {}, "edges": []}


def reset():
    if not _memory():
        raise RuntimeError("store.reset() only allowed when STORE=memory")
    _MEM.clear()
    _MEM.update({"traces": {}, "sessions": [], "jobs": {}, "evals": {}, "edges": []})


def put_trace(trace):
    _require_aws()
    agent_id = trace.get("agent_id") or "sre-agent"
    trace_id = trace["trace_id"]
    key = f"{agent_id}/{trace_id}.json"
    if _memory():
        _MEM["traces"][trace_id] = dict(trace)
        _MEM["sessions"].append({
            "session_id": trace_id, "agent_id": agent_id, "trace_id": trace_id, "s3_key": key,
        })
        return trace
    _s3().put_object(
        Bucket=os.environ["TRACES_BUCKET"], Key=key,
        Body=json.dumps(trace).encode(), ContentType="application/json",
    )
    # CDK table PK is session_id
    _table("SESSIONS_TABLE").put_item(Item={
        "session_id": trace_id,
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


def session_trace_ids(agent_id, limit=50):
    _require_aws()
    if _memory():
        return [s["trace_id"] for s in _MEM["sessions"] if s["agent_id"] == agent_id][:limit]
    # demo-scale scan; add GSI later if needed
    resp = _table("SESSIONS_TABLE").scan(
        FilterExpression="agent_id = :a",
        ExpressionAttributeValues={":a": agent_id},
        Limit=max(limit * 5, 100),
    )
    return [i["trace_id"] for i in (resp.get("Items") or []) if i.get("trace_id")][:limit]


def list_traces(agent_id=None, limit=50):
    """Demo-scale trace listing for the dashboard + graph rebuild.

    Memory mode reads the in-process dict; AWS mode scans the sessions table
    and fetches each trace body from S3.
    """
    _require_aws()
    if _memory():
        rows = list(_MEM["traces"].values())
        if agent_id:
            rows = [t for t in rows if (t.get("agent_id") or "sre-agent") == agent_id]
        return rows[:limit]
    table = _table("SESSIONS_TABLE")
    if agent_id:
        resp = table.scan(
            FilterExpression="agent_id = :a",
            ExpressionAttributeValues={":a": agent_id},
            Limit=max(limit * 3, 100),
        )
    else:
        resp = table.scan(Limit=max(limit * 3, 100))
    out = []
    for item in resp.get("Items") or []:
        tid = item.get("trace_id")
        aid = item.get("agent_id") or "sre-agent"
        if not tid:
            continue
        try:
            doc = get_trace(aid, tid)
        except Exception:
            continue
        if doc:
            out.append(doc)
        if len(out) >= limit:
            break
    return out


def put_job(rec):
    _require_aws()
    rec = dict(rec)
    job_id = rec.get("job_id") or rec.get("id") or rec.get("sandbox_id") or rec.get("scenario_id")
    rec["job_id"] = job_id
    rec["id"] = job_id
    if _memory():
        _MEM["jobs"][job_id] = rec
        return rec
    _table("JOBS_TABLE").put_item(Item={
        "job_id": job_id,
        "kind": rec.get("kind") or "",
        "agent_id": rec.get("agent_id") or "",
        "doc": json.dumps(rec),
    })
    return rec


def get_job(job_id):
    _require_aws()
    if _memory():
        return _MEM["jobs"].get(job_id)
    item = _table("JOBS_TABLE").get_item(Key={"job_id": job_id}).get("Item")
    return json.loads(item["doc"]) if item else None


def list_jobs(kind=None, limit=100):
    """Scan jobs; optional kind filter (scenario|sandbox). Demo-scale only."""
    _require_aws()
    if _memory():
        rows = list(_MEM["jobs"].values())
        if kind:
            rows = [r for r in rows if r.get("kind") == kind]
        return rows[:limit]
    table = _table("JOBS_TABLE")
    if kind:
        resp = table.scan(
            FilterExpression="kind = :k",
            ExpressionAttributeValues={":k": kind},
            Limit=max(limit * 3, 50),
        )
    else:
        resp = table.scan(Limit=max(limit * 3, 50))
    out = []
    for item in resp.get("Items") or []:
        doc = item.get("doc")
        if doc:
            out.append(json.loads(doc))
        if len(out) >= limit:
            break
    return out


def put_sandbox_log(rec):
    _require_aws()
    rec = dict(rec)
    sid = rec["sandbox_id"]
    rec["job_id"] = sid
    rec["id"] = sid
    rec["kind"] = "sandbox"
    bucket = _sandbox_bucket()
    rec["log_s3"] = f"s3://{bucket}/{sid}/log.jsonl"
    if not _memory():
        b = os.environ.get("SANDBOXES_BUCKET") or os.environ.get("SANDBOX_BUCKET")
        _s3().put_object(
            Bucket=b,
            Key=f"{sid}/log.jsonl",
            Body="".join(json.dumps(s) + "\n" for s in rec.get("log") or []).encode(),
        )
        slim = {k: v for k, v in rec.items() if k != "log"}
        _s3().put_object(
            Bucket=b,
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
    if _memory() or not os.environ.get("NEPTUNE_ENDPOINT"):
        key = (edge["agent_id"], edge["from"], edge["action"], edge.get("to"))
        _MEM["edges"] = [
            e for e in _MEM["edges"]
            if (e["agent_id"], e["from"], e["action"], e.get("to")) != key
        ]
        _MEM["edges"].append(edge)
        return edge
    # openCypher upsert via Neptune Data API
    q = (
        "MERGE (a:state {id: $from, agent_id: $agent}) "
        "MERGE (b:state {id: $to, agent_id: $agent}) "
        "MERGE (a)-[r:action {agent_id: $agent, name: $action}]->(b) "
        "SET r.status = $kind, r.source = $source, r.count = coalesce(r.count, 0) + 1"
    )
    _neptune(q, {
        "agent": edge["agent_id"],
        "from": edge["from"],
        "to": edge.get("to") or "unknown",
        "action": edge["action"],
        "kind": edge.get("kind") or "observed",
        "source": edge.get("source") or "",
    })
    return edge


def edges(agent_id):
    _require_aws()
    if _memory() or not os.environ.get("NEPTUNE_ENDPOINT"):
        return [e for e in _MEM["edges"] if e.get("agent_id") == agent_id]
    q = (
        "MATCH (a:state)-[r:action]->(b:state) "
        "WHERE r.agent_id = $agent "
        "RETURN a.id AS from_state, r.name AS action, b.id AS to_state, "
        "r.status AS kind, r.source AS source"
    )
    rows = _neptune(q, {"agent": agent_id})
    out = []
    for row in rows:
        out.append({
            "from": row.get("from_state"),
            "action": row.get("action"),
            "to": row.get("to_state"),
            "kind": row.get("kind"),
            "source": row.get("source"),
        })
    return out


def _s3():
    import boto3
    return boto3.client("s3")


def _table(name):
    import boto3
    return boto3.resource("dynamodb").Table(os.environ[name])


def _neptune(query, params):
    import boto3
    endpoint = os.environ["NEPTUNE_ENDPOINT"].rstrip("/")
    if endpoint.startswith("https://"):
        endpoint = endpoint[len("https://"):]
    if endpoint.startswith("http://"):
        endpoint = endpoint[len("http://"):]
    host = endpoint.split(":")[0]
    client = boto3.client(
        "neptunedata",
        endpoint_url=f"https://{host}:8182",
        region_name=os.environ.get("AWS_REGION") or "us-east-1",
    )
    resp = client.execute_open_cypher_query(
        openCypherQuery=query,
        parameters=json.dumps(params),
    )
    results = resp.get("results")
    if isinstance(results, str):
        results = json.loads(results)
    return results or []
