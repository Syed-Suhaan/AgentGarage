"use client";

import { DEMO_AGENT_ID } from "@/lib/agent";
import { useGraph } from "@/lib/hooks/use-graph";
import { useEvals } from "@/lib/hooks/use-evals";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GitBranch,
  Eye,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  Activity,
} from "lucide-react";
import Link from "next/link";
import type { EdgeKind } from "@/lib/types";

export default function DashboardOverview() {
  const { data: graph } = useGraph(DEMO_AGENT_ID);
  const { data: evalsData } = useEvals();

  // Calculate coverage metrics
  const edgeCounts: Record<EdgeKind, number> = {
    observed: 0,
    predicted: 0,
    verified: 0,
    protected: 0,
  };

  if (graph) {
    graph.edges.forEach((e) => {
      edgeCounts[e.kind] = (edgeCounts[e.kind] || 0) + 1;
    });
  }

  const totalEdges = Object.values(edgeCounts).reduce((a, b) => a + b, 0);
  const observedEdges = edgeCounts.observed + edgeCounts.protected;
  const coveragePercent =
    totalEdges > 0 ? Math.round((observedEdges / totalEdges) * 100) : 0;

  const stats = [
    {
      label: "Observed",
      value: edgeCounts.observed,
      icon: Eye,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Predicted",
      value: edgeCounts.predicted,
      icon: AlertTriangle,
      color: "text-gray-400",
      bgColor: "bg-gray-500/10",
    },
    {
      label: "Verified",
      value: edgeCounts.verified,
      icon: AlertTriangle,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
    },
    {
      label: "Protected",
      value: edgeCounts.protected,
      icon: ShieldCheck,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-dashed border-[#2a2a28] bg-[#141413] px-3 py-0.5 text-[11px] font-mono text-[#8f8f8d] mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3b76ff] animate-pulse" />
            <span>OBSERVED → PREDICTED → VERIFIED → PROTECTED</span>
            <span className="zoah-caret ml-0.5 text-[#3b76ff]" />
          </div>
          <h1 className="text-2xl font-normal text-[#f3f3f1] tracking-tight">Overview</h1>
          <p className="text-xs sm:text-sm text-[#8f8f8d] mt-1">
            Behavioural coverage for the demo SRE agent: what ran, what is still untried, what failed in a sandbox, what is gated.
          </p>
        </div>
      </div>

      {/* Coverage + Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Coverage gauge card */}
        <Card className="sm:col-span-2 lg:col-span-1 border border-dashed border-[#2a2a28] bg-[#141413]">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className="relative h-24 w-24">
              <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#1f1f1d"
                  strokeWidth="7"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={
                    coveragePercent >= 80
                      ? "#10b981"
                      : coveragePercent >= 50
                      ? "#f59e0b"
                      : "#ef4444"
                  }
                  strokeWidth="7"
                  strokeDasharray={`${coveragePercent * 2.51} 251`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-mono font-semibold text-[#f3f3f1]">{coveragePercent}%</span>
              </div>
            </div>
            <p className="mt-3 text-xs font-mono uppercase tracking-wider text-[#8f8f8d]">
              Behavioural Coverage
            </p>
          </CardContent>
        </Card>

        {/* Status stat cards */}
        {stats.map((s) => (
          <Card key={s.label} className="border border-dashed border-[#2a2a28] bg-[#141413] hover:border-[#3e3e3a] transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border border-dashed border-current/20 ${s.bgColor}`}
                >
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <span className="text-2xl font-mono font-semibold text-[#f3f3f1]">{s.value}</span>
              </div>
              <p className="mt-3 text-xs font-mono uppercase tracking-wider text-[#8f8f8d]">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/graph">
          <Card className="group cursor-pointer transition-all border border-dashed border-[#2a2a28] bg-[#141413] hover:border-blue-500/50 hover:bg-[#181816] h-full">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                    <GitBranch className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#f3f3f1] group-hover:text-blue-400 transition-colors">Behaviour Graph</p>
                    <p className="text-xs font-mono text-[#8f8f8d]">
                      {graph?.nodes.length || 0} states, {graph?.edges.length || 0} transitions
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[#8f8f8d] group-hover:translate-x-1 group-hover:text-[#f3f3f1] transition-all" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/gaps">
          <Card className="group cursor-pointer transition-all border border-dashed border-[#2a2a28] bg-[#141413] hover:border-zinc-400/50 hover:bg-[#181816] h-full">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-500/10 text-zinc-300">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#f3f3f1] group-hover:text-zinc-200 transition-colors">Gaps</p>
                    <p className="text-xs font-mono text-[#8f8f8d]">
                      reachable paths never taken
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[#8f8f8d] group-hover:translate-x-1 group-hover:text-[#f3f3f1] transition-all" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/sandboxes">
          <Card className="group cursor-pointer transition-all border border-dashed border-[#2a2a28] bg-[#141413] hover:border-red-500/50 hover:bg-[#181816] h-full">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#f3f3f1] group-hover:text-red-400 transition-colors">Sandboxes</p>
                    <p className="text-xs font-mono text-[#8f8f8d]">
                      verify against the real agent
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[#8f8f8d] group-hover:translate-x-1 group-hover:text-[#f3f3f1] transition-all" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/evals">
          <Card className="group cursor-pointer transition-all border border-dashed border-[#2a2a28] bg-[#141413] hover:border-amber-500/50 hover:bg-[#181816] h-full">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#f3f3f1] group-hover:text-amber-400 transition-colors">Evals</p>
                    <p className="text-xs font-mono text-[#8f8f8d]">
                      {evalsData?.evals.length || 0} protected
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[#8f8f8d] group-hover:translate-x-1 group-hover:text-[#f3f3f1] transition-all" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Core Loop with Animated Dashed Pipeline */}
      <Card className="border border-dashed border-[#2a2a28] bg-[#141413]">
        <CardHeader className="pb-3 border-b border-[#2a2a28]">
          <CardTitle className="text-xs uppercase font-mono tracking-wider flex items-center justify-between text-[#8f8f8d]">
            <span className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-[#3b76ff]" />
              Continuous Coverage Loop
            </span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Step 1 */}
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-mono text-blue-400">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span>1. Observed</span>
            </div>

            {/* Dash connector 1 */}
            <div className="hidden lg:flex items-center w-8 h-4">
              <svg viewBox="0 0 32 8" className="w-full h-full overflow-visible" fill="none">
                <line x1="0" y1="4" x2="26" y2="4" stroke="#3b76ff" strokeWidth="1.5" strokeDasharray="3 3" className="zoah-dash-animate" />
                <path d="M24 1 L28 4 L24 7" stroke="#3b76ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Step 2 */}
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-zinc-500/30 bg-zinc-500/10 px-3 py-2 text-xs font-mono text-zinc-300">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 opacity-60" />
              <span>2. Predicted</span>
            </div>

            {/* Dash connector 2 */}
            <div className="hidden lg:flex items-center w-8 h-4">
              <svg viewBox="0 0 32 8" className="w-full h-full overflow-visible" fill="none">
                <line x1="0" y1="4" x2="26" y2="4" stroke="#8f8f8d" strokeWidth="1.5" strokeDasharray="3 3" className="zoah-dash-animate" />
                <path d="M24 1 L28 4 L24 7" stroke="#8f8f8d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Step 3 */}
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-[#2a2a28] bg-[#181816] px-3 py-2 text-xs font-mono text-[#f3f3f1]">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 opacity-60" />
              <span>3. Verified</span>
            </div>

            {/* Dash connector 3 */}
            <div className="hidden lg:flex items-center w-8 h-4">
              <svg viewBox="0 0 32 8" className="w-full h-full overflow-visible" fill="none">
                <line x1="0" y1="4" x2="26" y2="4" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" className="zoah-dash-animate" />
                <path d="M24 1 L28 4 L24 7" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Step 4 */}
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-mono text-amber-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span>4. Protected</span>
            </div>
          </div>
          <p className="text-xs text-[#8f8f8d] mt-4 font-mono">
            → Verified failures compile to eval files and re-run on every future agent version.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
