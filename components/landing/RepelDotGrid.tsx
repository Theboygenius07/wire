"use client";

import { useEffect, useRef } from "react";

const SPACING = 16;
const RADIUS = 1;
const DOT_COLOR = "11, 11, 12";
const DOT_ALPHA = 0.16;
const REPEL_RADIUS = 130;
const REPEL_STRENGTH = 60;
const EASE = 0.12;

export function RepelDotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let dots: { hx: number; hy: number; x: number; y: number }[] = [];
    let width = 0;
    let height = 0;
    let raf = 0;
    let mouse: { x: number; y: number } | null = null;

    function layout() {
      const rect = parent!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      dots = [];
      for (let y = SPACING / 2; y < height; y += SPACING) {
        for (let x = SPACING / 2; x < width; x += SPACING) {
          dots.push({ hx: x, hy: y, x, y });
        }
      }
    }

    function draw() {
      ctx!.clearRect(0, 0, width, height);
      for (const d of dots) {
        let tx = d.hx;
        let ty = d.hy;
        if (mouse && !reduceMotion) {
          const dx = d.hx - mouse.x;
          const dy = d.hy - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < REPEL_RADIUS && dist > 0.001) {
            const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
            tx = d.hx + (dx / dist) * force;
            ty = d.hy + (dy / dist) * force;
          }
        }
        d.x += (tx - d.x) * EASE;
        d.y += (ty - d.y) * EASE;

        ctx!.beginPath();
        ctx!.arc(d.x, d.y, RADIUS, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${DOT_COLOR}, ${DOT_ALPHA})`;
        ctx!.fill();
      }
      raf = requestAnimationFrame(draw);
    }

    function onMove(e: MouseEvent) {
      const rect = parent!.getBoundingClientRect();
      mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    function onLeave() {
      mouse = null;
    }

    layout();
    raf = requestAnimationFrame(draw);
    parent.addEventListener("mousemove", onMove);
    parent.addEventListener("mouseleave", onLeave);
    window.addEventListener("resize", layout);

    return () => {
      cancelAnimationFrame(raf);
      parent.removeEventListener("mousemove", onMove);
      parent.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", layout);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0"
    />
  );
}
