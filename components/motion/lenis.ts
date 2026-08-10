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
 */
export function scrollToId(id: string, offset = -64) {
  if (lenis) {
    lenis.scrollTo(`#${id}`, { offset, duration: 1.2 });
    return;
  }
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
}
