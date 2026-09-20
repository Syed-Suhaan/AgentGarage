"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  MechanicSprite,
  AgentBotSprite,
  CarIndicatorCluster,
  WeldSparks,
  DustMotes,
} from "./sprites";
import {
  LIVE_TRACE,
  WORKFLOW_STAGES,
  getStageAtTime,
  getBotPosAt,
  getCrtLogsAt,
  isFaultActiveAt,
} from "@/lib/live-workflow";

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
  timeRange: [number, number];
}

const STATIONS: StationInfo[] = [
  {
    id: "dispatch",
    name: "Dispatch Station",
    code: "BAY_01",
    status: "ONLINE",
    description: "Initial task intake & NLU parser. Dispatched task 'diagnose_vehicle'.",
    rect: { left: "4.5%", top: "14%", width: "19.5%", height: "35%" },
    timeRange: [WORKFLOW_STAGES[0].start, WORKFLOW_STAGES[0].end],
  },
  {
    id: "verify",
    name: "Verify Hoist",
    code: "BAY_02",
    status: "PASS",
    description: "Hydraulic hoist station. OBD-II communication protocol verified on Sedan #42.",
    rect: { left: "26.5%", top: "14%", width: "18.5%", height: "35%" },
    timeRange: [WORKFLOW_STAGES[1].start, WORKFLOW_STAGES[1].end],
  },
  {
    id: "tool_bench",
    name: "Tool Bench",
    code: "BAY_03",
    status: "ACTIVE",
    description: "Diagnostic instrumentation bench. read_obd tool executed to poll DTC registers.",
    rect: { left: "51%", top: "14%", width: "19%", height: "35%" },
    timeRange: [WORKFLOW_STAGES[2].start, WORKFLOW_STAGES[2].end],
  },
  {
    id: "sandbox_bay",
    name: "Sandbox Bay",
    code: "BAY_04",
    status: "FAIL",
    description: "Isolated fault containment chamber. Injected synthetic sensor delay; agent suggested wrong code.",
    rect: { left: "73%", top: "12%", width: "24%", height: "39%" },
    timeRange: [WORKFLOW_STAGES[4].start, WORKFLOW_STAGES[4].end],
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
    timeRange: [WORKFLOW_STAGES[3].start, WORKFLOW_STAGES[3].end],
  },
];

