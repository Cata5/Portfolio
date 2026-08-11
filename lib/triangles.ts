/*
 * Shared helpers for the portfolio's triangle language — the page-wide
 * TriangleWorld canvas draws every triangle from this deterministic source,
 * so the whole page is one visual system.
 */

/** Deterministic PRNG so formations are identical across loads and theme toggles. */
export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Palette weights — electric iris dominant, then amber, magenta, teal, rose, blue, green. */
export const TRIANGLE_WEIGHTS = [0.34, 0.17, 0.13, 0.12, 0.09, 0.09, 0.06];

/** Weighted palette pick from a raw uniform value in [0,1). */
export function pickColor(r: number) {
  let acc = 0;
  for (let i = 0; i < TRIANGLE_WEIGHTS.length; i++) {
    acc += TRIANGLE_WEIGHTS[i];
    if (r < acc) return i;
  }
  return 0;
}
