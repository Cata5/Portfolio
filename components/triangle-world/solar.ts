import { SUN_CORONA_RGB } from "./palettes";
import { makeIncliner, type P, type V3 } from "./types";

// Solar system inclination — ~22° natural perspective angle with clean horizontal major axis
export const SOLAR_INC = 0.38;
const inSolarPlane = makeIncliner(SOLAR_INC);

// Global planetary time scaler
const SOLAR_TIME_SCALE = 0.60;

/**
 * Photorealistic Solar System (NASA JPL Keplerian Mechanics & Planetary Architecture):
 * 1. Central Sun: Incandescent nuclear core with solar flare loops and coronal plasma arcs
 * 2. 8 Planets with true Keplerian velocities (v ~ 1/sqrt(r)):
 *    - Mercury (r=0.22): Swift slate-gray terrestrial orb
 *    - Venus (r=0.32): Sulfuric pearl-gold terrestrial orb
 *    - Earth & Luna (r=0.44): Radiant azure sphere with orbiting silver Moon
 *    - Mars (r=0.56): Vibrant iron-red sphere
 *    - Main Asteroid Belt (r in [0.62, 0.70]): Dense toroidal belt of rocky asteroids
 *    - Jupiter & 4 Galilean Moons (r=0.80): Massive banded gas giant with orbiting moons
 *    - Saturn & Concentric Rings (r=0.96): Golden gas giant with wide 27° tilted planar rings
 *    - Uranus (r=1.10): Aquamarine ice giant with vertical ring system
 *    - Neptune (r=1.24): Deep royal azure ice giant
 * 3. Outer Kuiper Belt & Cometary Trails (r in [1.30, 1.48])
 * 4. Concentric Celestial Trajectory Guide Lines for all 8 planetary orbits
 */
