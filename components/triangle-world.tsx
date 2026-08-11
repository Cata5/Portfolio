"use client";

import { useEffect, useRef } from "react";

import { useTheme } from "next-themes";
import { useReducedMotion } from "motion/react";

import { hasFinePointer } from "@/lib/motion";
import { mulberry32, pickColor } from "@/lib/triangles";

/*
 * The global triangle scene. ONE fixed canvas behind the entire homepage
 * that owns every triangle on the page. The pieces are a persistent physical
 * material: as the user scrolls through the real sections, the same
 * instances continuously reshape themselves from one form into the next —
 * there is no separate animation inside any section, and nothing resets.
 *
 *   HERO     earth   the assembled globe, right of the type, holding while
 *                    the hero's short pin lets it breathe
 *   ABOUT    orbit   the globe dissolves into orbital rings beside the copy
 *   WORK     spiral  a 3D coil reaches through depth, framing the projects
 *   STACK    wave    a volumetric flowing surface beside the skills list   *   ML       brain   two lobes, fissure and fold texture — the AI beat
   *   CONTACT  final   the material collapses into a black hole — a tilted
   *                    accretion disc orbiting a dark event horizon with a
   *                    glowing photon rim, holding as the page closes
 *
 * Every handover between two forms is a full-screen dispersion: the pieces
 * detach from the structure, burst across the whole viewport in 3D, hold as
 * a floating field, then converge into the next form. Each boundary has its
 * own personality (gentle, rotational, directional, violent, soft), the
 * camera pulls back and recentres so the viewer is surrounded by the
 * material, and the whole sequence is scrubbed by scroll — perfectly
 * reversible, and the pieces are always trackable (nothing pops or fades
 * into a new place).
 *
 * Around all of it drifts a second, ambient layer: a sparse, dim, clustered
 * cloud of the same triangle material in the negative space — three depth
 * layers, slow organic drift, cursor parallax on fine pointers, and a
 * density that breathes with the sections. The main forms always dominate.
 *
 * The page measures its own section offsets (spacers from pinned sections
 * are already laid out by the time this effect runs), so the boundaries
 * always track the real content. Same palette, same triangle glyphs and
 * stroke treatment throughout. Reduced-motion renders nothing; mobile gets
 * fewer, larger pieces.
 */

// Exported so any page-level code can reference the shared world palette.
export const DARK_PALETTE = [
  "#8052ff", // electric iris — dominant (the portfolio's brand accent)
  "#b88815", // amber
  "#8d47b1", // magenta
  "#378877", // teal
  "#bc7899", // rose
  "#3a749d", // blue
  "#427548", // green
];
export const LIGHT_PALETTE = [
  "#5b2fd6",
  "#8a6410",
  "#6b2f8f",
  "#0f766e",
  "#8f4d63",
  "#1d4ed8",
  "#2f5d3a",
];
export const DARK_GLOW_RGB = "160,130,255"; // atmosphere rim + twinkles
export const LIGHT_GLOW_RGB = "91,47,214";

const DEPTH_LAYERS = 8;
const ROT_SPEED = 0.02; // rad/s — the material's resting rotation
const SWAY_X = 0.028;
const BASE_TILT_X = 0.14;
const ASSEMBLY_MS = 1900; // "world being generated" at load
const FRONT_LON = (-50 * Math.PI) / 180; // Atlantic-facing meridian at load
const OCEAN_KEEP = 0.11;
const LAND_KEEP = 0.94;
const FRAGMENT_RATIO = 0.06;
const TWINKLE_RATE = 0.002;
const GLOW_DECAY = 0.9;

/* Continents — soft ellipses [clon, clat, rw(°), rh(°)] in lat/lon space. */
const LAND: [number, number, number, number][] = [
  [-100, 52, 26, 18],
  [-100, 26, 13, 10],
  [-87, 13, 5, 8],
  [-42, 72, 9, 5], // Greenland
  [-152, 63, 9, 7], // Alaska
  [-60, -10, 13, 20],
  [-70, -32, 4.5, 13], // Chile / Patagonia taper
  [-55, -25, 7, 7],
  [-72, 3, 6, 6], // northern bulge
  [15, 50, 14, 11],
  [-4, 39, 4, 5], // Iberia
  [15, 63, 4.5, 7], // Scandinavia
  [13, 42, 2.5, 5], // Italy
  [22, 40, 3.5, 5], // Balkans / Greece
  [-3, 54, 3.5, 6], // British Isles
  [20, 5, 21, 24],
  [44, 8, 7, 7], // Horn
  [-6, 6, 9, 7], // West Africa bulge
  [23, -26, 6, 11], // southern taper
  [78, 48, 52, 24], // main mass — Siberia / Central Asia / China
  [78, 18, 6.5, 12], // India
  [45, 23, 7, 6], // Arabia
  [104, 11, 9, 7], // Indochina
  [119, -2, 9, 3], // Indonesia
  [123, 14, 3, 3], // Philippines
  [138, 37, 2.5, 6], // Japan
  [160, 56, 7, 5], // Kamchatka
  [176, 65, 7, 4], // Chukotka
  [134, -25, 15, 10],
  [172, -42, 2.5, 5], // New Zealand
];

type P = {
  ux: number;
  uy: number;
  uz: number;
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
  shellR: number;
  asmPhase: number;
  glow: number;
  f1: number;
  f2: number;
  f3: number;
  orbitRing: 0 | 1 | 2;
  orbitPhase: number;
};

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
 * tenth (sparse, dim). The land-dense set carries through every form as the
 * material's density variation.
 */
