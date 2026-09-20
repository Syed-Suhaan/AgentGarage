"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Maximize2,
  Minimize2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReferenceTraceData } from "@/lib/graph-reference-data";

interface LinkedTraceDrawerProps {
  trace: ReferenceTraceData;
  activeNodeId: string;
  onSelectNode: (nodeId: string) => void;
}

export function LinkedTraceDrawer({
  trace,
  activeNodeId,
  onSelectNode,
}: LinkedTraceDrawerProps) {
  const [activeTab, setActiveTab] = useState<"trace" | "logs" | "events" | "state" | "evals">("trace");
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="border-t border-[#2a2a28] bg-[#0c0c0b] text-xs font-mono select-none z-10">
      {/* Top Drawer Tab Bar */}
      <div className="flex items-center justify-between border-b border-[#1f1f1d] px-4 py-2 bg-[#10100f]">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab("trace");
              setIsCollapsed(false);
            }}
            className={cn(
              "flex items-center gap-2 px-3 py-1 rounded-md text-xs transition-colors",
              activeTab === "trace" && !isCollapsed
                ? "bg-[#181816] text-[#3b76ff] border border-[#2a2a28] font-medium shadow-sm"
                : "text-[#8f8f8d] hover:text-[#f3f3f1]"
            )}
          >
            <span>Linked Trace</span>
            <span className="rounded bg-[#3b76ff]/15 px-1.5 py-0.2 text-[10px] text-[#3b76ff] font-semibold border border-[#3b76ff]/30">
              #{trace.runId}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("logs");
              setIsCollapsed(false);
            }}
            className={cn(
              "px-3 py-1 rounded-md text-xs transition-colors",
              activeTab === "logs" && !isCollapsed
                ? "bg-[#181816] text-white border border-[#2a2a28] font-medium"
                : "text-[#8f8f8d] hover:text-[#f3f3f1]"
            )}
          >
            Logs
          </button>

          <button
            onClick={() => {
              setActiveTab("events");
              setIsCollapsed(false);
            }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs transition-colors",
              activeTab === "events" && !isCollapsed
                ? "bg-[#181816] text-white border border-[#2a2a28] font-medium"
                : "text-[#8f8f8d] hover:text-[#f3f3f1]"
            )}
          >
            <span>Events</span>
            <span className="text-[10px] text-[#8f8f8d] font-semibold">18</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("state");
              setIsCollapsed(false);
            }}
            className={cn(
              "px-3 py-1 rounded-md text-xs transition-colors",
              activeTab === "state" && !isCollapsed
                ? "bg-[#181816] text-white border border-[#2a2a28] font-medium"
                : "text-[#8f8f8d] hover:text-[#f3f3f1]"
            )}
          >
            State Data
          </button>

          <button
            onClick={() => {
              setActiveTab("evals");
              setIsCollapsed(false);
            }}
            className={cn(
              "px-3 py-1 rounded-md text-xs transition-colors",
              activeTab === "evals" && !isCollapsed
                ? "bg-[#181816] text-white border border-[#2a2a28] font-medium"
                : "text-[#8f8f8d] hover:text-[#f3f3f1]"
            )}
          >
            Evaluations
          </button>
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-[#8f8f8d] hover:text-[#f3f3f1] p-1"
          title={isCollapsed ? "Expand Drawer" : "Collapse Drawer"}
        >
          {isCollapsed ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Drawer Content */}
      {!isCollapsed && (
        <div className="p-3.5 space-y-3">
          {/* Trace Summary Bar */}
          <div className="flex items-center justify-between text-[11px] text-[#8f8f8d] border-b border-[#1f1f1d] pb-2.5 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="text-[#f3f3f1] font-semibold">Run {trace.runId}</span>
              <span className="text-[#2a2a28]">|</span>
              <span>{trace.timestamp}</span>
              <span className="text-[#2a2a28]">|</span>
              <span>{trace.stateCount} states</span>
              <span className="text-[#2a2a28]">|</span>
              <span>{trace.duration}</span>
              <span className="text-[#2a2a28]">|</span>
              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {trace.status}
              </span>
            </div>

            <Link
              href="/dashboard/traces"
              className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors group"
            >
              <span>View full trace</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Horizontal Trace Timeline Flow */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-thin">
            {trace.steps.map((step, idx) => {
              const isSelected = step.nodeId === activeNodeId;
              const isLast = idx === trace.steps.length - 1;

              return (
                <div key={step.id} className="flex items-center gap-2 shrink-0">
                  <div
                    onClick={() => onSelectNode(step.nodeId)}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-lg border px-3 py-1.5 transition-all cursor-pointer min-w-[110px]",
                      isSelected
                        ? "border-[#3b76ff] bg-[#0e1320] shadow-md shadow-blue-500/20 ring-1 ring-[#3b76ff]/40"
                        : "border-[#2a2a28] bg-[#141413] hover:border-zinc-500 hover:bg-[#181816]"
                    )}
                  >
                    <span
                      className={cn(
                        "text-[10px] font-mono font-bold tracking-tight truncate max-w-[120px]",
                        isSelected ? "text-[#3b76ff]" : "text-[#f3f3f1]"
                      )}
                    >
                      {step.label}
                    </span>
                    <span className="text-[9px] font-mono text-[#8f8f8d] mt-0.5">
                      {step.time}
                    </span>
                  </div>

                  {!isLast && (
                    <ChevronRight className="h-3.5 w-3.5 text-[#3e3e3a] shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
