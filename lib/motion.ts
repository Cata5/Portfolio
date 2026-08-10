"use client";

import { useEffect, useLayoutEffect, useState } from "react";

/**
 * Layout effect that safely no-ops during server rendering — lets GSAP set
 * initial states before first paint without React's SSR warning.
 */
export const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/** True when the user prefers reduced motion (SSR-safe, non-reactive). */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * True on devices with a precise pointer — gates magnetic/cursor behaviour.
 * Cached: the capability never changes mid-session.
 */
let finePointer: boolean | null = null;
export function hasFinePointer(): boolean {
  if (typeof window === "undefined") return false;
  if (finePointer === null) {
    finePointer = window.matchMedia("(pointer: fine)").matches;
  }
  return finePointer;
}

/** Reactive reduced-motion flag (mirrors motion/react's hook). */
export function useReducedMotion() {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduce(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return reduce;
}

/**
 * The site's motion language — one small set of easings, not a random one per
 * animation. Cinematic for reveals, none for scroll-driven scrub.
 */
export const EASE = {
  /** Default entrance — fast settle, editorial. */
  out: "power3.out",
  /** Big cinematic reveals (hero type, section pin transitions). */
  outStrong: "power4.out",
  /** Heavyweight masks and lines — dramatic, slow tail. */
  outExpo: "expo.out",
  /** UI micro-interactions. */
  inOut: "power2.inOut",
  /** Scroll-scrubbed timelines. */
  none: "none",
} as const;