function buildEarth(count: number, w: number): P[] {
  const rand = mulberry32(20260810);
  const mobile = w < 640;
  const bigChance = mobile ? 0.03 : 0.04;
  const pts: P[] = [];
  const maxIter = count * 16;

  for (let i = 0; i < maxIter && pts.length < count; i++) {
    const lat = Math.asin(2 * rand() - 1);
    const lon = rand() * Math.PI * 2 - Math.PI;
    const land = isLand((lat * 180) / Math.PI, (lon * 180) / Math.PI);
    if (rand() > (land ? LAND_KEEP : OCEAN_KEEP)) continue;

    const lonP = lon - FRONT_LON;
    const ux = Math.cos(lat) * Math.sin(lonP);
    const uy = Math.sin(lat);
    const uz = Math.cos(lat) * Math.cos(lonP);

    const big = land && rand() < bigChance;
    const frag = rand() < (mobile ? FRAGMENT_RATIO * 0.5 : FRAGMENT_RATIO);
    pts.push({
      ux,
      uy,
      uz,
      radius: land
        ? big
          ? 8 + rand() * 5
          : 4.5 + rand() * 4.5
        : 3 + rand() * 3.5,
      rot: rand() * Math.PI,
      rotSpeed: (rand() - 0.5) * 0.08,
      driftPhase: rand() * Math.PI * 2,
      driftSpeed: 0.3 + rand() * 0.7,
      color: land ? pickColor(rand()) : rand() < 0.85 ? 0 : pickColor(rand()),
      land,
      big,
      frag,
      fragAmp: 0.025 + rand() * 0.045,
      fragSpeed: 0.2 + rand() * 0.35,
      fragPhase: rand() * Math.PI * 2,
      shellR: 0.35 + rand() * 0.55,
      asmPhase: rand(),
      glow: 0,
      f1: rand(),
      f2: rand(),
      f3: rand(),
      orbitRing: Math.floor(rand() * 3) as 0 | 1 | 2,
      orbitPhase: rand() * Math.PI * 2,
    });
  }
  return pts;
}

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

type V3 = { x: number; y: number; z: number };
type FormFn = (p: P, t: number, wR: number) => V3;

/* ---- Form layouts (front of the scene = +z, distance = −z) --------- */

/** Earth — the unit-sphere surface (with assembly shell + frag pulse). */
function earthForm(p: P, wR: number): V3 {
  return { x: p.ux * wR, y: p.uy * wR, z: p.uz * wR };
}

/** Orbital rings — three rings, different radii/depths, alternating spin. */
function orbitForm(p: P, t: number): V3 {
  const R = [0.62, 1.02, 1.42][p.orbitRing];
  const dir = p.orbitRing === 1 ? -1 : 1;
  const tilt = [-0.35, 0.55, -0.15][p.orbitRing];
  const ang = p.orbitPhase + t * 0.3 * dir + p.f3 * 0.2;
  const y = Math.sin(ang) * R * 0.55;
  const z = (p.orbitRing - 1) * 0.34 + Math.sin(ang * 2 + p.f1 * 6.283) * 0.05;
  return {
    x: Math.cos(ang) * R,
    y: y * Math.cos(tilt) - z * Math.sin(tilt),
    z: y * Math.sin(tilt) + z * Math.cos(tilt),
  };
}

/** Wave — a volumetric surface spanning width and depth, flowing in y. */
function waveForm(p: P, t: number): V3 {
  const x = (p.f1 - 0.5) * 3.4;
  const z = (p.f2 - 0.5) * 2.6;
  const y =
    Math.sin(x * 1.7 + t * 1.0) * 0.5 +
    Math.sin(z * 1.3 + t * 0.65) * 0.38 +
    (p.f3 - 0.5) * 0.16;
  return { x, y, z };
}

/** Spiral — an archimedean coil reaching from near the camera into the distance. */
function spiralForm(p: P, t: number): V3 {
  const turns = 2.7;
  const a0 = p.f1 * turns * Math.PI * 2;
  const rad = 0.14 + p.f1 * 0.6 + (p.f3 - 0.5) * 0.08;
  const a = a0 + t * 0.22;
  return {
    x: Math.cos(a) * rad,
    y: Math.sin(a) * rad * 0.92,
    z: 0.25 - p.f1 * 1.8 - (p.f3 - 0.5) * 0.25,
  };
}

/** Brain — two lobes with a central fissure and fold-wave texture. */
function brainForm(p: P, t: number): V3 {
  const side = p.f2 < 0.5 ? -1 : 1;
  const rr = Math.cbrt(p.f1) * 0.56;
  const ph = p.f2 * Math.PI * 2;
  const cp = 2 * p.f3 - 1;
  const s = Math.sqrt(1 - cp * cp);
  const sx = rr * s * Math.cos(ph);
  const sy = rr * s * Math.sin(ph);
  const sz = rr * cp;
  const fold =
    Math.sin(sx * 5 + t * 0.6) * 0.05 + Math.sin(sz * 6 - side * 1.3 + t * 0.4) * 0.045;
  return {
    x: side * 0.5 + sx * 0.92,
    y: sy * 1.3 + fold + (side > 0 ? 0.06 : -0.06),
    z: sz * 0.95,
  };
}

/**
 * Final — a black hole. Most pieces orbit a tilted accretion disc with
 * keplerian shear (inner pieces circle faster); a fraction spiral inward
 * past the photon ring, dimming as they are swallowed by the event horizon
 * (drawn as a dark disc + glowing rim on the canvas).
 */
