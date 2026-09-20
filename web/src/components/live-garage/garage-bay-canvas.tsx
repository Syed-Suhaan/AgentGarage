"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Wrench,
  Activity,
  Terminal,
  Car,
  Bot,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GarageBayCanvasProps {
  currentTime: number;
  selectedBay: string | null;
  onSelectBay: (bay: string | null) => void;
}

interface StationInfo {
  id: string;
  name: string;
  status: "ONLINE" | "PASS" | "WARNING" | "FAIL" | "STANDBY" | "ACTIVE";
  statusColor: string;
  description: string;
  x: string;
  y: string;
  width: string;
  height: string;
}

const STATIONS: StationInfo[] = [
  {
    id: "dispatch",
    name: "DISPATCH",
    status: "ONLINE",
    statusColor: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
    description: "Initial task intake & NLU parser. Dispatched task 'diagnose_vehicle'.",
    x: "5%",
    y: "14%",
    width: "20%",
    height: "36%",
  },
  {
    id: "verify",
    name: "VERIFY",
    status: "PASS",
    statusColor: "text-blue-400 border-blue-500/40 bg-blue-500/10",
    description: "Hydraulic hoist station. OBD-II communication protocol verified.",
    x: "26%",
    y: "14%",
    width: "20%",
    height: "36%",
  },
  {
    id: "tool_bench",
    name: "TOOL BENCH",
    status: "ACTIVE",
    statusColor: "text-cyan-400 border-cyan-500/40 bg-cyan-500/10",
    description: "Diagnostic instrumentation bench. read_obd tool loaded.",
    x: "50%",
    y: "14%",
    width: "20%",
    height: "36%",
  },
  {
    id: "sandbox_bay",
    name: "SANDBOX BAY",
    status: "FAIL",
    statusColor: "text-red-400 border-red-500/40 bg-red-500/20",
    description: "Isolated fault containment bay. Injection fault triggered: dtc mismatch.",
    x: "72%",
    y: "12%",
    width: "25%",
    height: "40%",
  },
  {
    id: "idle_agents",
    name: "IDLE AGENTS",
    status: "STANDBY",
    statusColor: "text-zinc-400 border-zinc-500/40 bg-zinc-500/10",
    description: "Fleet parking & staging zone. 3 backup mechanic-bots available.",
    x: "2%",
    y: "56%",
    width: "24%",
    height: "40%",
  },
  {
    id: "unexplored_path",
    name: "UNEXPLORED PATH",
    status: "WARNING",
    statusColor: "text-amber-400 border-amber-500/40 bg-amber-500/10",
    description: "High-risk unhedged trajectory. Requires sandboxed eval test.",
    x: "34%",
    y: "56%",
    width: "26%",
    height: "38%",
  },
  {
    id: "eval_gate",
    name: "EVAL GATE",
    status: "ACTIVE",
    statusColor: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
    description: "Automated regression verification gate. Checkpoint score: 0.12 (FAIL).",
    x: "65%",
    y: "56%",
    width: "22%",
    height: "38%",
  },
];

