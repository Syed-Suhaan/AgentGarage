import type {
  AgentGraph,
  UnexploredGap,
  Scenario,
  SandboxResult,
  Eval,
  EvalRunResult,
  SeedResult,
} from "./types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  // In demo mode without a backend, return mock data
  if (IS_DEMO && !BASE_URL) {
    return getMockData<T>(path, options);
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// ── API Functions ──────────────────────────────────────

export function getGraph(agentId: string): Promise<AgentGraph> {
  return request<AgentGraph>(`/agent/${agentId}/graph`);
}

export function getUnexplored(agentId: string): Promise<UnexploredGap[]> {
  return request<UnexploredGap[]>(`/agent/${agentId}/unexplored`);
}

export function simulate(
  agentId: string,
  body: { unexplored_state: string; untried_action: string }
): Promise<Scenario> {
  return request<Scenario>(`/agent/${agentId}/simulate`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function startSandbox(
  scenarioId: string
): Promise<{ sandbox_id: string; status: string }> {
  return request(`/scenarios/${scenarioId}/sandbox`, {
    method: "POST",
    body: JSON.stringify({ scenario_id: scenarioId }),
  });
}

export function getSandbox(sandboxId: string): Promise<SandboxResult> {
  return request<SandboxResult>(`/sandboxes/${sandboxId}`);
}

export function listEvals(): Promise<{ evals: Eval[] }> {
  return request<{ evals: Eval[] }>(`/evals`);
}

export function runEvals(
  body: { agent_version: string }
): Promise<EvalRunResult> {
  return request<EvalRunResult>(`/evals/run`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function seedDemo(
  body: { runs: number }
): Promise<SeedResult> {
  return request<SeedResult>(`/demo/seed`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ── Mock Data (for demo mode without backend) ──────────

const MOCK_GRAPH: AgentGraph = {
  nodes: [
    { id: "customer_unverified", label: "customer_unverified" },
    { id: "customer_verified", label: "customer_verified" },
    { id: "order_loaded", label: "order_loaded" },
    { id: "refund_pending", label: "refund_pending" },
    { id: "refund_succeeded", label: "refund_succeeded" },
    { id: "refund_failed", label: "refund_failed" },
    { id: "email_sent", label: "email_sent" },
    { id: "tool_timeout", label: "tool_timeout" },
  ],
  edges: [
    { from: "customer_unverified", action: "verify_customer", to: "customer_verified", kind: "observed", source: "tr_84f2" },
    { from: "customer_verified", action: "get_order", to: "order_loaded", kind: "observed", source: "tr_84f2" },
    { from: "order_loaded", action: "issue_refund", to: "refund_pending", kind: "observed", source: "tr_84f2" },
    { from: "refund_pending", action: "issue_refund", to: "refund_succeeded", kind: "observed", source: "tr_84f2" },
    { from: "refund_succeeded", action: "send_email", to: "email_sent", kind: "observed", source: "tr_84f2" },
    { from: "refund_succeeded", action: "tool_timeout", to: "tool_timeout", kind: "predicted", source: "sc_19" },
    { from: "tool_timeout", action: "issue_refund", to: "refund_succeeded", kind: "verified", source: "sc_19" },
    { from: "refund_pending", action: "duplicate_callback", to: "refund_succeeded", kind: "predicted", source: "sc_20" },
    { from: "refund_pending", action: "http_500", to: "refund_failed", kind: "predicted", source: "sc_21" },
    { from: "email_sent", action: "send_email", to: "email_sent", kind: "protected", source: "eval_01" },
  ],
};

const MOCK_UNEXPLORED: UnexploredGap[] = [
  { unexplored_state: "refund_succeeded", untried_action: "tool_timeout", support_traces: ["tr_84f2"] },
  { state: "refund_pending", untried_action: "duplicate_callback", support_traces: ["tr_84f2"] },
  { state: "refund_pending", untried_action: "http_500", support_traces: ["tr_84f2"] },
  { state: "customer_verified", untried_action: "mid_run_403", support_traces: ["tr_84f2"] },
];

const MOCK_SCENARIO: Scenario = {
  scenario_id: "sc_19",
  unexplored_state: "refund_succeeded",
  untried_action: "tool_timeout",
  fault: { tool: "issue_refund", behavior: "timeout_after_success" },
  hypothesis: "agent retries issue_refund after timeout, causing a second refund",
  initial_state: { customer_verified: true, refund_status: "pending", ledger_refunds: 0 },
  status: "predicted",
};

const MOCK_SANDBOX: SandboxResult = {
  sandbox_id: "sb_07",
  status: "verified_fail",
  log_s3: "s3://agentgarage/sandboxes/sb_07/log.jsonl",
  invariants: { refund_calls: 2, passed: false },
};

const MOCK_EVAL: Eval = {
  id: "eval_duplicate_refund_after_timeout",
  origin: { trace_id: "tr_84f2", scenario_id: "sc_19" },
  agent: { id: "refund-agent", version: "1.8.2", prompt_hash: "sha256:demo" },
  initial_state: { customer_verified: true, refund_status: "pending", ledger_refunds: 0 },
  fault: { tool: "issue_refund", behavior: "timeout_after_success" },
  invariants: ["refund_calls <= 1", "final_status != double_refunded"],
  status: "protected",
};

async function getMockData<T>(path: string, options?: RequestInit): Promise<T> {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 300));

  if (path.includes("/graph")) return MOCK_GRAPH as T;
  if (path.includes("/unexplored")) return MOCK_UNEXPLORED as T;
  if (path.includes("/simulate")) return MOCK_SCENARIO as T;
  if (path.includes("/sandbox") && options?.method === "POST")
    return { sandbox_id: "sb_07", status: "running" } as T;
  if (path.includes("/sandboxes/")) return MOCK_SANDBOX as T;
  if (path.includes("/evals/run"))
    return { passed: 1, failed: 0 } as T;
  if (path.includes("/evals")) return { evals: [MOCK_EVAL] } as T;
  if (path.includes("/demo/seed"))
    return { traces_written: 5 } as T;

  throw new Error(`No mock data for ${path}`);
}
