"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Pixel-art sprite UI – pure CSS + robot-sprite.png only. No photos.  */
/* ------------------------------------------------------------------ */

export function MechanicSprite({
  shirt = "#3b76ff",
  cap = "#f59e0b",
  action = "idle",
  flip = false,
  label,
}: {
  shirt?: string;
  cap?: string;
  action?: "typing" | "wrench" | "inspect" | "idle" | "walk";
  flip?: boolean;
  label?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center pointer-events-none select-none",
        flip && "-scale-x-100"
      )}
      style={{ imageRendering: "pixelated" }}
    >
      {label && (
        <div className="mb-0.5 rounded border border-white/20 bg-black/80 px-1 font-mono text-[6px] font-bold leading-none text-white/90 py-0.5 whitespace-nowrap">
          {label}
        </div>
      )}
      <div
        className={cn(
          "relative",
          action === "walk" && "animate-[sprite-bob_0.5s_steps(2)_infinite]",
          action === "idle" && "animate-[sprite-bob_2s_ease-in-out_infinite]",
          action === "inspect" && "animate-[sprite-bob_1.2s_ease-in-out_infinite]"
        )}
        style={{ width: 22, height: 34 }}
      >
        {/* shadow */}
        <div className="absolute bottom-0 left-1/2 h-[4px] w-[18px] -translate-x-1/2 rounded-[50%] bg-black/60 blur-[1px]" />

        {/* legs */}
        <div className="absolute bottom-[4px] left-1/2 flex -translate-x-1/2 gap-[2px]">
          <div
            className={cn(
              "h-[10px] w-[5px] bg-[#2b2b2e] border border-black/60",
              action === "walk" && "animate-[sprite-legL_0.5s_steps(2)_infinite]"
            )}
          />
          <div
            className={cn(
              "h-[10px] w-[5px] bg-[#343437] border border-black/60",
              action === "walk" && "animate-[sprite-legR_0.5s_steps(2)_infinite]"
            )}
          />
        </div>

        {/* torso */}
        <div
          className="absolute bottom-[13px] left-1/2 h-[11px] w-[14px] -translate-x-1/2 border border-black/70"
          style={{ backgroundColor: shirt }}
        >
          {/* hi-vis stripe */}
          <div className="mt-[4px] h-[2px] w-full bg-yellow-300/90" />
          <div className="mt-[1px] h-[1px] w-full bg-black/30" />
        </div>

        {/* arms */}
        {action === "typing" ? (
          <>
            <div className="absolute bottom-[14px] left-[1px] h-[3px] w-[7px] rotate-[-20deg] border border-black/60 bg-[#e8b98a] animate-[sprite-typeL_0.28s_steps(2)_infinite]" />
            <div className="absolute bottom-[14px] right-[1px] h-[3px] w-[7px] rotate-[20deg] border border-black/60 bg-[#e8b98a] animate-[sprite-typeR_0.28s_steps(2)_infinite]" />
          </>
        ) : action === "wrench" ? (
          <>
            <div className="absolute bottom-[15px] left-[0px] h-[3px] w-[6px] border border-black/60 bg-[#e8b98a]" />
            <div className="absolute bottom-[15px] right-[-1px] h-[3px] w-[9px] origin-left border border-black/60 bg-[#e8b98a] animate-[sprite-hammer_0.55s_steps(2)_infinite]">
              <div className="absolute -right-[5px] -top-[3px] h-[6px] w-[5px] border border-black/70 bg-[#9aa0a6]" />
            </div>
          </>
        ) : action === "inspect" ? (
          <>
            <div className="absolute bottom-[15px] left-[1px] h-[3px] w-[6px] border border-black/60 bg-[#e8b98a]" />
            <div className="absolute bottom-[13px] right-[0px] h-[7px] w-[3px] rotate-[20deg] border border-black/60 bg-[#e8b98a]" />
          </>
        ) : (
          <>
            <div
              className={cn(
                "absolute bottom-[14px] left-[0px] h-[8px] w-[4px] border border-black/60 bg-[#e8b98a]",
                action === "walk" && "animate-[sprite-armSwing_0.5s_steps(2)_infinite]"
              )}
            />
            <div
              className={cn(
                "absolute bottom-[14px] right-[0px] h-[8px] w-[4px] border border-black/60 bg-[#e8b98a]",
                action === "walk" && "animate-[sprite-armSwingR_0.5s_steps(2)_infinite]"
              )}
            />
          </>
        )}

        {/* head */}
        <div className="absolute bottom-[24px] left-1/2 h-[8px] w-[10px] -translate-x-1/2 border border-black/70 bg-[#eec39e]">
          {/* eyes */}
          <div className="absolute top-[3px] left-[1px] h-[2px] w-[2px] bg-black" />
          <div className="absolute top-[3px] right-[1px] h-[2px] w-[2px] bg-black animate-[sprite-blink_3.4s_steps(1)_infinite]" />
        </div>
        {/* cap / helmet */}
        <div
          className="absolute bottom-[30px] left-1/2 h-[5px] w-[12px] -translate-x-1/2 border border-black/70"
          style={{ backgroundColor: cap }}
        >
          <div className="mx-auto mt-[1px] h-[1px] w-[8px] bg-white/50" />
        </div>
      </div>
    </div>
  );
}

