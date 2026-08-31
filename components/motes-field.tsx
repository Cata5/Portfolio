"use client";

import { useEffect, useRef } from "react";

import { useTheme } from "next-themes";
import { useReducedMotion } from "motion/react";

import { DARK_PALETTE, LIGHT_PALETTE } from "@/components/triangle-world";
import { mulberry32, pickColor } from "@/lib/triangles";
import { cn } from "@/lib/utils";

/*
 * The ambient motes layer for pages without the full TriangleWorld scene
 * (project detail pages, 404). A sparse, dim cloud of the same triangle
 * material — three depth layers, slow downward drift with a sine sway, a
 * gentle twinkle and a lazy rotation, and a fresh random arrangement on
 * every load so each page gets its own layout. Same palette as the main
 * scene so the whole site reads as one visual system. Reduced motion
 * renders a single static frame.
 */

type Mote = {
  x: number; // 0..1
  y: number; // 0..1
  size: number;
  rot: number;
  rotSpeed: number;
  drift: number; // px/s
  sway: number; // horizontal sway amplitude in px
  swaySpeed: number;
  phase: number;
  color: number;
  alpha: number;
  twinkle: number;
};

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function buildMotes(count: number, seed: number): Mote[] {
  const rand = mulberry32(seed);
  const motes: Mote[] = [];
  for (let i = 0; i < count; i++) {
    const d = rand();
    const layer = d < 0.5 ? 0 : d < 0.8 ? 1 : 2;
    motes.push({
      x: rand(),
      y: rand(),
      size: (layer === 0 ? 1.6 : layer === 1 ? 2.4 : 3.4) + rand() * 1.8,
      rot: rand() * Math.PI,
      rotSpeed: (rand() - 0.5) * 0.5,
      drift: 0.3 + layer * 0.35 + rand() * 0.5,
      sway: 4 + layer * 5 + rand() * 8,
      swaySpeed: 0.05 + rand() * 0.12,
      phase: rand() * Math.PI * 2,
      color: pickColor(rand()),
      alpha: (layer === 0 ? 0.14 : layer === 1 ? 0.2 : 0.28) + rand() * 0.1,
      twinkle: 0.3 + rand() * 0.7,
    });
  }
  return motes;
}

export function MotesField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // One random seed per mount — the layout survives theme toggles and
  // resizes instead of reshuffling every re-render.
  const seedRef = useRef<number>(0);
  const { resolvedTheme } = useTheme();
  const reduce = !!useReducedMotion();

  const rgbRef = useRef<[number, number, number][]>(
    DARK_PALETTE.map(hexToRgb),
  );

  useEffect(() => {
    seedRef.current = seedRef.current || ((Math.random() * 2 ** 31) | 0);
  }, []);

  useEffect(() => {
    const light = resolvedTheme === "light";
    const palette = light ? LIGHT_PALETTE : DARK_PALETTE;
    rgbRef.current = palette.map(hexToRgb);
  }, [resolvedTheme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let motes: Mote[] = [];
    let raf = 0;
    let last = performance.now();
    let t = 0;

    const rebuild = () => {
      w = Math.max(window.innerWidth, 1);
      h = Math.max(window.innerHeight, 1);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const count = w < 640 ? 46 : w < 1024 ? 72 : 110;
      motes = buildMotes(count, seedRef.current);
    };

    const drawMote = (m: Mote, px: number, py: number, alpha: number) => {
      const rgb = rgbRef.current[m.color] || rgbRef.current[0];
      const [r, g, b] = rgb;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(m.rot);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.beginPath();
      ctx.moveTo(0, -m.size);
      ctx.lineTo(m.size * 0.86, m.size * 0.55);
      ctx.lineTo(-m.size * 0.86, m.size * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const frame = (animated: boolean) => {
      if (!w || !h) return;
      const bw = Math.round(w * dpr);
      const bh = Math.round(h * dpr);
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const s = animated ? t : 0;
      for (const m of motes) {
        const sway = Math.sin(s * m.swaySpeed * 60 + m.phase) * m.sway;
        let px = (m.x * w + sway) % w;
        if (px < 0) px += w;
        let py = (m.y * h + m.drift * s) % h;
        if (py < 0) py += h;
        if (animated) m.rot += m.rotSpeed * 0.016;
        const tw = 0.7 + 0.3 * Math.sin(s * m.twinkle * 2.2 + m.phase * 2);
        drawMote(m, px, py, m.alpha * tw);
      }
    };

    const loop = (ms: number) => {
      t += Math.min((ms - last) / 1000, 0.05);
      last = ms;
      frame(true);
      raf = requestAnimationFrame(loop);
    };

    rebuild();
    if (reduce) {
      frame(false);
    } else {
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }

    const onResize = () => {
      rebuild();
      frame(reduce);
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [reduce]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-0 z-0 h-full w-full",
        className,
      )}
    />
  );
}
