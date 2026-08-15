"use client";

import { useEffect, useRef } from "react";

import { ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";
import { useReducedMotion } from "motion/react";

import { getLenis } from "@/components/motion/lenis";
import { hasFinePointer } from "@/lib/motion";

import { buildAmbient, type Ambient } from "./ambient";
import {
  BURST_BLACK_END,
  BURST_BLACK_START,
  BURST_EXPLODE_END,
  BURST_SPIN_END,
  BURST_TIMEOUT,
  OVERSHOOT_TOUCH_PX,
  OVERSHOOT_WHEEL_PX,
  burstPosition,
  drawBlackHole,
  drawDetonationFlash,
  finalLight,
  holeColor,
  holeState,
} from "./black-hole";
import { BOUNDARY_KEYS, FORM_FNS, FORMS } from "./composition";
import { DISP_STYLES, dispersionTarget } from "./dispersion";
import { buildEarth, drawEarthAtmosphere } from "./earth";
import {
  drawGalaxyCoreGlow,
  galaxyColor,
  galaxyLight,
  galaxySphere,
} from "./galaxy";
import {
  BRAIN_DARK,
  BRAIN_GLOW_RGB,
  BRAIN_LIGHT,
  DARK_GLOW_RGB,
  DARK_PALETTE,
  EARTH_DARK,
  EARTH_LIGHT,
  GALAXY_DARK,
  GALAXY_GLOW_RGB,
  GALAXY_LIGHT,
  HOLE_DARK,
  HOLE_LIGHT,
  LIGHT_GLOW_RGB,
  LIGHT_PALETTE,
  SOLAR_DARK,
  SOLAR_LIGHT,
  SUN_CORONA_RGB,
} from "./palettes";
import {
  brainColor,
  brainLight,
  brainSphere,
  drawBrainSynapseGlow,
} from "./brain";
import {
  drawSunCorona,
  solarColor,
  solarLight,
  solarSphere,
} from "./solar";
import { clamp01, smoothstep, type P } from "./types";
import { waveLight } from "./wave";

/*
 * The global triangle scene. ONE fixed canvas behind the entire homepage
 * that owns every triangle on the page. The pieces are a persistent physical
 * material: as the user scrolls through the real sections, the same
 * instances continuously reshape themselves from one form into the next —
 * there is no separate animation inside any section, and nothing resets.
 *
 *   HERO     earth   the assembled globe, right of the type, holding while
 *                    the hero's short pin lets it breathe
 *   ABOUT    galaxy  the globe dissolves into a tilted spiral galaxy —
 *                    warm bulging core, arms with dark dust lanes and pink
 *                    star-forming knots, sphere star clusters amid the
 *                    shards, a diffuse disc and faint halo — beside the copy
 *   WORK     orbit   the galaxy spins down into three orbital rings beside
 *                    the projects
 *   STACK    wave    a volumetric flowing surface beside the skills list
 *   ML       solar   a glowing sun with planets orbiting on concentric
 *                    rings and a scattered asteroid belt
 *   CONTACT  final   the material collapses into a black hole — a tilted
 *                    accretion disc orbiting a dark event horizon, its
 *                    photon ring and lensed far-side arc cresting over the
 *                    shadow as it powers up, holding as the page closes;
 *                    overscrolling past the bottom whips it into a frenzy,
 *                    detonates every piece across the screen, blacks out
 *                    for a second, and rides back to the top
 *
 * Every handover between two forms is a full-screen dispersion: the pieces
 * detach from the structure, burst across the whole viewport in 3D, hold as
 * a floating field, then converge into the next form. Each boundary has its
 * own personality (gentle, rotational, directional, violent, soft), the
 * camera pulls back and recentres so the viewer is surrounded by the
 * material, and the whole sequence is scrubbed by scroll — perfectly
 * reversible, and the pieces are always trackable (nothing pops or fades
 * into a new place).
 *
 * Around all of it drifts a second, ambient layer: a sparse, dim, clustered
 * cloud of the same triangle material in the negative space — three depth
 * layers, slow organic drift, cursor parallax on fine pointers, and a
 * density that breathes with the sections. The main forms always dominate.
 *
 * The page measures its own section offsets (spacers from pinned sections
 * are already laid out by the time this effect runs), so the boundaries
 * always track the real content. Same palette, same triangle glyphs and
 * stroke treatment throughout. Reduced-motion renders nothing; mobile gets
 * fewer, larger pieces.
 *
 * The shapes themselves live in sibling modules — earth.ts, galaxy.ts,
 * orbit.ts, wave.ts, solar.ts, black-hole.ts — each with its own layout,
 * colours, lighting and draw passes, so one shape can be changed in
 * isolation.
 */

const DEPTH_LAYERS = 8;
const ROT_SPEED = 0.02; // rad/s — the material's resting rotation
// Max Y-rotation. The flat cosmic discs (galaxy, solar system, black hole)
// are inclined orbital planes — as the scene's accumulated Y-rotation swings
// their normal toward the view axis they collapse edge-on and read as a
// line. The earliest any form flattens is ~1.71 rad (the galaxy at minimum
// X-tilt), so the rotation is clamped well below that: every shape keeps a
// readable 3/4 perspective forever, no matter how long the page is open.
const ROT_Y_MAX = 1.4;
const SWAY_X = 0.028;
const BASE_TILT_X = 0.14;
const ASSEMBLY_MS = 1900; // "world being generated" at load
const TWINKLE_RATE = 0.002;
const GLOW_DECAY = 0.9;

/**
 * One fixed canvas behind the whole page — the only triangle scene there is.
 * Sections provide content and boundaries; this scene owns the material.
 */
export function TriangleWorld() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blackoutRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const reduce = !!useReducedMotion();
  const paletteRef = useRef<string[]>(DARK_PALETTE);
  const glowRgbRef = useRef(DARK_GLOW_RGB);
  // Light theme renders on a pale page: strokes are thicker, alphas higher,
  // and the additive glow layers switch to plain compositing (adding to
  // white is invisible) so the shapes and motes actually read.
  const lightModeRef = useRef(false);
  const renderRef = useRef<((ms: number, animated: boolean) => void) | null>(null);

  useEffect(() => {
    const light = resolvedTheme === "light";
    paletteRef.current = light ? LIGHT_PALETTE : DARK_PALETTE;
    glowRgbRef.current = light ? LIGHT_GLOW_RGB : DARK_GLOW_RGB;
    lightModeRef.current = light;
    renderRef.current?.(0, false);
  }, [resolvedTheme]);

  useEffect(() => {
    if (reduce) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const blackoutEl = blackoutRef.current;
    const hintEl = hintRef.current;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let particles: P[] = [];
    let ambient: Ambient[] = [];
    const anchors: Record<string, number> = {};
    const colorCount = DARK_PALETTE.length;
    // Shared palette + the hole's accretion tones + the galaxy's tones share
    // one key space, so the batch stride must cover all of them (earth tones
    // reuse 0..5 of the shared range while the earth owns the scene).
    const maxTone =
      Math.max(colorCount, EARTH_DARK.length) +
      HOLE_DARK.length +
      GALAXY_DARK.length +
      SOLAR_DARK.length +
      BRAIN_DARK.length;
    const depthLayer = (z: number) =>
      Math.min(DEPTH_LAYERS - 1, Math.max(0, Math.floor(z * DEPTH_LAYERS)));

    let screenX = new Float32Array(0);
    let screenY = new Float32Array(0);
    let viewZ = new Float32Array(0);
    let sizeA = new Float32Array(0);
    let alphaA = new Float32Array(0);
    // Cached (scrollHeight forces a reflow — never read it in the hot path).
    let maxScroll = 0;

    let tSec = 0;
    let last = performance.now();
    let raf = 0;
    let tabVisible = true;
    let resizeTimer = 0;
    // Subtle pointer parallax — the material leans toward the cursor (fine
    // pointers only), restoring the physical-object feel of the old hero.
    let mouseX = 0;
    let mouseY = 0;
    // A faster-smoothed cursor pair drives the per-piece repulsion, so the
    // main motes push away from the pointer more responsively than the
    // slow camera parallax above. The push only engages after the pointer
    // has actually moved — repX/repY start at 0 (screen centre), so without
    // the gate the globe would get a static dent on load.
    let repX = 0;
    let repY = 0;
    let pointerMoved = false;
    let targetX = 0;
    let targetY = 0;
    const fine = hasFinePointer() && window.innerWidth >= 768;

    const measure = () => {
      const pick = (id: string) => {
        const el = document.getElementById(id);
        return el ? el.getBoundingClientRect().top + window.scrollY : 0;
      };
      anchors.about = pick("about");
      anchors.work = pick("work");
      anchors.stack = pick("stack");
      anchors.ml = pick("ml-notebook") || pick("ml") || 0;
      anchors.contact = pick("contact");
      const footerEl = document.querySelector("footer");
      anchors.footer = footerEl
        ? footerEl.getBoundingClientRect().top + window.scrollY
        : 0;
      maxScroll = Math.max(
        0,
        (document.documentElement.scrollHeight || 0) - (window.innerHeight || h),
      );
    };

    const rebuild = () => {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(rect.width, 1);
      h = Math.max(rect.height, 1);
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      const density = w < 640 ? 460 : w < 1024 ? 520 : 560;
      const min = w < 640 ? 400 : w < 1024 ? 900 : 1800;
      const max = w < 640 ? 1100 : w < 1024 ? 2400 : 3200;
      const count = Math.max(min, Math.min(max, Math.round((w * h) / density)));
      particles = buildEarth(count, w);
      // Ambient stays a background layer, but it must be visible and
      // plentiful enough to read as a drifting cloud — ~260 on desktop,
      // still ~150 on mobile so the cloud reads on small screens too. The
      // pieces stay small and dim, so density can be higher without
      // competing with the main forms.
      ambient = buildAmbient(w < 640 ? 180 : w < 1024 ? 230 : 360);
      const n = particles.length;
      screenX = new Float32Array(n);
      screenY = new Float32Array(n);
      viewZ = new Float32Array(n);
      sizeA = new Float32Array(n);
      alphaA = new Float32Array(n);
      measure();
    };

    const render = (ms: number, animated: boolean) => {
      if (!w || !h) return;
      const bw = Math.round(w * dpr);
      const bh = Math.round(h * dpr);
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const s = animated ? ms / 1000 : 0;
      let asm = 1;
      if (animated) {
        asm = 1 - Math.pow(1 - clamp01(ms / ASSEMBLY_MS), 3);
      }
      const y = window.scrollY;
      const ih = window.innerHeight || h;

      // ---- Form weights (section-anchored) ---------------------------
      // The contact and footer section tops sit below the point where the
      // page runs out of scroll, so the closing act is repositioned into the
      // reachable range — the final dispersion must complete while the user
      // can still scroll, leaving the calm final gather holding at the bottom.
      const rawB = BOUNDARY_KEYS.map((key, i) => {
        let v = 0;
        if (key === "ml") v = anchors.ml || 0;
        else if (key === "footer") v = anchors.footer || 0;
        else v = anchors[key] ?? 0;
        if (v > 0) return v;
        // Missing section id — fall forward to the next boundary that
        // exists so the handover skips instead of collapsing to the top.
        for (let j = i + 1; j < BOUNDARY_KEYS.length; j++) {
          const k = BOUNDARY_KEYS[j];
          const w2 =
            k === "ml" ? anchors.ml : k === "footer" ? anchors.footer : anchors[k];
          if (w2 && w2 > 0) return w2;
        }
        return anchors.contact || 0;
      });
      const B = rawB.map((v, i) => {
        // The contact → final dispersion needs to finish while the user can
        // still scroll, so it moves back into reach.
        if (i === BOUNDARY_KEYS.length - 2) {
          return Math.min(v, Math.max(maxScroll - 0.85 * ih, rawB[i - 1] + 1.2 * ih));
        }
        return v;
      });
      // Boundaries ARE the section tops (see the section-anchored note
      // above) — no even-cadence redistribution, so a form can never drift
      // away from the content it belongs to as the page grows. Windows are
      // equal-width so every handover stays linear and scrubbed.
      const totalScroll = Math.max(maxScroll, 1);
      const nB = B.length; // one boundary (and window) per form handover
      const hw = Math.min(0.5 * ih, totalScroll / (4 * nB)); // transition half-width
      const C = B.slice();
      // No window may swallow the form between two of them — push later
      // boundaries forward so every form keeps a real moment on screen.
      const MIN_LIFE = 0.5 * ih;
      for (let i = 1; i < C.length; i++) {
        C[i] = Math.max(C[i], C[i - 1] + 2 * hw + MIN_LIFE);
      }
      // The world → void fade (footer boundary) must stay unreachable so the
      // black hole holds while the page runs out of scroll.
      C[C.length - 1] = Math.max(C[C.length - 1], totalScroll + hw + 100);
      const halfW = C.map(() => hw);
      const weights = FORMS.map((_, i) => {
        const inW = i === 0 ? 1 : smoothstep((y - (C[i - 1] - halfW[i - 1])) / (2 * halfW[i - 1]));
        const outW = 1 - smoothstep((y - (C[i] - halfW[i])) / (2 * halfW[i]));
        return inW * outW;
      });
      const total = weights.reduce((a, b) => a + b, 0);
      if (total <= 0.02) return; // after the last handover (footer fades the world out)

      const fw = weights.map((x) => x / total);
      const wEarth = fw[0];
      const wGalaxy = fw[1];
      // The galaxy spins actively with its own internal density wave dynamics
      const galFreeze = 0;
      const wBrain = fw[2];
      const wWave = fw[3];
      const wSolar = fw[4];
      const wFinal = fw[5];

      // The black hole powers up as the page closes: the deeper the scroll
      // (and the more the final form owns the scene), the faster the disc
      // spins and the larger the horizon swells — a calm hole becomes a
      // devouring one. Read by finalForm, the ambient gravity and the
      // event-horizon draw.
      holeState.finalPower = wFinal * clamp01(y / Math.max(maxScroll, 1));
      holeState.finalSpin = 1 + holeState.finalPower * 1.4;
      holeState.finalGrow = 1 + holeState.finalPower * 0.16;

      // ---- Overscroll climax (the black hole burst) -------------------
      // If the user keeps scrolling past the bottom of the page, the hole
      // spins up violently, detonates — every piece blasted across the
      // screen — then everything blacks out for a second while the page
      // rides back to the top, the black lifting on the hero. The sequence
      // is clock-driven (performance.now), so it plays even though the
      // scroll can't move any further.
      // ---- Overscroll climax (the black hole burst) -------------------
      // If the user keeps scrolling past the bottom of the page, the hole
      // spins up violently, detonates — every piece blasted across the
      // screen — then everything blacks out for a second while the page
      // rides back to the top, the black lifting on the hero. The sequence
      // is clock-driven (performance.now), so it plays even though the
      // scroll can't move any further.
      let burstActive = holeState.burstStartMs >= 0;
      let bt = burstActive ? (performance.now() - holeState.burstStartMs) / 1000 : -1;
      if (burstActive && bt > BURST_TIMEOUT) {
        holeState.burstStartMs = -1;
        holeState.burstScrollSent = false;
        holeState.rideDoneMs = -1;
        burstActive = false;
        bt = -1;
      }
      const spinEnv = burstActive
        ? Math.sin(clamp01(bt / BURST_SPIN_END) * Math.PI)
        : 0; // 0 → 1 → 0 across the spin phase

      const rawExp = burstActive && bt >= BURST_SPIN_END
        ? clamp01((bt - BURST_SPIN_END) / (BURST_EXPLODE_END - BURST_SPIN_END))
        : 0;
      // Smooth cubic ease-out: graceful, continuous, silky cosmic expansion
      const explodeW = burstActive && bt >= BURST_SPIN_END
        ? 1 - Math.pow(1 - rawExp, 1.8)
        : 0;

      // Full-screen blackout — fades in fast as the blast peaks, holds while
      // the page rides to the top, and only starts fading once the ride has
      // actually landed (or a safety fallback if it stalls). The reveal is
      // keyed to the ride's completion so the black can never lift while the
      // page is still mid-climb — the earth is always in place underneath.
      const rideDoneAt =
        holeState.rideDoneMs >= 0 ? (performance.now() - holeState.rideDoneMs) / 1000 : -1;
      const revealT =
        rideDoneAt >= 0 ? rideDoneAt : Math.max(0, bt - (BURST_BLACK_END + 0.5));
      const blackK = burstActive
        ? smoothstep(clamp01((bt - BURST_BLACK_START) / 0.2)) *
          (1 - smoothstep(clamp01(revealT / 0.35)))
        : 0;
      if (blackoutEl) blackoutEl.style.opacity = String(blackK);
      // "Keep scrolling" hint — appears once the hole owns the scene and
      // the overscroll climax is triggerable, hiding the moment it begins.
      if (hintEl) {
        hintEl.style.opacity = burstActive
          ? "0"
          : String(smoothstep(clamp01((holeState.finalPower - 0.45) / 0.35)));
      }
      // The blast overrides the scene from detonation through the blackout:
      // pieces fly out to their blast targets directly (no laggy chase that
      // trails them near the middle) and hold the exploded field while the
      // page rides back to the top under the black. The override releases in
      // a quick window under full black, right as the ride lands, so the
      // black lifts onto the clean scroll-driven scene (the earth) at the top.
      const burstOn = burstActive
        ? smoothstep(clamp01((bt - BURST_SPIN_END) / 0.12)) *
          (1 - smoothstep(clamp01(revealT / 0.12)))
        : 0;
      // The spin phase whips the hole to a frenzy — the disc accelerates,
      // the horizon swells and the rim ignites as matter is torn inward.
      if (burstActive) {
        holeState.finalSpin *= 1 + 5.5 * spinEnv;
        holeState.finalPower *= 1 + 0.65 * spinEnv;
        holeState.finalGrow *= 1 + 0.25 * spinEnv;
      }
      // As the blackout lands, ride the page back to the top underneath it.
      if (burstActive && !holeState.burstScrollSent && bt >= BURST_BLACK_START) {
        holeState.burstScrollSent = true;
        const lenis = getLenis();
        if (lenis) {
          lenis.scrollTo(0, {
            duration: 1.0,
            easing: (t: number) => 1 - Math.pow(1 - t, 3),
            // Lock input for the ride — otherwise the user's own continuing
            // scroll kills the animation and the page stops partway.
            lock: true,
            // The blackout and the burst override only release once the ride
            // has really landed, so the reveal always happens at the top.
            onComplete: () => {
              holeState.rideDoneMs = performance.now();
            },
          });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }

      const ACTIVE = fw
        .map((weight, i) => ({ weight, i }))
        .filter((f) => f.weight > 0.001);

      // Depth handling blended by the earth weight — the globe hides its far
      // hemisphere, the forms normalise a wider z range to 0..1 so far pieces
      // stay visible as small, dim shards.
      const depthFx =
        wGalaxy * 0.5 + wBrain * 0.25 + wWave * 0.18 + wSolar * 0.4 + wFinal * 0.3;

      // ---- Active dispersion (the boundary currently being crossed) ---
      let dispI = -1;
      let dispP = 0;
      for (let i = 0; i < C.length; i++) {
        if (y >= C[i] - halfW[i] && y <= C[i] + halfW[i]) {
          dispI = i;
          // Plain linear ramp — constant scroll velocity through the whole
          // transformation (the user's "smooth and linear" ask).
          dispP = clamp01((y - (C[i] - halfW[i])) / (2 * halfW[i]));
          break;
        }
      }
      const dispStyle = dispI >= 0 ? DISP_STYLES[dispI] : null;
      // Phase progress is LINEAR in scroll: dispP is a plain ramp (no
      // smoothstep envelope), so every pixel of scroll moves the pieces the
      // same distance — constant, scrubbed, reversible motion. The pieces
      // fade in and out gently via dispVis so the reel still starts and
      // ends softly, but position travels at a steady pace throughout.
      const t1 = dispI >= 0 ? clamp01(dispP / 0.42) : 0; // A → dispersion
      const t2 = dispI >= 0 ? clamp01((dispP - 0.58) / 0.42) : 0; // dispersion → B
      const dispVis =
        dispI >= 0 ? (dispP < 0.58 ? smoothstep(clamp01(dispP / 0.5)) : 1 - t2) : 0;
      const dispCam = dispI >= 0 ? (dispP < 0.58 ? clamp01(dispP / 0.42) : 1 - t2) : 0;

      // ---- Camera / composition -------------------------------------
      // The Earth's hold is scroll-driven too: while the globe owns the
      // scene (from the top of the page to where its dispersion begins) the
      // scroll progressively turns the globe and pulls the camera closer, so
      // scrolling always animates — there is never a dead stretch before the
      // handover. Progress is linear: every pixel of scroll turns the globe
      // by the same amount, so the motion is constant and scrubbed.
      const earthHoldEnd = Math.max(C[0] - halfW[0], 1);
      const earthProg = clamp01(y / earthHoldEnd);

      // Y-axis scene rotation (Yaw):
      // The Earth globe turns actively with the scroll (rotates around Y).
      // For all cosmic disc/surface forms (Galaxy, Orbit, Wave, Solar, Black Hole),
      // the camera yaw stays horizontal (facing the viewer directly) so the forms
      // project as balanced horizontal ellipses and surfaces rather than slanted "\" diagonal slashes.
      const earthTurn = earthProg * 0.85 + s * 0.04;
      const cosmicSway = Math.sin(s * 0.08) * 0.02;
      const rotY = Math.min(
        ROT_Y_MAX,
        Math.max(
          -ROT_Y_MAX,
          earthTurn * wEarth + cosmicSway * (1 - wEarth),
        ),
      );

      // X-axis scene pitch (Tilt):
      // Clean forward tilt so cosmic discs have depth without vertical distortion
      const baseTilt = BASE_TILT_X * (0.85 * wEarth + 0.6 * (1 - wEarth));
      const rotX =
        baseTilt +
        SWAY_X * 0.4 * Math.sin(s * 0.12) * (1 - wEarth * 0.5) +
        (fine ? mouseX * 0.045 : 0);
      const cy = Math.cos(rotY);
      const sy = Math.sin(rotY);
      const cx = Math.cos(rotX);
      const sx = Math.sin(rotX);

      // Earth keeps its poster framing (right of the hero type); the other
      // forms sit where their section wants them. Composition blends by the
      // same normalised weights as the piece positions, so the whole scene —
      // position AND camera — moves as one.
      const earthCx = w < 640 ? 0.5 : w < 1024 ? 0.64 : 0.73;
      const cxBlend = fw.reduce((acc, wgt, i) => {
        const c = i === 0 ? earthCx : w < 640 ? 0.5 : FORMS[i].cx;
        return acc + wgt * c;
      }, 0);
      const oyBlend = fw.reduce((acc, wgt, i) => {
        // On mobile every form is centred behind the content, so the wave
        // drops low enough to stay clear of the Stack heading, and the
        // Earth rises to sit ABOVE the hero headline card (the glass would
        // otherwise hide the whole globe behind it).
        const oy =
          w < 640 && FORMS[i].key === "brain"
            ? 0.58
            : w < 640 && FORMS[i].key === "earth"
              ? 0.24
              : FORMS[i].oy;
        return acc + wgt * oy;
      }, 0);
      const zoom = fw.reduce((acc, wgt, i) => acc + wgt * FORMS[i].zoom, 0);
      const sizeMul = fw.reduce((acc, wgt, i) => acc + wgt * FORMS[i].size, 0);

      const visualW = w < 640 ? w : w < 1024 ? w * 0.72 : w * 0.54;
      // On mobile the forms sit behind the content panels, so they render
      // ~28% smaller — a complete, readable object that shows through the
      // translucent glass instead of a giant shape spilling off-screen.
      const baseUnit =
        Math.min(visualW * 0.46, h * 0.44) *
        (w < 640 ? 0.72 : 1) *
        zoom *
        sizeMul *
        (1 + 0.012 * Math.sin(s * 0.25) * (1 - galFreeze)) *
        (1 + earthProg * wEarth * 0.14); // the camera glides closer on scroll
      // During dispersion the camera pulls back and recentres so the viewer
      // is surrounded by fragments; the overscroll burst keeps an expansive
      // field of view so the blast sweeps across and beyond the viewport.
      const pull = dispStyle ? dispStyle.camera : 1;
      const burstPull = 0.85; // expansive scale so particles flood across the whole viewport
      const camK = Math.max(dispCam, burstOn * 0.3);
      const unit = baseUnit * (1 - Math.max(dispCam * (1 - pull), burstOn * (1 - burstPull)));
      const cxEff = 0.5 + (cxBlend - 0.5) * (1 - camK);
      const oyEff = 0.5 + (oyBlend - 0.5) * (1 - camK);

      // Subtle cinematic micro-rumble during detonation peak
      let shakeX = 0;
      let shakeY = 0;
      if (burstActive && bt >= BURST_SPIN_END && rawExp < 0.45) {
        const shakeIntensity = Math.sin(clamp01(rawExp / 0.45) * Math.PI) * (1 - rawExp);
        const freq = bt * 28;
        shakeX = Math.sin(freq * 1.2) * 3.0 * shakeIntensity;
        shakeY = Math.cos(freq * 1.5) * 2.0 * shakeIntensity;
      }

      if (fine) {
        mouseX += (targetX - mouseX) * 0.045;
        mouseY += (targetY - mouseY) * 0.045;
        repX += (targetX - repX) * 0.1;
        repY += (targetY - repY) * 0.1;
      }
      const ox = w * cxEff + (fine ? mouseX * unit * 0.07 : 0) + shakeX;
      const oy = h * oyEff + (fine ? mouseY * unit * 0.055 : 0) + shakeY;
      const glyphScale = w < 640 ? 1.15 : 1;
      const palette = paletteRef.current;
      const lightMode = lightModeRef.current;
      // While the earth owns the scene, pieces draw in terrain tones (blue
      // water, coloured land); as it hands over to the galaxy they return
      // to the shared palette mid-dispersion, where the swap is invisible.
      const earthPalette = lightMode ? EARTH_LIGHT : EARTH_DARK;
      const earthTone = wEarth > 0.2;
      const strokePalette = earthTone ? earthPalette : palette;
      const holePalette = lightMode ? HOLE_LIGHT : HOLE_DARK;
      const galaxyPalette = lightMode ? GALAXY_LIGHT : GALAXY_DARK;
      const solarPalette = lightMode ? SOLAR_LIGHT : SOLAR_DARK;
      const brainPalette = lightMode ? BRAIN_LIGHT : BRAIN_DARK;
      const toneCount = maxTone; // shared + hole + galaxy + solar + brain share one key space
      const colorStyle = (i: number) => {
        if (i < colorCount) return strokePalette[i];
        const hOffset = colorCount;
        if (i < hOffset + HOLE_DARK.length) return holePalette[i - hOffset];
        const gOffset = hOffset + HOLE_DARK.length;
        if (i < gOffset + GALAXY_DARK.length) return galaxyPalette[i - gOffset];
        const sOffset = gOffset + GALAXY_DARK.length;
        if (i < sOffset + SOLAR_DARK.length) return solarPalette[i - sOffset];
        const bOffset = sOffset + SOLAR_DARK.length;
        if (i < bOffset + BRAIN_DARK.length) return brainPalette[i - bOffset];
        return strokePalette[0];
      };
      // 1px hairlines vanish on a pale page — light theme draws thicker.
      const strokeW = lightMode ? 1.6 : 1;

      // ---- Ambient layer — drawn first, under everything -------------
      ctx.globalCompositeOperation = "source-over";
      ctx.lineWidth = lightMode ? 1.3 : 1;
      const aStep = (Math.PI * 2) / 3;
      const ambientMod =
        clamp01(0.95 + 0.25 * wGalaxy + 0.1 * wSolar - 0.3 * wFinal) *
        (w < 640 ? 1.05 : 1);
      const aUnit = unit * 1.2;
      const aOx = w * 0.5;
      const aOy = h * 0.5;
      // Light mode needs a stronger base — the same cloud, clearly visible
      // against the pale background instead of sinking into it.
      const ambientBase = lightMode
        ? [0.26, 0.36, 0.46] // far / mid / near
        : [0.16, 0.24, 0.32];
      for (const a of ambient) {
        // All three depth layers render on every screen — the far layer is
        // what gives the cloud its atmospheric spread on mobile too.
        // While the galaxy owns the scene the whole cloud settles too — the
        // frozen galaxy page holds perfectly still (drift, flicker and spin
        // all suppressed), so nothing on that page changes over time.
        const t = s * a.speed * (1 - galFreeze);
        const amp = a.layer === 0 ? 0.05 : a.layer === 1 ? 0.08 : 0.12;
        let ax =
          a.bx +
          Math.sin(t * 0.5 + a.ph) * amp +
          Math.cos(s * 0.025 + a.dir) * 0.03 * (1 - galFreeze);
        let ay =
          a.by +
          Math.cos(t * 0.42 + a.ph * 1.7) * amp * 0.8 +
          Math.sin(s * 0.02 + a.dir) * 0.03 * (1 - galFreeze);
        // Gentle scroll sway — far pieces barely move, near ones breathe more.
        ay += Math.sin(y * 0.00035 + a.ph * 2) * 0.04 * (0.4 + a.bz * 0.9);
        let az = clamp01(a.bz + Math.sin(t * 0.3 + a.ph * 2.3) * amp * 0.5);
        // A few pieces lean toward the main structure while it disperses.
        if (a.pull > 0 && dispVis > 0.02) {
          const k = a.pull * dispVis * 0.5;
          ax += (0 - ax) * k;
          ay += (0 - ay) * k;
          az += (0.4 - az) * k;
        }
        // Black hole gravity + supersonic overscroll burst shockwave
        let swallowed = 1;
        if (burstActive && bt >= BURST_SPIN_END) {
          // Smooth ambient expansion across the screen
          const hx = (ox - aOx) / aUnit;
          const hy = (oy - aOy) / aUnit;
          const dx = ax - hx;
          const dy = ay - hy;
          const dist = Math.hypot(dx, dy) + 0.05;
          const shockForce = (3.5 + a.bz * 4.0) * explodeW;
          ax += (dx / dist) * shockForce;
          ay += (dy / dist) * shockForce;
          az = clamp01(az + (a.bz - 0.45) * explodeW * 0.8);
          swallowed = 1;
        } else if (wFinal > 0.3) {
          const g = clamp01((wFinal - 0.3) / 0.5);
          const hx = (ox - aOx) / aUnit;
          const hy = (oy - aOy) / aUnit;
          const d = Math.hypot(ax - hx, ay - hy);
          // Stronger pull as the hole powers up — the whole page quietly
          // drains into the singularity faster near the bottom.
          const pull = g * (0.4 + holeState.finalPower * 0.6) * clamp01(1.15 - d);
          ax += (hx - ax) * pull * 0.3;
          ay += (hy - ay) * pull * 0.3;
          swallowed = clamp01((d - 0.1) / 0.22); // fade just before the rim
        }
        const parK = 0.35 + az * 0.9; // far pieces move less with the pointer
        let sx = aOx + ax * aUnit + (fine ? mouseX * unit * 0.05 * parK : 0);
        let sy = aOy + ay * aUnit + (fine ? mouseY * unit * 0.04 * parK : 0);

        // Gravitational Lensing light deflection on ambient motes passing near the black hole core
        if (wFinal > 0.05 && (!burstActive || bt < BURST_SPIN_END)) {
          const aldx = sx - ox;
          const aldy = sy - oy;
          const ald2 = aldx * aldx + aldy * aldy;
          const aHr = unit * 0.26 * (1 + holeState.finalPower * 0.45);
          const aLensRad = aHr * 3.2;
          if (ald2 < aLensRad * aLensRad && ald2 > 1e-5) {
            const ald = Math.sqrt(ald2);
            const alFall = Math.pow(1 - ald / aLensRad, 2);
            const alDeflection = alFall * aHr * 0.32 * wFinal;
            sx += (aldx / ald) * alDeflection;
            sy += (aldy / ald) * alDeflection;
          }
        }

        const size = a.size * (0.5 + az * 1.2) * glyphScale;
        const flick = 0.72 + 0.28 * Math.sin(t * 1.4 + a.ph * 3);
        const burstGlow = burstActive && bt >= BURST_SPIN_END
          ? (1 + explodeW * 1.5) * (1 - smoothstep(clamp01(revealT / 0.35)))
          : 1;
        const alpha =
          ambientBase[a.layer] *
          ambientMod *
          flick *
          (asm * 0.9 + 0.1) *
          (1 + dispVis * 0.35) *
          swallowed *
          burstGlow;
        if (alpha <= 0.012) continue;
        // The cloud now reaches past the edges — skip fully off-canvas motes.
        if (sx < -size * 3 || sx > w + size * 3 || sy < -size * 3 || sy > h + size * 3)
          continue;
        const ang = a.rot + s * a.rotSpeed * (1 - galFreeze);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = palette[a.color];
        ctx.beginPath();
        ctx.moveTo(sx + Math.cos(ang) * size, sy + Math.sin(ang) * size);
        for (let k = 1; k < 3; k++) {
          ctx.lineTo(
            sx + Math.cos(ang + aStep * k) * size,
            sy + Math.sin(ang + aStep * k) * size,
          );
        }
        ctx.closePath();
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // ---- Projection ------------------------------------------------
      const n = particles.length;
      const lastBoundary = dispI === C.length - 1;
      for (let i = 0; i < n; i++) {
        const p = particles[i];
        // The frag pulse is suppressed while the galaxy owns the scene — the
        // frozen galaxy's shards hold their exact size, never pulsing.
        const pulse = p.frag
          ? p.fragAmp *
            (0.5 + 0.5 * Math.sin(s * p.fragSpeed + p.fragPhase)) *
            asm *
            (1 - galFreeze)
          : 0;
        const wR = 1 + p.shellR * (1 - asm) + pulse;

        let wx = 0;
        let wy = 0;
        let wz = 0;
        if (dispStyle) {
          // Phase sequence: form A → dispersion → form B (or the void at the
          // footer boundary). Positions always interpolate — pieces travel,
          // they never vanish.
          const A = FORM_FNS[dispI](p, s, wR);
          const D = dispersionTarget(p, dispStyle, s);
          const Bform = lastBoundary ? D : FORM_FNS[dispI + 1](p, s, wR);
          const t = dispP < 0.58 ? t1 : t2;
          const from = dispP < 0.58 ? A : D;
          const to = dispP < 0.58 ? D : Bform;
          wx = from.x + (to.x - from.x) * t;
          wy = from.y + (to.y - from.y) * t;
          wz = from.z + (to.z - from.z) * t;
        } else {
          for (const f of ACTIVE) {
            const q = FORM_FNS[f.i](p, s, wR);
            wx += f.weight * q.x;
            wy += f.weight * q.y;
            wz += f.weight * q.z;
          }
        }

        // Overscroll climax — the blast throws every piece out to its
        // 3D explosion trajectory (position override, so the debris streams outward and
        // floods the entire viewport instead of trailing toward the middle).
        if (burstOn > 0.001) {
          const blast = burstPosition(p, s, explodeW);
          wx = blast.x;
          wy = blast.y;
          wz = blast.z;
        }

        // The gentle per-piece bob is suppressed while the galaxy owns the
        // scene — the frozen galaxy holds perfectly still.
        const drift = animated
          ? Math.sin(s * p.driftSpeed + p.driftPhase) * 0.035 * (1 - galFreeze)
          : 0;

        const px0 = wx * cy + wz * sy;
        let pz0 = -wx * sy + wz * cy;
        const pz02 = pz0 * cx + (wy + drift) * sx;
        const py0 = -pz0 * sx + (wy + drift) * cx;
        pz0 = pz02;

        const depth = burstOn > 0.001
          ? clamp01((pz0 + 35) / 70)
          : clamp01(
              clamp01(pz0) * wEarth + clamp01((pz0 + 1.7) / 2.7) * (1 - wEarth),
            );
        if (depth <= (burstOn > 0.001 ? 0.0001 : 0.005)) {
          viewZ[i] = -1;
          screenX[i] = 0;
          screenY[i] = 0;
          sizeA[i] = 0;
          alphaA[i] = 0;
          continue;
        }
        viewZ[i] = depth;

        const sizeS = burstOn > 0.001 ? Math.pow(depth, 0.45) : Math.pow(depth, 0.75);
        const baseSize = p.radius * sizeS * glyphScale * (p.land ? 1.12 : 0.7);

        // Foreground pieces swell — the depth effect and, much harder, the
        // dispersion's near pieces passing the camera.
        const swell =
          1 +
          depthFx * Math.max(0, depth - 0.7) * 2.6 +
          (dispStyle
            ? dispVis * dispStyle.swell * Math.max(0, depth - 0.55)
            : 0) +
          (burstOn > 0.001 ? burstOn * (0.8 + p.f1 * 1.5) : 0);
        sizeA[i] = burstOn > 0.001
          ? baseSize * swell * (p.big ? 2.4 : 1.4)
          : Math.min(baseSize * swell, unit * (dispStyle ? 0.62 : 0.34));
        const mag = 1 + depthFx * Math.max(0, depth - 0.9) * 1.3;
        screenX[i] = ox + px0 * unit * mag;
        screenY[i] = oy + py0 * unit * mag;

        // Gravitational Lensing — General Relativistic Light Bending around the Core:
        // Space-time curvature deflects light rays passing near the event horizon, bending them
        // into Einstein arcs around the shadow, with relativistic magnification near the photon ring.
        if (wFinal > 0.02) {
          const ldx = screenX[i] - ox;
          const ldy = screenY[i] - oy;
          const ld2 = ldx * ldx + ldy * ldy;
          const hr = unit * 0.26 * (1 + holeState.finalPower * 0.45);
          const lensRad = hr * 3.5;
          if (ld2 < lensRad * lensRad && ld2 > 1e-5) {
            const ld = Math.sqrt(ld2);
            // Relativistic space-time deflection (bending outward around the event horizon)
            const lFall = Math.pow(1 - ld / lensRad, 2);
            const lDeflection = lFall * hr * 0.36 * wFinal * (1 + holeState.finalPower * 0.25);
            screenX[i] += (ldx / ld) * lDeflection;
            screenY[i] += (ldy / ld) * lDeflection;

            // Far-Side Einstein Arc (light from behind the hole bent over/under the shadow)
            if (pz0 < 0.1) {
              const signY = ldy < 0 ? -1 : 1;
              const arcTargetY = oy + signY * Math.max(Math.abs(ldy), hr * 1.06);
              const arcK = clamp01(-pz0 * 1.8) * lFall * wFinal * 0.45;
              screenY[i] = screenY[i] * (1 - arcK) + arcTargetY * arcK;
            }
          }
        }

        // The main motes react to the cursor — a soft repulsion: pieces
        // within a radius of the pointer are pushed aside, scaled by depth
        // (near pieces move more, far ones barely). Fine pointers only, only
        // after the pointer has moved, and deliberately weaker than the
        // forms so the scroll story stays boss.
        if (fine && pointerMoved) {
          const dx = screenX[i] - ((repX + 0.5) * w);
          const dy = screenY[i] - ((repY + 0.5) * h);
          const rad = unit * 1.15;
          const d2 = dx * dx + dy * dy;
          if (d2 < rad * rad && d2 > 1e-6) {
            const d = Math.sqrt(d2);
            const fall = Math.pow(1 - d / rad, 2);
            const push = fall * unit * 0.22 * (0.35 + depth * 0.85);
            screenX[i] += (dx / d) * push;
            screenY[i] += (dy / d) * push;
          }
        }

        // Lighting follows the form — same palette, different treatment.
        // Mobile forms live behind translucent glass panels, so they need
        // their full brightness to read through it — no mobile dimming.
        const zAlpha =
          Math.pow(clamp01(pz0 * 1.7), 0.85) *
            (p.land ? 1 : 0.5) *
            wEarth +
          Math.pow(clamp01(0.16 + depth * 1.25), 0.9) *
            (p.land ? 1 : 0.72) *
            (1 - wEarth) *
            (w < 640 ? 0.85 : 1);
        const appear = clamp01((asm * 1.4 - p.asmPhase) / 0.4);
        let light = 1;
        if (wBrain > 0.05) light *= brainLight(p, depth, s);
        if (wWave > 0.05) light *= waveLight(p, s);
        if (wGalaxy > 0.05) light *= galaxyLight(p, depth, s);
        if (wSolar > 0.05) light *= solarLight(p, depth, s);
        if (wFinal > 0.05) {
          light *= finalLight(p, s);
          // Gravitational Lensing Magnification / Einstein Ring brightening
          const ldx = screenX[i] - ox;
          const ldy = screenY[i] - oy;
          const ld = Math.hypot(ldx, ldy);
          const hr = unit * 0.25 * (1 + holeState.finalPower * 0.45);
          if (ld < hr * 2.4) {
            const amp = 1 + 0.55 * Math.pow(clamp01(1 - ld / (hr * 2.4)), 1.5) * wFinal;
            light *= amp;
          }
          // Event Horizon Infalling Particle Swallowing:
          // Any particle inside or behind the shadow disc is swallowed into the pitch black abyss
          if (burstOn <= 0.001 && ld < hr * 0.95 && pz0 < 0.25) {
            const swallowFade = clamp01((ld - hr * 0.2) / (hr * 0.75));
            light *= swallowFade;
          }
        }
        const dispBoost = dispStyle ? 1 + (dispStyle.alpha - 1) * dispVis : 1;
        // The final handover (world → void) disperses into transparency over
        // the second half of its window instead of snapping off at the end.
        const tailFade = lastBoundary
          ? 1 - smoothstep(clamp01((dispP - 0.5) / 0.5))
          : 1;
        // Light theme boosts alpha, scaled by depth so near pieces pop while
        // far shards stay visibly dimmer — the depth contrast survives.
        const burstAlpha = burstOn > 0.001
          ? (0.75 + 0.25 * Math.sin(s * 8 + p.f1 * 20)) *
            (1 - smoothstep(clamp01(revealT / 0.2)))
          : 1;
        alphaA[i] = burstOn > 0.001
          ? burstAlpha * (0.65 + 0.35 * depth) * (lightMode ? 1.2 : 1)
          : zAlpha *
            appear *
            light *
            dispBoost *
            tailFade *
            (lightMode ? 1 + 0.32 * depth : 1);
      }

      // Twinkles — the occasional bright land mote (Earth form only).
      if (animated && wEarth > 0.5 && asm > 0.7) {
        for (const p of particles) p.glow *= GLOW_DECAY;
        if (Math.random() < TWINKLE_RATE) {
          for (let t = 0; t < 6; t++) {
            const idx = Math.floor(Math.random() * n);
            if (particles[idx].land) {
              particles[idx].glow = 1;
              break;
            }
          }
        }
      }

      // Paint back-to-front, batched into layer × colour × alpha-bucket
      // Path2D strokes — a bounded handful of draw calls per frame. The
      // black hole's matter condenses into small spheres: as the final
      // form takes over, pieces progressively swap their triangle glyph
      // for a filled circle (each flips at its own f1 threshold, so the
      // morph is gradual, never a hard pop), and the accretion disc reads
      // as orbiting matter rather than shards.
      const BUCKETS = 4;
      const circleMix = clamp01((wFinal - 0.35) / 0.45);
      const galaxyMix = clamp01((wGalaxy - 0.35) / 0.45);
      const solarMix = clamp01((wSolar - 0.25) / 0.45);
      const brainMix = clamp01((wBrain - 0.25) / 0.45);
      const triGroups = new Map<number, Path2D>();
      const circGroups = new Map<number, Path2D>();
      const step = (Math.PI * 2) / 3;

      for (let i = 0; i < n; i++) {
        if (viewZ[i] < 0 || alphaA[i] <= 0.01) continue;
        const p = particles[i];
        const layer = depthLayer(viewZ[i]);
        const bucket = Math.min(BUCKETS - 1, Math.floor(alphaA[i] * BUCKETS));
        // Celestial & neural bodies (Sun, planets, neural synapses, star clusters)
        // render as glowing spheres; asteroid belts, orbit tracks, and axon folds as shards.
        const isCircle =
          p.f1 < circleMix ||
          (p.f1 < galaxyMix && galaxySphere(p)) ||
          (p.f1 < solarMix && solarSphere(p)) ||
          (wBrain > 0.08 && brainSphere(p));
        const useHoleColor = (isCircle && wFinal > 0.05) || burstOn > 0.05;
        const useGalaxyColor = p.f1 < galaxyMix && wGalaxy > 0.05;
        const useSolarColor = p.f1 < solarMix && wSolar > 0.05;
        const useBrainColor = wBrain > 0.08;
        const colorIdx = useHoleColor
          ? colorCount + holeColor(p)
          : useGalaxyColor
            ? colorCount + HOLE_DARK.length + galaxyColor(p)
            : useSolarColor
              ? colorCount + HOLE_DARK.length + GALAXY_DARK.length + solarColor(p)
              : useBrainColor
                ? colorCount +
                  HOLE_DARK.length +
                  GALAXY_DARK.length +
                  SOLAR_DARK.length +
                  brainColor(p)
                : earthTone
                  ? p.earthColor
                  : p.color;
        const key = (layer * maxTone + colorIdx) * BUCKETS + bucket;
        const groups = isCircle ? circGroups : triGroups;
        let path = groups.get(key);
        if (!path) {
          path = new Path2D();
          groups.set(key, path);
        }
        const size = sizeA[i];
        if (isCircle) {
          // A sphere silhouette — radius sized to match the triangle's
          // visual weight, started on its own subpath so the arc fills as
          // a clean disc.
          const r = size * 0.72;
          path.moveTo(screenX[i] + r, screenY[i]);
          path.arc(screenX[i], screenY[i], r, 0, Math.PI * 2);
        } else {
          const a =
            p.rot +
            (animated
              ? Math.sin(s * p.rotSpeed + p.driftPhase) * 0.18 * (1 - galFreeze)
              : 0);
          path.moveTo(screenX[i] + Math.cos(a) * size, screenY[i] + Math.sin(a) * size);
          for (let k = 1; k < 3; k++) {
            path.lineTo(
              screenX[i] + Math.cos(a + step * k) * size,
              screenY[i] + Math.sin(a + step * k) * size,
            );
          }
          path.closePath();
        }
      }

      ctx.lineWidth = strokeW;
      for (let layer = 0; layer < DEPTH_LAYERS; layer++) {
        for (let color = 0; color < toneCount; color++) {
          for (let bucket = 0; bucket < BUCKETS; bucket++) {
            const key = (layer * maxTone + color) * BUCKETS + bucket;
            const tp = triGroups.get(key);
            if (tp) {
              ctx.globalAlpha = (bucket + 0.5) / BUCKETS;
              ctx.strokeStyle = colorStyle(color);
              ctx.stroke(tp);
            }
            const cp = circGroups.get(key);
            if (cp) {
              // Filled spheres read darker than 1px strokes — lift them a
              // little so the disc stays luminous.
              ctx.globalAlpha = Math.min(1, ((bucket + 0.5) / BUCKETS) * 1.35);
              ctx.fillStyle = colorStyle(color);
              ctx.fill(cp);
            }
          }
        }
      }

      const glowRgb = glowRgbRef.current;

      // Black hole — the closing form's event horizon (drawn after the
      // pieces so the dark disc occludes motes orbiting behind it), then
      // the white-hot detonation flash and shockwave system as it blows.
      const holeAlpha = Math.min(
        1,
        clamp01((wFinal - 0.12) / 0.32) * (w < 640 ? 0.95 : 1) *
          (1 + holeState.finalPower * 0.15) *
          Math.max(0, 1 - explodeW * 3.5), // dissolves instantly upon detonation
      );
      drawBlackHole(ctx, {
        x: ox,
        y: oy,
        unit,
        alpha: holeAlpha,
        power: holeState.finalPower,
        spin: holeState.finalSpin,
        s,
        light: lightMode,
      });
      if (burstActive && explodeW > 0.001 && explodeW < 0.98) {
        drawDetonationFlash(ctx, {
          x: ox,
          y: oy,
          w,
          h,
          unit,
          explodeW,
          light: lightMode,
        });
      }

      // Atmosphere — the globe's rim, present only while the Earth owns the
      // scene.
      const atmoAlpha =
        clamp01((asm - 0.72) / 0.28) * wEarth * (w < 640 ? 0.6 : 1);
      drawEarthAtmosphere(ctx, {
        x: ox,
        y: oy,
        unit,
        alpha: atmoAlpha,
        light: lightMode,
        glowRgb,
      });

      // Galaxy — radiant volumetric core and blue-white galactic disc glow
      const galaxyGlowAlpha = clamp01((wGalaxy - 0.1) / 0.5) * (w < 640 ? 0.75 : 1);
      if (galaxyGlowAlpha > 0.01) {
        drawGalaxyCoreGlow(ctx, {
          x: ox,
          y: oy,
          unit,
          alpha: galaxyGlowAlpha,
          s,
          light: lightMode,
        });
      }

      // Brain — electric cyan & royal violet neural synapse radiance
      const brainGlowAlpha = clamp01((wBrain - 0.1) / 0.5) * (w < 640 ? 0.75 : 1);
      if (brainGlowAlpha > 0.01) {
        drawBrainSynapseGlow(ctx, {
          x: ox,
          y: oy,
          unit,
          alpha: brainGlowAlpha,
          s,
          light: lightMode,
        });
      }

      // Solar — incandescent golden-white solar corona and starlight radiance
      const solarCoronaAlpha = clamp01((wSolar - 0.1) / 0.5) * (w < 640 ? 0.75 : 1);
      if (solarCoronaAlpha > 0.01) {
        drawSunCorona(ctx, {
          x: ox,
          y: oy,
          unit,
          alpha: solarCoronaAlpha,
          s,
          light: lightMode,
        });
      }

      // Twinkle halos — additive, so they read as light on land.
      const glowPath = new Path2D();
      const haloPath = new Path2D();
      for (let i = 0; i < n; i++) {
        const p = particles[i];
        if (p.glow < 0.04 || !p.land || viewZ[i] < 0) continue;
        const base = sizeA[i] * 1.4;
        const a = p.rot;
        for (const target of [haloPath, glowPath]) {
          const size = base * (target === glowPath ? 1.15 : 2.2);
          target.moveTo(screenX[i] + Math.cos(a) * size, screenY[i] + Math.sin(a) * size);
          for (let k = 1; k < 3; k++) {
            target.lineTo(
              screenX[i] + Math.cos(a + step * k) * size,
              screenY[i] + Math.sin(a + step * k) * size,
            );
          }
          target.closePath();
        }
      }

      // Form light — near pieces of the galaxy, solar and final form catch
      // the glow additively, so the depth feels lit rather than flat.
      const fragGlow = new Path2D();
      if (wGalaxy + wSolar + wFinal > 0.25) {
        for (let i = 0; i < n; i++) {
          const p = particles[i];
          if (viewZ[i] < 0.8 || viewZ[i] < 0 || alphaA[i] <= 0.01) continue;
          // Filled spheres already read as lit matter — no glow silhouette.
          if (p.f1 < circleMix || (p.f1 < galaxyMix && galaxySphere(p))) continue;
          const size = sizeA[i] * 1.45;
          const a = p.rot;
          fragGlow.moveTo(screenX[i] + Math.cos(a) * size, screenY[i] + Math.sin(a) * size);
          for (let k = 1; k < 3; k++) {
            fragGlow.lineTo(
              screenX[i] + Math.cos(a + step * k) * size,
              screenY[i] + Math.sin(a + step * k) * size,
            );
          }
          fragGlow.closePath();
        }
      }

      // Twinkle halos + form light — additive on dark, plain on light so
      // they stay visible over a pale background.
      ctx.globalCompositeOperation = lightMode ? "source-over" : "lighter";
      // The galaxy's disc glows cool blue-white (young stars), not violet.
      ctx.strokeStyle = `rgb(${wGalaxy > 0.35 ? GALAXY_GLOW_RGB : glowRgb})`;
      ctx.lineWidth = lightMode ? 1.2 : 1;
      ctx.globalAlpha = lightMode ? 0.7 : 0.85;
      ctx.stroke(glowPath);
      ctx.globalAlpha = lightMode ? 0.18 : 0.2;
      ctx.stroke(haloPath);
      ctx.globalAlpha = lightMode ? 0.28 : 0.3;
      ctx.stroke(fragGlow);

      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    };
    renderRef.current = render;

    const ro = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        rebuild();
        render(0, false);
      }, 140);
    });
    ro.observe(canvas);

    rebuild();
    raf = requestAnimationFrame((t) => {
      last = t;
      const loop = (t2: number) => {
        tSec += (t2 - last) / 1000;
        last = t2;
        if (tabVisible) render(tSec * 1000, true);
        raf = requestAnimationFrame(loop);
      };
      loop(t);
    });

    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        rebuild();
      }, 160);
    };
    window.addEventListener("resize", onResize);

    const onVis = () => {
      tabVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVis);

    const onPointer = (e: PointerEvent) => {
      targetX = e.clientX / window.innerWidth - 0.5;
      targetY = e.clientY / window.innerHeight - 0.5;
      pointerMoved = true;
    };
    if (fine) window.addEventListener("pointermove", onPointer);

    // Late-loaded content (project screenshots, notebook) can shift section
    // heights after mount — re-measure once everything has settled.
    const onLoad = () => {
      rebuild();
      render(0, false);
    };
    window.addEventListener("load", onLoad);

    // Overscroll climax trigger — the user keeps scrolling (wheel or touch)
    // past the bottom of the page. Lenis consumes the wheel input and
    // scrollY clamps at the limit, so the *input* itself is accumulated as
    // a virtual overscroll distance; once it passes the threshold the hole
    // spins up, detonates across the screen, blacks out for a second, and
    // rides back to the top.
    let overscroll = 0;
    const triggerBurst = () => {
      if (holeState.burstStartMs >= 0) return;
      // Only while the black hole owns the scene at the bottom.
      if (holeState.finalPower < 0.55) return;
      overscroll = 0;
      holeState.burstStartMs = performance.now();
      holeState.burstScrollSent = false;
      holeState.rideDoneMs = -1;
    };
    const onWheel = (e: WheelEvent) => {
      // Pinch-zoom gestures carry ctrlKey — never treat them as overscroll.
      if (e.ctrlKey) return;
      if (holeState.burstStartMs >= 0) return; // let the sequence play out untouched
      const atBottom = window.scrollY >= maxScroll - 60;
      if (e.deltaY > 0 && atBottom) {
        overscroll += e.deltaY;
        if (overscroll >= OVERSHOOT_WHEEL_PX) triggerBurst();
      } else if (e.deltaY <= 0) {
        overscroll = Math.max(0, overscroll - 80); // ease off scrolling up
      } else {
        overscroll = 0;
      }
    };
    window.addEventListener("wheel", onWheel, { passive: true });

    let touchLastY = 0;
    let touchDown = false;
    const onTouchStart = (e: TouchEvent) => {
      touchDown = true;
      touchLastY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!touchDown || holeState.burstStartMs >= 0) return;
      const y2 = e.touches[0]?.clientY ?? touchLastY;
      const dy = touchLastY - y2; // > 0 = scrolling down
      touchLastY = y2;
      const atBottom = window.scrollY >= maxScroll - 60;
      if (dy > 0 && atBottom) {
        overscroll += dy;
        if (overscroll >= OVERSHOOT_TOUCH_PX) triggerBurst();
      } else if (dy < 0) {
        overscroll = Math.max(0, overscroll + dy);
      } else {
        overscroll = 0;
      }
    };
    const onTouchEnd = () => {
      touchDown = false;
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
      if (fine) window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("load", onLoad);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.clearTimeout(resizeTimer);
      if (blackoutEl) blackoutEl.style.opacity = "0";
      if (hintEl) hintEl.style.opacity = "0";
      renderRef.current = null;
    };
  }, [reduce]);

  if (reduce) return null;

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      />
      {/* Full-screen blackout for the overscroll climax — covers the whole
          page (content included) while the ride back to the top plays. */}
      <div
        ref={blackoutRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[9999] bg-black"
        style={{ opacity: 0 }}
      />
      {/* "Keep scrolling" hint — appears once the black hole owns the scene
          so the user knows the overscroll climax is ready to trigger. */}
      <div
        ref={hintRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 bottom-8 z-40 flex justify-center"
        style={{ opacity: 0 }}
      >
        <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          keep scrolling
          <ChevronDown className="size-3.5 animate-bounce text-signal" />
        </span>
      </div>
    </>
  );
}
