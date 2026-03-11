"use client";

import { useCallback } from "react";
import AudioVisualizer from "./AudioVisualizer";
import type { AudioEngine, MoodType } from "@/lib/audioEngine";

interface Props {
  engine: AudioEngine | null;
  isPlaying: boolean;
  onToggle: () => void;
  speed: number;
  distance: number;
  duration: number;
}

const MOODS: { key: MoodType; label: string; color: string }[] = [
  { key: "nature", label: "Nature", color: "bg-emerald-500" },
  { key: "urban", label: "Urban", color: "bg-indigo-500" },
  { key: "water", label: "Water", color: "bg-cyan-500" },
  { key: "night", label: "Night", color: "bg-purple-500" },
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
}: Props) {
  const getData = useCallback(() => {
    return engine?.getAnalyserData() ?? new Uint8Array(0);
  }, [engine]);

  return (
    <div className="player-glass fixed bottom-0 left-0 right-0 z-40 px-4 py-3 safe-area-bottom">
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
                {(speed * 3.6).toFixed(1)} km/h
              </span>
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

          {/* Play/Stop button */}
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

          {/* BPM & Mood */}
          <div className="flex items-center gap-3">
            {engine && isPlaying && (
              <span className="text-xs text-slate-500 font-mono">
                {engine.currentBPM} BPM
              </span>
            )}
          </div>
        </div>

        {/* Mood selector */}
        {engine && (
          <div className="flex items-center gap-2 mt-3 justify-center">
            {MOODS.map((mood) => (
              <button
                key={mood.key}
                onClick={() => engine.setMood(mood.key)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  engine.mood === mood.key
                    ? `${mood.color} text-white shadow-lg`
                    : "bg-white/5 text-slate-400 hover:bg-white/10"
                }`}
              >
                {mood.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
