"use client";

import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowRight, Maximize2 } from "lucide-react";

interface GraphControlsProps {
  direction: "TB" | "LR";
  onDirectionChange: (dir: "TB" | "LR") => void;
  onFitView: () => void;
}

export function GraphToolbar({ direction, onDirectionChange, onFitView }: GraphControlsProps) {
  return (
    <div className="absolute top-4 right-4 z-10 flex items-center gap-1 rounded-xl border border-dashed border-[#2a2a28] bg-[#141413]/90 backdrop-blur-md p-1 shadow-2xl">
      <Button
        variant={direction === "TB" ? "secondary" : "ghost"}
        size="icon"
        className="h-7 w-7 border-dashed border-[#2a2a28]"
        onClick={() => onDirectionChange("TB")}
        title="Top to bottom layout"
      >
        <ArrowDown className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant={direction === "LR" ? "secondary" : "ghost"}
        size="icon"
        className="h-7 w-7 border-dashed border-[#2a2a28]"
        onClick={() => onDirectionChange("LR")}
        title="Left to right layout"
      >
        <ArrowRight className="h-3.5 w-3.5" />
      </Button>
      <div className="mx-1 h-4 w-px bg-[#2a2a28]" />
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-[#8f8f8d] hover:text-white"
        onClick={onFitView}
        title="Fit viewport"
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
