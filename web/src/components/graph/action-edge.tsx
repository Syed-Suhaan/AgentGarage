"use client";

import { memo, useEffect, useRef, useState } from "react";
import {
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
  MarkerType,
} from "@xyflow/react";
import { cn } from "@/lib/utils";
import { statusConfig } from "@/lib/status-colors";
import type { EdgeKind } from "@/lib/types";

interface ActionEdgeData {
  action: string;
  kind: EdgeKind;
  source: string;
  [key: string]: unknown;
}

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
  markerEnd,
}: EdgeProps) {
  const edgeData = data as ActionEdgeData;
  const kind = edgeData?.kind || "observed";
  const config = statusConfig[kind];

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (pathRef.current) {
      const length = pathRef.current.getTotalLength();
      setPathLength(length);
      pathRef.current.style.strokeDasharray = `${length} ${length}`;
      pathRef.current.style.strokeDashoffset = length.toString();
      
      requestAnimationFrame(() => {
        setIsVisible(true);
        pathRef.current!.style.transition = "stroke-dashoffset 0.8s ease-out";
        pathRef.current!.style.strokeDashoffset = "0";
      });
    }
  }, []);

  const strokeDasharray = kind === "predicted" ? "6 4" : undefined;
  const animatedDash = kind === "predicted" && isVisible;

  return (
    <>
      <path
        ref={pathRef}
        d={edgePath}
        stroke={config.color}
        strokeWidth={kind === "verified" ? 2.5 : 1.5}
        fill="none"
        markerEnd={markerEnd || `url(#arrowhead-${kind})`}
        style={{
          ...style,
          strokeDasharray: isVisible ? (animatedDash ? "6 4" : undefined) : `${pathLength} ${pathLength}`,
          strokeDashoffset: isVisible ? 0 : pathLength,
          transition: isVisible ? "stroke-dashoffset 0.8s ease-out" : "none",
        }}
        className={cn(
          kind === "verified" && "animate-pulse-glow",
          animatedDash && "animate-dash-flow"
        )}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
        >
          <div
            className={cn(
              "rounded-md border border-dashed px-2.5 py-0.5 text-[10px] font-mono",
              "bg-[#0b0b0a]/90 backdrop-blur-sm cursor-pointer",
              "hover:scale-105 transition-transform shadow-lg",
              config.border,
              config.className
            )}
          >
            {edgeData?.action?.replace(/_/g, " ") || "action"}
          </div>
        </div>
      </EdgeLabelRenderer>
      
      {/* Arrowhead markers for each edge kind */}
      <defs>
        {["observed", "predicted", "verified", "protected"].map((k) => (
          <marker
            key={k}
            id={`arrowhead-${k}`}
            markerWidth={10}
            markerHeight={7}
            refX={9}
            refY={3.5}
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path
              d="M0,0 L0,7 L9,3.5 Z"
              fill={statusConfig[k as EdgeKind].color}
            />
          </marker>
        ))}
      </defs>
    </>
  );
}

export const ActionEdge = memo(ActionEdgeComponent);
