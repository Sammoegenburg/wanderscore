"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-brand-dark/80 backdrop-blur-xl border-b border-white/5"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/20">
            W
          </div>
          <span className="font-display text-lg font-bold text-white">
            WanderScore
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            How It Works
          </a>
          <a
            href="#moods"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Moods
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-slate-300 hover:text-white transition-colors px-4 py-2"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="glow-btn px-5 py-2 text-sm text-white font-medium rounded-lg"
          >
            Start Walking
          </Link>
        </div>
      </div>
    </nav>
  );
}