function finalForm(p: P, t: number): V3 {
  const tilt = 0.42; // disc inclination — gives the ellipse-on-screen read
  if (p.f3 > 0.78) {
    // Infalling piece — spirals from the disc edge toward the horizon,
    // with a slow radial wobble so the swallow reads as converging, not
    // just orbiting a smaller circle.
    const r = 0.24 + (1 - p.f2) * 0.5 + Math.sin(t * 0.2 + p.f1 * 6.283) * 0.05;
    const ang = p.f1 * Math.PI * 2 + t * 0.45 + p.f2 * 6.283;
    const x = Math.cos(ang) * r;
    const y = Math.sin(ang) * r * Math.cos(tilt) * 0.8 + (p.f2 - 0.5) * 0.1;
    const z = Math.sin(ang) * r * Math.sin(tilt);
    return { x, y, z };
  }
  // Accretion disc — radius spread around the horizon, thin in y, spinning
  // with keplerian shear: the inner edge races ahead of the outer.
  const r = 0.3 + p.f2 * 0.8;
  const ang = p.f1 * Math.PI * 2 + t * (0.34 / (0.3 + r)) + p.f3 * 0.4;
  const x = Math.cos(ang) * r;
  const y = Math.sin(ang) * r * Math.cos(tilt) + (p.f3 - 0.5) * 0.06;
  const z = Math.sin(ang) * r * Math.sin(tilt) + (p.f2 - 0.5) * 0.12;
  return { x, y, z };
}

const FORM_FNS: FormFn[] = [
  (p, _t, wR) => earthForm(p, wR),
  (p, t) => orbitForm(p, t),
  (p, t) => spiralForm(p, t),
  (p, t) => waveForm(p, t),
  (p, t) => brainForm(p, t),
  (p, t) => finalForm(p, t),
];

/* ---- Full-screen dispersion ----------------------------------------- */

/*
 * Every handover between forms runs a phase sequence over its window:
 *
 *   p ∈ [0, 0.4]   disassemble — pieces leave form A toward dispersion
 *   p ∈ [0.4, 0.6] hold — the viewport is filled with drifting fragments
 *   p ∈ [0.6, 1]   reorganize — the same pieces converge into form B
 *
 * The dispersion targets are seeded per piece (deterministic, scrubbed), so
 * the explosion is always reproducible and perfectly reversible.
 */

type DispStyle = {
  spread: number; // radial spread multiplier
  camera: number; // zoom pull-back at full dispersion (lower = more pulled back)
  near: number; // extra depth boost for near pieces
  alpha: number; // alpha multiplier at full dispersion
  sweep: number; // horizontal directional bias
  turn: number; // rotational bias
  swell: number; // foreground size swell
};

const DISP_STYLES: DispStyle[] = [
  // about — Earth → orbit: pieces detach gently, staying close to the frame
  { spread: 0.55, camera: 0.94, near: 0.02, alpha: 1.22, sweep: 0, turn: 0.2, swell: 2.2 },
  // work — orbit → spiral: strong rotational burst
  { spread: 1.0, camera: 0.86, near: 0.1, alpha: 1.35, sweep: 0.2, turn: 1.0, swell: 3.0 },
  // stack — spiral → wave: a directional sweep across the viewport
  { spread: 1.12, camera: 0.82, near: 0.15, alpha: 1.42, sweep: 1.0, turn: 0.2, swell: 3.4 },
  // ml — wave → brain: violent, deep, foreground-heavy
  { spread: 1.25, camera: 0.78, near: 0.25, alpha: 1.52, sweep: 0.4, turn: 0.6, swell: 4.4 },
  // contact — brain → final: a soft, calm dissolve
  { spread: 0.45, camera: 0.96, near: 0, alpha: 1.12, sweep: 0, turn: 0.1, swell: 1.8 },
  // footer — final → void: the world gently disperses and fades away
  { spread: 0.5, camera: 0.98, near: 0, alpha: 1.05, sweep: 0, turn: 0.1, swell: 1.5 },
];

/** Seeded per-piece dispersion destination in world space. */
function dispersionTarget(p: P, st: DispStyle, t: number): V3 {
  const ang = p.f1 * Math.PI * 2 + st.turn * (p.f2 - 0.5) * 1.4;
  const rad = (0.5 + p.f2 * 1.35) * st.spread;
  let x = Math.cos(ang) * rad + st.sweep * (p.f3 - 0.5) * 1.7;
  let y = Math.sin(ang) * rad * 0.72 + (p.f3 - 0.5) * 0.55;
  let z = 0.12 + p.f3 * 0.8 + st.near * p.f2 * 0.2;
  // The dispersed field floats and drifts slowly — deterministic, smooth.
  x += Math.sin(t * 0.055 + p.f1 * 6.283) * 0.07;
  y += Math.cos(t * 0.045 + p.f2 * 6.283) * 0.055;
  z = clamp01(z + Math.sin(t * 0.04 + p.f3 * 6.283) * 0.045);
  return { x, y, z };
}

/* ---- Ambient layer --------------------------------------------------- */

/*
 * A second, much quieter cloud of the same triangle material that fills the
 * negative space of the whole page. Three depth layers (far / mid / near),
 * natural clustering with empty regions, extremely slow independent drift,
 * and parallax that scales with depth. It never competes with the forms.
 */

type Ambient = {
  bx: number;
  by: number;
  bz: number;
  size: number;
  speed: number;
  ph: number;
  dir: number;
  rot: number;
  rotSpeed: number;
  color: number;
  pull: number; // 0..1 — a few pieces lean toward the main structure mid-dispersion
  layer: number; // 0 far · 1 mid · 2 near
};

function buildAmbient(count: number): Ambient[] {
  const rand = mulberry32(7733551);
  const clusters = Array.from({ length: 7 }, () => ({
    x: (rand() - 0.5) * 2.7,
    y: (rand() - 0.5) * 1.7,
    r: 0.14 + rand() * 0.5,
  }));
  const pts: Ambient[] = [];
  for (let i = 0; i < count; i++) {
    let bx: number;
    let by: number;
    if (rand() < 0.88) {
      const c = clusters[Math.floor(rand() * clusters.length)];
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * c.r;
      bx = c.x + Math.cos(a) * r;
      by = c.y + Math.sin(a) * r * 0.8;
    } else {
      bx = (rand() - 0.5) * 2.9;
      by = (rand() - 0.5) * 1.8;
    }
    const layer = rand() < 0.45 ? 0 : rand() < 0.8 ? 1 : 2;
    const bz =
      layer === 0
        ? 0.05 + rand() * 0.25
        : layer === 1
          ? 0.3 + rand() * 0.35
          : 0.65 + rand() * 0.3;
    pts.push({
      bx,
      by,
      bz,
      size: (layer === 0 ? 1.4 : layer === 1 ? 2.0 : 2.8) + rand() * 1.1,
      speed: 0.02 + rand() * 0.06,
      ph: rand() * Math.PI * 2,
      dir: rand() * Math.PI * 2,
      rot: rand() * Math.PI,
      rotSpeed: (rand() - 0.5) * 0.06,
      color: pickColor(rand()),
      pull: rand() < 0.2 ? 0.35 + rand() * 0.65 : 0,
      layer,
    });
  }
  return pts;
}

