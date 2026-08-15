import { GALAXY_GLOW_RGB } from "./palettes";
import { makeIncliner, type P, type V3 } from "./types";

// Galaxy inclination — ~22° face-on spiral view with pure horizontal major axis
export const GALAXY_INC = 0.38;
const inGalaxyPlane = makeIncliner(GALAXY_INC);

// Global galaxy spin speed (radians per second)
const GALAXY_SPIN_SPEED = 0.22;

/**
 * Photorealistic Grand-Design Barred Spiral Galaxy (NGC 1365 / M51 archetype):
 * - Sérsic profile nuclear core: dense, supermassive core with fast inner Keplerian orbits
 * - S-curved central stellar bar spanning from -0.26 to +0.26 world units
 * - Two sweeping logarithmic grand-design spiral arms curling seamlessly from the bar tips
 * - High-extinction dark dust lanes hugging the leading inner edge of the arms
 * - Vibrant H-alpha starburst emission knots (ionized hydrogen nebulae) dotted along the outer ridges
 * - Dense electric azure & cyan-white OB stellar associations along the arm spines
 * - Interarm spur filaments & delicate bridges peeling into the void
 * - Flared exponential starlight disk with realistic scale height
 * - 3D spherical stellar halo with orbiting ancient globular clusters
 */
export function galaxyForm(p: P, t: number): V3 {
  const spin = t * GALAXY_SPIN_SPEED;

  // 1. Supermassive Nuclear Core & Sérsic Bulge (p.f3 < 0.14)
  if (p.f3 < 0.14) {
    const rr = Math.pow(p.f1, 2.0) * 0.15; // 0 -> 0.15 dense core
    const coreSpeed = 0.85 + 0.30 / (0.03 + rr);
    const ph = p.f2 * Math.PI * 2 + t * coreSpeed;
    const cp = 2 * (p.f3 / 0.14) - 1;
    const s = Math.sqrt(Math.max(0, 1 - cp * cp));
    // Elliptical bar perturbation in the bulge
    const barPerturb = 1 + 0.18 * Math.cos(ph * 2 - spin * 2);
    return inGalaxyPlane(
      rr * s * Math.cos(ph) * barPerturb,
      rr * cp * 0.48,
      rr * s * Math.sin(ph) * barPerturb,
    );
  }

  // 2. S-Curved Central Stellar Bar (p.f3 in [0.14, 0.24))
  if (p.f3 >= 0.14 && p.f3 < 0.24) {
    const barSign = p.f1 > 0.5 ? 1 : -1;
    const u = Math.pow(p.f2, 1.15); // 0 -> 1 along bar half-length
    const barDist = 0.05 + u * 0.20; // 0.05 -> 0.25 (connecting directly to spiral arm roots)
    const barWidth = (p.f1 * 2 - (p.f1 > 0.5 ? 1.5 : 0.5)) * 0.038 * (1 - u * 0.35);
    // S-curve bend as bar approaches the arm root
    const sCurve = 0.18 * Math.pow(u, 2.2) * barSign;
    const barAng = spin + (barSign > 0 ? 0 : Math.PI) + sCurve;
    const bx = Math.cos(barAng) * barDist - Math.sin(barAng) * barWidth;
    const bz = Math.sin(barAng) * barDist + Math.cos(barAng) * barWidth;
    const by = (p.f2 - 0.5) * 0.024 * (1 - u * 0.3);
    return inGalaxyPlane(bx, by, bz);
  }

  // 3. Faint Galactic Halo & Distant Globular Clusters (p.f2 > 0.90)
  if (p.f2 > 0.90) {
    const rr = 0.48 + Math.pow(p.f1, 1.4) * 0.60;
    const haloSpeed = 0.03 + p.f3 * 0.025;
    const ph = p.f3 * Math.PI * 2 + t * haloSpeed;
    const cp = (2 * (p.f2 - 0.90)) / 0.10 - 1;
    const s = Math.sqrt(Math.max(0, 1 - cp * cp));
    return inGalaxyPlane(rr * s * Math.cos(ph), rr * cp * 0.75, rr * s * Math.sin(ph));
  }

  // 4. Grand-Design Logarithmic Spiral Arms & Interarm Features
  const ARMS = 2; // 2 grand-design primary spiral arms
  const armIdx = Math.floor(p.f1 * ARMS);
  const armF = p.f1 * ARMS - armIdx; // 0 -> 1 along the arm from root to outer tip

  // Radius along spiral arm: emerges from bar tip at r0=0.25 out to r=0.96
  const r0 = 0.25;
  const r = r0 + Math.pow(armF, 0.88) * 0.71;

  // True logarithmic spiral curve: theta(r) = (1 / tan(pitch)) * ln(r / r0)
  const spiralPitch = 0.38; // ~21.8° pitch angle for wide, sweeping grand-design arms
  const logAngle = (1 / spiralPitch) * Math.log(r / r0);
  const baseAngle = armIdx * Math.PI + logAngle + spin;

  // A. Inner Leading Dust Shock Lanes (p.f3 in [0.24, 0.32))
  // Dark clumpy molecular dust filaments hugging the concave leading edge
  if (p.f3 >= 0.24 && p.f3 < 0.32) {
    const da = baseAngle - (0.09 + 0.04 * armF);
    const dr = r * 0.965;
    const dustClump = Math.sin(armF * 24.0 + p.f1 * 14.0) * 0.012;
    return inGalaxyPlane(
      Math.cos(da) * (dr + dustClump),
      (p.f2 - 0.5) * 0.016,
      Math.sin(da) * (dr + dustClump),
    );
  }

  // B. Giant H-II Starburst Emission Nebulae (p.f3 in [0.32, 0.42))
  // Vivid magenta-pink ionized hydrogen knots clustered along the outer trailing ridges
  if (p.f3 >= 0.32 && p.f3 < 0.42) {
    const ka = baseAngle + (0.06 + 0.05 * armF) + (p.f2 - 0.5) * 0.035;
    const kr = r * 1.025 + Math.sin(t * 1.6 + p.f1 * 15.0) * 0.008;
    return inGalaxyPlane(
      Math.cos(ka) * kr,
      (p.f2 - 0.5) * 0.020,
      Math.sin(ka) * kr,
    );
  }

  // C. Interarm Spurs & Feather Filaments (p.f3 in [0.74, 0.84) and armF in [0.25, 0.85])
  if (p.f3 >= 0.74 && p.f3 < 0.84 && armF > 0.25 && armF < 0.85) {
    const spurF = (armF - 0.25) / 0.60;
    const spurAngle = baseAngle + spurF * 0.85;
    const spurR = r * (1 + (p.f2 - 0.5) * 0.35);
    return inGalaxyPlane(
      Math.cos(spurAngle) * spurR,
      (p.f1 - 0.5) * 0.028,
      Math.sin(spurAngle) * spurR,
    );
  }

  // D. Diffuse Exponential Starlight Disk (p.f3 >= 0.84)
  if (p.f3 >= 0.84) {
    const diffR = 0.22 + Math.pow(p.f2, 1.25) * 0.72;
    const diffSpeed = GALAXY_SPIN_SPEED * (0.65 + 0.35 / (0.2 + diffR));
    const diffAng = p.f1 * Math.PI * 2 + t * diffSpeed;
    const diffThick = (p.f2 - 0.5) * 0.032 * (1 + diffR * 0.7);
    return inGalaxyPlane(
      Math.cos(diffAng) * diffR,
      diffThick,
      Math.sin(diffAng) * diffR,
    );
  }

  // E. Main OB Stellar Associations & Luminous Young Blue Star Clusters (p.f3 in [0.42, 0.74))
  // Clustered tightly along the logarithmic spiral density spine
  const scatter = (p.f2 - 0.5) * (0.025 + armF * 0.09);
  const rJitter = (p.f3 - 0.5) * (0.012 + armF * 0.028);
  const armThick = (p.f3 - 0.5) * 0.032 * (0.4 + armF * 0.8);
  const starAng = baseAngle + scatter;

  return inGalaxyPlane(
    Math.cos(starAng) * (r + rJitter),
    armThick,
    Math.sin(starAng) * (r + rJitter),
  );
}

