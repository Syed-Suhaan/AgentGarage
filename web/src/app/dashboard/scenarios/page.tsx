"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useScenarios } from "@/lib/hooks/use-scenarios";
import { useStartSandbox } from "@/lib/hooks/use-sandbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { JsonViewer } from "@/components/shared/json-viewer";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Play, FlaskConical, Loader2 } from "lucide-react";

const AGENT_ID = "sre-agent";

function riskLabel(score?: number) {
  if (score == null) return null;
  const pct = Math.round(score * 100);
  return `${pct}% risk`;
}

export default function ScenariosPage() {
  const router = useRouter();
  const { data, isLoading } = useScenarios(AGENT_ID);
  const scenarios = (data?.scenarios || []).slice();
  scenarios.sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0));
  const [selected, setSelected] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const startSandbox = useStartSandbox();
  const active = scenarios.find((s) => s.scenario_id === selected) || scenarios[0] || null;

  async function runAndOpen(scenarioId: string) {
    setRunError(null);
    try {
      const started = await startSandbox.mutateAsync(scenarioId);
      router.push(`/dashboard/sandboxes/${started.sandbox_id}`);
    } catch (e) {
      setRunError(e instanceof Error ? e.message : "Sandbox run failed");
    }
  }

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-dashed border-red-500/40 bg-red-500/10 px-3 py-0.5 text-[11px] font-mono text-red-400 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
            <span>PHASE 3 — DANGER PATHS TEST</span>
          </div>
          <h1 className="text-2xl font-normal text-[#f3f3f1] tracking-tight">
            Danger Scenarios
          </h1>
          <p className="text-xs sm:text-sm text-[#8f8f8d] mt-1">
            World model predicts · Jev ranks by risk · sandbox verifies highest first.
          </p>
        </div>
        <Link href="/dashboard/sandboxes">
          <Button
            size="sm"
            variant="outline"
            className="border-dashed border-red-500/30 bg-red-500/10 hover:border-red-500 text-red-400 text-xs font-mono"
          >
            Open Danger Paths Test (with sandbox) →
          </Button>
        </Link>
      </div>

      {runError && (
        <p className="text-xs font-mono text-red-400 rounded-lg border border-dashed border-red-500/40 bg-red-500/5 px-3 py-2">
          {runError}
        </p>
      )}

      {scenarios.length === 0 ? (
        <EmptyState
          icon={<FlaskConical className="h-10 w-10 text-[#8f8f8d]" />}
          title="No predicted scenarios yet"
          description="Invent a dangerous path on the Unexplored Paths page — the world model prediction will land here, ranked by risk."
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {scenarios.map((s, i) => (
              <Card
                key={s.scenario_id}
                className="cursor-pointer transition-all border border-dashed border-[#2a2a28] bg-[#141413] hover:border-zinc-400/50 hover:bg-[#181816]"
                onClick={() => setSelected(s.scenario_id)}
              >
                <CardHeader className="pb-3 border-b border-[#1f1f1d]">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm font-mono text-[#f3f3f1]">
                      {i === 0 ? "↑ " : ""}
                      {s.scenario_id}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {s.risk_score != null ? (
                        <span className="text-[10px] font-mono text-red-400 border border-dashed border-red-500/40 px-2 py-0.5 rounded">
                          {riskLabel(s.risk_score)}
                        </span>
                      ) : null}
                      <StatusBadge status={s.status} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5">
                  <p className="text-xs font-mono text-[#8f8f8d] mb-3 leading-relaxed">
                    {s.hypothesis}
                  </p>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-[#8f8f8d]">Injected Fault:</span>
                    <code className="rounded border border-dashed border-red-500/40 bg-red-500/10 px-2 py-0.5 text-red-400">
                      {s.fault.tool} → {s.fault.behavior}
                    </code>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {active && (
            <Card className="border border-dashed border-[#2a2a28] bg-[#141413] shadow-2xl">
              <CardHeader className="border-b border-[#1f1f1d]">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-mono text-[#f3f3f1]">
                    Scenario Detail: {active.scenario_id}
                    {active.risk_score != null
                      ? ` · ${riskLabel(active.risk_score)} (${active.rank_source || "rank"})`
                      : ""}
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={() => runAndOpen(active.scenario_id)}
                    disabled={startSandbox.isPending}
                    className="bg-[#3b76ff] hover:bg-blue-500 text-white font-mono text-xs"
                  >
                    {startSandbox.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Play className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Launch Sandbox Verification
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <h4 className="text-xs font-mono uppercase text-[#8f8f8d] mb-2 tracking-wider">
                    Failure Hypothesis
                  </h4>
                  <p className="text-sm font-mono text-[#f3f3f1] bg-[#0b0b0a] border border-[#1f1f1d] p-3 rounded-lg">
                    {active.hypothesis}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-mono uppercase text-[#8f8f8d] mb-2 tracking-wider">
                    Fault Injection Configuration
                  </h4>
                  <JsonViewer data={active.fault} />
                </div>
                <div>
                  <h4 className="text-xs font-mono uppercase text-[#8f8f8d] mb-2 tracking-wider">
                    Initial State Variables
                  </h4>
                  <JsonViewer data={active.initial_state} />
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
