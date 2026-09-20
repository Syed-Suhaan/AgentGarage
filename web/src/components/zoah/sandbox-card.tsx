"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

interface SandboxFeedItem {
  actor: string;
  action: string;
  time: string;
  variant: "cyan" | "teal" | "pink" | "purple" | "red";
  faded?: boolean;
}

const FEED_ITEMS: SandboxFeedItem[] = [
  {
    actor: "Checkout Service",
    action: "restored degraded checkout snapshot",
    time: "now",
    variant: "cyan",
  },
  {
    actor: "Chaos Engine",
    action: "injected rollback_deployment → timeout",
    time: "1m",
    variant: "teal",
  },
  {
    actor: "SRE Agent",
    action: "rollback succeeded but timeout simulated",
    time: "2m",
    variant: "pink",
  },
  {
    actor: "SRE Agent",
    action: "retry attempted · rolled back too far",
    time: "3m",
    variant: "purple",
  },
  {
    actor: "Eval Gate",
    action: "INVARIANT FAIL: rollback_count = 2 (expected ≤ 1)",
    time: "4m",
    variant: "red",
    faded: true,
  },
];

/**
 * Iridescent miniature glowing sphere matching the reference design in Image 1
 */
function IridescentOrb({
  variant = "cyan",
  faded = false,
}: {
  variant?: "cyan" | "teal" | "pink" | "purple" | "red";
  faded?: boolean;
}) {
  const gradientMap = {
    cyan: "radial-gradient(circle at 35% 25%, #67e8f9 0%, #38bdf8 35%, #4338ca 70%, #050505 100%)",
    teal: "radial-gradient(circle at 35% 25%, #5eead4 0%, #06b6d4 35%, #1e1b4b 70%, #050505 100%)",
    pink: "radial-gradient(circle at 35% 25%, #f472b6 0%, #c084fc 35%, #4c0519 70%, #050505 100%)",
    purple: "radial-gradient(circle at 35% 25%, #c084fc 0%, #818cf8 35%, #312e81 70%, #050505 100%)",
    red: "radial-gradient(circle at 35% 25%, #f87171 0%, #ef4444 35%, #450a0a 70%, #050505 100%)",
  };

  return (
    <div
      className={cn(
        "relative h-3.5 w-3.5 shrink-0 rounded-full overflow-hidden border border-white/10 transition-opacity",
        faded ? "opacity-35" : "opacity-100"
      )}
      style={{
        background: gradientMap[variant],
        boxShadow: faded ? "none" : "0 0 8px rgba(120, 119, 198, 0.3)",
      }}
    >
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.45)_0%,transparent_55%)]" />
    </div>
  );
}

export function SandboxFeedCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#121212] p-5 sm:p-6 shadow-2xl transition-all">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-2.5">
          <Terminal className="h-4 w-4 text-white" />
          <h3 className="text-base font-semibold tracking-tight text-white">
            Sandbox
          </h3>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span>streaming</span>
        </div>
      </div>

      {/* Feed Rows */}
      <div className="divide-y divide-white/[0.04] py-1">
        {FEED_ITEMS.map((item, idx) => (
          <div
            key={idx}
            className={cn(
              "flex items-center justify-between py-3 gap-3 text-sm transition-opacity",
              item.faded ? "opacity-40" : "opacity-100"
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <IridescentOrb variant={item.variant} faded={item.faded} />
              <div className="flex items-center gap-2 min-w-0 truncate text-xs sm:text-sm">
                <span className="font-medium text-white shrink-0">
                  {item.actor}
                </span>
                <span className="text-zinc-400 truncate">
                  {item.action}
                </span>
              </div>
            </div>
            <span className="font-mono text-xs text-zinc-500 shrink-0 ml-2">
              {item.time}
            </span>
          </div>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2.5">
        <Link
          href="/dashboard/sandboxes/sb_07"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-200 hover:bg-white/10 hover:border-white/30 transition-all"
        >
          Open sandbox <ArrowRight className="h-3 w-3" />
        </Link>
        <Link
          href="/dashboard/evals"
          className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-900 hover:bg-white transition-all shadow-sm"
        >
          View eval
        </Link>
      </div>
    </div>
  );
}
