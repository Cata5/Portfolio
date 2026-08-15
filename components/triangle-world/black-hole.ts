import { HOLE_DARK, HOLE_RIM_RGB } from "./palettes";
import { clamp01, makeIncliner, type P, type V3 } from "./types";

// Overscroll climax timing — seconds from the trigger. The spin phase whips
// the disc to a frenzy (the hole contracts and ignites to critical mass), then
// the hyper-detonation blasts thousands of pieces across and beyond the whole screen,
// everything blacks out smoothly while the page rides back to the top, and the black
// lifts seamlessly on the hero earth.
export const BURST_SPIN_END = 0.85; // spin-up build-up ends and detonation blasts
export const BURST_EXPLODE_END = 2.1; // hyper-velocity blast floods and clears the viewport
export const BURST_BLACK_START = 2.0; // blackout overlay smoothly covers the debris storm
export const BURST_BLACK_END = 3.1; // blackout holds while Lenis rides to top
export const BURST_TIMEOUT = 4.5; // safety reset after sequence completes
// Continued downward input past the bottom that triggers the climax.
export const OVERSHOOT_WHEEL_PX = 900;
export const OVERSHOOT_TOUCH_PX = 260;

/**
 * Live black-hole state, set every frame by world.tsx's render loop (scroll
 * depth × final-form dominance) and read by finalForm, the lighting pass and
 * the event-horizon draw to power the hole up as the page closes — faster
 * spin, swelling horizon, brighter rim, hungrier gravity. The overscroll
 * trigger is set by world.tsx's input handlers.
 */
export const holeState = {
  finalPower: 0,
  finalSpin: 1,
  finalGrow: 1,
  burstStartMs: -1,
  burstScrollSent: false,
  // When the ride back to the top lands (Lenis onComplete) — the blackout
  // and the burst override key off this, so the black can never lift before
  // the page is at the top and the earth is in place.
  rideDoneMs: -1,
};

// Black hole inclination — face-on tilted disc with clean horizontal major axis
export const FINAL_INC = 0.36; // ~21° inclination angle
const inHolePlane = makeIncliner(FINAL_INC);

/**
 * Final — a photorealistic Kerr/Schwarzschild black hole (Gargantua-type relativistic singularity):
 * - Shakura-Sunyaev / Novikov-Thorne thin relativistic accretion disc with Keplerian shear
 * - ISCO boundary (Innermost Stable Circular Orbit) where infalling matter plunges into the horizon
 * - Extreme gravitational redshift shifting infalling plasma from white-hot to crimson soot
 * - Relativistic Doppler boosting & beaming (approaching left hemisphere is radiant white-hot)
 * - Magnetohydrodynamic spiral density wave turbulence across the accretion flow
 * - Polar relativistic synchrotron plasma jets along the rotation axis
 * - Exact Gargantua dual-arc gravitational lensing (upper lensed crown & lower under-arc)
 */
export function finalForm(p: P, t: number): V3 {
  // 1. Relativistic Infalling Matter (plunging past ISCO into the event horizon)
  if (p.f3 > 0.88) {
    // Accelerating inward geodetic spiral from r=0.23 down to horizon r=0.12
    const rInfall = 0.12 + Math.pow(1 - p.f2, 1.6) * 0.11;
    const infallSpeed = t * (1.1 + 0.35 / (0.03 + rInfall)) * holeState.finalSpin;
    const ang = p.f1 * Math.PI * 2 + infallSpeed + p.f2 * 4.5;
    const yInfall = (p.f2 - 0.5) * 0.028 * (rInfall / 0.23);
    return inHolePlane(
      Math.cos(ang) * rInfall,
      yInfall,
      Math.sin(ang) * rInfall,
    );
  }

  // 2. Polar Relativistic Synchrotron Plasma Jets (collimated magnetic columns)
  if (p.f3 > 0.80 && p.f1 < 0.12) {
    const jetSign = p.f1 < 0.06 ? 1 : -1;
    const jDist = 0.12 + p.f2 * 0.42;
    const jSpread = (p.f1 * 16.0 - (p.f1 < 0.06 ? 0.5 : 1.5)) * 0.03;
    return inHolePlane(jSpread, jetSign * jDist, jSpread * 0.5);
  }

  // 3. Shakura-Sunyaev Thin Relativistic Accretion Disc
  // Exponential surface density packed tightly against the ISCO (r=0.22 -> 0.86)
  const r = (0.22 + Math.pow(p.f2, 1.45) * 0.64) * holeState.finalGrow;
  // Keplerian angular velocity Omega(r) proportional to r^(-1.5)
  const keplerOmega = 0.36 / Math.pow(r, 1.5);
  const ang =
    p.f1 * Math.PI * 2 + t * keplerOmega * holeState.finalSpin + p.f3 * 0.4;

  // Magnetohydrodynamic spiral turbulence in the accretion flow
  const mhdTurb = 0.012 * Math.sin(ang * 3.0 - t * 1.4 + p.f1 * 6.28);
  const rw = r + mhdTurb;

  // Razor-thin disc near ISCO with slight hydrostatic flaring outward
  const yThick = (p.f3 - 0.5) * 0.024 * (0.5 + (r / 0.86) * 0.8);

  return inHolePlane(
    Math.cos(ang) * rw,
    yThick,
    Math.sin(ang) * rw,
  );
}

