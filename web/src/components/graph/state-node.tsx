"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  UserCheck,
  MessageSquare,
  HelpCircle,
  Database,
  FileCheck,
  Package,
  CreditCard,
  AlertTriangle,
  Mail,
  CheckCircle,
  Clock,
  XCircle,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReferenceNodeMetadata } from "@/lib/graph-reference-data";

const ICON_MAP = {
  UserCheck,
  MessageSquare,
  HelpCircle,
  Database,
  FileCheck,
  Package,
  CreditCard,
  AlertTriangle,
  Mail,
  CheckCircle,
  Clock,
  XCircle,
  ShieldAlert,
};

function StateNodeComponent({ data, selected }: NodeProps) {
  const meta = data as unknown as ReferenceNodeMetadata;
  const isSelected = selected || meta.id === "refund_pending";
  const isFailure = meta.isFailure;

  const Icon = ICON_MAP[meta.iconName] || CreditCard;

  return (
    <motion.div
      whileHover={{ scale: 1.06 }}
      transition={{ duration: 0.2 }}
      className="relative flex items-center justify-center cursor-pointer"
    >
      {/* 4 Connection handles for smooth multi-directional Bezier paths */}
      <Handle
        type="target"
        id="top"
        position={Position.Top}
        className="!w-2 !h-2 !bg-[#3b76ff]/60 !border-[#141413] !opacity-0 hover:!opacity-100"
      />
      <Handle
        type="source"
        id="bottom"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-[#3b76ff]/60 !border-[#141413] !opacity-0 hover:!opacity-100"
      />
      <Handle
        type="target"
        id="left"
        position={Position.Left}
        className="!w-2 !h-2 !bg-[#3b76ff]/60 !border-[#141413] !opacity-0 hover:!opacity-100"
      />
      <Handle
        type="source"
        id="right"
        position={Position.Right}
        className="!w-2 !h-2 !bg-[#3b76ff]/60 !border-[#141413] !opacity-0 hover:!opacity-100"
      />

      {/* Circular Node Container */}
      <div
        className={cn(
          "relative flex flex-col items-center justify-center rounded-full transition-all duration-300 select-none",
          "w-24 h-24 sm:w-28 sm:h-28 bg-[#0c0c0b] text-center p-2.5",
          // Normal state
          "border border-[#2a2a28] shadow-lg shadow-black/80 hover:border-zinc-400",
          // Selected neon glow
          isSelected &&
            "border-2 border-[#3b76ff] ring-4 ring-[#3b76ff]/20 shadow-[0_0_35px_rgba(59,118,255,0.55),0_0_10px_rgba(59,118,255,0.7)] bg-[#0e1320]",
          // Failure danger state
          isFailure &&
            !isSelected &&
            "border-2 border-[#ef4444] ring-4 ring-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.45),0_0_10px_rgba(239,68,68,0.6)] bg-[#1a0c0c]"
        )}
      >
        {/* Subtle Concentric Inner Ring */}
        <div
          className={cn(
            "absolute inset-1.5 rounded-full border border-dashed pointer-events-none transition-colors",
            isSelected
              ? "border-[#3b76ff]/40"
              : isFailure
              ? "border-red-500/40"
              : "border-[#222220]"
          )}
        />

        {/* Node Icon */}
        <div className="relative mb-1">
          <Icon
            className={cn(
              "h-4 w-4 transition-colors",
              isSelected
                ? "text-[#3b76ff]"
                : isFailure
                ? "text-red-400"
                : "text-zinc-400"
            )}
          />
        </div>

        {/* State Label */}
        <span
          className={cn(
            "relative text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-tight leading-tight px-1 max-w-[84px] sm:max-w-[96px] truncate",
            isSelected
              ? "text-white"
              : isFailure
              ? "text-red-400"
              : "text-[#f3f3f1]"
          )}
          title={meta.label}
        >
          {meta.label}
        </span>

        {/* Runs Count */}
        <span className="relative text-[9px] font-mono text-[#8f8f8d] mt-0.5">
          {meta.runs.toLocaleString()} runs
        </span>
      </div>
    </motion.div>
  );
}

export const StateNode = memo(StateNodeComponent);