export function GarageBayCanvas({
  currentTime,
  selectedBay,
  onSelectBay,
}: GarageBayCanvasProps) {
  const [hoveredStation, setHoveredStation] = useState<StationInfo | null>(null);

  // Calculate bot position along the blue circuit line based on currentTime (0 to 37.4s)
  const botPosition = useMemo(() => {
    // Total duration: 37.4s
    const t = Math.min(37.4, Math.max(0, currentTime));
    
    if (t < 6.0) {
      // Dispatch desk
      const progress = t / 6.0;
      return { x: 12 + progress * 6, y: 35, stage: "Intake request at DISPATCH" };
    } else if (t < 13.0) {
      // Corner to under Verify lift
      const progress = (t - 6.0) / 7.0;
      return { x: 18 + progress * 16, y: 53, stage: "Scanning vehicle OBD at VERIFY" };
    } else if (t < 22.0) {
      // Moving under Verify to Tool Bench
      const progress = (t - 13.0) / 9.0;
      return { x: 34 + progress * 20, y: 53, stage: "Invoking read_obd tool at BENCH" };
    } else if (t < 29.0) {
      // Passing Tool Bench to Sandbox bay entrance
      const progress = (t - 22.0) / 7.0;
      return { x: 54 + progress * 20, y: 53, stage: "Routing to SANDBOX BAY" };
    } else {
      // Inside Sandbox Bay
      const progress = Math.min(1, (t - 29.0) / 8.4);
      return { x: 74 + progress * 7, y: 53 - progress * 15, stage: "⚠️ FAULT DETECTED: Expected P0420, got P0136" };
    }
  }, [currentTime]);

  return (
    <div className="relative flex-1 h-full w-full bg-[#080808] overflow-hidden flex items-center justify-center p-2 sm:p-4 select-none">
      {/* 16-bit Garage Canvas Container */}
      <div className="relative w-full max-w-[960px] aspect-[794/465] rounded-xl border border-[#2a2a28] shadow-2xl overflow-hidden bg-[#0c0c0b]">
        {/* Pixel Art Garage Scene Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/live-garage/garage-scene.png"
            alt="AgentGarage Live Bay Scene"
            fill
            priority
            sizes="(max-width: 1200px) 100vw, 960px"
            className="object-cover object-center select-none pointer-events-none"
            style={{ imageRendering: "pixelated" }}
          />
        </div>

        {/* Ambient CRT Scanline Overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-[1] opacity-20"
          style={{
            backgroundImage: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.4) 50%)",
            backgroundSize: "100% 4px",
          }}
        />

        {/* Clickable Hotspots for each Station */}
        {STATIONS.map((station) => {
          const isSelected = selectedBay === station.id;
          const isHovered = hoveredStation?.id === station.id;

          return (
            <div
              key={station.id}
              onClick={() => onSelectBay(isSelected ? null : station.id)}
              onMouseEnter={() => setHoveredStation(station)}
              onMouseLeave={() => setHoveredStation(null)}
              style={{
                left: station.x,
                top: station.y,
                width: station.width,
                height: station.height,
              }}
              className={cn(
                "absolute z-10 rounded-lg cursor-pointer transition-all duration-200",
                "border border-transparent",
                // Hover highlight
                "hover:border-dashed hover:border-[#3b76ff]/60 hover:bg-[#3b76ff]/10",
                // Selected highlight
                isSelected && "border-2 border-[#3b76ff] bg-[#3b76ff]/20 shadow-[0_0_25px_rgba(59,118,255,0.4)]",
                // Special failure pulse for Sandbox Bay
                station.id === "sandbox_bay" &&
                  "hover:border-red-500/80 hover:bg-red-500/15"
              )}
            >
              {/* Station Label Badge */}
              <div
                className={cn(
                  "absolute top-2 left-2 rounded px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-tight uppercase transition-all backdrop-blur-sm shadow-md",
                  station.statusColor,
                  isSelected && "ring-2 ring-[#3b76ff]"
                )}
              >
                <span>{station.name}</span>
                <span className="ml-1 opacity-80 text-[8px] font-normal">● {station.status}</span>
              </div>
            </div>
          );
        })}

        {/* Flashing Hazard Alert on Sandbox Bay */}
        <div
          style={{ left: "75%", top: "34%" }}
          className="absolute z-10 pointer-events-none flex items-center gap-1.5 rounded border border-red-500/60 bg-red-950/80 px-2 py-0.5 text-[9px] font-mono font-bold text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse"
        >
          <Flame className="h-3 w-3 text-red-400" />
          <span>FAULT DETECTED / ISOLATED</span>
        </div>

        {/* Unexplored Path Caution Pulse */}
        <div
          style={{ left: "37%", top: "72%" }}
          className="absolute z-10 pointer-events-none flex flex-col items-center justify-center text-center font-mono text-[9px] font-bold text-amber-400"
        >
          <div className="flex items-center gap-1 text-[8.5px] uppercase tracking-wider text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
            <span>HIGH RISK INVESTIGATE</span>
          </div>
        </div>

        {/* Animated mechanic-bot-001 Walking on the Circuit Path */}
        <motion.div
          animate={{
            left: `${botPosition.x}%`,
            top: `${botPosition.y}%`,
          }}
          transition={{ type: "spring", stiffness: 80, damping: 18 }}
          className="absolute z-20 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        >
          {/* Glowing Aura Ring */}
          <div className="absolute inset-0 -m-2 rounded-full bg-[#3b76ff]/30 blur-sm animate-pulse" />

          {/* Sprite Image Container */}
          <div className="relative flex flex-col items-center">
            {/* Thought / Action Bubble */}
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              key={botPosition.stage}
              className={cn(
                "whitespace-nowrap rounded border px-2 py-0.5 text-[9px] font-mono font-bold shadow-xl backdrop-blur-md mb-1",
                currentTime >= 30.2
                  ? "border-red-500/60 bg-[#1c0e0e]/95 text-red-300 shadow-red-500/30"
                  : "border-blue-500/60 bg-[#0c1222]/95 text-blue-300 shadow-blue-500/30"
              )}
            >
              <span>{botPosition.stage}</span>
            </motion.div>

            {/* Robot Sprite */}
            <div className="relative h-10 w-8 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              <Image
                src="/live-garage/robot-sprite.png"
                alt="mechanic-bot-001"
                fill
                className="object-contain"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
          </div>
        </motion.div>

        {/* Top-Right Overhead CRT Terminal Status */}
        <div
          style={{ right: "8%", top: "7%" }}
          className="absolute z-10 pointer-events-none rounded border border-cyan-500/40 bg-cyan-950/80 px-2.5 py-1 text-[8.5px] font-mono text-cyan-300 leading-tight shadow-md backdrop-blur-sm hidden sm:block"
        >
          <div className="font-bold text-cyan-400">DIAGNOSTICS</div>
          <div>&gt; SCAN OK</div>
          <div>&gt; TOOLS OK</div>
          <div className="text-emerald-400">&gt; AGENT ONLINE</div>
        </div>

        {/* Hovered Station Tooltip Card */}
        {hoveredStation && (
          <div className="absolute bottom-3 left-3 z-30 rounded-xl border border-dashed border-[#2a2a28] bg-[#0c0c0b]/95 p-3 shadow-2xl backdrop-blur-md font-mono text-xs max-w-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-[#f3f3f1] uppercase text-[11px]">
                {hoveredStation.name}
              </span>
              <span
                className={cn(
                  "rounded px-1.5 py-0.2 text-[9px] font-bold border",
                  hoveredStation.statusColor
                )}
              >
                {hoveredStation.status}
              </span>
            </div>
            <p className="mt-1 text-[10px] text-[#8f8f8d] leading-relaxed">
              {hoveredStation.description}
            </p>
            <span className="mt-1.5 block text-[9px] text-[#3b76ff]">
              Click to view station telemetry &rarr;
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
