import type { EdgeKind } from "./types";

export interface ReferenceNodeMetadata {
  id: string;
  label: string;
  runs: number;
  iconName:
    | "UserCheck"
    | "MessageSquare"
    | "HelpCircle"
    | "Database"
    | "FileCheck"
    | "Package"
    | "CreditCard"
    | "AlertTriangle"
    | "Mail"
    | "CheckCircle"
    | "Clock"
    | "XCircle"
    | "ShieldAlert";
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
  action: string;
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

export const AGENTGARAGE_NODES: Record<string, ReferenceNodeMetadata> = {
  customer_unverified: {
    id: "customer_unverified",
    label: "CUSTOMER UNVERIFIED",
    runs: 1248,
    iconName: "UserCheck",
    stateId: "S_CUSTOMER_UNVERIFIED",
    type: "Input State",
    category: "Inbound",
    firstSeen: "Apr 18, 2025 08:20",
    lastSeen: "Apr 28, 2025 13:01",
    totalRuns: 1248,
    successRate: "99.8%",
    description: "Initial inbound support session received by Strands refund agent with unauthenticated customer payload.",
    position: { x: 40, y: 320 },
    coverage: "99.8%",
    coverageDetail: "(1,245 / 1,248 runs)",
    riskScore: 0.02,
    riskLevel: "Low",
    stability: "+0.1%",
    transitions: [
      { action: "verify_customer", toId: "verify_identity", label: "VERIFY IDENTITY", count: 1180, percent: "94.5%", kind: "observed" },
      { action: "anonymous_exit", toId: "user_cancelled", label: "USER CANCELLED", count: 68, percent: "5.5%", kind: "predicted" },
    ],
    selectedAction: {
      name: "receive_payload",
      description: "Extracts customer token, session id, and refund request context.",
      usedIn: "1,248 runs",
      successRate: "99.9%",
      avgLatency: "45ms",
    },
  },
  user_cancelled: {
    id: "user_cancelled",
    label: "USER CANCELLED",
    runs: 102,
    iconName: "XCircle",
    stateId: "S_USER_CANCELLED",
    type: "Exit State",
    category: "User Intent",
    firstSeen: "Apr 21, 2025 12:15",
    lastSeen: "Apr 28, 2025 11:45",
    totalRuns: 102,
    successRate: "100%",
    description: "Customer chose to abort the refund conversation or closed the support session.",
    position: { x: 120, y: 500 },
    coverage: "95.1%",
    coverageDetail: "(97 / 102 runs)",
    riskScore: 0.11,
    riskLevel: "Low",
    stability: "+0.5%",
    transitions: [
      { action: "clean_exit", toId: "resolved", label: "RESOLVED", count: 98, percent: "96.1%", kind: "observed" },
    ],
    selectedAction: {
      name: "record_cancellation",
      description: "Releases pending holds and gracefully closes support context.",
      usedIn: "102 runs",
      successRate: "100%",
      avgLatency: "60ms",
    },
  },
  verify_identity: {
    id: "verify_identity",
    label: "VERIFY IDENTITY",
    runs: 1180,
    iconName: "UserCheck",
    stateId: "S_VERIFY_IDENTITY",
    type: "Tool Invocation",
    category: "Authentication",
    firstSeen: "Apr 18, 2025 08:21",
    lastSeen: "Apr 28, 2025 13:01",
    totalRuns: 1180,
    successRate: "96.8%",
    description: "Invokes verify_customer(customer_id) to validate account ownership before accessing ledger.",
    position: { x: 160, y: 320 },
    coverage: "96.8%",
    coverageDetail: "(1,142 / 1,180 runs)",
    riskScore: 0.08,
    riskLevel: "Low",
    stability: "+1.2%",
    transitions: [
      { action: "auth_success", toId: "customer_verified", label: "CUSTOMER VERIFIED", count: 1142, percent: "96.8%", kind: "observed" },
      { action: "auth_timeout", toId: "tool_timeout", label: "TOOL TIMEOUT", count: 38, percent: "3.2%", kind: "verified" },
    ],
    selectedAction: {
      name: "verify_customer",
      description: "Autonomous Strands tool confirming customer record and payment permissions.",
      usedIn: "1,180 runs",
      successRate: "96.8%",
      avgLatency: "115ms",
    },
  },
  customer_verified: {
    id: "customer_verified",
    label: "CUSTOMER VERIFIED",
    runs: 1142,
    iconName: "UserCheck",
    stateId: "S_CUSTOMER_VERIFIED",
    type: "Agent Context State",
    category: "Authentication",
    firstSeen: "Apr 18, 2025 08:21",
    lastSeen: "Apr 28, 2025 13:01",
    totalRuns: 1142,
    successRate: "97.5%",
    description: "World state updated: customer_verified=True. Safe to retrieve order details.",
    position: { x: 280, y: 320 },
    coverage: "97.5%",
    coverageDetail: "(1,113 / 1,142 runs)",
    riskScore: 0.07,
    riskLevel: "Low",
    stability: "+1.5%",
    transitions: [
      { action: "get_order", toId: "get_order", label: "GET ORDER", count: 892, percent: "78.1%", kind: "observed" },
      { action: "mid_run_403", toId: "escalate_to_human", label: "ESCALATE TO HUMAN", count: 52, percent: "4.6%", kind: "predicted" },
    ],
    selectedAction: {
      name: "bind_customer_claims",
      description: "Registers validated identity claims in contextvars world ledger.",
      usedIn: "1,142 runs",
      successRate: "99.2%",
      avgLatency: "35ms",
    },
  },
  get_order: {
    id: "get_order",
    label: "GET ORDER",
    runs: 892,
    iconName: "Database",
    stateId: "S_GET_ORDER",
    type: "Tool Invocation",
    category: "Orders",
    firstSeen: "Apr 18, 2025 08:22",
    lastSeen: "Apr 28, 2025 13:01",
    totalRuns: 892,
    successRate: "96.9%",
    description: "Invokes get_order(order_id) to retrieve purchase amount, order lines, and fulfillment date.",
    position: { x: 190, y: 170 },
    coverage: "96.9%",
    coverageDetail: "(864 / 892 runs)",
    riskScore: 0.12,
    riskLevel: "Low",
    stability: "+0.8%",
    transitions: [
      { action: "order_found", toId: "order_loaded", label: "ORDER LOADED", count: 864, percent: "96.9%", kind: "observed" },
      { action: "http_500", toId: "tool_timeout", label: "TOOL TIMEOUT", count: 28, percent: "3.1%", kind: "predicted" },
    ],
    selectedAction: {
      name: "get_order",
      description: "Queries order store for amount in cents and items.",
      usedIn: "892 runs",
      successRate: "96.9%",
      avgLatency: "90ms",
    },
  },
  order_loaded: {
    id: "order_loaded",
    label: "ORDER LOADED",
    runs: 864,
    iconName: "Database",
    stateId: "S_ORDER_LOADED",
    type: "Agent Context State",
    category: "Orders",
    firstSeen: "Apr 18, 2025 08:22",
    lastSeen: "Apr 28, 2025 13:01",
    totalRuns: 864,
    successRate: "95.8%",
    description: "Order data present in agent working memory. Evaluates eligibility rules.",
    position: { x: 390, y: 170 },
    coverage: "95.8%",
    coverageDetail: "(828 / 864 runs)",
    riskScore: 0.14,
    riskLevel: "Low",
    stability: "+1.9%",
    transitions: [
      { action: "approve_refund", toId: "refund_pending", label: "REFUND PENDING", count: 521, percent: "60.3%", kind: "observed" },
      { action: "suggest_replacement", toId: "offer_replacement", label: "OFFER REPLACEMENT", count: 210, percent: "24.3%", kind: "predicted" },
    ],
    selectedAction: {
      name: "evaluate_eligibility",
      description: "Checks 30-day refund window and amount bounds (e.g. 4200 cents).",
      usedIn: "864 runs",
      successRate: "97.4%",
      avgLatency: "80ms",
    },
  },
  offer_replacement: {
    id: "offer_replacement",
    label: "OFFER REPLACEMENT",
    runs: 312,
    iconName: "Package",
    stateId: "S_OFFER_REPLACEMENT",
    type: "Branch State",
    category: "Fulfillment",
    firstSeen: "Apr 21, 2025 11:30",
    lastSeen: "Apr 28, 2025 12:45",
    totalRuns: 312,
    successRate: "78.2%",
    description: "Agent suggests replacement merchandise or store voucher before cash reversal.",
    position: { x: 550, y: 170 },
    coverage: "82.4%",
    coverageDetail: "(257 / 312 runs)",
    riskScore: 0.22,
    riskLevel: "Medium",
    stability: "+1.2%",
    transitions: [
      { action: "voucher_sent", toId: "send_email", label: "SEND EMAIL", count: 180, percent: "57.7%", kind: "observed" },
      { action: "replacement_rejected", toId: "refund_pending", label: "REFUND PENDING", count: 90, percent: "28.8%", kind: "predicted" },
    ],
    selectedAction: {
      name: "issue_store_credit",
      description: "Generates store credit voucher for instant customer resolution.",
      usedIn: "312 runs",
      successRate: "91.2%",
      avgLatency: "240ms",
    },
  },
  refund_pending: {
    id: "refund_pending",
    label: "REFUND PENDING",
    runs: 428,
    iconName: "CreditCard",
    stateId: "S_REFUND_PENDING",
    type: "Critical Action State",
    category: "Finance",
    firstSeen: "Apr 21, 2025 10:14",
    lastSeen: "Apr 28, 2025 13:02",
    totalRuns: 428,
    successRate: "72.9%",
    description: "Refund has been approved by agent and is awaiting execution of issue_refund against ledger.",
    position: { x: 460, y: 340 },
    coverage: "92.1%",
    coverageDetail: "(392 / 425 runs)",
    riskScore: 0.31,
    riskLevel: "Medium",
    stability: "+2.4%",
    transitions: [
      { action: "ISSUE REFUND", toId: "issue_refund", label: "ISSUE REFUND", count: 312, percent: "72.9%", kind: "observed" },
      { action: "TOOL TIMEOUT", toId: "tool_timeout", label: "TOOL TIMEOUT", count: 87, percent: "20.3%", kind: "verified" },
      { action: "ESCALATE TO HUMAN", toId: "escalate_to_human", label: "ESCALATE TO HUMAN", count: 18, percent: "4.2%", kind: "predicted" },
      { action: "DOUBLE REFUND BUG", toId: "double_refund_detected", label: "DOUBLE REFUND BUG", count: 6, percent: "1.4%", kind: "verified" },
      { action: "OFFER REPLACEMENT", toId: "offer_replacement", label: "OFFER REPLACEMENT", count: 5, percent: "1.2%", kind: "protected" },
    ],
    selectedAction: {
      name: "issue_refund",
      description: "Calls Strands issue_refund tool to post financial reversal to world ledger.",
      usedIn: "428 runs",
      successRate: "95.6%",
      avgLatency: "1.2s",
    },
  },
  issue_refund: {
    id: "issue_refund",
    label: "ISSUE REFUND",
    runs: 310,
    iconName: "CreditCard",
    stateId: "S_ISSUE_REFUND",
    type: "Tool Invocation",
    category: "Finance",
    firstSeen: "Apr 21, 2025 10:15",
    lastSeen: "Apr 28, 2025 13:02",
    totalRuns: 310,
    successRate: "98.1%",
    description: "Executes issue_refund(order_id, amount). In v1.8.2 without idempotency_key, vulnerable on timeout.",
    position: { x: 590, y: 340 },
    coverage: "98.1%",
    coverageDetail: "(304 / 310 runs)",
    riskScore: 0.09,
    riskLevel: "Low",
    stability: "+0.9%",
    transitions: [
      { action: "refund_succeeded", toId: "refund_succeeded", label: "REFUND SUCCEEDED", count: 295, percent: "95.2%", kind: "observed" },
      { action: "timeout_after_success", toId: "tool_timeout", label: "TOOL TIMEOUT", count: 15, percent: "4.8%", kind: "verified" },
    ],
    selectedAction: {
      name: "post_ledger_refund",
      description: "Appends debit record to in-process memory ledger and checks keys.",
      usedIn: "310 runs",
      successRate: "98.7%",
      avgLatency: "920ms",
    },
  },
  tool_timeout: {
    id: "tool_timeout",
    label: "TOOL TIMEOUT",
    runs: 87,
    iconName: "Clock",
    stateId: "S_TOOL_TIMEOUT",
    type: "Verified Failure State",
    category: "Fault Injection",
    firstSeen: "Apr 22, 2025 14:10",
    lastSeen: "Apr 28, 2025 12:48",
    totalRuns: 87,
    successRate: "0.0%",
    description: "issue_refund times out after success (sb_07). Agent prompted to retry without idempotency key.",
    isFailure: true,
    position: { x: 560, y: 520 },
    coverage: "85.1%",
    coverageDetail: "(74 / 87 runs)",
    riskScore: 0.88,
    riskLevel: "High",
    stability: "-4.2%",
    transitions: [
      { action: "unbounded_retry", toId: "double_refund_detected", label: "DOUBLE REFUND BUG", count: 52, percent: "59.8%", kind: "verified" },
      { action: "escalate", toId: "escalate_to_human", label: "ESCALATE TO HUMAN", count: 35, percent: "40.2%", kind: "predicted" },
    ],
    selectedAction: {
      name: "reproduce_timeout_fault",
      description: "Adversarial sandbox sb_07 synthetic fault: timeout_after_success.",
      usedIn: "87 runs",
      successRate: "100%",
      avgLatency: "10,020ms",
    },
  },
  double_refund_detected: {
    id: "double_refund_detected",
    label: "DOUBLE REFUND BUG",
    runs: 42,
    iconName: "AlertTriangle",
    stateId: "S_DOUBLE_REFUND_DETECTED",
    type: "Verified Vulnerability",
    category: "Safety Invariant Failure",
    firstSeen: "Apr 22, 2025 14:12",
    lastSeen: "Apr 28, 2025 12:50",
    totalRuns: 42,
    successRate: "0.0%",
    description: "INVARIANT VIOLATION: refund_calls = 2 (expected <= 1). Real financial loss verified in sandbox.",
    isFailure: true,
    position: { x: 700, y: 520 },
    coverage: "92.0%",
    coverageDetail: "(42 / 42 verified)",
    riskScore: 0.98,
    riskLevel: "High",
    stability: "-12.5%",
    transitions: [
      { action: "promote_to_eval", toId: "resolved", label: "RESOLVED", count: 42, percent: "100%", kind: "protected" },
    ],
    selectedAction: {
      name: "assert_refund_invariant",
      description: "Asserts refund_calls <= 1 and blocks CI/CD regression deployment.",
      usedIn: "42 runs",
      successRate: "100%",
      avgLatency: "10ms",
    },
  },
  refund_succeeded: {
    id: "refund_succeeded",
    label: "REFUND SUCCEEDED",
    runs: 341,
    iconName: "CreditCard",
    stateId: "S_REFUND_SUCCEEDED",
    type: "Agent Context State",
    category: "Finance",
    firstSeen: "Apr 21, 2025 10:16",
    lastSeen: "Apr 28, 2025 13:02",
    totalRuns: 341,
    successRate: "99.1%",
    description: "World ledger: refund_status=refunded, ledger_refunds=1. Ready to notify customer.",
    position: { x: 720, y: 170 },
    coverage: "99.1%",
    coverageDetail: "(338 / 341 runs)",
    riskScore: 0.04,
    riskLevel: "Low",
    stability: "+0.5%",
    transitions: [
      { action: "send_email", toId: "send_email", label: "SEND EMAIL", count: 341, percent: "100%", kind: "observed" },
    ],
    selectedAction: {
      name: "mark_ledger_settled",
      description: "Updates ledger state with payment authorization code.",
      usedIn: "341 runs",
      successRate: "99.7%",
      avgLatency: "25ms",
    },
  },
  send_email: {
    id: "send_email",
    label: "SEND EMAIL",
    runs: 389,
    iconName: "Mail",
    stateId: "S_SEND_EMAIL",
    type: "Tool Invocation",
    category: "Notification",
    firstSeen: "Apr 18, 2025 08:24",
    lastSeen: "Apr 28, 2025 13:02",
    totalRuns: 389,
    successRate: "99.2%",
    description: "Invokes send_email(to, template='refund_done') to notify customer of refund completion.",
    position: { x: 740, y: 350 },
    coverage: "99.2%",
    coverageDetail: "(386 / 389 runs)",
    riskScore: 0.03,
    riskLevel: "Low",
    stability: "+0.4%",
    transitions: [
      { action: "email_dispatched", toId: "email_sent", label: "EMAIL SENT", count: 382, percent: "98.2%", kind: "observed" },
    ],
    selectedAction: {
      name: "send_email",
      description: "Sends refund_done template to customer email address.",
      usedIn: "389 runs",
      successRate: "99.5%",
      avgLatency: "140ms",
    },
  },
  email_sent: {
    id: "email_sent",
    label: "EMAIL SENT",
    runs: 382,
    iconName: "CheckCircle",
    stateId: "S_EMAIL_SENT",
    type: "Terminal State",
    category: "Notification",
    firstSeen: "Apr 18, 2025 08:25",
    lastSeen: "Apr 28, 2025 13:03",
    totalRuns: 382,
    successRate: "100%",
    description: "World state updated: email_sent=True. Customer notified successfully.",
    position: { x: 290, y: 510 },
    coverage: "100%",
    coverageDetail: "(382 / 382 runs)",
    riskScore: 0.01,
    riskLevel: "Low",
    stability: "+0.1%",
    transitions: [
      { action: "finish", toId: "resolved", label: "RESOLVED", count: 382, percent: "100%", kind: "observed" },
    ],
    selectedAction: {
      name: "emit_session_metric",
      description: "Emits OTLP completion span with total transaction time.",
      usedIn: "382 runs",
      successRate: "100%",
      avgLatency: "20ms",
    },
  },
  escalate_to_human: {
    id: "escalate_to_human",
    label: "ESCALATE TO HUMAN",
    runs: 276,
    iconName: "UserCheck",
    stateId: "S_ESCALATE_TO_HUMAN",
    type: "Fallback State",
    category: "Routing",
    firstSeen: "Apr 18, 2025 10:12",
    lastSeen: "Apr 28, 2025 12:55",
    totalRuns: 276,
    successRate: "89.1%",
    description: "Autonomous refund agent detects anomaly or policy mismatch and routes session to human supervisor.",
    position: { x: 380, y: 620 },
    coverage: "91.3%",
    coverageDetail: "(252 / 276 runs)",
    riskScore: 0.45,
    riskLevel: "Medium",
    stability: "-1.1%",
    transitions: [
      { action: "human_review", toId: "resolved", label: "RESOLVED", count: 210, percent: "76.1%", kind: "observed" },
    ],
    selectedAction: {
      name: "handshake_human_queue",
      description: "Locks world state and transfers telemetry transcript.",
      usedIn: "276 runs",
      successRate: "97.4%",
      avgLatency: "480ms",
    },
  },
  resolved: {
    id: "resolved",
    label: "RESOLVED",
    runs: 435,
    iconName: "CheckCircle",
    stateId: "S_RESOLVED",
    type: "Terminal State",
    category: "Resolution",
    firstSeen: "Apr 18, 2025 08:25",
    lastSeen: "Apr 28, 2025 13:03",
    totalRuns: 435,
    successRate: "100%",
    description: "Customer refund request fulfilled, audited, and preserved in regression test suite.",
    position: { x: 490, y: 630 },
    coverage: "100%",
    coverageDetail: "(435 / 435 runs)",
    riskScore: 0.01,
    riskLevel: "Low",
    stability: "+0.2%",
    transitions: [],
    selectedAction: {
      name: "close_transaction",
      description: "Generates permanent regression gate eval file.",
      usedIn: "435 runs",
      successRate: "100%",
      avgLatency: "30ms",
    },
  },
};

export const AGENTGARAGE_EDGES: ReferenceEdge[] = [
  // Intake & Identity Verification
  { id: "e1", from: "customer_unverified", to: "verify_identity", action: "verify_customer", kind: "observed" },
  { id: "e2", from: "customer_unverified", to: "user_cancelled", action: "anonymous_exit", kind: "predicted" },
  { id: "e3", from: "verify_identity", to: "customer_verified", action: "auth_success", kind: "observed" },
  { id: "e4", from: "verify_identity", to: "tool_timeout", action: "auth_timeout", kind: "verified" },

  // Orders
  { id: "e5", from: "customer_verified", to: "get_order", action: "get_order", kind: "observed" },
  { id: "e6", from: "customer_verified", to: "escalate_to_human", action: "mid_run_403", kind: "predicted" },
  { id: "e7", from: "get_order", to: "order_loaded", action: "order_found", kind: "observed" },
  { id: "e8", from: "get_order", to: "tool_timeout", action: "http_500", kind: "predicted" },

  // Policy & Replacement
  { id: "e9", from: "order_loaded", to: "refund_pending", action: "approve_refund", kind: "observed" },
  { id: "e10", from: "order_loaded", to: "offer_replacement", action: "suggest_replacement", kind: "predicted" },
  { id: "e11", from: "offer_replacement", to: "send_email", action: "voucher_sent", kind: "observed" },
  { id: "e12", from: "offer_replacement", to: "refund_pending", action: "replacement_rejected", kind: "predicted" },

  // Central Refund Pending Hub (exact match to reference UI)
  { id: "e13", from: "refund_pending", to: "issue_refund", action: "ISSUE REFUND", kind: "observed", runs: 312, percent: "72.9%" },
  { id: "e14", from: "refund_pending", to: "tool_timeout", action: "TOOL TIMEOUT", kind: "verified", runs: 87, percent: "20.3%" },
  { id: "e15", from: "refund_pending", to: "escalate_to_human", action: "ESCALATE TO HUMAN", kind: "predicted", runs: 18, percent: "4.2%" },
  { id: "e16", from: "refund_pending", to: "double_refund_detected", action: "DOUBLE REFUND BUG", kind: "verified", runs: 6, percent: "1.4%" },
  { id: "e17", from: "refund_pending", to: "offer_replacement", action: "OFFER REPLACEMENT", kind: "protected", runs: 5, percent: "1.2%" },

  // Execution & Settlement
  { id: "e18", from: "issue_refund", to: "refund_succeeded", action: "refund_succeeded", kind: "observed" },
  { id: "e19", from: "issue_refund", to: "tool_timeout", action: "timeout_after_success", kind: "verified" },
  { id: "e20", from: "tool_timeout", to: "double_refund_detected", action: "unbounded_retry", kind: "verified" },
  { id: "e21", from: "tool_timeout", to: "escalate_to_human", action: "escalate", kind: "predicted" },
  { id: "e22", from: "refund_succeeded", to: "send_email", action: "send_email", kind: "observed" },
  { id: "e23", from: "send_email", to: "email_sent", action: "email_dispatched", kind: "observed" },
  { id: "e24", from: "email_sent", to: "resolved", action: "finish", kind: "observed" },
  { id: "e25", from: "double_refund_detected", to: "resolved", action: "promote_to_eval", kind: "protected" },
  { id: "e26", from: "escalate_to_human", to: "resolved", action: "human_review", kind: "observed" },
  { id: "e27", from: "user_cancelled", to: "resolved", action: "clean_exit", kind: "observed" },
];

export const AGENTGARAGE_TRACE: ReferenceTraceData = {
  runId: "tr_84f2",
  timestamp: "Apr 28, 2025 12:41:03",
  stateCount: 8,
  duration: "42.6s",
  status: "Success",
  steps: [
    { id: "s1", nodeId: "customer_unverified", label: "CUSTOMER UNVERIFIED", time: "0.0s", status: "success" },
    { id: "s2", nodeId: "verify_identity", label: "VERIFY IDENTITY", time: "1.2s", status: "success" },
    { id: "s3", nodeId: "get_order", label: "GET ORDER", time: "3.4s", status: "success" },
    { id: "s4", nodeId: "customer_verified", label: "CUSTOMER VERIFIED", time: "5.1s", status: "success" },
    { id: "s5", nodeId: "refund_pending", label: "REFUND PENDING", time: "8.7s", status: "success" },
    { id: "s6", nodeId: "issue_refund", label: "ISSUE REFUND", time: "12.3s", status: "success" },
    { id: "s7", nodeId: "send_email", label: "SEND EMAIL", time: "28.1s", status: "success" },
    { id: "s8", nodeId: "resolved", label: "RESOLVED", time: "42.6s", status: "success" },
  ],
};