/* ---- Section-boundary form windows --------------------------------- */

/*
 * The measured top of each section is a handover boundary: form i hands over
 * to form i+1 across a window centred on the top of the next section. Inside
 * the window the pieces run the full dispersion sequence; outside it, the
 * owning form simply lives. Windows never overlap, so the material is never
 * empty and never pops. The half-width derives from the gap between the
 * sections, so tight sections disperse quickly and spread-out ones get a
 * long, cinematic transformation.
 */

type FormDef = {
  key: string;
  /** Composition — screen-x fraction (earth uses a responsive value), screen-y fraction, zoom, size. */
  cx: number;
  oy: number;
  zoom: number;
  size: number;
};

const FORMS: FormDef[] = [
  { key: "earth", cx: 0, oy: 0.5, zoom: 1, size: 1 },
  { key: "orbit", cx: 0.66, oy: 0.5, zoom: 1, size: 0.95 },
  { key: "spiral", cx: 0.5, oy: 0.48, zoom: 1.05, size: 1 },
  { key: "wave", cx: 0.5, oy: 0.34, zoom: 1, size: 0.9 },
  { key: "brain", cx: 0.5, oy: 0.5, zoom: 1.1, size: 1 },
  { key: "final", cx: 0.72, oy: 0.5, zoom: 0.9, size: 0.9 },
];

/** boundary[i] = the scroll position where form i hands over to form i+1. */
const BOUNDARY_KEYS: ("about" | "work" | "stack" | "ml" | "contact" | "footer")[] = [
  "about",
  "work",
  "stack",
  "ml",
  "contact",
  "footer",
];

const smoothstep = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};
const rise = (y: number, b: number, w: number) => smoothstep((y - (b - w)) / (2 * w));
const fall = (y: number, b: number, w: number) => 1 - rise(y, b, w);

/**
 * One fixed canvas behind the whole page — the only triangle scene there is.
 * Sections provide content and boundaries; this scene owns the material.
 */
