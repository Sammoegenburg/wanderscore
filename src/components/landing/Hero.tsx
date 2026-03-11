"use client";

import Link from "next/link";

function SoundBars() {
  const bars = Array.from({ length: 40 }, (_, i) => i);
  return (
    <div className="flex items-end justify-center gap-[3px] h-16 opacity-60">
      {bars.map((i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-gradient-to-t from-indigo-500 to-violet-400"
          style={{
            animation: `sound-bar-animate ${0.8 + Math.random() * 0.8}s ease-in-out ${Math.random() * 0.5}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function FloatingOrb({
  className,
  color,
}: {
  className: string;
  color: string;
}) {
  return (
    <div
      className={`absolute rounded-full blur-3xl opacity-20 pointer-events-none ${className}`}
      style={{ background: color }}
    />
  );
}

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background orbs */}
      <FloatingOrb
        className="w-[500px] h-[500px] -top-32 -right-32 animate-float"
        color="radial-gradient(circle, #6366f1, transparent 70%)"
      />
      <FloatingOrb
        className="w-[400px] h-[400px] bottom-20 -left-32 animate-float-delayed"
        color="radial-gradient(circle, #8b5cf6, transparent 70%)"
      />
      <FloatingOrb
        className="w-[300px] h-[300px] top-1/3 right-1/4 animate-float-slow"
        color="radial-gradient(circle, #f59e0b, transparent 70%)"
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 animate-fade-in-up">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-slate-300 font-medium">
            Powered by MapLibre + Web Audio + AI
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight mb-6 animate-fade-in-up">
          Every Step
          <br />
          <span className="gradient-text">Writes Music</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed opacity-0 animate-fade-in-up-delayed">
          Your city is an instrument. WanderScore composes a unique, evolving
          soundtrack as you explore — every walk a one-of-a-kind album that will
          never exist again.
        </p>

        {/* Sound bars */}
        <div className="mb-10 opacity-0 animate-fade-in-up-delayed-2">
          <SoundBars />
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-fade-in-up-delayed-2">
          <Link
            href="/signup"
            className="glow-btn px-8 py-3.5 text-white font-semibold rounded-xl text-base flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Start Walking
          </Link>
          <a
            href="#how-it-works"
            className="px-8 py-3.5 text-slate-300 hover:text-white font-medium rounded-xl border border-white/10 hover:border-white/20 transition-all text-base"
          >
            See How It Works
          </a>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto opacity-0 animate-fade-in-up-delayed-2">
          <div>
            <div className="font-display text-2xl font-bold text-white">
              &infin;
            </div>
            <div className="text-xs text-slate-500 mt-1">Unique Scores</div>
          </div>
          <div>
            <div className="font-display text-2xl font-bold text-white">
              4
            </div>
            <div className="text-xs text-slate-500 mt-1">Sonic Moods</div>
          </div>
          <div>
            <div className="font-display text-2xl font-bold text-white">
              0ms
            </div>
            <div className="text-xs text-slate-500 mt-1">Cloud Latency</div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-brand-dark to-transparent" />
    </section>
  );
}
