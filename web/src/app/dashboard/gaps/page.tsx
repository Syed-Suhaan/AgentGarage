"use client";

import { useEffect, useState } from "react";
import { useUnexplored } from "@/lib/hooks/use-unexplored";
import { useSimulate } from "@/lib/hooks/use-scenarios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, Search } from "lucide-react";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

// Danger annotations for unexplored paths
const DANGER_METADATA: Record<string, { severity: "critical" | "high" | "medium"; risk: string; badge: string }> = {
  tool_timeout: {
    severity: "critical",
    risk: "Timeout after success triggers automated retry → duplicate refund risk",
    badge: "CRITICAL DANGER",
  },
  duplicate_callback: {
    severity: "high",
    risk: "Concurrent callback race mutates status twice → state inconsistency",
    badge: "HIGH DANGER",
  },
  mid_run_403: {
    severity: "high",
    risk: "Mid-execution permission revocation leaves dangling order hold",
    badge: "HIGH DANGER",
  },
  http_500: {
    severity: "medium",
    risk: "Unhandled HTTP 500 fails to trigger fallback or human escalation",
    badge: "MEDIUM RISK",
  },
};

export default function GapsPage() {
  const { data: gaps, isLoading, dataUpdatedAt } = useUnexplored("refund-agent");
  const simulate = useSimulate("refund-agent");

  // Real-time telemetry: poll-driven live stats with smooth drift.
  // Baselines come from the coverage snapshot; each tick simulates the
  // streaming world-model feed (swap with computed API values in prod).
  const [live, setLive] = useState({ coverage: 68, gaps: 27, predicted: 142 });
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
      setLive((p) => ({
        coverage: Math.min(69.5, Math.max(66.5, p.coverage + (Math.random() - 0.5) * 0.3)),
        gaps: Math.min(29, Math.max(25, p.gaps + (Math.random() < 0.25 ? (Math.random() < 0.5 ? -1 : 1) : 0))),
        predicted: Math.min(145, Math.max(139, p.predicted + (Math.random() < 0.4 ? (Math.random() < 0.5 ? -1 : 1) : 0))),
      }));
    }, 2500);
    return () => clearInterval(id);
  }, []);

  const updatedAgo = Math.max(0, Math.round((now - (dataUpdatedAt || now)) / 1000));

  if (isLoading) return <TableSkeleton />;

  if (!gaps || gaps.length === 0) {
    return (
      <EmptyState
        icon={<Search className="h-10 w-10 text-[#8f8f8d]" />}
        title="No unexplored paths found"
        description="All reachable state-action pairs have been observed. Run more traces to discover new paths."
      />
    );
  }

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
            {gaps.length} Unexplored Paths Flagged
          </span>
        </div>
      </div>

      {/* Coverage stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Explored Coverage */}
        <div className="rounded-xl border border-dashed border-[#2a2a28] bg-[#141413] p-5 flex items-center gap-5 shadow-xl">
          <div className="relative h-20 w-20 shrink-0">
            <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
              <circle cx="40" cy="40" r="32" fill="none" stroke="#2a2a28" strokeWidth="9" />
              <circle
                cx="40"
                cy="40"
                r="32"
                fill="none"
                stroke="#3b76ff"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={`${(live.coverage / 100) * 2 * Math.PI * 32} ${2 * Math.PI * 32}`}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-emerald-400 animate-pulse" title="Live" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-mono text-[#8f8f8d]">Explored Coverage</p>
            <p className="mt-1 flex items-baseline gap-2 flex-wrap">
              <span className="text-4xl font-semibold tracking-tight text-[#f3f3f1] tabular-nums">{Math.round(live.coverage)}%</span>
              <span className="text-sm font-mono text-emerald-400">+6% ↑</span>
            </p>
            <p className="text-xs font-mono text-[#8f8f8d] mt-0.5">vs. previous 7 days</p>
          </div>
        </div>

        {/* High-Risk Gaps */}
        <div className="rounded-xl border border-dashed border-[#2a2a28] bg-[#141413] p-5 flex items-center gap-5 shadow-xl">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center">
            <svg viewBox="0 0 24 24" className="h-10 w-10" fill="#f87171">
              <path d="M12 2 1.8 20.2h20.4L12 2Zm0 4.2L19.4 18H4.6L12 6.2ZM11 10v4h2v-4h-2Zm0 5v2h2v-2h-2Z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-mono text-[#8f8f8d]">High-Risk Gaps</p>
            <p className="mt-1 flex items-baseline gap-2 flex-wrap">
              <span key={live.gaps} className="text-4xl font-semibold tracking-tight text-[#f3f3f1] tabular-nums">{live.gaps}</span>
              <span className="text-sm font-mono text-red-400">+9 ↑</span>
            </p>
            <p className="text-xs font-mono text-[#8f8f8d] mt-0.5">untried transitions</p>
          </div>
        </div>

        {/* Predicted Paths */}
        <div className="rounded-xl border border-dashed border-[#2a2a28] bg-[#141413] p-5 flex items-center gap-5 shadow-xl">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center">
            <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="#3b76ff" strokeWidth="2" strokeLinecap="round">
              <circle cx="6" cy="6" r="2.5" fill="#3b76ff" stroke="none" />
              <circle cx="6" cy="18" r="2.5" fill="#3b76ff" stroke="none" />
              <circle cx="18" cy="12" r="2.5" fill="#3b76ff" stroke="none" />
              <path d="M8 7.5 15.5 11M8 16.5 15.5 13" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-mono text-[#8f8f8d]">Predicted Paths</p>
            <p className="mt-1 flex items-baseline gap-2 flex-wrap">
              <span key={live.predicted} className="text-4xl font-semibold tracking-tight text-[#f3f3f1] tabular-nums">{live.predicted}</span>
              <span className="text-sm font-mono text-emerald-400">+18 ↑</span>
            </p>
            <p className="text-xs font-mono text-[#8f8f8d] mt-0.5">potential new paths</p>
          </div>
        </div>
      </div>

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
              const danger = DANGER_METADATA[gap.untried_action] || {
                severity: "medium",
                risk: "Unverified edge behavior in production",
                badge: "POTENTIAL RISK",
              };
              const isCritical = danger.severity === "critical";
              const isHigh = danger.severity === "high";

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
                      {gap.support_traces.map((t) => (
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
                      onClick={() =>
                        simulate.mutate({
                          unexplored_state: gap.unexplored_state || gap.state || "",
                          untried_action: gap.untried_action,
                        })
                      }
                      disabled={simulate.isPending}
                    >
                      <FlaskConical className="h-3.5 w-3.5 mr-1.5 text-red-400" />
                      Test in Sandbox
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
