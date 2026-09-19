"use client";

import { useUnexplored } from "@/lib/hooks/use-unexplored";
import { useSimulate } from "@/lib/hooks/use-scenarios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, Search } from "lucide-react";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";

export default function GapsPage() {
  const { data: gaps, isLoading } = useUnexplored("refund-agent");
  const simulate = useSimulate("refund-agent");

  if (isLoading) return <TableSkeleton />;

  if (!gaps || gaps.length === 0) {
    return (
      <EmptyState
        icon={<Search className="h-10 w-10 text-[#8f8f8d]" />}
        title="No unexplored gaps found"
        description="All reachable state-action pairs have been observed. Run more traces to discover new paths."
      />
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-dashed border-zinc-500/40 bg-zinc-500/10 px-3 py-0.5 text-[11px] font-mono text-zinc-300 mb-2">
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 animate-pulse" />
          <span>PHASE 2 — PREDICTED</span>
        </div>
        <h1 className="text-2xl font-normal text-[#f3f3f1] tracking-tight">Unexplored Behavioural Gaps</h1>
        <p className="text-xs sm:text-sm text-[#8f8f8d] mt-1">
          State-action pairs discovered by world models that have never been encountered in production traces.
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-[#2a2a28] bg-[#141413] overflow-hidden shadow-xl">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2a2a28] bg-[#0c0c0b]">
              <th className="px-5 py-3.5 text-left text-[11px] font-mono font-medium text-[#8f8f8d] uppercase tracking-wider">Unobserved State</th>
              <th className="px-5 py-3.5 text-left text-[11px] font-mono font-medium text-[#8f8f8d] uppercase tracking-wider">Untried Action</th>
              <th className="px-5 py-3.5 text-left text-[11px] font-mono font-medium text-[#8f8f8d] uppercase tracking-wider">Support Traces</th>
              <th className="px-5 py-3.5 text-right text-[11px] font-mono font-medium text-[#8f8f8d] uppercase tracking-wider">Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f1f1d]">
            {gaps.map((gap, i) => (
              <tr key={i} className="hover:bg-[#181816] transition-colors">
                <td className="px-5 py-4">
                  <span className="text-sm font-mono text-[#f3f3f1]">{gap.unexplored_state || gap.state}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="inline-block rounded-full border border-dashed border-zinc-500/40 bg-zinc-500/10 px-2.5 py-0.5 text-xs font-mono text-zinc-300">
                    {gap.untried_action}
                  </span>
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
                    className="border-dashed border-[#2a2a28] bg-[#141413] hover:border-zinc-400 hover:bg-[#1f1f1d] text-xs font-mono"
                    onClick={() =>
                      simulate.mutate({
                        unexplored_state: gap.unexplored_state || gap.state || "",
                        untried_action: gap.untried_action,
                      })
                    }
                    disabled={simulate.isPending}
                  >
                    <FlaskConical className="h-3.5 w-3.5 mr-1.5 text-indigo-400" />
                    Simulate
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
