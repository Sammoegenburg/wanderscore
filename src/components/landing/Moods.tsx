"use client";

import { useEffect, useRef } from "react";

const moods = [
  {
    name: "Nature",
    subtitle: "Open Fields",
    description:
      "Lush pads, gentle arpeggios, and warm major chords. For parks, trails, and open spaces.",
    colors: "from-emerald-600 to-teal-600",
    border: "border-emerald-500/20",
    wave: "bg-emerald-400",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
      </svg>
    ),
  },
  {
    name: "Urban",
    subtitle: "City Pulse",
    description:
      "Driving minor progressions, faster arpeggios, and gritty textures. For downtown streets and busy neighborhoods.",
    colors: "from-indigo-600 to-violet-600",
    border: "border-indigo-500/20",
    wave: "bg-indigo-400",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    name: "Water",
    subtitle: "Flowing",
    description:
      "Suspended chords, cascading arpeggios, and ethereal reverb. For bridges, riverfronts, and coastlines.",
    colors: "from-cyan-600 to-blue-600",
    border: "border-cyan-500/20",
    wave: "bg-cyan-400",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    ),
  },
  {
    name: "Night",
    subtitle: "Midnight",
    description:
      "Dark minor keys, slow tempos, and deep reverb. Auto-activates after sunset for late-night wanderers.",
    colors: "from-purple-600 to-fuchsia-600",
    border: "border-purple-500/20",
    wave: "bg-purple-400",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    ),
  },
];

export default function Moods() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.1 }
    );

    const cards = sectionRef.current?.querySelectorAll(".mood-card");
    cards?.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="moods" ref={sectionRef} className="py-32 px-6 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Four sonic <span className="gradient-text">moods</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Each mood has its own chord progressions, textures, and personality.
            Switch manually or let WanderScore auto-detect from your surroundings
            and time of day.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {moods.map((mood, i) => (
            <div
              key={i}
              className={`mood-card section-reveal glass-card p-6 group cursor-default transition-all duration-500 hover:scale-[1.03] overflow-hidden relative`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {/* Gradient overlay on hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${mood.colors} opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500`}
              />

              <div className="relative z-10">
                <div className="text-white/60 mb-4 group-hover:text-white/80 transition-colors">
                  {mood.icon}
                </div>
                <h3 className="font-display text-xl font-bold text-white mb-1">
                  {mood.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">
                  {mood.subtitle}
                </p>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {mood.description}
                </p>

                {/* Mini sound wave */}
                <div className="flex items-end gap-[2px] h-4 mt-4 opacity-40 group-hover:opacity-80 transition-opacity">
                  {Array.from({ length: 16 }, (_, j) => (
                    <div
                      key={j}
                      className={`w-[2px] rounded-full ${mood.wave}`}
                      style={{
                        animation: `sound-bar-animate ${0.6 + Math.random() * 0.6}s ease-in-out ${Math.random() * 0.4}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
