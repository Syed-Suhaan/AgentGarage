"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Terminal, ArrowRight, Play, FlaskConical, Loader2 } from "lucide-react";
import { useStartSandbox } from "@/lib/hooks/use-sandbox";
import { useSandboxes } from "@/lib/hooks/use-sandboxes";
import { useScenarios } from "@/lib/hooks/use-scenarios";
import { DEMO_AGENT_ID } from "@/lib/agent";
import { StatusBadge } from "@/components/shared/status-badge";
import { JsonViewer } from "@/components/shared/json-viewer";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import type { Scenario } from "@/lib/types";

export default function SandboxesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"sandboxes" | "scenarios">("sandboxes");
  const { data: sbData, isLoading: sbLoading } = useSandboxes();
  const { data: scData, isLoading: scLoading } = useScenarios(DEMO_AGENT_ID);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const startSandbox = useStartSandbox();

  const sandboxes = useMemo(() => sbData?.sandboxes || [], [sbData]);
  const scenarios: Scenario[] = useMemo(() => {
    const rows = (scData?.scenarios || []).slice();
    rows.sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0));
    return rows;
  }, [scData]);
  const selectedScenario = scenarios.find((s) => s.scenario_id === selectedId) || scenarios[0] || null;

  async function runAndOpen(scenarioId: string) {
    setRunError(null);
    try {
      const started = await startSandbox.mutateAsync(scenarioId);
      router.push(`/dashboard/sandboxes/${started.sandbox_id}`);
    } catch (e) {
      setRunError(e instanceof Error ? e.message : "Sandbox run failed");
    }
  }

  const loading = sbLoading || scLoading;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-dashed border-red-500/30 bg-red-500/10 px-3 py-0.5 text-[11px] font-mono text-red-400 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
            <span>PHASE 3 — DANGER PATHS VERIFICATION</span>
          </div>
          <h1 className="text-2xl font-normal text-[#f3f3f1] tracking-tight flex items-baseline gap-2.5 flex-wrap">
            <span>Danger Paths Test</span>
            <span className="text-sm font-mono text-red-400 font-normal">
              (with sandbox)
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8f8f8d] mt-1">
            Isolated sandboxes running synthetic fault injections to empirically verify dangerous agent execution paths.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center rounded-xl border border-dashed border-[#2a2a28] bg-[#141413] p-1">
          <button
            onClick={() => setActiveTab("sandboxes")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-mono transition-all",
              activeTab === "sandboxes"
                ? "bg-[#1f1f1d] text-white border border-[#2a2a28] shadow-sm"
                : "text-[#8f8f8d] hover:text-[#f3f3f1]"
            )}
          >
            <Terminal className="h-3.5 w-3.5 text-red-400" />
            <span>Active Sandboxes ({sandboxes.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("scenarios")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-mono transition-all",
              activeTab === "scenarios"
                ? "bg-[#1f1f1d] text-white border border-[#2a2a28] shadow-sm"
                : "text-[#8f8f8d] hover:text-[#f3f3f1]"
            )}
          >
            <FlaskConical className="h-3.5 w-3.5 text-amber-400" />
            <span>Danger Scenarios ({scenarios.length})</span>
          </button>
        </div>
      </div>

      {runError && (
        <p className="text-xs font-mono text-red-400 rounded-lg border border-dashed border-red-500/40 bg-red-500/5 px-3 py-2">
          {runError}
        </p>
      )}

      {loading ? (
        <div className="space-y-4"><CardSkeleton /><CardSkeleton /></div>
      ) : activeTab === "sandboxes" ? (
        <div className="space-y-4">
          {sandboxes.length === 0 ? (
            <EmptyState
              icon={<Terminal className="h-10 w-10 text-[#8f8f8d]" />}
              title="No sandbox runs yet"
              description="Invent a path on the Gaps page or pick a scenario below and run it — results appear here with invariant verdicts."
            />
          ) : (
            sandboxes.map((sb) => (
              <Link key={sb.sandbox_id} href={`/dashboard/sandboxes/${sb.sandbox_id}`}>
                <Card className="cursor-pointer transition-all border border-dashed border-[#2a2a28] bg-[#141413] hover:border-red-500/50 hover:bg-[#181816] group">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 text-red-400 border border-dashed border-red-500/30">
                          <Terminal className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-sm font-semibold text-[#f3f3f1]">
                              {sb.sandbox_id}
                            </span>
                            {sb.scenario_id && (
                              <span className="rounded border border-dashed border-[#2a2a28] bg-[#0b0b0a] px-2 py-0.5 text-xs font-mono text-[#8f8f8d]">
                                Scenario: {sb.scenario_id}
                              </span>
                            )}
                            <Badge variant={sb.status === "verified_fail" ? "destructive" : "secondary"} className="text-[10px] font-mono uppercase">
                              {sb.status.replace(/_/g, " ")}
                            </Badge>
                            {sb.runtime && (
                              <span className="text-[10px] font-mono text-[#8f8f8d]">· {sb.runtime}</span>
                            )}
                          </div>
                          <p className="mt-1 text-xs font-mono text-zinc-400">
                            {sb.fault ? `${sb.fault.tool} → ${sb.fault.behavior}` : "fault injection"}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-[#8f8f8d] group-hover:translate-x-1 group-hover:text-white transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}

          <div className="rounded-xl border border-dashed border-[#2a2a28] bg-[#0b0b0a] p-4 text-xs font-mono text-[#8f8f8d] flex items-center justify-between">
            <span>→ Sandboxes isolate runtime state, execute fault payloads against the real agent, and assert safety invariants.</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveTab("scenarios")}
              className="border-dashed border-[#2a2a28] bg-[#141413] hover:border-red-500/50 hover:bg-[#181816] text-xs font-mono text-red-400 shrink-0"
            >
              <Play className="h-3.5 w-3.5 mr-1.5" />
              Launch New Danger Path Test
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {scenarios.length === 0 ? (
            <EmptyState
              icon={<FlaskConical className="h-10 w-10 text-[#8f8f8d]" />}
              title="No predicted scenarios yet"
              description="Go to Unexplored Paths and invent one — the world model will predict it here, ranked by risk."
            />
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                {scenarios.map((s) => (
                  <Card
                    key={s.scenario_id}
                    className={cn(
                      "cursor-pointer transition-all border border-dashed bg-[#141413] hover:bg-[#181816]",
                      selectedScenario?.scenario_id === s.scenario_id
                        ? "border-red-500/50 shadow-sm shadow-red-500/10"
                        : "border-[#2a2a28] hover:border-zinc-400/50"
                    )}
                    onClick={() => setSelectedId(s.scenario_id)}
                  >
                    <CardHeader className="pb-3 border-b border-[#1f1f1d]">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-sm font-mono text-[#f3f3f1]">{s.scenario_id}</CardTitle>
                        <div className="flex items-center gap-2">
                          {s.risk_score != null && (
                            <span className="text-[10px] font-mono text-red-400 border border-dashed border-red-500/40 px-2 py-0.5 rounded">
                              {Math.round(s.risk_score * 100)}% risk
                            </span>
                          )}
                          <StatusBadge status={s.status} />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5">
                      <p className="text-xs font-mono text-[#8f8f8d] mb-3 leading-relaxed">{s.hypothesis}</p>
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

              {selectedScenario && (
                <Card className="border border-dashed border-red-500/30 bg-[#141413] shadow-2xl">
                  <CardHeader className="border-b border-[#1f1f1d]">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <CardTitle className="text-base font-mono text-[#f3f3f1]">
                          Danger Path Test Configuration: {selectedScenario.scenario_id}
                        </CardTitle>
                        <p className="text-xs font-mono text-[#8f8f8d] mt-0.5">
                          Target State: {selectedScenario.unexplored_state} · Action: {selectedScenario.untried_action}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => runAndOpen(selectedScenario.scenario_id)}
                        disabled={startSandbox.isPending}
                        className="bg-red-500 hover:bg-red-600 text-white font-mono text-xs shadow-md shadow-red-500/20"
                      >
                        {startSandbox.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        ) : (
                          <Play className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        {startSandbox.isPending ? "Executing Sandbox..." : "Run Sandbox Verification"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <h4 className="text-xs font-mono uppercase text-[#8f8f8d] mb-2 tracking-wider">Failure Hypothesis</h4>
                      <p className="text-sm font-mono text-[#f3f3f1] bg-[#0b0b0a] border border-[#1f1f1d] p-3 rounded-lg">
                        {selectedScenario.hypothesis}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xs font-mono uppercase text-[#8f8f8d] mb-2 tracking-wider">Fault Injection Configuration</h4>
                      <JsonViewer data={selectedScenario.fault} />
                    </div>
                    <div>
                      <h4 className="text-xs font-mono uppercase text-[#8f8f8d] mb-2 tracking-wider">Initial State Variables</h4>
                      <JsonViewer data={selectedScenario.initial_state} />
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
