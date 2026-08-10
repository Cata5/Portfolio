"use client";

import { useEffect, useRef, type RefObject } from "react";

import { useTheme } from "next-themes";
import { useReducedMotion } from "motion/react";

import { hasFinePointer } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * The hero's visual centerpiece — a generative triangular Earth. A sphere of
 * thousands of the portfolio's triangle glyphs whose density, brightness and
 * spacing carve out the continents: land is a dense bright field of fragments,
 * ocean is almost empty. Up close it is pure geometry; from a distance it is
 * Earth. The triangles are the identity of the visual — the globe is simply
 * the form they create.
 *
 * - Every triangle sits on a unit sphere, tangent-aligned through view-space
 *   foreshortening: glyphs shrink and dim toward the limb and the far
 *   hemisphere is culled, so the pieces genuinely create the surface.
 * - Continents are implied with soft ellipse masks in (lat, lon) space —
 *   N. America (+Greenland), S. America, Europe, Africa, Asia and Australia.
 *   Recognizable silhouettes, no borders, no texture, no Google Earth.
 * - A slow constant rotation (~1°/s — almost stationary at first) plus a
 *   breathing tilt and the eased cursor-facing lean; the cursor also nudges
 *   nearby triangles a few pixels, as if the globe is being touched.
 * - Idle life: tiny per-triangle drift and rotation wobble, occasional land
 *   twinkles, and a few limb fragments that pulse slightly off the surface
 *   and settle back.
 * - Atmosphere: a restrained rim built from faint concentric arcs around the
 *   globe edge, mostly visible at the limb.
 * - Entrance: the world is generated — triangles emerge staggered from a
 *   scattered shell, converge onto the sphere, then the atmosphere fades in.
 * - Scroll: the hero feeds progress in via a ref — the globe enlarges, begins
 *   fragmenting, then dissolves into an outward field of triangles as the
 *   hero hands off to the next section.
 * - Pure canvas 2D, batched into a bounded number of Path2D strokes per frame
 *   (depth layer × colour × alpha bucket); atmosphere and twinkles draw
 *   additively. Reduced-motion renders one static assembled frame; rAF pauses
 *   offscreen / when the tab is hidden.
 */

const DARK_PALETTE = [
  "#8052ff", // electric iris — dominant (the portfolio's brand accent)
  "#b88815", // amber
  "#8d47b1", // magenta
  "#378877", // teal
  "#bc7899", // rose
  "#3a749d", // blue
  "#427548", // green
];
const LIGHT_PALETTE = [
  "#5b2fd6",
  "#8a6410",
  "#6b2f8f",
  "#0f766e",
  "#8f4d63",
  "#1d4ed8",
  "#2f5d3a",
];
const WEIGHTS = [0.34, 0.17, 0.13, 0.12, 0.09, 0.09, 0.06];
const DEPTH_LAYERS = 8;
const ROT_SPEED = 0.02; // rad/s — ~1.1°/s, deliberately almost-still
const SWAY_X = 0.028; // breathing tilt amplitude
const BASE_TILT_X = 0.14; // static pitch so the poles are hinted
const ASSEMBLY_MS = 1900; // "world being generated" duration
const FRONT_LON = (-50 * Math.PI) / 180; // Atlantic-facing meridian at load
const OCEAN_KEEP = 0.11; // share of ocean candidates that become triangles
const LAND_KEEP = 0.94;
const FRAGMENT_RATIO = 0.06; // share of triangles that pulse off the surface
const TWINKLE_RATE = 0.002; // chance of a land mote flash per frame
const GLOW_DECAY = 0.9;
const DARK_GLOW_RGB = "160,130,255"; // atmosphere rim + twinkles
const LIGHT_GLOW_RGB = "91,47,214";

/* Cursor */
const CURSOR_R = 150; // px — reach of the pointer's push
const CURSOR_STRENGTH = 9; // px — max displacement

