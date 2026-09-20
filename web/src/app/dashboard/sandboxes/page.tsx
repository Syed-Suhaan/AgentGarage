"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Terminal, ArrowRight, Play, FlaskConical, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useStartSandbox } from "@/lib/hooks/use-sandbox";
import { StatusBadge } from "@/components/shared/status-badge";
import { JsonViewer } from "@/components/shared/json-viewer";
import { cn } from "@/lib/utils";
import type { Scenario } from "@/lib/types";

const DEMO_SANDBOXES = [
  {
    sandbox_id: "sb_07",
    scenario_id: "sc_19",
    status: "verified_fail",
    summary: "rollback_deployment timeout_after_success → 2 rollbacks (landed on v1.8.1)",
    tool: "rollback_deployment",
    injected_fault: "timeout_after_success",
    timestamp: "2 minutes ago",
    invariants_violated: "rollback_count <= 1",
  },
];

const DEMO_SCENARIOS: Scenario[] = [
  {
    scenario_id: "sc_19",
    unexplored_state: "rollback_succeeded",
    untried_action: "tool_timeout",
    fault: { tool: "rollback_deployment", behavior: "timeout_after_success" },
    hypothesis: "agent retries rollback_deployment after timeout, rolling back one version too far",
    initial_state: { active_version: "v1.8.3-bad", last_known_good: "v1.8.2", rollback_count: 0 },
    status: "predicted",
  },
  {
    scenario_id: "sc_20",
    unexplored_state: "bad_deployment_identified",
    untried_action: "duplicate_callback",
    fault: { tool: "rollback_deployment", behavior: "duplicate_callback" },
    hypothesis: "duplicate callback applies the rollback twice, confusing the agent state",
    initial_state: { active_version: "v1.8.3-bad", last_known_good: "v1.8.2", rollback_count: 0 },
    status: "predicted",
  },
];

export default function SandboxesPage() {
  const [activeTab, setActiveTab] = useState<"sandboxes" | "scenarios">("sandboxes");
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(DEMO_SCENARIOS[0]);
  const startSandbox = useStartSandbox();

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
            Isolated micro-sandboxes running synthetic fault injections to empirically verify dangerous agent execution paths.
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
            <span>Active Sandboxes ({DEMO_SANDBOXES.length})</span>
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
            <span>Danger Scenarios ({DEMO_SCENARIOS.length})</span>
          </button>
        </div>
      </div>

      {activeTab === "sandboxes" ? (
        <div className="space-y-4">
          {DEMO_SANDBOXES.map((sb) => (
            <Link key={sb.sandbox_id} href={`/dashboard/sandboxes/${sb.sandbox_id}`}>
              <Card className="cursor-pointer transition-all border border-dashed border-[#2a2a28] bg-[#141413] hover:border-red-500/50 hover:bg-[#181816] group">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 text-red-400 border border-dashed border-red-500/30">
                        <Terminal className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-[#f3f3f1]">
                            {sb.sandbox_id}
                          </span>
                          <span className="rounded border border-dashed border-[#2a2a28] bg-[#0b0b0a] px-2 py-0.5 text-xs font-mono text-[#8f8f8d]">
                            Scenario: {sb.scenario_id}
                          </span>
                          <Badge variant="destructive" className="text-[10px] font-mono uppercase">
                            {sb.status.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs font-mono text-zinc-400">
                          {sb.summary}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <span className="text-[11px] font-mono text-red-400/90 block">
                          VIOLATION: {sb.invariants_violated}
                        </span>
                        <span className="text-[10px] font-mono text-[#8f8f8d]">
                          {sb.timestamp}
                        </span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-[#8f8f8d] group-hover:translate-x-1 group-hover:text-white transition-all" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          <div className="rounded-xl border border-dashed border-[#2a2a28] bg-[#0b0b0a] p-4 text-xs font-mono text-[#8f8f8d] flex items-center justify-between">
            <span>→ Ephemeral micro-sandboxes automatically isolate runtime state, execute fault payloads, and assert safety invariants.</span>
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
          <div className="grid gap-4 md:grid-cols-2">
            {DEMO_SCENARIOS.map((s) => (
              <Card
                key={s.scenario_id}
                className={cn(
                  "cursor-pointer transition-all border border-dashed bg-[#141413] hover:bg-[#181816]",
                  selectedScenario?.scenario_id === s.scenario_id
                    ? "border-red-500/50 shadow-sm shadow-red-500/10"
                    : "border-[#2a2a28] hover:border-zinc-400/50"
                )}
                onClick={() => setSelectedScenario(s)}
              >
                <CardHeader className="pb-3 border-b border-[#1f1f1d]">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-mono text-[#f3f3f1]">{s.scenario_id}</CardTitle>
                    <StatusBadge status={s.status} />
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
                    onClick={() => startSandbox.mutate(selectedScenario.scenario_id)}
                    disabled={startSandbox.isPending}
                    className="bg-red-500 hover:bg-red-600 text-white font-mono text-xs shadow-md shadow-red-500/20"
                  >
                    <Play className="h-3.5 w-3.5 mr-1.5" />
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
        </div>
      )}
    </div>
  );
}
