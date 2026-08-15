import { BRAIN_GLOW_RGB } from "./palettes";
import { makeIncliner, type P, type V3 } from "./types";

// Subtle dynamic 3D angle (~6°) for pristine lateral view
export const BRAIN_INC = 0.08;
const inBrainPlane = makeIncliner(BRAIN_INC);

// Global neural pulse frequency
const NEURAL_PULSE_SPEED = 2.4;

/**
 * 3D Neural AI Brain (Photorealistic Anatomical Lateral Sagittal Profile):
 * - Anterior / Left (X < 0): Frontal Lobe & Prefrontal Brow
 * - Superior / Top (Y < 0): Parietal Lobe Dorsal Dome
 * - Posterior / Right (X > 0): Occipital Lobe Visual Cortex
 * - Inferior / Bottom-Left (X in [-0.30, +0.08], Y in [+0.02, +0.18]): Temporal Lobe with Sylvian Fissure
 * - Inferior / Bottom-Right (X in [+0.15, +0.40], Y in [+0.08, +0.25]): Striated Cerebellum
 * - Inferior / Bottom-Center (X ~ +0.03, Y in [+0.16, +0.45]): Descending Brainstem Trunk
 */
export function brainForm(p: P, t: number): V3 {
  const nt = t * NEURAL_PULSE_SPEED;

  // ---------------------------------------------------------------------------
  // 1. Brainstem Trunk (8% of particles: p.f3 >= 0.92)
  // Narrow vertical neural cylinder descending from center-bottom
  // ---------------------------------------------------------------------------
  if (p.f3 >= 0.92) {
    const v = p.f1; // 0 -> 1 along stem length
    const by = 0.18 + v * 0.32; // +0.18 -> +0.50 descending
    const stemRad = (0.038 + (1 - v) * 0.018) * (0.7 + p.f2 * 0.6);
    const ang = p.f2 * Math.PI * 2;
    const bx = 0.03 + Math.cos(ang) * stemRad * 0.8;
    const bz = Math.sin(ang) * stemRad;
    const jitter = Math.sin(nt * 2.0 + v * 12.0) * 0.002;
    return inBrainPlane(bx + jitter, by, bz + jitter);
  }

  // ---------------------------------------------------------------------------
  // 2. Striated Cerebellum (12% of particles: p.f3 in [0.80, 0.92))
  // Cauliflower-like horizontal folia lobe tucked beneath occipital pole (bottom-right)
  // ---------------------------------------------------------------------------
  if (p.f3 >= 0.80 && p.f3 < 0.92) {
    const u = (p.f1 - 0.5) * 2; // -1 -> +1
    const v = (p.f2 - 0.5) * 2; // -1 -> +1
    const cx = 0.30 + u * 0.15 * Math.sqrt(Math.max(0, 1 - v * v * 0.75));
    const cy = 0.18 + v * 0.095;
    const cz = ((p.f3 - 0.80) / 0.12 - 0.5) * 0.20;
    // Layered horizontal folia striations
    const folia = Math.sin(cy * 55.0) * 0.005;
    return inBrainPlane(cx, cy + folia, cz);
  }

  // ---------------------------------------------------------------------------
  // 3. Primary Cortical Gyral Winding Strips (15% of particles: p.f3 in [0.65, 0.80))
  // Distinct S-curves and convolution tracks tracing iconic brain fissures
  // ---------------------------------------------------------------------------
  if (p.f3 >= 0.65 && p.f3 < 0.80) {
    const s = p.f1; // 0 -> 1 along strip length
    const track = Math.floor((p.f3 - 0.65) / 0.03); // 0 -> 4 distinct gyral tracks
    let tx = 0;
    let ty = 0;

    if (track === 0) {
      // Sylvian / Lateral Fissure (horizontal divider between frontal and temporal)
      tx = -0.36 + s * 0.52;
      ty = 0.02 - tx * 0.14 + Math.sin(s * 15.0) * 0.015;
    } else if (track === 1) {
      // Precentral Motor Strip (vertical ribbon down to Sylvian fissure)
      ty = -0.40 + s * 0.40;
      tx = -0.16 + s * 0.06 + Math.sin(s * 16.0) * 0.015;
    } else if (track === 2) {
      // Postcentral Sensory Strip
      ty = -0.42 + s * 0.40;
      tx = -0.04 + s * 0.05 + Math.sin(s * 16.0) * 0.015;
    } else if (track === 3) {
      // Prefrontal Brow Loops
      const a = s * Math.PI * 1.5;
      tx = -0.38 + Math.cos(a) * 0.16;
      ty = -0.14 + Math.sin(a) * 0.16;
    } else {
      // Superior Temporal Gyrus Ribbon
      tx = -0.30 + s * 0.45;
      ty = 0.09 - tx * 0.08 + Math.sin(s * 18.0) * 0.012;
    }

    const hemi = p.f2 > 0.5 ? 1 : -1;
    const tz = hemi * (0.04 + ((p.f2 * 10) % 1) * 0.20);
    const pulse = Math.sin(nt * 3.5 + s * 16.0 + track * 2.0) * 0.003;
    return inBrainPlane(tx, ty + pulse, tz);
  }

  // ---------------------------------------------------------------------------
  // 4. Main Cerebrum Volume & Cortical Gyri Mantle (65% of particles: p.f3 < 0.65)
  // Fully filled 3D anatomical hemisphere with continuous gyral surface convolutions
  // ---------------------------------------------------------------------------
  const u = (p.f1 - 0.5) * 2; // -1 (Frontal pole on left) -> +1 (Occipital pole on right)
  const v = p.f2; // 0 (Top of brain) -> 1 (Bottom of brain)

  // Anatomical sagittal boundaries at horizontal slice u:
  // Frontal brow on left extends to u = -1.0 (X = -0.54), Occipital pole on right extends to u = +1.0 (X = +0.52)
  const xBase = u < 0 ? u * 0.54 : u * 0.52;

  // Superior dorsal parietal arch dome (Top boundary: Y < 0)
  const topDomeH = Math.sqrt(Math.max(0, 1 - Math.pow(u * 0.94, 2)));
  const yTop = -0.40 * topDomeH;

  // Inferior boundary (Bottom curve: Y > 0)
  let yBottom = 0;
  if (u < -0.20) {
    // Frontal lobe base
    yBottom = 0.02 + 0.07 * (u + 0.20);
  } else if (u >= -0.20 && u <= 0.25) {
    // Temporal lobe bulge
    yBottom = 0.18 * (1 - Math.pow((u - 0.02) / 0.24, 2));
  } else {
    // Occipital lobe base (tucks up above cerebellum)
    yBottom = 0.04 - 0.07 * (u - 0.25);
  }

  // Linear vertical blend between top dome and bottom contour
  const yBase = yTop + v * (yBottom - yTop);

  // Winding Cortical Gyri & Sulci Foldings (intricate multi-frequency brain convolutions)
  const gyriAngle1 = yBase * 26.0 + xBase * 18.0;
  const gyriAngle2 = xBase * 28.0 - yBase * 20.0;
  const gyriX = Math.sin(gyriAngle1) * 0.018 * Math.cos(xBase * 15.0);
  const gyriY = Math.cos(gyriAngle2) * 0.018 * Math.sin(yBase * 18.0);

  // Sylvian Fissure cleft (deep dividing groove separating frontal from temporal)
  const inSylvianZone = xBase > -0.34 && xBase < 0.14 && yBase > -0.03 && yBase < 0.07;
  const sylvianCleft = inSylvianZone ? -0.025 * (1 - Math.pow((yBase - 0.018) / 0.05, 2)) : 0;

  // Left vs Right hemisphere 3D depth along Z axis
  const isRightHemi = p.f3 > 0.32;
  const hemiSign = isRightHemi ? 1 : -1;
  const depthNorm = isRightHemi ? (p.f3 - 0.32) / 0.33 : p.f3 / 0.32;
  const maxZ = Math.sqrt(Math.max(0, 1 - Math.pow(u * 0.90, 2))) * 0.28;
  const zBase = hemiSign * (0.028 + depthNorm * maxZ);

  const x = xBase + gyriX;
  const y = yBase + gyriY + sylvianCleft;
  const z = zBase + gyriX * 0.5;

  // Synaptic pulse travel along gyri
  const pulse = Math.sin(nt * 3.0 + u * 10.0 + v * 12.0) * 0.003;

  return inBrainPlane(x, y + pulse, z);
}