/**
 * Black-hole light — physical relativistic Doppler beaming and thermal radiation:
 * - Approaching hemisphere (Doppler beamed) is intensely bright and radiant
 * - Receding hemisphere is dimmer and redshifted
 * - Shakura-Sunyaev radial temperature falloff T(r) proportional to r^(-0.75)
 * - Infalling matter dims exponentially as it crosses the event horizon
 */
export function finalLight(p: P, s: number): number {
  // Infalling matter dims via gravitational time dilation / redshift as it nears horizon
  if (p.f3 > 0.88) {
    return 0.22 + 0.78 * (1 - p.f2);
  }
  // Polar jets: steady synchrotron glow
  if (p.f3 > 0.80 && p.f1 < 0.12) {
    return 1.1 + 0.2 * Math.sin(s * 2.5 + p.f2 * 8.0);
  }

  // Accretion disc: Shakura-Sunyaev temperature falloff + relativistic Doppler beaming
  const r = (0.22 + Math.pow(p.f2, 1.45) * 0.64) * holeState.finalGrow;
  const keplerOmega = 0.36 / Math.pow(r, 1.5);
  const ang =
    p.f1 * Math.PI * 2 + s * keplerOmega * holeState.finalSpin + p.f3 * 0.4;

  // Doppler factor: approaching side (cos(ang) < 0 in our camera projection) is beamed
  const dopplerFactor = 1 - 0.42 * Math.cos(ang);
  const tempFalloff = Math.pow(0.22 / Math.max(0.18, r), 0.75);

  return (0.45 + 0.55 * tempFalloff) * Math.pow(dopplerFactor, 2.2);
}

/**
 * The overscroll climax's debris field — a smooth, cinematic 3D cosmic expansion:
 * Disperses all pieces gracefully across the 3D volume with organic fluid dynamics,
 * expanding smoothly across the screen without violent visual teleporting or stuttering.
 */
