"use client";

import { useRef, useCallback, MouseEvent } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Settings,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TIMELINE_TRACKS, LIVE_TRACE } from "@/lib/live-workflow";

interface ReplayTimelineProps {
  currentTime: number;
  duration?: number;
  isPlaying: boolean;
  playbackSpeed: 1 | 2 | 4;
  onSeek: (time: number) => void;
  onTogglePlay: () => void;
  onChangeSpeed: (speed: 1 | 2 | 4) => void;
  onFullscreen?: () => void;
  onReset?: () => void;
}

export function ReplayTimeline({
  currentTime,
  duration = LIVE_TRACE.duration,
  isPlaying,
  playbackSpeed,
  onSeek,
  onTogglePlay,
  onChangeSpeed,
  onFullscreen,
  onReset,
}: ReplayTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);

  const handleTimelineClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, clickX / rect.width));
      onSeek(percentage * duration);
    },
    [duration, onSeek]
  );

  const currentPercent = Math.max(0, Math.min(100, (currentTime / duration) * 100));

  // Ticks every 5 seconds
  const ticks = [0, 5, 10, 15, 20, 25, 30, 35, 40];

  return (
    <div className="border-t border-[#2a2a28] bg-[#0c0c0b] px-4 py-2.5 text-xs font-mono select-none z-10 shrink-0">
      {/* Timeline Header Row */}
      <div className="flex items-center justify-between pb-2 border-b border-[#1f1f1d] text-[#8f8f8d]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[#f3f3f1] font-semibold text-[11px]">
            <Settings className="h-3.5 w-3.5 text-zinc-400" />
            <span>Replay Timeline</span>
          </div>
          <span className="text-[#2a2a28]">|</span>
          <span className="text-[11px] hidden sm:inline">
            Task: <span className="text-[#f3f3f1]">{LIVE_TRACE.task}</span>
          </span>
          <span className="text-[#2a2a28] hidden sm:inline">|</span>
          <span className="text-[11px] hidden md:inline">
            Agent: <span className="text-[#f3f3f1]">{LIVE_TRACE.agent}</span>
          </span>
          <span className="text-[#2a2a28] hidden md:inline">|</span>
          <span className="text-[11px] hidden lg:inline">
            Trace: <span className="text-[#3b76ff]">{LIVE_TRACE.traceId}</span>
          </span>
        </div>

        {/* Media Controls on Right */}
        <div className="flex items-center gap-1.5">
          {onReset && (
            <button
              onClick={onReset}
              className="flex h-6 w-6 items-center justify-center rounded border border-[#2a2a28] bg-[#141413] text-[#8f8f8d] hover:text-[#f3f3f1] transition-colors"
              title="Restart from 0s"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          )}
          {/* Play/Pause Button */}
          <button
            onClick={onTogglePlay}
            className="flex h-6 w-6 items-center justify-center rounded bg-[#181816] border border-[#2a2a28] text-[#f3f3f1] hover:bg-[#222220] transition-colors"
            title={isPlaying ? "Pause (Space)" : "Play (Space)"}
          >
            {isPlaying ? <Pause className="h-3 w-3 fill-current" /> : <Play className="h-3 w-3 fill-current ml-0.5" />}
          </button>

          {/* Speed Pills: 1x, 2x, 4x */}
          <div className="flex items-center rounded border border-[#2a2a28] bg-[#141413] p-0.5 text-[10px]">
            {([1, 2, 4] as const).map((speed) => (
              <button
                key={speed}
                onClick={() => onChangeSpeed(speed)}
                className={cn(
                  "px-2 py-0.5 rounded transition-all",
                  playbackSpeed === speed
                    ? "bg-[#3b76ff] text-white font-bold"
                    : "text-[#8f8f8d] hover:text-[#f3f3f1]"
                )}
              >
                {speed}x
              </button>
            ))}
          </div>

          <button
            onClick={onFullscreen}
            className="flex h-6 w-6 items-center justify-center rounded border border-[#2a2a28] bg-[#141413] text-[#8f8f8d] hover:text-[#f3f3f1] transition-colors"
            title="Fullscreen"
          >
            <Maximize2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Multi-Track Gantt / Timeline Grid */}
      <div className="pt-2 relative">
        <div
          ref={timelineRef}
          onClick={handleTimelineClick}
          className="relative cursor-pointer space-y-1 py-1"
        >
          {/* Track 1: LLM – from backend workflow */}
          <div className="flex items-center gap-3">
            <span className="w-10 text-[10px] text-[#71717a] font-bold shrink-0">LLM</span>
            <div className="relative flex-1 h-3.5 rounded bg-[#141413] border border-[#1f1f1d] overflow-hidden">
              {TIMELINE_TRACKS.llm.map((seg) => (
                <div
                  key={seg.label}
                  onClick={(e) => { e.stopPropagation(); onSeek(seg.start + 0.1); }}
                  style={{ left: `${(seg.start / duration) * 100}%`, width: `${((seg.end - seg.start) / duration) * 100}%` }}
                  className="absolute top-0 bottom-0 bg-[#3b76ff] rounded-sm hover:brightness-125 transition-all cursor-pointer"
                  title={seg.label}
                />
              ))}
            </div>
          </div>

          {/* Track 2: TOOLS */}
          <div className="flex items-center gap-3">
            <span className="w-10 text-[10px] text-[#71717a] font-bold shrink-0">TOOLS</span>
            <div className="relative flex-1 h-3.5 rounded bg-[#141413] border border-[#1f1f1d] overflow-hidden">
              {TIMELINE_TRACKS.tools.map((seg) => (
                <div
                  key={seg.label}
                  onClick={(e) => { e.stopPropagation(); onSeek(seg.start + 0.1); }}
                  style={{ left: `${(seg.start / duration) * 100}%`, width: `${((seg.end - seg.start) / duration) * 100}%` }}
                  className="absolute top-0 bottom-0 bg-[#38bdf8] rounded-sm hover:brightness-125 transition-all cursor-pointer"
                  title={seg.label}
                />
              ))}
            </div>
          </div>

          {/* Track 3: ENV */}
          <div className="flex items-center gap-3">
            <span className="w-10 text-[10px] text-[#71717a] font-bold shrink-0">ENV</span>
            <div className="relative flex-1 h-3.5 rounded bg-[#141413] border border-[#1f1f1d] overflow-hidden">
              {TIMELINE_TRACKS.env.map((seg) => (
                <div
                  key={seg.label}
                  onClick={(e) => { e.stopPropagation(); onSeek(seg.start + 0.1); }}
                  style={{ left: `${(seg.start / duration) * 100}%`, width: `${((seg.end - seg.start) / duration) * 100}%` }}
                  className={cn(
                    "absolute top-0 bottom-0 rounded-sm hover:brightness-125 transition-all cursor-pointer",
                    "error" in seg && seg.error
                      ? "bg-[#ef4444] border border-red-400 animate-pulse"
                      : "bg-[#f59e0b]"
                  )}
                  title={seg.label}
                />
              ))}
            </div>
          </div>

          {/* Track 4: EVAL */}
          <div className="flex items-center gap-3">
            <span className="w-10 text-[10px] text-[#71717a] font-bold shrink-0">EVAL</span>
            <div className="relative flex-1 h-3.5 rounded bg-[#141413] border border-[#1f1f1d] overflow-hidden">
              {TIMELINE_TRACKS.eval.map((seg) => (
                <div
                  key={seg.label}
                  onClick={(e) => { e.stopPropagation(); onSeek(seg.start + 0.1); }}
                  style={{
                    left: `${(seg.start / duration) * 100}%`,
                    width: `${((seg.end - seg.start) / duration) * 100}%`,
                    backgroundImage:
                      "error" in seg && seg.error
                        ? "repeating-linear-gradient(45deg, #ef4444 0, #ef4444 2px, transparent 2px, transparent 5px)"
                        : "repeating-linear-gradient(45deg, #475569 0, #475569 2px, transparent 2px, transparent 5px)",
                  }}
                  className="absolute top-0 bottom-0 rounded-sm cursor-pointer"
                  title={seg.label}
                />
              ))}
            </div>
          </div>

          {/* Interactive Scrubber Needle (Vertical White Line with Time Tag) */}
          <div
            style={{ left: `calc(40px + (100% - 40px) * ${currentPercent / 100})` }}
            className="absolute -top-3 bottom-0 w-0.5 bg-white pointer-events-none z-20 shadow-[0_0_10px_white]"
          >
            {/* Floating Time Tag Box */}
            <div className="absolute -top-3 -translate-x-1/2 rounded border border-white/40 bg-[#181816] px-1.5 py-0.5 text-[9.5px] font-bold text-white shadow-md">
              {currentTime.toFixed(1)}s
            </div>
          </div>
        </div>

        {/* Ticks and Axis Labels */}
        <div className="flex items-center pl-10 text-[9px] text-[#71717a] border-t border-[#1f1f1d] pt-1">
          <div className="relative w-full h-3">
            {ticks.map((t) => (
              <span
                key={t}
                style={{ left: `${(t / duration) * 100}%` }}
                className="absolute -translate-x-1/2"
              >
                {t}s
              </span>
            ))}
          </div>
        </div>

        {/* Bottom Legend */}
        <div className="flex items-center justify-end gap-4 text-[9.5px] text-[#8f8f8d] pt-1">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-[#3b76ff]" />
            <span>LLM call</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-[#38bdf8]" />
            <span>Tool call</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-[#f59e0b]" />
            <span>Environment</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-[#ef4444]" />
            <span>Error / Failure</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              style={{
                backgroundImage: "repeating-linear-gradient(45deg, #475569 0, #475569 2px, transparent 2px, transparent 4px)",
              }}
              className="h-2 w-2 rounded-sm border border-slate-500"
            />
            <span>Evaluation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
