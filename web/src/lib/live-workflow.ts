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
    bay: "Dispatch",
    code: "BAY_01",
    label: "dispatch",
    start: 0,
    end: 6.0,
    action: "intake parse",
    detail: "Dispatched diagnose_vehicle.",
  },
  {
    id: "verify",
    bay: "Verify Hoist",
    code: "BAY_02",
    label: "verify",
    start: 6.0,
    end: 13.0,
    action: "tool: read_obd link",
    detail: "OBD-II link verified on Sedan #42.",
  },
  {
    id: "tool_bench",
    bay: "Tool Bench",
    code: "BAY_03",
    label: "tool_bench",
    start: 13.0,
    end: 22.0,
    action: "tool: read_obd exec",
    detail: "read_obd polled DTC registers.",
  },
  {
    id: "eval_gate",
    bay: "Eval Gate",
    code: "GATE_01",
    label: "eval",
    start: 22.0,
    end: 29.0,
    action: "eval gate running",
    detail: "Checkpoint score 0.12. FAIL against P0420.",
  },
  {
    id: "sandbox_bay",
    bay: "Sandbox Bay",
    code: "BAY_04",
    label: "sandbox",
    start: 29.0,
    end: 37.4,
    action: "sandbox replay",
    detail: "Injected sensor delay. Agent returned the wrong code.",
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

/* Bot route in % of canvas – walks EXACTLY on the painted blue circuit
 * (orthogonal segments only, no diagonal shortcuts through "air"):
 *  blue line corners in px (794x465): (148,152)->(205,152)->(205,250)->
 *  (468,250)->(468,190)->(530,190)  =>  %: x/794*100, y/465*100.
 *  Dwell duplicated at stations so the bot stands (legs still) while the
 *  stage works, then walks. Off-line legs use floor aisles only. */
const BOT_ROUTE: Array<[number, number, number]> = [
  [14.2, 36.8, 0], // dispatch bay stand
  [14.2, 36.8, 4.0], // dwell: intake
  [18.6, 32.7, 5.5], // join blue line
  [25.8, 32.7, 7.5], // walk top horizontal to verify tap
  [25.8, 32.7, 10.0], // dwell: verify hoist
  [25.8, 53.8, 12.5], // walk down vertical
  [40.0, 53.8, 15.5], // walk bottom horizontal (passes center)
  [58.9, 53.8, 18.5], // reach corner
  [58.9, 40.9, 21.0], // walk up vertical to tool tap
  [58.9, 40.9, 23.5], // dwell: tool bench
  [66.7, 40.9, 25.0], // walk to line end
  [71.5, 47.0, 26.5], // aisle to eval approach
  [74.0, 55.0, 27.5], // eval gate stand
  [74.0, 55.0, 28.5], // dwell: eval
  [76.5, 48.0, 30.5], // aisle to sandbox door
  [79.0, 48.5, 32.0], // sandbox bay inside
  [79.0, 48.5, 37.4], // dwell: fault containment
];

/** Visible floor path polyline (for route glow overlay), in % coords. */
export const BOT_PATH_LINE: Array<[number, number]> = BOT_ROUTE.map(([x, y]) => [x, y]);

export function getBotPosAt(t: number): {
  left: string;
  top: string;
  stageId: string;
  dir: 1 | -1;
  moving: boolean;
} {
  const stageOf = (tt: number) => getStageAtTime(tt)?.id ?? "dispatch";
  if (t <= BOT_ROUTE[0][2]) {
    return { left: `${BOT_ROUTE[0][0]}%`, top: `${BOT_ROUTE[0][1]}%`, stageId: stageOf(t), dir: 1, moving: false };
  }
  for (let i = 0; i < BOT_ROUTE.length - 1; i++) {
    const [x0, y0, t0] = BOT_ROUTE[i];
    const [x1, y1, t1] = BOT_ROUTE[i + 1];
    if (t >= t0 && t <= t1) {
      const span = Math.max(0.0001, t1 - t0);
      const k = (t - t0) / span;
      // dwell segments: same point -> standing, not moving
      const dist = Math.hypot(x1 - x0, y1 - y0);
      const moving = dist > 0.01;
      const x = x0 + (x1 - x0) * k;
      const y = y0 + (y1 - y0) * k;
      const dir: 1 | -1 = x1 < x0 ? -1 : 1;
      return { left: `${x}%`, top: `${y}%`, stageId: stageOf(t), dir, moving };
    }
  }
  const last = BOT_ROUTE[BOT_ROUTE.length - 1];
  return { left: `${last[0]}%`, top: `${last[1]}%`, stageId: stageOf(t), dir: 1, moving: false };
}

/* Timeline tracks – same times as backend spans, consumed by ReplayTimeline */
export const TIMELINE_TRACKS = {
  llm: [
    { start: 0.5, end: 6.5, label: "LLM: plan" },
    { start: 14.5, end: 20.0, label: "LLM: tool result" },
    { start: 31.0, end: 34.0, label: "LLM: verdict" },
  ],
  tools: [
    { start: 4.0, end: 13.0, label: "Tool: read_obd" },
    { start: 24.5, end: 26.5, label: "Tool: query_dtc_specs" },
    { start: 29.5, end: 30.5, label: "Tool: emit_verdict" },
    { start: 33.5, end: 34.5, label: "Tool: close_session" },
  ],
  env: [
    { start: 2.5, end: 4.0, label: "Env: container up" },
    { start: 16.0, end: 18.5, label: "Env: OBD-II connected" },
    { start: 21.0, end: 23.0, label: "Env: injected sensor lag" },
    { start: 30.2, end: 37.4, label: "Fail: expected P0420, got P0136", error: true },
  ],
  eval: [
    { start: 4.5, end: 7.0, label: "Eval: preconditions" },
    { start: 16.5, end: 20.0, label: "Eval: protocol checks" },
    { start: 35.0, end: 37.4, label: "Eval: FAIL (DTC mismatch)", error: true },
  ],
} as const;
