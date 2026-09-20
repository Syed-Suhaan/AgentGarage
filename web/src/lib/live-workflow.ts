/* Single source of truth for Live Garage backend workflow.
 * Maps the refund-agent / diagnose_vehicle trace to garage bays so the
 * canvas bot, timeline, and inspector always stay in sync.
 *
 * Backend (services/):
 *  - agent.refund.run -> collector.ingest -> trace with spans
 *  - TOOLS: read_obd (4-13s), query_dtc (24.5-26.5s), emit_verdict (29.5s)
 *  - ENV: container spin-up, OBD link, fault injection (21-23s), error (30.2s+)
 *  - EVAL: preconditions, safety checks, FAIL verdict (35s+)
 */

export const LIVE_TRACE = {
  traceId: "tr_7f3a9c2e4b1d",
  agent: "mechanic-bot-001",
  agentBackendId: "refund-agent",
  task: "diagnose_vehicle",
  version: "v1.8.2",
  started: "2025-06-23 14:26:41",
  duration: 37.4,
  faultAt: 29.5,
  errorAt: 30.2,
  expected: "P0420",
  emitted: "P0136",
} as const;

export interface WorkflowStage {
  id: string;
  bay: string;
  code: string;
  label: string;
  start: number;
  end: number;
  action: string;
  detail: string;
}

export const WORKFLOW_STAGES: WorkflowStage[] = [
  {
    id: "dispatch",
    bay: "Dispatch Station",
    code: "BAY_01",
    label: "dispatch",
    start: 0,
    end: 6.0,
    action: "LLM intake + NLU parse",
    detail: "Initial task intake & NLU parser. Dispatched task 'diagnose_vehicle'.",
  },
  {
    id: "verify",
    bay: "Verify Hoist",
    code: "BAY_02",
    label: "verify",
    start: 6.0,
    end: 13.0,
    action: "tool: read_obd link",
    detail: "Hydraulic hoist station. OBD-II communication protocol verified on Sedan #42.",
  },
  {
    id: "tool_bench",
    bay: "Tool Bench",
    code: "BAY_03",
    label: "tool_bench",
    start: 13.0,
    end: 22.0,
    action: "tool: read_obd exec",
    detail: "Diagnostic instrumentation bench. read_obd tool executed to poll DTC registers.",
  },
  {
    id: "eval_gate",
    bay: "Eval Gate",
    code: "GATE_01",
    label: "eval",
    start: 22.0,
    end: 29.0,
    action: "eval gate running",
    detail: "Automated regression verification gate. Checkpoint score: 0.12 (FAIL against benchmark P0420).",
  },
  {
    id: "sandbox_bay",
    bay: "Sandbox Bay",
    code: "BAY_04",
    label: "sandbox",
    start: 29.0,
    end: 37.4,
    action: "fault containment",
    detail: "Isolated fault containment chamber. Injected synthetic sensor delay; agent suggested wrong code.",
  },
];

export function getStageAtTime(t: number): WorkflowStage | undefined {
  return WORKFLOW_STAGES.find((s) => t >= s.start && t < s.end);
}

export function isFaultActiveAt(t: number): boolean {
  return t >= LIVE_TRACE.faultAt;
}

export function getCrtLogsAt(t: number): string[] {
  if (t < 6.0)
    return ["DIAG [v1.8.2]", "> AGENT: mechanic-bot", "> INTAKE: vehicle_diag", "> DISPATCH: ONLINE"];
  if (t < 13.0)
    return ["DIAG [v1.8.2]", "> PORT: ISO_15765_4", "> CAN_BUS: 500kbps", "> LINK: VERIFY OK"];
  if (t < 22.0)
    return ["DIAG [v1.8.2]", "> TOOL: read_obd", "> REG: 0x43 0x02", "> DTC: P0136 / B1000"];
  if (t < 29.0)
    return ["DIAG [v1.8.2]", "> EVAL GATE: RUNNING", "> BENCHMARK: P0420", "> CONFIDENCE: 0.12"];
  return ["DIAG [v1.8.2]", "> [!] FAULT ISOLATED", "> EXPECTED: P0420", "> EMITTED:  P0136 [FAIL]"];
}

/* Bot route in % of canvas – follows the blue circuit, then sandbox.
 * Waypoint times are aligned to WORKFLOW_STAGES above. */
const BOT_ROUTE: Array<[number, number, number]> = [
  [13.5, 38.5, 0], // dispatch desk
  [25.5, 38.5, 6], // verify entry
  [34.5, 41.0, 10], // verify car
  [48.0, 53.5, 15], // down to circuit (passes baked-bot spot – we erase that)
  [58.5, 53.0, 19], // along circuit
  [61.0, 42.0, 22], // tool bench
  [74.0, 58.0, 26], // eval gate
  [76.5, 48.0, 30], // sandbox door on fault
  [79.0, 48.5, 37.4],
];

export function getBotPosAt(t: number): { left: string; top: string; stageId: string } {
  if (t <= BOT_ROUTE[0][2]) {
    const s = getStageAtTime(t);
    return { left: `${BOT_ROUTE[0][0]}%`, top: `${BOT_ROUTE[0][1]}%`, stageId: s?.id ?? "dispatch" };
  }
  for (let i = 0; i < BOT_ROUTE.length - 1; i++) {
    const [x0, y0, t0] = BOT_ROUTE[i];
    const [x1, y1, t1] = BOT_ROUTE[i + 1];
    if (t >= t0 && t <= t1) {
      const k = (t - t0) / Math.max(0.0001, t1 - t0);
      const x = x0 + (x1 - x0) * k;
      const y = y0 + (y1 - y0) * k + Math.sin(t * 4) * 0.25;
      const s = getStageAtTime(t);
      return { left: `${x}%`, top: `${y}%`, stageId: s?.id ?? "dispatch" };
    }
  }
  const last = BOT_ROUTE[BOT_ROUTE.length - 1];
  const s = getStageAtTime(t);
  return { left: `${last[0]}%`, top: `${last[1]}%`, stageId: s?.id ?? "sandbox_bay" };
}

/* Timeline tracks – same times as backend spans, consumed by ReplayTimeline */
export const TIMELINE_TRACKS = {
  llm: [
    { start: 0.5, end: 6.5, label: "LLM Call: Initial Prompt & Plan" },
    { start: 14.5, end: 20.0, label: "LLM Call: Tool Result Synthesis" },
    { start: 31.0, end: 34.0, label: "LLM Call: Final Diagnostic Emission" },
  ],
  tools: [
    { start: 4.0, end: 13.0, label: "Tool: read_obd" },
    { start: 24.5, end: 26.5, label: "Tool: query_dtc_specs" },
    { start: 29.5, end: 30.5, label: "Tool: emit_verdict" },
    { start: 33.5, end: 34.5, label: "Tool: close_session" },
  ],
  env: [
    { start: 2.5, end: 4.0, label: "Environment: Container spin up" },
    { start: 16.0, end: 18.5, label: "Environment: OBD II CAN bus connected" },
    { start: 21.0, end: 23.0, label: "Environment: Injected simulated sensor lag" },
    { start: 30.2, end: 37.4, label: "Error / Failure: Expected P0420, got P0136", error: true },
  ],
  eval: [
    { start: 4.5, end: 7.0, label: "Evaluation Gate: Preconditions validated" },
    { start: 16.5, end: 20.0, label: "Evaluation Gate: Protocol safety checks" },
    { start: 35.0, end: 37.4, label: "Evaluation Gate: FAIL (DTC mismatch)", error: true },
  ],
} as const;