/**
 * Galaxy colour mapping by astronomical spectral classification:
 * 0: Ultra-luminous white nuclear core
 * 1: Creamy golden nuclear bulge
 * 2: Amber stellar bar
 * 3: Diffuse disc starlight
 * 4: Electric azure young star clusters
 * 5: Diamond cyan-white OB associations
 * 6: Vibrant magenta-pink H-alpha emission nebulae
 * 7: Hot ruby starburst knots
 * 8: Dark interstellar dust absorption lanes
 * 9: Silver-blue outer halo
 */
export function galaxyColor(p: P): number {
  if (p.f3 < 0.14) return p.f1 < 0.45 ? 0 : 1; // 0 white core / 1 golden bulge
  if (p.f3 >= 0.14 && p.f3 < 0.24) return p.f1 < 0.4 ? 1 : 2; // 1 gold / 2 amber stellar bar
  if (p.f2 > 0.90) return 9; // 9 silver-blue halo
  if (p.f3 >= 0.24 && p.f3 < 0.32) return 8; // 8 dark chocolate/charcoal dust lanes
  if (p.f3 >= 0.32 && p.f3 < 0.42) return p.f1 < 0.6 ? 6 : 7; // 6 magenta-pink / 7 hot ruby H-alpha knots
  if (p.f3 >= 0.74 && p.f3 < 0.84) return 4; // 4 azure interarm spurs
  if (p.f3 >= 0.84) return 3; // 3 diffuse ivory disk
  return p.f1 < 0.4 ? 5 : 4; // 5 diamond cyan-white / 4 electric azure main arm stars
}

/**
 * Galaxy shape by role — star clusters and emission nebulae read as spheres vs dust/gas as shards.
 */
