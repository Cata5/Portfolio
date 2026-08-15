import { mulberry32, pickColor } from "@/lib/triangles";
import type { P, V3 } from "./types";

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

const FRONT_LON = (-50 * Math.PI) / 180; // Atlantic-facing meridian at load
const OCEAN_KEEP = 0.11;
const LAND_KEEP = 0.94;
const FRAGMENT_RATIO = 0.06;

function isLand(lat: number, lon: number): boolean {
  for (const [clon, clat, rw, rh] of LAND) {
    const d = ((lon - clon) / rw) ** 2 + ((lat - clat) / rh) ** 2;
    if (d <= 1) return true;
  }
  return false;
}

/** Terrain weights — forest dominant, then olive, tan, sand, mountain. */
const TERRAIN_WEIGHTS = [0.3, 0.22, 0.18, 0.14, 0.16];

/** Weighted terrain pick from a raw uniform value in [0,1). */
export function pickTerrain(r: number) {
  let acc = 0;
  for (let i = 0; i < TERRAIN_WEIGHTS.length; i++) {
    acc += TERRAIN_WEIGHTS[i];
    if (r < acc) return i + 1; // 1: forest, 2: olive, 3: savanna, 4: sand, 5: mountain
  }
  return 1;
}

/**
 * Triangles are placed on a unit sphere and accepted by continent masks —
 * land keeps nearly every candidate (dense, bright clusters), ocean keeps a
 * tenth (sparse, dim). The land-dense set carries through every form as the
 * material's density variation.
 */
export function buildEarth(count: number, w: number): P[] {
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
      // Earth tones: water is always ocean blue (0), land picks a terrain color (1..5).
      earthColor: land ? pickTerrain(rand()) : 0,
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

/** Earth — the unit-sphere surface (with assembly shell + frag pulse). */
export function earthForm(p: P, wR: number): V3 {
  return { x: p.ux * wR, y: p.uy * wR, z: p.uz * wR };
}

/**
 * The globe's atmospheric rim — drawn while the earth owns the scene.
 * Additive on dark (soft glow); plain strokes on light (the same violet
 * reads against the pale page instead of vanishing into white).
 */
export function drawEarthAtmosphere(
  ctx: CanvasRenderingContext2D,
  o: {
    x: number;
    y: number;
    unit: number;
    alpha: number;
    light: boolean;
    glowRgb: string;
  },
) {
  ctx.globalCompositeOperation = o.light ? "source-over" : "lighter";
  if (o.alpha <= 0.01) return;
  ctx.strokeStyle = `rgba(${o.glowRgb}, 1)`;
  ctx.lineWidth = o.light ? 1.2 : 1;
  for (let i = 0; i < 8; i++) {
    const rr = o.unit * (1.015 + i * 0.03);
    ctx.globalAlpha = (o.light ? 0.13 : 0.085) * Math.pow(0.72, i) * o.alpha;
    ctx.beginPath();
    ctx.arc(o.x, o.y, rr, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = (o.light ? 0.22 : 0.15) * o.alpha;
  ctx.beginPath();
  ctx.arc(o.x, o.y, o.unit * 1.012, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}
