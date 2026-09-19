"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Terminal, ArrowRight } from "lucide-react";

const DEMO_SANDBOXES = [
  {
    sandbox_id: "sb_07",
    scenario_id: "sc_19",
    status: "verified_fail",
    summary: "issue_refund timeout_after_success → 2 refunds",
  },
];

export default function SandboxesPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-dashed border-red-500/30 bg-red-500/10 px-3 py-0.5 text-[11px] font-mono text-red-400 mb-2">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
          <span>PHASE 3 — VERIFIED</span>
        </div>
        <h1 className="text-2xl font-normal text-[#f3f3f1] tracking-tight">Isolated Sandboxes</h1>
        <p className="text-xs sm:text-sm text-[#8f8f8d] mt-1">
          Adversarial sandboxes running against the real agent to reproduce bugs and verify safety invariants.
        </p>
      </div>

      <div className="space-y-4">
        {DEMO_SANDBOXES.map((sb) => (
          <Link key={sb.sandbox_id} href={`/dashboard/sandboxes/${sb.sandbox_id}`}>
            <Card className="cursor-pointer transition-all border border-dashed border-[#2a2a28] bg-[#141413] hover:border-red-500/50 hover:bg-[#181816]">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
                      <Terminal className="h-4 w-4" />
                    </div>
                    <span className="font-mono text-sm font-semibold text-[#f3f3f1]">
                      {sb.sandbox_id}
                    </span>
                    <span className="rounded border border-dashed border-[#2a2a28] bg-[#0b0b0a] px-2 py-0.5 text-xs font-mono text-[#8f8f8d]">
                      {sb.scenario_id}
                    </span>
                    <Badge variant="destructive" className="text-[10px] font-mono uppercase">
                      {sb.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#8f8f8d] group-hover:translate-x-1 group-hover:text-white transition-all" />
                </div>
                <p className="mt-3 text-xs font-mono text-[#8f8f8d]">
                  {sb.summary}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
