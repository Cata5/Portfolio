"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

import { gsap, ScrollTrigger } from "@/components/motion/gsap";
import { setLenis, scrollToId } from "@/components/motion/lenis";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Wires Lenis (smooth wheel scrolling) into GSAP's ticker so ScrollTrigger
 * and scrub timelines stay perfectly in sync with the smoothed scroll.
 * Also handles cross-page hash navigation (e.g. jumping from /projects/vortex to /#stack).
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.2,
    });
    lenisRef.current = lenis;
    setLenis(lenis);

    // Keep ScrollTrigger in lockstep with Lenis' smoothed scroll position.
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Anchor links — route through Lenis for a buttery, offset-aware jump.
    const onAnchorClick = (e: MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
        return;
      }
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.<HTMLAnchorElement>('a[href*="#"]');
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href) return;

      const hashIndex = href.indexOf("#");
      if (hashIndex === -1) return;
      const hash = href.slice(hashIndex);
      if (hash === "#") return;

      const el = document.querySelector(hash);
      if (el) {
        e.preventDefault();
        lenis.scrollTo(el as HTMLElement, { offset: 0, duration: 1.2 });
      }
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
      lenisRef.current = null;
    };
  }, []);



  // Handle cross-page and dynamic hash navigation (e.g. landing from another route on /#stack)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const timers: number[] = [];

    const handleHashScroll = () => {
      const hash = window.location.hash;
      if (!hash || hash === "#") return;
      const sectionId = hash.replace(/^#/, "");

      const attemptScroll = (attempts = 0) => {
        const el = document.getElementById(sectionId);
        if (el) {
          scrollToId(sectionId);
        } else if (attempts < 10) {
          const t = window.setTimeout(() => attemptScroll(attempts + 1), 80);
          timers.push(t);
        }
      };

      const initialT = window.setTimeout(() => attemptScroll(), 100);
      timers.push(initialT);
    };

    window.addEventListener("hashchange", handleHashScroll);
    if (window.location.hash) {
      handleHashScroll();
    }

    return () => {
      window.removeEventListener("hashchange", handleHashScroll);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [pathname]);

  return <>{children}</>;
}

export { getLenis } from "@/components/motion/lenis";
