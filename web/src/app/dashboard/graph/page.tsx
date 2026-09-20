"use client";

import { Search, Bell, Sparkles } from "lucide-react";
import { useGraph } from "@/lib/hooks/use-graph";
import { BehaviourGraph } from "@/components/graph/behaviour-graph";
import { GraphSkeleton } from "@/components/shared/loading-skeleton";

export default function GraphPage() {
  const { data: graph, isLoading } = useGraph("refund-agent");

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-7rem)]">
        <GraphSkeleton />
      </div>
    );
  }

  return (
    <div className="-m-6 lg:-m-8 flex flex-col h-[calc(100vh-3.5rem)] bg-[#080808] text-[#f3f3f1] overflow-hidden">
      {/* Top Status & Search Strip matching reference design */}
      <header className="flex h-11 items-center justify-between border-b border-[#2a2a28] bg-[#0c0c0b] px-4 shrink-0 text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="text-[#8f8f8d]">/ Live Garage</span>
          <div className="flex items-center gap-2 rounded-full border border-dashed border-[#2a2a28] bg-[#141413] px-2.5 py-0.5 text-[11px] text-[#8f8f8d]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-medium">Garage Online</span>
            <span className="text-[#2a2a28]">|</span>
            <span>v1.8.2</span>
            <span className="text-[#2a2a28]">|</span>
            <span>prod</span>
            <span className="text-[#2a2a28]">|</span>
            <span>us-east-1</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Global Search Bar with ⌘ K */}
          <div className="relative hidden md:flex items-center">
            <Search className="absolute left-2.5 h-3.5 w-3.5 text-[#8f8f8d]" />
            <input
              type="text"
              placeholder="Search agents, traces, states..."
              className="h-7 w-64 lg:w-80 rounded-lg border border-dashed border-[#2a2a28] bg-[#141413] pl-8 pr-12 text-[11px] font-mono text-[#f3f3f1] placeholder:text-[#8f8f8d] focus:border-[#3b76ff] focus:outline-none"
            />
            <span className="absolute right-2 rounded border border-[#2a2a28] bg-[#1a1a18] px-1.5 py-0.5 text-[9px] font-mono text-[#8f8f8d]">
              ⌘ K
            </span>
          </div>

          <button
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-dashed border-[#2a2a28] bg-[#141413] text-[#8f8f8d] hover:text-[#f3f3f1] transition-colors"
            title="Notifications"
          >
            <Bell className="h-3.5 w-3.5" />
          </button>

          <div
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[#3b76ff]/20 text-[#3b76ff] border border-[#3b76ff]/40 text-xs font-mono font-bold"
            title="User Account"
          >
            U
          </div>
        </div>
      </header>

      {/* Page Title & Subtitle Banner */}
      <div className="border-b border-[#2a2a28] bg-[#0c0c0b] px-5 py-2.5 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold tracking-tight text-[#f3f3f1]">
            Behaviour Graph
          </h1>
          <p className="text-[11px] font-mono text-[#8f8f8d]">
            State transitions from real agent runs, with predicted paths and risk analysis.
          </p>
        </div>
      </div>

      {/* Main Behaviour Graph Workspace */}
      <div className="flex-1 overflow-hidden relative">
        <BehaviourGraph graph={graph} />
      </div>
    </div>
  );
}
