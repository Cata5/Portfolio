"use client";

import type Lenis from "lenis";

import { prefersReducedMotion } from "@/lib/motion";

let lenis: Lenis | null = null;

export function setLenis(instance: Lenis | null) {
  lenis = instance;
}

export function getLenis() {
  return lenis;
}

/**
 * Smooth-scroll to a section id. Uses Lenis when it is active; falls back to
 * native behaviour otherwise (reduced motion, no JS, older browsers).
 *
 * No offset is added here on purpose: Lenis (and the native fallback) already
 * honour the target's `scroll-mt`, so adding one would double-count it and
 * land every anchor a header-height too early.
 */
export function scrollToId(id: string, offset = 0) {
  if (id === "top" || id === "home" || !id) {
    if (lenis) {
      lenis.scrollTo(0, { duration: 1.2 });
      return;
    }
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    return;
  }

  if (lenis) {
    lenis.scrollTo(`#${id}`, { offset, duration: 1.2 });
    return;
  }
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
}
