"use client";

import { useEffect, useRef, useState } from "react";

const DENSITY = 1100; // px^2 of card area per dot
const RADIUS = 1.2;
const ALPHA = 0.4;
const SPEED = 0.3;

export function ParticleHoverCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    if (!hovering) return;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { width, height } = wrap.getBoundingClientRect();
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.max(14, Math.round((width * height) / DENSITY));
    const dots = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * SPEED,
      vy: (Math.random() - 0.5) * SPEED,
    }));

    let raf = 0;
    function tick() {
      ctx!.clearRect(0, 0, width, height);
      for (const d of dots) {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0) d.x += width;
        else if (d.x > width) d.x -= width;
        if (d.y < 0) d.y += height;
        else if (d.y > height) d.y -= height;

        ctx!.beginPath();
        ctx!.arc(d.x, d.y, RADIUS, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(11, 11, 12, ${ALPHA})`;
        ctx!.fill();
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hovering]);

  return (
    <div
      ref={wrapRef}
      className={`relative ${className ?? ""}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <canvas
        ref={canvasRef}
        aria-hidden
        className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${
          hovering ? "opacity-100" : "opacity-0"
        }`}
      />
      {children}
    </div>
  );
}
