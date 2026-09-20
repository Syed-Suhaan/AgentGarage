"""AgentCore Runtime HTTP server.

Contract (required by Bedrock AgentCore Runtime):
  GET  /ping        -> {"status": "Healthy"}
  POST /invocations -> runs the registered agent on a scenario payload

The container runs the REAL agent inside the AgentCore microVM. Faults are
injected through the scenario payload, never by editing agent code. The
response carries the world snapshot + spans so the invoker Lambda can apply
code-level invariants without executing any agent code itself.
"""
from __future__ import annotations

import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer

from agent.sre import run as run_sre_agent


def execute(payload: dict) -> dict:
    scenario = payload.get("scenario") or {}
    initial_state = scenario.get("initial_state") or {}
    fault = (scenario.get("fault") or {}).get("behavior")
    version = payload.get("agent_version") or "1.8.2"
    agent = scenario.get("agent") or {}
    result = run_sre_agent(
        agent_id=scenario.get("agent_id") or agent.get("id") or "sre-agent",
        version=version,
        fault=fault,
        initial_state=initial_state,
        prompt_hash=agent.get("prompt_hash", "sha256:demo"),
        service=(initial_state.get("service")) or "checkout",
    )
    return {
        "world": result["world"],
        "spans": result["trace"]["spans"],
        "agent_message": result.get("agent_message", ""),
        "agent_id": result["trace"]["agent_id"],
        "agent_version": result["trace"]["agent_version"],
    }


class Handler(BaseHTTPRequestHandler):
    server_version = "AgentGarageAgentCore/1.0"

    def _send(self, status: int, obj: dict):
        body = json.dumps(obj).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path.rstrip("/") in ("", "/ping"):
            self._send(200, {"status": "Healthy"})
        else:
            self._send(404, {"error": "not found"})

    def do_POST(self):
        if self.path.rstrip("/") != "/invocations":
            self._send(404, {"error": "not found"})
            return
        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(length) if length else b"{}"
        try:
            payload = json.loads(raw.decode() or "{}")
        except (json.JSONDecodeError, UnicodeDecodeError) as e:
            self._send(400, {"error": f"invalid JSON: {e}"})
            return
        try:
            self._send(200, execute(payload if isinstance(payload, dict) else {}))
        except KeyError as e:
            self._send(404, {"error": f"not found: {e}"})
        except Exception as e:  # agent error is data, not a 500 contract break
            self._send(200, {"error": str(e), "world": {}, "spans": []})

    def log_message(self, *args):
        pass


def main():
    port = int(os.environ.get("PORT") or 8080)
    httpd = HTTPServer(("0.0.0.0", port), Handler)
    print(f"agentcore listening on :{port}", flush=True)
    httpd.serve_forever()


if __name__ == "__main__":
    main()
