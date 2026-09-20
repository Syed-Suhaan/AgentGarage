"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Bell, Warehouse, Sparkles, Activity } from "lucide-react";
import { GarageBayCanvas } from "@/components/live-garage/garage-bay-canvas";
import { TraceInspector } from "@/components/live-garage/trace-inspector";
import { ReplayTimeline } from "@/components/live-garage/replay-timeline";

export default function LiveGaragePage() {
  const [currentTime, setCurrentTime] = useState<number>(30.2);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 4>(1);
  const [selectedBay, setSelectedBay] = useState<string | null>(null);

  const duration = 37.4;
  const lastTimeRef = useRef<number | null>(null);

  // Playback timer loop
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
          if (next >= duration) {
            setIsPlaying(false);
            return duration;
          }
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

  return (
    <div className="-m-6 lg:-m-8 flex flex-col h-[calc(100vh-3.5rem)] bg-[#080808] text-[#f3f3f1] overflow-hidden select-none font-sans">
      {/* Top Status & Search Strip */}
      <header className="flex h-11 items-center justify-between border-b border-[#2a2a28] bg-[#0c0c0b] px-4 shrink-0 text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="text-[#8f8f8d] flex items-center gap-1.5 font-bold">
            <Warehouse className="h-3.5 w-3.5 text-[#3b76ff]" />
            <span>/ Live Garage</span>
          </span>
          <div className="flex items-center gap-2 rounded-full border border-dashed border-[#2a2a28] bg-[#141413] px-2.5 py-0.5 text-[11px] text-[#8f8f8d]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-medium">Garage Online</span>
            <span className="text-[#2a2a28]">|</span>
            <span>v1.8.2</span>
            <span className="text-[#2a2a28]">|</span>
            <span>prod</span>
            <span className="text-[#2a2a28]">|</span>
            <span>us-east-1</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Global Search Bar with ⌘ K */}
          <div className="relative hidden md:flex items-center">
            <Search className="absolute left-2.5 h-3.5 w-3.5 text-[#8f8f8d]" />
            <input
              type="text"
              placeholder="Search bays, agents, telemetry... [⌘K]"
              className="h-7 w-64 lg:w-80 rounded-lg border border-dashed border-[#2a2a28] bg-[#141413] pl-8 pr-12 text-[11px] font-mono text-[#f3f3f1] placeholder:text-[#8f8f8d] focus:border-[#3b76ff] focus:outline-none"
            />
            <span className="absolute right-2 rounded border border-[#2a2a28] bg-[#1a1a18] px-1.5 py-0.5 text-[9px] font-mono text-[#8f8f8d]">
              ⌘ K
            </span>
          </div>

          <button
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-dashed border-[#2a2a28] bg-[#141413] text-[#8f8f8d] hover:text-[#f3f3f1] transition-colors"
            title="Notifications"
          >
            <Bell className="h-3.5 w-3.5" />
          </button>

          <div
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[#3b76ff]/20 text-[#3b76ff] border border-[#3b76ff]/40 text-xs font-mono font-bold"
            title="User Account"
          >
            U
          </div>
        </div>
      </header>

      {/* Main Center Area: Sprite Bay Floor (Left) + Trace Inspector (Right) */}
      <div className="flex flex-1 overflow-hidden relative">
        <GarageBayCanvas
          currentTime={currentTime}
          selectedBay={selectedBay}
          onSelectBay={setSelectedBay}
        />

        <TraceInspector
          selectedBay={selectedBay}
          onSelectBay={setSelectedBay}
          currentTime={currentTime}
        />
      </div>

      {/* Bottom Replay Timeline Scrubber */}
      <ReplayTimeline
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying}
        playbackSpeed={playbackSpeed}
        onSeek={handleSeek}
        onTogglePlay={handleTogglePlay}
        onChangeSpeed={setPlaybackSpeed}
      />
    </div>
  );
}
