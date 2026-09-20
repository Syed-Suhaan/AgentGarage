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

export const AGENTGARAGE_NODES: Record<string, ReferenceNodeMetadata> = {
  user_request: {
    id: "user_request",
    label: "USER REQUEST",
    line1: "USER",
    line2: "REQUEST",
    runs: 1248,
    iconName: "MessageSquare",
    stateId: "S_USER_REQUEST",
    type: "Inbound",
    category: "Inbound",
    firstSeen: "Apr 18, 2025 08:20",
    lastSeen: "Apr 28, 2025 13:01",
    totalRuns: 1248,
    successRate: "99.8%",
    description: "Initial customer support refund request received via chat interface.",
    position: { x: 60, y: 370 },
    coverage: "99.8%",
    coverageDetail: "(1,245 / 1,248 runs)",
    riskScore: 0.02,
    riskLevel: "Low",
    stability: "+0.1%",
    transitions: [
      { action: "CLASSIFY INTENT", toId: "classify_intent", label: "CLASSIFY INTENT", count: 892, percent: "71.5%", kind: "observed" },
      { action: "SMALL TALK", toId: "small_talk", label: "SMALL TALK", count: 118, percent: "9.5%", kind: "predicted" },
    ],
    selectedAction: {
      name: "receive_payload",
      description: "Ingests user request and parses intent context.",
      usedIn: "1,248 runs",
      successRate: "99.9%",
      avgLatency: "45ms",
    },
  },
  small_talk: {
    id: "small_talk",
    label: "SMALL TALK",
    line1: "SMALL",
    line2: "TALK",
    runs: 118,
    iconName: "MessageSquare",
    stateId: "S_SMALL_TALK",
    type: "Branch",
    category: "Dialogue",
    firstSeen: "Apr 19, 2025 14:02",
    lastSeen: "Apr 28, 2025 11:22",
    totalRuns: 118,
    successRate: "94.2%",
    description: "Casual conversation greeting prior to refund processing.",
    position: { x: 190, y: 550 },
    coverage: "88.5%",
    coverageDetail: "(104 / 118 runs)",
    riskScore: 0.05,
    riskLevel: "Low",
    stability: "+1.0%",
    transitions: [
      { action: "CLASSIFY INTENT", toId: "classify_intent", label: "CLASSIFY INTENT", count: 96, percent: "81.4%", kind: "observed" },
    ],
    selectedAction: {
      name: "generate_greeting",
      description: "Greets customer and requests refund details.",
      usedIn: "118 runs",
      successRate: "98.3%",
      avgLatency: "180ms",
    },
  },
  classify_intent: {
    id: "classify_intent",
    label: "CLASSIFY INTENT",
    line1: "CLASSIFY",
    line2: "INTENT",
    runs: 892,
    iconName: "MessageSquare",
    stateId: "S_CLASSIFY_INTENT",
    type: "Process",
    category: "NLU",
    firstSeen: "Apr 18, 2025 08:21",
    lastSeen: "Apr 28, 2025 13:01",
    totalRuns: 892,
    successRate: "91.3%",
    description: "Extracts order ID, item name, and refund reason from dialogue.",
    position: { x: 240, y: 370 },
    coverage: "94.2%",
    coverageDetail: "(840 / 892 runs)",
    riskScore: 0.12,
    riskLevel: "Low",
    stability: "+3.2%",
    transitions: [
      { action: "LOOKUP ORDER", toId: "lookup_order", label: "LOOKUP ORDER", count: 664, percent: "74.4%", kind: "observed" },
      { action: "ASK CLARIFICATION", toId: "ask_clarification", label: "ASK CLARIFICATION", count: 180, percent: "20.2%", kind: "predicted" },
    ],
    selectedAction: {
      name: "extract_entities",
      description: "Extracts order ID and validation parameters.",
      usedIn: "892 runs",
      successRate: "96.4%",
      avgLatency: "210ms",
    },
  },
  ask_clarification: {
    id: "ask_clarification",
    label: "ASK CLARIFICATION",
    line1: "ASK",
    line2: "CLARIFICATION",
    runs: 421,
    iconName: "HelpCircle",
    stateId: "S_ASK_CLARIFICATION",
    type: "Action",
    category: "Dialogue",
    firstSeen: "Apr 20, 2025 09:15",
    lastSeen: "Apr 28, 2025 12:40",
    totalRuns: 421,
    successRate: "88.1%",
    description: "Prompts user for missing order identifier or clarification.",
    position: { x: 250, y: 180 },
    coverage: "86.4%",
    coverageDetail: "(364 / 421 runs)",
    riskScore: 0.18,
    riskLevel: "Low",
    stability: "-0.5%",
    transitions: [
      { action: "LOOKUP ORDER", toId: "lookup_order", label: "LOOKUP ORDER", count: 350, percent: "83.1%", kind: "observed" },
    ],
    selectedAction: {
      name: "prompt_order_id",
      description: "Generates clarifying response for customer.",
      usedIn: "421 runs",
      successRate: "92.0%",
      avgLatency: "150ms",
    },
  },
  lookup_order: {
    id: "lookup_order",
    label: "LOOKUP ORDER",
    line1: "LOOKUP",
    line2: "ORDER",
    runs: 664,
    iconName: "Database",
    stateId: "S_LOOKUP_ORDER",
    type: "Tool",
    category: "Orders",
    firstSeen: "Apr 18, 2025 08:22",
    lastSeen: "Apr 28, 2025 13:01",
    totalRuns: 664,
    successRate: "96.5%",
    description: "Invokes get_order(order_id) against order database for amount and status.",
    position: { x: 440, y: 370 },
    coverage: "96.5%",
    coverageDetail: "(641 / 664 runs)",
    riskScore: 0.08,
    riskLevel: "Low",
    stability: "+1.8%",
    transitions: [
      { action: "VERIFY ELIGIBILITY", toId: "verify_eligibility", label: "VERIFY ELIGIBILITY", count: 521, percent: "78.5%", kind: "observed" },
      { action: "LOOKUP CUSTOMER", toId: "lookup_customer", label: "LOOKUP CUSTOMER", count: 120, percent: "18.1%", kind: "observed" },
    ],
    selectedAction: {
      name: "get_order",
      description: "Agent tool loading order total in cents (4200).",
      usedIn: "664 runs",
      successRate: "98.2%",
      avgLatency: "95ms",
    },
  },
  lookup_customer: {
    id: "lookup_customer",
    label: "LOOKUP CUSTOMER",
    line1: "LOOKUP",
    line2: "CUSTOMER",
    runs: 654,
    iconName: "Database",
    stateId: "S_LOOKUP_CUSTOMER",
    type: "Tool",
    category: "CRM",
    firstSeen: "Apr 18, 2025 08:22",
    lastSeen: "Apr 28, 2025 13:01",
    totalRuns: 654,
    successRate: "97.1%",
    description: "Invokes verify_customer(customer_id) to check customer record.",
    position: { x: 440, y: 560 },
    coverage: "97.1%",
    coverageDetail: "(635 / 654 runs)",
    riskScore: 0.06,
    riskLevel: "Low",
    stability: "+0.8%",
    transitions: [
      { action: "REFUND PENDING", toId: "refund_pending", label: "REFUND PENDING", count: 428, percent: "65.4%", kind: "observed" },
    ],
    selectedAction: {
      name: "verify_customer",
      description: "Validates customer authentication state.",
      usedIn: "654 runs",
      successRate: "99.1%",
      avgLatency: "80ms",
    },
  },
  verify_eligibility: {
    id: "verify_eligibility",
    label: "VERIFY ELIGIBILITY",
    line1: "VERIFY",
    line2: "ELIGIBILITY",
    runs: 521,
    iconName: "FileCheck",
    stateId: "S_VERIFY_ELIGIBILITY",
    type: "Rule",
    category: "Policy",
    firstSeen: "Apr 18, 2025 08:23",
    lastSeen: "Apr 28, 2025 13:01",
    totalRuns: 521,
    successRate: "89.4%",
    description: "Checks 30-day refund policy window and return status.",
    position: { x: 580, y: 180 },
    coverage: "91.2%",
    coverageDetail: "(475 / 521 runs)",
    riskScore: 0.15,
    riskLevel: "Low",
    stability: "+2.1%",
    transitions: [
      { action: "REFUND PENDING", toId: "refund_pending", label: "REFUND PENDING", count: 340, percent: "65.3%", kind: "observed" },
      { action: "OFFER REPLACEMENT", toId: "offer_replacement", label: "OFFER REPLACEMENT", count: 140, percent: "26.9%", kind: "predicted" },
    ],
    selectedAction: {
      name: "evaluate_policy",
      description: "Evaluates automated refund policy constraints.",
      usedIn: "521 runs",
      successRate: "96.0%",
      avgLatency: "110ms",
    },
  },
  offer_replacement: {
    id: "offer_replacement",
    label: "OFFER REPLACEMENT",
    line1: "OFFER",
    line2: "REPLACEMENT",
    runs: 312,
    iconName: "Package",
    stateId: "S_OFFER_REPLACEMENT",
    type: "Action",
    category: "Fulfillment",
    firstSeen: "Apr 21, 2025 11:30",
    lastSeen: "Apr 28, 2025 12:45",
    totalRuns: 312,
    successRate: "78.2%",
    description: "Agent offers customer product replacement or store credit.",
    position: { x: 810, y: 180 },
    coverage: "82.4%",
    coverageDetail: "(257 / 312 runs)",
    riskScore: 0.22,
    riskLevel: "Medium",
    stability: "+1.2%",
    transitions: [
      { action: "SEND CONFIRMATION", toId: "send_confirmation", label: "SEND CONFIRMATION", count: 180, percent: "57.7%", kind: "observed" },
      { action: "REFUND PENDING", toId: "refund_pending", label: "REFUND PENDING", count: 90, percent: "28.8%", kind: "predicted" },
    ],
    selectedAction: {
      name: "reserve_replacement",
      description: "Reserves replacement item from inventory.",
      usedIn: "312 runs",
      successRate: "91.2%",
      avgLatency: "240ms",
    },
  },
  refund_pending: {
    id: "refund_pending",
    label: "REFUND PENDING",
    line1: "REFUND",
    line2: "PENDING",
    runs: 428,
    iconName: "CreditCard",
    stateId: "S_REFUND_PENDING",
    type: "Action",
    category: "Finance",
    firstSeen: "Apr 21, 2025 10:14",
    lastSeen: "Apr 28, 2025 13:02",
    totalRuns: 428,
    successRate: "72.9%",
    description: "Refund has been approved and is awaiting payment provider confirmation.",
    position: { x: 660, y: 370 },
    coverage: "92.1%",
    coverageDetail: "(392 / 425 runs)",
    riskScore: 0.31,
    riskLevel: "Medium",
    stability: "+2.4%",
    transitions: [
      { action: "PROCESS REFUND", toId: "process_refund", label: "PROCESS REFUND", count: 312, percent: "72.9%", kind: "observed" },
      { action: "PAYMENT FAILED", toId: "payment_failed", label: "PAYMENT FAILED", count: 87, percent: "20.3%", kind: "verified" },
      { action: "ESCALATE TO HUMAN", toId: "escalate_to_human", label: "ESCALATE TO HUMAN", count: 18, percent: "4.2%", kind: "predicted" },
      { action: "TIMEOUT", toId: "timeout", label: "TIMEOUT", count: 6, percent: "1.4%", kind: "verified" },
      { action: "USER CANCELLED", toId: "user_cancelled", label: "USER CANCELLED", count: 5, percent: "1.2%", kind: "protected" },
    ],
    selectedAction: {
      name: "initiate_refund",
      description: "Calls payment provider to create a refund.",
      usedIn: "428 runs",
      successRate: "95.6%",
      avgLatency: "1.2s",
    },
  },
  process_refund: {
    id: "process_refund",
    label: "PROCESS REFUND",
    line1: "PROCESS",
    line2: "REFUND",
    runs: 310,
    iconName: "CreditCard",
    stateId: "S_PROCESS_REFUND",
    type: "Action",
    category: "Finance",
    firstSeen: "Apr 21, 2025 10:15",
    lastSeen: "Apr 28, 2025 13:02",
    totalRuns: 310,
    successRate: "98.1%",
    description: "Invokes issue_refund(order_id, amount) posting credit to customer ledger.",
    position: { x: 890, y: 370 },
    coverage: "98.1%",
    coverageDetail: "(304 / 310 runs)",
    riskScore: 0.09,
    riskLevel: "Low",
    stability: "+0.9%",
    transitions: [
      { action: "SEND CONFIRMATION", toId: "send_confirmation", label: "SEND CONFIRMATION", count: 295, percent: "95.2%", kind: "observed" },
      { action: "PAYMENT FAILED", toId: "payment_failed", label: "PAYMENT FAILED", count: 12, percent: "3.9%", kind: "verified" },
      { action: "USER CANCELLED", toId: "user_cancelled", label: "USER CANCELLED", count: 3, percent: "1.0%", kind: "protected" },
    ],
    selectedAction: {
      name: "issue_refund",
      description: "Agent tool posting debit to financial transaction ledger.",
      usedIn: "310 runs",
      successRate: "98.7%",
      avgLatency: "920ms",
    },
  },
  payment_failed: {
    id: "payment_failed",
    label: "PAYMENT FAILED",
    line1: "PAYMENT",
    line2: "FAILED",
    runs: 87,
    iconName: "AlertTriangle",
    stateId: "S_PAYMENT_FAILED",
    type: "Failure",
    category: "Finance",
    firstSeen: "Apr 22, 2025 14:10",
    lastSeen: "Apr 28, 2025 12:48",
    totalRuns: 87,
    successRate: "0.0%",
    description: "Payment gateway error or timeout_after_success fault injected in sandbox.",
    isFailure: true,
    position: { x: 810, y: 560 },
    coverage: "85.1%",
    coverageDetail: "(74 / 87 runs)",
    riskScore: 0.88,
    riskLevel: "High",
    stability: "-4.2%",
    transitions: [
      { action: "TIMEOUT", toId: "timeout", label: "TIMEOUT", count: 42, percent: "48.3%", kind: "verified" },
      { action: "ESCALATE TO HUMAN", toId: "escalate_to_human", label: "ESCALATE TO HUMAN", count: 35, percent: "40.2%", kind: "predicted" },
    ],
    selectedAction: {
      name: "log_gateway_decline",
      description: "Logs decline event in OTLP span metrics.",
      usedIn: "87 runs",
      successRate: "100%",
      avgLatency: "50ms",
    },
  },
  send_confirmation: {
    id: "send_confirmation",
    label: "SEND CONFIRMATION",
    line1: "SEND",
    line2: "CONFIRMATION",
    runs: 389,
    iconName: "Mail",
    stateId: "S_SEND_CONFIRMATION",
    type: "Action",
    category: "Notification",
    firstSeen: "Apr 21, 2025 10:16",
    lastSeen: "Apr 28, 2025 13:02",
    totalRuns: 389,
    successRate: "99.2%",
    description: "Invokes send_email(to, template='refund_done') to notify customer.",
    position: { x: 1030, y: 180 },
    coverage: "99.2%",
    coverageDetail: "(386 / 389 runs)",
    riskScore: 0.03,
    riskLevel: "Low",
    stability: "+0.4%",
    transitions: [
      { action: "RESOLVE", toId: "resolve", label: "RESOLVE", count: 382, percent: "98.2%", kind: "observed" },
    ],
    selectedAction: {
      name: "send_email",
      description: "Dispatches refund confirmation email template.",
      usedIn: "389 runs",
      successRate: "99.5%",
      avgLatency: "140ms",
    },
  },
  resolve: {
    id: "resolve",
    label: "RESOLVE",
    line1: "RESOLVE",
    line2: "",
    runs: 435,
    iconName: "CheckCircle",
    stateId: "S_RESOLVE",
    type: "Terminal",
    category: "Resolution",
    firstSeen: "Apr 18, 2025 08:25",
    lastSeen: "Apr 28, 2025 13:03",
    totalRuns: 435,
    successRate: "100%",
    description: "Refund completed successfully, invariants verified, session archived.",
    position: { x: 1110, y: 370 },
    coverage: "100%",
    coverageDetail: "(435 / 435 runs)",
    riskScore: 0.01,
    riskLevel: "Low",
    stability: "+0.2%",
    transitions: [],
    selectedAction: {
      name: "close_session",
      description: "Closes agent conversation contextvars session.",
      usedIn: "435 runs",
      successRate: "100%",
      avgLatency: "30ms",
    },
  },
  escalate_to_human: {
    id: "escalate_to_human",
    label: "ESCALATE TO HUMAN",
    line1: "ESCALATE",
    line2: "TO HUMAN",
    runs: 276,
    iconName: "UserCheck",
    stateId: "S_ESCALATE_TO_HUMAN",
    type: "Fallback",
    category: "Routing",
    firstSeen: "Apr 18, 2025 10:12",
    lastSeen: "Apr 28, 2025 12:55",
    totalRuns: 276,
    successRate: "89.1%",
    description: "Agent routes unresolved session to human agent queue with trace log.",
    position: { x: 550, y: 700 },
    coverage: "91.3%",
    coverageDetail: "(252 / 276 runs)",
    riskScore: 0.45,
    riskLevel: "Medium",
    stability: "-1.1%",
    transitions: [
      { action: "RESOLVE", toId: "resolve", label: "RESOLVE", count: 210, percent: "76.1%", kind: "observed" },
    ],
    selectedAction: {
      name: "transfer_zendesk",
      description: "Hands off trace context to human support desk.",
      usedIn: "276 runs",
      successRate: "97.4%",
      avgLatency: "480ms",
    },
  },
  timeout: {
    id: "timeout",
    label: "TIMEOUT",
    line1: "TIMEOUT",
    line2: "",
    runs: 60,
    iconName: "Clock",
    stateId: "S_TIMEOUT",
    type: "Failure",
    category: "System",
    firstSeen: "Apr 20, 2025 16:30",
    lastSeen: "Apr 28, 2025 12:48",
    totalRuns: 60,
    successRate: "0.0%",
    description: "Timeout fault occurred during refund execution. Agent retried.",
    isFailure: true,
    position: { x: 720, y: 700 },
    coverage: "78.3%",
    coverageDetail: "(47 / 60 runs)",
    riskScore: 0.79,
    riskLevel: "High",
    stability: "-5.0%",
    transitions: [
      { action: "ESCALATE TO HUMAN", toId: "escalate_to_human", label: "ESCALATE TO HUMAN", count: 48, percent: "80.0%", kind: "predicted" },
    ],
    selectedAction: {
      name: "abort_call",
      description: "Cancels connection and aborts execution timeout.",
      usedIn: "60 runs",
      successRate: "100%",
      avgLatency: "10,005ms",
    },
  },
  user_cancelled: {
    id: "user_cancelled",
    label: "USER CANCELLED",
    line1: "USER",
    line2: "CANCELLED",
    runs: 102,
    iconName: "XCircle",
    stateId: "S_USER_CANCELLED",
    type: "Exit",
    category: "User",
    firstSeen: "Apr 21, 2025 12:15",
    lastSeen: "Apr 28, 2025 11:45",
    totalRuns: 102,
    successRate: "100%",
    description: "Customer chose to abort the refund or close the chat widget.",
    position: { x: 1000, y: 560 },
    coverage: "95.1%",
    coverageDetail: "(97 / 102 runs)",
    riskScore: 0.11,
    riskLevel: "Low",
    stability: "+0.5%",
    transitions: [
      { action: "RESOLVE", toId: "resolve", label: "RESOLVE", count: 98, percent: "96.1%", kind: "observed" },
    ],
    selectedAction: {
      name: "record_cancellation",
      description: "Releases pending holds and cleanly concludes session.",
      usedIn: "102 runs",
      successRate: "100%",
      avgLatency: "60ms",
    },
  },
};

