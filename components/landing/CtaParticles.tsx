"use client";

import { useEffect, useRef } from "react";

const SPACING = 16;
const RADIUS = 1;
const ALPHA_MIN = 0.1;
const ALPHA_MAX = 0.22;

// Dots push away from the cursor and spring back to their grid position
// once it moves on — a "repel" field rather than the Hero's glow-on-hover.
const REPEL_RADIUS = 130;
const REPEL_STRENGTH = 60;
const EASE = 0.14;
const MOUSE_EASE = 0.18;

export function CtaParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let dots: { hx: number; hy: number; x: number; y: number; phase: number; speed: number }[] = [];
    let raf = 0;
    let frame = 0;

    // target mouse position vs. eased/rendered position, so the repel field
    // trails the cursor smoothly instead of snapping.
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
            hx: x,
            hy: y,
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

      mouse.x += (mouse.targetX - mouse.x) * MOUSE_EASE;
      mouse.y += (mouse.targetY - mouse.y) * MOUSE_EASE;

      for (const d of dots) {
        const t = reduceMotion ? 0.5 : (Math.sin(frame * d.speed + d.phase) + 1) / 2;
        const alpha = ALPHA_MIN + t * (ALPHA_MAX - ALPHA_MIN);

        let targetX = d.hx;
        let targetY = d.hy;

        if (mouse.active) {
          const dx = d.hx - mouse.x;
          const dy = d.hy - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < REPEL_RADIUS) {
            const proximity = 1 - dist / REPEL_RADIUS;
            const push = proximity * proximity * REPEL_STRENGTH;
            const nx = dist === 0 ? 1 : dx / dist;
            const ny = dist === 0 ? 0 : dy / dist;
            targetX = d.hx + nx * push;
            targetY = d.hy + ny * push;
          }
        }

        d.x += (targetX - d.x) * EASE;
        d.y += (targetY - d.y) * EASE;

        ctx!.beginPath();
        ctx!.arc(d.x, d.y, RADIUS, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
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
