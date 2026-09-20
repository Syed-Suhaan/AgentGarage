"use client";

import { memo } from "react";

export function GraphLegend() {
  return (
    <div className="shrink-0 border-b border-[#2a2a28] bg-[#0c0c0b] p-3.5 select-none">
      <p className="text-[11px] font-mono uppercase font-bold tracking-wider text-[#8f8f8d] mb-3">
        Legend
      </p>

      <div className="space-y-2 text-[11px] font-mono">
        {/* Observed */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center w-6">
            <svg viewBox="0 0 24 6" className="w-full h-2 overflow-visible">
              <line x1="0" y1="3" x2="18" y2="3" stroke="#3b76ff" strokeWidth="2" />
              <polygon points="16,0 24,3 16,6" fill="#3b76ff" />
            </svg>
          </div>
          <span className="text-[#f3f3f1]">Observed transition</span>
        </div>

        {/* Predicted */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center w-6">
            <svg viewBox="0 0 24 6" className="w-full h-2 overflow-visible">
              <line x1="0" y1="3" x2="18" y2="3" stroke="#8f8f8d" strokeWidth="2" strokeDasharray="3 2" />
              <polygon points="16,0 24,3 16,6" fill="#8f8f8d" />
            </svg>
          </div>
          <span className="text-[#8f8f8d]">Predicted transition</span>
        </div>

        {/* Verified Failure */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center w-6">
            <svg viewBox="0 0 24 6" className="w-full h-2 overflow-visible">
              <line x1="0" y1="3" x2="18" y2="3" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 2" />
              <polygon points="16,0 24,3 16,6" fill="#ef4444" />
            </svg>
          </div>
          <span className="text-red-400">Verified failure transition</span>
        </div>

        {/* Protected */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center w-6">
            <svg viewBox="0 0 24 6" className="w-full h-2 overflow-visible">
              <line x1="0" y1="3" x2="18" y2="3" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 2" />
              <polygon points="16,0 24,3 16,6" fill="#f59e0b" />
            </svg>
          </div>
          <span className="text-amber-400">Protected regression path</span>
        </div>

        <div className="my-2 border-t border-[#1f1f1d]" />

        {/* Selected state */}
        <div className="flex items-center gap-2.5">
          <div className="h-3 w-3 rounded-full border-2 border-[#3b76ff] shadow-[0_0_8px_rgba(59,118,255,0.6)]" />
          <span className="text-blue-400">Selected state</span>
        </div>

        {/* Other state */}
        <div className="flex items-center gap-2.5">
          <div className="h-3 w-3 rounded-full border border-[#8f8f8d] bg-[#141413]" />
          <span className="text-[#8f8f8d]">Other state</span>
        </div>
      </div>
    </div>
  );
}

export const MemoizedGraphLegend = memo(GraphLegend);
