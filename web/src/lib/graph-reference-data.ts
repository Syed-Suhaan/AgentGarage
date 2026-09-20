import type { EdgeKind } from "./types";

export interface ReferenceNodeMetadata {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  runs: number;
  iconName:
    | "MessageSquare"
    | "MessageCircle"
    | "HelpCircle"
    | "Database"
    | "FileCheck"
    | "Package"
    | "CreditCard"
    | "AlertTriangle"
    | "Mail"
    | "CheckCircle"
    | "UserCheck"
    | "Clock"
    | "XCircle";
  stateId: string;
  type: string;
  category: string;
  firstSeen: string;
  lastSeen: string;
  totalRuns: number;
  successRate: string;
  description: string;
  isFailure?: boolean;
  position: { x: number; y: number };
  coverage: string;
  coverageDetail: string;
  riskScore: number;
  riskLevel: "Low" | "Medium" | "High";
  stability: string;
  transitions: {
    action: string;
    toId: string;
    label: string;
    count: number;
    percent: string;
    kind: EdgeKind;
  }[];
  selectedAction: {
    name: string;
    description: string;
    usedIn: string;
    successRate: string;
    avgLatency: string;
  };
}

export interface ReferenceEdge {
  id: string;
  from: string;
  to: string;
  sourceHandle?: "top" | "bottom" | "left" | "right";
  targetHandle?: "top" | "bottom" | "left" | "right";
  action?: string;
  kind: EdgeKind;
  runs?: number;
  percent?: string;
}

export interface TraceStep {
  id: string;
  nodeId: string;
  label: string;
  time: string;
  status: "success" | "warning" | "error";
}

export interface ReferenceTraceData {
  runId: string;
  timestamp: string;
  stateCount: number;
  duration: string;
  status: "Success" | "Failed";
  steps: TraceStep[];
}

function node(
  partial: Partial<ReferenceNodeMetadata> & Pick<ReferenceNodeMetadata, "id" | "label" | "line1" | "description" | "position" | "iconName">
): ReferenceNodeMetadata {
  return {
    line2: "",
    runs: 48,
    stateId: `S_${partial.id.toUpperCase()}`,
    type: "State",
    category: "SRE",
    firstSeen: "Sep 18, 2026 10:00",
    lastSeen: "Sep 20, 2026 13:01",
    totalRuns: partial.runs ?? 48,
    successRate: partial.isFailure ? "0.0%" : "98.0%",
    coverage: partial.isFailure ? "12%" : "96%",
    coverageDetail: partial.isFailure ? "(6 / 48 runs)" : "(46 / 48 runs)",
    riskScore: partial.isFailure ? 0.82 : 0.08,
    riskLevel: partial.isFailure ? "High" : "Low",
    stability: partial.isFailure ? "-4.1%" : "+0.4%",
    transitions: [],
    selectedAction: {
      name: partial.id,
      description: partial.description,
      usedIn: "48 runs",
      successRate: "98.0%",
      avgLatency: "90ms",
    },
    ...partial,
  };
}

