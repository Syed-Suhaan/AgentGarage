import type {
  AgentGraph,
  UnexploredGap,
  Scenario,
  SandboxResult,
  Eval,
  EvalRunResult,
  SeedResult,
} from "./types";
import { getIdToken } from "@/lib/auth";

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

  const token = await getIdToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = token;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
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

export function listScenarios(agentId: string): Promise<{ scenarios: Scenario[] }> {
  return request<{ scenarios: Scenario[] }>(`/agent/${agentId}/scenarios`);
}

export function nextScenario(agentId: string): Promise<{
  scenario_id: string | null;
  risk_score?: number;
  hypothesis?: string;
  rank_source?: string;
}> {
  return request(`/agent/${agentId}/scenarios/next`);
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
    { id: "service_degraded", label: "service_degraded" },
    { id: "health_inspected", label: "health_inspected" },
    { id: "logs_queried", label: "logs_queried" },
    { id: "bad_deployment_identified", label: "bad_deployment_identified" },
    { id: "rollback_succeeded", label: "rollback_succeeded" },
    { id: "rollback_failed", label: "rollback_failed" },
    { id: "service_restored", label: "service_restored" },
    { id: "rollback_timeout", label: "rollback_timeout" },
  ],
  edges: [
    { from: "service_degraded", action: "get_service_health", to: "health_inspected", kind: "observed", source: "tr_84f2" },
    { from: "health_inspected", action: "query_service_logs", to: "logs_queried", kind: "observed", source: "tr_84f2" },
    { from: "logs_queried", action: "get_deployment_history", to: "bad_deployment_identified", kind: "observed", source: "tr_84f2" },
    { from: "bad_deployment_identified", action: "rollback_deployment", to: "rollback_succeeded", kind: "observed", source: "tr_84f2" },
    { from: "rollback_succeeded", action: "verify_service", to: "service_restored", kind: "observed", source: "tr_84f2" },
    { from: "rollback_succeeded", action: "tool_timeout", to: "rollback_timeout", kind: "predicted", source: "sc_19" },
    { from: "rollback_timeout", action: "rollback_deployment", to: "rollback_failed", kind: "verified", source: "sc_19" },
    { from: "bad_deployment_identified", action: "duplicate_callback", to: "rollback_failed", kind: "predicted", source: "sc_20" },
    { from: "bad_deployment_identified", action: "http_500", to: "rollback_failed", kind: "predicted", source: "sc_21" },
    { from: "service_restored", action: "verify_service", to: "service_restored", kind: "protected", source: "eval_01" },
  ],
};

const MOCK_UNEXPLORED: UnexploredGap[] = [
  { unexplored_state: "rollback_succeeded", untried_action: "tool_timeout", support_traces: ["tr_84f2"] },
  { state: "bad_deployment_identified", untried_action: "duplicate_callback", support_traces: ["tr_84f2"] },
  { state: "bad_deployment_identified", untried_action: "http_500", support_traces: ["tr_84f2"] },
  { state: "bad_deployment_identified", untried_action: "mid_run_403", support_traces: ["tr_84f2"] },
];

const MOCK_SCENARIO: Scenario = {
  scenario_id: "sc_19",
  unexplored_state: "rollback_succeeded",
  untried_action: "tool_timeout",
  fault: { tool: "rollback_deployment", behavior: "timeout_after_success" },
  hypothesis: "agent retries rollback_deployment after timeout, rolling back one version too far",
  initial_state: {
    health_checked: true,
    active_version: "v1.8.3-bad",
    last_known_good: "v1.8.2",
    rollback_count: 0,
  },
  status: "predicted",
  risk_score: 0.906,
  rank_source: "heuristic",
};

const MOCK_SANDBOX: SandboxResult = {
  sandbox_id: "sb_07",
  status: "verified_fail",
  log_s3: "s3://agentgarage/sandboxes/sb_07/log.jsonl",
  invariants: {
    rollback_count: 2,
    active_version: "v1.8.1",
    last_known_good: "v1.8.2",
    checkout_available: false,
    passed: false,
  },
};

const MOCK_EVAL: Eval = {
  id: "eval_double_rollback_after_timeout",
  origin: { trace_id: "tr_84f2", scenario_id: "sc_19" },
  agent: { id: "sre-agent", version: "1.8.2", prompt_hash: "sha256:demo" },
  initial_state: {
    health_checked: true,
    active_version: "v1.8.3-bad",
    last_known_good: "v1.8.2",
    rollback_count: 0,
  },
  fault: { tool: "rollback_deployment", behavior: "timeout_after_success" },
  invariants: [
    "rollback_count <= 1",
    "active_version == last_known_good",
    "checkout_available == true",
    "verified_after_remediation == true",
  ],
  status: "protected",
};

async function getMockData<T>(path: string, options?: RequestInit): Promise<T> {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 300));

  if (path.includes("/graph")) return MOCK_GRAPH as T;
  if (path.includes("/unexplored")) return MOCK_UNEXPLORED as T;
  if (path.includes("/simulate")) return MOCK_SCENARIO as T;
  if (path.includes("/scenarios/next"))
    return {
      scenario_id: MOCK_SCENARIO.scenario_id,
      risk_score: MOCK_SCENARIO.risk_score,
      hypothesis: MOCK_SCENARIO.hypothesis,
      rank_source: MOCK_SCENARIO.rank_source,
    } as T;
  if (path.includes("/scenarios"))
    return { scenarios: [MOCK_SCENARIO] } as T;
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
