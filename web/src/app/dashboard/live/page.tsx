"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Bell, Warehouse, RotateCcw } from "lucide-react";
import { GarageBayCanvas } from "@/components/live-garage/garage-bay-canvas";
import { TraceInspector } from "@/components/live-garage/trace-inspector";
import { ReplayTimeline } from "@/components/live-garage/replay-timeline";
import { LIVE_TRACE, getStageAtTime } from "@/lib/live-workflow";

const BAY_KEYS = [
  "dispatch",
  "verify",
  "tool_bench",
  "sandbox_bay",
  "eval_gate",
  "idle_agents",
  "unexplored_path",
] as const;

export default function LiveGaragePage() {
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 4>(1);
  const [selectedBay, setSelectedBay] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showBell, setShowBell] = useState(false);

  const duration = LIVE_TRACE.duration;
  const lastTimeRef = useRef<number | null>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  // Autoplay the backend workflow on mount – bot + timeline run together,
  // no spacebar needed. Loops the 37.4s trace.
  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(true);
  }, []);

  // Playback timer loop – single clock drives bot + timeline needle + inspector
  useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = null;
      return;
    }

    let animationFrameId: number;

    const tick = (now: number) => {
      if (lastTimeRef.current !== null) {
        const delta = (now - lastTimeRef.current) / 1000;
        setCurrentTime((prev) => {
          const next = prev + delta * playbackSpeed;
          // Loop the trace so the bot keeps running with the timeline
          if (next >= duration) return 0;
          return next;
        });
      }
      lastTimeRef.current = now;
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, playbackSpeed, duration]);

  const handleSeek = useCallback((time: number) => {
    setCurrentTime(Math.max(0, Math.min(duration, time)));
  }, [duration]);

  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      if (!prev && currentTime >= duration) {
        setCurrentTime(0);
      }
      return !prev;
    });
  }, [currentTime, duration]);

  const handleReset = useCallback(() => {
    setCurrentTime(0);
    setIsPlaying(true);
  }, []);

  const handleFullscreen = useCallback(() => {
    const el = shellRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      el.requestFullscreen?.().catch(() => {});
    }
  }, []);

  // Space to play/pause, arrows to seek – full keyboard control
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "Space") {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key === "ArrowRight") {
        handleSeek(currentTime + 1);
      } else if (e.key === "ArrowLeft") {
        handleSeek(currentTime - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleTogglePlay, handleSeek, currentTime]);

  // Search bays/agents/telemetry – Enter jumps the bot clock to that bay
  const handleSearchSubmit = useCallback(() => {
    const q = query.trim().toLowerCase();
    if (!q) return;
    const match = BAY_KEYS.find(
      (b) => b.includes(q) || q.includes(b.replace("_", " ")) || q.includes(b.replace("_", ""))
    );
    const stageMap: Record<string, number> = {
      dispatch: 2,
      verify: 8,
      tool_bench: 16,
      eval_gate: 24,
      sandbox_bay: 31,
      idle_agents: 1,
      unexplored_path: 18,
    };
    if (match) {
      setSelectedBay(match);
      handleSeek(stageMap[match] ?? 0);
      setIsPlaying(true);
    } else if (q.includes("fault") || q.includes("p0136") || q.includes("p0420")) {
      handleSeek(LIVE_TRACE.errorAt);
    } else if (q.includes("mechanic") || q.includes("bot")) {
      setIsPlaying(true);
    }
  }, [query, handleSeek]);

  const stage = getStageAtTime(currentTime);

  return (
    <div ref={shellRef} className="-m-6 lg:-m-8 flex flex-col h-[calc(100vh-3.5rem)] bg-[#080808] text-[#f3f3f1] overflow-hidden select-none font-sans">
      {/* Top Status & Search Strip */}
      <header className="flex h-11 items-center justify-between border-b border-[#2a2a28] bg-[#0c0c0b] px-4 shrink-0 text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="text-[#f3f3f1] flex items-center gap-2 font-bold">
            <Warehouse className="h-4 w-4 text-[#3b76ff]" />
            <span>/ Live Garage</span>
          </span>
          <div className="flex items-center gap-2 rounded-full border border-dashed border-[#2a2a28] bg-[#141413] px-2.5 py-0.5 text-[11px] text-[#8f8f8d]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-medium">Garage Online</span>
            <span className="text-[#2a2a28]">|</span>
            <span>{LIVE_TRACE.version}</span>
            <span className="text-[#2a2a28]">|</span>
            <span>prod</span>
            <span className="text-[#2a2a28]">|</span>
            <span>us-east-1</span>
            {stage && (
              <>
                <span className="text-[#2a2a28]">|</span>
                <span className="text-[#3b76ff] font-bold">
                  {stage.label} • {currentTime.toFixed(1)}s
                </span>
              </>
            )}
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-1 rounded-lg border border-dashed border-[#2a2a28] bg-[#141413] px-2 py-1 text-[10px] text-[#8f8f8d] hover:text-white hover:border-[#3b76ff] transition-colors"
            title="Restart replay from 0s"
          >
            <RotateCcw className="h-3 w-3" />
            Replay
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Global Search Bar with ⌘ K */}
          <div className="relative hidden md:flex items-center">
            <Search className="absolute left-2.5 h-3.5 w-3.5 text-[#8f8f8d]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearchSubmit();
              }}
              placeholder="Search bays, agents, telemetry... [⌘K]"
              className="h-7 w-64 lg:w-80 rounded-lg border border-dashed border-[#2a2a28] bg-[#141413] pl-8 pr-12 text-[11px] font-mono text-[#f3f3f1] placeholder:text-[#8f8f8d] focus:border-[#3b76ff] focus:outline-none"
            />
            <span className="absolute right-2 rounded border border-[#2a2a28] bg-[#1a1a18] px-1.5 py-0.5 text-[9px] font-mono text-[#8f8f8d]">
              ⌘ K
            </span>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowBell((v) => !v)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-dashed border-[#2a2a28] bg-[#141413] text-[#8f8f8d] hover:text-[#f3f3f1] transition-colors"
              title="Notifications"
            >
              <Bell className="h-3.5 w-3.5" />
              {currentTime >= LIVE_TRACE.errorAt && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 border border-black animate-pulse" />
              )}
            </button>
            {showBell && (
              <div className="absolute right-0 top-9 z-50 w-72 rounded-xl border border-[#2a2a28] bg-[#141413] p-3 shadow-2xl font-mono text-[11px]">
                <div className="font-bold text-white mb-2">Garage alerts</div>
                <div className="space-y-2">
                  <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-2 text-red-300">
                    FAULT DETECTED: Expected {LIVE_TRACE.expected}, got {LIVE_TRACE.emitted} at {LIVE_TRACE.errorAt}s
                  </div>
                  <div className="rounded-lg border border-[#2a2a28] bg-[#0c0c0b] p-2 text-zinc-400">
                    Eval Gate running • confidence 0.12
                  </div>
                </div>
              </div>
            )}
          </div>

          <div
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[#3b76ff]/20 text-[#3b76ff] border border-[#3b76ff]/40 text-xs font-mono font-bold"
            title="User Account"
          >
            U
          </div>
        </div>
      </header>

      {/* 2-Column Workspace Matching Reference Design */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column: Garage Bay Canvas (Top) + Replay Timeline (Bottom) */}
        <div className="flex flex-col flex-1 overflow-hidden border-r border-[#2a2a28]">
          {/* Main Garage Bay Floor */}
          <div className="flex-1 overflow-hidden relative flex items-center justify-center bg-[#080808]">
            <GarageBayCanvas
              currentTime={currentTime}
              selectedBay={selectedBay}
              onSelectBay={setSelectedBay}
              playing={isPlaying}
            />
          </div>

          {/* Replay Timeline directly beneath the Garage */}
          <ReplayTimeline
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            playbackSpeed={playbackSpeed}
            onSeek={handleSeek}
            onTogglePlay={handleTogglePlay}
            onChangeSpeed={setPlaybackSpeed}
            onFullscreen={handleFullscreen}
            onReset={handleReset}
          />
        </div>

        {/* Right Column: Full-Height Trace Inspector */}
        <TraceInspector
          selectedBay={selectedBay}
          onSelectBay={setSelectedBay}
          currentTime={currentTime}
        />
      </div>
    </div>
  );
}
