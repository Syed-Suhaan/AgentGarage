"use client";

import { useReactFlow } from "@xyflow/react";
import { Plus, Minus, Maximize2, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CanvasControlsProps {
  onCenterSelected?: () => void;
}

export function CanvasControls({ onCenterSelected }: CanvasControlsProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-[#2a2a28] bg-[#0c0c0b]/95 backdrop-blur-md p-1 shadow-2xl">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => zoomIn({ duration: 300 })}
        className="h-7 w-7 text-[#8f8f8d] hover:text-[#f3f3f1] hover:bg-[#181816]"
        title="Zoom In"
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => zoomOut({ duration: 300 })}
        className="h-7 w-7 text-[#8f8f8d] hover:text-[#f3f3f1] hover:bg-[#181816]"
        title="Zoom Out"
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <div className="my-0.5 h-px w-4 bg-[#2a2a28]" />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => fitView({ padding: 0.15, duration: 500 })}
        className="h-7 w-7 text-[#8f8f8d] hover:text-[#f3f3f1] hover:bg-[#181816]"
        title="Fit View"
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onCenterSelected || (() => fitView({ padding: 0.2, duration: 500 }))}
        className="h-7 w-7 text-[#8f8f8d] hover:text-[#f3f3f1] hover:bg-[#181816]"
        title="Center Selected State"
      >
        <Crosshair className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export const GraphToolbar = CanvasControls;

