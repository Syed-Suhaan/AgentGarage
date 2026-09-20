"use client";

import { useState } from "react";
import Link from "next/link";
import {
  X,
  Pin,
  ExternalLink,
  CreditCard,
  AlertTriangle,
  FileText,
  ShieldCheck,
  FlaskConical,
  Activity,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  Package,
  UserCheck,
  XCircle,
  Database,
  HelpCircle,
  MessageSquare,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ReferenceNodeMetadata } from "@/lib/graph-reference-data";

interface StateInspectorProps {
  node: ReferenceNodeMetadata;
  onClose: () => void;
  onSelectNode?: (nodeId: string) => void;
}

const ICON_MAP = {
  UserCheck,
  MessageSquare,
  HelpCircle,
  Database,
  FileCheck,
  Package,
  CreditCard,
  AlertTriangle,
  Mail: CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  ShieldAlert: AlertTriangle,
};

export function StateInspector({ node, onClose, onSelectNode }: StateInspectorProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "transitions" | "examples">("overview");
  const [isPinned, setIsPinned] = useState(false);

  const Icon = ICON_MAP[node.iconName as keyof typeof ICON_MAP] || CreditCard;

  return (
    <aside className="flex-1 flex flex-col min-h-0 overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2a2a28] px-4 py-3.5 bg-[#10100f]">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#3b76ff] animate-pulse" />
          <h2 className="text-sm font-semibold tracking-tight text-[#f3f3f1]">
            State Inspector
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsPinned(!isPinned)}
            className={cn(
              "h-7 w-7 transition-colors",
              isPinned ? "text-[#3b76ff]" : "text-[#8f8f8d] hover:text-[#f3f3f1]"
            )}
            title={isPinned ? "Unpin Inspector" : "Pin Inspector"}
          >
            <Pin className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 text-[#8f8f8d] hover:text-[#f3f3f1]"
            title="Close Inspector"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Scrollable Inspector Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {/* State Identity Box */}
        <div className="rounded-xl border border-dashed border-[#2a2a28] bg-[#141413] p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg border border-dashed",
                  node.isFailure
                    ? "bg-red-500/10 text-red-400 border-red-500/30"
                    : "bg-[#3b76ff]/10 text-[#3b76ff] border-[#3b76ff]/30"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-mono font-bold tracking-tight text-[#f3f3f1]">
                  {node.label}
                </h3>
                <span className="text-[10px] font-mono text-[#8f8f8d]">
                  {node.stateId}
                </span>
              </div>
            </div>
            <span className="rounded-full bg-[#3b76ff] text-white px-2.5 py-0.5 text-[10px] font-mono font-semibold shadow-sm shadow-blue-500/30">
              Selected
            </span>
          </div>

          {/* Metadata Grid */}
          <div className="mt-3.5 grid grid-cols-2 gap-2 border-t border-[#1f1f1d] pt-3 text-[11px] font-mono">
            <div>
              <span className="text-[#8f8f8d] block text-[10px]">State ID</span>
              <span className="text-[#f3f3f1]">{node.stateId}</span>
            </div>
            <div>
              <span className="text-[#8f8f8d] block text-[10px]">Type</span>
              <span className="text-[#f3f3f1]">{node.type}</span>
            </div>
            <div>
              <span className="text-[#8f8f8d] block text-[10px]">Category</span>
              <span className="text-[#f3f3f1]">{node.category}</span>
            </div>
            <div>
              <span className="text-[#8f8f8d] block text-[10px]">Total runs</span>
              <span className="text-[#f3f3f1] font-semibold">{node.totalRuns.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[#8f8f8d] block text-[10px]">First seen</span>
              <span className="text-[#f3f3f1]">{node.firstSeen}</span>
            </div>
            <div>
              <span className="text-[#8f8f8d] block text-[10px]">Last seen</span>
              <span className="text-[#f3f3f1]">{node.lastSeen}</span>
            </div>
            <div className="col-span-2">
              <span className="text-[#8f8f8d] block text-[10px]">Success rate</span>
              <span
                className={cn(
                  "font-bold",
                  node.isFailure
                    ? "text-red-400"
                    : parseFloat(node.successRate) >= 90
                    ? "text-emerald-400"
                    : "text-amber-400"
                )}
              >
                {node.successRate}
              </span>
            </div>
          </div>

          <p className="mt-3 text-[11px] font-mono text-[#8f8f8d] leading-relaxed border-t border-[#1f1f1d] pt-2.5">
            {node.description}
          </p>
        </div>

        {/* Inspector Tab Switcher */}
        <div className="flex items-center gap-1 border-b border-[#2a2a28] pb-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={cn(
              "px-3 py-1 text-xs font-mono font-medium rounded-lg transition-colors",
              activeTab === "overview"
                ? "bg-[#3b76ff] text-white shadow-sm"
                : "text-[#8f8f8d] hover:text-[#f3f3f1]"
            )}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("transitions")}
            className={cn(
              "px-3 py-1 text-xs font-mono font-medium rounded-lg transition-colors",
              activeTab === "transitions"
                ? "bg-[#3b76ff] text-white shadow-sm"
                : "text-[#8f8f8d] hover:text-[#f3f3f1]"
            )}
          >
            Transitions {node.transitions.length}
          </button>
          <button
            onClick={() => setActiveTab("examples")}
            className={cn(
              "px-3 py-1 text-xs font-mono font-medium rounded-lg transition-colors",
              activeTab === "examples"
                ? "bg-[#3b76ff] text-white shadow-sm"
                : "text-[#8f8f8d] hover:text-[#f3f3f1]"
            )}
          >
            Examples 12
          </button>
        </div>

        {/* Transition Evidence Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-[#8f8f8d]">
              Transition evidence
            </h4>
            <span className="text-[10px] font-mono text-[#8f8f8d]">
              Total: {node.runs} runs
            </span>
          </div>
          <div className="space-y-1.5 rounded-xl border border-dashed border-[#2a2a28] bg-[#141413] p-2.5">
            {node.transitions.map((t, idx) => {
              const isFail = t.kind === "verified";
              const isObs = t.kind === "observed";
              const isProt = t.kind === "protected";

              return (
                <div
                  key={idx}
                  onClick={() => onSelectNode?.(t.toId)}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-[#181816] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={cn(
                        "text-xs font-mono",
                        isFail
                          ? "text-red-400"
                          : isObs
                          ? "text-[#3b76ff]"
                          : isProt
                          ? "text-amber-400"
                          : "text-zinc-400"
                      )}
                    >
                      →
                    </span>
                    <span
                      className={cn(
                        "text-[11px] font-mono truncate font-medium group-hover:underline",
                        isFail
                          ? "text-red-400"
                          : isObs
                          ? "text-blue-300"
                          : isProt
                          ? "text-amber-300"
                          : "text-zinc-300"
                      )}
                    >
                      {t.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] font-mono text-[#8f8f8d]">
                      {t.count}
                    </span>
                    <span
                      className={cn(
                        "text-[11px] font-mono font-semibold min-w-[42px] text-right",
                        isFail
                          ? "text-red-400"
                          : isObs
                          ? "text-blue-400"
                          : isProt
                          ? "text-amber-400"
                          : "text-zinc-400"
                      )}
                    >
                      {t.percent}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coverage, Risk Score, Stability Metrics */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-dashed border-[#2a2a28] bg-[#141413] p-3 text-center">
            <span className="text-[10px] font-mono uppercase text-[#8f8f8d] block tracking-tight">
              Coverage
            </span>
            <span className="text-sm font-mono font-bold text-[#f3f3f1] block mt-0.5">
              {node.coverage}
            </span>
            <span className="text-[9px] font-mono text-[#8f8f8d] block truncate">
              {node.coverageDetail}
            </span>
          </div>

          <div className="rounded-xl border border-dashed border-[#2a2a28] bg-[#141413] p-3 text-center">
            <span className="text-[10px] font-mono uppercase text-[#8f8f8d] block tracking-tight">
              Risk score
            </span>
            <span
              className={cn(
                "text-sm font-mono font-bold block mt-0.5",
                node.riskScore >= 0.7
                  ? "text-red-400"
                  : node.riskScore >= 0.3
                  ? "text-amber-400"
                  : "text-emerald-400"
              )}
            >
              {node.riskScore.toFixed(2)}
            </span>
            <span
              className={cn(
                "text-[9px] font-mono font-semibold block uppercase",
                node.riskLevel === "High"
                  ? "text-red-400"
                  : node.riskLevel === "Medium"
                  ? "text-amber-400"
                  : "text-emerald-400"
              )}
            >
              {node.riskLevel}
            </span>
          </div>

          <div className="rounded-xl border border-dashed border-[#2a2a28] bg-[#141413] p-3 text-center">
            <span className="text-[10px] font-mono uppercase text-[#8f8f8d] block tracking-tight">
              Stability
            </span>
            <span
              className={cn(
                "text-sm font-mono font-bold block mt-0.5",
                node.stability.startsWith("+")
                  ? "text-emerald-400"
                  : "text-red-400"
              )}
            >
              {node.stability}
            </span>
            <span className="text-[9px] font-mono text-[#8f8f8d] block truncate">
              vs. prev 7d
            </span>
          </div>
        </div>

        {/* Selected Action Card */}
        <div>
          <h4 className="text-[11px] font-mono uppercase tracking-wider text-[#8f8f8d] mb-2">
            Selected action (on this state)
          </h4>
          <div className="rounded-xl border border-dashed border-[#2a2a28] bg-[#141413] p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-[#3b76ff]" />
                <span className="text-xs font-mono font-semibold text-[#f3f3f1]">
                  {node.selectedAction.name}
                </span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-[#8f8f8d]" />
            </div>
            <p className="text-[11px] font-mono text-[#8f8f8d] leading-relaxed">
              {node.selectedAction.description}
            </p>
            <div className="grid grid-cols-3 gap-2 border-t border-[#1f1f1d] pt-2 text-[10px] font-mono">
              <div>
                <span className="text-[#8f8f8d] block">Used in</span>
                <span className="text-[#f3f3f1] font-medium">
                  {node.selectedAction.usedIn}
                </span>
              </div>
              <div>
                <span className="text-[#8f8f8d] block">Success rate</span>
                <span className="text-emerald-400 font-medium">
                  {node.selectedAction.successRate}
                </span>
              </div>
              <div>
                <span className="text-[#8f8f8d] block">Avg. latency</span>
                <span className="text-[#f3f3f1] font-medium">
                  {node.selectedAction.avgLatency}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Trigger Links */}
        <div className="flex items-center gap-2 pt-1">
          <Link href="/dashboard/sandboxes" className="flex-1">
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs font-mono border-dashed border-red-500/30 bg-red-500/10 hover:border-red-500 hover:bg-red-500/20 text-red-400 h-8"
            >
              <FlaskConical className="h-3.5 w-3.5 mr-1.5" />
              Test in Sandbox
            </Button>
          </Link>
          <Link href="/dashboard/traces" className="flex-1">
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs font-mono border-dashed border-[#2a2a28] bg-[#141413] hover:border-zinc-400 text-zinc-300 h-8"
            >
              <Activity className="h-3.5 w-3.5 mr-1.5" />
              View Traces
            </Button>
          </Link>
        </div>
      </div>
    </aside>
  );
}
