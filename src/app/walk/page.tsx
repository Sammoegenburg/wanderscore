"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useAuth } from "@/hooks/useAuth";
import { AudioEngine } from "@/lib/audioEngine";
import type { CultureType, MusicState } from "@/lib/audioEngine";
import { getLocationContext, type LocationContext } from "@/lib/locationIntelligence";
import MusicPlayer from "@/components/player/MusicPlayer";

const WalkMap = dynamic(() => import("@/components/map/WalkMap"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-brand-dark flex items-center justify-center">
      <div className="text-slate-500 text-sm">Loading map...</div>
    </div>
  ),
});

const CULTURE_LABELS: Record<CultureType, string> = {
  western: "Western Pop",
  eastAsian: "East Asian",
  latin: "Latin Groove",
  middleEastern: "Middle Eastern",
  indian: "Indian Raga",
  african: "African Groove",
  urban: "Urban Beat",
};

export default function WalkPage() {
  const { user, logout } = useAuth();
  const geo = useGeolocation();
  const engineRef = useRef<AudioEngine | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [musicState, setMusicState] = useState<MusicState | null>(null);
  const [locationCtx, setLocationCtx] = useState<LocationContext | null>(null);
  const stateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize audio engine once
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new AudioEngine();
    }
  }, []);

  // Poll music state for UI updates
  useEffect(() => {
    if (audioPlaying && engineRef.current) {
      stateIntervalRef.current = setInterval(() => {
        if (engineRef.current) {
          setMusicState(engineRef.current.getState());
        }
      }, 500);
    }
    return () => {
      if (stateIntervalRef.current) clearInterval(stateIntervalRef.current);
    };
  }, [audioPlaying]);

  // Feed location data to audio engine + location intelligence
  useEffect(() => {
    if (!audioPlaying || !engineRef.current || !geo.currentPosition) return;

    engineRef.current.updateFromLocation({
      speed: geo.currentPosition.speed,
      heading: geo.currentPosition.heading,
      lat: geo.currentPosition.lat,
      lng: geo.currentPosition.lng,
    });

    // Location intelligence (rate-limited internally to every 30s)
    getLocationContext(geo.currentPosition.lat, geo.currentPosition.lng).then(
      (ctx) => {
        if (!ctx || !engineRef.current) return;
        setLocationCtx(ctx);

        // Only auto-switch culture if confidence is decent
        if (ctx.confidence >= 0.3) {
          engineRef.current.setCulture(ctx.culture);
        }
        engineRef.current.setEnvironment(ctx.environment);
      }
    );
  }, [audioPlaying, geo.currentPosition]);

  const handleStart = useCallback(async () => {
    // Always transition UI — don't let audio errors block the experience
    setStarted(true);
    geo.startTracking();
    try {
      if (engineRef.current && !engineRef.current.playing) {
        await engineRef.current.start();
        setAudioPlaying(true);
        setMusicState(engineRef.current.getState());
      }
    } catch (err) {
      console.error("Audio engine failed to start:", err);
      // UI is still usable — walk tracking works without audio
    }
  }, [geo]);

  const handleStop = useCallback(() => {
    geo.stopTracking();
    if (engineRef.current?.playing) {
      engineRef.current.stop();
      setAudioPlaying(false);
    }
    setStarted(false);
    setMusicState(null);
    setLocationCtx(null);

    // Save walk to localStorage for gallery
    if (geo.trail.length > 1) {
      const walks = JSON.parse(localStorage.getItem("ws_walks") || "[]");
      walks.unshift({
        id: Date.now(),
        date: new Date().toISOString(),
        trail: geo.trail,
        distance: geo.distance,
        duration: geo.duration,
        mood: engineRef.current?.culture || "western",
        progressionName: engineRef.current?.progressionName || "Unknown",
      });
      localStorage.setItem("ws_walks", JSON.stringify(walks.slice(0, 50)));
    }
  }, [geo]);

  const toggleAudio = useCallback(async () => {
    if (!engineRef.current) return;
    try {
      if (audioPlaying) {
        engineRef.current.stop();
        setAudioPlaying(false);
      } else {
        await engineRef.current.start();
        setAudioPlaying(true);
      }
    } catch (err) {
      console.error("Audio toggle error:", err);
    }
  }, [audioPlaying]);

  const handleCultureChange = useCallback((culture: CultureType) => {
    if (engineRef.current) {
      engineRef.current.setCulture(culture);
      setMusicState(engineRef.current.getState());
    }
  }, []);

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
      {started && geo.geoStatus === "acquiring" && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-xl rounded-xl px-4 py-2 text-indigo-300 text-xs max-w-sm text-center">
          Acquiring GPS... Music is playing!
        </div>
      )}
      {started && geo.geoStatus === "fallback" && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-amber-500/10 border border-amber-500/20 backdrop-blur-xl rounded-xl px-4 py-2 text-amber-300 text-xs max-w-sm text-center">
          Using approximate location. GPS will refine when available.
        </div>
      )}
      {geo.error && !geo.currentPosition && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-red-500/10 border border-red-500/20 backdrop-blur-xl rounded-xl px-4 py-2 text-red-400 text-xs max-w-sm text-center">
          {geo.error}
        </div>
      )}

      {/* Context info overlay (while walking) */}
      {started && (
        <div className="absolute top-16 left-4 z-30 space-y-2">
          {/* Culture badge */}
          {musicState && (
            <div className="bg-brand-dark/60 backdrop-blur-xl border border-white/5 rounded-full px-3 py-1.5 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-xs text-slate-300 font-medium">
                {CULTURE_LABELS[musicState.culture]}
              </span>
            </div>
          )}

          {/* Neighborhood */}
          {locationCtx?.neighborhood && (
            <div className="bg-brand-dark/60 backdrop-blur-xl border border-white/5 rounded-full px-3 py-1.5">
              <span className="text-xs text-slate-400">
                {locationCtx.neighborhood}
              </span>
            </div>
          )}

          {/* Environment */}
          {musicState && (
            <div className="bg-brand-dark/60 backdrop-blur-xl border border-white/5 rounded-full px-3 py-1.5">
              <span className="text-xs text-slate-500">
                {musicState.environment} &middot; {musicState.intensity}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Start overlay */}
      {!started && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-brand-dark/40 backdrop-blur-sm">
          <div className="text-center">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-2xl shadow-indigo-500/30 animate-glow">
                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            <h2 className="font-display text-2xl font-bold text-white mb-2">
              Ready to walk?
            </h2>
            <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">
              Put on headphones. Music adapts to your pace, surroundings,
              and local culture in real-time.
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

      {/* End Walk button */}
      {started && (
        <button
          onClick={handleStop}
          className="absolute top-16 right-4 z-30 bg-red-500/20 hover:bg-red-500/30 backdrop-blur-xl border border-red-500/20 text-red-400 px-4 py-2 rounded-full text-xs font-medium transition-all"
        >
          End Walk
        </button>
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
          musicState={musicState}
          onCultureChange={handleCultureChange}
        />
      )}
    </div>
  );
}
