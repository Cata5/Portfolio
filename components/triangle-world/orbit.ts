import type { P, V3 } from "./types";

/** Orbital rings — three interlocking gyroscopic cosmic rings with alternating spin. */
export function orbitForm(p: P, t: number): V3 {
  const R = [0.62, 1.02, 1.42][p.orbitRing];
  const dir = p.orbitRing === 1 ? -1 : 1;
  const tilt = [-0.18, 0.26, -0.1][p.orbitRing];
  const ang = p.orbitPhase + t * 0.35 * dir + p.f3 * 0.2;
  const x0 = Math.cos(ang) * R;
  const z0 = Math.sin(ang) * R;
  const y0 = (p.orbitRing - 1) * 0.16 + (p.f3 - 0.5) * 0.04;
  return {
    x: x0,
    y: y0 * Math.cos(tilt) - z0 * Math.sin(tilt),
    z: y0 * Math.sin(tilt) + z0 * Math.cos(tilt),
  };
}

/** Ring pieces brighten and dim as they travel round — subtle orbital light. */
export function orbitLight(p: P, s: number): number {
  return 0.72 + 0.28 * Math.abs(Math.sin(p.orbitPhase + s * 0.3));
}