export function burstPosition(p: P, t: number, k: number): V3 {
  const r0 = 0.28 + Math.pow(p.f2, 1.4) * 0.55;
  const baseAng = p.f1 * Math.PI * 2 + p.f3 * 0.8;

  // 1. Relativistic Bipolar Jets
  if (p.f3 > 0.84) {
    const jetSign = p.f1 > 0.5 ? 1 : -1;
    const jetSpeed = 6.0 + p.f2 * 7.5;
    const spread = (p.f1 - 0.5) * 0.5;
    const jetDist = r0 + k * jetSpeed;
    const jx = Math.cos(baseAng) * (0.15 + spread * 0.25) * (1 + k * 0.6);
    const jz = Math.sin(baseAng) * (0.15 + spread * 0.25) * (1 + k * 0.6);
    const jy = jetSign * jetDist;
    return inHolePlane(jx, jy, jz);
  }

  // 2. Centrifugal Accretion Shrapnel
  if (p.f3 < 0.28) {
    const spinSpeed = 4.5 + p.f1 * 5.5;
    const tangAng = baseAng + t * 1.4 + p.f2 * 1.0;
    const rExp = r0 + k * spinSpeed;
    const wob = Math.sin(t * 2.0 + p.f1 * 7.0) * (0.08 + k * 0.25);
    const sx = Math.cos(tangAng) * (rExp + wob);
    const sz = Math.sin(tangAng) * (rExp + wob) + (p.f1 - 0.5) * (0.35 + k * 1.2);
    const sy = (p.f2 - 0.5) * (0.25 + k * 1.0);
    return inHolePlane(sx, sy, sz);
  }

  // 3. Omnidirectional 3D Spherical Supernova Ejecta
  const theta = p.f1 * Math.PI * 2 + (p.f3 - 0.5) * 1.2 + t * 0.15;
  const phi = (p.f2 - 0.5) * Math.PI * 0.9;

  const dirX = Math.cos(phi) * Math.cos(theta);
  const dirY = Math.sin(phi);
  const dirZ = Math.cos(phi) * Math.sin(theta);

  const isFast = p.f1 < 0.2 || p.big;
  const speed = isFast ? 5.8 + p.f2 * 4.5 : 3.2 + p.f1 * 3.5 + p.f2 * 2.2;

  const expDist = r0 + k * speed;
  const turbX = Math.sin(t * 1.8 + p.f1 * 10.0) * (0.04 + k * 0.3);
  const turbY = Math.cos(t * 1.6 + p.f2 * 8.0) * (0.04 + k * 0.3);
  const turbZ = Math.sin(t * 2.0 + p.f3 * 11.0) * (0.04 + k * 0.3);

  const rx = dirX * expDist + turbX;
  const ry = dirY * expDist + turbY;
  const rz = dirZ * expDist + turbZ;

  return inHolePlane(rx, ry, rz);
}

/**
 * Accretion colour by relativistic role & gravitational redshift:
 * - Pure white-hot thermal plasma at the ISCO / photon ring
 * - Incandescent gold -> solar amber -> plasma orange through the main disc
 * - Doppler blue-shift on the approaching side vs redshift on the receding side
 * - Gravitationally redshifted crimson & infrared soot for infalling matter near the horizon
 */
export function holeColor(p: P): number {
  // Polar jets: brilliant white-hot synchrotron emission
  if (p.f3 > 0.80 && p.f1 < 0.12) return p.f2 < 0.4 ? 0 : 1;

  // Infalling matter: shifts from white-hot to deep redshifted crimson & soot near horizon
  if (p.f3 > 0.88) {
    if (p.f2 < 0.25) return 0; // white-hot at ISCO
    if (p.f2 < 0.55) return 2; // amber
    if (p.f2 < 0.8) return 4; // vermilion
    return 5; // gravitationally redshifted crimson
  }

  // Accretion disc: radial temperature gradient + Doppler shift
  const baseBand = Math.floor(Math.pow(p.f2, 0.75) * (HOLE_DARK.length - 1));
  // Doppler shift: approaching side is hotter/bluer
  const ang = p.f1 * Math.PI * 2;
  const isApproaching = Math.cos(ang) < -0.2;
  const isReceding = Math.cos(ang) > 0.3;

  if (isApproaching && baseBand > 0) return baseBand - 1;
  if (isReceding && baseBand < HOLE_DARK.length - 1) return baseBand + 1;
  return Math.min(HOLE_DARK.length - 1, baseBand);
}

/**
 * The event horizon & gravitational lensing system (Gargantua-type relativistic profile):
 * - Pitch-black spherical event horizon shadow occluding background motes
 * - Dual-order razor-sharp photon rings (Einstein rings) at the shadow boundary
 * - Upper arched lensed accretion disc crown with Doppler-beamed brightness
 * - Lower underside lensed reflection bowing below the event horizon
 * - Direct near-side accretion throat crossing in front of the lower shadow
 * - Relativistic gravitational lensing corona
 */