/**
 * 3D Neural AI Brain colour mapping:
 * 0: Firing Synapses (brilliant white) — on active action potential peaks
 * 1: Active Axons (electric cyan) — frontal & motor gyri
 * 2: Cortical Network (neon sky blue) — parietal gyri
 * 3: Neural Pathways (electric periwinkle) — cerebellum folia
 * 4: Cerebral Cortex (royal neon violet) — occipital visual cortex
 * 5: Synaptic Vesicles (luminous lavender) — active nodes
 * 6: Action Potentials (neural pink) — traveling impulses
 * 7: Deep Sulci / Fissures (deep neural indigo) — sylvian fissure & core
 */
export function brainColor(p: P): number {
  // Firing action potentials (active synaptic sparkle)
  if (p.f1 < 0.08 || p.f1 > 0.92) return 0; // brilliant white firing nodes
  // Brainstem
  if (p.f3 >= 0.92) return 1; // electric cyan
  // Cerebellum
  if (p.f3 >= 0.80 && p.f3 < 0.92) return p.f2 > 0.5 ? 3 : 5; // periwinkle / lavender
  // Winding gyri strips
  if (p.f3 >= 0.65 && p.f3 < 0.80) return p.f2 < 0.5 ? 1 : 6; // electric cyan / neural pink
  // Main Cerebrum surface
  if (p.f2 > 0.60) {
    if (p.f1 < 0.35) return 1; // electric cyan on frontal
    if (p.f1 < 0.65) return 2; // neon sky blue on parietal/motor
    return 4; // royal neon violet on occipital
  }
  // Deep sulci & core
  return p.f2 < 0.35 ? 7 : 4; // deep indigo / royal violet
}