export function AgentBotSprite({
  time,
  fault,
}: {
  time: number;
  fault: boolean;
}) {
  // bob + tilt while moving, red eye when fault
  return (
    <div className="relative flex flex-col items-center pointer-events-none select-none">
      <div className="rounded border border-blue-500/50 bg-black/85 px-1 py-px font-mono text-[6.5px] font-bold text-blue-300 whitespace-nowrap">
        mechanic-bot-001
      </div>
      <div className="relative mt-0.5 animate-[sprite-botFloat_1.6s_ease-in-out_infinite]">
        <Image
          src="/live-garage/robot-sprite.png"
          alt="mechanic bot"
          width={34}
          height={34}
          className="select-none pointer-events-none"
          style={{ imageRendering: "pixelated" }}
          priority={false}
        />
        {/* live status eye */}
        <div
          className={cn(
            "absolute left-1/2 top-[9px] h-[4px] w-[4px] -translate-x-1/2 rounded-full",
            fault ? "bg-red-500 shadow-[0_0_8px_#ef4444]" : "bg-cyan-300 shadow-[0_0_8px_#22d3ee]"
          )}
          style={{ animation: "sprite-blinkHard 1s steps(2) infinite" }}
        />
        {/* thruster puff */}
        <div className="absolute -bottom-1 left-1/2 h-[5px] w-[10px] -translate-x-1/2 rounded-[50%] bg-sky-400/40 blur-[2px] animate-pulse" />
      </div>
      {/* time chip */}
      <div
        className={cn(
          "mt-0.5 rounded border px-1 py-px font-mono text-[7px] font-bold whitespace-nowrap backdrop-blur-md",
          fault
            ? "border-red-500/60 bg-[#1c0e0e]/95 text-red-300"
            : "border-blue-500/60 bg-[#0c1222]/95 text-blue-300"
        )}
      >
        {fault ? "FAULT: P0420→P0136" : `${time.toFixed(1)}s • ON_ROUTE`}
      </div>
    </div>
  );
}