export function drawBlackHole(
  ctx: CanvasRenderingContext2D,
  o: {
    x: number;
    y: number;
    unit: number;
    alpha: number;
    power: number;
    spin: number;
    s: number;
    light: boolean;
  },
) {
  if (o.alpha <= 0.01) return;
  const hx = o.x;
  const hy = o.y;
  // World-space horizon radius — swells as the hole powers up
  const hr = o.unit * 0.25 * (1 + o.power * 0.45);
  const rimGlow = 1 + o.power * 0.95;

  // 1. Relativistic Ergosphere / Gravitational Corona
  ctx.globalCompositeOperation = o.light ? "source-over" : "lighter";
  const coronaRad = hr * 2.8;
  const coronaGrad = ctx.createRadialGradient(hx, hy, hr * 0.9, hx, hy, coronaRad);
  coronaGrad.addColorStop(0, `rgba(${HOLE_RIM_RGB}, ${0.35 * o.alpha * rimGlow})`);
  coronaGrad.addColorStop(0.35, `rgba(${HOLE_RIM_RGB}, ${0.12 * o.alpha * rimGlow})`);
  coronaGrad.addColorStop(0.7, `rgba(230, 92, 39, ${0.04 * o.alpha})`);
  coronaGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = coronaGrad;
  ctx.beginPath();
  ctx.arc(hx, hy, coronaRad, 0, Math.PI * 2);
  ctx.fill();

  // 2. Upper Lensed Far-Side Accretion Arc (The Iconic Gargantua Crown)
  const eR = hr * 1.16;
  const eRy = eR * Math.sin(FINAL_INC);
  const topLens = (o.light ? 0.5 : 0.72) * o.alpha * rimGlow;

  // Outer glowing halo of upper arc
  ctx.strokeStyle = `rgba(${HOLE_RIM_RGB}, 1)`;
  ctx.lineWidth = o.light ? 5.2 : 4.4;
  ctx.globalAlpha = topLens * 0.35;
  ctx.beginPath();
  ctx.ellipse(hx, hy - hr * 0.09, eR * 1.10, eRy * 1.25, 0, Math.PI * 1.02, Math.PI * 1.98);
  ctx.stroke();

  // Core brilliant streak of upper arc
  ctx.lineWidth = o.light ? 2.6 : 2.0;
  ctx.globalAlpha = topLens * 0.95;
  ctx.beginPath();
  ctx.ellipse(hx, hy - hr * 0.07, eR * 1.05, eRy * 1.14, 0, Math.PI * 1.05, Math.PI * 1.95);
  ctx.stroke();

  // 3. Lower Lensed Underside Bow (reflected far-side bottom disc)
  ctx.lineWidth = o.light ? 3.6 : 3.0;
  ctx.globalAlpha = (o.light ? 0.25 : 0.38) * o.alpha * rimGlow;
  ctx.beginPath();
  ctx.ellipse(hx, hy + hr * 0.09, eR * 1.04, eRy * 1.12, 0, 0.08, Math.PI - 0.08);
  ctx.stroke();

  // 4. Pitch-Black Spherical Event Horizon Shadow (100% opaque cosmic void)
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = Math.min(1, o.alpha * 1.5);
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.arc(hx, hy, hr, 0, Math.PI * 2);
  ctx.fill();

  // Velvet shadow gradient for deep-black radial absorption
  const shadowGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, hr);
  shadowGrad.addColorStop(0, "rgba(0, 0, 0, 1)");
  shadowGrad.addColorStop(0.92, "rgba(0, 0, 0, 1)");
  shadowGrad.addColorStop(1, "rgba(0, 0, 0, 0.96)");
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.arc(hx, hy, hr, 0, Math.PI * 2);
  ctx.fill();

  // 5. Dual-Order Razor-Sharp Photon Rings (Einstein Critical Curves)
  ctx.globalCompositeOperation = o.light ? "source-over" : "lighter";
  ctx.strokeStyle = `rgba(${HOLE_RIM_RGB}, 1)`;
  const ringPhase = o.s * 0.75 * o.spin;
  const SEGS = 80;
  ctx.lineCap = "round";

  // Primary Photon Ring with Doppler Beaming (approaching side brighter)
  ctx.lineWidth = o.light ? 1.8 : 1.3;
  for (let k = 0; k < SEGS; k++) {
    const a0 = (k / SEGS) * Math.PI * 2;
    const a1 = ((k + 1) / SEGS) * Math.PI * 2;
    const am = (a0 + a1) / 2;
    // Doppler beaming: approaching side is significantly boosted
    const doppler = Math.pow(1 - 0.4 * Math.cos(am - ringPhase), 2.0);
    // Gravitational focusing on top & bottom arcs
    const lensFocus = 1 + 0.45 * Math.abs(Math.sin(am));
    ctx.globalAlpha = (o.light ? 0.95 : 0.88) * o.alpha * rimGlow * doppler * lensFocus;
    ctx.beginPath();
    ctx.ellipse(hx, hy, eR * 1.01, eRy * 1.01, 0, a0, a1);
    ctx.stroke();
  }

  // Secondary Sub-Ring (inner photon ring hugging the event horizon)
  ctx.lineWidth = o.light ? 1.0 : 0.8;
  ctx.globalAlpha = (o.light ? 0.45 : 0.6) * o.alpha * rimGlow;
  ctx.beginPath();
  ctx.ellipse(hx, hy, hr * 1.025, hr * 1.025 * Math.sin(FINAL_INC), 0, 0, Math.PI * 2);
  ctx.stroke();

  // 6. Direct Accretion Disc Throat (front near-side passing across lower shadow)
  ctx.lineWidth = o.light ? 3.0 : 2.4;
  ctx.globalAlpha = (o.light ? 0.65 : 0.8) * o.alpha * rimGlow;
  ctx.beginPath();
  ctx.ellipse(hx, hy, eR * 1.02, eRy * 1.02, 0, 0.1, Math.PI - 0.1);
  ctx.stroke();

  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
}