export function GarageBayCanvas({
  currentTime,
  selectedBay,
  onSelectBay,
}: GarageBayCanvasProps) {
  const [hoveredBay, setHoveredBay] = useState<StationInfo | null>(null);

  const activeStation = useMemo(() => {
    const stage = getStageAtTime(currentTime);
    if (!stage) return undefined;
    return STATIONS.find((s) => s.id === stage.id);
  }, [currentTime]);

  const crtLogs = useMemo(() => getCrtLogsAt(currentTime), [currentTime]);

  const isFaultActive = isFaultActiveAt(currentTime);
  const botPos = useMemo(() => getBotPosAt(currentTime), [currentTime]);
  const activeStage = useMemo(() => getStageAtTime(currentTime), [currentTime]);

  // idle wanderer oscillates
  const wanderLeft = 15 + Math.sin(currentTime * 0.7) * 2.2;

  return (
    <div className="relative flex-1 h-full w-full bg-[#080808] flex items-center justify-center p-3 select-none overflow-hidden">
      <div className="relative w-full max-w-[880px] aspect-[794/465] rounded-xl border border-[#222220] shadow-2xl overflow-hidden bg-[#0a0a09]">
        {/* Base floor */}
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

        {/* Scanlines + vignette */}
        <div
          className="absolute inset-0 pointer-events-none z-[2] opacity-15"
          style={{
            backgroundImage: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.5) 50%)",
            backgroundSize: "100% 4px",
          }}
        />
        <div className="absolute inset-0 pointer-events-none z-[2] shadow-[inset_0_0_80px_rgba(0,0,0,0.65)]" />

        {/* Lamp glows */}
        <div className="absolute top-0 left-[12%] w-28 h-20 bg-blue-400/5 blur-2xl pointer-events-none z-[1]" />
        <div className="absolute top-0 left-[48%] w-32 h-20 bg-blue-400/5 blur-2xl pointer-events-none z-[1]" />
        <div className="absolute top-0 right-[15%] w-32 h-24 bg-red-500/10 blur-2xl pointer-events-none z-[1]" />

        <DustMotes />

        {/* CRT monitor */}
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

        {/* Fault strobes */}
        {isFaultActive && (
          <>
            <div
              style={{ left: "91.8%", top: "24.5%" }}
              className="absolute z-10 w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_15px_#ef4444,0_0_30px_#ef4444] animate-ping pointer-events-none"
            />
            <div
              style={{ left: "74%", top: "14%", width: "22%", height: "35%" }}
              className="absolute z-[3] bg-red-500/10 rounded-lg pointer-events-none animate-pulse border border-red-500/30"
            />
          </>
        )}

        {/* Amber beacon */}
        <div
          style={{ left: "46.3%", top: "64%" }}
          className="absolute z-10 w-3 h-3 rounded-full bg-amber-400/80 shadow-[0_0_12px_#f59e0b,0_0_24px_#f59e0b] animate-pulse pointer-events-none"
        />
        {/* rotating beacon sweep */}
        <div
          style={{ left: "45.2%", top: "62.2%", width: "28px", height: "28px" }}
          className="absolute z-[4] pointer-events-none rounded-full border border-amber-400/30 animate-[sprite-beaconSpin_2.4s_linear_infinite]"
        />

        {/* Photon circuit */}
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
          <path
            d="M 148 152 L 205 152 L 205 250 L 468 250 L 468 190 L 530 190"
            fill="none"
            stroke="url(#circuit-pulse)"
            strokeWidth="3"
            strokeDasharray="16 120"
            className="animate-pulse"
          />
          <circle r="3.5" fill="#7dd3fc">
            <animateMotion dur="6s" repeatCount="indefinite" path="M 148 152 L 205 152 L 205 250 L 468 250 L 468 190 L 530 190" />
          </circle>
        </svg>

        {/* ============ CAR LIGHT CLUSTERS (blinking indicators) ============ */}
        {/* Verify white sedan */}
        <div style={{ left: "27%", top: "18%", width: "17%", height: "26%" }} className="absolute z-[6]">
          <CarIndicatorCluster kind="verify" fault={isFaultActive} time={currentTime} />
        </div>
        {/* Sandbox red car */}
        <div style={{ left: "74.5%", top: "22%", width: "21%", height: "24%" }} className="absolute z-[6]">
          <CarIndicatorCluster kind="sandbox" fault={isFaultActive} time={currentTime} />
        </div>
        {/* Eval black car */}
        <div style={{ left: "67%", top: "59%", width: "19%", height: "28%" }} className="absolute z-[6]">
          <CarIndicatorCluster kind="eval" fault={isFaultActive} time={currentTime} />
        </div>
        {/* Idle lot */}
        <div style={{ left: "3%", top: "59%", width: "22%", height: "32%" }} className="absolute z-[6]">
          <CarIndicatorCluster kind="idle" fault={isFaultActive} time={currentTime} />
        </div>

        {/* ============ SPRITE CREW – pixel humans only ============ */}
        {/* Dispatch operator – typing at desk */}
        <div style={{ left: "11.5%", top: "27.5%" }} className="absolute z-[7]">
          <MechanicSprite shirt="#2f6fed" cap="#38bdf8" action="typing" label="DISPATCH_OP" />
          {/* monitor flicker */}
          <div className="absolute -top-2 left-3 h-[6px] w-[10px] bg-sky-300/70 blur-[1px] animate-[sprite-flicker_1.7s_steps(2)_infinite]" />
        </div>

        {/* Verify crouch mechanic at front wheel */}
        <div style={{ left: "38.2%", top: "37.5%" }} className="absolute z-[7] scale-90">
          <MechanicSprite shirt="#ef4444" cap="#18181b" action="inspect" flip label="VERIFY_TECH" />
        </div>

        {/* Tool bench worker – hammering + sparks */}
        <div style={{ left: "58.8%", top: "33.5%" }} className="absolute z-[7]">
          <MechanicSprite shirt="#f59e0b" cap="#78350a" action="wrench" label="TOOLSMITH" />
        </div>
        <div style={{ left: "61.2%", top: "35.5%" }} className="absolute z-[7]">
          <WeldSparks />
        </div>
        {/* bench task lamp */}
        <div className="absolute z-[6] h-[8px] w-[8px] rounded-full bg-amber-200/80 blur-[3px] animate-[sprite-flicker_3s_steps(3)_infinite]" style={{ left: "60.5%", top: "30%" }} />

        {/* Eval inspector with clipboard */}
        <div style={{ left: "83.5%", top: "66%" }} className="absolute z-[7] scale-90">
          <MechanicSprite shirt="#10b981" cap="#064e3b" action="idle" label="EVAL_AUDIT" />
        </div>
        {/* eval scanner sweep */}
        <div style={{ left: "70%", top: "71%", width: "12%", height: "6px" }} className="absolute z-[6] overflow-hidden rounded bg-emerald-400/10">
          <div className="h-full w-1/3 bg-emerald-300/70 blur-[1px] animate-[sprite-sweep_2.8s_linear_infinite]" />
        </div>

        {/* Idle wanderer + forklift nudge */}
        <div style={{ left: `${wanderLeft}%`, top: "72%" }} className="absolute z-[7] scale-90">
          <MechanicSprite shirt="#8b5cf6" cap="#1e1b4b" action="walk" label="STANDBY" />
        </div>
        <div style={{ left: "29%", top: "60%" }} className="absolute z-[6] animate-[sprite-forklift_3.2s_ease-in-out_infinite]">
          <div className="h-[3px] w-[14px] rounded-full bg-amber-400/70 blur-[1px]" />
        </div>

        {/* Main agent bot – single live bot, driven by backend workflow timeline.
            Position = getBotPosAt(currentTime) synced to WORKFLOW_STAGES.
            Baked-in PNG bot is erased above, so this is the ONLY center bot. */}
        <div
          style={{ left: botPos.left, top: botPos.top }}
          className="absolute z-[8] -translate-x-1/2 -translate-y-full transition-[left,top] duration-300 ease-linear"
          data-stage={botPos.stageId}
          data-time={currentTime.toFixed(1)}
        >
          <AgentBotSprite time={currentTime} fault={isFaultActive} />
          {/* target ring */}
          <div className="absolute -bottom-2 left-1/2 h-6 w-6 -translate-x-1/2 rounded-full border border-dashed border-sky-400/50 animate-spin" style={{ animationDuration: "6s" }} />
          {/* workflow stage chip */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/20 bg-black/85 px-1.5 py-px font-mono text-[6.5px] font-bold uppercase tracking-wider text-white/90">
            {activeStage ? `${activeStage.label} • ${activeStage.action}` : "standby"}
          </div>
        </div>

        {/* Station hotspots */}
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
                "absolute z-10 cursor-pointer transition-all duration-200 rounded-md",
                isHovered && "bg-white/[0.03] ring-1 ring-white/20",
                isSelected && "bg-[#3b76ff]/10 ring-2 ring-[#3b76ff] shadow-[0_0_20px_rgba(59,118,255,0.3)]",
                isActive && !isSelected && "ring-1 ring-[#3b76ff]/50 bg-[#3b76ff]/5"
              )}
            >
              {(isHovered || isSelected || isActive) && (
                <div className="absolute inset-0 pointer-events-none">
                  <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#3b76ff]" />
                  <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[#3b76ff]" />
                  <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-[#3b76ff]" />
                  <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#3b76ff]" />
                  <span className="absolute -top-3 right-1 font-mono text-[8px] font-bold text-[#3b76ff] bg-[#0c0c0b] px-1 border border-[#3b76ff]/40 rounded shadow-sm">
                    {station.code}
                  </span>
                  {/* live dot */}
                  <span className="absolute -top-1.5 left-1 flex items-center gap-1 rounded-full bg-black/80 px-1 py-px font-mono text-[6px] text-emerald-300 border border-emerald-500/40">
                    <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </span>
                </div>
              )}
            </div>
          );
        })}

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
