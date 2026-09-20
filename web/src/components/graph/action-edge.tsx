"use client";

import { memo } from "react";
import { getBezierPath, type EdgeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { EdgeKind } from "@/lib/types";

interface ActionEdgeData {
  action?: string;
  kind?: EdgeKind;
  runs?: number;
  percent?: string;
  [key: string]: unknown;
}

const EDGE_STYLES: Record<
  EdgeKind,
  { stroke: string; strokeDasharray?: string; markerColor: string }
> = {
  observed: {
    stroke: "#3b76ff",
    strokeDasharray: "none",
    markerColor: "#3b76ff",
  },
  predicted: {
    stroke: "#71717a",
    strokeDasharray: "5 4",
    markerColor: "#71717a",
  },
  verified: {
    stroke: "#ef4444",
    strokeDasharray: "5 4",
    markerColor: "#ef4444",
  },
  protected: {
    stroke: "#f59e0b",
    strokeDasharray: "5 4",
    markerColor: "#f59e0b",
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

  const [edgePath] = getBezierPath({
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
          markerWidth={8}
          markerHeight={8}
          refX={7}
          refY={4}
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M 1 1 L 7 4 L 1 7 z" fill={edgeConfig.markerColor} />
        </marker>
      </defs>

      {/* Main Curved Path */}
      <path
        id={id}
        d={edgePath}
        stroke={edgeConfig.stroke}
        strokeWidth={isHighlighted ? 2.25 : 1.75}
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
    </>
  );
}

export const ActionEdge = memo(ActionEdgeComponent);
