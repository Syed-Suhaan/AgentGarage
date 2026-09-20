"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Copy,
  Check,
  Maximize2,
  AlertTriangle,
  RotateCcw,
  GitBranch,
  Terminal,
  FileCode2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LIVE_TRACE, getStageAtTime } from "@/lib/live-workflow";

interface TraceInspectorProps {
  selectedBay?: string | null;
  onSelectBay?: (bay: string | null) => void;
  currentTime?: number;
}

async function safeCopy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

export function TraceInspector({
  selectedBay,
  currentTime = LIVE_TRACE.errorAt,
}: TraceInspectorProps) {
  const [evidenceTab, setEvidenceTab] = useState<"raw" | "redacted" | "summary">("raw");
  const [copiedId, setCopiedId] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const stage = getStageAtTime(currentTime);
  const failed = currentTime >= LIVE_TRACE.errorAt;

  const handleCopyId = async () => {
    if (await safeCopy(LIVE_TRACE.traceId)) {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleCopyJson = async () => {
    if (await safeCopy(JSON.stringify(rawPayload, null, 2))) {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    }
  };

  const rawPayload = {
    tool: "read_obd",
    input: {
      vin: "***********3421",
    },
    output: {
      dtc: ["P0***", "B1***"],
      confidence: 0.12,
    },
  };

  const unredactedPayload = {
    tool: "read_obd",
    input: {
      vin: "1HGCR2F83HA123421",
      protocol: "ISO_15765_4_CAN",
    },
    output: {
      dtc: ["P0136", "B1000"],
      raw_hex: "0x43 0x02 0x01 0x36 0x90 0x00",
      confidence: 0.12,
    },
  };

  const summaryText = `[30.2s] mechanic-bot-001 executed tool 'read_obd' on vehicle VIN ***********3421.
Sensor returned DTC codes ['P0***', 'B1***'] with low model confidence (0.12).
Eval Gate comparison failed: expected benchmark DTC P0420 (Catalytic converter efficiency below threshold), but agent emitted P0136 (O2 Sensor Circuit Malfunction Bank 1 Sensor 2).`;

  return (
    <aside className="w-80 sm:w-[360px] lg:w-[380px] shrink-0 border-l border-[#2a2a28] bg-[#0c0c0b] flex flex-col h-full overflow-hidden select-none font-mono text-xs">
      {/* Inspector Header */}
      <div className="flex h-11 items-center justify-between border-b border-[#2a2a28] px-4 bg-[#10100f] shrink-0">
        <div className="flex items-center gap-2 text-[#f3f3f1]">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-[#3b76ff]/20 text-[#3b76ff]">
            <Terminal className="h-3 w-3" />
          </div>
          <span className="font-semibold tracking-tight text-[12px]">Trace Inspector</span>
        </div>

        <div className="flex items-center gap-1 text-[#8f8f8d]">
          <button
            onClick={handleCopyId}
            className="p-1 rounded hover:bg-[#1a1a18] hover:text-[#f3f3f1] transition-colors"
            title="Copy Trace ID"
          >
            {copiedId ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <button
            className="p-1 rounded hover:bg-[#1a1a18] hover:text-[#f3f3f1] transition-colors"
            title="Expand Inspector"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Scrollable Inspector Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-[11px]">
        {/* Trace Metadata Table */}
        <div className="space-y-1.5 rounded-xl border border-dashed border-[#2a2a28] bg-[#141413] p-3 text-[#8f8f8d]">
          <div className="flex items-center justify-between">
            <span className="uppercase text-[10px] tracking-wider text-[#71717a]">Trace ID</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[#f3f3f1] font-semibold">{LIVE_TRACE.traceId}</span>
              <button
                onClick={handleCopyId}
                className="text-[#71717a] hover:text-[#f3f3f1] transition-colors"
              >
                {copiedId ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="uppercase text-[10px] tracking-wider text-[#71717a]">Agent</span>
            <span className="text-[#f3f3f1]">{LIVE_TRACE.agent}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="uppercase text-[10px] tracking-wider text-[#71717a]">Task</span>
            <span className="text-[#f3f3f1]">{LIVE_TRACE.task}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="uppercase text-[10px] tracking-wider text-[#71717a]">Stage</span>
            <span className="text-[#3b76ff]">{stage ? `${stage.label} (${stage.action})` : "—"}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="uppercase text-[10px] tracking-wider text-[#71717a]">Started</span>
            <span className="text-[#f3f3f1]">{LIVE_TRACE.started}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="uppercase text-[10px] tracking-wider text-[#71717a]">Duration</span>
            <span className="text-[#f3f3f1]">{currentTime.toFixed(1)}s / {LIVE_TRACE.duration}s</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="uppercase text-[10px] tracking-wider text-[#71717a]">Status</span>
            {failed ? (
              <span className="rounded bg-red-600/20 px-2 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/40 animate-pulse">
                verified fail
              </span>
            ) : (
              <span className="rounded bg-emerald-600/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/40">
                running • {stage?.label ?? ""}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="uppercase text-[10px] tracking-wider text-[#71717a]">Path</span>
            <span className="text-[#f3f3f1]">dispatch → verify → sandbox</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="uppercase text-[10px] tracking-wider text-[#71717a]">Retry</span>
            <span className="text-[#f3f3f1]">1/3</span>
          </div>
        </div>

        {/* Selected Station Banner if clicked */}
        {selectedBay && (
          <div className="rounded-xl border border-blue-500/40 bg-blue-500/10 p-3 text-blue-300">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-[10px] text-blue-400">
                Focus Bay: {selectedBay}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-blue-200">
              Station telemetry linked to current replay timeline scrubber at {currentTime.toFixed(1)}s.
            </p>
          </div>
        )}

        {/* Evidence (redacted) Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[#f3f3f1] font-semibold text-[11px]">
              <FileCode2 className="h-3.5 w-3.5 text-blue-400" />
              <span>Evidence (redacted)</span>
            </div>
            <button
              onClick={handleCopyJson}
              className="text-[#71717a] hover:text-[#f3f3f1] transition-colors p-1"
              title="Copy payload"
            >
              {copiedJson ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>

          {/* Pill Tabs: RAW, REDACTED, SUMMARY */}
          <div className="flex items-center gap-1 rounded-lg border border-dashed border-[#2a2a28] bg-[#141413] p-1">
            <button
              onClick={() => setEvidenceTab("raw")}
              className={cn(
                "flex-1 rounded py-1 text-center font-bold tracking-tight text-[10px] transition-all",
                evidenceTab === "raw"
                  ? "bg-[#3b76ff] text-white shadow-sm"
                  : "text-[#8f8f8d] hover:text-[#f3f3f1]"
              )}
            >
              RAW
            </button>
            <button
              onClick={() => setEvidenceTab("redacted")}
              className={cn(
                "flex-1 rounded py-1 text-center font-bold tracking-tight text-[10px] transition-all",
                evidenceTab === "redacted"
                  ? "bg-[#3b76ff] text-white shadow-sm"
                  : "text-[#8f8f8d] hover:text-[#f3f3f1]"
              )}
            >
              REDACTED
            </button>
            <button
              onClick={() => setEvidenceTab("summary")}
              className={cn(
                "flex-1 rounded py-1 text-center font-bold tracking-tight text-[10px] transition-all",
                evidenceTab === "summary"
                  ? "bg-[#3b76ff] text-white shadow-sm"
                  : "text-[#8f8f8d] hover:text-[#f3f3f1]"
              )}
            >
              SUMMARY
            </button>
          </div>

          {/* Code Box */}
          <div className="relative rounded-xl border border-dashed border-[#2a2a28] bg-[#080808] p-3 text-[10.5px] leading-relaxed text-emerald-300 font-mono overflow-x-auto shadow-inner">
            {evidenceTab === "raw" && (
              <pre className="text-zinc-300">
                {JSON.stringify(rawPayload, null, 2)}
              </pre>
            )}
            {evidenceTab === "redacted" && (
              <pre className="text-blue-300">
                {JSON.stringify(unredactedPayload, null, 2)}
              </pre>
            )}
            {evidenceTab === "summary" && (
              <p className="text-[#a1a1aa] whitespace-pre-wrap leading-relaxed">
                {summaryText}
              </p>
            )}
          </div>
        </div>

        {/* Failure Reason Card */}
        <div className="rounded-xl border border-red-500/40 bg-[#1c0e0e] p-3 space-y-1.5 shadow-lg shadow-red-950/20">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="font-bold tracking-wider uppercase text-[10px]">
              Failure Reason
            </span>
          </div>
          <p className="text-[11px] text-red-300 leading-relaxed font-mono">
            Incorrect diagnosis. Expected P0420, agent suggested P0136.
          </p>
        </div>

        {/* Fast Actions */}
        <div className="space-y-2 pt-2 border-t border-[#1f1f1d]">
          <Link href="/dashboard/sandboxes" className="block">
            <Button
              size="sm"
              variant="outline"
              className="w-full h-8 text-[11px] font-mono border-dashed border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-400 justify-start"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-2" />
              Re-run Fault Injection in Sandbox
            </Button>
          </Link>

          <Link href="/dashboard/graph" className="block">
            <Button
              size="sm"
              variant="outline"
              className="w-full h-8 text-[11px] font-mono border-dashed border-[#2a2a28] bg-[#141413] hover:border-zinc-400 text-[#f3f3f1] justify-start"
            >
              <GitBranch className="h-3.5 w-3.5 mr-2 text-[#3b76ff]" />
              View State in Behaviour Graph
            </Button>
          </Link>
        </div>
      </div>
    </aside>
  );
}