export function solarForm(p: P, t: number): V3 {
  const st = t * SOLAR_TIME_SCALE;

  // ---------------------------------------------------------------------------
  // 1. The Central Sun & Solar Prominence Loops (14% of particles: p.f3 < 0.14)
  // ---------------------------------------------------------------------------
  if (p.f3 < 0.14) {
    const isProminence = p.f1 > 0.80;
    if (isProminence) {
      // Solar prominence flares & magnetic plasma loops arcing above the photosphere
      const arcAng = p.f2 * Math.PI * 2;
      const flareHeight = 0.115 + Math.pow((p.f1 - 0.80) / 0.20, 1.3) * 0.045;
      const loopWobble = Math.sin(t * 1.8 + p.f1 * 14.0) * 0.008;
      const loopArch = Math.sin(arcAng * 3.0 + t * 0.8) * 0.015;
      return inSolarPlane(
        Math.cos(arcAng) * (flareHeight + loopWobble),
        (p.f3 - 0.07) * 0.35 + loopArch,
        Math.sin(arcAng) * (flareHeight + loopWobble),
      );
    }
    // Incandescent spherical solar core with cubic-root uniform volume packing
    const rr = Math.cbrt(p.f1 / 0.80) * 0.115;
    const ph = p.f2 * Math.PI * 2;
    const cp = 2 * (p.f3 / 0.14) - 1;
    const s = Math.sqrt(Math.max(0, 1 - cp * cp));
    const pulse = 1 + Math.sin(t * 0.9 + p.f1 * 6.28) * 0.025;
    return inSolarPlane(
      rr * s * Math.cos(ph) * pulse,
      rr * cp * pulse * 0.96,
      rr * s * Math.sin(ph) * pulse,
    );
  }

  // ---------------------------------------------------------------------------
  // 2. Main Asteroid Belt (8% of particles: p.f3 in [0.14, 0.22)) — between Mars and Jupiter
  // ---------------------------------------------------------------------------
  if (p.f3 >= 0.14 && p.f3 < 0.22) {
    const rBelt = 0.62 + Math.pow(p.f2, 1.1) * 0.08; // 0.62 -> 0.70
    const beltSpeed = 0.36 / Math.pow(rBelt, 1.5);
    const beltAng = p.f1 * Math.PI * 2 + st * beltSpeed + p.f2 * 2.5;
    const beltThick = (p.f3 - 0.18) * 0.30 * 0.038;
    const clump = Math.sin(p.f1 * 20.0) * 0.009;
    return inSolarPlane(
      Math.cos(beltAng) * (rBelt + clump),
      beltThick,
      Math.sin(beltAng) * (rBelt + clump),
    );
  }

  // ---------------------------------------------------------------------------
  // 3. Outer Kuiper Belt & Comets (8% of particles: p.f3 in [0.22, 0.30))
  // ---------------------------------------------------------------------------
  if (p.f3 >= 0.22 && p.f3 < 0.30) {
    const rKuiper = 1.30 + Math.pow(p.f2, 1.2) * 0.18; // 1.30 -> 1.48
    const kuiperSpeed = 0.36 / Math.pow(rKuiper, 1.5);
    const kAng = p.f1 * Math.PI * 2 + st * kuiperSpeed;
    const kThick = (p.f3 - 0.26) * 0.35 * 0.048;
    return inSolarPlane(
      Math.cos(kAng) * rKuiper,
      kThick,
      Math.sin(kAng) * rKuiper,
    );
  }

  // ---------------------------------------------------------------------------
  // 4. Planetary Orbit Tracers / Trajectory Guide Lines (30% of particles: p.f3 >= 0.70)
  // Delicate concentric particle lines showing the orbital planes of the 8 planets
  // ---------------------------------------------------------------------------
  if (p.f3 >= 0.70) {
    const ORBIT_RADII = [0.22, 0.32, 0.44, 0.56, 0.80, 0.96, 1.10, 1.24];
    const orbitIdx = Math.min(7, Math.floor(p.f2 * 8));
    const rOrb = ORBIT_RADII[orbitIdx];
    const orbAng = p.f1 * Math.PI * 2 + st * (0.015 + orbitIdx * 0.004);
    const orbJitter = (p.f3 - 0.85) * 0.003;
    return inSolarPlane(
      Math.cos(orbAng) * (rOrb + orbJitter),
      (p.f2 - 0.5) * 0.005,
      Math.sin(orbAng) * (rOrb + orbJitter),
    );
  }

  // ---------------------------------------------------------------------------
  // 5. The 8 Planetary Bodies & Satellites (40% of particles: p.f3 in [0.30, 0.70))
  // Inner terrestrial & outer gas giants with true Keplerian velocities
  // ---------------------------------------------------------------------------
  const PLANET_CONFIGS = [
    { r: 0.22, speed: 1.20, size: 0.020, name: "Mercury" },
    { r: 0.32, speed: 0.80, size: 0.024, name: "Venus" },
    { r: 0.44, speed: 0.58, size: 0.026, name: "Earth" },
    { r: 0.56, speed: 0.42, size: 0.022, name: "Mars" },
    { r: 0.80, speed: 0.24, size: 0.048, name: "Jupiter" },
    { r: 0.96, speed: 0.17, size: 0.040, name: "Saturn" },
    { r: 1.10, speed: 0.12, size: 0.030, name: "Uranus" },
    { r: 1.24, speed: 0.09, size: 0.029, name: "Neptune" },
  ];

  const pIdx = Math.min(7, Math.floor(p.f1 * 8));
  const cfg = PLANET_CONFIGS[pIdx];

  // Base orbital position of the planet along its Keplerian track
  const orbitAngle = st * cfg.speed + (pIdx * Math.PI * 0.75);
  const px = Math.cos(orbitAngle) * cfg.r;
  const pz = Math.sin(orbitAngle) * cfg.r;

  // Saturn's Planar Concentric Rings (if Saturn and p.f2 > 0.35)
  if (pIdx === 5 && p.f2 > 0.35) {
    const ringF = (p.f2 - 0.35) / 0.65; // 0 -> 1 across ring span
    const ringRadius = cfg.size * 1.40 + ringF * cfg.size * 1.70; // inner to outer ring
    const ringAng = p.f3 * Math.PI * 2 + st * 0.45;
    // Ring tilt relative to orbital plane (~27° inclination)
    const rx = Math.cos(ringAng) * ringRadius;
    const rz = Math.sin(ringAng) * ringRadius * 0.88;
    const ry = Math.sin(ringAng) * ringRadius * 0.42;
    return inSolarPlane(px + rx, ry, pz + rz);
  }

  // Earth's Luna Satellite Moon (if Earth and p.f2 > 0.72)
  if (pIdx === 2 && p.f2 > 0.72) {
    const moonAng = st * 4.4 + p.f3 * Math.PI * 2;
    const moonDist = cfg.size * 1.65;
    const mx = Math.cos(moonAng) * moonDist;
    const mz = Math.sin(moonAng) * moonDist;
    const my = Math.sin(moonAng * 2) * 0.006;
    return inSolarPlane(px + mx, my, pz + mz);
  }

  // Jupiter's Galilean Moons (Io, Europa, Ganymede, Callisto) (if Jupiter and p.f2 > 0.78)
  if (pIdx === 4 && p.f2 > 0.78) {
    const moonIdx = Math.floor((p.f2 - 0.78) / 0.055);
    const moonDistances = [1.35, 1.65, 2.05, 2.45];
    const moonSpeeds = [4.2, 3.2, 2.2, 1.4];
    const mDist = cfg.size * (moonDistances[moonIdx] || 1.6);
    const mSpeed = moonSpeeds[moonIdx] || 2.5;
    const moonAng = st * mSpeed + p.f3 * Math.PI * 2;
    return inSolarPlane(
      px + Math.cos(moonAng) * mDist,
      Math.sin(moonAng * 2) * 0.005,
      pz + Math.sin(moonAng) * mDist,
    );
  }

  // Uranus's Vertical Rings (if Uranus and p.f2 > 0.80)
  if (pIdx === 6 && p.f2 > 0.80) {
    const uRingAng = p.f3 * Math.PI * 2 + st * 0.6;
    const uRingRad = cfg.size * 1.5;
    return inSolarPlane(
      px + Math.cos(uRingAng) * uRingRad * 0.25,
      Math.sin(uRingAng) * uRingRad,
      pz + Math.cos(uRingAng) * uRingRad * 0.95,
    );
  }

  // Planetary Body Spherical Solid Volume
  const u = p.f2 * 2 - 1;
  const v = (p.f3 - 0.30) / 0.40 * 2 - 1;
  const bodyRad = cfg.size * Math.cbrt(Math.max(0.1, 1 - (p.f1 * 8 - pIdx)));
  const bx = u * bodyRad * 0.85;
  const by = (p.f2 - 0.5) * bodyRad * 1.15;
  const bz = v * bodyRad * 0.85;

  return inSolarPlane(px + bx, by, pz + bz);
}

