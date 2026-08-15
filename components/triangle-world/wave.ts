import type { P, V3 } from "./types";

/** Wave — a volumetric surface spanning width and depth, flowing in y. */
export function waveForm(p: P, t: number): V3 {
  const x = (p.f1 - 0.5) * 3.4;
  const z = (p.f2 - 0.5) * 2.6;
  const y =
    Math.sin(x * 1.7 + t * 1.0) * 0.5 +
    Math.sin(z * 1.3 + t * 0.65) * 0.38 +
    (p.f3 - 0.5) * 0.16;
  return { x, y, z };
}

/** The surface breathes — crests brighten, troughs dim as it flows. */
export function waveLight(p: P, s: number): number {
  return 0.72 + 0.28 * (0.5 + 0.5 * Math.sin((p.f1 - 0.5) * 3.4 * 1.7 + s * 1.0));
}
