"use client";

import { useEffect, useRef } from "react";

const SPACING = 15;
const RADIUS = 1;
const ALPHA_MIN = 0.05;
const ALPHA_MAX = 0.28;

const HOVER_RADIUS = 160;
const HOVER_ALPHA_MAX = 0.85;
const HOVER_RADIUS_BOOST = 1.6;
const EASE = 0.12;

export function HeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let dots: { x: number; y: number; phase: number; speed: number }[] = [];
    let raf = 0;
    let frame = 0;

    // target mouse position vs. eased/rendered position, so the glow trails
    // the cursor smoothly instead of snapping.
    const mouse = { targetX: -9999, targetY: -9999, x: -9999, y: -9999, active: false };

    function layout() {
      const { width, height } = parent!.getBoundingClientRect();
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      dots = [];
      for (let y = SPACING / 2; y < height; y += SPACING) {
        for (let x = SPACING / 2; x < width; x += SPACING) {
          dots.push({
            x,
            y,
            phase: Math.random() * Math.PI * 2,
            speed: 0.006 + Math.random() * 0.01,
          });
        }
      }
      draw();
    }

    function draw() {
      const { width, height } = parent!.getBoundingClientRect();
      ctx!.clearRect(0, 0, width, height);

      mouse.x += (mouse.targetX - mouse.x) * EASE;
      mouse.y += (mouse.targetY - mouse.y) * EASE;

      for (const d of dots) {
        const t = reduceMotion ? 0.5 : (Math.sin(frame * d.speed + d.phase) + 1) / 2;
        let alpha = ALPHA_MIN + t * (ALPHA_MAX - ALPHA_MIN);
        let radius = RADIUS;

        if (mouse.active) {
          const dx = d.x - mouse.x;
          const dy = d.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < HOVER_RADIUS) {
            const proximity = 1 - dist / HOVER_RADIUS;
            alpha = Math.max(alpha, alpha + (HOVER_ALPHA_MAX - alpha) * proximity);
            radius = RADIUS + (HOVER_RADIUS_BOOST - 1) * RADIUS * proximity;
          }
        }

        ctx!.beginPath();
        ctx!.arc(d.x, d.y, radius, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(11, 11, 12, ${alpha.toFixed(3)})`;
        ctx!.fill();
      }
    }

    function tick() {
      frame++;
      draw();
      raf = requestAnimationFrame(tick);
    }

    layout();
    raf = requestAnimationFrame(tick);

    const onResize = () => layout();
    const onPointerMove = (e: PointerEvent) => {
      const rect = parent!.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
      mouse.active = true;
    };
    const onPointerLeave = () => {
      mouse.active = false;
      mouse.targetX = -9999;
      mouse.targetY = -9999;
    };

    window.addEventListener("resize", onResize);
    parent!.addEventListener("pointermove", onPointerMove);
    parent!.addEventListener("pointerleave", onPointerLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      parent!.removeEventListener("pointermove", onPointerMove);
      parent!.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10"
    />
  );
}