/**
 * Solar system colour mapping:
 * 0: Sun core (incandescent white)
 * 1: Sun corona (solar gold)
 * 2: Sun prominence (fiery amber)
 * 3: Mercury (slate basalt)
 * 4: Venus (sulfuric cream)
 * 5: Earth (azure ocean / clouds)
 * 6: Mars (rusty red)
 * 7: Asteroid Belt (dark graphite)
 * 8: Jupiter (banded amber)
 * 9: Saturn (golden gas giant)
 * 10: Saturn Rings (glowing cyan/gold ice)
 * 11: Uranus (cyan ice giant)
 * 12: Neptune (royal azure ice giant)
 * 13: Kuiper Belt & Orbit Tracks (ethereal celestial blue-gray)
 */
export function solarColor(p: P): number {
  if (p.f3 < 0.14) {
    if (p.f1 > 0.80) return 2; // prominence flare — fiery amber
    return p.f1 < 0.35 ? 0 : 1; // Sun core — white / gold
  }
  if (p.f3 >= 0.14 && p.f3 < 0.22) return 7; // Main Asteroid Belt — graphite
  if (p.f3 >= 0.22 && p.f3 < 0.30) return 13; // Kuiper Belt — icy celestial
  if (p.f3 >= 0.70) return 13; // Orbit Tracks — celestial lines

  // Planets
  const pIdx = Math.min(7, Math.floor(p.f1 * 8));
  if (pIdx === 0) return 3; // Mercury — slate
  if (pIdx === 1) return 4; // Venus — sulfuric cream
  if (pIdx === 2) return p.f2 > 0.72 ? 0 : 5; // Earth (5 azure) / Moon (0 silver)
  if (pIdx === 3) return 6; // Mars — rust red
  if (pIdx === 4) return 8; // Jupiter — banded amber
  if (pIdx === 5) return p.f2 > 0.35 ? 10 : 9; // Saturn (9 gold) / Rings (10 cyan ice)
  if (pIdx === 6) return 11; // Uranus — cyan
  return 12; // Neptune — royal azure
}

/**
 * Solar system shape by role — planets & sun read as glowing spheres; rings, asteroids & orbit tracks as shards.
 */
