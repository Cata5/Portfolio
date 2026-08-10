"use client";

import { useRef } from "react";

import { ArrowDown, ArrowUpRight } from "lucide-react";

import { Container } from "@/components/container";
import { CurrentYear } from "@/components/current-year";
import { HeroScrollIndicator } from "@/components/hero/hero-scroll-indicator";
import { HeroTypography } from "@/components/hero/hero-typography";
import { HeroVisual } from "@/components/hero/hero-visual";
import { WorkspacePanel } from "@/components/hero/workspace-panel";
import { gsap, ScrollTrigger } from "@/components/motion/gsap";
import { Magnetic } from "@/components/motion/magnetic";
import { Button } from "@/components/ui/button";
import { site } from "@/data/site";
import { EASE, prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";

/**
 * The hero — a digital poster, not a centered greeting. Four depth layers:
 *
 *   background   faint technical grid
 *   midground    the neural network (right of center, behind the type)
 *   text         giant SOFTWARE / DEVELOPER lines
 *   foreground   the floating "currently building" card + edge labels
 *
 * Entrance: grid → network → eyebrow → headline lines rise through their
 * masks → tagline/CTAs → card → labels → scroll cue.
 *
 * Scroll: every layer moves at its own speed (scrubbed) — grid slowest,
 * headline medium, card fastest — so the hero feels like it opens up into
 * the portfolio rather than sliding away as one block.
 */
export function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  // Scroll progress fed into the Earth so it enlarges and dissolves in
  // lockstep with the hero's exit.
  const visualRef = useRef<{ current: number }>({ current: 0 });

  useIsomorphicLayoutEffect(() => {
    const el = rootRef.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      // ---- Entrance -------------------------------------------------
      const tl = gsap.timeline({ defaults: { ease: EASE.out } });

      tl.fromTo(
        ".hero-grid",
        { opacity: 0 },
        { opacity: 1, duration: 1.4, ease: "power2.out" },
        0,
      )
        .fromTo(
          ".hero-visual",
          { opacity: 0, scale: 1.06 },
          { opacity: 1, scale: 1, duration: 1.8, ease: "power2.out" },
          0.05,
        )
        .fromTo(
          ".hero-eyebrow-inner",
          { yPercent: 130 },
          { yPercent: 0, duration: 0.9, ease: EASE.outStrong },
          0.3,
        )
        .fromTo(
          ".hero-line",
          { yPercent: 115 },
          { yPercent: 0, duration: 1.15, ease: EASE.outStrong, stagger: 0.12 },
          0.42,
        )
        .fromTo(
          ".hero-tagline",
          { y: 22, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8 },
          0.8,
        )
        .fromTo(
          ".hero-ctas",
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8 },
          0.95,
        )
        .fromTo(
          ".hero-workspace",
          { y: 26, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.9 },
          1.1,
        )
        .fromTo(
          ".hero-label, .hero-side-label",
          { opacity: 0 },
          { opacity: 1, duration: 0.8, stagger: 0.08 },
          1.25,
        )
        .fromTo(
          ".hero-scroll-hint",
          { opacity: 0 },
          { opacity: 1, duration: 0.8 },
          1.4,
        );

      // ---- Scroll choreography (per-layer speeds) -------------------
      const st = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "bottom top",
          scrub: 0.6,
        },
      });

      // The Earth's own internal enlargement/dissolve is driven by the ref
      // below, so the wrapper only leans and fades — no double-growth.
      st.to(".hero-grid", { opacity: 0, yPercent: 6, ease: "none" }, 0)
        .to(".hero-visual", { scale: 1.08, yPercent: -10, ease: "none" }, 0)
        .to(".hero-visual", { opacity: 0, ease: "none" }, 0.72)
        .to(".hero-title", { yPercent: -16, ease: "none" }, 0)
        .to(".hero-scroll-hint", { opacity: 0, ease: "none" }, 0.02)
        .to(
          ".hero-label, .hero-side-label",
          { opacity: 0, ease: "none" },
          0.2,
        )
        .to(".hero-tagline", { opacity: 0, y: -28, ease: "none" }, 0.3)
        .to(".hero-ctas", { opacity: 0, y: -28, ease: "none" }, 0.35)
        .to(
          ".hero-workspace",
          { yPercent: -40, opacity: 0, ease: "none" },
          0.25,
        )
        .to(".hero-content", { opacity: 0, yPercent: -4, ease: "none" }, 0.55);

      // Feed scroll progress into the Earth (scrub-like smoothing is applied
      // inside the canvas). Collected by ctx.revert() on cleanup.
      ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "bottom top",
        onUpdate: (self) => {
          visualRef.current.current = self.progress;
        },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="top"
      ref={rootRef}
      className="relative min-h-[100svh] overflow-hidden"
    >
      {/* Background — faint technical grid, masked to fade at the edges */}
      <div
        className="hero-grid pointer-events-none absolute inset-0"
        aria-hidden="true"
      />

      {/* Midground — the triangular Earth, right of center behind the type.
          Dimming stays on the outer frame (Tailwind classes survive); the
          entrance tween animates only the inner wrapper. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-full opacity-50 sm:w-[72%] sm:opacity-70 md:w-[54%] md:opacity-90">
        <HeroVisual className="hero-visual h-full w-full" progressRef={visualRef} />
      </div>

      {/* Text + content — centered in the free space; the scroll cue sits
          at the very bottom of the viewport-height column. */}
      <Container className="hero-content relative z-10 flex min-h-[100svh] flex-col py-24 md:py-28">
        <div className="flex flex-1 flex-col justify-center">
          <HeroTypography />
          <p className="hero-tagline mt-10 max-w-md text-lg font-extralight leading-relaxed text-muted-foreground md:text-xl">
            {site.tagline}
          </p>
          <div className="hero-ctas mt-12 flex flex-wrap items-center gap-8">
          <Magnetic>
            <Button nativeButton={false} render={<a href="#work" />}>
              View work
              <ArrowDown className="size-4 transition-transform duration-200 group-hover/button:translate-y-0.5" />
            </Button>
          </Magnetic>
          <Magnetic strength={0.2}>
            <a
              href={site.github}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.03em] text-muted-foreground transition-colors hover:text-foreground"
            >
              GitHub
              <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </Magnetic>
          </div>
        </div>

        {/* Scroll cue hugs the bottom of the viewport-height column */}
        <HeroScrollIndicator className="pt-20 md:pt-24" />
      </Container>

      {/* Foreground — floating card (in flow on mobile, overlapping on desktop) */}
      <div className="relative z-20 mt-4 px-5 pb-12 sm:px-8 lg:absolute lg:bottom-28 lg:right-[3vw] lg:mt-0 lg:px-0 lg:pb-0">
        <Magnetic strength={0.08}>
          <WorkspacePanel />
        </Magnetic>
      </div>

      {/* Edge labels */}
      <div className="hero-label absolute right-5 top-20 z-30 hidden font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground md:block">
        portfolio — v2 / <CurrentYear />
      </div>
      <a
        href={site.github}
        target="_blank"
        rel="noreferrer"
        className="hero-side-label absolute left-5 top-1/2 z-30 hidden -translate-y-1/2 items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground lg:flex"
        style={{ writingMode: "vertical-rl" }}
      >
        github — cata5
      </a>
    </section>
  );
}
