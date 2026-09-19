"use client";

import { Badge } from "@/components/ui/badge";

interface TopbarProps {
  agentId?: string;
  coveragePercent?: number;
}

export function Topbar({
  agentId = "refund-agent",
  coveragePercent,
}: TopbarProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-[#2a2a28] bg-[#0c0c0b] px-6">
      {/* Left: Agent selector */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-[#8f8f8d] uppercase tracking-wider">Agent</span>
        <div className="flex items-center gap-2 rounded-full border border-dashed border-[#2a2a28] bg-[#141413] px-3 py-1 text-xs font-mono text-[#f3f3f1]">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span>{agentId}</span>
        </div>
      </div>

      {/* Right: Coverage + status */}
      <div className="flex items-center gap-4">
        {coveragePercent !== undefined && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#8f8f8d] uppercase tracking-wider">Coverage</span>
            <div className="flex items-center gap-1.5 rounded-full border border-dashed border-[#2a2a28] bg-[#141413] px-2.5 py-0.5 font-mono text-xs font-semibold">
              <span
                className={
                  coveragePercent >= 80
                    ? "text-emerald-400"
                    : coveragePercent >= 50
                    ? "text-amber-400"
                    : "text-red-400"
                }
              >
                {coveragePercent}%
              </span>
            </div>
          </div>
        )}
        <div className="h-4 w-px bg-[#2a2a28]" />
        <span className="rounded border border-dashed border-[#2a2a28] bg-[#141413] px-2 py-0.5 text-[11px] font-mono text-[#8f8f8d]">
          v1.8.2
        </span>
      </div>
    </header>
  );
}
