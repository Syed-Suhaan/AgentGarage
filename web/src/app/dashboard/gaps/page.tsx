"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DEMO_AGENT_ID } from "@/lib/agent";
import { useUnexplored } from "@/lib/hooks/use-unexplored";
import { useGraph } from "@/lib/hooks/use-graph";
import { useScenarios, useSimulate } from "@/lib/hooks/use-scenarios";
import { useStartSandbox } from "@/lib/hooks/use-sandbox";
import { Button } from "@/components/ui/button";
import { FlaskConical, Search, Plus, Loader2 } from "lucide-react";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

// Danger annotations for unexplored paths
const DANGER_METADATA: Record<string, { severity: "critical" | "high" | "medium"; risk: string; badge: string }> = {
  tool_timeout: {
    severity: "critical",
    risk: "Timeout after success triggers automated retry → double rollback past last-known-good",
    badge: "CRITICAL DANGER",
  },
  duplicate_callback: {
    severity: "high",
    risk: "Concurrent callback race mutates status twice → state inconsistency",
    badge: "HIGH DANGER",
  },
  mid_run_403: {
    severity: "high",
    risk: "Mid-execution permission revocation leaves checkout on the bad deploy",
    badge: "HIGH DANGER",
  },
  http_500: {
    severity: "medium",
    risk: "Unhandled HTTP 500 fails to trigger fallback or human escalation",
    badge: "MEDIUM RISK",
  },
};

function dangerFor(action: string) {
  return (
    DANGER_METADATA[action] || {
      severity: "medium" as const,
      risk: `Untested (${action}): the agent has never faced this transition — sandbox it to see if invariants hold.`,
      badge: "POTENTIAL RISK",
    }
  );
}

