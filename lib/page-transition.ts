"use client";

import { gsap } from "@/components/motion/gsap";
import { prefersReducedMotion } from "@/lib/motion";

const OVERLAY_ATTR = "data-pt-overlay";

/**
 * Shared visual transition between a project card and its detail page:
 *
 *   card thumbnail ──expands──▶ fills viewport ──fades──▶ page appears
 *
 * An imperatively-built fixed overlay (with the card's image inside) grows
 * from the clicked card's rect to cover the viewport, then the router
 * navigates beneath it. The target page's <PageReveal> calls
 * finishProjectTransition() to fade it away.
 *
 * Fully defensive: no overlay for reduced motion, and a safety timeout
 * removes it even if navigation is interrupted.
 */
export function beginProjectTransition(rect: DOMRect, src: string) {
  if (prefersReducedMotion()) return;

  const wrapper = document.createElement("div");
  wrapper.setAttribute(OVERLAY_ATTR, "");
  wrapper.setAttribute("aria-hidden", "true");
  wrapper.style.cssText = [
    "position:fixed",
    `top:${rect.top}px`,
    `left:${rect.left}px`,
    `width:${Math.max(rect.width, 1)}px`,
    `height:${Math.max(rect.height, 1)}px`,
    "z-index:150",
    "transform-origin:top left",
    "overflow:hidden",
    "pointer-events:auto",
    "background:var(--background)",
  ].join(";");

  const img = document.createElement("img");
  img.src = src;
  img.alt = "";
  img.decoding = "async";
  img.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;";
  wrapper.appendChild(img);
  document.body.appendChild(wrapper);

  const scaleX = window.innerWidth / Math.max(rect.width, 1);
  const scaleY = window.innerHeight / Math.max(rect.height, 1);

  gsap.to(wrapper, {
    scaleX,
    scaleY,
    x: -rect.left,
    y: -rect.top,
    duration: 0.65,
    ease: "power4.inOut",
    onComplete: () => {
      wrapper.style.pointerEvents = "none";
    },
  });

  // Safety: never leave a stuck overlay on screen.
  window.setTimeout(() => {
    if (wrapper.isConnected) wrapper.remove();
  }, 4000);
}

/** Fade the covering overlay out — called by the new page once it has painted. */
export function finishProjectTransition() {
  const overlay = document.querySelector<HTMLElement>(`[${OVERLAY_ATTR}]`);
  if (!overlay) return;
  gsap.to(overlay, {
    opacity: 0,
    duration: 0.5,
    delay: 0.15,
    ease: "power2.out",
    onComplete: () => overlay.remove(),
  });
}
