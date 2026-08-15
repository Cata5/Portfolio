/**
 * Shared types + tiny math for the triangle world. Each form module (earth,
 * galaxy, orbit, wave, solar, black-hole) imports these; nothing here
 * imports anything else, so the modules can never form a cycle.
 */

/** A persistent piece of the material — one triangle/sphere in the scene. */
export type P = {
  ux: number;
  uy: number;
  uz: number;
  radius: number;
  rot: number;
  rotSpeed: number;
  driftPhase: number;
  driftSpeed: number;
  color: number;
  /** Index into the earth terrain palette (EARTH_DARK / EARTH_LIGHT). */
  earthColor: number;
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

export type V3 = { x: number; y: number; z: number };
export type FormFn = (p: P, t: number, wR: number) => V3;

export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

export const smoothstep = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

/**
 * Shared incliner factory — the cosmic forms (galaxy, solar system, black
 * hole) live in inclined orbital planes so their discs always project as
 * readable ellipses. A flat X-Z plane razor-flattens under the scene's
 * scroll-driven rotation and reads as a horizontal smear instead of a
 * structure. Each form keeps its own inclination constant; the trig is
 * hoisted once at module scope.
 */
export const makeIncliner = (inc: number) => {
  const c = Math.cos(inc);
  const s = Math.sin(inc);
  return (x: number, y: number, z: number): V3 => ({
    x,
    y: y * c - z * s,
    z: y * s + z * c,
  });
};
