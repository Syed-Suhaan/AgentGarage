"use client";

import { useState } from "react";
import { useEvals, useRunEvals } from "@/lib/hooks/use-evals";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { JsonViewer } from "@/components/shared/json-viewer";
import {
  ShieldCheck,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import type { Eval, EvalRunResult } from "@/lib/types";

export default function EvalsPage() {
  const { data, isLoading } = useEvals();
  const runEvals = useRunEvals();
  const [runResult, setRunResult] = useState<EvalRunResult | null>(null);
  const [version, setVersion] = useState("1.8.3");

  if (isLoading) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const evals = data?.evals || [];

  const handleRunEvals = async () => {
    const result = await runEvals.mutateAsync({ agent_version: version });
    setRunResult(result);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-dashed border-amber-500/30 bg-amber-500/10 px-3 py-0.5 text-[11px] font-mono text-amber-400 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>PHASE 4 — PROTECTED</span>
          </div>
          <h1 className="text-2xl font-normal text-[#f3f3f1] tracking-tight">Regression Evals Suite</h1>
          <p className="text-xs sm:text-sm text-[#8f8f8d] mt-1">
            Permanent evaluation gates converted from verified failures with zero false positives.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <input
            type="text"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            className="h-9 w-28 rounded-lg border border-dashed border-[#2a2a28] bg-[#141413] px-3 text-xs font-mono text-[#f3f3f1] focus:border-[#3b76ff] focus:outline-none"
            placeholder="v1.8.3"
          />
          <Button
            size="sm"
            onClick={handleRunEvals}
            disabled={runEvals.isPending}
            className="bg-[#3b76ff] hover:bg-blue-500 text-white font-mono text-xs px-4"
          >
            {runEvals.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <Play className="h-3.5 w-3.5 mr-1.5" />
            )}
            Run Evals
          </Button>
        </div>
      </div>

      {/* Run results */}
      {runResult && (
        <Card
          className={
            runResult.failed === 0
              ? "border border-dashed border-emerald-500/40 bg-emerald-500/5"
              : "border border-dashed border-red-500/40 bg-red-500/5"
          }
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {runResult.failed === 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <p className="text-sm font-semibold text-[#f3f3f1] font-mono">
                    Eval Run: v{version}
                  </p>
                  <p className="text-xs font-mono text-[#8f8f8d]">
                    {runResult.passed} passed, {runResult.failed} failed
                  </p>
                </div>
              </div>
              <Badge
                variant={
                  runResult.failed === 0 ? "observed" : "destructive"
                }
                className="font-mono text-xs"
              >
                {runResult.failed === 0 ? "ALL PASS" : "FAILURES DETECTED"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Eval cards */}
      <div className="space-y-4">
        {evals.map((ev: Eval) => (
          <Card key={ev.id} className="border border-dashed border-[#2a2a28] bg-[#141413] hover:border-amber-500/40 transition-all">
            <CardHeader className="pb-3 border-b border-[#1f1f1d]">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-mono text-[#f3f3f1]">{ev.id}</CardTitle>
                <StatusBadge status={ev.status} />
              </div>
              <CardDescription className="text-xs font-mono text-[#8f8f8d]">
                Origin: {ev.origin.trace_id} → {ev.origin.scenario_id}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="text-xs font-mono text-[#8f8f8d] uppercase mb-2">
                    Fault Injection
                  </h4>
                  <code className="text-xs font-mono text-red-400 bg-[#0b0b0a] border border-[#1f1f1d] px-2.5 py-1 rounded block">
                    {ev.fault.tool} → {ev.fault.behavior}
                  </code>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                    Agent
                  </h4>
                  <code className="text-xs text-zinc-400">
                    {ev.agent.id} v{ev.agent.version}
                  </code>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Invariants
                </h4>
                <div className="flex flex-wrap gap-2">
                  {ev.invariants.map((inv, i) => (
                    <Badge key={i} variant="outline" className="font-mono text-xs">
                      {inv}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Initial State
                </h4>
                <JsonViewer data={ev.initial_state} />
              </div>

              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Pass / Fail History
                </h4>
                <div className="flex items-center gap-1.5">
                  {["pass", "pass", "fail", "pass"].map((h, i) => (
                    <span
                      key={i}
                      title={`v1.8.${i} — ${h}`}
                      className={`h-2.5 w-8 rounded-sm ${
                        h === "pass" ? "bg-green-500/70" : "bg-red-500/80"
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-[11px] text-muted-foreground">
                    v1.8.0 → v1.8.3 · hover for version
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
