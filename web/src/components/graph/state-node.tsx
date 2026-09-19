"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";

interface StateNodeData {
  label: string;
  [key: string]: unknown;
}

function StateNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as StateNodeData;
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0, scale: 0.8, y: 20 },
        visible: { opacity: 1, scale: 1, y: 0 },
      }}
      className={cn(
        "rounded-full border border-dashed bg-[#141413] px-5 py-2.5 text-xs font-mono transition-all",
        "hover:bg-[#181816] hover:border-zinc-400 hover:shadow-xl shadow-black/40",
        selected
          ? "border-[#3b76ff] ring-2 ring-[#3b76ff]/30 text-white shadow-[#3b76ff]/20"
          : "border-[#2a2a28] text-[#f3f3f1]"
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-[#3b76ff] !border-[#2a2a28] !w-2 !h-2" />
      <span className="text-[#f3f3f1] whitespace-nowrap">{nodeData.label.replace(/_/g, " ")}</span>
      <Handle type="source" position={Position.Bottom} className="!bg-[#3b76ff] !border-[#2a2a28] !w-2 !h-2" />
    </motion.div>
  );
}

export const StateNode = memo(StateNodeComponent);
