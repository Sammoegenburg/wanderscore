"use client";

import Link from "next/link";

export default function CTA() {
  return (
    <section className="py-32 px-6 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

      <div className="max-w-3xl mx-auto text-center relative">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-6 leading-tight">
            Your next walk has a
            <br />
            <span className="gradient-text">soundtrack waiting</span>
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-lg mx-auto">
            Free. No account required to try. Just put on headphones and go.
          </p>
          <Link
            href="/signup"
            className="glow-btn inline-flex items-center gap-2 px-10 py-4 text-white font-semibold rounded-xl text-lg"
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
          <p className="mt-6 text-xs text-slate-600">
            Works on any modern browser with GPS. Best on mobile.
          </p>
        </div>
      </div>
    </section>
  );
}
