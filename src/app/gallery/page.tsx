"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

interface Walk {
  id: number;
  date: string;
  trail: { lat: number; lng: number }[];
  distance: number;
  duration: number;
  mood: string;
  progressionName: string;
}

const MOOD_COLORS: Record<string, string> = {
  nature: "from-emerald-600 to-teal-600",
  urban: "from-indigo-600 to-violet-600",
  water: "from-cyan-600 to-blue-600",
  night: "from-purple-600 to-fuchsia-600",
};

const MOOD_BG: Record<string, string> = {
  nature: "bg-emerald-500",
  urban: "bg-indigo-500",
  water: "bg-cyan-500",
  night: "bg-purple-500",
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(2)} km`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function MiniTrailSVG({ trail }: { trail: { lat: number; lng: number }[] }) {
  if (trail.length < 2) return null;

  const lats = trail.map((p) => p.lat);
  const lngs = trail.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const padding = 10;
  const w = 120;
  const h = 80;

  const rangeX = maxLng - minLng || 0.001;
  const rangeY = maxLat - minLat || 0.001;

  const points = trail
    .map((p) => {
      const x = padding + ((p.lng - minLng) / rangeX) * (w - 2 * padding);
      const y = h - padding - ((p.lat - minLat) / rangeY) * (h - 2 * padding);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} className="opacity-50 group-hover:opacity-80 transition-opacity">
      <polyline
        points={points}
        fill="none"
        stroke="url(#trailGrad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="trailGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function GalleryPage() {
  const { user, logout } = useAuth();
  const [walks, setWalks] = useState<Walk[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("ws_walks");
    if (stored) {
      try {
        setWalks(JSON.parse(stored));
      } catch {}
    }
  }, []);

  return (
    <div className="min-h-screen relative">
      <div className="aurora-bg" />

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-brand-dark/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/walk" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-[10px]">
                W
              </div>
              <span className="font-display text-sm font-bold text-white">
                WanderScore
              </span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-sm text-slate-400">Gallery</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/walk"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              New Walk
            </Link>
            <button
              onClick={logout}
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12 relative z-10">
        <div className="mb-10">
          <h1 className="font-display text-3xl font-bold text-white mb-2">
            Your Walks
          </h1>
          <p className="text-slate-400 text-sm">
            {walks.length > 0
              ? `${walks.length} walk${walks.length === 1 ? "" : "s"} recorded. Every one unrepeatable.`
              : "No walks yet. Start your first one and it'll appear here."}
          </p>
        </div>

        {walks.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-500/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-indigo-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
            </div>
            <h3 className="font-display text-lg font-semibold text-white mb-2">
              No walks yet
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              Your first walk will create a unique composition. Go make some
              music.
            </p>
            <Link
              href="/walk"
              className="glow-btn inline-block px-6 py-2.5 text-white font-medium rounded-xl text-sm"
            >
              Start Walking
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {walks.map((walk) => (
              <div
                key={walk.id}
                className="glass-card p-5 group transition-all duration-300 hover:scale-[1.02]"
              >
                {/* Trail preview */}
                <div className="flex items-center justify-between mb-4">
                  <MiniTrailSVG trail={walk.trail} />
                  <div
                    className={`w-8 h-8 rounded-lg ${
                      MOOD_BG[walk.mood] || "bg-indigo-500"
                    } bg-opacity-20 flex items-center justify-center`}
                  >
                    <span className="text-xs font-bold text-white/80">
                      {walk.mood.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Mood bar */}
                <div className="h-1 rounded-full overflow-hidden bg-white/5 mb-4">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${
                      MOOD_COLORS[walk.mood] || "from-indigo-500 to-violet-500"
                    }`}
                    style={{ width: "100%" }}
                  />
                </div>

                {/* Info */}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white">
                    {walk.progressionName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDate(walk.date)}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex gap-4 mt-3 pt-3 border-t border-white/5">
                  <div className="text-xs">
                    <span className="text-slate-600">Distance </span>
                    <span className="text-slate-300">
                      {formatDistance(walk.distance)}
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-600">Duration </span>
                    <span className="text-slate-300">
                      {formatDuration(walk.duration)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
