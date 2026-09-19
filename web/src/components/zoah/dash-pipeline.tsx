"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DashPipelineProps {
  activeStage?: number; // 0: Observed, 1: Predicted, 2: Verified, 3: Protected
  className?: string;
  variant?: "hero" | "compact";
  onSelectStage?: (index: number) => void;
}

const STAGES = [
  {
    name: "Observed",
    color: "text-blue-400",
    dot: "bg-blue-400",
    border: "border-blue-500/30",
    stroke: "#3b76ff",
    hoverBorder: "hover:border-blue-400/60",
    glow: "shadow-[0_0_12px_rgba(59,118,255,0.25)]",
  },
  {
    name: "Predicted",
    color: "text-zinc-300",
    dot: "bg-zinc-300",
    border: "border-zinc-500/30",
    stroke: "#8f8f8d",
    hoverBorder: "hover:border-zinc-300/60",
    glow: "shadow-[0_0_12px_rgba(143,143,141,0.25)]",
  },
  {
    name: "Verified",
    color: "text-red-400",
    dot: "bg-red-400",
    border: "border-red-500/30",
    stroke: "#ef4444",
    hoverBorder: "hover:border-red-400/60",
    glow: "shadow-[0_0_12px_rgba(239,68,68,0.25)]",
  },
  {
    name: "Protected",
    color: "text-amber-400",
    dot: "bg-amber-400",
    border: "border-amber-500/30",
    stroke: "#f59e0b",
    hoverBorder: "hover:border-amber-400/60",
    glow: "shadow-[0_0_12px_rgba(245,158,11,0.25)]",
  },
];

export function DashPipeline({
  activeStage,
  className,
  variant = "hero",
  onSelectStage,
}: DashPipelineProps) {
  const isHero = variant === "hero";

  return (
    <div
      className={cn(
        "flex items-center justify-center flex-wrap gap-2 sm:gap-3",
        className
      )}
    >
      {STAGES.map((stage, idx) => {
        const isActive = activeStage === undefined || activeStage === idx;
        const isPast = activeStage !== undefined && activeStage >= idx;

        return (
          <div key={stage.name} className="flex items-center gap-2 sm:gap-3">
            {/* Stage Badge with Zoah dashed border and glowing dot */}
            <motion.button
              type="button"
              onClick={() => onSelectStage?.(idx)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "group relative inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 transition-all duration-300",
                "border border-dashed font-mono text-xs uppercase tracking-[0.16em]",
                isActive
                  ? cn(
                      stage.border,
                      stage.color,
                      "bg-[#141413]/90 backdrop-blur-md",
                      stage.glow
                    )
                  : "border-[#2a2a28] text-zinc-500 bg-[#0f0f0e]/60 hover:text-zinc-300",
                stage.hoverBorder
              )}
            >
              {/* Dot indicator */}
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-all duration-300",
                  stage.dot,
                  isActive ? "opacity-100 animate-pulse" : "opacity-40"
                )}
              />

              {/* Stage label with animated dashed underline on hover/active */}
              <span className="relative">
                {stage.name}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 -bottom-1 w-full h-[1px] bg-gradient-to-r from-transparent via-current to-transparent opacity-60"
                  />
                )}
              </span>
            </motion.button>

            {/* Animated Flowing Dashed Connector Line */}
            {idx < STAGES.length - 1 && (
              <div className="relative flex items-center w-8 sm:w-12 h-5">
                <svg
                  viewBox="0 0 48 12"
                  fill="none"
                  className="w-full h-full overflow-visible"
                  preserveAspectRatio="none"
                >
                  {/* Base background line */}
                  <line
                    x1="2"
                    y1="6"
                    x2="40"
                    y2="6"
                    stroke="#2a2a28"
                    strokeWidth="1.25"
                    strokeDasharray="3 3"
                  />
                  {/* Animated flowing dashed stroke */}
                  <line
                    x1="2"
                    y1="6"
                    x2="40"
                    y2="6"
                    stroke={isPast ? stage.stroke : "#3e3e3a"}
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    className={cn(
                      "zoah-dash-animate transition-colors duration-500",
                      !isPast && "opacity-40"
                    )}
                  />
                  {/* Arrowhead */}
                  <path
                    d="M 38 3 L 44 6 L 38 9"
                    fill="none"
                    stroke={isPast ? stage.stroke : "#3e3e3a"}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-colors duration-500"
                  />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
