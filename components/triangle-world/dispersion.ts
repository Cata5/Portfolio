import { clamp01, type P, type V3 } from "./types";

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

export type DispStyle = {
  spread: number; // radial spread multiplier
  camera: number; // zoom pull-back at full dispersion (lower = more pulled back)
  near: number; // extra depth boost for near pieces
  alpha: number; // alpha multiplier at full dispersion
  sweep: number; // horizontal directional bias
  turn: number; // rotational bias
  swell: number; // foreground size swell
};

/** One personality per form boundary, in scroll order. */
export const DISP_STYLES: DispStyle[] = [
  // about — Earth → galaxy: pieces detach gently, staying close to the frame
  { spread: 0.55, camera: 0.94, near: 0.02, alpha: 1.22, sweep: 0, turn: 0.2, swell: 2.2 },
  // work — galaxy → brain: strong rotational burst
  { spread: 1.0, camera: 0.86, near: 0.1, alpha: 1.35, sweep: 0.2, turn: 1.0, swell: 3.0 },
  // stack — brain → wave: a directional sweep across the viewport
  { spread: 1.12, camera: 0.82, near: 0.15, alpha: 1.42, sweep: 1.0, turn: 0.2, swell: 3.4 },
  // ml — wave → solar: violent, deep, foreground-heavy
  { spread: 1.25, camera: 0.78, near: 0.25, alpha: 1.52, sweep: 0.4, turn: 0.6, swell: 4.4 },
  // contact — solar → final: a soft, calm dissolve
  { spread: 0.45, camera: 0.96, near: 0, alpha: 1.12, sweep: 0, turn: 0.1, swell: 1.8 },
  // footer — final → void: the world gently disperses and fades away
  { spread: 0.5, camera: 0.98, near: 0, alpha: 1.05, sweep: 0, turn: 0.1, swell: 1.5 },
];

/** Seeded per-piece dispersion destination in world space. */
export function dispersionTarget(p: P, st: DispStyle, t: number): V3 {
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