/**
 * Supernova Detonation Flash & Shockwave System — optimized for 60fps silky smooth rendering.
 */
export function drawDetonationFlash(
  ctx: CanvasRenderingContext2D,
  o: {
    x: number;
    y: number;
    w: number;
    h: number;
    unit: number;
    explodeW: number;
    light: boolean;
  },
) {
  const { x, y, w, h, unit, explodeW, light } = o;
  if (explodeW <= 0.001 || explodeW >= 0.98) return;

  // 1. Smooth Supernova Core Flare
  const flashEnvelope = Math.sin(clamp01(explodeW / 0.6) * Math.PI); // 0 -> 1 -> 0
  if (flashEnvelope > 0.01) {
    const flareRadius = unit * (1.2 + 8.0 * Math.pow(explodeW, 0.6));
    const fg = ctx.createRadialGradient(x, y, 0, x, y, flareRadius);
    fg.addColorStop(0, `rgba(255, 255, 255, ${0.9 * flashEnvelope})`);
    fg.addColorStop(0.2, `rgba(255, 230, 160, ${0.75 * flashEnvelope})`);
    fg.addColorStop(0.55, `rgba(255, 140, 50, ${0.4 * flashEnvelope})`);
    fg.addColorStop(1, "rgba(255, 100, 30, 0)");

    ctx.globalCompositeOperation = light ? "source-over" : "lighter";
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.arc(x, y, flareRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Concentric Expanding Shockwave Wavefront Rings
  const maxDim = Math.max(w, h);
  ctx.globalCompositeOperation = light ? "source-over" : "lighter";

  // Primary Shockfront
  const r1 = explodeW * maxDim * 0.95;
  const a1 = clamp01((1 - explodeW) * 0.75);
  if (a1 > 0.01) {
    ctx.strokeStyle = `rgba(255, 240, 200, ${a1 * 0.85})`;
    ctx.lineWidth = light ? 3.0 : 2.0;
    ctx.beginPath();
    ctx.arc(x, y, r1, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Secondary Soft Wave
  const r2 = Math.pow(explodeW, 0.88) * maxDim * 0.7;
  const a2 = clamp01((1 - explodeW * 0.9) * 0.55);
  if (a2 > 0.01) {
    ctx.strokeStyle = `rgba(255, 160, 60, ${a2 * 0.65})`;
    ctx.lineWidth = light ? 2.5 : 1.8;
    ctx.beginPath();
    ctx.arc(x, y, r2, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
}