export function galaxySphere(p: P): boolean {
  if (p.f3 < 0.14) return true; // core bulge — dense spheres
  if (p.f3 >= 0.14 && p.f3 < 0.24) return p.f1 < 0.7; // bar — stellar spheres
  if (p.f2 > 0.90) return false; // halo — distant shards
  if (p.f3 >= 0.24 && p.f3 < 0.32) return false; // dust lanes — flat shard silhouettes
  if (p.f3 >= 0.32 && p.f3 < 0.42) return true; // H-alpha knots — glowing spherical nebulae
  if (p.f3 >= 0.84) return false; // diffuse disc — starlight shards
  return p.driftPhase < Math.PI * 1.25; // arm stars — rich mix of glowing spheres and shards
}

/**
 * Galaxy light — the nuclear bulge glows hot at its core, starburst knots shimmer,
 * arms catch radiant light as they spin, and dust lanes stay in deep absorption silhouette.
 */
export function galaxyLight(p: P, depth: number, s: number = 0): number {
  // Central nuclear core: ultra-intense incandescent radiance with gentle pulse
  if (p.f3 < 0.14) {
    const pulse = 1 + 0.12 * Math.sin(s * 1.6 + p.f1 * 6.28);
    return (1.45 - p.f1 * 0.3) * pulse;
  }
  // H-alpha starburst knots: vibrant shimmer of newly born stars
  if (p.f3 >= 0.32 && p.f3 < 0.42) {
    const shimmer = 1 + 0.30 * Math.sin(s * 2.8 + p.f1 * 14.0);
    return (1.15 + 0.35 * depth) * shimmer;
  }
  // Dust lanes: deep silhouette absorption for high optical contrast
  if (p.f3 >= 0.24 && p.f3 < 0.32) {
    return 0.26 + 0.16 * depth;
  }
  // Halo
  if (p.f2 > 0.90) return 0.50 + 0.20 * depth;
  // Main OB arm stars
  const armShine = 1 + 0.15 * Math.sin(s * 0.8 + p.f1 * Math.PI * 2);
  return (0.82 + 0.38 * depth) * armShine;
}

/**
 * Volumetric Galactic Radiance — renders a soft, photorealistic deep-sky core glow,
 * golden stellar bar, and ethereal blue-white disc halo on the canvas behind the particles.
 */
export function drawGalaxyCoreGlow(
  ctx: CanvasRenderingContext2D,
  o: {
    x: number;
    y: number;
    unit: number;
    alpha: number;
    s: number;
    light: boolean;
  },
) {
  if (o.alpha <= 0.01) return;
  const hx = o.x;
  const hy = o.y;
  const coreRad = o.unit * 0.32;
  const barRadX = o.unit * 0.55;
  const barRadY = barRadX * 0.45;
  const discRadX = o.unit * 1.25;
  const discRadY = discRadX * Math.sin(GALAXY_INC);

  // 1. Soft ethereal blue-white disc glow (overall galactic starlight disk)
  ctx.globalCompositeOperation = o.light ? "source-over" : "lighter";
  const discGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, discRadX);
  discGrad.addColorStop(0, `rgba(${GALAXY_GLOW_RGB}, ${0.30 * o.alpha})`);
  discGrad.addColorStop(0.35, `rgba(${GALAXY_GLOW_RGB}, ${0.15 * o.alpha})`);
  discGrad.addColorStop(0.7, `rgba(${GALAXY_GLOW_RGB}, ${0.04 * o.alpha})`);
  discGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

  ctx.save();
  ctx.translate(hx, hy);
  ctx.scale(1, discRadY / discRadX);
  ctx.beginPath();
  ctx.arc(0, 0, discRadX, 0, Math.PI * 2);
  ctx.fillStyle = discGrad;
  ctx.fill();
  ctx.restore();

  // 2. Warm golden stellar bar glow
  const barGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, barRadX);
  barGrad.addColorStop(0, `rgba(255, 225, 140, ${0.45 * o.alpha})`);
  barGrad.addColorStop(0.4, `rgba(245, 190, 90, ${0.22 * o.alpha})`);
  barGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

  ctx.save();
  ctx.translate(hx, hy);
  ctx.scale(1, barRadY / barRadX);
  ctx.beginPath();
  ctx.arc(0, 0, barRadX, 0, Math.PI * 2);
  ctx.fillStyle = barGrad;
  ctx.fill();
  ctx.restore();

  // 3. Ultra-luminous nuclear core point
  const coreGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, coreRad);
  const pulse = 1 + 0.08 * Math.sin(o.s * 1.6);
  coreGrad.addColorStop(0, `rgba(255, 255, 255, ${0.85 * o.alpha * pulse})`);
  coreGrad.addColorStop(0.18, `rgba(255, 240, 185, ${0.62 * o.alpha * pulse})`);
  coreGrad.addColorStop(0.45, `rgba(255, 195, 110, ${0.25 * o.alpha})`);
  coreGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

  ctx.save();
  ctx.translate(hx, hy);
  ctx.scale(1, 0.72);
  ctx.beginPath();
  ctx.arc(0, 0, coreRad, 0, Math.PI * 2);
  ctx.fillStyle = coreGrad;
  ctx.fill();
  ctx.restore();

  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
}