/* Continents — soft ellipses [clon, clat, rw(°), rh(°)] in lat/lon space. */
const LAND: [number, number, number, number][] = [
  // North America
  [-100, 52, 26, 18],
  [-100, 26, 13, 10],
  [-87, 13, 5, 8],
  [-42, 72, 9, 5], // Greenland
  [-152, 63, 9, 7], // Alaska
  // South America
  [-60, -10, 13, 20],
  [-70, -32, 4.5, 13], // Chile / Patagonia taper
  [-55, -25, 7, 7],
  [-72, 3, 6, 6], // northern bulge
  // Europe
  [15, 50, 14, 11],
  [-4, 39, 6, 5], // Iberia
  [15, 63, 4.5, 7], // Scandinavia
  [13, 42, 2.5, 5], // Italy
  [22, 40, 3.5, 5], // Balkans / Greece
  [-3, 54, 3.5, 6], // British Isles
  // Africa
  [20, 5, 21, 24],
  [44, 8, 7, 7], // Horn
  [-6, 6, 9, 7], // West Africa bulge
  [23, -26, 6, 11], // southern taper
  // Asia
  [78, 48, 52, 24], // main mass — Siberia / Central Asia / China
  [78, 18, 6.5, 12], // India
  [45, 23, 7, 6], // Arabia
  [104, 11, 9, 7], // Indochina
  [119, -2, 9, 3], // Indonesia
  [123, 14, 3, 3], // Philippines
  [138, 37, 2.5, 6], // Japan
  [160, 56, 7, 5], // Kamchatka
  [176, 65, 7, 4], // Chukotka
  // Australia
  [134, -25, 15, 10],
  [172, -42, 2.5, 5], // New Zealand
];

type P = {
  ux: number;
  uy: number;
  uz: number; // unit surface direction (already rotated to FRONT_LON)
  tx: number;
  ty: number;
  tz: number; // tangential scatter direction (scroll dissolve)
  radius: number;
  rot: number;
  rotSpeed: number;
  driftPhase: number;
  driftSpeed: number;
  color: number;
  land: boolean;
  big: boolean;
  frag: boolean;
  fragAmp: number;
  fragSpeed: number;
  fragPhase: number;
  sAmp: number; // outward scroll-scatter amplitude
  tAmp: number; // tangential scroll-scatter amplitude
  shellR: number; // assembly shell offset (converges to the surface)
  asmPhase: number; // emergence stagger, 0..1
  glow: number;
};

/** Scroll progress handed in by the hero's ScrollTrigger. */
export type VisualProgress = { current: number };

/** Deterministic PRNG so the Earth is identical across loads and theme toggles. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickColor(rand: () => number) {
  const r = rand();
  let acc = 0;
  for (let i = 0; i < WEIGHTS.length; i++) {
    acc += WEIGHTS[i];
    if (r < acc) return i;
  }
  return 0;
}

function isLand(lat: number, lon: number): boolean {
  for (const [clon, clat, rw, rh] of LAND) {
    const d = ((lon - clon) / rw) ** 2 + ((lat - clat) / rh) ** 2;
    if (d <= 1) return true;
  }
  return false;
}

/**
 * Triangles are placed on a unit sphere and accepted by continent masks —
 * land keeps nearly every candidate (dense, bright clusters), ocean keeps a
 * tenth (sparse, dim). The globe's front meridian faces the Atlantic, so the
 * Americas, Europe and Africa are recognizable the moment it appears.
 */
