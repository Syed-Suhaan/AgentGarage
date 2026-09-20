"use client";

import { memo, useId } from "react";
import {
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { EdgeKind } from "@/lib/types";

interface ActionEdgeData {
  action: string;
  kind: EdgeKind;
  runs?: number;
  percent?: string;
  [key: string]: unknown;
}

const EDGE_STYLES: Record<
  EdgeKind,
  { stroke: string; strokeDasharray?: string; markerColor: string; labelBadgeClass: string }
> = {
  observed: {
    stroke: "#3b76ff",
    strokeDasharray: "none",
    markerColor: "#3b76ff",
    labelBadgeClass: "border-blue-500/40 text-blue-400 bg-blue-500/10",
  },
  predicted: {
    stroke: "#71717a",
    strokeDasharray: "5 4",
    markerColor: "#71717a",
    labelBadgeClass: "border-zinc-500/40 text-zinc-400 bg-zinc-500/10",
  },
  verified: {
    stroke: "#ef4444",
    strokeDasharray: "6 3",
    markerColor: "#ef4444",
    labelBadgeClass: "border-red-500/40 text-red-400 bg-red-500/10",
  },
  protected: {
    stroke: "#f59e0b",
    strokeDasharray: "6 3",
    markerColor: "#f59e0b",
    labelBadgeClass: "border-amber-500/40 text-amber-400 bg-amber-500/10",
  },
};

function ActionEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  selected,
}: EdgeProps) {
  const edgeData = data as ActionEdgeData;
  const kind = edgeData?.kind || "observed";
  const edgeConfig = EDGE_STYLES[kind] || EDGE_STYLES.observed;
  const markerId = `arrowhead-${id.replace(/[^a-zA-Z0-9_-]/g, "_")}`;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.25,
  });

  const isHighlighted = selected || kind === "verified";

  return (
    <>
      <defs>
        <marker
          id={markerId}
          markerWidth={10}
          markerHeight={8}
          refX={8}
          refY={4}
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M 0 0 L 10 4 L 0 8 z" fill={edgeConfig.markerColor} />
        </marker>
      </defs>

      {/* Main Curved Path */}
      <path
        id={id}
        d={edgePath}
        stroke={edgeConfig.stroke}
        strokeWidth={isHighlighted ? 2.5 : 1.75}
        strokeDasharray={edgeConfig.strokeDasharray}
        fill="none"
        markerEnd={`url(#${markerId})`}
        style={{
          ...style,
        }}
        className={cn(
          "transition-all duration-300",
          kind === "verified" && "animate-pulse",
          kind === "predicted" && "opacity-80",
          isHighlighted && "drop-shadow-[0_0_8px_currentColor]"
        )}
      />

      {/* Edge action pill badge if action is non-empty */}
      {edgeData?.action && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan select-none group"
          >
            <div
              className={cn(
                "rounded border border-dashed px-1.5 py-0.5 text-[9px] font-mono whitespace-nowrap",
                "backdrop-blur-md bg-[#0b0b0a]/90 shadow-md transition-all duration-200",
                "hover:scale-110",
                edgeConfig.labelBadgeClass
              )}
            >
              <span>{edgeData.action}</span>
              {edgeData.percent && (
                <span className="ml-1 opacity-75 font-semibold">{edgeData.percent}</span>
              )}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const ActionEdge = memo(ActionEdgeComponent);
