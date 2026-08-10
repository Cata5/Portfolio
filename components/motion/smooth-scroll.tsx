"use client";

import { useEffect, type ReactNode } from "react";

import Lenis from "lenis";

import { gsap, ScrollTrigger } from "@/components/motion/gsap";
import { setLenis } from "@/components/motion/lenis";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Wires Lenis (smooth wheel scrolling) into GSAP's ticker so ScrollTrigger
 * and scrub timelines stay perfectly in sync with the smoothed scroll.
 *
 * - Skipped entirely for reduced-motion users — native scroll wins.
 * - Anchor links (`href="#…"`) are intercepted and eased through Lenis so the
 *   sticky header offset is applied and mobile never fights the browser.
 * - ScrollTrigger.refresh() runs once fonts/images have settled so pinned
 *   measurements are correct.
 * - Back/forward navigation jumps straight to the restored position.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.2,
    });
    setLenis(lenis);

    // Keep ScrollTrigger in lockstep with Lenis' smoothed scroll position.
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Anchor links — route through Lenis for a buttery, offset-aware jump.
    // Modifier clicks (new tab / new window) always fall through to native.
    const onAnchorClick = (e: MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
        return;
      }
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.<HTMLAnchorElement>('a[href^="#"]');
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;
      const el = document.querySelector(href);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el as HTMLElement, { offset: -64, duration: 1.2 });
    };
    document.addEventListener("click", onAnchorClick);

    // Re-measure pinned sections once the page settles (fonts, images).
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    const settleTimer = window.setTimeout(refresh, 300);
    document.fonts?.ready.then(refresh).catch(() => {});

    // Back/forward navigation — jump straight to the restored position.
    const onPopState = () => lenis.scrollTo(0, { immediate: true });
    window.addEventListener("popstate", onPopState);

    return () => {
      document.removeEventListener("click", onAnchorClick);
      window.removeEventListener("load", refresh);
      window.clearTimeout(settleTimer);
      window.removeEventListener("popstate", onPopState);
      gsap.ticker.remove(tick);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  return <>{children}</>;
}

export { getLenis } from "@/components/motion/lenis";