/**
 * Brain shape by role — all surface gyri, winding strips, and cerebellum render as fine glowing spherical dots.
 */
export function brainSphere(p: P): boolean {
  if (p.f3 >= 0.92) return false; // Brainstem — axon shards
  if (p.f3 >= 0.65) return true; // Winding strips & Cerebellum — 100% glowing dots
  return p.f2 > 0.25; // Surface & mid-layer cerebrum — 100% glowing dots
}

/**
 * Brain light — active synaptic action potentials fire with high-speed electrical spikes.
 */
export function brainLight(p: P, depth: number, s: number = 0): number {
  const nt = s * NEURAL_PULSE_SPEED;
  // Surface Synapses & Gyri: bright and radiant
  if (p.f3 >= 0.65 || p.f2 > 0.55) {
    const spike = Math.pow(Math.max(0, Math.sin(nt * 4.0 + p.f1 * 16.0)), 2.8);
    return (1.25 + 0.70 * spike + 0.35 * depth);
  }
  // Cerebellum & Brainstem
  if (p.f3 >= 0.80) {
    const flow = 1 + 0.18 * Math.sin(nt * 2.0 + p.f1 * 10.0);
    return (0.85 + 0.30 * depth) * flow;
  }
  // Deep Interior: subtle, dark background
  return (0.65 + 0.35 * depth);
}

/**
 * Volumetric Neural Synapse Glow — renders a soft, photorealistic electric cyan & royal violet
 * neural aura and volumetric holographic glow on the canvas behind the lateral brain.
 */
export function drawBrainSynapseGlow(
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
  const brainRadX = o.unit * 0.95;
  const brainRadY = o.unit * 0.76;
  const haloRad = o.unit * 1.35;

  // 1. Soft Royal Violet Cortical Aura
  ctx.globalCompositeOperation = o.light ? "source-over" : "lighter";
  const violetGrad = ctx.createRadialGradient(hx, hy, brainRadX * 0.35, hx, hy, haloRad);
  violetGrad.addColorStop(0, `rgba(168, 85, 247, ${0.30 * o.alpha})`);
  violetGrad.addColorStop(0.4, `rgba(99, 102, 241, ${0.14 * o.alpha})`);
  violetGrad.addColorStop(0.75, `rgba(59, 130, 246, ${0.03 * o.alpha})`);
  violetGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

  ctx.fillStyle = violetGrad;
  ctx.beginPath();
  ctx.arc(hx, hy, haloRad, 0, Math.PI * 2);
  ctx.fill();

  // 2. Electric Cyan Synaptic Core Pulse
  const cyanGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, brainRadX);
  const pulse = 1 + 0.08 * Math.sin(o.s * 3.0);
  cyanGrad.addColorStop(0, `rgba(${BRAIN_GLOW_RGB}, ${0.42 * o.alpha * pulse})`);
  cyanGrad.addColorStop(0.35, `rgba(${BRAIN_GLOW_RGB}, ${0.18 * o.alpha * pulse})`);
  cyanGrad.addColorStop(0.7, `rgba(147, 51, 234, ${0.06 * o.alpha})`);
  cyanGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

  ctx.save();
  ctx.translate(hx, hy);
  ctx.scale(1, brainRadY / brainRadX);
  ctx.beginPath();
  ctx.arc(0, 0, brainRadX, 0, Math.PI * 2);
  ctx.fillStyle = cyanGrad;
  ctx.fill();
  ctx.restore();

  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
}
