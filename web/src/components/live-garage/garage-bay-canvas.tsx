"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface GarageBayCanvasProps {
  currentTime: number;
  selectedBay: string | null;
  onSelectBay: (bay: string | null) => void;
}

interface StationInfo {
  id: string;
  name: string;
  code: string;
  status: "ONLINE" | "PASS" | "ACTIVE" | "FAIL" | "WARNING" | "STANDBY";
  description: string;
  rect: { left: string; top: string; width: string; height: string };
  timeRange: [number, number]; // [start, end] in seconds
}

const STATIONS: StationInfo[] = [
  {
    id: "dispatch",
    name: "Dispatch Station",
    code: "BAY_01",
    status: "ONLINE",
    description: "Initial task intake & NLU parser. Dispatched task 'diagnose_vehicle'.",
    rect: { left: "4.5%", top: "14%", width: "19.5%", height: "35%" },
    timeRange: [0, 6.0],
  },
  {
    id: "verify",
    name: "Verify Hoist",
    code: "BAY_02",
    status: "PASS",
    description: "Hydraulic hoist station. OBD-II communication protocol verified on Sedan #42.",
    rect: { left: "26.5%", top: "14%", width: "18.5%", height: "35%" },
    timeRange: [6.0, 13.0],
  },
  {
    id: "tool_bench",
    name: "Tool Bench",
    code: "BAY_03",
    status: "ACTIVE",
    description: "Diagnostic instrumentation bench. read_obd tool executed to poll DTC registers.",
    rect: { left: "51%", top: "14%", width: "19%", height: "35%" },
    timeRange: [13.0, 22.0],
  },
  {
    id: "sandbox_bay",
    name: "Sandbox Bay",
    code: "BAY_04",
    status: "FAIL",
    description: "Isolated fault containment chamber. Injected synthetic sensor delay; agent suggested wrong code.",
    rect: { left: "73%", top: "12%", width: "24%", height: "39%" },
    timeRange: [29.0, 37.4],
  },
  {
    id: "idle_agents",
    name: "Idle Agents / Parking",
    code: "BAY_00",
    status: "STANDBY",
    description: "Fleet parking & staging zone. 3 backup mechanic-bots available on standby.",
    rect: { left: "2%", top: "56%", width: "24%", height: "40%" },
    timeRange: [0, 0],
  },
  {
    id: "unexplored_path",
    name: "Unexplored Path",
    code: "HAZARD_01",
    status: "WARNING",
    description: "High-risk unhedged trajectory. Untested fault condition flagged for automated sandbox eval.",
    rect: { left: "34%", top: "56%", width: "25%", height: "38%" },
    timeRange: [0, 0],
  },
  {
    id: "eval_gate",
    name: "Eval Gate",
    code: "GATE_01",
    status: "ACTIVE",
    description: "Automated regression verification gate. Checkpoint score: 0.12 (FAIL against benchmark P0420).",
    rect: { left: "66%", top: "56%", width: "21%", height: "38%" },
    timeRange: [22.0, 29.0],
  },
];

