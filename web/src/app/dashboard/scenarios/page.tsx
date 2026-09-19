"use client";

import { useState } from "react";
import Link from "next/link";
import { useSimulate } from "@/lib/hooks/use-scenarios";
import { useStartSandbox } from "@/lib/hooks/use-sandbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { JsonViewer } from "@/components/shared/json-viewer";
import { Play, FlaskConical } from "lucide-react";
import type { Scenario } from "@/lib/types";

// Mock scenarios for demo
const DEMO_SCENARIOS: Scenario[] = [
  {
    scenario_id: "sc_19",
    unexplored_state: "refund_succeeded",
    untried_action: "tool_timeout",
    fault: { tool: "issue_refund", behavior: "timeout_after_success" },
    hypothesis: "agent retries issue_refund after timeout, causing a second refund",
    initial_state: { customer_verified: true, refund_status: "pending", ledger_refunds: 0 },
    status: "predicted",
  },
  {
    scenario_id: "sc_20",
    unexplored_state: "refund_pending",
    untried_action: "duplicate_callback",
    fault: { tool: "issue_refund", behavior: "duplicate_callback" },
    hypothesis: "duplicate callback marks refund as complete twice, confusing the agent",
    initial_state: { customer_verified: true, refund_status: "pending", ledger_refunds: 0 },
    status: "predicted",
  },
];

export default function ScenariosPage() {
  const [selected, setSelected] = useState<Scenario | null>(null);
  const startSandbox = useStartSandbox();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-dashed border-red-500/40 bg-red-500/10 px-3 py-0.5 text-[11px] font-mono text-red-400 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
            <span>PHASE 3 — DANGER PATHS TEST</span>
          </div>
          <h1 className="text-2xl font-normal text-[#f3f3f1] tracking-tight">Danger Scenarios</h1>
          <p className="text-xs sm:text-sm text-[#8f8f8d] mt-1">
            Hypothetical failure scenarios generated from unexplored paths, configured with synthetic faults.
          </p>
        </div>
        <Link href="/dashboard/sandboxes">
          <Button size="sm" variant="outline" className="border-dashed border-red-500/30 bg-red-500/10 hover:border-red-500 text-red-400 text-xs font-mono">
            Open Danger Paths Test (with sandbox) →
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {DEMO_SCENARIOS.map((s) => (
          <Card
            key={s.scenario_id}
            className="cursor-pointer transition-all border border-dashed border-[#2a2a28] bg-[#141413] hover:border-zinc-400/50 hover:bg-[#181816]"
            onClick={() => setSelected(s)}
          >
            <CardHeader className="pb-3 border-b border-[#1f1f1d]">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-mono text-[#f3f3f1]">{s.scenario_id}</CardTitle>
                <StatusBadge status={s.status} />
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <p className="text-xs font-mono text-[#8f8f8d] mb-3 leading-relaxed">{s.hypothesis}</p>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-[#8f8f8d]">Injected Fault:</span>
                <code className="rounded border border-dashed border-red-500/40 bg-red-500/10 px-2 py-0.5 text-red-400">
                  {s.fault.tool} → {s.fault.behavior}
                </code>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selected && (
        <Card className="border border-dashed border-[#2a2a28] bg-[#141413] shadow-2xl">
          <CardHeader className="border-b border-[#1f1f1d]">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-mono text-[#f3f3f1]">Scenario Detail: {selected.scenario_id}</CardTitle>
              <Button
                size="sm"
                onClick={() => startSandbox.mutate(selected.scenario_id)}
                disabled={startSandbox.isPending}
                className="bg-[#3b76ff] hover:bg-blue-500 text-white font-mono text-xs"
              >
                <Play className="h-3.5 w-3.5 mr-1.5" />
                Launch Sandbox Verification
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <h4 className="text-xs font-mono uppercase text-[#8f8f8d] mb-2 tracking-wider">Failure Hypothesis</h4>
              <p className="text-sm font-mono text-[#f3f3f1] bg-[#0b0b0a] border border-[#1f1f1d] p-3 rounded-lg">{selected.hypothesis}</p>
            </div>
            <div>
              <h4 className="text-xs font-mono uppercase text-[#8f8f8d] mb-2 tracking-wider">Fault Injection Configuration</h4>
              <JsonViewer data={selected.fault} />
            </div>
            <div>
              <h4 className="text-xs font-mono uppercase text-[#8f8f8d] mb-2 tracking-wider">Initial State Variables</h4>
              <JsonViewer data={selected.initial_state} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