export default function GapsPage() {
  const router = useRouter();
  const { data: gaps, isLoading, dataUpdatedAt, refetch } = useUnexplored(DEMO_AGENT_ID);
  const { data: graph } = useGraph(DEMO_AGENT_ID);
  const { data: scenariosData } = useScenarios(DEMO_AGENT_ID);
  const simulate = useSimulate(DEMO_AGENT_ID);
  const startSandbox = useStartSandbox();

  const [customState, setCustomState] = useState("rollback_succeeded");
  const [customAction, setCustomAction] = useState("");
  const [flowError, setFlowError] = useState<string | null>(null);
  const [runningGap, setRunningGap] = useState<string | null>(null);

  const busy = simulate.isPending || startSandbox.isPending;

  // Real stats derived from the API — no simulated drift.
  const observedCount = (graph?.edges || []).filter((e) => e.kind === "observed").length;
  const predictedCount = (scenariosData?.scenarios || []).length;
  const gapCount = gaps?.length || 0;
  const updatedAgo = Math.max(
    0,
    Math.round(((Date.now() - (dataUpdatedAt || Date.now())) / 1000))
  );

  async function inventAndRun(state: string, action: string) {
    const s = state.trim();
    const a = action.trim();
    if (!s || !a || busy) return;
    setFlowError(null);
    setRunningGap(`${s}::${a}`);
    try {
      // 1. World model predicts the invented path → scenario (works for any
      //    state/action strings, not just the LEGAL frontier).
      const sc = await simulate.mutateAsync({
        unexplored_state: s,
        untried_action: a,
      });
      // 2. Run it on the real sandbox. On the demo stack this executes
      //    inline and auto-compiles a protected eval on verified_fail.
      const started = await startSandbox.mutateAsync(sc.scenario_id);
      // 3. Take the judge straight to the live result.
      router.push(`/dashboard/sandboxes/${started.sandbox_id}`);
    } catch (e) {
      setFlowError(e instanceof Error ? e.message : "Sandbox run failed");
      setRunningGap(null);
    }
  }

  if (isLoading) return <TableSkeleton />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-dashed border-amber-500/40 bg-amber-500/10 px-3 py-0.5 text-[11px] font-mono text-amber-300 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>PHASE 2 — UNEXPLORED PATHS</span>
          </div>
          <h1 className="text-2xl font-normal text-[#f3f3f1] tracking-tight flex items-baseline gap-2.5 flex-wrap">
            <span>Unexplored Paths</span>
            <span className="text-sm font-mono text-red-400 font-normal">
              (dangerous paths highlights)
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8f8f8d] mt-1">
            Latent state-action trajectories flagged by the world model that have never executed in production traces.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded border border-dashed border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-mono text-emerald-300 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE • synced {updatedAgo}s ago
          </span>
          <span className="rounded border border-dashed border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-mono text-red-400 tabular-nums">
            {gapCount} Unexplored Paths Flagged
          </span>
        </div>
      </div>

      {/* Coverage stat cards — computed from the API */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-dashed border-[#2a2a28] bg-[#141413] p-5 flex items-center gap-5 shadow-xl">
          <div className="min-w-0">
            <p className="text-sm font-mono text-[#8f8f8d]">Observed Edges</p>
            <p className="mt-1 flex items-baseline gap-2 flex-wrap">
              <span className="text-4xl font-semibold tracking-tight text-[#f3f3f1] tabular-nums">{observedCount}</span>
            </p>
            <p className="text-xs font-mono text-[#8f8f8d] mt-0.5">from production traces</p>
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-[#2a2a28] bg-[#141413] p-5 flex items-center gap-5 shadow-xl">
          <div className="min-w-0">
            <p className="text-sm font-mono text-[#8f8f8d]">High-Risk Gaps</p>
            <p className="mt-1 flex items-baseline gap-2 flex-wrap">
              <span className="text-4xl font-semibold tracking-tight text-[#f3f3f1] tabular-nums">{gapCount}</span>
            </p>
            <p className="text-xs font-mono text-[#8f8f8d] mt-0.5">untried transitions</p>
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-[#2a2a28] bg-[#141413] p-5 flex items-center gap-5 shadow-xl">
          <div className="min-w-0">
            <p className="text-sm font-mono text-[#8f8f8d]">Predicted Scenarios</p>
            <p className="mt-1 flex items-baseline gap-2 flex-wrap">
              <span className="text-4xl font-semibold tracking-tight text-[#f3f3f1] tabular-nums">{predictedCount}</span>
            </p>
            <p className="text-xs font-mono text-[#8f8f8d] mt-0.5">world-model outputs</p>
          </div>
        </div>
      </div>

      {/* Invent a new dangerous path — freeform, not limited to the frontier */}
      <div className="rounded-2xl border border-dashed border-red-500/30 bg-[#141413] p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <Plus className="h-4 w-4 text-red-400" />
          <h2 className="text-sm font-mono font-medium text-[#f3f3f1]">
            Invent a new dangerous path
          </h2>
        </div>
        <p className="text-xs font-mono text-[#8f8f8d] mb-4">
          Any state + action. The world model predicts it, the sandbox runs the real agent against it,
          and a failure becomes a protected eval. Try e.g. state <code className="text-zinc-300">bad_deployment_identified</code> + action <code className="text-zinc-300">partial_json</code>.
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            value={customState}
            onChange={(e) => setCustomState(e.target.value)}
            placeholder="unexplored state (e.g. rollback_succeeded)"
            className="h-9 flex-1 rounded-lg border border-dashed border-[#2a2a28] bg-[#0b0b0a] px-3 text-xs font-mono text-[#f3f3f1] focus:border-red-500/60 focus:outline-none"
          />
          <input
            value={customAction}
            onChange={(e) => setCustomAction(e.target.value)}
            placeholder="untried action (e.g. partial_json)"
            className="h-9 flex-1 rounded-lg border border-dashed border-[#2a2a28] bg-[#0b0b0a] px-3 text-xs font-mono text-[#f3f3f1] focus:border-red-500/60 focus:outline-none"
          />
          <Button
            size="sm"
            onClick={() => inventAndRun(customState, customAction)}
            disabled={busy || !customState.trim() || !customAction.trim()}
            className="bg-red-500 hover:bg-red-600 text-white font-mono text-xs px-4 h-9"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <FlaskConical className="h-3.5 w-3.5 mr-1.5" />}
            Predict + Run Sandbox
          </Button>
        </div>
        {flowError && (
          <p className="mt-3 text-xs font-mono text-red-400">
            {flowError} — <button className="underline" onClick={() => { setFlowError(null); refetch(); }}>retry</button>
          </p>
        )}
      </div>

      {!gaps || gaps.length === 0 ? (
        <EmptyState
          icon={<Search className="h-10 w-10 text-[#8f8f8d]" />}
          title="No unexplored paths found"
          description="All reachable state-action pairs have been observed. Seed more traces or invent a custom path above to discover new ones."
        />
      ) : (
      <div className="rounded-2xl border border-dashed border-[#2a2a28] bg-[#141413] overflow-hidden shadow-xl">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2a2a28] bg-[#0c0c0b]">
              <th className="px-5 py-3.5 text-left text-[11px] font-mono font-medium text-[#8f8f8d] uppercase tracking-wider">Unobserved State</th>
              <th className="px-5 py-3.5 text-left text-[11px] font-mono font-medium text-[#8f8f8d] uppercase tracking-wider">Untried Action</th>
              <th className="px-5 py-3.5 text-left text-[11px] font-mono font-medium text-[#8f8f8d] uppercase tracking-wider">Dangerous Path Highlight</th>
              <th className="px-5 py-3.5 text-left text-[11px] font-mono font-medium text-[#8f8f8d] uppercase tracking-wider">Support Traces</th>
              <th className="px-5 py-3.5 text-right text-[11px] font-mono font-medium text-[#8f8f8d] uppercase tracking-wider">Sandbox Test</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f1f1d]">
            {gaps.map((gap, i) => {
              const danger = dangerFor(gap.untried_action);
              const isCritical = danger.severity === "critical";
              const isHigh = danger.severity === "high";
              const key = `${gap.unexplored_state || gap.state}::${gap.untried_action}`;
              const running = runningGap === key && busy;

              return (
                <tr key={i} className="hover:bg-[#181816] transition-colors group">
                  <td className="px-5 py-4">
                    <span className="text-sm font-mono text-[#f3f3f1]">{gap.unexplored_state || gap.state}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-block rounded-full border border-dashed border-zinc-500/40 bg-zinc-500/10 px-2.5 py-0.5 text-xs font-mono text-zinc-300">
                      {gap.untried_action}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1 max-w-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "rounded border border-dashed px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider",
                            isCritical
                              ? "border-red-500/40 bg-red-500/15 text-red-400"
                              : isHigh
                              ? "border-amber-500/40 bg-amber-500/15 text-amber-400"
                              : "border-zinc-500/40 bg-zinc-500/15 text-zinc-400"
                          )}
                        >
                          {danger.badge}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-[#8f8f8d] leading-relaxed">
                        {danger.risk}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1.5 flex-wrap">
                      {(gap.support_traces || []).map((t) => (
                        <span key={t} className="rounded border border-dashed border-[#2a2a28] bg-[#0b0b0a] px-2 py-0.5 text-[11px] font-mono text-[#8f8f8d]">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-dashed border-red-500/30 bg-red-500/10 hover:border-red-500 hover:bg-red-500/20 text-red-400 text-xs font-mono"
                      onClick={() => inventAndRun(gap.unexplored_state || gap.state || "", gap.untried_action)}
                      disabled={busy}
                    >
                      {running ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      ) : (
                        <FlaskConical className="h-3.5 w-3.5 mr-1.5 text-red-400" />
                      )}
                      {running ? "Running…" : "Test in Sandbox"}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