export function CarIndicatorCluster({
  kind,
  fault,
  time,
}: {
  kind: "verify" | "sandbox" | "eval" | "idle";
  fault: boolean;
  time: number;
}) {
  const blinkFast = Math.floor(time * 2.2) % 2 === 0; // ~2.2Hz hazard
  const blinkSlow = Math.floor(time * 1.1) % 2 === 0;
  const altLeft = Math.floor(time * 1.6) % 2 === 0;

  if (kind === "verify") {
    return (
      <div className="pointer-events-none absolute inset-0 z-[6]">
        {/* headlight beams */}
        <div className="absolute left-[30%] top-[62%] h-[3px] w-[10px] rounded-full bg-yellow-100/90 blur-[1px] animate-[sprite-flicker_2.3s_steps(3)_infinite]" />
        <div className="absolute right-[30%] top-[62%] h-[3px] w-[10px] rounded-full bg-yellow-100/90 blur-[1px] animate-[sprite-flicker_2.3s_steps(3)_infinite]" />
        {/* turn signals alternating */}
        <div
          className={cn(
            "absolute left-[22%] top-[58%] h-[5px] w-[5px] rounded-full border border-black/50",
            altLeft ? "bg-amber-400 shadow-[0_0_10px_#f59e0b]" : "bg-amber-900/60"
          )}
        />
        <div
          className={cn(
            "absolute right-[22%] top-[58%] h-[5px] w-[5px] rounded-full border border-black/50",
            !altLeft ? "bg-amber-400 shadow-[0_0_10px_#f59e0b]" : "bg-amber-900/60"
          )}
        />
        {/* lift working glow */}
        <div className="absolute left-[15%] top-[20%] flex gap-1">
          <span className="h-[6px] w-[2px] bg-sky-400/80 animate-pulse" />
          <span className="h-[6px] w-[2px] bg-sky-400/40 animate-pulse" style={{ animationDelay: "0.4s" }} />
        </div>
      </div>
    );
  }

  if (kind === "sandbox") {
    return (
      <div className="pointer-events-none absolute inset-0 z-[6]">
        {/* brake + hazards when fault */}
        <div
          className={cn(
            "absolute bottom-[18%] left-1/2 h-[4px] w-[56%] -translate-x-1/2 rounded-full blur-[1px] transition-all",
            fault && blinkFast ? "bg-red-600 shadow-[0_0_14px_#ef4444]" : "bg-red-950/70"
          )}
        />
        <div
          className={cn(
            "absolute left-[18%] top-[38%] h-[6px] w-[6px] rounded-full border border-black/60",
            fault && blinkFast ? "bg-amber-400 shadow-[0_0_12px_#f59e0b]" : "bg-zinc-700"
          )}
        />
        <div
          className={cn(
            "absolute right-[18%] top-[38%] h-[6px] w-[6px] rounded-full border border-black/60",
            fault && blinkFast ? "bg-amber-400 shadow-[0_0_12px_#f59e0b]" : "bg-zinc-700"
          )}
        />
        {/* exhaust puffs */}
        {fault && (
          <>
            <div className="absolute bottom-[8%] left-[42%] h-[6px] w-[6px] rounded-full bg-zinc-500/40 blur-[2px] animate-[sprite-smoke_1.8s_ease-out_infinite]" />
            <div className="absolute bottom-[8%] left-[46%] h-[4px] w-[4px] rounded-full bg-zinc-400/30 blur-[2px] animate-[sprite-smoke_1.8s_ease-out_infinite]" style={{ animationDelay: "0.6s" }} />
          </>
        )}
      </div>
    );
  }

  if (kind === "eval") {
    return (
      <div className="pointer-events-none absolute inset-0 z-[6]">
        <div className="absolute left-[24%] top-[6%] flex gap-[3px]">
          <span className={cn("h-[5px] w-[5px] rounded-full", blinkSlow ? "bg-emerald-400 shadow-[0_0_10px_#10b981]" : "bg-emerald-950")} />
          <span className={cn("h-[5px] w-[5px] rounded-full", !blinkSlow ? "bg-emerald-400 shadow-[0_0_10px_#10b981]" : "bg-emerald-950")} />
        </div>
        <div className="absolute left-[30%] top-[30%] h-[8px] w-[40%] bg-gradient-to-b from-yellow-100/25 to-transparent blur-[2px]" />
      </div>
    );
  }

  // idle
  return (
    <div className="pointer-events-none absolute inset-0 z-[6]">
      <div
        className={cn(
          "absolute right-[18%] top-[22%] h-[4px] w-[4px] rounded-full",
          blinkSlow ? "bg-sky-400 shadow-[0_0_8px_#38bdf8]" : "bg-sky-950"
        )}
      />
    </div>
  );
}

export function WeldSparks() {
  return (
    <div className="pointer-events-none absolute z-[7]">
      <div className="relative h-8 w-8">
        <div className="absolute left-1/2 top-1/2 h-[3px] w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-200 shadow-[0_0_10px_#fde047] animate-ping" />
        {[...Array(6)].map((_, i) => (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 h-[2px] w-[2px] rounded-full bg-amber-400"
            style={{
              animation: `sprite-spark 0.7s linear infinite`,
              animationDelay: `${i * 0.11}s`,
              // @ts-expect-error css var
              "--sx": `${Math.cos((i * Math.PI) / 3) * 16}px`,
              "--sy": `${Math.sin((i * Math.PI) / 3) * 14 - 6}px`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function DustMotes() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[3] overflow-hidden">
      {[...Array(10)].map((_, i) => (
        <span
          key={i}
          className="absolute h-[2px] w-[2px] rounded-full bg-white/30"
          style={{
            left: `${8 + i * 9}%`,
            top: `${15 + ((i * 23) % 70)}%`,
            animation: `sprite-dust ${3 + (i % 4)}s ease-in-out infinite`,
            animationDelay: `${i * 0.45}s`,
          }}
        />
      ))}
    </div>
  );
}