export function solarSphere(p: P): boolean {
  if (p.f3 < 0.14) return p.f1 <= 0.80; // Sun core — glowing spheres
  if (p.f3 >= 0.14 && p.f3 < 0.22) return false; // Asteroid belt — rocky shards
  if (p.f3 >= 0.22 && p.f3 < 0.30) return false; // Kuiper belt — icy shards
  if (p.f3 >= 0.70) return false; // Orbit tracks — thin line shards
  // Planetary bodies
  const pIdx = Math.min(7, Math.floor(p.f1 * 8));
  if (pIdx === 5 && p.f2 > 0.35) return false; // Saturn rings — planar disc shards
  if (pIdx === 6 && p.f2 > 0.80) return false; // Uranus rings — shards
  return true; // All planet spheres & moons
}

/**
 * Solar system light — Sun glows brilliantly at the center with solar falloff to outer planets.
 */
export function solarLight(p: P, depth: number, s: number = 0): number {
  if (p.f3 < 0.14) {
    // The sun glows hot, intense, and steady with subtle convective pulse
    const pulse = 1 + 0.12 * Math.sin(s * 1.2 + p.f1 * 6.28);
    return (1.45 - p.f1 * 0.25) * pulse;
  }
  if (p.f3 >= 0.14 && p.f3 < 0.22) return 0.48 + 0.20 * depth; // Asteroid belt
  if (p.f3 >= 0.22 && p.f3 < 0.30) return 0.52 + 0.22 * depth; // Kuiper belt
  if (p.f3 >= 0.70) return 0.42 + 0.18 * depth; // Orbit tracks
  // Planets catch the sunlight
  const pIdx = Math.min(7, Math.floor(p.f1 * 8));
  const sunFalloff = 1.20 - pIdx * 0.08;
  return (0.90 + 0.35 * depth) * sunFalloff;
}

/**
 * Volumetric Solar Corona — renders a soft, photorealistic golden-white solar corona
 * and heliospheric starlight radiance on the canvas behind the particles.
 */
export function drawSunCorona(
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
  const sunRadius = o.unit * 0.14;
  const coronaRadius = o.unit * 0.46;
  const helioRadius = o.unit * 1.05;

  // 1. Soft heliospheric diffuse ambient starlight
  ctx.globalCompositeOperation = o.light ? "source-over" : "lighter";
  const helioGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, helioRadius);
  helioGrad.addColorStop(0, `rgba(${SUN_CORONA_RGB}, ${0.24 * o.alpha})`);
  helioGrad.addColorStop(0.35, `rgba(${SUN_CORONA_RGB}, ${0.09 * o.alpha})`);
  helioGrad.addColorStop(0.75, `rgba(${SUN_CORONA_RGB}, ${0.02 * o.alpha})`);
  helioGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

  ctx.fillStyle = helioGrad;
  ctx.beginPath();
  ctx.arc(hx, hy, helioRadius, 0, Math.PI * 2);
  ctx.fill();

  // 2. Solar Corona Radiance & Thermal Flares
  const coronaGrad = ctx.createRadialGradient(hx, hy, sunRadius * 0.8, hx, hy, coronaRadius);
  const pulse = 1 + 0.06 * Math.sin(o.s * 1.8);
  coronaGrad.addColorStop(0, `rgba(255, 240, 180, ${0.78 * o.alpha * pulse})`);
  coronaGrad.addColorStop(0.3, `rgba(255, 185, 70, ${0.48 * o.alpha * pulse})`);
  coronaGrad.addColorStop(0.7, `rgba(240, 110, 30, ${0.16 * o.alpha})`);
  coronaGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

  ctx.fillStyle = coronaGrad;
  ctx.beginPath();
  ctx.arc(hx, hy, coronaRadius, 0, Math.PI * 2);
  ctx.fill();

  // 3. Incandescent Solar Core
  const coreGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, sunRadius);
  coreGrad.addColorStop(0, `rgba(255, 255, 255, ${0.98 * o.alpha})`);
  coreGrad.addColorStop(0.4, `rgba(255, 248, 220, ${0.88 * o.alpha})`);
  coreGrad.addColorStop(0.85, `rgba(255, 210, 90, ${0.58 * o.alpha})`);
  coreGrad.addColorStop(1, "rgba(255, 150, 40, 0)");

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(hx, hy, sunRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
}
