"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Clock, CheckCircle2 } from "lucide-react";

// Mock trace data for demo
const DEMO_TRACES = [
  {
    trace_id: "tr_84f2",
    agent_id: "sre-agent",
    agent_version: "1.8.2",
    started_at: "2026-09-18T10:00:00Z",
    spans: [
      { name: "get_service_health", tool: "get_service_health", status: "ok", duration_ms: 120 },
      { name: "query_service_logs", tool: "query_service_logs", status: "ok", duration_ms: 90 },
      { name: "get_deployment_history", tool: "get_deployment_history", status: "ok", duration_ms: 70 },
      { name: "rollback_deployment", tool: "rollback_deployment", status: "ok", duration_ms: 310 },
      { name: "verify_service", tool: "verify_service", status: "ok", duration_ms: 80 },
    ],
  },
  {
    trace_id: "tr_a1b3",
    agent_id: "sre-agent",
    agent_version: "1.8.2",
    started_at: "2026-09-18T10:15:00Z",
    spans: [
      { name: "get_service_health", tool: "get_service_health", status: "ok", duration_ms: 95 },
      { name: "get_deployment_history", tool: "get_deployment_history", status: "ok", duration_ms: 110 },
      { name: "rollback_deployment", tool: "rollback_deployment", status: "ok", duration_ms: 280 },
      { name: "verify_service", tool: "verify_service", status: "ok", duration_ms: 65 },
    ],
  },
  {
    trace_id: "tr_c7d9",
    agent_id: "sre-agent",
    agent_version: "1.8.3",
    started_at: "2026-09-18T11:30:00Z",
    spans: [
      { name: "get_service_health", tool: "get_service_health", status: "ok", duration_ms: 130 },
      { name: "rollback_deployment", tool: "rollback_deployment", status: "error", duration_ms: 5020 },
    ],
  },
];

export default function TracesPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-dashed border-blue-500/30 bg-blue-500/10 px-3 py-0.5 text-[11px] font-mono text-blue-400 mb-2">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span>PHASE 1 — OBSERVED</span>
        </div>
        <h1 className="text-2xl font-normal text-[#f3f3f1] tracking-tight">Production Traces</h1>
        <p className="text-xs sm:text-sm text-[#8f8f8d] mt-1">
          Real-time execution traces and tool latency waterfalls captured from live production agents.
        </p>
      </div>

      <div className="space-y-4">
        {DEMO_TRACES.map((trace) => {
          const totalMs = trace.spans.reduce((s, sp) => s + sp.duration_ms, 0);
          const hasError = trace.spans.some((sp) => sp.status === "error");

          return (
            <Card key={trace.trace_id} className="border border-dashed border-[#2a2a28] bg-[#141413] hover:border-[#3e3e3a] transition-all cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                      <Activity className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-mono text-sm font-semibold text-[#f3f3f1]">{trace.trace_id}</span>
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      v{trace.agent_version}
                    </Badge>
                    {hasError ? (
                      <Badge variant="destructive" className="text-[10px] font-mono">
                        Invariant Failed
                      </Badge>
                    ) : (
                      <Badge variant="observed" className="text-[10px] font-mono">
                        Success
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-[#8f8f8d]">
                    <Clock className="h-3 w-3" />
                    <span>{totalMs}ms</span>
                  </div>
                </div>

                {/* Span waterfall */}
                <div className="flex gap-1.5 h-7 p-1 rounded-lg bg-[#0b0b0a] border border-[#1f1f1d]">
                  {trace.spans.map((span, i) => (
                    <div
                      key={i}
                      className={`rounded flex items-center justify-center text-[10px] font-mono font-medium transition-all ${
                        span.status === "error"
                          ? "bg-red-500/20 text-red-400 border border-dashed border-red-500/40 shadow-sm"
                          : "bg-blue-500/15 text-blue-400 border border-dashed border-blue-500/30"
                      }`}
                      style={{ flex: span.duration_ms / totalMs }}
                      title={`${span.tool}: ${span.duration_ms}ms`}
                    >
                      <span className="truncate px-1.5">{span.tool.replace(/_/g, " ")} ({span.duration_ms}ms)</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
