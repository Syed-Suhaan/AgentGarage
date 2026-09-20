"use client";

import { useState } from "react";
import { invariantExpected, invariantOk } from "@/lib/invariants";
import { useSandbox } from "@/lib/hooks/use-sandbox";
import { usePromoteSandbox } from "@/lib/hooks/use-sandboxes";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Terminal,
  FileText,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

function spanLine(sp: Record<string, unknown>, i: number) {
  const tool = String(sp.tool || sp.name || `step_${i}`);
  const status = String(sp.status || "ok");
  const ms = sp.duration_ms != null ? ` (${sp.duration_ms}ms)` : "";
  const color =
    status === "ok"
      ? "text-blue-400"
      : status === "timeout"
        ? "text-amber-400"
        : "text-red-400";
  return (
    <p key={i} className={color}>
      {">"} Agent called: {tool}
      {ms} → {status}
    </p>
  );
}

export default function SandboxDetail({ sandboxId }: { sandboxId: string }) {
  const { data: sandbox, isLoading } = useSandbox(sandboxId || "sb_07");
  const promote = usePromoteSandbox();
  const [promoteMsg, setPromoteMsg] = useState<string | null>(null);

  if (isLoading || !sandbox) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isRunning = sandbox.status === "running";
  const isFail = sandbox.status === "verified_fail";
  const log = sandbox.log || [];
  const fault = sandbox.fault;

  async function handlePromote() {
    setPromoteMsg(null);
    try {
      const res = await promote.mutateAsync(sandbox.sandbox_id);
      setPromoteMsg(
        res.compiled ? `Promoted → ${res.eval_id}` : res.reason || "Not compiled (sandbox passed)."
      );
    } catch (e) {
      setPromoteMsg(e instanceof Error ? e.message : "Promote failed");
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-dashed border-red-500/30 bg-red-500/10 px-3 py-0.5 text-[11px] font-mono text-red-400 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
            <span>ADVERSARIAL EXECUTION ENVIRONMENT{sandbox.runtime ? ` · ${sandbox.runtime}` : ""}</span>
          </div>
          <h1 className="text-2xl font-normal text-[#f3f3f1] tracking-tight">
            Sandbox {sandbox.sandbox_id}
          </h1>
          <p className="text-xs sm:text-sm text-[#8f8f8d] mt-1">
            Isolated execution environment validating real agent behaviour against injected faults.
            {sandbox.scenario_id ? ` Scenario: ${sandbox.scenario_id}.` : ""}
            {fault ? ` Fault: ${fault.tool} → ${fault.behavior}.` : ""}
          </p>
        </div>
        <Badge
          variant={
            isFail ? "destructive" : isRunning ? "secondary" : "observed"
          }
          className="text-xs px-3.5 py-1.5 font-mono uppercase"
        >
          {isRunning && <Loader2 className="h-3 w-3 animate-spin mr-1.5" />}
          {sandbox.status.replace(/_/g, " ")}
        </Badge>
      </div>

      {/* Invariant Results */}
      {sandbox.invariants && (
        <div>
          <h2 className="text-xs font-mono uppercase text-[#8f8f8d] mb-3 flex items-center gap-2 tracking-wider">
            <FileText className="h-4 w-4 text-[#3b76ff]" />
            Safety Invariant Results
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(sandbox.invariants).map(([key, value]) => {
              if (key === "passed") return null;
              const passed = invariantOk(
                key,
                value,
                sandbox.invariants as Record<string, unknown>
              );
              return (
                <Card
                  key={key}
                  className={
                    passed
                      ? "border border-dashed border-emerald-500/40 bg-emerald-500/5"
                      : "border border-dashed border-red-500/40 bg-red-500/5"
                  }
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-mono text-[#8f8f8d] uppercase tracking-wider">
                          {key.replace(/_/g, " ")}
                        </p>
                        <p className="text-2xl font-mono font-semibold text-[#f3f3f1] mt-1">
                          {String(value)}
                        </p>
                      </div>
                      {passed ? (
                        <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-500" />
                      )}
                    </div>
                    <p className="text-[11px] font-mono mt-2 text-[#8f8f8d]">
                      {invariantExpected(key)}
                    </p>
                  </CardContent>
                </Card>
              );
            })}

            <Card
              className={
                sandbox.invariants.passed
                  ? "border border-dashed border-emerald-500/40 bg-emerald-500/5"
                  : "border border-dashed border-red-500/40 bg-red-500/5"
              }
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-mono text-[#8f8f8d] uppercase tracking-wider">
                      Overall Status
                    </p>
                    <p className="text-2xl font-mono font-semibold text-[#f3f3f1] mt-1">
                      {sandbox.invariants.passed ? "PASSED" : "VIOLATION"}
                    </p>
                  </div>
                  {sandbox.invariants.passed ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-500" />
                  )}
                </div>
                <p className="text-[11px] font-mono mt-2 text-[#8f8f8d]">
                  {sandbox.invariants.passed
                    ? "No eval compiled — passes never become gates"
                    : "Auto-compiled to a permanent eval on failure"}
                </p>
                {isFail && (
                  <div className="mt-3">
                    <Button
                      size="sm"
                      onClick={handlePromote}
                      disabled={promote.isPending}
                      className="bg-amber-500 hover:bg-amber-600 text-black font-mono text-[11px] h-7"
                    >
                      {promote.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                      ) : (
                        <ShieldCheck className="h-3 w-3 mr-1.5" />
                      )}
                      Promote to protected eval
                    </Button>
                    {promoteMsg && (
                      <p className="mt-2 text-[11px] font-mono text-amber-300">{promoteMsg}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Sandbox Log — rendered from the real agent spans */}
      <div>
        <h2 className="text-xs font-mono uppercase text-[#8f8f8d] mb-3 flex items-center gap-2 tracking-wider">
          <Terminal className="h-4 w-4 text-[#3b76ff]" />
          Execution Log Output
        </h2>
        <Card className="border border-dashed border-[#2a2a28] bg-[#141413] overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-[#0b0b0a] p-5 font-mono text-xs leading-relaxed max-h-96 overflow-auto border-t border-[#1f1f1d]">
              <p className="text-[#8f8f8d]">
                {">"} Sandbox {sandbox.sandbox_id} started{sandbox.runtime ? ` (${sandbox.runtime})` : ""}
              </p>
              {sandbox.initial_state != null && (
                <p className="text-zinc-400">
                  {">"} Restoring initial state: {JSON.stringify(sandbox.initial_state)}
                </p>
              )}
              {fault && (
                <p className="text-zinc-400">
                  {">"} Injecting fault: {fault.tool} → {fault.behavior}
                </p>
              )}
              {log.length === 0 ? (
                <p className="text-zinc-600">
                  {">"} {isRunning ? "Running simulation..." : "No spans recorded."}
                </p>
              ) : (
                log.map((sp, i) => spanLine(sp as Record<string, unknown>, i))
              )}
              <p className="text-zinc-600">{">"} ──────────────────────────────────────</p>
              {sandbox.invariants && !sandbox.invariants.passed && (
                <p className="text-red-400 font-bold">
                  {">"} INVARIANT FAIL: rollback_count = {String(sandbox.invariants.rollback_count)} (expected ≤ 1)
                </p>
              )}
              <p className={isFail ? "text-red-400" : "text-emerald-400"}>{">"} Status: {sandbox.status}</p>
              {isRunning && (
                <p className="text-amber-400 animate-pulse">
                  {">"} Running simulation...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Log file reference */}
      {sandbox.log_s3 && (
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#8f8f8d]">
          <span>
            Log storage:{" "}
            <code className="text-[#f3f3f1] bg-[#141413] border border-dashed border-[#2a2a28] px-2 py-0.5 rounded">{sandbox.log_s3}</code>
          </span>
          {sandbox.origin_trace && (
            <Link href="/dashboard/traces">
              <Button size="sm" variant="outline" className="h-7 text-[11px] font-mono border-dashed border-[#2a2a28] bg-[#141413] hover:border-zinc-400">
                View trace {sandbox.origin_trace} <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          )}
          <Link href="/dashboard/evals">
            <Button size="sm" variant="outline" className="h-7 text-[11px] font-mono border-dashed border-[#2a2a28] bg-[#141413] hover:border-zinc-400">
              View eval file <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
