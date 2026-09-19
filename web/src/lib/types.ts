// --- Graph ---
export interface GraphNode {
  id: string;
  label: string;
}

export type EdgeKind = "observed" | "predicted" | "verified" | "protected";

export interface GraphEdge {
  from: string;
  action: string;
  to: string;
  kind: EdgeKind;
  source: string; // trace_id or scenario_id
}

export interface AgentGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// --- Unexplored ---
export interface UnexploredGap {
  unexplored_state?: string;
  state?: string;
  untried_action: string;
  support_traces: string[];
}

// --- Trace ---
export interface TraceSpan {
  name: string;
  tool: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
  status: string;
  duration_ms: number;
  decision_reason?: string;
}

export interface Trace {
  trace_id: string;
  agent_id: string;
  agent_version: string;
  prompt_hash: string;
  session_id: string;
  started_at: string;
  spans: TraceSpan[];
}

// --- Scenario ---
export interface ScenarioFault {
  tool: string;
  behavior: string;
}

export interface Scenario {
  scenario_id: string;
  unexplored_state: string;
  untried_action: string;
  fault: ScenarioFault;
  hypothesis: string;
  initial_state: Record<string, unknown>;
  status: "predicted" | "verified" | "protected";
}

// --- Sandbox ---
export interface SandboxInvariants {
  refund_calls?: number;
  passed: boolean;
  [key: string]: unknown;
}

export interface SandboxResult {
  sandbox_id: string;
  status: "running" | "verified_fail" | "verified_pass" | "error";
  log_s3?: string;
  invariants?: SandboxInvariants;
}

// --- Eval ---
export interface EvalOrigin {
  trace_id: string;
  scenario_id: string;
}

export interface EvalAgent {
  id: string;
  version: string;
  prompt_hash: string;
}

export interface Eval {
  id: string;
  origin: EvalOrigin;
  agent: EvalAgent;
  initial_state: Record<string, unknown>;
  fault: ScenarioFault;
  invariants: string[];
  status: "protected";
}

export interface EvalRunResult {
  passed: number;
  failed: number;
}

// --- Demo ---
export interface SeedResult {
  traces_written: number;
}