export function GarageBayCanvas({
  currentTime,
  selectedBay,
  onSelectBay,
}: GarageBayCanvasProps) {
  const [hoveredBay, setHoveredBay] = useState<StationInfo | null>(null);

  // Active station based on current timeline time
  const activeStation = useMemo(() => {
    return STATIONS.find(
      (s) => currentTime >= s.timeRange[0] && currentTime < s.timeRange[1]
    );
  }, [currentTime]);

  // Live CRT monitor text based on currentTime
  const crtLogs = useMemo(() => {
    if (currentTime < 6.0) {
      return [
        "DIAG [v1.8.2]",
        "> AGENT: mechanic-bot",
        "> INTAKE: vehicle_diag",
        "> DISPATCH: ONLINE",
      ];
    } else if (currentTime < 13.0) {
      return [
        "DIAG [v1.8.2]",
        "> PORT: ISO_15765_4",
        "> CAN_BUS: 500kbps",
        "> LINK: VERIFY OK",
      ];
    } else if (currentTime < 22.0) {
      return [
        "DIAG [v1.8.2]",
        "> TOOL: read_obd",
        "> REG: 0x43 0x02",
        "> DTC: P0136 / B1000",
      ];
    } else if (currentTime < 29.0) {
      return [
        "DIAG [v1.8.2]",
        "> EVAL GATE: RUNNING",
        "> BENCHMARK: P0420",
        "> CONFIDENCE: 0.12",
      ];
    } else {
      return [
        "DIAG [v1.8.2]",
        "> [!] FAULT ISOLATED",
        "> EXPECTED: P0420",
        "> EMITTED:  P0136 [FAIL]",
      ];
    }
  }, [currentTime]);

  const isFaultActive = currentTime >= 29.5;

  return (
    <div className="relative flex-1 h-full w-full bg-[#080808] flex items-center justify-center p-3 select-none overflow-hidden">
      {/* 16-Bit Garage Container with Exact Aspect Ratio (794x465) */}
      <div className="relative w-full max-w-[880px] aspect-[794/465] rounded-xl border border-[#222220] shadow-2xl overflow-hidden bg-[#0a0a09]">
        {/* Crisp Base Garage Floor Pixel Art */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/live-garage/garage-scene.png"
            alt="Live Agent Garage Floor"
            fill
            priority
            sizes="(max-width: 1200px) 100vw, 880px"
            className="object-contain object-center select-none pointer-events-none"
            style={{ imageRendering: "pixelated" }}
          />
        </div>

        {/* Ambient CRT Scanline Overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-[2] opacity-15"
          style={{
            backgroundImage: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.5) 50%)",
            backgroundSize: "100% 4px",
          }}
        />

        {/* Dynamic Overhead Fluorescent Lamp Glows */}
        <div className="absolute top-0 left-[12%] w-28 h-20 bg-blue-400/5 blur-2xl pointer-events-none z-[1]" />
        <div className="absolute top-0 left-[48%] w-32 h-20 bg-blue-400/5 blur-2xl pointer-events-none z-[1]" />
        <div className="absolute top-0 right-[15%] w-32 h-24 bg-red-500/10 blur-2xl pointer-events-none z-[1]" />

        {/* Live CRT Diagnostic Screen Overlay (Top-Right) */}
        <div
          style={{ left: "80.4%", top: "7.8%", width: "11.8%", height: "12.2%" }}
          className="absolute z-10 pointer-events-none bg-[#031518]/90 border border-cyan-500/40 rounded p-1 font-mono text-[7px] sm:text-[8px] leading-[1.2] text-cyan-300 shadow-inner flex flex-col justify-between overflow-hidden"
        >
          <div className="space-y-0.5">
            {crtLogs.map((line, idx) => (
              <div
                key={idx}
                className={cn(
                  "truncate font-bold tracking-tight",
                  line.includes("[!]") || line.includes("[FAIL]")
                    ? "text-red-400 animate-pulse"
                    : idx === 0
                    ? "text-cyan-400"
                    : "text-emerald-400"
                )}
              >
                {line}
              </div>
            ))}
          </div>
          <div className="text-[6px] text-cyan-500/80 flex items-center justify-between border-t border-cyan-800/40 pt-0.5">
            <span>LIVE</span>
            <span className="animate-pulse">_</span>
          </div>
        </div>

        {/* Dynamic Red Flashing Strobe on Sandbox Bay Beacon Light */}
        {isFaultActive && (
          <>
            {/* Flashing Red Beacon Point */}
            <div
              style={{ left: "91.8%", top: "24.5%" }}
              className="absolute z-10 w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_15px_#ef4444,0_0_30px_#ef4444] animate-ping pointer-events-none"
            />
            {/* Red Atmospheric Room Glow */}
            <div
              style={{ left: "74%", top: "14%", width: "22%", height: "35%" }}
              className="absolute z-[3] bg-red-500/10 rounded-lg pointer-events-none animate-pulse border border-red-500/30"
            />
          </>
        )}

        {/* Dynamic Amber Caution Pulse on Unexplored Path */}
        <div
          style={{ left: "46.3%", top: "64%" }}
          className="absolute z-10 w-3 h-3 rounded-full bg-amber-400/80 shadow-[0_0_12px_#f59e0b,0_0_24px_#f59e0b] animate-pulse pointer-events-none"
        />

        {/* Live Photon Pulses along the Blue Circuit Line */}
        <svg
          viewBox="0 0 794 465"
          className="absolute inset-0 w-full h-full pointer-events-none z-[4] overflow-visible"
        >
          <defs>
            <linearGradient id="circuit-pulse" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
              <stop offset="50%" stopColor="#60a5fa" stopOpacity="1" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Path matching the blue circuit on the floor */}
          <path
            d="M 148 152 L 205 152 L 205 250 L 468 250 L 468 190 L 530 190"
            fill="none"
            stroke="url(#circuit-pulse)"
            strokeWidth="3"
            strokeDasharray="16 120"
            className="animate-pulse"
          />
        </svg>

        {/* Interactive Station Hotspots */}
        {STATIONS.map((station) => {
          const isSelected = selectedBay === station.id;
          const isActive = activeStation?.id === station.id;
          const isHovered = hoveredBay?.id === station.id;

          return (
            <div
              key={station.id}
              onClick={() => onSelectBay(isSelected ? null : station.id)}
              onMouseEnter={() => setHoveredBay(station)}
              onMouseLeave={() => setHoveredBay(null)}
              style={{
                left: station.rect.left,
                top: station.rect.top,
                width: station.rect.width,
                height: station.rect.height,
              }}
              className={cn(
                "absolute z-10 cursor-pointer transition-all duration-200 group",
                // Subtle HUD reticle corners
                "rounded-md",
                isHovered && "bg-white/[0.03] ring-1 ring-white/20",
                isSelected && "bg-[#3b76ff]/10 ring-2 ring-[#3b76ff] shadow-[0_0_20px_rgba(59,118,255,0.3)]",
                isActive && !isSelected && "ring-1 ring-[#3b76ff]/50 bg-[#3b76ff]/5"
              )}
            >
              {/* Sleek Corner Brackets (Only visible when hovered or selected or active) */}
              {(isHovered || isSelected || isActive) && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Top-Left */}
                  <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#3b76ff]" />
                  {/* Top-Right */}
                  <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[#3b76ff]" />
                  {/* Bottom-Left */}
                  <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-[#3b76ff]" />
                  {/* Bottom-Right */}
                  <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#3b76ff]" />
                  {/* Station Code Identifier */}
                  <span className="absolute -top-3 right-1 font-mono text-[8px] font-bold text-[#3b76ff] bg-[#0c0c0b] px-1 border border-[#3b76ff]/40 rounded shadow-sm">
                    {station.code}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* Active Bot HUD Halo */}
        <div
          style={{ left: "48.2%", top: "54%" }}
          className="absolute z-[5] -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center"
        >
          {/* Subtle Cybernetic Floor Target Indicator */}
          <div className="h-9 w-9 rounded-full border border-blue-400/40 border-dashed animate-spin duration-10000" />

          {/* Thought / Telemetry Banner */}
          <div
            className={cn(
              "absolute -top-5 rounded px-2 py-0.5 text-[8.5px] font-mono font-bold whitespace-nowrap shadow-lg backdrop-blur-md transition-all border",
              isFaultActive
                ? "bg-[#1c0e0e]/95 text-red-300 border-red-500/60 shadow-red-950/50"
                : "bg-[#0c1222]/95 text-blue-300 border-blue-500/60 shadow-blue-950/50"
            )}
          >
            {isFaultActive
              ? "FAULT DETECTED: Expected P0420, got P0136"
              : `mechanic-bot-001 [${currentTime.toFixed(1)}s]`}
          </div>
        </div>

        {/* Ambient Station Telemetry Strip (Bottom-Left Corner) */}
        {hoveredBay && (
          <div className="absolute bottom-2 left-2 z-20 rounded border border-dashed border-[#2a2a28] bg-[#0c0c0b]/95 px-2.5 py-1.5 font-mono text-[10px] text-[#f3f3f1] shadow-xl backdrop-blur-md max-w-[260px]">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-[#3b76ff]">{hoveredBay.name}</span>
              <span className="text-[9px] text-[#8f8f8d]">[{hoveredBay.code}]</span>
            </div>
            <p className="mt-0.5 text-[9px] text-[#8f8f8d] line-clamp-2 leading-relaxed">
              {hoveredBay.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