function buildEarth(count: number, w: number): P[] {
  const rand = mulberry32(20260810);
  const bigChance = w < 640 ? 0.03 : 0.04;
  const pts: P[] = [];
  const maxIter = count * 16;

  for (let i = 0; i < maxIter && pts.length < count; i++) {
    const lat = Math.asin(2 * rand() - 1); // rad
    const lon = rand() * Math.PI * 2 - Math.PI; // rad
    const land = isLand((lat * 180) / Math.PI, (lon * 180) / Math.PI);
    if (rand() > (land ? LAND_KEEP : OCEAN_KEEP)) continue;

    const lonP = lon - FRONT_LON; // 0 at the front meridian
    const ux = Math.cos(lat) * Math.sin(lonP);
    const uy = Math.sin(lat);
    const uz = Math.cos(lat) * Math.cos(lonP);

    // Tangential direction for the scroll dissolve — perpendicular to the
    // surface direction so fragments peel off along the sphere's skin.
    const rvx = rand() - 0.5;
    const rvy = rand() - 0.5;
    const rvz = rand() - 0.5;
    let tx = uy * rvz - uz * rvy;
    let ty = uz * rvx - ux * rvz;
    let tz = ux * rvy - uy * rvx;
    const tl = Math.hypot(tx, ty, tz) || 1;
    tx /= tl;
    ty /= tl;
    tz /= tl;

    const big = land && rand() < bigChance;
    const frag = rand() < (w < 640 ? FRAGMENT_RATIO * 0.5 : FRAGMENT_RATIO);
    pts.push({
      ux,
      uy,
      uz,
      tx,
      ty,
      tz,
      radius: land
        ? (big ? 1.9 + rand() * 1.1 : 0.85 + rand() * 1.1)
        : 0.6 + rand() * 0.85,
      rot: rand() * Math.PI,
      rotSpeed: (rand() - 0.5) * 0.08,
      driftPhase: rand() * Math.PI * 2,
      driftSpeed: 0.3 + rand() * 0.7,
      color: land ? pickColor(rand) : rand() < 0.85 ? 0 : pickColor(rand),
      land,
      big,
      frag,
      fragAmp: 0.025 + rand() * 0.045,
      fragSpeed: 0.2 + rand() * 0.35,
      fragPhase: rand() * Math.PI * 2,
      sAmp: 0.5 + rand() * 1.0,
      tAmp: 0.25 + rand() * 0.5,
      shellR: 0.35 + rand() * 0.55,
      asmPhase: rand(),
      glow: 0,
    });
  }
  return pts;
}

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smooth = (t: number) => t * t * (3 - 2 * t);

