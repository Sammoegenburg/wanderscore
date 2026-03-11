"use client";

import { useRef, useEffect } from "react";

interface Props {
  getData: () => Uint8Array;
  isPlaying: boolean;
}

export default function AudioVisualizer({ getData, isPlaying }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (!isPlaying) {
      cancelAnimationFrame(animRef.current);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const draw = () => {
      const data = getData();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      if (data.length === 0) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      const barCount = Math.min(64, data.length);
      const barWidth = w / barCount;
      const gap = 1;

      for (let i = 0; i < barCount; i++) {
        const value = data[i] / 255;
        const barHeight = Math.max(2, value * h * 0.9);

        const x = i * barWidth;
        const y = h - barHeight;

        // Gradient per bar
        const gradient = ctx.createLinearGradient(x, h, x, y);
        const hue = 240 + (i / barCount) * 40; // indigo to violet
        gradient.addColorStop(0, `hsla(${hue}, 80%, 65%, 0.8)`);
        gradient.addColorStop(1, `hsla(${hue + 20}, 80%, 70%, 0.3)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x + gap / 2, y, barWidth - gap, barHeight, 2);
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying, getData]);

  return (
    <canvas
      ref={canvasRef}
      className="visualizer-canvas"
      style={{ width: "100%", height: "60px" }}
    />
  );
}