export function TriangleWorld() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();
  const reduce = !!useReducedMotion();
  const paletteRef = useRef<string[]>(DARK_PALETTE);
  const glowRgbRef = useRef(DARK_GLOW_RGB);
  const renderRef = useRef<((ms: number, animated: boolean) => void) | null>(null);

  useEffect(() => {
    const light = resolvedTheme === "light";
    paletteRef.current = light ? LIGHT_PALETTE : DARK_PALETTE;
    glowRgbRef.current = light ? LIGHT_GLOW_RGB : DARK_GLOW_RGB;
    renderRef.current?.(0, false);
  }, [resolvedTheme]);

  useEffect(() => {
    if (reduce) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let particles: P[] = [];
    let ambient: Ambient[] = [];
    const anchors: Record<string, number> = {};
    const colorCount = DARK_PALETTE.length;
    const depthLayer = (z: number) =>
      Math.min(DEPTH_LAYERS - 1, Math.max(0, Math.floor(z * DEPTH_LAYERS)));

    let screenX = new Float32Array(0);
    let screenY = new Float32Array(0);
    let viewZ = new Float32Array(0);
    let sizeA = new Float32Array(0);
    let alphaA = new Float32Array(0);
    // Cached (scrollHeight forces a reflow — never read it in the hot path).
    let maxScroll = 0;

    let tSec = 0;
    let last = performance.now();
    let raf = 0;
    let tabVisible = true;
    let resizeTimer = 0;
    // Subtle pointer parallax — the material leans toward the cursor (fine
    // pointers only), restoring the physical-object feel of the old hero.
    let mouseX = 0;
    let mouseY = 0;
    // A faster-smoothed cursor pair drives the per-piece repulsion, so the
    // main motes push away from the pointer more responsively than the
    // slow camera parallax above. The push only engages after the pointer
    // has actually moved — repX/repY start at 0 (screen centre), so without
    // the gate the globe would get a static dent on load.
    let repX = 0;
    let repY = 0;
    let pointerMoved = false;
    let targetX = 0;
    let targetY = 0;
    const fine = hasFinePointer() && window.innerWidth >= 768;

    const measure = () => {
      const pick = (id: string) => {
        const el = document.getElementById(id);
        return el ? el.getBoundingClientRect().top + window.scrollY : 0;
      };
      anchors.about = pick("about");
      anchors.work = pick("work");
      anchors.stack = pick("stack");
      anchors.ml = pick("ml-notebook") || pick("ml") || 0;
      anchors.contact = pick("contact");
      const footerEl = document.querySelector("footer");
      anchors.footer = footerEl
        ? footerEl.getBoundingClientRect().top + window.scrollY
        : 0;
      maxScroll = Math.max(
        0,
        (document.documentElement.scrollHeight || 0) - (window.innerHeight || h),
      );
    };

    const rebuild = () => {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(rect.width, 1);
      h = Math.max(rect.height, 1);
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      const density = w < 640 ? 460 : w < 1024 ? 520 : 560;
      const min = w < 640 ? 400 : w < 1024 ? 900 : 1800;
      const max = w < 640 ? 1100 : w < 1024 ? 2400 : 3200;
      const count = Math.max(min, Math.min(max, Math.round((w * h) / density)));
      particles = buildEarth(count, w);
      // Ambient stays a background layer, but it must be visible — 120–190
      // on desktop, scaled down on mobile.
      ambient = buildAmbient(w < 640 ? 58 : w < 1024 ? 120 : 185);
      const n = particles.length;
      screenX = new Float32Array(n);
      screenY = new Float32Array(n);
      viewZ = new Float32Array(n);
      sizeA = new Float32Array(n);
      alphaA = new Float32Array(n);
      measure();
    };

    const render = (ms: number, animated: boolean) => {
      if (!w || !h) return;
      const bw = Math.round(w * dpr);
      const bh = Math.round(h * dpr);
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const s = animated ? ms / 1000 : 0;
      let asm = 1;
      if (animated) {
        asm = 1 - Math.pow(1 - clamp01(ms / ASSEMBLY_MS), 3);
      }
      const y = window.scrollY;
      const ih = window.innerHeight || h;

      // ---- Form weights (section-boundary windows) -------------------
      // The contact and footer section tops sit below the point where the
      // page runs out of scroll, so the closing act is repositioned into the
      // reachable range — the final dispersion must complete while the user
      // can still scroll, leaving the calm final gather holding at the bottom.
      const rawB = BOUNDARY_KEYS.map((key, i) => {
        let v = 0;
        if (key === "ml") v = anchors.ml || 0;
        else if (key === "footer") v = anchors.footer || 0;
        else v = anchors[key] ?? 0;
        if (v > 0) return v;
        // Missing section id — fall forward to the next boundary that
        // exists so the handover skips instead of collapsing to the top.
        for (let j = i + 1; j < BOUNDARY_KEYS.length; j++) {
          const k = BOUNDARY_KEYS[j];
          const w2 =
            k === "ml" ? anchors.ml : k === "footer" ? anchors.footer : anchors[k];
          if (w2 && w2 > 0) return w2;
        }
        return anchors.contact || 0;
      });
      const B = rawB.map((v, i) => {
        // The contact → final dispersion needs to finish while the user can
        // still scroll, so it moves back into reach.
        if (i === BOUNDARY_KEYS.length - 2) {
          return Math.min(v, Math.max(maxScroll - 0.85 * ih, rawB[i - 1] + 1.2 * ih));
        }
        return v;
      });
      const halfW = B.map((b, i) => {
        const prevGap = i === 0 ? b : b - B[i - 1];
        const nextGap = i === B.length - 1 ? Math.max(prevGap, ih) : B[i + 1] - b;
        const room = Math.max(1, Math.min(prevGap, nextGap));
        const roomVH = room / ih;
        // Wide, gentle handovers — every transition gets 1.1–2.8 viewport
        // heights of scroll so the dispersion reads as a slow, linear reel
        // instead of a sudden burst.
        const wVH = Math.max(0.55, Math.min(1.4, roomVH * 0.45));
        return Math.min(room / 2, wVH * ih);
      });
      const weights = FORMS.map((_, i) => {
        const inW = i === 0 ? 1 : rise(y, B[i - 1], halfW[i - 1]);
        const outW = fall(y, B[i], halfW[i]);
        return inW * outW;
      });
      const total = weights.reduce((a, b) => a + b, 0);
      if (total <= 0.02) return; // after the last handover (footer fades the world out)

      const fw = weights.map((x) => x / total);
      const wEarth = fw[0];
      const wOrbit = fw[1];
      const wSpiral = fw[2];
      const wWave = fw[3];
      const wBrain = fw[4];
      const wFinal = fw[5];

      const ACTIVE = fw
        .map((weight, i) => ({ weight, i }))
        .filter((f) => f.weight > 0.001);

      // Depth handling blended by the earth weight — the globe hides its far
      // hemisphere, the forms normalise a wider z range to 0..1 so far pieces
      // stay visible as small, dim shards.
      const depthFx =
        wSpiral * 0.5 + wWave * 0.18 + wBrain * 0.4 + wFinal * 0.3;

      // ---- Active dispersion (the boundary currently being crossed) ---
      let dispI = -1;
      let dispP = 0;
      for (let i = 0; i < B.length; i++) {
        if (y >= B[i] - halfW[i] && y <= B[i] + halfW[i]) {
          dispI = i;
          // Plain linear ramp — constant scroll velocity through the whole
          // transformation (the user's "smooth and linear" ask).
          dispP = clamp01((y - (B[i] - halfW[i])) / (2 * halfW[i]));
          break;
        }
      }
      const dispStyle = dispI >= 0 ? DISP_STYLES[dispI] : null;
      // Phase progress is LINEAR in scroll: dispP is a plain ramp (no
      // smoothstep envelope), so every pixel of scroll moves the pieces the
      // same distance — constant, scrubbed, reversible motion. The pieces
      // fade in and out gently via dispVis so the reel still starts and
      // ends softly, but position travels at a steady pace throughout.
      const t1 = dispI >= 0 ? clamp01(dispP / 0.42) : 0; // A → dispersion
      const t2 = dispI >= 0 ? clamp01((dispP - 0.58) / 0.42) : 0; // dispersion → B
      const dispVis =
        dispI >= 0 ? (dispP < 0.58 ? smoothstep(clamp01(dispP / 0.5)) : 1 - t2) : 0;
      const dispCam = dispI >= 0 ? (dispP < 0.58 ? clamp01(dispP / 0.42) : 1 - t2) : 0;

      // ---- Camera / composition -------------------------------------
      // The Earth's hold is scroll-driven too: while the globe owns the
      // scene (from the top of the page to where its dispersion begins) the
      // scroll progressively turns the globe and pulls the camera closer, so
      // scrolling always animates — there is never a dead stretch before the
      // handover. Progress is linear: every pixel of scroll turns the globe
      // by the same amount, so the motion is constant and scrubbed.
      const earthHoldEnd = Math.max(B[0] - halfW[0], 1);
      const earthProg = clamp01(y / earthHoldEnd);
      const rotY =
        s * ROT_SPEED +
        (y / (anchors.footer || 1)) * 0.5 +
        earthProg * wEarth * 0.9; // the globe turns with the hero scroll
      const rotX =
        BASE_TILT_X + SWAY_X * Math.sin(s * 0.13) + (fine ? mouseX * 0.06 : 0);
      const cy = Math.cos(rotY);
      const sy = Math.sin(rotY);
      const cx = Math.cos(rotX);
      const sx = Math.sin(rotX);

      // Earth keeps its poster framing (right of the hero type); the other
      // forms sit where their section wants them. Composition blends by the
      // same normalised weights as the piece positions, so the whole scene —
      // position AND camera — moves as one.
      const earthCx = w < 640 ? 0.5 : w < 1024 ? 0.64 : 0.73;
      const cxBlend = fw.reduce((acc, wgt, i) => {
        const c = i === 0 ? earthCx : w < 640 ? 0.5 : FORMS[i].cx;
        return acc + wgt * c;
      }, 0);
      const oyBlend = fw.reduce((acc, wgt, i) => {
        // On mobile every form is centred behind the content, so the wave
        // drops low enough to stay clear of the Stack heading.
        const oy = w < 640 && FORMS[i].key === "wave" ? 0.66 : FORMS[i].oy;
        return acc + wgt * oy;
      }, 0);
      const zoom = fw.reduce((acc, wgt, i) => acc + wgt * FORMS[i].zoom, 0);
      const sizeMul = fw.reduce((acc, wgt, i) => acc + wgt * FORMS[i].size, 0);

      const visualW = w < 640 ? w : w < 1024 ? w * 0.72 : w * 0.54;
      const baseUnit =
        Math.min(visualW * 0.46, h * 0.44) *
        zoom *
        sizeMul *
        (1 + 0.012 * Math.sin(s * 0.25)) *
        (1 + earthProg * wEarth * 0.14); // the camera glides closer on scroll
      // During dispersion the camera pulls back and recentres so the viewer
      // is surrounded by fragments.
      const pull = dispStyle ? dispStyle.camera : 1;
      const unit = baseUnit * (1 - dispCam * (1 - pull));
      const cxEff = 0.5 + (cxBlend - 0.5) * (1 - dispCam);
      const oyEff = 0.5 + (oyBlend - 0.5) * (1 - dispCam);

      if (fine) {
        mouseX += (targetX - mouseX) * 0.045;
        mouseY += (targetY - mouseY) * 0.045;
        repX += (targetX - repX) * 0.1;
        repY += (targetY - repY) * 0.1;
      }
      const ox = w * cxEff + (fine ? mouseX * unit * 0.07 : 0);
      const oy = h * oyEff + (fine ? mouseY * unit * 0.055 : 0);
      const glyphScale = w < 640 ? 1.15 : 1;
      const palette = paletteRef.current;

      // ---- Ambient layer — drawn first, under everything -------------
      ctx.globalCompositeOperation = "source-over";
      ctx.lineWidth = 1;
      const aStep = (Math.PI * 2) / 3;
      const ambientMod =
        clamp01(0.95 + 0.25 * wSpiral + 0.1 * wBrain - 0.3 * wFinal) *
        (w < 640 ? 0.85 : 1);
      const aUnit = unit * 1.2;
      const aOx = w * 0.5;
      const aOy = h * 0.5;
      const ambientBase = [0.16, 0.24, 0.32]; // far / mid / near
      for (const a of ambient) {
        if (w < 640 && a.layer === 0) continue; // mobile keeps mid + near
        const t = s * a.speed;
        const amp = a.layer === 0 ? 0.05 : a.layer === 1 ? 0.08 : 0.12;
        let ax =
          a.bx + Math.sin(t * 0.5 + a.ph) * amp + Math.cos(s * 0.025 + a.dir) * 0.03;
        let ay =
          a.by +
          Math.cos(t * 0.42 + a.ph * 1.7) * amp * 0.8 +
          Math.sin(s * 0.02 + a.dir) * 0.03;
        // Gentle scroll sway — far pieces barely move, near ones breathe more.
        ay += Math.sin(y * 0.00035 + a.ph * 2) * 0.04 * (0.4 + a.bz * 0.9);
        let az = clamp01(a.bz + Math.sin(t * 0.3 + a.ph * 2.3) * amp * 0.5);
        // A few pieces lean toward the main structure while it disperses.
        if (a.pull > 0 && dispVis > 0.02) {
          const k = a.pull * dispVis * 0.5;
          ax += (0 - ax) * k;
          ay += (0 - ay) * k;
          az += (0.4 - az) * k;
        }
        // Black hole gravity — as the final form takes the scene, ambient
        // motes drift toward the hole and dim as they fall past the rim,
        // so the whole page quietly drains into the singularity.
        let swallowed = 1;
        if (wFinal > 0.3) {
          const g = clamp01((wFinal - 0.3) / 0.5);
          const hx = (ox - aOx) / aUnit;
          const hy = (oy - aOy) / aUnit;
          const d = Math.hypot(ax - hx, ay - hy);
          const pull = g * 0.4 * clamp01(1.15 - d);
          ax += (hx - ax) * pull * 0.3;
          ay += (hy - ay) * pull * 0.3;
          swallowed = clamp01((d - 0.1) / 0.22); // fade just before the rim
        }
        const parK = 0.35 + az * 0.9; // far pieces move less with the pointer
        const sx = aOx + ax * aUnit + (fine ? mouseX * unit * 0.05 * parK : 0);
        const sy = aOy + ay * aUnit + (fine ? mouseY * unit * 0.04 * parK : 0);
        const size = a.size * (0.5 + az * 1.2) * glyphScale;
        const flick = 0.72 + 0.28 * Math.sin(t * 1.4 + a.ph * 3);
        const alpha =
          ambientBase[a.layer] *
          ambientMod *
          flick *
          (asm * 0.9 + 0.1) *
          (1 + dispVis * 0.35) *
          swallowed *
          (w < 640 ? 0.9 : 1);
        if (alpha <= 0.012) continue;
        const ang = a.rot + s * a.rotSpeed;
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = palette[a.color];
        ctx.beginPath();
        ctx.moveTo(sx + Math.cos(ang) * size, sy + Math.sin(ang) * size);
        for (let k = 1; k < 3; k++) {
          ctx.lineTo(
            sx + Math.cos(ang + aStep * k) * size,
            sy + Math.sin(ang + aStep * k) * size,
          );
        }
        ctx.closePath();
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // ---- Projection ------------------------------------------------
      const n = particles.length;
      const lastBoundary = dispI === B.length - 1;
      for (let i = 0; i < n; i++) {
        const p = particles[i];
        const pulse = p.frag
          ? p.fragAmp * (0.5 + 0.5 * Math.sin(s * p.fragSpeed + p.fragPhase)) * asm
          : 0;
        const wR = 1 + p.shellR * (1 - asm) + pulse;

        let wx = 0;
        let wy = 0;
        let wz = 0;
        if (dispStyle) {
          // Phase sequence: form A → dispersion → form B (or the void at the
          // footer boundary). Positions always interpolate — pieces travel,
          // they never vanish.
          const A = FORM_FNS[dispI](p, s, wR);
          const D = dispersionTarget(p, dispStyle, s);
          const Bform = lastBoundary ? D : FORM_FNS[dispI + 1](p, s, wR);
          const t = dispP < 0.58 ? t1 : t2;
          const from = dispP < 0.58 ? A : D;
          const to = dispP < 0.58 ? D : Bform;
          wx = from.x + (to.x - from.x) * t;
          wy = from.y + (to.y - from.y) * t;
          wz = from.z + (to.z - from.z) * t;
        } else {
          for (const f of ACTIVE) {
            const q = FORM_FNS[f.i](p, s, wR);
            wx += f.weight * q.x;
            wy += f.weight * q.y;
            wz += f.weight * q.z;
          }
        }

        const drift = animated
          ? Math.sin(s * p.driftSpeed + p.driftPhase) * 0.035
          : 0;

        const px0 = wx * cy + wz * sy;
        let pz0 = -wx * sy + wz * cy;
        const pz02 = pz0 * cx + (wy + drift) * sx;
        const py0 = -pz0 * sx + (wy + drift) * cx;
        pz0 = pz02;

        const depth = clamp01(
          clamp01(pz0) * wEarth + clamp01((pz0 + 1.7) / 2.7) * (1 - wEarth),
        );
        if (depth <= 0.005) {
          viewZ[i] = -1;
          screenX[i] = 0;
          screenY[i] = 0;
          sizeA[i] = 0;
          alphaA[i] = 0;
          continue;
        }
        viewZ[i] = depth;

        const sizeS = Math.pow(depth, 0.75);
        const baseSize = p.radius * sizeS * glyphScale * (p.land ? 1.12 : 0.7);

        // Foreground pieces swell — the depth effect and, much harder, the
        // dispersion's near pieces passing the camera.
        const swell =
          1 +
          depthFx * Math.max(0, depth - 0.7) * 2.6 +
          (dispStyle
            ? dispVis * dispStyle.swell * Math.max(0, depth - 0.55)
            : 0);
        sizeA[i] = Math.min(baseSize * swell, unit * (dispStyle ? 0.62 : 0.34));
        const mag = 1 + depthFx * Math.max(0, depth - 0.9) * 1.3;
        screenX[i] = ox + px0 * unit * mag;
        screenY[i] = oy + py0 * unit * mag;

        // The main motes react to the cursor — a soft repulsion: pieces
        // within a radius of the pointer are pushed aside, scaled by depth
        // (near pieces move more, far ones barely). Fine pointers only, only
        // after the pointer has moved, and deliberately weaker than the
        // forms so the scroll story stays boss.
        if (fine && pointerMoved) {
          const dx = screenX[i] - ((repX + 0.5) * w);
          const dy = screenY[i] - ((repY + 0.5) * h);
          const rad = unit * 1.15;
          const d2 = dx * dx + dy * dy;
          if (d2 < rad * rad && d2 > 1e-6) {
            const d = Math.sqrt(d2);
            const fall = Math.pow(1 - d / rad, 2);
            const push = fall * unit * 0.22 * (0.35 + depth * 0.85);
            screenX[i] += (dx / d) * push;
            screenY[i] += (dy / d) * push;
          }
        }

        // Lighting follows the form — same palette, different treatment.
        const zAlpha =
          Math.pow(clamp01(pz0 * 1.7), 0.85) *
            (p.land ? 1 : 0.5) *
            wEarth *
            (w < 640 ? 0.8 : 1) +
          Math.pow(clamp01(0.16 + depth * 1.25), 0.9) *
            (p.land ? 1 : 0.72) *
            (1 - wEarth) *
            (w < 640 ? 0.55 : 1);
        const appear = clamp01((asm * 1.4 - p.asmPhase) / 0.4);
        let light = 1;
        if (wOrbit > 0.05) light *= 0.72 + 0.28 * Math.abs(Math.sin(p.orbitPhase + s * 0.3));
        if (wWave > 0.05) light *= 0.72 + 0.28 * (0.5 + 0.5 * Math.sin((p.f1 - 0.5) * 3.4 * 1.7 + s * 1.0));
        if (wSpiral > 0.05) light *= 0.55 + 0.45 * depth;
        if (wBrain > 0.05) light *= 0.78 + 0.14 * Math.sin(s * 0.5 + p.f1 * 6.283);
        // The black hole: the accretion disc's inner edge glows hot and
        // cools outward; infalling pieces stay bright at the rim and dim as
        // they spiral toward the horizon and are swallowed.
        if (wFinal > 0.05) {
          if (p.f3 > 0.78) {
            light *= 0.3 + 0.7 * (1 - p.f2); // brighter far out, dim near the hole
          } else {
            light *= 0.55 + 0.45 * (1 - p.f2); // inner disc hot, outer cool
          }
        }
        const dispBoost = dispStyle ? 1 + (dispStyle.alpha - 1) * dispVis : 1;
        // The final handover (world → void) disperses into transparency over
        // the second half of its window instead of snapping off at the end.
        const tailFade = lastBoundary
          ? 1 - smoothstep(clamp01((dispP - 0.5) / 0.5))
          : 1;
        alphaA[i] = zAlpha * appear * light * dispBoost * tailFade;
      }

      // Twinkles — the occasional bright land mote (Earth form only).
      if (animated && wEarth > 0.5 && asm > 0.7) {
        for (const p of particles) p.glow *= GLOW_DECAY;
        if (Math.random() < TWINKLE_RATE) {
          for (let t = 0; t < 6; t++) {
            const idx = Math.floor(Math.random() * n);
            if (particles[idx].land) {
              particles[idx].glow = 1;
              break;
            }
          }
        }
      }

      // Paint back-to-front, batched into layer × colour × alpha-bucket
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
        const a =
          p.rot + (animated ? Math.sin(s * p.rotSpeed + p.driftPhase) * 0.18 : 0);
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

      const glowRgb = glowRgbRef.current;

      // Black hole — the closing form's event horizon. Drawn after the
      // pieces so the dark disc occludes motes orbiting behind it; the
      // photon rim and a soft glow keep it reading as a hole, not a void.
      const holeAlpha = clamp01((wFinal - 0.35) / 0.5) * (w < 640 ? 0.9 : 1);
      if (holeAlpha > 0.01) {
        const hx = ox;
        const hy = oy;
        // World-space horizon radius — just inside the disc's inner edge.
        const hr = unit * 0.26;
        ctx.globalCompositeOperation = "source-over";
        const grad = ctx.createRadialGradient(hx, hy, 0, hx, hy, hr);
        grad.addColorStop(0, "rgba(0, 0, 0, 0.98)");
        grad.addColorStop(0.72, "rgba(0, 0, 0, 0.92)");
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.globalAlpha = holeAlpha;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(hx, hy, hr, 0, Math.PI * 2);
        ctx.fill();
        // Photon rim — the bright ring that bends light around the shadow,
        // drawn a touch wider so it bridges the gap to the inner disc edge.
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = `rgba(${glowRgb}, 1)`;
        ctx.lineWidth = 1.4;
        ctx.globalAlpha = 0.5 * holeAlpha;
        ctx.beginPath();
        ctx.arc(hx, hy, hr * 1.08, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 3.4;
        ctx.globalAlpha = 0.28 * holeAlpha;
        ctx.beginPath();
        ctx.arc(hx, hy, hr * 1.3, 0, Math.PI * 2);
        ctx.stroke();
        // Soft outer glow so the hole sits in the scene rather than on it.
        ctx.lineWidth = 4;
        ctx.globalAlpha = 0.16 * holeAlpha;
        ctx.beginPath();
        ctx.arc(hx, hy, hr * 1.7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.globalAlpha = 1;
      }

      // Atmosphere — the globe's rim, present only while the Earth owns the
      // scene.
      const atmoAlpha =
        clamp01((asm - 0.72) / 0.28) * wEarth * (w < 640 ? 0.6 : 1);
      ctx.globalCompositeOperation = "lighter";
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

      // Form light — near pieces of the spiral, brain and final form catch
      // the glow additively, so the depth feels lit rather than flat.
      const fragGlow = new Path2D();
      if (wSpiral + wBrain + wFinal > 0.25) {
        for (let i = 0; i < n; i++) {
          const p = particles[i];
          if (viewZ[i] < 0.8 || viewZ[i] < 0 || alphaA[i] <= 0.01) continue;
          const size = sizeA[i] * 1.45;
          const a = p.rot;
          fragGlow.moveTo(screenX[i] + Math.cos(a) * size, screenY[i] + Math.sin(a) * size);
          for (let k = 1; k < 3; k++) {
            fragGlow.lineTo(
              screenX[i] + Math.cos(a + step * k) * size,
              screenY[i] + Math.sin(a + step * k) * size,
            );
          }
          fragGlow.closePath();
        }
      }

      ctx.strokeStyle = `rgb(${glowRgb})`;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.85;
      ctx.stroke(glowPath);
      ctx.globalAlpha = 0.2;
      ctx.stroke(haloPath);
      ctx.globalAlpha = 0.3;
      ctx.stroke(fragGlow);

      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    };
    renderRef.current = render;

    const ro = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        rebuild();
        render(0, false);
      }, 140);
    });
    ro.observe(canvas);

    rebuild();
    raf = requestAnimationFrame((t) => {
      last = t;
      const loop = (t2: number) => {
        tSec += (t2 - last) / 1000;
        last = t2;
        if (tabVisible) render(tSec * 1000, true);
        raf = requestAnimationFrame(loop);
      };
      loop(t);
    });

    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        rebuild();
      }, 160);
    };
    window.addEventListener("resize", onResize);

    const onVis = () => {
      tabVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVis);

    const onPointer = (e: PointerEvent) => {
      targetX = e.clientX / window.innerWidth - 0.5;
      targetY = e.clientY / window.innerHeight - 0.5;
      pointerMoved = true;
    };
    if (fine) window.addEventListener("pointermove", onPointer);

    // Late-loaded content (project screenshots, notebook) can shift section
    // heights after mount — re-measure once everything has settled.
    const onLoad = () => {
      rebuild();
      render(0, false);
    };
    window.addEventListener("load", onLoad);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
      if (fine) window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("load", onLoad);
      window.clearTimeout(resizeTimer);
      renderRef.current = null;
    };
  }, [reduce]);

  if (reduce) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}