export function TriEarth({
  className,
  progressRef,
}: {
  className?: string;
  progressRef?: RefObject<VisualProgress>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();
  const reduce = useReducedMotion();
  const paletteRef = useRef<string[]>(DARK_PALETTE);
  const glowRgbRef = useRef(DARK_GLOW_RGB);
  const renderRef = useRef<((ms: number, animated: boolean) => void) | null>(null);

  // Theme-aware refs — the Earth is never reseeded on toggle.
  useEffect(() => {
    const light = resolvedTheme === "light";
    paletteRef.current = light ? LIGHT_PALETTE : DARK_PALETTE;
    glowRgbRef.current = light ? LIGHT_GLOW_RGB : DARK_GLOW_RGB;
    renderRef.current?.(0, false);
  }, [resolvedTheme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: P[] = [];
    let w = 0;
    let h = 0;
    let scrollP = 0;
    const colorCount = paletteRef.current.length;
    const depthLayer = (z: number) =>
      Math.min(DEPTH_LAYERS - 1, Math.max(0, Math.floor(z * DEPTH_LAYERS)));

    // Per-particle per-frame state.
    let screenX = new Float32Array(0);
    let screenY = new Float32Array(0);
    let viewZ = new Float32Array(0);
    let sizeA = new Float32Array(0);
    let alphaA = new Float32Array(0);
    let dispX = new Float32Array(0);
    let dispY = new Float32Array(0);
    let targetDX = new Float32Array(0);
    let targetDY = new Float32Array(0);

    const measure = () => {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(rect.width, 1);
      h = Math.max(rect.height, 1);
    };

    const rebuild = () => {
      measure();
      // Density by viewport class — mobile gets a smaller globe, not a
      // scaled-down desktop one.
      const density = w < 640 ? 90 : w < 1024 ? 60 : 40;
      const min = w < 640 ? 700 : 1400;
      const max = w < 640 ? 2300 : w < 1024 ? 4600 : 8000;
      const count = Math.max(min, Math.min(max, Math.round((w * h) / density)));
      particles = buildEarth(count, w);
      const n = particles.length;
      screenX = new Float32Array(n);
      screenY = new Float32Array(n);
      viewZ = new Float32Array(n);
      sizeA = new Float32Array(n);
      alphaA = new Float32Array(n);
      dispX = new Float32Array(n);
      dispY = new Float32Array(n);
      targetDX = new Float32Array(n);
      targetDY = new Float32Array(n);
    };

    // Eased mouse target for the camera — same 0.1 factor as Dala.
    let camTargetX = 0;
    let camTargetY = 0;
    let camX = 0;
    let camY = 0;
    let cursorX = -1e4;
    let cursorY = -1e4;

    const render = (ms: number, animated: boolean) => {
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const bw = Math.round(w * dpr);
      const bh = Math.round(h * dpr);
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const s = animated ? ms / 1000 : 0;

      // Boot-up assembly + scroll progress.
      let asm = 1;
      let scr = 0;
      if (animated) {
        asm = 1 - Math.pow(1 - clamp01(ms / ASSEMBLY_MS), 3); // easeOutCubic
        const target = progressRef?.current?.current ?? 0;
        scrollP += (target - scrollP) * 0.07;
        scr = scrollP;
      }
      const sep = smooth(clamp01((scr - 0.5) / 0.5)); // dissolve, late
      const scale = 1 + scr * 0.3; // enlarges, then the camera moves closer

      // Camera — slow spin, breathing tilt, cursor-facing lean.
      if (animated) {
        camX += (camTargetX - camX) * 0.1;
        camY += (camTargetY - camY) * 0.1;
      }
      const rotY = s * ROT_SPEED + camX * 1.15;
      const rotX = BASE_TILT_X + SWAY_X * Math.sin(s * 0.13) + camY * 0.8;
      const cy = Math.cos(rotY);
      const sy = Math.sin(rotY);
      const cx = Math.cos(rotX);
      const sx = Math.sin(rotX);

      // Globe geometry — centered in the box, sized to ~46% of its width.
      const unit =
        Math.min(w * 0.46, h * 0.44) * scale * (1 + 0.012 * Math.sin(s * 0.25));
      const ox = w * 0.5 + camX * unit * 0.1;
      const oy = h * 0.5 + camY * unit * 0.1;
      const glyphScale = w < 640 ? 1.5 : 1;

      // Single projection pass — nodes read from arrays, so nothing projects
      // twice per frame. Drift is a few pixels in world space, applied once
      // along the y-axis before rotation so it reads as depth-correct motion.
      const n = particles.length;

      for (let i = 0; i < n; i++) {
        const p = particles[i];
        const pulse = p.frag
          ? p.fragAmp * (0.5 + 0.5 * Math.sin(s * p.fragSpeed + p.fragPhase)) * asm
          : 0;
        const wR =
          1 + p.shellR * (1 - asm) + pulse + sep * p.sAmp;
        const wx = p.ux * wR + p.tx * sep * p.tAmp;
        const wy = p.uy * wR + p.ty * sep * p.tAmp;
        const wz = p.uz * wR + p.tz * sep * p.tAmp;
        const drift = animated
          ? Math.sin(s * p.driftSpeed + p.driftPhase) * 0.035
          : 0;

        const px = wx * cy + wz * sy;
        let pz = -wx * sy + wz * cy;
        const pz2 = pz * cx + (wy + drift) * sx;
        const py = -pz * sx + (wy + drift) * cx;
        pz = pz2;

        // Far hemisphere is culled; the limb is foreshortened to slivers, so
        // the triangles themselves create the sphere's surface.
        if (pz <= 0.02) {
          viewZ[i] = -1; // mark invisible
          screenX[i] = 0;
          screenY[i] = 0;
          sizeA[i] = 0;
          alphaA[i] = 0;
          continue;
        }
        viewZ[i] = pz;
        screenX[i] = ox + px * unit;
        screenY[i] = oy + py * unit * 1.0;

        const sizeS = Math.pow(pz, 0.75);
        sizeA[i] = p.radius * sizeS * glyphScale * (p.land ? 1.12 : 0.7);

        const zAlpha = Math.pow(clamp01(pz * 1.7), 0.85) * (p.land ? 1 : 0.5);
        // Emergence stagger that reaches full brightness for EVERY triangle
        // once asm = 1 (the assembled Earth is uniformly bright).
        const appear = clamp01((asm * 1.4 - p.asmPhase) / 0.4);
        alphaA[i] = zAlpha * appear * (1 - sep * 0.5);
      }

      // Cursor push — nearby triangles move a few pixels away, eased.
      if (animated && cursorX > -1e3) {
        for (let i = 0; i < n; i++) {
          if (viewZ[i] < 0) continue;
          const ddx = screenX[i] - cursorX;
          const ddy = screenY[i] - cursorY;
          const d = Math.hypot(ddx, ddy);
          if (d < CURSOR_R) {
            const f = (1 - d / CURSOR_R) ** 2;
            const push = f * CURSOR_STRENGTH * (0.6 + viewZ[i] * 0.8);
            const inv = d || 1;
            targetDX[i] = (ddx / inv) * push;
            targetDY[i] = (ddy / inv) * push;
          } else {
            targetDX[i] = 0;
            targetDY[i] = 0;
          }
        }
        for (let i = 0; i < n; i++) {
          if (viewZ[i] < 0) continue;
          dispX[i] += (targetDX[i] - dispX[i]) * 0.12;
          dispY[i] += (targetDY[i] - dispY[i]) * 0.12;
          screenX[i] += dispX[i];
          screenY[i] += dispY[i];
        }
      } else if (!animated) {
        for (let i = 0; i < n; i++) {
          dispX[i] = 0;
          dispY[i] = 0;
        }
      }

      // Twinkles — the occasional bright land mote.
      if (animated) {
        for (const p of particles) p.glow *= GLOW_DECAY;
        if (Math.random() < TWINKLE_RATE && asm > 0.7) {
          for (let t = 0; t < 6; t++) {
            const idx = Math.floor(Math.random() * n);
            if (particles[idx].land) {
              particles[idx].glow = 1;
              break;
            }
          }
        }
      }

      // Paint back-to-front, batching into layer × colour × alpha-bucket
      // Path2D strokes — a bounded handful of draw calls per frame.
      const BUCKETS = 4;
      const groups = new Map<number, Path2D>();
      const step = (Math.PI * 2) / 3;

      for (let i = 0; i < n; i++) {
        if (viewZ[i] < 0 || alphaA[i] <= 0.01) continue;
        const p = particles[i];
        const layer = depthLayer(viewZ[i]);
        const bucket = Math.min(BUCKETS - 1, Math.floor(alphaA[i] * BUCKETS));
        const key = (layer * colorCount + p.color) * BUCKETS + bucket;
        let path = groups.get(key);
        if (!path) {
          path = new Path2D();
          groups.set(key, path);
        }
        const a = p.rot + (animated ? Math.sin(s * p.rotSpeed + p.driftPhase) * 0.18 : 0);
        const size = sizeA[i];
        path.moveTo(screenX[i] + Math.cos(a) * size, screenY[i] + Math.sin(a) * size);
        for (let k = 1; k < 3; k++) {
          path.lineTo(
            screenX[i] + Math.cos(a + step * k) * size,
            screenY[i] + Math.sin(a + step * k) * size,
          );
        }
        path.closePath();
      }

      const palette = paletteRef.current;
      ctx.lineWidth = 1;
      for (let layer = 0; layer < DEPTH_LAYERS; layer++) {
        for (let color = 0; color < colorCount; color++) {
          for (let bucket = 0; bucket < BUCKETS; bucket++) {
            const path = groups.get((layer * colorCount + color) * BUCKETS + bucket);
            if (!path) continue;
            ctx.globalAlpha = (bucket + 0.5) / BUCKETS;
            ctx.strokeStyle = palette[color];
            ctx.stroke(path);
          }
        }
      }

      // Atmosphere — a restrained rim: faint concentric arcs around the edge,
      // brightest at the limb, mostly invisible over the disk itself. Toned
      // down on mobile per the responsive brief.
      const atmoAlpha =
        clamp01((asm - 0.72) / 0.28) * (1 - sep) * (w < 640 ? 0.6 : 1);
      ctx.globalCompositeOperation = "lighter";
      const glowRgb = glowRgbRef.current;
      if (atmoAlpha > 0.01) {
        ctx.strokeStyle = `rgba(${glowRgb}, 1)`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
          const rr = unit * (1.015 + i * 0.03);
          ctx.globalAlpha = 0.085 * Math.pow(0.72, i) * atmoAlpha;
          ctx.beginPath();
          ctx.arc(ox, oy, rr, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 0.15 * atmoAlpha;
        ctx.beginPath();
        ctx.arc(ox, oy, unit * 1.012, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Twinkle halos — additive, so they read as light on land.
      const glowPath = new Path2D();
      const haloPath = new Path2D();
      for (let i = 0; i < n; i++) {
        const p = particles[i];
        if (p.glow < 0.04 || !p.land || viewZ[i] < 0) continue;
        const base = sizeA[i] * 1.4;
        const a = p.rot;
        for (const target of [haloPath, glowPath]) {
          const size = base * (target === glowPath ? 1.15 : 2.2);
          target.moveTo(screenX[i] + Math.cos(a) * size, screenY[i] + Math.sin(a) * size);
          for (let k = 1; k < 3; k++) {
            target.lineTo(
              screenX[i] + Math.cos(a + step * k) * size,
              screenY[i] + Math.sin(a + step * k) * size,
            );
          }
          target.closePath();
        }
      }
      ctx.strokeStyle = `rgb(${glowRgb})`;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.85;
      ctx.stroke(glowPath);
      ctx.globalAlpha = 0.2;
      ctx.stroke(haloPath);

      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    };
    renderRef.current = render;

    // Resize handling shared by both branches.
    let resizeTimer = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        rebuild();
        render(0, false);
      }, 140);
    });
    ro.observe(canvas);

    if (reduce) {
      rebuild();
      render(0, false);
      return () => {
        ro.disconnect();
        window.clearTimeout(resizeTimer);
        renderRef.current = null;
      };
    }

    const cursorOn = hasFinePointer() && window.innerWidth >= 768;
    const onPointer = (e: PointerEvent) => {
      if (cursorOn) {
        const rect = canvas.getBoundingClientRect();
        cursorX = e.clientX - rect.left;
        cursorY = e.clientY - rect.top;
      }
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      camTargetX = nx * 1.25;
      camTargetY = ny * 1.0;
    };
    const onLeave = () => {
      cursorX = -1e4;
      cursorY = -1e4;
      camTargetX = 0;
      camTargetY = 0;
    };

    let raf = 0;
    let clock = 0;
    let last = performance.now();
    let inView = true;
    let tabVisible = true;

    const loop = (t: number) => {
      clock += t - last;
      last = t;
      render(clock, true);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (raf || !inView || !tabVisible) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    rebuild();
    start();

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerleave", onLeave);

    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) start();
      else stop();
    });
    io.observe(canvas);

    const onVis = () => {
      tabVisible = !document.hidden;
      if (tabVisible) start();
      else stop();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      stop();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerleave", onLeave);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.clearTimeout(resizeTimer);
      renderRef.current = null;
    };
  }, [reduce, progressRef]);

  // Canvas is a replaced element with an intrinsic 300×150 size — `inset: 0`
  // alone won't stretch it, so always pin full width/height.
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn("h-full w-full", className)}
      style={{ display: "block" }}
    />
  );
}
