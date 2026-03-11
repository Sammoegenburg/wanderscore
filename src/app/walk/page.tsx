"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useAuth } from "@/hooks/useAuth";
import { AudioEngine } from "@/lib/audioEngine";
import MusicPlayer from "@/components/player/MusicPlayer";

// MapLibre must be loaded client-side only
const WalkMap = dynamic(() => import("@/components/map/WalkMap"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-brand-dark flex items-center justify-center">
      <div className="text-slate-500 text-sm">Loading map...</div>
    </div>
  ),
});

export default function WalkPage() {
  const { user, logout } = useAuth();
  const geo = useGeolocation();
  const engineRef = useRef<AudioEngine | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Initialize audio engine once
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new AudioEngine();
    }
  }, []);

  // Feed location data to audio engine
  useEffect(() => {
    if (!audioPlaying || !engineRef.current || !geo.currentPosition) return;
    engineRef.current.updateFromLocation({
      speed: geo.currentPosition.speed,
      heading: geo.currentPosition.heading,
      lat: geo.currentPosition.lat,
      lng: geo.currentPosition.lng,
    });
  }, [audioPlaying, geo.currentPosition]);

  const handleStart = useCallback(async () => {
    geo.startTracking();
    if (engineRef.current && !engineRef.current.playing) {
      await engineRef.current.start();
      setAudioPlaying(true);
    }
    setStarted(true);
  }, [geo]);

  const handleStop = useCallback(() => {
    geo.stopTracking();
    if (engineRef.current?.playing) {
      engineRef.current.stop();
      setAudioPlaying(false);
    }
    setStarted(false);

    // Save walk to localStorage for gallery
    if (geo.trail.length > 1) {
      const walks = JSON.parse(localStorage.getItem("ws_walks") || "[]");
      walks.unshift({
        id: Date.now(),
        date: new Date().toISOString(),
        trail: geo.trail,
        distance: geo.distance,
        duration: geo.duration,
        mood: engineRef.current?.mood || "nature",
        progressionName: engineRef.current?.progressionName || "Unknown",
      });
      localStorage.setItem("ws_walks", JSON.stringify(walks.slice(0, 50)));
    }
  }, [geo]);

  const toggleAudio = useCallback(async () => {
    if (!engineRef.current) return;
    if (audioPlaying) {
      engineRef.current.stop();
      setAudioPlaying(false);
    } else {
      await engineRef.current.start();
      setAudioPlaying(true);
    }
  }, [audioPlaying]);

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-brand-dark">
      {/* Map */}
      <WalkMap
        currentPosition={geo.currentPosition}
        trail={geo.trail}
        isTracking={geo.isTracking}
      />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 bg-brand-dark/60 backdrop-blur-xl rounded-full px-3 py-1.5 border border-white/5"
        >
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-[10px]">
            W
          </div>
          <span className="font-display text-sm font-bold text-white">
            WanderScore
          </span>
        </Link>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="bg-brand-dark/60 backdrop-blur-xl rounded-full px-3 py-1.5 border border-white/5 text-slate-300 text-sm hover:text-white transition-colors"
          >
            {user?.name || "Menu"}
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-2 bg-brand-dark/90 backdrop-blur-xl border border-white/10 rounded-xl py-2 min-w-[160px] shadow-2xl">
              <Link
                href="/gallery"
                className="block px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                onClick={() => setShowMenu(false)}
              >
                Walk Gallery
              </Link>
              <button
                onClick={() => {
                  setShowMenu(false);
                  logout();
                }}
                className="block w-full text-left px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* GPS Status */}
      {geo.error && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-red-500/10 border border-red-500/20 backdrop-blur-xl rounded-xl px-4 py-2 text-red-400 text-xs max-w-sm text-center">
          {geo.error}. Make sure location access is enabled.
        </div>
      )}

      {/* Start overlay (before starting) */}
      {!started && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-brand-dark/40 backdrop-blur-sm">
          <div className="text-center">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-2xl shadow-indigo-500/30 animate-glow">
                <svg
                  className="w-8 h-8 text-white ml-1"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            <h2 className="font-display text-2xl font-bold text-white mb-2">
              Ready to walk?
            </h2>
            <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">
              Put on your headphones. The music begins when you start moving.
            </p>
            <button
              onClick={handleStart}
              className="glow-btn px-8 py-3 text-white font-semibold rounded-xl"
            >
              Start Walking
            </button>
          </div>
        </div>
      )}

      {/* Stop button (while walking) */}
      {started && (
        <button
          onClick={handleStop}
          className="absolute top-16 right-4 z-30 bg-red-500/20 hover:bg-red-500/30 backdrop-blur-xl border border-red-500/20 text-red-400 px-4 py-2 rounded-full text-xs font-medium transition-all"
        >
          End Walk
        </button>
      )}

      {/* Current mood indicator */}
      {started && engineRef.current && (
        <div className="absolute top-16 left-4 z-30 bg-brand-dark/60 backdrop-blur-xl border border-white/5 rounded-full px-3 py-1.5">
          <span className="text-xs text-slate-400">
            {engineRef.current.progressionName}
          </span>
        </div>
      )}

      {/* Music Player */}
      {started && (
        <MusicPlayer
          engine={engineRef.current}
          isPlaying={audioPlaying}
          onToggle={toggleAudio}
          speed={geo.currentPosition?.speed || 0}
          distance={geo.distance}
          duration={geo.duration}
        />
      )}
    </div>
  );
}