export const AGENTGARAGE_EDGES: ReferenceEdge[] = [
  // User Request & Intent
  { id: "e1", from: "user_request", to: "classify_intent", sourceHandle: "right", targetHandle: "left", kind: "observed" },
  { id: "e2", from: "user_request", to: "small_talk", sourceHandle: "bottom", targetHandle: "top", kind: "predicted" },
  { id: "e3", from: "small_talk", to: "classify_intent", sourceHandle: "top", targetHandle: "bottom", kind: "observed" },

  // Clarification & Orders
  { id: "e4", from: "classify_intent", to: "ask_clarification", sourceHandle: "top", targetHandle: "bottom", kind: "predicted" },
  { id: "e5", from: "classify_intent", to: "lookup_order", sourceHandle: "right", targetHandle: "left", kind: "observed" },
  { id: "e6", from: "ask_clarification", to: "lookup_order", sourceHandle: "right", targetHandle: "top", kind: "predicted" },

  // Order & Customer Lookups
  { id: "e7", from: "lookup_order", to: "verify_eligibility", sourceHandle: "top", targetHandle: "left", kind: "observed" },
  { id: "e8", from: "lookup_order", to: "lookup_customer", sourceHandle: "bottom", targetHandle: "top", kind: "observed" },
  { id: "e9", from: "lookup_customer", to: "refund_pending", sourceHandle: "right", targetHandle: "left", kind: "observed" },

  // Eligibility & Replacement
  { id: "e10", from: "verify_eligibility", to: "offer_replacement", sourceHandle: "right", targetHandle: "left", kind: "predicted" },
  { id: "e11", from: "verify_eligibility", to: "refund_pending", sourceHandle: "bottom", targetHandle: "top", kind: "observed" },
  { id: "e12", from: "offer_replacement", to: "send_confirmation", sourceHandle: "right", targetHandle: "left", kind: "predicted" },
  { id: "e13", from: "offer_replacement", to: "refund_pending", sourceHandle: "bottom", targetHandle: "top", kind: "predicted" },

  // Central Refund Pending Hub
  { id: "e14", from: "refund_pending", to: "process_refund", sourceHandle: "right", targetHandle: "left", kind: "observed", runs: 312, percent: "72.9%" },
  { id: "e15", from: "refund_pending", to: "payment_failed", sourceHandle: "bottom", targetHandle: "top", kind: "verified", runs: 87, percent: "20.3%" },
  { id: "e16", from: "refund_pending", to: "escalate_to_human", sourceHandle: "bottom", targetHandle: "top", kind: "predicted", runs: 18, percent: "4.2%" },
  { id: "e17", from: "refund_pending", to: "timeout", sourceHandle: "bottom", targetHandle: "top", kind: "verified", runs: 6, percent: "1.4%" },
  { id: "e18", from: "refund_pending", to: "user_cancelled", sourceHandle: "bottom", targetHandle: "left", kind: "protected", runs: 5, percent: "1.2%" },

  // Process Refund to Confirm / Fail / Cancel
  { id: "e19", from: "process_refund", to: "send_confirmation", sourceHandle: "top", targetHandle: "bottom", kind: "observed" },
  { id: "e20", from: "process_refund", to: "payment_failed", sourceHandle: "bottom", targetHandle: "top", kind: "verified" },
  { id: "e21", from: "process_refund", to: "user_cancelled", sourceHandle: "bottom", targetHandle: "top", kind: "protected" },

  // Terminal Flows
  { id: "e22", from: "send_confirmation", to: "resolve", sourceHandle: "bottom", targetHandle: "top", kind: "observed" },
  { id: "e23", from: "user_cancelled", to: "resolve", sourceHandle: "top", targetHandle: "bottom", kind: "predicted" },
  { id: "e24", from: "payment_failed", to: "timeout", sourceHandle: "bottom", targetHandle: "top", kind: "verified" },
  { id: "e25", from: "payment_failed", to: "escalate_to_human", sourceHandle: "bottom", targetHandle: "right", kind: "predicted" },
  { id: "e26", from: "timeout", to: "escalate_to_human", sourceHandle: "left", targetHandle: "right", kind: "predicted" },
  { id: "e27", from: "escalate_to_human", to: "resolve", sourceHandle: "right", targetHandle: "bottom", kind: "observed" },
];

export const AGENTGARAGE_TRACE: ReferenceTraceData = {
  runId: "7f3a9c2d",
  timestamp: "Apr 28, 2025 12:41:03",
  stateCount: 18,
  duration: "42.6s",
  status: "Success",
  steps: [
    { id: "s1", nodeId: "user_request", label: "USER REQUEST", time: "0.0s", status: "success" },
    { id: "s2", nodeId: "classify_intent", label: "CLASSIFY INTENT", time: "1.2s", status: "success" },
    { id: "s3", nodeId: "lookup_order", label: "CHECK ORDER", time: "3.4s", status: "success" },
    { id: "s4", nodeId: "lookup_customer", label: "LOOKUP CUSTOMER", time: "5.1s", status: "success" },
    { id: "s5", nodeId: "refund_pending", label: "REFUND PENDING", time: "8.7s", status: "success" },
    { id: "s6", nodeId: "process_refund", label: "PROCESS REFUND", time: "12.3s", status: "success" },
    { id: "s7", nodeId: "send_confirmation", label: "SEND CONFIRMATION", time: "28.1s", status: "success" },
    { id: "s8", nodeId: "resolve", label: "RESOLVE", time: "42.6s", status: "success" },
  ],
};
