"use client";

import { X, ExternalLink, FileText, FlaskConical, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import type { GraphEdge } from "@/lib/types";

interface NodeDetailPanelProps {
  nodeId: string;
  edges: GraphEdge[];
  onClose: () => void;
}

function EdgeLinks({ edge }: { edge: GraphEdge }) {
  // One-click evidence links per spec: every red path links to trace, sandbox log, eval.
  const isVerified = edge.kind === "verified";
  const isObserved = edge.kind === "observed";
  const isPredicted = edge.kind === "predicted";
  const isProtected = edge.kind === "protected";

  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {(isObserved || isVerified || isProtected) && (
        <Link
          href="/dashboard/traces"
          className="inline-flex items-center gap-1 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-300 hover:bg-zinc-700 hover:text-white"
        >
          <FileText className="h-3 w-3" />
          {edge.source || "trace"}
          <ExternalLink className="h-2.5 w-2.5" />
        </Link>
      )}
      {isPredicted && (
        <Link
          href="/dashboard/scenarios"
          className="inline-flex items-center gap-1 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-300 hover:bg-zinc-700 hover:text-white"
        >
          <FlaskConical className="h-3 w-3" />
          {edge.source || "scenario"}
          <ExternalLink className="h-2.5 w-2.5" />
        </Link>
      )}
      {(isVerified || isProtected) && (
        <Link
          href="/dashboard/sandboxes/sb_07"
          className="inline-flex items-center gap-1 rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] text-red-300 hover:bg-red-500/25 hover:text-red-200"
        >
          <ExternalLink className="h-2.5 w-2.5" />
          sandbox log
        </Link>
      )}
      {(isVerified || isProtected) && (
        <Link
          href="/dashboard/evals"
          className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-300 hover:bg-amber-500/25 hover:text-amber-200"
        >
          <ShieldCheck className="h-3 w-3" />
          eval file
        </Link>
      )}
    </div>
  );
}

export function NodeDetailPanel({ nodeId, edges, onClose }: NodeDetailPanelProps) {
  const incoming = edges.filter((e) => e.to === nodeId);
  const outgoing = edges.filter((e) => e.from === nodeId);

  return (
    <div className="absolute top-0 right-0 z-20 h-full w-84 border-l border-[#2a2a28] bg-[#141413] shadow-2xl overflow-auto">
      <div className="flex items-center justify-between border-b border-[#2a2a28] p-4">
        <div>
          <span className="text-[10px] font-mono text-[#8f8f8d] uppercase tracking-wider block">Selected State</span>
          <h3 className="text-sm font-mono font-semibold text-[#f3f3f1]">{nodeId.replace(/_/g, " ")}</h3>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-[#8f8f8d] hover:text-white" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 space-y-5">
        {incoming.length > 0 && (
          <div>
            <h4 className="text-[11px] font-mono font-medium text-[#8f8f8d] uppercase tracking-wider mb-2.5">
              Incoming ({incoming.length})
            </h4>
            <div className="space-y-2.5">
              {incoming.map((e, i) => (
                <div key={i} className="rounded-xl border border-dashed border-[#2a2a28] bg-[#0b0b0a] p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono text-[#8f8f8d]">{e.from}</span>
                      <span className="mx-1.5 text-xs text-zinc-600">→</span>
                      <span className="text-xs font-mono font-medium text-[#f3f3f1]">{e.action}</span>
                    </div>
                    <StatusBadge status={e.kind} />
                  </div>
                  <EdgeLinks edge={e} />
                </div>
              ))}
            </div>
          </div>
        )}

        {outgoing.length > 0 && (
          <div>
            <h4 className="text-[11px] font-mono font-medium text-[#8f8f8d] uppercase tracking-wider mb-2.5">
              Outgoing ({outgoing.length})
            </h4>
            <div className="space-y-2.5">
              {outgoing.map((e, i) => (
                <div key={i} className="rounded-xl border border-dashed border-[#2a2a28] bg-[#0b0b0a] p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono font-medium text-[#f3f3f1]">{e.action}</span>
                      <span className="mx-1.5 text-xs text-zinc-600">→</span>
                      <span className="text-xs font-mono text-[#8f8f8d]">{e.to}</span>
                    </div>
                    <StatusBadge status={e.kind} />
                  </div>
                  <EdgeLinks edge={e} />
                </div>
              ))}
            </div>
          </div>
        )}

        {incoming.length === 0 && outgoing.length === 0 && (
          <p className="text-xs font-mono text-[#8f8f8d]">No connected transitions found for this state.</p>
        )}
      </div>
    </div>
  );
}
