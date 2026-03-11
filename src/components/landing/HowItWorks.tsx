"use client";

import { useEffect, useRef } from "react";

const steps = [
  {
    num: "01",
    title: "Put on Headphones",
    desc: "Open WanderScore, tap Start, and begin walking. That's it. No configuration needed.",
    color: "text-indigo-400",
    border: "border-indigo-500/30",
    bg: "bg-indigo-500/10",
  },
  {
    num: "02",
    title: "Walk Anywhere",
    desc: "The GPS tracks your position, speed, and direction. The 3D map draws your route in real-time.",
    color: "text-violet-400",
    border: "border-violet-500/30",
    bg: "bg-violet-500/10",
  },
  {
    num: "03",
    title: "Listen to Your City",
    desc: "The audio engine generates a live soundtrack — chords shift, tempo reacts to your pace, textures evolve with your surroundings.",
    color: "text-amber-400",
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
  },
  {
    num: "04",
    title: "Keep Your Album",
    desc: "When you stop, your walk becomes an entry in your gallery — a unique composition tied to a route, a time, and a mood.",
    color: "text-emerald-400",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
  },
];

export default function HowItWorks() {
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

    const items = sectionRef.current?.querySelectorAll(".step-item");
    items?.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="how-it-works" ref={sectionRef} className="py-32 px-6 relative">
      {/* Divider gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            How it <span className="gradient-text">works</span>
          </h2>
          <p className="text-slate-400 max-w-lg mx-auto">
            Four steps. Zero learning curve. Just walk.
          </p>
        </div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[27px] top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500/30 via-violet-500/30 to-amber-500/30 hidden md:block" />

          <div className="space-y-12">
            {steps.map((step, i) => (
              <div
                key={i}
                className="step-item section-reveal flex gap-6 items-start"
                style={{ transitionDelay: `${i * 120}ms` }}
              >
                {/* Number circle */}
                <div
                  className={`flex-shrink-0 w-14 h-14 rounded-2xl ${step.bg} ${step.border} border flex items-center justify-center`}
                >
                  <span className={`font-display text-lg font-bold ${step.color}`}>
                    {step.num}
                  </span>
                </div>

                <div className="pt-2">
                  <h3 className="font-display text-xl font-semibold text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