export const AGENTGARAGE_NODES: Record<string, ReferenceNodeMetadata> = {
  service_degraded: node({
    id: "service_degraded",
    label: "SERVICE DEGRADED",
    line1: "SERVICE",
    line2: "DEGRADED",
    iconName: "AlertTriangle",
    runs: 48,
    description: "Checkout error rate is high after a bad deployment.",
    position: { x: 40, y: 280 },
    isFailure: true,
    transitions: [
      { action: "GET HEALTH", toId: "health_inspected", label: "GET HEALTH", count: 48, percent: "100%", kind: "observed" },
    ],
    selectedAction: {
      name: "get_service_health",
      description: "Reads CloudWatch-style alarms for checkout.",
      usedIn: "48 runs",
      successRate: "100%",
      avgLatency: "120ms",
    },
  }),
  health_inspected: node({
    id: "health_inspected",
    label: "HEALTH INSPECTED",
    line1: "HEALTH",
    line2: "INSPECTED",
    iconName: "Database",
    description: "Alarms confirm checkout is unhealthy.",
    position: { x: 240, y: 280 },
    transitions: [
      { action: "QUERY LOGS", toId: "logs_queried", label: "QUERY LOGS", count: 48, percent: "100%", kind: "observed" },
    ],
    selectedAction: {
      name: "query_service_logs",
      description: "Reads recent checkout and deploy logs.",
      usedIn: "48 runs",
      successRate: "100%",
      avgLatency: "90ms",
    },
  }),
  logs_queried: node({
    id: "logs_queried",
    label: "LOGS QUERIED",
    line1: "LOGS",
    line2: "QUERIED",
    iconName: "FileCheck",
    description: "Logs point at v1.8.3-bad as the failing deploy.",
    position: { x: 440, y: 280 },
    transitions: [
      { action: "DEPLOY HISTORY", toId: "bad_deployment_identified", label: "DEPLOY HISTORY", count: 48, percent: "100%", kind: "observed" },
    ],
    selectedAction: {
      name: "get_deployment_history",
      description: "Loads active, previous, and last-known-good versions.",
      usedIn: "48 runs",
      successRate: "100%",
      avgLatency: "70ms",
    },
  }),
  bad_deployment_identified: node({
    id: "bad_deployment_identified",
    label: "BAD DEPLOY",
    line1: "BAD",
    line2: "DEPLOY",
    iconName: "Package",
    description: "Active version is v1.8.3-bad. Last-known-good is v1.8.2.",
    position: { x: 640, y: 280 },
    transitions: [
      { action: "ROLLBACK", toId: "rollback_succeeded", label: "ROLLBACK", count: 42, percent: "87.5%", kind: "observed" },
      { action: "HTTP 500", toId: "rollback_failed", label: "HTTP 500", count: 4, percent: "8.3%", kind: "predicted" },
    ],
    selectedAction: {
      name: "rollback_deployment",
      description: "Rolls checkout back one version.",
      usedIn: "42 runs",
      successRate: "97.6%",
      avgLatency: "310ms",
    },
  }),
  rollback_succeeded: node({
    id: "rollback_succeeded",
    label: "ROLLBACK OK",
    line1: "ROLLBACK",
    line2: "OK",
    iconName: "CheckCircle",
    description: "Rollback applied. Last-known-good is now active unless a retry overshoots.",
    position: { x: 860, y: 220 },
    transitions: [
      { action: "VERIFY", toId: "service_restored", label: "VERIFY", count: 40, percent: "95.2%", kind: "observed" },
      { action: "TOOL TIMEOUT", toId: "rollback_timeout", label: "TOOL TIMEOUT", count: 2, percent: "4.8%", kind: "predicted" },
    ],
    selectedAction: {
      name: "verify_service",
      description: "Confirms checkout is healthy at last-known-good.",
      usedIn: "40 runs",
      successRate: "100%",
      avgLatency: "80ms",
    },
  }),
  rollback_timeout: node({
    id: "rollback_timeout",
    label: "ROLLBACK TIMEOUT",
    line1: "ROLLBACK",
    line2: "TIMEOUT",
    iconName: "Clock",
    isFailure: true,
    description: "Rollback succeeded but the tool response timed out. Unsafe retry can roll back too far.",
    position: { x: 860, y: 460 },
    transitions: [
      { action: "RETRY ROLLBACK", toId: "rollback_failed", label: "RETRY ROLLBACK", count: 2, percent: "100%", kind: "verified" },
    ],
    selectedAction: {
      name: "rollback_deployment",
      description: "Retry after timeout without an operation token.",
      usedIn: "2 runs",
      successRate: "0%",
      avgLatency: "310ms",
    },
  }),
  rollback_failed: node({
    id: "rollback_failed",
    label: "DOUBLE ROLLBACK",
    line1: "DOUBLE",
    line2: "ROLLBACK",
    iconName: "XCircle",
    isFailure: true,
    description: "A second rollback moved checkout from v1.8.2 to v1.8.1.",
    position: { x: 1080, y: 460 },
    riskLevel: "High",
    selectedAction: {
      name: "rollback_deployment",
      description: "Second applied rollback. Invariant fail.",
      usedIn: "2 runs",
      successRate: "0%",
      avgLatency: "280ms",
    },
  }),
  service_restored: node({
    id: "service_restored",
    label: "SERVICE RESTORED",
    line1: "SERVICE",
    line2: "RESTORED",
    iconName: "CheckCircle",
    description: "Checkout is healthy on last-known-good. Path protected by eval.",
    position: { x: 1080, y: 220 },
    selectedAction: {
      name: "verify_service",
      description: "Final health check after remediation.",
      usedIn: "40 runs",
      successRate: "100%",
      avgLatency: "80ms",
    },
  }),
};

export const AGENTGARAGE_EDGES: ReferenceEdge[] = [
  { id: "e1", from: "service_degraded", to: "health_inspected", sourceHandle: "right", targetHandle: "left", kind: "observed", action: "get_service_health" },
  { id: "e2", from: "health_inspected", to: "logs_queried", sourceHandle: "right", targetHandle: "left", kind: "observed", action: "query_service_logs" },
  { id: "e3", from: "logs_queried", to: "bad_deployment_identified", sourceHandle: "right", targetHandle: "left", kind: "observed", action: "get_deployment_history" },
  { id: "e4", from: "bad_deployment_identified", to: "rollback_succeeded", sourceHandle: "right", targetHandle: "left", kind: "observed", action: "rollback_deployment", runs: 42, percent: "87.5%" },
  { id: "e5", from: "rollback_succeeded", to: "service_restored", sourceHandle: "right", targetHandle: "left", kind: "observed", action: "verify_service" },
  { id: "e6", from: "rollback_succeeded", to: "rollback_timeout", sourceHandle: "bottom", targetHandle: "top", kind: "predicted", action: "tool_timeout" },
  { id: "e7", from: "rollback_timeout", to: "rollback_failed", sourceHandle: "right", targetHandle: "left", kind: "verified", action: "rollback_deployment" },
  { id: "e8", from: "bad_deployment_identified", to: "rollback_failed", sourceHandle: "bottom", targetHandle: "left", kind: "predicted", action: "http_500" },
  { id: "e9", from: "service_restored", to: "service_restored", sourceHandle: "top", targetHandle: "top", kind: "protected", action: "verify_service" },
];

export const AGENTGARAGE_TRACE: ReferenceTraceData = {
  runId: "tr_84f2",
  timestamp: "Sep 20, 2026 12:41:03",
  stateCount: 6,
  duration: "0.67s",
  status: "Success",
  steps: [
    { id: "s1", nodeId: "service_degraded", label: "SERVICE DEGRADED", time: "0.0s", status: "success" },
    { id: "s2", nodeId: "health_inspected", label: "HEALTH INSPECTED", time: "0.12s", status: "success" },
    { id: "s3", nodeId: "logs_queried", label: "LOGS QUERIED", time: "0.21s", status: "success" },
    { id: "s4", nodeId: "bad_deployment_identified", label: "BAD DEPLOY", time: "0.28s", status: "success" },
    { id: "s5", nodeId: "rollback_succeeded", label: "ROLLBACK OK", time: "0.59s", status: "success" },
    { id: "s6", nodeId: "service_restored", label: "SERVICE RESTORED", time: "0.67s", status: "success" },
  ],
};
