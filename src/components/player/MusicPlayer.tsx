"use client";

import { useCallback, useState } from "react";
import AudioVisualizer from "./AudioVisualizer";
import type { AudioEngine, CultureType, MusicState } from "@/lib/audioEngine";

interface Props {
  engine: AudioEngine | null;
  isPlaying: boolean;
  onToggle: () => void;
  speed: number;
  distance: number;
  duration: number;
  musicState: MusicState | null;
  onCultureChange: (culture: CultureType) => void;
}

const CULTURES: { key: CultureType; label: string; color: string; icon: string }[] = [
  { key: "western", label: "Western", color: "bg-blue-500", icon: "W" },
  { key: "eastAsian", label: "East Asian", color: "bg-rose-500", icon: "A" },
  { key: "latin", label: "Latin", color: "bg-amber-500", icon: "L" },
  { key: "middleEastern", label: "M. East", color: "bg-orange-500", icon: "M" },
  { key: "indian", label: "Indian", color: "bg-yellow-500", icon: "I" },
  { key: "african", label: "African", color: "bg-green-500", icon: "F" },
  { key: "urban", label: "Urban", color: "bg-violet-500", icon: "U" },
];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(2)}km`;
}

export default function MusicPlayer({
  engine,
  isPlaying,
  onToggle,
  speed,
  distance,
  duration,
  musicState,
  onCultureChange,
}: Props) {
  const [showCultures, setShowCultures] = useState(false);

  const getData = useCallback(() => {
    return engine?.getAnalyserData() ?? new Uint8Array(0);
  }, [engine]);

  return (
    <div className="player-glass fixed bottom-0 left-0 right-0 z-40 px-4 pt-3 pb-4 safe-area-bottom">
      <div className="max-w-2xl mx-auto">
        {/* Visualizer */}
        <AudioVisualizer getData={getData} isPlaying={isPlaying} />

        {/* Controls row */}
        <div className="flex items-center justify-between mt-3">
          {/* Stats */}
          <div className="flex gap-4 text-xs text-slate-400">
            <div>
              <span className="text-slate-600">SPD </span>
              <span className="text-white font-medium">
                {(speed * 3.6).toFixed(1)}
              </span>
              <span className="text-slate-600 ml-0.5">km/h</span>
            </div>
            <div>
              <span className="text-slate-600">DST </span>
              <span className="text-white font-medium">
                {formatDistance(distance)}
              </span>
            </div>
            <div>
              <span className="text-slate-600">DUR </span>
              <span className="text-white font-medium">
                {formatDuration(duration)}
              </span>
            </div>
          </div>

          {/* Play/Stop */}
          <button
            onClick={onToggle}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isPlaying
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                : "bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30"
            }`}
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* BPM + Intensity */}
          <div className="flex items-center gap-3 text-xs">
            {musicState && (
              <>
                <span className="text-slate-500 font-mono">
                  {musicState.bpm} BPM
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                  musicState.intensity === "running"
                    ? "bg-red-500/20 text-red-400"
                    : musicState.intensity === "jogging"
                    ? "bg-orange-500/20 text-orange-400"
                    : musicState.intensity === "brisk"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : musicState.intensity === "walking"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-blue-500/20 text-blue-400"
                }`}>
                  {musicState.intensity}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Culture selector */}
        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={() => setShowCultures(!showCultures)}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
            </svg>
            {showCultures ? "Hide Styles" : "Change Style"}
          </button>

          {musicState && !showCultures && (
            <span className="text-[10px] text-slate-600 uppercase tracking-widest">
              Auto-detecting culture from surroundings
            </span>
          )}
        </div>

        {/* Culture grid */}
        {showCultures && (
          <div className="mt-2 grid grid-cols-7 gap-1.5">
            {CULTURES.map((c) => (
              <button
                key={c.key}
                onClick={() => {
                  onCultureChange(c.key);
                  setShowCultures(false);
                }}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                  musicState?.culture === c.key
                    ? `${c.color} text-white shadow-lg`
                    : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="text-xs font-bold">{c.icon}</span>
                <span className="text-[9px] leading-tight">{c.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
