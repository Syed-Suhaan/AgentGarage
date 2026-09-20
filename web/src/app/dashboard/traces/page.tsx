"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Clock } from "lucide-react";
import { useTraces } from "@/lib/hooks/use-traces";
import { DEMO_AGENT_ID } from "@/lib/agent";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";

export default function TracesPage() {
  const { data, isLoading } = useTraces(DEMO_AGENT_ID);
  const traces = data?.traces || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-dashed border-blue-500/30 bg-blue-500/10 px-3 py-0.5 text-[11px] font-mono text-blue-400 mb-2">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span>PHASE 1 — OBSERVED</span>
        </div>
        <h1 className="text-2xl font-normal text-[#f3f3f1] tracking-tight">Production Traces</h1>
        <p className="text-xs sm:text-sm text-[#8f8f8d] mt-1">
          Real execution traces and tool latency waterfalls captured from live agents.
          Seed the demo or point an agent at the collector to see traces here.
        </p>
      </div>

      {traces.length === 0 ? (
        <EmptyState
          icon={<Activity className="h-10 w-10 text-[#8f8f8d]" />}
          title="No traces yet"
          description="Run the walkthrough seed step or ingest OTLP traces — they will appear here and feed the behaviour graph."
        />
      ) : (
        <div className="space-y-4">
          {traces.map((trace) => {
            const spans = trace.spans || [];
            const totalMs = spans.reduce((s, sp) => s + (sp.duration_ms || 0), 0) || 1;
            const hasError = spans.some((sp) => sp.status === "error");

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
                    {spans.map((span, i) => (
                      <div
                        key={i}
                        className={`rounded flex items-center justify-center text-[10px] font-mono font-medium transition-all ${
                          span.status === "error"
                            ? "bg-red-500/20 text-red-400 border border-dashed border-red-500/40 shadow-sm"
                            : "bg-blue-500/15 text-blue-400 border border-dashed border-blue-500/30"
                        }`}
                        style={{ flex: (span.duration_ms || 1) / totalMs }}
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
      )}
    </div>
  );
}
